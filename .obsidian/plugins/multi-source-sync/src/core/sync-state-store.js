const SCHEMA_VERSION = 3;
const NOTIFICATION_LEVELS = Object.freeze(["all", "errors", "off"]);

function deepMerge(base, value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return value === undefined ? base : value;
  const out = { ...(base || {}) };
  for (const [key, child] of Object.entries(value)) {
    out[key] = child && typeof child === "object" && !Array.isArray(child)
      ? deepMerge(out[key] || {}, child)
      : child;
  }
  return out;
}

const DEFAULT_STATE = {
  settingsSchemaVersion: SCHEMA_VERSION,
  platforms: {
    rednote: { enabled: true, syncBookmarks: true, saveVideo: false, quality: "standard", accounts: {} },
    bilibili: { enabled: true, syncBookmarks: true, saveVideo: true, quality: "standard", allParts: true, account: null, accounts: {}, activeAccountId: "", favoriteFolders: [], favoriteFoldersCache: [] },
    douyin: { enabled: true, syncBookmarks: true, saveVideo: true, quality: "standard", account: null, accounts: {}, activeAccountId: "", manualLinks: [], scrapedItems: [] },
  },
  syncState: { rednote: {}, bilibili: {}, douyin: {} },
  mediaTasks: {},
  transcriptionTasks: {},
  media: { maxFileGB: 2, runBudgetGB: 5, accountBudgetGB: 50 },
  resourcePaths: {},
  resourceMeta: {},
  transcription: { ffmpegPath: "", whisperPath: "", modelPath: "", timestamps: false, autoTranscribe: false },
  notifications: { level: "all", writeLog: true },
};

const KNOWN_PLATFORMS = Object.freeze(["rednote", "bilibili", "douyin"]);
const MEDIA_SETTING_KEYS = Object.freeze(["maxFileGB", "runBudgetGB", "accountBudgetGB"]);

/**
 * Keep values written by the settings tab JSON-safe.  Obsidian settings are
 * persisted asynchronously and may be changed while a previous save is still
 * in flight; taking a defensive snapshot prevents a later mutation from
 * changing the object that an earlier save is serialising.
 */
function cloneForPersistence(value) {
  try { return JSON.parse(JSON.stringify(value)); }
  catch (_) { return value; }
}

// Media tasks may contain short-lived request headers while a download is in
// progress.  Those headers are needed by the in-memory downloader but must
// never be written to data.json: platform adapters can put Cookie,
// Authorization, or token-bearing headers on a resolved media object.  Keep
// harmless headers (for example Referer/User-Agent) only when they are not
// sensitive, and apply the scrubber to both new and previously persisted
// tasks during migration.
function sanitizeHeaders(value) {
  if (!isRecord(value)) return undefined;
  const out = {};
  for (const [key, child] of Object.entries(value)) {
    if (isSensitiveKey(key)) continue;
    if (child == null) continue;
    const lower = String(key || "").toLowerCase();
    // Referer is harmless for normal playback, but a platform can put a
    // short-lived signature in its query string. Keep only a stable public
    // page URL when a task is persisted; the adapter will resolve a fresh
    // playback URL on retry.
    out[String(key)] = (lower === "referer" || lower === "referrer")
      ? sanitizePublicUrl(child)
      : String(child).slice(0, 1000);
  }
  return out;
}

function sanitizeMediaForPersistence(value) {
  if (!isRecord(value)) return value;
  const out = { ...value };
  // Resolved platform media URLs are often short-lived signed URLs.  They are
  // useful only during the in-memory download; adapters re-resolve them on a
  // retry, so do not retain query signatures in data.json.
  delete out.url;
  delete out.audioUrl;
  if (isRecord(out.headers)) out.headers = sanitizeHeaders(out.headers);
  if (isRecord(out.raw)) out.raw = sanitizeRawObject(out.raw);
  return out;
}

