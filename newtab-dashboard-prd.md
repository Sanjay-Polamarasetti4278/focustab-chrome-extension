# PRD: Personal Productivity Dashboard — New Tab Chrome Extension

**Product Name:** FocusTab  
**Owner:** Sanjay  
**Version:** 1.0  
**Document Status:** Ready for Development  

---

## 1. Overview

FocusTab replaces Chrome's default new tab page with a full-screen personal productivity dashboard. It greets the user by name, shows a live clock, prompts for a daily focus goal, provides a task list, and includes a Focus Mode that blocks distracting websites. All settings are configurable through a built-in settings panel.

### Goals
- Replace the new tab page with a calm, personal, and productive environment.
- Keep the daily focus intention visible throughout the day.
- Reduce friction for capturing tasks.
- Actively block distracting sites during focus sessions.

### Non-Goals (v1.0)
- Sync across devices or user accounts.
- Analytics or productivity reporting.
- Recurring tasks or due dates.
- Multiple focus profiles.

---

## 2. User Personas

**Primary User: Sanjay**  
A knowledge worker who wants a distraction-free browser start and a lightweight system for daily intentions and tasks. Uses Chrome as his primary browser. Not necessarily a developer.

---

## 3. Technical Architecture Overview

The extension uses the following Chrome APIs and technologies:

| Component | Technology |
|---|---|
| New Tab Override | `chrome_url_overrides.newtab` in `manifest.json` |
| Background Logic | Service Worker (`background.js`) |
| Site Blocking | `chrome.declarativeNetRequest` API |
| Local Storage | `chrome.storage.local` |
| UI | Plain HTML + CSS + Vanilla JS (single `newtab.html`) |
| Settings Panel | Slide-in panel within `newtab.html` (no separate page) |
| Wallpaper Storage | `chrome.storage.local` with Base64-encoded image |

**Manifest Version:** MV3 (Manifest V3)

---

## 4. Phased Build Plan

The extension is broken into 4 phases. Each phase produces a working, testable build.

---

## Phase 1 — Core Shell: Wallpaper, Clock, and Greeting

**Goal:** Get the new tab page rendering with a full-screen wallpaper, a live clock, and a personalized greeting. No functionality beyond visual setup.

### Features

#### 1.1 New Tab Override
- `manifest.json` must declare `chrome_url_overrides: { "newtab": "newtab.html" }`.
- The page must render instantly with no blank flash.

#### 1.2 Full-Screen Wallpaper
- Default wallpaper: a built-in static image bundled with the extension (a tasteful dark gradient or landscape photo, stored in `/assets/default-wallpaper.jpg`).
- The image fills the full viewport using `background-size: cover` and `background-position: center`.
- The image must not tile or leave gaps at any screen resolution.
- A semi-transparent dark overlay (`rgba(0,0,0,0.35)`) sits above the wallpaper to ensure text is always legible.

#### 1.3 Live Clock
- Displays current local time in `HH:MM` format (24-hour) or `HH:MM AM/PM` (12-hour). Default: 12-hour.
- Updates every second using `setInterval`.
- Font: Large, light-weight sans-serif (e.g., system-ui or Inter). Centered at the upper-middle of the screen.
- Below the time, display the current date in format: `Thursday, April 24`.

#### 1.4 Personalized Greeting
- Below the date, display: **"Good morning, Sanjay"** / **"Good afternoon, Sanjay"** / **"Good evening, Sanjay"** based on the current hour:
  - Morning: 05:00–11:59
  - Afternoon: 12:00–16:59
  - Evening: 17:00–04:59
- The name "Sanjay" is read from `chrome.storage.local` key `userName`. Default value on first install: `"Sanjay"`.

### File Structure After Phase 1
```
/
├── manifest.json
├── newtab.html
├── newtab.js
├── newtab.css
├── assets/
│   └── default-wallpaper.jpg
```

### manifest.json Requirements (Phase 1)
```json
{
  "manifest_version": 3,
  "name": "FocusTab",
  "version": "1.0",
  "description": "Your personal productivity dashboard",
  "chrome_url_overrides": {
    "newtab": "newtab.html"
  },
  "permissions": ["storage"],
  "action": {}
}
```

