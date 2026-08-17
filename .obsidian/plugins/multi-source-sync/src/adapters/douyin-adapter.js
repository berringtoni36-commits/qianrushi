const { PlatformAdapter, normalizePage } = require("../core/platform-adapter");
const { normalizeItem } = require("../core/normalized-item");
const { encodeSession, decodeSession, cookieHeader, readCookies, openLoginWindow, createPartition, clearPartition } = require("./browser-session");
const crypto = require("crypto");

class DouyinAdapter extends PlatformAdapter {
  constructor(context) {
    super("douyin", "抖音（Douyin）");
    this.context = context;
    const session = decodeSession(this.settings.session);
    this.cookies = session?.cookies || [];
    if (session?.invalid) this.context.notify?.("抖音本地登录态无法解码，请重新登录（未删除原配置）");
    this.scraped = Array.isArray(this.settings.scrapedItems) ? this.settings.scrapedItems : [];
    this.loginWindow = null;
    this.loginPromise = null;
    this.destroyed = false;
    this.activeWindows = new Set();
    this.lastAccountError = null;
    this.accountValidationAt = 0;
  }
  get settings() { return this.context.stateStore.platform("douyin"); }
  get cookieHeader() { return cookieHeader(this.cookies); }
  async prepareSyncRun() {
    const now = Date.now();
    const shouldValidate = Boolean(this.cookies.length) && (!this.accountValidationAt || now - this.accountValidationAt >= 30_000);
    const account = await this.getAccount({ validate: shouldValidate, force: shouldValidate });
    if (account) return account;
    if (this.settings.manualLinks?.length) return { id: "manual", name: "抖音手动链接", platform: "douyin" };
    const error = new Error("抖音需要先登录，或填写手动链接");
    error.platformCode = "AUTH_REQUIRED";
    throw error;
  }
  async openLogin(options = {}) {
    if (this.loginPromise) return this.loginPromise;
    this.loginPromise = this._openLogin(options);
    try { return await this.loginPromise; } finally { this.loginPromise = null; this.loginWindow = null; }
  }
  async _openLogin(options = {}) {
    this.destroyed = false;
    const accountId = options.add ? `new-${Date.now()}-${Math.random().toString(36).slice(2, 8)}` : this.settings.account?.id || "default";
    const partition = options.add ? createPartition("douyin", accountId) : (this.settings.partition || createPartition("douyin", accountId));
    await openLoginWindow({ platform: "Douyin", partition, url: "https://www.douyin.com/", onWindow: (win) => { this.loginWindow = win; }, onClose: async (session) => {
      if (this.destroyed) return;
      const previousCookies = this.cookies;
      const previousScraped = this.scraped;
      this.cookies = await readCookies(session, ["https://www.douyin.com/"]);
      if (!this.cookies.length) {
        // Closing a re-login window before authentication must not replace a
        // working session with an empty one. This mirrors Bilibili's safe
        // close behaviour and leaves the existing account usable.
        this.context.notify?.("抖音窗口中未检测到登录态，已保留原会话");
        return;
      }
      // Some current web sessions omit the public UID cookie while still
      // carrying a valid account session. Reuse an existing stable account ID
      // on re-login; require a derived ID only for the first login.
      const derivedId = deriveDouyinAccountId(this.cookies);
      // A new persistent partition must never fall back to the currently
      // active account's display ID.  Some Douyin sessions omit the public UID
      // cookie until the account page finishes loading; reusing the old ID in
      // that case would overwrite the old account with the new partition.
      // Re-login of the active account may still reuse its stable ID.
      const stableId = chooseDouyinAccountId(derivedId, this.settings.account?.id, options.add);
      if (!stableId) {
        this.cookies = previousCookies;
        throw new Error("未检测到抖音登录身份，请在窗口中完成登录后再关闭");
      }
      // A public UID-like cookie can exist before authentication (or after a
      // logout). Probe the same newly opened persistent partition before
      // saving it as a usable account; otherwise a cancelled/anonymous login
      // would appear as “已登录” until the first sync failed.
      const valid = await this.validateSession({ partition });
      if (!valid) {
        this.cookies = previousCookies;
        this.context.notify?.("抖音窗口中的会话尚未验证为已登录，已保留原会话");
        return;
      }
      // Adding an account opens a fresh partition, but `this.scraped` still
      // belongs to the previously active account.  Restore an existing
      // target account cache when re-opening it; otherwise start the new
      // account with an empty capture cache instead of copying old cards.
      const activeId = String(this.settings.activeAccountId || this.settings.account?.id || "");
      const targetEntry = this.settings.accounts?.[stableId];
      this.scraped = stableId === activeId
        ? previousScraped
        : (Array.isArray(targetEntry?.scrapedItems) ? targetEntry.scrapedItems : []);
      const account = { id: stableId, name: targetEntry?.name || (stableId === activeId ? this.settings.account?.name : "抖音账号") || "抖音账号", platform: "douyin" };
      try { await this.saveAccount(account, encodeSession({ cookies: this.cookies }), partition); }
      catch (error) { this.cookies = previousCookies; this.scraped = previousScraped; throw error; }
      this.accountValidationAt = 0;
    }});
    return this.getAccount();
  }
  async logout() {
    const partition = this.settings.partition;
    this.cookies = []; this.scraped = []; this.accountValidationAt = 0;
    const activeId = this.settings.activeAccountId || this.settings.account?.id;
    const accounts = { ...(this.settings.accounts || {}) };
    if (activeId && accounts[activeId]) accounts[activeId] = { ...accounts[activeId], session: null, partition };
    // Do not leave the logged-out account's persistent browser partition as
    // the top-level default. It remains in the registry for an explicit
    // account switch, while manual-link mode after logout starts unauthenticated.
    await this.context.stateStore.setPlatform("douyin", { session: null, account: null, partition: "", accounts, activeAccountId: "", scrapedItems: [] });
    if (partition) await clearPartition(partition);
  }
  async switchAccount(accountId) {
    const id = String(accountId || "").trim();
    const entry = this.settings.accounts?.[id];
    if (!entry?.session) throw new Error("该抖音账号没有可用登录态，请重新登录");
    const decoded = decodeSession(entry.session);
    if (!decoded?.cookies?.length) throw new Error("该抖音账号登录态无法解码，请重新登录");
    this.cookies = decoded.cookies;
    this.scraped = Array.isArray(entry.scrapedItems) ? entry.scrapedItems : []; this.accountValidationAt = 0;
    const account = { id, name: entry.name || id, platform: "douyin" };
    await this.context.stateStore.setPlatform("douyin", { account, activeAccountId: id, session: entry.session, partition: entry.partition || createPartition("douyin", id), scrapedItems: this.scraped });
    return account;
  }
  async saveAccount(account, session, partition) {
    const accounts = { ...(this.settings.accounts || {}) };
    const id = String(account.id);
    const activeId = String(this.settings.activeAccountId || this.settings.account?.id || "");
    const existing = accounts[id] || {};
    // `this.scraped` is memory belonging to the currently active account. If
    // a newly added account is saved while another account is active, never
    // copy those cards into the new registry entry. Re-open an existing target
    // account with its own cache; a genuinely new account starts empty.
    const scrapedItems = id === activeId
      ? (Array.isArray(this.scraped) ? this.scraped : [])
      : (Array.isArray(existing.scrapedItems) ? existing.scrapedItems : []);
    this.scraped = scrapedItems;
    accounts[id] = { ...existing, ...account, session, partition, scrapedItems };
    await this.context.stateStore.setPlatform("douyin", { account, accounts, activeAccountId: String(account.id), session, partition });
  }
  async getAccount(options = {}) {
    if (!this.cookieHeader) return null;
    if (this.settings.account?.id) {
      if (!options.validate && !options.force) return this.settings.account;
      const valid = await this.validateSession();
      if (!valid) {
        const error = new Error("抖音登录态已失效或当前页面要求重新登录");
        error.platformCode = "AUTH_REQUIRED";
        this.lastAccountError = error;
        // An explicit/periodic failed probe must invalidate the short-lived
        // success marker.  Otherwise the next sync within the old 30-second
        // window could fall back to the persisted display account and appear
        // healthy without rechecking the partition.
        this.accountValidationAt = 0;
        return null;
      }
      this.lastAccountError = null;
      this.accountValidationAt = Date.now();
      return this.settings.account;
    }
    // A session can survive an interrupted upgrade/login callback while the
    // display-only account object is still null. Derive a stable ID from the
    // non-session identity cookie so the next sync can recover safely.
    const id = deriveDouyinAccountId(this.cookies);
    if (!id) return null;
    this.lastAccountError = null;
    const account = { id, name: "抖音账号", platform: "douyin" };
    if (options.validate || options.force) {
      const valid = await this.validateSession();
      if (!valid) {
        const error = new Error("抖音登录态无法验证，请重新登录");
        error.platformCode = "AUTH_REQUIRED";
        this.lastAccountError = error;
        this.accountValidationAt = 0;
        return null;
      }
      this.accountValidationAt = Date.now();
    }
    try { await this.context.stateStore.setPlatform("douyin", { account }); } catch (_) {}
    return account;
  }

