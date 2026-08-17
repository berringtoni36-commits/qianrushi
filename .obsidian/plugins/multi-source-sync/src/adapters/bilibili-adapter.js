const { requestUrl } = (() => { try { return require("obsidian"); } catch (_) { return {}; } })();
const { PlatformAdapter, normalizePage } = require("../core/platform-adapter");
const { normalizeItem } = require("../core/normalized-item");
const { encodeSession, decodeSession, cookieHeader, readCookies, openLoginWindow, createPartition, clearPartition } = require("./browser-session");
const { extractWbiKeys, signWbiUrl } = require("./bilibili-wbi");

const BILI_ORIGIN = "https://www.bilibili.com";
const BILI_API = "https://api.bilibili.com";

class BilibiliAdapter extends PlatformAdapter {
  constructor(context) {
    super("bilibili", "哔哩哔哩（Bilibili）");
    this.context = context;
    const session = decodeSession(this.settings.session);
    this.cookies = session?.cookies || [];
    if (session?.invalid) this.context.notify?.("B站本地登录态无法解码，请重新登录（未删除原配置）");
    // A video can appear in more than one Bilibili favourite folder. Keep a
    // run-local union so the shared writer updates one note with all folders.
    this.itemCollections = new Map();
    // Cache detail payloads for the duration of a sync run. A video saved in
    // two folders should update one note with the union of folders without
    // issuing the same `/view` request twice.
    this.itemDetails = new Map();
    this.loginWindow = null;
    this.loginPromise = null;
    this.destroyed = false;
    this.lastAccountError = null;
    // A sync can call prepareSyncRun once per page. Keep the first successful
    // probe as a short-lived run validation so pagination does not issue a
    // `/nav` request for every page, while an explicit connection check can
    // still force a fresh request.
    this.prepareValidationAt = 0;
  }
  get settings() { return this.context.stateStore.platform("bilibili"); }
  get cookieHeader() { return cookieHeader(this.cookies); }
  async prepareSyncRun() {
    const now = Date.now();
    // Validate once at the beginning of each sync run. Subsequent pages may
    // reuse the short-lived account cache, but never let a persisted account
    // object stand in for a real nav probe on the first run entry.
    const shouldValidate = !this.prepareValidationAt || now - this.prepareValidationAt >= 30_000;
    const account = await this.getAccount({ validate: true, force: shouldValidate });
    if (!account) {
      const error = new Error("B站需要先登录");
      error.platformCode = -101;
      throw error;
    }
    this.prepareValidationAt = now;
    if (this.itemCollectionsAccount !== account.id) {
      this.itemCollections.clear();
      this.itemDetails.clear();
      // Folder IDs and names are account-scoped. Never reuse a previous
      // account's 60-second collection cache after switching accounts.
      this.collectionsCache = null;
      this.collectionsCacheAt = 0;
      this.itemCollectionsAccount = account.id;
    }
    return account;
  }
  async openLogin(options = {}) {
    if (this.loginPromise) return this.loginPromise;
    this.loginPromise = this._openLogin(options);
    try { return await this.loginPromise; } finally { this.loginPromise = null; this.loginWindow = null; }
  }
  async _openLogin(options = {}) {
    this.destroyed = false;
    const accountId = options.add ? `new-${Date.now()}-${Math.random().toString(36).slice(2, 8)}` : this.settings.account?.id || "default";
    const partition = options.add ? createPartition("bilibili", accountId) : (this.settings.partition || createPartition("bilibili", accountId));
    await openLoginWindow({ platform: "Bilibili", partition, url: `${BILI_ORIGIN}/`, onWindow: (win) => { this.loginWindow = win; }, onClose: async (session) => {
      if (this.destroyed) return;
      const cookies = await readCookies(session, [BILI_ORIGIN, BILI_API]);
      // Closing a re-login window before authentication must not erase a
      // previously working session.  Only commit a new session after at least
      // one platform cookie is visible; this also avoids creating a truthy
      // empty `session` that would make the coordinator report a false login
      // failure on the next run.
      if (!cookies.length) {
        this.context.notify?.("B站窗口中未检测到登录态，已保留原会话");
        return;
      }
      const previousCookies = this.cookies;
      this.cookies = cookies;
      const encoded = encodeSession({ cookies: this.cookies });
      this.accountCache = null;
      this.prepareValidationAt = 0;
      this.collectionsCache = null;
      const account = await this.getAccount({ validate: true });
      if (account) await this.saveAccount(account, encoded, partition);
      else this.cookies = previousCookies;
    }});
    return this.getAccount();
  }
  async logout() {
    const partition = this.settings.partition;
    this.cookies = []; this.accountCache = null; this.accountCacheAt = 0; this.prepareValidationAt = 0; this.collectionsCache = null;
    const activeId = this.settings.activeAccountId || this.settings.account?.id;
    const accounts = { ...(this.settings.accounts || {}) };
    if (activeId && accounts[activeId]) accounts[activeId] = { ...accounts[activeId], session: null, partition };
    // Clear the active partition mirror as well as the session. The account
    // registry keeps each other account's partition for an explicit switch,
    // but a logged-out/manual flow must never silently reopen this account's
    // browser storage.
    await this.context.stateStore.setPlatform("bilibili", { session: null, account: null, partition: "", accounts, activeAccountId: "" });
    if (partition) await clearPartition(partition);
  }
  async switchAccount(accountId) {
    const id = String(accountId || "").trim();
    const entry = this.settings.accounts?.[id];
    if (!entry?.session) throw new Error("该B站账号没有可用登录态，请重新登录");
    const decoded = decodeSession(entry.session);
    if (!decoded?.cookies?.length) throw new Error("该B站账号登录态无法解码，请重新登录");
    this.cookies = decoded.cookies;
    this.accountCacheAt = 0;
    this.prepareValidationAt = 0;
    this.collectionsCache = null;
    this.collectionsCacheAt = 0;
    this.itemCollections.clear();
    this.itemDetails.clear();
    this.accountCache = { id, name: entry.name || id, platform: "bilibili" };
    await this.context.stateStore.setPlatform("bilibili", { account: this.accountCache, activeAccountId: id, session: entry.session, partition: entry.partition || createPartition("bilibili", id), favoriteFolders: Array.isArray(entry.favoriteFolders) ? entry.favoriteFolders : [], favoriteFoldersCache: Array.isArray(entry.favoriteFoldersCache) ? entry.favoriteFoldersCache : [] });
    return this.accountCache;
  }
  async saveAccount(account, session, partition) {
    const accounts = { ...(this.settings.accounts || {}) };
    const id = String(account.id);
    const existing = accounts[id] || {};
    accounts[id] = { ...existing, ...account, session, partition };
    await this.context.stateStore.setPlatform("bilibili", { account, accounts, activeAccountId: String(account.id), session, partition });
  }
  async _request(path, options = {}) {
    if (typeof requestUrl !== "function") throw new Error("当前 Obsidian 版本不提供 requestUrl，无法访问 B站接口");
    const requestPath = options.wbi ? signWbiUrl(path, this.wbiKeys) : path;
    const response = await requestUrl({ url: requestPath, method: options.method || "GET", headers: {
      Accept: "application/json, text/plain, */*",
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/124 Safari/537.36",
      Referer: BILI_ORIGIN + "/",
      ...(this.cookieHeader ? { Cookie: this.cookieHeader } : {}),
      ...(options.headers || {}),
    }});
    if (Number(response?.status || 0) >= 400) {
      const error = new Error(`Bilibili API 请求失败（${response.status}）`);
      error.httpStatus = response.status;
      throw error;
    }
    let data;
    try {
      data = typeof response.json === "function" ? await response.json() : response.json;
      if (typeof data === "string") data = JSON.parse(data);
    } catch (_) {
      try { data = JSON.parse(response.text || "{}"); } catch (parseError) {
        const error = new Error(`Bilibili API 返回了无法解析的响应（${response.status || "unknown"}）`);
        error.httpStatus = response.status;
        throw error;
      }
    }
    if (!data || typeof data !== "object") data = {};
    // Most endpoints return {code, message, data}; a few historical/edge
    // responses omit `code` while still returning a successful data payload.
    // Treat an explicit non-zero code as an error, but accept an HTTP-success
    // object without the envelope so protocol drift is diagnosable at the
    // detail/list layer instead of being reported as a false login failure.
    if (data && data.code !== undefined && Number(data.code) !== 0) {
      const error = new Error(data?.message || `Bilibili API error (${data?.code ?? response.status})`);
      error.platformCode = data?.code;
      error.httpStatus = response.status;
      throw error;
    }
    return data.data === undefined ? data : data.data;
  }
  async getAccount(options = {}) {
    if (!this.cookieHeader) return null;
    // `force` is used by the explicit “检查连接” action and by the first
    // validation of a sync run. A normal cached read is fine for subsequent
    // list/detail calls, but a caller asking for validation must never be
    // satisfied by a stale cache solely because `validate` was true.
    if (this.accountCache && !options.force && Date.now() - this.accountCacheAt < 15_000) return this.accountCache;
    // A forced read is an explicit connection check (or the first probe of a
    // sync run).  Never let the display-only account object satisfy it when
    // the in-memory probe cache is empty; otherwise an expired cookie can be
    // reported as healthy until a later list request happens to fail.
    if (!options.validate && !options.force && this.settings.account?.id && !this.accountCache) return this.settings.account;
    try {
      const nav = await this._request(`${BILI_API}/x/web-interface/nav`);
      const loginFlag = parseBooleanFlag(nav?.isLogin);
      if (loginFlag === false || !nav.mid) {
        const error = new Error("B站登录态已失效");
        error.platformCode = -101;
        this.lastAccountError = error;
        this.accountCache = null;
        this.accountCacheAt = 0;
        this.prepareValidationAt = 0;
        return null;
      }
      this.wbiKeys = extractWbiKeys(nav.wbi_img) || this.wbiKeys;
      this.lastAccountError = null;
      this.accountCache = { id: String(nav.mid), name: nav.uname || String(nav.mid), avatar: nav.face || "", platform: "bilibili" }; this.accountCacheAt = Date.now();
      const activeId = String(this.settings.activeAccountId || this.settings.account?.id || "");
      if (activeId !== this.accountCache.id || !this.settings.accounts?.[this.accountCache.id]) {
        try { await this.saveAccount(this.accountCache, this.settings.session || null, this.settings.partition || createPartition("bilibili", this.accountCache.id)); } catch (_) {}
      }
      return this.accountCache;
    } catch (error) {
      this.lastAccountError = error;
      const platformCode = Number(error?.platformCode);
      const httpStatus = Number(error?.httpStatus);
      if (platformCode === -101 || httpStatus === 401 || /登录|login/i.test(error?.message || "")) {
        this.accountCache = null;
        this.accountCacheAt = 0;
        this.prepareValidationAt = 0;
      }
      this.context.notify?.(`B站登录状态检查失败：${sanitizeError(error)}`);
      return null;
    }
  }
  async listCollections(options = {}) {
    const force = Boolean(options?.force);
    const account = await this.prepareSyncRun();
    // Resolve the current account before consulting the 60-second collection
    // cache.  A settings/UI account switch can happen outside
    // `switchAccount()` (for example after a legacy migration); returning the
    // previous account's folders in that window would apply the wrong
    // whitelist and write misleading collection metadata.
    if (!force && this.collectionsCache && this.itemCollectionsAccount === account.id && Date.now() - this.collectionsCacheAt < 60_000) return this.collectionsCache;
    const data = await this._request(`${BILI_API}/x/v3/fav/folder/created/list?up_mid=${encodeURIComponent(account.id)}&jsonp=jsonp`, { wbi: true });
    const folders = Array.isArray(data?.list) ? data.list : [];
    this.collectionsCache = folders.filter((folder) => folder && folder.id != null).map((folder) => ({ id: String(folder.id), name: String(folder.title || "收藏夹"), mediaCount: folder.media_count }));
    this.collectionsCacheAt = Date.now();
    await this.context.stateStore.setPlatform("bilibili", { favoriteFoldersCache: this.collectionsCache });
    return this.collectionsCache;
  }
  async listItems(type, cursor, limit = 20) {
    if (type !== "bookmark") throw new Error("B站第一版仅支持收藏");
    const account = await this.prepareSyncRun();
    if (!cursor) { this.itemCollections.clear(); this.itemDetails.clear(); }
    const decoded = decodeCursor(cursor);
    const collections = await this.listCollections();
    const selected = this.settings.favoriteFolders?.length ? collections.filter((folder) => this.settings.favoriteFolders.includes(folder.id)) : collections;
    if (this.settings.favoriteFolders?.length && !selected.length) return normalizePage({ items: [], nextCursor: undefined, hasMore: false });
    // An empty collection response means the account has no readable folders
    // (or the endpoint changed). Never query media_id=0, which can return
    // unrelated/public resources and create false notes.
    if (!collections.length) return normalizePage({ items: [], nextCursor: undefined, hasMore: false });
    const folders = selected;
    const folder = decoded.folderId ? (folders.find((entry) => entry.id === String(decoded.folderId)) || folders[Math.min(decoded.folderIndex, folders.length - 1)]) : folders[Math.min(decoded.folderIndex, folders.length - 1)];
    if (!folder) return normalizePage({ items: [], nextCursor: undefined, hasMore: false });
    const data = await this._request(`${BILI_API}/x/v3/fav/resource/list?media_id=${encodeURIComponent(folder.id)}&pn=${decoded.page}&ps=${Math.min(40, limit)}&platform=web`, { wbi: true });
    const medias = Array.isArray(data?.medias) ? data.medias : [];
    const items = medias.filter((media) => media && (media.bvid || media.id)).map((media) => {
      const sourceId = media.bvid || String(media.id);
      const collection = { id: String(folder.id), name: String(folder.name || "收藏夹") };
      const metaKey = `bilibili:${account.id}:bookmark:${sourceId}`;
      const persisted = this.context.stateStore.getResourceMeta?.(metaKey)?.collections;
      const previous = this.itemCollections.get(String(sourceId)) || (Array.isArray(persisted) ? persisted : []);
      const collections = [...new Map([...previous, collection].map((entry) => [String(entry.id), entry])).values()];
      this.itemCollections.set(String(sourceId), collections);
      return { sourceId, bvid: media.bvid, aid: media.id, title: media.title, collection, collections, author: media.upper?.name || "", sourceUrl: media.bvid ? `${BILI_ORIGIN}/video/${media.bvid}` : `${BILI_ORIGIN}/video/av${media.id}`, raw: media };
    });
    const totalPages = Number(data?.info?.pages || data?.info?.total_pages || 0);
    const explicitHasMore = parseBooleanFlag(data?.has_more ?? data?.hasMore ?? data?.info?.has_more ?? data?.info?.hasMore);
    const pageHasMore = explicitHasMore === undefined
      ? (totalPages ? decoded.page < totalPages : medias.length >= Math.min(40, limit))
      : explicitHasMore;
    let cursorForNext;
    if (pageHasMore) cursorForNext = encodeCursor({ folderIndex: decoded.folderIndex, folderId: folder.id, page: decoded.page + 1 });
    else if (decoded.folderIndex + 1 < folders.length) cursorForNext = encodeCursor({ folderIndex: decoded.folderIndex + 1, folderId: folders[decoded.folderIndex + 1].id, page: 1 });
    return normalizePage({ items, nextCursor: cursorForNext, hasMore: Boolean(cursorForNext) });
  }
  async getItemDetail(summary, type = "bookmark", options = {}) {
    if (type !== "bookmark") throw new Error("B站第一版仅支持收藏");
    // Details can be served from the run-local cache, but a cached video must
    // not bypass the account boundary.  Validate the current session first so
    // a mid-run logout cannot continue writing notes from stale summaries.
    const account = await this.getAccount({ validate: true });
    if (!account) {
      const error = this.lastAccountError || new Error("B站登录态已失效");
      if (error.platformCode == null) error.platformCode = -101;
      throw error;
    }
    const cached = this.itemDetails.get(String(summary?.sourceId || summary?.bvid || summary?.aid || ""));
    if (cached) {
      const collections = summary.collections || this.itemCollections.get(String(cached.sourceId)) || cached.collections || [];
      return normalizeItem({ ...cached, collections, favoriteFolders: collections.map((entry) => entry.name) });
    }
    const viewQuery = summary.bvid ? `bvid=${encodeURIComponent(summary.bvid)}` : summary.aid ? `aid=${encodeURIComponent(summary.aid)}` : `bvid=${encodeURIComponent(summary.sourceId)}`;
    const view = await this._request(`${BILI_API}/x/web-interface/view?${viewQuery}`);
    if (!view || typeof view !== "object" || (!view.bvid && !view.aid && !summary.sourceId)) throw new Error("B站视频详情不可用，可能已下架或无权访问");
    const allPages = Array.isArray(view.pages) && view.pages.length ? view.pages.slice(0, 50) : [{ cid: view.cid, part: "P1", page: 1 }];
    // The first-version setting is intentionally applied at normalization
    // time, so a "first P only" run does not leave extra remote embeds in the
    // Markdown note or create misleading pending media tasks.
    const pages = (options?.allParts === false || this.settings.allParts === false) ? allPages.slice(0, 1) : allPages;
    const sourceId = view.bvid || summary.sourceId;
    const metaKey = `bilibili:${account?.id || this.settings.account?.id || "default"}:bookmark:${sourceId}`;
    const persisted = this.context.stateStore.getResourceMeta?.(metaKey)?.collections;
    const collections = summary.collections || this.itemCollections.get(String(sourceId)) || (Array.isArray(persisted) ? persisted : null) || (summary.collection ? [summary.collection] : []);
    await this.context.stateStore.setResourceMeta?.(metaKey, { platform: "bilibili", accountId: String(account?.id || this.settings.account?.id || "default"), sourceId: String(sourceId), collections });
    const pageSource = view.bvid || summary.bvid;
    const pageUrl = pageSource ? `${BILI_ORIGIN}/video/${pageSource}` : `${BILI_ORIGIN}/video/av${view.aid || summary.aid || summary.sourceId}`;
    const normalized = normalizeItem({ platform: "bilibili", accountId: String(account?.id || this.settings.account?.id || "default"), accountName: account?.name || "B站账号", sourceId, sourceUrl: pageUrl, title: view.title || summary.title, author: view.owner?.name || summary.author, authorId: view.owner?.mid ? String(view.owner.mid) : undefined, text: view.desc || "", fullText: [view.desc, Array.isArray(view.tag) ? view.tag.map((tag) => tag.tag_name).join(" ") : ""].filter(Boolean).join("\n"), tags: Array.isArray(view.tag) ? view.tag.map((tag) => tag.tag_name).filter(Boolean) : [], metrics: { likeCount: view.stat?.like, commentCount: view.stat?.reply, favoriteCount: view.stat?.favorite, playCount: view.stat?.view }, createdAt: view.pubdate ? new Date(view.pubdate * 1000).toISOString() : undefined, collections, favoriteFolders: collections.map((entry) => entry.name), media: pages.map((page, index) => ({ id: `${sourceId}-${page.cid || index + 1}`, kind: "video", url: `${pageUrl}${pageUrl.includes("?") ? "&" : "?"}p=${page.page || index + 1}`, partIndex: index + 1, title: page.part || `P${index + 1}`, raw: { cid: page.cid, aid: view.aid, bvid: view.bvid || summary.bvid } })), rawMeta: { aid: view.aid || summary.aid, bvid: view.bvid || summary.bvid, cid: view.cid, pages } });
    this.itemDetails.set(String(sourceId), normalized);
    return normalized;
  }
  async resolveMedia(item, options = {}) {
    const pages = Array.isArray(item.rawMeta?.pages) ? item.rawMeta.pages : [];
    const selectedPages = options.allParts === false ? pages.slice(0, 1) : pages.slice(0, 50);
    const result = [];
    for (let index = 0; index < selectedPages.length; index++) {
      const page = selectedPages[index];
      if (!page?.cid) {
        result.push({ id: `${item.sourceId}-${index + 1}`, kind: "video", url: "", status: "failed", error: "B站分P缺少 cid，无法解析播放地址", partIndex: index + 1, title: page?.part || `P${index + 1}` });
        continue;
      }
      const query = new URLSearchParams({ avid: String(item.rawMeta.aid || ""), cid: String(page.cid), fnval: "4048", fnver: "0", fourk: options.quality === "high" ? "1" : "0" });
      if (item.rawMeta.bvid) query.set("bvid", String(item.rawMeta.bvid));
      try {
        const play = await this._request(`${BILI_API}/x/player/playurl?${query.toString()}`, { wbi: true });
        const dash = play?.dash;
        const video = chooseQuality(dash?.video, options.quality);
        const audio = chooseQuality(dash?.audio, options.quality);
        const mediaId = `${item.sourceId}-${page.cid || index + 1}`;
        const headers = { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/124 Safari/537.36", Referer: `${BILI_ORIGIN}/video/${item.sourceId}`, ...(this.cookieHeader ? { Cookie: this.cookieHeader } : {}) };
        if ((video?.baseUrl || video?.base_url) && (audio?.baseUrl || audio?.base_url)) result.push({ id: mediaId, kind: "video", url: video.baseUrl || video.base_url, audioUrl: audio.baseUrl || audio.base_url, headers, partIndex: index + 1, title: page.part || `P${index + 1}`, requiresMerge: true });
        else if (play?.durl?.[0]?.url) result.push({ id: mediaId, kind: "video", url: play.durl[0].url, headers, partIndex: index + 1, title: page.part || `P${index + 1}` });
        else result.push({ id: mediaId, kind: "video", url: "", status: "failed", error: "B站未返回可下载的播放流", headers, partIndex: index + 1, title: page.part || `P${index + 1}` });
      } catch (error) { this.context.log?.("media_resolve_failed", { platform: "bilibili", sourceId: item.sourceId, partIndex: index + 1, error: sanitizeError(error) }); result.push({ id: `${item.sourceId}-${page.cid || index + 1}`, kind: "video", url: "", status: "failed", error: sanitizeError(error), partIndex: index + 1, title: page.part || `P${index + 1}` }); }
    }
    return result;
  }
  destroy() {
    this.destroyed = true;
    try { if (this.loginWindow && !this.loginWindow.isDestroyed?.()) this.loginWindow.destroy(); } catch (_) {}
    this.loginWindow = null;
  }
  classifyError(error) {
    const code = Number(error?.platformCode);
    if (code === -101 || /login|登录|未登录/i.test(error?.message || "")) return { code: "auth_required", message: "B站登录态已失效，请重新登录", retryable: false };
    const httpStatus = Number(error?.httpStatus);
    if (httpStatus === 401) return { code: "auth_required", message: "B站登录态已失效，请重新登录", retryable: false };
    if (code === -403 || httpStatus === 403) return { code: "forbidden", message: "B站拒绝访问或无权获取该内容", retryable: false };
    if (httpStatus >= 500) return { code: "server", message: "B站服务暂时不可用", retryable: true };
    return super.classifyError(error);
  }
}

function chooseQuality(streams, quality) {
  if (!Array.isArray(streams) || !streams.length) return null;
  return [...streams].sort((a, b) => Number(b.bandwidth || b.id || 0) - Number(a.bandwidth || a.id || 0))[quality === "high" ? 0 : Math.min(1, streams.length - 1)];
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
function encodeCursor(value) { return Buffer.from(JSON.stringify(value)).toString("base64url"); }
function decodeCursor(value) {
  const fallback = { folderIndex: 0, page: 1 };
  try {
    const parsed = value ? JSON.parse(Buffer.from(String(value), "base64url").toString("utf8")) : fallback;
    const folderIndex = Number(parsed?.folderIndex);
    const page = Number(parsed?.page);
    return { folderIndex: Number.isInteger(folderIndex) && folderIndex >= 0 ? folderIndex : 0, page: Number.isInteger(page) && page >= 1 ? page : 1, folderId: parsed?.folderId ? String(parsed.folderId) : undefined };
  } catch (_) { return fallback; }
}

function sanitizeError(error) { return String(error?.message || error || "B站请求失败").replace(/https?:\/\/\S+/g, "[url]").slice(0, 500); }

module.exports = { BilibiliAdapter, encodeCursor, decodeCursor };
