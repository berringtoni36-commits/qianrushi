const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const START = "<!-- multi-source-sync-transcription:start -->";
const END = "<!-- multi-source-sync-transcription:end -->";
const TOOL_CHECK_TIMEOUT_MS = 15_000;
const DEFAULT_FFMPEG_TIMEOUT_MS = 15 * 60 * 1000;
const DEFAULT_WHISPER_TIMEOUT_MS = 2 * 60 * 60 * 1000;

class TranscriptionService {
  constructor({ vault, stateStore, settings = {}, notify, log } = {}) {
    this.vault = vault;
    this.stateStore = stateStore;
    this.settings = settings;
    this.notify = notify || (() => {});
    this.log = log || (() => {});
    this.activeChildren = new Set();
    this.activeCancels = new Set();
    this.activeTasks = new Map();
    this.destroyed = false;
  }
  destroy() {
    this.destroyed = true;
    const children = [...this.activeChildren];
    const pending = [];
    // Ask each running command to cancel through the same path used by a
    // user-initiated stop.  Killing only the child process leaves the
    // promise waiting for a close event and can race temp-directory cleanup.
    for (const cancel of this.activeCancels) {
      try { pending.push(Promise.resolve(cancel?.()).catch(() => {})); } catch (_) {}
    }
    this.activeCancels.clear();
    for (const child of children) {
      try { child.kill?.("SIGTERM"); } catch (_) {}
      setTimeout(() => { try { child.kill?.("SIGKILL"); } catch (_) {} }, 1000).unref?.();
      pending.push(waitForChildExit(child, 2000));
    }
    this.activeChildren.clear();
    return Promise.allSettled(pending);
  }
  async checkTools() {
    if (this.destroyed) throw cancellationError();
    const ffmpeg = expandHome(this.settings.ffmpegPath || "") || "ffmpeg";
    const whisper = expandHome(this.settings.whisperPath || this.settings.whisperCliPath || "") || "whisper-cli";
    const model = expandHome(this.settings.modelPath || "");
    const checks = {
      ffmpeg: await commandWorks(ffmpeg, ["-version"], TOOL_CHECK_TIMEOUT_MS, { activeChildren: this.activeChildren, isCancelled: () => this.destroyed }),
      whisper: await commandWorks(whisper, ["--help"], TOOL_CHECK_TIMEOUT_MS, { activeChildren: this.activeChildren, isCancelled: () => this.destroyed }),
      model: Boolean(model && isRegularFile(model)),
    };
    if (this.destroyed) throw cancellationError();
    return { ...checks, ready: checks.ffmpeg && checks.whisper && checks.model, paths: { ffmpeg, whisper, model } };
  }
  async transcribeVideo({ notePath, videoPath, localPath = "", mediaId = "", taskKey = "", label = "", timestamps = false } = {}) {
    if (!notePath || !videoPath) throw new Error("缺少笔记或视频路径");
    if (this.destroyed) throw cancellationError();
    const safeNotePath = safeVaultRelativePath(notePath);
    if (localPath) safeVaultRelativePath(localPath);
    const resolvedVideoPath = await this.resolveVideoPath(videoPath);
    const identityKey = transcriptionTaskKey({ notePath: safeNotePath, videoPath: resolvedVideoPath, localPath, mediaId, taskKey });
    const active = this.activeTasks.get(identityKey);
    if (active) return active;
    const operation = this._transcribeVideo({ notePath: safeNotePath, videoPath: resolvedVideoPath, localPath, mediaId, taskKey, label: label || path.basename(resolvedVideoPath), timestamps });
    this.activeTasks.set(identityKey, operation);
    try { return await operation; }
    finally { if (this.activeTasks.get(identityKey) === operation) this.activeTasks.delete(identityKey); }
  }
  async _transcribeVideo({ notePath, videoPath, localPath = "", mediaId = "", taskKey = "", label = "视频", timestamps = false } = {}) {
    if (this.destroyed) throw cancellationError();
    const tool = await this.checkTools();
    if (!tool.ready) throw new Error("视频转文字工具未就绪，请检查 FFmpeg、whisper-cli 和模型路径");
    if (this.destroyed) throw cancellationError();
    const tempDir = await fs.promises.mkdtemp(path.join(require("os").tmpdir(), "mss-transcription-"));
    const audio = path.join(tempDir, "audio.wav");
    try {
      await run(tool.paths.ffmpeg, ["-y", "-i", videoPath, "-vn", "-ac", "1", "-ar", "16000", "-f", "wav", audio], { timeoutMs: numberSetting(this.settings.ffmpegTimeoutMs, DEFAULT_FFMPEG_TIMEOUT_MS), activeChildren: this.activeChildren, registerCancel: (cancel) => this.activeCancels.add(cancel), unregisterCancel: (cancel) => this.activeCancels.delete(cancel), isCancelled: () => this.destroyed });
      if (this.destroyed) throw cancellationError();
      const outputBase = path.join(tempDir, "transcript");
      const args = ["-m", tool.paths.model, "-f", audio, ...(timestamps ? ["-osrt"] : ["-otxt"]), "-of", outputBase];
      const text = await run(tool.paths.whisper, args, { capture: true, timeoutMs: numberSetting(this.settings.whisperTimeoutMs, DEFAULT_WHISPER_TIMEOUT_MS), activeChildren: this.activeChildren, registerCancel: (cancel) => this.activeCancels.add(cancel), unregisterCancel: (cancel) => this.activeCancels.delete(cancel), isCancelled: () => this.destroyed });
      if (this.destroyed) throw cancellationError();
      const generated = `${outputBase}.${timestamps ? "srt" : "txt"}`;
      const result = sanitizeTranscript((fs.existsSync(generated) ? await fs.promises.readFile(generated, "utf8") : text).trim()) || "本次未识别到明显语音内容";
      if (this.destroyed) throw cancellationError();
      await this.updateNote(notePath, label, result, { localPath, mediaId, taskKey });
      return result;
    } finally { try { await fs.promises.rm(tempDir, { recursive: true, force: true }); } catch (_) {} }
  }
  async resolveVideoPath(videoPath) {
    const input = String(videoPath || "");
    if (!input || input.includes("\u0000")) throw new Error("视频路径不可用");
    let absolute;
    if (path.isAbsolute(input)) absolute = path.resolve(input);
    else absolute = this.absolutePath(input);
    const adapter = this.vault?.adapter;
    const basePath = adapter?.basePath ? path.resolve(String(adapter.basePath)) : "";
    if (basePath) {
      const [realBase, realVideo] = await Promise.all([
        fs.promises.realpath(basePath).catch(() => basePath),
        fs.promises.realpath(absolute).catch(() => absolute),
      ]);
      if (!isPathInside(realBase, realVideo)) throw new Error("视频路径超出 Vault 范围");
    }
    let stat;
    try { stat = await fs.promises.stat(absolute); } catch (_) { throw new Error("本地视频文件不存在"); }
    if (!stat.isFile()) throw new Error("视频路径不是文件");
    return absolute;
  }
  async updateNote(notePath, label, text, identity = {}) {
    const safeNotePath = safeVaultRelativePath(notePath);
    if (identity.localPath) safeVaultRelativePath(identity.localPath);
    const file = this.vault?.getAbstractFileByPath?.(safeNotePath);
    let fallbackAbsolute = "";
    let content;
    if (this.vault?.read && file) content = await this.vault.read(file);
    else {
      fallbackAbsolute = this.absolutePath(safeNotePath);
      await this.verifyRealVaultPath(fallbackAbsolute);
      content = await fs.promises.readFile(fallbackAbsolute, "utf8");
    }
    const itemToken = transcriptionItemToken({ notePath: safeNotePath, localPath: identity.localPath, mediaId: identity.mediaId, taskKey: identity.taskKey });
    const itemStart = itemToken ? `<!-- multi-source-sync-transcription:item:${itemToken}:start -->` : "";
    const itemEnd = itemToken ? `<!-- multi-source-sync-transcription:item:${itemToken}:end -->` : "";
    const safeLabel = safeHeading(label);
    const safeText = sanitizeTranscript(text).trim() || "本次未识别到明显语音内容";
    const block = `${itemStart ? `${itemStart}\n` : ""}### ${safeLabel}\n\n${safeText}${itemEnd ? `\n${itemEnd}` : ""}`;
    const section = `${START}\n\n## 视频转文字\n\n${block}\n\n${END}`;
    const managed = new RegExp(`${escapeRegExp(START)}[\\s\\S]*?${escapeRegExp(END)}`, "m");
    if (managed.test(content)) {
      const current = content.match(managed)?.[0] || "";
      let updated = current;
      if (itemToken) {
        const itemRe = new RegExp(`${escapeRegExp(itemStart)}[\\s\\S]*?${escapeRegExp(itemEnd)}`, "m");
        updated = itemRe.test(updated) ? updated.replace(itemRe, block) : appendManagedBlock(updated, block);
      } else {
        // Without an identity marker, append rather than replacing a visible
        // heading.  This keeps legacy/user-authored same-name sections safe.
        updated = appendManagedBlock(updated, block);
      }
      content = content.replace(managed, updated);
    } else content = `${content.replace(/\s*$/, "")}\n\n${section}\n`;
    if (this.vault?.modify && file) await this.vault.modify(file, content);
    else {
      fallbackAbsolute ||= this.absolutePath(safeNotePath);
      await this.verifyRealVaultPath(fallbackAbsolute);
      await fs.promises.writeFile(fallbackAbsolute, content, "utf8");
    }
  }
  absolutePath(notePath) {
    const safePath = safeVaultRelativePath(notePath);
    let resolved = "";
    if (this.vault?.adapter?.getFullPath) resolved = this.vault.adapter.getFullPath(safePath);
    else if (this.vault?.adapter?.basePath) resolved = path.join(this.vault.adapter.basePath, safePath);
    if (resolved) {
      const base = this.vault?.adapter?.basePath;
      if (base && !isPathInside(base, resolved)) throw new Error("笔记路径超出 Vault 范围");
      return resolved;
    }
    throw new Error("无法确定 Vault 本地路径，已停止转写写入以避免写入错误目录");
  }
  async verifyRealVaultPath(absolute) {
    const base = this.vault?.adapter?.basePath;
    if (!base || !absolute) return true;
    const realBase = await realpathNearest(String(base));
    const realTarget = await realpathNearest(String(absolute));
    if (!isPathInside(realBase, realTarget)) throw new Error("笔记路径通过符号链接超出 Vault 范围");
    return true;
  }
}
function appendManagedBlock(section, block) {
  const end = new RegExp(`\\s*${escapeRegExp(END)}\\s*$`, "m");
  return String(section).replace(end, `\n\n${block}\n\n${END}`);
}
function transcriptionItemToken({ notePath = "", localPath = "", mediaId = "", taskKey = "" } = {}) {
  if (!localPath && !mediaId && !taskKey) return "";
  return encodeURIComponent(JSON.stringify({ notePath: String(notePath), localPath: String(localPath), mediaId: String(mediaId), taskKey: String(taskKey) }));
}
function safeHeading(value) {
  return String(value || "视频")
    .replace(/[\r\n\u0000-\u001f]+/g, " ")
    .replace(/<!--[\s\S]*?-->/g, "[注释]")
    .replace(/^#+\s*/, "").trim().slice(0, 180) || "视频";
}
function sanitizeTranscript(value) {
  return String(value || "")
    .replace(/<!--\s*multi-source-sync-transcription:(?:start|end)\s*-->/gi, "[插件标记已转义]")
    .replace(/<!--\s*multi-source-sync-transcription:item:[^>]*:(?:start|end)\s*-->/gi, "[插件标记已转义]");
}
function expandHome(value) { return String(value || "").replace(/^~(?=[/\\]|$)/, process.env.HOME || process.env.USERPROFILE || "~"); }
function isRegularFile(value) { try { return fs.statSync(value).isFile(); } catch (_) { return false; } }
function commandWorks(command, args, timeoutMs = TOOL_CHECK_TIMEOUT_MS, options = {}) {
  return new Promise((resolve) => {
    let settled = false;
    let timer;
    let cancelTimer;
    let child;
    let cancelRequested = false;
    const finish = (value) => { if (settled) return; settled = true; if (timer) clearTimeout(timer); if (cancelTimer) clearTimeout(cancelTimer); try { options.activeChildren?.delete?.(child); } catch (_) {} try { options.unregisterCancel?.(cancel); } catch (_) {} resolve(value); };
    const cancel = () => {
      if (settled || cancelRequested) return;
      cancelRequested = true;
      try { child?.kill?.("SIGTERM"); } catch (_) {}
      cancelTimer = setTimeout(() => { try { child?.kill?.("SIGKILL"); } catch (_) {} finish(false); }, 2000);
      cancelTimer.unref?.();
    };
    if (options.isCancelled?.()) return finish(false);
    try { child = spawn(command, args, { windowsHide: true, stdio: "ignore" }); }
    catch (_) { return finish(false); }
    options.activeChildren?.add?.(child);
    try { options.registerCancel?.(cancel); } catch (_) {}
    child.once("error", () => { if (!cancelRequested) finish(false); });
    child.once("close", (code) => finish(!cancelRequested && !options.isCancelled?.() && code === 0));
    timer = setTimeout(() => { try { child.kill?.("SIGTERM"); } catch (_) {} setTimeout(() => { try { child.kill?.("SIGKILL"); } catch (_) {} }, 1000).unref?.(); finish(false); }, Math.max(1, Number(timeoutMs) || TOOL_CHECK_TIMEOUT_MS));
    timer.unref?.();
  });
}
function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    let settled = false;
    let timer;
    let cancelTimer;
    let child;
    let stdout = "";
    let stderr = "";
    const timeoutMs = numberSetting(options.timeoutMs, 0);
    let cancelRequested = false;
    let cancel;
    const removeChild = () => { try { options.activeChildren?.delete?.(child); } catch (_) {} };
    const finishError = (error) => { if (settled) return; settled = true; if (timer) clearTimeout(timer); if (cancelTimer) clearTimeout(cancelTimer); removeChild(); try { options.unregisterCancel?.(cancel); } catch (_) {} reject(error); };
    const cancelAndReject = () => {
      if (settled || cancelRequested) return;
      cancelRequested = true;
      try { child?.kill?.("SIGTERM"); } catch (_) {}
      // Let the normal `close` handler settle the promise after the child has
      // actually exited. This keeps the caller's temp-directory cleanup from
      // racing a still-running FFmpeg/Whisper process. A stubborn child is
      // force-killed and rejected after a bounded grace period.
      cancelTimer = setTimeout(() => {
        try { child?.kill?.("SIGKILL"); } catch (_) {}
        finishError(cancellationError());
      }, 2000);
      cancelTimer.unref?.();
    };
    cancel = cancelAndReject;
    if (options.isCancelled?.()) return finishError(cancellationError());
    try { child = spawn(command, args, { windowsHide: true }); }
    catch (error) { return finishError(error); }
    options.activeChildren?.add?.(child);
    try { options.registerCancel?.(cancel); } catch (_) {}
    child.stdout?.on("data", (chunk) => { stdout = (stdout + String(chunk)).slice(-20_000); });
    child.stderr?.on("data", (chunk) => { stderr = (stderr + String(chunk)).slice(-4_000); });
    child.once("error", (error) => {
      // A kill can emit `error` before `close`; keep the promise pending until
      // close (or the bounded cancel timer) so cleanup never races the child.
      if (cancelRequested) return;
      removeChild();
      finishError(error);
    });
    child.once("close", (code, signal) => {
      removeChild();
      if (settled) return;
      settled = true;
      if (timer) clearTimeout(timer);
      if (cancelTimer) clearTimeout(cancelTimer);
      try { options.unregisterCancel?.(cancel); } catch (_) {}
      if (cancelRequested || options.isCancelled?.()) reject(cancellationError());
      else if (code === 0) resolve(options.capture ? stdout : undefined);
      else reject(new Error(`本地工具执行失败（${code == null ? `signal ${signal || "unknown"}` : code}）：${stderr.slice(-500)}`));
    });
    if (timeoutMs > 0) {
      timer = setTimeout(() => {
        if (settled) return;
        try { child.kill?.("SIGTERM"); } catch (_) {}
        setTimeout(() => { try { child.kill?.("SIGKILL"); } catch (_) {} }, 1500).unref?.();
        removeChild();
        try { options.unregisterCancel?.(cancel); } catch (_) {}
        finishError(new Error("本地视频转写工具执行超时"));
      }, timeoutMs);
      timer.unref?.();
    }
  });
}
function numberSetting(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : fallback;
}
function escapeRegExp(value) { return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
function transcriptionTaskKey({ notePath = "", videoPath = "", localPath = "", mediaId = "", taskKey = "" } = {}) {
  // The persisted media task key is the strongest identity.  Paths can be
  // normalized differently by Obsidian (or change after a user moves a
  // managed file); such changes must not start two Whisper processes for the
  // same logical task.  Calls without a task key still use the complete
  // note/media identity as a conservative fallback.
  if (taskKey) return `task:${String(taskKey)}`;
  return JSON.stringify([String(notePath || ""), String(localPath || ""), String(mediaId || ""), String(videoPath || "")]);
}
function cancellationError() {
  const error = new Error("视频转写任务已取消");
  error.code = "TRANSCRIPTION_CANCELLED";
  return error;
}
function waitForChildExit(child, timeoutMs) {
  return new Promise((resolve) => {
    if (!child || child.exitCode != null || child.signalCode != null) return resolve();
    let timer;
    const done = () => { if (timer) clearTimeout(timer); child.removeListener?.("close", done); child.removeListener?.("error", done); resolve(); };
    child.once?.("close", done);
    child.once?.("error", done);
    timer = setTimeout(done, Math.max(1, Number(timeoutMs) || 2000));
    timer.unref?.();
  });
}
function isPathInside(root, candidate) {
  const relative = path.relative(path.resolve(root), path.resolve(candidate));
  return relative === "" || (relative && relative !== ".." && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative));
}
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
function safeVaultRelativePath(value) {
  const text = String(value || "").replace(/\\/g, "/");
  if (text.includes("\u0000")) throw new Error("笔记路径包含无效字符");
  if (/^[A-Za-z]:\//.test(text) || text.startsWith("//")) throw new Error("笔记路径超出 Vault 范围");
  const normalized = path.posix.normalize(text);
  if (!normalized || normalized === "." || normalized === ".." || normalized.startsWith("../") || normalized.startsWith("/")) throw new Error("笔记路径超出 Vault 范围");
  return normalized;
}

module.exports = { TranscriptionService, START, END, commandWorks, run };
