const fs = require("fs");
const path = require("path");
const { requestUrl } = (() => { try { return require("obsidian"); } catch (_) { return {}; } })();
const http = require("http");
const https = require("https");

// Downloads are deliberately conservative.  A platform can return an
// unbounded stream (or omit Content-Length), so limits are enforced while
// bytes are being written instead of relying only on response headers.
const DEFAULT_TIMEOUT_MS = 120000;
const MAX_REDIRECTS = 5;
// A requestUrl/fetch response can be aborted by the outer cancellable wrapper
// while writeResponseBody is blocked in reader.read(). Keep the writer's
// teardown callback associated with the response so abortResponse can await
// the same reader/output cleanup rather than racing the .part unlink.
const RESPONSE_CANCELS = new WeakMap();

const MEDIA_STATUSES = Object.freeze(["queued", "resolving", "downloading", "merging", "completed", "failed", "expired", "forbidden", "unsupported", "skipped_budget", "cancelled"]);

class MediaService {
  constructor({ vault, stateStore, root = "", log, notify, ffmpegPath = "", adapters = {}, maxFileBytes = 2 * 1024 * 1024 * 1024, runBudgetBytes = 5 * 1024 * 1024 * 1024, accountBudgetBytes = 50 * 1024 * 1024 * 1024, timeoutMs = 120000 } = {}) {
    this.vault = vault;
    this.stateStore = stateStore;
    this.root = root;
    this.log = log || (() => {});
    this.notify = notify || (() => {});
    this.ffmpegPath = ffmpegPath || "";
    this.adapters = adapters || {};
    this.maxFileBytes = maxFileBytes;
    this.runBudgetBytes = runBudgetBytes;
    this.accountBudgetBytes = accountBudgetBytes;
    this.timeoutMs = timeoutMs;
    this.runBytes = 0;
    this.cancelled = false;
    this.activeCancels = new Set();
    // The coordinator normally awaits each media task, but commands and
    // adapter callbacks can enqueue different resources concurrently. A
    // single FIFO writer is required for strict run/account budgets and to
    // prevent two tasks from racing on the same filesystem volume.
    this.downloadQueue = Promise.resolve();
    this.activeTasks = new Map();
  }
  resetRunBudget() { this.runBytes = 0; this.cancelled = false; }
  cancel() {
    this.cancelled = true;
    const pending = [];
    for (const cancel of this.activeCancels) {
      try { pending.push(Promise.resolve(cancel?.()).catch(() => {})); } catch (_) {}
    }
    this.activeCancels.clear();
    return Promise.allSettled(pending);
  }
  taskKey(item, media) { return `${item.platform}:${item.accountId}:${item.sourceId}:${media.id}`; }
  mediaFolder(item) { return path.posix.join(this.root || "", platformFolder(item.platform), accountFolder(item), "媒体（Media）", safeFolder(item.sourceId)); }
  scheduleDownload(item, media, task, skipActive = false) {
    const key = task.key;
    const active = this.activeTasks.get(key);
    if (active && !skipActive) return active;
    const scheduled = this.downloadQueue.catch(() => {}).then(() => this.download(item, media, task));
    this.downloadQueue = scheduled.catch(() => {});
    this.activeTasks.set(key, scheduled);
    scheduled.then(() => {
      if (this.activeTasks.get(key) === scheduled) this.activeTasks.delete(key);
    }, () => {
      if (this.activeTasks.get(key) === scheduled) this.activeTasks.delete(key);
    });
    return scheduled;
  }
  async enqueue(item, media, options = {}) {
    const key = this.taskKey(item, media);
    const active = this.activeTasks.get(key);
    if (active) return active;
    const run = (async () => {
      const existing = this.stateStore?.get?.()?.mediaTasks?.[key];
      if (existing?.status === "completed" && existing.localPath) {
        // A task can outlive a manually deleted Vault media file. Do not treat
        // stale state as success; a later sync or explicit retry should restore
        // the missing file.
        try {
          const absolute = this.absolutePath(existing.localPath);
          await this.verifyRealVaultPath(absolute);
          const stat = await fs.promises.stat(absolute);
          if (stat.isFile() && stat.size > 0) return existing;
        } catch (_) { /* missing or inaccessible file: re-download below */ }
      }
      const task = { key, platform: item.platform, accountId: item.accountId, sourceId: item.sourceId, sourceUrl: item.sourceUrl || "", mediaId: media.id, media: { ...media }, item: { platform: item.platform, accountId: item.accountId, accountName: item.accountName, sourceId: item.sourceId, sourceUrl: item.sourceUrl, title: item.title, rawMeta: item.rawMeta, media: item.media }, status: "queued", attempts: existing?.attempts || 0, localPath: existing?.localPath || "", ...options };
      await this.stateStore?.setMediaTask(key, task);
      if (["failed", "forbidden", "expired", "unsupported", "cancelled"].includes(String(media.status || ""))) {
        const status = String(media.status);
        return this.updateTask(task, status, { error: sanitizeError(media.error || "媒体地址解析失败") });
      }
      // Keep queue progress alive after a failed task. The task itself
      // records the failure; subsequent resources must still be attempted.
      return this.scheduleDownload(item, media, task, true);
    })();
    this.activeTasks.set(key, run);
    try { return await run; }
    finally { if (this.activeTasks.get(key) === run) this.activeTasks.delete(key); }
  }
  async updateTask(task, status, patch = {}) { const next = { ...task, status, ...patch }; await this.stateStore?.setMediaTask(next.key, next); return next; }
  async download(item, media, task) {
    const update = async (status, patch = {}) => { task = { ...task, status, ...patch }; await this.stateStore?.setMediaTask(task.key, task); return task; };
    let absolute = "";
    let videoStage = "";
    let audio = "";
    let merged = "";
    let finalCommitted = false;
    let relative = "";
    let downloadedBytes = 0;
    let pathVerified = false;
    try {
      if (this.cancelled) return update("cancelled", { error: "媒体任务已停止" });
      if (media?.kind !== "image" && media?.kind !== "video") return update("unsupported", { error: "不支持的媒体类型" });
      if (!media?.url || !/^https?:/i.test(media.url)) return update("unsupported", { error: "媒体地址不可用" });
      const accountBytes = await this.completedAccountBytes(item.platform, item.accountId, task.key);
      if (this.runBytes >= this.runBudgetBytes || accountBytes >= this.accountBudgetBytes) return update("skipped_budget", { error: "已达到本次运行或账号媒体预算" });
      await update("downloading", { attempts: (task.attempts || 0) + 1 });
      const folder = this.mediaFolder(item);
      await this.ensureFolder(folder);
      const ext = extensionFor(media.url, media.kind);
      const base = safeFolder(media.title || media.id || "media");
      relative = path.posix.join(folder, `${String(media.partIndex || 1).padStart(2, "0")}-${base}.${ext}`);
      absolute = this.absolutePath(relative);
      try { await this.verifyRealVaultPath(absolute); pathVerified = true; }
      catch (error) { pathVerified = false; throw error; }
      // A previous interrupted run may have left one or more temporary
      // files behind.  They are never resumable, so remove only those
      // explicitly-named temporaries before starting this attempt.  The
      // final target itself is kept until the new download is committed.
      await cleanupFiles(transientPaths(absolute));
      // Keep the freshly downloaded video out of the user-visible target
      // until optional audio has merged and all budgets have passed.  This
      // makes retries safe when an older target already exists.
      videoStage = `${absolute}.video.stage`;
      await cleanupFiles([videoStage, `${videoStage}.part`]);
      const remainingBudget = () => Math.min(Math.max(0, this.maxFileBytes - downloadedBytes), Math.max(0, this.runBudgetBytes - this.runBytes - downloadedBytes), Math.max(0, this.accountBudgetBytes - accountBytes - downloadedBytes));
      const progress = (bytes) => { downloadedBytes += Number(bytes || 0); };
      const timeoutMs = Number(task.timeoutMs || media.timeoutMs || this.timeoutMs) > 0 ? Number(task.timeoutMs || media.timeoutMs || this.timeoutMs) : DEFAULT_TIMEOUT_MS;
      const isCancelled = () => this.cancelled;
      const videoBytes = await downloadToFile(media.url, videoStage, { kind: media.kind, headers: media.headers, referer: item.sourceUrl, timeoutMs, maxBytes: remainingBudget(), onProgress: progress, isCancelled, registerCancel: (cancel) => this.activeCancels.add(cancel), unregisterCancel: (cancel) => this.activeCancels.delete(cancel) });
      if (this.cancelled) { await cleanupFiles([videoStage, ...transientPaths(absolute)]); return update("cancelled", { localPath: "", error: "媒体任务已停止" }); }
      let totalBytes = videoBytes;
      if (media.audioUrl) {
        await update("merging", { localPath: relative });
        audio = `${absolute}.audio.part`;
        merged = `${absolute}.merged.part`;
        totalBytes += await downloadToFile(media.audioUrl, audio, { kind: "audio", headers: media.headers, referer: item.sourceUrl, timeoutMs, maxBytes: remainingBudget(), onProgress: progress, isCancelled, registerCancel: (cancel) => this.activeCancels.add(cancel), unregisterCancel: (cancel) => this.activeCancels.delete(cancel) });
        await mergeDash(videoStage, audio, merged, { ffmpegPath: this.ffmpegPath, timeoutMs: Math.max(timeoutMs, 300000), registerCancel: (cancel) => this.activeCancels.add(cancel), unregisterCancel: (cancel) => this.activeCancels.delete(cancel) });
        if (this.cancelled) { await cleanupFiles([videoStage, audio, merged, ...transientPaths(absolute)]); return update("cancelled", { localPath: "", error: "媒体任务已停止" }); }
        const mergedStat = await fs.promises.stat(merged);
        if (mergedStat.size > this.maxFileBytes) throw limitError();
        // The merged container can be larger than either input stream. Keep
        // the task's accounting conservative so an unexpectedly inflated
        // output cannot bypass the configured run/account budgets.
        totalBytes = Math.max(totalBytes, Number(mergedStat.size) || 0);
      }
      if (this.runBytes + totalBytes > this.runBudgetBytes || accountBytes + totalBytes > this.accountBudgetBytes) {
        await cleanupFiles([videoStage, audio, merged, ...transientPaths(absolute)]);
        return update("skipped_budget", { localPath: "", bytes: 0, error: "已达到本次运行或账号媒体预算" });
      }
      // Commit only after every transfer/merge and budget check succeeds.
      try { await this.verifyRealVaultPath(absolute); }
      catch (error) { pathVerified = false; throw error; }
      if (media.audioUrl) await replaceFile(merged, absolute);
      else await replaceFile(videoStage, absolute);
      finalCommitted = true;
      try { await fs.promises.unlink(audio); } catch (_) {}
      try { await fs.promises.unlink(videoStage); } catch (_) {}
      audio = ""; merged = ""; videoStage = "";
      this.runBytes += totalBytes;
      return update("completed", { localPath: relative, bytes: totalBytes, error: "", completedAt: new Date().toISOString() });
    } catch (error) {
      const status = error?.code === "MEDIA_CANCELLED" ? "cancelled" : error?.status === 403 ? "forbidden" : error?.code === "MEDIA_INVALID_CONTENT" ? "unsupported" : "failed";
      this.log("media_download_failed", { key: task.key, status, error: sanitizeError(error) });
      // Do not remove an older, user-visible target when the new transfer
      // failed before committing it.  Once this run has committed a video,
      // however, it is safe to remove that run's file while rolling back a
      // failed DASH merge or a budget rejection.
      await cleanupFiles([finalCommitted ? null : videoStage, audio, merged, ...(pathVerified ? transientPaths(absolute) : [])]);
      let preservedPath = finalCommitted ? relative : "";
      if (!preservedPath && task.localPath) {
        try {
          const stat = await fs.promises.stat(this.absolutePath(task.localPath));
          if (stat.isFile() && stat.size > 0) preservedPath = task.localPath;
        } catch (_) {}
      }
      return update(status, { localPath: preservedPath, error: sanitizeError(error) });
    }
  }
  async ensureFolder(folder) {
    const absolute = this.absolutePath(folder);
    // Check the nearest existing ancestor before mkdir as well as after it.
    // Otherwise an attacker/user-created symlink could make the recursive
    // mkdir itself create directories outside the Vault before we notice.
    await this.verifyRealVaultPath(absolute);
    await fs.promises.mkdir(absolute, { recursive: true });
    await this.verifyRealVaultPath(absolute);
  }
  async verifyRealVaultPath(candidate) {
    const base = this.vault?.adapter?.basePath;
    if (!base || !candidate) return true;
    const realBase = await realpathNearest(String(base));
    const realCandidate = await realpathNearest(String(candidate));
    if (!isPathInside(realBase, realCandidate)) throw new Error("媒体路径通过符号链接超出 Vault 范围");
    return true;
  }
  async completedAccountBytes(platform, accountId, excludeKey = "") {
    let total = 0;
    const tasks = Object.values(this.stateStore?.get?.()?.mediaTasks || {})
      .filter((entry) => entry.platform === platform && entry.accountId === accountId && entry.status === "completed" && entry.key !== excludeKey);
    for (const entry of tasks) {
      let bytes = Number(entry?.bytes);
      if (entry?.localPath) {
        // The persisted byte count is only a historical hint. If a user
        // deletes the managed media file, do not keep charging that missing
        // file against the account budget; otherwise the “restore missing
        // media” path would immediately be skipped_budget forever.
        try {
          await this.verifyRealVaultPath(this.absolutePath(entry.localPath));
          const stat = await fs.promises.stat(this.absolutePath(entry.localPath));
          bytes = Number(stat.size);
        } catch (_) { bytes = 0; }
      }
      if (Number.isFinite(bytes) && bytes > 0) total += bytes;
    }
    return total;
  }
  absolutePath(relative) {
    const safeRelative = safeVaultRelativePath(relative);
    let resolved = "";
    if (this.vault?.adapter?.getFullPath) resolved = this.vault.adapter.getFullPath(safeRelative);
    else if (this.vault?.adapter?.basePath) resolved = path.join(this.vault.adapter.basePath, safeRelative);
    if (resolved) {
      const base = this.vault?.adapter?.basePath;
      if (base && !isPathInside(base, resolved)) throw new Error("媒体路径超出 Vault 范围");
      return resolved;
    }
    throw new Error("无法确定 Vault 本地路径，已停止媒体写入以避免写入错误目录");
  }
  async retryFailed(filter) {
    // Include interrupted in-flight states as well as terminal failures.  A
    // process restart can leave a task queued/downloading/merging even though
    // no worker remains to finish it; exposing those states to the retry
    // command makes recovery deterministic.  Completed tasks are always
    // excluded so an explicit retry can never redownload healthy media.
    const retryable = new Set(["failed", "expired", "forbidden", "skipped_budget", "queued", "resolving", "downloading", "merging", "cancelled"]);
    const tasks = Object.values(this.stateStore?.get?.()?.mediaTasks || {}).filter((task) => retryable.has(String(task?.status || ""))).filter(filter || (() => true));
    const retried = [];
    for (const task of tasks) {
      if (this.cancelled) break;
      if (!task.item) { retried.push({ ...task, retryStatus: "needs_resync" }); continue; }
      let media = task.media;
      const adapter = this.adapters?.[task.platform];
      if (adapter?.resolveMedia) {
        try {
          const config = this.stateStore?.platform?.(task.platform) || {};
          const refreshed = await adapter.resolveMedia(task.item, { quality: config.quality || "standard", allParts: config.allParts !== false, refresh: true });
          const match = refreshed.find((entry) => String(entry.id) === String(task.mediaId)) || refreshed.find((entry) => String(entry.id) === String(media?.id));
          if (match) media = match;
        } catch (error) {
          retried.push(await this.updateTask(task, "failed", { error: sanitizeError(error), retryStatus: "resolve_failed" }));
          continue;
        }
      }
      if (!media?.url) {
        retried.push(await this.updateTask(task, "expired", { retryStatus: "needs_resync", error: "媒体地址已失效，请重新同步该收藏" }));
        continue;
      }
      const next = { ...task, media: { ...media }, status: "queued", error: "", attempts: Number(task.attempts || 0) };
      await this.stateStore?.setMediaTask(task.key, next);
      retried.push(await this.scheduleDownload(task.item, media, next));
    }
    return retried;
  }
}

