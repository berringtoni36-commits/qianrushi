const crypto = require("crypto");

function electron() {
  try { return require("electron"); } catch (_) { return null; }
}

function encodeSession(value) {
  const text = JSON.stringify(value || {});
  const e = electron();
  try {
    if (e?.safeStorage?.isEncryptionAvailable?.()) return `safe:${e.safeStorage.encryptString(text).toString("base64")}`;
  } catch (_) { /* fall through to local-only obfuscation */ }
  // This is not advertised as cryptographic protection. It prevents casual
  // plaintext exposure on systems where Electron safeStorage is unavailable.
  return `local:${Buffer.from(text, "utf8").toString("base64")}`;
}

function decodeSession(value) {
  if (!value || typeof value !== "string") return {};
  const e = electron();
  try {
    let parsed;
    if (value.startsWith("safe:") && e?.safeStorage?.decryptString) {
      parsed = JSON.parse(e.safeStorage.decryptString(Buffer.from(value.slice(5), "base64")));
    } else if (value.startsWith("local:")) parsed = JSON.parse(Buffer.from(value.slice(6), "base64").toString("utf8"));
    else parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch (error) { return { invalid: true, error: String(error?.message || error || "会话解码失败").slice(0, 200) }; }
}

function cookieHeader(cookies) {
  return (Array.isArray(cookies) ? cookies : [])
    .filter((cookie) => cookie && cookie.name && cookie.value)
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join("; ");
}

function redactCookieValue(value) {
  const text = String(value || "");
  return text.length > 10 ? `${text.slice(0, 4)}…${text.slice(-4)}` : "[redacted]";
}

async function readCookies(session, urls) {
  const result = [];
  for (const url of urls) {
    try { result.push(...await session.cookies.get({ url })); } catch (_) { /* continue */ }
  }
  const unique = new Map(result.map((cookie) => [`${cookie.domain}:${cookie.path}:${cookie.name}`, cookie]));
  return [...unique.values()];
}

async function openLoginWindow({ platform, partition, url, onClose, onWindow }) {
  const e = electron();
  if (!e?.BrowserWindow) throw new Error("当前 Obsidian 环境无法打开独立登录窗口");
  const win = new e.BrowserWindow({
    width: 1180,
    height: 820,
    title: `${platform} 登录（仅使用本机登录态）`,
    webPreferences: { partition, contextIsolation: true, nodeIntegration: false },
  });
  // Let adapters retain a weak lifecycle reference so an Obsidian unload can
  // close an in-progress login window.  The callback is deliberately
  // synchronous and receives no cookies or page data.
  try { onWindow?.(win); } catch (_) {}
  return new Promise((resolve, reject) => {
    let done = false;
    const finish = async () => {
      if (done) return;
      done = true;
      try { await onClose?.(win.webContents.session); resolve(); }
      catch (error) { reject(error); }
    };
    win.on("closed", finish);
    // Attach the closed handler before navigation.  A user can close the
    // window while the first page is still loading; registering afterwards
    // would leave the login promise hanging forever.
    Promise.resolve(win.loadURL(url)).catch((error) => {
      if (done) return;
      done = true;
      try { if (!win.isDestroyed?.()) win.destroy(); } catch (_) {}
      reject(error);
    });
  });
}

function createPartition(platform, accountId) {
  return `persist:mss-${platform}-${crypto.createHash("sha256").update(String(accountId)).digest("hex").slice(0, 16)}`;
}

async function clearPartition(partition) {
  const e = electron();
  try {
    const session = e?.session?.fromPartition?.(partition);
    await session?.clearStorageData?.();
    await session?.clearCache?.();
  } catch (_) {}
}

module.exports = { encodeSession, decodeSession, cookieHeader, redactCookieValue, readCookies, openLoginWindow, createPartition, clearPartition };
