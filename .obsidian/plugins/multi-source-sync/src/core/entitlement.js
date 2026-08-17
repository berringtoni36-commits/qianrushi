/** Local capabilities are deliberately separate from platform entitlements. */
const DEFAULT_CAPABILITIES = Object.freeze({
  unlimitedSync: true,
  extendedComments: true,
  commentReplies: true,
  aiClassification: true,
  aiCommentInsights: true,
  aiReclassification: true,
  discoveryRadar: true,
  discoveryHome: true,
  discoveryAiAnalysis: true,
  videoTranscription: true,
  imageOcr: true,
  batchOperations: true,
});

function createCapabilityService(overrides = {}) {
  const capabilities = { ...DEFAULT_CAPABILITIES, ...(overrides || {}) };
  return {
    all() { return { ...capabilities }; },
    has(name) { return capabilities[name] === true; },
    isPlatformEntitlement(name) {
      return name === "bilibiliPremium" || name === "douyinPaid";
    },
  };
}

module.exports = { DEFAULT_CAPABILITIES, createCapabilityService };