function sanitizeRawObject(value) {
  if (Array.isArray(value)) return value.map((entry) => sanitizeRawValue(entry));
  if (!isRecord(value)) return sanitizeRawValue(value);
  const out = {};
  for (const [key, child] of Object.entries(value)) {
    if (isSensitiveKey(key)) continue;
    // Platform raw responses frequently keep signed playback/cover links in
    // fields such as baseUrl, download_url or imageUri. Adapters resolve
    // those URLs again when retrying, so do not persist them in data.json.
    if (/(?:url|uri)$/i.test(String(key || ""))) continue;
    out[key] = sanitizeRawValue(child);
  }
  return out;
}

function sanitizeRawValue(value) {
  if (Array.isArray(value)) return value.map((entry) => sanitizeRawValue(entry));
  if (isRecord(value)) return sanitizeRawObject(value);
  // Raw platform fixtures occasionally place signed playback URLs in an
  // array or under a non-standard key (for example `urls` or `sources`).
  // Redact URL-shaped strings even when the property name is not one of the
  // conventional `videoUrl`/`base_url` forms.
  if (typeof value === "string" && /^https?:\/\//i.test(value)) return "[redacted-url]";
  return value;
}

function isSensitiveKey(key) {
  const original = String(key || "");
  const text = original.toLowerCase();
  if (/^(?:cookie|cookies|set-cookie|set-cookies|authorization|proxy-authorization)$/.test(text)) return true;
  // Cover snake/kebab and camelCase forms (`xsecToken`, `accessToken`) while
  // retaining harmless names such as `authorId`.
  if (/(?:cookie|set-cookie|authorization|proxy-authorization|token|secret|signature|csrf|session)(?:$|[-_]|[A-Z])/i.test(original)) return true;
  return /^(?:auth|authentication|access[_-]?key|refresh[_-]?key)$/i.test(original)
    || /(?:^|[-_])sign(?:ature)?(?:$|[-_])/i.test(original);
}

function sanitizeMediaTask(task) {
  if (!isRecord(task)) return task;
  const out = { ...task };
  if (Object.prototype.hasOwnProperty.call(out, "sourceUrl")) out.sourceUrl = sanitizePublicUrl(out.sourceUrl);
  if (isRecord(out.media)) out.media = sanitizeMediaForPersistence(out.media);
  if (isRecord(out.item)) {
    out.item = { ...out.item };
    if (Object.prototype.hasOwnProperty.call(out.item, "sourceUrl")) out.item.sourceUrl = sanitizePublicUrl(out.item.sourceUrl);
    if (isRecord(out.item.rawMeta)) out.item.rawMeta = sanitizeRawObject(out.item.rawMeta);
    if (isRecord(out.item.rawMeta)) {
      delete out.item.rawMeta.directMediaUrl;
      delete out.item.rawMeta.videoUrl;
      delete out.item.rawMeta.imageUrl;
    }
    if (Array.isArray(out.item.media)) out.item.media = out.item.media.map(sanitizeMediaForPersistence);
  }
  return out;
}

function isRecord(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

/**
 * A few older Obsidian saves represented an empty login/session value as
 * `{}`.  Treat that shape as logged out everywhere instead of relying on
 * JavaScript truthiness (`Boolean({}) === true`).  Non-empty objects are kept
 * for forward compatibility with hosts that expose a structured session;
 * current adapters still use the encoded string form.
 */
function hasSessionValue(value) {
  if (typeof value === "string") return value.trim().length > 0;
  if (isRecord(value)) return Object.keys(value).length > 0;
  return Boolean(value);
}

function hasAccountId(value) {
  return isRecord(value) && String(value.id || "").trim().length > 0;
}

function positiveNumber(value, fallback) {
  const number = typeof value === "string" && value.trim() === "" ? NaN : Number(value);
  return Number.isFinite(number) && number > 0 ? number : fallback;
}

function booleanSetting(value, fallback) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    if (/^(?:false|0|off|no)$/i.test(value.trim())) return false;
    if (/^(?:true|1|on|yes)$/i.test(value.trim())) return true;
  }
  if (typeof value === "number") {
    if (value === 0) return false;
    if (value === 1) return true;
  }
  return fallback;
}

