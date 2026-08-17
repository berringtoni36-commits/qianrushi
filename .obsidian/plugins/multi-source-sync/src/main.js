const { SyncStateStore, migrateState, hasSessionValue, hasAccountId } = require("./core/sync-state-store");
const { normalizeItem } = require("./core/normalized-item");
const { createCapabilityService } = require("./core/entitlement");
const { SyncCoordinator } = require("./core/sync-coordinator");
const { ObsidianWriter } = require("./storage/obsidian-writer");
const { MediaService } = require("./media/media-service");
const { TranscriptionService } = require("./transcription/transcription-service");
const { BilibiliAdapter } = require("./adapters/bilibili-adapter");
const { DouyinAdapter } = require("./adapters/douyin-adapter");
const { MultiPlatformSettingTab } = require("./ui/multi-platform-settings");
const fs = require("fs");
const path = require("path");

function installMultiPlatformExtension(PluginClass, obsidian) {
  const Base = PluginClass;
  return class MultiPlatformPlugin extends Base {
    constructor(...args) { super(...args); this.multiPlatformReady = false; this.multiInitPromise = null; this.multiSyncPromise = null; this.multiMediaRetryPromise = null; this.multiTranscriptionPromise = null; this._baseLoading = false; this.multiStopRequested = false; this._mssNoticeObserver = null; this._mssHiddenNotices = new Map(); }
    async saveData(value) {
      const input = value && typeof value === "object" && !Array.isArray(value) ? value : {};
      const state = this.multiState?.get?.();
      if (!state || typeof super.saveData !== "function") return super.saveData?.(input);
      // Legacy RedNote code may save after the extension has initialized.
      // Preserve the extension-owned schema 3 fields across that write rather
      // than allowing a late legacy save to revert data.json to its old shape.
      const merged = {
        ...input,
        settingsSchemaVersion: 3,
        platforms: { ...(input.platforms || {}), ...(state.platforms || {}) },
        syncState: { ...(input.syncState || {}), ...(state.syncState || {}) },
        mediaTasks: { ...(input.mediaTasks || {}), ...(state.mediaTasks || {}) },
        transcriptionTasks: { ...(input.transcriptionTasks || {}), ...(state.transcriptionTasks || {}) },
        media: { ...(input.media || {}), ...(state.media || {}) },
        resourcePaths: { ...(input.resourcePaths || {}), ...(state.resourcePaths || {}) },
        resourceMeta: { ...(input.resourceMeta || {}), ...(state.resourceMeta || {}) },
        transcription: { ...(input.transcription || {}), ...(state.transcription || {}) },
        notifications: { ...(input.notifications || {}), ...(state.notifications || {}) },
      };
      return super.saveData(merged);
    }
    async onload(...args) {
      this.installNotificationGate();
      this._baseLoading = true;
      // Keep the legacy bootstrap (settings, ribbon, and existing commands)
      // intact, but do not let a legacy environment-specific exception stop
      // the readable multi-platform extension from loading.
      try { await super.onload(...args); }
      catch (error) {
        this.multiLegacyLoadError = error;
        try { console.warn("[MultiSourceSync] legacy bootstrap failed; continuing with multi-platform extension", error); } catch (_) {}
      }
      finally { this._baseLoading = false; }
      try { await this.initializeMultiPlatformExtension(); }
      catch (error) {
        this.multiInitError = error;
        try {
          const logDir = path.join(__dirname, "..", "logs");
          fs.mkdirSync(logDir, { recursive: true });
          const message = String(error?.stack || error?.message || error || "unknown initialization error")
            .replace(/(?:Cookie|Authorization|token|签名)[^\n]*/gi, "[redacted]")
            .slice(0, 4000);
          fs.appendFileSync(path.join(logDir, "bridge-error.log"), `[${new Date().toISOString()}] multi-platform init failed\n${message}\n`, "utf8");
        } catch (_) {}
        this.multiNotify?.(`多平台扩展初始化失败：${error.message || error}`, "error");
        try { console.error("[MultiSourceSync] multi-platform initialization failed", error); } catch (_) {}
      }
    }
    async loadSettings(...args) {
      try { return await super.loadSettings?.(...args); }
      catch (error) {
        this.multiLegacySettingsError = error;
        try { console.warn("[MultiSourceSync] legacy settings bootstrap failed; using preserved data", error); } catch (_) {}
        return undefined;
      }
    }
    async loadData(...args) {
      try {
        const value = await super.loadData?.(...args);
        return value || {};
      } catch (error) {
        this.multiDataLoadError = error;
        try { console.warn("[MultiSourceSync] legacy data load failed; using empty legacy settings", error); } catch (_) {}
        return {};
      }
    }
    async syncNow(...args) {
      if (!this.multiPlatformReady) {
        if (this._baseLoading) return typeof Base.prototype.syncNow === "function" ? Base.prototype.syncNow.apply(this, args) : undefined;
        if (this.multiInitPromise) { try { await this.multiInitPromise; } catch (_) {} }
        if (!this.multiPlatformReady) return typeof Base.prototype.syncNow === "function" ? Base.prototype.syncNow.apply(this, args) : undefined;
      }
      if (this._runningLegacyRednote) return typeof Base.prototype.syncNow === "function" ? Base.prototype.syncNow.apply(this, args) : undefined;
      return this.syncMultiPlatforms({ legacyArgs: args });
    }
    onunload(...args) {
      this.removeNotificationGate();
      this.multiCoordinator?.cancel();
      this.transcriptionService?.destroy?.();
      this.mediaService?.cancel?.();
      Object.values(this.adapters || {}).forEach((adapter) => adapter.destroy?.());
      return super.onunload?.(...args);
    }
    async initializeMultiPlatformExtension() {
      if (this.multiPlatformReady) return;
      if (this.multiInitPromise) return this.multiInitPromise;
      this.multiInitPromise = this._initializeMultiPlatformExtension();
      try { return await this.multiInitPromise; } finally { this.multiInitPromise = null; }
    }
    async _initializeMultiPlatformExtension() {
      const saved = await this.loadData();
      let cachedSettings = saved || {};
      this.multiState = new SyncStateStore(migrateState(saved), async (state) => {
        const legacy = cachedSettings || {};
        cachedSettings = { ...legacy, ...state, platforms: { ...(legacy?.platforms || {}), ...state.platforms }, syncState: { ...(legacy?.syncState || {}), ...state.syncState } };
        await this.saveData(cachedSettings);
      });
      const stateNeedsRepair = needsCanonicalStateRepair(saved, this.multiState.get());
      if (!saved?.settingsSchemaVersion || Number(saved.settingsSchemaVersion) < 3) {
        try { await backupDataFile(this); } catch (error) { this.multiLog?.("migration_backup_failed", { error: String(error?.message || error) }); }
        try {
          const migrated = this.multiState.get();
          const migrationPayload = { ...(saved || {}), settingsSchemaVersion: 3, platforms: migrated.platforms, syncState: migrated.syncState, mediaTasks: migrated.mediaTasks, transcriptionTasks: migrated.transcriptionTasks, media: migrated.media, resourcePaths: migrated.resourcePaths, resourceMeta: migrated.resourceMeta, transcription: migrated.transcription, notifications: migrated.notifications };
          await this.saveData(migrationPayload);
          // Some Obsidian 1.x plugin hosts call the legacy prototype's save
          // method directly during shutdown/startup, bypassing an overridden
          // instance method.  Persist the same migration atomically through
          // the known plugin data path as a final compatibility fallback.  It
          // reads the file again first, preserves unknown legacy fields, and
          // never touches Markdown, media, or login partitions.
          await persistMigrationFile(this, migrated, migrationPayload);
          cachedSettings = { ...(saved || {}), settingsSchemaVersion: 3, platforms: migrated.platforms, syncState: migrated.syncState, mediaTasks: migrated.mediaTasks, transcriptionTasks: migrated.transcriptionTasks, media: migrated.media, resourcePaths: migrated.resourcePaths, resourceMeta: migrated.resourceMeta, transcription: migrated.transcription, notifications: migrated.notifications };
        } catch (error) { this.multiMigrationError = error; }
      }
      // Schema-3 files created by an older extension can still contain empty
      // `{}` placeholders for a logged-out account/session.  The in-memory
      // migration already treats those as null; persist the harmless repair
      // once so a restart cannot regress to the truthy-placeholder bug. A
      // backup is created before the write just like the version migration.
      if (stateNeedsRepair && saved?.settingsSchemaVersion && Number(saved.settingsSchemaVersion) >= 3) {
        try {
          await backupDataFile(this);
          await this.multiState.save();
        } catch (error) { this.multiStateRepairError = error; }
      }
      this.capabilities = createCapabilityService();
      this.multiLog = (event, details) => {
        if (this.multiState?.get?.()?.notifications?.writeLog === false) return;
        try { this.getSyncLogger?.().log?.(`[multi-platform] ${event}`, details); } catch (_) {}
      };
      const notify = (message, level = "status") => {
        const settings = this.multiState?.get?.()?.notifications || {};
        const mode = ["all", "errors", "off"].includes(String(settings.level)) ? String(settings.level) : "all";
        const text = String(message ?? "");
        if (!shouldShowNotification({ level: mode }, text, level)) return false;
        try { if (obsidian.Notice) new obsidian.Notice(text); } catch (_) {}
        return true;
      };
      this.multiNotify = notify;
      const context = { stateStore: this.multiState, notify: (message) => notify(message, "error"), log: this.multiLog };
      this.adapters = { bilibili: new BilibiliAdapter(context), douyin: new DouyinAdapter(context) };
      const transcriptionSettings = this.multiState.get().transcription || saved?.transcription || {};
      const mediaSettings = this.multiState.get().media || {};
      this.mediaService = new MediaService({ vault: this.app.vault, stateStore: this.multiState, root: "", ffmpegPath: transcriptionSettings.ffmpegPath || "", adapters: this.adapters, maxFileBytes: gigabytes(mediaSettings.maxFileGB, 2), runBudgetBytes: gigabytes(mediaSettings.runBudgetGB, 5), accountBudgetBytes: gigabytes(mediaSettings.accountBudgetGB, 50), notify, log: this.multiLog });
      this.writer = new ObsidianWriter({ vault: this.app.vault, stateStore: this.multiState, root: "" });
      this.multiCoordinator = new SyncCoordinator({ adapters: this.adapters, stateStore: this.multiState, writer: this.writer, mediaService: this.mediaService, notify: (message, level) => this.multiNotify?.(message, level), log: this.multiLog });
      this.transcriptionService = new TranscriptionService({ vault: this.app.vault, stateStore: this.multiState, settings: transcriptionSettings, notify, log: this.multiLog });
      // Keep legacy spelling and the new spelling synchronized in memory so
      // both the historical settings UI and the shared service see the same
      // executable path after an upgrade.
      if (!this.transcriptionService.settings.whisperPath && this.transcriptionService.settings.whisperCliPath) this.transcriptionService.settings.whisperPath = this.transcriptionService.settings.whisperCliPath;
      if (!this.transcriptionService.settings.whisperCliPath && this.transcriptionService.settings.whisperPath) this.transcriptionService.settings.whisperCliPath = this.transcriptionService.settings.whisperPath;
      this.addSettingTab(new MultiPlatformSettingTab(this.app, this, obsidian));
      this.addCommand({ id: "sync-all-platform-favorites", name: "立即同步全部平台收藏", callback: () => this.syncMultiPlatforms() });
      this.addCommand({ id: "sync-bilibili-favorites", name: "同步 B站收藏", callback: () => this.syncMultiPlatforms({ platforms: ["bilibili"] }) });
      this.addCommand({ id: "sync-douyin-favorites", name: "同步抖音收藏", callback: () => this.syncMultiPlatforms({ platforms: ["douyin"] }) });
      this.addCommand({ id: "transcribe-current-multi-platform-video", name: "转写当前多平台笔记视频", callback: () => this.transcribeCurrentMultiPlatformVideo() });
      this.addCommand({ id: "transcribe-pending-multi-platform-videos", name: "转写所有平台未处理视频", callback: () => this.transcribePendingMultiPlatformVideos() });
      this.addCommand({ id: "retry-multi-platform-transcriptions", name: "重试多平台失败转写", callback: () => this.retryFailedTranscriptions() });
      this.addCommand({ id: "retry-multi-platform-media", name: "重试多平台失败媒体", callback: () => this.retryMultiPlatformMedia() });
      this.addCommand({ id: "download-current-multi-platform-video", name: "下载当前笔记视频", callback: () => this.downloadCurrentMultiPlatformVideo() });
      this.addCommand({ id: "refresh-multi-platform-overview", name: "刷新多平台内容总览", callback: () => this.refreshMultiPlatformOverview() });
      this.addCommand({ id: "rescan-multi-platform-notes", name: "重新扫描插件管理笔记", callback: () => this.rescanMultiPlatformNotes() });
      this.addCommand({ id: "refresh-multi-platform-accounts", name: "刷新平台账号", callback: () => this.refreshMultiPlatformAccounts() });
      this.addCommand({ id: "check-multi-platform-connections", name: "检查多平台连接", callback: () => this.checkMultiPlatformConnections() });
      this.multiPlatformReady = true;
      this.refreshNotificationVisibility();
      // Existing legacy data is intentionally migrated only after the new
      // engine has been constructed successfully.  This guarantees that a
      // plugin upgrade never leaves data.json in an ambiguous half-migrated
      // state when an adapter or UI dependency fails during startup.
    }
    async syncMultiPlatforms(options = {}) {
      if (this.multiSyncPromise) return this.multiSyncPromise;
      this.multiStopRequested = false;
      this.multiSyncPromise = (async () => {
        if (!this.multiCoordinator) await this.initializeMultiPlatformExtension();
        if (!this.multiCoordinator) throw new Error("多平台同步引擎未初始化");
      const selected = options.platforms;
        let legacyResult;
        if ((!selected || selected.includes("rednote")) && this.multiState.platform("rednote")?.enabled !== false) {
          try {
            this._runningLegacyRednote = true;
            if (typeof Base.prototype.syncNow === "function") legacyResult = await Base.prototype.syncNow.apply(this, options.legacyArgs || []);
          }
          catch (error) {
            legacyResult = { status: "failed", error: { message: sanitizeLocalError(error) } };
            this.multiNotify?.(`小红书同步失败：${error.message || error}`, "error");
          }
          finally { this._runningLegacyRednote = false; }
        }
        // RedNote remains owned by the historical engine for compatibility;
        // the readable coordinator currently owns only the new platforms.
        // Excluding it here prevents a harmless missing RedNote adapter from
        // being reported as an error after the legacy sync has succeeded.
        const coordinatorOptions = { ...options };
        if (Array.isArray(selected)) coordinatorOptions.platforms = selected.filter((id) => id !== "rednote");
        else coordinatorOptions.platforms = ["bilibili", "douyin"];
        // The legacy RedNote engine cannot be interrupted by the new
        // coordinator. If the user pressed Stop while that phase was still
        // running, do not start the new-platform phase after it returns.
        if (this.multiStopRequested) {
          const stopped = { status: "cancelled", platforms: [], startedAt: new Date().toISOString(), finishedAt: new Date().toISOString() };
          if (legacyResult) stopped.legacyRednote = legacyResult;
          return stopped;
        }
        const result = await this.multiCoordinator.syncAll(coordinatorOptions);
        if (legacyResult) result.legacyRednote = legacyResult;
        const summaryEntries = [];
        if (legacyResult) {
          const legacyStatus = legacyResult.status || "completed";
          const legacyProcessed = Number(legacyResult.processed ?? legacyResult.saved ?? legacyResult.synced ?? legacyResult.newItems ?? 0);
          summaryEntries.push(legacyStatus === "failed" || legacyStatus === "partial_failed"
            ? `小红书：${legacyResult.error?.message || "部分失败"}`
            : `小红书 ${Number.isFinite(legacyProcessed) && legacyProcessed > 0 ? legacyProcessed : "已完成"} 条`);
        }
        summaryEntries.push(...result.platforms.map((entry) => {
          const title = entry.platform || "平台";
          if (entry.status === "failed" || entry.status === "partial_failed") return `${title}：${entry.error?.message || `部分失败（${entry.failed || 0}）`}`;
          if (entry.status === "disabled") return `${title}：已关闭`;
          if (entry.status === "not_configured") return `${title}：未登录`;
          if (entry.status === "unavailable") return `${title}：适配器不可用`;
          if (entry.status === "cancelled") return `${title}：已停止（断点已保存）`;
          return `${title} ${entry.processed || 0} 条`;
        }));
        const summary = summaryEntries.join("；");
      const legacyFailed = legacyResult && (legacyResult.status === "failed" || legacyResult.status === "partial_failed");
      if (legacyFailed && result.status === "completed") result.status = "partial_failed";
      this.refreshMultiPlatformStatus();
      const statusText = result.status === "cancelled" ? "多平台同步已停止" : result.status === "partial_failed" ? "多平台同步部分完成" : "多平台同步完成";
      this.multiNotify?.(`${statusText}：${summary || "新平台没有需要同步的内容"}`, result.status === "partial_failed" ? "error" : "status");
      this.refreshMultiPlatformSettingTab();
      return result;
      })();
      try { return await this.multiSyncPromise; } finally { this.multiSyncPromise = null; this.multiStopRequested = false; }
    }
    async stopMultiPlatformSync() {
      this.multiStopRequested = true;
      this.multiCoordinator?.cancel?.();
      this.multiNotify?.("已请求停止多平台同步；当前请求结束后会保存断点");
      return true;
    }
    async transcribeCurrentMultiPlatformVideo() {
      if (this.multiTranscriptionPromise) { this.multiNotify?.("已有转写任务正在运行，请等待当前批次完成"); return 0; }
      this.multiTranscriptionPromise = this._transcribeCurrentMultiPlatformVideo();
      try { return await this.multiTranscriptionPromise; } finally { this.multiTranscriptionPromise = null; }
    }
    async _transcribeCurrentMultiPlatformVideo() {
      const active = this.app.workspace?.getActiveFile?.();
      if (!active) return this.multiNotify?.("请先打开需要转写的视频笔记");
      const content = await this.app.vault.read(active);
      // Keep the complete embed identity (including the optional media
      // marker).  Matching by basename alone is unsafe when a note contains
      // multiple parts with the same title, or when two sources use the same
      // generated filename.
      const local = extractVideoEmbeds(content);
      if (!local.length) return this.multiNotify?.("当前笔记没有本地视频；请先开启保存视频到本地");
      if (!this.transcriptionService) return this.multiNotify?.("视频转文字服务尚未初始化，请重新加载插件");
      let completed = 0, skipped = 0, failed = 0;
      const seenTasks = new Set();
      for (const video of local) {
        const resolved = resolveVaultFile(this.app, video.link, active.path); if (!resolved) { skipped++; continue; }
        const safeResolvedPath = safeManagedVaultPath(resolved.path);
        const videoPath = safeResolvedPath && (this.app.vault.adapter?.getFullPath?.(safeResolvedPath) || (this.app.vault.adapter?.basePath && require("path").join(this.app.vault.adapter.basePath, safeResolvedPath)));
        if (!videoPath || !isInsideVault(this.app, videoPath, safeResolvedPath) || !fs.existsSync(videoPath)) { skipped++; continue; }
        const task = findExactMediaTask(this.multiState.get(), {
          notePath: active.path,
          localPath: resolved.path,
          marker: video.marker,
        });
        // If state contains more than one possible media task and the embed
        // has no identity marker, do not guess.  A skipped item is safer than
        // writing one video's transcript into another video's section.
        if (!task) { skipped++; continue; }
        if (seenTasks.has(task.key) || this.multiState.get().transcriptionTasks?.[task.key]?.status === "completed") { skipped++; continue; }
        seenTasks.add(task.key);
        try {
          await this.transcriptionService.transcribeVideo({ notePath: active.path, localPath: safeResolvedPath, mediaId: task.mediaId || task.media?.id, taskKey: task.key, videoPath, label: video.label || require("path").basename(safeResolvedPath), timestamps: Boolean(this.multiState.get().transcription?.timestamps) });
          await this.multiState.setTranscriptionTask(task.key, { status: "completed", notePath: active.path, localPath: safeResolvedPath, mediaId: task.mediaId || task.media?.id, error: "" });
          completed++;
        } catch (error) {
          failed++;
          const status = error?.code === "TRANSCRIPTION_CANCELLED" ? "cancelled" : "failed";
          await this.multiState.setTranscriptionTask(task.key, { status, notePath: active.path, localPath: safeResolvedPath, mediaId: task.mediaId || task.media?.id, error: sanitizeLocalError(error) });
        }
        await this.refreshTranscriptFrontmatter(active.path);
      }
      this.multiNotify?.(`已转写 ${completed} 个视频${failed ? `，失败 ${failed} 个` : ""}${skipped ? `，跳过 ${skipped} 个` : ""}`);
    }
    async transcribePendingMultiPlatformVideos() {
      if (this.multiTranscriptionPromise) return this.multiTranscriptionPromise;
      this.multiTranscriptionPromise = this._transcribePendingMultiPlatformVideos();
      try { return await this.multiTranscriptionPromise; } finally { this.multiTranscriptionPromise = null; }
    }
    async _transcribePendingMultiPlatformVideos({ onlyKeys = null } = {}) {
      if (!this.multiState) await this.initializeMultiPlatformExtension();
      if (!this.multiState || !this.transcriptionService) return this.multiNotify?.("视频转文字服务尚未初始化，请重新加载插件");
      const pending = Object.values(this.multiState.get().mediaTasks || {}).filter((task) => task.status === "completed" && task.localPath && this.multiState.get().transcriptionTasks?.[task.key]?.status !== "completed" && (!onlyKeys || onlyKeys.has(String(task.key))));
      let completed = 0;
      for (const task of pending) {
        const note = (task.notePath && this.app.vault.getAbstractFileByPath?.(task.notePath));
        if (!note || String(note.extension || "md").toLowerCase() !== "md") continue;
        const safeLocal = safeManagedVaultPath(task.localPath);
        const videoPath = safeLocal && (this.app.vault.adapter?.getFullPath?.(safeLocal) || (this.app.vault.adapter?.basePath && require("path").join(this.app.vault.adapter.basePath, safeLocal)));
        if (!videoPath || !isInsideVault(this.app, videoPath, safeLocal) || !fs.existsSync(videoPath)) {
          await this.multiState.setTranscriptionTask(task.key, { status: "failed", notePath: note.path, localPath: safeLocal || task.localPath, mediaId: task.mediaId || task.media?.id, error: "本地视频文件不存在或路径超出 Vault 范围" });
          await this.refreshTranscriptFrontmatter(note.path);
          continue;
        }
        try {
          await this.transcriptionService.transcribeVideo({ notePath: note.path, localPath: safeLocal, mediaId: task.mediaId || task.media?.id, taskKey: task.key, videoPath, label: task.media?.title || require("path").basename(safeLocal), timestamps: Boolean(this.multiState.get().transcription?.timestamps) });
          await this.multiState.setTranscriptionTask(task.key, { status: "completed", notePath: note.path, localPath: safeLocal, mediaId: task.mediaId || task.media?.id, error: "" });
          await this.refreshTranscriptFrontmatter(note.path); completed++;
        } catch (error) {
          const status = error?.code === "TRANSCRIPTION_CANCELLED" ? "cancelled" : "failed";
          await this.multiState.setTranscriptionTask(task.key, { status, notePath: note.path, localPath: safeLocal, mediaId: task.mediaId || task.media?.id, error: sanitizeLocalError(error) });
          await this.refreshTranscriptFrontmatter(note.path);
        }
      }
      const failed = Object.values(this.multiState.get().transcriptionTasks || {}).filter((task) => task && task.status === "failed").length;
      this.multiNotify?.(`已转写 ${completed} 个待处理视频${failed ? `，仍有 ${failed} 个失败任务可重试` : ""}`);
      this.refreshMultiPlatformStatus();
      this.refreshMultiPlatformSettingTab();
      return completed;
    }
    async retryFailedTranscriptions() {
      if (this.multiTranscriptionPromise) { this.multiNotify?.("已有转写任务正在运行，请等待当前批次完成"); return 0; }
      this.multiTranscriptionPromise = this._retryFailedTranscriptions();
      try { return await this.multiTranscriptionPromise; } finally { this.multiTranscriptionPromise = null; }
    }
    async _retryFailedTranscriptions() {
      if (!this.multiState) await this.initializeMultiPlatformExtension();
      const failed = Object.values(this.multiState.get().transcriptionTasks || {}).filter((task) => task && ["failed", "cancelled"].includes(String(task.status || "")));
      if (!failed.length) { this.multiNotify?.("没有可重试的转写失败或已取消任务"); return 0; }
      let queued = 0;
      const onlyKeys = new Set();
      for (const task of failed) {
        if (!task.notePath || !task.localPath) continue;
        const file = this.app.vault?.getAbstractFileByPath?.(task.notePath);
        if (!file) continue;
        try {
          const safeLocal = safeManagedVaultPath(task.localPath);
          const full = safeLocal && (this.app.vault.adapter?.getFullPath?.(safeLocal) || (this.app.vault.adapter?.basePath && path.join(this.app.vault.adapter.basePath, safeLocal)));
          if (!full || !isInsideVault(this.app, full, safeLocal) || !fs.existsSync(full)) continue;
          await this.multiState.setTranscriptionTask(task.key, { status: "pending", error: "" });
          onlyKeys.add(String(task.key));
          queued++;
        } catch (_) {}
      }
      const completedBefore = Object.values(this.multiState.get().transcriptionTasks || {}).filter((task) => task?.status === "completed").length;
      if (onlyKeys.size) await this._transcribePendingMultiPlatformVideos({ onlyKeys });
      const completedAfter = Object.values(this.multiState.get().transcriptionTasks || {}).filter((task) => task?.status === "completed").length;
      this.multiNotify?.(`已重试 ${queued} 个转写任务，新增完成 ${Math.max(0, completedAfter - completedBefore)} 个`);
      return queued;
    }
    async retryMultiPlatformMedia() {
      if (this.multiMediaRetryPromise) return this.multiMediaRetryPromise;
      if (this.multiCoordinator?.running) { this.multiNotify?.("同步正在进行，请等待同步完成后再重试媒体"); return []; }
      this.multiMediaRetryPromise = (async () => {
        this.mediaService?.resetRunBudget?.();
        const tasks = await this.mediaService.retryFailed();
        for (const task of tasks) await this.writer?.updateMediaTask?.(task);
        this.multiNotify?.(`媒体重试完成：${tasks.filter((task) => task.status === "completed").length} 个成功，${tasks.filter((task) => task.status !== "completed").length} 个仍需处理`);
        this.refreshMultiPlatformStatus();
        this.refreshMultiPlatformSettingTab();
        return tasks;
      })();
      try { return await this.multiMediaRetryPromise; } finally { this.multiMediaRetryPromise = null; }
    }
    async checkMultiPlatformConnections() {
      if (!this.multiState) await this.initializeMultiPlatformExtension();
      const result = {};
      for (const id of ["bilibili", "douyin"]) {
        const adapter = this.adapters?.[id];
        // A connection check is an explicit user request. Do not report a
        // stale cached account as healthy; adapters that support validation
        // must perform a fresh probe and classify an expired session.
        try { result[id] = adapter?.getAccount ? await adapter.getAccount({ validate: true, force: true }) : null; }
        catch (error) { result[id] = { error: sanitizeLocalError(error) }; }
      }
      const message = `连接检查：B站 ${result.bilibili?.id ? "已连接" : "未连接"}；抖音 ${result.douyin?.id ? "已连接" : "未连接"}`;
      this.multiNotify?.(message);
      return result;
    }
    async downloadCurrentMultiPlatformVideo() {
      if (!this.multiState) await this.initializeMultiPlatformExtension();
      const active = this.app.workspace?.getActiveFile?.();
      if (!active) return this.multiNotify?.("请先打开需要下载视频的笔记");
      if (!this.mediaService) return this.multiNotify?.("媒体服务尚未初始化，请重新加载插件");
      this.mediaService.resetRunBudget?.();
      const tasks = Object.values(this.multiState.get().mediaTasks || {}).filter((task) => task && task.notePath === active.path && task.media?.kind === "video");
      if (!tasks.length) {
        const rebuilt = await this._buildMediaTasksForCurrentNote(active);
        if (!rebuilt.length) return this.multiNotify?.("当前笔记没有可下载的多平台视频；请先同步收藏，或确认笔记仍保留插件管理标记");
        const completed = rebuilt.filter((task) => task.status === "completed").length;
        this.multiNotify?.(`当前笔记视频下载完成：${completed}/${rebuilt.length}`);
        this.refreshMultiPlatformStatus();
        this.refreshMultiPlatformSettingTab();
        return rebuilt;
      }
      // A download can be interrupted while queued/downloading, or can be
      // left without a local path after an Obsidian restart.  Treat every
      // non-completed task as eligible here; retryFailed still performs the
      // adapter re-resolution and budget checks before writing anything.
      const retryable = new Set(["failed", "expired", "forbidden", "skipped_budget", "queued", "resolving", "downloading", "merging", "cancelled"]);
      const result = await this.mediaService.retryFailed((task) => task.notePath === active.path && task.media?.kind === "video" && retryable.has(String(task.status || "")));
      for (const task of result) await this.writer?.updateMediaTask?.(task);
      const completed = result.filter((task) => task.status === "completed").length;
      this.multiNotify?.(`当前笔记视频下载完成：${completed}/${result.length}`);
      this.refreshMultiPlatformStatus();
      this.refreshMultiPlatformSettingTab();
      return result;
    }
    async _buildMediaTasksForCurrentNote(active) {
      const vault = this.app.vault;
      if (!active?.path || !vault?.read || !this.writer || !this.mediaService) return [];
      let content;
      try { content = await vault.read(active); } catch (_) { return []; }
      if (!/<!--\s*multi-source-sync:item:start\s*-->/i.test(content)) return [];
      const frontmatter = parseManagedFrontmatter(content);
      const platform = String(frontmatter.sourcePlatform || "").trim();
      const sourceId = String(frontmatter.sourceId || "").trim();
      const sourceUrl = safeExternalUrlForTask(frontmatter.sourceUrl || frontmatter.url || "");
      if (!platform || !sourceId || !sourceUrl) return [];
      const adapter = this.adapters?.[platform];
      if (!adapter?.getItemDetail || !adapter?.resolveMedia) return [];
      // A note is account-scoped. Never let a newly active account silently
      // download the same source into an older account's note.
      const expectedAccount = String(frontmatter.accountId || "").trim();
      let currentAccount = null;
      try { currentAccount = await adapter.getAccount?.({ validate: true, force: true }); } catch (_) { currentAccount = null; }
      if (expectedAccount && currentAccount?.id && expectedAccount !== String(currentAccount.id) && expectedAccount !== "manual") return [];
      if (platform === "bilibili" && !currentAccount?.id) return [];
      let title = String(frontmatter.title || "").trim();
      if (!title) title = extractManagedTitle(content) || sourceId;
      let item;
      try {
        item = normalizeItem(await adapter.getItemDetail({ sourceId, sourceUrl, title }, "bookmark", { allParts: this.multiState.platform(platform)?.allParts !== false }));
      } catch (error) {
        this.multiLog?.("current_video_detail_failed", { platform, sourceId, error: sanitizeLocalError(error) });
        return [];
      }
      if (expectedAccount && expectedAccount !== "manual" && String(item.accountId || "") !== expectedAccount) return [];
      let resolved;
      try {
        resolved = await adapter.resolveMedia(item, {
          quality: this.multiState.platform(platform)?.quality || "standard",
          allParts: this.multiState.platform(platform)?.allParts !== false,
          refresh: true,
        });
      } catch (error) {
        this.multiLog?.("current_video_media_resolve_failed", { platform, sourceId, error: sanitizeLocalError(error) });
        return [];
      }
      const references = extractManagedMediaReferences(content);
      const matchingReferences = references.filter((reference) => {
        const marker = reference.marker || {};
        return (!marker.platform || marker.platform === platform)
          && (!marker.accountId || !expectedAccount || marker.accountId === expectedAccount)
          && (!marker.sourceId || marker.sourceId === sourceId);
      });
      const selected = [];
      const used = new Set();
      for (const reference of matchingReferences) {
        const wanted = String(reference.marker?.mediaId || "");
        let media = resolved.find((entry) => !used.has(entry) && wanted && String(entry.id) === wanted);
        if (!media && matchingReferences.length === resolved.length) media = resolved.find((entry) => !used.has(entry));
        if (!media || media.kind !== "video") continue;
        used.add(media);
        selected.push(media);
      }
      // A note created by an older build may not have per-media markers. In
      // that case the source detail remains authoritative and all video parts
      // are eligible, bounded by the adapter's own multi-P limit.
      if (!matchingReferences.length) selected.push(...resolved.filter((entry) => entry?.kind === "video"));
      const result = [];
      const seen = new Set();
      for (const media of selected) {
        const key = `${item.platform}:${item.accountId}:${item.sourceId}:${media.id}`;
        if (seen.has(key)) continue;
        seen.add(key);
        try {
          const task = await this.mediaService.enqueue(item, media, { notePath: active.path });
          const hydrated = { ...task, notePath: active.path, platform: item.platform, accountId: item.accountId, sourceId: item.sourceId, mediaId: media.id, sourceUrl: item.sourceUrl, media: task?.media || media };
          await this.writer.updateMediaTask?.(hydrated);
          result.push(hydrated);
        } catch (error) {
          result.push({ key, platform: item.platform, accountId: item.accountId, sourceId: item.sourceId, mediaId: media.id, notePath: active.path, status: "failed", error: sanitizeLocalError(error), media });
        }
      }
      return result;
    }
    async refreshMultiPlatformOverview() {
      if (!this.multiState) await this.initializeMultiPlatformExtension();
      const vault = this.app.vault;
      if (!vault?.getMarkdownFiles || !vault?.create) return this.multiNotify?.("当前 Obsidian 版本无法生成多平台总览");
      const managed = [];
      for (const file of vault.getMarkdownFiles()) {
        try {
          const content = await vault.read(file);
          if (/<!--\s*multi-source-sync:item:start\s*-->/.test(content)) managed.push(file.path);
        } catch (_) {}
      }
      const marker = "<!-- multi-source-sync:overview -->";
      const body = `${marker}\n# Generated by multi-source-sync\nfilters:\n  and:\n    - file.ext == "md"\n    - sourcePlatform != ""\n    - sourcePlugin == "multi-source-sync"\nviews:\n  - type: table\n    name: 全部内容\n    order:\n      - file.name\n      - sourcePlatform\n      - accountName\n      - contentKind\n      - downloadStatus\n      - transcriptStatus\n      - sourceUrl\n`;
      const baseTarget = "多平台内容总览.base";
      const managedTarget = await findManagedOverviewPath(vault, baseTarget, marker);
      let target = managedTarget || baseTarget;
      const existing = vault.getAbstractFileByPath?.(target);
      const managedOverview = Boolean(managedTarget);
      // Never overwrite a user-owned .base file.  Generated files carry an
      // explicit marker; all other collisions receive a deterministic suffix
      // just like managed Markdown conflicts.
      if (existing && !managedOverview) target = await uniqueVaultPath(vault, target);
      const targetFile = vault.getAbstractFileByPath?.(target);
      if (targetFile && managedOverview && vault.modify) await vault.modify(targetFile, body);
      else { await ensureVaultParent(vault, target); await vault.create(target, body); }
      this.multiNotify?.(`多平台内容总览已刷新：${managed.length} 篇插件管理笔记（${target}）`);
      return { path: target, managedCount: managed.length };
    }
    async rescanMultiPlatformNotes() {
      if (!this.multiState) await this.initializeMultiPlatformExtension();
      const files = this.app.vault?.getMarkdownFiles?.() || [];
      let managed = 0;
      for (const file of files) {
        try { if (/<!--\s*multi-source-sync:item:start\s*-->/.test(await this.app.vault.read(file))) managed++; } catch (_) {}
      }
      this.refreshMultiPlatformStatus();
      this.multiNotify?.(`插件管理笔记扫描完成：${managed} 篇；未改写用户文件`);
      return { managed };
    }
    async refreshMultiPlatformAccounts() {
      if (!this.multiState) await this.initializeMultiPlatformExtension();
      const statuses = {};
      for (const [id, adapter] of Object.entries(this.adapters || {})) {
        try { statuses[id] = await adapter.getAccount({ validate: true, force: true }); } catch (error) { statuses[id] = null; this.multiLog?.("account_refresh_failed", { platform: id, error: sanitizeLocalError(error) }); }
      }
      const connected = Object.values(statuses).filter(Boolean).length;
      this.multiNotify?.(`平台账号状态已刷新：${connected} 个平台已连接`);
      try {
        const tab = this.app.setting?.openTabById?.("multi-platform-sync");
        tab?.display?.();
      } catch (_) {}
      return statuses;
    }
    async logoutMultiPlatform(id) {
      const adapter = this.adapters?.[id];
      if (adapter?.logout) await adapter.logout();
      else await this.multiState?.setPlatform?.(id, { session: null, account: null });
      this.multiNotify?.(`${id === "bilibili" ? "B站" : "抖音"}已退出登录；本地笔记和媒体未删除`);
    }
    async refreshTranscriptFrontmatter(notePath) {
      const tasks = Object.values(this.multiState.get().mediaTasks || {}).filter((task) => task.notePath === notePath && task.media?.kind === "video");
      if (!tasks.length) return;
      const entries = tasks.map((task) => this.multiState.get().transcriptionTasks?.[task.key]).filter(Boolean);
      const statuses = entries.map((task) => task.status).filter(Boolean);
      const status = statuses.length === tasks.length && statuses.every((entry) => entry === "completed") ? "completed" : statuses.some((entry) => entry === "failed") ? "failed" : "pending";
      const updatedAt = entries.map((task) => task.transcriptUpdatedAt || task.completedAt || task.updatedAt || "").filter(Boolean).sort().pop() || "";
      await this.writer?.updateTranscriptionStatus?.(notePath, status, updatedAt);
    }
    refreshMultiPlatformStatus() { if (!this.multiState) return; this.multiPlatformStatus = { media: Object.values(this.multiState.get().mediaTasks || {}), transcription: Object.values(this.multiState.get().transcriptionTasks || {}) }; }
    refreshMultiPlatformSettingTab() {
      try {
        const active = this.app.setting?.activeTab;
        if (active?.id === "multi-platform-sync") active.display?.();
      } catch (_) {}
    }
    installNotificationGate() {
      if (this._mssNoticeObserver) return;
      const doc = this.app?.workspace?.containerEl?.ownerDocument || globalThis.document;
      const Observer = doc?.defaultView?.MutationObserver || globalThis.MutationObserver;
      if (!doc?.body || typeof Observer !== "function") return;
      this._mssNoticeDocument = doc;
      this._mssNoticeObserver = new Observer(() => this.refreshNotificationVisibility());
      this._mssNoticeObserver.observe(doc.body, { childList: true, subtree: true });
      this.refreshNotificationVisibility();
    }
    refreshNotificationVisibility() {
      const doc = this._mssNoticeDocument || this.app?.workspace?.containerEl?.ownerDocument || globalThis.document;
      if (!doc?.querySelectorAll) return;
      const settings = this.multiState?.get?.()?.notifications || { level: "all" };
      for (const element of doc.querySelectorAll(".notice")) {
        const text = String(element.textContent || "").replace(/[\r\n]+/g, " ").trim();
        if (!isLikelyMultiSourceNotice(text)) continue;
        const shouldShow = shouldShowNotification(settings, text, "status");
        if (shouldShow) {
          if (this._mssHiddenNotices.has(element)) {
            element.style.display = this._mssHiddenNotices.get(element);
            this._mssHiddenNotices.delete(element);
          }
        } else if (!this._mssHiddenNotices.has(element)) {
          this._mssHiddenNotices.set(element, element.style.display || "");
          element.style.display = "none";
        }
      }
    }
    removeNotificationGate() {
      try { this._mssNoticeObserver?.disconnect?.(); } catch (_) {}
      for (const [element, display] of this._mssHiddenNotices || []) {
        try { element.style.display = display; } catch (_) {}
      }
      this._mssHiddenNotices?.clear?.();
      this._mssNoticeObserver = null;
      this._mssNoticeDocument = null;
    }
  };
}

