/**
 * FocusTab — blocked.js
 * Phase 3: Renders the blocked page with wallpaper + focus text.
 * Handles "Disable Focus Mode" button which removes all block rules.
 */

'use strict';

function storageGet(keys, defaults = {}) {
  return new Promise((resolve) => {
    try {
      chrome.storage.local.get(keys, (result) => {
        if (chrome.runtime.lastError) {
          resolve(defaults);
        } else {
          resolve({ ...defaults, ...result });
        }
      });
    } catch {
      resolve(defaults);
    }
  });
}

function storageSet(data) {
  return new Promise((resolve) => {
    try {
      chrome.storage.local.set(data, () => resolve());
    } catch {
      resolve();
    }
  });
}

async function init() {
  const { wallpaperData, focusText } = await storageGet(
    ['wallpaperData', 'focusText'],
    { wallpaperData: null, focusText: '' }
  );

  // Apply custom wallpaper if set
  if (wallpaperData) {
    document.getElementById('blocked-wallpaper').style.backgroundImage = `url('${wallpaperData}')`;
  }

  // Show focus text or fallback
  const focusEl = document.getElementById('blocked-focus-text');
  if (focusText && focusText.trim()) {
    focusEl.textContent = focusText.trim();
  }
  // else fallback text is already in HTML

  // "Disable Focus Mode" button
  document.getElementById('disable-focus-btn').addEventListener('click', async () => {
    await storageSet({ focusModeEnabled: false });

    // Redirect back to the originally-attempted URL if passed as query param
    const params = new URLSearchParams(window.location.search);
    const from   = params.get('from');
    if (from) {
      try {
        // Validate it's a real URL before redirecting
        const url = new URL(decodeURIComponent(from));
        window.location.href = url.href;
      } catch {
        window.location.href = 'chrome://newtab';
      }
    } else {
      window.location.href = 'chrome://newtab';
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
