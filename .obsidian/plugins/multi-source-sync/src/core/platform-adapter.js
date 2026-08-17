const { normalizeItem } = require("./normalized-item");

class PlatformAdapter {
  constructor(id, displayName) { this.id = id; this.displayName = displayName; }
  async openLogin() { throw new Error(`${this.displayName} login is not implemented`); }
  async getAccount() { return null; }
  async prepareSyncRun() { const account = await this.getAccount(); if (!account) throw new Error(`${this.displayName} requires login`); return account; }
  async listItems() { throw new Error(`${this.displayName}收藏接口不可用`); }
  async getItemDetail() { throw new Error(`${this.displayName}详情接口不可用`); }
  resolveMedia() { return Promise.resolve([]); }
  classifyError(error) { return { code: "unknown", message: error instanceof Error ? error.message : String(error), retryable: false }; }
  destroy() {}
}

function normalizePage(page) {
  const value = page || {};
  const items = Array.isArray(value.items) ? value.items : [];
  const nextCursor = value.nextCursor == null || value.nextCursor === "" ? undefined : String(value.nextCursor);
  const explicit = parseBooleanFlag(value.hasMore);
  return { items, nextCursor, hasMore: explicit === undefined ? Boolean(nextCursor) : explicit && Boolean(nextCursor) };
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

module.exports = { PlatformAdapter, normalizePage, normalizeItem };