function isErrorNotification(message, level = "status") {
  const text = String(message ?? "");
  const requested = String(level || "status").toLowerCase();
  if (requested === "critical") return true;
  // Login expiry, missing accounts and “please re-login” are connection
  // states, not actionable runtime failures. They are intentionally hidden
  // by the “only serious errors” mode because the legacy engine can repeat
  // them during background checks.
  if (/(未登录|未连接|登录态|登录状态|登录已|请重新登录|需要先登录|尚未验证|同步已暂停|账号.*(未|失效|不匹配))/i.test(text)) return false;
  if (requested === "error" || requested === "warning") return true;
  return /(失败|错误|异常|无法|不可用|未就绪|不一致|权限|拒绝|超时)/i.test(text);
}

function shouldShowNotification(settings, message, level = "status") {
  const mode = ["all", "errors", "off"].includes(String(settings?.level)) ? String(settings.level) : "all";
  if (mode === "off") return false;
  return mode !== "errors" || isErrorNotification(message, level);
}

function isLikelyMultiSourceNotice(message) {
  return /(小红书|RedNote|多平台|B站|哔哩哔哩|抖音|收藏同步|同步.*(?:暂停|失败|完成|收藏)|登录.*(?:失效|状态|账号)|账号.*(?:登录|连接))/i.test(String(message || ""));
}