async function downloadToFile(url, target, options = {}) {
  const temp = `${target}.part`;
  await fs.promises.mkdir(path.dirname(target), { recursive: true });
  await cleanupFiles([temp]);
  const timeoutMs = normalizeTimeout(options.timeoutMs);
  const maxBytes = normalizeMaxBytes(options.maxBytes);
  try {
    if (options.isCancelled?.()) throw cancellationError();
    if (/^https?:/i.test(url)) return await streamDownload(url, temp, target, { ...options, timeoutMs, maxBytes });
    if (requestUrl) {
      let activeResponse;
      const response = await cancellable(async () => withTimeout(async () => {
        // A resolved playback URL commonly points at a CDN on another
        // origin than the platform page.  Do not send platform cookies or
        // bearer tokens to that CDN on the initial request; the redirect
        // scrubber below protects later hops, while this filter protects the
        // first hop as well.
        // An absent page URL is not proof that the media host is trusted. Do
        // not use the media URL as the synthetic "from" origin, otherwise a
        // direct CDN request made without a referer would forward Cookie or
        // Authorization headers unchanged.
        const initialHeaders = headersForRedirect(options.referer, url, options.headers);
        const initialReferer = refererForRedirect(options.referer, url, options.referer);
        activeResponse = await requestUrl({ url, method: "GET", headers: { ...(initialReferer ? { Referer: initialReferer } : {}), ...initialHeaders }, throw: false, timeout: timeoutMs });
        return activeResponse;
      }, timeoutMs, () => abortResponse(activeResponse)), options, () => abortResponse(activeResponse));
      try { assertResponseOk(response); }
      catch (error) { await abortResponse(response); throw error; }
      try { assertResponseMediaType(responseHeader(response, "content-type"), options.kind); }
      catch (error) { await abortResponse(response); throw error; }
      await cancellable(() => withTimeout(() => writeResponseBody(response, temp, { ...options, timeoutMs, maxBytes }), timeoutMs, () => abortResponse(response)), options, () => abortResponse(response));
    } else if (typeof fetch === "function") {
      const controller = typeof AbortController === "function" ? new AbortController() : null;
      let activeResponse;
      await cancellable(() => withTimeout(async () => {
        const initialHeaders = headersForRedirect(options.referer, url, options.headers);
        const initialReferer = refererForRedirect(options.referer, url, options.referer);
        activeResponse = await fetch(url, { headers: { ...(initialReferer ? { Referer: initialReferer } : {}), ...initialHeaders }, ...(controller ? { signal: controller.signal } : {}) });
        try { assertResponseOk(activeResponse); }
        catch (error) { await abortResponse(activeResponse); throw error; }
        try { assertResponseMediaType(responseHeader(activeResponse, "content-type"), options.kind); }
        catch (error) { await abortResponse(activeResponse); throw error; }
        await writeResponseBody(activeResponse, temp, { ...options, timeoutMs, maxBytes });
      }, timeoutMs, () => { try { controller?.abort(); } catch (_) {} return abortResponse(activeResponse); }), options, () => { try { controller?.abort(); } catch (_) {} return abortResponse(activeResponse); });
    } else {
      throw new Error("当前环境不支持媒体下载");
    }
    await validateDownloadedFile(temp, options.kind);
    await replaceFile(temp, target);
    return (await fs.promises.stat(target)).size;
  } catch (error) {
    await cleanupFiles([temp]);
    throw error;
  }
}

