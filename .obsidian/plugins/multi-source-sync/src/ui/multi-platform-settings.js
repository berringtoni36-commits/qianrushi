const ObsidianPluginSettingTab = (() => {
  try { return require("obsidian").PluginSettingTab; } catch (_) { return class {}; }
})();
const { hasSessionValue } = (() => {
  try { return require("../core/sync-state-store"); } catch (_) { return {}; }
})();

const PLATFORM_IDS = Object.freeze(["bilibili", "douyin"]);
const PLATFORM_TITLES = Object.freeze({ bilibili: "哔哩哔哩（Bilibili）", douyin: "抖音（Douyin）" });
const MEDIA_BUDGETS = Object.freeze([
  ["maxFileGB", "单个文件上限（GB）", 2],
  ["runBudgetGB", "单次运行预算（GB）", 5],
  ["accountBudgetGB", "单账号预算（GB）", 50],
]);
const BYTES_PER_GB = 1024 * 1024 * 1024;

/** Obsidian UI adapter for the readable multi-platform extension. */
class MultiPlatformSettingTab extends ObsidianPluginSettingTab {
  constructor(app, plugin, obsidian) {
    super(app, plugin);
    this.app = app;
    this.plugin = plugin;
    this.obsidian = obsidian || {};
    this.id = "multi-platform-sync";
    this.name = "多平台收藏同步";
  }

  display() {
    const Setting = this.obsidian.Setting;
    if (!this.containerEl) return;
    this.containerEl.empty?.();
    if (typeof Setting !== "function" || !this.plugin?.multiState) {
      this.containerEl.createEl?.("p", { text: "多平台扩展正在初始化，请稍候或重新加载插件。" });
      return;
    }
    const stateStore = this.plugin.multiState;
    const state = stateStore.get?.() || {};
    const Notice = this.obsidian.Notice;
    const notify = (message, level = "status") => {
      try {
        if (typeof this.plugin.multiNotify === "function") return this.plugin.multiNotify(String(message), level);
        if (typeof Notice === "function") new Notice(String(message));
      } catch (_) {}
    };
    const run = async (action, failurePrefix = "操作失败") => {
      try { return await action(); }
      catch (error) { notify(`${failurePrefix}：${safeError(error)}`, "error"); return undefined; }
    };

    this.containerEl.createEl("h2", { text: "多平台收藏同步" });
    this.containerEl.createEl("p", { text: "小红书原有设置保持不变；B站和抖音第一版只同步收藏。登录使用插件内独立窗口，视频可保存到本地并手动转文字。" });

    // Keep the workbench summary derived from the state store instead of a
    // cached view-model.  This makes the panel useful immediately after a
    // restart and after a background download/transcription updates the
    // persisted task state.
    this.renderTaskSummary(state);
    this.renderNotificationSettings(Setting, stateStore, state.notifications || {}, notify, run);

    for (const id of PLATFORM_IDS) this.renderPlatform(Setting, id, stateStore, notify, run);

    this.containerEl.createEl("h3", { text: "统一同步工作台" });
    new Setting(this.containerEl)
      .setName("同步全部已启用平台")
      .setDesc("顺序：小红书 → B站 → 抖音；平台之间不并发请求")
      .addButton((button) => {
        button.setButtonText("立即同步");
        button.setCta?.();
        button.onClick(() => run(() => this.plugin.syncMultiPlatforms(), "同步失败"));
      })
      .addButton((button) => {
        button.setButtonText("停止同步");
        if (typeof button.setWarning === "function") button.setWarning();
        button.onClick(() => {
          if (!this.plugin.multiCoordinator?.running) return notify("当前没有正在运行的同步");
          this.plugin.stopMultiPlatformSync?.();
        });
      });
    new Setting(this.containerEl)
      .setName("工作台操作")
      .setDesc("可单独刷新账号、生成总览或重新扫描已管理笔记")
      .addButton((button) => {
        button.setButtonText("刷新平台账号");
        button.onClick(() => run(() => this.plugin.refreshMultiPlatformAccounts?.(), "账号刷新失败"));
      })
      .addButton((button) => {
        button.setButtonText("刷新内容总览");
        button.onClick(() => run(() => this.plugin.refreshMultiPlatformOverview?.(), "总览刷新失败"));
      })
      .addButton((button) => {
        button.setButtonText("重新扫描笔记");
        button.onClick(() => run(() => this.plugin.rescanMultiPlatformNotes?.(), "笔记扫描失败"));
      });
    new Setting(this.containerEl)
      .setName("本地能力")
      .setDesc("插件自身高级能力全部打开；不会伪造 B站大会员、抖音付费权限或绕过 DRM/验证码")
      .addButton((button) => {
        button.setButtonText("查看能力");
        button.onClick(() => {
          const values = this.plugin.capabilities?.all?.() || {};
          notify(Object.entries(values).filter(([, value]) => value).map(([key]) => key).join("、") || "能力服务尚未初始化");
        });
      });
    new Setting(this.containerEl)
      .setName("媒体任务")
      .setDesc("查看媒体下载、失败和待转写任务")
      .addButton((button) => {
        button.setButtonText("刷新状态");
        button.onClick(() => {
          this.plugin.refreshMultiPlatformStatus?.();
          this.display();
          notify("多平台任务状态已刷新");
        });
      });

    this.renderTranscription(Setting, stateStore, state.transcription || {}, notify, run);
    this.renderMediaBudgets(Setting, stateStore, state.media || {}, notify, run);
  }

