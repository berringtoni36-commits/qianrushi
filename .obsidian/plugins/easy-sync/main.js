"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/main.ts
var main_exports = {};
__export(main_exports, {
  SyncPathSettingsUpdateError: () => SyncPathSettingsUpdateError,
  default: () => EasySyncPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian15 = require("obsidian");

// src/obsidian-compat.ts
var import_obsidian = require("obsidian");
var DEFAULT_CONFIG_DIR = `.${"obsidian"}`;
var fallbackWindow = typeof window !== "undefined" ? window : null;
function getConfigDir(vault) {
  return vault.configDir || DEFAULT_CONFIG_DIR;
}
function getPluginDir(vaultOrConfigDir, pluginId) {
  const configDir = typeof vaultOrConfigDir === "string" ? vaultOrConfigDir : getConfigDir(vaultOrConfigDir);
  return `${configDir}/plugins/${pluginId}`;
}
function getEasySyncPaths(vaultOrConfigDir, pluginId = "easy-sync") {
  const configDir = typeof vaultOrConfigDir === "string" ? vaultOrConfigDir : getConfigDir(vaultOrConfigDir);
  const pluginRoot = `${configDir}/plugins/`;
  const pluginDir = `${pluginRoot}${pluginId}`;
  return {
    configDir,
    pluginRoot,
    pluginDir,
    pluginDirPrefix: `${pluginDir}/`,
    dataFile: `${pluginDir}/data.json`,
    remoteStateFile: `${pluginDir}/remote-state.json`,
    stateV2File: `${pluginDir}/state-v2.json`,
    stateV2NextFile: `${pluginDir}/state-v2.next.json`,
    stateV2PreviousFile: `${pluginDir}/state-v2.previous.json`,
    stateV2RecoveryFile: `${pluginDir}/state-v2.recovery.json`,
    stateV2ManifestFile: `${pluginDir}/state-v2.manifest.json`,
    stateV2ManifestNextFile: `${pluginDir}/state-v2.manifest.next.json`,
    stateV1BackupFile: `${pluginDir}/state-v1.backup.json`,
    baseContentFile: `${pluginDir}/base-content.json`,
    ancestorsV2Dir: `${pluginDir}/ancestors-v2`,
    ancestorManifestV2File: `${pluginDir}/ancestor-manifest-v2.json`,
    ancestorManifestV2NextFile: `${pluginDir}/ancestor-manifest-v2.next.json`,
    logsDir: `${pluginDir}/logs`,
    tmpDir: `${pluginDir}/tmp`,
    scanCacheFile: `${pluginDir}/scan-cache.json`,
    manifestFile: `${pluginDir}/manifest.json`
  };
}
function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function isStringRecord(value) {
  if (!isRecord(value)) return false;
  return Object.values(value).every((entry) => typeof entry === "string");
}
function getCurrentWindow() {
  return typeof window !== "undefined" ? window.activeWindow ?? window : null;
}
function hasTimerMethods(value) {
  return typeof value === "object" && value !== null && typeof value.setTimeout === "function" && typeof value.clearTimeout === "function" && typeof value.setInterval === "function" && typeof value.clearInterval === "function";
}
function hasAnimationMethods(value) {
  return typeof value === "object" && value !== null && typeof value.requestAnimationFrame === "function" && typeof value.cancelAnimationFrame === "function";
}
function getTimerWindow() {
  const currentWindow = getCurrentWindow();
  if (hasTimerMethods(currentWindow)) return currentWindow;
  if (hasTimerMethods(fallbackWindow)) return fallbackWindow;
  throw new Error("Timer APIs unavailable");
}
function getAnimationWindow() {
  const currentWindow = getCurrentWindow();
  if (hasAnimationMethods(currentWindow)) return currentWindow;
  return hasAnimationMethods(fallbackWindow) ? fallbackWindow : null;
}
function compatSetTimeout(handler, timeout) {
  return getTimerWindow().setTimeout(handler, timeout);
}
function compatClearTimeout(handle) {
  if (handle == null) return;
  getTimerWindow().clearTimeout(handle);
}
function compatSetInterval(handler, timeout) {
  return getTimerWindow().setInterval(handler, timeout);
}
function compatClearInterval(handle) {
  if (handle == null) return;
  getTimerWindow().clearInterval(handle);
}
function compatRequestAnimationFrame(callback) {
  const compatWindow = getAnimationWindow();
  if (compatWindow) {
    return compatWindow.requestAnimationFrame(callback);
  }
  return getTimerWindow().setTimeout(() => callback(Date.now()), 16);
}
function compatCancelAnimationFrame(handle) {
  if (handle == null) return;
  const compatWindow = getAnimationWindow();
  if (compatWindow) {
    compatWindow.cancelAnimationFrame(handle);
    return;
  }
  getTimerWindow().clearTimeout(handle);
}

// src/auth/auth-module.ts
var import_obsidian2 = require("obsidian");

// src/auth/types.ts
var AuthError = class extends Error {
  constructor(type, message) {
    super(message);
    this.type = type;
    this.name = "AuthError";
  }
};
var MS_AUTH_CONFIG = {
  /** Authorization endpoint */
  authorizeEndpoint: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
  /** Token endpoint */
  tokenEndpoint: "https://login.microsoftonline.com/common/oauth2/v2.0/token",
  /** Client ID — replaced during Entra app registration */
  clientId: "7d9ac248-9c51-422f-8cba-49e0a6a1ed67",
  /** Redirect URI registered in Entra */
  redirectUri: "obsidian://easy-sync-auth",
  /** OAuth scopes. Files.ReadWrite.AppFolder gives sandboxed access to the
   *  app's dedicated folder. Files.Read covers the /content download endpoint. */
  scopes: ["User.Read", "offline_access", "Files.ReadWrite.AppFolder", "Files.Read"]
};
var SS_REFRESH_TOKEN = "easy-sync-onedrive-refresh-token";

// src/auth/pkce.ts
function generateCodeVerifier() {
  const bytes = new Uint8Array(128);
  crypto.getRandomValues(bytes);
  return base64UrlEncode(bytes);
}
function generateCodeChallengeSync(verifier) {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const hash = sha256Sync(data);
  return base64UrlEncode(hash);
}
function generateState() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return base64UrlEncode(bytes);
}
function base64UrlEncode(buffer) {
  let binary = "";
  for (let i = 0; i < buffer.length; i++) {
    binary += String.fromCharCode(buffer[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function sha256Sync(message) {
  const K = [
    1116352408,
    1899447441,
    3049323471,
    3921009573,
    961987163,
    1508970993,
    2453635748,
    2870763221,
    3624381080,
    310598401,
    607225278,
    1426881987,
    1925078388,
    2162078206,
    2614888103,
    3248222580,
    3835390401,
    4022224774,
    264347078,
    604807628,
    770255983,
    1249150122,
    1555081692,
    1996064986,
    2554220882,
    2821834349,
    2952996808,
    3210313671,
    3336571891,
    3584528711,
    113926993,
    338241895,
    666307205,
    773529912,
    1294757372,
    1396182291,
    1695183700,
    1986661051,
    2177026350,
    2456956037,
    2730485921,
    2820302411,
    3259730800,
    3345764771,
    3516065817,
    3600352804,
    4094571909,
    275423344,
    430227734,
    506948616,
    659060556,
    883997877,
    958139571,
    1322822218,
    1537002063,
    1747873779,
    1955562222,
    2024104815,
    2227730452,
    2361852424,
    2428436474,
    2756734187,
    3204031479,
    3329325298
  ];
  let H0 = 1779033703, H1 = 3144134277, H2 = 1013904242, H3 = 2773480762, H4 = 1359893119, H5 = 2600822924, H6 = 528734635, H7 = 1541459225;
  const msgLen = message.length;
  const msgBitLen = msgLen * 8;
  const zeros = (64 - (msgLen + 1 + 8) % 64) % 64;
  const totalLen = msgLen + 1 + zeros + 8;
  const padded = new Uint8Array(totalLen);
  padded.set(message);
  padded[msgLen] = 128;
  const lo = msgBitLen >>> 0;
  padded[totalLen - 4] = lo >>> 24 & 255;
  padded[totalLen - 3] = lo >>> 16 & 255;
  padded[totalLen - 2] = lo >>> 8 & 255;
  padded[totalLen - 1] = lo & 255;
  for (let offset = 0; offset < totalLen; offset += 64) {
    const W = new Uint32Array(64);
    for (let t = 0; t < 16; t++) {
      const i = offset + t * 4;
      W[t] = padded[i] << 24 | padded[i + 1] << 16 | padded[i + 2] << 8 | padded[i + 3];
    }
    for (let t = 16; t < 64; t++) {
      const s0 = rotr32(W[t - 15], 7) ^ rotr32(W[t - 15], 18) ^ W[t - 15] >>> 3;
      const s1 = rotr32(W[t - 2], 17) ^ rotr32(W[t - 2], 19) ^ W[t - 2] >>> 10;
      W[t] = W[t - 16] + s0 + W[t - 7] + s1 | 0;
    }
    let a = H0, b = H1, c = H2, d = H3, e = H4, f = H5, g = H6, h = H7;
    for (let t = 0; t < 64; t++) {
      const S1 = rotr32(e, 6) ^ rotr32(e, 11) ^ rotr32(e, 25);
      const ch = e & f ^ ~e & g;
      const temp1 = h + S1 + ch + K[t] + W[t] | 0;
      const S0 = rotr32(a, 2) ^ rotr32(a, 13) ^ rotr32(a, 22);
      const maj = a & b ^ a & c ^ b & c;
      const temp2 = S0 + maj | 0;
      h = g;
      g = f;
      f = e;
      e = d + temp1 | 0;
      d = c;
      c = b;
      b = a;
      a = temp1 + temp2 | 0;
    }
    H0 = H0 + a | 0;
    H1 = H1 + b | 0;
    H2 = H2 + c | 0;
    H3 = H3 + d | 0;
    H4 = H4 + e | 0;
    H5 = H5 + f | 0;
    H6 = H6 + g | 0;
    H7 = H7 + h | 0;
  }
  const result = new Uint8Array(32);
  const words = [H0, H1, H2, H3, H4, H5, H6, H7];
  for (let i = 0; i < 8; i++) {
    result[i * 4] = words[i] >>> 24 & 255;
    result[i * 4 + 1] = words[i] >>> 16 & 255;
    result[i * 4 + 2] = words[i] >>> 8 & 255;
    result[i * 4 + 3] = words[i] & 255;
  }
  return result;
}
function rotr32(x, n) {
  return x >>> n | x << 32 - n;
}

// src/auth/auth-module.ts
var AuthModule = class {
  constructor(ctx, t) {
    this.ctx = ctx;
    /** Current non-sensitive auth state (no tokens) */
    this.state = {
      accessTokenExpiry: 0,
      accountId: "",
      displayName: "",
      isLoggedIn: false
    };
    /** In-memory access token (never persisted to disk) */
    this.accessToken = "";
    /** Pending OAuth flow state */
    this.pending = null;
    /** True while initialize() is running its async work (token refresh + profile fetch) */
    this._initializing = false;
    /** Polling timer for auto-detecting OAuth callback completion */
    this.pollTimer = null;
    /** Callback when auth state changes */
    this.onChange = null;
    this.t = t;
  }
  /** Shorthand to ctx.diag so we don't write this.ctx.diag?. everywhere */
  get diag() {
    return this.ctx.diag;
  }
  tr(key, fallback, params) {
    return this.t?.(key, params) ?? fallback;
  }
  /** Current auth state (no tokens) */
  get authState() {
    return { ...this.state };
  }
  /** Whether an OAuth flow is in progress (browser opened, awaiting callback).
   *  Auto-clears after 5 minutes to prevent stale pending state. */
  get isPending() {
    if (!this.pending) return false;
    if (Date.now() - this.pending.createdAt > 5 * 60 * 1e3) {
      this.diag?.warn("auth", "OAuth pending auth expired after 5 minutes \u2014 no callback received");
      this.pending = null;
      this.stopPolling();
      return false;
    }
    return true;
  }
  /** True while initialize() is restoring a session from SecretStorage.
   *  UI can use this to show a "connecting" state during cold start. */
  get isInitializing() {
    return this._initializing;
  }
  /** Three-state auth status for UI display */
  get authStatus() {
    if (this.state.isLoggedIn) return "loggedIn";
    if (this.isPending) return "pending";
    return "idle";
  }
  /** Manual one-shot check: has the OAuth callback completed?
   *  Returns true if the user is now logged in. */
  checkAuthStatus() {
    return this.state.isLoggedIn;
  }
  /** Start auto-polling for OAuth callback completion (every 3 seconds) */
  startPolling() {
    this.stopPolling();
    this.pollTimer = compatSetInterval(() => {
      if (this.state.isLoggedIn) {
        this.stopPolling();
        this.notifyChange();
        return;
      }
      if (!this.isPending) {
        this.stopPolling();
        this.notifyChange();
        return;
      }
      this.notifyChange();
    }, 3e3);
  }
  stopPolling() {
    if (this.pollTimer) {
      compatClearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }
  /** Register a callback for auth state changes */
  onStateChange(cb) {
    this.onChange = cb;
  }
  /** Initialize: restore session from stored refresh token.
   *  Caller can choose to await (blocking) or fire-and-forget (non-blocking).
   *  The protocol handler is registered synchronously at the start so
   *  OAuth callbacks work even before the async token refresh completes. */
  async initialize() {
    try {
      this.ctx.registerProtocolHandler("easy-sync-auth", (params) => {
        this.handleCallback(params).catch((e) => {
          this.diag?.error("auth", "OAuth callback error", e);
        });
      });
      this.diag?.log("auth", "protocol handler registered");
    } catch (e) {
      this.diag?.error("auth", "failed to register protocol handler", e);
    }
    this._initializing = true;
    try {
      const stored = await this.ctx.secretStorage.get(SS_REFRESH_TOKEN);
      if (stored) {
        await this.refreshAccessToken(stored);
        this.state.isLoggedIn = true;
        await this.fetchUserProfile();
        this.diag?.log("auth", "restored auth session from SecretStorage");
      }
    } catch (e) {
      if (e instanceof AuthError && e.type === "SecretStorageUnavailable" /* SecretStorageUnavailable */) {
        this.diag?.warn("auth", "SecretStorage not available, auth disabled");
      } else {
        this.diag?.warn("auth", "failed to restore auth session", e);
      }
    }
    this._initializing = false;
    this.notifyChange();
  }
  /** Start the OAuth login flow.
   *
   *  IMPORTANT — iOS WKWebView compat:
   *  Every operation between the user tap and window.open() MUST be
   *  synchronous. Any await breaks the "user initiated" gesture chain
   *  and causes iOS to block the popup. We use generateCodeChallengeSync()
   *  (inline SHA-256) instead of the async Web Crypto version for this
   *  reason. */
  async login() {
    this.diag?.log("auth", `login() called, isLoggedIn=${this.state.isLoggedIn}, isPending=${!!this.pending}`);
    if (!MS_AUTH_CONFIG.clientId) {
      throw new AuthError(
        "ProviderError" /* ProviderError */,
        this.tr("auth.error.clientNotConfigured", "OneDrive client ID not configured.")
      );
    }
    const popup = this.ctx.openAuthPopup?.() ?? null;
    try {
      const codeVerifier = generateCodeVerifier();
      const codeChallenge = generateCodeChallengeSync(codeVerifier);
      const state = generateState();
      this.pending = {
        codeVerifier,
        state,
        createdAt: Date.now()
      };
      const params = new URLSearchParams({
        client_id: MS_AUTH_CONFIG.clientId,
        response_type: "code",
        redirect_uri: MS_AUTH_CONFIG.redirectUri,
        scope: MS_AUTH_CONFIG.scopes.join(" "),
        code_challenge: codeChallenge,
        code_challenge_method: "S256",
        state,
        prompt: "consent"
        // force re-consent so scope upgrades (e.g. AppFolder → Files.ReadWrite) take effect
      });
      const authUrl = `${MS_AUTH_CONFIG.authorizeEndpoint}?${params.toString()}`;
      this.diag?.log("auth", "opening auth URL...");
      const navigated = popup?.navigate(authUrl) ?? false;
      if (!navigated) {
        this.ctx.openUrl(authUrl);
      }
      this.diag?.log("auth", "openUrl returned");
      this.startPolling();
      this.diag?.log("auth", "polling started");
    } catch (error) {
      popup?.close();
      throw error;
    }
  }
  /** Handle the OAuth redirect callback */
  async handleCallback(params) {
    const { code, state, error, error_description } = params;
    if (!this.pending) {
      this.diag?.warn("auth", "OAuth callback received but no pending auth");
      return;
    }
    if (state !== this.pending.state) {
      this.pending = null;
      throw new AuthError("StateMismatch" /* StateMismatch */, this.tr("auth.error.stateMismatch", "OAuth state mismatch."));
    }
    if (error) {
      this.pending = null;
      throw new AuthError(
        "ProviderError" /* ProviderError */,
        this.tr("auth.error.providerError", `Microsoft error: ${error}`, { details: error_description || error })
      );
    }
    if (!code) {
      this.pending = null;
      throw new AuthError("ProviderError" /* ProviderError */, this.tr("auth.error.noCode", "No authorization code received"));
    }
    try {
      const tokenResponse = await this.exchangeCodeForTokens(
        code,
        this.pending.codeVerifier
      );
      if (tokenResponse.refresh_token) {
        await this.ctx.secretStorage.set(SS_REFRESH_TOKEN, tokenResponse.refresh_token);
      }
      this.accessToken = tokenResponse.access_token;
      this.state.accessTokenExpiry = Date.now() + (tokenResponse.expires_in - 60) * 1e3;
      this.state.isLoggedIn = true;
      await this.fetchUserProfile();
      this.diag?.log("auth", "OAuth login successful");
      this.ctx.onFreshLogin?.();
    } finally {
      this.pending = null;
      this.stopPolling();
    }
    this.notifyChange();
  }
  /** Exchange authorization code for access + refresh tokens */
  async exchangeCodeForTokens(code, codeVerifier) {
    const body = new URLSearchParams({
      client_id: MS_AUTH_CONFIG.clientId,
      grant_type: "authorization_code",
      code,
      redirect_uri: MS_AUTH_CONFIG.redirectUri,
      code_verifier: codeVerifier
    });
    return this.tokenRequest(body);
  }
  /** Refresh an expired access token */
  async refreshAccessToken(refreshToken) {
    const rt = refreshToken ?? await this.getStoredRefreshToken();
    if (!rt) {
      throw new AuthError("NoRefreshToken" /* NoRefreshToken */, this.tr("auth.error.noRefreshToken", "No refresh token available"));
    }
    const body = new URLSearchParams({
      client_id: MS_AUTH_CONFIG.clientId,
      grant_type: "refresh_token",
      refresh_token: rt
    });
    try {
      const tokenResponse = await this.tokenRequest(body);
      if (tokenResponse.refresh_token) {
        await this.ctx.secretStorage.set(SS_REFRESH_TOKEN, tokenResponse.refresh_token);
      }
      this.accessToken = tokenResponse.access_token;
      this.state.accessTokenExpiry = Date.now() + (tokenResponse.expires_in - 60) * 1e3;
      this.state.isLoggedIn = true;
      return this.accessToken;
    } catch {
      this.state.isLoggedIn = false;
      this.notifyChange();
      throw new AuthError(
        "RefreshFailed" /* RefreshFailed */,
        this.tr("auth.error.refreshFailed", "Token refresh failed.")
      );
    }
  }
  /**
   * Get a valid access token.
   * Refreshes automatically if expired.
   * This is the only method the sync engine should call.
   */
  async getAccessToken() {
    if (!this.state.isLoggedIn) {
      throw new AuthError("NoRefreshToken" /* NoRefreshToken */, this.tr("auth.error.notLoggedIn", "Not logged in"));
    }
    if (this.accessToken && Date.now() < this.state.accessTokenExpiry) {
      return this.accessToken;
    }
    this.diag?.log("auth", "access token expired, refreshing silently");
    try {
      return await this.refreshAccessToken();
    } catch (e) {
      this.diag?.warn("auth", `token refresh failed, transitioning to logged-out: ${e instanceof Error ? e.message : String(e)}`);
      await this.logout();
      throw e;
    }
  }
  /** Log out: clear tokens from SecretStorage and memory */
  async logout() {
    this.stopPolling();
    try {
      await this.ctx.secretStorage.remove(SS_REFRESH_TOKEN);
    } catch {
    }
    try {
      await this.ctx.profileCache?.clear();
    } catch {
    }
    this.accessToken = "";
    this.state = {
      accessTokenExpiry: 0,
      accountId: "",
      displayName: "",
      isLoggedIn: false
    };
    this.notifyChange();
    this.diag?.log("auth", "logged out");
  }
  /** Make a POST request to the Microsoft token endpoint */
  async tokenRequest(body) {
    let response;
    try {
      response = await (0, import_obsidian2.requestUrl)({
        url: MS_AUTH_CONFIG.tokenEndpoint,
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: body.toString()
      });
    } catch (e) {
      throw new AuthError(
        "NetworkError" /* NetworkError */,
        this.tr("auth.error.networkError", "Network error during authentication.", { details: e instanceof Error ? e.message : "unknown" })
      );
    }
    if (response.status !== 200) {
      const errorData = response.json;
      throw new AuthError(
        "ProviderError" /* ProviderError */,
        this.tr("auth.error.providerError", `Token endpoint returned ${response.status}`, { details: String(errorData?.error || "unknown") })
      );
    }
    return response.json;
  }
  /** Get the stored refresh token from SecretStorage */
  async getStoredRefreshToken() {
    try {
      return await this.ctx.secretStorage.get(SS_REFRESH_TOKEN);
    } catch {
      throw new AuthError(
        "SecretStorageUnavailable" /* SecretStorageUnavailable */,
        this.tr("auth.error.secretStorageUnavailable", "SecretStorage not available")
      );
    }
  }
  /** Fetch user profile from Microsoft Graph to populate displayName and accountId.
   *  Cached profile data is display-only: account authorization must always be
   *  anchored to /me for the current access token. */
  async fetchUserProfile() {
    const cached = await this.ctx.profileCache?.get();
    if (cached) {
      this.state.displayName = cached.displayName;
      this.diag?.log("auth", `profile display cache hit: ${cached.displayName}`);
    }
    this.state.accountId = "";
    this.diag?.log("auth", "verifying current token account through Graph /me");
    try {
      const response = await (0, import_obsidian2.requestUrl)({
        url: "https://graph.microsoft.com/v1.0/me?$select=displayName,id",
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.accessToken}`
        }
      });
      if (response.status === 200) {
        const data = response.json;
        if (data.displayName) {
          this.state.displayName = data.displayName;
        }
        if (data.id) {
          this.state.accountId = data.id;
        }
        if (this.state.accountId) {
          await this.ctx.profileCache?.set({
            displayName: this.state.displayName,
            accountId: this.state.accountId
          });
        }
      }
    } catch (e) {
      this.diag?.warn("auth", "failed to verify current token account", e);
    }
  }
  notifyChange() {
    if (this.onChange) {
      this.onChange();
    }
  }
};

// src/auth/auth-browser.ts
function createAuthBrowserLauncher(options) {
  const openWindow = options.openWindow ?? ((url, target, features) => window.open(url, target, features));
  return {
    openAuthPopup: () => {
      if (options.isDesktopApp) return null;
      const popup = openWindow("about:blank", "_blank");
      if (!popup) return null;
      return {
        navigate: (url) => {
          try {
            popup.location.href = url;
            return true;
          } catch (error) {
            options.onPopupNavigationError?.(error);
            return false;
          }
        },
        close: () => {
          try {
            popup.close();
          } catch {
          }
        }
      };
    },
    openUrl: (url) => {
      if (options.isDesktopApp) {
        openWindow(url, "_external", "noopener,noreferrer");
        return;
      }
      openWindow(url, "_blank");
    }
  };
}

// src/onedrive/client.ts
var import_obsidian3 = require("obsidian");

// src/crypto.ts
async function sha256Hex(content) {
  const hashBuffer = await crypto.subtle.digest("SHA-256", content);
  const bytes = new Uint8Array(hashBuffer);
  let hex = "";
  for (let index = 0; index < bytes.length; index++) {
    hex += bytes[index].toString(16).padStart(2, "0");
  }
  return hex;
}

// src/onedrive/types.ts
var OneDriveError = class extends Error {
  constructor(type, message, statusCode = 0, retryAfterSeconds = null, graphCode = null) {
    super(message);
    this.name = "OneDriveError";
    this.type = type;
    this.statusCode = statusCode;
    this.retryAfterSeconds = retryAfterSeconds;
    this.graphCode = graphCode;
  }
};
function encodeUrlPath(path) {
  return path.split("/").map((s) => encodeURIComponent(s)).join("/");
}
var APP_FOLDER_PATHS = {
  /** App Folder root, accessed via /me/drive/special/approot */
  appRoot: "/me/drive/special/approot",
  /** Vault directory: /vaults/<vault-name>/ */
  vaultDir: (vaultName) => `/me/drive/special/approot:/vaults/${encodeUrlPath(vaultName)}`,
  /** Files directory: /vaults/<vault-name>/files/ */
  filesDir: (vaultName) => `/me/drive/special/approot:/vaults/${encodeUrlPath(vaultName)}/files`,
  /** Plugin state directory: /vaults/<vault-name>/.easy-sync/ */
  pluginDir: (vaultName) => `/me/drive/special/approot:/vaults/${encodeUrlPath(vaultName)}/.easy-sync`,
  /** Delta endpoint for files directory */
  filesDelta: (vaultName) => `/me/drive/special/approot:/vaults/${encodeUrlPath(vaultName)}/files:/delta`,
  /** Single file: /vaults/<vault-name>/files/<path> */
  filePath: (vaultName, filePath) => `/me/drive/special/approot:/vaults/${encodeUrlPath(vaultName)}/files/${encodeUrlPath(filePath)}`
};
var GRAPH_BASE_URL = "https://graph.microsoft.com/v1.0";

// src/onedrive/upload-session-policy.ts
var MIB = 1024 * 1024;
var UPLOAD_SESSION_THRESHOLD_BYTES = 10 * MIB;
var UPLOAD_CHUNK_ALIGNMENT_BYTES = 320 * 1024;
var UPLOAD_CHUNK_NORMAL_BYTES = 10 * MIB;
var UPLOAD_CHUNK_SLOW_BYTES = 5 * MIB;
var UPLOAD_SLOW_CONNECTION_BYTES_PER_SECOND = 1 * MIB;
var UPLOAD_TIMEOUT_BASE_BYTES_PER_SECOND = 128 * 1024;
var UPLOAD_TIMEOUT_MIN_BYTES_PER_SECOND = 64 * 1024;
var UPLOAD_TIMEOUT_OVERHEAD_MS = 15e3;
var UPLOAD_TIMEOUT_MIN_MS = 3e4;
var UPLOAD_TIMEOUT_MAX_MS = 3e5;
function shouldUseUploadSession(fileSize) {
  return fileSize > UPLOAD_SESSION_THRESHOLD_BYTES;
}
function uploadSessionChunkSize(observedBytesPerSecond, recovering) {
  if (recovering || observedBytesPerSecond !== null && Number.isFinite(observedBytesPerSecond) && observedBytesPerSecond > 0 && observedBytesPerSecond < UPLOAD_SLOW_CONNECTION_BYTES_PER_SECOND) {
    return UPLOAD_CHUNK_SLOW_BYTES;
  }
  return UPLOAD_CHUNK_NORMAL_BYTES;
}
function uploadSessionChunkTimeoutMs(chunkBytes, observedBytesPerSecond) {
  const observedBudgetRate = observedBytesPerSecond !== null && Number.isFinite(observedBytesPerSecond) && observedBytesPerSecond > 0 ? observedBytesPerSecond / 2 : UPLOAD_TIMEOUT_BASE_BYTES_PER_SECOND;
  const budgetRate = Math.max(
    UPLOAD_TIMEOUT_MIN_BYTES_PER_SECOND,
    Math.min(UPLOAD_TIMEOUT_BASE_BYTES_PER_SECOND, observedBudgetRate)
  );
  const transferMs = Math.ceil(Math.max(0, chunkBytes) / budgetRate * 1e3);
  return Math.min(
    UPLOAD_TIMEOUT_MAX_MS,
    Math.max(UPLOAD_TIMEOUT_MIN_MS, UPLOAD_TIMEOUT_OVERHEAD_MS + transferMs)
  );
}
function firstMissingUploadRange(ranges, totalBytes) {
  if (!Array.isArray(ranges) || !Number.isSafeInteger(totalBytes) || totalBytes <= 0) {
    return null;
  }
  const parsed = [];
  for (const value of ranges) {
    if (typeof value !== "string") continue;
    const match = /^(\d+)-(\d*)$/.exec(value.trim());
    if (!match) continue;
    const start = Number(match[1]);
    const inclusiveEnd = match[2] ? Number(match[2]) : totalBytes - 1;
    if (!Number.isSafeInteger(start) || !Number.isSafeInteger(inclusiveEnd) || start < 0 || start >= totalBytes || inclusiveEnd < start) {
      continue;
    }
    parsed.push({
      start,
      endExclusive: Math.min(totalBytes, inclusiveEnd + 1)
    });
  }
  parsed.sort((left, right) => left.start - right.start);
  return parsed[0] ?? null;
}
function uploadRangeEndExclusive(range, chunkSize, totalBytes) {
  return Math.min(range.endExclusive, range.start + chunkSize, totalBytes);
}

// src/onedrive/client.ts
var REQUEST_TIMEOUT_MS = 15e3;
var MAX_REQUEST_ATTEMPTS = 3;
var RETRY_BASE_MS = 500;
var RETRY_JITTER_MS = 250;
var DOWNLOAD_BASE_TIMEOUT_MS = 3e4;
var DOWNLOAD_PER_MIB_TIMEOUT_MS = 3e3;
var DOWNLOAD_MAX_TIMEOUT_MS = 3e5;
var DOWNLOAD_FAILURE_RESERVE_RATIO = 0.5;
var UPLOAD_SESSION_CONTROL_TIMEOUT_MS = 15e3;
var MAX_UPLOAD_SESSION_RECOVERIES = 3;
var OneDriveClient = class {
  constructor(getToken, diag, configDir = DEFAULT_CONFIG_DIR, pluginId = "easy-sync") {
    this.getToken = getToken;
    this.diag = diag;
    this.configDir = configDir;
    this.pluginId = pluginId;
    this.initializedVaults = /* @__PURE__ */ new Set();
    this.storageVaultNames = /* @__PURE__ */ new Map();
    this.vaultScopes = /* @__PURE__ */ new Map();
    this.abortSignal = null;
    /** Remember which download strategy worked last in this sync round so
     *  subsequent files skip the waterfall of known-broken tiers. */
    this.downloadMethod = null;
    /** M13: set when both /content tiers fail for a file in this round.
     *  Subsequent files skip /content entirely — it's confirmed broken. */
    this.contentFailedThisRound = false;
    /** Set when CDN downloadUrl fails for a file this round.
     *  Subsequent files skip CDN entirely — saves budget for /content. */
    this.cdnFailedThisRound = false;
    this.runMetrics = null;
  }
  setAbortSignal(signal) {
    this.abortSignal = signal;
  }
  /** Start an in-memory diagnostic scope for one sync round. */
  beginRunMetrics() {
    this.runMetrics = {
      activeConcurrency: 0,
      peakConcurrency: 0,
      tokenAcquisition: {
        attempts: 0,
        elapsedMs: 0,
        maxElapsedMs: 0
      },
      endpoints: {},
      metadataReasons: {}
    };
  }
  /** Finish the current diagnostic scope without persisting any state. */
  finishRunMetrics() {
    const active = this.runMetrics;
    this.runMetrics = null;
    if (!active) return null;
    const endpoints = {};
    const totals = {
      attempts: 0,
      succeeded: 0,
      failed: 0,
      cancelled: 0,
      elapsedMs: 0,
      effectiveBytes: 0,
      failedBytes: 0,
      retriedBytes: 0,
      peakConcurrency: active.peakConcurrency
    };
    for (const [category, metrics] of Object.entries(active.endpoints)) {
      const { activeConcurrency: _activeConcurrency, ...snapshot } = metrics;
      endpoints[category] = {
        ...snapshot,
        statusCategories: { ...snapshot.statusCategories }
      };
      totals.attempts += snapshot.attempts;
      totals.succeeded += snapshot.succeeded;
      totals.failed += snapshot.failed;
      totals.cancelled += snapshot.cancelled;
      totals.elapsedMs += snapshot.elapsedMs;
      totals.effectiveBytes += snapshot.effectiveBytes;
      totals.failedBytes += snapshot.failedBytes;
      totals.retriedBytes += snapshot.retriedBytes;
    }
    return {
      schemaVersion: 2,
      tokenAcquisition: { ...active.tokenAcquisition },
      totals,
      endpoints,
      metadataReasons: Object.fromEntries(
        Object.entries(active.metadataReasons).map(([reason, metrics]) => [
          reason,
          { ...metrics }
        ])
      )
    };
  }
  recordTokenAcquisition(startedAt) {
    const active = this.runMetrics;
    if (!active) return;
    const elapsedMs = Math.max(0, Date.now() - startedAt);
    active.tokenAcquisition.attempts++;
    active.tokenAcquisition.elapsedMs += elapsedMs;
    active.tokenAcquisition.maxElapsedMs = Math.max(
      active.tokenAcquisition.maxElapsedMs,
      elapsedMs
    );
  }
  async acquireToken() {
    const startedAt = Date.now();
    try {
      return await this.getToken();
    } finally {
      this.recordTokenAcquisition(startedAt);
    }
  }
  beginMetricAttempt(endpoint) {
    const startedAt = Date.now();
    const active = this.runMetrics;
    if (!active) return startedAt;
    const metrics = active.endpoints[endpoint] ?? createEndpointRunMetrics();
    active.endpoints[endpoint] = metrics;
    metrics.activeConcurrency++;
    metrics.peakConcurrency = Math.max(metrics.peakConcurrency, metrics.activeConcurrency);
    active.activeConcurrency++;
    active.peakConcurrency = Math.max(active.peakConcurrency, active.activeConcurrency);
    return startedAt;
  }
  finishMetricAttempt(endpoint, status, startedAt, effectiveBytes = 0, retriedBytes = 0, failedBytes = 0, metadataReason, countsAsSucceeded = false) {
    const active = this.runMetrics;
    if (!active) return;
    const metrics = active.endpoints[endpoint] ?? createEndpointRunMetrics();
    active.endpoints[endpoint] = metrics;
    metrics.attempts++;
    metrics.elapsedMs += Math.max(0, Date.now() - startedAt);
    metrics.effectiveBytes += Math.max(0, effectiveBytes);
    metrics.retriedBytes += Math.max(0, retriedBytes);
    metrics.failedBytes += Math.max(0, failedBytes);
    metrics.statusCategories[status] = (metrics.statusCategories[status] ?? 0) + 1;
    if (status === "success" || countsAsSucceeded) {
      metrics.succeeded++;
    } else if (status === "cancelled") {
      metrics.cancelled++;
    } else {
      metrics.failed++;
    }
    metrics.activeConcurrency = Math.max(0, metrics.activeConcurrency - 1);
    active.activeConcurrency = Math.max(0, active.activeConcurrency - 1);
    if (endpoint === "metadata" && metadataReason) {
      const reasonMetrics = active.metadataReasons[metadataReason] ?? createMetadataReasonRunMetrics();
      active.metadataReasons[metadataReason] = reasonMetrics;
      reasonMetrics.attempts++;
      reasonMetrics.elapsedMs += Math.max(0, Date.now() - startedAt);
      if (status === "success" || countsAsSucceeded) reasonMetrics.succeeded++;
      else if (status === "cancelled") reasonMetrics.cancelled++;
      else reasonMetrics.failed++;
    }
  }
  // ---- App Folder Bootstrap ----
  /** Get the App Folder special folder metadata */
  async getAppFolder() {
    const response = await this.request("GET", APP_FOLDER_PATHS.appRoot);
    return response.json;
  }
  /** Ensure a directory exists and return its metadata when Graph creates it. */
  async createFolder(folderPath) {
    const encodedName = folderPath.split("/").pop() || "";
    try {
      const response = await this.request(
        "PUT",
        folderPath,
        {
          name: decodeURIComponent(encodedName),
          folder: {},
          "@microsoft.graph.conflictBehavior": "fail"
        }
      );
      return response.json;
    } catch (e) {
      if (e instanceof OneDriveError && e.type === "Conflict" /* Conflict */) {
        this.diag?.log("onedrive", `folder already exists (409): ${folderPath}`);
        return null;
      }
      throw e;
    }
  }
  /** Initialize the App Folder directory structure and return Graph-owned identities.
   *  Read-only preview callers can require existing folders so this method
   *  uses GET only and never sends an idempotent create request. */
  async initVaultScope(vaultName, options = {}) {
    if (this.initializedVaults.has(vaultName)) {
      const scope2 = this.vaultScopes.get(vaultName);
      if (!scope2) throw new Error(`Missing initialized vault scope: ${vaultName}`);
      return scope2;
    }
    const storageVaultName = await this.resolveStorageVaultName(vaultName);
    this.storageVaultNames.set(vaultName, storageVaultName);
    const createMissing = options.createMissing ?? true;
    const vaultPath = APP_FOLDER_PATHS.vaultDir(storageVaultName);
    const createdVaultFolder = createMissing ? await this.createFolder(vaultPath) : null;
    const vaultFolder = createdVaultFolder ?? (await this.request("GET", vaultPath)).json;
    if (!vaultFolder.id || !vaultFolder.folder) {
      throw new Error(`Invalid vault folder metadata: ${vaultPath}`);
    }
    const filesPath = APP_FOLDER_PATHS.filesDir(storageVaultName);
    const createdFilesFolder = createMissing ? await this.createFolder(filesPath) : null;
    const filesFolder = createdFilesFolder ?? (await this.request("GET", filesPath)).json;
    if (!filesFolder.id || !filesFolder.folder) {
      throw new Error(`Invalid files root metadata: ${filesPath}`);
    }
    if (filesFolder.parentReference?.id && filesFolder.parentReference.id !== vaultFolder.id) {
      throw new Error(`Files root parent identity mismatch: ${filesPath}`);
    }
    let driveId = filesFolder.parentReference?.driveId ?? vaultFolder.parentReference?.driveId;
    if (!driveId) {
      const drive = (await this.request("GET", "/me/drive?$select=id")).json;
      driveId = drive.id;
    }
    if (!driveId) throw new Error(`Missing drive identity for vault: ${vaultName}`);
    if (createMissing) {
      const pluginPath = APP_FOLDER_PATHS.pluginDir(storageVaultName);
      await this.createFolder(pluginPath);
    }
    const scope = {
      driveId,
      vaultFolderId: vaultFolder.id,
      filesRootId: filesFolder.id
    };
    this.vaultScopes.set(vaultName, scope);
    if (createMissing) this.initializedVaults.add(vaultName);
    return scope;
  }
  /** Restore a previously committed Graph-owned scope without probing folders.
   *  The delta link must still prove which canonical/legacy storage path owns
   *  the cursor; callers fall back to live initialization when it cannot. */
  restoreVaultScope(vaultName, scope, deltaLink) {
    if (!scope.driveId || !scope.vaultFolderId || !scope.filesRootId || !deltaLink) {
      return false;
    }
    const candidates = [vaultName];
    const legacyName = encodeURIComponent(vaultName);
    if (legacyName !== vaultName) candidates.push(legacyName);
    const storageVaultName = candidates.find(
      (candidate) => deltaLink.includes(APP_FOLDER_PATHS.filesDelta(candidate))
    );
    if (!storageVaultName) return false;
    this.storageVaultNames.set(vaultName, storageVaultName);
    this.vaultScopes.set(vaultName, { ...scope });
    this.initializedVaults.add(vaultName);
    return true;
  }
  invalidateVaultScope(vaultName) {
    this.initializedVaults.delete(vaultName);
    this.storageVaultNames.delete(vaultName);
    this.vaultScopes.delete(vaultName);
  }
  isDeltaLinkForVault(vaultName, deltaLink) {
    return deltaLink.includes(
      APP_FOLDER_PATHS.filesDelta(this.getStorageVaultName(vaultName))
    );
  }
  /** Reset the per-round download strategy hint. Called at the start of
   *  each sync round so the first file runs the full waterfall. */
  resetDownloadStrategy() {
    this.downloadMethod = null;
    this.contentFailedThisRound = false;
    this.cdnFailedThisRound = false;
  }
  /**
   * A read-only signal for the per-run small-file download controller.
   * Once a CDN/content fallback or a retryable transport failure is observed,
   * callers must keep the remainder of the round serial.
   */
  hasDegradedDownloadPathThisRound() {
    if (this.cdnFailedThisRound || this.contentFailedThisRound) return true;
    const unhealthy = /* @__PURE__ */ new Set([
      "rateLimited",
      "serverError",
      "network",
      "unknown"
    ]);
    for (const endpoint of ["downloadUrl", "contentFallback"]) {
      const categories = this.runMetrics?.endpoints[endpoint]?.statusCategories;
      if (!categories) continue;
      for (const category of unhealthy) {
        if ((categories[category] ?? 0) > 0) return true;
      }
    }
    return false;
  }
  getStorageVaultName(vaultName) {
    return this.storageVaultNames.get(vaultName) ?? vaultName;
  }
  async resolveStorageVaultName(vaultName) {
    const legacyName = encodeURIComponent(vaultName);
    if (legacyName === vaultName) return vaultName;
    let children;
    try {
      const response = await this.request(
        "GET",
        "/me/drive/special/approot:/vaults:/children"
      );
      children = response.json.value ?? [];
    } catch (error) {
      if (error instanceof OneDriveError && error.type === "NotFound" /* NotFound */) {
        return vaultName;
      }
      throw error;
    }
    const names = new Set(children.filter((item) => item.folder).map((item) => item.name));
    const hasCanonical = names.has(vaultName);
    const hasLegacy = names.has(legacyName);
    if (!hasLegacy) return vaultName;
    if (!hasCanonical) {
      this.diag?.warn("onedrive", `using legacy encoded vault directory: ${legacyName}`);
      return legacyName;
    }
    const [canonicalHasContent, legacyHasContent] = await Promise.all([
      this.hasNonBootstrapContent(vaultName),
      this.hasNonBootstrapContent(legacyName)
    ]);
    if (!canonicalHasContent && legacyHasContent) {
      this.diag?.warn("onedrive", `using legacy encoded vault directory with existing content: ${legacyName}`);
      return legacyName;
    }
    if (canonicalHasContent && legacyHasContent) {
      throw new OneDriveError(
        "Conflict" /* Conflict */,
        `Both canonical and legacy vault directories contain sync content: ${vaultName}`,
        409
      );
    }
    return vaultName;
  }
  async hasNonBootstrapContent(storageVaultName) {
    const filesPath = APP_FOLDER_PATHS.filesDir(storageVaultName);
    const { configDir } = getEasySyncPaths(this.configDir, this.pluginId);
    const levels = [
      { path: filesPath, allowed: configDir },
      { path: `${filesPath}/${configDir}`, allowed: "plugins" },
      { path: `${filesPath}/${configDir}/plugins`, allowed: this.pluginId }
    ];
    for (const level of levels) {
      let children;
      try {
        const response = await this.request("GET", `${level.path}:/children`);
        children = response.json.value ?? [];
      } catch (error) {
        if (error instanceof OneDriveError && error.type === "NotFound" /* NotFound */) {
          return false;
        }
        throw error;
      }
      if (children.some((item) => item.name !== level.allowed)) return true;
      const next = children.find((item) => item.name === level.allowed);
      if (!next) return false;
      if (!next.folder) return true;
    }
    return false;
  }
  /**
   * Check if a vault directory already exists and is non-empty.
   * Returns true if the directory exists and contains files/subdirectories.
   */
  async vaultExists(vaultName) {
    try {
      const childrenPath = `${APP_FOLDER_PATHS.filesDir(this.getStorageVaultName(vaultName))}:/children`;
      const response = await this.request("GET", childrenPath);
      const data = response.json;
      return data.value.length > 0;
    } catch (e) {
      if (e instanceof OneDriveError && e.type === "NotFound" /* NotFound */) {
        return false;
      }
      throw e;
    }
  }
  // ---- File Operations ----
  /** Upload a file, using an upload session above 10 MiB.
   *
   *  @param eTag  When set, the upload includes an If-Match header. OneDrive
   *               rejects the request with 412 if the remote eTag has changed,
   *               preventing silent overwrite of another device's changes. */
  async uploadFile(vaultName, filePath, content, onProgress, eTag, driveItemId) {
    throwIfAborted(this.abortSignal);
    onProgress?.(0, content.byteLength);
    if (shouldUseUploadSession(content.byteLength)) {
      return this.uploadLargeFile(vaultName, filePath, content, onProgress, eTag, driveItemId);
    }
    const apiPath = driveItemId ? `/me/drive/items/${encodeURIComponent(driveItemId)}/content` : `${APP_FOLDER_PATHS.filePath(this.getStorageVaultName(vaultName), filePath)}:/content?@microsoft.graph.conflictBehavior=fail`;
    const headers = {};
    if (eTag) headers["If-Match"] = eTag;
    const response = await this.request(
      "PUT",
      apiPath,
      content,
      "application/octet-stream",
      void 0,
      { extraHeaders: headers }
    );
    onProgress?.(content.byteLength, content.byteLength);
    return response.json;
  }
  async uploadLargeFile(vaultName, filePath, content, onProgress, eTag, driveItemId) {
    throwIfAborted(this.abortSignal);
    const apiPath = driveItemId ? `/me/drive/items/${encodeURIComponent(driveItemId)}/createUploadSession` : `${APP_FOLDER_PATHS.filePath(this.getStorageVaultName(vaultName), filePath)}:/createUploadSession`;
    const extraHeaders = eTag ? { "If-Match": eTag } : void 0;
    const sessionResponse = await this.request(
      "POST",
      apiPath,
      {
        item: { "@microsoft.graph.conflictBehavior": driveItemId ? "replace" : "fail" }
      },
      void 0,
      void 0,
      { extraHeaders }
    );
    const uploadUrl = sessionResponse.json.uploadUrl;
    if (!uploadUrl) {
      throw new OneDriveError(
        "Unknown" /* Unknown */,
        `Upload session did not return an uploadUrl: ${filePath}`
      );
    }
    this.diag?.log(
      "onedrive",
      `large upload session \u2014 path=${filePath}, bytes=${content.byteLength}`
    );
    let range = { start: 0, endExclusive: content.byteLength };
    let observedBytesPerSecond = null;
    let recovering = false;
    let recoveriesForRange = 0;
    let reportedProgress = 0;
    try {
      while (range.start < content.byteLength) {
        throwIfAborted(this.abortSignal);
        const chunkSize = uploadSessionChunkSize(observedBytesPerSecond, recovering);
        const endExclusive = uploadRangeEndExclusive(range, chunkSize, content.byteLength);
        if (endExclusive <= range.start) {
          throw new OneDriveError(
            "Unknown" /* Unknown */,
            `Upload session returned an invalid missing range: ${filePath}`
          );
        }
        const end = endExclusive - 1;
        const chunk = content.slice(range.start, endExclusive);
        const timeoutMs = uploadSessionChunkTimeoutMs(chunk.byteLength, observedBytesPerSecond);
        const startedAt = Date.now();
        let response;
        try {
          response = await this.uploadChunk(
            uploadUrl,
            chunk,
            range.start,
            end,
            content.byteLength,
            timeoutMs
          );
        } catch (rawError) {
          if (isAbortError(rawError)) throw rawError;
          const error = rawError instanceof OneDriveError ? rawError : this.toRequestError(rawError, uploadUrl);
          if (isUncancellableRequestTimeout(error)) throw error;
          if (!isRecoverableUploadSessionError(error)) throw error;
          recoveriesForRange++;
          if (recoveriesForRange > MAX_UPLOAD_SESSION_RECOVERIES) throw error;
          range = await this.recoverUploadSessionRange(
            uploadUrl,
            content.byteLength,
            error
          );
          recovering = true;
          this.diag?.warn(
            "onedrive",
            `large upload resumed from session state \u2014 next=${range.start}, recovery=${recoveriesForRange}/${MAX_UPLOAD_SESSION_RECOVERIES}`
          );
          continue;
        }
        if (response.status === 200 || response.status === 201) {
          onProgress?.(content.byteLength, content.byteLength);
          return response.json;
        }
        if (response.status !== 202) {
          throw new OneDriveError(
            "Unknown" /* Unknown */,
            `Upload session returned unexpected status ${response.status}: ${filePath}`,
            response.status
          );
        }
        const nextRange = firstMissingUploadRange(
          response.json?.nextExpectedRanges,
          content.byteLength
        ) ?? await this.getUploadSessionRange(uploadUrl, content.byteLength);
        if (nextRange.start <= range.start) {
          throw new OneDriveError(
            "Unknown" /* Unknown */,
            `Upload session did not advance after an accepted fragment: ${filePath}`
          );
        }
        const elapsedMs = Math.max(1, Date.now() - startedAt);
        observedBytesPerSecond = chunk.byteLength / (elapsedMs / 1e3);
        range = nextRange;
        recovering = false;
        recoveriesForRange = 0;
        reportedProgress = Math.max(reportedProgress, Math.min(range.start, content.byteLength));
        this.diag?.log(
          "onedrive",
          `large upload progress \u2014 path=${filePath}, uploaded=${reportedProgress}/${content.byteLength}, chunkBytes=${chunk.byteLength}, timeoutMs=${timeoutMs}`
        );
        onProgress?.(reportedProgress, content.byteLength);
      }
      throw new OneDriveError(
        "Unknown" /* Unknown */,
        `Upload session ended without a completed driveItem: ${filePath}`
      );
    } catch (error) {
      if (!isUncancellableRequestTimeout(error)) {
        await this.cancelUploadSessionBestEffort(uploadUrl);
      }
      throw error;
    }
  }
  async uploadChunk(uploadUrl, chunk, start, end, total, timeoutMs) {
    let observedAttempt = 1;
    const fetchStartedAt = this.beginMetricAttempt("uploadSessionChunk");
    try {
      const response = await withAbortableTimeout(
        (signal) => uploadChunkFetch(uploadUrl, chunk, start, end, total, signal),
        timeoutMs,
        this.abortSignal
      );
      this.finishMetricAttempt(
        "uploadSessionChunk",
        "success",
        fetchStartedAt,
        chunk.byteLength
      );
      return response;
    } catch (fetchError) {
      this.finishMetricAttempt(
        "uploadSessionChunk",
        rawAttemptStatus(fetchError, this.abortSignal),
        fetchStartedAt
      );
      if (isAbortError(fetchError)) throw fetchError;
      if (!isFetchUnavailableError(fetchError)) {
        const classified = classifyUploadSessionUrlError(this.toRequestError(fetchError, uploadUrl));
        if (isRequestTimeoutError(fetchError)) {
          throw new OneDriveError(
            "NetworkError" /* NetworkError */,
            `Abortable upload chunk timed out after ${timeoutMs}ms`,
            classified.statusCode,
            classified.retryAfterSeconds,
            classified.graphCode
          );
        }
        throw classified;
      }
      this.diag?.log("onedrive", "upload chunk fetch unavailable, falling back to requestUrl");
    }
    throwIfAborted(this.abortSignal);
    observedAttempt++;
    const fallbackStartedAt = this.beginMetricAttempt("uploadSessionChunk");
    try {
      const response = await withTimeout(
        (0, import_obsidian3.requestUrl)({
          url: uploadUrl,
          method: "PUT",
          headers: {
            "Content-Range": `bytes ${start}-${end}/${total}`
          },
          body: chunk,
          contentType: "application/octet-stream"
        }),
        timeoutMs
      );
      this.finishMetricAttempt(
        "uploadSessionChunk",
        "success",
        fallbackStartedAt,
        chunk.byteLength,
        observedAttempt > 1 ? chunk.byteLength : 0
      );
      return response;
    } catch (rawError) {
      this.finishMetricAttempt(
        "uploadSessionChunk",
        rawAttemptStatus(rawError, this.abortSignal),
        fallbackStartedAt,
        0,
        observedAttempt > 1 ? chunk.byteLength : 0
      );
      this.diag?.warn(
        "onedrive",
        `large upload chunk failed \u2014 range=${start}-${end}, bytes=${chunk.byteLength}, hostError=${requestErrorMessage(rawError)}`
      );
      throw classifyUploadSessionUrlError(this.toRequestError(rawError, uploadUrl));
    }
  }
  async recoverUploadSessionRange(uploadUrl, totalBytes, cause) {
    for (let attempt = 1; attempt <= MAX_UPLOAD_SESSION_RECOVERIES; attempt++) {
      throwIfAborted(this.abortSignal);
      if (attempt > 1 || cause.type !== "RangeNotSatisfiable" /* RangeNotSatisfiable */) {
        await sleepWithAbort(retryDelayMs(cause, attempt), this.abortSignal);
      }
      try {
        return await this.getUploadSessionRange(uploadUrl, totalBytes);
      } catch (rawError) {
        if (isAbortError(rawError)) throw rawError;
        const error = rawError instanceof OneDriveError ? rawError : this.toRequestError(rawError, uploadUrl);
        if (isUncancellableRequestTimeout(error) || !isTransientRequestError(error) || attempt === MAX_UPLOAD_SESSION_RECOVERIES) {
          throw error;
        }
      }
    }
    throw cause;
  }
  async getUploadSessionRange(uploadUrl, totalBytes) {
    const response = await this.uploadSessionControlRequest(uploadUrl, "GET");
    const range = firstMissingUploadRange(
      response.json?.nextExpectedRanges,
      totalBytes
    );
    if (!range) {
      throw new OneDriveError(
        "Unknown" /* Unknown */,
        "Upload session status returned no valid missing range"
      );
    }
    return range;
  }
  async uploadSessionControlRequest(uploadUrl, method) {
    const endpoint = method === "GET" ? "uploadSessionStatus" : "uploadSessionCancel";
    const fetchStartedAt = this.beginMetricAttempt(endpoint);
    try {
      const response = await withAbortableTimeout(
        (signal) => uploadSessionControlFetch(uploadUrl, method, signal),
        UPLOAD_SESSION_CONTROL_TIMEOUT_MS,
        method === "GET" ? this.abortSignal : null
      );
      this.finishMetricAttempt(endpoint, "success", fetchStartedAt);
      return response;
    } catch (fetchError) {
      this.finishMetricAttempt(
        endpoint,
        rawAttemptStatus(fetchError, method === "GET" ? this.abortSignal : null),
        fetchStartedAt
      );
      if (isAbortError(fetchError)) throw fetchError;
      if (!isFetchUnavailableError(fetchError)) {
        throw classifyUploadSessionUrlError(this.toRequestError(fetchError, uploadUrl));
      }
    }
    const fallbackStartedAt = this.beginMetricAttempt(endpoint);
    try {
      const response = await withTimeout(
        (0, import_obsidian3.requestUrl)({ url: uploadUrl, method }),
        UPLOAD_SESSION_CONTROL_TIMEOUT_MS
      );
      this.finishMetricAttempt(endpoint, "success", fallbackStartedAt);
      return response;
    } catch (rawError) {
      this.finishMetricAttempt(
        endpoint,
        rawAttemptStatus(rawError, method === "GET" ? this.abortSignal : null),
        fallbackStartedAt
      );
      throw classifyUploadSessionUrlError(this.toRequestError(rawError, uploadUrl));
    }
  }
  async cancelUploadSessionBestEffort(uploadUrl) {
    try {
      await this.uploadSessionControlRequest(uploadUrl, "DELETE");
      this.diag?.log("onedrive", "upload session cancelled and temporary data cleanup requested");
    } catch (error) {
      const classified = error instanceof OneDriveError ? error : this.toRequestError(error, uploadUrl);
      if (classified.type !== "NotFound" /* NotFound */) {
        this.diag?.warn(
          "onedrive",
          `upload session cleanup failed \u2014 type=${classified.type}, status=${classified.statusCode}`
        );
      }
    }
  }
  /** Download file content as ArrayBuffer.
   *
   *  Download strategy (in priority order):
   *  1. Pre-signed downloadUrl (if provided) — bypasses /content 401 entirely
   *  2. Fetch fresh downloadUrl from item metadata, then download via that URL
   *  3. Path-based /content endpoint
   *  4. Item ID /content endpoint (last resort)
   *
   *  /content GET returns 401 even with Files.ReadWrite for App Folder files,
   *  so the downloadUrl path is the primary reliable method. */
  async downloadFile(vaultName, filePath, downloadUrl, driveItemId, fileSize = 0, onProgress) {
    throwIfAborted(this.abortSignal);
    let metadataAuthError = null;
    const primaryTimeoutMs = downloadTimeoutMs(fileSize);
    const failureReserveMs = Math.ceil(primaryTimeoutMs * DOWNLOAD_FAILURE_RESERVE_RATIO);
    const timeoutMs = primaryTimeoutMs + failureReserveMs;
    let deadlineMs = Date.now() + timeoutMs;
    const remainingMs = () => ensureDownloadBudget(deadlineMs, filePath);
    const fetchDownloadUrl = async (url, maxAttempts, onDlProgress) => {
      let observedAttempt = 0;
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        observedAttempt++;
        const fetchStartedAt = this.beginMetricAttempt("downloadUrl");
        try {
          const response = await withAbortableTimeout(
            (signal) => downloadUrlFetch(url, onDlProgress, signal),
            remainingMs(),
            this.abortSignal
          );
          const bytes = responsePayloadByteLength(response);
          this.finishMetricAttempt(
            "downloadUrl",
            "success",
            fetchStartedAt,
            bytes,
            observedAttempt > 1 ? bytes : 0
          );
          return response;
        } catch (error) {
          this.finishMetricAttempt(
            "downloadUrl",
            rawAttemptStatus(error, this.abortSignal),
            fetchStartedAt,
            0,
            0,
            transferredBytesFromError(error)
          );
          if (isAbortError(error)) throw error;
          let err = error;
          if (err instanceof TypeError || err.status === 0) {
            observedAttempt++;
            const fallbackStartedAt = this.beginMetricAttempt("downloadUrl");
            try {
              throwIfAborted(this.abortSignal);
              const response = await withTimeout(
                (0, import_obsidian3.requestUrl)({ url, method: "GET" }),
                remainingMs()
              );
              const bytes = responsePayloadByteLength(response);
              this.finishMetricAttempt(
                "downloadUrl",
                "success",
                fallbackStartedAt,
                bytes,
                observedAttempt > 1 ? bytes : 0
              );
              return response;
            } catch (fallbackErr) {
              this.finishMetricAttempt(
                "downloadUrl",
                rawAttemptStatus(fallbackErr, this.abortSignal),
                fallbackStartedAt
              );
              err = fallbackErr;
            }
          }
          if (isUncancellableRequestTimeout(err)) {
            throw downloadTimeoutError(filePath);
          }
          if (attempt === maxAttempts || !isTransientDownloadUrlError(err)) {
            throw err;
          }
          const remaining = remainingMs();
          if (remaining <= RETRY_BASE_MS) throw err;
          this.diag?.warn(
            "onedrive",
            `downloadFile "${filePath}" \u2014 CDN retry ${attempt + 1}/${maxAttempts}, remainingMs=${remaining}`,
            requestErrorMessage(err)
          );
          await sleep(RETRY_BASE_MS);
        }
      }
      throw new OneDriveError("NetworkError" /* NetworkError */, `Download failed for: ${filePath}`);
    };
    const contentRequestOptions = {
      deadlineMs,
      maxAttempts: 2,
      perRequestTimeoutMs: DOWNLOAD_MAX_TIMEOUT_MS
    };
    const metaRequestOptions = {
      deadlineMs,
      maxAttempts: 1,
      metadataReason: "downloadUrlRefresh"
    };
    this.diag?.log(
      "onedrive",
      `downloadFile "${filePath}" \u2014 size=${fileSize}, primaryMs=${primaryTimeoutMs}, reserveMs=${failureReserveMs}, budgetMs=${timeoutMs}, hint=${this.downloadMethod ?? "none"}`
    );
    onProgress?.(0, fileSize);
    if (this.downloadMethod === "content" && driveItemId) {
      const tier0StartMs = Date.now();
      try {
        const apiPath = `${APP_FOLDER_PATHS.filePath(this.getStorageVaultName(vaultName), filePath)}:/content`;
        const response = await this.contentGet(apiPath, contentRequestOptions, onProgress);
        const buf = response.arrayBuffer;
        onProgress?.(0, fileSize || buf.byteLength);
        onProgress?.(buf.byteLength, fileSize || buf.byteLength);
        return buf;
      } catch (err) {
        if (isUncancellableRequestTimeout(err)) throw downloadTimeoutError(filePath);
        if (isAuthExpired(err)) throw err;
        this.diag?.warn("onedrive", `downloadFile "${filePath}" \u2014 content shortcut failed, falling back to full waterfall`, { ...downloadErrorData(err), tierMs: Date.now() - tier0StartMs });
      }
    }
    if (downloadUrl && !this.cdnFailedThisRound) {
      const tier2StartMs = Date.now();
      try {
        const response = await fetchDownloadUrl(downloadUrl, 1, onProgress);
        this.downloadMethod = "downloadUrl";
        const buf = response.arrayBuffer;
        onProgress?.(buf.byteLength, fileSize || buf.byteLength);
        return buf;
      } catch (err) {
        this.diag?.warn("onedrive", `downloadFile "${filePath}" \u2014 downloadUrl failed, trying item metadata`, { ...downloadErrorData(err), tierMs: Date.now() - tier2StartMs });
        this.cdnFailedThisRound = true;
        remainingMs();
      }
    }
    if (driveItemId) {
      const tier3StartMs = Date.now();
      try {
        throwIfAborted(this.abortSignal);
        const metaResp = await this.request(
          "GET",
          `/me/drive/items/${driveItemId}?select=id,name,size,file,@microsoft.graph.downloadUrl`,
          void 0,
          void 0,
          void 0,
          metaRequestOptions
        );
        const meta = metaResp.json;
        if (meta["@microsoft.graph.downloadUrl"]) {
          const dlResp = await fetchDownloadUrl(
            meta["@microsoft.graph.downloadUrl"],
            downloadUrl ? 1 : 2,
            onProgress
          );
          this.downloadMethod = "downloadUrl";
          return dlResp.arrayBuffer;
        }
      } catch (err) {
        if (isAuthExpired(err)) {
          metadataAuthError = err;
        }
        this.diag?.warn("onedrive", `downloadFile "${filePath}" \u2014 item metadata downloadUrl failed, trying path /content`, { ...downloadErrorData(err), tierMs: Date.now() - tier3StartMs });
        this.cdnFailedThisRound = true;
        remainingMs();
      }
    }
    if (this.contentFailedThisRound) {
      this.diag?.log("onedrive", `downloadFile "${filePath}" \u2014 /content blocked this round, no fallback available`);
      throw new OneDriveError("NetworkError" /* NetworkError */, `Content endpoint unavailable for: ${filePath}`);
    }
    const tier4StartMs = Date.now();
    try {
      this.diag?.log(
        "onedrive",
        `downloadFile "${filePath}" \u2014 executing path /content fallback, remainingMs=${remainingMs()}`
      );
      const apiPath = `${APP_FOLDER_PATHS.filePath(this.getStorageVaultName(vaultName), filePath)}:/content`;
      const response = await this.contentGet(apiPath, contentRequestOptions, onProgress);
      this.downloadMethod = "content";
      return response.arrayBuffer;
    } catch (err) {
      if (isUncancellableRequestTimeout(err)) throw downloadTimeoutError(filePath);
      if (isAuthExpired(err)) {
        throw metadataAuthError ?? asFileDownloadUnauthorized(err, filePath);
      }
      this.diag?.warn("onedrive", `downloadFile "${filePath}" \u2014 path /content failed, trying item ID /content`, { ...downloadErrorData(err), tierMs: Date.now() - tier4StartMs });
      remainingMs();
    }
    if (driveItemId) {
      const tier5StartMs = Date.now();
      try {
        throwIfAborted(this.abortSignal);
        this.diag?.log(
          "onedrive",
          `downloadFile "${filePath}" \u2014 executing item ID /content fallback, remainingMs=${remainingMs()}`
        );
        const apiPath = `/me/drive/items/${driveItemId}/content`;
        const response = await this.contentGet(apiPath, contentRequestOptions, onProgress);
        this.downloadMethod = "content";
        return response.arrayBuffer;
      } catch (err) {
        if (isAuthExpired(err)) {
          throw metadataAuthError ?? asFileDownloadUnauthorized(err, filePath);
        }
        this.diag?.warn("onedrive", `downloadFile "${filePath}" \u2014 item ID /content failed, no remaining fallback`, { ...downloadErrorData(err), tierMs: Date.now() - tier5StartMs });
        this.contentFailedThisRound = true;
        throw err;
      }
    }
    this.contentFailedThisRound = true;
    throw new OneDriveError(
      "NotFound" /* NotFound */,
      `No download method available for: ${filePath}`
    );
  }
  /** Download directly to a local temp file.
   *
   *  Used by the sync executor on modern mobile runtimes to avoid holding
   *  large downloads entirely in memory before writing them to disk. */
  async downloadFileToPath(vaultName, filePath, localPath, adapter, downloadUrl, driveItemId, fileSize = 0, expectedSha256, onProgress) {
    throwIfAborted(this.abortSignal);
    let metadataAuthError = null;
    const primaryTimeoutMs = downloadTimeoutMs(fileSize);
    const failureReserveMs = Math.ceil(primaryTimeoutMs * DOWNLOAD_FAILURE_RESERVE_RATIO);
    const timeoutMs = primaryTimeoutMs + failureReserveMs;
    let deadlineMs = Date.now() + timeoutMs;
    const remainingMs = () => ensureDownloadBudget(deadlineMs, filePath);
    const writeDownloadUrl = async (url, maxAttempts, onDlProgress) => {
      let observedAttempt = 0;
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        observedAttempt++;
        const fetchStartedAt = this.beginMetricAttempt("downloadUrl");
        try {
          const result = await withAbortableTimeout(
            (signal) => downloadUrlFetchToBinaryFile(
              url,
              adapter,
              localPath,
              expectedSha256,
              onDlProgress,
              signal
            ),
            remainingMs(),
            this.abortSignal
          );
          this.finishMetricAttempt(
            "downloadUrl",
            "success",
            fetchStartedAt,
            result.size,
            observedAttempt > 1 ? result.size : 0
          );
          return result;
        } catch (error) {
          this.finishMetricAttempt(
            "downloadUrl",
            rawAttemptStatus(error, this.abortSignal),
            fetchStartedAt,
            0,
            0,
            transferredBytesFromError(error)
          );
          if (isAbortError(error)) throw error;
          let err = error;
          if (err instanceof TypeError || err.status === 0) {
            observedAttempt++;
            const fallbackStartedAt = this.beginMetricAttempt("downloadUrl");
            try {
              throwIfAborted(this.abortSignal);
              const response = await withTimeout(
                (0, import_obsidian3.requestUrl)({ url, method: "GET" }),
                remainingMs()
              );
              const result = await writeArrayBufferToBinaryFile(
                adapter,
                localPath,
                response.arrayBuffer,
                expectedSha256,
                fileSize,
                onDlProgress
              );
              this.finishMetricAttempt(
                "downloadUrl",
                "success",
                fallbackStartedAt,
                result.size,
                observedAttempt > 1 ? result.size : 0
              );
              return result;
            } catch (fallbackErr) {
              this.finishMetricAttempt(
                "downloadUrl",
                rawAttemptStatus(fallbackErr, this.abortSignal),
                fallbackStartedAt
              );
              err = fallbackErr;
            }
          }
          if (isUncancellableRequestTimeout(err)) {
            throw downloadTimeoutError(filePath);
          }
          if (attempt === maxAttempts || !isTransientDownloadUrlError(err)) {
            throw err;
          }
          const remaining = remainingMs();
          if (remaining <= RETRY_BASE_MS) throw err;
          this.diag?.warn(
            "onedrive",
            `downloadFileToPath "${filePath}" \u2014 CDN retry ${attempt + 1}/${maxAttempts}, remainingMs=${remaining}`,
            requestErrorMessage(err)
          );
          await sleep(RETRY_BASE_MS);
        }
      }
      throw new OneDriveError("NetworkError" /* NetworkError */, `Download failed for: ${filePath}`);
    };
    const contentRequestOptions = {
      deadlineMs,
      maxAttempts: 2,
      perRequestTimeoutMs: DOWNLOAD_MAX_TIMEOUT_MS
    };
    const metaRequestOptions = {
      deadlineMs,
      maxAttempts: 1,
      metadataReason: "downloadUrlRefresh"
    };
    this.diag?.log(
      "onedrive",
      `downloadFileToPath "${filePath}" \u2014 size=${fileSize}, primaryMs=${primaryTimeoutMs}, reserveMs=${failureReserveMs}, budgetMs=${timeoutMs}, hint=${this.downloadMethod ?? "none"}`
    );
    onProgress?.(0, fileSize);
    if (this.downloadMethod === "content" && driveItemId) {
      const tier0StartMs = Date.now();
      try {
        const apiPath = `${APP_FOLDER_PATHS.filePath(this.getStorageVaultName(vaultName), filePath)}:/content`;
        return await this.contentGetToPath(
          apiPath,
          adapter,
          localPath,
          expectedSha256,
          contentRequestOptions,
          onProgress
        );
      } catch (err) {
        if (isUncancellableRequestTimeout(err)) throw downloadTimeoutError(filePath);
        if (isAuthExpired(err)) throw err;
        this.diag?.warn("onedrive", `downloadFileToPath "${filePath}" \u2014 content shortcut failed, falling back to full waterfall`, { ...downloadErrorData(err), tierMs: Date.now() - tier0StartMs });
      }
    }
    if (downloadUrl && !this.cdnFailedThisRound) {
      const tier1StartMs = Date.now();
      try {
        const result = await writeDownloadUrl(downloadUrl, 1, onProgress);
        this.downloadMethod = "downloadUrl";
        return result;
      } catch (err) {
        this.diag?.warn("onedrive", `downloadFileToPath "${filePath}" \u2014 downloadUrl failed, trying item metadata`, { ...downloadErrorData(err), tierMs: Date.now() - tier1StartMs });
        this.cdnFailedThisRound = true;
        remainingMs();
      }
    }
    if (driveItemId) {
      const tier2StartMs = Date.now();
      try {
        throwIfAborted(this.abortSignal);
        const metaResp = await this.request(
          "GET",
          `/me/drive/items/${driveItemId}?select=id,name,size,file,@microsoft.graph.downloadUrl`,
          void 0,
          void 0,
          void 0,
          metaRequestOptions
        );
        const meta = metaResp.json;
        if (meta["@microsoft.graph.downloadUrl"]) {
          const result = await writeDownloadUrl(
            meta["@microsoft.graph.downloadUrl"],
            downloadUrl ? 1 : 2,
            onProgress
          );
          this.downloadMethod = "downloadUrl";
          return result;
        }
      } catch (err) {
        if (isAuthExpired(err)) {
          metadataAuthError = err;
        }
        this.diag?.warn("onedrive", `downloadFileToPath "${filePath}" \u2014 item metadata downloadUrl failed, trying path /content`, { ...downloadErrorData(err), tierMs: Date.now() - tier2StartMs });
        this.cdnFailedThisRound = true;
        remainingMs();
      }
    }
    if (this.contentFailedThisRound) {
      this.diag?.log("onedrive", `downloadFileToPath "${filePath}" \u2014 /content blocked this round, no fallback available`);
      throw new OneDriveError("NetworkError" /* NetworkError */, `Content endpoint unavailable for: ${filePath}`);
    }
    const tier3StartMs = Date.now();
    try {
      this.diag?.log(
        "onedrive",
        `downloadFileToPath "${filePath}" \u2014 executing path /content fallback, remainingMs=${remainingMs()}`
      );
      const apiPath = `${APP_FOLDER_PATHS.filePath(this.getStorageVaultName(vaultName), filePath)}:/content`;
      const result = await this.contentGetToPath(
        apiPath,
        adapter,
        localPath,
        expectedSha256,
        contentRequestOptions,
        onProgress
      );
      this.downloadMethod = "content";
      return result;
    } catch (err) {
      if (isUncancellableRequestTimeout(err)) throw downloadTimeoutError(filePath);
      if (isAuthExpired(err)) {
        throw metadataAuthError ?? asFileDownloadUnauthorized(err, filePath);
      }
      this.diag?.warn("onedrive", `downloadFileToPath "${filePath}" \u2014 path /content failed, trying item ID /content`, { ...downloadErrorData(err), tierMs: Date.now() - tier3StartMs });
      remainingMs();
    }
    if (driveItemId) {
      const tier4StartMs = Date.now();
      try {
        throwIfAborted(this.abortSignal);
        this.diag?.log(
          "onedrive",
          `downloadFileToPath "${filePath}" \u2014 executing item ID /content fallback, remainingMs=${remainingMs()}`
        );
        const apiPath = `/me/drive/items/${driveItemId}/content`;
        const result = await this.contentGetToPath(
          apiPath,
          adapter,
          localPath,
          expectedSha256,
          contentRequestOptions,
          onProgress
        );
        this.downloadMethod = "content";
        return result;
      } catch (err) {
        if (isAuthExpired(err)) {
          throw metadataAuthError ?? asFileDownloadUnauthorized(err, filePath);
        }
        this.diag?.warn("onedrive", `downloadFileToPath "${filePath}" \u2014 item ID /content failed, no remaining fallback`, { ...downloadErrorData(err), tierMs: Date.now() - tier4StartMs });
        this.contentFailedThisRound = true;
        throw err;
      }
    }
    this.contentFailedThisRound = true;
    throw new OneDriveError(
      "NotFound" /* NotFound */,
      `No download method available for: ${filePath}`
    );
  }
  /** Delete a file or folder.
   *  @param eTag  When set, the DELETE includes an If-Match header. If the
   *               file has been modified remotely since the plan was generated,
   *               the server returns 412 and the caller routes to conflict. */
  async deleteItem(vaultName, itemPath, eTag, driveItemId) {
    const apiPath = driveItemId ? `/me/drive/items/${encodeURIComponent(driveItemId)}` : APP_FOLDER_PATHS.filePath(this.getStorageVaultName(vaultName), itemPath);
    await this.request("DELETE", apiPath, void 0, void 0, void 0, void 0, eTag);
  }
  /** Rename a file on OneDrive without re-uploading content.
   *
   *  Uses the reviewed driveItem identity and If-Match version.
   *  OneDrive handles the rename server-side — no content transfer.
   *
   *  Returns the updated DriveItem so callers can grab the new eTag. */
  async renameItem(_vaultName, _oldPath, newPath, driveItemId, eTag) {
    const apiPath = `/me/drive/items/${encodeURIComponent(driveItemId)}`;
    const newName = newPath.split("/").pop() || newPath;
    const response = await this.request("PATCH", apiPath, { name: newName }, void 0, void 0, void 0, eTag);
    return response.json;
  }
  /** Move/rename a known driveItem using reviewed identity + version. */
  async moveItemById(driveItemId, eTag, newName, newParentId) {
    const response = await this.request(
      "PATCH",
      `/me/drive/items/${encodeURIComponent(driveItemId)}`,
      { name: newName, parentReference: { id: newParentId } },
      void 0,
      void 0,
      void 0,
      eTag
    );
    return response.json;
  }
  /** Fetch current metadata for a single file — used when an If-Match upload
   *  fails with 412 to get fresh remote info for conflict creation. */
  async getFileMetadata(vaultName, filePath, metadataReason = "other") {
    try {
      const apiPath = APP_FOLDER_PATHS.filePath(this.getStorageVaultName(vaultName), filePath);
      const response = await this.request(
        "GET",
        apiPath,
        void 0,
        void 0,
        void 0,
        { metadataReason, expectedNotFound: true }
      );
      const item = response.json;
      if (!item.file) return null;
      return {
        eTag: item.eTag ?? "",
        size: item.size ?? 0,
        sha256Hash: item.file?.hashes?.sha256Hash?.toLowerCase(),
        downloadUrl: item["@microsoft.graph.downloadUrl"],
        driveId: item.id,
        parentId: item.parentReference?.id,
        mtime: item.lastModifiedDateTime ? new Date(item.lastModifiedDateTime).getTime() : 0
      };
    } catch (e) {
      if (e instanceof OneDriveError && e.type === "NotFound" /* NotFound */) {
        return null;
      }
      throw e;
    }
  }
  // ---- Cloud Baseline ----
  /** Download the cloud baseline snapshot from .easy-sync/baseline.json.
   *  Returns null if the file doesn't exist (NotFound → first sync on a fresh vault). */
  async downloadBaseline(vaultName) {
    const storageVaultName = this.getStorageVaultName(vaultName);
    try {
      const childrenResp = await this.request(
        "GET",
        `${APP_FOLDER_PATHS.pluginDir(storageVaultName)}:/children`
      );
      const children = childrenResp.json.value ?? [];
      const baseline = children.find((item) => item.name === "baseline.json" && item.file);
      if (!baseline) {
        return null;
      }
      if (baseline["@microsoft.graph.downloadUrl"]) {
        try {
          const downloadResp = await withTimeout(
            (0, import_obsidian3.requestUrl)({
              url: baseline["@microsoft.graph.downloadUrl"],
              method: "GET"
            }),
            8e3
          );
          this.diag?.log("onedrive", "cloud baseline downloaded via plugin-dir children downloadUrl");
          return responseToText(downloadResp);
        } catch (error) {
          rethrowUncancellableRequestTimeout(error);
        }
      }
      if (baseline.id) {
        try {
          const metaResp = await this.request(
            "GET",
            `/me/drive/items/${baseline.id}?select=id,name,size,file,@microsoft.graph.downloadUrl`
          );
          const meta = metaResp.json;
          if (meta["@microsoft.graph.downloadUrl"]) {
            const downloadResp = await withTimeout(
              (0, import_obsidian3.requestUrl)({
                url: meta["@microsoft.graph.downloadUrl"],
                method: "GET"
              }),
              8e3
            );
            this.diag?.log("onedrive", "cloud baseline downloaded via item metadata downloadUrl fallback");
            return responseToText(downloadResp);
          }
        } catch (error) {
          rethrowUncancellableRequestTimeout(error);
        }
      }
      if (!baseline.id) {
        return null;
      }
      const response = await this.request(
        "GET",
        `/me/drive/items/${baseline.id}/content`,
        void 0,
        void 0,
        "json"
      );
      this.diag?.log("onedrive", "cloud baseline downloaded via direct item /content fallback");
      return responseToText(response);
    } catch (e) {
      if (e instanceof OneDriveError && e.type === "NotFound" /* NotFound */) {
        return null;
      }
      throw e;
    }
  }
  // ---- Cloud Bootstrap V2 ----
  async readCloudBootstrapV2(vaultName) {
    const storageVaultName = this.getStorageVaultName(vaultName);
    const childrenResp = await this.request(
      "GET",
      `${APP_FOLDER_PATHS.pluginDir(storageVaultName)}:/children`
    );
    const children = childrenResp.json.value ?? [];
    const item = children.find((entry) => entry.name === "bootstrap-v2.json" && entry.file);
    if (!item) return null;
    return this.readCloudBootstrapItemV2(item);
  }
  async readCloudBootstrapV2ById(id) {
    const metaResp = await this.request(
      "GET",
      `/me/drive/items/${encodeURIComponent(id)}?select=id,name,eTag,file,@microsoft.graph.downloadUrl`
    );
    return this.readCloudBootstrapItemV2(metaResp.json);
  }
  async createCloudBootstrapV2(vaultName, content) {
    const apiPath = `${APP_FOLDER_PATHS.pluginDir(this.getStorageVaultName(vaultName))}/bootstrap-v2.json:/content?@microsoft.graph.conflictBehavior=fail`;
    const response = await this.request("PUT", apiPath, content, "application/json");
    return requireCloudBootstrapVersion(response.json);
  }
  async updateCloudBootstrapV2(id, eTag, content) {
    const response = await this.request(
      "PUT",
      `/me/drive/items/${encodeURIComponent(id)}/content`,
      content,
      "application/json",
      void 0,
      {},
      eTag
    );
    return requireCloudBootstrapVersion(response.json);
  }
  async readCloudBootstrapItemV2(initial) {
    if (!initial.id) throw new Error("CloudBootstrapV2 item has no driveItem id");
    let item = initial;
    if (!item.eTag || !item["@microsoft.graph.downloadUrl"]) {
      const metaResp = await this.request(
        "GET",
        `/me/drive/items/${encodeURIComponent(item.id)}?select=id,name,eTag,file,@microsoft.graph.downloadUrl`
      );
      item = metaResp.json;
    }
    if (!item.eTag) throw new Error("CloudBootstrapV2 item has no eTag");
    if (item["@microsoft.graph.downloadUrl"]) {
      try {
        const response2 = await withTimeout((0, import_obsidian3.requestUrl)({
          url: item["@microsoft.graph.downloadUrl"],
          method: "GET"
        }), 8e3);
        return { id: item.id, eTag: item.eTag, content: responseToText(response2) };
      } catch (error) {
        rethrowUncancellableRequestTimeout(error);
      }
    }
    const response = await this.request(
      "GET",
      `/me/drive/items/${encodeURIComponent(item.id)}/content`,
      void 0,
      void 0,
      "json"
    );
    return { id: item.id, eTag: item.eTag, content: responseToText(response) };
  }
  // ---- Directory Listing ----
  /** List all items in the files directory (recursive). */
  async listFiles(vaultName) {
    const rootPath = APP_FOLDER_PATHS.filesDir(this.getStorageVaultName(vaultName));
    return this.listRecursive(rootPath);
  }
  /** Recursively list all files in a directory and its subdirectories. */
  async listRecursive(dirPath) {
    const apiPath = `${dirPath}:/children`;
    const result = [];
    let url = apiPath;
    while (url) {
      const response = await this.request("GET", url);
      const data = response.json;
      for (const item of data.value) {
        result.push(item);
        if (item.folder) {
          const subPath = `${dirPath}/${encodeURIComponent(item.name)}`;
          const children = await this.listRecursive(subPath);
          result.push(...children);
        }
      }
      url = data["@odata.nextLink"] || null;
    }
    return result;
  }
  // ---- Delta / Change Tracking ----
  /**
   * Query delta for the files directory.
   * Pass a deltaToken to get changes since that token.
   * Returns the delta response with changed items and new deltaToken.
   * Handles pagination via @odata.nextLink.
   */
  async getDelta(vaultName, deltaToken) {
    let url;
    if (deltaToken) {
      url = deltaToken;
    } else {
      url = APP_FOLDER_PATHS.filesDelta(this.getStorageVaultName(vaultName));
    }
    const allValues = [];
    let deltaLink;
    let nextLink;
    while (url) {
      const response = await this.request("GET", url);
      const data = response.json;
      allValues.push(...data.value);
      deltaLink = data["@odata.deltaLink"];
      nextLink = data["@odata.nextLink"];
      url = nextLink || "";
    }
    return {
      value: allValues,
      "@odata.deltaLink": deltaLink
    };
  }
  /**
   * Full scan fallback when delta is unavailable.
   * Returns files and folders so callers can rebuild paths from identities.
   */
  async fullScan(vaultName) {
    return this.listFiles(vaultName);
  }
  // ---- Request Helper ----
  /** GET a /content endpoint using native fetch (primary) with requestUrl
   *  fallback.  fetch strips the Authorization header on cross-origin
   *  redirects (graph.microsoft.com → sharepoint.com) which avoids the
   *  401 that requestUrl triggers by forwarding the Bearer token to
   *  SharePoint's already-authenticated download.aspx. */
  async contentGet(apiPath, options, onProgress) {
    throwIfAborted(this.abortSignal);
    const token = await this.acquireToken();
    const url = apiPath.startsWith("https://") ? apiPath : `${GRAPH_BASE_URL}${apiPath}`;
    const fetchStartedAt = this.beginMetricAttempt("contentFallback");
    try {
      const timeoutMs = requestTimeoutWithCap(options.deadlineMs, options.perRequestTimeoutMs ?? DOWNLOAD_MAX_TIMEOUT_MS);
      this.diag?.log("onedrive", `contentGet \u2014 trying fetch, timeoutMs=${timeoutMs}, url=${sanitizeUrl(url)}`);
      const response = await withAbortableTimeout(
        (signal) => contentUrlFetch(url, token, onProgress, signal),
        timeoutMs,
        this.abortSignal
      );
      this.finishMetricAttempt(
        "contentFallback",
        "success",
        fetchStartedAt,
        responsePayloadByteLength(response)
      );
      return response;
    } catch (fetchErr) {
      this.finishMetricAttempt(
        "contentFallback",
        rawAttemptStatus(fetchErr, this.abortSignal),
        fetchStartedAt,
        0,
        0,
        transferredBytesFromError(fetchErr)
      );
      if (isAbortError(fetchErr)) throw fetchErr;
      this.diag?.log("onedrive", `content fetch failed, falling back to requestUrl: ${requestErrorMessage(fetchErr)}`);
    }
    return this.request(
      "GET",
      apiPath,
      void 0,
      void 0,
      "arraybuffer",
      { ...options, observationAttemptOffset: 1 }
    );
  }
  async contentGetToPath(apiPath, adapter, localPath, expectedSha256, options, onProgress) {
    throwIfAborted(this.abortSignal);
    const token = await this.acquireToken();
    const url = apiPath.startsWith("https://") ? apiPath : `${GRAPH_BASE_URL}${apiPath}`;
    const fetchStartedAt = this.beginMetricAttempt("contentFallback");
    try {
      const timeoutMs = requestTimeoutWithCap(options.deadlineMs, options.perRequestTimeoutMs ?? DOWNLOAD_MAX_TIMEOUT_MS);
      this.diag?.log("onedrive", `contentGetToPath \u2014 trying fetch stream, timeoutMs=${timeoutMs}, url=${sanitizeUrl(url)}`);
      const result = await withAbortableTimeout(
        (signal) => contentUrlFetchToBinaryFile(
          url,
          token,
          adapter,
          localPath,
          expectedSha256,
          onProgress,
          signal
        ),
        timeoutMs,
        this.abortSignal
      );
      this.finishMetricAttempt(
        "contentFallback",
        "success",
        fetchStartedAt,
        result.size
      );
      return result;
    } catch (fetchErr) {
      this.finishMetricAttempt(
        "contentFallback",
        rawAttemptStatus(fetchErr, this.abortSignal),
        fetchStartedAt,
        0,
        0,
        transferredBytesFromError(fetchErr)
      );
      if (isAbortError(fetchErr)) throw fetchErr;
      this.diag?.log("onedrive", `content stream fetch failed, falling back to requestUrl: ${requestErrorMessage(fetchErr)}`);
    }
    const response = await this.request(
      "GET",
      apiPath,
      void 0,
      void 0,
      "arraybuffer",
      { ...options, observationAttemptOffset: 1 }
    );
    return writeArrayBufferToBinaryFile(
      adapter,
      localPath,
      response.arrayBuffer,
      expectedSha256,
      0,
      onProgress
    );
  }
  async request(method, apiPath, body, contentType, responseType, options = {}, ifMatch) {
    throwIfAborted(this.abortSignal);
    const token = await this.acquireToken();
    const url = apiPath.startsWith("https://") ? apiPath : `${GRAPH_BASE_URL}${apiPath}`;
    const headers = {
      Authorization: `Bearer ${token}`
    };
    if (ifMatch) headers["If-Match"] = ifMatch;
    let requestBody;
    if (body !== void 0) {
      if (contentType) {
        headers["Content-Type"] = contentType;
      } else {
        headers["Content-Type"] = "application/json";
      }
      requestBody = body instanceof ArrayBuffer ? body : typeof body === "string" ? body : JSON.stringify(body);
    }
    if (options.extraHeaders) {
      Object.assign(headers, options.extraHeaders);
    }
    const maxAttempts = options.maxAttempts ?? MAX_REQUEST_ATTEMPTS;
    const endpoint = classifyRequestEndpoint(method, apiPath);
    const requestBytes = endpoint === "simpleUpload" ? requestPayloadByteLength(requestBody) : 0;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      throwIfAborted(this.abortSignal);
      const attemptStartedAt = this.beginMetricAttempt(endpoint);
      try {
        const timeoutMs = options.perRequestTimeoutMs ? requestTimeoutWithCap(options.deadlineMs, options.perRequestTimeoutMs) : requestTimeoutMs(options.deadlineMs);
        const response = await withTimeout(
          (0, import_obsidian3.requestUrl)({
            url,
            method,
            headers,
            body: requestBody,
            contentType
          }),
          timeoutMs
        );
        const effectiveBytes = endpoint === "simpleUpload" ? requestBytes : endpoint === "contentFallback" ? responsePayloadByteLength(response) : 0;
        const observedAttempt = attempt + (options.observationAttemptOffset ?? 0);
        this.finishMetricAttempt(
          endpoint,
          "success",
          attemptStartedAt,
          effectiveBytes,
          observedAttempt > 1 ? effectiveBytes : 0,
          0,
          options.metadataReason ?? (endpoint === "metadata" ? "other" : void 0)
        );
        return response;
      } catch (rawError) {
        const error = this.toRequestError(rawError, url, options.expectedNotFound === true);
        const expectedNotFound = options.expectedNotFound === true && error.type === "NotFound" /* NotFound */;
        const observedAttempt = attempt + (options.observationAttemptOffset ?? 0);
        this.finishMetricAttempt(
          endpoint,
          requestAttemptStatus(error, this.abortSignal),
          attemptStartedAt,
          0,
          observedAttempt > 1 ? requestBytes : 0,
          0,
          options.metadataReason ?? (endpoint === "metadata" ? "other" : void 0),
          expectedNotFound
        );
        if (isRequestTimeoutError(rawError) || method !== "GET" && method !== "HEAD" && rawStatusCode(rawError) === 0) {
          this.diag?.warn(
            "onedrive",
            `request outcome unclear \u2014 not retrying method=${method}, endpoint=${endpoint}`
          );
          throw error;
        }
        if (error.type === "NotFound" /* NotFound */) {
          this.initializedVaults.clear();
          this.storageVaultNames.clear();
          this.vaultScopes.clear();
        }
        if (expectedNotFound) throw error;
        if (method === "DELETE" && attempt > 1 && error.type === "NotFound" /* NotFound */) {
          this.diag?.log("onedrive", `DELETE retry confirmed item already absent \u2014 url=${url.substring(0, 120)}`);
          return { status: 204, headers: {}, json: {} };
        }
        if (!isTransientRequestError(error) || attempt === maxAttempts) {
          if (!(method === "PUT" && error.type === "Conflict" /* Conflict */)) {
            this.diag?.warn(
              "onedrive",
              `request failed \u2014 attempt=${attempt}/${maxAttempts}, type=${error.type}, url=${url.substring(0, 120)}`
            );
          }
          throw error;
        }
        const waitMs = retryDelayMs(error, attempt);
        this.diag?.warn(
          "onedrive",
          `request retry \u2014 attempt=${attempt}/${maxAttempts}, type=${error.type}, waitMs=${waitMs}, url=${url.substring(0, 120)}`
        );
        if (options.deadlineMs && Date.now() + waitMs >= options.deadlineMs) {
          throw error;
        }
        await sleep(waitMs);
      }
    }
    throw new OneDriveError("Unknown" /* Unknown */, `Request failed: ${url}`);
  }
  toRequestError(rawError, url, suppressExpectedNotFoundWarning = false) {
    const errAny = isRecord(rawError) ? rawError : {};
    const errStatus = typeof errAny.status === "number" ? errAny.status : 0;
    const errHeaders = isStringRecord(errAny.headers) ? errAny.headers : {};
    let graphBody;
    if (isRecord(errAny.json)) {
      graphBody = errAny.json;
    } else if (errAny.text && typeof errAny.text === "string") {
      try {
        const parsed = JSON.parse(errAny.text);
        if (isRecord(parsed)) graphBody = parsed;
      } catch {
      }
    }
    const graphErr = graphBody?.error;
    if (errStatus === 409) {
      this.diag?.log("onedrive", `requestUrl 409 \u2014 ${sanitizeUrl(url)}`);
    } else if (!(suppressExpectedNotFoundWarning && errStatus === 404)) {
      this.diag?.warn("onedrive", `requestUrl error \u2014 status=${errStatus}, graphCode=${graphErr?.code || "none"}, graphMsg=${graphErr?.message || "none"}, url=${sanitizeUrl(url)}`);
    }
    if (errStatus) {
      return this.classifyError({
        status: errStatus,
        headers: errHeaders,
        json: graphBody
      });
    }
    const errMsg = rawError instanceof Error ? rawError.message : String(rawError);
    return new OneDriveError(
      "NetworkError" /* NetworkError */,
      `Network error: ${errMsg}`
    );
  }
  /** Classify an HTTP error response into OneDriveErrorType */
  classifyError(response) {
    const status = response.status;
    const retryAfter = parseRetryAfter(response.headers);
    const graphError = tryParseGraphError(response);
    const message = graphError ? `${graphError.code}: ${graphError.message}` : `HTTP ${status}`;
    switch (status) {
      case 401:
        return new OneDriveError(
          "AuthExpired" /* AuthExpired */,
          message,
          status,
          retryAfter,
          graphError?.code ?? null
        );
      case 403:
        return new OneDriveError(
          "Forbidden" /* Forbidden */,
          message,
          status,
          retryAfter,
          graphError?.code ?? null
        );
      case 404:
        return new OneDriveError(
          "NotFound" /* NotFound */,
          message,
          status,
          retryAfter,
          graphError?.code ?? null
        );
      case 409:
        return new OneDriveError(
          "Conflict" /* Conflict */,
          message,
          status,
          retryAfter,
          graphError?.code ?? null
        );
      case 412:
        return new OneDriveError(
          "PreconditionFailed" /* PreconditionFailed */,
          message,
          status,
          retryAfter,
          graphError?.code ?? null
        );
      case 416:
        return new OneDriveError(
          "RangeNotSatisfiable" /* RangeNotSatisfiable */,
          message,
          status,
          retryAfter,
          graphError?.code ?? null
        );
      case 429:
        return new OneDriveError(
          "RateLimited" /* RateLimited */,
          message,
          status,
          retryAfter,
          graphError?.code ?? null
        );
      case 507:
        return new OneDriveError(
          "InsufficientStorage" /* InsufficientStorage */,
          message,
          status,
          retryAfter,
          graphError?.code ?? null
        );
      case 500:
      case 502:
      case 503:
      case 504:
        return new OneDriveError(
          "ServerError" /* ServerError */,
          message,
          status,
          retryAfter,
          graphError?.code ?? null
        );
      default:
        return new OneDriveError(
          "Unknown" /* Unknown */,
          message,
          status,
          retryAfter,
          graphError?.code ?? null
        );
    }
  }
};
function isAuthExpired(error) {
  return error instanceof OneDriveError && error.type === "AuthExpired" /* AuthExpired */;
}
function createEndpointRunMetrics() {
  return {
    attempts: 0,
    succeeded: 0,
    failed: 0,
    cancelled: 0,
    elapsedMs: 0,
    effectiveBytes: 0,
    failedBytes: 0,
    retriedBytes: 0,
    peakConcurrency: 0,
    statusCategories: {},
    activeConcurrency: 0
  };
}
function createMetadataReasonRunMetrics() {
  return {
    attempts: 0,
    succeeded: 0,
    failed: 0,
    cancelled: 0,
    elapsedMs: 0
  };
}
function classifyRequestEndpoint(method, apiPath) {
  const normalizedMethod = method.toUpperCase();
  const path = apiPath.toLowerCase();
  if (path.includes("/delta")) return "delta";
  if (path.includes("createuploadsession")) return "uploadSessionCreate";
  if (path.includes("/content")) {
    return normalizedMethod === "PUT" ? "simpleUpload" : "contentFallback";
  }
  return "metadata";
}
function requestPayloadByteLength(body) {
  if (body instanceof ArrayBuffer) return body.byteLength;
  return typeof body === "string" ? new TextEncoder().encode(body).byteLength : 0;
}
function responsePayloadByteLength(response) {
  return response.arrayBuffer instanceof ArrayBuffer ? response.arrayBuffer.byteLength : 0;
}
function requestAttemptStatus(error, signal) {
  if (signal?.aborted || isAbortError(error)) return "cancelled";
  switch (error.type) {
    case "AuthExpired" /* AuthExpired */:
    case "Unauthorized" /* Unauthorized */:
      return "auth";
    case "Forbidden" /* Forbidden */:
      return "forbidden";
    case "NotFound" /* NotFound */:
      return "notFound";
    case "Conflict" /* Conflict */:
      return "conflict";
    case "PreconditionFailed" /* PreconditionFailed */:
      return "precondition";
    case "RangeNotSatisfiable" /* RangeNotSatisfiable */:
      return "rangeNotSatisfiable";
    case "RateLimited" /* RateLimited */:
      return "rateLimited";
    case "InsufficientStorage" /* InsufficientStorage */:
      return "insufficientStorage";
    case "ServerError" /* ServerError */:
      return "serverError";
    case "NetworkError" /* NetworkError */:
      return "network";
    default:
      return "unknown";
  }
}
function rawAttemptStatus(error, signal) {
  if (signal?.aborted || isAbortError(error)) return "cancelled";
  if (error instanceof OneDriveError) return requestAttemptStatus(error, signal);
  const status = isRecord(error) && typeof error.status === "number" ? error.status : 0;
  if (status === 401) return "auth";
  if (status === 403) return "forbidden";
  if (status === 404) return "notFound";
  if (status === 409) return "conflict";
  if (status === 412) return "precondition";
  if (status === 416) return "rangeNotSatisfiable";
  if (status === 429) return "rateLimited";
  if (status === 507) return "insufficientStorage";
  if ([500, 502, 503, 504].includes(status)) return "serverError";
  if (status === 0 || error instanceof TypeError) return "network";
  return "unknown";
}
function asFileDownloadUnauthorized(error, filePath) {
  return new OneDriveError(
    "Unauthorized" /* Unauthorized */,
    `File content download rejected for: ${filePath}`,
    error.statusCode,
    error.retryAfterSeconds,
    error.graphCode
  );
}
function downloadTimeoutMs(fileSize) {
  const sizeMiB = Math.ceil(Math.max(0, fileSize) / (1024 * 1024));
  return Math.min(
    DOWNLOAD_MAX_TIMEOUT_MS,
    DOWNLOAD_BASE_TIMEOUT_MS + sizeMiB * DOWNLOAD_PER_MIB_TIMEOUT_MS
  );
}
function ensureDownloadBudget(deadlineMs, filePath) {
  const remaining = deadlineMs - Date.now();
  if (remaining <= 0) {
    throw new OneDriveError(
      "NetworkError" /* NetworkError */,
      `Download timed out for: ${filePath}`
    );
  }
  return remaining;
}
function downloadTimeoutError(filePath) {
  return new OneDriveError(
    "NetworkError" /* NetworkError */,
    `Download timed out for: ${filePath}`
  );
}
function isRequestTimeoutError(error) {
  return error instanceof Error && error.message.startsWith("Request timed out after ");
}
function rethrowUncancellableRequestTimeout(error) {
  if (isRequestTimeoutError(error)) {
    throw new OneDriveError("NetworkError" /* NetworkError */, requestErrorMessage(error));
  }
}
function rawStatusCode(error) {
  return isRecord(error) && typeof error.status === "number" ? error.status : 0;
}
function isUncancellableRequestTimeout(error) {
  return isRequestTimeoutError(error) || error instanceof OneDriveError && error.message.includes("Request timed out after ");
}
function isTransientDownloadUrlError(error) {
  const status = error?.status;
  if (typeof status !== "number" || status === 0) return false;
  return status === 408 || status === 429 || status >= 500;
}
function requestTimeoutMs(deadlineMs) {
  if (!deadlineMs) return REQUEST_TIMEOUT_MS;
  const remaining = deadlineMs - Date.now();
  if (remaining <= 0) {
    throw new OneDriveError(
      "NetworkError" /* NetworkError */,
      "Request deadline exceeded"
    );
  }
  return Math.min(REQUEST_TIMEOUT_MS, remaining);
}
function requestTimeoutWithCap(deadlineMs, cap) {
  if (!deadlineMs) return cap;
  const remaining = deadlineMs - Date.now();
  if (remaining <= 0) {
    throw new OneDriveError(
      "NetworkError" /* NetworkError */,
      "Request deadline exceeded"
    );
  }
  return Math.min(cap, remaining);
}
function parseRetryAfter(headers) {
  const value = headers["retry-after"];
  if (!value) return null;
  const seconds = parseInt(value, 10);
  return isNaN(seconds) ? null : seconds;
}
function tryParseGraphError(response) {
  try {
    const json = response.json;
    if (json?.error && typeof json.error === "object") {
      const err = json.error;
      return {
        code: String(err.code || "unknown"),
        message: String(err.message || "no message")
      };
    }
  } catch {
  }
  return null;
}
function sanitizeUrl(url) {
  try {
    const u = new URL(url);
    return `${u.origin}${u.pathname}`;
  } catch {
    const q = url.indexOf("?");
    return q >= 0 ? url.substring(0, q) : url;
  }
}
function withTimeout(promise, ms) {
  return new Promise((resolve, reject) => {
    const timer = compatSetTimeout(
      () => reject(new Error(`Request timed out after ${ms}ms`)),
      ms
    );
    promise.then(
      (value) => {
        compatClearTimeout(timer);
        resolve(value);
      },
      (error) => {
        compatClearTimeout(timer);
        reject(toErrorLike(error));
      }
    );
  });
}
function withAbortableTimeout(run, ms, outerSignal) {
  return new Promise((resolve, reject) => {
    const controller = new AbortController();
    let timedOut = false;
    const onAbort = () => controller.abort();
    if (outerSignal) {
      if (outerSignal.aborted) {
        controller.abort();
      } else {
        outerSignal.addEventListener("abort", onAbort, { once: true });
      }
    }
    const timer = compatSetTimeout(() => {
      timedOut = true;
      controller.abort();
    }, ms);
    run(controller.signal).then(
      (value) => {
        compatClearTimeout(timer);
        outerSignal?.removeEventListener("abort", onAbort);
        resolve(value);
      },
      (error) => {
        compatClearTimeout(timer);
        outerSignal?.removeEventListener("abort", onAbort);
        if (timedOut && isAbortError(error)) {
          reject(new Error(`Request timed out after ${ms}ms`));
          return;
        }
        reject(toErrorLike(error));
      }
    );
  });
}
function browserFetch(input, init) {
  const currentWindow = typeof window !== "undefined" ? window.activeWindow ?? window : null;
  if (currentWindow && typeof currentWindow.fetch === "function") {
    return currentWindow.fetch(input, init);
  }
  throw new TypeError("fetch unavailable");
}
function toErrorLike(error) {
  if (error instanceof Error) return error;
  const wrapped = new Error(String(error));
  if (isRecord(error)) Object.assign(wrapped, error);
  return wrapped;
}
function isTransientRequestError(error) {
  return error.type === "NetworkError" /* NetworkError */ || error.type === "RateLimited" /* RateLimited */ || error.type === "ServerError" /* ServerError */;
}
function isRecoverableUploadSessionError(error) {
  return error.type === "NetworkError" /* NetworkError */ || error.type === "RateLimited" /* RateLimited */ || error.type === "ServerError" /* ServerError */ || error.type === "RangeNotSatisfiable" /* RangeNotSatisfiable */;
}
function classifyUploadSessionUrlError(error) {
  if (error.type !== "AuthExpired" /* AuthExpired */) return error;
  return new OneDriveError(
    "Unauthorized" /* Unauthorized */,
    error.message,
    error.statusCode,
    error.retryAfterSeconds,
    error.graphCode
  );
}
function isFetchUnavailableError(error) {
  return error instanceof TypeError && error.message === "fetch unavailable";
}
function retryDelayMs(error, attempt) {
  const base = error.type === "RateLimited" /* RateLimited */ && error.retryAfterSeconds !== null ? error.retryAfterSeconds * 1e3 : RETRY_BASE_MS * 2 ** (attempt - 1);
  return base + Math.floor(Math.random() * RETRY_JITTER_MS);
}
function requestErrorMessage(rawError) {
  const message = rawError instanceof Error ? rawError.message : String(rawError);
  return message.replace(/https?:\/\/\S+/g, "[redacted-url]");
}
function requireCloudBootstrapVersion(value) {
  if (!value || typeof value !== "object") throw new Error("CloudBootstrapV2 write returned no metadata");
  const item = value;
  if (!item.id || !item.eTag) throw new Error("CloudBootstrapV2 write returned no id/eTag");
  return { id: item.id, eTag: item.eTag };
}
async function safeRemove(adapter, path) {
  try {
    await adapter.remove(path);
  } catch {
  }
}
function exactArrayBuffer(chunk) {
  return chunk.slice().buffer;
}
var StreamingSha256 = class _StreamingSha256 {
  constructor() {
    this.h0 = 1779033703;
    this.h1 = 3144134277;
    this.h2 = 1013904242;
    this.h3 = 2773480762;
    this.h4 = 1359893119;
    this.h5 = 2600822924;
    this.h6 = 528734635;
    this.h7 = 1541459225;
    this.pending = new Uint8Array(64);
    this.pendingLength = 0;
    this.totalBytes = 0;
  }
  static {
    this.K = [
      1116352408,
      1899447441,
      3049323471,
      3921009573,
      961987163,
      1508970993,
      2453635748,
      2870763221,
      3624381080,
      310598401,
      607225278,
      1426881987,
      1925078388,
      2162078206,
      2614888103,
      3248222580,
      3835390401,
      4022224774,
      264347078,
      604807628,
      770255983,
      1249150122,
      1555081692,
      1996064986,
      2554220882,
      2821834349,
      2952996808,
      3210313671,
      3336571891,
      3584528711,
      113926993,
      338241895,
      666307205,
      773529912,
      1294757372,
      1396182291,
      1695183700,
      1986661051,
      2177026350,
      2456956037,
      2730485921,
      2820302411,
      3259730800,
      3345764771,
      3516065817,
      3600352804,
      4094571909,
      275423344,
      430227734,
      506948616,
      659060556,
      883997877,
      958139571,
      1322822218,
      1537002063,
      1747873779,
      1955562222,
      2024104815,
      2227730452,
      2361852424,
      2428436474,
      2756734187,
      3204031479,
      3329325298
    ];
  }
  update(chunk) {
    let offset = 0;
    this.totalBytes += chunk.length;
    if (this.pendingLength > 0) {
      const take = Math.min(64 - this.pendingLength, chunk.length);
      this.pending.set(chunk.subarray(0, take), this.pendingLength);
      this.pendingLength += take;
      offset += take;
      if (this.pendingLength === 64) {
        this.processBlock(this.pending, 0);
        this.pendingLength = 0;
      }
    }
    while (offset + 64 <= chunk.length) {
      this.processBlock(chunk, offset);
      offset += 64;
    }
    if (offset < chunk.length) {
      this.pending.set(chunk.subarray(offset), 0);
      this.pendingLength = chunk.length - offset;
    }
  }
  digestHex() {
    const finalBlock = new Uint8Array(128);
    if (this.pendingLength > 0) {
      finalBlock.set(this.pending.subarray(0, this.pendingLength), 0);
    }
    finalBlock[this.pendingLength] = 128;
    const totalBitLength = this.totalBytes * 8;
    const needsTwoBlocks = this.pendingLength >= 56;
    const lengthOffset = needsTwoBlocks ? 120 : 56;
    const lo = totalBitLength >>> 0;
    finalBlock[lengthOffset + 4] = lo >>> 24 & 255;
    finalBlock[lengthOffset + 5] = lo >>> 16 & 255;
    finalBlock[lengthOffset + 6] = lo >>> 8 & 255;
    finalBlock[lengthOffset + 7] = lo & 255;
    this.processBlock(finalBlock, 0);
    if (needsTwoBlocks) {
      this.processBlock(finalBlock, 64);
    }
    const bytes = new Uint8Array(32);
    const words = [this.h0, this.h1, this.h2, this.h3, this.h4, this.h5, this.h6, this.h7];
    for (let i = 0; i < 8; i++) {
      bytes[i * 4] = words[i] >>> 24 & 255;
      bytes[i * 4 + 1] = words[i] >>> 16 & 255;
      bytes[i * 4 + 2] = words[i] >>> 8 & 255;
      bytes[i * 4 + 3] = words[i] & 255;
    }
    let hex = "";
    for (let i = 0; i < bytes.length; i++) {
      hex += bytes[i].toString(16).padStart(2, "0");
    }
    return hex;
  }
  processBlock(block, offset) {
    const w = new Uint32Array(64);
    for (let t = 0; t < 16; t++) {
      const i = offset + t * 4;
      w[t] = block[i] << 24 | block[i + 1] << 16 | block[i + 2] << 8 | block[i + 3];
    }
    for (let t = 16; t < 64; t++) {
      const s0 = rotr322(w[t - 15], 7) ^ rotr322(w[t - 15], 18) ^ w[t - 15] >>> 3;
      const s1 = rotr322(w[t - 2], 17) ^ rotr322(w[t - 2], 19) ^ w[t - 2] >>> 10;
      w[t] = w[t - 16] + s0 + w[t - 7] + s1 | 0;
    }
    let a = this.h0;
    let b = this.h1;
    let c = this.h2;
    let d = this.h3;
    let e = this.h4;
    let f = this.h5;
    let g = this.h6;
    let h = this.h7;
    for (let t = 0; t < 64; t++) {
      const s1 = rotr322(e, 6) ^ rotr322(e, 11) ^ rotr322(e, 25);
      const ch = e & f ^ ~e & g;
      const temp1 = h + s1 + ch + _StreamingSha256.K[t] + w[t] | 0;
      const s0 = rotr322(a, 2) ^ rotr322(a, 13) ^ rotr322(a, 22);
      const maj = a & b ^ a & c ^ b & c;
      const temp2 = s0 + maj | 0;
      h = g;
      g = f;
      f = e;
      e = d + temp1 | 0;
      d = c;
      c = b;
      b = a;
      a = temp1 + temp2 | 0;
    }
    this.h0 = this.h0 + a | 0;
    this.h1 = this.h1 + b | 0;
    this.h2 = this.h2 + c | 0;
    this.h3 = this.h3 + d | 0;
    this.h4 = this.h4 + e | 0;
    this.h5 = this.h5 + f | 0;
    this.h6 = this.h6 + g | 0;
    this.h7 = this.h7 + h | 0;
  }
};
function rotr322(x, n) {
  return x >>> n | x << 32 - n;
}
function abortError() {
  const error = new Error("Aborted");
  error.name = "AbortError";
  return error;
}
function isAbortError(error) {
  return error instanceof Error && error.name === "AbortError";
}
function throwIfAborted(signal) {
  if (signal?.aborted) throw abortError();
}
function sleep(ms) {
  return new Promise((resolve) => compatSetTimeout(() => resolve(), ms));
}
function sleepWithAbort(ms, signal) {
  if (!signal) return sleep(ms);
  throwIfAborted(signal);
  return new Promise((resolve, reject) => {
    const timer = compatSetTimeout(() => {
      signal.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      compatClearTimeout(timer);
      signal.removeEventListener("abort", onAbort);
      reject(abortError());
    };
    signal.addEventListener("abort", onAbort, { once: true });
  });
}
function responseToText(response) {
  if (typeof response.text === "string") {
    return response.text;
  }
  if (response.arrayBuffer instanceof ArrayBuffer) {
    return new TextDecoder().decode(response.arrayBuffer);
  }
  return JSON.stringify(response.json ?? null);
}
function downloadErrorData(err) {
  const message = err instanceof Error ? err.message : String(err);
  if (err instanceof OneDriveError) {
    return { message, errorType: err.type, statusCode: err.statusCode, graphCode: err.graphCode };
  }
  return { message };
}
async function uploadChunkFetch(uploadUrl, chunk, start, end, total, signal) {
  const res = await browserFetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Range": `bytes ${start}-${end}/${total}`,
      "Content-Type": "application/octet-stream"
    },
    body: chunk,
    cache: "no-store",
    signal
  });
  if (!res.ok) {
    throw await fetchResponseError(res);
  }
  let json = void 0;
  try {
    json = await res.json();
  } catch {
  }
  return { json, status: res.status, headers: {} };
}
async function uploadSessionControlFetch(uploadUrl, method, signal) {
  const res = await browserFetch(uploadUrl, {
    method,
    cache: "no-store",
    signal
  });
  if (!res.ok) {
    throw await fetchResponseError(res);
  }
  let json = void 0;
  if (res.status !== 204) {
    try {
      json = await res.json();
    } catch {
    }
  }
  return { json, status: res.status, headers: {} };
}
async function fetchResponseError(response) {
  const headers = {};
  response.headers?.forEach((value, key) => {
    headers[key] = value;
  });
  let json = void 0;
  let text;
  try {
    json = await response.json();
  } catch {
    try {
      text = await response.text();
    } catch {
    }
  }
  return Object.assign(new Error(`HTTP ${response.status}`), {
    status: response.status,
    headers,
    ...json === void 0 ? {} : { json },
    ...text === void 0 ? {} : { text }
  });
}
async function readResponseBuffer(res, onProgress, signal) {
  if (!res.ok) {
    const err = new Error(`HTTP ${res.status}`);
    err.status = res.status;
    throw err;
  }
  if (!onProgress || !res.body) {
    return res.arrayBuffer();
  }
  const contentLength = parseInt(res.headers.get("Content-Length") || "0", 10);
  const reader = res.body.getReader();
  const chunks = [];
  let downloaded = 0;
  try {
    while (true) {
      throwIfAborted(signal);
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      downloaded += value.length;
      onProgress(downloaded, contentLength || downloaded);
    }
  } catch (error) {
    throw withTransferredBytes(error, downloaded);
  } finally {
    try {
      reader.releaseLock();
    } catch {
    }
  }
  const buf = new Uint8Array(downloaded);
  let pos = 0;
  for (const chunk of chunks) {
    buf.set(chunk, pos);
    pos += chunk.length;
  }
  return buf.buffer;
}
async function writeArrayBufferToBinaryFile(adapter, path, data, expectedSha256, declaredSize = 0, onProgress) {
  await safeRemove(adapter, path);
  await adapter.writeBinary(path, data);
  const size = data.byteLength;
  const hash = await sha256Hex(data);
  if (expectedSha256 && hash !== expectedSha256.toLowerCase()) {
    await safeRemove(adapter, path);
    throw new OneDriveError(
      "NetworkError" /* NetworkError */,
      `Downloaded content hash mismatch for: ${path}`
    );
  }
  onProgress?.(size, declaredSize || size);
  return { size, hash };
}
async function streamResponseToBinaryFile(res, adapter, path, expectedSha256, onProgress, signal) {
  if (!res.ok) {
    const err = new Error(`HTTP ${res.status}`);
    err.status = res.status;
    throw err;
  }
  if (!res.body) {
    return writeArrayBufferToBinaryFile(
      adapter,
      path,
      await res.arrayBuffer(),
      expectedSha256,
      parseInt(res.headers.get("Content-Length") || "0", 10),
      onProgress
    );
  }
  await safeRemove(adapter, path);
  const contentLength = parseInt(res.headers.get("Content-Length") || "0", 10);
  const reader = res.body.getReader();
  const hasher = new StreamingSha256();
  let downloaded = 0;
  let wrote = false;
  try {
    while (true) {
      throwIfAborted(signal);
      const { done, value } = await reader.read();
      if (done) break;
      hasher.update(value);
      const chunk = exactArrayBuffer(value);
      if (!wrote) {
        await adapter.writeBinary(path, chunk);
        wrote = true;
      } else {
        await adapter.appendBinary(path, chunk);
      }
      downloaded += value.length;
      onProgress?.(downloaded, contentLength || downloaded);
    }
    if (!wrote) {
      await adapter.writeBinary(path, new ArrayBuffer(0));
    }
    const hash = hasher.digestHex();
    if (expectedSha256 && hash !== expectedSha256.toLowerCase()) {
      await safeRemove(adapter, path);
      throw new OneDriveError(
        "NetworkError" /* NetworkError */,
        `Downloaded content hash mismatch for: ${path}`
      );
    }
    return { size: downloaded, hash };
  } catch (error) {
    await safeRemove(adapter, path);
    throw withTransferredBytes(error, downloaded);
  } finally {
    try {
      reader.releaseLock();
    } catch {
    }
  }
}
function withTransferredBytes(error, transferredBytes) {
  if (transferredBytes <= 0) return error;
  if (typeof error === "object" && error !== null || typeof error === "function") {
    try {
      const target = error;
      target.transferredBytes = Math.max(target.transferredBytes ?? 0, transferredBytes);
    } catch {
    }
    return error;
  }
  return Object.assign(new Error(String(error)), { transferredBytes });
}
function transferredBytesFromError(error) {
  if ((typeof error !== "object" || error === null) && typeof error !== "function") return 0;
  const value = error.transferredBytes;
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : 0;
}
async function contentUrlFetch(url, token, onProgress, signal) {
  const res = await browserFetch(url, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
    signal
  });
  const buf = await readResponseBuffer(res, onProgress, signal);
  return { arrayBuffer: buf, status: res.status, headers: {} };
}
async function contentUrlFetchToBinaryFile(url, token, adapter, path, expectedSha256, onProgress, signal) {
  const res = await browserFetch(url, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
    signal
  });
  return streamResponseToBinaryFile(res, adapter, path, expectedSha256, onProgress, signal);
}
async function downloadUrlFetch(url, onProgress, signal) {
  const res = await browserFetch(url, { cache: "no-store", signal });
  const buf = await readResponseBuffer(res, onProgress, signal);
  return { arrayBuffer: buf, status: res.status, headers: {} };
}
async function downloadUrlFetchToBinaryFile(url, adapter, path, expectedSha256, onProgress, signal) {
  const res = await browserFetch(url, { cache: "no-store", signal });
  return streamResponseToBinaryFile(res, adapter, path, expectedSha256, onProgress, signal);
}

// src/sync/types.ts
function isSyncScope(value) {
  if (!value || typeof value !== "object") return false;
  const scope = value;
  return typeof scope.accountId === "string" && scope.accountId.length > 0 && typeof scope.driveId === "string" && scope.driveId.length > 0 && typeof scope.vaultFolderId === "string" && scope.vaultFolderId.length > 0 && typeof scope.filesRootId === "string" && scope.filesRootId.length > 0;
}
function sameSyncScope(left, right) {
  return left?.accountId === right?.accountId && left?.driveId === right?.driveId && left?.vaultFolderId === right?.vaultFolderId && left?.filesRootId === right?.filesRootId;
}
var DEFAULT_SCAN_CONFIG = {
  excludePaths: [".trash/", ".DS_Store", "Thumbs.db"],
  excludedFolders: [],
  // M19: EasySync self-sync default OFF. Explicit opt-in via syncOwnPlugin setting
  // with anti-downgrade protection (manifest.json version comparison).
  includePaths: [],
  maxFileSize: 500 * 1024 * 1024,
  includePluginCode: false,
  includePluginData: false
};
var CHANGE_THRESHOLD_RATIO = 0.5;
function planDigest(items) {
  const normalized = items.map((i) => `${i.path}|${i.type}|${i.local?.hash ?? ""}|${i.remote?.eTag ?? ""}`).sort();
  return normalized.join("\n");
}

// src/sync/local-scanner.ts
var SCAN_CACHE_FORMAT = 1;
var SCAN_SLEEP_EVERY = 50;
var COMMUNITY_PLUGIN_CODE_FILES = /* @__PURE__ */ new Set([
  "main.js",
  "manifest.json",
  "styles.css"
]);
function normalizeVaultRelativePath(value) {
  return value.trim().replace(/\\/g, "/").replace(/\/+/g, "/").replace(/^\/+|\/+$/g, "");
}
function normalizeExcludedFolders(values, configDir = DEFAULT_CONFIG_DIR) {
  const normalizedConfigDir = normalizeVaultRelativePath(configDir).toLowerCase();
  const unique = /* @__PURE__ */ new Map();
  for (const value of values) {
    if (typeof value !== "string") continue;
    const path = normalizeVaultRelativePath(value);
    if (!path || path === ".") continue;
    const segments = path.split("/");
    if (segments.some((segment) => segment === "." || segment === "..")) continue;
    const key = path.toLowerCase();
    if (normalizedConfigDir && (key === normalizedConfigDir || key.startsWith(`${normalizedConfigDir}/`))) continue;
    if (!unique.has(key)) unique.set(key, path);
  }
  const byParentFirst = [...unique.values()].sort(
    (left, right) => left.split("/").length - right.split("/").length || left.length - right.length || left.localeCompare(right)
  );
  const collapsed = [];
  for (const path of byParentFirst) {
    const key = path.toLowerCase();
    if (collapsed.some((parent) => {
      const parentKey = parent.toLowerCase();
      return key === parentKey || key.startsWith(`${parentKey}/`);
    })) continue;
    collapsed.push(path);
  }
  return collapsed.sort((left, right) => left.localeCompare(right));
}
function isPathExcludedByFolders(path, excludedFolders) {
  if (!excludedFolders?.length) return false;
  const normalizedPath = normalizeVaultRelativePath(path).toLowerCase();
  return excludedFolders.some((folder) => {
    const normalizedFolder = normalizeVaultRelativePath(folder).toLowerCase();
    return normalizedPath === normalizedFolder || normalizedPath.startsWith(`${normalizedFolder}/`);
  });
}
function isEasySyncInternalPath(path, configDir = DEFAULT_CONFIG_DIR, pluginId = "easy-sync") {
  const paths = getEasySyncPaths(configDir, pluginId);
  return path.endsWith(".easy-sync-recovery") || path === paths.dataFile || path.startsWith(`${paths.pluginDirPrefix}data.sync-conflict-`) && path.endsWith(".json") || path === paths.remoteStateFile || path === paths.stateV2File || path === paths.stateV2NextFile || path === paths.stateV2PreviousFile || path === paths.stateV2RecoveryFile || path === paths.stateV2ManifestFile || path === paths.stateV2ManifestNextFile || path === paths.stateV1BackupFile || path === paths.baseContentFile || path === paths.ancestorManifestV2File || path === paths.ancestorManifestV2NextFile || path === paths.ancestorsV2Dir || path.startsWith(`${paths.ancestorsV2Dir}/`) || path === paths.scanCacheFile || path === paths.logsDir || path.startsWith(`${paths.logsDir}/`) || path === paths.tmpDir || path.startsWith(`${paths.tmpDir}/`);
}
function isBinary(content) {
  const bytes = new Uint8Array(content.slice(0, 8192));
  for (let i = 0; i < bytes.length; i++) {
    if (bytes[i] === 0) return true;
  }
  return false;
}
function isExcluded(path, config, configDir, pluginId) {
  const paths = getEasySyncPaths(configDir, pluginId);
  if (isEasySyncInternalPath(path, configDir, pluginId)) return true;
  if (isPathExcludedByFolders(path, config.excludedFolders)) return true;
  if (path.startsWith(paths.pluginRoot) && path !== paths.pluginDir && !path.startsWith(paths.pluginDirPrefix)) {
    const parts = path.slice(paths.pluginRoot.length).split("/");
    if (parts.length !== 2) return true;
    const fileName2 = parts[1];
    if (fileName2 === "data.json") return !config.includePluginData;
    return !config.includePluginCode || !COMMUNITY_PLUGIN_CODE_FILES.has(fileName2);
  }
  for (const prefix of config.includePaths) {
    if (path.startsWith(prefix)) {
      return false;
    }
  }
  for (const prefix of config.excludePaths) {
    if (path.startsWith(prefix)) return true;
  }
  return false;
}
function isExcludedDirectory(path, config, configDir, pluginId) {
  const paths = getEasySyncPaths(configDir, pluginId);
  if (path === paths.logsDir || path.startsWith(`${paths.logsDir}/`) || path === paths.tmpDir || path.startsWith(`${paths.tmpDir}/`) || path === paths.ancestorsV2Dir || path.startsWith(`${paths.ancestorsV2Dir}/`)) return true;
  if (isPathExcludedByFolders(path, config.excludedFolders)) return true;
  if (path.startsWith(paths.pluginRoot) && path !== paths.pluginDir && !path.startsWith(paths.pluginDirPrefix)) {
    const parts = path.slice(paths.pluginRoot.length).split("/");
    if (parts.length > 1) return true;
    return !config.includePluginCode && !config.includePluginData;
  }
  const prefix = `${path.replace(/\/+$/, "")}/`;
  const relatedInclude = config.includePaths.some(
    (include) => include.startsWith(prefix) || prefix.startsWith(include)
  );
  if (relatedInclude) return false;
  return config.excludePaths.some((exclude) => prefix.startsWith(exclude));
}
var LocalScanner = class {
  constructor(vault, config = DEFAULT_SCAN_CONFIG, pluginId = "easy-sync") {
    this.pluginId = pluginId;
    this.scanCache = { format: SCAN_CACHE_FORMAT, entries: {} };
    this.scanCacheLoaded = false;
    this.scanCacheDirty = false;
    this.vault = vault;
    this.configDir = getConfigDir(vault);
    this.config = {
      ...DEFAULT_SCAN_CONFIG,
      ...config,
      includePaths: [...config.includePaths ?? DEFAULT_SCAN_CONFIG.includePaths],
      excludedFolders: normalizeExcludedFolders(
        config.excludedFolders ?? DEFAULT_SCAN_CONFIG.excludedFolders ?? [],
        this.configDir
      )
    };
    this.config.excludePaths = [
      ...config.excludePaths ?? [`${this.configDir}/`, ...DEFAULT_SCAN_CONFIG.excludePaths]
    ];
  }
  setDiag(diag) {
    this.diag = diag;
  }
  setConfig(config) {
    this.config = {
      ...this.config,
      ...config,
      ...config.includePaths ? { includePaths: [...config.includePaths] } : {},
      ...config.excludePaths ? { excludePaths: [...config.excludePaths] } : {},
      ...config.excludedFolders ? {
        excludedFolders: normalizeExcludedFolders(
          config.excludedFolders,
          this.configDir
        )
      } : {}
    };
  }
  getMaxFileSize() {
    return this.config.maxFileSize;
  }
  shouldSyncPath(path) {
    return !isExcluded(path, this.config, this.configDir, this.pluginId);
  }
  // ---- Scan Cache ----
  async loadScanCache() {
    if (this.scanCacheLoaded) return;
    const { scanCacheFile } = getEasySyncPaths(this.configDir, this.pluginId);
    try {
      const json = await this.vault.adapter.read(scanCacheFile);
      const parsed = JSON.parse(json);
      if (isRecord(parsed) && parsed.format === SCAN_CACHE_FORMAT && isRecord(parsed.entries)) {
        this.scanCache = {
          format: SCAN_CACHE_FORMAT,
          entries: Object.fromEntries(
            Object.entries(parsed.entries).filter((entry) => {
              const value = entry[1];
              return isRecord(value) && typeof value.mtime === "number" && typeof value.size === "number" && typeof value.hash === "string" && typeof value.binary === "boolean";
            })
          )
        };
      }
    } catch {
      this.scanCache = { format: SCAN_CACHE_FORMAT, entries: {} };
    }
    this.scanCacheLoaded = true;
    this.scanCacheDirty = false;
  }
  async saveScanCache() {
    if (!this.scanCacheDirty) return;
    const { scanCacheFile } = getEasySyncPaths(this.configDir, this.pluginId);
    try {
      await this.vault.adapter.write(scanCacheFile, JSON.stringify(this.scanCache));
      this.scanCacheDirty = false;
    } catch {
    }
  }
  async clearScanCache() {
    this.scanCache = { format: SCAN_CACHE_FORMAT, entries: {} };
    this.scanCacheLoaded = true;
    this.scanCacheDirty = false;
    const { scanCacheFile } = getEasySyncPaths(this.configDir, this.pluginId);
    try {
      await this.vault.adapter.remove(scanCacheFile);
    } catch {
    }
  }
  cacheProbe(path, mtime, size) {
    const entry = this.scanCache.entries[path];
    if (entry && entry.mtime === mtime && entry.size === size) return entry;
    return null;
  }
  cacheSet(path, mtime, size, hash, binary) {
    const current = this.scanCache.entries[path];
    if (current && current.mtime === mtime && current.size === size && current.hash === hash && current.binary === binary) {
      return;
    }
    this.scanCache.entries[path] = { mtime, size, hash, binary };
    this.scanCacheDirty = true;
  }
  cachePrune(activePaths) {
    let removed = false;
    const next = {};
    for (const path of activePaths) {
      if (this.scanCache.entries[path]) next[path] = this.scanCache.entries[path];
    }
    for (const path of Object.keys(this.scanCache.entries)) {
      if (!activePaths.has(path)) {
        removed = true;
        break;
      }
    }
    if (!removed) return;
    this.scanCache.entries = next;
    this.scanCacheDirty = true;
  }
  /**
   * Scan all non-excluded files in the vault and return LocalFileEntry snapshots.
   */
  async scanAll() {
    await this.loadScanCache();
    const entries = [];
    const skippedLarge = [];
    const failedPaths = [];
    const scannedPaths = /* @__PURE__ */ new Set();
    const scannedDirs = /* @__PURE__ */ new Set();
    let allFiles;
    try {
      allFiles = this.vault.getFiles();
    } catch (error) {
      this.diag?.warn("scan", "vault file enumeration failed", error);
      return {
        entries,
        skippedLarge,
        failedPaths: ["/"],
        skippedCount: 0,
        complete: false
      };
    }
    let fileCount = 0;
    let skippedCount = 0;
    for (const file of allFiles) {
      const path = file.path;
      scannedPaths.add(path);
      if (isExcluded(path, this.config, this.configDir, this.pluginId)) {
        if (!isPathExcludedByFolders(path, this.config.excludedFolders)) {
          skippedCount++;
        }
        continue;
      }
      let stat = file.stat;
      if (!stat) {
        try {
          stat = await this.vault.adapter.stat(path);
        } catch (error) {
          this.diag?.warn("scan", `stat failed for "${path}"`, error);
        }
      }
      if (!stat) {
        failedPaths.push(path);
        continue;
      }
      if (stat.size > this.config.maxFileSize) {
        skippedLarge.push(path);
        continue;
      }
      const cached = this.cacheProbe(path, stat.mtime ?? 0, stat.size);
      if (cached) {
        entries.push({ path, size: stat.size, mtime: stat.mtime ?? 0, hash: cached.hash, binary: cached.binary });
        continue;
      }
      let content;
      try {
        content = await this.vault.adapter.readBinary(path);
      } catch {
        failedPaths.push(path);
        continue;
      }
      const hash = await sha256Hex(content);
      const binary = stat.size > 0 ? isBinary(content) : false;
      entries.push({ path, size: stat.size, mtime: stat.mtime ?? 0, hash, binary });
      this.cacheSet(path, stat.mtime ?? 0, stat.size, hash, binary);
      if (++fileCount % SCAN_SLEEP_EVERY === 0) await sleep2(0);
    }
    this.diag?.log("scan", `includePaths: [${this.config.includePaths.join(", ")}], excludePaths: [${this.config.excludePaths.join(", ")}]`);
    await this.scanIncludePaths(entries, skippedLarge, failedPaths, scannedPaths, scannedDirs);
    const pluginEntries = entries.filter((e) => e.path.startsWith(`${this.configDir}/`));
    this.diag?.log("scan", `scanAll done \u2014 ${entries.length} entries (${pluginEntries.length} plugin), ${skippedLarge.length} skipped-large, ${failedPaths.length} failed`);
    if (failedPaths.length === 0) {
      this.cachePrune(scannedPaths);
      await this.saveScanCache();
    }
    return {
      entries,
      skippedLarge,
      failedPaths,
      skippedCount,
      complete: failedPaths.length === 0
    };
  }
  /** Enumerate paths listed in config.includePaths that are NOT
   *  covered by vault.getFiles() (for example config-dir subtrees).
   *
   *  Directory paths (ending with /) are scanned recursively;
   *  single file paths are scanned directly. */
  async scanIncludePaths(entries, skippedLarge, failedPaths, scannedPaths, scannedDirs) {
    for (const prefix of this.config.includePaths) {
      if (prefix.endsWith("/")) {
        await this.scanDir(
          prefix,
          entries,
          skippedLarge,
          failedPaths,
          scannedPaths,
          scannedDirs,
          true
        );
      } else {
        await this.scanSinglePath(prefix, entries, skippedLarge, failedPaths, scannedPaths);
      }
    }
  }
  /** Scan a single file path (not a directory). Used for includePaths that
   *  point to individual config files inside the vault config dir. */
  async scanSinglePath(filePath, entries, skippedLarge, failedPaths, scannedPaths) {
    if (scannedPaths.has(filePath)) return;
    scannedPaths.add(filePath);
    if (isExcluded(filePath, this.config, this.configDir, this.pluginId)) return;
    let stat;
    try {
      stat = await this.vault.adapter.stat(filePath);
    } catch (error) {
      this.diag?.warn("scan", `stat failed for "${filePath}"`, error);
      failedPaths.push(filePath);
      return;
    }
    if (!stat) {
      this.diag?.warn("scan", `stat returned null for "${filePath}", skipping`);
      return;
    }
    if (stat.size > this.config.maxFileSize) {
      skippedLarge.push(filePath);
      return;
    }
    const cached = this.cacheProbe(filePath, stat.mtime ?? 0, stat.size);
    if (cached) {
      entries.push({ path: filePath, size: stat.size, mtime: stat.mtime ?? 0, hash: cached.hash, binary: cached.binary });
      return;
    }
    let content;
    try {
      content = await this.vault.adapter.readBinary(filePath);
    } catch {
      failedPaths.push(filePath);
      return;
    }
    const hash = await sha256Hex(content);
    const binary = stat.size > 0 ? isBinary(content) : false;
    entries.push({ path: filePath, size: stat.size, mtime: stat.mtime ?? 0, hash, binary });
    this.cacheSet(filePath, stat.mtime ?? 0, stat.size, hash, binary);
  }
  /** Recursively list and scan files under `dirPath` via vault.adapter.
   *
   *  The caller may pass a trailing slash (from includePaths) —
   *  it is stripped so `${base}/${name}` never produces double slashes,
   *  which would break OneDrive API URLs after encodeUrlPath splits on `/`. */
  async scanDir(dirPath, entries, skippedLarge, failedPaths, scannedPaths, scannedDirs, allowMissingRoot = false) {
    const base = dirPath.replace(/\/+$/, "");
    if (scannedDirs.has(base) || isExcludedDirectory(base, this.config, this.configDir, this.pluginId)) return;
    scannedDirs.add(base);
    if (allowMissingRoot) {
      let exists;
      try {
        exists = await this.vault.adapter.exists(base);
      } catch (error) {
        this.diag?.warn("scan", `scanDir("${base}") \u2014 existence check failed`, error);
        failedPaths.push(base);
        return;
      }
      if (!exists) {
        this.diag?.log("scan", `scanDir("${base}") \u2192 directory absent, treating as empty`);
        return;
      }
    }
    let listed;
    try {
      listed = await this.vault.adapter.list(base);
      this.diag?.log("scan", `scanDir("${base}") \u2192 ${listed.files.length} files, ${listed.folders.length} folders: [${listed.files.join(", ")}]`);
    } catch (err) {
      this.diag?.warn("scan", `scanDir("${base}") \u2014 list failed`, err);
      failedPaths.push(base);
      return;
    }
    for (const file of listed.files) {
      const path = normalizeListedPath(base, file);
      if (scannedPaths.has(path)) continue;
      scannedPaths.add(path);
      if (isExcluded(path, this.config, this.configDir, this.pluginId)) {
        if (path.endsWith("/data.json")) {
          this.diag?.log("scan", `isExcluded("${path}") \u2192 true (/data.json, self-referential protection)`);
        }
        continue;
      }
      let stat;
      try {
        stat = await this.vault.adapter.stat(path);
      } catch (error) {
        this.diag?.warn("scan", `stat failed for "${path}"`, error);
        failedPaths.push(path);
        continue;
      }
      if (!stat) {
        this.diag?.warn("scan", `stat returned null for "${path}", marking scan incomplete`);
        failedPaths.push(path);
        continue;
      }
      if (stat.size > this.config.maxFileSize) {
        skippedLarge.push(path);
        continue;
      }
      const cached = this.cacheProbe(path, stat.mtime ?? 0, stat.size);
      if (cached) {
        entries.push({ path, size: stat.size, mtime: stat.mtime ?? 0, hash: cached.hash, binary: cached.binary });
        continue;
      }
      let content;
      try {
        content = await this.vault.adapter.readBinary(path);
      } catch {
        failedPaths.push(path);
        continue;
      }
      const hash = await sha256Hex(content);
      const binary = stat.size > 0 ? isBinary(content) : false;
      entries.push({ path, size: stat.size, mtime: stat.mtime ?? 0, hash, binary });
      this.cacheSet(path, stat.mtime ?? 0, stat.size, hash, binary);
    }
    for (const sub of listed.folders) {
      const path = normalizeListedPath(base, sub);
      await this.scanDir(path, entries, skippedLarge, failedPaths, scannedPaths, scannedDirs);
    }
  }
  async scanFile(path) {
    const inspection = await this.inspectFile(path);
    if (inspection.status !== "present" || !inspection.entry) return null;
    const { entry } = inspection;
    await this.loadScanCache();
    this.cacheSet(path, entry.mtime, entry.size, entry.hash, entry.binary);
    await this.saveScanCache();
    return entry;
  }
  /** Read the current local version for a write-time compare-and-swap check.
   *  Unlike scanFile(), missing and unreadable are never conflated. */
  async inspectFile(path) {
    if (isExcluded(path, this.config, this.configDir, this.pluginId)) {
      return { status: "uncertain", reason: "excluded" };
    }
    let stat;
    try {
      stat = await this.vault.adapter.stat(path);
    } catch {
      return { status: "uncertain", reason: "stat" };
    }
    if (!stat) return { status: "missing" };
    if (stat.size > this.config.maxFileSize) {
      return { status: "uncertain", reason: "too-large" };
    }
    let content;
    try {
      content = await this.vault.adapter.readBinary(path);
    } catch {
      return { status: "uncertain", reason: "read" };
    }
    const hash = await sha256Hex(content);
    const binary = stat.size > 0 ? isBinary(content) : false;
    return {
      status: "present",
      entry: { path, size: stat.size, mtime: stat.mtime ?? 0, hash, binary }
    };
  }
};
function normalizeListedPath(base, entry) {
  const normalized = entry.replace(/\/+$/, "");
  return normalized.startsWith(`${base}/`) ? normalized : `${base}/${normalized}`;
}
function sleep2(ms) {
  return new Promise((resolve) => compatSetTimeout(() => resolve(), ms));
}

// src/sync/sync-engine.ts
function toMap(entries) {
  const map = /* @__PURE__ */ new Map();
  for (const entry of entries) {
    map.set(entry.path, entry);
  }
  return map;
}
function remoteContentMatchesBase(remote, base) {
  return Boolean(
    remote?.sha256Hash && remote.size === base.size && remote.sha256Hash.toLowerCase() === base.hash
  );
}
var OBSIDIAN_MANAGED_CONFIG_PATHS = /* @__PURE__ */ new Set([
  ".obsidian/app.json",
  ".obsidian/appearance.json",
  ".obsidian/hotkeys.json",
  ".obsidian/core-plugins.json",
  ".obsidian/community-plugins.json"
]);
function isObsidianManagedConfigPath(path) {
  return OBSIDIAN_MANAGED_CONFIG_PATHS.has(path);
}
var SyncEngine = class {
  /**
   * Generate a sync plan by comparing local, remote, and base snapshots.
   */
  generatePlan(localEntries, remoteEntries, baseEntries, skippedLarge) {
    const localMap = toMap(localEntries);
    const remoteMap = toMap(remoteEntries);
    const baseMap = toMap(baseEntries);
    const skippedSet = new Set(skippedLarge);
    const plan = [];
    const renames = this.detectRenames(
      localMap,
      remoteMap,
      baseMap,
      skippedSet
    );
    const renamedOldPaths = new Set(renames.keys());
    const renamedNewPaths = new Set(
      [...renames.values()].map((r) => r.newPath)
    );
    const unresolvedRelocationOldPaths = this.detectUnresolvedRelocations(
      localMap,
      remoteMap,
      baseMap,
      skippedSet,
      renamedOldPaths
    );
    for (const [oldPath, { newPath, localEntry, remoteEntry }] of renames) {
      plan.push({
        type: "renameRemote" /* RenameRemote */,
        path: newPath,
        renameFrom: oldPath,
        local: localEntry,
        remote: remoteEntry
      });
    }
    const allPaths = /* @__PURE__ */ new Set();
    for (const e of localEntries) allPaths.add(e.path);
    for (const e of remoteEntries) allPaths.add(e.path);
    for (const e of baseEntries) allPaths.add(e.path);
    for (const path of allPaths) {
      if (skippedSet.has(path)) continue;
      if (renamedOldPaths.has(path) || renamedNewPaths.has(path)) continue;
      const local = localMap.get(path);
      const remote = remoteMap.get(path);
      const base = baseMap.get(path);
      if (unresolvedRelocationOldPaths.has(path) && remote && base) {
        plan.push({
          type: "conflict" /* Conflict */,
          path,
          remote,
          reason: "reason.renameIdentityAmbiguous"
        });
        continue;
      }
      const item = this.classify(path, local, remote, base);
      if (item) {
        plan.push(item);
      }
    }
    for (const path of skippedLarge) {
      plan.push({
        type: "skipLargeFile" /* SkipLargeFile */,
        path,
        reason: `reason.fileExceedsSizeLimit`
      });
    }
    return {
      items: this.orderPlan(plan),
      lastTotalFiles: baseEntries.length,
      confirmed: false
    };
  }
  /**
   * Classify a single file into a SyncPlanItem based on three-way comparison.
   *
   * Returns null if no action is needed (file unchanged on both sides).
   */
  classify(path, local, remote, base) {
    if (!base) {
      if (local && remote) {
        return {
          type: "conflict" /* Conflict */,
          path,
          local,
          remote,
          reason: "reason.newFileBothSides"
        };
      }
      if (local && !remote) {
        return { type: "upload" /* Upload */, path, local };
      }
      if (remote && !local) {
        return { type: "download" /* Download */, path, remote };
      }
      return null;
    }
    const localChanged = local && (local.hash !== base.hash || local.size !== base.size);
    const remoteChanged = remote && (remote.sha256Hash ? !remoteContentMatchesBase(remote, base) : remote.eTag !== base.eTag);
    if (!local && remote) {
      if (isObsidianManagedConfigPath(path)) {
        return { type: "download" /* Download */, path, remote };
      }
      if (remoteChanged) {
        return {
          type: "conflict" /* Conflict */,
          path,
          remote,
          reason: "reason.localDeletedRemoteModified"
        };
      }
      return {
        type: "deleteRemote" /* DeleteRemote */,
        path,
        remote,
        reason: "reason.fileDeletedLocally"
      };
    }
    if (local && !remote) {
      if (isObsidianManagedConfigPath(path)) {
        return { type: "upload" /* Upload */, path, local };
      }
      if (localChanged) {
        return {
          type: "conflict" /* Conflict */,
          path,
          local,
          reason: "reason.remoteDeletedLocalModified"
        };
      }
      return {
        type: "confirmLocalDelete" /* ConfirmLocalDelete */,
        path,
        local,
        reason: "reason.fileDeletedFromRemote"
      };
    }
    if (!local && !remote) {
      return null;
    }
    if (local && remote) {
      if (localChanged && remoteChanged) {
        return {
          type: "conflict" /* Conflict */,
          path,
          local,
          remote,
          reason: "reason.bothSidesModified"
        };
      }
      if (localChanged && !remoteChanged) {
        return { type: "upload" /* Upload */, path, local, remote, baseEtag: base.eTag };
      }
      if (!localChanged && remoteChanged) {
        return { type: "download" /* Download */, path, local, remote };
      }
      return null;
    }
    return null;
  }
  /**
   * Detect local file renames by matching content hashes between files
   * that disappeared (in base but not local) and files that appeared
   * (in local but not base).
   *
   * Safety constraints (inspired by Syncthing's approach):
   *  - 0-byte files are skipped — all empty files have the same hash.
   *  - Hash collisions on either side (>1 file with same hash) skip.
   *  - Only same-directory renames are matched; cross-directory moves
   *    need the destination folder's driveItem ID for the PATCH API
   *    and safely fall through to Upload + DeleteRemote.
   */
  detectRenames(localMap, remoteMap, baseMap, skippedSet) {
    const renames = /* @__PURE__ */ new Map();
    const disappearedByHash = /* @__PURE__ */ new Map();
    for (const [path, base] of baseMap) {
      if (localMap.has(path)) continue;
      if (!remoteMap.has(path)) continue;
      if (skippedSet.has(path)) continue;
      if (base.size === 0) continue;
      const arr = disappearedByHash.get(base.hash) ?? [];
      arr.push({ path, base });
      disappearedByHash.set(base.hash, arr);
    }
    const appearedByHash = /* @__PURE__ */ new Map();
    for (const [path, local] of localMap) {
      if (baseMap.has(path)) continue;
      if (remoteMap.has(path)) continue;
      if (skippedSet.has(path)) continue;
      if (local.size === 0) continue;
      const arr = appearedByHash.get(local.hash) ?? [];
      arr.push({ path, local });
      appearedByHash.set(local.hash, arr);
    }
    for (const [hash, disappeared] of disappearedByHash) {
      const appeared = appearedByHash.get(hash);
      if (!appeared) continue;
      if (disappeared.length !== 1 || appeared.length !== 1) continue;
      const oldPath = disappeared[0].path;
      const newPath = appeared[0].path;
      const oldDir = oldPath.includes("/") ? oldPath.substring(0, oldPath.lastIndexOf("/")) : "";
      const newDir = newPath.includes("/") ? newPath.substring(0, newPath.lastIndexOf("/")) : "";
      if (oldDir !== newDir) continue;
      const remote = remoteMap.get(oldPath);
      if (!remoteVersionMatchesBase(remote, disappeared[0].base)) continue;
      renames.set(oldPath, {
        newPath,
        localEntry: appeared[0].local,
        baseEntry: disappeared[0].base,
        remoteEntry: remote
      });
    }
    return renames;
  }
  /** Preserve the old remote object when hash evidence suggests a move/copy,
   *  but destination identity is not a unique safe rename. */
  detectUnresolvedRelocations(localMap, remoteMap, baseMap, skippedSet, resolvedOldPaths) {
    const protectedPaths = /* @__PURE__ */ new Set();
    for (const [oldPath, base] of baseMap) {
      if (resolvedOldPaths.has(oldPath) || localMap.has(oldPath) || skippedSet.has(oldPath) || base.size === 0) continue;
      const remote = remoteMap.get(oldPath);
      if (!remote || !remoteVersionMatchesBase(remote, base)) continue;
      const candidates = [...localMap.values()].filter(
        (local) => !baseMap.has(local.path) && !remoteMap.has(local.path) && !skippedSet.has(local.path) && local.hash === base.hash && local.size === base.size
      );
      if (candidates.length > 0) protectedPaths.add(oldPath);
    }
    return protectedPaths;
  }
  /**
   * Order plan items for safe execution:
   * 1. Uploads + Downloads (create/update files)
   * 2. Conflicts (flag, don't execute)
   * 3. Deletes (deleteRemote, deleteLocal, confirmLocalDelete — safest last)
   */
  orderPlan(items) {
    const priority = {
      ["upload" /* Upload */]: 0,
      ["download" /* Download */]: 0,
      ["renameRemote" /* RenameRemote */]: 0,
      ["skipLargeFile" /* SkipLargeFile */]: 1,
      ["skipIgnoredPath" /* SkipIgnoredPath */]: 1,
      ["retryLater" /* RetryLater */]: 2,
      ["conflict" /* Conflict */]: 3,
      ["confirmLocalDelete" /* ConfirmLocalDelete */]: 4,
      ["deleteLocal" /* DeleteLocal */]: 5,
      ["deleteRemote" /* DeleteRemote */]: 5,
      ["authExpired" /* AuthExpired */]: 6
    };
    return [...items].sort(
      (a, b) => (priority[a.type] ?? 99) - (priority[b.type] ?? 99)
    );
  }
  /**
   * Check if the change ratio exceeds the threshold.
   * Returns true if the plan should be paused for user confirmation.
   */
  shouldPauseForConfirmation(plan) {
    if (plan.lastTotalFiles === 0) {
      return false;
    }
    const changeCount = plan.items.filter(
      (item) => item.type !== "skipLargeFile" /* SkipLargeFile */ && item.type !== "skipIgnoredPath" /* SkipIgnoredPath */ && item.type !== "retryLater" /* RetryLater */ && item.type !== "renameRemote" /* RenameRemote */ && item.type !== "conflict" /* Conflict */ && item.type !== "confirmLocalDelete" /* ConfirmLocalDelete */
    ).length;
    const ratio = changeCount / plan.lastTotalFiles;
    return ratio > CHANGE_THRESHOLD_RATIO;
  }
};
function remoteVersionMatchesBase(remote, base) {
  return remote.sha256Hash ? remoteContentMatchesBase(remote, base) : remote.eTag === base.eTag;
}

// src/sync/sync-progress.ts
var MAX_SUCCESS_FILE_RECORDS = 100;
function isProgressActivityRunning(state) {
  return state.startedAt > 0 && state.phase !== "done";
}
function isAnySyncActivityRunning(state, fullSyncRunning, sideActionRunning) {
  return fullSyncRunning || sideActionRunning || isProgressActivityRunning(state);
}
function syncProgressPercent(state) {
  if (state.total <= 0) return 0;
  const completedItems = Math.max(0, state.current - 1);
  const currentFraction = state.currentItemComplete ? 1 : state.currentItemTotalBytes > 0 ? Math.min(1, Math.max(0, state.currentItemBytes / state.currentItemTotalBytes)) : 0;
  return Math.min(
    100,
    Math.max(0, Math.round((completedItems + currentFraction) / state.total * 100))
  );
}
function retainFileProgress(files) {
  let successesToSkip = Math.max(
    0,
    files.filter((file) => isSuccessfulFileProgress(file)).length - MAX_SUCCESS_FILE_RECORDS
  );
  return files.filter((file) => {
    if (!isSuccessfulFileProgress(file)) return true;
    if (successesToSkip > 0) {
      successesToSkip--;
      return false;
    }
    return true;
  });
}
var SyncProgressStore = class {
  constructor() {
    this._state = {
      phase: "idle",
      current: 0,
      total: 0,
      currentFile: "",
      currentItemBytes: 0,
      currentItemTotalBytes: 0,
      currentItemComplete: false,
      cancelRequested: false,
      completedFiles: [],
      startedAt: 0
    };
  }
  get state() {
    return this._state;
  }
  /** Reset to idle */
  reset() {
    this._state = {
      phase: "idle",
      current: 0,
      total: 0,
      currentFile: "",
      currentItemBytes: 0,
      currentItemTotalBytes: 0,
      currentItemComplete: false,
      cancelRequested: false,
      completedFiles: [],
      startedAt: 0
    };
  }
  /** Set the current phase (also resets progress counters for the new phase) */
  setPhase(phase) {
    this._state.phase = phase;
    this._state.current = 0;
    this._state.total = 0;
    this._state.currentFile = "";
    this._state.currentItemBytes = 0;
    this._state.currentItemTotalBytes = 0;
    this._state.currentItemComplete = false;
    this._state.currentActionType = void 0;
    if (phase === "executing") {
      this._state.completedFiles = [];
    }
  }
  /** Update progress within the current phase */
  setProgress(current, total, currentFile, currentActionType) {
    const itemChanged = this._state.current !== current || this._state.currentFile !== currentFile || this._state.currentActionType !== currentActionType;
    if (itemChanged) {
      this._state.currentItemBytes = 0;
      this._state.currentItemTotalBytes = 0;
      this._state.currentItemComplete = false;
    }
    this._state.current = current;
    this._state.total = total;
    this._state.currentFile = currentFile;
    this._state.currentActionType = currentActionType;
  }
  requestCancel() {
    this._state.cancelRequested = true;
  }
  finish() {
    this._state.phase = "done";
    this._state.currentFile = "";
    this._state.currentItemBytes = 0;
    this._state.currentItemTotalBytes = 0;
    this._state.currentItemComplete = false;
    this._state.currentActionType = void 0;
    this._state.cancelRequested = false;
  }
  /** Record a completed file */
  addCompletedFile(file) {
    this._state.completedFiles = retainFileProgress([
      ...this._state.completedFiles,
      file
    ]);
  }
  /** Update byte-level progress for the current file */
  setByteProgress(bytes, total) {
    const reportedBytes = Number.isFinite(bytes) ? Math.max(0, bytes) : 0;
    const reportedTotal = Number.isFinite(total) ? Math.max(0, total) : 0;
    const nextBytes = Math.max(this._state.currentItemBytes, reportedBytes);
    const nextTotal = Math.max(
      this._state.currentItemTotalBytes,
      reportedTotal,
      nextBytes
    );
    this._state.currentItemBytes = nextBytes;
    this._state.currentItemTotalBytes = nextTotal;
    this._state.currentItemComplete = false;
  }
  /** Mark the current plan item as settled without fabricating byte progress. */
  completeCurrentItem() {
    this._state.currentItemComplete = true;
  }
  /** Mark the sync as started */
  markStarted(activityKind = "fullSync") {
    this._state.activityKind = activityKind;
    this._state.startedAt = Date.now();
    this._state.cancelRequested = false;
    this._state.completedFiles = [];
  }
  /** Resume the visible side-action result batch without erasing earlier decisions. */
  resumeSideActionBatch() {
    this._state.activityKind = "sideAction";
    this._state.phase = "executing";
    this._state.currentFile = "";
    this._state.currentItemBytes = 0;
    this._state.currentItemTotalBytes = 0;
    this._state.currentItemComplete = false;
    this._state.currentActionType = void 0;
    this._state.cancelRequested = false;
    if (this._state.startedAt === 0) this._state.startedAt = Date.now();
  }
  /** Map a SyncActionType to a FileProgress status string */
  static actionToStatus(type) {
    switch (type) {
      case "upload" /* Upload */:
        return "upload";
      case "download" /* Download */:
        return "download";
      case "deleteRemote" /* DeleteRemote */:
      case "deleteLocal" /* DeleteLocal */:
        return "delete";
      case "renameRemote" /* RenameRemote */:
        return "upload";
      case "conflict" /* Conflict */:
      case "confirmLocalDelete" /* ConfirmLocalDelete */:
        return "conflict";
      case "skipLargeFile" /* SkipLargeFile */:
      case "skipIgnoredPath" /* SkipIgnoredPath */:
        return "skip";
      default:
        return "error";
    }
  }
};
function isSuccessfulFileProgress(file) {
  return file.status === "upload" || file.status === "download" || file.status === "delete";
}

// src/sync/remote-index-v2.ts
function projectRemoteIndexV2(index) {
  const pathById = /* @__PURE__ */ new Map();
  const visiting = /* @__PURE__ */ new Set();
  const resolvePath = (id) => {
    const cached = pathById.get(id);
    if (cached) return cached;
    if (visiting.has(id)) throw new Error(`Remote hierarchy cycle: ${id}`);
    const node = index.itemsById[id];
    if (!node) throw new Error(`Remote hierarchy missing node: ${id}`);
    visiting.add(id);
    let path;
    if (node.parentId === index.filesRootId) path = node.name;
    else {
      const parent = index.itemsById[node.parentId];
      if (!parent || parent.kind !== "folder") throw new Error(`Remote hierarchy missing parent: ${node.id}`);
      path = `${resolvePath(parent.id)}/${node.name}`;
    }
    visiting.delete(id);
    pathById.set(id, path);
    return path;
  };
  const seen = /* @__PURE__ */ new Map();
  for (const id of Object.keys(index.itemsById)) {
    const path = resolvePath(id);
    const normalized = path.normalize("NFC").toLocaleLowerCase();
    const existing = seen.get(normalized);
    if (existing && existing !== id) throw new Error(`Remote hierarchy duplicate path: ${path}`);
    seen.set(normalized, id);
  }
  return pathById;
}
function buildRemoteIndexV2(items, filesRootId, deltaLink, cursorRevision = 0) {
  const latest = /* @__PURE__ */ new Map();
  for (const item of items) latest.set(item.id, item);
  const nodes = /* @__PURE__ */ new Map();
  for (const item of latest.values()) {
    if (item.deleted) continue;
    if (!item.id || !item.name || !item.parentReference?.id || !item.file && !item.folder) {
      throw new Error(`Remote identity incomplete: ${item.id}`);
    }
    nodes.set(item.id, {
      id: item.id,
      parentId: item.parentReference.id,
      name: item.name,
      kind: item.folder ? "folder" : "file",
      eTag: item.eTag,
      cTag: item.cTag,
      size: item.size,
      mtime: item.lastModifiedDateTime ? new Date(item.lastModifiedDateTime).getTime() : void 0,
      contentHash: item.file?.hashes?.sha256Hash?.toLowerCase()
    });
  }
  const index = {
    schemaVersion: 2,
    filesRootId,
    cursorRevision,
    deltaLink,
    complete: true,
    itemsById: Object.fromEntries(nodes)
  };
  return { index, pathById: projectRemoteIndexV2(index) };
}

// src/sync/state-v2-migration.ts
async function readStateV2Manifest(adapter, path) {
  const exists = adapter.exists;
  if (typeof exists === "function" && !await exists.call(adapter, path)) return null;
  let value;
  try {
    value = JSON.parse(await adapter.read(path));
  } catch (error) {
    if (typeof exists !== "function") return null;
    throw new Error("V2 state manifest is unreadable");
  }
  if (!isManifest(value)) throw new Error("V2 state manifest has an unsupported format");
  return value;
}
function isManifest(value) {
  return isRecord(value) && value.schemaVersion === 2 && value.activeState === "state-v2.json" && Number.isSafeInteger(value.stateCommitSeq) && value.stateCommitSeq >= 1 && Number.isSafeInteger(value.lifecycleEpoch) && value.lifecycleEpoch >= 0 && isSyncScope(value.scope) && typeof value.migratedAt === "number" && value.legacyAutoSyncAllowed === false;
}

// src/sync/base-content-cache.ts
var TEXT_EXTENSIONS = /* @__PURE__ */ new Set([
  ".md",
  ".txt",
  ".json",
  ".css",
  ".js",
  ".ts",
  ".yaml",
  ".yml",
  ".html",
  ".xml",
  ".csv",
  ".jsx",
  ".tsx",
  ".mjs",
  ".cjs"
]);
var MAX_CACHE_SIZE = 2 * 1024 * 1024;
var MAX_TOTAL_BYTES = 10 * 1024 * 1024;
var MAX_ENTRIES = 5e3;
var CACHE_FILE = "base-content.json";
function stringRecordToMap(record) {
  const map = /* @__PURE__ */ new Map();
  for (const [key, value] of Object.entries(record)) {
    map.set(key, value);
  }
  return map;
}
function isTextFile(path) {
  const dot = path.lastIndexOf(".");
  if (dot === -1) return false;
  return TEXT_EXTENSIONS.has(path.slice(dot).toLowerCase());
}
var BaseContentCache = class {
  constructor() {
    /** path → trimmed content (no trailing newline guaranteed for consistent diff) */
    this.store = /* @__PURE__ */ new Map();
    /** Whether the in-memory store has changed since last save. */
    this.dirty = false;
  }
  // ---- public API ----
  /** Cache the baseline content for a file. Skips binary and oversized files.
   *  Evicts LRU entries when total size or count exceeds limits. */
  cache(path, content) {
    if (!isTextFile(path)) return;
    let text;
    if (typeof content === "string") {
      if (new TextEncoder().encode(content).byteLength > MAX_CACHE_SIZE) return;
      text = content;
    } else {
      if (content.byteLength > MAX_CACHE_SIZE) return;
      try {
        text = new TextDecoder("utf-8", { fatal: true }).decode(content);
      } catch {
        return;
      }
    }
    this.store.delete(path);
    this.store.set(path, text);
    this.evictLRU();
    this.dirty = true;
  }
  /** Get the cached baseline content, or undefined if not cached.
   *  Access bumps the entry to MRU position. */
  get(path) {
    const content = this.store.get(path);
    if (content !== void 0) {
      this.store.delete(path);
      this.store.set(path, content);
    }
    return content;
  }
  /** Evict least-recently-used entries until within limits. */
  evictLRU() {
    while (this.store.size > MAX_ENTRIES) {
      const oldest = this.store.keys().next().value;
      if (oldest === void 0) break;
      this.store.delete(oldest);
    }
    let total = 0;
    for (const content of this.store.values()) total += content.length;
    while (total > MAX_TOTAL_BYTES) {
      const oldest = this.store.keys().next().value;
      if (oldest === void 0) break;
      const removed = this.store.get(oldest) ?? "";
      total -= removed.length;
      this.store.delete(oldest);
    }
  }
  /** Remove entries for paths no longer in the active set. */
  prune(activePaths) {
    let removed = false;
    for (const path of this.store.keys()) {
      if (!activePaths.has(path)) {
        this.store.delete(path);
        removed = true;
      }
    }
    if (removed) this.dirty = true;
  }
  /** Load the cache from disk. Safe to call when the file doesn't exist yet. */
  async load(adapter, pluginDir) {
    try {
      const raw = await adapter.read(`${pluginDir}/${CACHE_FILE}`);
      const parsed = JSON.parse(raw);
      const nextStore = isStringRecord(parsed) ? stringRecordToMap(parsed) : /* @__PURE__ */ new Map();
      this.store = nextStore;
    } catch {
      this.store = /* @__PURE__ */ new Map();
    }
    this.dirty = false;
  }
  /** Persist the cache to disk. No-op if unchanged. */
  async save(adapter, pluginDir) {
    if (!this.dirty) return;
    const obj = {};
    for (const [path, content] of this.store) {
      obj[path] = content;
    }
    await adapter.write(
      `${pluginDir}/${CACHE_FILE}`,
      JSON.stringify(obj)
    );
    this.dirty = false;
  }
};

// src/sync/state-manager.ts
var KEY_BASE_SNAPSHOT = "easy-sync-base-snapshot";
var KEY_PENDING_CONFLICTS = "easy-sync-pending-conflicts";
var KEY_PENDING_DELETES = "easy-sync-pending-remote-deletes";
var KEY_PENDING_ISSUES = "easy-sync-pending-issues";
var KEY_LAST_SYNC_TIME = "easy-sync-last-sync-time";
var KEY_PLAN_REVIEW_ACTIVE = "easy-sync-plan-review-active";
var KEY_PLAN_REVIEW_COUNTS = "easy-sync-plan-review-counts";
var KEY_PLAN_REVIEW_ITEMS = "easy-sync-plan-review-items";
var KEY_PLAN_REVIEW_DIGEST = "easy-sync-plan-review-digest";
var KEY_PLAN_REVIEW_REVISION = "easy-sync-plan-review-revision";
var KEY_PLAN_REVIEW_SCOPE = "easy-sync-plan-review-scope";
var KEY_SYNC_HISTORY = "easy-sync-history";
var KEY_GENERATION = "easy-sync-generation";
var KEY_BOUND_ACCOUNT = "easy-sync-bound-account";
var KEY_MUTATION_LEDGER = "easy-sync-mutation-ledger";
var REMOTE_STATE_FILE = "remote-state.json";
var DEFAULT_DATA = {
  [KEY_BASE_SNAPSHOT]: {},
  [KEY_PENDING_CONFLICTS]: [],
  [KEY_PENDING_DELETES]: [],
  [KEY_PENDING_ISSUES]: [],
  [KEY_LAST_SYNC_TIME]: 0,
  [KEY_PLAN_REVIEW_ACTIVE]: false,
  [KEY_PLAN_REVIEW_COUNTS]: null,
  [KEY_PLAN_REVIEW_ITEMS]: [],
  [KEY_PLAN_REVIEW_DIGEST]: "",
  [KEY_PLAN_REVIEW_REVISION]: 0,
  [KEY_PLAN_REVIEW_SCOPE]: null,
  [KEY_SYNC_HISTORY]: [],
  [KEY_GENERATION]: 0,
  [KEY_BOUND_ACCOUNT]: "",
  [KEY_MUTATION_LEDGER]: []
};
function createDefaultData(generation = 0, planRevision = 0) {
  return {
    ...DEFAULT_DATA,
    [KEY_BASE_SNAPSHOT]: {},
    [KEY_PENDING_CONFLICTS]: [],
    [KEY_PENDING_DELETES]: [],
    [KEY_PENDING_ISSUES]: [],
    [KEY_PLAN_REVIEW_ITEMS]: [],
    [KEY_PLAN_REVIEW_DIGEST]: "",
    [KEY_PLAN_REVIEW_REVISION]: planRevision,
    [KEY_PLAN_REVIEW_SCOPE]: null,
    [KEY_SYNC_HISTORY]: [],
    [KEY_GENERATION]: generation,
    [KEY_BOUND_ACCOUNT]: "",
    [KEY_MUTATION_LEDGER]: []
  };
}
var StateManager = class {
  constructor(plugin) {
    this.plugin = plugin;
    this.pluginDataCommitQueue = Promise.resolve();
    this.remoteState = null;
    this.legacyStateAllowed = true;
    this.mutationLedgerCorrupt = false;
    this.baseContentCache = new BaseContentCache();
    this.data = createDefaultData();
  }
  /** Monotonically increasing counter — detects mid-sync resets or concurrent runs */
  get remoteGeneration() {
    return this.data[KEY_GENERATION];
  }
  /** Bump the generation counter and persist immediately. Called by reset() before clearing
   *  state (to abort any in-flight sync), and by sync completion (to signal success). */
  async incrementRemoteGeneration() {
    await this.save((current) => ({
      ...current,
      [KEY_GENERATION]: current[KEY_GENERATION] + 1
    }));
  }
  /** Load all state from plugin data */
  async load() {
    const saved = await this.plugin.loadData();
    if (saved) {
      const rawMutationLedger = saved[KEY_MUTATION_LEDGER];
      const mutationLedger = parseMutationLedger(rawMutationLedger);
      this.mutationLedgerCorrupt = rawMutationLedger !== void 0 && (!Array.isArray(rawMutationLedger) || mutationLedger.length !== rawMutationLedger.length);
      this.data = {
        [KEY_BASE_SNAPSHOT]: saved[KEY_BASE_SNAPSHOT] ?? {},
        [KEY_PENDING_CONFLICTS]: saved[KEY_PENDING_CONFLICTS] ?? [],
        [KEY_PENDING_DELETES]: saved[KEY_PENDING_DELETES] ?? [],
        [KEY_PENDING_ISSUES]: Array.isArray(saved[KEY_PENDING_ISSUES]) ? saved[KEY_PENDING_ISSUES] : [],
        [KEY_LAST_SYNC_TIME]: saved[KEY_LAST_SYNC_TIME] ?? 0,
        [KEY_PLAN_REVIEW_ACTIVE]: saved[KEY_PLAN_REVIEW_ACTIVE] ?? false,
        [KEY_PLAN_REVIEW_COUNTS]: saved[KEY_PLAN_REVIEW_COUNTS] ?? null,
        [KEY_PLAN_REVIEW_ITEMS]: saved[KEY_PLAN_REVIEW_ITEMS] ?? [],
        [KEY_PLAN_REVIEW_DIGEST]: saved[KEY_PLAN_REVIEW_DIGEST] ?? "",
        [KEY_PLAN_REVIEW_REVISION]: Number.isSafeInteger(saved[KEY_PLAN_REVIEW_REVISION]) && Number(saved[KEY_PLAN_REVIEW_REVISION]) >= 0 ? Number(saved[KEY_PLAN_REVIEW_REVISION]) : 0,
        [KEY_PLAN_REVIEW_SCOPE]: isSyncScope2(saved[KEY_PLAN_REVIEW_SCOPE]) ? saved[KEY_PLAN_REVIEW_SCOPE] : null,
        [KEY_SYNC_HISTORY]: Array.isArray(saved[KEY_SYNC_HISTORY]) ? saved[KEY_SYNC_HISTORY] : [],
        [KEY_GENERATION]: saved[KEY_GENERATION] ?? 0,
        [KEY_BOUND_ACCOUNT]: saved[KEY_BOUND_ACCOUNT] ?? "",
        [KEY_MUTATION_LEDGER]: mutationLedger
      };
    }
    this.remoteState = await this.loadRemoteState();
    await this.baseContentCache.load(
      this.plugin.app.vault.adapter,
      this.pluginDir
    );
    const paths = getEasySyncPaths(this.plugin.app.vault, this.plugin.manifest.id);
    if (typeof this.plugin.app.vault.adapter.exists === "function") {
      this.legacyStateAllowed = await readStateV2Manifest(
        this.plugin.app.vault.adapter,
        paths.stateV2ManifestFile
      ) === null;
    }
  }
  /** M14: persist sync state through the shared serialized queue.
   *  base-content.json remains an independent file, not PluginData. */
  save(buildNext) {
    return this.commitPluginData(buildNext, true);
  }
  /** Publish a complete PluginData candidate only after its durable write succeeds. */
  commitPluginData(buildNext, saveBaseContent = false) {
    const task = this.pluginDataCommitQueue.then(async () => {
      const next = buildNext(this.data);
      if (next === this.data) return;
      await this.persistPluginData(next);
      this.data = next;
      if (saveBaseContent) {
        await this.baseContentCache.save(
          this.plugin.app.vault.adapter,
          this.pluginDir
        );
      }
    });
    this.pluginDataCommitQueue = task.catch(() => void 0);
    return task;
  }
  persistPluginData(snapshot) {
    return this.plugin.updatePluginData((data) => {
      const snapshotRecord = snapshot;
      for (const key of Object.keys(snapshot)) {
        data[key] = snapshotRecord[key];
      }
    });
  }
  get pluginDir() {
    return this.plugin.manifest.dir ?? getPluginDir(this.plugin.app.vault, this.plugin.manifest.id);
  }
  async loadRemoteState() {
    try {
      const json = await this.plugin.app.vault.adapter.read(this.remoteStatePath);
      return parseRemoteState(JSON.parse(json));
    } catch {
      return null;
    }
  }
  async persistRemoteState(state) {
    await this.plugin.app.vault.adapter.write(
      this.remoteStatePath,
      JSON.stringify(state)
    );
  }
  get remoteStatePath() {
    return `${this.pluginDir}/${REMOTE_STATE_FILE}`;
  }
  // ---- Mutation recovery ledger ----
  get mutationLedger() {
    return this.data[KEY_MUTATION_LEDGER];
  }
  get hasMutationLedgerCorruption() {
    return this.mutationLedgerCorrupt;
  }
  async beginMutationIntent(intent) {
    if (this.mutationLedgerCorrupt) throw new Error("Mutation recovery ledger is corrupt");
    await this.commitPluginData((current) => {
      if (current[KEY_MUTATION_LEDGER].some((entry) => entry.intent.operationId === intent.operationId)) {
        throw new Error(`Duplicate mutation operation: ${intent.operationId}`);
      }
      if (current[KEY_MUTATION_LEDGER].some((entry) => entry.intent.path === intent.path)) {
        throw new Error(`Mutation already pending for path: ${intent.path}`);
      }
      return {
        ...current,
        [KEY_MUTATION_LEDGER]: [
          ...current[KEY_MUTATION_LEDGER],
          { intent, receipt: null }
        ]
      };
    });
  }
  async recordMutationReceipt(receipt) {
    if (this.mutationLedgerCorrupt) throw new Error("Mutation recovery ledger is corrupt");
    await this.commitPluginData((current) => {
      const index = current[KEY_MUTATION_LEDGER].findIndex(
        (entry) => entry.intent.operationId === receipt.operationId
      );
      if (index < 0) throw new Error(`Mutation intent missing: ${receipt.operationId}`);
      const entries = [...current[KEY_MUTATION_LEDGER]];
      entries[index] = { intent: entries[index].intent, receipt };
      return { ...current, [KEY_MUTATION_LEDGER]: entries };
    });
  }
  async abandonMutationIntent(operationId) {
    await this.commitPluginData((data) => {
      const current = data[KEY_MUTATION_LEDGER].find(
        (entry) => entry.intent.operationId === operationId
      );
      if (!current) return data;
      if (current.receipt) throw new Error(`Cannot abandon receipted mutation: ${operationId}`);
      return {
        ...data,
        [KEY_MUTATION_LEDGER]: data[KEY_MUTATION_LEDGER].filter(
          (entry) => entry.intent.operationId !== operationId
        )
      };
    });
  }
  /** Publish a receipted mutation's base/remote/pending checkpoint, then clear it. */
  async commitMutationCheckpoint(operationId) {
    const record = this.data[KEY_MUTATION_LEDGER].find(
      (entry) => entry.intent.operationId === operationId
    );
    if (!record?.receipt) throw new Error(`Mutation receipt missing: ${operationId}`);
    const checkpoint = record.receipt.checkpoint;
    assertRemoteUpsertsHaveParentIdentity(checkpoint.remoteUpserts);
    let nextRemote = this.remoteState;
    if (nextRemote && (checkpoint.remoteUpserts.length > 0 || checkpoint.remoteDeletes.length > 0)) {
      nextRemote = { ...nextRemote, entries: { ...nextRemote.entries } };
      for (const path of checkpoint.remoteDeletes) delete nextRemote.entries[path];
      for (const entry of checkpoint.remoteUpserts) nextRemote.entries[entry.path] = entry;
      await this.persistRemoteState(nextRemote);
    }
    await this.commitPluginData((current) => {
      const nextBase = { ...current[KEY_BASE_SNAPSHOT] };
      for (const path of checkpoint.baseRemovals) delete nextBase[path];
      for (const entry of checkpoint.baseUpserts) nextBase[entry.path] = entry;
      return {
        ...current,
        [KEY_BASE_SNAPSHOT]: nextBase,
        [KEY_PENDING_CONFLICTS]: current[KEY_PENDING_CONFLICTS].filter(
          (item) => !checkpoint.pendingConflictRemovals.includes(item.path)
        ),
        [KEY_PENDING_DELETES]: current[KEY_PENDING_DELETES].filter(
          (item) => !checkpoint.pendingDeleteRemovals.includes(item.path)
        ),
        [KEY_MUTATION_LEDGER]: current[KEY_MUTATION_LEDGER].filter(
          (entry) => entry.intent.operationId !== operationId
        )
      };
    });
    this.remoteState = nextRemote;
  }
  // ---- Base Snapshot (per-file persistence) ----
  get baseSnapshot() {
    return Object.values(this.data[KEY_BASE_SNAPSHOT]);
  }
  getBaseEntry(path) {
    return this.data[KEY_BASE_SNAPSHOT][path];
  }
  /** Update a single file's base entry immediately (per-file persistence) */
  async updateBaseEntry(entry) {
    await this.upsertBaseEntries([entry]);
  }
  /** Update multiple base entries with a single persistence write. */
  async upsertBaseEntries(entries) {
    await this.save((current) => {
      const nextBase = { ...current[KEY_BASE_SNAPSHOT] };
      let changed = false;
      for (const entry of entries) {
        if (sameBaseEntry(nextBase[entry.path], entry)) {
          continue;
        }
        nextBase[entry.path] = entry;
        changed = true;
      }
      return changed ? { ...current, [KEY_BASE_SNAPSHOT]: nextBase } : current;
    });
  }
  /** Commit exact-content evidence and retire its false conflict in one data write. */
  async reconcileIdenticalConflict(entry) {
    await this.save((current) => {
      const hasPending = current[KEY_PENDING_CONFLICTS].some(
        (item) => item.path === entry.path
      );
      const baseChanged = !sameBaseEntry(
        current[KEY_BASE_SNAPSHOT][entry.path],
        entry
      );
      if (!hasPending && !baseChanged) return current;
      return {
        ...current,
        [KEY_BASE_SNAPSHOT]: baseChanged ? { ...current[KEY_BASE_SNAPSHOT], [entry.path]: entry } : current[KEY_BASE_SNAPSHOT],
        [KEY_PENDING_CONFLICTS]: hasPending ? current[KEY_PENDING_CONFLICTS].filter((item) => item.path !== entry.path) : current[KEY_PENDING_CONFLICTS],
        // The reviewed bundle contains a digest of the old conflict. Retire it
        // instead of leaving a stale confirmation entry beside the new base.
        [KEY_PLAN_REVIEW_ACTIVE]: false,
        [KEY_PLAN_REVIEW_COUNTS]: null,
        [KEY_PLAN_REVIEW_ITEMS]: [],
        [KEY_PLAN_REVIEW_DIGEST]: "",
        [KEY_PLAN_REVIEW_SCOPE]: null
      };
    });
  }
  /** Remove a file from the base snapshot */
  async removeBaseEntry(path) {
    await this.save((current) => {
      if (!current[KEY_BASE_SNAPSHOT][path]) return current;
      const nextBase = { ...current[KEY_BASE_SNAPSHOT] };
      delete nextBase[path];
      return { ...current, [KEY_BASE_SNAPSHOT]: nextBase };
    });
  }
  // ---- Base Content Cache (for three-way merge) ----
  cacheBaseContent(path, content) {
    this.baseContentCache.cache(path, content);
  }
  getBaseContent(path) {
    return this.baseContentCache.get(path);
  }
  /** Batch-remove multiple files from the base snapshot in a single save.
   *  ponytail: mirrors upsertBaseEntries — collect all paths, one persist. */
  async removeBaseEntries(paths) {
    await this.save((current) => {
      const nextBase = { ...current[KEY_BASE_SNAPSHOT] };
      let changed = false;
      for (const path of paths) {
        if (nextBase[path]) {
          delete nextBase[path];
          changed = true;
        }
      }
      return changed ? { ...current, [KEY_BASE_SNAPSHOT]: nextBase } : current;
    });
  }
  /** Replace the entire base snapshot (used after first sync or full scan sync) */
  async setBaseSnapshot(entries) {
    const next = {};
    for (const entry of entries) {
      next[entry.path] = entry;
    }
    await this.save((current) => sameBaseSnapshot(current[KEY_BASE_SNAPSHOT], next) ? current : { ...current, [KEY_BASE_SNAPSHOT]: next });
  }
  // ---- Remote Snapshot / Delta ----
  get hasRemoteState() {
    return this.remoteState !== null;
  }
  get remoteSnapshot() {
    return Object.values(this.remoteState?.entries ?? {});
  }
  get remoteDeltaLink() {
    return this.remoteState?.deltaLink ?? null;
  }
  get remoteFolders() {
    return Object.values(this.remoteState?.folders ?? {});
  }
  get remoteScope() {
    return this.remoteState?.scope ?? null;
  }
  async setRemoteState(entries, deltaLink, scope = null, folders = []) {
    const nextEntries = {};
    for (const entry of entries) {
      nextEntries[entry.path] = entry;
    }
    const nextFolders = {};
    for (const folder of folders) {
      nextFolders[folder.driveId] = folder;
    }
    const current = this.remoteState;
    if (current?.deltaLink === deltaLink && sameSyncScope(current.scope, scope) && sameRemoteSnapshot(current.entries, nextEntries) && sameRemoteFolderSnapshot(current.folders, nextFolders)) {
      return;
    }
    const next = {
      version: 1,
      generation: this.data[KEY_GENERATION],
      scope,
      deltaLink,
      entries: nextEntries,
      folders: nextFolders
    };
    await this.persistRemoteState(next);
    this.remoteState = next;
  }
  async clearRemoteState() {
    if (!this.remoteState) return;
    await this.persistRemoteState(null);
    this.remoteState = null;
  }
  /** Commit a device-local sync-path change through the shared PluginData writer.
   *  Durable base history is preserved; stale review state and out-of-scope
   *  pending items are retired in the same physical write as the settings. */
  async commitSyncPathSettingsChange(isPathInScope, persistSettings) {
    if (this.mutationLedgerCorrupt || this.data[KEY_MUTATION_LEDGER].length > 0) {
      throw new Error("Cannot change sync paths while mutation recovery is unresolved");
    }
    await this.commitPluginData((current) => {
      const next = {
        ...current,
        [KEY_PENDING_CONFLICTS]: current[KEY_PENDING_CONFLICTS].filter(
          (item) => isPathInScope(item.path)
        ),
        [KEY_PENDING_DELETES]: current[KEY_PENDING_DELETES].filter(
          (item) => isPathInScope(item.path)
        ),
        [KEY_PENDING_ISSUES]: current[KEY_PENDING_ISSUES].filter(
          (item) => isPathInScope(item.path)
        ),
        [KEY_PLAN_REVIEW_ACTIVE]: false,
        [KEY_PLAN_REVIEW_COUNTS]: null,
        [KEY_PLAN_REVIEW_ITEMS]: [],
        [KEY_PLAN_REVIEW_DIGEST]: "",
        [KEY_PLAN_REVIEW_REVISION]: current[KEY_PLAN_REVIEW_REVISION] + 1,
        [KEY_PLAN_REVIEW_SCOPE]: null
      };
      persistSettings(next);
      return next;
    });
  }
  async applyRemoteMutations(upserts, deletedPaths) {
    assertRemoteUpsertsHaveParentIdentity(upserts);
    if (!this.remoteState) return;
    const next = {
      ...this.remoteState,
      entries: { ...this.remoteState.entries }
    };
    let changed = false;
    for (const path of deletedPaths) {
      if (next.entries[path]) {
        delete next.entries[path];
        changed = true;
      }
    }
    for (const entry of upserts) {
      if (sameRemoteEntry(next.entries[entry.path], entry)) continue;
      next.entries[entry.path] = entry;
      changed = true;
    }
    if (changed) {
      await this.persistRemoteState(next);
      this.remoteState = next;
    }
  }
  /** Convert a LocalFileEntry + RemoteFileEntry pair into a BaseFileEntry */
  static toBaseEntry(local, remote) {
    return {
      path: local.path,
      hash: local.hash,
      size: local.size,
      eTag: remote.eTag
    };
  }
  // ---- Pending Conflicts ----
  get pendingConflicts() {
    return this.data[KEY_PENDING_CONFLICTS];
  }
  async addPendingConflict(item) {
    await this.upsertPendingConflicts([item]);
  }
  async upsertPendingConflicts(items) {
    await this.save((current) => ({
      ...current,
      [KEY_PENDING_CONFLICTS]: upsertPlanItems(
        current[KEY_PENDING_CONFLICTS],
        items
      )
    }));
  }
  async removePendingConflict(path) {
    await this.save((current) => ({
      ...current,
      [KEY_PENDING_CONFLICTS]: current[KEY_PENDING_CONFLICTS].filter(
        (i) => i.path !== path
      )
    }));
  }
  async prunePendingConflicts(activePaths) {
    const active = new Set(activePaths);
    await this.save((current) => {
      const next = current[KEY_PENDING_CONFLICTS].filter(
        (item) => active.has(item.path)
      );
      return next.length === current[KEY_PENDING_CONFLICTS].length ? current : { ...current, [KEY_PENDING_CONFLICTS]: next };
    });
  }
  // ---- Pending Remote Deletes ----
  get pendingRemoteDeletes() {
    return this.data[KEY_PENDING_DELETES];
  }
  async addPendingDelete(item) {
    await this.upsertPendingDeletes([item]);
  }
  async upsertPendingDeletes(items) {
    await this.save((current) => ({
      ...current,
      [KEY_PENDING_DELETES]: upsertPlanItems(
        current[KEY_PENDING_DELETES],
        items
      )
    }));
  }
  async removePendingDelete(path) {
    await this.save((current) => ({
      ...current,
      [KEY_PENDING_DELETES]: current[KEY_PENDING_DELETES].filter(
        (i) => i.path !== path
      )
    }));
  }
  async prunePendingDeletes(activePaths) {
    const active = new Set(activePaths);
    await this.save((current) => {
      const next = current[KEY_PENDING_DELETES].filter(
        (item) => active.has(item.path)
      );
      return next.length === current[KEY_PENDING_DELETES].length ? current : { ...current, [KEY_PENDING_DELETES]: next };
    });
  }
  // ---- Pending file issues ----
  get pendingIssues() {
    return this.data[KEY_PENDING_ISSUES];
  }
  async reconcilePendingIssues(issues, resolvedPaths) {
    const resolved = new Set(resolvedPaths);
    await this.save((current) => {
      const byPath = new Map(
        current[KEY_PENDING_ISSUES].map((issue) => [issue.path, { ...issue }])
      );
      for (const path of resolved) {
        byPath.delete(path);
      }
      for (const issue of issues) {
        const nextIssue = { ...issue };
        const existing = byPath.get(issue.path);
        if (existing && issue.localHash === existing.localHash && (issue.remoteETag ?? "") === (existing.remoteETag ?? "")) {
          nextIssue.consecutiveFailures = (existing.consecutiveFailures ?? 1) + 1;
        } else if (existing && (issue.localHash !== existing.localHash || issue.remoteETag !== existing.remoteETag)) {
          nextIssue.consecutiveFailures = 1;
        }
        byPath.set(issue.path, nextIssue);
      }
      const next = [...byPath.values()];
      return samePendingIssues(current[KEY_PENDING_ISSUES], next) ? current : { ...current, [KEY_PENDING_ISSUES]: next };
    });
  }
  /** Reset all M17 circuit breaker counters. Call after auth scope change
   *  (re-login with broader permissions) so old failures don't block retries. */
  async resetCircuitBreakers() {
    await this.save((current) => {
      const nextIssues = current[KEY_PENDING_ISSUES].map((issue) => ({ ...issue }));
      let changed = false;
      for (const issue of nextIssues) {
        if (issue.consecutiveFailures && issue.consecutiveFailures > 0) {
          issue.consecutiveFailures = 0;
          changed = true;
        }
      }
      return changed ? { ...current, [KEY_PENDING_ISSUES]: nextIssues } : current;
    });
  }
  async prunePendingIssues(activePaths) {
    const active = new Set(activePaths);
    await this.save((current) => {
      const next = current[KEY_PENDING_ISSUES].filter(
        (issue) => active.has(issue.path)
      );
      return next.length === current[KEY_PENDING_ISSUES].length ? current : { ...current, [KEY_PENDING_ISSUES]: next };
    });
  }
  // ---- Plan Review ----
  get planReviewActive() {
    return this.data[KEY_PLAN_REVIEW_ACTIVE];
  }
  get planReviewCounts() {
    return this.data[KEY_PLAN_REVIEW_COUNTS];
  }
  get planReviewItems() {
    return this.data[KEY_PLAN_REVIEW_ITEMS];
  }
  get planReviewRevision() {
    return this.data[KEY_PLAN_REVIEW_REVISION];
  }
  get planReviewScope() {
    return this.data[KEY_PLAN_REVIEW_SCOPE];
  }
  get planReviewAuthorization() {
    if (!this.planReviewActive || this.planReviewRevision < 1 || !this.planReviewScope) return null;
    return {
      revision: this.planReviewRevision,
      scope: { ...this.planReviewScope }
    };
  }
  async setPlanReviewBundle(items, counts, scope) {
    const conflicts = items.filter((item) => item.type === "conflict" /* Conflict */);
    const deletes = items.filter((item) => item.type === "confirmLocalDelete" /* ConfirmLocalDelete */);
    await this.commitPluginData((current) => ({
      ...current,
      [KEY_PENDING_CONFLICTS]: upsertPlanItems(
        current[KEY_PENDING_CONFLICTS],
        conflicts
      ),
      [KEY_PENDING_DELETES]: upsertPlanItems(
        current[KEY_PENDING_DELETES],
        deletes
      ),
      [KEY_PLAN_REVIEW_ACTIVE]: true,
      [KEY_PLAN_REVIEW_COUNTS]: counts,
      [KEY_PLAN_REVIEW_ITEMS]: items.map(({ type, path, reason, local, remote }) => ({
        type,
        path,
        reason,
        localHash: local?.hash,
        remoteETag: remote?.eTag
      })),
      [KEY_PLAN_REVIEW_DIGEST]: planDigest(items),
      [KEY_PLAN_REVIEW_REVISION]: current[KEY_PLAN_REVIEW_REVISION] + 1,
      [KEY_PLAN_REVIEW_SCOPE]: { ...scope }
    }));
  }
  get planReviewDigest() {
    return this.data[KEY_PLAN_REVIEW_DIGEST] ?? "";
  }
  async clearPlanReview(expected) {
    let cleared = false;
    await this.commitPluginData((current) => {
      if (expected && (!current[KEY_PLAN_REVIEW_ACTIVE] || current[KEY_PLAN_REVIEW_REVISION] !== expected.revision || !sameSyncScope(current[KEY_PLAN_REVIEW_SCOPE], expected.scope))) return current;
      cleared = true;
      return {
        ...current,
        [KEY_PLAN_REVIEW_ACTIVE]: false,
        [KEY_PLAN_REVIEW_COUNTS]: null,
        [KEY_PLAN_REVIEW_ITEMS]: [],
        [KEY_PLAN_REVIEW_DIGEST]: "",
        [KEY_PLAN_REVIEW_SCOPE]: null
      };
    });
    return cleared;
  }
  // ---- Sync Time ----
  get lastSyncTime() {
    return this.data[KEY_LAST_SYNC_TIME];
  }
  async setLastSyncTime(time) {
    await this.save((current) => ({ ...current, [KEY_LAST_SYNC_TIME]: time }));
  }
  // ---- Account binding ----
  get boundAccountId() {
    return this.data[KEY_BOUND_ACCOUNT] ?? "";
  }
  /** False after the V2 manifest commits. Legacy V1 writers must fail closed. */
  get legacyAutoSyncAllowed() {
    return this.legacyStateAllowed;
  }
  /** Bind the vault to an account. Once bound, only this account can sync.
   *  Returns true if binding changed (needs save). */
  async bindAccount(accountId) {
    if (this.data[KEY_BOUND_ACCOUNT] === accountId) return;
    await this.save((current) => current[KEY_BOUND_ACCOUNT] === accountId ? current : { ...current, [KEY_BOUND_ACCOUNT]: accountId });
  }
  get syncHistory() {
    return this.data[KEY_SYNC_HISTORY];
  }
  async addSyncHistory(entry) {
    const normalized = { ...entry, files: retainFileProgress(entry.files) };
    await this.save((current) => ({
      ...current,
      [KEY_SYNC_HISTORY]: [
        normalized,
        ...current[KEY_SYNC_HISTORY].filter((item) => item.id !== entry.id)
      ].slice(0, 10)
    }));
  }
  // ---- Reset ----
  /** Clear all sync state (for "reset" functionality).
   *  Bumps generation BEFORE clearing so any in-flight sync detects the mismatch. */
  async reset() {
    if (!this.legacyStateAllowed) {
      throw new Error("Legacy reset is disabled after V2 state activation");
    }
    if (this.mutationLedgerCorrupt || this.data[KEY_MUTATION_LEDGER].length > 0) {
      throw new Error("Cannot reset while mutation recovery is unresolved");
    }
    await this.incrementRemoteGeneration();
    await this.save((current) => createDefaultData(
      current[KEY_GENERATION],
      current[KEY_PLAN_REVIEW_REVISION] + 1
    ));
    await this.persistRemoteState(null);
    this.remoteState = null;
  }
};
function sameBaseEntry(left, right) {
  return left?.hash === right.hash && left.size === right.size && left.eTag === right.eTag;
}
function sameBaseSnapshot(left, right) {
  const leftPaths = Object.keys(left);
  const rightPaths = Object.keys(right);
  return leftPaths.length === rightPaths.length && rightPaths.every((path) => sameBaseEntry(left[path], right[path]));
}
function parseRemoteState(value) {
  if (!value || typeof value !== "object") return null;
  const state = value;
  if (state.version !== 1) return null;
  if (typeof state.generation !== "number") state.generation = 0;
  const rawScope = state.scope;
  if (rawScope !== void 0 && rawScope !== null && !isSyncScope2(rawScope)) return null;
  if (state.deltaLink !== null && typeof state.deltaLink !== "string") return null;
  if (!state.entries || typeof state.entries !== "object" || Array.isArray(state.entries)) {
    return null;
  }
  for (const [path, entry] of Object.entries(state.entries)) {
    if (!isRemoteEntry(entry) || entry.path !== path) return null;
  }
  const rawFolders = state.folders;
  if (rawFolders !== void 0 && (!rawFolders || typeof rawFolders !== "object" || Array.isArray(rawFolders))) return null;
  const folders = rawFolders ?? {};
  for (const [driveId, folder] of Object.entries(folders)) {
    if (!isRemoteFolderEntry(folder) || folder.driveId !== driveId) return null;
  }
  return {
    version: 1,
    generation: state.generation ?? 0,
    scope: rawScope ?? null,
    deltaLink: state.deltaLink ?? null,
    entries: state.entries,
    folders
  };
}
function isSyncScope2(value) {
  if (!value || typeof value !== "object") return false;
  const scope = value;
  return typeof scope.accountId === "string" && typeof scope.driveId === "string" && typeof scope.vaultFolderId === "string" && typeof scope.filesRootId === "string";
}
function parseMutationLedger(value) {
  if (value === void 0) return [];
  if (!Array.isArray(value) || !value.every(isMutationLedgerEntry)) return [];
  return value;
}
function isMutationLedgerEntry(value) {
  if (!value || typeof value !== "object") return false;
  const entry = value;
  return isMutationIntent(entry.intent) && (entry.receipt === null || isMutationReceipt(entry.receipt, entry.intent.operationId));
}
function isMutationIntent(value) {
  if (!value || typeof value !== "object") return false;
  const intent = value;
  return intent.version === 1 && typeof intent.operationId === "string" && Number.isSafeInteger(intent.planRevision) && isSyncScope2(intent.scope) && (intent.action === "upload" || intent.action === "download" || intent.action === "deleteRemote" || intent.action === "renameRemote" || intent.action === "deleteLocal" || intent.action === "merge") && typeof intent.path === "string" && (intent.sourcePath === void 0 || typeof intent.sourcePath === "string") && isMutationLocalExpectation(intent.expectedLocal) && isMutationRemoteExpectation(intent.expectedRemote) && (intent.target === void 0 || isMutationVersion(intent.target)) && (intent.action !== "merge" || isExistingMutationLocalExpectation(intent.expectedLocal) && isExistingMutationRemoteExpectation(intent.expectedRemote) && isMutationVersion(intent.target)) && typeof intent.createdAt === "number";
}
function isExistingMutationLocalExpectation(value) {
  return Boolean(value && typeof value === "object" && value.exists === true);
}
function isExistingMutationRemoteExpectation(value) {
  return Boolean(value && typeof value === "object" && value.exists === true);
}
function isMutationVersion(value) {
  if (!value || typeof value !== "object") return false;
  const version = value;
  return typeof version.hash === "string" && /^[0-9a-f]{64}$/i.test(version.hash) && Number.isSafeInteger(version.size) && version.size >= 0;
}
function isMutationLocalExpectation(value) {
  if (!value || typeof value !== "object") return false;
  const expected = value;
  return expected.exists === false || expected.exists === true && typeof expected.hash === "string" && typeof expected.size === "number";
}
function isMutationRemoteExpectation(value) {
  if (!value || typeof value !== "object") return false;
  const expected = value;
  return expected.exists === false || expected.exists === true && typeof expected.driveId === "string" && typeof expected.eTag === "string" && typeof expected.size === "number" && (expected.sha256Hash === void 0 || typeof expected.sha256Hash === "string");
}
function isMutationReceipt(value, operationId) {
  if (!value || typeof value !== "object") return false;
  const receipt = value;
  if (receipt.version !== 1 || receipt.operationId !== operationId || typeof receipt.completedAt !== "number" || !receipt.checkpoint || typeof receipt.checkpoint !== "object") return false;
  const checkpoint = receipt.checkpoint;
  return Array.isArray(checkpoint.baseUpserts) && checkpoint.baseUpserts.every(isBaseEntry) && Array.isArray(checkpoint.baseRemovals) && checkpoint.baseRemovals.every((path) => typeof path === "string") && Array.isArray(checkpoint.remoteUpserts) && checkpoint.remoteUpserts.every(isRemoteEntry) && Array.isArray(checkpoint.remoteDeletes) && checkpoint.remoteDeletes.every((path) => typeof path === "string") && Array.isArray(checkpoint.pendingConflictRemovals) && checkpoint.pendingConflictRemovals.every((path) => typeof path === "string") && Array.isArray(checkpoint.pendingDeleteRemovals) && checkpoint.pendingDeleteRemovals.every((path) => typeof path === "string");
}
function isBaseEntry(value) {
  if (!value || typeof value !== "object") return false;
  const entry = value;
  return typeof entry.path === "string" && typeof entry.hash === "string" && typeof entry.size === "number" && typeof entry.eTag === "string";
}
function isRemoteEntry(value) {
  if (!value || typeof value !== "object") return false;
  const entry = value;
  return typeof entry.path === "string" && typeof entry.driveId === "string" && (entry.parentId === void 0 || typeof entry.parentId === "string") && typeof entry.size === "number" && typeof entry.mtime === "number" && typeof entry.eTag === "string" && typeof entry.cTag === "string";
}
function assertRemoteUpsertsHaveParentIdentity(entries) {
  const incomplete = entries.find((entry) => !entry.parentId);
  if (incomplete) {
    throw new Error(`Remote cache upsert is missing parent identity: ${incomplete.path}`);
  }
}
function isRemoteFolderEntry(value) {
  if (!value || typeof value !== "object") return false;
  const entry = value;
  return typeof entry.path === "string" && typeof entry.driveId === "string" && typeof entry.parentId === "string" && typeof entry.name === "string";
}
function sameRemoteEntry(left, right) {
  return left?.path === right.path && left.driveId === right.driveId && left.parentId === right.parentId && left.downloadUrl === right.downloadUrl && left.size === right.size && left.mtime === right.mtime && left.eTag === right.eTag && left.cTag === right.cTag && left.sha256Hash === right.sha256Hash;
}
function sameRemoteSnapshot(left, right) {
  const leftPaths = Object.keys(left);
  const rightPaths = Object.keys(right);
  return leftPaths.length === rightPaths.length && rightPaths.every((path) => sameRemoteEntry(left[path], right[path]));
}
function sameRemoteFolderSnapshot(left, right) {
  const leftIds = Object.keys(left);
  const rightIds = Object.keys(right);
  return leftIds.length === rightIds.length && rightIds.every((id) => {
    const current = left[id];
    const next = right[id];
    return current?.path === next.path && current.driveId === next.driveId && current.parentId === next.parentId && current.name === next.name;
  });
}
function upsertPlanItems(existing, incoming) {
  const byPath = new Map(existing.map((item) => [item.path, item]));
  for (const item of incoming) {
    byPath.set(item.path, item);
  }
  return [...byPath.values()];
}
function samePendingIssues(left, right) {
  return left.length === right.length && right.every((issue, index) => {
    const current = left[index];
    return current?.path === issue.path && current.actionType === issue.actionType && current.reason === issue.reason && current.updatedAt === issue.updatedAt;
  });
}

// src/sync/sync-executor.ts
var import_obsidian5 = require("obsidian");

// src/sync/operation-lifecycle.ts
var OperationLifecycle = class {
  constructor() {
    this.epoch = 0;
    this.invalidationReason = "initial";
  }
  capture() {
    return this.epoch;
  }
  isCurrent(epoch) {
    return epoch === this.epoch;
  }
  invalidate(reason) {
    this.epoch++;
    this.invalidationReason = reason;
    return this.epoch;
  }
  get currentEpoch() {
    return this.epoch;
  }
  get lastInvalidationReason() {
    return this.invalidationReason;
  }
};

// src/ui/notice-center.ts
var import_obsidian4 = require("obsidian");
var NOTICE_PRIORITY = {
  info: 10,
  progress: 20,
  action: 30,
  attention: 40,
  failure: 50,
  critical: 60
};
var DEFAULT_NOTICE_DURATION_MS = 5e3;
var EasySyncNoticeCenter = class {
  constructor(factory = (message, durationMs) => new import_obsidian4.Notice(message, durationMs)) {
    this.factory = factory;
    this.active = null;
    this.expiryTimer = null;
    this.resumable = null;
  }
  get activeKey() {
    return this.active?.request.key ?? null;
  }
  show(request) {
    const normalized = { ...request };
    if (normalized.resumable) this.resumable = normalized;
    if (this.active?.request.key === normalized.key) {
      const previousClassName = this.active.request.className;
      this.active.request = normalized;
      this.applyClasses(this.active.handle, normalized.className, previousClassName);
      this.active.handle.setMessage(this.materialize(normalized.message));
      this.scheduleExpiry(normalized);
      return true;
    }
    if (this.active && normalized.priority < this.active.request.priority) {
      return false;
    }
    this.hideActive();
    this.display(normalized);
    return true;
  }
  clear(key) {
    if (this.resumable?.key === key) this.resumable = null;
    if (this.active?.request.key === key) this.hideActive();
  }
  dispose() {
    this.resumable = null;
    this.hideActive();
  }
  display(request) {
    const handle = this.factory(this.materialize(request.message), 0);
    this.applyClasses(handle, request.className);
    this.active = { request, handle };
    this.scheduleExpiry(request);
  }
  materialize(message) {
    return typeof message === "function" ? message() : message;
  }
  applyClasses(handle, className, previousClassName) {
    const element = handle.noticeEl ?? handle.messageEl;
    if (!element) return;
    element.classList.add("easy-sync-notice");
    if (previousClassName && previousClassName !== className) {
      element.classList.remove(previousClassName);
    }
    if (className) element.classList.add(className);
  }
  scheduleExpiry(request) {
    compatClearTimeout(this.expiryTimer);
    this.expiryTimer = null;
    const durationMs = request.durationMs ?? DEFAULT_NOTICE_DURATION_MS;
    if (durationMs <= 0) return;
    this.expiryTimer = compatSetTimeout(() => {
      this.expiryTimer = null;
      const expiredKey = this.active?.request.key;
      this.hideActive();
      if (this.resumable && this.resumable.key !== expiredKey) {
        this.display(this.resumable);
      }
    }, durationMs);
  }
  hideActive() {
    compatClearTimeout(this.expiryTimer);
    this.expiryTimer = null;
    if (this.active) {
      this.hideImmediately(this.active.handle);
      this.active.handle.hide();
    }
    this.active = null;
  }
  /**
   * Obsidian keeps a hidden Notice in the DOM briefly for its exit animation.
   * Collapse the old host before creating the replacement so two EasySync
   * messages never compete visually during that transition.
   */
  hideImmediately(handle) {
    const element = handle.noticeEl ?? handle.messageEl;
    if (!element) return;
    element.classList.add("easy-sync-notice-hidden");
    const host = typeof element.closest === "function" ? element.closest(".notice") : null;
    if (host && host !== element) host.classList.add("easy-sync-notice-hidden");
  }
};

// src/sync/local-recovery-journal.ts
var LocalRecoveryJournal = class {
  constructor(adapter, tmpDir) {
    this.adapter = adapter;
    this.recoveryDir = `${tmpDir}/recovery`;
    this.intentPath = `${this.recoveryDir}/intent.json`;
    this.copiedOriginalPath = `${this.recoveryDir}/original.bin`;
  }
  async prepareCopiedOriginal(targetPath, expected, original, downloaded) {
    await this.ensureDir();
    await this.removeIfExists(this.copiedOriginalPath);
    if (expected) {
      if (!original) throw new Error(`Recovery source missing: ${targetPath}`);
      await this.assertBytesMatch(original, expected, "Recovery source changed");
      await this.adapter.writeBinary(this.copiedOriginalPath, original);
    } else if (original) {
      throw new Error(`Expected a missing local path before download: ${targetPath}`);
    }
    await this.writeIntent({
      version: 1,
      targetPath,
      recoveryPath: this.copiedOriginalPath,
      recoveryMode: "copy",
      expected: expected ? { hash: expected.hash, size: expected.size } : null,
      downloaded,
      createdAt: Date.now()
    });
  }
  async prepareRenamedOriginal(targetPath, expected, recoveryPath, downloaded) {
    await this.ensureDir();
    await this.writeIntent({
      version: 1,
      targetPath,
      recoveryPath,
      recoveryMode: "rename",
      expected: expected ? { hash: expected.hash, size: expected.size } : null,
      downloaded,
      createdAt: Date.now()
    });
  }
  async complete(intent) {
    const current = intent ?? await this.readIntent();
    if (await this.adapter.exists(this.intentPath)) {
      await this.adapter.remove(this.intentPath);
    }
    if (current) await this.removeIfExists(current.recoveryPath);
  }
  async recover() {
    const intent = await this.readIntent();
    if (!intent) return "none";
    const current = await this.readCurrentVersion(intent.targetPath);
    const currentIsExpected = versionsEqual(current, intent.expected);
    const currentIsDownloaded = versionsEqual(current, intent.downloaded);
    if (currentIsExpected) {
      await this.complete(intent);
      return "restored";
    }
    if (current && !currentIsDownloaded) {
      await this.complete(intent);
      return "preserved-newer";
    }
    if (intent.expected) {
      const recovery = await this.adapter.readBinary(intent.recoveryPath);
      await this.assertBytesMatch(recovery, intent.expected, "Recovery copy is invalid");
      await this.adapter.writeBinary(intent.targetPath, recovery);
      const restored = await this.readCurrentVersion(intent.targetPath);
      if (!versionsEqual(restored, intent.expected)) {
        throw new Error(`Recovery verification failed: ${intent.targetPath}`);
      }
    } else if (currentIsDownloaded) {
      await this.adapter.remove(intent.targetPath);
    }
    await this.complete(intent);
    return "restored";
  }
  async readIntent() {
    if (!await this.adapter.exists(this.intentPath)) return null;
    let parsed;
    try {
      parsed = JSON.parse(await this.adapter.read(this.intentPath));
    } catch {
      throw new Error("Local recovery journal is unreadable");
    }
    if (!isRecoveryIntent(parsed)) {
      throw new Error("Local recovery journal has an unsupported format");
    }
    return parsed;
  }
  async writeIntent(intent) {
    await this.adapter.write(this.intentPath, JSON.stringify(intent));
  }
  async readCurrentVersion(path) {
    const stat = await this.adapter.stat(path);
    if (!stat) return null;
    const bytes = await this.adapter.readBinary(path);
    return { hash: await sha256Hex(bytes), size: bytes.byteLength };
  }
  async assertBytesMatch(bytes, expected, label) {
    if (bytes.byteLength !== expected.size || await sha256Hex(bytes) !== expected.hash) {
      throw new Error(`${label}: hash or size mismatch`);
    }
  }
  async ensureDir() {
    const segments = this.recoveryDir.split("/");
    for (let i = 1; i <= segments.length; i++) {
      try {
        await this.adapter.mkdir(segments.slice(0, i).join("/"));
      } catch {
      }
    }
  }
  async removeIfExists(path) {
    try {
      if (await this.adapter.exists(path)) await this.adapter.remove(path);
    } catch {
    }
  }
};
function versionsEqual(a, b) {
  return a === null ? b === null : b !== null && a.hash === b.hash && a.size === b.size;
}
function isRecoveryVersion(value) {
  return typeof value === "object" && value !== null && typeof value.hash === "string" && typeof value.size === "number";
}
function isRecoveryIntent(value) {
  if (typeof value !== "object" || value === null) return false;
  const intent = value;
  return intent.version === 1 && typeof intent.targetPath === "string" && typeof intent.recoveryPath === "string" && (intent.recoveryMode === "copy" || intent.recoveryMode === "rename") && (intent.expected === null || isRecoveryVersion(intent.expected)) && isRecoveryVersion(intent.downloaded) && typeof intent.createdAt === "number";
}

// src/sync/merge-ready-store.ts
var MergeReadyStore = class {
  constructor(adapter, tmpDir) {
    this.adapter = adapter;
    this.directory = `${tmpDir}/merge-ready`;
    this.metadataPath = `${this.directory}/metadata.json`;
    this.payloadPath = `${this.directory}/payload.bin`;
  }
  async prepare(operationId, bytes, expected) {
    if (bytes.byteLength !== expected.size || await sha256Hex(bytes) !== expected.hash) {
      throw new Error("Merged payload does not match its target version");
    }
    await this.ensureDirectory();
    await this.removeIfExists(this.metadataPath);
    await this.removeIfExists(this.payloadPath);
    await this.adapter.writeBinary(this.payloadPath, bytes);
    const reread = await this.adapter.readBinary(this.payloadPath);
    if (reread.byteLength !== expected.size || await sha256Hex(reread) !== expected.hash) {
      throw new Error("Merged payload failed staged verification");
    }
    const metadata = {
      version: 1,
      operationId,
      hash: expected.hash,
      size: expected.size,
      createdAt: Date.now()
    };
    await this.adapter.write(this.metadataPath, JSON.stringify(metadata));
    const committed = await this.readMetadata();
    if (!committed || committed.operationId !== operationId || committed.hash !== expected.hash || committed.size !== expected.size) {
      throw new Error("Merged payload metadata failed verification");
    }
  }
  async read(operationId, expected) {
    const metadata = await this.readMetadata();
    if (!metadata || metadata.operationId !== operationId || metadata.hash !== expected.hash || metadata.size !== expected.size) return null;
    try {
      const bytes = await this.adapter.readBinary(this.payloadPath);
      if (bytes.byteLength !== expected.size || await sha256Hex(bytes) !== expected.hash) return null;
      return bytes;
    } catch {
      return null;
    }
  }
  async complete(operationId) {
    const metadata = await this.readMetadata();
    if (metadata && metadata.operationId !== operationId) return;
    await this.removeIfExists(this.metadataPath);
    await this.removeIfExists(this.payloadPath);
  }
  async readMetadata() {
    try {
      if (!await this.adapter.exists(this.metadataPath)) return null;
      const value = JSON.parse(await this.adapter.read(this.metadataPath));
      return value.version === 1 && typeof value.operationId === "string" && typeof value.hash === "string" && typeof value.size === "number" && typeof value.createdAt === "number" ? value : null;
    } catch {
      return null;
    }
  }
  async ensureDirectory() {
    const segments = this.directory.split("/");
    for (let index = 1; index <= segments.length; index++) {
      try {
        await this.adapter.mkdir(segments.slice(0, index).join("/"));
      } catch {
      }
    }
  }
  async removeIfExists(path) {
    try {
      if (await this.adapter.exists(path)) await this.adapter.remove(path);
    } catch {
    }
  }
};

// src/ui/diff-engine.ts
var MAX_TOTAL_LINES = 4e3;
var MAX_D = 1e3;
function myersDiff(a, b) {
  const N = a.length;
  const M = b.length;
  const MAX = N + M;
  const offset = MAX;
  const V = new Int32Array(2 * MAX + 1);
  let x = 0;
  let y = 0;
  while (x < N && y < M && a[x] === b[y]) {
    x++;
    y++;
  }
  const start = { x: 0, y: 0, u: x, v: y, k: 0, prev: null };
  V[offset] = x;
  if (x >= N && y >= M) {
    return buildDiff(a, b, start);
  }
  let snakes = /* @__PURE__ */ new Map();
  snakes.set(0, start);
  const Dcap = Math.min(MAX_D, MAX);
  for (let D = 1; D <= Dcap; D++) {
    const next = /* @__PURE__ */ new Map();
    for (let k = -D; k <= D; k += 2) {
      let x0;
      let prev;
      if (k === -D || k !== D && V[k - 1 + offset] < V[k + 1 + offset]) {
        prev = snakes.get(k + 1);
        x0 = prev.u;
      } else {
        prev = snakes.get(k - 1);
        x0 = prev.u + 1;
      }
      let y0 = x0 - k;
      x = x0;
      y = y0;
      while (x < N && y < M && a[x] === b[y]) {
        x++;
        y++;
      }
      V[k + offset] = x;
      const snake = { x: x0, y: y0, u: x, v: y, k, prev };
      next.set(k, snake);
      if (x >= N && y >= M) {
        return buildDiff(a, b, snake);
      }
    }
    snakes = next;
  }
  throw new Error("MAX_D exceeded");
}
function buildDiff(a, b, end) {
  const chain = [];
  let s = end;
  while (s) {
    chain.push(s);
    s = s.prev;
  }
  chain.reverse();
  const lines = [];
  let localNum = 1;
  let remoteNum = 1;
  for (let i = 0; i < chain.length; i++) {
    const snake = chain[i];
    const prev = i > 0 ? chain[i - 1] : null;
    if (prev) {
      if (snake.k < prev.k) {
        lines.push({
          type: "added",
          text: b[prev.v],
          lineNumber: { remote: remoteNum++ }
        });
      } else {
        lines.push({
          type: "removed",
          text: a[prev.u],
          lineNumber: { local: localNum++ }
        });
      }
    }
    for (let j = snake.x; j < snake.u; j++) {
      lines.push({
        type: "equal",
        text: a[j],
        lineNumber: { local: localNum++, remote: remoteNum++ }
      });
    }
  }
  return lines;
}
function computeDiff(localText, remoteText, maxTotalLines = MAX_TOTAL_LINES) {
  const localLines = localText.split("\n");
  const remoteLines = remoteText.split("\n");
  if (localLines.length + remoteLines.length > maxTotalLines) {
    return {
      lines: [],
      addedCount: remoteLines.length,
      removedCount: localLines.length,
      truncated: true,
      localSample: localLines.slice(0, 100),
      remoteSample: remoteLines.slice(0, 100),
      localTotalLines: localLines.length,
      remoteTotalLines: remoteLines.length
    };
  }
  try {
    const lines = myersDiff(localLines, remoteLines);
    let addedCount = 0;
    let removedCount = 0;
    for (const line of lines) {
      if (line.type === "added") addedCount++;
      else if (line.type === "removed") removedCount++;
    }
    return { lines, addedCount, removedCount, truncated: false };
  } catch {
    return {
      lines: [],
      addedCount: remoteLines.length,
      removedCount: localLines.length,
      truncated: true,
      localSample: localLines.slice(0, 100),
      remoteSample: remoteLines.slice(0, 100),
      localTotalLines: localLines.length,
      remoteTotalLines: remoteLines.length
    };
  }
}
var DISPLAY_CONTEXT_LINES = 3;
var MAX_EXACT_DISPLAY_REGION_LINES = 4e3;
var MAX_RENDERED_CHANGED_LINES_PER_REGION = 400;
var MAX_DISPLAY_PARTS = 200;
var MAX_ANCHOR_DEPTH = 6;
var SUMMARY_SAMPLE_LINES_PER_SIDE = 16;
function computeDisplayDiff(localText, remoteText) {
  const localLines = localText.split("\n");
  const remoteLines = remoteText.split("\n");
  const state = {
    parts: [],
    addedCount: 0,
    removedCount: 0,
    complete: true,
    exhausted: false
  };
  collectDisplayDiff(
    localLines,
    remoteLines,
    0,
    localLines.length,
    0,
    remoteLines.length,
    0,
    state
  );
  return {
    ...state,
    localTotalLines: localLines.length,
    remoteTotalLines: remoteLines.length
  };
}
function collectDisplayDiff(localLines, remoteLines, initialLocalStart, initialLocalEnd, initialRemoteStart, initialRemoteEnd, depth, state) {
  if (state.exhausted) return;
  if (initialLocalStart === initialLocalEnd && initialRemoteStart === initialRemoteEnd) return;
  if (state.parts.length >= MAX_DISPLAY_PARTS) {
    appendSummary(
      localLines,
      remoteLines,
      initialLocalStart,
      initialLocalEnd,
      initialRemoteStart,
      initialRemoteEnd,
      "display-budget",
      state
    );
    state.complete = false;
    state.exhausted = true;
    return;
  }
  let localStart = initialLocalStart;
  let localEnd = initialLocalEnd;
  let remoteStart = initialRemoteStart;
  let remoteEnd = initialRemoteEnd;
  while (localStart < localEnd && remoteStart < remoteEnd && localLines[localStart] === remoteLines[remoteStart]) {
    localStart++;
    remoteStart++;
  }
  while (localStart < localEnd && remoteStart < remoteEnd && localLines[localEnd - 1] === remoteLines[remoteEnd - 1]) {
    localEnd--;
    remoteEnd--;
  }
  if (localStart === localEnd && remoteStart === remoteEnd) return;
  const localLength = localEnd - localStart;
  const remoteLength = remoteEnd - remoteStart;
  if (localLength === 0 || remoteLength === 0) {
    const changedLines = localLength + remoteLength;
    if (changedLines <= MAX_RENDERED_CHANGED_LINES_PER_REGION) {
      appendExactRegion(
        localLines,
        remoteLines,
        localStart,
        localEnd,
        remoteStart,
        remoteEnd,
        state
      );
    } else {
      state.removedCount += localLength;
      state.addedCount += remoteLength;
      appendSummary(
        localLines,
        remoteLines,
        localStart,
        localEnd,
        remoteStart,
        remoteEnd,
        "change-budget",
        state
      );
    }
    return;
  }
  if (localLength + remoteLength <= MAX_EXACT_DISPLAY_REGION_LINES) {
    if (appendExactRegion(
      localLines,
      remoteLines,
      localStart,
      localEnd,
      remoteStart,
      remoteEnd,
      state
    )) return;
  }
  if (depth < MAX_ANCHOR_DEPTH) {
    const anchors = findPatienceAnchors(
      localLines,
      remoteLines,
      localStart,
      localEnd,
      remoteStart,
      remoteEnd
    );
    if (anchors.length > 0) {
      let nextLocal = localStart;
      let nextRemote = remoteStart;
      for (const anchor of anchors) {
        if (nextLocal < anchor.local || nextRemote < anchor.remote) {
          collectDisplayDiff(
            localLines,
            remoteLines,
            nextLocal,
            anchor.local,
            nextRemote,
            anchor.remote,
            depth + 1,
            state
          );
          if (state.exhausted) return;
        }
        nextLocal = anchor.local + 1;
        nextRemote = anchor.remote + 1;
      }
      if (nextLocal < localEnd || nextRemote < remoteEnd) {
        collectDisplayDiff(
          localLines,
          remoteLines,
          nextLocal,
          localEnd,
          nextRemote,
          remoteEnd,
          depth + 1,
          state
        );
      }
      return;
    }
  }
  appendSummary(
    localLines,
    remoteLines,
    localStart,
    localEnd,
    remoteStart,
    remoteEnd,
    "alignment-limit",
    state
  );
}
function appendExactRegion(localLines, remoteLines, localStart, localEnd, remoteStart, remoteEnd, state) {
  let contextBefore = 0;
  while (contextBefore < DISPLAY_CONTEXT_LINES && localStart - contextBefore > 0 && remoteStart - contextBefore > 0 && localLines[localStart - contextBefore - 1] === remoteLines[remoteStart - contextBefore - 1]) contextBefore++;
  let contextAfter = 0;
  while (contextAfter < DISPLAY_CONTEXT_LINES && localEnd + contextAfter < localLines.length && remoteEnd + contextAfter < remoteLines.length && localLines[localEnd + contextAfter] === remoteLines[remoteEnd + contextAfter]) contextAfter++;
  const expandedLocalStart = localStart - contextBefore;
  const expandedRemoteStart = remoteStart - contextBefore;
  const expandedLocalEnd = localEnd + contextAfter;
  const expandedRemoteEnd = remoteEnd + contextAfter;
  let lines;
  try {
    lines = myersDiff(
      localLines.slice(expandedLocalStart, expandedLocalEnd),
      remoteLines.slice(expandedRemoteStart, expandedRemoteEnd)
    );
  } catch {
    return false;
  }
  for (const line of lines) {
    if (line.lineNumber.local != null) line.lineNumber.local += expandedLocalStart;
    if (line.lineNumber.remote != null) line.lineNumber.remote += expandedRemoteStart;
  }
  let added = 0;
  let removed = 0;
  for (const line of lines) {
    if (line.type === "added") added++;
    else if (line.type === "removed") removed++;
  }
  state.addedCount += added;
  state.removedCount += removed;
  if (added + removed > MAX_RENDERED_CHANGED_LINES_PER_REGION) {
    appendSummary(
      localLines,
      remoteLines,
      localStart,
      localEnd,
      remoteStart,
      remoteEnd,
      "change-budget",
      state
    );
    return true;
  }
  for (const hunk of compactDiffHunks(lines)) {
    state.parts.push({ kind: "hunk", lines: hunk });
  }
  return true;
}
function compactDiffHunks(lines) {
  const changedIndexes = [];
  for (let index = 0; index < lines.length; index++) {
    if (lines[index].type !== "equal") changedIndexes.push(index);
  }
  if (changedIndexes.length === 0) return [];
  const ranges = [];
  for (const index of changedIndexes) {
    const start = Math.max(0, index - DISPLAY_CONTEXT_LINES);
    const end = Math.min(lines.length, index + DISPLAY_CONTEXT_LINES + 1);
    const previous = ranges[ranges.length - 1];
    if (previous && start <= previous.end) previous.end = Math.max(previous.end, end);
    else ranges.push({ start, end });
  }
  return ranges.map(({ start, end }) => lines.slice(start, end));
}
function appendSummary(localLines, remoteLines, localStart, localEnd, remoteStart, remoteEnd, reason, state) {
  if (reason === "alignment-limit") state.complete = false;
  state.parts.push({
    kind: "summary",
    reason,
    localStartLine: localStart + 1,
    localEndLine: localEnd,
    remoteStartLine: remoteStart + 1,
    remoteEndLine: remoteEnd,
    localSample: sampleLines(localLines, localStart, localEnd),
    remoteSample: sampleLines(remoteLines, remoteStart, remoteEnd),
    localOmittedLines: Math.max(0, localEnd - localStart - SUMMARY_SAMPLE_LINES_PER_SIDE),
    remoteOmittedLines: Math.max(0, remoteEnd - remoteStart - SUMMARY_SAMPLE_LINES_PER_SIDE)
  });
}
function sampleLines(lines, start, end) {
  const length = end - start;
  if (length <= SUMMARY_SAMPLE_LINES_PER_SIDE) {
    return lines.slice(start, end).map((text, index) => ({
      lineNumber: start + index + 1,
      text
    }));
  }
  const half = SUMMARY_SAMPLE_LINES_PER_SIDE / 2;
  return [
    ...lines.slice(start, start + half).map((text, index) => ({
      lineNumber: start + index + 1,
      text
    })),
    ...lines.slice(end - half, end).map((text, index) => ({
      lineNumber: end - half + index + 1,
      text
    }))
  ];
}
function findPatienceAnchors(localLines, remoteLines, localStart, localEnd, remoteStart, remoteEnd) {
  const localOccurrences = countOccurrences(localLines, localStart, localEnd);
  const remoteOccurrences = countOccurrences(remoteLines, remoteStart, remoteEnd);
  const pairs = [];
  for (const [line, local] of localOccurrences) {
    const remote = remoteOccurrences.get(line);
    if (local.count === 1 && remote?.count === 1) {
      pairs.push({ local: local.index, remote: remote.index });
    }
  }
  pairs.sort((left, right) => left.local - right.local);
  if (pairs.length <= 1) return pairs;
  const tails = [];
  const previous = new Int32Array(pairs.length);
  previous.fill(-1);
  for (let index = 0; index < pairs.length; index++) {
    let low = 0;
    let high = tails.length;
    while (low < high) {
      const middle = low + high >>> 1;
      if (pairs[tails[middle]].remote < pairs[index].remote) low = middle + 1;
      else high = middle;
    }
    if (low > 0) previous[index] = tails[low - 1];
    tails[low] = index;
  }
  const anchors = [];
  let cursor = tails[tails.length - 1];
  while (cursor != null && cursor >= 0) {
    anchors.push(pairs[cursor]);
    cursor = previous[cursor];
  }
  anchors.reverse();
  return anchors;
}
function countOccurrences(lines, start, end) {
  const counts = /* @__PURE__ */ new Map();
  for (let index = start; index < end; index++) {
    const line = lines[index];
    const existing = counts.get(line);
    if (existing) existing.count++;
    else counts.set(line, { count: 1, index });
  }
  return counts;
}

// src/sync/merge-engine.ts
var MERGE_MAX_TOTAL_LINES = 2e4;
function extractHunks(diff) {
  const hunks = [];
  let baseLine = 1;
  let i = 0;
  while (i < diff.length) {
    const line = diff[i];
    if (line.type === "equal") {
      baseLine++;
      i++;
      continue;
    }
    const baseStart = baseLine;
    let removedCount = 0;
    const added = [];
    while (i < diff.length && diff[i].type !== "equal") {
      if (diff[i].type === "removed") {
        removedCount++;
        baseLine++;
      } else {
        added.push(diff[i].text);
      }
      i++;
    }
    const baseEnd = removedCount > 0 ? baseStart + removedCount - 1 : baseStart - 1;
    hunks.push({ baseStart, baseEnd, lines: added });
  }
  return hunks;
}
function advancePast(basePos, hunk) {
  return hunk.baseEnd >= hunk.baseStart ? hunk.baseEnd + 1 : hunk.baseStart;
}
function threeWayMerge(base, local, remote) {
  base = normalizeLineEndings(base);
  local = normalizeLineEndings(local);
  remote = normalizeLineEndings(remote);
  if (local === remote) return { merged: local, hasConflicts: false };
  if (local === base) return { merged: remote, hasConflicts: false };
  if (remote === base) return { merged: local, hasConflicts: false };
  const baseLines = base.split("\n");
  const localDiff = computeDiff(base, local, MERGE_MAX_TOTAL_LINES);
  const remoteDiff = computeDiff(base, remote, MERGE_MAX_TOTAL_LINES);
  if (localDiff.truncated || remoteDiff.truncated) {
    return { merged: local, hasConflicts: true };
  }
  const localHunks = extractHunks(localDiff.lines);
  const remoteHunks = extractHunks(remoteDiff.lines);
  if (localHunks.some((localHunk) => remoteHunks.some((remoteHunk) => hunksOverlap(localHunk, remoteHunk)))) {
    return {
      merged: [
        "<<<<<<< Local",
        local,
        "=======",
        remote,
        ">>>>>>> Remote"
      ].join("\n"),
      hasConflicts: true
    };
  }
  const output = [];
  let hasConflicts = false;
  let basePos = 1;
  let localIdx = 0;
  let remoteIdx = 0;
  while (basePos <= baseLines.length) {
    const lHunk = localIdx < localHunks.length ? localHunks[localIdx] : null;
    const rHunk = remoteIdx < remoteHunks.length ? remoteHunks[remoteIdx] : null;
    const localTouchesBase = lHunk !== null && basePos >= lHunk.baseStart && basePos <= Math.max(lHunk.baseStart, lHunk.baseEnd);
    const remoteTouchesBase = rHunk !== null && basePos >= rHunk.baseStart && basePos <= Math.max(rHunk.baseStart, rHunk.baseEnd);
    if (!localTouchesBase && !remoteTouchesBase) {
      output.push(baseLines[basePos - 1]);
      basePos++;
    } else if (lHunk && localTouchesBase && !remoteTouchesBase) {
      for (const line of lHunk.lines) {
        output.push(line);
      }
      basePos = advancePast(basePos, lHunk);
      localIdx++;
    } else if (rHunk && !localTouchesBase && remoteTouchesBase) {
      for (const line of rHunk.lines) {
        output.push(line);
      }
      basePos = advancePast(basePos, rHunk);
      remoteIdx++;
    } else if (lHunk && rHunk) {
      hasConflicts = true;
      output.push("<<<<<<< Local");
      for (const line of lHunk.lines) {
        output.push(line);
      }
      output.push("=======");
      for (const line of rHunk.lines) {
        output.push(line);
      }
      output.push(">>>>>>> Remote");
      basePos = Math.max(
        advancePast(basePos, lHunk),
        advancePast(basePos, rHunk)
      );
      localIdx++;
      remoteIdx++;
    } else {
      output.push(baseLines[basePos - 1]);
      basePos++;
    }
  }
  while (localIdx < localHunks.length || remoteIdx < remoteHunks.length) {
    const lHunk = localIdx < localHunks.length ? localHunks[localIdx] : null;
    const rHunk = remoteIdx < remoteHunks.length ? remoteHunks[remoteIdx] : null;
    if (lHunk && rHunk) {
      hasConflicts = true;
      output.push("<<<<<<< Local");
      for (const line of lHunk.lines) output.push(line);
      output.push("=======");
      for (const line of rHunk.lines) output.push(line);
      output.push(">>>>>>> Remote");
      localIdx++;
      remoteIdx++;
    } else if (lHunk) {
      for (const line of lHunk.lines) output.push(line);
      localIdx++;
    } else if (rHunk) {
      for (const line of rHunk.lines) output.push(line);
      remoteIdx++;
    }
  }
  return { merged: output.join("\n"), hasConflicts };
}
function hunksOverlap(left, right) {
  const leftInsert = left.baseEnd < left.baseStart;
  const rightInsert = right.baseEnd < right.baseStart;
  if (leftInsert && rightInsert) return left.baseStart === right.baseStart;
  if (leftInsert) return left.baseStart >= right.baseStart && left.baseStart <= right.baseEnd;
  if (rightInsert) return right.baseStart >= left.baseStart && right.baseStart <= left.baseEnd;
  return left.baseStart <= right.baseEnd && right.baseStart <= left.baseEnd;
}
function normalizeLineEndings(content) {
  return content.replace(/\r\n?/g, "\n");
}

// src/sync/conservative-merge-v2.ts
var MAX_MERGE_INPUT_BYTES = 2 * 1024 * 1024;
async function evaluateConservativeMergeV2(input) {
  if (!input.lifecycleCurrent || !input.envelopeCommitCurrent || !input.localVersionCurrent || !input.remoteVersionCurrent || input.remote.remoteId !== input.expectedRemoteId || input.remote.eTag !== input.expectedRemoteETag) {
    return manual("stale-version");
  }
  if (input.recoveryPending) return manual("recovery-pending");
  if ([input.ancestor.bytes, input.local.bytes, input.remote.bytes].some((bytes) => bytes.byteLength > MAX_MERGE_INPUT_BYTES)) return manual("too-large");
  if (input.local.bytes.byteLength !== input.local.size || input.remote.bytes.byteLength !== input.remote.size) return manual("invalid-hash");
  const [ancestorHash, localHash, remoteHash] = await Promise.all([
    sha256Hex(input.ancestor.bytes),
    sha256Hex(input.local.bytes),
    sha256Hex(input.remote.bytes)
  ]);
  if (ancestorHash !== input.ancestor.hash || localHash !== input.local.hash || remoteHash !== input.remote.hash) return manual("invalid-hash");
  const ancestor = strictUtf8(input.ancestor.bytes);
  const local = strictUtf8(input.local.bytes);
  const remote = strictUtf8(input.remote.bytes);
  if (ancestor === null || local === null || remote === null) return manual("invalid-utf8");
  const lineEnding = sharedLineEnding([ancestor, local, remote]);
  if (lineEnding === null) return manual("mixed-line-endings");
  const merged = threeWayMerge(ancestor, local, remote);
  if (merged.hasConflicts) return manual("overlap");
  const mergedText = lineEnding === "\n" ? merged.merged : merged.merged.replace(/\n/g, lineEnding);
  const encoded = new TextEncoder().encode(mergedText).buffer;
  if (encoded.byteLength > MAX_MERGE_INPUT_BYTES) return manual("too-large");
  return {
    status: "ready",
    mergedText,
    mergedBytes: encoded,
    mergedHash: await sha256Hex(encoded),
    mutations: []
  };
}
function sharedLineEnding(contents) {
  const observed = /* @__PURE__ */ new Set();
  for (const content of contents) {
    let own = null;
    for (let index = 0; index < content.length; index++) {
      if (content[index] === "\r") {
        const current = content[index + 1] === "\n" ? "\r\n" : "\r";
        if (own && own !== current) return null;
        own = current;
        if (current === "\r\n") index++;
      } else if (content[index] === "\n") {
        if (own && own !== "\n") return null;
        own = "\n";
      }
    }
    if (own) observed.add(own);
  }
  if (observed.size > 1) return null;
  return observed.values().next().value ?? "\n";
}
function strictUtf8(bytes) {
  try {
    const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    const encoded = new TextEncoder().encode(text);
    if (encoded.byteLength !== bytes.byteLength) return null;
    const source = new Uint8Array(bytes);
    if (!encoded.every((value, index) => value === source[index])) return null;
    return text;
  } catch {
    return null;
  }
}
function manual(reason) {
  return { status: "manual", reason, mutations: [] };
}

// src/sync/read-only-shadow-v2.ts
var MAX_DIFFERENCES = 20;
function compareV1WithV2Shadow(input) {
  const report = {
    version: 1,
    status: "match",
    scope: { ...input.v2Scope },
    remoteCounts: { v1: input.v1RemoteEntries.length, v2: 0 },
    planCounts: { v1: input.v1Plan.items.length, v2: 0 },
    differences: [],
    mutations: [],
    manifestWrites: 0
  };
  if (!sameShadowScope(input.v1Scope, input.v2Scope)) {
    report.status = "rejected";
    report.rejectionReason = "scope-mismatch";
    report.differences.push({
      dimension: "scope",
      key: "active-scope",
      v1: scopeKey(input.v1Scope),
      v2: scopeKey(input.v2Scope)
    });
    return report;
  }
  let projection;
  try {
    projection = buildRemoteIndexV2(
      [...input.remoteItems],
      input.v2Scope.filesRootId,
      null
    );
  } catch (error) {
    report.status = "rejected";
    report.rejectionReason = "remote-identity-incomplete";
    report.rejectionDetail = error instanceof Error ? error.message : String(error);
    return report;
  }
  const itemById = new Map(input.remoteItems.map((item) => [item.id, item]));
  const v2RemoteEntries = [];
  for (const node of Object.values(projection.index.itemsById)) {
    if (node.kind !== "file") continue;
    const path = projection.pathById.get(node.id);
    if (!path || !input.includeRemotePath(path)) continue;
    const raw = itemById.get(node.id);
    v2RemoteEntries.push({
      path,
      driveId: node.id,
      parentId: node.parentId,
      downloadUrl: raw?.["@microsoft.graph.downloadUrl"],
      size: node.size ?? 0,
      mtime: node.mtime ?? 0,
      eTag: node.eTag ?? "",
      cTag: node.cTag ?? "",
      sha256Hash: node.contentHash
    });
  }
  report.remoteCounts.v2 = v2RemoteEntries.length;
  compareRemoteIdentity(input.v1RemoteEntries, v2RemoteEntries, report.differences);
  const v2Plan = new SyncEngine().generatePlan(
    [...input.localEntries],
    v2RemoteEntries,
    [...input.baseEntries],
    [...input.skippedLarge]
  );
  report.planCounts.v2 = v2Plan.items.length;
  comparePlans(input.v1Plan.items, v2Plan.items, report.differences);
  if (report.differences.length > 0) report.status = "mismatch";
  return report;
}
function compareRemoteIdentity(v1Entries, v2Entries, differences) {
  const v1 = new Map(v1Entries.map((entry) => [entry.driveId, entry.path]));
  const v2 = new Map(v2Entries.map((entry) => [entry.driveId, entry.path]));
  for (const id of /* @__PURE__ */ new Set([...v1.keys(), ...v2.keys()])) {
    const left = v1.get(id);
    const right = v2.get(id);
    if (left === right) continue;
    pushDifference(differences, {
      dimension: "remote-identity",
      key: id,
      v1: left,
      v2: right
    });
  }
}
function comparePlans(v1Items, v2Items, differences) {
  const v1 = countPlanSignatures(v1Items);
  const v2 = countPlanSignatures(v2Items);
  for (const signature of /* @__PURE__ */ new Set([...v1.keys(), ...v2.keys()])) {
    const left = v1.get(signature) ?? 0;
    const right = v2.get(signature) ?? 0;
    if (left === right) continue;
    pushDifference(differences, {
      dimension: "plan",
      key: signature,
      v1: String(left),
      v2: String(right)
    });
  }
}
function countPlanSignatures(items) {
  const counts = /* @__PURE__ */ new Map();
  for (const item of items) {
    const signature = [item.path, item.type, item.reason ?? "", item.renameFrom ?? ""].join("|");
    counts.set(signature, (counts.get(signature) ?? 0) + 1);
  }
  return counts;
}
function pushDifference(differences, difference) {
  if (differences.length < MAX_DIFFERENCES) differences.push(difference);
}
var sameShadowScope = sameSyncScope;
function scopeKey(scope) {
  return [scope.accountId, scope.driveId, scope.vaultFolderId, scope.filesRootId].join("/");
}

// src/sync/download-concurrency-policy.ts
var ADAPTIVE_DOWNLOAD_MAX_BYTES = 8 * 1024 * 1024;
var ADAPTIVE_DOWNLOAD_MAX_CONCURRENCY = 3;
var MIN_HEALTHY_BATCH_BYTES = 128 * 1024;
var MIN_HEALTHY_THROUGHPUT_BPS = 512 * 1024;
var SIGNIFICANT_THROUGHPUT_DROP_RATIO = 0.5;
var DownloadConcurrencyPolicy = class {
  constructor() {
    this.stableBatches = 0;
    this.peakThroughputBps = 0;
    this.lockedSerial = false;
    this.concurrency = 1;
  }
  get limit() {
    return this.concurrency;
  }
  get isLockedSerial() {
    return this.lockedSerial;
  }
  observeBatch(observation) {
    if (this.lockedSerial) return;
    if (observation.failed || observation.degradedPath) {
      this.lockSerial();
      return;
    }
    const elapsedSeconds = Math.max(1, observation.elapsedMs) / 1e3;
    const throughputBps = Math.max(0, observation.bytes) / elapsedSeconds;
    const hasBandwidthEvidence = observation.files > 0 && observation.bytes >= MIN_HEALTHY_BATCH_BYTES && throughputBps >= MIN_HEALTHY_THROUGHPUT_BPS;
    if (!hasBandwidthEvidence) {
      this.stableBatches = 0;
      this.concurrency = 1;
      return;
    }
    if (this.stableBatches >= 2 && this.peakThroughputBps > 0 && throughputBps < this.peakThroughputBps * SIGNIFICANT_THROUGHPUT_DROP_RATIO) {
      this.lockSerial();
      return;
    }
    this.peakThroughputBps = Math.max(this.peakThroughputBps, throughputBps);
    this.stableBatches++;
    if (this.stableBatches >= 4) {
      this.concurrency = ADAPTIVE_DOWNLOAD_MAX_CONCURRENCY;
    } else if (this.stableBatches >= 2) {
      this.concurrency = 2;
    }
  }
  lockSerial() {
    this.lockedSerial = true;
    this.concurrency = 1;
  }
};

// src/sync/content-equality.ts
function resolveContentEquality(input) {
  if (input.local.size !== input.remote.size) {
    return { status: "different", proof: "sizeMismatch" };
  }
  if (input.remote.sha256Hash) {
    return input.local.hash === input.remote.sha256Hash.toLowerCase() ? { status: "equal", proof: "remoteSha256" } : { status: "different", proof: "remoteSha256" };
  }
  if (input.base?.eTag === input.remote.eTag) {
    return input.local.hash === input.base.hash && input.local.size === input.base.size ? { status: "equal", proof: "baseETag" } : { status: "different", proof: "baseETag" };
  }
  if (input.downloadedHash) {
    return input.local.hash === input.downloadedHash.toLowerCase() ? { status: "equal", proof: "downloadedSha256" } : { status: "different", proof: "downloadedSha256" };
  }
  return { status: "unknown", proof: "insufficientEvidence" };
}
async function compareContentBuffers(local, remote) {
  const [localHash, remoteHash] = await Promise.all([
    sha256Hex(local),
    sha256Hex(remote)
  ]);
  return {
    status: local.byteLength === remote.byteLength && localHash === remoteHash ? "equal" : "different",
    localHash,
    remoteHash,
    decodedTextEqual: new TextDecoder().decode(local) === new TextDecoder().decode(remote)
  };
}

// src/sync/automatic-handling-policy.ts
var DEFAULT_AUTOMATIC_HANDLING_POLICY = {
  autoDeleteLocalFiles: false,
  mergeNonOverlappingText: true
};
function isAutomaticTextMergeCandidatePath(path, configDir) {
  if (!isTextFile(path)) return false;
  const normalizedConfigDir = configDir.replace(/\/+$/, "");
  return normalizedConfigDir.length === 0 || path !== normalizedConfigDir && !path.startsWith(`${normalizedConfigDir}/`);
}
function readAutomaticHandlingPolicy(value, legacyAutoMerge) {
  const candidate = typeof value === "object" && value !== null ? value : {};
  const mergeFallback = typeof legacyAutoMerge === "boolean" ? legacyAutoMerge : DEFAULT_AUTOMATIC_HANDLING_POLICY.mergeNonOverlappingText;
  return {
    autoDeleteLocalFiles: typeof candidate.autoDeleteLocalFiles === "boolean" ? candidate.autoDeleteLocalFiles : DEFAULT_AUTOMATIC_HANDLING_POLICY.autoDeleteLocalFiles,
    mergeNonOverlappingText: typeof candidate.mergeNonOverlappingText === "boolean" ? candidate.mergeNonOverlappingText : mergeFallback
  };
}
function applyAutomaticHandlingPolicy(items, policy) {
  if (!policy.autoDeleteLocalFiles) return items;
  return items.map((item) => item.type === "confirmLocalDelete" /* ConfirmLocalDelete */ && !isObsidianManagedConfigPath(item.path) ? { ...item, type: "deleteLocal" /* DeleteLocal */ } : item);
}

// src/sync/sync-executor.ts
var IncrementalRemoteHierarchyError = class extends Error {
  constructor(message) {
    super(message);
    this.name = "IncrementalRemoteHierarchyError";
  }
};
var SMALL_UPLOAD_CONCURRENCY = 5;
var CONCURRENT_UPLOAD_MAX_BYTES = 8 * 1024 * 1024;
var LARGE_UPLOAD_CONCURRENCY = 2;
var MOBILE_SMALL_UPLOAD_CONCURRENCY = 2;
var MOBILE_LARGE_UPLOAD_CONCURRENCY = 1;
var MOBILE_STREAM_DOWNLOAD_MIN_BYTES = 8 * 1024 * 1024;
var SideMutationNotAppliedError = class extends Error {
  constructor(original, noticeAlreadyShown = false) {
    super(original instanceof Error ? original.message : "Reviewed mutation was not applied");
    this.original = original;
    this.noticeAlreadyShown = noticeAlreadyShown;
    this.name = "SideMutationNotAppliedError";
  }
};
var LocalCommitPreconditionError = class extends Error {
};
function createFileTransferMetrics() {
  return {
    started: 0,
    succeeded: 0,
    failed: 0,
    cancelled: 0,
    skipped: 0,
    logicalBytes: 0,
    activeConcurrency: 0,
    peakConcurrency: 0,
    stagesMs: {
      sourceRead: 0,
      contentTransfer: 0,
      contentHash: 0,
      remoteVersionVerify: 0,
      localVersionGuard: 0,
      localCommit: 0
    }
  };
}
function createAutomaticHandlingMetrics(policy) {
  return {
    policy: { ...policy },
    deleteLocal: {
      candidates: 0,
      completed: 0,
      failed: 0
    },
    textMerge: {
      candidates: 0,
      completed: 0,
      keptManual: 0,
      failed: 0,
      cancelled: 0,
      manualReasons: {}
    },
    mergeRecovery: {
      records: 0,
      receiptCommitted: 0,
      notApplied: 0,
      remoteCommittedLocalRecovered: 0,
      remoteCommittedLocalPending: 0,
      unresolved: 0
    },
    recoveryPendingAtEnd: {
      deleteLocal: 0,
      merge: 0
    }
  };
}
function recordAutomaticMergeManual(metrics, reason) {
  metrics.textMerge.keptManual++;
  metrics.textMerge.manualReasons[reason] = (metrics.textMerge.manualReasons[reason] ?? 0) + 1;
  return null;
}
var SyncExecutor = class {
  constructor(onedrive, scanner, engine, state, vaultName, i18n, progressStore, diag, fileManager, onProgressUpdate, lifecycle = new OperationLifecycle(), noticeCenter = new EasySyncNoticeCenter()) {
    this.onedrive = onedrive;
    this.scanner = scanner;
    this.engine = engine;
    this.state = state;
    this.vaultName = vaultName;
    this.i18n = i18n;
    this.progressStore = progressStore;
    this.diag = diag;
    this.fileManager = fileManager;
    this.onProgressUpdate = onProgressUpdate;
    this.lifecycle = lifecycle;
    this.noticeCenter = noticeCenter;
    this.running = false;
    this.sideActionRunning = false;
    this.sideActionQueue = Promise.resolve();
    this.queuedSideActionPaths = /* @__PURE__ */ new Set();
    this.sideActionBatchTotal = 0;
    this.sideActionBatchSettled = 0;
    this.cancelled = false;
    this.cancelController = null;
    this.startGeneration = 0;
    this.mutationSequence = 0;
    this.activeSyncScope = null;
    this.remoteRecoveryPreviewRequired = false;
    this.localVersionRecoveredDuringLedger = false;
    this.v2ShadowIdentityInput = null;
    this.automaticHandlingPolicy = {
      ...DEFAULT_AUTOMATIC_HANDLING_POLICY
    };
  }
  t(key, params) {
    return this.i18n?.t(key, params) ?? key;
  }
  /** Show a translated notice to the user */
  notice(key, params) {
    const priority = key === "result.legacyStateDisabled" || key === "result.authExpired" || key === "notice.localRecoveryFailed" || key === "notice.sideActionScopeChanged" || key === "notice.sideActionMutationRecoveryFailed" ? NOTICE_PRIORITY.critical : key.endsWith(".failed") || key === "notice.conflict.downloadFailed" ? NOTICE_PRIORITY.failure : NOTICE_PRIORITY.action;
    this.noticeCenter.show({
      key: `side-action:${key}:${params?.path ?? ""}`,
      message: this.t(key, params),
      priority,
      className: "easy-sync-notice-action"
    });
  }
  get isRunning() {
    return this.running;
  }
  setAutomaticHandlingPolicy(policy) {
    this.automaticHandlingPolicy = { ...policy };
  }
  get hasSideActionsInFlight() {
    return this.sideActionRunning || this.queuedSideActionPaths.size > 0;
  }
  isSideActionQueued(path) {
    return this.queuedSideActionPaths.has(path);
  }
  cancel() {
    this.invalidateLifecycle("cancel");
  }
  invalidateLifecycle(reason) {
    this.cancelled = true;
    this.lifecycle.invalidate(reason);
    this.cancelController?.abort();
  }
  get hasActivityInFlight() {
    return this.running || this.hasSideActionsInFlight;
  }
  markCancelled(result) {
    result.message = this.t("result.cancelled");
  }
  canContinue(epoch, result) {
    return !this.cancelled && this.lifecycle.isCurrent(epoch) && !result?.authExpired;
  }
  shouldStop(result, epoch) {
    if (this.canContinue(epoch, result)) return false;
    this.markCancelled(result);
    return true;
  }
  localMatchesRemoteHash(local, remote) {
    return Boolean(remote.sha256Hash) && resolveContentEquality({
      local,
      remote: { ...remote, eTag: "" }
    }).status === "equal";
  }
  async inspectLocalPath(path) {
    const scanner = this.scanner;
    if (typeof scanner.inspectFile !== "function") return null;
    return scanner.inspectFile(path);
  }
  localExpectationMatches(expected, current) {
    if (current.status === "uncertain") return false;
    if (!expected) return current.status === "missing";
    return current.status === "present" && Boolean(current.entry) && current.entry.hash === expected.hash && current.entry.size === expected.size;
  }
  /** Read-only eligibility gate used before adaptive network prefetch. */
  async canPrefetchDownload(item) {
    if (import_obsidian5.Platform.isMobile || item.type !== "download" /* Download */ || !item.remote || item.remote.size > ADAPTIVE_DOWNLOAD_MAX_BYTES) return false;
    const current = await this.inspectLocalPath(item.path);
    return current === null || this.localExpectationMatches(item.local, current);
  }
  /** Compare the current local file with the exact version shown to the user.
   *  Legacy scanner doubles do not expose inspectFile(); production always does. */
  async reviewedLocalVersionStillMatches(path, expected) {
    const current = await this.inspectLocalPath(path);
    return current === null || this.localExpectationMatches(expected, current);
  }
  async guardReviewedLocalVersion(path, expected, noticeKey) {
    try {
      if (await this.reviewedLocalVersionStillMatches(path, expected)) return true;
    } catch (error) {
      this.diag?.warn(
        "execute",
        `local version check failed before reviewed action \u2014 ${path}`,
        error instanceof Error ? error.message : String(error)
      );
    }
    this.diag?.warn("execute", `reviewed action blocked \u2014 ${path} changed locally`);
    this.notice(noticeKey, { path, reason: this.t("notice.localChangedSinceReview") });
    return false;
  }
  createDecisionToken(item) {
    const scope = this.activeSyncScope ?? this.state.remoteScope;
    if (!scope) throw new Error("Cannot bind a decision token without a complete sync scope");
    const ancestor = typeof this.state.getBaseEntry === "function" ? this.state.getBaseEntry(item.path) : this.state.baseSnapshot.find((entry) => entry.path === item.path);
    return {
      version: 1,
      vaultName: this.vaultName,
      accountId: this.state.boundAccountId ?? "",
      scope: { ...scope },
      local: item.local ? { exists: true, hash: item.local.hash, size: item.local.size } : { exists: false },
      remote: item.remote ? { exists: true, driveId: item.remote.driveId, eTag: item.remote.eTag } : { exists: false },
      ancestorHash: ancestor?.hash ?? null
    };
  }
  withDecisionToken(item) {
    return { ...item, decisionToken: this.createDecisionToken(item) };
  }
  bindPendingDecisionTokens(plan) {
    plan.items = plan.items.map(
      (item) => item.type === "conflict" /* Conflict */ || item.type === "confirmLocalDelete" /* ConfirmLocalDelete */ ? this.withDecisionToken(item) : item
    );
  }
  decisionTokenMatchesSnapshot(item) {
    const token = item.decisionToken;
    if (!isSyncDecisionToken(token) || token.vaultName !== this.vaultName || token.accountId !== (this.state.boundAccountId ?? "") || !sameSyncScope(token.scope, this.activeSyncScope ?? this.state.remoteScope)) return false;
    if (token.local.exists !== Boolean(item.local)) return false;
    if (token.local.exists && (!item.local || token.local.hash !== item.local.hash || token.local.size !== item.local.size)) return false;
    if (token.remote.exists !== Boolean(item.remote)) return false;
    if (token.remote.exists && (!item.remote || token.remote.driveId !== item.remote.driveId || token.remote.eTag !== item.remote.eTag)) return false;
    const ancestor = this.state.baseSnapshot.find((entry) => entry.path === item.path);
    return token.ancestorHash === (ancestor?.hash ?? null);
  }
  guardDecisionToken(item, noticeKey) {
    if (this.decisionTokenMatchesSnapshot(item)) return true;
    this.diag?.warn("execute", `reviewed action blocked \u2014 missing or stale decision token for ${item.path}`);
    this.notice(noticeKey, { path: item.path, reason: this.t("notice.decisionExpired") });
    return false;
  }
  async inspectRemotePath(path, metadataReason = "other") {
    const current = await this.onedrive.getFileMetadata(
      this.vaultName,
      path,
      metadataReason
    );
    if (!current) return void 0;
    return {
      path,
      driveId: current.driveId,
      parentId: current.parentId,
      downloadUrl: current.downloadUrl,
      size: current.size,
      mtime: current.mtime,
      eTag: current.eTag,
      cTag: "",
      sha256Hash: current.sha256Hash
    };
  }
  async guardReviewedRemoteVersion(item, noticeKey, pendingKind) {
    const token = item.decisionToken;
    if (!token) return false;
    const path = item.remote?.path ?? item.path;
    let current;
    try {
      current = await this.inspectRemotePath(path);
    } catch (error) {
      this.notice(noticeKey, {
        path: item.path,
        reason: error instanceof Error ? error.message : this.t("general.unknown")
      });
      return false;
    }
    const matches = token.remote.exists ? Boolean(current && current.driveId === token.remote.driveId && current.eTag === token.remote.eTag) : !current;
    if (matches) return true;
    const refreshed = {
      type: "conflict" /* Conflict */,
      path: item.path,
      local: item.local,
      remote: current,
      reason: item.local && current ? "reason.bothSidesModified" : item.local ? "reason.remoteDeletedLocalModified" : "reason.localDeletedRemoteModified"
    };
    await this.state.addPendingConflict(this.withDecisionToken(refreshed));
    if (pendingKind === "delete") await this.state.removePendingDelete(item.path);
    this.notice(noticeKey, { path: item.path, reason: this.t("notice.decisionExpired") });
    return false;
  }
  async guardDownloadLocalVersion(item, result, operationEpoch) {
    const current = await this.inspectLocalPath(item.path);
    if (!current) return null;
    if (current.status === "uncertain") {
      throw new Error(`Local version could not be verified before write: ${item.path}`);
    }
    if (this.localExpectationMatches(item.local, current)) return null;
    const currentEntry = current.status === "present" ? current.entry : void 0;
    if (currentEntry && item.remote) {
      const base = this.state.baseSnapshot.find((entry) => entry.path === item.path);
      let equality = resolveContentEquality({
        local: currentEntry,
        remote: item.remote,
        base
      });
      if (equality.status === "unknown" && Boolean(item.local) && currentEntry.size === item.remote.size && item.remote.size <= ADAPTIVE_DOWNLOAD_MAX_BYTES) {
        try {
          const remoteContent = await this.onedrive.downloadFile(
            this.vaultName,
            item.path,
            item.remote.downloadUrl,
            item.remote.driveId,
            item.remote.size
          );
          const downloaded = {
            size: remoteContent.byteLength,
            hash: await sha256Hex(remoteContent)
          };
          await this.verifyDownloadedPayload(item.path, item.remote, downloaded);
          equality = resolveContentEquality({
            local: currentEntry,
            remote: item.remote,
            base,
            downloadedHash: downloaded.hash
          });
          this.diag?.log(
            "execute",
            `download race equality fallback ${equality.status} \u2014 ${item.path}`
          );
        } catch (error) {
          this.diag?.warn(
            "execute",
            `download race equality fallback unavailable \u2014 ${item.path}: ${this.failureReason(error)}`
          );
        }
      }
      if (equality.status === "equal") {
        return {
          executed: true,
          baseUpsert: StateManager.toBaseEntry(currentEntry, item.remote)
        };
      }
    }
    this.diag?.warn(
      "execute",
      `download blocked \u2014 ${item.path} local version no longer matches the scan expectation`
    );
    return this.queuePendingConflict({
      ...item,
      type: "conflict" /* Conflict */,
      local: currentEntry,
      reason: item.local ? current.status === "missing" ? "reason.localDeletedRemoteModified" : "reason.bothSidesModified" : "reason.newFileBothSides"
    }, result, operationEpoch);
  }
  async verifyDownloadedPayload(path, remote, downloaded, remoteVersionAlreadyVerified = false) {
    if (downloaded.size !== remote.size) {
      throw new Error(`Downloaded size mismatch: ${path} (${downloaded.size} != ${remote.size})`);
    }
    if (remote.sha256Hash) {
      if (downloaded.hash !== remote.sha256Hash.toLowerCase()) {
        throw new Error(`Downloaded SHA-256 mismatch: ${path}`);
      }
      return;
    }
    if (remoteVersionAlreadyVerified) return;
    const current = await this.inspectRemotePath(path, "downloadVersionVerify");
    if (!current || current.driveId !== remote.driveId || current.eTag !== remote.eTag) {
      throw new Error(`Remote version changed during download: ${path}`);
    }
  }
  getStreamDownloadAdapter(fileSize) {
    if (!import_obsidian5.Platform.isMobile || fileSize < MOBILE_STREAM_DOWNLOAD_MIN_BYTES) {
      return null;
    }
    const adapter = this.scanner.vault.adapter;
    if (typeof adapter.appendBinary !== "function" || typeof adapter.rename !== "function") {
      this.diag?.warn(
        "execute",
        `mobile streamed download unavailable \u2014 appendBinary/rename missing, fileSize=${fileSize}`
      );
      return null;
    }
    return adapter;
  }
  getDownloadTempPath(filePath) {
    const { tmpDir } = getEasySyncPaths(this.scanner.vault);
    return `${tmpDir}/downloads/${filePath}.part`;
  }
  getRecoveryJournal() {
    return new LocalRecoveryJournal(
      this.scanner.vault.adapter,
      getEasySyncPaths(this.scanner.vault).tmpDir
    );
  }
  getMergeReadyStore() {
    return new MergeReadyStore(
      this.scanner.vault.adapter,
      getEasySyncPaths(this.scanner.vault).tmpDir
    );
  }
  async removePathIfExists(path) {
    try {
      await this.scanner.vault.adapter.remove(path);
    } catch {
    }
  }
  async commitDownloadedTempFile(adapter, targetPath, tempPath, expected, downloaded) {
    const recoveryPath = `${targetPath}.easy-sync-recovery`;
    const existing = await adapter.stat(targetPath);
    if (expected) {
      if (!existing) {
        await this.removePathIfExists(tempPath);
        throw new LocalCommitPreconditionError(`Local file disappeared before replacement: ${targetPath}`);
      }
      const currentBytes = await adapter.readBinary(targetPath);
      if (currentBytes.byteLength !== expected.size || await sha256Hex(currentBytes) !== expected.hash) {
        await this.removePathIfExists(tempPath);
        throw new LocalCommitPreconditionError(`Local file changed before replacement: ${targetPath}`);
      }
    } else if (existing) {
      await this.removePathIfExists(tempPath);
      throw new LocalCommitPreconditionError(`Local file appeared before replacement: ${targetPath}`);
    }
    const tempStat = await adapter.stat(tempPath);
    if (!tempStat || tempStat.size !== downloaded.size) {
      await this.removePathIfExists(tempPath);
      throw new Error(`Downloaded temp file verification failed: ${targetPath}`);
    }
    const tempBytes = await adapter.readBinary(tempPath);
    if (tempBytes.byteLength !== downloaded.size || await sha256Hex(tempBytes) !== downloaded.hash) {
      await this.removePathIfExists(tempPath);
      throw new Error(`Downloaded temp file verification failed: ${targetPath}`);
    }
    const journal = this.getRecoveryJournal();
    await this.removePathIfExists(recoveryPath);
    await journal.prepareRenamedOriginal(
      targetPath,
      expected,
      recoveryPath,
      downloaded
    );
    try {
      if (existing) await adapter.rename(targetPath, recoveryPath);
      await adapter.rename(tempPath, targetPath);
      const stat = await adapter.stat(targetPath);
      if (!stat || stat.size !== downloaded.size) {
        throw new Error(`Downloaded target verification failed: ${targetPath}`);
      }
      await journal.complete();
      return stat ? { size: stat.size, mtime: stat.mtime } : null;
    } catch (error) {
      await journal.recover();
      await this.removePathIfExists(tempPath);
      throw error;
    }
  }
  /**
   * Execute a sync round.
   *
   * @param mode  "first" for initial sync, "manual" or "auto" for subsequent
   * @param callbacks  UI callbacks for progress and confirmations
   * @param skipConfirmation  skip threshold/first-sync checks (user confirmed from sidebar)
   */
  async run(mode, callbacks = {}, skipConfirmation = false, reviewedAuthorization, options = {}) {
    if (this.running || this.sideActionRunning || this.queuedSideActionPaths.size > 0) {
      return { success: false, uploaded: 0, downloaded: 0, deleted: 0, conflicts: 0, deferred: 0, skippedLarge: 0, skippedIgnored: 0, errors: 0, authExpired: false, message: this.t("result.alreadyRunning") };
    }
    if (this.state.legacyAutoSyncAllowed === false) {
      return { success: false, uploaded: 0, downloaded: 0, deleted: 0, conflicts: 0, deferred: 0, skippedLarge: 0, skippedIgnored: 0, errors: 1, authExpired: false, message: this.t("result.legacyStateDisabled") };
    }
    this.running = true;
    this.cancelled = false;
    this.remoteRecoveryPreviewRequired = false;
    this.localVersionRecoveredDuringLedger = false;
    this.v2ShadowIdentityInput = null;
    this.cancelController = new AbortController();
    const operationEpoch = this.lifecycle.capture();
    const automaticHandlingPolicy = { ...this.automaticHandlingPolicy };
    const automaticHandlingMetrics = createAutomaticHandlingMetrics(
      automaticHandlingPolicy
    );
    this.startGeneration = this.state.remoteGeneration;
    this.onedrive.resetDownloadStrategy();
    this.onedrive.setAbortSignal(this.cancelController.signal);
    const collectNetworkMetrics = this.diag?.isEnabled?.("onedrive") === true;
    if (collectNetworkMetrics) this.onedrive.beginRunMetrics();
    const result = {
      success: false,
      uploaded: 0,
      downloaded: 0,
      deleted: 0,
      conflicts: 0,
      deferred: 0,
      skippedLarge: 0,
      skippedIgnored: 0,
      errors: 0,
      authExpired: false,
      message: ""
    };
    const runStartedAt = Date.now();
    const phasesMs = {
      recovery: 0,
      scan: 0,
      remotePrepare: 0,
      baseline: 0,
      remoteChanges: 0,
      planning: 0,
      reviewWait: 0,
      transfer: 0,
      commit: 0
    };
    let activePhase = "recovery";
    let activePhaseStartedAt = runStartedAt;
    let unexpectedFailure = false;
    const finishActivePhase = () => {
      if (!activePhase) return;
      phasesMs[activePhase] += Math.max(0, Date.now() - activePhaseStartedAt);
      activePhase = null;
    };
    const enterPhase = (nextPhase) => {
      finishActivePhase();
      activePhase = nextPhase;
      activePhaseStartedAt = Date.now();
    };
    const waitForReview = async (review) => {
      const priorPhase = activePhase;
      enterPhase("reviewWait");
      try {
        return await review();
      } finally {
        if (priorPhase) enterPhase(priorPhase);
      }
    };
    try {
      try {
        const recoveryOutcome = await this.getRecoveryJournal().recover();
        if (recoveryOutcome !== "none") {
          this.diag?.warn("execute", `interrupted local write recovery completed \u2014 ${recoveryOutcome}`);
        }
      } catch (error) {
        result.errors = 1;
        result.message = this.t("result.localRecoveryFailed");
        this.diag?.error(
          "execute",
          "local recovery failed \u2014 stopping before scan and remote preparation",
          error instanceof Error ? error.message : String(error)
        );
        return result;
      }
      if (this.shouldStop(result, operationEpoch)) return result;
      enterPhase("scan");
      this.progressStore?.setPhase("scanning");
      callbacks.onProgress?.(0, 1, this.t("progress.scanningLocal"));
      const scanResult = await this.scanner.scanAll();
      let localEntries = scanResult.entries;
      const { skippedLarge, failedPaths } = scanResult;
      result.skippedLarge = skippedLarge.length;
      if (this.shouldStop(result, operationEpoch)) return result;
      if (scanResult.complete === false || failedPaths.length > 0) {
        result.errors = Math.max(1, new Set(failedPaths).size);
        result.message = this.t("result.scanIncomplete");
        this.diag?.warn(
          "scan",
          `scan incomplete \u2014 stopping round before remote preparation; ${result.errors} path(s) uncertain: ${failedPaths.slice(0, 5).join(", ")}`
        );
        return result;
      }
      enterPhase("remotePrepare");
      this.progressStore?.setPhase("preparing");
      callbacks.onProgress?.(0, 1, this.t("progress.preparingRemote"));
      const committedScope = this.state.remoteScope;
      const committedDeltaLink = this.state.remoteDeltaLink;
      const restoredCommittedScope = !options.readOnlyPreview && this.state.mutationLedger.length === 0 && Boolean(this.state.boundAccountId) && committedScope?.accountId === this.state.boundAccountId && Boolean(committedDeltaLink) && this.onedrive.restoreVaultScope(
        this.vaultName,
        {
          driveId: committedScope.driveId,
          vaultFolderId: committedScope.vaultFolderId,
          filesRootId: committedScope.filesRootId
        },
        committedDeltaLink
      );
      const remoteVaultScope = restoredCommittedScope ? {
        driveId: committedScope.driveId,
        vaultFolderId: committedScope.vaultFolderId,
        filesRootId: committedScope.filesRootId
      } : options.readOnlyPreview ? await this.onedrive.initVaultScope(this.vaultName, { createMissing: false }) : await this.onedrive.initVaultScope(this.vaultName);
      let syncScope = {
        accountId: this.state.boundAccountId,
        ...remoteVaultScope
      };
      this.activeSyncScope = syncScope;
      if (this.shouldStop(result, operationEpoch)) return result;
      await this.recoverMutationLedger(syncScope, automaticHandlingMetrics);
      if (this.shouldStop(result, operationEpoch)) return result;
      if (this.localVersionRecoveredDuringLedger) {
        const recoveredScan = await this.scanner.scanAll();
        if (recoveredScan.complete === false || recoveredScan.failedPaths.length > 0) {
          result.errors = Math.max(1, new Set(recoveredScan.failedPaths).size);
          result.message = this.t("result.scanIncomplete");
          return result;
        }
        localEntries = recoveredScan.entries;
        this.localVersionRecoveredDuringLedger = false;
        this.diag?.warn("execute", "local scan refreshed after interrupted merge recovery");
      }
      if (this.state.remoteDeltaLink && !this.onedrive.isDeltaLinkForVault(
        this.vaultName,
        this.state.remoteDeltaLink
      )) {
        this.diag?.warn("onedrive", "remote delta cache belongs to a different vault directory, rebuilding");
        if (this.shouldStop(result, operationEpoch)) return result;
        await this.state.clearRemoteState();
      }
      enterPhase("baseline");
      this.progressStore?.setPhase("baseline");
      callbacks.onProgress?.(0, 1, this.t("progress.loadingBaseline"));
      let cloudBaselineJson = null;
      if (this.state.baseSnapshot.length === 0) {
        const MAX_BASELINE_ATTEMPTS = 3;
        for (let attempt = 0; attempt < MAX_BASELINE_ATTEMPTS; attempt++) {
          try {
            cloudBaselineJson = await this.onedrive.downloadBaseline(this.vaultName);
            break;
          } catch (e) {
            const isLast = attempt === MAX_BASELINE_ATTEMPTS - 1;
            if (e instanceof OneDriveError && e.type === "NotFound" /* NotFound */) {
              this.diag?.log("state", "no cloud baseline (fresh vault, first sync ever)");
              break;
            }
            if (isLast) {
              this.diag?.warn("state", "cloud baseline download failed after retries", e instanceof Error ? e.message : String(e));
            } else {
              const waitMs = 500 * 2 ** attempt;
              this.diag?.log("state", `cloud baseline download failed (attempt ${attempt + 1}), retrying in ${waitMs}ms`);
              await new Promise((resolve) => compatSetTimeout(() => resolve(), waitMs));
            }
          }
        }
      }
      if (this.shouldStop(result, operationEpoch)) return result;
      enterPhase("remoteChanges");
      this.progressStore?.setPhase("checking");
      callbacks.onProgress?.(0, 1, this.t("progress.checkingRemote"));
      const remotePreparation = await this.tryDeltaOrFullScan(
        operationEpoch,
        result,
        syncScope,
        localEntries
      );
      let remoteEntries = remotePreparation.entries;
      syncScope = remotePreparation.scope;
      this.activeSyncScope = syncScope;
      if (this.shouldStop(result, operationEpoch)) return result;
      if (this.state.remoteGeneration !== this.startGeneration) {
        result.message = this.t("result.generationMismatch");
        this.diag?.warn("execute", `generation mismatch after delta scan (${this.startGeneration} \u2192 ${this.state.remoteGeneration}), aborting`);
        return result;
      }
      let baseEntries = this.state.baseSnapshot.filter(
        (entry) => this.shouldIncludeRemotePath(entry.path)
      );
      let seededBaseEntries = [];
      if (baseEntries.length === 0 && cloudBaselineJson) {
        seededBaseEntries = this.seedBaseEntriesFromCloudBaseline(
          cloudBaselineJson,
          localEntries,
          remoteEntries
        );
        if (seededBaseEntries.length > 0) {
          baseEntries = seededBaseEntries;
          this.diag?.log("state", `cloud baseline seeded ${seededBaseEntries.length} shared path(s)`);
        } else {
          this.diag?.log("state", "cloud baseline loaded, but no shared paths eligible");
        }
      }
      const remoteByPath = new Map(remoteEntries.map((entry) => [entry.path, entry]));
      const eTagUpdates = baseEntries.flatMap((base) => {
        const remote = remoteByPath.get(base.path);
        if (!remote || remote.eTag === base.eTag || !remoteContentMatchesBase(remote, base)) {
          return [];
        }
        return [{ ...base, eTag: remote.eTag }];
      });
      if (eTagUpdates.length > 0) {
        if (this.shouldStop(result, operationEpoch)) return result;
        await this.state.upsertBaseEntries(eTagUpdates);
        const updatedByPath = new Map(eTagUpdates.map((entry) => [entry.path, entry]));
        baseEntries = baseEntries.map((entry) => updatedByPath.get(entry.path) ?? entry);
        this.diag?.log("state", `reconciled ${eTagUpdates.length} unchanged remote eTag(s)`);
      }
      if (this.shouldStop(result, operationEpoch)) return result;
      enterPhase("planning");
      this.progressStore?.setPhase("planning");
      callbacks.onProgress?.(0, 1, this.t("progress.generatingPlan"));
      const plan = this.engine.generatePlan(
        localEntries,
        remoteEntries,
        baseEntries,
        skippedLarge
      );
      plan.scope = syncScope;
      this.diag?.log("plan", `plan generated \u2014 ${plan.items.length} actions (up/down/del/conflict: ${plan.items.filter((i) => i.type === "upload" /* Upload */).length}/${plan.items.filter((i) => i.type === "download" /* Download */).length}/${plan.items.filter((i) => i.type === "conflict" /* Conflict */).length})`);
      this.observeV2ReadOnlyShadow(
        syncScope,
        localEntries,
        baseEntries,
        skippedLarge,
        plan
      );
      const breakerMap = /* @__PURE__ */ new Map();
      for (const issue of this.state.pendingIssues) {
        if ((issue.consecutiveFailures ?? 0) >= 3) {
          breakerMap.set(issue.path, issue);
        }
      }
      if (breakerMap.size > 0) {
        let breakerCount = 0;
        const breakerApplies = mode === "auto";
        for (const item of plan.items) {
          const breaker = breakerMap.get(item.path);
          if (breaker && item.local?.hash === breaker.localHash && item.remote?.eTag === breaker.remoteETag) {
            breakerCount++;
            if (breakerApplies) {
              item.type = "retryLater" /* RetryLater */;
              item.reason = "reason.circuitBreaker";
            }
          }
        }
        if (breakerCount > 0) {
          this.diag?.log(
            "plan",
            breakerApplies ? `M17 circuit breaker \u2014 ${breakerCount} item(s) skipped (3+ consecutive failures)` : `M17 circuit breaker bypassed for ${mode} sync \u2014 ${breakerCount} item(s) will retry despite 3+ consecutive failures`
          );
        }
      }
      const configPrefix = `${getConfigDir(this.scanner.vault)}/`;
      const obsidianUploads = plan.items.filter((i) => i.type === "upload" /* Upload */ && i.path.startsWith(configPrefix));
      if (obsidianUploads.length > 0) {
        this.diag?.log("plan", `plan includes ${configPrefix} uploads: ${obsidianUploads.map((i) => i.path).join(", ")}`);
      } else {
        const obsidianLocal = localEntries.filter((e) => e.path.startsWith(configPrefix));
        this.diag?.log("plan", `NO ${configPrefix} uploads in plan. localEntries with ${configPrefix}: ${obsidianLocal.map((e) => e.path).join(", ") || "(none)"}`);
      }
      {
        const MAX_HASH_DEDUP_FILES = 10;
        const isBootstrap = baseEntries.length === 0;
        const pendingByPath = new Map(
          this.state.pendingConflicts.map((item) => [item.path, item])
        );
        const baseByPath = new Map(
          baseEntries.map((entry) => [entry.path, entry])
        );
        const candidates = plan.items.filter((item) => {
          if (item.type !== "conflict" /* Conflict */ || item.reason !== "reason.newFileBothSides" && item.reason !== "reason.bothSidesModified" || !item.local || !item.remote || item.local.size !== item.remote.size) {
            return false;
          }
          const pending = pendingByPath.get(item.path);
          const equality = resolveContentEquality({
            local: item.local,
            remote: item.remote,
            base: baseByPath.get(item.path)
          });
          return equality.status !== "unknown" || pending?.local?.hash !== item.local.hash || pending.remote?.eTag !== item.remote.eTag;
        });
        const evidenceCandidates = candidates.filter((item) => resolveContentEquality({
          local: item.local,
          remote: item.remote,
          base: baseByPath.get(item.path)
        }).status !== "unknown");
        const evidencePaths = new Set(evidenceCandidates.map((item) => item.path));
        const maxDownloads = isBootstrap ? candidates.length : MAX_HASH_DEDUP_FILES;
        const downloadCandidates = candidates.filter((item) => !evidencePaths.has(item.path)).slice(0, maxDownloads);
        const selectedCandidates = [...evidenceCandidates, ...downloadCandidates];
        const dedupTotal = selectedCandidates.length;
        if (candidates.length > 0) {
          this.progressStore?.setPhase("verifying");
          this.diag?.log(
            "plan",
            `hash dedup${isBootstrap ? " (bootstrap)" : ""} \u2014 ${evidenceCandidates.length} cached evidence candidate(s), ${downloadCandidates.length}/${candidates.length - evidenceCandidates.length} download candidate(s)`
          );
        }
        const falseConflicts = /* @__PURE__ */ new Set();
        const matchedBaseEntries = [];
        let dedupCount = 0;
        for (const item of selectedCandidates) {
          if (this.shouldStop(result, operationEpoch)) return result;
          const local = item.local;
          const remote = item.remote;
          dedupCount++;
          this.progressStore?.setProgress(dedupCount, dedupTotal, item.path);
          callbacks.onProgress?.(
            dedupCount,
            dedupTotal,
            this.t("progress.verifyingFiles", {
              current: dedupCount,
              total: dedupTotal
            })
          );
          try {
            this.diag?.log("plan", `hash dedup [${dedupCount}/${dedupTotal}] checking ${item.path} (${local.size} bytes)`);
            let equality = resolveContentEquality({
              local,
              remote,
              base: baseByPath.get(item.path)
            });
            if (equality.status === "unknown") {
              const remoteContent = await this.onedrive.downloadFile(
                this.vaultName,
                item.path,
                remote.downloadUrl,
                remote.driveId,
                remote.size
              );
              equality = resolveContentEquality({
                local,
                remote,
                base: baseByPath.get(item.path),
                downloadedHash: await sha256Hex(remoteContent)
              });
            }
            if (equality.status === "equal") {
              this.diag?.log("plan", `hash dedup MATCH \u2014 ${item.path} identical via ${equality.proof}`);
              matchedBaseEntries.push({
                path: item.path,
                hash: local.hash,
                size: local.size,
                eTag: remote.eTag
              });
              falseConflicts.add(item.path);
            } else {
              this.diag?.log("plan", `hash dedup MISMATCH \u2014 ${item.path} differs via ${equality.proof}`);
            }
          } catch (e) {
            this.diag?.warn("plan", `hash dedup skipped ${item.path} \u2014 download failed: ${e instanceof Error ? e.message : String(e)}`);
          }
        }
        if (matchedBaseEntries.length > 0) {
          if (this.shouldStop(result, operationEpoch)) return result;
          await this.state.upsertBaseEntries(matchedBaseEntries);
        }
        const skippedDownloadCandidates = candidates.length - evidenceCandidates.length - downloadCandidates.length;
        if (skippedDownloadCandidates > 0) {
          this.diag?.log(
            "plan",
            `hash dedup download cap reached (${MAX_HASH_DEDUP_FILES}), ${skippedDownloadCandidates} conflict(s) kept for manual resolution`
          );
        }
        if (falseConflicts.size > 0) {
          this.diag?.log("plan", `hash dedup resolved ${falseConflicts.size} false conflicts`);
          plan.items = plan.items.filter(
            (item) => !falseConflicts.has(item.path)
          );
        }
      }
      plan.items = applyAutomaticHandlingPolicy(
        plan.items,
        automaticHandlingPolicy
      );
      if (this.shouldStop(result, operationEpoch)) return result;
      await this.state.prunePendingConflicts(
        plan.items.filter((item) => item.type === "conflict" /* Conflict */).map((item) => item.path)
      );
      if (this.shouldStop(result, operationEpoch)) return result;
      await this.state.prunePendingDeletes(
        plan.items.filter((item) => item.type === "confirmLocalDelete" /* ConfirmLocalDelete */ || item.type === "deleteLocal" /* DeleteLocal */).map((item) => item.path)
      );
      if (this.shouldStop(result, operationEpoch)) return result;
      await this.state.prunePendingIssues(
        plan.items.filter((item) => isPendingIssueAction(item.type)).map((item) => item.path)
      );
      if (this.shouldStop(result, operationEpoch)) return result;
      this.bindPendingDecisionTokens(plan);
      if (options.readOnlyPreview) {
        const publishPreview = callbacks.onFirstSyncPreview ?? callbacks.onConfirmThreshold;
        if (publishPreview) await waitForReview(() => publishPreview(plan));
        this.diag?.warn(
          "plan",
          "explicit read-only preview enforced; Graph creates=0, file mutations=0",
          {
            scope: syncScope,
            counts: this.summarizePlanActions(plan),
            total: plan.items.length,
            sample: plan.items.slice(0, 10).map((item) => ({
              type: item.type,
              path: item.path,
              reason: item.reason
            })),
            mutations: 0
          }
        );
        result.message = this.t("result.pausedForReview");
        return result;
      }
      if (this.remoteRecoveryPreviewRequired) {
        const counts = this.summarizePlanActions(plan);
        const anomalies = plan.items.filter((item) => item.path.startsWith("files/") || item.path.startsWith(".easy-sync/")).slice(0, 10).map((item) => `${item.type}:${item.path}`);
        this.diag?.warn(
          "plan",
          "remote namespace recovery forced a read-only preview; file mutations=0",
          {
            scope: syncScope,
            counts,
            total: plan.items.length,
            priorBaseCount: baseEntries.length,
            anomalies,
            sample: plan.items.slice(0, 10).map((item) => ({
              type: item.type,
              path: item.path,
              reason: item.reason
            })),
            mutations: 0
          }
        );
        const publishPreview = callbacks.onConfirmThreshold ?? callbacks.onFirstSyncPreview;
        if (publishPreview) await waitForReview(() => publishPreview(plan));
        result.message = this.t("result.pausedForReview");
        return result;
      }
      if (skipConfirmation && this.state.planReviewActive) {
        const authorizationIsCurrent = Boolean(
          reviewedAuthorization && reviewedAuthorization.revision === this.state.planReviewRevision && sameSyncScope(reviewedAuthorization.scope, this.state.planReviewScope) && sameSyncScope(reviewedAuthorization.scope, syncScope)
        );
        if (!authorizationIsCurrent) {
          this.diag?.warn("plan", "plan revision or scope changed since review \u2014 re-pausing for confirmation");
          if (callbacks.onConfirmThreshold) {
            await waitForReview(() => callbacks.onConfirmThreshold(plan));
          }
          result.message = this.t("result.pausedForReview");
          return result;
        }
        const savedDigest = this.state.planReviewDigest;
        if (savedDigest && planDigest(plan.items) !== savedDigest) {
          this.diag?.warn("plan", "plan changed since review \u2014 re-pausing for confirmation");
          const confirmed = callbacks.onConfirmThreshold ? await waitForReview(() => callbacks.onConfirmThreshold(plan)) : false;
          if (!confirmed) {
            result.message = this.t("result.pausedForReview");
            return result;
          }
          if (this.shouldStop(result, operationEpoch)) return result;
        }
        if (this.shouldStop(result, operationEpoch)) return result;
        const cleared = await this.state.clearPlanReview(reviewedAuthorization);
        if (!cleared) {
          this.diag?.warn("plan", "plan review changed before authorization commit \u2014 stopping before mutation");
          result.message = this.t("result.pausedForReview");
          return result;
        }
      }
      if (!skipConfirmation && this.engine.shouldPauseForConfirmation(plan)) {
        if (callbacks.onConfirmThreshold) {
          const confirmed = await waitForReview(() => callbacks.onConfirmThreshold(plan));
          if (!confirmed) {
            result.message = this.t("result.pausedForReview");
            return result;
          }
          if (this.shouldStop(result, operationEpoch)) return result;
        }
        plan.confirmed = true;
      }
      if (!skipConfirmation && mode === "first") {
        if (callbacks.onFirstSyncPreview) {
          const confirmed = await waitForReview(() => callbacks.onFirstSyncPreview(plan));
          if (!confirmed) {
            result.message = this.t("result.pausedForReview");
            return result;
          }
          if (this.shouldStop(result, operationEpoch)) return result;
        }
        plan.confirmed = true;
      }
      enterPhase("transfer");
      this.progressStore?.setPhase("executing");
      await this.executePlan(
        plan,
        result,
        callbacks,
        operationEpoch,
        automaticHandlingPolicy,
        automaticHandlingMetrics
      );
      enterPhase("commit");
      if (this.shouldStop(result, operationEpoch)) return result;
      if (this.state.remoteGeneration !== this.startGeneration) {
        result.message = this.t("result.generationMismatch");
        this.diag?.warn("execute", `generation mismatch after executePlan (${this.startGeneration} \u2192 ${this.state.remoteGeneration}), aborting`);
        return result;
      }
      const isHealthy = !result.authExpired && !this.cancelled && this.lifecycle.isCurrent(operationEpoch) && result.errors === 0 && result.conflicts === 0 && result.deferred === 0 && result.skippedLarge === 0 && result.skippedIgnored === 0;
      if (isHealthy) {
        if (seededBaseEntries.length > 0) {
          if (this.shouldStop(result, operationEpoch)) return result;
          await this.persistSeededBaseEntries(seededBaseEntries);
        }
        if (this.shouldStop(result, operationEpoch)) return result;
        await this.state.setLastSyncTime(Date.now());
        if (this.shouldStop(result, operationEpoch)) return result;
        await this.state.incrementRemoteGeneration();
      }
      result.success = !result.authExpired && !this.cancelled && result.errors === 0;
      if (!result.message) {
        const resultKey = result.errors > 0 ? "result.partial" : result.deferred > 0 ? "result.deferred" : "result.synced";
        result.message = this.t(resultKey, {
          uploaded: result.uploaded,
          downloaded: result.downloaded,
          deleted: result.deleted,
          conflicts: result.conflicts,
          deferred: result.deferred,
          errors: result.errors
        });
      }
    } catch (e) {
      if (e instanceof AuthError) {
        this.invalidateLifecycle("auth-expired");
        result.authExpired = true;
        result.message = this.t("result.authExpired");
        result.success = false;
      } else {
        unexpectedFailure = true;
        result.message = this.t("result.syncFailed", { message: e instanceof Error ? e.message : "unknown error" });
      }
    } finally {
      finishActivePhase();
      const networkMetrics = collectNetworkMetrics ? this.onedrive.finishRunMetrics() : null;
      if (networkMetrics) {
        this.diag?.log("onedrive", "sync network summary", networkMetrics);
      }
      if (result.metrics) {
        this.diag?.log("execute", "sync file transfer summary", {
          schemaVersion: 2,
          platform: import_obsidian5.Platform.isMobile ? "mobile" : "desktop",
          upload: result.metrics.fileTransfers.upload,
          download: result.metrics.fileTransfers.download
        });
      }
      automaticHandlingMetrics.recoveryPendingAtEnd = {
        deleteLocal: this.state.mutationLedger.filter(
          (entry) => entry.intent.action === "deleteLocal"
        ).length,
        merge: this.state.mutationLedger.filter(
          (entry) => entry.intent.action === "merge"
        ).length
      };
      this.diag?.log(
        "execute",
        "sync automatic handling summary",
        {
          schemaVersion: 1,
          ...automaticHandlingMetrics
        }
      );
      this.diag?.log("lifecycle", "sync run phase summary", {
        schemaVersion: 2,
        platform: import_obsidian5.Platform.isMobile ? "mobile" : "desktop",
        mode,
        status: result.success ? "success" : result.authExpired ? "authExpired" : this.cancelled ? "cancelled" : unexpectedFailure || result.errors > 0 ? "failed" : "stopped",
        readOnlyPreview: options.readOnlyPreview === true,
        counts: {
          uploaded: result.uploaded,
          downloaded: result.downloaded,
          deleted: result.deleted,
          conflicts: result.conflicts,
          deferred: result.deferred,
          errors: result.errors,
          skippedLarge: result.skippedLarge,
          skippedIgnored: result.skippedIgnored
        },
        phasesMs,
        totalMs: Math.max(0, Date.now() - runStartedAt)
      });
      this.onedrive.setAbortSignal(null);
      this.cancelController = null;
      this.activeSyncScope = null;
      this.running = false;
      this.progressStore?.finish();
      callbacks.onStateChange?.();
    }
    return result;
  }
  /** Execute plan items with per-file persistence */
  async executePlan(plan, result, callbacks, operationEpoch, automaticHandlingPolicy, automaticHandlingMetrics) {
    const startedAt = Date.now();
    let total = plan.items.length;
    const pendingConflicts = [];
    const pendingDeletes = [];
    const pendingIssues = [];
    const resolvedIssuePaths = /* @__PURE__ */ new Set();
    const remoteUpserts = [];
    const remoteDeletes = [];
    const baseUpserts = [];
    const baseRemovals = [];
    const metrics = {
      uploadBytes: 0,
      uploadReadMs: 0,
      uploadNetworkMs: 0,
      activeUploads: 0,
      peakUploads: 0,
      fileTransfers: {
        upload: createFileTransferMetrics(),
        download: createFileTransferMetrics()
      },
      automaticHandling: automaticHandlingMetrics
    };
    result.metrics = metrics;
    const isSmallUpload = (i) => i.type === "upload" /* Upload */ && Boolean(i.local) && i.local.size <= CONCURRENT_UPLOAD_MAX_BYTES;
    const isLargeUpload = (i) => i.type === "upload" /* Upload */ && Boolean(i.local) && i.local.size > CONCURRENT_UPLOAD_MAX_BYTES;
    const isDownload = (i) => i.type === "download" /* Download */ || i.type === "renameRemote" /* RenameRemote */;
    const isCleanup = (i) => i.type === "deleteRemote" /* DeleteRemote */ || i.type === "deleteLocal" /* DeleteLocal */;
    const isPassthrough = (i) => !isSmallUpload(i) && !isLargeUpload(i) && !isDownload(i) && !isCleanup(i);
    const smallUploads = plan.items.filter(isSmallUpload);
    const largeUploads = plan.items.filter(isLargeUpload);
    const downloads = plan.items.filter(isDownload);
    const cleanupItems = plan.items.filter(isCleanup);
    const passthroughItems = plan.items.filter(isPassthrough);
    metrics.automaticHandling.deleteLocal.candidates = automaticHandlingPolicy.autoDeleteLocalFiles ? cleanupItems.filter((item) => item.type === "deleteLocal" /* DeleteLocal */).length : 0;
    const uploadConc = import_obsidian5.Platform.isMobile ? MOBILE_SMALL_UPLOAD_CONCURRENCY : SMALL_UPLOAD_CONCURRENCY;
    const largeUploadConc = import_obsidian5.Platform.isMobile ? MOBILE_LARGE_UPLOAD_CONCURRENCY : LARGE_UPLOAD_CONCURRENCY;
    const downloadPolicy = new DownloadConcurrencyPolicy();
    if (import_obsidian5.Platform.isMobile && this.scanner.getMaxFileSize() > 100 * 1024 * 1024) {
      this.diag?.warn("execute", `mobile maxFileSize=${this.scanner.getMaxFileSize()} exceeds validated 100 MiB ceiling \u2014 large files may OOM or timeout`);
    }
    const { pluginDirPrefix } = getEasySyncPaths(this.scanner.vault);
    const easySyncDownloads = downloads.filter((i) => i.path.startsWith(pluginDirPrefix));
    if (easySyncDownloads.length > 0) {
      const skipped = await this.guardEasySyncDowngrade(easySyncDownloads);
      if (skipped > 0) {
        const skippedPaths = new Set(easySyncDownloads.slice(0, skipped).map((i) => i.path));
        const origLen = downloads.length;
        for (let i = downloads.length - 1; i >= 0; i--) {
          if (skippedPaths.has(downloads[i].path)) downloads.splice(i, 1);
        }
        total -= origLen - downloads.length;
        this.diag?.log("execute", `M19 anti-downgrade \u2014 skipped ${skipped} EasySync file(s), remote version is older`);
      }
    }
    let started = 0;
    this.diag?.log(
      "execute",
      `pools \u2014 small=${smallUploads.length}(${uploadConc}) large=${largeUploads.length}(${largeUploadConc}) download=${downloads.length}(adaptive 1\u21923 desktop small files) passthrough=${passthroughItems.length} cleanup=${cleanupItems.length}`
    );
    const executePlanItem = async (item, preparedDownload) => {
      if (!this.canContinue(operationEpoch, result)) return;
      const position = ++started;
      this.progressStore?.setProgress(position, total, item.path, item.type);
      callbacks.onProgress?.(position, total, item.path);
      const fileSize = item.local?.size ?? item.remote?.size;
      const localHash = item.local?.hash;
      const remoteETag = item.remote?.eTag;
      const mutationIntent = plan.scope && isFileMutationAction(item.type) ? this.createMutationIntent(item, plan.scope) : null;
      const remoteUpsertStart = remoteUpserts.length;
      const remoteDeleteStart = remoteDeletes.length;
      const transferDirection = item.type === "upload" /* Upload */ ? "upload" : item.type === "download" /* Download */ ? "download" : null;
      const transferMetrics = transferDirection ? metrics.fileTransfers[transferDirection] : null;
      const transferAlreadyStarted = transferDirection === "download" && preparedDownload !== void 0;
      const completedBefore = transferDirection === "upload" ? result.uploaded : result.downloaded;
      const deletedBefore = result.deleted;
      const automaticMergeCandidatesBefore = metrics.automaticHandling.textMerge.candidates;
      const automaticMergeSettledBefore = metrics.automaticHandling.textMerge.completed + metrics.automaticHandling.textMerge.keptManual + metrics.automaticHandling.textMerge.failed + metrics.automaticHandling.textMerge.cancelled;
      let transferOutcome = null;
      let automaticDeleteCompleted = false;
      if (transferMetrics && !transferAlreadyStarted) {
        transferMetrics.started++;
        transferMetrics.activeConcurrency++;
        transferMetrics.peakConcurrency = Math.max(
          transferMetrics.peakConcurrency,
          transferMetrics.activeConcurrency
        );
      }
      try {
        this.diag?.log("execute", `[${position}/${total}] ${item.type} ${item.path}`);
        if (preparedDownload?.error) throw preparedDownload.error;
        if (mutationIntent) await this.state.beginMutationIntent(mutationIntent);
        const itemResult = await this.executeItem(
          item,
          result,
          remoteUpserts,
          remoteDeletes,
          metrics,
          callbacks,
          operationEpoch,
          automaticHandlingPolicy,
          preparedDownload
        );
        if (mutationIntent && !itemResult.mutationApplied) {
          await this.state.abandonMutationIntent(mutationIntent.operationId);
        }
        if (mutationIntent && itemResult.mutationApplied) {
          const checkpoint = emptyMutationCheckpoint();
          checkpoint.remoteUpserts.push(...remoteUpserts.splice(remoteUpsertStart));
          checkpoint.remoteDeletes.push(...remoteDeletes.splice(remoteDeleteStart));
          if (itemResult.baseUpsert) checkpoint.baseUpserts.push(itemResult.baseUpsert);
          if (itemResult.baseRemoval) checkpoint.baseRemovals.push(itemResult.baseRemoval);
          if (automaticHandlingPolicy.autoDeleteLocalFiles && item.type === "deleteLocal" /* DeleteLocal */) {
            checkpoint.pendingDeleteRemovals.push(item.path);
          }
          const receipt = {
            version: 1,
            operationId: mutationIntent.operationId,
            completedAt: Date.now(),
            checkpoint
          };
          await this.state.recordMutationReceipt(receipt);
          if (!this.canContinue(operationEpoch, result)) return;
          await this.state.commitMutationCheckpoint(mutationIntent.operationId);
          if (item.type === "deleteLocal" /* DeleteLocal */) {
            metrics.automaticHandling.deleteLocal.completed++;
            automaticDeleteCompleted = true;
          }
          itemResult.baseUpsert = void 0;
          itemResult.baseRemoval = void 0;
        }
        if (!this.canContinue(operationEpoch, result)) return;
        if (!itemResult.executed) {
          transferOutcome = transferMetrics ? "skipped" : null;
          if (itemResult.completionReason) {
            callbacks.onFileComplete?.(
              item.path,
              itemResult.completionActionType ?? item.type,
              true,
              itemResult.completionReason,
              fileSize
            );
          }
          return;
        }
        if (transferMetrics && transferDirection) {
          const completedAfter = transferDirection === "upload" ? result.uploaded : result.downloaded;
          if (completedAfter > completedBefore) {
            transferOutcome = "succeeded";
            transferMetrics.logicalBytes += Math.max(0, fileSize ?? 0);
          } else {
            transferOutcome = "skipped";
          }
        }
        if (itemResult.baseUpsert) baseUpserts.push(itemResult.baseUpsert);
        if (itemResult.baseRemoval) baseRemovals.push(itemResult.baseRemoval);
        if (item.type === "conflict" /* Conflict */ && !itemResult.resolvedConflict) {
          pendingConflicts.push(this.withDecisionToken(item));
        } else if (item.type === "confirmLocalDelete" /* ConfirmLocalDelete */) {
          pendingDeletes.push(this.withDecisionToken(item));
        }
        if (item.type === "retryLater" /* RetryLater */) {
          const reason = item.reason ? this.t(item.reason) : this.t("syncView.failure.local");
          pendingIssues.push({
            path: item.path,
            actionType: item.type,
            reason,
            updatedAt: Date.now(),
            fileSize,
            localHash,
            remoteETag,
            consecutiveFailures: 1
          });
          callbacks.onFileComplete?.(item.path, item.type, false, reason, fileSize);
          return;
        }
        if (item.type === "skipLargeFile" /* SkipLargeFile */) {
          const reason = item.reason ? this.t(item.reason) : this.t("syncView.fileStatus.skip");
          pendingIssues.push({
            path: item.path,
            actionType: item.type,
            reason,
            updatedAt: Date.now(),
            fileSize,
            localHash,
            remoteETag
          });
          callbacks.onFileComplete?.(item.path, item.type, true, reason, fileSize);
          return;
        }
        if (isResolvedIssueAction(item.type)) {
          resolvedIssuePaths.add(item.path);
        }
        callbacks.onFileComplete?.(
          item.path,
          itemResult.completionActionType ?? item.type,
          true,
          itemResult.completionReason,
          fileSize
        );
      } catch (e) {
        let mutationRecovery = null;
        if (mutationIntent && this.state.mutationLedger.some(
          (entry) => entry.intent.operationId === mutationIntent.operationId
        )) {
          mutationRecovery = await this.reconcileFailedMutation(mutationIntent);
        }
        if (mutationRecovery === "applied") {
          if (!this.canContinue(operationEpoch, result)) {
            transferOutcome = transferMetrics ? "cancelled" : null;
            return;
          }
          if (item.type === "upload" /* Upload */ && result.uploaded === completedBefore) {
            result.uploaded++;
            metrics.uploadBytes += Math.max(0, fileSize ?? 0);
          } else if (item.type === "download" /* Download */ && result.downloaded === completedBefore) {
            result.downloaded++;
          } else if ((item.type === "deleteLocal" /* DeleteLocal */ || item.type === "deleteRemote" /* DeleteRemote */) && result.deleted === deletedBefore) {
            result.deleted++;
          }
          if (automaticHandlingPolicy.autoDeleteLocalFiles && item.type === "deleteLocal" /* DeleteLocal */ && !automaticDeleteCompleted) {
            metrics.automaticHandling.deleteLocal.completed++;
            automaticDeleteCompleted = true;
          }
          if (transferMetrics) {
            transferOutcome = "succeeded";
            transferMetrics.logicalBytes += Math.max(0, fileSize ?? 0);
          }
          if (isResolvedIssueAction(item.type)) resolvedIssuePaths.add(item.path);
          callbacks.onFileComplete?.(item.path, item.type, true, void 0, fileSize);
          return;
        }
        if (automaticHandlingPolicy.autoDeleteLocalFiles && item.type === "deleteLocal" /* DeleteLocal */ && !automaticDeleteCompleted) {
          metrics.automaticHandling.deleteLocal.failed++;
        }
        const automaticMergeSettledAfter = metrics.automaticHandling.textMerge.completed + metrics.automaticHandling.textMerge.keptManual + metrics.automaticHandling.textMerge.failed + metrics.automaticHandling.textMerge.cancelled;
        if (metrics.automaticHandling.textMerge.candidates > automaticMergeCandidatesBefore && automaticMergeSettledAfter === automaticMergeSettledBefore) {
          metrics.automaticHandling.textMerge.failed++;
        }
        if (this.cancelled && !result.authExpired) {
          transferOutcome = transferMetrics ? "cancelled" : null;
          this.diag?.log("execute", `[${position}/${total}] ${item.type} ${item.path} aborted after cancellation`);
          return;
        }
        transferOutcome = transferMetrics ? "failed" : null;
        this.diag?.error("execute", `[${position}/${total}] ${item.type} ${item.path} FAILED: ${e instanceof Error ? e.message : String(e)}`, errorDiagData(e));
        if (isAuthFailure(e)) {
          result.authExpired = true;
          result.message = this.t("result.authExpired");
          this.invalidateLifecycle("auth-expired");
          callbacks.onFileComplete?.(item.path, item.type, false, this.failureReason(e), fileSize);
          return;
        }
        result.errors++;
        const reason = this.failureReason(e);
        pendingIssues.push({
          path: item.path,
          actionType: item.type,
          reason,
          updatedAt: Date.now(),
          fileSize,
          localHash,
          remoteETag,
          consecutiveFailures: 1
        });
        callbacks.onFileComplete?.(item.path, item.type, false, reason, fileSize);
      } finally {
        if (transferMetrics) {
          const outcome = transferOutcome ?? "cancelled";
          transferMetrics[outcome]++;
          if (!transferAlreadyStarted) {
            transferMetrics.activeConcurrency = Math.max(0, transferMetrics.activeConcurrency - 1);
          }
        }
      }
    };
    for (const item of passthroughItems) {
      if (!this.canContinue(operationEpoch, result)) break;
      await executePlanItem(item);
    }
    for (const item of [...smallUploads, ...largeUploads]) {
      if (!this.canContinue(operationEpoch, result)) break;
      await executePlanItem(item);
    }
    let downloadIndex = 0;
    while (downloadIndex < downloads.length && this.canContinue(operationEpoch, result)) {
      const first = downloads[downloadIndex];
      const eligible = await this.canPrefetchDownload(first);
      if (!eligible) {
        await executePlanItem(first);
        downloadIndex++;
        continue;
      }
      const batch = [first];
      downloadIndex++;
      while (downloadIndex < downloads.length && batch.length < downloadPolicy.limit) {
        const candidate = downloads[downloadIndex];
        if (!await this.canPrefetchDownload(candidate)) break;
        batch.push(candidate);
        downloadIndex++;
      }
      const batchStartedAt = Date.now();
      let activePrefetch = 0;
      const prepared = await Promise.all(batch.map(async (item) => {
        metrics.fileTransfers.download.started++;
        activePrefetch++;
        metrics.fileTransfers.download.activeConcurrency++;
        metrics.fileTransfers.download.peakConcurrency = Math.max(
          metrics.fileTransfers.download.peakConcurrency,
          activePrefetch
        );
        try {
          let content;
          const transferStartedAt = Date.now();
          try {
            content = await this.onedrive.downloadFile(
              this.vaultName,
              item.path,
              item.remote.downloadUrl,
              item.remote.driveId,
              item.remote.size,
              void 0
            );
          } finally {
            metrics.fileTransfers.download.stagesMs.contentTransfer += Date.now() - transferStartedAt;
          }
          const hashStartedAt = Date.now();
          const downloaded = {
            size: content.byteLength,
            hash: await sha256Hex(content)
          };
          metrics.fileTransfers.download.stagesMs.contentHash += Date.now() - hashStartedAt;
          const remoteVerifyStartedAt = Date.now();
          try {
            await this.verifyDownloadedPayload(item.path, item.remote, downloaded);
          } finally {
            metrics.fileTransfers.download.stagesMs.remoteVersionVerify += Date.now() - remoteVerifyStartedAt;
          }
          return { content, downloaded };
        } catch (error) {
          return { error };
        } finally {
          activePrefetch--;
          metrics.fileTransfers.download.activeConcurrency = Math.max(
            0,
            metrics.fileTransfers.download.activeConcurrency - 1
          );
        }
      }));
      const failed = prepared.some((item) => item.error !== void 0);
      const downloadedBytes = prepared.reduce(
        (sum, item) => sum + (item.downloaded?.size ?? 0),
        0
      );
      const degradedProbe = this.onedrive;
      downloadPolicy.observeBatch({
        files: prepared.length,
        bytes: downloadedBytes,
        elapsedMs: Date.now() - batchStartedAt,
        failed,
        degradedPath: degradedProbe.hasDegradedDownloadPathThisRound?.() ?? false
      });
      this.diag?.log("execute", "adaptive download batch", {
        schemaVersion: 1,
        files: batch.length,
        bytes: downloadedBytes,
        elapsedMs: Math.max(0, Date.now() - batchStartedAt),
        failed,
        nextConcurrency: downloadPolicy.limit,
        lockedSerial: downloadPolicy.isLockedSerial
      });
      if (!this.canContinue(operationEpoch, result)) {
        metrics.fileTransfers.download.cancelled += batch.length;
        break;
      }
      for (let index = 0; index < batch.length; index++) {
        if (!this.canContinue(operationEpoch, result)) break;
        await executePlanItem(batch[index], prepared[index]);
      }
    }
    for (const item of cleanupItems) {
      if (!this.canContinue(operationEpoch, result)) break;
      await executePlanItem(item);
    }
    if (!this.canContinue(operationEpoch, result)) {
      this.diag?.log("execute", `sync cancelled after starting ${started}/${total} item(s)`);
      result.message = this.t("result.cancelled");
      return;
    }
    if ((this.state.mutationLedger?.length ?? 0) > 0) {
      throw new Error("Mutation recovery is unresolved; shared state checkpoint stopped");
    }
    if (baseUpserts.length > 0) {
      if (!this.canContinue(operationEpoch, result)) return;
      await this.state.upsertBaseEntries(baseUpserts);
    }
    if (baseRemovals.length > 0) {
      if (!this.canContinue(operationEpoch, result)) return;
      await this.state.removeBaseEntries(baseRemovals);
    }
    if (pendingConflicts.length > 0) {
      if (!this.canContinue(operationEpoch, result)) return;
      await this.state.upsertPendingConflicts(pendingConflicts);
    }
    if (pendingDeletes.length > 0) {
      if (!this.canContinue(operationEpoch, result)) return;
      await this.state.upsertPendingDeletes(pendingDeletes);
    }
    if (!this.canContinue(operationEpoch, result)) return;
    await this.state.reconcilePendingIssues(pendingIssues, resolvedIssuePaths);
    if (remoteUpserts.length > 0 || remoteDeletes.length > 0) {
      if (!this.canContinue(operationEpoch, result)) return;
      await this.state.applyRemoteMutations(remoteUpserts, remoteDeletes);
    }
    this.diag?.log(
      "execute",
      `upload summary \u2014 files=${result.uploaded}, bytes=${metrics.uploadBytes}, peak=${metrics.peakUploads}/${uploadConc}, readMs=${metrics.uploadReadMs}, networkMs=${metrics.uploadNetworkMs}, elapsedMs=${Date.now() - startedAt}`
    );
  }
  /** Reconcile every durable mutation record before reading a cursor or planning. */
  createMutationIntent(item, scope) {
    return {
      version: 1,
      operationId: `${Date.now()}-${++this.mutationSequence}-${item.type}`,
      planRevision: this.state.planReviewRevision,
      scope: { ...scope },
      action: item.type === "deleteRemote" /* DeleteRemote */ ? "deleteRemote" : item.type === "deleteLocal" /* DeleteLocal */ ? "deleteLocal" : item.type === "renameRemote" /* RenameRemote */ ? "renameRemote" : item.type === "download" /* Download */ ? "download" : "upload",
      path: item.path,
      sourcePath: item.renameFrom,
      expectedLocal: item.local ? { exists: true, hash: item.local.hash, size: item.local.size } : { exists: false },
      expectedRemote: item.remote ? {
        exists: true,
        driveId: item.remote.driveId,
        eTag: item.remote.eTag,
        size: item.remote.size,
        sha256Hash: item.remote.sha256Hash
      } : { exists: false },
      createdAt: Date.now()
    };
  }
  createSideMutationIntent(item, action, expectedLocalOverride) {
    const token = item.decisionToken;
    const scope = this.activeSyncScope;
    if (!token || !scope) throw new Error("Reviewed mutation has no current authorization scope");
    return {
      version: 1,
      operationId: `${Date.now()}-${++this.mutationSequence}-${action}`,
      planRevision: this.state.planReviewRevision,
      scope: { ...scope },
      action,
      path: item.path,
      expectedLocal: expectedLocalOverride ?? token.local,
      expectedRemote: token.remote.exists ? {
        ...token.remote,
        size: item.remote?.size ?? 0,
        sha256Hash: item.remote?.sha256Hash
      } : token.remote,
      createdAt: Date.now()
    };
  }
  createMergeMutationIntent(item, target) {
    const scope = this.activeSyncScope;
    if (!scope || !item.local || !item.remote) {
      throw new Error("Automatic merge has no current local, remote, or scope");
    }
    return {
      version: 1,
      operationId: `${Date.now()}-${++this.mutationSequence}-merge`,
      planRevision: this.state.planReviewRevision,
      scope: { ...scope },
      action: "merge",
      path: item.path,
      expectedLocal: {
        exists: true,
        hash: item.local.hash,
        size: item.local.size
      },
      expectedRemote: {
        exists: true,
        driveId: item.remote.driveId,
        eTag: item.remote.eTag,
        size: item.remote.size,
        sha256Hash: item.remote.sha256Hash
      },
      target: { ...target },
      createdAt: Date.now()
    };
  }
  async runDurableSideMutation(intent, operationEpoch, mutate) {
    await this.state.beginMutationIntent(intent);
    let checkpoint = null;
    try {
      checkpoint = await mutate();
      await this.state.recordMutationReceipt({
        version: 1,
        operationId: intent.operationId,
        completedAt: Date.now(),
        checkpoint
      });
      if (!this.canContinue(operationEpoch)) return false;
      await this.state.commitMutationCheckpoint(intent.operationId);
      return this.canContinue(operationEpoch);
    } catch (error) {
      if (error instanceof SideMutationNotAppliedError) {
        try {
          await this.state.abandonMutationIntent(intent.operationId);
          this.diag?.log("execute", `side mutation proved not applied and was abandoned \u2014 ${intent.path}`);
        } catch (recoveryError) {
          this.diag?.warn(
            "execute",
            `side mutation could not abandon its not-applied intent \u2014 ${intent.path}`,
            recoveryError instanceof Error ? recoveryError.message : String(recoveryError)
          );
        }
        throw error;
      }
      if (checkpoint && await this.retrySideMutationCheckpoint(intent, checkpoint)) {
        return this.canContinue(operationEpoch);
      }
      const recovery = await this.reconcileFailedMutation(intent);
      if (recovery === "applied") return this.canContinue(operationEpoch);
      throw error;
    }
  }
  /** Retry the exact checkpoint produced by a completed mutation. */
  async retrySideMutationCheckpoint(intent, checkpoint) {
    try {
      await this.state.recordMutationReceipt({
        version: 1,
        operationId: intent.operationId,
        completedAt: Date.now(),
        checkpoint
      });
      await this.state.commitMutationCheckpoint(intent.operationId);
      this.diag?.warn("execute", `side mutation checkpoint retried in the same action \u2014 ${intent.path}`);
      return true;
    } catch (recoveryError) {
      this.diag?.warn(
        "execute",
        `side mutation checkpoint retry failed \u2014 ${intent.path}`,
        recoveryError instanceof Error ? recoveryError.message : String(recoveryError)
      );
      return false;
    }
  }
  /** Re-read local/remote facts so a failed mutation can settle in the same round. */
  async reconcileFailedMutation(intent) {
    try {
      const outcome = await this.classifyUnreceiptedMutation(intent);
      if (outcome === "not-applied") {
        await this.state.abandonMutationIntent(intent.operationId);
        this.diag?.log("execute", `mutation recovery proved not applied \u2014 ${intent.path}`);
        return "not-applied";
      }
      if (!outcome) {
        this.diag?.warn("execute", `mutation recovery remains unresolved \u2014 ${intent.path}`);
        return "unresolved";
      }
      await this.state.recordMutationReceipt({
        version: 1,
        operationId: intent.operationId,
        completedAt: Date.now(),
        checkpoint: outcome
      });
      await this.state.commitMutationCheckpoint(intent.operationId);
      this.diag?.warn("execute", `mutation recovered and checkpointed in the same action \u2014 ${intent.path}`);
      return "applied";
    } catch (recoveryError) {
      this.diag?.warn(
        "execute",
        `mutation same-action recovery failed \u2014 ${intent.path}`,
        recoveryError instanceof Error ? recoveryError.message : String(recoveryError)
      );
      return "unresolved";
    }
  }
  async recoverMutationLedger(syncScope, automaticHandlingMetrics) {
    if (this.state.hasMutationLedgerCorruption) {
      throw new Error("Mutation recovery ledger is corrupt");
    }
    const mergeRecovery = automaticHandlingMetrics?.mergeRecovery;
    for (const record of [...this.state.mutationLedger ?? []]) {
      const isAutomaticMerge = record.intent.action === "merge";
      if (isAutomaticMerge && mergeRecovery) mergeRecovery.records++;
      if (!sameSyncScope(record.intent.scope, syncScope)) {
        throw new Error(`Mutation scope no longer matches: ${record.intent.operationId}`);
      }
      if (record.receipt) {
        if (!await this.verifyMutationReceipt(record)) {
          if (isAutomaticMerge && mergeRecovery) mergeRecovery.unresolved++;
          throw new Error(`Mutation receipt no longer matches local/remote facts: ${record.intent.operationId}`);
        }
        await this.state.commitMutationCheckpoint(record.intent.operationId);
        if (isAutomaticMerge) {
          if (mergeRecovery) mergeRecovery.receiptCommitted++;
          await this.getMergeReadyStore().complete(record.intent.operationId);
        }
        continue;
      }
      const outcome = await this.classifyUnreceiptedMutation(record.intent);
      if (outcome === "not-applied") {
        await this.state.abandonMutationIntent(record.intent.operationId);
        if (isAutomaticMerge) {
          if (mergeRecovery) mergeRecovery.notApplied++;
          await this.getMergeReadyStore().complete(record.intent.operationId);
        }
        continue;
      }
      if (!outcome) {
        if (isAutomaticMerge && mergeRecovery) mergeRecovery.unresolved++;
        throw new Error(`Mutation outcome requires manual review: ${record.intent.operationId}`);
      }
      if (isAutomaticMerge) {
        if (outcome.baseUpserts.some((entry) => entry.path === record.intent.path)) {
          if (mergeRecovery) mergeRecovery.remoteCommittedLocalRecovered++;
        } else {
          if (mergeRecovery) mergeRecovery.remoteCommittedLocalPending++;
        }
      }
      const receipt = {
        version: 1,
        operationId: record.intent.operationId,
        completedAt: Date.now(),
        checkpoint: outcome
      };
      await this.state.recordMutationReceipt(receipt);
      await this.state.commitMutationCheckpoint(record.intent.operationId);
      if (isAutomaticMerge) {
        await this.getMergeReadyStore().complete(record.intent.operationId);
      }
    }
  }
  async verifyMutationReceipt(record) {
    const receipt = record.receipt;
    if (!receipt) return false;
    const intent = record.intent;
    const local = await this.inspectLocalPath(intent.path);
    if (local === null || local.status === "uncertain") return false;
    const base = receipt.checkpoint.baseUpserts.find((entry) => entry.path === intent.path);
    if (intent.action === "download") {
      if (!base || !this.inspectionMatchesVersion(local, base)) return false;
      const remote2 = await this.inspectRemotePath(intent.path);
      return this.remoteMatchesExpectation(remote2, intent.expectedRemote);
    }
    if (intent.action === "deleteLocal") {
      return local.status === "missing";
    }
    if (intent.action === "deleteRemote") {
      return await this.inspectRemotePath(intent.path) === void 0;
    }
    if (intent.action === "merge") {
      if (!intent.target) return false;
      const remote2 = await this.inspectRemotePath(intent.path);
      const upsert2 = receipt.checkpoint.remoteUpserts.find((entry) => entry.path === intent.path);
      if (!upsert2 || !remote2 || remote2.driveId !== upsert2.driveId || remote2.eTag !== upsert2.eTag || !await this.remoteMatchesTarget(remote2, intent.target)) return false;
      return !base || this.inspectionMatchesVersion(local, base);
    }
    if (intent.action === "renameRemote") {
      if (!intent.sourcePath || !base || !this.inspectionMatchesVersion(local, base)) return false;
      const [source, target] = await Promise.all([
        this.inspectRemotePath(intent.sourcePath),
        this.inspectRemotePath(intent.path)
      ]);
      const upsert2 = receipt.checkpoint.remoteUpserts.find((entry) => entry.path === intent.path);
      return !source && Boolean(upsert2 && target && target.driveId === upsert2.driveId && target.eTag === upsert2.eTag);
    }
    if (!base || !this.inspectionMatchesVersion(local, base)) return false;
    const remote = await this.inspectRemotePath(intent.path);
    const upsert = receipt.checkpoint.remoteUpserts.find((entry) => entry.path === intent.path);
    return Boolean(upsert && remote && remote.driveId === upsert.driveId && remote.eTag === upsert.eTag);
  }
  async classifyUnreceiptedMutation(intent) {
    const local = await this.inspectLocalPath(intent.path);
    if (local === null || local.status === "uncertain") return null;
    const remotePath = intent.action === "renameRemote" ? intent.sourcePath ?? intent.path : intent.path;
    const remote = await this.inspectRemotePath(remotePath);
    const localStillExpected = this.inspectionMatchesExpectation(local, intent.expectedLocal);
    const remoteStillExpected = this.remoteMatchesExpectation(remote, intent.expectedRemote);
    if (intent.action === "merge") {
      if (!intent.target || !intent.expectedLocal.exists || !intent.expectedRemote.exists) return null;
      if (remoteStillExpected) return localStillExpected ? "not-applied" : null;
      if (!remote || !await this.remoteMatchesTarget(remote, intent.target)) return null;
      const checkpoint2 = emptyMutationCheckpoint();
      const currentRemote = {
        ...remote,
        parentId: this.requireKnownRemoteParentId(
          intent.path,
          remote.parentId
        ),
        sha256Hash: intent.target.hash
      };
      checkpoint2.remoteUpserts.push(currentRemote);
      let currentLocal = local;
      if (localStillExpected) {
        const payload = await this.getMergeReadyStore().read(intent.operationId, intent.target);
        if (!payload) return null;
        await this.commitMergeLocally(intent.path, intent.expectedLocal, intent.target, payload);
        const recoveredLocal = await this.inspectLocalPath(intent.path);
        if (!recoveredLocal || recoveredLocal.status === "uncertain") return null;
        currentLocal = recoveredLocal;
        this.localVersionRecoveredDuringLedger = true;
      }
      if (this.inspectionMatchesVersion(currentLocal, intent.target)) {
        checkpoint2.baseUpserts.push({
          path: intent.path,
          hash: intent.target.hash,
          size: intent.target.size,
          eTag: currentRemote.eTag
        });
        checkpoint2.pendingConflictRemovals.push(intent.path);
      }
      return checkpoint2;
    }
    if ((intent.action === "upload" || intent.action === "deleteRemote" || intent.action === "renameRemote") && remoteStillExpected) return "not-applied";
    if ((intent.action === "download" || intent.action === "deleteLocal") && localStillExpected) {
      return "not-applied";
    }
    const checkpoint = emptyMutationCheckpoint();
    if (intent.action === "upload") {
      if (local.status !== "present" || !local.entry || !intent.expectedLocal.exists || local.entry.hash !== intent.expectedLocal.hash || local.entry.size !== intent.expectedLocal.size) return null;
      const current = await this.inspectRemotePath(intent.path);
      if (!current || !this.localMatchesRemoteHash(local.entry, current)) return null;
      checkpoint.baseUpserts.push(StateManager.toBaseEntry(local.entry, current));
      checkpoint.remoteUpserts.push(current);
      return checkpoint;
    }
    if (intent.action === "download") {
      if (!intent.expectedRemote.exists || local.status !== "present" || !local.entry) return null;
      const current = await this.inspectRemotePath(intent.path);
      if (!this.remoteMatchesExpectation(current, intent.expectedRemote)) return null;
      const expectedHash = intent.expectedRemote.sha256Hash?.toLowerCase();
      if (!expectedHash || local.entry.hash !== expectedHash || local.entry.size !== intent.expectedRemote.size) return null;
      checkpoint.baseUpserts.push({
        path: intent.path,
        hash: local.entry.hash,
        size: local.entry.size,
        eTag: intent.expectedRemote.eTag
      });
      return checkpoint;
    }
    if (intent.action === "deleteRemote") {
      if (await this.inspectRemotePath(intent.path)) return null;
      checkpoint.baseRemovals.push(intent.path);
      checkpoint.remoteDeletes.push(intent.path);
      return checkpoint;
    }
    if (intent.action === "deleteLocal") {
      if (local.status !== "missing") return null;
      checkpoint.baseRemovals.push(intent.path);
      checkpoint.remoteDeletes.push(intent.path);
      checkpoint.pendingDeleteRemovals.push(intent.path);
      return checkpoint;
    }
    if (!intent.sourcePath || !intent.expectedRemote.exists) return null;
    const [source, target] = await Promise.all([
      this.inspectRemotePath(intent.sourcePath),
      this.inspectRemotePath(intent.path)
    ]);
    if (source || !target || target.driveId !== intent.expectedRemote.driveId) return null;
    if (!intent.expectedLocal.exists || local.status !== "present" || !local.entry) return null;
    checkpoint.baseRemovals.push(intent.sourcePath);
    checkpoint.baseUpserts.push({
      path: intent.path,
      hash: local.entry.hash,
      size: local.entry.size,
      eTag: target.eTag
    });
    checkpoint.remoteDeletes.push(intent.sourcePath);
    checkpoint.remoteUpserts.push(target);
    return checkpoint;
  }
  inspectionMatchesExpectation(current, expected) {
    if (!expected.exists) return current.status === "missing";
    return current.status === "present" && current.entry?.hash === expected.hash && current.entry.size === expected.size;
  }
  inspectionMatchesVersion(current, expected) {
    return current.status === "present" && current.entry?.hash === expected.hash && current.entry.size === expected.size;
  }
  remoteMatchesExpectation(current, expected) {
    if (!expected.exists) return current === void 0;
    return Boolean(current && current.driveId === expected.driveId && current.eTag === expected.eTag);
  }
  async remoteMatchesTarget(remote, target, requireReadback = false) {
    if (remote.size !== target.size) return false;
    if (!requireReadback && remote.sha256Hash?.toLowerCase() === target.hash) return true;
    const bytes = await this.onedrive.downloadFile(
      this.vaultName,
      remote.path,
      remote.downloadUrl,
      remote.driveId,
      remote.size
    );
    if (bytes.byteLength !== target.size || await sha256Hex(bytes) !== target.hash) return false;
    const current = await this.inspectRemotePath(remote.path);
    return Boolean(current && current.driveId === remote.driveId && current.eTag === remote.eTag);
  }
  async commitMergeLocally(path, expected, target, payload) {
    const adapter = this.scanner.vault.adapter;
    if (typeof adapter.rename !== "function") {
      throw new Error(`Local adapter cannot commit a merged file safely: ${path}`);
    }
    const readyPath = `${this.getDownloadTempPath(path)}.merge-ready`;
    await this.ensureParentDirs(readyPath);
    await this.removePathIfExists(readyPath);
    try {
      await adapter.writeBinary(readyPath, payload);
      await this.commitDownloadedTempFile(
        adapter,
        path,
        readyPath,
        {
          path,
          hash: expected.hash,
          size: expected.size,
          mtime: 0,
          binary: false
        },
        target
      );
    } finally {
      await this.removePathIfExists(readyPath);
    }
  }
  failureReason(error) {
    if (error instanceof OneDriveError) {
      switch (error.type) {
        case "Unauthorized" /* Unauthorized */:
        case "Forbidden" /* Forbidden */:
          return this.t("syncView.failure.contentUnavailable");
        case "NetworkError" /* NetworkError */:
          return this.t("syncView.failure.network");
        case "RateLimited" /* RateLimited */:
          return this.t("syncView.failure.rateLimited");
        case "InsufficientStorage" /* InsufficientStorage */:
          return this.t("syncView.failure.storageFull");
        case "AuthExpired" /* AuthExpired */:
          return this.t("syncView.failure.authExpired");
        default:
          return this.t("syncView.failure.remote");
      }
    }
    return this.t("syncView.failure.local");
  }
  stopSideActionForAuthFailure(path, error) {
    if (!isAuthFailure(error)) return false;
    this.invalidateLifecycle("auth-expired");
    this.notice("result.authExpired", { path });
    return true;
  }
  async tryAutomaticTextMerge(item, result, metrics, callbacks, operationEpoch, automaticHandlingPolicy) {
    if (!automaticHandlingPolicy.mergeNonOverlappingText || item.reason !== "reason.bothSidesModified") return null;
    const automaticMetrics = metrics.automaticHandling;
    automaticMetrics.textMerge.candidates++;
    if (!item.local || !item.remote) {
      return recordAutomaticMergeManual(automaticMetrics, "missing-version");
    }
    if (item.local.binary) {
      return recordAutomaticMergeManual(automaticMetrics, "binary-file");
    }
    if (isObsidianManagedConfigPath(item.path)) {
      return recordAutomaticMergeManual(automaticMetrics, "protected-config");
    }
    if (!isAutomaticTextMergeCandidatePath(
      item.path,
      getConfigDir(this.scanner.vault)
    )) {
      return recordAutomaticMergeManual(automaticMetrics, "unsupported-text-path");
    }
    const base = typeof this.state.getBaseEntry === "function" ? this.state.getBaseEntry(item.path) : this.state.baseSnapshot.find((entry) => entry.path === item.path);
    const baseContent = this.state.getBaseContent(item.path);
    if (!base || baseContent === void 0) {
      return recordAutomaticMergeManual(automaticMetrics, "ancestor-unavailable");
    }
    const ancestorBytes = new TextEncoder().encode(baseContent).buffer;
    if (ancestorBytes.byteLength !== base.size || await sha256Hex(ancestorBytes) !== base.hash) {
      this.diag?.warn("execute", `automatic merge skipped \u2014 cached ancestor is not the committed base: ${item.path}`);
      return recordAutomaticMergeManual(automaticMetrics, "ancestor-unverified");
    }
    const inspectedBeforeRead = await this.inspectLocalPath(item.path);
    if (!inspectedBeforeRead || inspectedBeforeRead.status === "uncertain" || !this.inspectionMatchesVersion(inspectedBeforeRead, item.local)) {
      return recordAutomaticMergeManual(automaticMetrics, "local-version-changed");
    }
    const localBytes = await this.scanner.vault.adapter.readBinary(item.path);
    if (localBytes.byteLength !== item.local.size || await sha256Hex(localBytes) !== item.local.hash) {
      return recordAutomaticMergeManual(automaticMetrics, "local-version-changed");
    }
    if (!this.canContinue(operationEpoch, result)) {
      automaticMetrics.textMerge.cancelled++;
      return { executed: false };
    }
    const remoteBytes = await this.onedrive.downloadFile(
      this.vaultName,
      item.path,
      item.remote.downloadUrl,
      item.remote.driveId,
      item.remote.size,
      callbacks.onFileProgress
    );
    const remoteHash = await sha256Hex(remoteBytes);
    await this.verifyDownloadedPayload(item.path, item.remote, {
      size: remoteBytes.byteLength,
      hash: remoteHash
    });
    const remoteCurrent = await this.inspectRemotePath(item.path);
    if (!remoteCurrent || remoteCurrent.driveId !== item.remote.driveId || remoteCurrent.eTag !== item.remote.eTag) {
      return recordAutomaticMergeManual(automaticMetrics, "remote-version-changed");
    }
    const merge = await evaluateConservativeMergeV2({
      ancestor: { bytes: ancestorBytes, hash: base.hash },
      local: { bytes: localBytes, hash: item.local.hash, size: item.local.size },
      remote: {
        bytes: remoteBytes,
        hash: remoteHash,
        size: item.remote.size,
        remoteId: item.remote.driveId,
        eTag: item.remote.eTag
      },
      expectedRemoteId: item.remote.driveId,
      expectedRemoteETag: item.remote.eTag,
      lifecycleCurrent: this.canContinue(operationEpoch, result),
      envelopeCommitCurrent: Boolean(this.activeSyncScope && (!this.state.remoteScope || sameSyncScope(this.activeSyncScope, this.state.remoteScope))),
      localVersionCurrent: true,
      remoteVersionCurrent: true,
      recoveryPending: this.state.mutationLedger.length > 0
    });
    if (merge.status !== "ready") {
      this.diag?.log("execute", `automatic merge kept manual \u2014 ${item.path}, reason=${merge.reason}`);
      return recordAutomaticMergeManual(automaticMetrics, merge.reason);
    }
    const target = { hash: merge.mergedHash, size: merge.mergedBytes.byteLength };
    const intent = this.createMergeMutationIntent(item, target);
    const readyStore = this.getMergeReadyStore();
    await readyStore.prepare(intent.operationId, merge.mergedBytes, target);
    try {
      const committed = await this.runDurableSideMutation(intent, operationEpoch, async () => {
        const localBeforeRemote = await this.inspectLocalPath(item.path);
        if (!localBeforeRemote || localBeforeRemote.status === "uncertain" || !this.inspectionMatchesExpectation(localBeforeRemote, intent.expectedLocal)) {
          throw new SideMutationNotAppliedError(`Local version changed before automatic merge: ${item.path}`);
        }
        await this.onedrive.uploadFile(
          this.vaultName,
          item.path,
          merge.mergedBytes,
          callbacks.onFileProgress,
          item.remote.eTag,
          item.remote.driveId
        );
        const uploadedRemote = await this.inspectRemotePath(item.path);
        if (!uploadedRemote || !await this.remoteMatchesTarget(uploadedRemote, target, true)) {
          throw new Error(`Automatic merge remote read-back failed: ${item.path}`);
        }
        const remoteEntry = {
          ...uploadedRemote,
          parentId: this.requireKnownRemoteParentId(
            item.path,
            uploadedRemote.parentId,
            item.remote?.parentId
          ),
          sha256Hash: target.hash
        };
        let localAfterRemote = await this.inspectLocalPath(item.path);
        if (!localAfterRemote || localAfterRemote.status === "uncertain") {
          throw new Error(`Local version could not be verified after automatic merge: ${item.path}`);
        }
        if (this.inspectionMatchesExpectation(localAfterRemote, intent.expectedLocal)) {
          await this.commitMergeLocally(
            item.path,
            intent.expectedLocal,
            target,
            merge.mergedBytes
          );
          localAfterRemote = await this.inspectLocalPath(item.path);
          if (!localAfterRemote || localAfterRemote.status === "uncertain") {
            throw new Error(`Merged local version could not be verified: ${item.path}`);
          }
        }
        const checkpoint = emptyMutationCheckpoint();
        checkpoint.remoteUpserts.push(remoteEntry);
        if (this.inspectionMatchesVersion(localAfterRemote, target)) {
          checkpoint.baseUpserts.push({
            path: item.path,
            hash: target.hash,
            size: target.size,
            eTag: remoteEntry.eTag
          });
          checkpoint.pendingConflictRemovals.push(item.path);
        }
        return checkpoint;
      });
      if (!committed) {
        automaticMetrics.textMerge.cancelled++;
        return { executed: false };
      }
      const [localAfterCommit, remoteAfterCommit] = await Promise.all([
        this.inspectLocalPath(item.path),
        this.inspectRemotePath(item.path)
      ]);
      const fullyMerged = Boolean(localAfterCommit && this.inspectionMatchesVersion(localAfterCommit, target));
      if (localAfterCommit?.status === "present" && localAfterCommit.entry) {
        item.local = localAfterCommit.entry;
      } else if (localAfterCommit?.status === "missing") {
        item.local = void 0;
      }
      if (remoteAfterCommit) item.remote = remoteAfterCommit;
      result.uploaded++;
      metrics.uploadBytes += target.size;
      if (fullyMerged) {
        this.state.cacheBaseContent(item.path, merge.mergedBytes);
        automaticMetrics.textMerge.completed++;
        return {
          executed: true,
          resolvedConflict: true,
          completionActionType: "upload" /* Upload */,
          completionReason: this.t("syncView.merge.autoMerged", { path: item.path })
        };
      }
      this.diag?.warn(
        "execute",
        `automatic merge preserved a newer local version after remote commit \u2014 ${item.path}`
      );
      item.reason = item.local ? "reason.bothSidesModified" : "reason.localDeletedRemoteModified";
      recordAutomaticMergeManual(
        automaticMetrics,
        "remote-committed-local-pending"
      );
      return { executed: true };
    } catch (error) {
      const unresolved = this.state.mutationLedger.some(
        (entry) => entry.intent.operationId === intent.operationId
      );
      if (!unresolved) await readyStore.complete(intent.operationId);
      if (unresolved || isAuthFailure(error)) throw error;
      this.diag?.warn(
        "execute",
        `automatic merge degraded to manual review \u2014 ${item.path}`,
        error instanceof Error ? error.message : String(error)
      );
      return recordAutomaticMergeManual(automaticMetrics, "execution-failed");
    } finally {
      if (!this.state.mutationLedger.some(
        (entry) => entry.intent.operationId === intent.operationId
      )) {
        await readyStore.complete(intent.operationId);
      }
    }
  }
  async queuePendingConflict(item, result, operationEpoch) {
    if (!this.canContinue(operationEpoch, result)) return { executed: false };
    await this.state.addPendingConflict(this.withDecisionToken(item));
    if (!this.canContinue(operationEpoch, result)) return { executed: false };
    result.conflicts++;
    return { executed: true };
  }
  async executeItem(item, result, remoteUpserts, remoteDeletes, metrics, callbacks, operationEpoch, automaticHandlingPolicy, preparedDownload) {
    switch (item.type) {
      case "upload" /* Upload */: {
        if (!item.local) break;
        const readStartedAt = Date.now();
        const content = await this.scanner.vault.adapter.readBinary(item.path);
        const readElapsedMs = Date.now() - readStartedAt;
        metrics.uploadReadMs += readElapsedMs;
        metrics.fileTransfers.upload.stagesMs.sourceRead += readElapsedMs;
        if (!this.canContinue(operationEpoch, result)) return { executed: false };
        const hashStartedAt = Date.now();
        const actualHash = await sha256Hex(content);
        metrics.fileTransfers.upload.stagesMs.contentHash += Date.now() - hashStartedAt;
        if (actualHash !== item.local.hash) {
          this.diag?.warn("execute", `upload skipped \u2014 ${item.path} hash changed since scan (${item.local.hash.slice(0, 8)}\u2026 \u2192 ${actualHash.slice(0, 8)}\u2026)`);
          result.deferred++;
          return {
            executed: false,
            completionActionType: "retryLater" /* RetryLater */,
            completionReason: this.t("syncView.fileStatus.deferred")
          };
        }
        if (!this.canContinue(operationEpoch, result)) return { executed: false };
        metrics.activeUploads++;
        metrics.peakUploads = Math.max(metrics.peakUploads, metrics.activeUploads);
        const uploadStartedAt = Date.now();
        let uploadResult;
        try {
          uploadResult = await this.onedrive.uploadFile(
            this.vaultName,
            item.path,
            content,
            callbacks.onFileProgress,
            item.baseEtag,
            item.remote?.driveId
          );
          const uploadElapsedMs = Date.now() - uploadStartedAt;
          metrics.uploadNetworkMs += uploadElapsedMs;
          metrics.fileTransfers.upload.stagesMs.contentTransfer += uploadElapsedMs;
        } catch (e) {
          const uploadElapsedMs = Date.now() - uploadStartedAt;
          metrics.uploadNetworkMs += uploadElapsedMs;
          metrics.fileTransfers.upload.stagesMs.contentTransfer += uploadElapsedMs;
          if (e instanceof OneDriveError && isRemoteMutationConflict(e)) {
            const fresh = await this.onedrive.getFileMetadata(
              this.vaultName,
              item.path
            );
            if (!this.canContinue(operationEpoch, result)) {
              metrics.activeUploads--;
              return { executed: false };
            }
            if (fresh) {
              metrics.activeUploads--;
              if (this.localMatchesRemoteHash(item.local, fresh)) {
                const remoteEntry2 = this.toMetadataRemoteEntry(
                  item.path,
                  fresh,
                  item.remote?.parentId
                );
                remoteUpserts.push(remoteEntry2);
                return {
                  executed: true,
                  baseUpsert: StateManager.toBaseEntry(item.local, remoteEntry2)
                };
              }
              const remoteEntry = this.toMetadataRemoteEntry(
                item.path,
                fresh,
                item.remote?.parentId
              );
              remoteUpserts.push(remoteEntry);
              return this.queuePendingConflict({
                type: "conflict" /* Conflict */,
                path: item.path,
                local: item.local,
                remote: remoteEntry,
                reason: "reason.bothSidesModified"
              }, result, operationEpoch);
            }
            if (!this.canContinue(operationEpoch, result)) {
              metrics.activeUploads--;
              return { executed: false };
            }
            const retryStartedAt = Date.now();
            try {
              uploadResult = await this.onedrive.uploadFile(
                this.vaultName,
                item.path,
                content,
                callbacks.onFileProgress
              );
            } catch (retryError) {
              if (retryError instanceof OneDriveError && isRemoteMutationConflict(retryError)) {
                const raced = await this.onedrive.getFileMetadata(this.vaultName, item.path);
                if (!this.canContinue(operationEpoch, result)) {
                  metrics.activeUploads--;
                  return { executed: false };
                }
                if (raced) {
                  const racedEntry = this.toMetadataRemoteEntry(
                    item.path,
                    raced,
                    item.remote?.parentId
                  );
                  metrics.activeUploads--;
                  remoteUpserts.push(racedEntry);
                  return this.queuePendingConflict({
                    type: "conflict" /* Conflict */,
                    path: item.path,
                    local: item.local,
                    remote: racedEntry,
                    reason: "reason.newFileBothSides"
                  }, result, operationEpoch);
                }
              }
              metrics.activeUploads--;
              throw retryError;
            }
            const retryElapsedMs = Date.now() - retryStartedAt;
            metrics.uploadNetworkMs += retryElapsedMs;
            metrics.fileTransfers.upload.stagesMs.contentTransfer += retryElapsedMs;
          } else {
            metrics.activeUploads--;
            throw e;
          }
        }
        metrics.activeUploads--;
        const baseUpsert = {
          path: item.path,
          hash: item.local.hash,
          size: item.local.size,
          eTag: uploadResult.eTag ?? ""
        };
        metrics.uploadBytes += item.local.size;
        remoteUpserts.push(this.toUploadedRemoteEntry(
          item.path,
          item.local,
          uploadResult,
          item.remote?.parentId
        ));
        result.uploaded++;
        this.state.cacheBaseContent(item.path, content);
        return { executed: true, mutationApplied: true, baseUpsert };
      }
      case "download" /* Download */: {
        if (!item.remote) break;
        const usesLocalCas = typeof this.scanner.inspectFile === "function";
        const firstLocalGuardStartedAt = Date.now();
        const beforeDownload = await this.guardDownloadLocalVersion(item, result, operationEpoch);
        metrics.fileTransfers.download.stagesMs.localVersionGuard += Date.now() - firstLocalGuardStartedAt;
        if (beforeDownload) return beforeDownload;
        const streamAdapter = this.getStreamDownloadAdapter(item.remote.size);
        const tempDownloadPath = streamAdapter ? this.getDownloadTempPath(item.path) : null;
        let streamedDownload = null;
        let content = preparedDownload?.content ?? null;
        if (preparedDownload?.downloaded) {
          streamedDownload = preparedDownload.downloaded;
        } else if (streamAdapter && tempDownloadPath) {
          await this.ensureParentDirs(tempDownloadPath);
          this.diag?.log("execute", `download streaming to temp file \u2014 ${item.path}`);
          const transferStartedAt = Date.now();
          try {
            streamedDownload = await this.onedrive.downloadFileToPath(
              this.vaultName,
              item.path,
              tempDownloadPath,
              streamAdapter,
              item.remote.downloadUrl,
              item.remote.driveId,
              item.remote.size,
              item.remote.sha256Hash,
              callbacks.onFileProgress
            );
          } finally {
            metrics.fileTransfers.download.stagesMs.contentTransfer += Date.now() - transferStartedAt;
          }
        } else {
          const transferStartedAt = Date.now();
          try {
            content = await this.onedrive.downloadFile(
              this.vaultName,
              item.path,
              item.remote.downloadUrl,
              item.remote.driveId,
              item.remote.size,
              callbacks.onFileProgress
            );
          } finally {
            metrics.fileTransfers.download.stagesMs.contentTransfer += Date.now() - transferStartedAt;
          }
        }
        let downloaded = streamedDownload;
        if (!downloaded) {
          const hashStartedAt = Date.now();
          downloaded = {
            size: content.byteLength,
            hash: await sha256Hex(content)
          };
          metrics.fileTransfers.download.stagesMs.contentHash += Date.now() - hashStartedAt;
        }
        if (!preparedDownload?.downloaded) {
          const remoteVerifyStartedAt = Date.now();
          try {
            await this.verifyDownloadedPayload(item.path, item.remote, downloaded);
          } catch (error) {
            if (tempDownloadPath) await this.removePathIfExists(tempDownloadPath);
            throw error;
          } finally {
            metrics.fileTransfers.download.stagesMs.remoteVersionVerify += Date.now() - remoteVerifyStartedAt;
          }
        }
        if (!this.canContinue(operationEpoch, result)) {
          if (tempDownloadPath) {
            await this.removePathIfExists(tempDownloadPath);
          }
          return { executed: false };
        }
        const secondLocalGuardStartedAt = Date.now();
        const beforeWrite = await this.guardDownloadLocalVersion(item, result, operationEpoch);
        metrics.fileTransfers.download.stagesMs.localVersionGuard += Date.now() - secondLocalGuardStartedAt;
        if (beforeWrite) {
          if (tempDownloadPath) {
            await this.removePathIfExists(tempDownloadPath);
          }
          return beforeWrite;
        }
        const localCommitStartedAt = Date.now();
        if (!this.canContinue(operationEpoch, result)) return { executed: false };
        await this.ensureParentDirs(item.path);
        if (!usesLocalCas && item.local) {
          let currentContent = null;
          try {
            currentContent = await this.scanner.vault.adapter.readBinary(item.path);
          } catch {
          }
          if (currentContent) {
            const currentHash = await sha256Hex(currentContent);
            if (currentHash !== item.local.hash) {
              this.diag?.warn("execute", `download blocked \u2014 ${item.path} was modified locally since scan (${item.local.hash.slice(0, 8)}\u2026 \u2192 ${currentHash.slice(0, 8)}\u2026)`);
              if (this.localMatchesRemoteHash({ hash: currentHash, size: currentContent.byteLength }, item.remote)) {
                if (tempDownloadPath) {
                  await this.removePathIfExists(tempDownloadPath);
                }
                return {
                  executed: true,
                  baseUpsert: StateManager.toBaseEntry(
                    { ...item.local, hash: currentHash, size: currentContent.byteLength },
                    item.remote
                  )
                };
              }
              const stat = await this.scanner.vault.adapter.stat(item.path);
              if (tempDownloadPath) {
                await this.removePathIfExists(tempDownloadPath);
              }
              return this.queuePendingConflict({
                ...item,
                type: "conflict" /* Conflict */,
                local: {
                  ...item.local,
                  hash: currentHash,
                  size: currentContent.byteLength,
                  mtime: stat?.mtime ?? item.local.mtime
                },
                reason: "reason.bothSidesModified"
              }, result, operationEpoch);
            }
          }
        }
        let fileStat = null;
        if (!this.canContinue(operationEpoch, result)) return { executed: false };
        if (streamAdapter && tempDownloadPath && streamedDownload) {
          try {
            if (usesLocalCas) {
              fileStat = await this.commitDownloadedTempFile(
                streamAdapter,
                item.path,
                tempDownloadPath,
                item.local,
                streamedDownload
              );
            } else {
              await streamAdapter.rename(tempDownloadPath, item.path);
              const stat = await streamAdapter.stat(item.path);
              fileStat = stat ? { size: stat.size, mtime: stat.mtime } : null;
            }
          } catch (writeErr) {
            this.diag?.warn("execute", `streamed download commit failed for ${item.path}, recovery attempted`, writeErr instanceof Error ? writeErr.message : String(writeErr));
            if (writeErr instanceof LocalCommitPreconditionError) {
              const guarded = await this.guardDownloadLocalVersion(item, result, operationEpoch);
              if (guarded) return guarded;
              result.deferred++;
              return {
                executed: false,
                completionActionType: "retryLater" /* RetryLater */,
                completionReason: this.t("syncView.fileStatus.deferred")
              };
            }
            throw writeErr;
          }
        } else {
          if (!usesLocalCas) {
            await this.scanner.vault.adapter.writeBinary(item.path, content);
            const stat = await this.scanner.vault.adapter.stat(item.path);
            fileStat = stat ? { size: stat.size, mtime: stat.mtime } : null;
          } else {
            const readyPath = `${this.getDownloadTempPath(item.path)}.ready`;
            try {
              await this.ensureParentDirs(readyPath);
              await this.removePathIfExists(readyPath);
              await this.scanner.vault.adapter.writeBinary(readyPath, content);
              const readyBytes = await this.scanner.vault.adapter.readBinary(readyPath);
              const downloadedHash = downloaded.hash;
              if (readyBytes.byteLength !== content.byteLength || await sha256Hex(readyBytes) !== downloadedHash) {
                throw new Error(`Downloaded temp file verification failed: ${item.path}`);
              }
              fileStat = await this.commitDownloadedTempFile(
                this.scanner.vault.adapter,
                item.path,
                readyPath,
                item.local,
                { size: content.byteLength, hash: downloadedHash }
              );
            } catch (writeErr) {
              await this.removePathIfExists(readyPath);
              this.diag?.warn("execute", `download write failed for ${item.path}, recovery attempted`, writeErr instanceof Error ? writeErr.message : String(writeErr));
              if (writeErr instanceof LocalCommitPreconditionError) {
                const guarded = await this.guardDownloadLocalVersion(item, result, operationEpoch);
                if (guarded) return guarded;
                result.deferred++;
                return {
                  executed: false,
                  completionActionType: "retryLater" /* RetryLater */,
                  completionReason: this.t("syncView.fileStatus.deferred")
                };
              }
              throw writeErr;
            }
          }
        }
        metrics.fileTransfers.download.stagesMs.localCommit += Date.now() - localCommitStartedAt;
        const hash = downloaded.hash;
        result.downloaded++;
        if (content) {
          this.state.cacheBaseContent(item.path, content);
        }
        return {
          executed: true,
          mutationApplied: true,
          baseUpsert: {
            path: item.path,
            hash,
            size: fileStat?.size ?? downloaded.size,
            eTag: item.remote.eTag
          }
        };
      }
      case "deleteRemote" /* DeleteRemote */: {
        try {
          if (!this.canContinue(operationEpoch, result)) return { executed: false };
          await this.onedrive.deleteItem(
            this.vaultName,
            item.path,
            item.remote?.eTag,
            item.remote?.driveId
          );
        } catch (e) {
          if (e instanceof OneDriveError && isRemoteMutationConflict(e)) {
            this.diag?.warn("execute", `delete blocked \u2014 ${item.path} eTag changed since plan`);
            const fresh = await this.onedrive.getFileMetadata(
              this.vaultName,
              item.path
            );
            if (!this.canContinue(operationEpoch, result)) return { executed: false };
            if (!fresh) {
              remoteDeletes.push(item.path);
              result.deleted++;
              return { executed: true, baseRemoval: item.path };
            }
            const remoteEntry = this.toMetadataRemoteEntry(
              item.path,
              fresh,
              item.remote?.parentId
            );
            remoteUpserts.push(remoteEntry);
            return this.queuePendingConflict({
              type: "conflict" /* Conflict */,
              path: item.path,
              remote: remoteEntry,
              reason: "reason.localDeletedRemoteModified"
            }, result, operationEpoch);
          }
          throw e;
        }
        remoteDeletes.push(item.path);
        result.deleted++;
        return { executed: true, mutationApplied: true, baseRemoval: item.path };
      }
      case "deleteLocal" /* DeleteLocal */: {
        if (!item.local) return { executed: false };
        if (isObsidianManagedConfigPath(item.path)) {
          throw new Error(this.t("notice.decisionExpired"));
        }
        if (!this.canContinue(operationEpoch, result)) return { executed: false };
        const remote = await this.onedrive.getFileMetadata(this.vaultName, item.path);
        if (!this.canContinue(operationEpoch, result)) return { executed: false };
        if (remote) throw new Error(this.t("notice.decisionExpired"));
        const current = await this.inspectLocalPath(item.path);
        if (!current || current.status === "uncertain") {
          throw new Error(this.t("notice.localChangedSinceReview"));
        }
        if (current.status === "present" && !this.localExpectationMatches(item.local, current)) {
          throw new Error(this.t("notice.localChangedSinceReview"));
        }
        if (!this.canContinue(operationEpoch, result)) return { executed: false };
        if (current.status === "present") await this.deleteLocalPath(item.path);
        result.deleted++;
        return { executed: true, mutationApplied: true, baseRemoval: item.path };
      }
      case "renameRemote" /* RenameRemote */: {
        if (!item.renameFrom || !item.local || !item.remote) return { executed: false };
        if (!this.canContinue(operationEpoch, result)) return { executed: false };
        let updated;
        try {
          updated = await this.onedrive.renameItem(
            this.vaultName,
            item.renameFrom,
            item.path,
            item.remote.driveId,
            item.remote.eTag
          );
        } catch (error) {
          if (!(error instanceof OneDriveError) || !isRemoteMutationConflict(error)) throw error;
          const fresh = await this.onedrive.getFileMetadata(this.vaultName, item.renameFrom);
          if (!this.canContinue(operationEpoch, result)) return { executed: false };
          if (!fresh) {
            return this.queuePendingConflict({
              type: "conflict" /* Conflict */,
              path: item.path,
              local: item.local,
              reason: "reason.remoteDeletedLocalModified"
            }, result, operationEpoch);
          }
          const remoteEntry = this.toMetadataRemoteEntry(
            item.renameFrom,
            fresh,
            item.remote.parentId
          );
          remoteUpserts.push(remoteEntry);
          return this.queuePendingConflict({
            type: "conflict" /* Conflict */,
            path: item.path,
            local: item.local,
            remote: remoteEntry,
            reason: "reason.bothSidesModified"
          }, result, operationEpoch);
        }
        remoteDeletes.push(item.renameFrom);
        remoteUpserts.push({
          path: item.path,
          driveId: updated.id,
          parentId: this.requireKnownRemoteParentId(
            item.path,
            updated.parentReference?.id,
            item.remote.parentId
          ),
          size: updated.size ?? item.local.size,
          mtime: updated.lastModifiedDateTime ? new Date(updated.lastModifiedDateTime).getTime() : Date.now(),
          eTag: updated.eTag ?? "",
          cTag: updated.cTag ?? "",
          sha256Hash: item.local.hash
        });
        return {
          executed: true,
          mutationApplied: true,
          baseUpsert: { path: item.path, hash: item.local.hash, size: item.local.size, eTag: updated.eTag ?? "" },
          baseRemoval: item.renameFrom
        };
      }
      case "confirmLocalDelete" /* ConfirmLocalDelete */: {
        result.conflicts++;
        return { executed: true };
      }
      case "conflict" /* Conflict */: {
        const automatic = await this.tryAutomaticTextMerge(
          item,
          result,
          metrics,
          callbacks,
          operationEpoch,
          automaticHandlingPolicy
        );
        if (automatic?.resolvedConflict || automatic?.executed === false) return automatic;
        result.conflicts++;
        return automatic ?? { executed: true };
      }
      case "skipLargeFile" /* SkipLargeFile */:
        return { executed: true };
      case "skipIgnoredPath" /* SkipIgnoredPath */:
        result.skippedIgnored++;
        return { executed: true };
      case "retryLater" /* RetryLater */:
        result.errors++;
        return { executed: true };
      case "authExpired" /* AuthExpired */:
        result.authExpired = true;
        return { executed: true };
    }
    return { executed: true };
  }
  seedBaseEntriesFromCloudBaseline(json, localEntries, remoteEntries) {
    let baseline;
    try {
      baseline = JSON.parse(json);
    } catch (e) {
      this.diag?.warn("state", "cloud baseline parse failed", e);
      return [];
    }
    if (baseline.vaultName !== this.vaultName || !baseline.files || typeof baseline.files !== "object") {
      return [];
    }
    const localByPath = new Map(localEntries.map((entry) => [entry.path, entry]));
    const remoteByPath = new Map(remoteEntries.map((entry) => [entry.path, entry]));
    const seeded = [];
    for (const [path, entry] of Object.entries(baseline.files)) {
      const local = localByPath.get(path);
      const remote = remoteByPath.get(path);
      if (!local || !remote) continue;
      if (local.hash !== entry.hash || local.size !== entry.size) continue;
      if (!remote.sha256Hash || remote.sha256Hash.toLowerCase() !== entry.hash.toLowerCase() || remote.size !== entry.size) continue;
      seeded.push({
        path,
        hash: entry.hash,
        size: entry.size,
        eTag: remote.eTag
      });
    }
    return seeded;
  }
  async persistSeededBaseEntries(entries) {
    const merged = /* @__PURE__ */ new Map();
    for (const entry of entries) {
      merged.set(entry.path, entry);
    }
    for (const entry of this.state.baseSnapshot) {
      merged.set(entry.path, entry);
    }
    await this.state.setBaseSnapshot([...merged.values()]);
  }
  /** Use persisted remote state for incremental delta, rebuilding on failure. */
  async tryDeltaOrFullScan(operationEpoch, result, syncScope, localEntries) {
    let currentScope = syncScope;
    let { filesRootId } = currentScope;
    if (this.state.hasRemoteState && this.state.remoteDeltaLink) {
      if (!sameSyncScope(this.state.remoteScope, syncScope)) {
        this.diag?.warn(
          "onedrive",
          "remote cache belongs to a different or incomplete sync scope; rebuilding from known Graph identities"
        );
        const entries = await this.rebuildRemoteStateFromIdentitySnapshot(
          operationEpoch,
          result,
          currentScope
        );
        return { entries, scope: currentScope };
      }
      if (this.hasLegacyFilesRootPollution(this.state.remoteSnapshot, localEntries)) {
        this.remoteRecoveryPreviewRequired = true;
        this.diag?.warn(
          "onedrive",
          "remote cache contains the legacy files/ namespace prefix; rebuilding from the known files root"
        );
        const entries = await this.rebuildRemoteStateFromIdentitySnapshot(
          operationEpoch,
          result,
          currentScope
        );
        return { entries, scope: currentScope };
      }
      try {
        const delta = await this.onedrive.getDelta(
          this.vaultName,
          this.state.remoteDeltaLink
        );
        const projection = this.applyRemoteDelta(
          this.state.remoteSnapshot,
          this.state.remoteFolders,
          delta.value,
          filesRootId
        );
        const entries = projection.entries;
        if (!this.canContinue(operationEpoch, result)) return { entries, scope: currentScope };
        await this.state.setRemoteState(
          entries,
          delta["@odata.deltaLink"] ?? null,
          currentScope,
          projection.folders
        );
        this.diag?.log("onedrive", `incremental delta returned ${delta.value.length} change(s) \u2192 ${entries.length} cached remote entries`);
        return { entries, scope: currentScope };
      } catch (e) {
        if (!this.canContinue(operationEpoch, result)) return { entries: [], scope: currentScope };
        if (e instanceof IncrementalRemoteHierarchyError) {
          this.diag?.warn(
            "onedrive",
            `${e.message}; rebuilding a complete remote identity snapshot`
          );
          const entries = await this.rebuildRemoteStateFromIdentitySnapshot(
            operationEpoch,
            result,
            currentScope
          );
          return { entries, scope: currentScope };
        }
        if (!isDeltaStateInvalid(e)) {
          throw e;
        }
        this.diag?.warn("onedrive", `incremental delta failed (${e instanceof Error ? e.message : "unknown"}), rebuilding remote cache`);
        if (!this.canContinue(operationEpoch, result)) return { entries: [], scope: currentScope };
        this.onedrive.invalidateVaultScope(this.vaultName);
        const refreshedRemoteScope = await this.onedrive.initVaultScope(this.vaultName);
        const refreshedSyncScope = {
          accountId: currentScope.accountId,
          ...refreshedRemoteScope
        };
        if (!sameSyncScope(refreshedSyncScope, currentScope) && this.state.mutationLedger.length > 0) {
          throw new Error("Remote scope changed while mutation recovery is unresolved");
        }
        currentScope = refreshedSyncScope;
        this.activeSyncScope = currentScope;
        filesRootId = refreshedSyncScope.filesRootId;
        await this.state.clearRemoteState();
      }
    }
    try {
      const delta = await this.onedrive.getDelta(this.vaultName);
      const projection = this.projectCompleteRemoteSnapshot(delta.value, filesRootId);
      const entries = projection.entries;
      if (!this.canContinue(operationEpoch, result)) return { entries, scope: currentScope };
      await this.state.setRemoteState(
        entries,
        delta["@odata.deltaLink"] ?? null,
        currentScope,
        projection.folders
      );
      this.diag?.log("onedrive", `delta returned ${delta.value.length} items \u2192 ${entries.length} remote entries`);
      return { entries, scope: currentScope };
    } catch (e) {
      if (!this.canContinue(operationEpoch, result)) return { entries: [], scope: currentScope };
      this.diag?.warn("onedrive", `delta failed (${e instanceof Error ? e.message : "unknown"}), falling back to full scan`);
      try {
        const items = await this.onedrive.fullScan(this.vaultName);
        const projection = this.projectCompleteRemoteSnapshot(items, filesRootId);
        const entries = projection.entries;
        if (!this.canContinue(operationEpoch, result)) return { entries, scope: currentScope };
        await this.state.setRemoteState(entries, null, currentScope, projection.folders);
        this.diag?.log("onedrive", `full scan returned ${items.length} items \u2192 ${entries.length} remote entries`);
        return { entries, scope: currentScope };
      } catch (e2) {
        if (!this.canContinue(operationEpoch, result)) return { entries: [], scope: currentScope };
        if (e2 instanceof OneDriveError && e2.type === "NotFound" /* NotFound */) {
          if (!this.canContinue(operationEpoch, result)) return { entries: [], scope: currentScope };
          await this.state.setRemoteState([], null, currentScope);
          return { entries: [], scope: currentScope };
        }
        throw e2;
      }
    }
  }
  /** Rebuild a path-complete V1 snapshot through the validated V2 identity
   * projector. The existing committed snapshot/cursor stays untouched until
   * the complete replacement has passed hierarchy validation. */
  async rebuildRemoteStateFromIdentitySnapshot(operationEpoch, result, syncScope) {
    const { filesRootId } = syncScope;
    const delta = await this.onedrive.getDelta(this.vaultName);
    const projection = this.projectCompleteRemoteSnapshot(delta.value, filesRootId);
    const entries = projection.entries;
    if (!this.canContinue(operationEpoch, result)) return entries;
    await this.state.setRemoteState(
      entries,
      delta["@odata.deltaLink"] ?? null,
      syncScope,
      projection.folders
    );
    this.diag?.log(
      "onedrive",
      `remote identity rebuild returned ${delta.value.length} item(s) \u2192 ${entries.length} cached remote entries`
    );
    return entries;
  }
  projectCompleteRemoteSnapshot(items, filesRootId) {
    const latestById = /* @__PURE__ */ new Map();
    for (const item of items) latestById.set(item.id, item);
    const liveItems = [...latestById.values()].filter(
      (item) => !item.deleted && Boolean(item.file || item.folder)
    );
    const scopedItems = this.selectFilesRootDescendants(liveItems, filesRootId);
    const projection = buildRemoteIndexV2(
      scopedItems,
      filesRootId,
      null
    );
    const entries = [];
    const folders = [];
    for (const node of Object.values(projection.index.itemsById)) {
      const item = latestById.get(node.id);
      const path = projection.pathById.get(node.id);
      if (!item || !path) {
        throw new Error(`Remote hierarchy projection incomplete: ${node.id}`);
      }
      if (node.kind === "folder") {
        folders.push({
          path,
          driveId: node.id,
          parentId: node.parentId,
          name: item.name
        });
        continue;
      }
      if (!this.shouldIncludeRemotePath(path)) continue;
      entries.push(this.toRemoteEntry(item, path, node.parentId));
    }
    this.v2ShadowIdentityInput = {
      remoteItems: [...scopedItems],
      v1RemoteEntries: [...entries]
    };
    return { entries, folders };
  }
  observeV2ReadOnlyShadow(syncScope, localEntries, baseEntries, skippedLarge, v1Plan) {
    if (!this.diag || !this.v2ShadowIdentityInput) return;
    const report = compareV1WithV2Shadow({
      v1Scope: syncScope,
      v2Scope: { ...syncScope },
      remoteItems: this.v2ShadowIdentityInput.remoteItems,
      v1RemoteEntries: this.v2ShadowIdentityInput.v1RemoteEntries,
      localEntries,
      baseEntries,
      skippedLarge,
      v1Plan,
      includeRemotePath: (path) => this.shouldIncludeRemotePath(path)
    });
    this.diag.log(
      "plan",
      `V2 read-only shadow ${report.status} \u2014 remote ${report.remoteCounts.v1}/${report.remoteCounts.v2}, plan ${report.planCounts.v1}/${report.planCounts.v2}, differences=${report.differences.length}`,
      report
    );
  }
  selectFilesRootDescendants(liveItems, filesRootId) {
    const childrenByParent = /* @__PURE__ */ new Map();
    for (const item of liveItems) {
      const parentId = item.parentReference?.id;
      if (!parentId) throw new Error(`Remote identity incomplete: ${item.id}`);
      const siblings = childrenByParent.get(parentId) ?? [];
      siblings.push(item);
      childrenByParent.set(parentId, siblings);
    }
    const descendants = [];
    const descendantIds = /* @__PURE__ */ new Set();
    const pending = [filesRootId];
    while (pending.length > 0) {
      const parentId = pending.shift();
      for (const child of childrenByParent.get(parentId) ?? []) {
        if (child.id === filesRootId || descendantIds.has(child.id)) {
          throw new Error(`Remote hierarchy cycle: ${child.id}`);
        }
        descendantIds.add(child.id);
        descendants.push(child);
        if (child.folder) pending.push(child.id);
      }
    }
    const filesRoot = liveItems.find((item) => item.id === filesRootId);
    const allowedOutside = /* @__PURE__ */ new Set([filesRootId]);
    if (filesRoot?.parentReference?.id) {
      let ancestorId = filesRoot.parentReference.id;
      while (ancestorId) {
        allowedOutside.add(ancestorId);
        const ancestor = liveItems.find((item) => item.id === ancestorId);
        ancestorId = ancestor?.parentReference?.id;
      }
      const outsidePending = (childrenByParent.get(filesRoot.parentReference.id) ?? []).filter((item) => item.id !== filesRootId);
      while (outsidePending.length > 0) {
        const outside = outsidePending.shift();
        if (allowedOutside.has(outside.id)) continue;
        allowedOutside.add(outside.id);
        if (outside.folder) {
          outsidePending.push(...childrenByParent.get(outside.id) ?? []);
        }
      }
    }
    const unresolved = liveItems.filter(
      (item) => !descendantIds.has(item.id) && !allowedOutside.has(item.id)
    );
    if (unresolved.length > 0) {
      throw new Error(`Remote hierarchy outside known files root: ${unresolved[0].id}`);
    }
    return descendants;
  }
  hasLegacyFilesRootPollution(remoteEntries, localEntries) {
    if (remoteEntries.length === 0 || !remoteEntries.every((entry) => entry.path.startsWith("files/"))) {
      return false;
    }
    const knownPaths = /* @__PURE__ */ new Set([
      ...localEntries.map((entry) => entry.path),
      ...this.state.baseSnapshot.map((entry) => entry.path)
    ]);
    return remoteEntries.some((entry) => {
      const unprefixed = entry.path.slice("files/".length);
      return knownPaths.has(unprefixed) && !knownPaths.has(entry.path);
    });
  }
  summarizePlanActions(plan) {
    const counts = {};
    for (const item of plan.items) counts[item.type] = (counts[item.type] ?? 0) + 1;
    return counts;
  }
  applyRemoteDelta(cachedEntries, cachedFolders, changes, filesRootId) {
    const syncableCachedEntries = cachedEntries.filter(
      (entry) => this.shouldIncludeRemotePath(entry.path)
    );
    const byPath = new Map(syncableCachedEntries.map((entry) => [entry.path, entry]));
    const byDriveId = new Map(syncableCachedEntries.map((entry) => [entry.driveId, entry]));
    const driveIdByPathKey = /* @__PURE__ */ new Map();
    const folderPathById = /* @__PURE__ */ new Map([[filesRootId, ""]]);
    const folderIdByPathKey = /* @__PURE__ */ new Map([[normalizeRemotePathKey(""), filesRootId]]);
    const foldersById = /* @__PURE__ */ new Map();
    for (const folder of [...cachedFolders].sort(
      (left, right) => left.path.split("/").length - right.path.split("/").length
    )) {
      const separator = folder.path.lastIndexOf("/");
      const expectedName = separator >= 0 ? folder.path.slice(separator + 1) : folder.path;
      const parentPath = separator >= 0 ? folder.path.slice(0, separator) : "";
      const expectedParentId = folderIdByPathKey.get(normalizeRemotePathKey(parentPath));
      if (!folder.path || folder.name !== expectedName || !expectedParentId || folder.parentId !== expectedParentId) {
        throw new IncrementalRemoteHierarchyError(`Remote hierarchy invalid cached folder ${folder.driveId}`);
      }
      const pathKey = normalizeRemotePathKey(folder.path);
      const existingId = folderIdByPathKey.get(pathKey);
      if (existingId && existingId !== folder.driveId) {
        throw new IncrementalRemoteHierarchyError(`Remote hierarchy duplicate cached folder path: ${folder.path}`);
      }
      folderPathById.set(folder.driveId, folder.path);
      folderIdByPathKey.set(pathKey, folder.driveId);
      foldersById.set(folder.driveId, folder);
    }
    for (const entry of syncableCachedEntries) {
      const key = normalizeRemotePathKey(entry.path);
      const owner = driveIdByPathKey.get(key);
      if (owner && owner !== entry.driveId) {
        throw new IncrementalRemoteHierarchyError(`Remote hierarchy duplicate cached path: ${entry.path}`);
      }
      driveIdByPathKey.set(key, entry.driveId);
      if (entry.parentId) {
        const separator = entry.path.lastIndexOf("/");
        const folderPath = separator >= 0 ? entry.path.slice(0, separator) : "";
        const existingPath = folderPathById.get(entry.parentId);
        if (existingPath !== void 0 && existingPath !== folderPath) {
          throw new IncrementalRemoteHierarchyError(`Remote hierarchy inconsistent cached parent: ${entry.parentId}`);
        }
        const folderKey = normalizeRemotePathKey(folderPath);
        const existingId = folderIdByPathKey.get(folderKey);
        if (existingId && existingId !== entry.parentId) {
          throw new IncrementalRemoteHierarchyError(`Remote hierarchy duplicate cached folder path: ${folderPath}`);
        }
        folderPathById.set(entry.parentId, folderPath);
        folderIdByPathKey.set(folderKey, entry.parentId);
      }
    }
    for (const [driveId, path] of folderPathById) {
      if (driveId === filesRootId || foldersById.has(driveId) || !path) continue;
      const separator = path.lastIndexOf("/");
      const parentPath = separator >= 0 ? path.slice(0, separator) : "";
      const parentId = folderIdByPathKey.get(normalizeRemotePathKey(parentPath));
      if (!parentId) continue;
      foldersById.set(driveId, {
        path,
        driveId,
        parentId,
        name: separator >= 0 ? path.slice(separator + 1) : path
      });
    }
    const latestById = /* @__PURE__ */ new Map();
    for (const change of changes) latestById.set(change.id, change);
    for (const change of latestById.values()) {
      let previous = byDriveId.get(change.id);
      if (change.id === filesRootId) {
        if (change.deleted || !change.folder) {
          throw new IncrementalRemoteHierarchyError("Remote hierarchy changed the known files root");
        }
        continue;
      }
      if (change.deleted) {
        if (previous) {
          byPath.delete(previous.path);
          driveIdByPathKey.delete(normalizeRemotePathKey(previous.path));
          byDriveId.delete(change.id);
        } else if (foldersById.has(change.id)) {
          throw new IncrementalRemoteHierarchyError(`Remote hierarchy deleted known folder ${change.id}`);
        }
        continue;
      }
      if (change.folder) {
        const previousFolder = foldersById.get(change.id);
        const parentId2 = change.parentReference?.id;
        if (!previousFolder || !parentId2) {
          throw new IncrementalRemoteHierarchyError(`Remote hierarchy incomplete: folder mutation ${change.id}`);
        }
        if (change.name !== previousFolder.name || parentId2 !== previousFolder.parentId) {
          throw new IncrementalRemoteHierarchyError(`Remote hierarchy changed known folder ${change.id}`);
        }
        continue;
      }
      if (!change.file) {
        continue;
      }
      const parentId = change.parentReference?.id;
      if (!parentId) {
        throw new IncrementalRemoteHierarchyError(`Remote hierarchy incomplete: missing parent identity for ${change.id}`);
      }
      let projectedPath;
      if (previous) {
        if (!previous.parentId) {
          const separator2 = previous.path.lastIndexOf("/");
          const expectedParentPath = separator2 >= 0 ? previous.path.slice(0, separator2) : "";
          const provenParentPath = folderPathById.get(parentId);
          if (provenParentPath !== expectedParentPath) {
            throw new IncrementalRemoteHierarchyError(`Remote hierarchy incomplete: legacy cached parent for ${change.id}`);
          }
          previous = { ...previous, parentId };
          byPath.set(previous.path, previous);
          byDriveId.set(previous.driveId, previous);
        }
        if (previous.parentId !== parentId) {
          throw new IncrementalRemoteHierarchyError(`Remote hierarchy changed parent for ${change.id}`);
        }
        const separator = previous.path.lastIndexOf("/");
        projectedPath = separator >= 0 ? `${previous.path.slice(0, separator)}/${change.name}` : change.name;
        byPath.delete(previous.path);
        driveIdByPathKey.delete(normalizeRemotePathKey(previous.path));
      } else {
        const parentPath = folderPathById.get(parentId);
        if (parentPath === void 0) {
          throw new IncrementalRemoteHierarchyError(`Remote hierarchy missing known parent for ${change.id}`);
        }
        projectedPath = parentPath ? `${parentPath}/${change.name}` : change.name;
      }
      const collisionKey = normalizeRemotePathKey(projectedPath);
      const collisionOwner = driveIdByPathKey.get(collisionKey);
      if (collisionOwner && collisionOwner !== change.id) {
        throw new IncrementalRemoteHierarchyError(`Remote hierarchy duplicate path: ${projectedPath}`);
      }
      const entry = this.toRemoteEntry(change, projectedPath, parentId);
      if (!this.shouldIncludeRemotePath(entry.path)) {
        byDriveId.delete(change.id);
        continue;
      }
      byPath.set(entry.path, entry);
      byDriveId.set(entry.driveId, entry);
      driveIdByPathKey.set(collisionKey, entry.driveId);
    }
    return {
      entries: [...byPath.values()],
      folders: [...foldersById.values()]
    };
  }
  shouldIncludeRemotePath(path) {
    return typeof this.scanner.shouldSyncPath === "function" ? this.scanner.shouldSyncPath(path) : !isEasySyncInternalPath(path, getConfigDir(this.scanner.vault));
  }
  /** Convert a Graph item only after an ID/parentId projection has authorized its path. */
  toRemoteEntry(d, projectedPath, parentId) {
    return {
      path: projectedPath,
      driveId: d.id,
      parentId,
      downloadUrl: d["@microsoft.graph.downloadUrl"],
      size: d.size ?? 0,
      mtime: d.lastModifiedDateTime ? new Date(d.lastModifiedDateTime).getTime() : 0,
      eTag: d.eTag ?? "",
      cTag: d.cTag ?? "",
      sha256Hash: d.file?.hashes?.sha256Hash?.toLowerCase()
    };
  }
  toUploadedRemoteEntry(path, local, uploadResult, knownParentId) {
    if (!uploadResult.id || !uploadResult.eTag) {
      throw new Error(`Upload response is missing stable identity/version: ${path}`);
    }
    return {
      path,
      driveId: uploadResult.id,
      parentId: this.requireKnownRemoteParentId(
        path,
        uploadResult.parentReference?.id,
        knownParentId
      ),
      size: uploadResult.size ?? local.size,
      mtime: uploadResult.lastModifiedDateTime ? new Date(uploadResult.lastModifiedDateTime).getTime() : Date.now(),
      eTag: uploadResult.eTag,
      cTag: uploadResult.cTag ?? "",
      sha256Hash: local.hash
    };
  }
  toMetadataRemoteEntry(path, metadata, knownParentId) {
    return {
      path,
      driveId: metadata.driveId,
      parentId: this.requireKnownRemoteParentId(path, metadata.parentId, knownParentId),
      downloadUrl: metadata.downloadUrl,
      size: metadata.size,
      mtime: metadata.mtime,
      eTag: metadata.eTag,
      cTag: "",
      sha256Hash: metadata.sha256Hash
    };
  }
  requireKnownRemoteParentId(path, graphParentId, reviewedParentId) {
    if (graphParentId) return graphParentId;
    if (reviewedParentId) return reviewedParentId;
    const separator = path.lastIndexOf("/");
    const parentPath = separator >= 0 ? path.slice(0, separator) : "";
    if (!parentPath) {
      const filesRootId = this.activeSyncScope?.filesRootId ?? this.state.remoteScope?.filesRootId;
      if (filesRootId) return filesRootId;
    }
    const knownFolder = (this.state.remoteFolders ?? []).find(
      (folder) => normalizeRemotePathKey(folder.path) === normalizeRemotePathKey(parentPath)
    );
    if (knownFolder) return knownFolder.driveId;
    throw new Error(`Remote cache upsert is missing parent identity: ${path}`);
  }
  /**
   * Ensure all parent directories for a file exist, creating them
   * bottom-up to handle non-recursive adapter.mkdir implementations.
   */
  /** M19: compare local vs remote EasySync manifest.json version.
   *  Returns the number of EasySync items to skip (0 = remote >= local, all = downgrade). */
  async guardEasySyncDowngrade(items) {
    const { manifestFile } = getEasySyncPaths(this.scanner.vault);
    const manifestItem = items.find((i) => i.path === manifestFile);
    if (!manifestItem?.remote) return 0;
    let localVersion = "";
    try {
      const localRaw = await this.scanner.vault.adapter.read(manifestFile);
      const localManifest = JSON.parse(localRaw);
      localVersion = localManifest.version ?? "";
    } catch {
      return 0;
    }
    try {
      const remoteContent = await this.onedrive.downloadFile(
        this.vaultName,
        manifestItem.path,
        manifestItem.remote.downloadUrl,
        manifestItem.remote.driveId,
        manifestItem.remote.size
      );
      const remoteText = new TextDecoder().decode(remoteContent);
      const remoteManifest = JSON.parse(remoteText);
      const remoteVersion = remoteManifest.version ?? "";
      if (remoteVersion && localVersion && remoteVersion < localVersion) {
        this.diag?.warn(
          "execute",
          `M19 anti-downgrade \u2014 remote EasySync ${remoteVersion} < local ${localVersion}, skipping plugin file sync this round`
        );
        return items.length;
      }
    } catch (err) {
      this.diag?.log("execute", `M19 anti-downgrade \u2014 could not fetch remote manifest, allowing sync: ${err instanceof Error ? err.message : String(err)}`);
    }
    return 0;
  }
  async ensureParentDirs(filePath) {
    const dir = filePath.substring(0, filePath.lastIndexOf("/"));
    if (!dir) return;
    const segments = dir.split("/");
    for (let i = 1; i <= segments.length; i++) {
      const partial = segments.slice(0, i).join("/");
      try {
        await this.scanner.vault.adapter.mkdir(partial);
      } catch {
      }
    }
  }
  /** Gate check: refuse state-modifying operations while a sync round is in-flight. */
  acquireGate(op) {
    if (this.running || this.sideActionRunning || this.queuedSideActionPaths.size > 0) return "sync";
    return null;
  }
  handleSideActionPreparationFailure(path, phase, error) {
    const reason = error instanceof Error ? error.message : String(error);
    this.diag?.warn("execute", `side action preparation failed \u2014 phase=${phase}, path=${path}`, reason);
    if (isAuthFailure(error)) {
      this.invalidateLifecycle("auth-expired");
      this.notice("result.authExpired", { path });
      return;
    }
    switch (phase) {
      case "localRecovery":
        this.notice("notice.localRecoveryFailed", { path });
        return;
      case "remotePrepare":
        this.notice("notice.sideActionRemotePrepareFailed", { path });
        return;
      case "scopeValidation":
        this.notice("notice.sideActionScopeChanged", { path });
        return;
      case "mutationRecovery":
        this.notice("notice.sideActionMutationRecoveryFailed", { path });
        return;
      case "action":
        this.notice("notice.conflict.failed", {
          path,
          reason: this.failureReason(error)
        });
    }
  }
  enqueueSideAction(path, actionType, task, completionPresentation) {
    if (this.running) {
      this.notice("notice.conflict.failed", { path, reason: this.t("result.lockBusy") });
      return Promise.resolve();
    }
    if (this.queuedSideActionPaths.has(path)) {
      return Promise.resolve();
    }
    if (!this.sideActionRunning && this.queuedSideActionPaths.size === 0) {
      this.cancelled = false;
      if (this.progressStore?.state.activityKind === "sideAction") {
        this.sideActionBatchTotal = Math.max(
          this.sideActionBatchTotal,
          this.progressStore.state.total
        );
        this.sideActionBatchSettled = Math.max(
          this.sideActionBatchSettled,
          this.progressStore.state.total
        );
        this.progressStore.resumeSideActionBatch();
      } else {
        this.sideActionBatchTotal = 0;
        this.sideActionBatchSettled = 0;
        this.progressStore?.markStarted("sideAction");
        this.progressStore?.setPhase("executing");
      }
    }
    const operationEpoch = this.lifecycle.capture();
    this.queuedSideActionPaths.add(path);
    this.sideActionBatchTotal++;
    const currentProgress = this.progressStore?.state;
    if (currentProgress?.currentFile) {
      this.progressStore?.setProgress(
        currentProgress.current,
        this.sideActionBatchTotal,
        currentProgress.currentFile,
        currentProgress.currentActionType
      );
    }
    this.diag?.log("execute", `queued side action ${actionType} ${path}`);
    this.onProgressUpdate?.();
    let resolveCompletion;
    const completion = new Promise((resolve) => {
      resolveCompletion = resolve;
    });
    this.sideActionQueue = this.sideActionQueue.catch(() => void 0).then(async () => {
      let started = false;
      let succeeded = false;
      let preparationPhase = "localRecovery";
      try {
        if (!this.canContinue(operationEpoch)) return;
        this.beginSideAction(path, actionType);
        started = true;
        await this.getRecoveryJournal().recover();
        if (!this.canContinue(operationEpoch)) return;
        preparationPhase = "remotePrepare";
        const remoteScope = await this.onedrive.initVaultScope(this.vaultName);
        this.activeSyncScope = {
          accountId: this.state.boundAccountId,
          ...remoteScope
        };
        preparationPhase = "scopeValidation";
        if (this.state.remoteScope && !sameSyncScope(this.state.remoteScope, this.activeSyncScope)) {
          throw new Error("Reviewed action scope no longer matches the current Graph scope");
        }
        preparationPhase = "mutationRecovery";
        await this.recoverMutationLedger(this.activeSyncScope);
        if (!this.canContinue(operationEpoch)) return;
        preparationPhase = "action";
        succeeded = await task(operationEpoch) === true;
      } catch (error) {
        this.handleSideActionPreparationFailure(path, preparationPhase, error);
      } finally {
        if (started) this.completeSideAction(
          path,
          actionType,
          succeeded,
          completionPresentation
        );
        this.queuedSideActionPaths.delete(path);
        this.activeSyncScope = null;
        this.finishSideAction(this.queuedSideActionPaths.size === 0);
        resolveCompletion();
      }
    });
    return completion;
  }
  beginSideAction(path, actionType) {
    this.sideActionRunning = true;
    this.progressStore?.setProgress(
      this.sideActionBatchSettled + 1,
      this.sideActionBatchTotal,
      path,
      actionType
    );
    this.onProgressUpdate?.();
  }
  updateSideActionProgress(bytes, total) {
    this.progressStore?.setByteProgress(bytes, total);
    this.onProgressUpdate?.();
  }
  completeSideAction(path, actionType, succeeded, completion) {
    this.progressStore?.completeCurrentItem();
    this.progressStore?.addCompletedFile({
      path,
      status: succeeded && completion?.status ? completion.status : succeeded ? actionType === "confirmLocalDelete" /* ConfirmLocalDelete */ ? "delete" : SyncProgressStore.actionToStatus(actionType) : "error",
      actionType,
      reason: succeeded ? completion?.reason : void 0
    });
    this.sideActionBatchSettled++;
    this.onProgressUpdate?.();
  }
  /** Retire a false conflict from exact bytes already inspected by the detail view. */
  async reconcileIdenticalConflict(path, proof) {
    if (this.state.legacyAutoSyncAllowed === false) {
      this.notice("result.legacyStateDisabled");
      return;
    }
    const conflict = this.state.pendingConflicts.find((item) => item.path === path);
    if (!conflict?.local || !conflict.remote) {
      this.notice("notice.conflict.failed", { path, reason: this.t("notice.decisionExpired") });
      return;
    }
    if (proof.localHash !== proof.remoteHash || proof.localSize !== proof.remoteSize || proof.remoteETag !== conflict.remote.eTag) {
      this.notice("notice.conflict.failed", { path, reason: this.t("notice.decisionExpired") });
      return;
    }
    return this.enqueueSideAction(
      path,
      "conflict" /* Conflict */,
      async (operationEpoch) => {
        const queued = this.state.pendingConflicts.find((item) => item.path === path);
        if (!queued?.local || !queued.remote) return;
        if (!this.guardDecisionToken(queued, "notice.conflict.failed")) return;
        const expectedLocal = {
          ...queued.local,
          hash: proof.localHash,
          size: proof.localSize
        };
        if (!await this.guardReviewedLocalVersion(path, expectedLocal, "notice.conflict.failed")) return;
        if (!await this.guardReviewedRemoteVersion(queued, "notice.conflict.failed", "conflict")) return;
        if (!this.canContinue(operationEpoch)) return;
        await this.state.reconcileIdenticalConflict({
          path,
          hash: proof.localHash,
          size: proof.localSize,
          eTag: queued.remote.eTag
        });
        this.diag?.log("execute", `exact-content conflict reconciled \u2014 ${path}`);
        this.notice("notice.conflict.identical", { path });
        return true;
      },
      { status: "skip", reason: this.t("notice.conflict.identical", { path }) }
    );
  }
  finishSideAction(batchFinished) {
    this.sideActionRunning = false;
    if (batchFinished) this.progressStore?.finish();
    this.onProgressUpdate?.();
  }
  async deleteLocalPath(path) {
    const tfile = this.scanner.vault.getFileByPath(path);
    if (tfile) {
      if (this.fileManager) {
        await this.fileManager.trashFile(tfile);
      } else {
        await this.scanner.vault.adapter.remove(path);
      }
      return;
    }
    await this.scanner.vault.adapter.remove(path);
  }
  async expireManagedConfigDecision(path, conflict) {
    if (!isObsidianManagedConfigPath(path)) return false;
    if (!this.shouldIncludeRemotePath(path)) {
      await this.state.removePendingConflict(path);
      this.notice("notice.configSyncDisabled", { path });
      return true;
    }
    if (conflict && (!conflict.local || !conflict.remote)) {
      await this.state.removePendingConflict(path);
      this.notice("notice.conflict.failed", {
        path,
        reason: this.t("notice.decisionExpired")
      });
      return true;
    }
    return false;
  }
  async readManagedConfigSnapshot(path, content) {
    try {
      const text = new TextDecoder("utf-8", { fatal: true }).decode(content);
      JSON.parse(text);
    } catch {
      this.notice("notice.conflict.failed", {
        path,
        reason: this.t("notice.configSnapshotInvalid")
      });
      return null;
    }
    const stat = await this.scanner.vault.adapter.stat(path);
    return {
      path,
      hash: await sha256Hex(content),
      size: content.byteLength,
      mtime: stat?.mtime ?? Date.now(),
      binary: false
    };
  }
  async replaceManagedConfigWithRemote(queuedConflict, operationEpoch) {
    const path = queuedConflict.path;
    const content = await this.onedrive.downloadFile(
      this.vaultName,
      path,
      queuedConflict.remote.downloadUrl,
      queuedConflict.remote.driveId,
      queuedConflict.remote.size,
      (downloaded, total) => this.updateSideActionProgress(downloaded, total)
    );
    if (!this.canContinue(operationEpoch)) return null;
    if (!await this.guardReviewedRemoteVersion(queuedConflict, "notice.conflict.failed", "conflict")) {
      return null;
    }
    const hash = await sha256Hex(content);
    await this.verifyDownloadedPayload(
      path,
      queuedConflict.remote,
      { size: content.byteLength, hash },
      true
    );
    try {
      JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(content));
    } catch {
      this.notice("notice.conflict.failed", {
        path,
        reason: this.t("notice.configSnapshotInvalid")
      });
      return null;
    }
    const current = await this.inspectLocalPath(path);
    if (current?.status === "uncertain") {
      this.notice("notice.conflict.failed", {
        path,
        reason: this.t("notice.localChangedSinceReview")
      });
      return null;
    }
    const expected = current?.status === "present" ? current.entry : current?.status === "missing" ? void 0 : queuedConflict.local;
    const expectedLocal = expected ? { exists: true, hash: expected.hash, size: expected.size } : { exists: false };
    const intent = this.createSideMutationIntent(queuedConflict, "download", expectedLocal);
    const committed = await this.runDurableSideMutation(intent, operationEpoch, async () => {
      let targetMutationStarted = false;
      try {
        const readyPath = `${this.getDownloadTempPath(path)}.ready`;
        await this.ensureParentDirs(readyPath);
        await this.removePathIfExists(readyPath);
        await this.scanner.vault.adapter.writeBinary(readyPath, content);
        targetMutationStarted = true;
        await this.commitDownloadedTempFile(
          this.scanner.vault.adapter,
          path,
          readyPath,
          expected,
          { size: content.byteLength, hash }
        );
        const stat = await this.scanner.vault.adapter.stat(path);
        const checkpoint = emptyMutationCheckpoint();
        checkpoint.baseUpserts.push({
          path,
          hash,
          size: stat?.size ?? content.byteLength,
          eTag: queuedConflict.remote.eTag
        });
        checkpoint.pendingConflictRemovals.push(path);
        return checkpoint;
      } catch (error) {
        if (error instanceof LocalCommitPreconditionError) {
          this.notice("notice.conflict.failed", {
            path,
            reason: this.t("notice.localChangedSinceReview")
          });
          throw new SideMutationNotAppliedError(error, true);
        }
        if (error instanceof SideMutationNotAppliedError || targetMutationStarted) throw error;
        throw new SideMutationNotAppliedError(error);
      }
    });
    return committed ? content : null;
  }
  /** Resolve a conflict: keep local version (re-upload) */
  async resolveConflictKeepLocal(path) {
    if (this.state.legacyAutoSyncAllowed === false) {
      this.notice("result.legacyStateDisabled");
      return;
    }
    const conflict = this.state.pendingConflicts.find((c) => c.path === path);
    if (await this.expireManagedConfigDecision(path, conflict)) return;
    const actionType = conflict?.remote && !conflict.local ? "deleteRemote" /* DeleteRemote */ : "upload" /* Upload */;
    return this.enqueueSideAction(path, actionType, async (operationEpoch) => {
      if (!this.canContinue(operationEpoch)) return;
      const queuedConflict = this.state.pendingConflicts.find((c) => c.path === path);
      if (queuedConflict?.remote && !queuedConflict.local) {
        try {
          if (!this.guardDecisionToken(queuedConflict, "notice.conflict.failed")) return;
          if (!await this.guardReviewedLocalVersion(path, void 0, "notice.conflict.failed")) return;
          if (!await this.guardReviewedRemoteVersion(queuedConflict, "notice.conflict.failed", "conflict")) return;
          if (!this.canContinue(operationEpoch)) return;
          const intent = this.createSideMutationIntent(queuedConflict, "deleteRemote");
          const committed = await this.runDurableSideMutation(intent, operationEpoch, async () => {
            await this.onedrive.deleteItem(
              this.vaultName,
              path,
              queuedConflict.remote.eTag,
              queuedConflict.remote.driveId
            );
            const checkpoint = emptyMutationCheckpoint();
            checkpoint.baseRemovals.push(path);
            checkpoint.remoteDeletes.push(path);
            checkpoint.pendingConflictRemovals.push(path);
            return checkpoint;
          });
          if (!committed) return;
          this.notice("notice.conflict.keptLocal", { path });
          return true;
        } catch (e) {
          if (e instanceof OneDriveError && isRemoteMutationConflict(e)) {
            await this.guardReviewedRemoteVersion(queuedConflict, "notice.conflict.failed", "conflict");
            return;
          }
          this.notice("notice.conflict.failed", { path, reason: e instanceof Error ? e.message : this.t("general.unknown") });
        }
        return;
      }
      if (!queuedConflict?.local) {
        this.notice("notice.conflict.failed", { path, reason: this.t("general.unknown") });
        return;
      }
      try {
        const managedConfig = isObsidianManagedConfigPath(path);
        if (!this.guardDecisionToken(queuedConflict, "notice.conflict.failed")) return;
        if (!managedConfig && !await this.guardReviewedLocalVersion(path, queuedConflict.local, "notice.conflict.failed")) return;
        if (!await this.guardReviewedRemoteVersion(queuedConflict, "notice.conflict.failed", "conflict")) return;
        const content = await this.scanner.vault.adapter.readBinary(path);
        const uploadLocal = managedConfig ? await this.readManagedConfigSnapshot(path, content) : queuedConflict.local;
        if (!uploadLocal) return;
        const hasProductionInspection = typeof this.scanner.inspectFile === "function";
        if (!managedConfig && (hasProductionInspection && await sha256Hex(content) !== uploadLocal.hash || content.byteLength !== uploadLocal.size)) {
          this.notice("notice.conflict.failed", { path, reason: this.t("notice.localChangedSinceReview") });
          return;
        }
        if (!this.canContinue(operationEpoch)) return;
        const expectedLocal = managedConfig ? { exists: true, hash: uploadLocal.hash, size: uploadLocal.size } : void 0;
        const intent = this.createSideMutationIntent(queuedConflict, "upload", expectedLocal);
        const committed = await this.runDurableSideMutation(intent, operationEpoch, async () => {
          const uploadResult = await this.onedrive.uploadFile(
            this.vaultName,
            path,
            content,
            (uploaded, total) => this.updateSideActionProgress(uploaded, total),
            queuedConflict.remote?.eTag,
            queuedConflict.remote?.driveId
          );
          const checkpoint = emptyMutationCheckpoint();
          checkpoint.baseUpserts.push({
            path,
            hash: uploadLocal.hash,
            size: uploadLocal.size,
            eTag: uploadResult.eTag ?? ""
          });
          checkpoint.remoteUpserts.push(this.toUploadedRemoteEntry(
            path,
            uploadLocal,
            uploadResult,
            queuedConflict.remote?.parentId
          ));
          checkpoint.pendingConflictRemovals.push(path);
          return checkpoint;
        });
        if (!committed) return;
        this.state.cacheBaseContent(path, content);
        this.notice("notice.conflict.keptLocal", { path });
        return true;
      } catch (e) {
        if (this.stopSideActionForAuthFailure(path, e)) return;
        if (e instanceof OneDriveError && isRemoteMutationConflict(e)) {
          await this.guardReviewedRemoteVersion(queuedConflict, "notice.conflict.failed", "conflict");
          return;
        }
        this.notice("notice.conflict.failed", { path, reason: e instanceof Error ? e.message : this.t("general.unknown") });
      }
    });
  }
  /** Resolve a conflict: keep remote version (re-download) */
  async resolveConflictKeepRemote(path) {
    if (this.state.legacyAutoSyncAllowed === false) {
      this.notice("result.legacyStateDisabled");
      return;
    }
    const conflict = this.state.pendingConflicts.find((c) => c.path === path);
    if (await this.expireManagedConfigDecision(path, conflict)) return;
    const actionType = conflict?.local && !conflict.remote ? "confirmLocalDelete" /* ConfirmLocalDelete */ : "download" /* Download */;
    return this.enqueueSideAction(path, actionType, async (operationEpoch) => {
      if (!this.canContinue(operationEpoch)) return;
      const queuedConflict = this.state.pendingConflicts.find((c) => c.path === path);
      if (queuedConflict?.local && !queuedConflict.remote) {
        try {
          if (!this.guardDecisionToken(queuedConflict, "notice.conflict.failed")) return;
          if (!await this.guardReviewedLocalVersion(path, queuedConflict.local, "notice.conflict.failed")) return;
          if (!await this.guardReviewedRemoteVersion(queuedConflict, "notice.conflict.failed", "conflict")) return;
          if (!this.canContinue(operationEpoch)) return;
          const intent = this.createSideMutationIntent(queuedConflict, "deleteLocal");
          const committed = await this.runDurableSideMutation(intent, operationEpoch, async () => {
            await this.deleteLocalPath(path);
            const checkpoint = emptyMutationCheckpoint();
            checkpoint.baseRemovals.push(path);
            checkpoint.remoteDeletes.push(path);
            checkpoint.pendingConflictRemovals.push(path);
            return checkpoint;
          });
          if (!committed) return;
          this.notice("notice.conflict.keptRemote", { path });
          return true;
        } catch (e) {
          if (this.stopSideActionForAuthFailure(path, e)) return;
          this.notice("notice.conflict.failed", { path, reason: e instanceof Error ? e.message : this.t("general.unknown") });
        }
        return;
      }
      if (!queuedConflict?.remote) {
        this.notice("notice.conflict.failed", { path, reason: this.t("general.unknown") });
        return;
      }
      try {
        const managedConfig = isObsidianManagedConfigPath(path);
        if (!this.guardDecisionToken(queuedConflict, "notice.conflict.failed")) return;
        if (!managedConfig && !await this.guardReviewedLocalVersion(path, queuedConflict.local, "notice.conflict.failed")) return;
        if (!await this.guardReviewedRemoteVersion(queuedConflict, "notice.conflict.failed", "conflict")) return;
        if (managedConfig) {
          const content2 = await this.replaceManagedConfigWithRemote(queuedConflict, operationEpoch);
          if (!content2) return;
          this.state.cacheBaseContent(path, content2);
          this.notice("notice.conflict.keptRemote", { path });
          return true;
        }
        const intent = this.createSideMutationIntent(queuedConflict, "download");
        let content = null;
        const committed = await this.runDurableSideMutation(intent, operationEpoch, async () => {
          let targetMutationStarted = false;
          try {
            content = await this.onedrive.downloadFile(
              this.vaultName,
              path,
              queuedConflict.remote.downloadUrl,
              queuedConflict.remote.driveId,
              queuedConflict.remote.size,
              (downloaded, total) => this.updateSideActionProgress(downloaded, total)
            );
            if (!this.canContinue(operationEpoch)) {
              throw new SideMutationNotAppliedError(
                new Error("Reviewed download cancelled before local commit")
              );
            }
            if (!await this.guardReviewedLocalVersion(path, queuedConflict.local, "notice.conflict.failed")) {
              throw new SideMutationNotAppliedError(void 0, true);
            }
            if (!await this.guardReviewedRemoteVersion(queuedConflict, "notice.conflict.failed", "conflict")) {
              throw new SideMutationNotAppliedError(void 0, true);
            }
            const hash = await sha256Hex(content);
            await this.verifyDownloadedPayload(
              path,
              queuedConflict.remote,
              { size: content.byteLength, hash },
              true
            );
            if (typeof this.scanner.inspectFile === "function") {
              const readyPath = `${this.getDownloadTempPath(path)}.ready`;
              await this.ensureParentDirs(readyPath);
              await this.removePathIfExists(readyPath);
              await this.scanner.vault.adapter.writeBinary(readyPath, content);
              targetMutationStarted = true;
              await this.commitDownloadedTempFile(
                this.scanner.vault.adapter,
                path,
                readyPath,
                queuedConflict.local,
                { size: content.byteLength, hash }
              );
            } else {
              await this.ensureParentDirs(path);
              targetMutationStarted = true;
              await this.scanner.vault.adapter.writeBinary(path, content);
            }
            const stat = await this.scanner.vault.adapter.stat(path);
            const checkpoint = emptyMutationCheckpoint();
            checkpoint.baseUpserts.push({
              path,
              hash,
              size: stat?.size ?? content.byteLength,
              eTag: queuedConflict.remote.eTag
            });
            checkpoint.pendingConflictRemovals.push(path);
            return checkpoint;
          } catch (error) {
            if (error instanceof SideMutationNotAppliedError || targetMutationStarted) throw error;
            throw new SideMutationNotAppliedError(error);
          }
        });
        if (!committed || !content) return;
        this.state.cacheBaseContent(path, content);
        this.notice("notice.conflict.keptRemote", { path });
        return true;
      } catch (rawError) {
        if (rawError instanceof SideMutationNotAppliedError && rawError.noticeAlreadyShown) return;
        const error = rawError instanceof SideMutationNotAppliedError ? rawError.original : rawError;
        if (this.stopSideActionForAuthFailure(path, error)) return;
        if (error instanceof OneDriveError && isRemoteMutationConflict(error)) {
          await this.guardReviewedRemoteVersion(queuedConflict, "notice.conflict.failed", "conflict");
          return;
        }
        if (error instanceof OneDriveError && (error.type === "NetworkError" /* NetworkError */ || error.type === "Unauthorized" /* Unauthorized */ || error.type === "Forbidden" /* Forbidden */)) {
          this.notice("notice.conflict.downloadFailed", { path });
          return;
        }
        this.notice("notice.conflict.failed", {
          path,
          reason: this.failureReason(error)
        });
      }
    });
  }
  /** Confirm the exact pending delete paths from one user action. */
  async confirmRemoteDeletes(paths) {
    const uniquePaths = [...new Set(paths)];
    await Promise.all(uniquePaths.map((path) => this.confirmRemoteDelete(path, false)));
  }
  /** Confirm a remote delete: delete local file */
  async confirmRemoteDelete(path, showSuccessNotice = true) {
    if (this.state.legacyAutoSyncAllowed === false) {
      this.notice("result.legacyStateDisabled");
      return;
    }
    return this.enqueueSideAction(path, "deleteRemote" /* DeleteRemote */, async (operationEpoch) => {
      const pending = this.state.pendingRemoteDeletes.find((d) => d.path === path);
      try {
        if (!pending?.local) {
          this.notice("notice.delete.failed", { path, reason: this.t("general.unknown") });
          return;
        }
        if (!this.guardDecisionToken(pending, "notice.delete.failed")) return;
        if (!await this.guardReviewedLocalVersion(path, pending.local, "notice.delete.failed")) return;
        if (!await this.guardReviewedRemoteVersion(pending, "notice.delete.failed", "delete")) return;
        if (!this.canContinue(operationEpoch)) return;
        const intent = this.createSideMutationIntent(pending, "deleteLocal");
        const committed = await this.runDurableSideMutation(intent, operationEpoch, async () => {
          await this.deleteLocalPath(path);
          const checkpoint = emptyMutationCheckpoint();
          checkpoint.baseRemovals.push(path);
          checkpoint.pendingDeleteRemovals.push(path);
          return checkpoint;
        });
        if (!committed) return;
        if (showSuccessNotice) this.notice("notice.delete.confirmed", { path });
        return true;
      } catch (e) {
        if (this.stopSideActionForAuthFailure(path, e)) return;
        if (pending && e instanceof OneDriveError && isRemoteMutationConflict(e)) {
          await this.guardReviewedRemoteVersion(pending, "notice.delete.failed", "delete");
          return;
        }
        this.notice("notice.delete.failed", { path, reason: e instanceof Error ? e.message : this.t("general.unknown") });
      }
    });
  }
  /** Reject a remote delete: re-upload local file */
  async rejectRemoteDelete(path) {
    if (this.state.legacyAutoSyncAllowed === false) {
      this.notice("result.legacyStateDisabled");
      return;
    }
    return this.enqueueSideAction(path, "upload" /* Upload */, async (operationEpoch) => {
      if (!this.canContinue(operationEpoch)) return;
      const pending = this.state.pendingRemoteDeletes.find((d) => d.path === path);
      if (!pending?.local) {
        this.notice("notice.delete.failed", { path, reason: this.t("general.unknown") });
        return;
      }
      try {
        if (!this.guardDecisionToken(pending, "notice.delete.failed")) return;
        if (!await this.guardReviewedLocalVersion(path, pending.local, "notice.delete.failed")) return;
        if (!await this.guardReviewedRemoteVersion(pending, "notice.delete.failed", "delete")) return;
        const content = await this.scanner.vault.adapter.readBinary(path);
        const contentHash = typeof this.scanner.inspectFile === "function" ? await sha256Hex(content) : pending.local.hash;
        if (contentHash !== pending.local.hash || content.byteLength !== pending.local.size) {
          this.notice("notice.delete.failed", { path, reason: this.t("notice.localChangedSinceReview") });
          return;
        }
        if (!this.canContinue(operationEpoch)) return;
        const intent = this.createSideMutationIntent(pending, "upload");
        const committed = await this.runDurableSideMutation(intent, operationEpoch, async () => {
          const uploadResult = await this.onedrive.uploadFile(
            this.vaultName,
            path,
            content,
            (uploaded, total) => this.updateSideActionProgress(uploaded, total)
          );
          const checkpoint = emptyMutationCheckpoint();
          checkpoint.baseUpserts.push({
            path,
            hash: pending.local.hash,
            size: pending.local.size,
            eTag: uploadResult.eTag ?? ""
          });
          checkpoint.remoteUpserts.push(this.toUploadedRemoteEntry(
            path,
            pending.local,
            uploadResult,
            pending.remote?.parentId
          ));
          checkpoint.pendingDeleteRemovals.push(path);
          return checkpoint;
        });
        if (!committed) return;
        this.notice("notice.delete.rejected", { path });
        return true;
      } catch (e) {
        if (this.stopSideActionForAuthFailure(path, e)) return;
        if (e instanceof OneDriveError && isRemoteMutationConflict(e)) {
          await this.guardReviewedRemoteVersion(pending, "notice.delete.failed", "delete");
          return;
        }
        this.notice("notice.delete.failed", { path, reason: e instanceof Error ? e.message : this.t("general.unknown") });
      }
    });
  }
};
function isPendingIssueAction(type) {
  return type === "upload" /* Upload */ || type === "download" /* Download */ || type === "deleteRemote" /* DeleteRemote */ || type === "deleteLocal" /* DeleteLocal */ || type === "skipLargeFile" /* SkipLargeFile */ || type === "retryLater" /* RetryLater */;
}
function isAuthFailure(error) {
  if (error instanceof OneDriveError && error.type === "AuthExpired" /* AuthExpired */) return true;
  if (error instanceof AuthError) return true;
  return false;
}
function isRemoteMutationConflict(error) {
  return error.type === "PreconditionFailed" /* PreconditionFailed */ || error.type === "Conflict" /* Conflict */ || error.type === "NotFound" /* NotFound */;
}
function isSyncDecisionToken(value) {
  if (!value || typeof value !== "object") return false;
  const token = value;
  if (token.version !== 1 || typeof token.vaultName !== "string" || typeof token.accountId !== "string" || !isCompleteSyncScope(token.scope) || token.ancestorHash !== null && typeof token.ancestorHash !== "string" || !token.local || typeof token.local !== "object" || !token.remote || typeof token.remote !== "object") return false;
  if (token.local.exists) {
    if (typeof token.local.hash !== "string" || typeof token.local.size !== "number") return false;
  } else if (token.local.exists !== false) return false;
  if (token.remote.exists) {
    if (typeof token.remote.driveId !== "string" || typeof token.remote.eTag !== "string") return false;
  } else if (token.remote.exists !== false) return false;
  return true;
}
function isCompleteSyncScope(value) {
  if (!value || typeof value !== "object") return false;
  const scope = value;
  return typeof scope.accountId === "string" && typeof scope.driveId === "string" && typeof scope.vaultFolderId === "string" && typeof scope.filesRootId === "string";
}
function isResolvedIssueAction(type) {
  return type === "upload" /* Upload */ || type === "download" /* Download */ || type === "deleteRemote" /* DeleteRemote */ || type === "deleteLocal" /* DeleteLocal */ || type === "renameRemote" /* RenameRemote */;
}
function isFileMutationAction(type) {
  return type === "upload" /* Upload */ || type === "download" /* Download */ || type === "deleteRemote" /* DeleteRemote */ || type === "deleteLocal" /* DeleteLocal */ || type === "renameRemote" /* RenameRemote */;
}
function isDeltaStateInvalid(error) {
  if (!(error instanceof OneDriveError)) return false;
  return error.statusCode === 410 || error.type === "NotFound" /* NotFound */ || error.graphCode === "resyncRequired" || error.graphCode === "syncStateNotFound" || error.graphCode === "invalidSyncState";
}
function normalizeRemotePathKey(path) {
  return path.normalize("NFC").toLocaleLowerCase();
}
function emptyMutationCheckpoint() {
  return {
    baseUpserts: [],
    baseRemovals: [],
    remoteUpserts: [],
    remoteDeletes: [],
    pendingConflictRemovals: [],
    pendingDeleteRemovals: []
  };
}
function errorDiagData(error) {
  if (error instanceof OneDriveError) {
    return {
      errorType: error.type,
      statusCode: error.statusCode,
      graphCode: error.graphCode
    };
  }
  const message = error instanceof Error ? error.message : String(error);
  return { message };
}

// src/sync/diagnostic-logger.ts
var ALL_CATEGORIES = [
  "scan",
  "plan",
  "execute",
  "auth",
  "onedrive",
  "state",
  "lifecycle"
];
var MAX_BUFFER = 5e3;
var MAX_LOG_DAYS = 7;
var MAX_LOG_BYTES = 30 * 1024 * 1024;
var MAX_LOG_FILE_BYTES = 5 * 1024 * 1024;
var FLUSH_INTERVAL_MS = 5e3;
var DiagnosticLogger = class {
  constructor() {
    this.enabled = /* @__PURE__ */ new Set();
    this.buffer = [];
    this.pending = [];
    this.timer = null;
    this.adapter = null;
    this.logDir = getEasySyncPaths(DEFAULT_CONFIG_DIR).logsDir;
    this.lastPruneDate = null;
  }
  /** Must be called after the Obsidian vault adapter is available. */
  setAdapter(adapter, configDir) {
    this.adapter = adapter;
    this.logDir = `${configDir}/plugins/easy-sync/logs`;
  }
  /** Enable all categories. Called when the user turns on diagnostic logging. */
  enableAll() {
    for (const c of ALL_CATEGORIES) this.enabled.add(c);
  }
  /** Disable all categories. warn/error still emit regardless. */
  clear() {
    this.enabled.clear();
  }
  /** Check if a specific category is enabled. */
  isEnabled(cat) {
    return this.enabled.has(cat);
  }
  // ---- Public logging API ----
  log(cat, msg, data) {
    if (!this.enabled.has(cat)) return;
    this.emit({ ts: Date.now(), cat, lvl: "log", msg, data });
  }
  warn(cat, msg, data) {
    this.emit({ ts: Date.now(), cat, lvl: "warn", msg, data });
  }
  error(cat, msg, data) {
    this.emit({ ts: Date.now(), cat, lvl: "error", msg, data });
  }
  // ---- Internal ----
  emit(e) {
    const ts = new Date(e.ts).toLocaleTimeString();
    const prefix = `[EasySync|${e.cat}]`;
    const line = `${ts} ${prefix} ${e.msg}`;
    if (e.lvl === "error") {
      if (e.data !== void 0) console.error(line, e.data);
      else console.error(line);
    } else if (e.lvl === "warn") {
      if (e.data !== void 0) console.warn(line, e.data);
      else console.warn(line);
    } else {
      if (e.data !== void 0) console.log(line, e.data);
      else console.log(line);
    }
    this.buffer.push(e);
    if (this.buffer.length > MAX_BUFFER) {
      this.buffer = this.buffer.slice(-MAX_BUFFER);
    }
    this.pending.push(e);
    if (!this.timer) {
      this.timer = compatSetTimeout(() => {
        void this.flush();
      }, FLUSH_INTERVAL_MS);
    }
  }
  async flush() {
    this.timer = null;
    if (!this.adapter || this.pending.length === 0) return;
    const batch = this.pending;
    this.pending = [];
    const today = localDate();
    const text = batch.map((e) => JSON.stringify(e)).join("\n") + "\n";
    try {
      await ensureDir(this.adapter, this.logDir);
      let seg = 0;
      let path = `${this.logDir}/${today}.jsonl`;
      while (seg < 99) {
        try {
          const st = await this.adapter.stat(path);
          if (!st || st.size + text.length <= MAX_LOG_FILE_BYTES) break;
        } catch {
          break;
        }
        seg++;
        path = `${this.logDir}/${today}.${seg}.jsonl`;
      }
      if (await this.adapter.exists(path)) {
        await this.adapter.append(path, text);
      } else {
        await this.adapter.write(path, text);
      }
      if (this.lastPruneDate !== today) {
        await pruneLogs(this.adapter, this.logDir, MAX_LOG_DAYS, MAX_LOG_BYTES);
        this.lastPruneDate = today;
      }
    } catch {
    }
  }
  /** Force flush pending entries to disk. Call on plugin unload. */
  async dispose() {
    if (this.timer) {
      compatClearTimeout(this.timer);
      this.timer = null;
    }
    await this.flush();
  }
  /** Get recent entries from the in-memory buffer (for future debug UI). */
  getRecent(count = 100) {
    return this.buffer.slice(-count);
  }
  /** Flush pending entries to disk immediately, then restart the batch timer.
   *  Called before reading snapshot so the report includes the latest events. */
  async forceFlush() {
    if (this.timer) {
      compatClearTimeout(this.timer);
      this.timer = null;
    }
    await this.flush();
  }
  /** Return a merged snapshot of recent log entries from disk, pending batch,
   *  and memory buffer. Force-flushes pending to disk first so the report
   *  includes events that haven't been persisted yet. */
  async snapshot(count = 500) {
    await this.forceFlush();
    const diskEntries = await this.readRecentDiskLogs(Number.MAX_SAFE_INTEGER);
    const seen = /* @__PURE__ */ new Set();
    const merged = [];
    for (const e of [...diskEntries, ...this.buffer]) {
      const key = `${e.ts}|${e.cat}|${e.lvl}|${e.msg}`;
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push(e);
    }
    merged.sort((a, b) => a.ts - b.ts);
    return merged.slice(-count);
  }
  /** Read recent disk log entries from JSONL files (max `count` most recent).
   *  Reads up to 3 recent log files. Falls back to memory buffer if adapter
   *  is unavailable or no disk files exist. */
  async readRecentDiskLogs(count = 500) {
    if (!this.adapter) return this.buffer.slice(-count);
    try {
      let listed;
      try {
        listed = await this.adapter.list(this.logDir);
      } catch {
        return this.buffer.slice(-count);
      }
      const jsonlFiles = listed.files.filter((f) => /^\d{4}-\d{2}-\d{2}(?:\.\d+)?\.jsonl$/.test(fileName(f))).sort((a, b) => fileName(b).localeCompare(fileName(a))).slice(0, 3);
      if (jsonlFiles.length === 0) return this.buffer.slice(-count);
      const entries = [];
      for (const filePath of jsonlFiles) {
        try {
          const raw = await this.adapter.read(filePath);
          for (const line of raw.split("\n")) {
            const trimmed = line.trim();
            if (!trimmed) continue;
            try {
              const parsed = JSON.parse(trimmed);
              if (isRecord(parsed) && typeof parsed.ts === "number" && typeof parsed.msg === "string" && (parsed.cat === "scan" || parsed.cat === "plan" || parsed.cat === "execute" || parsed.cat === "auth" || parsed.cat === "onedrive" || parsed.cat === "state" || parsed.cat === "lifecycle") && (parsed.lvl === "log" || parsed.lvl === "warn" || parsed.lvl === "error")) {
                entries.push({
                  ts: parsed.ts,
                  cat: parsed.cat,
                  lvl: parsed.lvl,
                  msg: parsed.msg,
                  data: parsed.data
                });
              }
            } catch {
            }
          }
        } catch {
        }
      }
      if (entries.length === 0) return this.buffer.slice(-count);
      entries.sort((a, b) => a.ts - b.ts);
      return entries.slice(-count);
    } catch {
      return this.buffer.slice(-count);
    }
  }
};
async function ensureDir(adapter, dir) {
  const parts = dir.split("/");
  for (let i = 1; i <= parts.length; i++) {
    const p = parts.slice(0, i).join("/");
    try {
      await adapter.mkdir(p);
    } catch {
    }
  }
}
async function pruneLogs(adapter, dir, maxDays, maxBytes) {
  let listed;
  try {
    listed = await adapter.list(dir);
  } catch {
    return;
  }
  const logPattern = /^\d{4}-\d{2}-\d{2}(?:\.\d+)?\.jsonl$/;
  const logs = listed.files.filter((p) => logPattern.test(fileName(p)));
  const sized = [];
  for (const p of logs) {
    try {
      const st = await adapter.stat(p.includes("/") ? p : `${dir}/${p}`);
      if (st) sized.push({ path: p, size: st.size });
    } catch {
    }
  }
  sized.sort((a, b) => fileName(a.path).localeCompare(fileName(b.path)));
  const cutoff = localDate();
  const cutoffDate = new Date(cutoff);
  cutoffDate.setDate(cutoffDate.getDate() - maxDays);
  const cutoffStr = `${cutoffDate.getFullYear()}-${String(cutoffDate.getMonth() + 1).padStart(2, "0")}-${String(cutoffDate.getDate()).padStart(2, "0")}`;
  let remaining = [];
  for (const s of sized) {
    const name = fileName(s.path);
    const fileDate = name.slice(0, 10);
    if (fileDate < cutoffStr) {
      try {
        await adapter.remove(s.path);
      } catch {
      }
    } else {
      remaining.push(s);
    }
  }
  let total = remaining.reduce((sum, s) => sum + s.size, 0);
  for (const s of remaining) {
    if (total <= maxBytes) break;
    try {
      await adapter.remove(s.path);
    } catch {
    }
    total -= s.size;
  }
}
function fileName(path) {
  return path.substring(path.lastIndexOf("/") + 1);
}
function localDate() {
  const d = /* @__PURE__ */ new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

// src/ui/settings-tab.ts
var import_obsidian11 = require("obsidian");

// src/ui/auth-pending-modal.ts
var import_obsidian6 = require("obsidian");
var AuthPendingModal = class extends import_obsidian6.Modal {
  constructor(app, title, message, recheckLabel, reopenLabel) {
    super(app);
    this.title = title;
    this.message = message;
    this.recheckLabel = recheckLabel;
    this.reopenLabel = reopenLabel;
    this.resolve = null;
  }
  /** Open the modal and return the user's chosen action */
  awaitAction() {
    return new Promise((resolve) => {
      this.resolve = resolve;
      this.open();
    });
  }
  finish(result) {
    const resolve = this.resolve;
    this.resolve = null;
    this.close();
    resolve?.(result);
  }
  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    this.setTitle(this.title);
    contentEl.createEl("p", {
      text: this.message,
      cls: "setting-item-description"
    });
    const btnRow = contentEl.createDiv({ cls: "modal-button-container" });
    const recheckBtn = btnRow.createEl("button", {
      text: this.recheckLabel,
      cls: "mod-cta"
    });
    recheckBtn.addEventListener("click", () => {
      this.finish({ action: "recheck" });
    });
    const reopenBtn = btnRow.createEl("button", {
      text: this.reopenLabel
    });
    reopenBtn.addEventListener("click", () => {
      this.finish({ action: "reopen" });
    });
  }
  onClose() {
    const resolve = this.resolve;
    this.resolve = null;
    resolve?.({ action: "dismiss" });
  }
};

// src/ui/automatic-handling-modal.ts
var import_obsidian7 = require("obsidian");
var AutomaticHandlingModal = class extends import_obsidian7.Modal {
  constructor(plugin) {
    super(plugin.app);
    this.plugin = plugin;
  }
  onOpen() {
    const { contentEl } = this;
    const t = this.plugin.i18n.t.bind(this.plugin.i18n);
    contentEl.empty();
    contentEl.addClass("easy-sync-automatic-handling");
    this.setTitle(t("settings.automaticHandling.title"));
    contentEl.createEl("p", {
      text: t("settings.automaticHandling.intro"),
      cls: "setting-item-description"
    });
    new import_obsidian7.Setting(contentEl).setName(t("settings.automaticHandling.autoDeleteLocalFiles.name")).setDesc(t("settings.automaticHandling.autoDeleteLocalFiles.desc")).addToggle((toggle) => {
      toggle.setValue(this.plugin.automaticHandlingPolicy.autoDeleteLocalFiles).onChange(async (value) => {
        await this.plugin.updateAutomaticHandlingPolicy({
          ...this.plugin.automaticHandlingPolicy,
          autoDeleteLocalFiles: value
        });
      });
    });
    new import_obsidian7.Setting(contentEl).setName(t("settings.automaticHandling.mergeNonOverlappingText.name")).setDesc(t("settings.automaticHandling.mergeNonOverlappingText.desc")).addToggle((toggle) => {
      toggle.setValue(this.plugin.automaticHandlingPolicy.mergeNonOverlappingText).onChange(async (value) => {
        await this.plugin.updateAutomaticHandlingPolicy({
          ...this.plugin.automaticHandlingPolicy,
          mergeNonOverlappingText: value
        });
      });
    });
  }
  onClose() {
    this.contentEl.empty();
  }
};

// src/ui/config-sync-modal.ts
var import_obsidian8 = require("obsidian");
var ConfigSyncModal = class extends import_obsidian8.Modal {
  constructor(plugin) {
    super(plugin.app);
    this.plugin = plugin;
  }
  onOpen() {
    const { contentEl } = this;
    const t = this.plugin.i18n.t.bind(this.plugin.i18n);
    this.modalEl.addClass("easy-sync-settings-modal");
    contentEl.empty();
    this.setTitle(t("settings.syncScope.title"));
    const toggles = [
      {
        key: "settings.syncPluginFiles",
        get: () => this.plugin.syncPluginFiles,
        patch: (value) => ({ syncPluginFiles: value })
      },
      {
        key: "settings.syncEditor",
        get: () => this.plugin.syncEditorSettings,
        patch: (value) => ({ syncEditorSettings: value })
      },
      {
        key: "settings.syncAppearance",
        get: () => this.plugin.syncAppearance,
        patch: (value) => ({ syncAppearance: value })
      },
      {
        key: "settings.syncThemes",
        get: () => this.plugin.syncThemes,
        patch: (value) => ({ syncThemes: value })
      },
      {
        key: "settings.syncHotkeys",
        get: () => this.plugin.syncHotkeys,
        patch: (value) => ({ syncHotkeys: value })
      },
      {
        key: "settings.syncCorePlugins",
        get: () => this.plugin.syncCorePlugins,
        patch: (value) => ({ syncCorePlugins: value })
      },
      {
        key: "settings.syncCommunityPlugins",
        get: () => this.plugin.syncCommunityPlugins,
        patch: (value) => ({ syncCommunityPlugins: value })
      },
      {
        key: "settings.syncPluginData",
        get: () => this.plugin.syncPluginData,
        patch: (value) => ({ syncPluginData: value })
      }
    ];
    for (const ct of toggles) {
      new import_obsidian8.Setting(contentEl).setName(t(ct.key + ".name")).setDesc(t(ct.key + ".desc")).addToggle((toggle) => {
        toggle.setValue(ct.get()).onChange(async (value) => {
          const previous = ct.get();
          try {
            await this.plugin.updateSyncPathSettings(ct.patch(value));
          } catch (error) {
            toggle.setValue(previous);
            const key = error instanceof SyncPathSettingsUpdateError ? error.code === "busy" ? "notice.syncPathSettings.busy" : "notice.syncPathSettings.recovery" : "notice.syncPathSettings.failed";
            new import_obsidian8.Notice(t(key));
          }
        });
      });
    }
  }
  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
};

// src/ui/confirm-modal.ts
var import_obsidian9 = require("obsidian");
var SyncPlanAlertModal = class extends import_obsidian9.Modal {
  constructor(app, title, message, buttonLabel, onViewPlan) {
    super(app);
    this.title = title;
    this.message = message;
    this.buttonLabel = buttonLabel;
    this.onViewPlan = onViewPlan;
  }
  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    this.setTitle(this.title);
    contentEl.createEl("p", {
      text: this.message,
      cls: "setting-item-description"
    });
    const btnRow = contentEl.createDiv("modal-button-container");
    const viewBtn = btnRow.createEl("button", {
      text: this.buttonLabel,
      cls: "mod-cta"
    });
    viewBtn.addEventListener("click", () => {
      this.onViewPlan();
      this.close();
    });
  }
  onClose() {
  }
};
var ConfirmModal = class extends import_obsidian9.Modal {
  constructor(app, title, plan, confirmLabel, cancelLabel, t, options) {
    super(app);
    this.title = title;
    this.plan = plan;
    this.confirmLabel = confirmLabel;
    this.cancelLabel = cancelLabel;
    this.t = t;
    this.options = options;
    this.resolve = null;
  }
  /** Open the modal and return a promise that resolves to true (confirmed) or false (cancelled). */
  awaitConfirm() {
    return new Promise((resolve) => {
      this.resolve = resolve;
      this.open();
    });
  }
  finish(value) {
    const resolve = this.resolve;
    this.resolve = null;
    this.close();
    resolve?.(value);
  }
  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    this.setTitle(this.title);
    if (this.options?.message) {
      contentEl.createEl("p", {
        text: this.options.message,
        cls: "setting-item-description"
      });
    }
    if (this.plan) {
      const rows = [
        [this.t("syncView.fileStatus.upload"), this.plan.uploads],
        [this.t("syncView.fileStatus.download"), this.plan.downloads],
        [this.t("syncView.fileStatus.delete"), this.plan.deletes],
        [this.t("syncView.fileStatus.conflict"), this.plan.conflicts],
        [this.t("syncView.fileStatus.skip"), this.plan.skipped]
      ];
      const visibleRows = rows.filter(([, count]) => count > 0);
      if (visibleRows.length > 0) {
        const table = contentEl.createEl("table");
        for (const [label, count] of visibleRows) {
          const tr = table.createEl("tr");
          tr.createEl("td", { text: label });
          tr.createEl("td", { text: String(count) });
        }
      }
      if (this.plan.deletes > 0) {
        contentEl.createDiv().setText(
          this.t("confirm.deleteWarning", { count: this.plan.deletes })
        );
      }
    }
    if (this.options?.warning) {
      contentEl.createDiv().setText(this.options.warning);
    }
    const btnRow = contentEl.createDiv("modal-button-container");
    const confirmBtn = btnRow.createEl("button", {
      text: this.confirmLabel,
      cls: this.options?.danger ? "mod-warning" : "mod-cta"
    });
    confirmBtn.addEventListener("click", () => {
      this.finish(true);
    });
    const cancelBtn = btnRow.createEl("button", { text: this.cancelLabel });
    cancelBtn.addEventListener("click", () => {
      this.finish(false);
    });
  }
  onClose() {
    const resolve = this.resolve;
    this.resolve = null;
    resolve?.(false);
  }
};

// src/ui/sync-exclusion-modal.ts
var import_obsidian10 = require("obsidian");
var SyncExclusionFolderPicker = class extends import_obsidian10.FuzzySuggestModal {
  constructor(plugin, onChoose) {
    super(plugin.app);
    this.plugin = plugin;
    this.onChoose = onChoose;
    this.setPlaceholder(plugin.i18n.t("settings.syncExclusion.pickerPlaceholder"));
  }
  getItems() {
    const configDir = getConfigDir(this.plugin.app.vault);
    return this.plugin.app.vault.getAllLoadedFiles().filter((file) => file instanceof import_obsidian10.TFolder).filter(
      (folder) => normalizeExcludedFolders([folder.path], configDir).length === 1 && !isPathExcludedByFolders(folder.path, this.plugin.excludedFolders)
    ).sort((left, right) => left.path.localeCompare(right.path));
  }
  getItemText(folder) {
    return folder.path;
  }
  onChooseItem(folder) {
    this.onChoose(folder);
  }
};
function renderExcludedFolderChips(containerEl, paths, options) {
  containerEl.empty();
  containerEl.addClass("easy-sync-exclusion-chips");
  containerEl.setAttribute("role", "list");
  for (const path of paths) {
    const chipEl = containerEl.createDiv({
      cls: "easy-sync-exclusion-chip",
      attr: { role: "listitem" }
    });
    chipEl.createSpan({
      cls: "easy-sync-exclusion-chip-label",
      text: path
    });
    let removing = false;
    const removeLabel = options.removeLabel(path);
    const removeButton = new import_obsidian10.ExtraButtonComponent(chipEl).setIcon("x").setTooltip(removeLabel).setDisabled(options.disabled ?? false).onClick(async () => {
      if (removing) return;
      removing = true;
      removeButton.setDisabled(true);
      const removed = await options.onRemove(path);
      if (!removed && removeButton.extraSettingsEl.isConnected) {
        removing = false;
        removeButton.setDisabled(options.disabled ?? false);
      }
    });
    removeButton.extraSettingsEl.addClass("easy-sync-exclusion-chip-remove");
    removeButton.extraSettingsEl.setAttribute("aria-label", removeLabel);
  }
}
async function updateExcludedFoldersFromUi(plugin, paths) {
  try {
    await plugin.updateExcludedFolders(paths);
    return true;
  } catch (error) {
    const key = error instanceof SyncPathSettingsUpdateError ? error.code === "busy" ? "notice.syncPathSettings.busy" : "notice.syncPathSettings.recovery" : "notice.syncPathSettings.failed";
    new import_obsidian10.Notice(plugin.i18n.t(key));
    return false;
  }
}
var SyncExclusionModal = class extends import_obsidian10.Modal {
  constructor(plugin) {
    super(plugin.app);
    this.plugin = plugin;
    this.saving = false;
  }
  onOpen() {
    this.render();
  }
  onClose() {
    this.contentEl.empty();
  }
  render() {
    const t = this.plugin.i18n.t.bind(this.plugin.i18n);
    this.modalEl.addClass("easy-sync-settings-modal");
    this.contentEl.empty();
    this.setTitle(t("settings.syncExclusion.title"));
    this.contentEl.createEl("p", {
      text: t("settings.syncExclusion.intro"),
      cls: "setting-item-description"
    });
    const folderSetting = new import_obsidian10.Setting(this.contentEl).setName(t("settings.syncExclusion.folders.name")).addButton((button) => {
      button.setButtonText(t("settings.syncExclusion.add")).setDisabled(this.saving).onClick(() => {
        new SyncExclusionFolderPicker(
          this.plugin,
          (folder) => {
            void this.addFolder(folder.path);
          }
        ).open();
      });
    });
    if (this.plugin.excludedFolders.length === 0) {
      folderSetting.setDesc(t("settings.syncExclusion.empty"));
      return;
    }
    const chipsEl = folderSetting.descEl.createDiv();
    renderExcludedFolderChips(chipsEl, this.plugin.excludedFolders, {
      disabled: this.saving,
      removeLabel: (path) => t("settings.syncExclusion.removeFolder", { path }),
      onRemove: (path) => this.removeFolder(path)
    });
  }
  async addFolder(path) {
    await this.updateFolders([...this.plugin.excludedFolders, path]);
  }
  async removeFolder(path) {
    return await this.updateFolders(
      this.plugin.excludedFolders.filter((current) => current !== path)
    );
  }
  async updateFolders(paths) {
    if (this.saving) return false;
    this.saving = true;
    try {
      return await updateExcludedFoldersFromUi(this.plugin, paths);
    } finally {
      this.saving = false;
      this.render();
    }
  }
};

// src/ui/settings-tab.ts
var GITHUB_URL = "https://github.com/jiaoyingxing/easy-sync";
var XHS_URL = "https://xhslink.com/m/57v8xzlVMKp";
function buildSettingsSyncButtonState(input) {
  if (input.isRunning && input.canCancel) {
    return {
      labelKey: "syncView.cancelSync",
      cta: false,
      warning: true,
      disabled: false,
      action: "cancel-sync"
    };
  }
  if (input.isRunning) {
    return {
      labelKey: "syncView.conflict.processing",
      cta: false,
      warning: false,
      disabled: true,
      action: "processing"
    };
  }
  if (input.planReviewActive) {
    return {
      labelKey: "syncPlan.confirmExecute",
      cta: true,
      warning: false,
      disabled: false,
      action: "confirm-plan"
    };
  }
  if (input.hasCompletedSync) {
    return {
      labelKey: "settings.firstSync.sync",
      cta: true,
      warning: false,
      disabled: false,
      action: "start-manual"
    };
  }
  return {
    labelKey: "settings.firstSync.start",
    cta: true,
    warning: false,
    disabled: false,
    action: "start-first"
  };
}
var EasySyncSettingTab = class extends import_obsidian11.PluginSettingTab {
  constructor(plugin) {
    super(plugin.app, plugin);
    this.accountSectionEl = null;
    this.syncSectionEl = null;
    this.aboutSectionEl = null;
    this.maintenanceSectionEl = null;
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.addClass("easy-sync-settings-tab");
    const t = this.plugin.i18n.t.bind(this.plugin.i18n);
    this.accountSectionEl = containerEl.createDiv("easy-sync-settings-account");
    this.syncSectionEl = containerEl.createDiv("easy-sync-settings-group-host easy-sync-settings-sync");
    this.aboutSectionEl = containerEl.createDiv("easy-sync-settings-group-host easy-sync-settings-about");
    this.maintenanceSectionEl = containerEl.createDiv(
      "easy-sync-settings-group-host easy-sync-settings-maintenance"
    );
    this.renderAccountSection(t);
    this.renderSyncSection(t);
    this.renderAboutSection(t);
    this.renderMaintenanceSection(t);
  }
  refreshAuthState() {
    if (!this.accountSectionEl?.isConnected || !this.syncSectionEl?.isConnected) return;
    const t = this.plugin.i18n.t.bind(this.plugin.i18n);
    this.renderAccountSection(t);
    this.renderSyncSection(t);
  }
  refreshSyncState() {
    if (!this.syncSectionEl?.isConnected) return;
    this.renderSyncSection(this.plugin.i18n.t.bind(this.plugin.i18n));
  }
  hide() {
    super.hide();
    this.accountSectionEl = null;
    this.syncSectionEl = null;
    this.aboutSectionEl = null;
    this.maintenanceSectionEl = null;
  }
  renderAccountSection(t) {
    if (!this.accountSectionEl) return;
    this.accountSectionEl.empty();
    this.renderAccount(this.accountSectionEl, t);
  }
  renderSyncSection(t) {
    if (!this.syncSectionEl) return;
    this.syncSectionEl.empty();
    const hasCompletedSync = this.plugin.hasCompletedSyncState();
    const fullSyncRunning = this.plugin.syncExecutor?.isRunning ?? false;
    const sideActionRunning = this.plugin.syncExecutor?.hasSideActionsInFlight ?? false;
    const isRunning = isAnySyncActivityRunning(
      this.plugin.progressStore.state,
      fullSyncRunning,
      sideActionRunning
    );
    const buttonState = buildSettingsSyncButtonState({
      hasCompletedSync,
      isRunning,
      canCancel: fullSyncRunning,
      planReviewActive: this.plugin.state?.planReviewActive ?? false
    });
    const syncGroup = new import_obsidian11.SettingGroup(this.syncSectionEl).setHeading(t("settings.group.sync"));
    if (this.plugin.auth?.authState.isLoggedIn) {
      syncGroup.addSetting((setting) => {
        setting.setName(t("settings.firstSync.name")).setDesc(t("settings.firstSync.desc")).addButton((btn) => {
          if (buttonState.cta) {
            btn.setCta();
          }
          if (buttonState.warning) {
            btn.buttonEl.classList.add("mod-warning");
          }
          btn.setButtonText(t(buttonState.labelKey)).setDisabled(buttonState.disabled).onClick(() => {
            switch (buttonState.action) {
              case "start-manual":
                void this.plugin.startManualSync?.();
                return;
              case "start-first":
                void this.plugin.startFirstSync?.();
                return;
              case "confirm-plan":
                void this.plugin.executePlanReview?.();
                return;
              case "cancel-sync":
                void this.plugin.cancelSync?.();
                return;
              case "processing":
                return;
            }
          });
        });
      });
    }
    syncGroup.addSetting((setting) => {
      setting.setName(t("settings.syncScope.name")).setDesc(t("settings.syncScope.desc")).addButton((btn) => {
        btn.setButtonText(t("settings.syncScope.button")).onClick(() => {
          new ConfigSyncModal(this.plugin).open();
        });
      });
    });
    syncGroup.addSetting((setting) => {
      setting.setName(t("settings.syncExclusion.name")).setDesc(t("settings.syncExclusion.desc")).addButton((button) => {
        button.setButtonText(t("settings.syncExclusion.button")).onClick(() => {
          new SyncExclusionModal(this.plugin).open();
        });
      });
      if (this.plugin.excludedFolders.length > 0) {
        const chipsEl = setting.descEl.createDiv();
        renderExcludedFolderChips(chipsEl, this.plugin.excludedFolders, {
          removeLabel: (path) => t("settings.syncExclusion.removeFolder", { path }),
          onRemove: (path) => updateExcludedFoldersFromUi(
            this.plugin,
            this.plugin.excludedFolders.filter((current) => current !== path)
          )
        });
      }
    });
    syncGroup.addSetting((setting) => {
      setting.setName(t("settings.automaticHandling.name")).setDesc(t("settings.automaticHandling.desc")).addButton((button) => {
        button.setButtonText(t("settings.automaticHandling.button")).setTooltip(t("settings.automaticHandling.open")).onClick(() => {
          new AutomaticHandlingModal(this.plugin).open();
        });
        button.buttonEl.setAttribute(
          "aria-label",
          t("settings.automaticHandling.open")
        );
      });
    });
    syncGroup.addSetting((setting) => {
      setting.setName(t("settings.autoSync.name")).setDesc(
        this.plugin.syncInterval === 0 ? t("settings.autoSync.desc.disabled") : this.plugin.autoSyncPaused ? t("settings.autoSync.desc.paused") : t("settings.autoSync.desc.enabled", { minutes: this.plugin.syncInterval })
      ).addToggle((toggle) => {
        toggle.setValue(this.plugin.syncInterval > 0).onChange(async (value) => {
          this.plugin.syncInterval = value ? 3 : 0;
          this.plugin.autoSyncPaused = false;
          await this.plugin.saveSyncSettings();
          this.plugin.restartAutoSync();
          this.refreshSyncState();
        });
      });
    });
    if (this.plugin.syncInterval > 0) {
      syncGroup.addSetting((setting) => {
        setting.setName(t("settings.syncInterval.name")).setDesc(t("settings.syncInterval.desc", { minutes: this.plugin.syncInterval })).addSlider((slider) => {
          slider.setLimits(3, 10, 1).setValue(this.plugin.syncInterval).onChange(async (value) => {
            this.plugin.syncInterval = value;
            await this.plugin.saveSyncSettings();
            this.plugin.restartAutoSync();
            const desc = slider.sliderEl.closest(".setting-item")?.querySelector(".setting-item-description");
            if (desc) {
              desc.textContent = t("settings.syncInterval.desc", { minutes: value });
            }
          });
        });
      });
    }
    syncGroup.addSetting((setting) => {
      setting.setName(t("settings.maxFileSize.name")).setDesc(t("settings.maxFileSize.desc", { size: `${this.plugin.syncMaxFileSizeMb} MB` })).addSlider((slider) => {
        slider.setLimits(200, 2e3, 100).setValue(this.plugin.syncMaxFileSizeMb).onChange(async (value) => {
          this.plugin.syncMaxFileSizeMb = value;
          await this.plugin.saveSyncSettings();
          this.plugin.applyMaxFileSize();
          const desc = slider.sliderEl.closest(".setting-item")?.querySelector(".setting-item-description");
          if (desc) {
            desc.textContent = t("settings.maxFileSize.desc", { size: `${value} MB` });
          }
        });
      });
    });
  }
  renderAboutSection(t) {
    if (!this.aboutSectionEl) return;
    this.aboutSectionEl.empty();
    const aboutGroup = new import_obsidian11.SettingGroup(this.aboutSectionEl).setHeading(t("settings.group.about"));
    aboutGroup.addSetting((setting) => {
      setting.setName(t("settings.about.product.name")).setDesc(t("settings.about.product.desc", { version: this.plugin.manifest.version }));
    });
    aboutGroup.addSetting((setting) => {
      setting.setName(t("settings.about.author.name")).setDesc(t("settings.about.author.desc")).addButton((btn) => {
        btn.setButtonText(t("settings.about.contact.github")).onClick(() => {
          window.open(GITHUB_URL, "_blank", "noopener,noreferrer");
        });
      }).addButton((btn) => {
        btn.setButtonText(t("settings.about.contact.xiaohongshu")).onClick(() => {
          window.open(XHS_URL, "_blank", "noopener,noreferrer");
        });
      });
    });
    aboutGroup.addSetting((setting) => {
      setting.setName(t("settings.about.usage.name")).setDesc(t("settings.about.usage.desc"));
    });
    aboutGroup.addSetting((setting) => {
      setting.setName(t("settings.about.disclaimer.name")).setDesc(t("settings.about.disclaimer.desc"));
    });
  }
  renderMaintenanceSection(t) {
    if (!this.maintenanceSectionEl) return;
    this.maintenanceSectionEl.empty();
    const maintGroup = new import_obsidian11.SettingGroup(this.maintenanceSectionEl).setHeading(
      t("settings.group.maintenance")
    );
    maintGroup.addSetting((setting) => {
      setting.setName(t("settings.diagLog.name")).setDesc(t("settings.diagLog.desc")).addToggle((toggle) => {
        toggle.setValue(this.plugin.diagLogEnabled).onChange(async (value) => {
          this.plugin.diagLogEnabled = value;
          await this.plugin.saveSyncSettings();
          this.plugin.applyDiagnosticSetting();
        });
      });
    });
    maintGroup.addSetting((setting) => {
      setting.setName(t("settings.diagReport.name")).setDesc(t("settings.diagReport.desc")).addButton((btn) => {
        btn.setButtonText(t("settings.diagReport.generate")).onClick(() => {
          void this.plugin.generateDiagnosticReport();
        });
      });
    });
    maintGroup.addSetting((setting) => {
      setting.setName(t("settings.reset.name")).setDesc(t("settings.reset.desc")).addButton((btn) => {
        btn.buttonEl.classList.add("mod-warning");
        btn.setButtonText(t("settings.reset.button")).onClick(() => {
          void (async () => {
            const confirmed = await new ConfirmModal(
              this.plugin.app,
              t("settings.reset.confirmTitle"),
              null,
              t("settings.reset.confirm"),
              t("confirm.cancel"),
              t,
              {
                message: t("settings.reset.confirmMessage"),
                warning: t("settings.reset.confirmWarning"),
                danger: true
              }
            ).awaitConfirm();
            if (!confirmed) return;
            await this.plugin.resetSyncState();
            this.refreshSyncState();
          })();
        });
      });
    });
  }
  /** Render the account login/logout section (no group heading) */
  renderAccount(containerEl, t) {
    new import_obsidian11.Setting(containerEl).setName(t("settings.account.name")).setDesc(
      this.plugin.auth?.isInitializing ? t("settings.account.desc.connecting") : this.plugin.auth?.authState.isLoggedIn ? t("settings.account.desc.loggedIn", { name: this.plugin.auth.authState.displayName || t("general.unknown") }) : this.plugin.auth?.isPending ? t("settings.account.desc.pending") : t("settings.account.desc.notLoggedIn")
    ).addButton((btn) => {
      if (this.plugin.auth?.isInitializing) {
        btn.setButtonText(t("settings.account.checking")).setDisabled(true);
      } else if (this.plugin.auth?.authState.isLoggedIn) {
        btn.setButtonText(t("settings.account.logout")).onClick(() => {
          void (async () => {
            await this.plugin.logoutUser();
            this.refreshAuthState();
          })();
        });
      } else if (this.plugin.auth?.isPending) {
        btn.setButtonText(t("settings.account.checking")).setCta().onClick(() => {
          void (async () => {
            if (this.plugin.auth?.checkAuthStatus()) {
              this.refreshAuthState();
              return;
            }
            const modal = new AuthPendingModal(
              this.plugin.app,
              t("settings.account.pendingTitle"),
              t("settings.account.pendingMessage"),
              t("settings.account.recheck"),
              t("settings.account.reopenAuth")
            );
            const result = await modal.awaitAction();
            if (result.action === "recheck") {
              if (this.plugin.auth?.checkAuthStatus()) {
                this.plugin.noticeCenter.show({
                  key: "settings-login-success",
                  message: t("settings.account.loginSuccess"),
                  priority: NOTICE_PRIORITY.action
                });
              } else {
                this.plugin.noticeCenter.show({
                  key: "settings-login-pending",
                  message: t("settings.account.desc.pending"),
                  priority: NOTICE_PRIORITY.attention
                });
              }
            } else if (result.action === "reopen") {
              try {
                await this.plugin.auth?.login();
              } catch (error) {
                console.error("EasySync: login error:", error);
              }
            }
            this.refreshAuthState();
          })();
        });
      } else {
        btn.setButtonText(t("settings.account.login")).setCta().onClick(() => {
          void (async () => {
            try {
              await this.plugin.auth?.login();
            } catch (error) {
              console.error("EasySync: login error:", error);
            }
            this.refreshAuthState();
          })();
        });
      }
    });
  }
};

// src/ui/sync-view.ts
var import_obsidian13 = require("obsidian");

// src/ui/conflict-detail-modal.ts
var import_obsidian12 = require("obsidian");

// src/ui/conflict-detail-presentation.ts
function summarizeConflictReason(reason, t, fallbackKey) {
  if (reason === "reason.bothSidesModified") {
    return t("conflictDetail.summaryBothModified");
  }
  return reason ? t(reason) : t(fallbackKey);
}
function summarizeDifferentContent(reason, t) {
  if (reason === "reason.newFileBothSides") {
    return t("conflictDetail.summaryBothExistDifferent");
  }
  return summarizeConflictReason(reason, t, "conflictDetail.summaryDifferent");
}
function summarizeConflictDetail(evidence, reason, t) {
  if (evidence.kind === "comparing") {
    return t("conflictDetail.summaryComparing");
  }
  if (evidence.kind === "comparison-unavailable") {
    return t("conflictDetail.summaryComparisonUnavailable");
  }
  if (evidence.kind === "bytes-different-no-line-diff") {
    return t("conflictDetail.summaryBytesDifferentNoLineDiff");
  }
  if (evidence.kind === "reason") {
    return summarizeConflictReason(reason, t, "syncView.conflict.defaultReason");
  }
  if (evidence.kind === "content-different") {
    return summarizeDifferentContent(reason, t);
  }
  const { diff } = evidence;
  if (diff.complete && diff.removedCount > 0 && diff.addedCount === 0) {
    return t("conflictDetail.summaryLocalExtra", {
      count: diff.removedCount
    });
  }
  if (diff.complete && diff.addedCount > 0 && diff.removedCount === 0) {
    return t("conflictDetail.summaryRemoteExtra", {
      count: diff.addedCount
    });
  }
  return summarizeDifferentContent(reason, t);
}
function getDiffSummaryReasonKey(reason) {
  switch (reason) {
    case "change-budget":
      return "conflictDetail.diffChangeBudget";
    case "display-budget":
      return "conflictDetail.diffDisplayBudget";
    case "alignment-limit":
      return "conflictDetail.diffAlignmentLimit";
  }
}

// src/ui/conflict-detail-modal.ts
var MAX_TEXT_DIFF_BYTES_PER_SIDE = 8 * 1024 * 1024;
var MAX_FALLBACK_PREVIEW_LINES = 200;
function decodeUtf8(content) {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(content);
  } catch {
    return null;
  }
}
function sameVisibleText(local, remote) {
  return local === remote || local.replace(/\r\n?/g, "\n") === remote.replace(/\r\n?/g, "\n");
}
function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
function getDiffLineNumberWidth(localTotalLines, remoteTotalLines) {
  const maxLineNumber = Math.max(1, localTotalLines, remoteTotalLines);
  return `${Math.max(2, String(maxLineNumber).length)}ch`;
}
var ConflictDetailModal = class extends import_obsidian12.Modal {
  constructor(plugin, item) {
    super(plugin.app);
    this.plugin = plugin;
    this.item = item;
  }
  /** Set callback invoked after a conflict is resolved (keep local / keep remote) */
  setOnResolved(callback) {
    this.onResolved = callback;
    return this;
  }
  async onOpen() {
    const t = (key, params) => this.plugin.i18n.t(key, params);
    const container = this.contentEl;
    container.addClass("easy-sync-conflict-detail");
    const body = container.createDiv("easy-sync-conflict-body");
    body.createEl("h3", {
      text: t("conflictDetail.title", { path: this.item.path })
    });
    const reasonEl = body.createDiv("easy-sync-detail-reason");
    const setSummary = (evidence) => {
      reasonEl.setText(summarizeConflictDetail(evidence, this.item.reason, t));
    };
    const setComparisonUnavailableOrReason = () => {
      setSummary(this.item.local && this.item.remote ? { kind: "comparison-unavailable" } : { kind: "reason" });
    };
    setSummary(this.item.local && this.item.remote ? { kind: "comparing" } : { kind: "reason" });
    this.renderMetadata(body, t);
    body.createEl("hr");
    const loadingEl = body.createDiv("easy-sync-detail-loading");
    loadingEl.setText(t("conflictDetail.loading"));
    const isBinary2 = this.item.local?.binary;
    try {
      let localRaw;
      try {
        localRaw = await this.plugin.app.vault.adapter.readBinary(
          this.item.path
        );
      } catch (e) {
        setComparisonUnavailableOrReason();
        this.plugin.diag.warn("execute", "Conflict detail local read unavailable", {
          path: this.item.path,
          errorKind: getErrorKind(e)
        });
        loadingEl.setText(t("conflictDetail.localReadUnavailable"));
        this.renderActionButtons(container, t);
        return;
      }
      const localWithinTextBudget = localRaw.byteLength <= MAX_TEXT_DIFF_BYTES_PER_SIDE;
      const localContent = localWithinTextBudget ? decodeUtf8(localRaw) : null;
      if (this.item.remote) {
        const diffHeaderEl = body.createEl("h4", {
          text: t("conflictDetail.diffTitle")
        });
        try {
          loadingEl.setText(t("conflictDetail.fetchingRemote"));
          const vaultName = this.plugin.app.vault.getName();
          const remoteRaw = await this.plugin.onedrive.downloadFile(
            vaultName,
            this.item.path,
            this.item.remote.downloadUrl,
            this.item.remote.driveId,
            this.item.remote.size
          );
          loadingEl.setText(t("conflictDetail.computingDiff"));
          const contentComparison = await compareContentBuffers(localRaw, remoteRaw);
          if (contentComparison.status === "equal") {
            diffHeaderEl.setText(t("conflictDetail.diffTitle"));
            body.createDiv("easy-sync-detail-identical").setText(
              t("conflictDetail.identical")
            );
            loadingEl.remove();
            await this.plugin.reconcileIdenticalConflict(this.item.path, {
              localHash: contentComparison.localHash,
              localSize: localRaw.byteLength,
              remoteHash: contentComparison.remoteHash,
              remoteSize: remoteRaw.byteLength,
              remoteETag: this.item.remote.eTag
            });
            this.onResolved?.();
            this.close();
            return;
          }
          if (isBinary2) {
            setSummary({ kind: "content-different" });
            diffHeaderEl.remove();
            body.createDiv("easy-sync-binary-notice").setText(
              t("conflictDetail.binaryFile")
            );
          } else if (localRaw.byteLength > MAX_TEXT_DIFF_BYTES_PER_SIDE || remoteRaw.byteLength > MAX_TEXT_DIFF_BYTES_PER_SIDE) {
            setSummary({ kind: "content-different" });
            body.createDiv("easy-sync-diff-truncated").setText(
              t("conflictDetail.textDiffByteLimit", {
                limit: formatSize(MAX_TEXT_DIFF_BYTES_PER_SIDE)
              })
            );
            if (localContent != null) {
              body.createEl("h4", { text: t("conflictDetail.localPreview") });
              this.renderTextPreview(body, localContent, t);
            }
          } else {
            const remoteContent = decodeUtf8(remoteRaw);
            if (localContent == null || remoteContent == null) {
              setSummary({ kind: "content-different" });
              diffHeaderEl.remove();
              body.createDiv("easy-sync-binary-notice").setText(
                t("conflictDetail.binaryFile")
              );
            } else if (contentComparison.decodedTextEqual || sameVisibleText(localContent, remoteContent)) {
              setSummary({ kind: "bytes-different-no-line-diff" });
              body.createDiv("easy-sync-detail-format-difference").setText(
                t("conflictDetail.textSameBytesDifferent")
              );
            } else {
              const diff = computeDisplayDiff(localContent, remoteContent);
              setSummary({ kind: "text-diff", diff });
              diffHeaderEl.setText(
                diff.complete ? t("conflictDetail.diffTitle") + ` (${t("conflictDetail.diffAdded", { count: diff.addedCount })}, ${t("conflictDetail.diffRemoved", { count: diff.removedCount })})` : t("conflictDetail.diffTitle") + ` (${t("conflictDetail.diffRegionsLocated", { count: diff.parts.length })})`
              );
              this.renderDisplayDiff(body, diff, t);
            }
          }
          loadingEl.remove();
        } catch (e) {
          setComparisonUnavailableOrReason();
          this.plugin.diag.warn("execute", "Conflict detail remote comparison unavailable", {
            path: this.item.path,
            errorKind: getErrorKind(e)
          });
          loadingEl.remove();
          body.createDiv("easy-sync-remote-unavailable").setText(
            t("conflictDetail.remoteComparisonUnavailable")
          );
          if (!localWithinTextBudget) {
            body.createDiv("easy-sync-diff-truncated").setText(
              t("conflictDetail.textDiffByteLimit", {
                limit: formatSize(MAX_TEXT_DIFF_BYTES_PER_SIDE)
              })
            );
          } else if (localContent == null) {
            body.createDiv("easy-sync-binary-notice").setText(
              t("conflictDetail.binaryFile")
            );
          } else {
            body.createEl("h4", { text: t("conflictDetail.localPreview") });
            this.renderTextPreview(body, localContent, t);
          }
        }
      } else if (isBinary2) {
        setSummary({ kind: "reason" });
        loadingEl.remove();
        body.createDiv("easy-sync-binary-notice").setText(
          t("conflictDetail.binaryFile")
        );
      } else {
        setSummary({ kind: "reason" });
        loadingEl.remove();
        if (!localWithinTextBudget) {
          body.createDiv("easy-sync-diff-truncated").setText(
            t("conflictDetail.textDiffByteLimit", {
              limit: formatSize(MAX_TEXT_DIFF_BYTES_PER_SIDE)
            })
          );
        } else if (localContent == null) {
          body.createDiv("easy-sync-binary-notice").setText(
            t("conflictDetail.binaryFile")
          );
        } else {
          body.createEl("h4", { text: t("conflictDetail.localPreview") });
          this.renderTextPreview(body, localContent, t);
        }
      }
    } catch (e) {
      setComparisonUnavailableOrReason();
      this.plugin.diag.warn("execute", "Conflict detail rendering unavailable", {
        path: this.item.path,
        errorKind: getErrorKind(e)
      });
      loadingEl.setText(t("conflictDetail.loadUnavailable"));
    }
    this.renderActionButtons(container, t);
  }
  /** Render the metadata comparison table */
  renderMetadata(container, t) {
    const table = container.createEl("table", "easy-sync-metadata-table");
    const thead = table.createEl("thead");
    const headerRow = thead.createEl("tr");
    headerRow.createEl("th");
    headerRow.createEl("th", {
      text: t("conflictDetail.localLabel"),
      cls: "easy-sync-meta-col-local"
    });
    headerRow.createEl("th", {
      text: t("conflictDetail.remoteLabel"),
      cls: "easy-sync-meta-col-remote"
    });
    const tbody = table.createEl("tbody");
    const mtimeRow = tbody.createEl("tr");
    mtimeRow.createEl("td", { text: t("conflictDetail.modifiedTime") });
    const localTime = this.item.local?.mtime ? new Date(this.item.local.mtime) : null;
    const remoteTime = this.item.remote?.mtime ? new Date(this.item.remote.mtime) : null;
    const localIsNewer = localTime && remoteTime && localTime > remoteTime;
    const remoteIsNewer = localTime && remoteTime && remoteTime > localTime;
    const localTimeCell = mtimeRow.createEl("td", "easy-sync-meta-col-local");
    localTimeCell.setText(
      localTime ? localTime.toLocaleString() + (localIsNewer ? ` ${t("conflictDetail.newer")}` : "") : "\u2014"
    );
    if (localIsNewer) localTimeCell.addClass("easy-sync-meta-highlight");
    const remoteTimeCell = mtimeRow.createEl("td", "easy-sync-meta-col-remote");
    remoteTimeCell.setText(
      remoteTime ? remoteTime.toLocaleString() + (remoteIsNewer ? ` ${t("conflictDetail.newer")}` : "") : "\u2014"
    );
    if (remoteIsNewer) remoteTimeCell.addClass("easy-sync-meta-highlight");
    const sizeRow = tbody.createEl("tr");
    sizeRow.createEl("td", { text: t("conflictDetail.fileSize") });
    const localSize = this.item.local?.size;
    const remoteSize = this.item.remote?.size;
    const localLarger = localSize != null && remoteSize != null && localSize > remoteSize;
    const remoteLarger = localSize != null && remoteSize != null && remoteSize > localSize;
    const localSizeCell = sizeRow.createEl("td", "easy-sync-meta-col-local");
    localSizeCell.setText(
      localSize != null ? formatSize(localSize) + (localLarger ? ` ${t("conflictDetail.larger")}` : "") : "\u2014"
    );
    if (localLarger) localSizeCell.addClass("easy-sync-meta-highlight");
    const remoteSizeCell = sizeRow.createEl("td", "easy-sync-meta-col-remote");
    remoteSizeCell.setText(
      remoteSize != null ? formatSize(remoteSize) + (remoteLarger ? ` ${t("conflictDetail.larger")}` : "") : "\u2014"
    );
    if (remoteLarger) remoteSizeCell.addClass("easy-sync-meta-highlight");
  }
  /** Render bounded exact hunks and clearly marked summary regions. */
  renderDisplayDiff(container, diff, t) {
    const diffContainer = container.createDiv("easy-sync-diff-view");
    diffContainer.style.setProperty(
      "--easy-sync-diff-line-number-width",
      getDiffLineNumberWidth(diff.localTotalLines, diff.remoteTotalLines)
    );
    for (let partIndex = 0; partIndex < diff.parts.length; partIndex++) {
      if (partIndex > 0) {
        const gap = diffContainer.createDiv(
          "easy-sync-diff-line easy-sync-diff-gap"
        );
        gap.setText("\u2026");
      }
      const part = diff.parts[partIndex];
      if (part.kind === "hunk") {
        for (const line of part.lines) this.renderDiffLine(diffContainer, line);
      } else {
        this.renderDiffSummary(diffContainer, part, t);
      }
    }
  }
  renderDiffLine(container, line) {
    const lineEl = container.createDiv(
      `easy-sync-diff-line easy-sync-diff-${line.type}`
    );
    const gutter = lineEl.createSpan("easy-sync-diff-gutter");
    const localNum = line.lineNumber.local ? String(line.lineNumber.local) : "";
    const remoteNum = line.lineNumber.remote ? String(line.lineNumber.remote) : "";
    gutter.createSpan("easy-sync-diff-line-number").setText(localNum);
    gutter.createSpan("easy-sync-diff-line-number").setText(remoteNum);
    const prefix = line.type === "added" ? "+" : line.type === "removed" ? "-" : " ";
    lineEl.createSpan("easy-sync-diff-content").setText(`${prefix} ${line.text}`);
  }
  renderDiffSummary(container, summary, t) {
    const summaryEl = container.createDiv("easy-sync-diff-summary");
    summaryEl.createDiv("easy-sync-diff-summary-reason").setText(
      t(getDiffSummaryReasonKey(summary.reason))
    );
    summaryEl.createDiv("easy-sync-diff-summary-range").setText(
      t("conflictDetail.diffRegionRange", {
        localRange: this.formatLineRange(summary.localStartLine, summary.localEndLine),
        remoteRange: this.formatLineRange(summary.remoteStartLine, summary.remoteEndLine)
      })
    );
    for (const line of summary.localSample) {
      this.renderDiffLine(summaryEl, {
        type: "removed",
        text: line.text,
        lineNumber: { local: line.lineNumber }
      });
    }
    if (summary.localOmittedLines > 0 || summary.remoteOmittedLines > 0) {
      summaryEl.createDiv("easy-sync-diff-line easy-sync-diff-gap").setText(
        t("conflictDetail.diffOmitted", {
          localCount: summary.localOmittedLines,
          remoteCount: summary.remoteOmittedLines
        })
      );
    }
    for (const line of summary.remoteSample) {
      this.renderDiffLine(summaryEl, {
        type: "added",
        text: line.text,
        lineNumber: { remote: line.lineNumber }
      });
    }
  }
  formatLineRange(start, end) {
    if (end < start) return "\u2014";
    return start === end ? String(start) : `${start}\u2013${end}`;
  }
  renderTextPreview(container, content, t) {
    const lines = content.split("\n");
    const shown = Math.min(lines.length, MAX_FALLBACK_PREVIEW_LINES);
    if (shown < lines.length) {
      container.createDiv("easy-sync-diff-truncated").setText(
        t("conflictDetail.previewTruncated", { shown, total: lines.length })
      );
    }
    const preview = container.createDiv("easy-sync-content-preview");
    const pre = preview.createEl("pre");
    pre.createEl("code", { text: lines.slice(0, shown).join("\n") });
  }
  /** Render the bottom action buttons */
  renderActionButtons(container, t) {
    const btnRow = container.createDiv("easy-sync-detail-actions");
    const keepLocalBtn = btnRow.createEl("button", {
      text: t("syncView.conflict.keepLocal")
    });
    keepLocalBtn.addClass("easy-sync-detail-action-local");
    keepLocalBtn.addEventListener("click", () => {
      this.close();
      void (async () => {
        await this.plugin.resolveConflictKeepLocal(this.item.path);
        this.onResolved?.();
      })();
    });
    const keepRemoteBtn = btnRow.createEl("button", {
      text: t("syncView.conflict.keepRemote")
    });
    keepRemoteBtn.addClass("easy-sync-detail-action-remote");
    keepRemoteBtn.addEventListener("click", () => {
      this.close();
      void (async () => {
        await this.plugin.resolveConflictKeepRemote(this.item.path);
        this.onResolved?.();
      })();
    });
    btnRow.createEl("button", {
      text: t("syncView.conflict.skip")
    }).addEventListener("click", () => {
      this.close();
      void (async () => {
        await this.plugin.dismissConflict(this.item.path);
        this.onResolved?.();
      })();
    });
  }
};
function getErrorKind(error) {
  if (error instanceof Error) {
    const typed = error;
    if (typeof typed.type === "string") return `${error.name}:${typed.type}`;
    if (typeof typed.status === "number") return `${error.name}:${typed.status}`;
    return error.name;
  }
  return typeof error;
}

// src/ui/sync-status-presentation.ts
function resolveSyncActivityPresentation(progress) {
  if (progress.cancelRequested) {
    return { kind: "cancelling", labelKey: "syncView.cancelling" };
  }
  switch (progress.phase) {
    case "scanning":
      return { kind: "scanning", labelKey: "progress.scanningLocal" };
    case "preparing":
      return { kind: "preparing", labelKey: "progress.preparingRemote" };
    case "baseline":
      return { kind: "baseline", labelKey: "progress.loadingBaseline" };
    case "checking":
      return { kind: "checking", labelKey: "progress.checkingRemote" };
    case "planning":
      return { kind: "planning", labelKey: "progress.generatingPlan" };
    case "verifying":
      return {
        kind: "verifying",
        labelKey: "progress.verifyingFiles",
        params: { current: progress.current, total: progress.total }
      };
    case "executing":
      switch (progress.currentActionType) {
        case "upload" /* Upload */:
          return { kind: "uploading", labelKey: "syncView.active.upload" };
        case "download" /* Download */:
          return { kind: "downloading", labelKey: "syncView.active.download" };
        case "deleteRemote" /* DeleteRemote */:
        case "deleteLocal" /* DeleteLocal */:
          return { kind: "deleting", labelKey: "syncView.active.delete" };
        case "renameRemote" /* RenameRemote */:
          return { kind: "renaming", labelKey: "syncView.active.rename" };
        default:
          return { kind: "syncing", labelKey: "syncView.progress" };
      }
    case "idle":
    case "done":
    default:
      return { kind: "starting", labelKey: "syncView.progress" };
  }
}
function translateSyncActivity(presentation, t) {
  return t(presentation.labelKey, presentation.params);
}
function trimSyncActivityLabel(label) {
  return label.replace(/(?:…|\.\.\.)$/, "").trimEnd();
}

// src/ui/ribbon-status.ts
var RIBBON_STATUS_ICONS = {
  loggedOut: "cloud-off",
  cancelling: "cloud-alert",
  syncing: "refresh-cw",
  attention: "cloud-alert",
  success: "cloud-check",
  ready: "cloud"
};
function resolveRibbonStatus(input) {
  if (!input.loggedIn) return "loggedOut";
  if (input.cancelling) return "cancelling";
  if (input.syncing) return "syncing";
  if (input.needsAttention) return "attention";
  if (input.recentSuccess) return "success";
  return "ready";
}
function resolveRibbonStatusLabel(status, progress, t) {
  if (status !== "syncing") return t(`ribbon.${status}`);
  const activity = resolveSyncActivityPresentation(progress);
  const phase = trimSyncActivityLabel(translateSyncActivity(activity, t));
  return t("ribbon.syncingPhase", { phase });
}

// src/ui/sync-view.ts
function resolveSyncViewBodyMode(input) {
  if (input.planReviewActive && input.hasSyncState) return "plan";
  if (input.fullSyncRunning) return "progress";
  if (input.pendingCount > 0) return "pending";
  if (input.sideActionResultsVisible) return "progress";
  return "idle";
}
var FILE_STATUS_ICONS = {
  upload: "arrow-up",
  download: "arrow-down",
  delete: "trash-2",
  conflict: "triangle-alert",
  skip: "circle-slash-2",
  error: "circle-x"
};
var ISSUE_ACTION_ICONS = {
  ["upload" /* Upload */]: "arrow-up",
  ["download" /* Download */]: "arrow-down",
  ["deleteRemote" /* DeleteRemote */]: "trash-2",
  ["deleteLocal" /* DeleteLocal */]: "trash-2",
  ["skipLargeFile" /* SkipLargeFile */]: "circle-slash-2",
  ["retryLater" /* RetryLater */]: "rotate-cw"
};
function commonDirPrefix(paths) {
  if (paths.length < 2) return "";
  const parts = paths.map((path) => path.split("/"));
  const limit = Math.min(...parts.map((path) => path.length)) - 1;
  let depth = 0;
  for (let index = 0; index < limit; index++) {
    if (!parts.every((path) => path[index] === parts[0][index])) break;
    depth = index + 1;
  }
  return depth > 0 ? `${parts[0].slice(0, depth).join("/")}/` : "";
}
function trimFilePathPrefix(path, prefix) {
  return prefix && path.startsWith(prefix) ? path.slice(prefix.length) : path;
}
function buildCompletedFilesRenderState(files) {
  return {
    prefix: commonDirPrefix(files.map((file) => file.path)),
    key: files.map((file) => `${file.path}\0${file.status}\0${file.reason ?? ""}`).join("")
  };
}
var SYNC_VIEW_TYPE = "easy-sync-detail";
function buildSyncViewContentKey(historyExpanded, input) {
  const authKey = `auth:${input.isInitializing ? 1 : 0}:${input.isLoggedIn ? 1 : 0}`;
  const runKey = `run:${input.isRunning ? 1 : 0}:${input.canCancel ? 1 : 0}`;
  const historyIds = input.history.map((entry) => entry.id).join("|");
  const historyKey = historyExpanded ? `history:open:${historyIds}` : "history:closed";
  if (input.bodyMode === "plan") {
    const counts = input.planReviewCounts ? `${input.planReviewCounts.uploads},${input.planReviewCounts.downloads},${input.planReviewCounts.deletes},${input.planReviewCounts.conflicts},${input.planReviewCounts.skipped}` : "";
    const items = input.planReviewItems.map((item) => `${item.type}:${item.path}:${item.reason ?? ""}`).join("|");
    return `plan:${authKey}:${runKey}:${counts}:${items}:${historyKey}`;
  }
  if (input.bodyMode === "progress") {
    return `progress:${authKey}:${input.progress.phase}:${historyKey}`;
  }
  if (input.bodyMode === "pending") {
    const issues = input.pendingIssues.map((issue) => `${issue.actionType}:${issue.path}:${issue.updatedAt}:${issue.reason ?? ""}`).join("|");
    const conflicts = input.conflicts.map((item) => `${item.type}:${item.path}:${item.reason ?? ""}`).join("|");
    const deletes = input.pendingDeletes.map((item) => `${item.type}:${item.path}:${item.reason ?? ""}`).join("|");
    return `pending:${authKey}:${runKey}:${issues}:${conflicts}:${deletes}:${historyKey}`;
  }
  return `idle:${authKey}:${runKey}:${input.lastSyncTime}:${historyKey}`;
}
function formatByteProgress(downloaded, total) {
  if (total >= 1048576) return `${(downloaded / 1048576).toFixed(1)}/${(total / 1048576).toFixed(1)} MB`;
  if (total >= 1024) return `${Math.round(downloaded / 1024)}/${Math.round(total / 1024)} KB`;
  return `${downloaded}/${total} B`;
}
function syncViewProgressPercent(state) {
  if (state.total <= 0) return 0;
  return Math.min(100, Math.round(state.current / state.total * 100));
}
function renderFileRow(file, list, prefix, t) {
  const row = list.createDiv("easy-sync-file-row");
  const icon = row.createSpan("easy-sync-file-icon");
  (0, import_obsidian13.setIcon)(icon, file.actionType ? ISSUE_ACTION_ICONS[file.actionType] ?? FILE_STATUS_ICONS[file.status] : FILE_STATUS_ICONS[file.status]);
  row.createSpan("easy-sync-file-path").setText(
    trimFilePathPrefix(file.path, prefix)
  );
  row.createSpan("easy-sync-tree-chip").setText(t(`syncView.fileStatus.${file.status}`));
  if (file.reason) row.createDiv("easy-sync-file-reason").setText(file.reason);
}
var EasySyncSyncView = class extends import_obsidian13.ItemView {
  constructor(leaf, plugin) {
    super(leaf);
    this.historyExpanded = false;
    this.allCollapsed = false;
    // P0: incremental render — frame merging + diffed file list
    this.renderFrameId = null;
    this.lastContentKey = null;
    this.lastPhase = "idle";
    // Cached DOM refs for direct progress-bar updates
    this.progressPanelEl = null;
    this.progressFillEl = null;
    this.progressSubtitleEl = null;
    this.fileListEl = null;
    this.cachedPrefix = null;
    this.completedFilesRenderKey = null;
    this.statusLineEl = null;
    this.statusIconEl = null;
    this.statusTextEl = null;
    this.statusCounterEl = null;
    this.statusDetailEl = null;
    this.currentFileTextEl = null;
    this.currentByteProgressEl = null;
    this.statusDetailMode = null;
    this.plugin = plugin;
  }
  getViewType() {
    return SYNC_VIEW_TYPE;
  }
  getDisplayText() {
    return this.plugin.i18n.t("syncView.title");
  }
  getIcon() {
    return "refresh-cw";
  }
  async onOpen() {
    await this.plugin.ensureStateLoaded();
    this.render();
  }
  async onClose() {
    if (this.renderFrameId !== null) {
      compatCancelAnimationFrame(this.renderFrameId);
      this.renderFrameId = null;
    }
  }
  /** Public entry point — merges multiple calls within the same animation frame. */
  render() {
    if (this.renderFrameId !== null) return;
    this.renderFrameId = compatRequestAnimationFrame(() => {
      this.renderFrameId = null;
      this.doRender();
    });
  }
  doRender() {
    const container = this.contentEl;
    const progress = this.plugin.progressStore.state;
    const fullSyncRunning = this.plugin.syncExecutor?.isRunning ?? false;
    const canCancel = fullSyncRunning;
    const sideActionRunning = this.plugin.syncExecutor?.hasSideActionsInFlight ?? false;
    const isRunning = isAnySyncActivityRunning(
      progress,
      fullSyncRunning,
      sideActionRunning
    );
    const syncState = this.plugin.state;
    const isInitializing = this.plugin.auth?.isInitializing ?? false;
    const authState = this.plugin.auth?.authState;
    const isLoggedIn = isInitializing ? false : authState?.isLoggedIn ?? false;
    const conflicts = (syncState?.pendingConflicts ?? []).filter((item) => !this.plugin.syncExecutor?.isSideActionQueued(item.path));
    const pendingDeletes = (syncState?.pendingRemoteDeletes ?? []).filter((item) => !this.plugin.syncExecutor?.isSideActionQueued(item.path));
    const pendingIssues = syncState?.pendingIssues ?? [];
    const planReviewActive = syncState?.planReviewActive ?? false;
    const pendingCount = pendingIssues.length + conflicts.length + pendingDeletes.length;
    const sideActionResultsVisible = progress.activityKind === "sideAction" && (sideActionRunning || progress.completedFiles.length > 0);
    const bodyMode = resolveSyncViewBodyMode({
      planReviewActive,
      hasSyncState: Boolean(syncState),
      fullSyncRunning,
      pendingCount,
      sideActionResultsVisible
    });
    const statusState = {
      isLoggedIn,
      isInitializing,
      isRunning,
      canCancel,
      lastSyncTime: syncState?.lastSyncTime ?? 0,
      pendingCount,
      planReviewActive,
      autoSyncPaused: this.plugin.autoSyncPaused,
      latestHistory: syncState?.syncHistory[0],
      progress
    };
    const contentKey = buildSyncViewContentKey(this.historyExpanded, {
      isLoggedIn,
      isInitializing,
      isRunning,
      canCancel,
      bodyMode,
      progress,
      planReviewActive,
      pendingIssues,
      conflicts,
      pendingDeletes,
      planReviewCounts: syncState?.planReviewCounts ?? null,
      planReviewItems: syncState?.planReviewItems ?? [],
      history: syncState?.syncHistory ?? [],
      lastSyncTime: syncState?.lastSyncTime ?? 0
    });
    if (this.lastContentKey !== contentKey) {
      this.progressPanelEl = null;
      this.progressFillEl = null;
      this.progressSubtitleEl = null;
      this.fileListEl = null;
      this.cachedPrefix = null;
      this.completedFilesRenderKey = null;
      this.statusLineEl = null;
      this.statusIconEl = null;
      this.statusTextEl = null;
      this.statusCounterEl = null;
      this.statusDetailEl = null;
      this.currentFileTextEl = null;
      this.currentByteProgressEl = null;
      this.statusDetailMode = null;
      container.empty();
      container.addClass("easy-sync-view");
      this.renderToolbar(container);
      const content = container.createDiv("easy-sync-view-content");
      this.renderStatusPanel(content, statusState);
      if (bodyMode === "plan" && syncState) {
        this.renderPlanReviewSection(
          content,
          syncState.planReviewCounts,
          syncState.planReviewItems,
          conflicts,
          pendingDeletes
        );
      } else if (bodyMode === "progress") {
        this.renderProgressPanel(content, progress);
      } else if (bodyMode === "pending") {
        if (sideActionResultsVisible) this.renderProgressPanel(content, progress);
        this.renderPendingSection(content, pendingIssues, conflicts, pendingDeletes);
      }
      if (this.historyExpanded) {
        this.renderHistorySection(content, syncState?.syncHistory ?? []);
      }
      this.toggleAllDetails();
    } else {
      this.updateStatusPanel(statusState);
      if (isRunning) {
        if (this.progressFillEl && progress.total > 0) {
          this.progressFillEl.style.width = `${syncViewProgressPercent(progress)}%`;
        }
        this.appendNewFileRows(progress.completedFiles);
      }
    }
    this.lastContentKey = contentKey;
    this.lastPhase = progress.phase;
  }
  appendNewFileRows(files) {
    if (files.length === 0 || !this.progressPanelEl) return;
    if (!this.fileListEl) {
      this.progressSubtitleEl = this.progressPanelEl.createDiv("easy-sync-progress-subtitle");
      this.progressSubtitleEl.setText(
        this.plugin.i18n.t("syncView.progress.completed", { count: files.length })
      );
    }
    const nextState = buildCompletedFilesRenderState(files);
    if (!this.fileListEl || this.cachedPrefix !== nextState.prefix || this.completedFilesRenderKey !== nextState.key) {
      this.progressPanelEl.querySelector(".easy-sync-progress-prefix")?.remove();
      this.fileListEl?.remove();
      this.fileListEl = null;
      this.renderFileResults(this.progressPanelEl, [...files], true);
    }
    this.progressSubtitleEl?.setText(
      this.plugin.i18n.t("syncView.progress.completed", { count: files.length })
    );
  }
  renderToolbar(container) {
    const t = this.plugin.i18n.t.bind(this.plugin.i18n);
    const toolbar = container.createDiv("nav-header");
    const buttons = toolbar.createDiv("nav-buttons-container");
    this.createIconButton(buttons, "history", t("syncView.history.title"), () => {
      this.historyExpanded = !this.historyExpanded;
      this.render();
    }, this.historyExpanded);
    this.createIconButton(buttons, "settings", t("syncView.openSettings"), () => {
      this.plugin.openPluginSettings();
    });
    this.renderCollapseToggle(buttons);
  }
  renderCollapseToggle(container) {
    const t = this.plugin.i18n.t.bind(this.plugin.i18n);
    const icon = this.allCollapsed ? "chevrons-up-down" : "chevrons-down-up";
    const label = this.allCollapsed ? t("syncView.expandAll") : t("syncView.collapseAll");
    const button = this.createIconButton(container, icon, label, () => {
      this.allCollapsed = !this.allCollapsed;
      this.toggleAllDetails();
      const newIcon = this.allCollapsed ? "chevrons-up-down" : "chevrons-down-up";
      const newLabel = this.allCollapsed ? t("syncView.expandAll") : t("syncView.collapseAll");
      (0, import_obsidian13.setIcon)(button, newIcon);
      (0, import_obsidian13.setTooltip)(button, newLabel);
      button.ariaLabel = newLabel;
    });
  }
  toggleAllDetails() {
    const details = this.contentEl.querySelectorAll(".easy-sync-tree-item");
    if (this.allCollapsed) {
      for (const d of details) d.removeAttribute("open");
    } else {
      for (const d of details) d.setAttribute("open", "");
    }
  }
  createIconButton(container, icon, label, onClick, pressed) {
    const button = container.createEl("button", {
      cls: "clickable-icon nav-action-button",
      attr: { "aria-label": label, type: "button" }
    });
    if (pressed !== void 0) {
      button.setAttr("aria-pressed", String(pressed));
      button.toggleClass("is-active", pressed);
    }
    (0, import_obsidian13.setIcon)(button, icon);
    (0, import_obsidian13.setTooltip)(button, label);
    button.addEventListener("click", onClick);
    return button;
  }
  renderStatusPanel(container, state) {
    const panel = container.createDiv("easy-sync-status-panel");
    this.statusLineEl = panel.createDiv("easy-sync-status-line");
    this.statusIconEl = this.statusLineEl.createSpan("easy-sync-status-icon");
    this.statusTextEl = this.statusLineEl.createSpan("easy-sync-status-text");
    this.statusDetailEl = panel.createDiv("easy-sync-status-detail");
    this.updateStatusPanel(state);
    const actions = panel.createDiv("easy-sync-primary-actions");
    const t = this.plugin.i18n.t.bind(this.plugin.i18n);
    if (state.isInitializing) {
      new import_obsidian13.ButtonComponent(actions).setButtonText(t("settings.account.checking")).setDisabled(true);
    } else if (state.isLoggedIn && state.isRunning && state.canCancel) {
      const cancelButton = new import_obsidian13.ButtonComponent(actions).setButtonText(t("syncView.cancelSync"));
      cancelButton.buttonEl.classList.add("mod-warning");
      cancelButton.onClick(() => {
        void this.plugin.cancelSync();
      });
    } else if (state.isLoggedIn && state.isRunning) {
      new import_obsidian13.ButtonComponent(actions).setButtonText(t("syncView.conflict.processing")).setDisabled(true);
    } else if (state.isLoggedIn && state.planReviewActive) {
      new import_obsidian13.ButtonComponent(actions).setButtonText(t("command.syncNow")).setDisabled(true);
    } else if (state.isLoggedIn) {
      new import_obsidian13.ButtonComponent(actions).setButtonText(t("command.syncNow")).setCta().setDisabled(state.isInitializing).onClick(() => {
        void this.plugin.startManualSync();
      });
    } else {
      new import_obsidian13.ButtonComponent(actions).setButtonText(t("settings.account.login")).setCta().onClick(() => {
        void (async () => {
          try {
            await this.plugin.auth?.login();
          } catch (error) {
            this.plugin.noticeCenter.show({
              key: "auth-login-error",
              message: error instanceof Error ? error.message : t("general.unknown"),
              priority: NOTICE_PRIORITY.failure
            });
          }
        })();
      });
    }
  }
  updateStatusPanel(state) {
    const presentation = this.getStatusPresentation(state);
    const t = this.plugin.i18n.t.bind(this.plugin.i18n);
    if (this.statusLineEl) {
      this.statusLineEl.removeClass("is-loggedOut", "is-cancelling", "is-syncing", "is-attention", "is-success", "is-ready");
      this.statusLineEl.addClass(`is-${presentation.status}`);
    }
    if (this.statusIconEl) {
      (0, import_obsidian13.setIcon)(this.statusIconEl, RIBBON_STATUS_ICONS[presentation.status]);
    }
    this.statusTextEl?.setText(presentation.label);
    if (state.isRunning && state.progress.total > 0) {
      if (!this.statusCounterEl) {
        const statusLine = this.contentEl.querySelector(".easy-sync-status-line");
        if (statusLine instanceof HTMLElement) {
          this.statusCounterEl = statusLine.createSpan("easy-sync-status-counter");
        }
      }
      this.statusCounterEl?.setText(
        t("syncView.progress.items", {
          current: state.progress.current,
          total: state.progress.total
        })
      );
    } else if (this.statusCounterEl) {
      this.statusCounterEl.remove();
      this.statusCounterEl = null;
    }
    if (!this.statusDetailEl) return;
    if (state.isRunning) {
      if (this.statusDetailMode !== "current-file" || !this.currentFileTextEl) {
        this.statusDetailEl.empty();
        this.statusDetailEl.addClass("is-current-file");
        this.currentFileTextEl = this.statusDetailEl.createSpan("easy-sync-status-current-file");
        this.currentByteProgressEl = null;
        this.statusDetailMode = "current-file";
      }
      this.currentFileTextEl.setText(state.progress.currentFile);
      this.updateByteProgress(state.progress);
      return;
    }
    if (this.statusDetailMode !== "timestamp") {
      this.statusDetailEl.empty();
      this.statusDetailEl.removeClass("is-current-file");
      this.currentFileTextEl = null;
      this.currentByteProgressEl = null;
      this.statusDetailMode = "timestamp";
    }
    const timestamp = state.autoSyncPaused && state.latestHistory ? state.latestHistory.endedAt : state.lastSyncTime;
    const detailText = timestamp > 0 ? new Date(timestamp).toLocaleString(void 0, {
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }) : "";
    if (this.statusDetailEl.textContent !== detailText) {
      this.statusDetailEl.setText(detailText);
    }
  }
  updateByteProgress(progress) {
    if (progress.currentItemTotalBytes > 0) {
      if (!this.currentByteProgressEl && this.statusDetailEl) {
        this.currentByteProgressEl = this.statusDetailEl.createSpan("easy-sync-status-byte-progress");
      }
      this.currentByteProgressEl?.setText(
        formatByteProgress(progress.currentItemBytes, progress.currentItemTotalBytes)
      );
      return;
    }
    if (this.currentByteProgressEl) {
      this.currentByteProgressEl.remove();
      this.currentByteProgressEl = null;
    }
  }
  getStatusPresentation(state) {
    const t = this.plugin.i18n.t.bind(this.plugin.i18n);
    if (state.isInitializing) {
      return { status: "ready", label: t("settings.account.desc.connecting") };
    }
    const status = resolveRibbonStatus({
      loggedIn: state.isLoggedIn,
      cancelling: state.progress.cancelRequested,
      syncing: state.isRunning,
      needsAttention: state.pendingCount > 0 || state.planReviewActive || state.autoSyncPaused,
      recentSuccess: state.lastSyncTime > 0
    });
    switch (status) {
      case "cancelling":
        return { status, label: t("syncView.cancelling") };
      case "syncing":
        return { status, label: this.getRunningStatusLabel(state.progress) };
      case "attention":
        if (state.pendingCount > 0) {
          return { status, label: t("syncView.issues.title", { count: state.pendingCount }) };
        }
        if (state.planReviewActive) {
          return { status, label: t("syncPlan.sectionTitle") };
        }
        if (state.latestHistory && state.latestHistory.status !== "success") {
          return {
            status,
            label: t(`syncView.history.status.${state.latestHistory.status}`)
          };
        }
        return { status, label: t("syncView.history.status.partial") };
      case "success":
        return { status, label: t("syncView.status.synced") };
      case "loggedOut":
        return { status, label: t("settings.account.desc.notLoggedIn") };
      default:
        return { status, label: t("syncView.never") };
    }
  }
  getRunningStatusLabel(progress) {
    const t = this.plugin.i18n.t.bind(this.plugin.i18n);
    return translateSyncActivity(resolveSyncActivityPresentation(progress), t);
  }
  renderProgressPanel(container, state) {
    if (state.total <= 0 && state.completedFiles.length === 0) return;
    const t = this.plugin.i18n.t.bind(this.plugin.i18n);
    const panel = container.createDiv("easy-sync-progress-panel");
    this.progressPanelEl = panel;
    if (state.total > 0) {
      const bar = panel.createDiv("easy-sync-progress-bar");
      this.progressFillEl = bar.createDiv("easy-sync-progress-fill");
      this.progressFillEl.style.width = `${syncViewProgressPercent(state)}%`;
    }
    if (state.completedFiles.length > 0) {
      this.progressSubtitleEl = panel.createDiv("easy-sync-progress-subtitle");
      this.progressSubtitleEl.setText(
        t("syncView.progress.completed", { count: state.completedFiles.length })
      );
      this.renderFileResults(panel, state.completedFiles, true);
    }
  }
  renderPendingSection(container, issues, conflicts, pendingDeletes) {
    const section = container.createDiv("easy-sync-section").createDiv("easy-sync-section-body");
    const failures = issues.filter((issue) => issue.actionType !== "skipLargeFile" /* SkipLargeFile */);
    const skipped = issues.filter((issue) => issue.actionType === "skipLargeFile" /* SkipLargeFile */);
    for (const issue of failures) this.renderPendingIssue(section, issue, true);
    for (const conflict of conflicts) this.renderConflictItem(section, conflict);
    if (pendingDeletes.length > 1) {
      const t = this.plugin.i18n.t.bind(this.plugin.i18n);
      const paths = pendingDeletes.map((item) => item.path);
      const actions = section.createDiv("easy-sync-plan-execute");
      actions.addClass("easy-sync-primary-actions");
      new import_obsidian13.ButtonComponent(actions).setButtonText(t("syncView.delete.confirmAll", { count: paths.length })).setWarning().onClick(() => {
        void this.runItemAction(actions, async () => {
          const confirmed = await new ConfirmModal(
            this.plugin.app,
            t("syncView.delete.confirmAllTitle", { count: paths.length }),
            null,
            t("syncView.delete.confirmAll", { count: paths.length }),
            t("confirm.cancel"),
            t,
            {
              message: t("syncView.delete.confirmAllMessage"),
              warning: t("syncView.delete.confirmAllWarning"),
              danger: true
            }
          ).awaitConfirm();
          if (!confirmed) return;
          await this.plugin.confirmRemoteDeletes(paths);
        });
      });
    }
    for (const item of pendingDeletes) this.renderDeleteItem(section, item);
    for (const issue of skipped) this.renderPendingIssue(section, issue, false);
  }
  renderPendingIssue(container, issue, retryable) {
    const t = this.plugin.i18n.t.bind(this.plugin.i18n);
    const details = container.createEl("details", "easy-sync-tree-item");
    const summary = details.createEl("summary", "easy-sync-tree-row");
    this.addCollapseIcon(summary);
    const actionIcon = summary.createSpan("easy-sync-tree-status-icon");
    (0, import_obsidian13.setIcon)(actionIcon, ISSUE_ACTION_ICONS[issue.actionType] ?? "circle-alert");
    summary.createSpan("easy-sync-tree-path").setText(issue.path);
    summary.createSpan("easy-sync-tree-chip").setText(
      retryable ? t("syncView.fileStatus.error") : t("syncView.issues.notSynced")
    );
    const body = details.createDiv("easy-sync-tree-item-body");
    if (issue.reason) body.createDiv("easy-sync-item-reason").setText(issue.reason);
    body.createDiv("easy-sync-item-time").setText(
      t("syncView.issues.lastAttempt", {
        time: new Date(issue.updatedAt).toLocaleString()
      })
    );
    const actions = body.createDiv("easy-sync-item-actions");
    const localFile = this.plugin.app.vault.getAbstractFileByPath(issue.path);
    if (localFile instanceof import_obsidian13.TFile) {
      this.createActionChip(actions, t("syncView.issues.openFile"), "", () => {
        void this.plugin.app.workspace.getLeaf(false).openFile(localFile);
      });
    }
    if (retryable) {
      this.createActionChip(actions, t("syncView.issues.retry"), "accent", () => {
        void this.plugin.startManualSync();
      });
    }
  }
  renderHistorySection(container, history) {
    const t = this.plugin.i18n.t.bind(this.plugin.i18n);
    const section = this.createSection(container, t("syncView.history.title"));
    if (history.length === 0) {
      section.createDiv("easy-sync-empty-state").setText(t("syncView.history.empty"));
      return;
    }
    const list = section.createDiv("easy-sync-history-list");
    history.forEach((entry, index) => {
      const details = list.createEl("details", "easy-sync-history-run easy-sync-tree-item");
      details.open = index === 0 && entry.status !== "success";
      const summary = details.createEl("summary", "easy-sync-history-summary easy-sync-tree-row");
      this.addCollapseIcon(summary);
      const main = summary.createSpan("easy-sync-history-main");
      main.createSpan("easy-sync-history-time").setText(
        new Date(entry.endedAt).toLocaleString(void 0, {
          month: "numeric",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit"
        })
      );
      main.createSpan(`easy-sync-history-status is-${entry.status}`).setText(
        t(`syncView.history.status.${entry.status}`)
      );
      const body = details.createDiv("easy-sync-history-detail");
      body.createDiv("easy-sync-history-meta").setText(
        `${t(`syncView.history.mode.${entry.mode}`)} \xB7 ${t("syncView.history.duration", {
          seconds: Math.max(0, Math.round((entry.endedAt - entry.startedAt) / 1e3))
        })}`
      );
      const counts = this.formatHistoryCounts(entry);
      if (counts) body.createDiv("easy-sync-history-counts").setText(counts);
      if (entry.files.length > 0) {
        this.renderFileResults(body, entry.files, false);
      }
      const retainedTotal = entry.files.length;
      const actionTotal = entry.uploaded + entry.downloaded + entry.deleted + entry.conflicts + entry.skipped + entry.errors;
      const omitted = Math.max(0, actionTotal - retainedTotal);
      if (omitted > 0) {
        body.createDiv("easy-sync-history-omitted").setText(
          t("syncView.history.omitted", { count: omitted })
        );
      }
    });
  }
  renderFileResults(container, files, limitHeight) {
    const t = this.plugin.i18n.t.bind(this.plugin.i18n);
    const renderState = buildCompletedFilesRenderState(files);
    const prefix = limitHeight ? renderState.prefix : "";
    if (prefix) container.createDiv("easy-sync-progress-prefix").setText(prefix);
    const list = container.createDiv("easy-sync-file-list");
    const renderedPaths = /* @__PURE__ */ new Set();
    if (limitHeight) {
      list.addClass("is-limited");
      this.fileListEl = list;
      this.cachedPrefix = prefix;
      this.completedFilesRenderKey = renderState.key;
    }
    for (let i = files.length - 1; i >= 0; i--) {
      if (limitHeight && renderedPaths.has(files[i].path)) continue;
      renderedPaths.add(files[i].path);
      renderFileRow(files[i], list, prefix, t);
    }
  }
  renderPlanReviewSection(container, counts, items, conflicts, pendingDeletes) {
    const t = this.plugin.i18n.t.bind(this.plugin.i18n);
    const panel = this.createSection(container, t("syncPlan.sectionTitle"));
    if (counts && items.length === 0) {
      const rows = [
        [t("syncView.fileStatus.upload"), counts.uploads],
        [t("syncView.fileStatus.download"), counts.downloads],
        [t("syncView.fileStatus.delete"), counts.deletes],
        [t("syncView.fileStatus.conflict"), counts.conflicts],
        [t("syncView.fileStatus.skip"), counts.skipped]
      ];
      panel.createDiv("easy-sync-plan-counts").setText(
        rows.filter(([, count]) => count > 0).map(([label, count]) => `${label} ${count}`).join(" \xB7 ")
      );
    }
    if (items.length > 0) {
      this.renderPlanGroups(panel, items, conflicts, pendingDeletes);
    } else if (!counts || Object.values(counts).every((count) => count === 0)) {
      panel.createDiv("easy-sync-empty-state").setText(t("syncPlan.noChanges"));
    } else {
      panel.createDiv("easy-sync-empty-state").setText(t("syncPlan.detailsUnavailable"));
    }
    const actions = panel.createDiv("easy-sync-plan-execute");
    new import_obsidian13.ButtonComponent(actions).setButtonText(t("syncPlan.recalculate")).onClick(() => {
      void this.plugin.rebuildPlanReview();
    });
    new import_obsidian13.ButtonComponent(actions).setButtonText(t("syncPlan.confirmExecute")).setCta().setDisabled(this.plugin.syncExecutor?.isRunning ?? false).onClick(() => {
      void this.plugin.executePlanReview();
    });
  }
  renderPlanGroups(container, items, conflicts, pendingDeletes) {
    const t = this.plugin.i18n.t.bind(this.plugin.i18n);
    const conflictByPath = new Map(conflicts.map((item) => [item.path, item]));
    const deleteByPath = new Map(pendingDeletes.map((item) => [item.path, item]));
    const groups = [
      { label: t("syncView.fileStatus.upload"), items: items.filter((item) => item.type === "upload" /* Upload */ || item.type === "renameRemote" /* RenameRemote */), open: false },
      { label: t("syncView.fileStatus.download"), items: items.filter((item) => item.type === "download" /* Download */), open: true },
      { label: t("syncView.fileStatus.conflict"), items: items.filter((item) => item.type === "conflict" /* Conflict */), open: true },
      { label: t("syncView.fileStatus.delete"), items: items.filter((item) => item.type === "deleteRemote" /* DeleteRemote */ || item.type === "deleteLocal" /* DeleteLocal */ || item.type === "confirmLocalDelete" /* ConfirmLocalDelete */), open: true },
      { label: t("syncView.fileStatus.skip"), items: items.filter((item) => item.type === "skipLargeFile" /* SkipLargeFile */ || item.type === "skipIgnoredPath" /* SkipIgnoredPath */ || item.type === "retryLater" /* RetryLater */), open: false }
    ].filter((group) => group.items.length > 0);
    for (const group of groups) {
      const body = this.createTreeGroup(container, group.label, group.items.length, group.open);
      for (const item of group.items) {
        if (item.type === "conflict" /* Conflict */ && conflictByPath.has(item.path)) {
          this.renderConflictItem(body, conflictByPath.get(item.path));
        } else if (item.type === "confirmLocalDelete" /* ConfirmLocalDelete */ && deleteByPath.has(item.path)) {
          this.renderDeleteItem(body, deleteByPath.get(item.path));
        } else {
          const row = body.createDiv("easy-sync-file-row");
          const icon = row.createSpan("easy-sync-file-icon");
          (0, import_obsidian13.setIcon)(icon, ISSUE_ACTION_ICONS[item.type] ?? "file");
          row.createSpan("easy-sync-file-path").setText(item.path);
          if (item.reason) {
            row.createDiv("easy-sync-file-reason").setText(t(item.reason));
          }
        }
      }
    }
  }
  renderConflictItem(container, item) {
    const t = this.plugin.i18n.t.bind(this.plugin.i18n);
    const details = container.createEl("details", "easy-sync-tree-item");
    const summary = details.createEl("summary", "easy-sync-tree-row");
    this.addCollapseIcon(summary);
    const icon = summary.createSpan("easy-sync-tree-status-icon");
    (0, import_obsidian13.setIcon)(icon, "triangle-alert");
    summary.createSpan("easy-sync-tree-path").setText(item.path);
    summary.createSpan("easy-sync-tree-chip").setText(t("syncView.fileStatus.conflict"));
    const body = details.createDiv("easy-sync-tree-item-body");
    body.createDiv("easy-sync-item-reason").setText(
      item.reason ? t(item.reason) : t("syncView.conflict.defaultReason")
    );
    if (item.local || item.remote) {
      if (item.local) {
        body.createDiv("easy-sync-conflict-meta").setText(
          `${t("conflictDetail.localLabel")}\uFF1A${item.local.mtime ? new Date(item.local.mtime).toLocaleString() : "-"} (${item.local.size != null ? formatSize2(item.local.size) : "-"})`
        );
      }
      if (item.remote) {
        body.createDiv("easy-sync-conflict-meta").setText(
          `${t("conflictDetail.remoteLabel")}\uFF1A${item.remote.mtime ? new Date(item.remote.mtime).toLocaleString() : "-"} (${item.remote.size != null ? formatSize2(item.remote.size) : "-"})`
        );
      }
    }
    const actions = body.createDiv("easy-sync-item-actions");
    this.createActionChip(actions, t("syncView.conflict.keepLocal"), "accent", () => {
      void this.runItemAction(actions, () => this.plugin.resolveConflictKeepLocal(item.path));
    });
    this.createActionChip(actions, t("syncView.conflict.keepRemote"), "accent", () => {
      void this.runItemAction(actions, () => this.plugin.resolveConflictKeepRemote(item.path));
    });
    this.createActionChip(actions, t("syncView.conflict.viewDetail"), "", () => {
      const modal = new ConflictDetailModal(this.plugin, item);
      modal.setOnResolved(() => {
        this.plugin.updateStatusBar();
        this.render();
      });
      modal.open();
    });
  }
  renderDeleteItem(container, item) {
    const t = this.plugin.i18n.t.bind(this.plugin.i18n);
    const details = container.createEl("details", "easy-sync-tree-item");
    const summary = details.createEl("summary", "easy-sync-tree-row");
    this.addCollapseIcon(summary);
    const icon = summary.createSpan("easy-sync-tree-status-icon");
    (0, import_obsidian13.setIcon)(icon, "trash-2");
    summary.createSpan("easy-sync-tree-path").setText(item.path);
    summary.createSpan("easy-sync-tree-chip").setText(t("syncView.issues.awaitingConfirmation"));
    const body = details.createDiv("easy-sync-tree-item-body");
    body.createDiv("easy-sync-item-reason").setText(t("syncView.delete.reason"));
    const actions = body.createDiv("easy-sync-item-actions");
    this.createActionChip(actions, t("syncView.delete.confirm"), "warning", () => {
      void this.runItemAction(actions, () => this.plugin.confirmRemoteDelete(item.path));
    });
    this.createActionChip(actions, t("syncView.delete.reject"), "", () => {
      void this.runItemAction(actions, () => this.plugin.rejectRemoteDelete(item.path));
    });
  }
  createSection(container, title) {
    const section = container.createDiv("easy-sync-section");
    section.createEl("h4", { cls: "easy-sync-section-title", text: title });
    return section.createDiv("easy-sync-section-body easy-sync-section-content");
  }
  createTreeGroup(container, title, count, open) {
    const details = container.createEl("details", "easy-sync-tree-item");
    details.open = open;
    const summary = details.createEl("summary", "easy-sync-tree-row");
    this.addCollapseIcon(summary);
    summary.createSpan("easy-sync-tree-label").setText(title);
    summary.createSpan("easy-sync-tree-count").setText(String(count));
    return details.createDiv("easy-sync-tree-group-body");
  }
  addCollapseIcon(container) {
    const icon = container.createSpan("easy-sync-collapse-icon");
    (0, import_obsidian13.setIcon)(icon, "chevron-right");
  }
  createActionChip(container, text, variant, onClick) {
    const chip = container.createEl("button", {
      cls: `easy-sync-action-chip${variant ? ` is-${variant}` : ""}`,
      attr: { type: "button" },
      text
    });
    chip.addEventListener("click", onClick);
    return chip;
  }
  disableActionButtons(actionsEl) {
    for (const button of Array.from(actionsEl.querySelectorAll("button"))) {
      button.disabled = true;
    }
  }
  formatHistoryCounts(entry) {
    const t = this.plugin.i18n.t.bind(this.plugin.i18n);
    const values = [
      [t("syncView.fileStatus.upload"), entry.uploaded],
      [t("syncView.fileStatus.download"), entry.downloaded],
      [t("syncView.fileStatus.delete"), entry.deleted],
      [t("syncView.fileStatus.conflict"), entry.conflicts],
      [t("syncView.fileStatus.deferred"), entry.deferred ?? 0],
      [t("syncView.fileStatus.skip"), entry.skipped],
      [t("syncView.fileStatus.error"), entry.errors]
    ];
    return values.filter(([, count]) => count > 0).map(([label, count]) => `${label} ${count}`).join(" \xB7 ");
  }
  async runItemAction(actionsEl, action) {
    this.disableActionButtons(actionsEl);
    try {
      await action();
    } finally {
      this.plugin.updateStatusBar();
      this.render();
    }
  }
};
function formatSize2(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// src/i18n/en.ts
var en = {
  // ---- Status Bar ----
  "status.notLoggedIn": "EasySync: Not logged in",
  "status.connecting": "EasySync: Connecting\u2026",
  "status.syncing": "EasySync: Syncing\u2026",
  "status.conflicts": "{count} conflict(s)",
  "status.pendingDeletes": "{count} pending delete(s)",
  "status.conflictsAndDeletes": "{conflicts} conflict(s), {deletes} pending delete(s)",
  "status.lastSync": "EasySync: Last sync {time}",
  "status.ready": "EasySync: Ready",
  // ---- Ribbon ----
  "ribbon.loggedOut": "Not logged in; open EasySync settings",
  "ribbon.cancelling": "Cancelling; open sync status",
  "ribbon.syncing": "Syncing; open sync status",
  "ribbon.syncingPhase": "{phase}; open sync status",
  "ribbon.attention": "Sync needs attention; open sync status",
  "ribbon.success": "Sync completed; open sync status",
  "ribbon.ready": "Sync now",
  // ---- Settings Groups ----
  "settings.group.sync": "Sync",
  "settings.group.maintenance": "Maintenance",
  "settings.group.about": "About",
  // ---- Settings ----
  "settings.account.name": "OneDrive account",
  "settings.account.desc.loggedIn": "Logged in as {name}",
  "settings.account.desc.notLoggedIn": "Not logged in",
  "settings.account.desc.connecting": "Verifying identity\u2026",
  "settings.account.login": "Log in with OneDrive",
  "settings.account.checking": "Checking login status\u2026",
  "settings.account.desc.pending": "Waiting for sign-in \u2014 continue in your browser\u2026",
  "settings.account.pendingTitle": "Sign-in not complete",
  "settings.account.pendingMessage": "Complete Microsoft sign-in in your browser. If the sign-in page did not open, go to Obsidian Settings \u2192 Core plugins \u2192 Web viewer, turn off \u201COpen external links\u201D, then select \u201CReopen sign-in page\u201D.",
  "settings.account.recheck": "Check again",
  "settings.account.reopenAuth": "Reopen sign-in page",
  "settings.account.loginSuccess": "Login successful",
  "settings.account.logout": "Log out",
  "settings.firstSync.name": "Sync now",
  "settings.firstSync.desc": "The first run shows a preview. Later runs sync the current state directly.",
  "settings.firstSync.start": "Start sync",
  "settings.firstSync.sync": "Sync",
  "settings.syncScope.name": "Sync scope",
  "settings.syncScope.desc": "Choose which Obsidian settings, themes, and plugin files sync with your vault files.",
  "settings.syncScope.button": "Configure",
  "settings.syncScope.title": "Sync scope",
  "settings.syncExclusion.name": "Sync exclusions",
  "settings.syncExclusion.desc": "Choose folders this device will not sync.",
  "settings.syncExclusion.button": "Configure",
  "settings.syncExclusion.title": "Sync exclusions",
  "settings.syncExclusion.intro": "Only affects this device. Selected folders and their contents will not be uploaded or downloaded, and existing files will not be deleted.",
  "settings.syncExclusion.folders.name": "Folders not synced",
  "settings.syncExclusion.add": "Add",
  "settings.syncExclusion.empty": "No folders added",
  "settings.syncExclusion.removeFolder": "Remove {path} from exclusions",
  "settings.syncExclusion.pickerPlaceholder": "Choose a folder not to sync",
  "settings.syncPluginFiles.name": "EasySync self-sync",
  "settings.syncPluginFiles.desc": "Keep EasySync's own plugin files in sync so updates propagate to other devices automatically.",
  "settings.syncEditor.name": "Editor settings",
  "settings.syncEditor.desc": "Sync default view mode, line numbers, indent size, and other editor preferences (app.json).",
  "settings.syncAppearance.name": "Appearance settings",
  "settings.syncAppearance.desc": "Sync base theme, dark mode, font size, and other appearance preferences (appearance.json).",
  "settings.syncThemes.name": "Themes & snippets",
  "settings.syncThemes.desc": "Sync community theme CSS files and custom CSS snippets (themes/ and snippets/ directories).",
  "settings.syncHotkeys.name": "Hotkeys",
  "settings.syncHotkeys.desc": "Sync custom keyboard shortcuts (hotkeys.json).",
  "settings.syncCorePlugins.name": "Core plugins",
  "settings.syncCorePlugins.desc": "Sync which built-in plugins are enabled (core-plugins.json). Core plugins are part of Obsidian and have no separate code files.",
  "settings.syncCommunityPlugins.name": "Community plugins",
  "settings.syncCommunityPlugins.desc": 'Sync community plugin code and enabled list (community-plugins.json, main.js, styles.css, manifest.json). Plugin data.json files are NOT included \u2014 enable "Plugin data" separately if needed.',
  "settings.syncPluginData.name": "Community plugin data",
  "settings.syncPluginData.desc": "Sync each plugin's settings data (data.json). Some plugins write to it frequently; enable only if needed.",
  "settings.autoSync.name": "Auto sync",
  "settings.autoSync.desc.disabled": "Auto sync is disabled, sync manually only",
  "settings.autoSync.desc.enabled": "Auto sync at configured interval",
  "settings.autoSync.desc.paused": "Auto sync paused after an incomplete run. Retry manually to resume.",
  "settings.automaticHandling.button": "Configure",
  "settings.automaticHandling.open": "Configure automatic handling",
  "settings.automaticHandling.name": "Automatic handling",
  "settings.automaticHandling.desc": "Choose which actions may run automatically during sync.",
  "settings.automaticHandling.title": "Automatic handling",
  "settings.automaticHandling.intro": "Changes take effect from the next sync and do not modify files immediately.",
  "settings.automaticHandling.autoDeleteLocalFiles.name": "Apply remote deletions locally",
  "settings.automaticHandling.autoDeleteLocalFiles.desc": "When a remote file has been deleted and the local version has not changed since the last sync, delete the corresponding local file. EasySync does not keep an extra copy.",
  "settings.automaticHandling.mergeNonOverlappingText.name": "Merge non-overlapping text changes",
  "settings.automaticHandling.mergeNonOverlappingText.desc": "When local and remote make non-overlapping changes to the same synced text, combine both changes and sync the result to both sides. If the changes cannot be merged safely, leave them for manual handling.",
  "settings.diagLog.name": "Diagnostic logging",
  "settings.diagLog.desc": "Write sync process details to the developer console and local log files (stored in the plugin directory, not synced). When disabled, only errors are recorded.",
  "settings.diagReport.name": "Diagnostic report",
  "settings.diagReport.desc": "Generate a snapshot report of recent anomalies and sync status as a Markdown file in the vault root.",
  "settings.diagReport.generate": "Generate report",
  "settings.syncInterval.name": "Sync interval",
  "settings.syncInterval.desc": "{minutes} minutes",
  "settings.maxFileSize.name": "Max file size",
  "settings.maxFileSize.desc": "Files larger than {size} will not be synced. Large files use more memory and data.",
  "settings.reset.name": "Reset sync state",
  "settings.reset.desc": "Clear all sync history, baselines, and pending conflicts. Files are not deleted.",
  "settings.reset.button": "Reset",
  "settings.reset.confirmTitle": "Reset sync state",
  "settings.reset.confirmMessage": "This clears sync history, baselines, and pending items for the current vault.",
  "settings.reset.confirmWarning": "Files are not deleted, but the next sync will be treated like a fresh state check.",
  "settings.reset.confirm": "Reset",
  "settings.reset.done": "Sync state reset",
  "settings.about.product.name": "EasySync",
  "settings.about.product.desc": "Version {version}",
  "settings.about.author.name": "Author",
  "settings.about.author.desc": "Jiao Yingxing. If you run into a problem, open an issue on GitHub or contact the author on Xiaohongshu.",
  "settings.about.contact.github": "GitHub",
  "settings.about.contact.xiaohongshu": "Xiaohongshu",
  "settings.about.usage.name": "Usage tips",
  "settings.about.usage.desc": "Do not let the OneDrive desktop app, iCloud, Dropbox, Syncthing, or another sync tool manage the same local vault. The first sync, or a sync with many files, may take longer; progress is available in the sidebar.",
  "settings.about.disclaimer.name": "Data safety",
  "settings.about.disclaimer.desc": "During sync, EasySync may upload, download, or delete files locally and in OneDrive. Keep an independent backup of important content; sync is not a backup.",
  // ---- Sync View ----
  "syncView.title": "EasySync",
  "syncView.lastSync": "Last sync: {time}",
  "syncView.never": "Not synced yet",
  "syncView.progress": "Sync in progress\u2026",
  "syncView.conflict.keepLocal": "Keep local",
  "syncView.conflict.keepRemote": "Keep remote",
  "syncView.conflict.skip": "Skip",
  "syncView.conflict.defaultReason": "Conflict",
  "syncView.delete.confirm": "Delete local file",
  "syncView.delete.confirmAll": "Delete all {count} local files",
  "syncView.delete.confirmAllTitle": "Delete {count} local files?",
  "syncView.delete.confirmAllMessage": "These files were deleted remotely. Continuing will also delete the local copies.",
  "syncView.delete.confirmAllWarning": "EasySync does not keep extra copies. Confirm that these files are backed up or no longer needed.",
  "syncView.delete.reject": "Keep file & re-upload",
  "syncView.delete.reason": "Deleted remotely",
  // ---- Commands ----
  "command.syncNow": "Sync now",
  "command.showDetail": "Open sync sidebar",
  // ---- Sync Progress ----
  "progress.scanningLocal": "Scanning local files\u2026",
  "progress.preparingRemote": "Preparing remote storage\u2026",
  "progress.checkingRemote": "Checking remote changes\u2026",
  "progress.loadingBaseline": "Loading cloud baseline\u2026",
  "progress.generatingPlan": "Generating sync plan\u2026",
  "progress.verifyingFiles": "Verifying file consistency ({current}/{total})",
  // ---- Sync Results ----
  "result.synced": "Synced: {uploaded} up, {downloaded} down, {deleted} del, {conflicts} conflicts",
  "result.partial": "Partially synced: {uploaded} up, {downloaded} down, {deleted} del, {conflicts} conflicts, {errors} failed",
  "result.deferred": "{deferred} file(s) changed again before transfer and were deferred to the next run",
  "result.firstSyncCancelled": "First sync cancelled",
  "result.thresholdDeclined": "Sync paused: too many changes detected, confirmation required",
  "result.authExpired": "Login expired, sync interrupted",
  "result.syncFailed": "Sync failed: {message}",
  "result.alreadyRunning": "Sync already in progress",
  "result.cancelled": "Sync cancelled",
  "result.generationMismatch": "Sync aborted \u2014 state changed during run.",
  "result.lockBusy": "Another operation is in progress. Please wait.",
  "result.scanIncomplete": "Sync stopped because some local files or folders could not be read. No sync changes were made.",
  "result.localRecoveryFailed": "Sync stopped because an interrupted local write could not be recovered safely. No remote or sync-state changes were made.",
  "result.legacyStateDisabled": "Sync state has been upgraded. Legacy sync writes are disabled to prevent state corruption.",
  // ---- Sync Lifecycle Notices ----
  "notice.sync.start": "\u2601\uFE0F Starting sync",
  "notice.sync.stage": "\u2601\uFE0F {stage}",
  "notice.sync.progress": "\u2601\uFE0F Syncing {current}/{total}",
  "notice.sync.cancelling": "\u26D4 Cancelling sync\u2026",
  "notice.sync.completed": "\u2705 Sync complete",
  "notice.sync.conflicts": "\u26A0\uFE0F Conflicts found: {count}",
  "notice.sync.review": "\u26A0\uFE0F Sync awaiting confirmation",
  "notice.sync.cancelled": "\u26D4 Sync cancelled",
  "notice.sync.failed": "\u274C Sync failed",
  "notice.sync.authExpired": "\u2B55 Login expired",
  "notice.accountMismatch": "Account mismatch: this vault is bound to {bound}, but the current account is {current}. Reset sync state before switching accounts.",
  "notice.diagnosticReportGenerated": "Diagnostic report created: {fileName}",
  "notice.syncPathSettings.busy": "A sync is in progress. Change the sync scope after it finishes.",
  "notice.syncPathSettings.recovery": "A file operation still needs recovery. Finish recovery before changing the sync scope.",
  "notice.syncPathSettings.failed": "The sync scope was not saved. Try again.",
  // ---- Sync Plan Reasons ----
  "reason.fileExceedsSizeLimit": "File exceeds size limit",
  "reason.newFileBothSides": "This file exists locally and remotely.",
  "reason.localDeletedRemoteModified": "Deleted locally but modified remotely",
  "reason.fileDeletedLocally": "Deleted locally",
  "reason.remoteDeletedLocalModified": "Deleted remotely but modified locally",
  "reason.fileDeletedFromRemote": "Deleted remotely",
  "reason.bothSidesModified": "Modified on both sides",
  "reason.renameIdentityAmbiguous": "Possible rename or copy could not be identified safely; the original was preserved",
  "reason.scanUnhealthy": "Local scan incomplete, skipped this round",
  // ---- Auth Errors ----
  "auth.error.clientNotConfigured": "OneDrive client ID not configured. Register a Microsoft Entra application and set clientId.",
  "auth.error.stateMismatch": "OAuth state mismatch \u2014 please try logging in again.",
  "auth.error.providerError": "Microsoft sign-in error: {details}",
  "auth.error.noCode": "No authorization code received from Microsoft.",
  "auth.error.noRefreshToken": "No refresh token available \u2014 please log in again.",
  "auth.error.notLoggedIn": "Not logged in \u2014 please log in with OneDrive first.",
  "auth.error.networkError": "Network error during authentication: {details}",
  "auth.error.secretStorageUnavailable": "Secure storage not available on this device.",
  "auth.error.refreshFailed": "Token refresh failed. Please log in again.",
  // ---- General ----
  "general.unknown": "Unknown",
  "general.notYetImplemented": "This feature is not yet available.",
  "notice.conflict.keptLocal": "Kept local version: {path}",
  "notice.conflict.keptRemote": "Kept remote version: {path}",
  "notice.conflict.failed": "Failed to resolve: {reason}",
  "notice.conflict.downloadFailed": "The remote version could not be downloaded, so nothing was changed. Try again later; if it keeps failing, check your network and sign-in.",
  "notice.conflict.identical": "Local and remote content are identical. Removed the false conflict: {path}",
  "notice.localChangedSinceReview": "The local file changed after you reviewed it. Review the latest version and try again.",
  "notice.localRecoveryFailed": "Sync stopped because an interrupted local write could not be recovered safely. Your sync state was not advanced.",
  "notice.sideActionRemotePrepareFailed": "Could not connect to or verify the remote vault. Check your network and sign-in, then try again.",
  "notice.sideActionScopeChanged": "The remote vault identity changed. Sync again and review the current versions before choosing an action.",
  "notice.sideActionMutationRecoveryFailed": "The result of the previous file operation could not be verified automatically. Sync again before choosing another action.",
  "notice.configSyncDisabled": "This configuration item is no longer being synced. The old pending decision was removed.",
  "notice.configSnapshotInvalid": "Obsidian is still updating this configuration file. Wait a moment, then try again.",
  "notice.decisionExpired": "This pending item is outdated. Sync again to review the current versions.",
  "notice.delete.confirmed": "Deleted local file: {path}",
  "notice.delete.rejected": "Kept and re-uploaded: {path}",
  "notice.delete.failed": "Failed: {reason}",
  // ---- Conflict Detail Modal ----
  "conflictDetail.title": "Conflict: {path}",
  "conflictDetail.modifiedTime": "Modified",
  "conflictDetail.fileSize": "Size",
  "conflictDetail.localLabel": "Local",
  "conflictDetail.remoteLabel": "Remote",
  "conflictDetail.newer": "(newer)",
  "conflictDetail.larger": "(larger)",
  "conflictDetail.localPreview": "Local file content",
  "conflictDetail.diffTitle": "Diff",
  "conflictDetail.diffAdded": "+{count} lines",
  "conflictDetail.diffRemoved": "-{count} lines",
  "conflictDetail.summaryComparing": "The local and remote versions differ. Comparing their current content\u2026",
  "conflictDetail.summaryComparisonUnavailable": "The specific content differences between the local and remote versions are temporarily unavailable.",
  "conflictDetail.summaryLocalExtra": "The local version has {count} more line(s) than the remote version.",
  "conflictDetail.summaryRemoteExtra": "The remote version has {count} more line(s) than the local version.",
  "conflictDetail.summaryBothModified": "Both the local and remote versions have been modified.",
  "conflictDetail.summaryBothExistDifferent": "This file exists locally and remotely, but the contents differ.",
  "conflictDetail.summaryDifferent": "The local and remote content differs.",
  "conflictDetail.summaryBytesDifferentNoLineDiff": "The local and remote file bytes differ, but there is no displayable line-level difference.",
  "conflictDetail.remoteComparisonUnavailable": "The remote content could not be fetched or compared. Showing the local version only.",
  "conflictDetail.loading": "Loading\u2026",
  "conflictDetail.fetchingRemote": "Fetching remote content\u2026",
  "conflictDetail.computingDiff": "Computing diff\u2026",
  "conflictDetail.localReadUnavailable": "The local file could not be read, so its content cannot be compared right now.",
  "conflictDetail.loadUnavailable": "The conflict details could not be loaded. Close this window and try again.",
  "conflictDetail.binaryFile": "Binary file \u2014 content preview not available.",
  "conflictDetail.diffRegionsLocated": "{count} changed region(s) located",
  "conflictDetail.diffChangeBudget": "This changed region contains many added or removed lines. Its range and counts are exact; only the beginning and end are shown.",
  "conflictDetail.diffAlignmentLimit": "This region is too repetitive or too extensively changed to align reliably line by line. EasySync shows bounded samples instead of reporting the whole file as removed and added.",
  "conflictDetail.diffDisplayBudget": "This file contains too many separate changed regions. EasySync stopped creating more windows to keep the detail view responsive; the visible windows are the differences located so far.",
  "conflictDetail.diffRegionRange": "Local lines {localRange}; remote lines {remoteRange}",
  "conflictDetail.diffOmitted": "\u2026 {localCount} local line(s) and {remoteCount} remote line(s) omitted",
  "conflictDetail.textDiffByteLimit": "Text comparison is limited to {limit} per side to keep Obsidian responsive. This file exceeds that limit; use an external diff tool for the full content.",
  "conflictDetail.previewTruncated": "Large preview: showing the first {shown} of {total} lines.",
  "conflictDetail.identical": "The actual local and remote content is identical. This is not a real conflict, and EasySync is removing it safely.",
  "conflictDetail.textSameBytesDifferent": "The text looks identical, but the file bytes differ (often due to encoding or invisible characters). EasySync keeps treating this as a real difference to avoid an unsafe overwrite.",
  // ---- Sync View extras ----
  "syncView.merge.autoMerged": "Auto-merged: {path}",
  "syncView.conflict.viewDetail": "View details",
  "syncView.conflict.processing": "Processing\u2026",
  // ---- Confirm Modal ----
  "confirm.firstSyncTitle": "First sync preview",
  "confirm.thresholdTitle": "Change threshold exceeded",
  "confirm.confirm": "Confirm",
  "confirm.cancel": "Cancel",
  "confirm.deleteWarning": "Contains {count} delete operation(s). Please confirm.",
  // ---- Sync Plan Alert & Review ----
  "syncPlan.readyTitle": "Sync plan ready",
  "syncPlan.readyMessage": "Your sync plan is ready. Review the details in the sidebar before proceeding.",
  "syncPlan.viewButton": "View plan",
  "syncPlan.sectionTitle": "Sync plan",
  "syncPlan.confirmExecute": "Confirm & execute",
  "syncPlan.recalculate": "Recalculate",
  "syncPlan.detailsUnavailable": "This plan only contains counts. Recalculate to view file details.",
  "syncPlan.noChanges": "No file changes need to be executed.",
  // ---- Status Bar ----
  "status.planReview": "EasySync: Plan needs review",
  // ---- Sync Results ----
  "result.pausedForReview": "Sync paused \u2014 plan available for review in sidebar",
  // ---- Sync Progress Display ----
  "syncView.fileStatus.upload": "Upload",
  "syncView.fileStatus.download": "Download",
  "syncView.fileStatus.delete": "Delete",
  "syncView.fileStatus.conflict": "Conflict",
  "syncView.fileStatus.skip": "Skip",
  "syncView.fileStatus.deferred": "The file changed again before transfer and was deferred to the next run",
  "syncView.fileStatus.error": "Error",
  "syncView.progress.current": "Current",
  "syncView.progress.items": "{current}/{total} items",
  "syncView.progress.completed": "Completed ({count})",
  "syncView.cancelSync": "Cancel sync",
  "syncView.cancelling": "Cancelling\u2026",
  "syncView.active.upload": "Uploading\u2026",
  "syncView.active.download": "Downloading\u2026",
  "syncView.active.delete": "Deleting\u2026",
  "syncView.active.rename": "Updating remote file\u2026",
  "syncView.failure.contentUnavailable": "Remote content unavailable",
  "syncView.failure.network": "Network request failed",
  "syncView.failure.rateLimited": "Rate limited by OneDrive",
  "syncView.failure.storageFull": "OneDrive storage is full",
  "syncView.failure.authExpired": "Login expired",
  "syncView.failure.remote": "Remote request failed",
  "syncView.failure.local": "Local file operation failed",
  "syncView.status.synced": "Synced",
  "syncView.issues.title": "Needs attention {count}",
  "syncView.issues.notSynced": "Not synced",
  "syncView.issues.lastAttempt": "Last attempt: {time}",
  "syncView.issues.openFile": "Open file",
  "syncView.issues.retry": "Sync again",
  "syncView.issues.awaitingConfirmation": "Awaiting confirmation",
  "syncView.collapseAll": "Collapse all",
  "syncView.expandAll": "Expand all",
  "syncView.history.title": "Sync history",
  "syncView.openSettings": "Open EasySync settings",
  "syncView.history.empty": "No sync history yet.",
  "syncView.history.omitted": "Details for {count} additional successful file(s) were not retained.",
  "syncView.history.status.success": "Completed",
  "syncView.history.status.partial": "Partially completed",
  "syncView.history.status.cancelled": "Cancelled",
  "syncView.history.status.authExpired": "Login expired",
  "syncView.history.status.failed": "Failed",
  "syncView.history.mode.manual": "Manual",
  "syncView.history.mode.auto": "Auto",
  "syncView.history.mode.first": "First sync",
  "syncView.history.duration": "Duration {seconds}s"
};
var en_default = en;

// src/i18n/zh-cn.ts
var zhCN = {
  // ---- 状态栏 ----
  "status.notLoggedIn": "EasySync: \u672A\u767B\u5F55",
  "status.connecting": "EasySync: \u8FDE\u63A5\u4E2D\u2026",
  "status.syncing": "EasySync: \u540C\u6B65\u4E2D\u2026",
  "status.conflicts": "{count} \u9879\u51B2\u7A81",
  "status.pendingDeletes": "{count} \u9879\u5F85\u786E\u8BA4\u5220\u9664",
  "status.conflictsAndDeletes": "{conflicts} \u9879\u51B2\u7A81\uFF0C{deletes} \u9879\u5F85\u786E\u8BA4\u5220\u9664",
  "status.lastSync": "EasySync: \u4E0A\u6B21\u540C\u6B65 {time}",
  "status.ready": "EasySync: \u5DF2\u5C31\u7EEA",
  // ---- Ribbon ----
  "ribbon.loggedOut": "\u672A\u767B\u5F55\uFF0C\u6253\u5F00 EasySync \u8BBE\u7F6E",
  "ribbon.cancelling": "\u6B63\u5728\u53D6\u6D88\uFF0C\u6253\u5F00\u540C\u6B65\u72B6\u6001",
  "ribbon.syncing": "\u6B63\u5728\u540C\u6B65\uFF0C\u6253\u5F00\u540C\u6B65\u72B6\u6001",
  "ribbon.syncingPhase": "{phase}\uFF0C\u6253\u5F00\u540C\u6B65\u72B6\u6001",
  "ribbon.attention": "\u540C\u6B65\u9700\u8981\u5904\u7406\uFF0C\u6253\u5F00\u540C\u6B65\u72B6\u6001",
  "ribbon.success": "\u540C\u6B65\u5DF2\u5B8C\u6210\uFF0C\u6253\u5F00\u540C\u6B65\u72B6\u6001",
  "ribbon.ready": "\u7ACB\u5373\u540C\u6B65",
  // ---- 设置分组 ----
  "settings.group.sync": "\u540C\u6B65",
  "settings.group.maintenance": "\u7EF4\u62A4",
  "settings.group.about": "\u5173\u4E8E",
  // ---- 设置 ----
  "settings.account.name": "OneDrive \u8D26\u53F7",
  "settings.account.desc.loggedIn": "\u5DF2\u767B\u5F55 {name}",
  "settings.account.desc.notLoggedIn": "\u672A\u767B\u5F55",
  "settings.account.desc.connecting": "\u6B63\u5728\u9A8C\u8BC1\u8EAB\u4EFD\u2026",
  "settings.account.login": "\u767B\u5F55 OneDrive",
  "settings.account.checking": "\u68C0\u67E5\u767B\u5F55\u72B6\u6001\u2026",
  "settings.account.desc.pending": "\u7B49\u5F85\u5B8C\u6210\u767B\u5F55\uFF0C\u8BF7\u5728\u6D4F\u89C8\u5668\u4E2D\u7EE7\u7EED\u2026",
  "settings.account.pendingTitle": "\u767B\u5F55\u8FD8\u6CA1\u6709\u5B8C\u6210",
  "settings.account.pendingMessage": "\u8BF7\u5728\u6D4F\u89C8\u5668\u4E2D\u5B8C\u6210 Microsoft \u767B\u5F55\u3002\u6CA1\u6709\u770B\u5230\u767B\u5F55\u9875\u9762\uFF1F\u8BF7\u6253\u5F00 Obsidian \u8BBE\u7F6E \u2192 \u6838\u5FC3\u63D2\u4EF6 \u2192 \u7F51\u9875\u6D4F\u89C8\u5668\uFF0C\u5173\u95ED\u300C\u6253\u5F00\u5916\u90E8\u94FE\u63A5\u300D\uFF0C\u518D\u70B9\u300C\u91CD\u65B0\u6253\u5F00\u767B\u5F55\u9875\u9762\u300D\u3002",
  "settings.account.recheck": "\u518D\u68C0\u67E5\u4E00\u6B21",
  "settings.account.reopenAuth": "\u91CD\u65B0\u6253\u5F00\u767B\u5F55\u9875\u9762",
  "settings.account.loginSuccess": "\u767B\u5F55\u6210\u529F",
  "settings.account.logout": "\u9000\u51FA\u767B\u5F55",
  "settings.firstSync.name": "\u7ACB\u5373\u540C\u6B65",
  "settings.firstSync.desc": "\u9996\u6B21\u4F1A\u5148\u9884\u89C8\u540C\u6B65\u8BA1\u5212\uFF0C\u4E4B\u540E\u6309\u5F53\u524D\u72B6\u6001\u540C\u6B65\u3002",
  "settings.firstSync.start": "\u5F00\u59CB\u540C\u6B65",
  "settings.firstSync.sync": "\u540C\u6B65",
  "settings.syncScope.name": "\u540C\u6B65\u8303\u56F4",
  "settings.syncScope.desc": "\u9009\u62E9\u8981\u4E0E\u4ED3\u5E93\u6587\u4EF6\u4E00\u8D77\u540C\u6B65\u7684 Obsidian \u914D\u7F6E\u3001\u4E3B\u9898\u548C\u63D2\u4EF6\u6587\u4EF6\u3002",
  "settings.syncScope.button": "\u914D\u7F6E",
  "settings.syncScope.title": "\u540C\u6B65\u8303\u56F4",
  "settings.syncExclusion.name": "\u540C\u6B65\u6392\u9664",
  "settings.syncExclusion.desc": "\u9009\u62E9\u6B64\u8BBE\u5907\u4E0D\u53C2\u4E0E\u540C\u6B65\u7684\u6587\u4EF6\u5939\u3002",
  "settings.syncExclusion.button": "\u914D\u7F6E",
  "settings.syncExclusion.title": "\u540C\u6B65\u6392\u9664",
  "settings.syncExclusion.intro": "\u53EA\u5F71\u54CD\u6B64\u8BBE\u5907\u3002\u6240\u9009\u6587\u4EF6\u5939\u53CA\u5176\u5185\u5BB9\u4E0D\u4F1A\u4E0A\u4F20\u6216\u4E0B\u8F7D\uFF0C\u73B0\u6709\u6587\u4EF6\u4E0D\u4F1A\u56E0\u6B64\u88AB\u5220\u9664\u3002",
  "settings.syncExclusion.folders.name": "\u4E0D\u540C\u6B65\u7684\u6587\u4EF6\u5939",
  "settings.syncExclusion.add": "\u6DFB\u52A0",
  "settings.syncExclusion.empty": "\u5C1A\u672A\u6DFB\u52A0\u6587\u4EF6\u5939",
  "settings.syncExclusion.removeFolder": "\u4ECE\u6392\u9664\u5217\u8868\u4E2D\u79FB\u9664 {path}",
  "settings.syncExclusion.pickerPlaceholder": "\u9009\u62E9\u4E0D\u540C\u6B65\u7684\u6587\u4EF6\u5939",
  "settings.syncPluginFiles.name": "EasySync \u81EA\u540C\u6B65",
  "settings.syncPluginFiles.desc": "\u5C06 EasySync \u81EA\u8EAB\u63D2\u4EF6\u6587\u4EF6\u7EB3\u5165\u540C\u6B65\uFF0C\u66F4\u65B0\u81EA\u52A8\u540C\u6B65\u5230\u5176\u4ED6\u8BBE\u5907\u3002",
  "settings.syncEditor.name": "\u7F16\u8F91\u5668\u8BBE\u7F6E",
  "settings.syncEditor.desc": "\u540C\u6B65\u9ED8\u8BA4\u89C6\u56FE\u6A21\u5F0F\u3001\u884C\u53F7\u3001\u7F29\u8FDB\u7B49\u7F16\u8F91\u5668\u504F\u597D\uFF08app.json\uFF09\u3002",
  "settings.syncAppearance.name": "\u5916\u89C2\u8BBE\u7F6E",
  "settings.syncAppearance.desc": "\u540C\u6B65\u57FA\u7840\u4E3B\u9898\u3001\u6DF1\u8272\u6A21\u5F0F\u3001\u5B57\u4F53\u5927\u5C0F\u7B49\u5916\u89C2\u504F\u597D\uFF08appearance.json\uFF09\u3002",
  "settings.syncThemes.name": "\u4E3B\u9898\u4E0E\u4EE3\u7801\u7247\u6BB5",
  "settings.syncThemes.desc": "\u540C\u6B65\u7B2C\u4E09\u65B9\u4E3B\u9898\u6587\u4EF6\u548C\u81EA\u5B9A\u4E49 CSS \u4EE3\u7801\u7247\u6BB5\uFF08themes/ \u548C snippets/ \u76EE\u5F55\uFF09\u3002",
  "settings.syncHotkeys.name": "\u5FEB\u6377\u952E",
  "settings.syncHotkeys.desc": "\u540C\u6B65\u81EA\u5B9A\u4E49\u5FEB\u6377\u952E\uFF08hotkeys.json\uFF09\u3002",
  "settings.syncCorePlugins.name": "\u6838\u5FC3\u63D2\u4EF6",
  "settings.syncCorePlugins.desc": "\u540C\u6B65\u5185\u7F6E\u63D2\u4EF6\u7684\u542F\u7528\u72B6\u6001\uFF08core-plugins.json\uFF09\u3002\u6838\u5FC3\u63D2\u4EF6\u662F Obsidian \u81EA\u5E26\u7684\uFF0C\u65E0\u72EC\u7ACB\u4EE3\u7801\u6587\u4EF6\u3002",
  "settings.syncCommunityPlugins.name": "\u793E\u533A\u63D2\u4EF6",
  "settings.syncCommunityPlugins.desc": "\u540C\u6B65\u793E\u533A\u63D2\u4EF6\u4EE3\u7801\u53CA\u542F\u7528\u5217\u8868\uFF08community-plugins.json\u3001main.js\u3001styles.css\u3001manifest.json\uFF09\u3002\u4E0D\u542B data.json\uFF0C\u5982\u9700\u540C\u6B65\u8BF7\u5355\u72EC\u5F00\u542F\u300C\u793E\u533A\u63D2\u4EF6\u6570\u636E\u300D\u3002",
  "settings.syncPluginData.name": "\u793E\u533A\u63D2\u4EF6\u6570\u636E",
  "settings.syncPluginData.desc": "\u540C\u6B65\u5404\u63D2\u4EF6\u7684\u8BBE\u7F6E\u6570\u636E\uFF08data.json\uFF09\u3002\u90E8\u5206\u63D2\u4EF6\u5199\u5165\u8F83\u9891\u7E41\uFF0C\u5EFA\u8BAE\u6309\u9700\u5F00\u542F\u3002",
  "settings.autoSync.name": "\u81EA\u52A8\u540C\u6B65",
  "settings.autoSync.desc.disabled": "\u81EA\u52A8\u540C\u6B65\u5DF2\u5173\u95ED\uFF0C\u4EC5\u53EF\u624B\u52A8\u540C\u6B65",
  "settings.autoSync.desc.enabled": "\u6309\u8BBE\u5B9A\u95F4\u9694\u81EA\u52A8\u540C\u6B65",
  "settings.autoSync.desc.paused": "\u4E0A\u6B21\u540C\u6B65\u672A\u5B8C\u6210\uFF0C\u81EA\u52A8\u540C\u6B65\u5DF2\u6682\u505C\uFF0C\u8BF7\u624B\u52A8\u91CD\u8BD5",
  "settings.automaticHandling.button": "\u914D\u7F6E",
  "settings.automaticHandling.open": "\u914D\u7F6E\u81EA\u52A8\u5904\u7406",
  "settings.automaticHandling.name": "\u81EA\u52A8\u5904\u7406",
  "settings.automaticHandling.desc": "\u9009\u62E9\u540C\u6B65\u65F6\u53EF\u81EA\u52A8\u5B8C\u6210\u7684\u64CD\u4F5C\u3002",
  "settings.automaticHandling.title": "\u81EA\u52A8\u5904\u7406",
  "settings.automaticHandling.intro": "\u9009\u9879\u4ECE\u4E0B\u4E00\u6B21\u540C\u6B65\u8D77\u751F\u6548\uFF0C\u4E0D\u4F1A\u7ACB\u5373\u6539\u52A8\u6587\u4EF6\u3002",
  "settings.automaticHandling.autoDeleteLocalFiles.name": "\u5C06\u8FDC\u7AEF\u5220\u9664\u540C\u6B65\u5230\u672C\u5730",
  "settings.automaticHandling.autoDeleteLocalFiles.desc": "\u8FDC\u7AEF\u6587\u4EF6\u5DF2\u5220\u9664\u4E14\u672C\u5730\u81EA\u4E0A\u6B21\u540C\u6B65\u540E\u672A\u4FEE\u6539\u65F6\uFF0C\u5220\u9664\u672C\u5730\u5BF9\u5E94\u6587\u4EF6\u3002EasySync \u4E0D\u4FDD\u7559\u989D\u5916\u526F\u672C\u3002",
  "settings.automaticHandling.mergeNonOverlappingText.name": "\u5408\u5E76\u4E0D\u91CD\u53E0\u7684\u6587\u672C\u4FEE\u6539",
  "settings.automaticHandling.mergeNonOverlappingText.desc": "\u672C\u5730\u548C\u8FDC\u7AEF\u4FEE\u6539\u540C\u4E00\u4EFD\u5DF2\u540C\u6B65\u6587\u672C\u3001\u4E14\u4FEE\u6539\u5185\u5BB9\u4E92\u4E0D\u91CD\u53E0\u65F6\uFF0C\u5C06\u4E24\u8FB9\u4FEE\u6539\u5408\u5E76\u5E76\u540C\u6B65\u5230\u4E24\u7AEF\uFF1B\u65E0\u6CD5\u5B89\u5168\u5408\u5E76\u65F6\u7559\u5F85\u624B\u52A8\u5904\u7406\u3002",
  "settings.diagLog.name": "\u8BCA\u65AD\u65E5\u5FD7",
  "settings.diagLog.desc": "\u5F00\u542F\u540E\u5C06\u540C\u6B65\u8FC7\u7A0B\u7684\u8BE6\u7EC6\u4FE1\u606F\u5199\u5165\u63A7\u5236\u53F0\u548C\u672C\u5730\u65E5\u5FD7\uFF08\u5B58\u50A8\u5728\u63D2\u4EF6\u76EE\u5F55\u4E0B\uFF0C\u4E0D\u7EB3\u5165\u540C\u6B65\uFF09\u3002\u5173\u95ED\u540E\u4EC5\u8BB0\u5F55\u9519\u8BEF\u3002",
  "settings.diagReport.name": "\u8BCA\u65AD\u62A5\u544A",
  "settings.diagReport.desc": "\u751F\u6210\u5305\u542B\u8FD1\u671F\u5F02\u5E38\u548C\u540C\u6B65\u72B6\u6001\u7684\u5FEB\u7167\u62A5\u544A\uFF0C\u4FDD\u5B58\u4E3A\u4ED3\u5E93\u6839\u76EE\u5F55\u4E0B\u7684 Markdown \u6587\u4EF6\u3002",
  "settings.diagReport.generate": "\u751F\u6210\u62A5\u544A",
  "settings.syncInterval.name": "\u540C\u6B65\u95F4\u9694",
  "settings.syncInterval.desc": "{minutes} \u5206\u949F",
  "settings.maxFileSize.name": "\u5355\u4E2A\u6587\u4EF6\u9650\u5236",
  "settings.maxFileSize.desc": "\u8D85\u8FC7 {size} \u7684\u6587\u4EF6\u4E0D\u4F1A\u53C2\u4E0E\u540C\u6B65\u3002\u5927\u6587\u4EF6\u4F1A\u5360\u7528\u8F83\u591A\u5185\u5B58\u548C\u6D41\u91CF\u3002",
  "settings.reset.name": "\u91CD\u7F6E\u540C\u6B65\u72B6\u6001",
  "settings.reset.desc": "\u6E05\u9664\u6240\u6709\u540C\u6B65\u5386\u53F2\u3001\u57FA\u7EBF\u548C\u5F85\u5904\u7406\u51B2\u7A81\u3002\u4E0D\u4F1A\u5220\u9664\u6587\u4EF6\u3002",
  "settings.reset.button": "\u91CD\u7F6E",
  "settings.reset.confirmTitle": "\u786E\u8BA4\u91CD\u7F6E\u540C\u6B65\u72B6\u6001",
  "settings.reset.confirmMessage": "\u8FD9\u4F1A\u6E05\u9664\u5F53\u524D\u4ED3\u5E93\u7684\u540C\u6B65\u5386\u53F2\u3001\u540C\u6B65\u57FA\u7EBF\u548C\u5F85\u5904\u7406\u8BB0\u5F55\u3002",
  "settings.reset.confirmWarning": "\u4E0D\u4F1A\u5220\u9664\u672C\u5730\u6216\u8FDC\u7AEF\u6587\u4EF6\uFF0C\u4F46\u4E0B\u6B21\u540C\u6B65\u4F1A\u6309\u65B0\u7684\u521D\u59CB\u72B6\u6001\u91CD\u65B0\u5224\u65AD\u3002",
  "settings.reset.confirm": "\u786E\u8BA4\u91CD\u7F6E",
  "settings.reset.done": "\u5DF2\u91CD\u7F6E\u540C\u6B65\u72B6\u6001",
  "settings.about.product.name": "EasySync",
  "settings.about.product.desc": "\u7248\u672C {version}",
  "settings.about.author.name": "\u4F5C\u8005",
  "settings.about.author.desc": "\u7126\u5E94\u884C\uFF08Jiao Yingxing\uFF09\u3002\u4F7F\u7528\u4E2D\u9047\u5230\u95EE\u9898\uFF0C\u53EF\u5728 GitHub \u63D0\u4EA4 Issue\uFF0C\u6216\u901A\u8FC7\u5C0F\u7EA2\u4E66\u79C1\u4FE1\u8054\u7CFB\u4F5C\u8005\u3002",
  "settings.about.contact.github": "GitHub",
  "settings.about.contact.xiaohongshu": "\u5C0F\u7EA2\u4E66",
  "settings.about.usage.name": "\u4F7F\u7528\u5EFA\u8BAE",
  "settings.about.usage.desc": "\u8BF7\u52FF\u8BA9 OneDrive \u5BA2\u6237\u7AEF\u3001iCloud\u3001Dropbox\u3001Syncthing \u7B49\u5176\u4ED6\u540C\u6B65\u5DE5\u5177\u540C\u65F6\u7BA1\u7406\u540C\u4E00\u4E2A\u672C\u5730\u4ED3\u5E93\u3002\u9996\u6B21\u540C\u6B65\u6216\u6587\u4EF6\u8F83\u591A\u65F6\u53EF\u80FD\u9700\u8981\u66F4\u957F\u65F6\u95F4\uFF0C\u53EF\u5728\u4FA7\u680F\u67E5\u770B\u8FDB\u5EA6\u3002",
  "settings.about.disclaimer.name": "\u6570\u636E\u5B89\u5168",
  "settings.about.disclaimer.desc": "\u540C\u6B65\u8FC7\u7A0B\u4E2D\uFF0CEasySync \u53EF\u80FD\u4E0A\u4F20\u3001\u4E0B\u8F7D\u6216\u5220\u9664\u672C\u5730\u53CA OneDrive \u4E2D\u7684\u6587\u4EF6\u3002\u91CD\u8981\u5185\u5BB9\u8BF7\u4FDD\u7559\u72EC\u7ACB\u5907\u4EFD\uFF1B\u540C\u6B65\u4E0D\u80FD\u66FF\u4EE3\u5907\u4EFD\u3002",
  // ---- 同步视图 ----
  "syncView.title": "EasySync",
  "syncView.lastSync": "\u4E0A\u6B21\u540C\u6B65\uFF1A{time}",
  "syncView.never": "\u5C1A\u672A\u540C\u6B65",
  "syncView.progress": "\u540C\u6B65\u8FDB\u884C\u4E2D\u2026",
  "syncView.conflict.keepLocal": "\u4FDD\u7559\u672C\u5730",
  "syncView.conflict.keepRemote": "\u4FDD\u7559\u8FDC\u7AEF",
  "syncView.conflict.skip": "\u8DF3\u8FC7",
  "syncView.conflict.defaultReason": "\u51B2\u7A81",
  "syncView.delete.confirm": "\u5220\u9664\u672C\u5730\u6587\u4EF6",
  "syncView.delete.confirmAll": "\u5220\u9664\u5168\u90E8 {count} \u4E2A\u672C\u5730\u6587\u4EF6",
  "syncView.delete.confirmAllTitle": "\u786E\u8BA4\u5220\u9664 {count} \u4E2A\u672C\u5730\u6587\u4EF6",
  "syncView.delete.confirmAllMessage": "\u8FD9\u4E9B\u6587\u4EF6\u5DF2\u5728\u8FDC\u7AEF\u5220\u9664\u3002\u7EE7\u7EED\u540E\uFF0C\u672C\u5730\u5BF9\u5E94\u6587\u4EF6\u4E5F\u4F1A\u88AB\u5220\u9664\u3002",
  "syncView.delete.confirmAllWarning": "EasySync \u4E0D\u4F1A\u4FDD\u7559\u989D\u5916\u526F\u672C\uFF0C\u8BF7\u786E\u8BA4\u8FD9\u4E9B\u6587\u4EF6\u5DF2\u6709\u5907\u4EFD\u6216\u786E\u5B9E\u4E0D\u518D\u9700\u8981\u3002",
  "syncView.delete.reject": "\u4FDD\u7559\u6587\u4EF6\u5E76\u91CD\u65B0\u4E0A\u4F20",
  "syncView.delete.reason": "\u5DF2\u5728\u8FDC\u7AEF\u5220\u9664",
  // ---- 命令 ----
  "command.syncNow": "\u7ACB\u5373\u540C\u6B65",
  "command.showDetail": "\u6253\u5F00\u540C\u6B65\u4FA7\u680F",
  // ---- 同步进度 ----
  "progress.scanningLocal": "\u626B\u63CF\u672C\u5730\u6587\u4EF6\u2026",
  "progress.preparingRemote": "\u51C6\u5907\u8FDC\u7AEF\u5B58\u50A8\u2026",
  "progress.checkingRemote": "\u68C0\u67E5\u8FDC\u7AEF\u53D8\u66F4\u2026",
  "progress.loadingBaseline": "\u52A0\u8F7D\u4E91\u57FA\u7EBF\u2026",
  "progress.generatingPlan": "\u751F\u6210\u540C\u6B65\u8BA1\u5212\u2026",
  "progress.verifyingFiles": "\u9A8C\u8BC1\u6587\u4EF6\u4E00\u81F4\u6027 ({current}/{total})",
  // ---- 同步结果 ----
  "result.synced": "\u5DF2\u540C\u6B65\uFF1A\u4E0A\u4F20 {uploaded}\uFF0C\u4E0B\u8F7D {downloaded}\uFF0C\u5220\u9664 {deleted}\uFF0C\u51B2\u7A81 {conflicts}",
  "result.partial": "\u90E8\u5206\u540C\u6B65\uFF1A\u4E0A\u4F20 {uploaded}\uFF0C\u4E0B\u8F7D {downloaded}\uFF0C\u5220\u9664 {deleted}\uFF0C\u51B2\u7A81 {conflicts}\uFF0C\u5931\u8D25 {errors}",
  "result.deferred": "\u672C\u8F6E\u6709 {deferred} \u4E2A\u6587\u4EF6\u5728\u540C\u6B65\u524D\u518D\u6B21\u53D8\u5316\uFF0C\u5DF2\u5EF6\u540E\u5230\u4E0B\u4E00\u8F6E",
  "result.firstSyncCancelled": "\u9996\u6B21\u540C\u6B65\u5DF2\u53D6\u6D88",
  "result.thresholdDeclined": "\u540C\u6B65\u5DF2\u6682\u505C\uFF1A\u53D8\u66F4\u91CF\u8D85\u8FC7\u5B89\u5168\u4E0A\u9650\uFF0C\u9700\u7528\u6237\u786E\u8BA4",
  "result.authExpired": "\u767B\u5F55\u5DF2\u8FC7\u671F\uFF0C\u540C\u6B65\u5DF2\u4E2D\u65AD",
  "result.syncFailed": "\u540C\u6B65\u5931\u8D25\uFF1A{message}",
  "result.alreadyRunning": "\u540C\u6B65\u5DF2\u5728\u8FD0\u884C\u4E2D",
  "result.cancelled": "\u540C\u6B65\u5DF2\u53D6\u6D88",
  "result.generationMismatch": "\u540C\u6B65\u5DF2\u4E2D\u6B62\u2014\u2014\u8FD0\u884C\u671F\u95F4\u72B6\u6001\u5DF2\u66F4\u6539\u3002",
  "result.lockBusy": "\u53E6\u4E00\u4E2A\u64CD\u4F5C\u6B63\u5728\u8FDB\u884C\u4E2D\uFF0C\u8BF7\u7A0D\u5019\u3002",
  "result.scanIncomplete": "\u90E8\u5206\u672C\u5730\u6587\u4EF6\u6216\u6587\u4EF6\u5939\u65E0\u6CD5\u8BFB\u53D6\uFF0C\u540C\u6B65\u5DF2\u505C\u6B62\uFF1B\u672C\u8F6E\u672A\u6267\u884C\u540C\u6B65\u53D8\u66F4\u3002",
  "result.localRecoveryFailed": "\u4E0A\u6B21\u4E2D\u65AD\u7684\u672C\u5730\u5199\u5165\u65E0\u6CD5\u5B89\u5168\u6062\u590D\uFF0C\u540C\u6B65\u5DF2\u505C\u6B62\uFF1B\u672C\u8F6E\u672A\u4FEE\u6539\u8FDC\u7AEF\u6216\u540C\u6B65\u72B6\u6001\u3002",
  "result.legacyStateDisabled": "\u540C\u6B65\u72B6\u6001\u5DF2\u5347\u7EA7\u3002\u4E3A\u9632\u6B62\u65B0\u65E7\u72B6\u6001\u4E92\u76F8\u8986\u76D6\uFF0C\u65E7\u540C\u6B65\u5199\u5165\u5DF2\u505C\u7528\u3002",
  // ---- 同步生命周期提示 ----
  "notice.sync.start": "\u2601\uFE0F \u5F00\u59CB\u540C\u6B65",
  "notice.sync.stage": "\u2601\uFE0F {stage}",
  "notice.sync.progress": "\u2601\uFE0F \u6B63\u5728\u540C\u6B65 {current}/{total}",
  "notice.sync.cancelling": "\u26D4 \u6B63\u5728\u53D6\u6D88\u540C\u6B65\u2026",
  "notice.sync.completed": "\u2705 \u540C\u6B65\u5B8C\u6210",
  "notice.sync.conflicts": "\u26A0\uFE0F \u53D1\u73B0 {count} \u9879\u51B2\u7A81",
  "notice.sync.review": "\u26A0\uFE0F \u540C\u6B65\u5F85\u786E\u8BA4",
  "notice.sync.cancelled": "\u26D4 \u540C\u6B65\u5DF2\u53D6\u6D88",
  "notice.sync.failed": "\u274C \u540C\u6B65\u5931\u8D25",
  "notice.sync.authExpired": "\u2B55 \u767B\u5F55\u5DF2\u8FC7\u671F",
  "notice.accountMismatch": "\u8D26\u53F7\u4E0D\u5339\u914D\uFF1A\u6B64\u4ED3\u5E93\u5DF2\u7ED1\u5B9A\u8D26\u53F7 {bound}\uFF0C\u5F53\u524D\u8D26\u53F7\u4E3A {current}\u3002\u8BF7\u5148\u91CD\u7F6E\u540C\u6B65\u72B6\u6001\u518D\u5207\u6362\u8D26\u53F7\u3002",
  "notice.diagnosticReportGenerated": "\u8BCA\u65AD\u62A5\u544A\u5DF2\u751F\u6210\uFF1A{fileName}",
  "notice.syncPathSettings.busy": "\u540C\u6B65\u8FDB\u884C\u4E2D\uFF0C\u8BF7\u7A0D\u540E\u518D\u4FEE\u6539\u540C\u6B65\u8303\u56F4\u3002",
  "notice.syncPathSettings.recovery": "\u4ECD\u6709\u672A\u5B8C\u6210\u7684\u6587\u4EF6\u64CD\u4F5C\uFF0C\u5B8C\u6210\u6062\u590D\u540E\u624D\u80FD\u4FEE\u6539\u540C\u6B65\u8303\u56F4\u3002",
  "notice.syncPathSettings.failed": "\u540C\u6B65\u8303\u56F4\u672A\u4FDD\u5B58\uFF0C\u8BF7\u91CD\u8BD5\u3002",
  // ---- 同步计划原因 ----
  "reason.fileExceedsSizeLimit": "\u6587\u4EF6\u8D85\u8FC7\u5927\u5C0F\u9650\u5236",
  "reason.newFileBothSides": "\u672C\u5730\u548C\u8FDC\u7AEF\u90FD\u5B58\u5728\u8FD9\u4E2A\u6587\u4EF6\u3002",
  "reason.localDeletedRemoteModified": "\u5DF2\u5728\u672C\u5730\u5220\u9664\uFF0C\u4F46\u8FDC\u7AEF\u6709\u65B0\u7684\u4FEE\u6539",
  "reason.fileDeletedLocally": "\u5DF2\u5728\u672C\u5730\u5220\u9664",
  "reason.remoteDeletedLocalModified": "\u5DF2\u5728\u8FDC\u7AEF\u5220\u9664\uFF0C\u4F46\u672C\u5730\u6709\u65B0\u7684\u4FEE\u6539",
  "reason.fileDeletedFromRemote": "\u5DF2\u5728\u8FDC\u7AEF\u5220\u9664",
  "reason.bothSidesModified": "\u672C\u5730\u548C\u8FDC\u7AEF\u90FD\u6709\u4FEE\u6539",
  "reason.renameIdentityAmbiguous": "\u7591\u4F3C\u6539\u540D\u6216\u590D\u5236\uFF0C\u4F46\u65E0\u6CD5\u5B89\u5168\u786E\u8BA4\u8EAB\u4EFD\uFF1B\u539F\u6587\u4EF6\u5DF2\u4FDD\u7559",
  "reason.scanUnhealthy": "\u672C\u5730\u626B\u63CF\u4E0D\u5B8C\u6574\uFF0C\u672C\u8F6E\u8DF3\u8FC7\u6B64\u64CD\u4F5C",
  // ---- 认证错误 ----
  "auth.error.clientNotConfigured": "OneDrive \u5BA2\u6237\u7AEF ID \u672A\u914D\u7F6E\uFF0C\u8BF7\u5148\u5728 Entra \u4E2D\u6CE8\u518C\u5E94\u7528\u3002",
  "auth.error.stateMismatch": "OAuth \u9A8C\u8BC1\u4E0D\u5339\u914D\uFF0C\u8BF7\u91CD\u65B0\u767B\u5F55\u3002",
  "auth.error.providerError": "Microsoft \u767B\u5F55\u51FA\u9519\uFF1A{details}",
  "auth.error.noCode": "\u672A\u6536\u5230 Microsoft \u6388\u6743\u7801\u3002",
  "auth.error.noRefreshToken": "\u767B\u5F55\u51ED\u636E\u4E0D\u53EF\u7528\uFF0C\u8BF7\u91CD\u65B0\u767B\u5F55\u3002",
  "auth.error.notLoggedIn": "\u5C1A\u672A\u767B\u5F55\uFF0C\u8BF7\u5148\u767B\u5F55 OneDrive\u3002",
  "auth.error.networkError": "\u8BA4\u8BC1\u7F51\u7EDC\u9519\u8BEF\uFF1A{details}",
  "auth.error.secretStorageUnavailable": "\u5F53\u524D\u8BBE\u5907\u4E0D\u652F\u6301\u5B89\u5168\u5B58\u50A8\u3002",
  "auth.error.refreshFailed": "\u51ED\u636E\u5237\u65B0\u5931\u8D25\uFF0C\u8BF7\u91CD\u65B0\u767B\u5F55\u3002",
  // ---- 通用 ----
  "general.unknown": "\u672A\u77E5",
  "general.notYetImplemented": "\u6B64\u529F\u80FD\u6682\u672A\u5F00\u653E\u3002",
  "notice.conflict.keptLocal": "\u5DF2\u4FDD\u7559\u672C\u5730\u7248\u672C\uFF1A{path}",
  "notice.conflict.keptRemote": "\u5DF2\u4FDD\u7559\u8FDC\u7AEF\u7248\u672C\uFF1A{path}",
  "notice.conflict.failed": "\u5904\u7406\u51B2\u7A81\u5931\u8D25\uFF1A{reason}",
  "notice.conflict.downloadFailed": "\u672A\u80FD\u4E0B\u8F7D\u8FDC\u7AEF\u7248\u672C\uFF0C\u672C\u6B21\u672A\u4F5C\u66F4\u6539\u3002\u8BF7\u7A0D\u540E\u91CD\u8BD5\uFF1B\u82E5\u6301\u7EED\u5931\u8D25\uFF0C\u8BF7\u68C0\u67E5\u7F51\u7EDC\u548C\u767B\u5F55\u72B6\u6001\u3002",
  "notice.conflict.identical": "\u672C\u5730\u4E0E\u8FDC\u7AEF\u5185\u5BB9\u5B8C\u5168\u4E00\u81F4\uFF0C\u5DF2\u79FB\u9664\u65E0\u6548\u51B2\u7A81\uFF1A{path}",
  "notice.localChangedSinceReview": "\u786E\u8BA4\u540E\u672C\u5730\u6587\u4EF6\u53C8\u53D1\u751F\u4E86\u53D8\u5316\uFF0C\u8BF7\u67E5\u770B\u6700\u65B0\u7248\u672C\u540E\u91CD\u65B0\u9009\u62E9\u3002",
  "notice.localRecoveryFailed": "\u4E0A\u6B21\u4E2D\u65AD\u7684\u672C\u5730\u5199\u5165\u65E0\u6CD5\u5B89\u5168\u6062\u590D\uFF0C\u540C\u6B65\u5DF2\u505C\u6B62\uFF0C\u4E14\u672A\u63A8\u8FDB\u540C\u6B65\u72B6\u6001\u3002",
  "notice.sideActionRemotePrepareFailed": "\u65E0\u6CD5\u8FDE\u63A5\u6216\u786E\u8BA4\u4E91\u7AEF\u4ED3\u5E93\uFF0C\u8BF7\u68C0\u67E5\u7F51\u7EDC\u548C\u767B\u5F55\u72B6\u6001\u540E\u91CD\u8BD5\u3002",
  "notice.sideActionScopeChanged": "\u4E91\u7AEF\u4ED3\u5E93\u8EAB\u4EFD\u5DF2\u7ECF\u53D8\u5316\uFF0C\u8BF7\u91CD\u65B0\u540C\u6B65\u5E76\u67E5\u770B\u5F53\u524D\u7248\u672C\u540E\u518D\u9009\u62E9\u3002",
  "notice.sideActionMutationRecoveryFailed": "\u4E0A\u6B21\u6587\u4EF6\u64CD\u4F5C\u7684\u7ED3\u679C\u65E0\u6CD5\u81EA\u52A8\u786E\u8BA4\uFF0C\u8BF7\u5148\u91CD\u65B0\u540C\u6B65\uFF0C\u518D\u5904\u7406\u5176\u4ED6\u6587\u4EF6\u3002",
  "notice.configSyncDisabled": "\u8FD9\u4E2A\u914D\u7F6E\u9879\u5DF2\u7ECF\u5173\u95ED\u540C\u6B65\uFF0C\u65E7\u7684\u5F85\u5904\u7406\u51B3\u5B9A\u5DF2\u79FB\u9664\u3002",
  "notice.configSnapshotInvalid": "Obsidian \u4ECD\u5728\u66F4\u65B0\u8FD9\u4E2A\u914D\u7F6E\u6587\u4EF6\uFF0C\u8BF7\u7A0D\u540E\u518D\u8BD5\u3002",
  "notice.decisionExpired": "\u8FD9\u6761\u5F85\u5904\u7406\u9879\u5DF2\u7ECF\u8FC7\u671F\uFF0C\u8BF7\u91CD\u65B0\u540C\u6B65\u5E76\u67E5\u770B\u5F53\u524D\u7248\u672C\u3002",
  "notice.delete.confirmed": "\u5DF2\u5220\u9664\u672C\u5730\u6587\u4EF6\uFF1A{path}",
  "notice.delete.rejected": "\u5DF2\u4FDD\u7559\u5E76\u91CD\u65B0\u4E0A\u4F20\uFF1A{path}",
  "notice.delete.failed": "\u5904\u7406\u5931\u8D25\uFF1A{reason}",
  // ---- 冲突详情弹窗 ----
  "conflictDetail.title": "\u51B2\u7A81\u8BE6\u60C5\uFF1A{path}",
  "conflictDetail.modifiedTime": "\u4FEE\u6539\u65F6\u95F4",
  "conflictDetail.fileSize": "\u6587\u4EF6\u5927\u5C0F",
  "conflictDetail.localLabel": "\u672C\u5730",
  "conflictDetail.remoteLabel": "\u8FDC\u7AEF",
  "conflictDetail.newer": "(\u8F83\u65B0)",
  "conflictDetail.larger": "(\u8F83\u5927)",
  "conflictDetail.localPreview": "\u672C\u5730\u6587\u4EF6\u5185\u5BB9",
  "conflictDetail.diffTitle": "\u5185\u5BB9\u5BF9\u6BD4",
  "conflictDetail.diffAdded": "+{count} \u884C",
  "conflictDetail.diffRemoved": "-{count} \u884C",
  "conflictDetail.summaryComparing": "\u672C\u5730\u4E0E\u8FDC\u7AEF\u7248\u672C\u4E0D\u540C\uFF0C\u6B63\u5728\u786E\u8BA4\u5177\u4F53\u5185\u5BB9\u5DEE\u5F02\u3002",
  "conflictDetail.summaryComparisonUnavailable": "\u6682\u65F6\u65E0\u6CD5\u786E\u8BA4\u672C\u5730\u4E0E\u8FDC\u7AEF\u7684\u5177\u4F53\u5185\u5BB9\u5DEE\u5F02\u3002",
  "conflictDetail.summaryLocalExtra": "\u672C\u5730\u6BD4\u8FDC\u7AEF\u591A {count} \u884C\u3002",
  "conflictDetail.summaryRemoteExtra": "\u8FDC\u7AEF\u6BD4\u672C\u5730\u591A {count} \u884C\u3002",
  "conflictDetail.summaryBothModified": "\u672C\u5730\u548C\u8FDC\u7AEF\u90FD\u6709\u4FEE\u6539\u3002",
  "conflictDetail.summaryBothExistDifferent": "\u672C\u5730\u548C\u8FDC\u7AEF\u90FD\u5B58\u5728\u8FD9\u4E2A\u6587\u4EF6\uFF0C\u4F46\u5185\u5BB9\u4E0D\u540C\u3002",
  "conflictDetail.summaryDifferent": "\u672C\u5730\u4E0E\u8FDC\u7AEF\u5185\u5BB9\u4E0D\u540C\u3002",
  "conflictDetail.summaryBytesDifferentNoLineDiff": "\u672C\u5730\u4E0E\u8FDC\u7AEF\u6587\u4EF6\u5B57\u8282\u4E0D\u540C\uFF0C\u4F46\u6CA1\u6709\u53EF\u663E\u793A\u7684\u9010\u884C\u5DEE\u5F02\u3002",
  "conflictDetail.remoteComparisonUnavailable": "\u672A\u80FD\u83B7\u53D6\u6216\u6BD4\u8F83\u8FDC\u7AEF\u5185\u5BB9\uFF0C\u4EC5\u663E\u793A\u672C\u5730\u7248\u672C\u3002",
  "conflictDetail.loading": "\u52A0\u8F7D\u4E2D\u2026",
  "conflictDetail.fetchingRemote": "\u6B63\u5728\u83B7\u53D6\u8FDC\u7AEF\u5185\u5BB9\u2026",
  "conflictDetail.computingDiff": "\u6B63\u5728\u8BA1\u7B97\u5DEE\u5F02\u2026",
  "conflictDetail.localReadUnavailable": "\u672A\u80FD\u8BFB\u53D6\u672C\u5730\u6587\u4EF6\uFF0C\u6682\u65F6\u65E0\u6CD5\u6BD4\u8F83\u5185\u5BB9\u3002",
  "conflictDetail.loadUnavailable": "\u672A\u80FD\u52A0\u8F7D\u51B2\u7A81\u8BE6\u60C5\uFF0C\u8BF7\u5173\u95ED\u540E\u91CD\u8BD5\u3002",
  "conflictDetail.binaryFile": "\u4E8C\u8FDB\u5236\u6587\u4EF6\uFF0C\u65E0\u6CD5\u9884\u89C8\u5185\u5BB9\u3002",
  "conflictDetail.diffRegionsLocated": "\u5DF2\u5B9A\u4F4D {count} \u4E2A\u5DEE\u5F02\u533A\u57DF",
  "conflictDetail.diffChangeBudget": "\u8BE5\u5DEE\u5F02\u533A\u57DF\u5305\u542B\u5927\u91CF\u65B0\u589E\u6216\u5220\u9664\u884C\u3002\u8303\u56F4\u548C\u6570\u91CF\u5DF2\u7ECF\u51C6\u786E\u8BC6\u522B\uFF0C\u4EC5\u663E\u793A\u5F00\u5934\u4E0E\u7ED3\u5C3E\u3002",
  "conflictDetail.diffAlignmentLimit": "\u8BE5\u533A\u57DF\u91CD\u590D\u5185\u5BB9\u8FC7\u591A\u6216\u6539\u52A8\u8303\u56F4\u8FC7\u5927\uFF0C\u65E0\u6CD5\u53EF\u9760\u5730\u9010\u884C\u5BF9\u9F50\u3002EasySync \u53EA\u663E\u793A\u6709\u9650\u6837\u672C\uFF0C\u4E0D\u4F1A\u628A\u5B83\u8BEF\u62A5\u6210\u6574\u4EFD\u6587\u4EF6\u5168\u90E8\u5220\u9664\u518D\u65B0\u589E\u3002",
  "conflictDetail.diffDisplayBudget": "\u8BE5\u6587\u4EF6\u5305\u542B\u8FC7\u591A\u5206\u6563\u7684\u5DEE\u5F02\u533A\u57DF\u3002\u4E3A\u907F\u514D\u8BE6\u60C5\u9875\u5361\u987F\uFF0CEasySync \u5DF2\u505C\u6B62\u751F\u6210\u66F4\u591A\u7A97\u53E3\uFF1B\u5F53\u524D\u663E\u793A\u7684\u662F\u5DF2\u7ECF\u5B9A\u4F4D\u5230\u7684\u524D\u90E8\u5206\u5DEE\u5F02\u3002",
  "conflictDetail.diffRegionRange": "\u672C\u5730\u7B2C {localRange} \u884C\uFF1B\u8FDC\u7AEF\u7B2C {remoteRange} \u884C",
  "conflictDetail.diffOmitted": "\u2026 \u5DF2\u7701\u7565\u672C\u5730 {localCount} \u884C\u3001\u8FDC\u7AEF {remoteCount} \u884C",
  "conflictDetail.textDiffByteLimit": "\u4E3A\u907F\u514D Obsidian \u5361\u987F\uFF0C\u6587\u672C\u5BF9\u6BD4\u6BCF\u4E00\u4FA7\u6700\u591A\u5904\u7406 {limit}\u3002\u5F53\u524D\u6587\u4EF6\u8D85\u8FC7\u8BE5\u9650\u5236\uFF0C\u8BF7\u4F7F\u7528\u5916\u90E8\u5BF9\u6BD4\u5DE5\u5177\u67E5\u770B\u5B8C\u6574\u5185\u5BB9\u3002",
  "conflictDetail.previewTruncated": "\u6587\u4EF6\u5185\u5BB9\u8F83\u591A\uFF0C\u4EC5\u663E\u793A\u524D {shown} \u884C\uFF0C\u5171 {total} \u884C\u3002",
  "conflictDetail.identical": "\u672C\u5730\u4E0E\u8FDC\u7AEF\u7684\u5B9E\u9645\u5185\u5BB9\u5B8C\u5168\u4E00\u81F4\u3002\u8FD9\u4E0D\u662F\u6709\u6548\u51B2\u7A81\uFF0CEasySync \u6B63\u5728\u5B89\u5168\u79FB\u9664\u8BE5\u6761\u76EE\u3002",
  "conflictDetail.textSameBytesDifferent": "\u6587\u5B57\u770B\u8D77\u6765\u76F8\u540C\uFF0C\u4F46\u6587\u4EF6\u5B57\u8282\u4E0D\u540C\uFF08\u5E38\u89C1\u4E8E\u7F16\u7801\u6216\u4E0D\u53EF\u89C1\u5B57\u7B26\u5DEE\u5F02\uFF09\u3002\u4E3A\u907F\u514D\u8BEF\u8986\u76D6\uFF0C\u4ECD\u6309\u771F\u5B9E\u5DEE\u5F02\u5904\u7406\u3002",
  // ---- 同步视图额外 ----
  "syncView.merge.autoMerged": "\u5DF2\u81EA\u52A8\u5408\u5E76\uFF1A{path}",
  "syncView.conflict.viewDetail": "\u67E5\u770B\u8BE6\u60C5",
  "syncView.conflict.processing": "\u5904\u7406\u4E2D\u2026",
  // ---- 确认弹窗 ----
  "confirm.firstSyncTitle": "\u9996\u6B21\u540C\u6B65\u9884\u89C8",
  "confirm.thresholdTitle": "\u53D8\u66F4\u91CF\u8D85\u8FC7\u5B89\u5168\u9608\u503C",
  "confirm.confirm": "\u786E\u8BA4\u6267\u884C",
  "confirm.cancel": "\u53D6\u6D88",
  "confirm.deleteWarning": "\u5305\u542B {count} \u9879\u5220\u9664\u64CD\u4F5C\uFF0C\u8BF7\u786E\u8BA4\u3002",
  // ---- 同步计划提醒与审查 ----
  "syncPlan.readyTitle": "\u540C\u6B65\u8BA1\u5212\u5C31\u7EEA",
  "syncPlan.readyMessage": "\u540C\u6B65\u8BA1\u5212\u5DF2\u751F\u6210\uFF0C\u8BF7\u5728\u4FA7\u8FB9\u680F\u67E5\u770B\u8BE6\u60C5\u5E76\u786E\u8BA4\u6267\u884C\u3002",
  "syncPlan.viewButton": "\u67E5\u770B\u8BA1\u5212",
  "syncPlan.sectionTitle": "\u540C\u6B65\u8BA1\u5212",
  "syncPlan.confirmExecute": "\u786E\u8BA4\u6267\u884C",
  "syncPlan.recalculate": "\u91CD\u65B0\u8BA1\u7B97",
  "syncPlan.detailsUnavailable": "\u6B64\u8BA1\u5212\u4EC5\u4FDD\u5B58\u4E86\u6570\u91CF\uFF0C\u8BF7\u91CD\u65B0\u8BA1\u7B97\u4EE5\u67E5\u770B\u6587\u4EF6\u660E\u7EC6\u3002",
  "syncPlan.noChanges": "\u6CA1\u6709\u9700\u8981\u6267\u884C\u7684\u6587\u4EF6\u53D8\u66F4\u3002",
  // ---- 状态栏 ----
  "status.planReview": "EasySync: \u540C\u6B65\u8BA1\u5212\u5F85\u5BA1\u9605",
  // ---- 同步结果 ----
  "result.pausedForReview": "\u540C\u6B65\u5DF2\u6682\u505C\uFF1A\u8BA1\u5212\u53EF\u5728\u4FA7\u8FB9\u680F\u67E5\u770B",
  // ---- 同步进度展示 ----
  "syncView.fileStatus.upload": "\u4E0A\u4F20",
  "syncView.fileStatus.download": "\u4E0B\u8F7D",
  "syncView.fileStatus.delete": "\u5220\u9664",
  "syncView.fileStatus.conflict": "\u51B2\u7A81",
  "syncView.fileStatus.skip": "\u8DF3\u8FC7",
  "syncView.fileStatus.deferred": "\u6587\u4EF6\u5728\u540C\u6B65\u524D\u518D\u6B21\u53D8\u5316\uFF0C\u5DF2\u5EF6\u540E\u5230\u4E0B\u4E00\u8F6E",
  "syncView.fileStatus.error": "\u5931\u8D25",
  "syncView.progress.current": "\u5F53\u524D",
  "syncView.progress.items": "{current}/{total}\u9879",
  "syncView.progress.completed": "\u5DF2\u5B8C\u6210 ({count})",
  "syncView.cancelSync": "\u53D6\u6D88\u540C\u6B65",
  "syncView.cancelling": "\u6B63\u5728\u53D6\u6D88\u2026",
  "syncView.active.upload": "\u6B63\u5728\u4E0A\u4F20\u2026",
  "syncView.active.download": "\u6B63\u5728\u4E0B\u8F7D\u2026",
  "syncView.active.delete": "\u6B63\u5728\u5220\u9664\u2026",
  "syncView.active.rename": "\u6B63\u5728\u66F4\u65B0\u8FDC\u7AEF\u6587\u4EF6\u2026",
  "syncView.failure.contentUnavailable": "\u8FDC\u7AEF\u5185\u5BB9\u6682\u4E0D\u53EF\u7528",
  "syncView.failure.network": "\u7F51\u7EDC\u8BF7\u6C42\u5931\u8D25",
  "syncView.failure.rateLimited": "OneDrive \u8BF7\u6C42\u8FC7\u4E8E\u9891\u7E41",
  "syncView.failure.storageFull": "OneDrive \u5B58\u50A8\u7A7A\u95F4\u4E0D\u8DB3",
  "syncView.failure.authExpired": "\u767B\u5F55\u5DF2\u8FC7\u671F",
  "syncView.failure.remote": "\u8FDC\u7AEF\u8BF7\u6C42\u5931\u8D25",
  "syncView.failure.local": "\u672C\u5730\u6587\u4EF6\u64CD\u4F5C\u5931\u8D25",
  "syncView.status.synced": "\u5DF2\u540C\u6B65",
  "syncView.issues.title": "\u9700\u8981\u5904\u7406 {count}",
  "syncView.issues.notSynced": "\u672A\u540C\u6B65",
  "syncView.issues.lastAttempt": "\u6700\u8FD1\u5C1D\u8BD5\uFF1A{time}",
  "syncView.issues.openFile": "\u6253\u5F00\u6587\u4EF6",
  "syncView.issues.retry": "\u518D\u6B21\u540C\u6B65",
  "syncView.issues.awaitingConfirmation": "\u7B49\u5F85\u786E\u8BA4",
  "syncView.collapseAll": "\u5168\u90E8\u6298\u53E0",
  "syncView.expandAll": "\u5168\u90E8\u5C55\u5F00",
  "syncView.history.title": "\u540C\u6B65\u5386\u53F2",
  "syncView.openSettings": "\u6253\u5F00 EasySync \u8BBE\u7F6E",
  "syncView.history.empty": "\u6682\u65E0\u540C\u6B65\u5386\u53F2\u3002",
  "syncView.history.omitted": "\u53E6\u6709 {count} \u4E2A\u6210\u529F\u6587\u4EF6\u672A\u4FDD\u7559\u660E\u7EC6\u3002",
  "syncView.history.status.success": "\u5DF2\u5B8C\u6210",
  "syncView.history.status.partial": "\u90E8\u5206\u5B8C\u6210",
  "syncView.history.status.cancelled": "\u5DF2\u53D6\u6D88",
  "syncView.history.status.authExpired": "\u767B\u5F55\u5DF2\u8FC7\u671F",
  "syncView.history.status.failed": "\u5931\u8D25",
  "syncView.history.mode.manual": "\u624B\u52A8",
  "syncView.history.mode.auto": "\u81EA\u52A8",
  "syncView.history.mode.first": "\u9996\u6B21\u540C\u6B65",
  "syncView.history.duration": "\u8017\u65F6 {seconds} \u79D2"
};
var zh_cn_default = zhCN;

// src/i18n/index.ts
var LOCALES = {
  en: en_default,
  "zh-cn": zh_cn_default
};
function resolveLocale(rawLang) {
  const lower = rawLang.toLowerCase();
  if (lower === "zh" || lower.startsWith("zh-")) {
    return "zh-cn";
  }
  if (LOCALES[lower]) return lower;
  return "en";
}
var I18n = class {
  constructor(language) {
    const lang = language ?? "en";
    const key = resolveLocale(lang);
    this.locale = LOCALES[key] ?? en_default;
  }
  /**
   * Translate a key with optional parameter substitution.
   * Parameters in the template are `{paramName}`.
   *
   * @param key Dot-separated locale key
   * @param params Optional key-value pairs for substitution
   * @returns Translated string with params replaced
   */
  t(key, params) {
    const localeStr = this.locale;
    const enStr = en_default;
    let template = localeStr[key] ?? enStr[key] ?? key;
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        template = template.split(`{${k}}`).join(String(v));
      }
    }
    return template;
  }
  /** Get the current locale object (for advanced use) */
  getLocale() {
    return this.locale;
  }
  /** Static helper: read Obsidian's language setting */
  static detectLanguage(app) {
    const obsidianLang = app?.vault?.getConfig?.("language");
    if (obsidianLang) return obsidianLang;
    try {
      const stored = globalThis.localStorage?.getItem("language");
      if (stored) return stored;
    } catch {
    }
    if (typeof navigator !== "undefined" && navigator.language) {
      return navigator.language;
    }
    return "en";
  }
};

// src/ui/sync-notice.ts
var import_obsidian14 = require("obsidian");
function shouldSuppressSyncNoticeForVisibleSidebar(input) {
  return !input.leftSidebarCollapsed && input.easySyncViewVisibleInLeftSidebar;
}
function resolveSyncProgressNoticePresentation(progress) {
  const activity = resolveSyncActivityPresentation(progress);
  const determinate = progress.total > 0;
  const percent = !determinate ? 0 : progress.phase === "verifying" ? Math.min(100, Math.max(0, Math.round(progress.current / progress.total * 100))) : syncProgressPercent(progress);
  let kind = "stage";
  if (activity.kind === "cancelling") {
    kind = "cancelling";
  } else if (activity.kind === "starting") {
    kind = "starting";
  } else if (determinate && ["syncing", "uploading", "downloading", "deleting", "renaming"].includes(activity.kind)) {
    kind = "progress";
  }
  return {
    kind,
    activity,
    // Pre-execution stages currently expose status only. Show the bar only
    // after verification or file execution provides a concrete item total.
    showProgressBar: determinate && (progress.phase === "verifying" || progress.phase === "executing"),
    determinate,
    percent,
    current: progress.current,
    total: progress.total
  };
}
function formatSyncProgressNoticeLabel(presentation, t) {
  switch (presentation.kind) {
    case "cancelling":
      return t("notice.sync.cancelling");
    case "progress":
      return t("notice.sync.progress", {
        current: presentation.current,
        total: presentation.total
      });
    case "stage":
      return t("notice.sync.stage", {
        stage: translateSyncActivity(presentation.activity, t)
      });
    case "starting":
    default:
      return t("notice.sync.start");
  }
}
function resolveSyncNoticeOutcome(result, context = {}) {
  if (result.authExpired) return { kind: "authExpired", count: 0 };
  if (context.pausedForReview) return { kind: "review", count: 0 };
  if (context.cancelled) return { kind: "cancelled", count: 0 };
  if (result.errors > 0 || !result.success) return { kind: "failed", count: 0 };
  if (result.conflicts > 0) return { kind: "conflicts", count: result.conflicts };
  if (result.deferred > 0) return null;
  const changedFiles = result.uploaded + result.downloaded + result.deleted > 0;
  const healthyNoChange = result.skippedLarge === 0 && result.skippedIgnored === 0;
  if (changedFiles || healthyNoChange) {
    return { kind: "completed", count: 0 };
  }
  return null;
}
function createSyncProgressNoticeMessage(label, percent, determinate, showProgressBar = true) {
  if (typeof document === "undefined") return label;
  const fragment = document.createDocumentFragment();
  const content = document.createElement("div");
  content.className = "easy-sync-notice-progress-content";
  if (!showProgressBar) {
    content.classList.add("is-text-only");
  }
  const labelEl = document.createElement("div");
  labelEl.className = "easy-sync-notice-progress-label";
  labelEl.textContent = label;
  content.appendChild(labelEl);
  if (showProgressBar) {
    const progressHost = document.createElement("div");
    progressHost.className = "easy-sync-notice-progress-native";
    progressHost.setAttribute("aria-hidden", "true");
    new import_obsidian14.ProgressBarComponent(progressHost).setValue(determinate ? Math.min(100, Math.max(0, percent)) : 0);
    content.appendChild(progressHost);
  }
  fragment.appendChild(content);
  return fragment;
}

// src/sync/auto-sync-dirty-hint.ts
var LOCAL_DIRTY_DEBOUNCE_MS = 7e3;
var AutoSyncDirtyHint = class {
  constructor(onReady, delayMs = LOCAL_DIRTY_DEBOUNCE_MS) {
    this.onReady = onReady;
    this.delayMs = delayMs;
    this.timer = null;
    this.version = 0;
    this.dirty = false;
  }
  get pending() {
    return this.dirty;
  }
  /** Returns true only when this event starts a new debounce window. */
  mark() {
    const startedWindow = this.timer === null;
    this.dirty = true;
    this.version++;
    this.schedule();
    return startedWindow;
  }
  cancel() {
    compatClearTimeout(this.timer);
    this.timer = null;
    this.dirty = false;
    this.version++;
  }
  schedule() {
    compatClearTimeout(this.timer);
    this.timer = compatSetTimeout(() => {
      this.timer = null;
      void this.flush();
    }, this.delayMs);
  }
  async flush() {
    if (!this.dirty) return;
    const observedVersion = this.version;
    let consumed = false;
    try {
      consumed = await this.onReady();
    } catch {
      consumed = false;
    } finally {
      if (this.version !== observedVersion) return;
      if (consumed) {
        this.dirty = false;
      } else {
        this.schedule();
      }
    }
  }
};

// src/sync/diagnostic-report-evidence.ts
var shortHash = (value) => value ? value.toLowerCase().slice(0, 12) : "\u2014";
function buildConflictEvidence(item, base) {
  const equality = item.local && item.remote ? resolveContentEquality({ local: item.local, remote: item.remote, base }) : { status: "unknown", proof: "missingSide" };
  return {
    equalityStatus: equality.status,
    equalityProof: equality.proof,
    localHash: shortHash(item.local?.hash),
    localSize: item.local?.size,
    localMtime: item.local?.mtime,
    remoteSha256: shortHash(item.remote?.sha256Hash),
    remoteSize: item.remote?.size,
    remoteMtime: item.remote?.mtime,
    remoteETag: item.remote?.eTag,
    hasDecisionToken: Boolean(item.decisionToken)
  };
}
function findLatestPhaseSummary(entries) {
  return [...entries].reverse().find(
    (entry) => entry.cat === "lifecycle" && entry.lvl === "log" && entry.msg === "sync run phase summary"
  );
}
function findLatestNetworkSummary(entries) {
  return [...entries].reverse().find(
    (entry) => entry.cat === "onedrive" && entry.lvl === "log" && entry.msg === "sync network summary"
  );
}
function findLatestTransferSummary(entries) {
  return [...entries].reverse().find(
    (entry) => entry.cat === "execute" && entry.lvl === "log" && entry.msg === "sync file transfer summary"
  );
}
function findLatestAutomaticHandlingSummary(entries) {
  return [...entries].reverse().find(
    (entry) => entry.cat === "execute" && entry.lvl === "log" && entry.msg === "sync automatic handling summary"
  );
}
function summarizeMutationRecovery(entries) {
  const byAction = {
    upload: 0,
    download: 0,
    deleteRemote: 0,
    renameRemote: 0,
    deleteLocal: 0,
    merge: 0
  };
  let intentOnly = 0;
  let receiptPendingCommit = 0;
  for (const entry of entries) {
    byAction[entry.intent.action]++;
    if (entry.receipt) receiptPendingCommit++;
    else intentOnly++;
  }
  return {
    total: entries.length,
    intentOnly,
    receiptPendingCommit,
    byAction
  };
}
async function fingerprintOpaqueValue(value) {
  if (!value) return "\u2014";
  return (await sha256Hex(new TextEncoder().encode(value).buffer)).slice(0, 12);
}

// src/main.ts
var KEY_SYNC_INTERVAL = "sync-interval";
var KEY_SYNC_PLUGIN_FILES = "sync-plugin-files";
var KEY_MAX_FILE_SIZE_MB = "sync-max-file-size-mb";
var KEY_DIAG_LOG = "sync-diagnostic-logging";
var KEY_SYNC_EDITOR = "sync-editor";
var KEY_SYNC_APPEARANCE = "sync-appearance";
var KEY_SYNC_THEMES = "sync-themes";
var KEY_SYNC_HOTKEYS = "sync-hotkeys";
var KEY_SYNC_CORE_PLUGINS = "sync-core-plugins";
var KEY_SYNC_COMMUNITY_PLUGINS = "sync-community-plugins";
var KEY_SYNC_PLUGIN_DATA = "sync-plugin-data";
var KEY_SYNC_EXCLUDED_FOLDERS = "sync-excluded-folders";
var KEY_AUTO_SYNC_PAUSED = "auto-sync-paused";
var KEY_LEGACY_AUTO_MERGE = "sync-auto-merge";
var KEY_AUTOMATIC_HANDLING_POLICY = "sync-auto-conflict-policy";
var KEY_PROFILE_CACHE = "easy-sync-profile-cache";
var RIBBON_SUCCESS_DURATION_MS = 5e3;
var SYNC_RESULT_NOTICE_DURATION_MS = 2e3;
var SYNC_PROGRESS_NOTICE_KEY = "sync-progress";
var SyncPathSettingsUpdateError = class extends Error {
  constructor(code) {
    super(code);
    this.code = code;
    this.name = "SyncPathSettingsUpdateError";
  }
};
function clonePluginData(data) {
  return JSON.parse(JSON.stringify(data));
}
function measurePluginDataWrite(data) {
  const encoder = new TextEncoder();
  const serializedBytes = encoder.encode(JSON.stringify(data)).byteLength;
  const largestKeys = Object.entries(data).map(([key, value]) => {
    const serialized = JSON.stringify(value);
    return { key, bytes: serialized === void 0 ? 0 : encoder.encode(serialized).byteLength };
  }).sort((left, right) => right.bytes - left.bytes).slice(0, 5);
  return { serializedBytes, topLevelKeys: Object.keys(data).length, largestKeys };
}
var EasySyncPlugin = class extends import_obsidian15.Plugin {
  constructor() {
    super(...arguments);
    this.auth = null;
    this.onedrive = null;
    this.scanner = null;
    this.engine = null;
    this.state = null;
    this.syncExecutor = null;
    this.progressStore = new SyncProgressStore();
    this.noticeCenter = new EasySyncNoticeCenter();
    this.i18n = new I18n("en");
    this.diag = new DiagnosticLogger();
    // M14: single serialized write queue for PluginData — prevents
    // StateManager.save() / saveSyncSettings() / auth profile writes
    // from racing on loadData → modify → saveData cycles.
    this.pluginDataQueue = Promise.resolve();
    this.pluginDataLoadPromise = null;
    this.syncInterval = 3;
    this.syncPluginFiles = false;
    // M19: EasySync self-sync default OFF — explicit opt-in
    this.syncMaxFileSizeMb = 500;
    this.automaticHandlingPolicy = {
      ...DEFAULT_AUTOMATIC_HANDLING_POLICY
    };
    this.syncEditorSettings = false;
    this.syncAppearance = false;
    this.syncThemes = false;
    this.syncHotkeys = false;
    this.syncCorePlugins = false;
    this.syncCommunityPlugins = false;
    this.syncPluginData = false;
    this.excludedFolders = [];
    this.diagLogEnabled = false;
    this.autoSyncPaused = false;
    this.opLock = null;
    this.autoSyncTimer = null;
    this.autoSyncDirtyHint = new AutoSyncDirtyHint(
      () => this.runAutomaticSync("dirty")
    );
    this.statusBarEl = null;
    this.ribbonEl = null;
    this.ribbonSuccessTimer = null;
    this.ribbonSuccessVisible = false;
    this.settingsTab = null;
    this.stateLoadPromise = null;
    this.syncNoticeFrame = null;
    this.syncNoticeSignature = null;
    this.operationLifecycle = new OperationLifecycle();
    /** Set to true after state.load() completes. Public so settings-tab
     *  can guard the "Reset" button with it. */
    this._stateLoaded = false;
  }
  // ---- Operation Lock ----
  /** Acquire the shared operation lock. Returns null on success, or the
   *  holder's operation name if already held. */
  acquireOpLock(operation) {
    if (this.opLock !== null) return this.opLock;
    this.opLock = operation;
    return null;
  }
  releaseOpLock() {
    this.opLock = null;
  }
  // ---- Lifecycle ----
  async onload() {
    this.diag.log("lifecycle", "====== onload start ======");
    this.diag.setAdapter(this.app.vault.adapter, getConfigDir(this.app.vault));
    const lang = I18n.detectLanguage(this.app);
    this.i18n = new I18n(lang);
    await this.loadSyncSettings();
    const authBrowser = createAuthBrowserLauncher({
      isDesktopApp: import_obsidian15.Platform.isDesktopApp,
      onPopupNavigationError: (error) => {
        this.diag.warn("auth", "failed to navigate auth popup, falling back to direct open", error);
      }
    });
    const authCtx = {
      secretStorage: {
        set: (key, value) => this.saveSecret(key, value),
        get: (key) => this.loadSecret(key),
        remove: (key) => this.removeSecret(key)
      },
      registerProtocolHandler: (action, handler) => {
        this.registerObsidianProtocolHandler(action, handler);
      },
      openAuthPopup: authBrowser.openAuthPopup,
      openUrl: authBrowser.openUrl,
      // User profile cache: avoid network call on every cold start
      profileCache: {
        get: async () => {
          const data = await this.loadPluginData();
          const cached = data?.[KEY_PROFILE_CACHE];
          if (!isRecord(cached)) return null;
          return typeof cached.displayName === "string" && typeof cached.accountId === "string" ? { displayName: cached.displayName, accountId: cached.accountId } : null;
        },
        set: async (profile) => {
          await this.updatePluginData((data) => {
            data[KEY_PROFILE_CACHE] = profile;
          });
        },
        clear: async () => {
          await this.updatePluginData((data) => {
            delete data[KEY_PROFILE_CACHE];
          });
        }
      },
      diag: this.diag
    };
    this.auth = new AuthModule(authCtx, (key, params) => this.i18n.t(key, params));
    this.auth.onStateChange(() => {
      this.updateStatusBar();
      this.syncView?.render();
      this.settingsTab?.refreshAuthState();
    });
    this.engine = new SyncEngine();
    this.state = new StateManager({
      loadData: () => this.loadPluginData(),
      updatePluginData: (mutator) => this.updatePluginData(mutator),
      app: this.app,
      manifest: this.manifest
    });
    authCtx.onFreshLogin = () => {
      void this.state.resetCircuitBreakers().catch((error) => {
        this.diag.warn("state", "failed to reset circuit breakers after fresh login", error);
      });
    };
    this.scanner = new LocalScanner(this.app.vault, void 0, this.manifest.id);
    this.scanner.setDiag(this.diag);
    this.applySyncPathSettings();
    this.onedrive = new OneDriveClient(
      () => this.auth.getAccessToken(),
      this.diag,
      getConfigDir(this.app.vault),
      this.manifest.id
    );
    this.syncExecutor = new SyncExecutor(
      this.onedrive,
      this.scanner,
      this.engine,
      this.state,
      this.app.vault.getName(),
      this.i18n,
      this.progressStore,
      this.diag,
      this.app.fileManager,
      () => {
        this.updateStatusBar();
        this.syncView?.render();
        this.settingsTab?.refreshSyncState();
      },
      this.operationLifecycle,
      this.noticeCenter
    );
    this.syncExecutor.setAutomaticHandlingPolicy(this.automaticHandlingPolicy);
    this.settingsTab = new EasySyncSettingTab(this);
    this.addSettingTab(this.settingsTab);
    this.registerView(
      SYNC_VIEW_TYPE,
      (leaf) => new EasySyncSyncView(leaf, this)
    );
    this.registerEvent(this.app.workspace.on(
      "layout-change",
      () => this.refreshSyncNoticeVisibility()
    ));
    this.registerEvent(this.app.workspace.on(
      "active-leaf-change",
      () => this.refreshSyncNoticeVisibility()
    ));
    this.ribbonEl = this.addRibbonIcon(
      "cloud",
      this.i18n.t("syncView.title"),
      () => this.handleRibbonClick()
    );
    this.ribbonEl.addClass("easy-sync-ribbon");
    this.statusBarEl = this.addStatusBarItem();
    this.updateStatusBar();
    this.addCommand({
      id: "start-sync",
      name: this.i18n.t("command.syncNow"),
      callback: () => {
        void this.startManualSync();
      }
    });
    this.addCommand({
      id: "show-detail",
      name: this.i18n.t("command.showDetail"),
      callback: () => {
        void this.activateSyncView();
      }
    });
    void this.auth.initialize().catch((e) => {
      this.diag.warn("lifecycle", "background auth init failed", e);
    });
    void this.ensureStateLoaded().then(() => this.updateStatusBar()).catch((e) => this.diag.warn("state", "background state load failed", e));
    this.registerEvent(this.app.vault.on("create", (file) => this.markLocalDirtyHint(file.path)));
    this.registerEvent(this.app.vault.on("modify", (file) => this.markLocalDirtyHint(file.path)));
    this.registerEvent(this.app.vault.on("delete", (file) => this.markLocalDirtyHint(file.path)));
    this.registerEvent(this.app.vault.on("rename", (file, oldPath) => this.markLocalDirtyHint(file.path, oldPath)));
    this.startAutoSync();
    this.diag.log("lifecycle", "onload complete (auth initializing in background)");
  }
  onunload() {
    this.diag.log("lifecycle", "unloading");
    this.syncExecutor?.invalidateLifecycle("unload");
    this.syncExecutor = null;
    this.stopAutoSync();
    compatClearTimeout(this.ribbonSuccessTimer);
    compatCancelAnimationFrame(this.syncNoticeFrame);
    this.noticeCenter.dispose();
    void this.diag.dispose().catch(() => void 0);
  }
  // ---- Public API for UI callbacks ----
  get syncView() {
    const leaves = this.app.workspace.getLeavesOfType(SYNC_VIEW_TYPE);
    if (leaves.length === 0) return null;
    const view = leaves[0].view;
    return typeof view.render === "function" ? view : null;
  }
  /** Open the sync detail view in the left sidebar */
  async activateSyncView() {
    const existing = this.app.workspace.getLeavesOfType(SYNC_VIEW_TYPE);
    if (existing.length > 0) {
      await this.app.workspace.revealLeaf(existing[0]);
      this.refreshSyncNoticeVisibility();
      return;
    }
    await this.app.workspace.getLeftLeaf(false)?.setViewState({
      type: SYNC_VIEW_TYPE,
      active: true
    });
    this.refreshSyncNoticeVisibility();
  }
  async runSideActionIntent(path, failureKey, action, requireIdleSideActions = false) {
    const executor = this.syncExecutor;
    const state = this.state;
    if (!executor || !state) return false;
    const rejectBusy = () => {
      if (this.opLock === null && !executor.isRunning && (!requireIdleSideActions || !executor.hasSideActionsInFlight)) {
        return false;
      }
      this.noticeCenter.show({
        key: `side-action-gateway:busy:${path}`,
        message: this.i18n.t(failureKey, {
          path,
          reason: this.i18n.t("result.lockBusy")
        }),
        priority: NOTICE_PRIORITY.attention,
        className: "easy-sync-notice-action"
      });
      return true;
    };
    try {
      await this.ensureStateLoaded();
      if (rejectBusy()) return false;
      if (!await this.checkAccountBinding()) return false;
      if (rejectBusy()) return false;
      await action(executor, state);
      this.updateStatusBar();
      this.syncView?.render();
      this.settingsTab?.refreshSyncState();
      return true;
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      this.diag.warn("execute", `side-action gateway failed \u2014 ${path}`, reason);
      this.noticeCenter.show({
        key: `side-action-gateway:failed:${path}`,
        message: this.i18n.t(failureKey, { path, reason }),
        priority: NOTICE_PRIORITY.failure,
        className: "easy-sync-notice-action"
      });
      this.updateStatusBar();
      this.syncView?.render();
      this.settingsTab?.refreshSyncState();
      return false;
    }
  }
  resolveConflictKeepLocal(path) {
    return this.runSideActionIntent(
      path,
      "notice.conflict.failed",
      (executor) => executor.resolveConflictKeepLocal(path)
    );
  }
  resolveConflictKeepRemote(path) {
    return this.runSideActionIntent(
      path,
      "notice.conflict.failed",
      (executor) => executor.resolveConflictKeepRemote(path)
    );
  }
  reconcileIdenticalConflict(path, proof) {
    return this.runSideActionIntent(
      path,
      "notice.conflict.failed",
      (executor) => executor.reconcileIdenticalConflict(path, proof)
    );
  }
  confirmRemoteDelete(path) {
    return this.runSideActionIntent(
      path,
      "notice.delete.failed",
      (executor) => executor.confirmRemoteDelete(path)
    );
  }
  confirmRemoteDeletes(paths) {
    const requestedPaths = [...new Set(paths)];
    if (requestedPaths.length === 0) return Promise.resolve(false);
    return this.runSideActionIntent(
      requestedPaths[0],
      "notice.delete.failed",
      (executor, state) => {
        const requested = new Set(requestedPaths);
        const currentPaths = state.pendingRemoteDeletes.filter((item) => requested.has(item.path)).map((item) => item.path);
        return executor.confirmRemoteDeletes(currentPaths);
      }
    );
  }
  rejectRemoteDelete(path) {
    return this.runSideActionIntent(
      path,
      "notice.delete.failed",
      (executor) => executor.rejectRemoteDelete(path)
    );
  }
  dismissConflict(path) {
    return this.runSideActionIntent(
      path,
      "notice.conflict.failed",
      async (_executor, state) => state.removePendingConflict(path),
      true
    );
  }
  createSyncCallbacks(mode) {
    return {
      onProgress: (current, total, currentFile) => {
        this.handleProgress(current, total, currentFile);
        this.updateStatusBar();
        this.syncView?.render();
      },
      onFileProgress: (downloaded, total) => {
        this.handleFileProgress(downloaded, total);
      },
      onFileComplete: (path, actionType, success, reason, fileSize) => {
        this.handleFileComplete(path, actionType, success, reason, fileSize);
      },
      onFirstSyncPreview: mode === "first" ? async (plan) => this.showPlanAlert("firstSync", plan) : void 0,
      onConfirmThreshold: mode === "auto" ? async () => false : async (plan) => this.showPlanAlert("threshold", plan),
      onStateChange: () => {
        this.updateStatusBar();
        this.syncView?.render();
      }
    };
  }
  async dispatchSyncRun(request) {
    if (!this.syncExecutor) return null;
    this.progressStore.markStarted();
    this.beginSyncNotice();
    const result = await this.syncExecutor.run(
      request.mode,
      this.createSyncCallbacks(request.mode),
      request.skipConfirmation ?? false,
      request.reviewedAuthorization,
      request.options ?? {}
    );
    if (request.logLabel) {
      this.diag.log("execute", `${request.logLabel}: ${result.message}`);
    }
    await this.handleSyncResult(result, request.mode);
    if (request.renderAfter) this.syncView?.render();
    return result;
  }
  /** Execute a sync after the user has reviewed the plan in the sidebar.
   *  The reviewed digest may become stale before execution; in that case the
   *  executor sends the replacement plan back through the normal alert path. */
  async executePlanReview() {
    if (!this.syncExecutor || !this.state) return;
    if (this.acquireOpLock("sync")) return;
    try {
      await this.ensureStateLoaded();
      if (!this.state.planReviewActive) return;
      if (!await this.checkAccountBinding()) return;
      const reviewedAuthorization = this.state.planReviewAuthorization ?? void 0;
      await this.dispatchSyncRun({
        mode: "manual",
        skipConfirmation: true,
        reviewedAuthorization,
        logLabel: "plan review execution result",
        renderAfter: true
      });
    } finally {
      this.releaseOpLock();
    }
  }
  async rebuildPlanReview() {
    if (!this.state || !this.syncExecutor || this.syncExecutor.isRunning) return;
    await this.ensureStateLoaded();
    await this.state.clearPlanReview();
    await this.startFirstSync();
  }
  hasCompletedSyncState() {
    const baseCount = this.state?.baseSnapshot?.length ?? 0;
    return (this.state?.lastSyncTime ?? 0) > 0 || baseCount > 0;
  }
  /** Verify the current account matches the vault's bound identity.
   *  First sync ever silently binds. Account mismatch → Notice + block.
   *  Returns true if sync may proceed. */
  async checkAccountBinding() {
    const currentId = this.auth?.authState.accountId;
    if (!currentId) return false;
    const bound = this.state?.boundAccountId;
    if (!bound) {
      this.operationLifecycle.invalidate("account-binding-change");
      await this.state?.bindAccount(currentId);
      return true;
    }
    if (bound !== currentId) {
      this.noticeCenter.show({
        key: "account-mismatch",
        message: this.i18n.t("notice.accountMismatch", {
          bound: `${bound.slice(0, 8)}\u2026`,
          current: `${currentId.slice(0, 8)}\u2026`
        }),
        priority: NOTICE_PRIORITY.critical
      });
      this.diag.warn("lifecycle", `account mismatch \u2014 bound=${bound.slice(0, 8)}, current=${currentId.slice(0, 8)}`);
      return false;
    }
    return true;
  }
  /** Ensure StateManager has been loaded from disk.
   *  Idempotent — only calls load() on the first invocation. */
  async ensureStateLoaded() {
    if (this._stateLoaded || !this.state) return;
    this.stateLoadPromise ??= this.state.load().then(() => {
      this._stateLoaded = true;
    }).finally(() => {
      this.stateLoadPromise = null;
    });
    await this.stateLoadPromise;
  }
  /** Start a first sync (manual trigger from settings) */
  async startFirstSync(options = {}) {
    if (!this.syncExecutor) return;
    if (this.acquireOpLock("sync")) return;
    try {
      await this.ensureStateLoaded();
      if (!await this.checkAccountBinding()) return;
      if (this.state?.planReviewActive) {
        await this.activateSyncView();
        this.syncView?.render();
        return;
      }
      await this.activateSyncView();
      await this.dispatchSyncRun({
        mode: "first",
        options,
        logLabel: "first sync result"
      });
    } finally {
      this.releaseOpLock();
    }
  }
  /** Start a manual sync */
  async startManualSync() {
    if (!this.syncExecutor) return;
    if (!this.hasCompletedSyncState() && !(this.state?.planReviewActive ?? false)) {
      await this.startFirstSync();
      return;
    }
    if (this.acquireOpLock("sync")) return;
    try {
      await this.ensureStateLoaded();
      if (!await this.checkAccountBinding()) return;
      const skipConfirmation = this.state?.planReviewActive ?? false;
      const reviewedAuthorization = skipConfirmation ? this.state?.planReviewAuthorization ?? void 0 : void 0;
      await this.dispatchSyncRun({
        mode: "manual",
        skipConfirmation,
        reviewedAuthorization,
        logLabel: "manual sync result"
      });
    } finally {
      this.releaseOpLock();
    }
  }
  /**
   * Persist the plan's conflict and delete items to state, then show
   * a lightweight alert. Sync pauses until the user clicks "确认执行"
   * in the sidebar. Returns false to indicate the sync should pause.
   */
  async showPlanAlert(_kind, plan) {
    const t = this.i18n.t.bind(this.i18n);
    const conflictItems = plan.items.filter((i) => i.type === "conflict" /* Conflict */);
    const counts = {
      uploads: plan.items.filter((i) => i.type === "upload" /* Upload */).length,
      downloads: plan.items.filter((i) => i.type === "download" /* Download */).length,
      deletes: plan.items.filter((i) => i.type === "deleteRemote" /* DeleteRemote */ || i.type === "deleteLocal" /* DeleteLocal */ || i.type === "confirmLocalDelete" /* ConfirmLocalDelete */).length,
      conflicts: conflictItems.length,
      skipped: plan.items.filter((i) => i.type === "skipLargeFile" /* SkipLargeFile */ || i.type === "skipIgnoredPath" /* SkipIgnoredPath */).length
    };
    if (!plan.scope) {
      throw new Error("Cannot persist a plan review without a complete sync scope");
    }
    await this.state.setPlanReviewBundle(plan.items, counts, plan.scope);
    this.updateStatusBar();
    this.syncView?.render();
    const modal = new SyncPlanAlertModal(
      this.app,
      t("syncPlan.readyTitle"),
      t("syncPlan.readyMessage"),
      t("syncPlan.viewButton"),
      () => {
        void this.activateSyncView();
      }
    );
    modal.open();
    return false;
  }
  // ---- Progress helpers ----
  shouldSuppressSyncNotice() {
    const leftSidebar = this.app.workspace.leftSplit;
    if (!leftSidebar) return false;
    const easySyncViewVisibleInLeftSidebar = this.app.workspace.getLeavesOfType(SYNC_VIEW_TYPE).some((leaf) => {
      const parent = leaf.parent;
      const belongsToLeftSidebar = parent === leftSidebar || parent.parent === leftSidebar;
      return belongsToLeftSidebar && leaf.view.containerEl.isShown();
    });
    return shouldSuppressSyncNoticeForVisibleSidebar({
      leftSidebarCollapsed: leftSidebar.collapsed,
      easySyncViewVisibleInLeftSidebar
    });
  }
  clearSyncLifecycleNotice() {
    const activeKey = this.noticeCenter.activeKey;
    this.noticeCenter.clear(SYNC_PROGRESS_NOTICE_KEY);
    if (activeKey?.startsWith("sync-result:")) this.noticeCenter.clear(activeKey);
  }
  refreshSyncNoticeVisibility() {
    if (this.shouldSuppressSyncNotice()) {
      this.syncNoticeSignature = null;
      this.clearSyncLifecycleNotice();
      return;
    }
    if (this.syncExecutor?.isRunning) this.renderSyncNoticeProgress();
  }
  beginSyncNotice() {
    compatCancelAnimationFrame(this.syncNoticeFrame);
    this.syncNoticeFrame = null;
    if (this.shouldSuppressSyncNotice()) {
      this.syncNoticeSignature = null;
      this.clearSyncLifecycleNotice();
      return;
    }
    const label = this.i18n.t("notice.sync.start");
    this.syncNoticeSignature = `start:${label}`;
    this.noticeCenter.show({
      key: SYNC_PROGRESS_NOTICE_KEY,
      message: () => createSyncProgressNoticeMessage(label, 0, false, false),
      priority: NOTICE_PRIORITY.progress,
      durationMs: 0,
      className: "easy-sync-notice-progress",
      resumable: true
    });
  }
  scheduleSyncNoticeUpdate() {
    if (this.syncNoticeFrame !== null) return;
    this.syncNoticeFrame = compatRequestAnimationFrame(() => {
      this.syncNoticeFrame = null;
      if (this.syncExecutor?.isRunning) this.renderSyncNoticeProgress();
    });
  }
  renderSyncNoticeProgress() {
    if (this.shouldSuppressSyncNotice()) {
      this.syncNoticeSignature = null;
      this.clearSyncLifecycleNotice();
      return;
    }
    const progress = this.progressStore.state;
    const presentation = resolveSyncProgressNoticePresentation(progress);
    const t = this.i18n.t.bind(this.i18n);
    const label = formatSyncProgressNoticeLabel(presentation, t);
    const signature = [
      presentation.kind,
      presentation.activity.kind,
      label,
      presentation.percent,
      presentation.determinate,
      presentation.showProgressBar
    ].join(":");
    if (signature === this.syncNoticeSignature) return;
    this.syncNoticeSignature = signature;
    this.noticeCenter.show({
      key: SYNC_PROGRESS_NOTICE_KEY,
      message: () => createSyncProgressNoticeMessage(
        label,
        presentation.percent,
        presentation.determinate,
        presentation.showProgressBar
      ),
      priority: NOTICE_PRIORITY.progress,
      durationMs: 0,
      className: "easy-sync-notice-progress",
      resumable: true
    });
  }
  finishSyncNotice(result) {
    compatCancelAnimationFrame(this.syncNoticeFrame);
    this.syncNoticeFrame = null;
    this.syncNoticeSignature = null;
    const suppressNotice = this.shouldSuppressSyncNotice();
    this.clearSyncLifecycleNotice();
    const outcome = resolveSyncNoticeOutcome(result, {
      pausedForReview: result.message === this.i18n.t("result.pausedForReview"),
      cancelled: result.message === this.i18n.t("result.cancelled")
    });
    if (!outcome || suppressNotice) return;
    const messageKeys = {
      completed: "notice.sync.completed",
      conflicts: "notice.sync.conflicts",
      review: "notice.sync.review",
      cancelled: "notice.sync.cancelled",
      failed: "notice.sync.failed",
      authExpired: "notice.sync.authExpired"
    };
    const priorities = {
      completed: NOTICE_PRIORITY.info,
      conflicts: NOTICE_PRIORITY.attention,
      review: NOTICE_PRIORITY.attention,
      cancelled: NOTICE_PRIORITY.action,
      failed: NOTICE_PRIORITY.failure,
      authExpired: NOTICE_PRIORITY.critical
    };
    this.noticeCenter.show({
      key: `sync-result:${outcome.kind}`,
      message: this.i18n.t(messageKeys[outcome.kind], { count: outcome.count }),
      priority: priorities[outcome.kind],
      durationMs: SYNC_RESULT_NOTICE_DURATION_MS,
      className: "easy-sync-notice-result"
    });
  }
  /** Forward progress from executor to the store for sync-view display.
   *  Phase and progress are set directly by the executor on the store;
   *  this callback only triggers UI refresh. */
  handleProgress(_current, _total, _currentFile) {
    this.scheduleSyncNoticeUpdate();
  }
  /** Track byte-level progress for the current file download */
  handleFileProgress(downloaded, total) {
    this.progressStore?.setByteProgress(downloaded, total);
    this.syncView?.render();
    this.scheduleSyncNoticeUpdate();
  }
  /** Track a completed file in the progress store */
  handleFileComplete(path, actionType, success, reason, fileSize) {
    const status = success ? SyncProgressStore.actionToStatus(actionType) : "error";
    this.progressStore.completeCurrentItem();
    this.progressStore.addCompletedFile({ path, status, actionType, reason, fileSize });
    this.scheduleSyncNoticeUpdate();
  }
  async cancelSync() {
    if (!this.syncExecutor?.isRunning) return;
    this.progressStore.requestCancel();
    this.scheduleSyncNoticeUpdate();
    this.syncExecutor.invalidateLifecycle("cancel");
    this.diag.log("execute", "sync cancellation requested, waiting for drain...");
    this.updateStatusBar();
    this.syncView?.render();
    const deadline = Date.now() + 3e4;
    while (this.syncExecutor.isRunning && Date.now() < deadline) {
      await new Promise((resolve) => compatSetTimeout(() => resolve(), 100));
    }
    if (this.syncExecutor.isRunning) {
      this.diag.warn("execute", "sync did not drain within 30s timeout");
    } else {
      this.diag.log("execute", "sync drained after cancellation");
    }
    this.updateStatusBar();
    this.syncView?.render();
  }
  async invalidateAndDrainSyncActivity(reason) {
    const executor = this.syncExecutor;
    if (!executor) {
      this.operationLifecycle.invalidate(reason);
      return true;
    }
    if (executor.isRunning) {
      this.progressStore.requestCancel();
    }
    executor.invalidateLifecycle(reason);
    const deadline = Date.now() + 3e4;
    while ((executor.hasActivityInFlight || this.opLock !== null) && Date.now() < deadline) {
      await new Promise((resolve) => compatSetTimeout(() => resolve(), 100));
    }
    if (executor.hasActivityInFlight || this.opLock !== null) {
      this.diag.warn("lifecycle", `${reason} blocked because old sync work did not drain within 30s`);
      return false;
    }
    return true;
  }
  /** Reset sync state safely — cancels running sync, acquires lock, clears state. */
  async resetSyncState() {
    if (!await this.invalidateAndDrainSyncActivity("reset")) {
      this.noticeCenter.show({
        key: "reset-lock-busy",
        message: this.i18n.t("result.lockBusy"),
        priority: NOTICE_PRIORITY.attention
      });
      return;
    }
    const holder = this.acquireOpLock("reset");
    if (holder) {
      this.noticeCenter.show({
        key: "reset-lock-busy",
        message: this.i18n.t("result.lockBusy"),
        priority: NOTICE_PRIORITY.attention
      });
      return;
    }
    try {
      await this.ensureStateLoaded();
      await this.state?.reset();
      await this.scanner?.clearScanCache();
      this.noticeCenter.show({
        key: "reset-complete",
        message: this.i18n.t("settings.reset.done"),
        priority: NOTICE_PRIORITY.action
      });
      this.updateStatusBar();
      this.syncView?.render();
    } finally {
      this.releaseOpLock();
    }
  }
  /** Log out safely — cancels running sync, acquires lock, clears auth. */
  async logoutUser() {
    if (!await this.invalidateAndDrainSyncActivity("logout")) {
      this.noticeCenter.show({
        key: "logout-lock-busy",
        message: this.i18n.t("result.lockBusy"),
        priority: NOTICE_PRIORITY.attention
      });
      return;
    }
    const holder = this.acquireOpLock("logout");
    if (holder) {
      this.noticeCenter.show({
        key: "logout-lock-busy",
        message: this.i18n.t("result.lockBusy"),
        priority: NOTICE_PRIORITY.attention
      });
      return;
    }
    try {
      await this.auth?.logout();
    } finally {
      this.releaseOpLock();
    }
  }
  async handleSyncResult(result, mode) {
    this.finishSyncNotice(result);
    await this.recordSyncHistory(result, mode);
    const harmlessRejectedRun = result.message === this.i18n.t("result.alreadyRunning");
    const pauseAutoSync = !result.success && !harmlessRejectedRun || result.errors > 0 || result.authExpired || result.message === this.i18n.t("result.cancelled") || result.message === this.i18n.t("result.pausedForReview") || (this.state?.planReviewActive ?? false);
    if (pauseAutoSync) {
      this.autoSyncPaused = true;
      this.stopAutoSync();
      await this.saveSyncSettings();
      this.diag.warn("execute", `auto sync paused after incomplete run: ${result.message}`);
      this.clearRibbonSuccess();
      this.updateStatusBar();
      this.syncView?.render();
      return;
    }
    if (result.success && result.deferred === 0 && this.autoSyncPaused) {
      this.autoSyncPaused = false;
      await this.saveSyncSettings();
      this.startAutoSync();
    }
    if (result.success && mode === "auto") {
      this.startAutoSync();
    }
    if (result.success && result.deferred === 0) this.showRibbonSuccess();
    else this.clearRibbonSuccess();
    this.updateStatusBar();
    this.syncView?.render();
  }
  async recordSyncHistory(result, mode) {
    if (!this.state) return;
    const progress = this.progressStore.state;
    if (progress.startedAt <= 0 || result.message === this.i18n.t("result.pausedForReview") || result.message === this.i18n.t("result.alreadyRunning")) {
      return;
    }
    const endedAt = Date.now();
    const status = result.success ? result.deferred > 0 ? "partial" : "success" : result.message === this.i18n.t("result.cancelled") ? "cancelled" : result.authExpired ? "authExpired" : result.errors > 0 ? "partial" : "failed";
    try {
      await this.state.addSyncHistory({
        id: `${progress.startedAt}-${endedAt}`,
        mode,
        status,
        startedAt: progress.startedAt,
        endedAt,
        uploaded: result.uploaded,
        downloaded: result.downloaded,
        deleted: result.deleted,
        conflicts: result.conflicts,
        deferred: result.deferred,
        skipped: result.skippedLarge + result.skippedIgnored,
        skippedLarge: result.skippedLarge,
        skippedIgnored: result.skippedIgnored,
        errors: result.errors,
        message: result.message,
        files: [...progress.completedFiles],
        uploadBytes: result.metrics?.uploadBytes,
        uploadReadMs: result.metrics?.uploadReadMs,
        uploadNetworkMs: result.metrics?.uploadNetworkMs,
        peakUploads: result.metrics?.peakUploads
      });
    } catch (error) {
      this.diag.warn(
        "state",
        `sync history save failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
  // ---- Auto-sync ----
  markLocalDirtyHint(path, oldPath) {
    if (this.syncInterval <= 0 || this.autoSyncPaused) return;
    const currentIncluded = this.scanner?.shouldSyncPath(path) === true;
    const previousIncluded = oldPath !== void 0 && this.scanner?.shouldSyncPath(oldPath) === true;
    if (!currentIncluded && !previousIncluded) return;
    if (this.autoSyncDirtyHint.mark()) {
      this.diag.log("execute", "local dirty hint scheduled normal auto sync", {
        debounceMs: LOCAL_DIRTY_DEBOUNCE_MS,
        scopeMatch: currentIncluded ? "current" : "previous"
      });
    }
  }
  /** Shared activity-gated entry for periodic reconciliation and dirty hints. */
  async runAutomaticSync(trigger) {
    if (this.syncInterval <= 0 || this.autoSyncPaused) return true;
    if (!this.auth?.authState.isLoggedIn) return true;
    if (!this.syncExecutor) return false;
    if (this.opLock !== null || this.syncExecutor.isRunning) return false;
    if (this.acquireOpLock("sync")) return false;
    let dispatched = false;
    try {
      await this.ensureStateLoaded();
      if (!await this.checkAccountBinding()) return true;
      if (this.state?.planReviewActive) {
        this.diag.log("execute", `auto sync skipped \u2014 plan review pending (${trigger})`);
        return true;
      }
      this.diag.log("execute", `auto sync started \u2014 trigger=${trigger}`);
      dispatched = true;
      await this.dispatchSyncRun({ mode: "auto" });
      return true;
    } catch (error) {
      this.diag.warn(
        "execute",
        `auto sync setup failed \u2014 trigger=${trigger}`,
        error instanceof Error ? error.message : String(error)
      );
      return dispatched;
    } finally {
      this.releaseOpLock();
    }
  }
  startAutoSync() {
    if (this.autoSyncTimer) {
      compatClearInterval(this.autoSyncTimer);
      this.autoSyncTimer = null;
    }
    if (this.syncInterval <= 0 || this.autoSyncPaused) return;
    this.autoSyncTimer = compatSetInterval(() => {
      void this.runAutomaticSync("interval");
    }, this.syncInterval * 60 * 1e3);
  }
  stopAutoSync() {
    if (this.autoSyncTimer) {
      compatClearInterval(this.autoSyncTimer);
      this.autoSyncTimer = null;
    }
    this.autoSyncDirtyHint.cancel();
  }
  restartAutoSync() {
    this.stopAutoSync();
    this.startAutoSync();
  }
  // ---- Settings persistence ----
  async loadSyncSettings() {
    const data = await this.loadPluginData();
    if (data) {
      if (typeof data[KEY_SYNC_INTERVAL] === "number") this.syncInterval = data[KEY_SYNC_INTERVAL];
      if (typeof data[KEY_SYNC_PLUGIN_FILES] === "boolean") this.syncPluginFiles = data[KEY_SYNC_PLUGIN_FILES];
      if (typeof data[KEY_DIAG_LOG] === "boolean") this.diagLogEnabled = data[KEY_DIAG_LOG];
      if (typeof data[KEY_SYNC_EDITOR] === "boolean") this.syncEditorSettings = data[KEY_SYNC_EDITOR];
      if (typeof data[KEY_SYNC_APPEARANCE] === "boolean") this.syncAppearance = data[KEY_SYNC_APPEARANCE];
      if (typeof data[KEY_SYNC_THEMES] === "boolean") this.syncThemes = data[KEY_SYNC_THEMES];
      if (typeof data[KEY_SYNC_HOTKEYS] === "boolean") this.syncHotkeys = data[KEY_SYNC_HOTKEYS];
      if (typeof data[KEY_SYNC_CORE_PLUGINS] === "boolean") this.syncCorePlugins = data[KEY_SYNC_CORE_PLUGINS];
      if (typeof data[KEY_SYNC_COMMUNITY_PLUGINS] === "boolean") this.syncCommunityPlugins = data[KEY_SYNC_COMMUNITY_PLUGINS];
      if (typeof data[KEY_SYNC_PLUGIN_DATA] === "boolean") this.syncPluginData = data[KEY_SYNC_PLUGIN_DATA];
      this.excludedFolders = normalizeExcludedFolders(
        Array.isArray(data[KEY_SYNC_EXCLUDED_FOLDERS]) ? data[KEY_SYNC_EXCLUDED_FOLDERS] : [],
        getConfigDir(this.app.vault)
      );
      if (typeof data[KEY_AUTO_SYNC_PAUSED] === "boolean") this.autoSyncPaused = data[KEY_AUTO_SYNC_PAUSED];
      if (typeof data[KEY_MAX_FILE_SIZE_MB] === "number") this.syncMaxFileSizeMb = data[KEY_MAX_FILE_SIZE_MB];
      this.automaticHandlingPolicy = readAutomaticHandlingPolicy(
        data[KEY_AUTOMATIC_HANDLING_POLICY],
        data[KEY_LEGACY_AUTO_MERGE]
      );
    }
    this.applySyncPathSettings();
    this.applyMaxFileSize();
    this.applyDiagnosticSetting();
  }
  /** M14: serialized PluginData write. All callers (StateManager, settings,
   *  auth profile) mutate through this queue — no interleaved load-modify-save. */
  async updatePluginData(mutator) {
    const task = this.pluginDataQueue.then(async () => {
      const diagnosticsEnabled = this.diag.isEnabled("state");
      const totalStartedAt = diagnosticsEnabled ? performance.now() : 0;
      const committed = await this.ensurePluginDataCache();
      const data = committed === null ? {} : clonePluginData(committed);
      mutator(data);
      const prepareFinishedAt = diagnosticsEnabled ? performance.now() : 0;
      const measurementStartedAt = prepareFinishedAt;
      const measurement = diagnosticsEnabled ? measurePluginDataWrite(data) : null;
      const measurementFinishedAt = diagnosticsEnabled ? performance.now() : 0;
      const startedAt = diagnosticsEnabled ? performance.now() : 0;
      let saveMs = 0;
      let publishMs = 0;
      let success = false;
      try {
        const saveStartedAt = diagnosticsEnabled ? performance.now() : 0;
        try {
          await this.saveData(data);
        } finally {
          if (diagnosticsEnabled) saveMs = performance.now() - saveStartedAt;
        }
        const publishStartedAt = diagnosticsEnabled ? performance.now() : 0;
        this.pluginDataCache = data;
        if (diagnosticsEnabled) publishMs = performance.now() - publishStartedAt;
        success = true;
      } finally {
        if (measurement) {
          const finishedAt = performance.now();
          this.diag.log("state", "plugin data write", {
            ...measurement,
            elapsedMs: Number((finishedAt - startedAt).toFixed(3)),
            prepareMs: Number((prepareFinishedAt - totalStartedAt).toFixed(3)),
            measurementMs: Number((measurementFinishedAt - measurementStartedAt).toFixed(3)),
            saveMs: Number(saveMs.toFixed(3)),
            publishMs: Number(publishMs.toFixed(3)),
            totalMs: Number((finishedAt - totalStartedAt).toFixed(3)),
            success
          });
        }
      }
    });
    this.pluginDataQueue = task.catch(() => void 0);
    return task;
  }
  async loadPluginData() {
    const data = await this.ensurePluginDataCache();
    return data === null ? null : clonePluginData(data);
  }
  async ensurePluginDataCache() {
    if (this.pluginDataCache !== void 0) return this.pluginDataCache;
    this.pluginDataLoadPromise ??= this.loadData().then((data) => {
      this.pluginDataCache = isRecord(data) ? clonePluginData(data) : null;
      return this.pluginDataCache;
    }).finally(() => {
      this.pluginDataLoadPromise = null;
    });
    return this.pluginDataLoadPromise;
  }
  async saveSyncSettings() {
    await this.updatePluginData((data) => {
      data[KEY_SYNC_INTERVAL] = this.syncInterval;
      data[KEY_DIAG_LOG] = this.diagLogEnabled;
      this.writeSyncPathSettingsData(data, this.captureSyncPathSettings());
      data[KEY_AUTO_SYNC_PAUSED] = this.autoSyncPaused;
      data[KEY_MAX_FILE_SIZE_MB] = this.syncMaxFileSizeMb;
      data[KEY_AUTOMATIC_HANDLING_POLICY] = { ...this.automaticHandlingPolicy };
    });
  }
  captureSyncPathSettings() {
    return {
      syncPluginFiles: this.syncPluginFiles,
      syncEditorSettings: this.syncEditorSettings,
      syncAppearance: this.syncAppearance,
      syncThemes: this.syncThemes,
      syncHotkeys: this.syncHotkeys,
      syncCorePlugins: this.syncCorePlugins,
      syncCommunityPlugins: this.syncCommunityPlugins,
      syncPluginData: this.syncPluginData,
      excludedFolders: [...this.excludedFolders]
    };
  }
  writeSyncPathSettingsData(data, settings) {
    data[KEY_SYNC_PLUGIN_FILES] = settings.syncPluginFiles;
    data[KEY_SYNC_EDITOR] = settings.syncEditorSettings;
    data[KEY_SYNC_APPEARANCE] = settings.syncAppearance;
    data[KEY_SYNC_THEMES] = settings.syncThemes;
    data[KEY_SYNC_HOTKEYS] = settings.syncHotkeys;
    data[KEY_SYNC_CORE_PLUGINS] = settings.syncCorePlugins;
    data[KEY_SYNC_COMMUNITY_PLUGINS] = settings.syncCommunityPlugins;
    data[KEY_SYNC_PLUGIN_DATA] = settings.syncPluginData;
    data[KEY_SYNC_EXCLUDED_FOLDERS] = [...settings.excludedFolders];
  }
  publishSyncPathSettings(settings) {
    this.syncPluginFiles = settings.syncPluginFiles;
    this.syncEditorSettings = settings.syncEditorSettings;
    this.syncAppearance = settings.syncAppearance;
    this.syncThemes = settings.syncThemes;
    this.syncHotkeys = settings.syncHotkeys;
    this.syncCorePlugins = settings.syncCorePlugins;
    this.syncCommunityPlugins = settings.syncCommunityPlugins;
    this.syncPluginData = settings.syncPluginData;
    this.excludedFolders = [...settings.excludedFolders];
    this.applySyncPathSettings();
  }
  async updateSyncPathSettings(patch) {
    const previous = this.captureSyncPathSettings();
    const candidate = {
      ...previous,
      ...patch,
      excludedFolders: normalizeExcludedFolders(
        patch.excludedFolders ?? previous.excludedFolders,
        getConfigDir(this.app.vault)
      )
    };
    if (previous.syncPluginFiles === candidate.syncPluginFiles && previous.syncEditorSettings === candidate.syncEditorSettings && previous.syncAppearance === candidate.syncAppearance && previous.syncThemes === candidate.syncThemes && previous.syncHotkeys === candidate.syncHotkeys && previous.syncCorePlugins === candidate.syncCorePlugins && previous.syncCommunityPlugins === candidate.syncCommunityPlugins && previous.syncPluginData === candidate.syncPluginData && previous.excludedFolders.length === candidate.excludedFolders.length && previous.excludedFolders.every(
      (path, index) => path === candidate.excludedFolders[index]
    )) return;
    await this.ensureStateLoaded();
    if (this.syncExecutor?.hasActivityInFlight) {
      throw new SyncPathSettingsUpdateError("busy");
    }
    if (this.state?.hasMutationLedgerCorruption || (this.state?.mutationLedger.length ?? 0) > 0) {
      throw new SyncPathSettingsUpdateError("recovery");
    }
    const lockHolder = this.acquireOpLock("sync-path-settings");
    if (lockHolder !== null) {
      throw new SyncPathSettingsUpdateError("busy");
    }
    try {
      if (!this.state || !this.scanner) {
        throw new Error("Sync path state is unavailable");
      }
      await this.state.clearRemoteState();
      this.publishSyncPathSettings(candidate);
      await this.state.commitSyncPathSettingsChange(
        (path) => this.scanner.shouldSyncPath(path),
        (data) => this.writeSyncPathSettingsData(data, candidate)
      );
      this.updateStatusBar();
      this.syncView?.render();
      this.settingsTab?.refreshSyncState();
    } catch (error) {
      this.publishSyncPathSettings(previous);
      throw error;
    } finally {
      this.releaseOpLock();
    }
  }
  async updateExcludedFolders(excludedFolders) {
    await this.updateSyncPathSettings({
      excludedFolders: [...excludedFolders]
    });
  }
  async updateAutomaticHandlingPolicy(policy) {
    const previous = this.automaticHandlingPolicy;
    this.automaticHandlingPolicy = { ...policy };
    try {
      await this.saveSyncSettings();
    } catch (error) {
      this.automaticHandlingPolicy = previous;
      throw error;
    }
    this.syncExecutor?.setAutomaticHandlingPolicy(this.automaticHandlingPolicy);
    if (this.state?.planReviewActive) {
      await this.state.clearPlanReview();
    }
    this.updateStatusBar();
    this.syncView?.render();
    this.settingsTab?.refreshSyncState();
  }
  /** Apply the single effective local/remote path policy to the scanner. */
  applySyncPathSettings() {
    const paths = /* @__PURE__ */ new Set();
    const { configDir, pluginDir } = getEasySyncPaths(this.app.vault, this.manifest.id);
    const pluginDirPrefix = `${pluginDir}/`;
    if (this.syncPluginFiles) paths.add(pluginDirPrefix);
    if (this.syncEditorSettings) paths.add(`${configDir}/app.json`);
    if (this.syncAppearance) paths.add(`${configDir}/appearance.json`);
    if (this.syncThemes) {
      paths.add(`${configDir}/themes/`);
      paths.add(`${configDir}/snippets/`);
    }
    if (this.syncHotkeys) paths.add(`${configDir}/hotkeys.json`);
    if (this.syncCorePlugins) paths.add(`${configDir}/core-plugins.json`);
    if (this.syncCommunityPlugins) {
      paths.add(`${configDir}/community-plugins.json`);
      paths.add(`${configDir}/plugins/`);
    }
    if (this.syncPluginData) {
      paths.add(`${configDir}/plugins/`);
    }
    this.scanner?.setConfig({
      includePaths: [...paths],
      excludedFolders: [...this.excludedFolders],
      includePluginCode: this.syncCommunityPlugins,
      includePluginData: this.syncPluginData
    });
  }
  /** Apply diagnostic logging setting. Public so settings-tab can call it. */
  applyDiagnosticSetting() {
    if (this.diagLogEnabled) {
      this.diag.enableAll();
    } else {
      this.diag.clear();
    }
  }
  /** Generate a diagnostic report Markdown file in the vault root.
   *  Collects recent anomalies from state and diagnostic buffer. */
  async generateDiagnosticReport() {
    const now = /* @__PURE__ */ new Date();
    const pad = (n) => String(n).padStart(2, "0");
    const tsFile = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
    const fileName2 = `EasySync \u8BCA\u65AD\u62A5\u544A ${tsFile}.md`;
    const fmt = (ts) => {
      if (!ts) return "\u2014";
      const d = new Date(ts);
      return `${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };
    const fmtShort = (ts) => {
      if (!ts) return "\u2014";
      const d = new Date(ts);
      return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    };
    const auth = this.auth?.authState;
    const reportState = this.state;
    const reportScope = reportState?.remoteScope;
    const [accountFingerprint, driveFingerprint, vaultFingerprint, filesRootFingerprint] = await Promise.all([
      fingerprintOpaqueValue(reportScope?.accountId || reportState?.boundAccountId),
      fingerprintOpaqueValue(reportScope?.driveId),
      fingerprintOpaqueValue(reportScope?.vaultFolderId),
      fingerprintOpaqueValue(reportScope?.filesRootId)
    ]);
    const { pluginDir } = getEasySyncPaths(this.app.vault, this.manifest.id);
    let buildFingerprint = "\u4E0D\u53EF\u7528";
    try {
      const mainPath = `${pluginDir}/main.js`;
      const [mainRaw, mainStat] = await Promise.all([
        this.app.vault.adapter.readBinary(mainPath),
        this.app.vault.adapter.stat(mainPath)
      ]);
      const mainHash = await sha256Hex(mainRaw);
      buildFingerprint = `sha256:${mainHash.slice(0, 16)} (${mainRaw.byteLength}B, mtime ${fmt(mainStat?.mtime ?? 0)})`;
    } catch {
    }
    const lines = [];
    lines.push("# EasySync \u8BCA\u65AD\u62A5\u544A");
    lines.push("");
    lines.push(`**\u751F\u6210\u65F6\u95F4**: ${fmt(now.getTime())}`);
    lines.push(`**\u63D2\u4EF6\u7248\u672C**: ${this.manifest.version}`);
    lines.push(`**\u4ED3\u5E93\u540D**: ${this.app.vault.getName()}`);
    lines.push(`**\u767B\u5F55\u8D26\u53F7**: ${auth?.isLoggedIn ? auth.displayName || "\u5DF2\u767B\u5F55" : "\u672A\u767B\u5F55"}`);
    lines.push(`**\u6784\u7B51\u7269\u6307\u7EB9**: ${buildFingerprint}`);
    if (this.syncInterval > 0) {
      lines.push(`**\u81EA\u52A8\u540C\u6B65**: ${this.autoSyncPaused ? "\u5DF2\u6682\u505C" : `\u8FD0\u884C\u4E2D\uFF08\u6BCF ${this.syncInterval} \u5206\u949F\uFF09`}`);
    } else {
      lines.push("**\u81EA\u52A8\u540C\u6B65**: \u5DF2\u5173\u95ED");
    }
    const automaticActivity = this.syncExecutor?.isRunning ? "\u540C\u6B65\u4E2D" : this.opLock !== null ? "\u5176\u4ED6\u64CD\u4F5C\u5360\u7528\u4E2D" : "\u7A7A\u95F2";
    lines.push(`**\u81EA\u52A8\u540C\u6B65\u89E6\u53D1**: \u672C\u5730\u53D8\u66F4 ${this.autoSyncDirtyHint.pending ? "\u7B49\u5F85\u91CD\u8BD5" : "\u65E0\u7B49\u5F85"} / \u5F53\u524D ${automaticActivity}`);
    const platformLabel = import_obsidian15.Platform.isIosApp ? "iOS" : import_obsidian15.Platform.isAndroidApp ? "Android" : import_obsidian15.Platform.isMobile ? "Mobile" : "Desktop";
    lines.push(`**\u5E73\u53F0**: ${platformLabel}`);
    lines.push(`**\u4E0A\u6B21\u540C\u6B65**: ${fmt(this.state?.lastSyncTime ?? 0)}`);
    lines.push(`**\u8FDC\u7AEF\u5FEB\u7167**: generation ${reportState?.remoteGeneration ?? 0}`);
    lines.push(`**\u6700\u8FD1\u540C\u6B65\u8BB0\u5F55 ID**: ${reportState?.syncHistory?.[0]?.id ?? "\u2014"}`);
    lines.push(`**\u540C\u6B65\u8303\u56F4\u6307\u7EB9**: account ${accountFingerprint} / drive ${driveFingerprint} / vault ${vaultFingerprint} / files ${filesRootFingerprint}`);
    lines.push(`**\u72B6\u6001\u89C4\u6A21**: \u57FA\u7EBF ${reportState?.baseSnapshot.length ?? 0} / \u8FDC\u7AEF\u6587\u4EF6 ${reportState?.remoteSnapshot.length ?? 0} / \u8FDC\u7AEF\u76EE\u5F55 ${reportState?.remoteFolders.length ?? 0} / \u51B2\u7A81 ${reportState?.pendingConflicts.length ?? 0} / \u5F85\u5220\u9664 ${reportState?.pendingRemoteDeletes.length ?? 0} / \u4F20\u8F93\u5F02\u5E38 ${reportState?.pendingIssues.length ?? 0}`);
    lines.push(`**\u589E\u91CF\u6E38\u6807**: ${reportState?.remoteDeltaLink ? "\u5DF2\u4FDD\u5B58" : "\u65E0"}`);
    lines.push(`**\u8BA1\u5212\u5BA1\u9605**: ${reportState?.planReviewActive ? `\u7B49\u5F85\u786E\u8BA4\uFF08revision ${reportState.planReviewRevision}\uFF09` : "\u65E0"}`);
    lines.push(`**\u81EA\u52A8\u5904\u7406\u914D\u7F6E**: \u5C06\u8FDC\u7AEF\u5220\u9664\u540C\u6B65\u5230\u672C\u5730 ${this.automaticHandlingPolicy.autoDeleteLocalFiles ? "\u5F00\u542F" : "\u5173\u95ED"} / \u5408\u5E76\u4E0D\u91CD\u53E0\u7684\u6587\u672C\u4FEE\u6539 ${this.automaticHandlingPolicy.mergeNonOverlappingText ? "\u5F00\u542F" : "\u5173\u95ED"}`);
    const configSyncLabels = [
      [this.syncEditorSettings, "\u7F16\u8F91\u5668\u8BBE\u7F6E"],
      [this.syncAppearance, "\u5916\u89C2"],
      [this.syncThemes, "\u4E3B\u9898"],
      [this.syncHotkeys, "\u5FEB\u6377\u952E"],
      [this.syncCorePlugins, "\u6838\u5FC3\u63D2\u4EF6"],
      [this.syncCommunityPlugins, "\u793E\u533A\u63D2\u4EF6"],
      [this.syncPluginData, "\u63D2\u4EF6\u6570\u636E"],
      [this.syncPluginFiles, "EasySync \u63D2\u4EF6\u6587\u4EF6"]
    ];
    lines.push(`**\u5DF2\u542F\u7528\u914D\u7F6E\u540C\u6B65**: ${configSyncLabels.filter(([enabled]) => enabled).map(([, label]) => label).join("\u3001") || "\u65E0"}`);
    lines.push(`**\u672C\u673A\u540C\u6B65\u6392\u9664**: ${this.excludedFolders.length} \u4E2A`);
    if (this.excludedFolders.length > 0) {
      lines.push("");
      for (const path of this.excludedFolders) {
        lines.push(`- \`${path.replace(/`/g, "\\`")}\``);
      }
    }
    lines.push("");
    const history = this.state?.syncHistory ?? [];
    lines.push("## \u8FD1\u671F\u540C\u6B65\u8BB0\u5F55");
    lines.push("");
    if (history.length === 0) {
      lines.push("*\u6682\u65E0\u540C\u6B65\u8BB0\u5F55*");
    } else {
      lines.push("| \u65F6\u95F4 | \u6A21\u5F0F | \u72B6\u6001 | \u8017\u65F6 | \u4E0A\u4F20 | \u4E0B\u8F7D | \u5220\u9664 | \u51B2\u7A81 | \u5EF6\u540E | \u8DF3\u8FC7(L/I) | \u9519\u8BEF |");
      lines.push("|------|------|------|------|------|------|------|------|------|-----------|------|");
      for (const h of history) {
        const mode = h.mode === "manual" ? "\u624B\u52A8" : h.mode === "auto" ? "\u81EA\u52A8" : "\u9996\u6B21";
        const statusMap = { success: "\u5DF2\u5B8C\u6210", partial: "\u90E8\u5206\u5B8C\u6210", cancelled: "\u5DF2\u53D6\u6D88", authExpired: "\u767B\u5F55\u8FC7\u671F", failed: "\u5931\u8D25" };
        const status = statusMap[h.status] ?? h.status;
        const duration = h.endedAt > 0 && h.startedAt > 0 ? `${Math.round((h.endedAt - h.startedAt) / 1e3)}s` : "\u2014";
        const skipLarge = h.skippedLarge ?? 0;
        const skipIgnored = h.skippedIgnored ?? 0;
        lines.push(`| ${fmt(h.startedAt)} | ${mode} | ${status} | ${duration} | ${h.uploaded} | ${h.downloaded} | ${h.deleted} | ${h.conflicts} | ${h.deferred ?? 0} | ${skipLarge}/${skipIgnored} | ${h.errors} |`);
      }
    }
    lines.push("");
    const formatSize3 = (bytes) => {
      if (bytes === void 0 || bytes === null) return "?";
      if (bytes < 1024) return `${bytes}B`;
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
      return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
    };
    const actionLabels = {
      upload: "\u4E0A\u4F20",
      download: "\u4E0B\u8F7D",
      deleteRemote: "\u8FDC\u7AEF\u5220\u9664",
      confirmLocalDelete: "\u786E\u8BA4\u672C\u5730\u5220\u9664",
      conflict: "\u51B2\u7A81",
      skipLargeFile: "\u8DF3\u8FC7\u5927\u6587\u4EF6",
      skipIgnoredPath: "\u8DF3\u8FC7\u5FFD\u7565\u8DEF\u5F84",
      retryLater: "\u7A0D\u540E\u91CD\u8BD5",
      renameRemote: "\u8FDC\u7AEF\u91CD\u547D\u540D",
      authExpired: "\u767B\u5F55\u8FC7\u671F"
    };
    const failedFiles = history.filter((h) => h.status === "partial" || h.status === "failed").flatMap((h) => (h.files ?? []).filter((f) => f.status === "error").map((f) => ({ ...f, historyStartedAt: h.startedAt })));
    if (failedFiles.length > 0) {
      lines.push("### \u5931\u8D25\u6587\u4EF6\u660E\u7EC6");
      lines.push("");
      for (const f of failedFiles) {
        const action = actionLabels[f.actionType ?? ""] ?? f.actionType ?? "\u2014";
        const size = formatSize3(f.fileSize);
        lines.push(`- \`${f.path}\` (${size}) \u2014 ${action} (${f.reason ?? "\u672A\u77E5\u9519\u8BEF"}) \u2014 ${fmtShort(f.historyStartedAt)}`);
      }
      lines.push("");
    }
    const issues = this.state?.pendingIssues ?? [];
    const conflicts = this.state?.pendingConflicts ?? [];
    const deletes = this.state?.pendingRemoteDeletes ?? [];
    lines.push("## \u5F53\u524D\u5F85\u5904\u7406\u95EE\u9898");
    lines.push("");
    const failures = issues.filter((i) => i.actionType !== "skipLargeFile" /* SkipLargeFile */);
    if (failures.length > 0) {
      lines.push(`### \u4F20\u8F93\u5F02\u5E38\uFF08${failures.length}\uFF09`);
      lines.push("");
      lines.push("| \u6587\u4EF6 | \u5927\u5C0F | \u64CD\u4F5C | \u539F\u56E0 | \u6700\u540E\u5C1D\u8BD5 |");
      lines.push("|------|------|------|------|----------|");
      for (const f of failures) {
        const action = actionLabels[f.actionType ?? ""] ?? f.actionType ?? "\u2014";
        lines.push(`| ${f.path} | ${formatSize3(f.fileSize)} | ${action} | ${f.reason ?? "\u2014"} | ${fmtShort(f.updatedAt)} |`);
      }
    } else {
      lines.push("*\u65E0\u4F20\u8F93\u5F02\u5E38*");
    }
    lines.push("");
    if (conflicts.length > 0) {
      lines.push(`### \u5F85\u5904\u7406\u51B2\u7A81\uFF08${conflicts.length}\uFF09`);
      lines.push("");
      for (const c of conflicts) {
        const evidence = buildConflictEvidence(c, reportState?.getBaseEntry(c.path));
        const eTagFingerprint = await fingerprintOpaqueValue(evidence.remoteETag);
        const reasonCode = c.reason ?? "conflict";
        const reasonText = c.reason ? this.i18n.t(c.reason) : "\u51B2\u7A81";
        lines.push(`- \`${c.path}\` \u2014 ${reasonText} (${reasonCode})`);
        lines.push(`  - \u5224\u7B49\u8BC1\u636E: ${evidence.equalityStatus} / ${evidence.equalityProof}; decision token: ${evidence.hasDecisionToken ? "\u6709" : "\u65E0"}`);
        lines.push(`  - \u672C\u5730: ${formatSize3(evidence.localSize)}, mtime ${fmt(evidence.localMtime ?? 0)}, sha256 ${evidence.localHash}`);
        lines.push(`  - \u8FDC\u7AEF: ${formatSize3(evidence.remoteSize)}, mtime ${fmt(evidence.remoteMtime ?? 0)}, sha256 ${evidence.remoteSha256}, eTag ${eTagFingerprint}`);
      }
    } else {
      lines.push("### \u5F85\u5904\u7406\u51B2\u7A81\uFF080\uFF09");
      lines.push("");
      lines.push("*\u65E0*");
    }
    lines.push("");
    if (deletes.length > 0) {
      lines.push(`### \u5F85\u786E\u8BA4\u5220\u9664\uFF08${deletes.length}\uFF09`);
      lines.push("");
      for (const d of deletes) lines.push(`- \`${d.path}\` \u2014 ${d.reason ?? "\u5DF2\u5728\u8FDC\u7AEF\u5220\u9664"}`);
    } else {
      lines.push("### \u5F85\u786E\u8BA4\u5220\u9664\uFF080\uFF09");
      lines.push("");
      lines.push("*\u65E0*");
    }
    lines.push("");
    const diagAll = await this.diag.snapshot(500);
    const latestAutomaticHandlingSummary = findLatestAutomaticHandlingSummary(diagAll);
    const currentRecoverySummary = summarizeMutationRecovery(
      reportState?.mutationLedger ?? []
    );
    const latestPhaseSummary = findLatestPhaseSummary(diagAll);
    const latestNetworkSummary = findLatestNetworkSummary(diagAll);
    const latestTransferSummary = findLatestTransferSummary(diagAll);
    lines.push("## \u81EA\u52A8\u5904\u7406\u4E0E\u6062\u590D\u6458\u8981");
    lines.push("");
    lines.push("**\u5F53\u524D\u6062\u590D\u8D26\u672C**:");
    lines.push("```json");
    lines.push(formatDiagData(currentRecoverySummary));
    lines.push("```");
    if (latestAutomaticHandlingSummary) {
      lines.push("");
      lines.push(`**\u6700\u8FD1\u4E00\u8F6E\u81EA\u52A8\u5904\u7406**\uFF08${fmt(latestAutomaticHandlingSummary.ts)}\uFF09:`);
      lines.push("```json");
      lines.push(formatDiagData(latestAutomaticHandlingSummary.data));
      lines.push("```");
    } else {
      lines.push("");
      lines.push("*\u6682\u65E0\u7ED3\u6784\u5316\u81EA\u52A8\u5904\u7406\u6458\u8981\uFF1B\u5F00\u542F\u8BCA\u65AD\u65E5\u5FD7\u5E76\u5B8C\u6210\u4E00\u8F6E\u540C\u6B65\u540E\u518D\u751F\u6210\u62A5\u544A\u3002*");
    }
    lines.push("");
    lines.push("## \u6700\u8FD1\u4E00\u8F6E\u9636\u6BB5\u8017\u65F6\u4E0E\u8BF7\u6C42\u6458\u8981");
    lines.push("");
    if (latestPhaseSummary) {
      lines.push(`**\u8BB0\u5F55\u65F6\u95F4**: ${fmt(latestPhaseSummary.ts)}`);
      lines.push("**\u540C\u6B65\u9636\u6BB5**:");
      lines.push("```json");
      lines.push(formatDiagData(latestPhaseSummary.data));
      lines.push("```");
    } else {
      lines.push("*\u6682\u65E0\u7ED3\u6784\u5316\u9636\u6BB5\u6458\u8981\uFF1B\u5B8C\u6210\u4E00\u8F6E\u540C\u6B65\u540E\u518D\u751F\u6210\u62A5\u544A\u3002*");
    }
    if (latestNetworkSummary) {
      lines.push("");
      lines.push(`**OneDrive \u8BF7\u6C42\u4E0E\u4EE4\u724C\u83B7\u53D6**\uFF08${fmt(latestNetworkSummary.ts)}\uFF09:`);
      lines.push("```json");
      lines.push(formatDiagData(latestNetworkSummary.data));
      lines.push("```");
    } else {
      lines.push("");
      lines.push("*\u6682\u65E0\u7ED3\u6784\u5316 OneDrive \u8BF7\u6C42\u6458\u8981\u3002*");
    }
    if (latestTransferSummary) {
      lines.push("");
      lines.push(`**\u6587\u4EF6\u4F20\u8F93\u4E0E\u672C\u5730\u5904\u7406**\uFF08${fmt(latestTransferSummary.ts)}\uFF09:`);
      lines.push("```json");
      lines.push(formatDiagData(latestTransferSummary.data));
      lines.push("```");
    } else {
      lines.push("");
      lines.push("*\u6682\u65E0\u7ED3\u6784\u5316\u6587\u4EF6\u4F20\u8F93\u6458\u8981\u3002*");
    }
    lines.push("");
    const diagEntries = diagAll.filter(
      (e) => e.lvl === "warn" || e.lvl === "error" || e.cat === "onedrive" && e.lvl === "log" && e.msg.includes("downloadFile")
    ).slice(-200);
    lines.push("## \u8FD1\u671F\u5F02\u5E38\u65E5\u5FD7");
    lines.push("");
    if (diagEntries.length === 0) {
      lines.push("*\u65E0\u5F02\u5E38\u65E5\u5FD7\uFF08\u5185\u5B58\u548C\u78C1\u76D8\u5747\u65E0\u8BB0\u5F55\uFF09*");
    } else {
      const execFailures = diagEntries.filter(
        (e) => e.cat === "execute" && e.lvl === "error" && e.msg.includes("FAILED:")
      );
      const others = diagEntries.filter((e) => !execFailures.includes(e));
      if (execFailures.length > 0) {
        lines.push("### \u6587\u4EF6\u4F20\u8F93\u5931\u8D25\u8BE6\u60C5");
        lines.push("");
        lines.push("```");
        for (const e of execFailures) {
          lines.push(`${fmtShort(e.ts)} \u274C ${e.msg}`);
          if (e.data !== void 0) {
            lines.push(`  detail: ${formatDiagData(e.data)}`);
          }
        }
        lines.push("```");
        lines.push("");
      }
      if (others.length > 0) {
        lines.push("### \u5176\u4ED6\u5F02\u5E38");
        lines.push("");
        lines.push("```");
        for (const e of others) {
          const marker = e.lvl === "error" ? "\u274C" : "\u26A0\uFE0F";
          lines.push(`${fmtShort(e.ts)} [${e.cat}] ${marker} ${e.msg}`);
          if (e.data !== void 0) {
            lines.push(`  detail: ${formatDiagData(e.data)}`);
          }
        }
        lines.push("```");
      }
    }
    lines.push("");
    await this.app.vault.adapter.write(fileName2, lines.join("\n"));
    this.noticeCenter.show({
      key: "diagnostic-report-created",
      message: this.i18n.t("notice.diagnosticReportGenerated", { fileName: fileName2 }),
      priority: NOTICE_PRIORITY.action
    });
  }
  /** Apply max file size setting to the scanner. Public so settings-tab can call it. */
  applyMaxFileSize() {
    this.scanner?.setConfig({
      maxFileSize: this.syncMaxFileSizeMb * 1024 * 1024
    });
  }
  // ---- Status bar ----
  updateStatusBar() {
    this.updateRibbon();
    this.settingsTab?.refreshSyncState();
    if (!this.statusBarEl) return;
    this.statusBarEl.empty();
    const t = this.i18n.t.bind(this.i18n);
    const fullSyncRunning = this.syncExecutor?.isRunning ?? false;
    const sideActionRunning = this.syncExecutor?.hasSideActionsInFlight ?? false;
    const isRunning = isAnySyncActivityRunning(this.progressStore.state, fullSyncRunning, sideActionRunning);
    if (this.auth?.isInitializing) {
      this.statusBarEl.setText(t("status.connecting"));
      return;
    }
    const authState = this.auth?.authState;
    if (!authState?.isLoggedIn) {
      this.statusBarEl.setText(t("status.notLoggedIn"));
      return;
    }
    if (isRunning) {
      this.statusBarEl.setText(t("status.syncing"));
      return;
    }
    if (this.state?.planReviewActive) {
      this.statusBarEl.setText(t("status.planReview"));
      return;
    }
    const conflicts = this.state?.pendingConflicts?.length ?? 0;
    const deletes = this.state?.pendingRemoteDeletes?.length ?? 0;
    if (conflicts > 0 && deletes > 0) {
      this.statusBarEl.setText(t("status.conflictsAndDeletes", { conflicts, deletes }));
      return;
    }
    if (conflicts > 0) {
      this.statusBarEl.setText(t("status.conflicts", { count: conflicts }));
      return;
    }
    if (deletes > 0) {
      this.statusBarEl.setText(t("status.pendingDeletes", { count: deletes }));
      return;
    }
    const lastSync = this.state?.lastSyncTime;
    if (lastSync) {
      this.statusBarEl.setText(t("status.lastSync", { time: new Date(lastSync).toLocaleTimeString() }));
    } else {
      this.statusBarEl.setText(t("status.ready"));
    }
  }
  updateRibbon() {
    if (!this.ribbonEl) return;
    if ((this.auth?.isInitializing ?? true) || !this._stateLoaded) return;
    const status = this.getRibbonStatus();
    const label = resolveRibbonStatusLabel(
      status,
      this.progressStore.state,
      this.i18n.t.bind(this.i18n)
    );
    (0, import_obsidian15.setIcon)(this.ribbonEl, RIBBON_STATUS_ICONS[status]);
    (0, import_obsidian15.setTooltip)(this.ribbonEl, label);
    this.ribbonEl.setAttr("aria-label", label);
    this.ribbonEl.dataset.easySyncStatus = status;
  }
  getRibbonStatus() {
    const fullSyncRunning = this.syncExecutor?.isRunning ?? false;
    const sideActionRunning = this.syncExecutor?.hasSideActionsInFlight ?? false;
    return resolveRibbonStatus({
      loggedIn: this.auth?.authState.isLoggedIn ?? false,
      cancelling: this.progressStore.state.cancelRequested,
      syncing: isAnySyncActivityRunning(this.progressStore.state, fullSyncRunning, sideActionRunning),
      needsAttention: this.autoSyncPaused || (this.state?.planReviewActive ?? false) || (this.state?.pendingIssues.length ?? 0) > 0 || (this.state?.pendingConflicts.length ?? 0) > 0 || (this.state?.pendingRemoteDeletes.length ?? 0) > 0,
      recentSuccess: this.ribbonSuccessVisible
    });
  }
  async handleRibbonClick() {
    if ((this.auth?.isInitializing ?? true) || !this._stateLoaded) return;
    switch (this.getRibbonStatus()) {
      case "loggedOut":
        this.openPluginSettings();
        return;
      case "ready":
        await this.startManualSync();
        return;
      default:
        await this.activateSyncView();
    }
  }
  openPluginSettings() {
    const setting = this.app.setting;
    setting?.open();
    setting?.openTabById(this.manifest.id);
  }
  showRibbonSuccess() {
    this.clearRibbonSuccess();
    this.ribbonSuccessVisible = true;
    this.ribbonSuccessTimer = compatSetTimeout(() => {
      this.ribbonSuccessVisible = false;
      this.ribbonSuccessTimer = null;
      this.updateStatusBar();
    }, RIBBON_SUCCESS_DURATION_MS);
  }
  clearRibbonSuccess() {
    compatClearTimeout(this.ribbonSuccessTimer);
    this.ribbonSuccessTimer = null;
    this.ribbonSuccessVisible = false;
  }
  // ---- SecretStorage wrappers ----
  async saveSecret(key, value) {
    this.app.secretStorage?.setSecret(key, value);
  }
  async loadSecret(key) {
    return this.app.secretStorage?.getSecret(key) ?? null;
  }
  async removeSecret(key) {
    const ss = this.app.secretStorage;
    if (!ss) return;
    if (typeof ss.deleteSecret === "function") {
      ss.deleteSecret(key);
    } else {
      ss.setSecret(key, "");
    }
  }
};
function formatDiagData(data) {
  if (data === void 0 || data === null) return "";
  if (typeof data === "string") return data;
  try {
    return JSON.stringify(data, null, 2);
  } catch {
    return String(data);
  }
}

/* nosourcemap */