function streamDownload(url, temp, target, options = {}, redirects = 0) {
  const timeoutMs = normalizeTimeout(options.timeoutMs);
  const deadline = Number(options._deadline) > 0 ? Number(options._deadline) : Date.now() + timeoutMs;
  return new Promise((resolve, reject) => {
    if (options.isCancelled?.()) return cleanupFiles([temp]).finally(() => reject(cancellationError()));
    if (redirects > MAX_REDIRECTS) return cleanupFiles([temp]).finally(() => reject(new Error("媒体下载重定向次数过多")));
    const remainingMs = deadline - Date.now();
    if (remainingMs <= 0) return cleanupFiles([temp]).finally(() => reject(timeoutError()));
    let parsed;
    try { parsed = new URL(url); } catch (_) { return cleanupFiles([temp]).finally(() => reject(new Error("媒体地址不可用"))); }
    if (!/^https?:$/i.test(parsed.protocol)) return cleanupFiles([temp]).finally(() => reject(new Error("媒体地址协议不受支持")));
    const client = parsed.protocol === "https:" ? https : http;
    let totalTimer;
    let request;
    let response;
    let output;
    let settled = false;
    let delegated = false;
    let failurePromise = null;
    const cleanupTemp = () => cleanupFiles([temp]);
    let cancel;
    const fail = (error) => {
      if (settled) return failurePromise || Promise.resolve();
      settled = true;
      try { options.unregisterCancel?.(cancel); } catch (_) {}
      if (totalTimer) clearTimeout(totalTimer);
      try { request?.destroy(); } catch (_) {}
      try { response?.destroy(); } catch (_) {}
      try { output?.destroy(); } catch (_) {}
      failurePromise = cleanupTemp().finally(() => reject(error));
      return failurePromise;
    };
    cancel = () => fail(cancellationError());
    try { options.registerCancel?.(cancel); } catch (_) {}
    const finishDelegated = (bytes) => {
      if (settled) return;
      settled = true;
      try { options.unregisterCancel?.(cancel); } catch (_) {}
      if (totalTimer) clearTimeout(totalTimer);
      resolve(bytes);
    };
    const complete = (bytes) => {
      if (settled) return;
      settled = true;
      try { options.unregisterCancel?.(cancel); } catch (_) {}
      if (totalTimer) clearTimeout(totalTimer);
      validateDownloadedFile(temp, options.kind)
        .then(() => replaceFile(temp, target))
        .then(() => resolve(bytes), (error) => cleanupTemp().finally(() => reject(error)));
    };
    totalTimer = setTimeout(() => fail(timeoutError()), remainingMs);
    totalTimer.unref?.();
    try {
      const initialHeaders = headersForRedirect(options.referer, url, options.headers);
      const initialReferer = refererForRedirect(options.referer, url, options.referer);
      request = client.get(parsed, { headers: { ...initialHeaders, ...(initialReferer ? { Referer: initialReferer } : {}) } }, (incoming) => {
        response = incoming;
      if ([301, 302, 303, 307, 308].includes(response.statusCode) && response.headers.location) {
        delegated = true;
        response.once("error", fail);
        response.resume();
        let nextUrl;
        try { nextUrl = new URL(response.headers.location, url).toString(); }
        catch (_) { return fail(new Error("媒体下载重定向地址不可用")); }
        return response.once("end", () => {
          if (settled) return;
          // A CDN redirect is commonly cross-origin.  Never forward session
          // cookies or bearer credentials to a new origin; the original
          // platform URL is allowed to establish the redirect, while the
          // public media host only needs harmless headers such as User-Agent
          // and (optionally) Referer.  Same-origin redirects retain the full
          // header set for platforms that require a cookie on a path change.
          const redirectedHeaders = headersForRedirect(url, nextUrl, options.headers);
          const redirectedReferer = refererForRedirect(url, nextUrl, options.referer);
          streamDownload(nextUrl, temp, target, { ...options, headers: redirectedHeaders, referer: redirectedReferer, timeoutMs, _deadline: deadline }, redirects + 1).then(finishDelegated, fail);
        });
      }
      if ((response.statusCode || 0) >= 400) { response.resume(); const error = new Error(`媒体下载失败（${response.statusCode}）`); error.status = response.statusCode; return fail(error); }
      try { assertResponseMediaType(response.headers["content-type"], options.kind); }
      catch (error) { response.resume(); return fail(error); }
      const expected = Number(response.headers["content-length"] || 0);
      const maxBytes = normalizeMaxBytes(options.maxBytes);
      if (maxBytes != null && expected > maxBytes) { response.resume(); return fail(limitError()); }
      let bytes = 0;
      output = fs.createWriteStream(temp);
      let ended = false;
      let queue = Promise.resolve();
      const finishStream = () => {
        if (settled || !ended) return;
        queue.then(async () => {
          if (settled) return;
          try { await endWritable(output); } catch (error) { return fail(error); }
          complete(bytes);
        }).catch(fail);
      };
      response.on("data", (chunk) => {
        if (settled) return;
        try { response.pause?.(); } catch (_) {}
        queue = queue.then(async () => {
          if (settled) return;
          const data = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
          if (maxBytes != null && bytes + data.length > maxBytes) throw limitError();
          await writeChunk(output, data);
          bytes += data.length;
          options.onProgress?.(data.length);
        }).then(() => { try { response.resume?.(); } catch (_) {} });
        queue.catch(fail);
      });
      response.on("end", () => { ended = true; finishStream(); });
      response.on("aborted", () => fail(new Error("媒体下载连接被中止")));
      response.on("error", fail);
      output.on("error", fail);
      // IncomingMessage.setTimeout is an inactivity timeout.  The total
      // timer below also covers a peer that keeps a connection open without
      // delivering a complete response.
      response.setTimeout?.(Math.max(1, Math.min(timeoutMs, remainingMs)), () => fail(timeoutError()));
      });
      request.on("error", (error) => { if (!delegated) fail(error); });
      request.setTimeout(Math.max(1, Math.min(timeoutMs, remainingMs)), () => fail(timeoutError()));
    } catch (error) {
      fail(error);
    }
  });
}

