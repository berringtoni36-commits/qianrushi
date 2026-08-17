const path = require("path");
const { resourceKey } = require("../core/normalized-item");
const { platformFolder, safeFolder } = require("../media/media-service");

class ObsidianWriter {
  constructor({ vault, root = "", stateStore } = {}) { this.vault = vault; this.root = root; this.stateStore = stateStore; }
  notePath(item) {
    const key = resourceKey(item);
    const remembered = this.stateStore?.get?.().resourcePaths?.[key];
    const safeRemembered = remembered && isSafeVaultPath(remembered) ? normalizeVaultPath(remembered) : "";
    const generated = path.posix.join(this.root || "", platformFolder(item.platform), accountFolder(item), "收藏（Favorites）", `${safeFolder(item.sourceId)}.md`);
    return safeRemembered || (isSafeVaultPath(generated) ? generated : path.posix.join(platformFolder(item.platform), accountFolder(item), "收藏（Favorites）", `${safeFolder(item.sourceId)}.md`));
  }
  async write(item) {
    item = hydratePersistedMedia(item, this.stateStore, this.vault);
    const filePath = this.notePath(item);
    const existing = this.vault?.getAbstractFileByPath?.(filePath);
    const state = this.stateStore?.get?.() || {};
    const mediaTasks = item.media?.map((media) => state.mediaTasks?.[`${item.platform}:${item.accountId}:${item.sourceId}:${media.id}`]).filter(Boolean) || [];
    const videoMedia = item.media?.filter((media) => media.kind === "video") || [];
    const transcriptionTasks = videoMedia.map((media) => state.transcriptionTasks?.[`${item.platform}:${item.accountId}:${item.sourceId}:${media.id}`]).filter(Boolean);
    const transcriptStatuses = transcriptionTasks.map((task) => task.status).filter(Boolean);
    const transcriptStatus = videoMedia.length === 0 ? "none" : transcriptStatuses.length === videoMedia.length && transcriptStatuses.every((status) => status === "completed") ? "completed" : transcriptStatuses.some((status) => status === "failed") ? "failed" : "pending";
    const transcriptUpdatedAt = latestTaskTimestamp(transcriptionTasks);
    const downloadErrors = [
      ...mediaTasks.map((task) => task.error),
      ...(item.media || []).map((media) => media.error),
    ].map(safeStatusText).filter(Boolean);
    const frontmatter = {
      sourcePlugin: "multi-source-sync",
      sourcePlatform: item.platform,
      sourceId: item.sourceId,
      type: item.type || "bookmark",
      accountId: item.accountId,
      accountName: item.accountName,
      contentKind: item.media?.some((media) => media.kind === "video") ? "video" : (item.media?.some((media) => media.kind === "image") ? "image" : "article"),
      sourceUrl: safeExternalUrl(item.sourceUrl),
      url: safeExternalUrl(item.sourceUrl),
      resourceKey: resourceKey(item),
      tags: item.tags,
      collections: item.collections?.map((collection) => collection.name) || [],
      favoriteFolders: item.favoriteFolders || item.collections?.map((collection) => collection.name) || [],
      // Direct platform media URLs are frequently short-lived signed URLs.
      // Keep the local path when available; otherwise the stable item page is
      // enough to reopen the content and avoids leaking an expired token into
      // YAML/frontmatter or a Markdown link.
      media: item.media?.map((media) => (media.localPath && isSafeVaultPath(media.localPath) ? media.localPath : safeExternalUrl(item.sourceUrl))).filter(Boolean) || [],
      downloadStatus: item.media?.length ? (item.media.some((media) => ["failed", "forbidden", "expired", "unsupported"].includes(String(media.status || ""))) ? "failed" : item.media.some((media) => media.status === "skipped_budget") ? "skipped_budget" : item.media.every((media) => media.localPath && isSafeVaultPath(media.localPath)) ? "completed" : "pending") : "none",
      downloadError: downloadErrors[0] || "",
      videoLocalPath: item.media?.find((media) => media.kind === "video" && media.localPath && isSafeVaultPath(media.localPath))?.localPath || "",
      transcriptStatus,
      transcriptUpdatedAt,
    };
    const markdown = renderMarkdown(item, frontmatter);
    if (existing && isMarkdownFile(existing, filePath) && this.vault?.read && this.vault?.modify) {
      const current = await this.vault.read(existing);
      const managed = /<!-- multi-source-sync:item:start -->[\s\S]*?<!-- multi-source-sync:item:end -->/.test(current);
      if (!managed) {
        const target = await this.uniquePath(filePath);
        await this.ensureParent(target);
        await this.vault.create(target, markdown);
        await this.stateStore?.setResourcePath?.(resourceKey(item), target);
        return { path: target, skipped: false, conflict: true };
      }
      // Re-syncing metadata/media must not erase a transcription section that
      // was produced by an earlier manual task. Only the explicitly managed
      // transcription markers are carried forward; user-written headings are
      // never touched.
      await this.vault.modify(existing, mergeManagedItem(current, preserveManagedTranscription(current, markdown)));
      await this.stateStore?.setResourcePath?.(resourceKey(item), filePath);
    } else if (this.vault?.create) {
      await this.ensureParent(filePath);
      let target = filePath;
      if (this.vault.getAbstractFileByPath?.(target)) target = await this.uniquePath(filePath);
      await this.vault.create(target, markdown);
      await this.stateStore?.setResourcePath?.(resourceKey(item), target);
      return { path: target, skipped: false };
    }
    return { path: filePath, skipped: false };
  }
  /**
   * Reflect a completed/failed media task in an already-written note without
   * rebuilding the note from the deliberately small persisted task snapshot.
   * This is used by retry commands after a signed media URL has been
   * re-resolved; user prose and managed transcription sections stay intact.
   */
  async updateMediaTask(task) {
    if (!task?.notePath || !task?.mediaId) return false;
    const notePath = normalizeVaultPath(task.notePath);
    if (!isSafeVaultPath(notePath)) return false;
    const file = this.vault?.getAbstractFileByPath?.(notePath);
    if (!file || !this.vault?.read || !this.vault?.modify) return false;
    let content = await this.vault.read(file);
    const identity = encodeURIComponent(JSON.stringify({ platform: task.platform, accountId: task.accountId, sourceId: task.sourceId, mediaId: task.mediaId }));
    const marker = `<!-- multi-source-sync:media:${identity} -->`;
    const blockRe = new RegExp(`${escapeRegExp(marker)}[\\s\\S]*?<!--\\s*multi-source-sync:media-end\\s*-->`, "m");
    if (!blockRe.test(content)) return false;
    const media = task.media || {};
    // A failed/expired retry can still point at an older local file that was
    // never replaced. Keep that playable file when it is present; otherwise
    // fall back to the stable item page and never persist a signed media URL.
    const localPath = cleanEmbedPath(task.localPath || "");
    const safeLocalPath = isSafeVaultPath(localPath) ? localPath : "";
    const localFile = safeLocalPath && this.vault?.getAbstractFileByPath?.(safeLocalPath);
    const embedLocal = safeLocalPath && Boolean(localFile);
    const replacement = `${marker}\n${embedLocal ? `![[${safeLocalPath}]]` : `[${safeEmbedLabel(media.title || task.mediaId)}](${safeExternalUrl(task.sourceUrl)})`}\n<!-- multi-source-sync:media-end -->`;
    content = content.replace(blockRe, replacement);

    const noteTasks = Object.values(this.stateStore?.get?.().mediaTasks || {}).filter((entry) => entry && normalizeVaultPath(entry.notePath) === notePath);
    const videoTasks = noteTasks.filter((entry) => entry.media?.kind === "video");
    // A persisted `completed` state can outlive a manually deleted Vault
    // file (or a partial restore after restart).  Do not publish a stale
    // completed frontmatter value; the next retry should remain visible as
    // pending until a real managed file exists.
    const completed = videoTasks.filter((entry) => {
      const local = entry?.localPath && isSafeVaultPath(entry.localPath) ? entry.localPath : "";
      if (entry.status !== "completed" || !local) return false;
      return !this.vault?.getAbstractFileByPath || Boolean(this.vault.getAbstractFileByPath(local));
    });
    const hasFailed = videoTasks.some((entry) => ["failed", "expired", "forbidden", "unsupported"].includes(String(entry.status || "")));
    const hasBudgetSkip = videoTasks.some((entry) => entry.status === "skipped_budget");
    const downloadStatus = videoTasks.length && completed.length === videoTasks.length ? "completed" : hasFailed ? "failed" : hasBudgetSkip ? "skipped_budget" : "pending";
    content = replaceManagedFrontmatterField(content, "downloadStatus", downloadStatus);
    const downloadError = noteTasks.map((entry) => safeStatusText(entry.error)).filter(Boolean)[0] || "";
    content = replaceManagedFrontmatterField(content, "downloadError", downloadError);
    content = replaceManagedFrontmatterField(content, "videoLocalPath", completed[0]?.localPath || "");
    await this.vault.modify(file, content);
    return true;
  }
  async updateTranscriptionStatus(notePath, status, updatedAt = "") {
    const file = this.vault?.getAbstractFileByPath?.(notePath);
    if (!file || !this.vault?.read || !this.vault?.modify) return false;
    const content = await this.vault.read(file);
    if (!/<!-- multi-source-sync:item:start -->[\s\S]*?<!-- multi-source-sync:item:end -->/.test(content)) return false;
    const next = replaceManagedFrontmatterField(content, "transcriptStatus", status);
    const final = replaceManagedFrontmatterField(next, "transcriptUpdatedAt", updatedAt);
    if (final !== content) await this.vault.modify(file, final);
    return true;
  }
  async uniquePath(filePath) {
    const base = filePath.slice(0, -3);
    for (let index = 1; index < 10000; index++) {
      const suffix = index === 1 ? "-Multi Source Sync" : `-Multi Source Sync ${index}`;
      const target = `${base}${suffix}.md`;
      if (!this.vault.getAbstractFileByPath?.(target)) return target;
    }
    throw new Error("无法为笔记生成唯一文件名");
  }
  async ensureParent(filePath) {
    const parts = filePath.split("/"); parts.pop(); let current = "";
    for (const part of parts) { current = current ? `${current}/${part}` : part; if (!this.vault.getAbstractFileByPath?.(current) && this.vault.createFolder) { try { await this.vault.createFolder(current); } catch (_) {} } }
  }
}
function isMarkdownFile(file, filePath) {
  return String(file?.extension || "").toLowerCase() === "md" || /\.md$/i.test(String(file?.path || filePath || ""));
}
const TRANSCRIPTION_START = "<!-- multi-source-sync-transcription:start -->";
const TRANSCRIPTION_END = "<!-- multi-source-sync-transcription:end -->";
function preserveManagedTranscription(current, next) {
  if (next.includes(TRANSCRIPTION_START)) return next;
  const match = String(current || "").match(new RegExp(`${escapeRegExp(TRANSCRIPTION_START)}[\\s\\S]*?${escapeRegExp(TRANSCRIPTION_END)}`));
  return match ? `${next.replace(/\s*$/, "")}\n\n${match[0]}\n` : next;
}
function mergeManagedItem(current, next) {
  const start = "<!-- multi-source-sync:item:start -->";
  const end = "<!-- multi-source-sync:item:end -->";
  const managed = new RegExp(`${escapeRegExp(start)}[\\s\\S]*?${escapeRegExp(end)}`);
  const replacement = String(next || "").match(managed)?.[0];
  if (!replacement) return next;
  return String(current || "").match(managed)
    ? String(current).replace(managed, replacement)
    : next;
}
function escapeRegExp(value) { return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
function replaceFrontmatterField(content, key, value) {
  const line = `${key}: ${JSON.stringify(String(value || ""))}`;
  const re = new RegExp(`^${escapeRegExp(key)}\\s*:\\s*[^\\n]*$`, "m");
  return re.test(String(content || "")) ? String(content).replace(re, line) : content;
}
function replaceManagedFrontmatterField(content, key, value) {
  const itemRe = /<!--\s*multi-source-sync:item:start\s*-->[\s\S]*?<!--\s*multi-source-sync:item:end\s*-->/m;
  const text = String(content || "");
  return itemRe.test(text) ? text.replace(itemRe, (block) => replaceFrontmatterField(block, key, value)) : text;
}
function latestTaskTimestamp(tasks) {
  return (Array.isArray(tasks) ? tasks : [])
    .map((task) => String(task?.transcriptUpdatedAt || task?.completedAt || task?.updatedAt || "").trim())
    .filter(Boolean)
    .sort()
    .pop() || "";
}
function safeStatusText(value) {
  return String(value || "")
    .replace(/https?:\/\/\S+/gi, "[url]")
    .replace(/(?:cookie|authorization|bearer|token|signature|xsec_token)\s*[:=]\s*[^\s,;]+/gi, "$1=[redacted]")
    .replace(/[\r\n]+/g, " ")
    .slice(0, 500);
}
function cleanEmbedPath(value) { return String(value || "").replace(/\\/g, "/").replace(/^\/+/, ""); }
function normalizeVaultPath(value) {
  const raw = String(value || "").trim().replace(/\\/g, "/");
  if (!raw || raw.startsWith("/") || raw.startsWith("//") || /^[A-Za-z]:\//.test(raw)) return "";
  return path.posix.normalize(cleanEmbedPath(raw).replace(/^\.\//, ""));
}
function safeEmbedLabel(value) { return String(value || "视频").replace(/[\r\n\[\]\u0000-\u001f]+/g, " ").slice(0, 180) || "视频"; }
function safeExternalUrl(value) {
  try {
    const parsed = new URL(String(value || "").trim());
    if (!/^https?:$/i.test(parsed.protocol)) return "";
    parsed.username = "";
    parsed.password = "";
    parsed.hash = "";
    for (const key of [...parsed.searchParams.keys()]) {
      if (/(?:token|signature|^sig$|authorization|cookie|session|csrf|xsec|access[_-]?key|expires?|timestamp|w_rid|wts)/i.test(key)) parsed.searchParams.delete(key);
    }
    return parsed.toString();
  } catch (_) { return ""; }
}
function hydratePersistedMedia(item, stateStore, vault) {
  const value = item && typeof item === "object" ? item : {};
  if (!Array.isArray(value.media) || !stateStore?.get) return value;
  const tasks = stateStore.get()?.mediaTasks || {};
  const media = value.media.map((entry) => {
    const safeEntry = entry && typeof entry === "object" ? { ...entry } : {};
    const id = String(entry?.id || "");
    const key = `${value.platform}:${value.accountId}:${value.sourceId}:${id}`;
    const task = tasks[key];
    const persistedPath = task?.localPath || safeEntry.localPath || "";
    let localPath = cleanEmbedPath(persistedPath);
    if (localPath && (!isSafeVaultPath(localPath) || (vault?.getAbstractFileByPath && !vault.getAbstractFileByPath(localPath)))) localPath = "";
    if (!task) return { ...safeEntry, localPath };
    const status = task.status === "completed" && !localPath ? "pending" : (task.status || safeEntry.status || "pending");
    return {
      ...safeEntry,
      localPath,
      status,
      error: task.error || safeEntry.error || "",
    };
  });
  return { ...value, media };
}
function accountFolder(item) {
  // New platform paths are keyed by the stable account ID.  A nickname is
  // display metadata only, so changing it cannot silently create a second
  // copy of every note/media file.  Legacy RedNote paths are never migrated
  // by this writer and retain their historical nickname-based convention.
  return safeFolder(item?.platform === "rednote" ? (item.accountName || item.accountId) : (item.accountId || item.accountName));
}
function isSafeVaultPath(value) {
  const raw = String(value || "").replace(/\\/g, "/");
  const normalized = path.posix.normalize(raw);
  return Boolean(normalized) && normalized !== "." && normalized !== ".." && !normalized.startsWith("../") && !normalized.startsWith("/") && !normalized.startsWith("//") && !/^[A-Za-z]:\//.test(normalized) && !normalized.includes("\u0000");
}
function renderMarkdown(item, frontmatter) {
  const yaml = Object.entries(frontmatter).map(([key, value]) => `${key}: ${value === undefined ? "\"\"" : Array.isArray(value) ? `[${value.map((entry) => JSON.stringify(entry)).join(", ")}]` : JSON.stringify(value)}`).join("\n");
  // Keep a stable identity beside every media embed.  The marker is only
  // metadata (Obsidian renders it as an HTML comment) and lets the manual
  // transcription command distinguish multiple videos that happen to share
  // a filename.  It deliberately excludes URLs, cookies and raw platform
  // responses.
  const media = (item.media || []).map((entry) => {
    const identity = encodeURIComponent(JSON.stringify({ platform: item.platform, accountId: item.accountId, sourceId: item.sourceId, mediaId: entry.id }));
    const embed = entry.localPath ? `![[${entry.localPath}]]` : `[${safeEmbedLabel(entry.title || entry.id)}](${safeExternalUrl(item.sourceUrl)})`;
    return `<!-- multi-source-sync:media:${identity} -->\n${embed}\n<!-- multi-source-sync:media-end -->`;
  }).join("\n\n");
  const title = safeManagedText(String(item.title || "未命名").replace(/[\r\n]+/g, " ").trim() || "未命名");
  const fullText = safeManagedText(item.fullText || "");
  const sourceUrl = safeExternalUrl(item.sourceUrl);
  return `<!-- multi-source-sync:item:start -->\n---\n${yaml}\n---\n\n# ${title}\n\n${fullText}\n\n${media}\n\n来源：[${sourceUrl}](${sourceUrl})\n\n<!-- multi-source-sync:item:end -->\n`;
}

function safeManagedText(value) {
  return String(value || "").replace(/<!--\s*multi-source-sync:[^>]*-->/gi, "[插件标记已转义]");
}

module.exports = { ObsidianWriter, renderMarkdown, safeExternalUrl };
