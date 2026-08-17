const { resourceKey, normalizeItem } = require("./normalized-item");
const { hasSessionValue } = require("./sync-state-store");

class SyncCoordinator {
  constructor({ adapters = {}, stateStore, writer, mediaService, log, notify } = {}) {
    this.adapters = adapters;
    this.stateStore = stateStore;
    this.writer = writer;
    this.mediaService = mediaService;
    this.log = log || (() => {});
    this.notify = notify || (() => {});
    this.running = false;
    this.cancelled = false;
  }
  async syncAll(options = {}) {
    if (this.running) return { status: "already_running", platforms: [] };
    this.running = true; this.cancelled = false;
    this.mediaService?.resetRunBudget?.();
    const result = { status: "completed", platforms: [], startedAt: new Date().toISOString() };
    try {
      // An explicitly supplied empty list means "nothing for this engine";
      // this is used when the legacy RedNote engine handled the whole run.
      // Only an omitted/non-array value falls back to the default new-platform
      // order.
      const platforms = Array.isArray(options.platforms)
        ? options.platforms
        : ["rednote", "bilibili", "douyin"];
      for (const platform of platforms) {
        if (this.cancelled) { result.status = "cancelled"; break; }
        const config = this.stateStore?.platform?.(platform);
        if (!config?.enabled || !config?.syncBookmarks) {
          result.platforms.push({ platform, status: "disabled", processed: 0, written: 0, skipped: 0, failed: 0, mediaQueued: 0 });
          continue;
        }
        // A new platform is enabled by default, but it must stay completely
        // idle until the user has created an account/session for it.
        const hasSession = platformHasSession(config);
        if (platform !== "rednote" && !hasSession && !(platform === "douyin" && config.manualLinks?.length)) {
          result.platforms.push({ platform, status: "not_configured", processed: 0, written: 0, skipped: 0, failed: 0, mediaQueued: 0 });
          continue;
        }
        const adapter = this.adapters?.[platform];
        if (!adapter) {
          result.platforms.push({ platform, status: "unavailable", processed: 0, written: 0, skipped: 0, failed: 0, mediaQueued: 0 });
          continue;
        }
        try {
          const entry = await this.syncPlatform(adapter, options);
          result.platforms.push(entry);
          if (["partial_failed", "failed"].includes(String(entry.status || "")) && result.status === "completed") result.status = "partial_failed";
          if (entry.status === "cancelled") { result.status = "cancelled"; break; }
        }
        catch (error) {
          const classified = classifyAdapterError(adapter, error);
          // A stale session can be present in data.json even though the
          // platform's account probe already knows it is invalid. Report that
          // state as auth_required instead of a generic failed run so the UI
          // can tell the user to re-login without affecting other platforms.
          const accountError = adapter?.lastAccountError;
          const effective = accountError && classified.code === "unknown" ? classifyAdapterError(adapter, accountError) : classified;
          result.platforms.push({ platform, status: "failed", error: effective });
          result.status = result.status === "completed" ? "partial_failed" : result.status;
        }
      }
    } finally { this.running = false; result.finishedAt = new Date().toISOString(); }
    return result;
  }
  cancel() {
    this.cancelled = true;
    // Stop an active media transfer as well as the pagination loop.  The
    // media service cleans temporary files and records `cancelled`; the page
    // checkpoint remains intact so a later run can resume deterministically.
    try { this.mediaService?.cancel?.(); } catch (_) {}
  }
  async syncPlatform(adapter, options = {}) {
    const account = await adapter.prepareSyncRun();
    if (!account?.id) throw new Error(`${adapter.displayName} 未返回稳定账号 ID`);
    const type = "bookmark";
    const requestedLimit = Number(options.limit);
    const pageLimit = Number.isFinite(requestedLimit) && requestedLimit > 0 ? Math.max(1, Math.min(100, Math.floor(requestedLimit))) : 20;
    const platformConfig = this.stateStore?.platform?.(adapter.id) || {};
    const checkpoint = this.stateStore?.getCheckpoint?.(adapter.id, account.id, type) || { cursor: this.stateStore?.getCursor?.(adapter.id, account.id, type), nextItemIndex: 0 };
    let cursor = checkpoint.cursor;
    let resumeItemIndex = checkpoint.resumePage === true ? Math.max(0, Number(checkpoint.nextItemIndex || 0)) : 0;
    const requestedMax = options.maxItems == null ? Infinity : Number(options.maxItems);
    const maxItems = requestedMax === Infinity ? Infinity : Number.isFinite(requestedMax) ? Math.max(0, Math.floor(requestedMax)) : 0;
    let processed = 0, written = 0, skipped = 0, failed = 0, mediaQueued = 0;
    let fatalError = null;
    const seenCursors = new Set();
    while (!this.cancelled && processed < maxItems) {
      if (cursor && seenCursors.has(cursor)) throw new Error("平台分页游标重复，已安全停止");
      if (cursor) seenCursors.add(cursor);
      const rawPage = await adapter.listItems(type, cursor, pageLimit, options);
      const page = normalizePage(rawPage);
      if (!page.items.length && !page.nextCursor) break;
      const pageStartCursor = cursor;
      // If a remote collection shrank or was re-sorted since the previous
      // attempt, a saved in-page index can point past this page.  Replaying
      // the page is safe (writer/media keys are idempotent) and avoids
      // silently skipping a newly visible favourite.
      if (resumeItemIndex > 0 && resumeItemIndex >= page.items.length) resumeItemIndex = 0;
      let processedInPage = 0;
      for (let itemIndex = 0; itemIndex < page.items.length; itemIndex++) {
        const summary = page.items[itemIndex];
        if (itemIndex < resumeItemIndex) continue;
        if (this.cancelled || processed >= maxItems) break;
        let item;
        // `processed` counts attempted items for the run summary, while
        // `processedInPage` tracks the next item that is safe to advance past
        // in the persisted checkpoint.  Authentication/permission failures
        // must remain retryable after the user logs in again, so those items
        // intentionally do not increment the latter counter.
        let advanceCheckpoint = true;
        try {
          item = normalizeItem(await adapter.getItemDetail(summary, type, { ...options, allParts: platformConfig.allParts !== false }));
          // The adapter is the only component allowed to associate a source
          // with an account.  Treat a mismatched identity as a platform-wide
          // safety failure instead of letting a stale browser session write
          // another account's content into the current account directory.
          // This also protects against a protocol response that accidentally
          // omits `platform` and falls back to a default identity.
          if (item.platform !== adapter.id || String(item.accountId || "") !== String(account.id || "")) {
            const error = new Error("平台返回的内容账号与当前登录账号不一致，已停止本平台同步");
            error.platformCode = "ACCOUNT_MISMATCH";
            error.sourceId = item.sourceId || summary?.sourceId || "";
            throw error;
          }
          if (this.cancelled) {
            await this.saveCheckpoint(adapter, account, type, cursor, {
              processed,
              pageStartCursor: pageStartCursor == null ? null : pageStartCursor,
              nextItemIndex: itemIndex,
              resumePage: true,
            });
            break;
          }
          const key = resourceKey(item);
          const writeResult = await this.writer?.write(item);
          if (this.cancelled) {
            // The note may already have been written, but media resolution or
            // enqueueing can still be incomplete. Replay this idempotent item
            // next run so a stop cannot strand a pending video forever.
            await this.saveCheckpoint(adapter, account, type, cursor, {
              processed,
              pageStartCursor: pageStartCursor == null ? null : pageStartCursor,
              nextItemIndex: itemIndex,
              resumePage: true,
            });
            break;
          }
          if (writeResult?.skipped) skipped++;
          else written++;
          await this.saveCheckpoint(adapter, account, type, cursor, { lastResourceKey: key, processed: processed + 1, pageStartCursor, nextItemIndex: itemIndex + 1 });
          // Never mutate a pre-existing, user-owned file.  When the writer
          // encounters one it creates a managed conflict copy and returns
          // that copy's path; the copy is still a first-class plugin note and
          // must receive its media tasks now (otherwise a video would remain
          // a remote link forever and there would be no task for the retry
          // command to discover).  Managed notes remain eligible for the
          // same idempotent media backfill on later runs.
          if (!writeResult?.skipped && this.mediaService && item.media?.length) {
            const resolved = await adapter.resolveMedia(item, { quality: platformConfig.quality || "standard", allParts: platformConfig.allParts !== false });
            for (const media of resolved) {
              // `saveVideo` controls video files only.  Images and image
              // carousels remain eligible for local media storage even when
              // the user chooses to keep videos as remote links.
              if (media.kind === "video" && platformConfig.saveVideo === false) continue;
              const task = await this.mediaService.enqueue(item, media, { notePath: writeResult?.path || "" });
              const target = item.media.find((entry) => entry.id === media.id);
              if (target) { target.localPath = task.localPath || ""; target.status = task.status; target.error = task.error || ""; }
              await this.writer?.write(item);
              mediaQueued++;
            }
          }
          if (this.cancelled) {
            await this.saveCheckpoint(adapter, account, type, cursor, {
              processed,
              pageStartCursor: pageStartCursor == null ? null : pageStartCursor,
              nextItemIndex: itemIndex,
              resumePage: true,
            });
            break;
          }
        } catch (error) {
          failed++;
          const classified = classifyAdapterError(adapter, error);
          this.log("item_sync_failed", { platform: adapter.id, sourceId: summary?.sourceId || summary?.bvid || "", error: sanitizeError(error), code: classified.code });
          // Keep the page moving so one withdrawn/private item does not
          // prevent the remaining favourites from being synchronized.
          const fatal = ["auth_required", "forbidden", "invalid_source", "account_mismatch"].includes(String(classified.code || ""));
          await this.saveCheckpoint(adapter, account, type, cursor, {
            lastError: sanitizeError(error),
            lastErrorCode: classified.code,
            failedSourceId: summary?.sourceId || summary?.bvid || "",
            processed: processed + 1,
            pageStartCursor: pageStartCursor == null ? null : pageStartCursor,
            nextItemIndex: fatal ? itemIndex : itemIndex + 1,
            resumePage: fatal,
          });
          // Authentication and explicit permission failures are platform-wide
          // conditions. Stop this platform immediately, preserve the current
          // page/index checkpoint, and let other platforms continue normally.
          if (fatal) {
            fatalError = classified;
            advanceCheckpoint = false;
            break;
          }
        }
        processed++;
        if (advanceCheckpoint) processedInPage++;
        this.notify(`${adapter.displayName}：已处理 ${processed} 条收藏`);
      }
      const interrupted = this.cancelled || Boolean(fatalError) || processed >= maxItems;
      const nextResumeIndex = resumeItemIndex + processedInPage;
      // `processedInPage` excludes entries already skipped while resuming a
      // partially processed page.  Compare the absolute next index instead;
      // otherwise hitting maxItems exactly on the final entry would keep the
      // old page cursor forever and replay the whole page on every run.
      // A fatal auth/permission error happens before the failed item is
      // counted as processed. Even when it is the final item on this page,
      // keep the page-start cursor and current index so a later re-login can
      // retry it instead of silently advancing past the item.
      const pageWasCutShort = interrupted && (Boolean(fatalError) || nextResumeIndex < page.items.length);
      // If maxItems cut a page short, retain the page-start cursor so the
      // remaining entries are not skipped after a restart. Reprocessing the
      // page is safe because resourceKey-based paths are idempotent.
      cursor = pageWasCutShort ? pageStartCursor : (page.hasMore ? page.nextCursor : undefined);
      resumeItemIndex = pageWasCutShort ? nextResumeIndex : 0;
      await this.saveCheckpoint(adapter, account, type, cursor, {
        processed,
        // `null` is intentional for the first page: unlike `undefined`, it
        // survives JSON persistence and distinguishes an in-page resume from
        // a completed scan that happens to have no remote cursor.
        pageStartCursor: pageStartCursor == null ? null : pageStartCursor,
        nextItemIndex: pageWasCutShort ? resumeItemIndex : 0,
        resumePage: pageWasCutShort,
      });
      if (this.cancelled || fatalError || !page.hasMore || !cursor) break;
    }
    return { platform: adapter.id, accountId: account.id, status: this.cancelled ? "cancelled" : (fatalError ? "failed" : (failed ? "partial_failed" : "completed")), error: fatalError || undefined, processed, written, skipped, failed, mediaQueued, cursor: cursor || null };
  }
  async saveCheckpoint(adapter, account, type, cursor, extra = {}) {
    if (!this.stateStore?.setCursor) return;
    try {
      await this.stateStore.setCursor(adapter.id, account.id, type, cursor, extra);
    } catch (error) {
      // A persistence error must be visible, but should not turn a successfully
      // written note into a false item failure.  The next run can reprocess the
      // idempotent resource; retaining this warning in logs is safer than
      // masking the original note/media result.
      this.log("checkpoint_persist_failed", { platform: adapter.id, error: sanitizeError(error) });
    }
  }
}

