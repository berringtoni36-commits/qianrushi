const crypto = require("crypto");

// Bilibili's web APIs use a short-lived WBI signature on a subset of account,
// favourite and playback requests.  Keep the algorithm isolated from the
// adapter so a protocol change does not leak into Markdown/media code.
const MIXIN_KEY_ENC_TAB = Object.freeze([
  46, 47, 18, 2, 53, 8, 23, 32, 15, 50, 10, 31, 58, 3, 45, 35, 27, 43,
  5, 49, 33, 9, 29, 13, 39, 6, 20, 37, 14, 61, 19, 4,
]);

function extractWbiKeys(wbiImage = {}) {
  const imgKey = fileKey(wbiImage.img_url);
  const subKey = fileKey(wbiImage.sub_url);
  return imgKey && subKey ? { imgKey, subKey } : null;
}

function fileKey(value) {
  let text = String(value || "").trim();
  if (!text) return "";
  try { text = new URL(text).pathname; }
  catch (_) { text = text.split(/[?#]/)[0]; }
  const basename = text.split("/").filter(Boolean).pop() || "";
  return basename.replace(/\.(?:png|jpg|jpeg|webp)$/i, "").trim();
}

function mixinKey(imgKey, subKey) {
  const source = `${String(imgKey || "")}${String(subKey || "")}`;
  return MIXIN_KEY_ENC_TAB.map((index) => source[index] || "").join("").slice(0, 32);
}

function signWbiUrl(input, keys, now = Math.floor(Date.now() / 1000)) {
  const parsed = new URL(String(input));
  if (!keys?.imgKey || !keys?.subKey) return parsed.toString();
  const params = new URLSearchParams(parsed.search);
  params.set("wts", String(Math.floor(Number(now) || Date.now() / 1000)));
  const query = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value)).replace(/[!'()*]/g, "")}`)
    .join("&");
  const wRid = crypto.createHash("md5").update(`${query}${mixinKey(keys.imgKey, keys.subKey)}`).digest("hex");
  params.set("w_rid", wRid);
  parsed.search = params.toString();
  return parsed.toString();
}

module.exports = { MIXIN_KEY_ENC_TAB, extractWbiKeys, fileKey, mixinKey, signWbiUrl };