  renderNotificationSettings(Setting, stateStore, notifications, notify, run) {
    this.containerEl.createEl("h3", { text: "状态提示与日志" });
    this.containerEl.createEl("p", { text: "控制插件弹出的状态通知；关闭弹窗不会停止同步。诊断日志仍可单独保留，方便出问题时排查。" });
    new Setting(this.containerEl)
      .setName("弹窗提示级别")
      .setDesc("全部提示：包含同步进度；仅严重错误：隐藏未登录、登录失效、已连接、同步完成等例行消息；关闭：不弹出插件通知")
      .addDropdown((dropdown) => {
        dropdown.addOptions({ all: "全部提示", errors: "仅严重错误（不提示登录状态）", off: "关闭所有弹窗" });
        dropdown.setValue(["all", "errors", "off"].includes(String(notifications.level)) ? String(notifications.level) : "all");
        dropdown.onChange((value) => run(async () => {
          const level = ["all", "errors", "off"].includes(String(value)) ? String(value) : "all";
          await stateStore.setNotificationSettings({ level });
          this.plugin.refreshNotificationVisibility?.();
          this.display();
        }, "提示设置保存失败"));
      });
    new Setting(this.containerEl)
      .setName("写入本地诊断日志")
      .setDesc("保存脱敏后的同步诊断信息到插件 logs/sync.log；关闭后不再写入新引擎日志，历史日志不会删除")
      .addToggle((toggle) => {
        toggle.setValue(notifications.writeLog !== false);
        toggle.onChange((value) => run(() => stateStore.setNotificationSettings({ writeLog: Boolean(value) }), "日志设置保存失败"));
      });
  }