### Acceptance Criteria
- [ ] Opening a new tab shows the wallpaper with overlay.
- [ ] Clock updates every second without visual glitching.
- [ ] Date string is correct and formatted as specified.
- [ ] Greeting changes based on time of day.
- [ ] The name displayed is "Sanjay" (from storage default).
- [ ] No console errors.

---

## Phase 2 — Daily Focus Prompt and Task List

**Goal:** Add the daily focus intention system and a simple task manager.

### Features

#### 2.1 Daily Focus Prompt

**Trigger Logic:**
- On every new tab open, the extension checks `chrome.storage.local` for two keys:
  - `focusText` — the saved focus string.
  - `focusDate` — the calendar date (YYYY-MM-DD) the focus was set.
- If `focusDate` does not match today's date, OR if `focusText` is empty/missing:
  - Show the focus input prompt UI.
- If `focusDate` matches today and `focusText` is non-empty:
  - Show the focus display UI with the saved text.

**Focus Input UI (Morning Prompt):**
- Centered modal-style card with slight frosted-glass background (`backdrop-filter: blur`).
- Text: `"What is your main focus today, Sanjay?"`
- Single-line text input field, auto-focused.
- Submit button labeled `"Set Focus"`.
- Pressing `Enter` also submits.
- Empty submissions are ignored (field shakes with CSS animation).
- On submit: save `focusText` and `focusDate` (today's date) to `chrome.storage.local`, then hide the prompt and show the focus display.

**Focus Display UI (Rest of Day):**
- Shown below the greeting when focus is already set.
- Label: `"Today's Focus"` in small caps or muted text.
- Below it: the saved focus text in a slightly larger, emphasized font.
- A small pencil/edit icon (✏️ or SVG) next to the text. Clicking it re-opens the focus input prompt pre-filled with the current value so the user can update it.

**Daily Reset:**
- Each time the new tab opens, compare `focusDate` to today's local date.
- If the dates differ, clear `focusText` and `focusDate` from storage, then show the prompt.
- No background timer or alarm is needed — the reset happens on tab open.

#### 2.2 Task List

**UI Layout:**
- Positioned in the bottom-left quadrant of the screen.
- Compact, no more than 300px wide, with a frosted-glass or semi-transparent card background.
- Header: `"Tasks"` in bold.

**Add Task:**
- Single text input at the top of the task list card.
- Placeholder text: `"Add a task…"`
- Submit on `Enter` key press.
- Empty input is ignored.
- New tasks are appended to the bottom of the list.

**Task Item Display:**
- Each task shows:
  - A circular checkbox on the left.
  - Task text in the middle.
  - A delete button (✕) on the right, visible on hover.
- Maximum visible task items: 7 (scroll within card if more).

**Mark Done:**
- Clicking the checkbox toggles `done` state.
- Done tasks: text becomes struck-through and slightly faded.
- Done tasks are visually moved below incomplete tasks automatically (or kept in place — the simpler implementation is acceptable for v1).

**Delete Task:**
- Clicking ✕ removes the task immediately.
- No confirmation dialog (keep it fast).

**Persistence:**
- All tasks are stored in `chrome.storage.local` under key `tasks` as a JSON array.
- Schema per task:
```json
{
  "id": "uuid-string",
  "text": "Buy groceries",
  "done": false,
  "createdAt": "2026-04-24T08:00:00.000Z"
}
```
- Tasks do NOT auto-reset daily. The user manages them manually.
- Maximum stored tasks: 50. If limit is reached, show a subtle message: `"50 task limit reached."` and disable the add input.

### Storage Keys After Phase 2

| Key | Type | Description |
|---|---|---|
| `userName` | string | User's display name |
| `focusText` | string | Today's focus intention |
| `focusDate` | string | Date focus was set (YYYY-MM-DD) |
| `tasks` | JSON array | All tasks |

### Acceptance Criteria
- [ ] On first open of a new day, the focus prompt appears and is auto-focused.
- [ ] Submitting the focus saves it and displays it without page reload.
- [ ] Returning to an existing tab (or opening a new one the same day) shows the saved focus, not the prompt.
- [ ] Focus resets the following day.
- [ ] Edit icon re-opens the prompt pre-filled.
- [ ] Tasks can be added via Enter key.
- [ ] Tasks persist across new tab opens and browser restarts.
- [ ] Marking done applies strikethrough. Deleting removes the item instantly.
- [ ] No console errors.

---

## Phase 3 — Focus Mode (Site Blocking)

**Goal:** Add a toggle that activates a site-blocking mode using `declarativeNetRequest`, redirecting blocked sites to a custom page that shows the user's daily focus.

### Features

#### 3.1 Focus Mode Toggle

**UI:**
- A pill-shaped toggle button in the top-right area of the new tab page.
- Label when OFF: `"🎯 Focus Mode"` (subdued style).
- Label when ON: `"🔴 Focus Mode ON"` (highlighted, e.g., red or amber border/glow).
- Clicking toggles the mode.
- State persists in `chrome.storage.local` under key `focusModeEnabled` (boolean).

**Default State:** OFF.

#### 3.2 Site Blocking Rules

**Default Block List** (hardcoded as fallback, user-editable in Phase 4):
```
instagram.com
youtube.com
linkedin.com
twitter.com
x.com
facebook.com
reddit.com
tiktok.com
pinterest.com
snapchat.com
```

**Block List Storage:**
- Stored in `chrome.storage.local` under key `blockList` as a JSON array of domain strings.
- On first install, populate with the default list above.

**Implementation using `declarativeNetRequest`:**
- Add `"declarativeNetRequest"` and `"declarativeNetRequestWithHostAccess"` to `permissions` in `manifest.json`.
- Use **dynamic rules** (not static rules) so the block list can be updated at runtime without reinstalling the extension.
- When Focus Mode is turned ON:
  - Generate `declarativeNetRequest` rules for each domain in the block list.
  - Rule action: `redirect` to `chrome-extension://<id>/blocked.html`.
  - Apply rules using `chrome.declarativeNetRequest.updateDynamicRules`.
- When Focus Mode is turned OFF:
  - Remove all dynamic rules using `chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds: [...] })`.

**Rule structure per domain:**
```json
{
  "id": <integer>,
  "priority": 1,
  "action": {
    "type": "redirect",
    "redirect": {
      "extensionPath": "/blocked.html"
    }
  },
  "condition": {
    "urlFilter": "*://*.instagram.com/*",
    "resourceTypes": ["main_frame"]
  }
}
```

#### 3.3 Blocked Page (`blocked.html`)

- Full-screen page matching the newtab aesthetic (same wallpaper, same dark overlay).
- Centered content:
  - Large icon or emoji: 🛑 or 🎯
  - Heading: `"You're in Focus Mode"`
  - Subtext: `"Your focus today:"` followed by the user's current `focusText` (read from `chrome.storage.local`).
  - If no focus is set: `"Stay focused. You've got this."`
  - A small button: `"Disable Focus Mode"` — clicking it sets `focusModeEnabled` to false, removes all block rules, and redirects to the originally-attempted URL (pass the blocked URL as a query param: `blocked.html?from=<encoded-url>`).

**Note for the AI coding tool:** The blocked page must read the wallpaper and focus text from `chrome.storage.local` at load time so it stays in sync with the user's settings.

### New Files After Phase 3
```
/
├── blocked.html
├── blocked.js
├── background.js   ← Service worker for rule management
```

### manifest.json Additions for Phase 3
```json
{
  "permissions": ["storage", "declarativeNetRequest"],
  "background": {
    "service_worker": "background.js"
  }
}
```

### Acceptance Criteria
- [ ] Focus Mode toggle appears in the top-right area.
- [ ] Toggling ON changes its visual state and persists across tab opens.
- [ ] Navigating to instagram.com while Focus Mode is ON redirects to `blocked.html`.
- [ ] `blocked.html` shows the user's wallpaper, name, and today's focus text.
- [ ] `blocked.html` has a working "Disable Focus Mode" button.
- [ ] Disabling Focus Mode from any tab allows blocked sites to load normally again.
- [ ] Toggling OFF removes all block rules immediately.
- [ ] No console errors. No crashes when `focusText` is empty.

---

## Phase 4 — Settings Panel

**Goal:** Add a settings panel accessible via a gear icon, allowing the user to change their name, upload a custom wallpaper, and manage the block list.

### Features

#### 4.1 Settings Icon

- A gear icon (⚙️ or an SVG gear) in the bottom-right corner of the new tab page.
- Subtle opacity (0.5 normally, 1.0 on hover) so it doesn't dominate the aesthetic.
- Clicking it opens the Settings Panel as a slide-in drawer from the right side of the screen.

#### 4.2 Settings Panel UI

- Slides in from the right with a CSS transition (`transform: translateX`).
- Width: 320px on desktop.
- Background: semi-opaque dark panel (`rgba(0,0,0,0.85)`) with a subtle blur.
- A close button (✕) in the top-right corner of the panel.
- Clicking outside the panel (on the overlay) also closes it.
- Divided into three sections with clear section headers:

---

**Section A: Your Profile**

- Label: `"Your Name"`
- Text input pre-filled with current `userName` value.
- Save button: `"Save Name"`.
- On save: update `chrome.storage.local` key `userName`, update the greeting on the main page without reload.
- Validation: name cannot be empty or more than 30 characters.

---

**Section B: Wallpaper**

- Label: `"Background Wallpaper"`
- Shows a small thumbnail preview of the current wallpaper (100px tall, cropped).
- Button: `"Upload Image"` — triggers a hidden `<input type="file" accept="image/*">`.
- On file selection:
  - Read the file using `FileReader.readAsDataURL()`.
  - Store the Base64 string in `chrome.storage.local` under key `wallpaperData`.
  - Immediately update the background on the current page without reload.
  - Update the preview thumbnail.
- Button: `"Reset to Default"` — clears `wallpaperData` from storage and restores the default bundled wallpaper.
- **Storage note for AI coding tool:** Base64 images can be 1–5MB. `chrome.storage.local` has a 10MB quota by default. Warn in the code comments but do not block the upload. Future versions may use IndexedDB for larger images.

---

**Section C: Block List Manager**

- Label: `"Blocked Sites (Focus Mode)"`
- Displays the current block list as a list of domain tags (pill-shaped chips).
- Each chip has a small ✕ button to remove that domain.
- At the bottom: a text input with placeholder `"Add domain (e.g. reddit.com)"` and an `"Add"` button.
- Input validation:
  - Strip `https://`, `www.`, trailing slashes automatically.
  - Reject empty input.
  - Reject duplicates (show brief inline message: `"Already in list"`).
  - Accept only valid-looking domain strings (basic regex: `/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/`).
- Changes to the block list are saved to `chrome.storage.local` key `blockList` immediately.
- If Focus Mode is currently ON, any changes to the block list must also immediately re-apply the `declarativeNetRequest` dynamic rules.
- Button at the bottom: `"Reset to Defaults"` — restores the default block list and re-saves.

---

### Storage Keys After Phase 4

| Key | Type | Description |
|---|---|---|
| `userName` | string | User's display name |
| `focusText` | string | Today's focus intention |
| `focusDate` | string | Date focus was set (YYYY-MM-DD) |
| `tasks` | JSON array | All task items |
| `focusModeEnabled` | boolean | Whether Focus Mode is active |
| `blockList` | string array | Domains to block in Focus Mode |
| `wallpaperData` | string | Base64-encoded wallpaper image (or absent if using default) |

### Acceptance Criteria
- [ ] Gear icon is visible but unobtrusive in the bottom-right corner.
- [ ] Settings panel slides in/out smoothly.
- [ ] Name change updates the greeting immediately without page reload.
- [ ] Uploading an image changes the wallpaper on the current page immediately and persists to new tabs.
- [ ] "Reset to Default" restores the bundled wallpaper.
- [ ] Block list shows all current domains as removable chips.
- [ ] Adding a domain validates input and saves it immediately.
- [ ] Removing a domain saves immediately; if Focus Mode is ON, the rule is removed instantly.
- [ ] "Reset to Defaults" on block list restores the 10 default domains.
- [ ] No console errors during any settings interaction.

---

## 5. Full UI Layout Reference

```
┌─────────────────────────────────────────────────┐
│  [Wallpaper fills entire viewport]               │
│                                                  │
│              10:42 AM          [🎯 Focus Mode]   │
│           Thursday, April 24                     │
│         Good morning, Sanjay                     │
│                                                  │
│         ┌──────────────────────────┐             │
│         │  What is your main       │             │
│         │  focus today, Sanjay?    │             │
│         │  [_________________] ✓  │             │
│         └──────────────────────────┘             │
│                                                  │
│     (or, after focus is set:)                    │
│              TODAY'S FOCUS                       │
│         Finish the product spec ✏️               │
│                                                  │
│                                                  │
│  ┌─────────────┐                                 │
│  │  Tasks      │                                 │
│  │ ○ Buy milk  │                                 │
│  │ ● Send deck │                                 │
│  │ [Add task…] │                                 │
│  └─────────────┘                           [⚙️]  │
└─────────────────────────────────────────────────┘
```

---

## 6. Global Design Tokens

The AI coding tool should define these as CSS variables in `newtab.css`:

```css
:root {
  --font-family: 'Inter', system-ui, -apple-system, sans-serif;
  --color-white: rgba(255, 255, 255, 0.95);
  --color-muted: rgba(255, 255, 255, 0.55);
  --color-card-bg: rgba(0, 0, 0, 0.45);
  --color-card-border: rgba(255, 255, 255, 0.12);
  --color-input-bg: rgba(255, 255, 255, 0.1);
  --color-focus-mode-on: #ff4d4d;
  --backdrop-blur: blur(12px);
  --border-radius-card: 12px;
  --border-radius-pill: 999px;
  --transition-default: 0.2s ease;
}
```

All text should be white or near-white. All cards/panels use `backdrop-filter: blur()`. Avoid hard-coded color values outside of this token sheet.

---

## 7. Error Handling Requirements

The coding tool should handle the following edge cases gracefully:

| Scenario | Expected Behavior |
|---|---|
| `chrome.storage.local` read fails | Fall back to defaults silently, log warning to console |
| Wallpaper image fails to load | Fall back to CSS gradient background |
| `declarativeNetRequest` rule application fails | Log error, show brief toast: "Could not apply block rules" |
| Uploaded image is too large (>5MB) | Show inline warning: "Image may be too large. Try a smaller file." but still attempt storage |
| Task storage is full (50 items) | Disable add input, show: "50 task limit reached." |
| `blocked.html` loaded without focus set | Show generic motivational message instead of empty focus |
| User's name is cleared | Fall back to "there" (e.g., "Good morning, there") |

---

## 8. Permissions Summary

```json
"permissions": [
  "storage",
  "declarativeNetRequest"
]
```

No unnecessary permissions. No `tabs`, `history`, `cookies`, or `webRequest` needed.

---

## 9. File Manifest (Final)

```
/
├── manifest.json
├── newtab.html
├── newtab.js
├── newtab.css
├── blocked.html
├── blocked.js
├── blocked.css
├── background.js
└── assets/
    └── default-wallpaper.jpg
```

No build tools, no npm, no frameworks. Plain HTML/CSS/JS only, compatible with MV3 service worker constraints (no DOM access in `background.js`).

---

## 10. Testing Checklist (Full Extension)

Run through this list manually after completing all phases:

### Installation
- [ ] Load unpacked extension in Chrome without errors.
- [ ] Opening a new tab shows FocusTab (not the default Chrome new tab).

### Phase 1
- [ ] Wallpaper loads correctly at various window sizes.
- [ ] Clock ticks every second.
- [ ] Greeting is time-appropriate.

### Phase 2
- [ ] Focus prompt appears the first time each day.
- [ ] Focus persists throughout the day across many new tabs.
- [ ] Focus resets when system date changes to the next day.
- [ ] Tasks add, complete, and delete correctly.
- [ ] Tasks persist after closing and reopening the browser.

### Phase 3
- [ ] Focus Mode toggle turns on/off visually.
- [ ] Blocked site redirects to `blocked.html`.
- [ ] `blocked.html` shows the correct focus text and wallpaper.
- [ ] "Disable Focus Mode" on blocked page works and redirects back.
- [ ] Focus Mode state persists across browser restarts.

### Phase 4
- [ ] Settings panel opens and closes smoothly.
- [ ] Name change updates live.
- [ ] Wallpaper upload works and persists.
- [ ] Default wallpaper restore works.
- [ ] Block list add/remove works.
- [ ] Block list changes take effect immediately if Focus Mode is ON.

---

*Document end. Hand this to your AI coding tool phase by phase. Start with Phase 1 and verify the acceptance criteria before proceeding to the next phase.*