function normalizeNotificationSettings(value) {
  const input = isRecord(value) ? value : {};
  let level = String(input.level || "").trim().toLowerCase();
  if (level === "error" || level === "only-errors" || level === "only_error") level = "errors";
  if (!NOTIFICATION_LEVELS.includes(level)) {
    // Accept the temporary flag names used by early local builds so an
    // upgrade never turns a user's choice back into noisy default notices.
    const showStatus = input.showStatusNotices ?? input.showStatus;
    const showErrors = input.showErrorNotices ?? input.showErrors;
    if (showStatus === false && showErrors === false) level = "off";
    else if (showStatus === false) level = "errors";
    else level = "all";
  }
  return {
    ...DEFAULT_STATE.notifications,
    ...input,
    level,
    writeLog: booleanSetting(input.writeLog, DEFAULT_STATE.notifications.writeLog),
  };
}

function normalizeMediaSettings(value) {
  const input = isRecord(value) ? value : {};
  const out = { ...DEFAULT_STATE.media };
  for (const key of MEDIA_SETTING_KEYS) out[key] = positiveNumber(input[key], DEFAULT_STATE.media[key]);
  // Preserve future/user-defined media settings while making the three
  // budget values above safe for byte conversion in MediaService.
  for (const [key, child] of Object.entries(input)) if (!MEDIA_SETTING_KEYS.includes(key)) out[key] = child;
  return out;
}

function normalizePathSetting(value) {
  if (value == null) return "";
  let text = String(value).trim();
  // Settings are entered in a text field, so users commonly paste a quoted
  // path (especially on Windows) or use `~/...` on macOS/Linux.  `spawn`
  // receives the path directly and does not expand either form.  Canonicalise
  // these harmless wrappers at persistence time; leave environment-variable
  // syntax untouched because its expansion is platform-specific.
  if (text.length >= 2 && ((text.startsWith("\"") && text.endsWith("\"")) || (text.startsWith("'") && text.endsWith("'")))) text = text.slice(1, -1).trim();
  const home = process.env.HOME || process.env.USERPROFILE || "";
  if (home) text = text.replace(/^~(?=\/|\\|$)/, home);
  return text;
}