  renderTaskSummary(state) {
    const mediaTasks = Object.values(state?.mediaTasks || {}).filter((task) => task && typeof task === "object");
    const transcriptionTasks = Object.values(state?.transcriptionTasks || {}).filter((task) => task && typeof task === "object");
    const count = (list, statuses) => list.filter((task) => statuses.includes(String(task.status || ""))).length;
    const mediaSummary = [
      ["待处理", count(mediaTasks, ["queued", "resolving", "downloading", "merging"])],
      ["已完成", count(mediaTasks, ["completed"])],
      ["失败", count(mediaTasks, ["failed", "expired", "forbidden", "unsupported"])],
      ["预算跳过", count(mediaTasks, ["skipped_budget"])],
      ["已取消", count(mediaTasks, ["cancelled"])],
    ];
    const transcriptSummary = [
      ["待转写", count(transcriptionTasks, ["queued", "running", "pending"])],
      ["已完成", count(transcriptionTasks, ["completed"])],
      ["失败", count(transcriptionTasks, ["failed"])],
    ];
    const platformIds = ["bilibili", "douyin"];
    const activePlatforms = platformIds.filter((id) => state?.platforms?.[id]?.enabled !== false).length;
    const connectedPlatforms = platformIds.filter((id) => {
      const cfg = state?.platforms?.[id] || {};
      const activeId = String(cfg.activeAccountId || cfg.account?.id || "").trim();
      const activeEntry = activeId && cfg.accounts && typeof cfg.accounts === "object" ? cfg.accounts[activeId] : null;
      const session = typeof hasSessionValue === "function"
        ? hasSessionValue(cfg.session) || hasSessionValue(activeEntry?.session)
        : Boolean(cfg.session || activeEntry?.session);
      return Boolean((cfg.account?.id || activeEntry?.id) && session);
    }).length;
    const running = Boolean(this.plugin.multiCoordinator?.running);
    const wrap = this.containerEl.createDiv({ cls: "mss-task-summary" });
    wrap.createEl("h3", { text: "同步状态" });
    wrap.createEl("p", { text: `${running ? "正在同步" : "同步空闲"} · ${activePlatforms} 个新平台已启用 · ${connectedPlatforms} 个已登录 · 断点会自动保存` });
    const rows = wrap.createDiv({ cls: "mss-task-summary-grid" });
    const addRow = (label, entries) => {
      const row = rows.createDiv({ cls: "mss-task-summary-row" });
      row.createEl("strong", { text: label });
      row.createEl("span", { text: entries.map(([name, value]) => `${name} ${value}`).join(" · ") });
    };
    addRow("媒体", mediaSummary);
    addRow("转写", transcriptSummary);
    const attention = [
      ...mediaTasks.filter((task) => !["completed", "cancelled"].includes(String(task.status || ""))).map((task) => ({ kind: "媒体", task })),
      ...transcriptionTasks.filter((task) => !["completed", "cancelled"].includes(String(task.status || ""))).map((task) => ({ kind: "转写", task })),
    ].sort((a, b) => String(b.task.updatedAt || "").localeCompare(String(a.task.updatedAt || ""))).slice(0, 8);
    if (attention.length) {
      const details = wrap.createEl("details", { cls: "mss-task-summary-details" });
      details.createEl("summary", { text: "查看待处理与最近错误" });
      const list = details.createEl("ul", { cls: "mss-task-summary-list" });
      for (const entry of attention) {
        const task = entry.task;
        const platform = task.platform === "bilibili" ? "B站" : task.platform === "douyin" ? "抖音" : String(task.platform || "平台");
        const label = task.media?.title || task.mediaId || task.sourceId || task.key || "未命名任务";
        const status = String(task.status || "pending");
        const message = task.error ? `：${safeError(task.error)}` : "";
        list.createEl("li", { text: `${entry.kind} · ${platform} · ${label} · ${status}${message}` });
      }
    }
  }