async function mergeDash(video, audio, output, options = {}) {
  const { spawn } = require("child_process");
  const ffmpeg = options.ffmpegPath || process.env.MSS_FFMPEG_PATH || "ffmpeg";
  const timeoutMs = normalizeTimeout(options.timeoutMs || 300000);
  await cleanupFiles([output]);
  await new Promise((resolve, reject) => {
    let child;
    let settled = false;
    let settling = false;
    let failurePromise = null;
    let timer;
    let forceTimer;
    let stderr = "";
    let cancel;
    const fail = (error) => {
      if (settled) return Promise.resolve();
      if (failurePromise) return failurePromise;
      settling = true;
      if (timer) clearTimeout(timer);
      try { child?.kill?.("SIGTERM"); } catch (_) {}
      forceTimer = setTimeout(() => { try { child?.kill?.("SIGKILL"); } catch (_) {} }, 1000);
      forceTimer.unref?.();
      failurePromise = waitForChildExit(child, 2000).then(() => cleanupFiles([output])).catch(() => {}).then(() => {
        if (settled) return;
        settled = true;
        if (forceTimer) clearTimeout(forceTimer);
        try { options.unregisterCancel?.(cancel); } catch (_) {}
        reject(error);
      });
      failurePromise.unref?.();
      return failurePromise;
    };
    cancel = () => fail(cancellationError());
    try { options.registerCancel?.(cancel); } catch (_) {}
    try { child = spawn(ffmpeg, ["-y", "-i", video, "-i", audio, "-c", "copy", "-movflags", "+faststart", output], { windowsHide: true }); }
    catch (error) { return fail(error); }
    child.stderr?.on("data", (chunk) => { stderr = (stderr + String(chunk)).slice(-2000); });
    child.on("error", fail);
    child.on("close", async (code) => {
      if (settled || settling) return;
      if (code !== 0) return fail(new Error(`FFmpeg 合并失败（${code}）：${sanitizeError(stderr.slice(-500))}`));
      try {
        const stat = await fs.promises.stat(output);
        if (!stat.isFile()) throw new Error("FFmpeg 未生成有效合并文件");
        settled = true; try { options.unregisterCancel?.(cancel); } catch (_) {} clearTimeout(timer); resolve();
      } catch (error) { fail(error); }
    });
    timer = setTimeout(() => fail(timeoutError("FFmpeg 合并超时")), timeoutMs);
    timer.unref?.();
  });
}