function migrateState(value) {
  const input = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const state = deepMerge(DEFAULT_STATE, input);
  state.settingsSchemaVersion = SCHEMA_VERSION;
  if (!state.platforms || typeof state.platforms !== "object" || Array.isArray(state.platforms)) state.platforms = {};
  if (!state.syncState || typeof state.syncState !== "object" || Array.isArray(state.syncState)) state.syncState = {};
  for (const platform of KNOWN_PLATFORMS) {
    const platformValue = state.platforms[platform] && typeof state.platforms[platform] === "object" && !Array.isArray(state.platforms[platform]) ? state.platforms[platform] : {};
    state.platforms[platform] = deepMerge(DEFAULT_STATE.platforms[platform], platformValue);
    state.syncState[platform] = state.syncState[platform] && typeof state.syncState[platform] === "object" && !Array.isArray(state.syncState[platform]) ? state.syncState[platform] : {};

    // Older/hand-edited settings occasionally contain strings or null in
    // fields consumed directly by the adapters and settings UI.  Normalize
    // only known fields; unknown fields remain untouched for forward
    // compatibility.
    const platformState = state.platforms[platform];
    // Canonicalise the common legacy empty-object placeholders.  Keep a
    // non-empty account object even when its session has expired so account
    // scoped settings and existing paths remain addressable; callers use
    // hasSessionValue() before attempting a network run.
    platformState.account = hasAccountId(platformState.account) ? platformState.account : null;
    if (!hasSessionValue(platformState.session)) platformState.session = null;
    if (platformState.partition == null) platformState.partition = "";
    if (isRecord(platformState.accounts)) {
      for (const entry of Object.values(platformState.accounts)) {
        if (!isRecord(entry)) continue;
        if (!hasSessionValue(entry.session)) entry.session = null;
        if (entry.partition == null) entry.partition = "";
      }
    }
    platformState.enabled = booleanSetting(platformState.enabled, true);
    platformState.syncBookmarks = booleanSetting(platformState.syncBookmarks, true);
    platformState.saveVideo = booleanSetting(platformState.saveVideo, false);
    if (platformState.quality !== "high" && platformState.quality !== "standard") platformState.quality = "standard";
    if (platform === "bilibili") {
      platformState.accounts = normalizeAccounts(platformState.accounts);
      migrateLegacyActiveAccount(platformState);
      migrateAccountScopedSettings(platformState, ["favoriteFolders", "favoriteFoldersCache"]);
      migrateLegacyAccountCheckpoints(state.syncState[platform], platformState);
      platformState.allParts = booleanSetting(platformState.allParts, true);
      platformState.favoriteFolders = Array.isArray(platformState.favoriteFolders)
        ? platformState.favoriteFolders.map((entry) => String(entry).trim()).filter(Boolean)
        : [];
      platformState.favoriteFoldersCache = Array.isArray(platformState.favoriteFoldersCache)
        ? platformState.favoriteFoldersCache.filter(isRecord).map((entry) => ({ ...entry, id: String(entry.id ?? ""), name: String(entry.name || "收藏夹") })).filter((entry) => entry.id)
        : [];
    }
    if (platform === "douyin") {
      platformState.accounts = normalizeAccounts(platformState.accounts);
      migrateLegacyActiveAccount(platformState);
      migrateAccountScopedSettings(platformState, ["scrapedItems"]);
      migrateLegacyAccountCheckpoints(state.syncState[platform], platformState);
      platformState.manualLinks = sanitizeDouyinManualLinks(platformState.manualLinks);
      platformState.manualLinks = Array.isArray(platformState.manualLinks)
        ? [...new Set(platformState.manualLinks.map((entry) => String(entry).trim()).filter(Boolean))]
        : [];
      platformState.scrapedItems = sanitizeDouyinScrapedItems(platformState.scrapedItems);
    }
  }
  for (const key of ["mediaTasks", "transcriptionTasks", "resourcePaths", "resourceMeta"]) {
    if (!state[key] || typeof state[key] !== "object" || Array.isArray(state[key])) state[key] = {};
  }
  // Resource metadata is intentionally small (currently it stores B站
  // 收藏夹 unions), but older builds and hand-edited files may contain raw
  // platform responses. Apply the same URL/token scrubber used for media
  // tasks before the first schema-3 save so a migration cannot preserve a
  // signed playback URL in an otherwise harmless metadata entry.
  for (const [key, value] of Object.entries(state.resourceMeta)) {
    if (isRecord(value)) state.resourceMeta[key] = sanitizeRawObject(value);
  }
  for (const [key, task] of Object.entries(state.mediaTasks)) {
    if (isRecord(task)) state.mediaTasks[key] = sanitizeMediaTask(task);
  }
  const media = state.media && typeof state.media === "object" && !Array.isArray(state.media) ? state.media : {};
  state.media = normalizeMediaSettings(media);
  const transcription = state.transcription && typeof state.transcription === "object" && !Array.isArray(state.transcription) ? state.transcription : {};
  state.transcription = deepMerge(DEFAULT_STATE.transcription, transcription);
  for (const key of ["ffmpegPath", "whisperPath", "whisperCliPath", "modelPath"]) {
    if (Object.prototype.hasOwnProperty.call(state.transcription, key)) state.transcription[key] = normalizePathSetting(state.transcription[key]);
  }
  // Older builds called this setting whisperCliPath.  Keep the original
  // field untouched while exposing the new spelling to the shared service.
  if (!state.transcription.whisperPath && state.transcription.whisperCliPath) {
    state.transcription.whisperPath = state.transcription.whisperCliPath;
  }
  // Keep the legacy spelling in sync as well.  Some pre-extension code reads
  // whisperCliPath while the new local service reads whisperPath.
  if (!state.transcription.whisperCliPath && state.transcription.whisperPath) {
    state.transcription.whisperCliPath = state.transcription.whisperPath;
  }
  state.notifications = normalizeNotificationSettings(state.notifications);
  return state;
}

