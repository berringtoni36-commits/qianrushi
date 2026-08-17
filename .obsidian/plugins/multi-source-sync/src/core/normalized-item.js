/**
 * Platform-neutral contracts and helpers used by the multi-platform extension.
 * The plugin is distributed as a single Obsidian bundle, so these modules are
 * intentionally dependency-free and can also be unit tested with Node.
 */

const PLATFORM_IDS = Object.freeze(["rednote", "bilibili", "douyin"]);

function assertPlatform(id) {
  if (!PLATFORM_IDS.includes(id)) throw new Error(`Unsupported platform: ${id}`);
  return id;
}

function resourceKey(itemOrParts) {
  const value = itemOrParts || {};
  const platform = assertPlatform(String(value.platform || "rednote"));
  const accountId = safeKey(value.accountId || "default");
  const type = safeKey(value.type || "bookmark");
  const sourceId = safeKey(value.sourceId || value.resourceId || "unknown");
  return `${platform}:${accountId}:${type}:${sourceId}`;
}

function safeKey(value) {
  return String(value).trim().replace(/[^a-zA-Z0-9_.:-]+/g, "_").slice(0, 180) || "unknown";
}

function normalizeItem(input) {
  const item = input || {};
  const platform = assertPlatform(item.platform);
  const sourceId = String(item.sourceId || item.resourceId || "").trim();
  if (!sourceId) throw new Error("NormalizedItem.sourceId is required");
  const accountId = String(item.accountId || "default").trim();
  const media = Array.isArray(item.media) ? item.media.map((entry, index) => {
    const value = entry && typeof entry === "object" ? entry : {};
    return {
      id: String(value.id || `${sourceId}-${index + 1}`),
      kind: value.kind === "image" || value.kind === "video" ? value.kind : "unsupported",
      url: value.url ? String(value.url) : "",
      audioUrl: value.audioUrl ? String(value.audioUrl) : undefined,
      title: value.title ? String(value.title) : undefined,
      localPath: value.localPath ? String(value.localPath) : undefined,
      status: value.status || "pending",
      error: value.error ? String(value.error) : undefined,
      duration: Number.isFinite(value.duration) ? value.duration : undefined,
      partIndex: Number.isFinite(value.partIndex) ? value.partIndex : index + 1,
      headers: value.headers && typeof value.headers === "object" ? { ...value.headers } : undefined,
      requiresMerge: value.requiresMerge === true,
      raw: value.raw && typeof value.raw === "object" ? value.raw : undefined,
    };
  }) : [];
  return {
    resourceId: String(item.resourceId || `${platform}:${sourceId}`),
    platform,
    accountId,
    accountName: String(item.accountName || accountId),
    type: "bookmark",
    sourceId,
    sourceUrl: String(item.sourceUrl || ""),
    title: String(item.title || sourceId),
    author: item.author ? String(item.author) : undefined,
    authorId: item.authorId ? String(item.authorId) : undefined,
    text: String(item.text || ""),
    fullText: String(item.fullText || item.text || ""),
    tags: Array.isArray(item.tags) ? item.tags.map(String) : [],
    metrics: item.metrics && typeof item.metrics === "object" ? { ...item.metrics } : {},
    createdAt: item.createdAt ? String(item.createdAt) : undefined,
    favoritedAt: item.favoritedAt ? String(item.favoritedAt) : undefined,
    collections: Array.isArray(item.collections) ? item.collections.filter((collection) => collection && typeof collection === "object").map((collection) => ({
      id: String(collection.id || "default"),
      name: String(collection.name || "收藏"),
    })) : [],
    media,
    category: item.category ? String(item.category) : undefined,
    rawMeta: item.rawMeta && typeof item.rawMeta === "object" ? item.rawMeta : {},
    favoriteFolders: Array.isArray(item.favoriteFolders) ? item.favoriteFolders.map(String) : undefined,
  };
}

module.exports = {
  PLATFORM_IDS,
  assertPlatform,
  normalizeItem,
  resourceKey,
  safeKey,
};