  renderPlatform(Setting, id, stateStore, notify, run) {
    const cfg = stateStore.platform?.(id) || {};
    const title = PLATFORM_TITLES[id] || id;
    const section = this.containerEl.createDiv({ cls: "mss-platform-card" });
    section.createEl("h3", { text: title });
    const account = cfg.account && String(cfg.account.id || "").trim() ? cfg.account : null;
    const activeId = String(cfg.activeAccountId || account?.id || "").trim();
    const activeEntry = activeId && cfg.accounts && typeof cfg.accounts === "object" ? cfg.accounts[activeId] : null;
    // A schema-3 file may have a valid account registry entry while its
    // legacy top-level mirror is temporarily absent (for example during a
    // failed save). Render the active registry entry instead of showing a
    // misleading “未登录” card until the next migration repair.
    const displayAccount = account || (activeEntry && String(activeEntry.id || "").trim() ? activeEntry : null);
    const sessionReady = typeof hasSessionValue === "function"
      ? hasSessionValue(cfg.session) || hasSessionValue(activeEntry?.session)
      : Boolean(cfg.session || activeEntry?.session);
    const adapter = this.plugin.adapters?.[id];
    const accountInvalid = Boolean(adapter?.lastAccountError);
    const accountLabel = accountInvalid
      ? `${displayAccount?.name || displayAccount?.id || "当前账号"}（需重新登录）`
      : displayAccount && sessionReady ? `${displayAccount.name || displayAccount.id}（${displayAccount.id}）`
        : displayAccount ? `${displayAccount.name || displayAccount.id}（需重新登录）`
          : (id === "douyin" && cfg.manualLinks?.length ? "仅手动链接模式" : "未登录");
    const accounts = cfg.accounts && typeof cfg.accounts === "object"
      ? Object.values(cfg.accounts).filter((entry) => entry && entry.id && (typeof hasSessionValue === "function" ? hasSessionValue(entry.session) : Boolean(entry.session)))
      : [];

    new Setting(section)
      .setName("启用平台")
      .setDesc("关闭后保留账号和断点，但不会运行该平台任务")
      .addToggle((toggle) => {
        toggle.setValue(cfg.enabled !== false);
        toggle.onChange((value) => run(() => stateStore.setPlatform(id, { enabled: Boolean(value) }), `${title}设置保存失败`));
      });
    new Setting(section)
      .setName("同步收藏内容")
      .setDesc("第一版仅同步收藏；关闭后不读取该平台收藏列表")
      .addToggle((toggle) => {
        toggle.setValue(cfg.syncBookmarks !== false);
        toggle.onChange((value) => run(() => stateStore.setPlatform(id, { syncBookmarks: Boolean(value) }), `${title}设置保存失败`));
      });
    new Setting(section)
      .setName("保存视频到本地")
      .setDesc("下载失败时仍保留远程链接，不删除 Markdown")
      .addToggle((toggle) => {
        toggle.setValue(cfg.saveVideo !== false);
        toggle.onChange((value) => run(() => stateStore.setPlatform(id, { saveVideo: Boolean(value) }), `${title}设置保存失败`));
      });
    new Setting(section)
      .setName("视频质量")
      .setDesc("较高质量受平台账号权限和当前播放流限制")
      .addDropdown((dropdown) => {
        dropdown.addOptions({ standard: "标准", high: "较高（平台允许时）" });
        dropdown.setValue(cfg.quality === "high" ? "high" : "standard");
        dropdown.onChange((value) => run(() => stateStore.setPlatform(id, { quality: value === "high" ? "high" : "standard" }), `${title}设置保存失败`));
      });
    if (id === "bilibili") {
      new Setting(section)
        .setName("多 P 视频")
        .setDesc("默认处理最多 50 个分 P；关闭后仅保存第一 P")
        .addToggle((toggle) => {
          toggle.setValue(cfg.allParts !== false);
          toggle.onChange((value) => run(() => stateStore.setPlatform(id, { allParts: Boolean(value) }), "B站设置保存失败"));
        });
    }

    new Setting(section)
      .setName("账号")
      .setDesc(accountLabel)
      .addButton((button) => {
        button.setButtonText(account && sessionReady ? "重新登录" : "登录");
        button.onClick(() => run(async () => {
          const adapter = this.plugin.adapters?.[id];
          if (!adapter?.openLogin) throw new Error("平台适配器尚未初始化");
          await adapter.openLogin();
          this.display();
        }, `${title}登录失败`));
      })
      .addButton((button) => {
        button.setButtonText("添加账号");
        button.onClick(() => run(async () => {
          const adapter = this.plugin.adapters?.[id];
          if (!adapter?.openLogin) throw new Error("平台适配器尚未初始化");
          await adapter.openLogin({ add: true });
          this.display();
        }, `${title}添加账号失败`));
      })
      .addButton((button) => {
        button.setButtonText("退出登录");
        if (typeof button.setWarning === "function") button.setWarning();
        button.onClick(() => run(async () => {
          await this.plugin.logoutMultiPlatform?.(id);
          this.display();
        }, `${title}退出失败`));
      });
    if (accounts.length > 1) {
      new Setting(section)
        .setName("切换账号")
        .setDesc("账号使用稳定 ID 隔离；切换不会删除其他账号的笔记和媒体")
        .addDropdown((dropdown) => {
          dropdown.addOptions(Object.fromEntries(accounts.map((entry) => [String(entry.id), `${entry.name || entry.id}（${entry.id}）`])));
          dropdown.setValue(String(cfg.activeAccountId || displayAccount?.id || accounts[0].id));
          dropdown.onChange((value) => run(async () => {
            const adapter = this.plugin.adapters?.[id];
            if (!adapter?.switchAccount) throw new Error("平台适配器尚未初始化");
            await adapter.switchAccount(value);
            this.display();
          }, `${title}切换账号失败`));
        });
    }
    new Setting(section)
      .setName("检查平台连接")
      .setDesc("验证当前登录态，不会下载收藏")
      .addButton((button) => {
        button.setButtonText("检查");
        button.onClick(() => run(async () => {
          const adapter = this.plugin.adapters?.[id];
          if (!adapter?.getAccount) throw new Error("平台适配器尚未初始化");
          const current = await adapter.getAccount({ validate: true, force: true });
          notify(current ? `已连接：${current.name || current.id}` : "未检测到有效登录态，请重新登录", current ? "status" : "critical");
          this.display();
        }, "连接检查失败"));
      })
      .addButton((button) => {
        button.setButtonText("同步此平台");
        button.onClick(() => run(() => this.plugin.syncMultiPlatforms?.({ platforms: [id] }), `${title}同步失败`));
      });

    if (id === "bilibili") this.renderBilibiliSettings(Setting, section, cfg, stateStore, notify, run);
    if (id === "douyin") this.renderDouyinSettings(Setting, section, cfg, stateStore, run);
  }