class SyncStateStore {
  constructor(initial, persist) {
    this.state = migrateState(initial);
    this.persist = typeof persist === "function" ? persist : async () => {};
    this._saveQueue = Promise.resolve();
  }
  get() { return this.state; }
  platform(id) { return this.state.platforms?.[id]; }
  setPlatform(id, patch) {
    if (!id || !isRecord(patch)) return this.save();
    const previous = this.state.platforms[id] || {};
    const previousActiveId = String(previous.activeAccountId || previous.account?.id || "");
    const safePatch = id === "douyin" ? sanitizeDouyinPlatformPatch(patch) : patch;
    this.state.platforms[id] = deepMerge(this.state.platforms[id] || {}, safePatch);
    if (id === "bilibili" || id === "douyin") syncAccountScopedPatch(this.state.platforms[id], safePatch, previousActiveId);
    return this.save();
  }
  getCursor(platform, accountId, type = "bookmark") {
    return this.state.syncState?.[platform]?.[accountId]?.[type]?.cursor;
  }
  getCheckpoint(platform, accountId, type = "bookmark") {
    const value = this.state.syncState?.[platform]?.[accountId]?.[type];
    if (!isRecord(value)) return { cursor: undefined, nextItemIndex: 0 };
    const nextItemIndex = Number(value.nextItemIndex);
    return {
      ...value,
      cursor: value.cursor == null || value.cursor === "" ? undefined : String(value.cursor),
      nextItemIndex: Number.isInteger(nextItemIndex) && nextItemIndex >= 0 ? nextItemIndex : 0,
    };
  }
  setCursor(platform, accountId, type, cursor, extra = {}) {
    if (!platform || !accountId || !type) return this.save();
    this.state.syncState[platform] = this.state.syncState[platform] || {};
    this.state.syncState[platform][accountId] = this.state.syncState[platform][accountId] || {};
    const previous = isRecord(this.state.syncState[platform][accountId][type]) ? this.state.syncState[platform][accountId][type] : {};
    const patch = isRecord(extra) ? extra : {};
    const next = { ...previous, cursor: cursor == null || cursor === "" ? undefined : String(cursor), ...patch, updatedAt: new Date().toISOString() };
    if (next.nextItemIndex != null) {
      const index = Number(next.nextItemIndex);
      next.nextItemIndex = Number.isInteger(index) && index >= 0 ? index : 0;
    }
    this.state.syncState[platform][accountId][type] = next;
    return this.save();
  }
  setMediaTask(key, task) {
    if (!key || !isRecord(task)) return this.save();
    const id = String(key);
    this.state.mediaTasks[id] = { ...sanitizeMediaTask(this.state.mediaTasks[id]), ...sanitizeMediaTask(task), updatedAt: new Date().toISOString() };
    return this.save();
  }
  setTranscriptionTask(key, task) {
    if (!key || !isRecord(task)) return this.save();
    this.state.transcriptionTasks[String(key)] = { ...this.state.transcriptionTasks[String(key)], ...task, updatedAt: new Date().toISOString() };
    return this.save();
  }
  setResourcePath(key, path) { if (key && path) this.state.resourcePaths[String(key)] = String(path); return this.save(); }
  getResourceMeta(key) { return key ? this.state.resourceMeta?.[key] : undefined; }
  setResourceMeta(key, meta) {
    if (key && isRecord(meta)) {
      const safe = sanitizeRawObject(meta);
      this.state.resourceMeta[String(key)] = { ...this.state.resourceMeta[String(key)], ...safe };
    }
    return this.save();
  }
  setMediaSettings(patch) {
    if (!isRecord(patch)) return this.save();
    this.state.media = normalizeMediaSettings({ ...this.state.media, ...patch });
    return this.save();
  }
  setTranscriptionSettings(patch) {
    if (isRecord(patch)) {
      this.state.transcription = deepMerge(this.state.transcription || {}, patch);
      for (const key of ["ffmpegPath", "whisperPath", "whisperCliPath", "modelPath"]) {
        if (Object.prototype.hasOwnProperty.call(this.state.transcription, key)) this.state.transcription[key] = normalizePathSetting(this.state.transcription[key]);
      }
      if (patch.whisperPath !== undefined && patch.whisperCliPath === undefined) this.state.transcription.whisperCliPath = this.state.transcription.whisperPath;
      if (patch.whisperCliPath !== undefined && patch.whisperPath === undefined) this.state.transcription.whisperPath = this.state.transcription.whisperCliPath;
    }
    return this.save();
  }
  setNotificationSettings(patch) {
    this.state.notifications = normalizeNotificationSettings({ ...this.state.notifications, ...(isRecord(patch) ? patch : {}) });
    return this.save();
  }
  async save() {
    const snapshot = cloneForPersistence(this.state);
    const run = this._saveQueue.catch(() => {}).then(() => this.persist(snapshot));
    this._saveQueue = run;
    await run;
    return this.state;
  }
}