function platformFolder(platform) { return ({ rednote: "小红书（RedNote）", bilibili: "哔哩哔哩（Bilibili）", douyin: "抖音（Douyin）" })[platform] || platform; }
function safeFolder(value) {
  const cleaned = String(value || "未命名")
    .replace(/[\\/:*?"<>|#\[\]\u0000-\u001f]+/g, "_")
    .replace(/[. ]+$/g, "")
    .trim()
    .slice(0, 120);
  return !cleaned || cleaned === "." || cleaned === ".." ? "未命名" : cleaned;
}
function accountFolder(item) { return safeFolder(item?.platform === "rednote" ? (item.accountName || item.accountId) : (item.accountId || item.accountName)); }
function extensionFor(url, kind) { const match = String(url).split(/[?#]/)[0].match(/\.([a-z0-9]{2,5})$/i); if (match && /^(mp4|mov|m4v|webm|jpg|jpeg|png|webp|gif)$/i.test(match[1])) return match[1].toLowerCase(); return kind === "image" ? "jpg" : "mp4"; }
function sanitizeError(error) { return String(error?.message || error || "下载失败").replace(/https?:\/\/\S+/g, "[url]").slice(0, 500); }
function headersForRedirect(fromUrl, toUrl, headers) {
  const input = headers && typeof headers === "object" ? headers : {};
  let crossOrigin = !String(fromUrl || "").trim();
  try { crossOrigin = new URL(String(fromUrl)).origin !== new URL(String(toUrl)).origin; }
  catch (_) { crossOrigin = true; }
  if (!crossOrigin) return { ...input };
  const out = {};
  for (const [key, value] of Object.entries(input)) {
    const lower = String(key || "").toLowerCase();
    if (/^(?:cookie|set-cookie|authorization|proxy-authorization|referer|referrer)$/.test(lower) || /(?:token|secret|signature|csrf|session)/i.test(lower)) continue;
    out[key] = value;
  }
  return out;
}
function refererForRedirect(fromUrl, toUrl, referer) {
  if (!referer) return "";
  try {
    return new URL(String(fromUrl)).origin === new URL(String(toUrl)).origin ? String(referer) : "";
  } catch (_) {
    return "";
  }
}
function safeVaultRelativePath(value) {
  const text = String(value || "").replace(/\\/g, "/");
  if (text.includes("\u0000")) throw new Error("媒体路径包含无效字符");
  if (/^[A-Za-z]:\//.test(text) || text.startsWith("//")) throw new Error("媒体路径超出 Vault 范围");
  const normalized = path.posix.normalize(text);
  if (!normalized || normalized === "." || normalized === ".." || normalized.startsWith("../") || normalized.startsWith("/")) throw new Error("媒体路径超出 Vault 范围");
  return normalized;
}
function isPathInside(root, candidate) {
  const relative = path.relative(path.resolve(String(root)), path.resolve(String(candidate)));
  return relative === "" || (relative && relative !== ".." && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative));
}
async function cleanupFiles(files) { for (const file of files.filter(Boolean)) { try { await fs.promises.unlink(file); } catch (_) {} } }

async function realpathNearest(value) {
  let current = path.resolve(String(value || "."));
  while (true) {
    try { return await fs.promises.realpath(current); }
    catch (_) {
      const parent = path.dirname(current);
      if (parent === current) return current;
      current = parent;
    }
  }
}

function transientPaths(target) {
  if (!target) return [];
  return [`${target}.part`, `${target}.audio.part`, `${target}.audio.part.part`, `${target}.merged.part`, `${target}.merged.part.part`];
}

function waitForChildExit(child, timeoutMs) {
  return new Promise((resolve) => {
    if (!child || child.exitCode != null || child.signalCode != null) return resolve();
    let timer;
    const done = () => {
      if (timer) clearTimeout(timer);
      child.removeListener?.("close", done);
      child.removeListener?.("error", done);
      resolve();
    };
    child.once?.("close", done);
    child.once?.("error", done);
    timer = setTimeout(done, Math.max(1, Number(timeoutMs) || 2000));
    timer.unref?.();
  });
}

async function replaceFile(source, target) {
  if (!source || !target) throw new Error("媒体文件路径不可用");
  await fs.promises.mkdir(path.dirname(target), { recursive: true });
  // rename is atomic on the same filesystem and replaces an existing target
  // on the platforms supported by Obsidian.  Keep a small Windows fallback
  // for filesystems where rename reports EEXIST/EPERM.
  try {
    await fs.promises.rename(source, target);
  } catch (error) {
    if (!error || !["EEXIST", "EPERM", "ENOTEMPTY"].includes(error.code)) throw error;
    try { await fs.promises.unlink(target); } catch (unlinkError) { if (unlinkError?.code !== "ENOENT") throw error; }
    await fs.promises.rename(source, target);
  }
}

function normalizeMaxBytes(value) {
  if (value === undefined || value === null || value === Infinity) return null;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : null;
}

function normalizeTimeout(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? Math.max(1, number) : DEFAULT_TIMEOUT_MS;
}

function limitError() {
  const error = new Error("媒体文件超过单文件大小限制");
  error.code = "MEDIA_MAX_BYTES";
  return error;
}

function timeoutError(message = "媒体下载超时") {
  const error = new Error(message);
  error.code = "MEDIA_TIMEOUT";
  return error;
}

function cancellationError() {
  const error = new Error("媒体任务已取消");
  error.code = "MEDIA_CANCELLED";
  return error;
}

function abortResponse(response) {
  const pending = [];
  try {
    const cancel = response && typeof response === "object" ? RESPONSE_CANCELS.get(response) : null;
    if (cancel) pending.push(Promise.resolve(cancel()).catch(() => {}));
  } catch (_) {}
  try { response?.destroy?.(); } catch (_) {}
  try {
    const cancelled = response?.body?.cancel?.();
    if (cancelled && typeof cancelled.then === "function") pending.push(Promise.resolve(cancelled).catch(() => {}));
  } catch (_) {}
  return Promise.allSettled(pending);
}

function assertResponseOk(response) {
  const status = Number(response?.status || response?.statusCode || 0);
  // Some older requestUrl mocks (and a few Obsidian builds) omit status but
  // still provide a body. Preserve that established compatibility while
  // treating an explicit non-2xx status as a failure.
  if (!status && response && (response.arrayBuffer !== undefined || response.text !== undefined || response.body !== undefined)) return response;
  const ok = response?.ok === undefined ? status > 0 && status < 400 : Boolean(response.ok);
  if (ok) return response;
  const error = new Error(`媒体下载失败（${status || "unknown"}）`);
  if (status) error.status = status;
  throw error;
}

function assertResponseMediaType(contentType, kind) {
  const type = String(contentType || "").split(";", 1)[0].trim().toLowerCase();
  if (!type || type === "application/octet-stream" || type === "binary/octet-stream" || type === "application/download") return;
  // A platform can answer a signed-media request with a 200 login/error page.
  // Reject obvious text/JSON responses before they are persisted as .mp4/.jpg.
  if (type === "text/html" || type === "application/xhtml+xml" || type === "application/json" || type.startsWith("text/")) throw mediaContentError(`媒体响应类型异常（${type}）`);
  if (kind === "image" && !type.startsWith("image/")) throw mediaContentError(`图片响应类型异常（${type}）`);
  if (kind === "video" && (type.startsWith("image/") || type === "audio/mpeg" || type === "audio/mp4")) throw mediaContentError(`视频响应类型异常（${type}）`);
  if (kind === "audio" && type.startsWith("image/")) throw mediaContentError(`音频响应类型异常（${type}）`);
}

async function validateDownloadedFile(filePath, kind) {
  const stat = await fs.promises.stat(filePath);
  if (!stat.isFile() || stat.size <= 0) throw mediaContentError("媒体响应为空或不是文件");
  const handle = await fs.promises.open(filePath, "r");
  let bytes;
  try {
    const buffer = Buffer.alloc(Math.min(128, stat.size));
    const result = await handle.read(buffer, 0, buffer.length, 0);
    bytes = buffer.subarray(0, result.bytesRead);
  } finally { await handle.close(); }
  const ascii = bytes.toString("utf8").replace(/^\uFEFF/, "").trimStart().toLowerCase();
  if (ascii.startsWith("<!doctype html") || ascii.startsWith("<html") || ascii.startsWith("<head") || ascii.startsWith("{\"error") || ascii.startsWith("{\"code")) throw mediaContentError("媒体地址返回了网页或 JSON 错误内容");
  if (ascii.startsWith("{") || ascii.startsWith("[")) {
    try { JSON.parse(ascii); throw mediaContentError("媒体地址返回了 JSON 内容"); } catch (error) {
      if (error?.code === "MEDIA_INVALID_CONTENT") throw error;
      // A binary container can coincidentally begin with `{`/`[`; only a
      // valid JSON document is treated as an API error response.
    }
  }
  const isJpeg = bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const isPng = bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from("89504e470d0a1a0a", "hex"));
  const isGif = bytes.length >= 6 && (bytes.subarray(0, 6).toString("ascii") === "GIF87a" || bytes.subarray(0, 6).toString("ascii") === "GIF89a");
  const isWebp = bytes.length >= 12 && bytes.subarray(0, 4).toString("ascii") === "RIFF" && bytes.subarray(8, 12).toString("ascii") === "WEBP";
  const isMp4 = bytes.length >= 12 && bytes.subarray(4, 8).toString("ascii") === "ftyp";
  const isWebm = bytes.length >= 4 && bytes.subarray(0, 4).equals(Buffer.from("1a45dfa3", "hex"));
  if (kind === "image" && (isMp4 || isWebm)) throw mediaContentError("图片地址返回了视频容器");
  if (kind === "video" && (isJpeg || isPng || isGif || isWebp)) throw mediaContentError("视频地址返回了图片内容");
  // Unknown containers are allowed: some platform CDNs return FLV/TS or an
  // application/octet-stream MIME. The cheap signature checks above still
  // block the common login-page/wrong-media cases without rejecting them.
  return stat.size;
}

function mediaContentError(message) {
  const error = new Error(message);
  error.code = "MEDIA_INVALID_CONTENT";
  return error;
}

function withTimeout(operation, timeoutMs, onTimeout) {
  const duration = normalizeTimeout(timeoutMs);
  return new Promise((resolve, reject) => {
    let settled = false;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      let cleanup;
      try { cleanup = onTimeout?.(); } catch (_) {}
      Promise.resolve(cleanup).catch(() => {}).finally(() => reject(timeoutError()));
    }, duration);
    timer.unref?.();
    Promise.resolve().then(operation).then((value) => {
      if (settled) return;
      settled = true; clearTimeout(timer); resolve(value);
    }, (error) => {
      if (settled) return;
      settled = true; clearTimeout(timer); reject(error);
    });
  });
}

function cancellable(operation, options = {}, onCancel) {
  return new Promise((resolve, reject) => {
    let settled = false;
    let cancelled = false;
    const cancel = () => {
      if (settled) return Promise.resolve();
      cancelled = true;
      settled = true;
      return Promise.resolve().then(() => onCancel?.()).catch(() => {}).finally(() => {
        try { options.unregisterCancel?.(cancel); } catch (_) {}
        reject(cancellationError());
      });
    };
    try { options.registerCancel?.(cancel); } catch (_) {}
    Promise.resolve().then(() => {
      // A caller can cancel synchronously after `cancellable` registers its
      // hook but before the operation microtask starts. Do not launch a
      // network request/stream writer after that cancellation; otherwise the
      // outer cleanup races a late `.part` write.
      if (cancelled) return undefined;
      return operation();
    }).then((value) => {
      if (settled) return;
      settled = true;
      try { options.unregisterCancel?.(cancel); } catch (_) {}
      resolve(value);
    }, (error) => {
      if (settled) return;
      settled = true;
      try { options.unregisterCancel?.(cancel); } catch (_) {}
      reject(error);
    });
  });
}

function responseHeader(response, name) {
  const wanted = String(name).toLowerCase();
  const headers = response?.headers;
  if (!headers) return "";
  if (typeof headers.get === "function") return headers.get(name) || headers.get(wanted) || "";
  const value = headers[name] ?? headers[wanted];
  return Array.isArray(value) ? value[0] : (value || "");
}

async function writeResponseBody(response, target, options = {}) {
  const maxBytes = normalizeMaxBytes(options.maxBytes);
  const expected = Number(responseHeader(response, "content-length") || 0);
  if (maxBytes != null && Number.isFinite(expected) && expected > maxBytes) throw limitError();
  const output = fs.createWriteStream(target);
  let cancelled = false;
  let reader = null;
  let iterator = null;
  const body = response?.body;
  // `cancellable()` rejects its caller immediately, but a stream reader may
  // still be awaiting its next chunk. Register a second, local cancellation
  // hook so that the writer and reader are torn down as well. Without this
  // hook a late chunk could finish writing the `.part` file after the task was
  // already marked cancelled, creating a race with the cleanup/rename path.
  let cancelPromise;
  const waitOutputClose = () => new Promise((resolve) => {
    if (output.closed) return resolve();
    output.once("close", resolve);
  });
  const cancel = () => {
    if (cancelPromise) return cancelPromise;
    cancelled = true;
    const pending = [];
    try {
      if (reader?.cancel) pending.push(Promise.resolve(reader.cancel()).catch(() => {}));
      else if (iterator?.return) pending.push(Promise.resolve(iterator.return()).catch(() => {}));
      else if (body?.cancel) pending.push(Promise.resolve(body.cancel()).catch(() => {}));
      else if (body?.return) pending.push(Promise.resolve(body.return()).catch(() => {}));
    } catch (_) {}
    // Attach the error listener before destroying; otherwise a cancellation
    // that races stream creation can surface as an unhandled WriteStream error.
    try { output.destroy(); } catch (_) {}
    cancelPromise = Promise.allSettled(pending).then(waitOutputClose);
    return cancelPromise;
  };
  let outputError = null;
  const captureOutputError = (error) => { outputError ||= error; };
  output.on("error", captureOutputError);
  // Register only after the output has an error guard. A caller is allowed
  // to invoke a newly registered cancel hook synchronously.
  try { options.registerCancel?.(cancel); } catch (_) {}
  if (response && typeof response === "object") RESPONSE_CANCELS.set(response, cancel);
  let bytes = 0;
  let ended = false;
  const throwIfCancelled = () => {
    if (cancelled || options.isCancelled?.()) throw cancellationError();
  };
  const write = async (chunk) => {
    throwIfCancelled();
    if (outputError) throw outputError;
    const data = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk || "");
    if (!data.length) return;
    if (maxBytes != null && bytes + data.length > maxBytes) throw limitError();
    await writeChunk(output, data);
    throwIfCancelled();
    if (outputError) throw outputError;
    bytes += data.length;
    options.onProgress?.(data.length);
  };
  try {
    throwIfCancelled();
    // Prefer an explicit reader when available. Calling body.cancel() while
    // an async iterator owns a ReadableStream rejects with "stream locked";
    // retaining the reader lets cancellation reliably unblock reader.read().
    if (body && typeof body.getReader === "function") {
      reader = body.getReader();
      try {
        while (true) {
          throwIfCancelled();
          const part = await reader.read();
          throwIfCancelled();
          if (part.done) break;
          await write(part.value);
        }
      } finally { try { await reader.releaseLock?.(); } catch (_) {} }
    } else if (body && typeof body[Symbol.asyncIterator] === "function") {
      iterator = body[Symbol.asyncIterator]();
      try {
        while (true) {
          throwIfCancelled();
          const part = await iterator.next();
          throwIfCancelled();
          if (part.done) break;
          await write(part.value);
        }
      } finally { try { await iterator.return?.(); } catch (_) {} }
    } else {
      let raw;
      if (typeof response?.arrayBuffer === "function") raw = await response.arrayBuffer();
      else if (response?.arrayBuffer !== undefined) raw = response.arrayBuffer;
      if (raw !== undefined && raw !== null) await write(Buffer.from(raw));
      else if (response?.text !== undefined) await write(Buffer.from(String(response.text || "")));
    }
    throwIfCancelled();
    ended = true;
    await endWritable(output);
    throwIfCancelled();
    return bytes;
  } catch (error) {
    try { output.destroy(); } catch (_) {}
    throw error;
  } finally {
    try { options.unregisterCancel?.(cancel); } catch (_) {}
    if (response && RESPONSE_CANCELS.get(response) === cancel) RESPONSE_CANCELS.delete(response);
    // Keep the guard listener attached until the stream is garbage-collected.
    // A pending write callback can emit ERR_STREAM_DESTROYED after the reader
    // cancellation has completed; removing the last listener here would turn
    // that late, expected teardown error into an uncaught exception.
    if (!ended) {
      try { output.destroy(); } catch (_) {}
    }
  }
}

function writeChunk(output, data) {
  if (output.write(data)) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const onDrain = () => { cleanup(); resolve(); };
    const onError = (error) => { cleanup(); reject(error); };
    const cleanup = () => { output.removeListener("drain", onDrain); output.removeListener("error", onError); };
    output.once("drain", onDrain);
    output.once("error", onError);
  });
}

function endWritable(output) {
  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = () => { if (settled) return; settled = true; cleanup(); resolve(); };
    const fail = (error) => { if (settled) return; settled = true; cleanup(); reject(error); };
    const cleanup = () => { output.removeListener("finish", finish); output.removeListener("error", fail); };
    output.once("finish", finish);
    output.once("error", fail);
    output.end();
  });
}

module.exports = { MediaService, MEDIA_STATUSES, downloadToFile, streamDownload, mergeDash, platformFolder, safeFolder, headersForRedirect, refererForRedirect, assertResponseMediaType, validateDownloadedFile };