  renderBilibiliSettings(Setting, section, cfg, stateStore, notify, run) {
    const cachedFolders = Array.isArray(cfg.favoriteFoldersCache) ? cfg.favoriteFoldersCache : [];
    new Setting(section)
      .setName("刷新收藏夹")
      .setDesc(cachedFolders.length ? cachedFolders.map((folder) => `${folder.name}（${folder.id}）`).join("、") : "尚未获取收藏夹列表")
      .addButton((button) => {
        button.setButtonText("刷新");
        button.onClick(() => run(async () => {
          const adapter = this.plugin.adapters?.bilibili;
          if (!adapter?.listCollections) throw new Error("B站适配器尚未初始化");
          await adapter.listCollections({ force: true });
          this.display();
        }, "收藏夹刷新失败"));
      });
    new Setting(section)
      .setName("收藏夹白名单")
      .setDesc("留空表示同步全部收藏夹；填写收藏夹 ID，逗号分隔")
      .addText((text) => {
        text.setValue((Array.isArray(cfg.favoriteFolders) ? cfg.favoriteFolders : []).join(","));
        text.setPlaceholder("例如 123456,789012");
        text.onChange((value) => run(() => stateStore.setPlatform("bilibili", { favoriteFolders: uniqueList(String(value).split(",")) }), "B站收藏夹设置保存失败"));
      });
    if (cachedFolders.length) {
      const selected = new Set(Array.isArray(cfg.favoriteFolders) ? cfg.favoriteFolders.map(String) : []);
      const allSelected = selected.size === 0;
      const hint = section.createEl("p", { cls: "mss-folder-selection-hint", text: allSelected ? "当前同步全部收藏夹；关闭某一项后会自动切换为白名单。" : `当前已选择 ${selected.size} 个收藏夹。` });
      hint.setAttribute?.("aria-live", "polite");
      for (const folder of cachedFolders) {
        const id = String(folder.id);
        new Setting(section)
          .setName(String(folder.name || "收藏夹"))
          .setDesc(`${id}${folder.mediaCount == null ? "" : ` · ${folder.mediaCount} 个内容`}`)
          .addToggle((toggle) => {
            toggle.setValue(allSelected || selected.has(id));
            toggle.onChange((value) => run(async () => {
              const current = new Set((stateStore.platform("bilibili")?.favoriteFolders || []).map(String));
              // Empty means all. On the first edit expand that implicit set so
              // turning one folder off does exactly what the user expects.
              const next = current.size ? current : new Set(cachedFolders.map((entry) => String(entry.id)));
              if (value) next.add(id); else next.delete(id);
              const ids = next.size === cachedFolders.length ? [] : [...next];
              await stateStore.setPlatform("bilibili", { favoriteFolders: ids });
              this.display();
            }, "B站收藏夹设置保存失败"));
          });
      }
    }
  }