function sanitizeDouyinScrapedItems(value) {
  if (!Array.isArray(value)) return [];
  return value.filter((entry) => isRecord(entry) && (entry.sourceId || entry.sourceUrl)).map((entry) => {
    const sourceUrl = sanitizeDouyinUrl(entry.sourceUrl);
    return {
      sourceId: String(entry.sourceId || sourceUrl || "").slice(0, 240),
      sourceUrl: sourceUrl.slice(0, 2000),
      title: String(entry.title || entry.sourceId || "抖音收藏").replace(/[\r\n]+/g, " ").slice(0, 500),
      kind: entry.kind === "image" ? "image" : "video",
    };
  }).filter((entry) => entry.sourceId);
}

function isAllowedDouyinLink(value) {
  try {
    const parsed = new URL(String(value || ""));
    if (!/^https?:$/i.test(parsed.protocol)) return false;
    if (parsed.username || parsed.password || (parsed.port && !["80", "443"].includes(parsed.port))) return false;
    const host = parsed.hostname.toLowerCase().replace(/^www\./, "");
    return host === "douyin.com" || host.endsWith(".douyin.com") || host === "iesdouyin.com" || host.endsWith(".iesdouyin.com");
  } catch (_) { return false; }
}

function sanitizeDouyinManualLinks(value) {
  return [...new Set((Array.isArray(value) ? value : []).map((entry) => sanitizeDouyinUrl(entry)).filter(Boolean).map((entry) => entry.slice(0, 2000)))];
}