function sanitizeError(error) { return String(error?.message || error || "同步失败").replace(/https?:\/\/\S+/g, "[url]").slice(0, 500); }

function normalizePage(page) {
  const value = page && typeof page === "object" ? page : {};
  const items = Array.isArray(value.items) ? value.items : [];
  const nextCursor = value.nextCursor == null || value.nextCursor === "" ? undefined : String(value.nextCursor);
  const explicit = parseBooleanFlag(value.hasMore);
  return { items, nextCursor, hasMore: explicit === undefined ? Boolean(nextCursor) : explicit && Boolean(nextCursor) };
}

function parseBooleanFlag(value) {
  if (value === undefined || value === null) return undefined;
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (/^(?:false|0|no|off|n)$/.test(normalized)) return false;
    if (/^(?:true|1|yes|on|y)$/.test(normalized)) return true;
  }
  return Boolean(value);
}

function classifyAdapterError(adapter, error) {
  if (String(error?.platformCode || "").toUpperCase() === "ACCOUNT_MISMATCH") {
    return { code: "account_mismatch", message: "平台返回内容与当前账号不一致，已停止本平台同步", retryable: false };
  }
  try {
    const classified = adapter?.classifyError?.(error);
    if (classified && typeof classified === "object") return classified;
  } catch (_) {}
  return { code: "unknown", message: sanitizeError(error), retryable: false };
}

function platformHasSession(config) {
  if (!config || typeof config !== "object") return false;
  if (hasSessionValue(config.session)) return true;
  const activeId = String(config.activeAccountId || config.account?.id || "").trim();
  if (activeId && hasSessionValue(config.accounts?.[activeId]?.session)) return true;
  // Do not look at arbitrary registry entries here.  After the user logs out
  // the active account is intentionally cleared while other accounts remain
  // stored; starting one of those implicitly would surprise the user and can
  // run the wrong account's sync.  Normal migration promotes a valid entry to
  // activeAccountId before this check.
  return false;
}

module.exports = { SyncCoordinator, platformHasSession };