  renderDouyinSettings(Setting, section, cfg, stateStore, run) {
    new Setting(section)
      .setName("手动链接导入")
      .setDesc("接口或页面结构变化时的兜底；每行一个视频/图文链接")
      .addTextArea((text) => {
        text.setValue((Array.isArray(cfg.manualLinks) ? cfg.manualLinks : []).join("\n"));
        text.setPlaceholder("https://www.douyin.com/video/...");
        text.onChange((value) => run(() => stateStore.setPlatform("douyin", { manualLinks: uniqueList(String(value).split(/\r?\n/)) }), "抖音手动链接设置保存失败"));
      });
  }

  renderTranscription(Setting, stateStore, transcription, notify, run) {
    this.containerEl.createEl("h3", { text: "视频转文字" });
    this.containerEl.createEl("p", { text: "转写只在本机执行，默认手动触发。请填写 FFmpeg、whisper-cli 和具体 Whisper .bin 模型路径；未配置时不会启动外部进程。" });
    this.pathSetting(Setting, "FFmpeg 路径", "留空表示从系统 PATH 查找", transcription.ffmpegPath || "", async (value) => {
      const executable = expandExecutablePath(value);
      await stateStore.setTranscriptionSettings({ ffmpegPath: executable });
      if (this.plugin.transcriptionService?.settings) this.plugin.transcriptionService.settings.ffmpegPath = executable;
      if (this.plugin.mediaService) this.plugin.mediaService.ffmpegPath = executable;
    }, run);
    this.pathSetting(Setting, "whisper-cli 路径", "留空表示从系统 PATH 查找", transcription.whisperPath || transcription.whisperCliPath || "", async (value) => {
      const executable = expandExecutablePath(value);
      await stateStore.setTranscriptionSettings({ whisperPath: executable });
      if (this.plugin.transcriptionService?.settings) {
        this.plugin.transcriptionService.settings.whisperPath = executable;
        this.plugin.transcriptionService.settings.whisperCliPath = executable;
      }
    }, run);
    this.pathSetting(Setting, "Whisper 模型路径", "填写具体的 ggml-*.bin 文件，不是目录", transcription.modelPath || "", async (value) => {
      await stateStore.setTranscriptionSettings({ modelPath: value });
      if (this.plugin.transcriptionService?.settings) this.plugin.transcriptionService.settings.modelPath = value;
    }, run);
    new Setting(this.containerEl)
      .setName("输出时间戳")
      .setDesc("开启后在转写章节中保留 SRT 时间戳")
      .addToggle((toggle) => {
        toggle.setValue(Boolean(transcription.timestamps));
        toggle.onChange((value) => run(async () => {
          await stateStore.setTranscriptionSettings({ timestamps: Boolean(value) });
          if (this.plugin.transcriptionService?.settings) this.plugin.transcriptionService.settings.timestamps = Boolean(value);
        }, "转写设置保存失败"));
      });
    new Setting(this.containerEl)
      .setName("自动转写")
      .setDesc("默认关闭；当前版本同步完成后只加入待处理队列，不自动占用 CPU")
      .addToggle((toggle) => {
        // The switch is intentionally read-only until a background scheduler
        // is implemented.  Showing the persisted value avoids a misleading
        // UI if an older build left autoTranscribe enabled.
        toggle.setValue(Boolean(transcription.autoTranscribe));
        if (typeof toggle.setDisabled === "function") toggle.setDisabled(true);
      });
    new Setting(this.containerEl)
      .setName("检查本地工具")
      .setDesc("检查 FFmpeg、whisper-cli 和模型是否可用")
      .addButton((button) => {
        button.setButtonText("检查");
        button.onClick(() => run(async () => {
          const service = this.plugin.transcriptionService;
          if (!service?.checkTools) throw new Error("转写服务尚未初始化，请重新加载插件");
          const result = await service.checkTools();
          notify(result.ready ? "视频转文字工具已就绪" : `工具未就绪：FFmpeg ${result.ffmpeg ? "✓" : "✗"}，whisper-cli ${result.whisper ? "✓" : "✗"}，模型 ${result.model ? "✓" : "✗"}`);
        }, "工具检查失败"));
      });
    new Setting(this.containerEl)
      .setName("转写操作")
      .setDesc("不会自动运行；可手动转写当前笔记或全部已下载视频")
      .addButton((button) => {
        button.setButtonText("转写当前笔记");
        button.onClick(() => run(() => this.plugin.transcribeCurrentMultiPlatformVideo?.(), "转写失败"));
      })
      .addButton((button) => {
        button.setButtonText("转写全部待处理");
        button.onClick(() => run(() => this.plugin.transcribePendingMultiPlatformVideos?.(), "批量转写失败"));
      })
      .addButton((button) => {
        button.setButtonText("重试失败转写");
        button.onClick(() => run(() => this.plugin.retryFailedTranscriptions?.(), "重试转写失败"));
      });
  }