// Public source/page URLs may be retained for reopening a note, but signed
// playback query parameters, credentials and fragments must never be copied
// into data.json.  Media adapters resolve short-lived direct URLs again when
// a task is retried.
function sanitizePublicUrl(value) {
  try {
    const original = String(value || "").trim();
    const parsed = new URL(original);
    if (!/^https?:$/i.test(parsed.protocol) || parsed.username || parsed.password) return "";
    parsed.username = "";
    parsed.password = "";
    parsed.hash = "";
    for (const key of [...parsed.searchParams.keys()]) {
      if (/(?:token|signature|^sig$|authorization|cookie|session|csrf|xsec|access[_-]?key|expires?|timestamp|w_rid|wts)/i.test(key)) parsed.searchParams.delete(key);
    }
    let result = parsed.toString();
    // URL#toString() canonicalises a bare origin to `https://host/`. Keep
    // the historical no-trailing-slash spelling for persisted Referer/source
    // values when there was no path to begin with; this avoids noisy data.json
    // diffs while retaining the same origin.
    if (/^https?:\/\/[^/?#]+$/i.test(original) && result.endsWith("/")) result = result.slice(0, -1);
    return result;
  } catch (_) { return ""; }
}

function sanitizeDouyinUrl(value) {
  const safe = sanitizePublicUrl(value);
  return isAllowedDouyinLink(safe) ? safe : "";
}

function sanitizeDouyinPlatformPatch(patch) {
  const out = { ...patch };
  if (Object.prototype.hasOwnProperty.call(out, "manualLinks")) out.manualLinks = sanitizeDouyinManualLinks(out.manualLinks);
  if (Object.prototype.hasOwnProperty.call(out, "scrapedItems")) out.scrapedItems = sanitizeDouyinScrapedItems(out.scrapedItems);
  return out;
}

function normalizeAccounts(value) {
  if (!isRecord(value)) return {};
  const out = {};
  for (const [id, entry] of Object.entries(value)) {
    if (!isRecord(entry)) continue;
    const accountId = String(entry.id || id || "").trim().slice(0, 180);
    if (!accountId) continue;
    out[accountId] = { ...entry, id: accountId, name: String(entry.name || accountId).replace(/[\r\n]+/g, " ").slice(0, 180) };
  }
  return out;
}

function migrateLegacyActiveAccount(platformState) {
  const account = isRecord(platformState.account) && platformState.account.id ? { ...platformState.account } : null;
  const activeId = String(platformState.activeAccountId || account?.id || "").trim();
  if (account?.id) {
    platformState.accounts[account.id] = {
      ...(platformState.accounts[account.id] || {}),
      ...account,
      session: platformState.session || platformState.accounts[account.id]?.session || null,
      partition: platformState.partition || platformState.accounts[account.id]?.partition || "",
    };
  }
  if (activeId && platformState.accounts[activeId]) {
    platformState.activeAccountId = activeId;
    const active = platformState.accounts[activeId];
    platformState.account = { ...active, session: undefined, partition: undefined };
    delete platformState.account.session;
    delete platformState.account.partition;
    platformState.session = active.session || platformState.session || null;
    platformState.partition = active.partition || platformState.partition || "";
  } else if (account?.id) {
    platformState.activeAccountId = account.id;
  } else if (!platformState.activeAccountId) {
    // After logging out, the legacy `account` field is cleared while the
    // account registry intentionally remains. Pick another account only when
    // it still has a session; a registry containing only logged-out accounts
    // must not make the coordinator report a phantom logged-in account.
    const first = Object.keys(platformState.accounts).find((id) => platformState.accounts[id]?.session);
    if (first) {
      platformState.activeAccountId = first;
      const active = platformState.accounts[first];
      platformState.account = { id: first, name: active.name || first, platform: active.platform };
      platformState.session = active.session || null;
      platformState.partition = active.partition || "";
    } else {
      platformState.activeAccountId = "";
      platformState.account = null;
      platformState.session = null;
      platformState.partition = "";
    }
  }
}

// Account-specific controls were introduced after the initial multi-account
// schema. Preserve an existing legacy value for the active account, while
// storing future edits under accounts[id] so switching cannot leak one user's
// folder whitelist or scraped cache into another user's run.
function migrateAccountScopedSettings(platformState, keys) {
  if (!isRecord(platformState)) return;
  const activeId = String(platformState.activeAccountId || platformState.account?.id || "");
  if (!activeId || !platformState.accounts?.[activeId]) return;
  const active = platformState.accounts[activeId];
  for (const key of keys) {
    if (active[key] === undefined && platformState[key] !== undefined) active[key] = cloneForPersistence(platformState[key]);
    if (active[key] !== undefined) platformState[key] = cloneForPersistence(active[key]);
  }
  // Keep the registry authoritative after migration; the top-level mirror is
  // only a compatibility view consumed by older settings/UI code.
  for (const key of keys) if (active[key] !== undefined) platformState[key] = cloneForPersistence(active[key]);
}

function migrateLegacyAccountCheckpoints(syncState, platformState) {
  if (!isRecord(syncState) || !isRecord(platformState)) return;
  const activeId = String(platformState.activeAccountId || platformState.account?.id || "");
  if (!activeId) return;
  // Pre-multi-account builds stored `{syncState: {platform: {bookmark: …}}}`
  // directly under the platform. Move that checkpoint to the active account
  // exactly once; never overwrite an account-scoped checkpoint already saved
  // by a newer build.
  const legacyTypes = {};
  for (const type of ["bookmark", "like", "post", "album", "comment"]) {
    if (isRecord(syncState[type])) legacyTypes[type] = syncState[type];
  }
  if (Object.keys(legacyTypes).length) {
    const scoped = { ...(isRecord(syncState[activeId]) ? syncState[activeId] : {}) };
    for (const [type, value] of Object.entries(legacyTypes)) {
      if (!Object.prototype.hasOwnProperty.call(scoped, type)) scoped[type] = value;
      delete syncState[type];
    }
    syncState[activeId] = scoped;
  }
}

function syncAccountScopedPatch(platformState, patch, previousActiveId) {
  if (!isRecord(platformState) || !isRecord(patch)) return;
  const activeId = String(platformState.activeAccountId || platformState.account?.id || "");
  const scopedKeys = ["favoriteFolders", "favoriteFoldersCache", "scrapedItems"];
  // Switching/logging out must also refresh the compatibility mirror.  If we
  // leave the previous account's top-level arrays in place, a newly logged-in
  // account without preferences can inherit the old user's B站白名单 or
  // 抖音采集缓存 even though its registry entry is clean.
  if (!activeId || !platformState.accounts?.[activeId]) {
    if (previousActiveId && previousActiveId !== activeId) {
      for (const key of scopedKeys) {
        platformState[key] = key === "favoriteFoldersCache" || key === "scrapedItems" || key === "favoriteFolders" ? [] : undefined;
        if (isRecord(platformState.account)) delete platformState.account[key];
      }
    }
    return;
  }
  const account = platformState.accounts[activeId];
  const switched = previousActiveId !== activeId;
  if (switched) {
    for (const key of scopedKeys) {
      platformState[key] = account[key] === undefined ? [] : cloneForPersistence(account[key]);
    }
  }
  for (const key of scopedKeys) {
    if (!Object.prototype.hasOwnProperty.call(patch, key)) continue;
    account[key] = cloneForPersistence(platformState[key]);
    // `account` is a compatibility mirror consumed by older UI code. Keep it
    // in lockstep with the active registry entry so switching accounts cannot
    // leave the previous user's folder/cache values visible at the top level.
    if (isRecord(platformState.account)) platformState.account[key] = cloneForPersistence(platformState[key]);
  }
  if (previousActiveId && previousActiveId !== activeId && platformState.accounts[previousActiveId]) {
    // A switchAccount implementation writes the new account in the same
    // patch; never overwrite the previous account's private settings with the
    // newly selected account's values.
    for (const key of scopedKeys) {
      if (platformState.accounts[previousActiveId][key] !== undefined) continue;
      delete platformState.accounts[previousActiveId][key];
    }
  }
}

module.exports = { SCHEMA_VERSION, DEFAULT_STATE, NOTIFICATION_LEVELS, deepMerge, migrateState, SyncStateStore, normalizeMediaSettings, normalizeNotificationSettings, positiveNumber, sanitizeHeaders, sanitizeMediaTask, sanitizeDouyinScrapedItems, sanitizeDouyinManualLinks, sanitizePublicUrl, isAllowedDouyinLink, normalizeAccounts, migrateLegacyActiveAccount, migrateAccountScopedSettings, migrateLegacyAccountCheckpoints, syncAccountScopedPatch, hasSessionValue, hasAccountId };