function resolveVaultFile(app, link, notePath) {
  const clean = cleanVaultLink(link);
  if (!clean) return null;
  const direct = app.vault.getAbstractFileByPath?.(clean);
  if (isVaultFile(direct)) return direct;
  const resolved = app.metadataCache?.getFirstLinkpathDest?.(clean, notePath);
  if (isVaultFile(resolved)) return resolved;
  const path = require("path");
  const relative = path.posix.normalize(path.posix.join(path.posix.dirname(notePath), clean));
  if (relative === ".." || relative.startsWith("../")) return null;
  const relativeFile = app.vault.getAbstractFileByPath?.(relative);
  return isVaultFile(relativeFile) ? relativeFile : null;
}

async function ensureVaultParent(vault, filePath) {
  const parts = String(filePath || "").split("/");
  parts.pop();
  let current = "";
  for (const part of parts) {
    if (!part) continue;
    current = current ? `${current}/${part}` : part;
    if (!vault?.getAbstractFileByPath?.(current) && vault?.createFolder) {
      try { await vault.createFolder(current); } catch (_) {}
    }
  }
}

async function uniqueVaultPath(vault, filePath) {
  const extension = path.posix.extname(filePath);
  const base = extension ? filePath.slice(0, -extension.length) : filePath;
  for (let index = 1; index < 10000; index++) {
    const suffix = index === 1 ? "-Multi Source Sync" : `-Multi Source Sync ${index}`;
    const target = `${base}${suffix}${extension}`;
    if (!vault?.getAbstractFileByPath?.(target)) return target;
  }
  throw new Error("无法为总览生成唯一文件名");
}