  pathSetting(Setting, name, desc, current, onChange, run) {
    new Setting(this.containerEl)
      .setName(name)
      .setDesc(desc)
      .addText((text) => {
        text.setValue(String(current || ""));
        text.setPlaceholder(name.includes("模型") ? "~/tools/whisper/models/ggml-small.bin" : name.includes("FFmpeg") ? "ffmpeg" : "whisper-cli");
        text.onChange((value) => run(() => onChange(String(value || "").trim()), `${name}保存失败`));
      });
  }

  renderMediaBudgets(Setting, stateStore, media, notify, run) {
    this.containerEl.createEl("h3", { text: "媒体预算" });
    this.containerEl.createEl("p", { text: "超出预算后保留笔记和远程链接，不删除已有文件。数值单位为 GiB（1 GiB = 1024³ 字节）。" });
    for (const [key, label, fallback] of MEDIA_BUDGETS) {
      new Setting(this.containerEl)
        .setName(label)
        .setDesc("必须是大于 0 的数字")
        .addText((text) => {
          text.setValue(String(Number.isFinite(Number(media[key])) && Number(media[key]) > 0 ? media[key] : fallback));
          text.setPlaceholder(String(fallback));
          text.onChange((value) => run(async () => {
            const number = parsePositiveNumber(value);
            if (number == null) throw new Error("请输入大于 0 的数字");
            if (typeof stateStore.setMediaSettings === "function") await stateStore.setMediaSettings({ [key]: number });
            else {
              stateStore.get().media = { ...(stateStore.get().media || {}), [key]: number };
              await stateStore.save?.();
            }
            this.applyMediaBudgets(stateStore.get().media || {});
          }, `${label}保存失败`));
        });
    }
    new Setting(this.containerEl)
      .setName("应用当前媒体预算")
      .setDesc("设置保存后立即作用于后续下载；当前运行已消耗的预算不会回退")
      .addButton((button) => {
        button.setButtonText("应用");
        button.onClick(() => { this.applyMediaBudgets(stateStore.get().media || {}); notify("媒体预算已应用"); });
      });
  }

  applyMediaBudgets(media) {
    const service = this.plugin.mediaService;
    if (!service) return;
    const bytes = (key, fallback) => {
      const number = parsePositiveNumber(media?.[key]);
      return (number == null ? fallback : number) * BYTES_PER_GB;
    };
    service.maxFileBytes = bytes("maxFileGB", 2);
    service.runBudgetBytes = bytes("runBudgetGB", 5);
    service.accountBudgetBytes = bytes("accountBudgetGB", 50);
  }
}

function uniqueList(values) {
  return [...new Set((Array.isArray(values) ? values : []).map((entry) => String(entry || "").trim()).filter(Boolean))];
}

function parsePositiveNumber(value) {
  const number = Number(String(value ?? "").trim());
  return Number.isFinite(number) && number > 0 ? number : null;
}

function expandExecutablePath(value) {
  const text = String(value || "").trim();
  if (!text) return "";
  const home = process.env.HOME || process.env.USERPROFILE || "";
  return home ? text.replace(/^~(?=\/|\\|$)/, home) : text;
}

function safeError(error) {
  return String(error?.message || error || "未知错误")
    .replace(/https?:\/\/\S+/gi, "[url]")
    .replace(/(?:cookie|authorization|bearer|token|signature|xsec_token)\s*[:=]\s*[^\s,;]+/gi, "$1=[redacted]")
    .replace(/[\r\n]+/g, " ")
    .slice(0, 500);
}

module.exports = { MultiPlatformSettingTab, parsePositiveNumber, expandExecutablePath };
