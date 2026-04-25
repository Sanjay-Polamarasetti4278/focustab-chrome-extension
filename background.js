/**
 * FocusTab — background.js (Service Worker)
 * Phase 3: Manages declarativeNetRequest dynamic rules for Focus Mode.
 * Note: No DOM access allowed in service workers (MV3 constraint).
 */

'use strict';

const DEFAULT_BLOCK_LIST = [
  'instagram.com', 'youtube.com', 'linkedin.com', 'twitter.com',
  'x.com', 'facebook.com', 'reddit.com', 'tiktok.com',
  'pinterest.com', 'snapchat.com',
];

/* ── Storage helpers (duplicated from newtab.js — no shared modules in MV3) ── */

function storageGet(keys, defaults = {}) {
  return new Promise((resolve) => {
    try {
      chrome.storage.local.get(keys, (result) => {
        if (chrome.runtime.lastError) {
          console.warn('[FocusTab BG] storage.get error:', chrome.runtime.lastError.message);
          resolve(defaults);
        } else {
          resolve({ ...defaults, ...result });
        }
      });
    } catch (err) {
      console.warn('[FocusTab BG] storage.get exception:', err);
      resolve(defaults);
    }
  });
}

function storageSet(data) {
  return new Promise((resolve) => {
    try {
      chrome.storage.local.set(data, () => {
        if (chrome.runtime.lastError) {
          console.warn('[FocusTab BG] storage.set error:', chrome.runtime.lastError.message);
        }
        resolve();
      });
    } catch (err) {
      console.warn('[FocusTab BG] storage.set exception:', err);
      resolve();
    }
  });
}

/* ── Rule Builders ── */

/**
 * Generate one declarativeNetRequest rule per domain.
 * IDs are 1-based integers (required by the API).
 * @param {string[]} blockList
 * @returns {chrome.declarativeNetRequest.Rule[]}
 */
function buildRules(blockList) {
  return blockList.map((domain, idx) => ({
    id: idx + 1,
    priority: 1,
    action: {
      type: 'redirect',
      redirect: { extensionPath: '/blocked.html' },
    },
    condition: {
      urlFilter: `||${domain}^`,
      resourceTypes: ['main_frame'],
    },
  }));
}

/**
 * Apply dynamic rules for all domains in the block list.
 * Clears any existing rules first to avoid ID conflicts.
 * @param {string[]} blockList
 */
async function applyBlockRules(blockList) {
  try {
    const existing = await chrome.declarativeNetRequest.getDynamicRules();
    const removeRuleIds = existing.map((r) => r.id);
    const addRules = buildRules(
      Array.isArray(blockList) && blockList.length > 0
        ? blockList
        : DEFAULT_BLOCK_LIST
    );
    await chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds, addRules });
    console.log('[FocusTab BG] Block rules applied for', addRules.length, 'domains.');
  } catch (err) {
    console.error('[FocusTab BG] Failed to apply block rules:', err);
  }
}

/**
 * Remove all currently active dynamic rules (Focus Mode OFF).
 */
async function removeAllBlockRules() {
  try {
    const existing = await chrome.declarativeNetRequest.getDynamicRules();
    const removeRuleIds = existing.map((r) => r.id);
    if (removeRuleIds.length === 0) return;
    await chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds });
    console.log('[FocusTab BG] All block rules removed.');
  } catch (err) {
    console.error('[FocusTab BG] Failed to remove block rules:', err);
  }
}

/**
 * Read current storage state and sync rules accordingly.
 */
async function syncBlockRules() {
  const { focusModeEnabled, blockList } = await storageGet(
    ['focusModeEnabled', 'blockList'],
    { focusModeEnabled: false, blockList: DEFAULT_BLOCK_LIST }
  );

  if (focusModeEnabled) {
    await applyBlockRules(blockList);
  } else {
    await removeAllBlockRules();
  }
}

/* ── Lifecycle Listeners ── */

chrome.runtime.onInstalled.addListener(async () => {
  const { blockList } = await storageGet(['blockList'], { blockList: null });
  if (!blockList) {
    await storageSet({ blockList: DEFAULT_BLOCK_LIST });
  }
  // Make sure rules match the stored focus state after install/update
  await syncBlockRules();
  console.log('[FocusTab BG] Installed & initialised.');
});

chrome.storage.onChanged.addListener(async (changes, area) => {
  if (area !== 'local') return;
  if ('focusModeEnabled' in changes || 'blockList' in changes) {
    await syncBlockRules();
  }
});
