const { Plugin, Notice } = require("obsidian");
const { spawn } = require("child_process");
const path = require("path");

// The third-party sync plugin remains the source of truth.  This local plugin
// only runs the idempotent formatter/generator after source files change.
const WATCH_PREFIXES = [
  "小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/",
  "小红书（RedNote）/。。。。。。。/点赞（Likes）/",
  "小红书（RedNote）/。。。。。。。/我的发布（Posts）/",
  "小红书（RedNote）/。。。。。。。/专辑（Albums）/",
];

class RedNoteIndexerPlugin extends Plugin {
  async onload() {
    this.timer = null;
    this.child = null;
    this.rerun = false;

    this.addCommand({
      id: "refresh-rednote-index",
      name: "刷新小红书精选索引",
      callback: () => this.queueRefresh(true),
    });

    this.registerEvent(this.app.vault.on("create", (file) => this.handleFile(file)));
    this.registerEvent(this.app.vault.on("modify", (file) => this.handleFile(file)));

    // Rebuild once after Obsidian is ready, so the entry is correct even if
    // the vault received new sync files while Obsidian was closed.
    this.app.workspace.onLayoutReady(() => this.queueRefresh(false));
  }

  onunload() {
    if (this.timer) window.clearTimeout(this.timer);
    this.timer = null;
    if (this.child) {
      this.child.kill();
      this.child = null;
    }
  }

  handleFile(file) {
    const filePath = String(file?.path || "");
    if (!filePath.endsWith(".md")) return;
    if (WATCH_PREFIXES.some((prefix) => filePath.startsWith(prefix))) {
      this.queueRefresh(false);
    }
  }

  queueRefresh(showNotice) {
    if (this.timer) window.clearTimeout(this.timer);
    this.timer = window.setTimeout(() => {
      this.timer = null;
      this.runIndexer(showNotice);
    }, 2500);
  }

  runIndexer(showNotice) {
    if (this.child) {
      this.rerun = true;
      return;
    }

    const vaultPath = this.app.vault.adapter.basePath;
    if (!vaultPath) {
      console.error("RedNote Indexer: vault base path is unavailable");
      if (showNotice) new Notice("小红书索引刷新失败：无法取得 Vault 路径");
      return;
    }

    const scriptPath = path.join(vaultPath, ".rednote_generate.py");
    this.child = spawn("/usr/bin/python3", [scriptPath], {
      cwd: vaultPath,
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stderr = "";
    this.child.stderr.on("data", (chunk) => {
      stderr += String(chunk);
    });
    this.child.stdout.on("data", (chunk) => {
      console.debug("RedNote Indexer:", String(chunk).trim());
    });
    this.child.on("error", (error) => {
      console.error("RedNote Indexer failed to start", error);
    });
    this.child.on("close", (code) => {
      this.child = null;
      if (code !== 0) {
        console.error("RedNote Indexer failed", stderr.trim());
        if (showNotice) new Notice("小红书索引刷新失败，请查看开发者控制台");
      } else if (showNotice) {
        new Notice("小红书精选索引已刷新");
      }
      if (this.rerun) {
        this.rerun = false;
        this.queueRefresh(false);
      }
    });
  }
}

module.exports = RedNoteIndexerPlugin;