async function findManagedOverviewPath(vault, filePath, marker) {
  const extension = path.posix.extname(filePath);
  const base = extension ? filePath.slice(0, -extension.length) : filePath;
  for (let index = 0; index < 10000; index++) {
    const suffix = index === 0 ? "" : index === 1 ? "-Multi Source Sync" : `-Multi Source Sync ${index}`;
    const candidate = `${base}${suffix}${extension}`;
    const file = vault?.getAbstractFileByPath?.(candidate);
    if (!file) continue;
    if (!vault?.read) continue;
    try { if (String(await vault.read(file)).includes(String(marker || ""))) return candidate; } catch (_) {}
  }
  return "";
}

function isVaultFile(file) {
  if (!file || Array.isArray(file.children)) return false;
  const filePath = String(file.path || "").trim();
  const extension = String(file.extension || path.posix.extname(filePath).slice(1) || "").toLowerCase();
  return Boolean(filePath || file.extension) && extension !== "md";
}

/**
 * Parse local video embeds while retaining a preceding media marker.  The
 * parser intentionally accepts both Obsidian wikilinks and Markdown image
 * embeds, URL-decodes only the path component, and ignores remote URLs.
 */
function extractVideoEmbeds(content) {
  const text = String(content || "");
  const ranges = [];
  const markerRe = /<!--\s*multi-source-sync:media:([^\s]+)\s*-->[\s\S]*?<!--\s*multi-source-sync:media-end\s*-->/gi;
  let markerMatch;
  while ((markerMatch = markerRe.exec(text))) {
    ranges.push({ start: markerMatch.index, end: markerRe.lastIndex, marker: parseMediaMarker(markerMatch[1]) });
  }
  const embeds = [];
  const add = (match, rawPath, index) => {
    const link = cleanVaultLink(rawPath);
    if (!link || !isLocalVideoPath(link)) return;
    const range = ranges.find((entry) => index >= entry.start && index <= entry.end);
    const marker = range?.marker || null;
    embeds.push({ link, marker, label: marker?.title || path.posix.basename(link), index });
  };
  const wikiRe = /!\[\[([^\]]+)\]\]/g;
  let match;
  while ((match = wikiRe.exec(text))) {
    const raw = String(match[1] || "").split("|")[0];
    add(match, raw, match.index);
  }
  // Markdown destinations may be wrapped in angle brackets and can contain
  // encoded spaces.  A line-bounded destination avoids consuming prose after
  // an unmatched closing parenthesis.
  const markdownRe = /!\[[^\]]*\]\((<[^>\n]+>|[^)\n]+)\)/g;
  while ((match = markdownRe.exec(text))) {
    let raw = String(match[1] || "").trim();
    if (raw.startsWith("<") && raw.endsWith(">")) raw = raw.slice(1, -1);
    // Optional Markdown title (`path "title"`) is not part of the path.
    raw = raw.replace(/\s+(?:"[^"]*"|'[^']*'|\([^)]*\))\s*$/, "");
    add(match, raw, match.index);
  }
  return embeds.sort((a, b) => a.index - b.index);
}