  /**
   * Validate only the user's own logged-in Douyin partition. This is used for
   * an explicit connection check and at the start of a sync run; ordinary
   * cached account reads never open a browser window. It intentionally does
   * not solve CAPTCHA/slider challenges or inspect any other site's cookies.
   */
  async validateSession(options = {}) {
    const e = (() => { try { return require("electron"); } catch (_) { return null; } })();
    if (!e?.BrowserWindow) return false;
    const partition = options.partition || this.settings.partition || createPartition("douyin", this.settings.account?.id || "default");
    const win = this._createHiddenWindow(e, partition);
    try {
      await loadUrlWithTimeout(win, "https://www.douyin.com/user/self?showTab=favorite", 20_000);
      await waitForDom(win, 12_000);
      const state = await win.webContents.executeJavaScript(`(() => {
        const href = String(location.href || "");
        const text = String(document.body?.innerText || "").slice(0, 4000);
        const loginControl = Array.from(document.querySelectorAll('a,button,[role="button"]')).some((node) => /登录|登陆|log\s*in|sign\s*in/i.test(String(node.innerText || node.getAttribute('aria-label') || '')));
        const favoriteCard = Boolean(document.querySelector('a[href*="/video/"], a[href*="/note/"]'));
        // A generic `/user/` link is present on public/login pages too and is
        // not evidence that this persistent partition is authenticated. Only
        // use explicit account markers or authenticated-page text.
        const authenticatedMarker = Boolean(document.querySelector('[data-e2e*="avatar"], [data-e2e*="user-info"], [data-e2e*="logout"]')) || /退出登录|个人主页|我的收藏/i.test(text);
        return { href, loginControl, favoriteCard, authenticatedMarker, loginText: /请先登录|立即登录|登录后查看|登陆后查看/i.test(text) };
      })()`);
      return isAuthenticatedPageState(state);
    } catch (_) {
      return false;
    } finally {
      try { if (!win.isDestroyed?.()) win.destroy(); } catch (_) {}
      this.activeWindows.delete(win);
    }
  }
  async listItems(type, cursor, limit = 20) {
    if (type !== "bookmark") throw new Error("抖音第一版仅支持收藏");
    const account = await this.getAccount();
    if (!account && !(this.settings.manualLinks || []).length) await this.prepareSyncRun();
    if (!account && (this.settings.manualLinks || []).length) {
      const manualOnly = uniqueManualLinks(this.settings.manualLinks).map((url) => ({ sourceId: extractId(url), sourceUrl: url, title: extractId(url), kind: isDouyinNoteLink(url) ? "image" : "video", manual: true }));
      const offset = safeOffset(cursor);
      const items = manualOnly.slice(offset, offset + limit);
      const nextCursor = offset + items.length < manualOnly.length ? String(offset + items.length) : undefined;
      return normalizePage({ items, nextCursor, hasMore: Boolean(nextCursor) });
    }
    let page;
    try {
      page = cursor && this.scraped.length ? { items: this.scraped } : await this._scrapeFavorites(Math.max(limit, 20));
    }
    catch (error) {
      if (!this.settings.manualLinks?.length) throw error;
      page = { items: [] };
    }
    const manual = uniqueManualLinks(this.settings.manualLinks || []).map((url) => ({ sourceId: extractId(url), sourceUrl: url, title: extractId(url), kind: isDouyinNoteLink(url) ? "image" : "video", manual: true }));
    // Keep the richer browser-captured card when a user also pasted the same
    // URL as a fallback.  The manual entry only fills a missing source ID;
    // it must not erase a captured title/type and create a weaker note.
    const merged = new Map((page.items || []).map((item) => [String(item.sourceId || item.sourceUrl), item]));
    for (const item of manual) if (!merged.has(String(item.sourceId))) merged.set(String(item.sourceId), item);
    page.items = [...merged.values()];
    const offset = safeOffset(cursor);
    const items = page.items.slice(offset, offset + limit);
    const nextCursor = offset + items.length < page.items.length ? String(offset + items.length) : undefined;
    return normalizePage({ items, nextCursor, hasMore: Boolean(nextCursor) });
  }
  async _scrapeFavorites(limit) {
    const e = (() => { try { return require("electron"); } catch (_) { return null; } })();
    if (!e?.BrowserWindow) throw new Error("抖音需要桌面浏览器辅助采集");
    const win = this._createHiddenWindow(e);
    try {
      await loadUrlWithTimeout(win, "https://www.douyin.com/user/self?showTab=favorite", 20_000);
      const data = await waitForFavoriteCards(win, limit);
      const unique = new Map((Array.isArray(data) ? data : []).map((item) => [item.sourceId, item]));
      this.scraped = [...unique.values()];
      await this.context.stateStore.setPlatform("douyin", { scrapedItems: this.scraped });
      return { items: this.scraped };
    } finally {
      try { if (!win.isDestroyed?.()) win.destroy(); } catch (_) {}
      // `_createHiddenWindow` removes the window on its `closed` event. Some
      // Electron test/build hosts do not emit that event synchronously, so
      // remove it explicitly as well to avoid retaining stale windows.
      this.activeWindows.delete(win);
    }
  }
  async getItemDetail(summary) {
    if (!isAllowedDouyinLink(summary?.sourceUrl)) {
      throw new Error("抖音来源链接不受支持，请使用抖音或火山系官方链接");
    }
    const kind = summary.kind === "image" ? "image" : "video";
    let captured;
    try { captured = await this._captureDetail(summary); } catch (error) { captured = {}; }
    const mediaUrl = kind === "video"
      ? (captured.videoUrl || summary.videoUrl || "")
      : (captured.imageUrl || summary.imageUrl || "");
    const actualKind = kind;
    if (!mediaUrl && !captured.text && !summary.title) throw new Error("抖音页面未提取到有效内容，请使用手动链接导入");
    // Manual-link mode is allowed without a login.  Do not let a stale
    // display-only account object left after logout claim those links; use the
    // verified account only when the current cookie session is actually
    // available, otherwise keep the deterministic `manual` identity.
    // A detail call can be reached directly from a command without the normal
    // coordinator preflight. Probe the cookie session once in that case; after
    // a recent successful preflight, reuse the verified account to avoid a
    // hidden browser validation for every item. If a probe failed, do not let
    // the stale display-only account claim manual links.
    const recentlyValidated = this.accountValidationAt > 0 && Date.now() - this.accountValidationAt < 30_000;
    const verifiedAccount = recentlyValidated ? await this.getAccount() : await this.getAccount({ validate: true, force: true });
    const account = verifiedAccount || (this.settings.manualLinks?.length ? { id: "manual", name: "抖音手动链接" } : { id: "default", name: "抖音账号" });
    const headers = this.cookieHeader ? { Cookie: this.cookieHeader, "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/124 Safari/537.36", Referer: summary.sourceUrl || "https://www.douyin.com/" } : { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/124 Safari/537.36", Referer: summary.sourceUrl || "https://www.douyin.com/" };
    return normalizeItem({ platform: "douyin", accountId: account.id, accountName: account.name, sourceId: summary.sourceId, sourceUrl: summary.sourceUrl, title: captured.title || summary.title || summary.sourceId, text: captured.text || "", fullText: captured.text || "", media: mediaUrl ? [{ id: summary.sourceId, kind: actualKind, url: mediaUrl, headers, localPath: undefined }] : [], rawMeta: { browserCaptured: true, mediaCaptured: Boolean(mediaUrl), directMediaUrl: mediaUrl || "", directMediaKind: mediaUrl ? actualKind : "" } });
  }
  async _captureDetail(summary) {
    const e = (() => { try { return require("electron"); } catch (_) { return null; } })();
    if (!e?.BrowserWindow || !summary.sourceUrl) return {};
    const win = this._createHiddenWindow(e);
    try {
      await loadUrlWithTimeout(win, summary.sourceUrl, 20_000);
      await waitForDom(win, 10000);
      return await win.webContents.executeJavaScript(`(() => {
        const resources = performance.getEntriesByType('resource').map((entry) => entry.name || '').filter((url) => /(?:\\.mp4(?:$|[?#])|\\.m3u8(?:$|[?#])|\\.webm(?:$|[?#])|douyinvod|bytecdn|byteimg)/i.test(url));
        const video = document.querySelector('video');
        const source = video?.currentSrc || video?.src || document.querySelector('video source[src]')?.src || '';
        const image = document.querySelector('meta[property="og:image"]')?.content || document.querySelector('img[src]')?.src || '';
        const direct = [source, ...resources].find((url) => /^https?:/i.test(url) && /(?:\\.mp4(?:$|[?#])|\\.webm(?:$|[?#])|douyinvod|bytecdn)/i.test(url) && !/\\.m3u8?(?:$|[?#])/i.test(url));
        return {
          title: (document.querySelector('meta[property="og:title"]')?.content || document.title || '').trim(),
          text: (document.querySelector('meta[name="description"]')?.content || '').trim(),
          videoUrl: direct || '',
          imageUrl: image
        };
      })()`);
    } finally {
      try { if (!win.isDestroyed?.()) win.destroy(); } catch (_) {}
      this.activeWindows.delete(win);
    }
  }
  async resolveMedia(item, options = {}) {
    if (!isAllowedDouyinLink(item?.sourceUrl)) {
      return (item?.media || []).map((media) => ({ ...media, url: "", status: "unsupported", error: "抖音来源链接不受支持" }));
    }
    let captured = {};
    if (options.refresh && item.sourceUrl) {
      try { captured = await this._captureDetail({ sourceId: item.sourceId, sourceUrl: item.sourceUrl, title: item.title }); } catch (_) { captured = {}; }
    }
    return item.media.map((media) => {
      const isVideo = media.kind === "video";
      // Never substitute a captured cover image for an existing video (or a
      // video stream for an image).  Doing so causes the media service to save
      // the wrong bytes under the wrong extension and masks the real source
      // URL.  A directMediaUrl is only a fallback when no kind-specific fresh
      // URL was captured.
      const capturedUrl = isVideo ? captured.videoUrl : captured.imageUrl;
      const directKind = String(item.rawMeta?.directMediaKind || "").toLowerCase();
      // A persisted detail can contain a direct URL captured for a different
      // media kind (for example, a cover image plus a video URL).  Never use
      // that URL as a fallback: saving it under the wrong extension creates
      // corrupt media and hides the actual capture failure.
      const fallbackUrl = (!directKind || directKind === media.kind) && mediaUrlMatchesKind(item.rawMeta?.directMediaUrl, media.kind)
        ? (item.rawMeta?.directMediaUrl || "")
        : "";
      const mediaUrl = capturedUrl || fallbackUrl || media.url || "";
      const hls = /\.m3u8?(?:$|[?#])/i.test(mediaUrl);
      const usable = /^https?:/i.test(mediaUrl) && !hls && mediaUrlMatchesKind(mediaUrl, media.kind) && (media.kind === "image" || isVideo);
      return { ...media, url: usable ? mediaUrl : "", status: usable ? "pending" : "unsupported", error: usable ? "" : (hls ? "抖音返回 HLS 播放流，当前版本保留页面链接，不直接下载播放列表" : "抖音未返回可下载的媒体地址"), headers: this.cookieHeader ? { ...(media.headers || {}), Cookie: this.cookieHeader, Referer: item.sourceUrl || "https://www.douyin.com/" } : media.headers };
    });
  }
  destroy() {
    this.destroyed = true;
    try { if (this.loginWindow && !this.loginWindow.isDestroyed?.()) this.loginWindow.destroy(); } catch (_) {}
    this.loginWindow = null;
    for (const win of this.activeWindows) {
      try { if (!win.isDestroyed?.()) win.destroy(); } catch (_) {}
    }
    this.activeWindows.clear();
  }
  _createHiddenWindow(e, partition) {
    const sessionPartition = partition || this.settings.partition || createPartition("douyin", this.settings.account?.id || "default");
    const win = new e.BrowserWindow({ show: false, webPreferences: { partition: sessionPartition, contextIsolation: true, nodeIntegration: false } });
    this.activeWindows.add(win);
    const forget = () => this.activeWindows.delete(win);
    win.once?.("closed", forget);
    return win;
  }
  classifyError(error) {
    const message = String(error?.message || "");
    if (error?.platformCode === "AUTH_REQUIRED" || /login|登录|未检测到.*登录|登录态已失效/i.test(message)) {
      return { code: "auth_required", message: "抖音登录态已失效，请重新登录", retryable: false };
    }
    if (/官方链接|不受支持/.test(message)) return { code: "invalid_source", message, retryable: false };
    return { code: "protocol_unstable", message: message || "抖音页面结构或接口发生变化，请使用手动链接导入", retryable: false };
  }
}
async function waitForDom(win, timeoutMs) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try { const ready = await win.webContents.executeJavaScript("document.readyState === 'complete'"); if (ready) return; } catch (_) {}
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
}
async function loadUrlWithTimeout(win, url, timeoutMs) {
  const timeout = Math.max(1, Number(timeoutMs) || 20_000);
  let timer;
  try {
    await Promise.race([
      Promise.resolve().then(() => win.loadURL(url)),
      new Promise((_, reject) => {
        timer = setTimeout(() => {
          const error = new Error("抖音页面加载超时");
          error.platformCode = "PROTOCOL_TIMEOUT";
          reject(error);
        }, timeout);
        timer.unref?.();
      }),
    ]);
  } finally { if (timer) clearTimeout(timer); }
}
async function waitForFavoriteCards(win, limit) {
  const started = Date.now(); const cap = Math.max(1, Math.min(100, limit * 5));
  let previousCount = 0;
  let stableRounds = 0;
  while (Date.now() - started < 10000) {
    let data = [];
    try { data = await win.webContents.executeJavaScript(`(() => Array.from(document.querySelectorAll('a[href*="/video/"], a[href*="/note/"]')).slice(0, ${cap}).map((a) => ({sourceUrl: a.href, sourceId: (a.href.match(/(?:video|note)\\/(\\d+)/)||[])[1] || (a.href.match(/[?&](?:modal_id|aweme_id|item_id)=(\\d+)/)||[])[1] || a.href, title: (a.innerText || a.getAttribute('aria-label') || '').trim(), kind: /\\/note\\//i.test(a.href) ? 'image' : 'video'})))()`); }
    catch (_) { data = []; }
    data = Array.isArray(data)
      ? [...new Map(data.filter((item) => isAllowedDouyinLink(item?.sourceUrl)).map((item) => [String(item.sourceId || item.sourceUrl), item])).values()]
      : [];
    if (data.length === previousCount) stableRounds++;
    else { previousCount = data.length; stableRounds = 0; }
    // The favourite page is virtualised/lazy-loaded.  Scroll a bounded number
    // of times so the adapter can collect more than the first viewport, while
    // returning promptly when the page stops producing new cards.
    if (data.length >= Math.min(cap, Math.max(1, limit)) || (data.length && stableRounds >= 3)) return data;
    try { await win.webContents.executeJavaScript("window.scrollTo(0, document.body?.scrollHeight || 0)"); } catch (_) {}
    await new Promise((resolve) => setTimeout(resolve, 350));
  }
  throw new Error("抖音收藏页未加载出可见收藏卡片");
}
function extractId(url) {
  const text = String(url || "").trim();
  const direct = text.match(/(?:video|note)\/(\d+)/i)?.[1];
  if (direct) return direct;
  try {
    const parsed = new URL(text);
    const queryId = parsed.searchParams.get("modal_id") || parsed.searchParams.get("aweme_id") || parsed.searchParams.get("item_id");
    if (/^\d{4,}$/.test(String(queryId || ""))) return String(queryId);
  } catch (_) {}
  // Short links do not expose the numeric ID until the browser follows the
  // redirect. Keep a deterministic, bounded key and avoid a timestamp (which
  // would create duplicates on every retry).
  // Preserve the full normalized host/path (not only the last 80 chars).
  // Two allowed short links can otherwise collide when their distinguishing
  // prefix falls outside the truncation window. The result is bounded to keep
  // paths/frontmatter safe while retaining a deterministic identity.
  const normalized = text.replace(/[?#].*$/, "").replace(/\/$/, "").replace(/\W+/g, "_").slice(0, 180);
  return normalized || "douyin-link";
}
function safeOffset(cursor) { const value = Number(cursor); return Number.isInteger(value) && value >= 0 ? value : 0; }
function uniqueManualLinks(links) {
  const seen = new Set();
  const result = [];
  for (const entry of (Array.isArray(links) ? links : [])) {
    const url = String(entry || "").trim();
    if (!isAllowedDouyinLink(url)) continue;
    const id = extractId(url);
    if (seen.has(id)) continue;
    seen.add(id);
    result.push(url);
  }
  return result;
}

function isAuthenticatedPageState(state) {
  if (!state || typeof state !== "object") return false;
  const href = String(state.href || "").toLowerCase();
  const routedToLogin = /\/login(?:[/?#]|$)|passport|account\/login/.test(href);
  // A page with no visible login control is not enough evidence by itself:
  // an empty/blocked document also has no login control. Require either a
  // visible favourite card or an authenticated marker (avatar/user/logout),
  // while still allowing a harmless header login link when actual content is
  // present. This avoids reporting a blank page as a healthy session.
  return !routedToLogin && !state.loginText && Boolean(state.favoriteCard || state.authenticatedMarker);
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

function isDouyinNoteLink(value) {
  try { return /\/note\//i.test(new URL(String(value || "")).pathname); }
  catch (_) { return /\/note\//i.test(String(value || "")); }
}

function deriveDouyinAccountId(cookies) {
  const list = Array.isArray(cookies) ? cookies : [];
  // Prefer an explicit public-looking account identifier.  Do not persist
  // session cookies as the account ID: those rotate and would create a new
  // Vault directory after every login.
  const direct = list.find((cookie) => cookie?.value && /^(?:uid|user_id|sec_uid|web_uid)$/i.test(String(cookie.name)));
  if (direct?.value) return String(direct.value).slice(0, 180);
  const stable = list.find((cookie) => cookie?.value && /^(?:uid_tt|uid_tt_ss)$/i.test(String(cookie.name)));
  if (stable?.value) return `uid-${crypto.createHash("sha256").update(String(stable.value)).digest("hex").slice(0, 24)}`;
  return "";
}

function chooseDouyinAccountId(derivedId, existingId, adding = false) {
  const derived = String(derivedId || "").trim();
  if (derived) return derived;
  return adding ? "" : String(existingId || "").trim();
}

function mediaUrlMatchesKind(value, kind) {
  const url = String(value || "");
  if (!url) return false;
  const lower = url.toLowerCase();
  let pathname = lower;
  try { pathname = new URL(url).pathname.toLowerCase(); } catch (_) {}
  const image = /\.(?:jpe?g|png|gif|webp|avif|bmp|heic)(?:$|[?#])/.test(pathname);
  const video = /\.(?:mp4|m4v|mov|webm|mkv|avi|flv|m3u8?)(?:$|[?#])/.test(pathname)
    || /douyinvod|video(?:[_-]?cdn)?/i.test(lower);
  if (kind === "image") return !video;
  if (kind === "video") return !image;
  return false;
}

module.exports = { DouyinAdapter, extractId, deriveDouyinAccountId, chooseDouyinAccountId, isAllowedDouyinLink, uniqueManualLinks, isAuthenticatedPageState };