function findExactMediaTask(state, { notePath, localPath, marker } = {}) {
  const tasks = Object.values(state?.mediaTasks || {}).filter((task) => task && task.media?.kind === "video");
  const note = normalizeVaultPath(notePath);
  const local = normalizeVaultPath(localPath);
  let candidates = tasks.filter((task) => normalizeVaultPath(task.notePath) === note && normalizeVaultPath(task.localPath) === local);
  if (!candidates.length) return null;
  const identity = marker && typeof marker === "object" ? marker : {};
  if (identity.taskKey) candidates = candidates.filter((task) => String(task.key) === String(identity.taskKey));
  if (identity.mediaId) candidates = candidates.filter((task) => String(task.mediaId || task.media?.id) === String(identity.mediaId));
  if (identity.platform) candidates = candidates.filter((task) => String(task.platform) === String(identity.platform));
  if (identity.accountId) candidates = candidates.filter((task) => String(task.accountId) === String(identity.accountId));
  if (identity.sourceId) candidates = candidates.filter((task) => String(task.sourceId) === String(identity.sourceId));
  return candidates.length === 1 ? candidates[0] : null;
}

function parseMediaMarker(value) {
  try {
    const parsed = JSON.parse(decodeURIComponent(String(value || "")));
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch (_) { return null; }
}

function cleanVaultLink(value) {
  let raw = String(value || "").trim();
  if (!raw || /^[a-z][a-z0-9+.-]*:/i.test(raw)) return "";
  // Remove Obsidian aliases and unencoded subpath/query fragments before
  // decoding, so an encoded '#'/'?' in a filename remains valid.
  raw = raw.split("|")[0].trim();
  raw = raw.replace(/[?#].*$/, "").trim();
  if (raw.startsWith("<") && raw.endsWith(">")) raw = raw.slice(1, -1).trim();
  try { raw = decodeURIComponent(raw); } catch (_) { return ""; }
  raw = raw.replace(/\\/g, "/").replace(/^\.\//, "").replace(/^\/+/, "");
  const normalized = require("path").posix.normalize(raw);
  if (!normalized || normalized === "." || normalized === ".." || normalized.startsWith("../")) return "";
  return normalized;
}

function normalizeVaultPath(value) {
  const raw = String(value || "").trim().replace(/\\/g, "/");
  if (!raw || raw.startsWith("/") || raw.startsWith("//") || /^[A-Za-z]:\//.test(raw)) return "";
  const cleaned = cleanVaultLink(raw);
  return cleaned || raw.replace(/^\.\//, "").replace(/\/{2,}/g, "/");
}

function safeManagedVaultPath(value) {
  const raw = String(value || "").trim().replace(/\\/g, "/");
  if (!raw || raw.includes("\u0000") || /^[a-z][a-z0-9+.-]*:/i.test(raw) || raw.startsWith("/") || raw.startsWith("//") || /^[A-Za-z]:\//.test(raw)) return "";
  const normalized = path.posix.normalize(raw);
  if (!normalized || normalized === "." || normalized === ".." || normalized.startsWith("../")) return "";
  return normalized;
}

function isInsideVault(app, absolutePath, relativePath) {
  const safeRelative = safeManagedVaultPath(relativePath);
  if (!safeRelative || !absolutePath) return false;
  const base = app?.vault?.adapter?.basePath;
  if (!base) return true;
  const baseResolved = path.resolve(String(base));
  const targetResolved = path.resolve(String(absolutePath));
  return targetResolved === baseResolved || targetResolved.startsWith(`${baseResolved}${path.sep}`);
}

function isLocalVideoPath(value) { return /\.(?:mp4|mov|m4v|webm|mkv|avi|flv)$/i.test(String(value || "")); }

function sanitizeLocalError(error) {
  return String(error?.message || error || "本地任务失败")
    .replace(/https?:\/\/\S+/gi, "[url]")
    .replace(/(?:cookie|authorization|bearer|token|signature|xsec_token)\s*[:=]\s*[^\s,;]+/gi, "$1=[redacted]")
    .replace(/\s+/g, " ")
    .slice(0, 500);
}

function parseManagedFrontmatter(content) {
  const block = String(content || "").match(/<!--\s*multi-source-sync:item:start\s*-->[\s\S]*?\n---\n([\s\S]*?)\n---/i)?.[1] || "";
  const result = {};
  for (const line of block.split(/\r?\n/)) {
    const match = line.match(/^([A-Za-z][A-Za-z0-9_-]*)\s*:\s*(.*)$/);
    if (!match) continue;
    const raw = match[2].trim();
    try { result[match[1]] = JSON.parse(raw); }
    catch (_) { result[match[1]] = raw.replace(/^['"]|['"]$/g, ""); }
  }
  return result;
}

function extractManagedTitle(content) {
  return String(content || "").match(/<!--\s*multi-source-sync:item:start\s*-->[\s\S]*?^#\s+([^\n]+)$/im)?.[1]?.trim() || "";
}

function extractManagedMediaReferences(content) {
  const references = [];
  const markerRe = /<!--\s*multi-source-sync:media:([^\s]+)\s*-->[\s\S]*?<!--\s*multi-source-sync:media-end\s*-->/gi;
  let match;
  while ((match = markerRe.exec(String(content || "")))) {
    const block = match[0];
    const marker = parseMediaMarker(match[1]);
    const wiki = block.match(/!\[\[([^\]]+)\]\]/);
    const markdown = block.match(/\[([^\]]*)\]\((<[^>\n]+>|[^)\n]+)\)/);
    let link = wiki?.[1] || markdown?.[2] || "";
    link = String(link).trim();
    if (link.startsWith("<") && link.endsWith(">")) link = link.slice(1, -1).trim();
    if (link) references.push({ link, marker, label: wiki ? link.split("|")[0] : (markdown?.[1] || "视频").trim() });
  }
  return references;
}

function safeExternalUrlForTask(value) {
  try {
    const parsed = new URL(String(value || "").trim());
    if (!/^https?:$/i.test(parsed.protocol) || parsed.username || parsed.password) return "";
    parsed.username = ""; parsed.password = ""; parsed.hash = "";
    for (const key of [...parsed.searchParams.keys()]) {
      if (/(?:token|signature|^sig$|authorization|cookie|session|csrf|xsec|access[_-]?key|expires?|timestamp|w_rid|wts)/i.test(key)) parsed.searchParams.delete(key);
    }
    return parsed.toString();
  } catch (_) { return ""; }
}
function gigabytes(value, fallback) { const number = Number(value); return Number.isFinite(number) && number > 0 ? number * 1024 * 1024 * 1024 : fallback * 1024 * 1024 * 1024; }

async function backupDataFile(plugin) {
  const adapter = plugin?.app?.vault?.adapter;
  const manifestDir = plugin?.manifest?.dir || ".obsidian/plugins/multi-source-sync";
  const dataPath = adapter?.getFullPath?.(path.posix.join(manifestDir, "data.json")) || (adapter?.basePath && path.join(adapter.basePath, manifestDir, "data.json"));
  if (!dataPath || !fs.existsSync(dataPath)) return false;
  const backupDir = path.join(path.dirname(dataPath), "backups");
  await fs.promises.mkdir(backupDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 14);
  const target = path.join(backupDir, `data.json.migration-${stamp}.bak`);
  if (!fs.existsSync(target)) await fs.promises.copyFile(dataPath, target);
  return true;
}

async function persistMigrationFile(plugin, state, fallback) {
  const adapter = plugin?.app?.vault?.adapter;
  const manifestDir = plugin?.manifest?.dir || ".obsidian/plugins/multi-source-sync";
  const dataPath = adapter?.getFullPath?.(path.posix.join(manifestDir, "data.json")) || (adapter?.basePath && path.join(adapter.basePath, manifestDir, "data.json"));
  if (!dataPath) return false;
  let current = {};
  try {
    if (fs.existsSync(dataPath)) current = JSON.parse(await fs.promises.readFile(dataPath, "utf8"));
  } catch (_) { current = {}; }
  const migrated = state || {};
  const source = current && typeof current === "object" && !Array.isArray(current) ? current : (fallback || {});
  const merged = {
    ...source,
    settingsSchemaVersion: 3,
    platforms: { ...(source.platforms || {}), ...(migrated.platforms || {}) },
    syncState: { ...(source.syncState || {}), ...(migrated.syncState || {}) },
    mediaTasks: { ...(source.mediaTasks || {}), ...(migrated.mediaTasks || {}) },
    transcriptionTasks: { ...(source.transcriptionTasks || {}), ...(migrated.transcriptionTasks || {}) },
    media: { ...(source.media || {}), ...(migrated.media || {}) },
    resourcePaths: { ...(source.resourcePaths || {}), ...(migrated.resourcePaths || {}) },
    resourceMeta: { ...(source.resourceMeta || {}), ...(migrated.resourceMeta || {}) },
    transcription: { ...(source.transcription || {}), ...(migrated.transcription || {}) },
    notifications: { ...(source.notifications || {}), ...(migrated.notifications || {}) },
  };
  await fs.promises.mkdir(path.dirname(dataPath), { recursive: true });
  const tempPath = `${dataPath}.migration-${process.pid}-${Date.now()}.tmp`;
  try {
    await fs.promises.writeFile(tempPath, `${JSON.stringify(merged, null, 2)}\n`, "utf8");
    await fs.promises.rename(tempPath, dataPath);
  } catch (error) {
    try { await fs.promises.unlink(tempPath); } catch (_) {}
    throw error;
  }
  return true;
}

function needsCanonicalStateRepair(input, migrated) {
  const rawPlatforms = input?.platforms && typeof input.platforms === "object" ? input.platforms : {};
  const nextPlatforms = migrated?.platforms;
  if (!nextPlatforms || typeof nextPlatforms !== "object") return false;
  for (const id of ["bilibili", "douyin", "rednote"]) {
    const raw = rawPlatforms[id];
    const next = nextPlatforms[id];
    if (!raw || typeof raw !== "object" || !next || typeof next !== "object") continue;
    if (Object.prototype.hasOwnProperty.call(raw, "account") && raw.account && !hasAccountId(raw.account)) return true;
    if (Object.prototype.hasOwnProperty.call(raw, "session") && !hasSessionValue(raw.session) && raw.session !== null) return true;
    if (raw.accounts && typeof raw.accounts === "object") {
      for (const entry of Object.values(raw.accounts)) {
        if (entry && typeof entry === "object" && Object.prototype.hasOwnProperty.call(entry, "session") && !hasSessionValue(entry.session) && entry.session !== null) return true;
      }
    }
  }
  // Schema-3 files can still have been written by an older extension before
  // URL/token scrubbing was introduced.  Compare only the fields whose
  // canonical form is intentionally sanitised; a difference requests one
  // backup + atomic repair on startup rather than waiting for a later sync.
  if (JSON.stringify(input?.mediaTasks || {}) !== JSON.stringify(migrated?.mediaTasks || {})) return true;
  if (JSON.stringify(input?.resourceMeta || {}) !== JSON.stringify(migrated?.resourceMeta || {})) return true;
  if (JSON.stringify(input?.notifications || {}) !== JSON.stringify(migrated?.notifications || {})) return true;
  for (const id of ["bilibili", "douyin"]) {
    const raw = rawPlatforms[id] && typeof rawPlatforms[id] === "object" ? rawPlatforms[id] : {};
    const next = nextPlatforms[id] && typeof nextPlatforms[id] === "object" ? nextPlatforms[id] : {};
    for (const key of ["manualLinks", "scrapedItems"]) {
      if (JSON.stringify(raw[key] || []) !== JSON.stringify(next[key] || [])) return true;
    }
  }
  return false;
}

module.exports = { installMultiPlatformExtension, resolveVaultFile, extractVideoEmbeds, extractManagedMediaReferences, parseManagedFrontmatter, findExactMediaTask, cleanVaultLink, persistMigrationFile, safeManagedVaultPath, isInsideVault, needsCanonicalStateRepair };
