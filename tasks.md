# FocusTab Implementation Tasks

This document outlines the atomic, phased-based development tasks for the FocusTab Chrome Extension based on the PRD.

## Phase 1: Core Shell (Wallpaper, Clock, and Greeting)
*Goal: Render the new tab page with a full-screen wallpaper, live clock, and personalized greeting.*

- [x] **1.1 Project Setup & Manifest**
  - [x] Create `manifest.json` with MV3, `chrome_url_overrides` for "newtab", and "storage" permissions.
  - [x] Create base files: `newtab.html`, `newtab.css`, `newtab.js`.
  - [x] Create `assets/` directory and add `default-wallpaper.jpg`.
- [x] **1.2 UI & Global CSS**
  - [x] Define global CSS tokens (`:root` variables) in `newtab.css` (fonts, colors, blurs).
  - [x] Setup `newtab.html` skeleton with a full-screen background and semi-transparent dark overlay (`rgba(0,0,0,0.35)`).
  - [x] Implement default wallpaper styling (`background-size: cover`, `background-position: center`).
- [x] **1.3 Live Clock Component**
  - [x] Add HTML placeholder for time and date.
  - [x] Style clock text (large, light-weight, centered).
  - [x] Write `newtab.js` logic to format and display current time (12-hour format).
  - [x] Write logic to update time every second (`setInterval`).
  - [x] Write logic to format and display the current date (e.g., "Thursday, April 24").
- [x] **1.4 Personalized Greeting Component**
  - [x] Add HTML placeholder for the greeting under the date.
  - [x] Write logic to calculate the time of day (Morning: 05-11, Afternoon: 12-16, Evening: 17-04).
  - [x] Read `userName` from `chrome.storage.local` (fallback to "Sanjay").
  - [x] Update greeting DOM element on load.
- [x] **Phase 1 Verification**
  - [ ] Review Phase 1 Acceptance Criteria and test manually (load the extension in Chrome).

## Phase 2: Daily Focus Prompt and Task List
*Goal: Implement the daily focus intention system and local task manager.*

- [x] **2.1 Daily Focus System**
  - [x] Add "Focus Input" modal UI to `newtab.html` (centered, glassmorphism, input field, submit button).
  - [x] Add "Focus Display" UI to `newtab.html` (under greeting, with text and pencil/edit icon, hidden by default).
  - [x] Write logic to check `focusText` and `focusDate` on tab open.
  - [x] Implement Reset Logic: If `focusDate` !== today, clear values and show Focus Input UI.
  - [x] Implement Submit Logic: Save input text and today's date to storage, switch UI to Focus Display.
  - [x] Implement Empty Submit Validation: Trigger CSS shake animation on empty input.
  - [x] Implement Edit Logic: Clicking pencil icon switches back to Focus Input UI pre-filled with `focusText`.
- [x] **2.2 Task List System**
  - [x] Add Task List container UI to bottom-left quadrant (max 300px wide, frosted glass).
  - [x] Add Task Input UI (placeholder "Add a task...", submit on Enter).
  - [x] Implement Task schema and `chrome.storage.local` load logic (key `tasks`).
  - [x] Implement Add Task logic (create UUID, save to storage, render item).
  - [x] Enforce 50 task limit (disable input, show "50 task limit reached" message).
  - [x] Implement Render logic for task items (checkbox, text, hover delete button, max 7 visible with scroll).
  - [x] Implement Mark Done logic (toggle state, add CSS strikethrough/faded style, save).
  - [x] Implement Delete logic (remove from array, save, remove from DOM without confirmation).
- [x] **Phase 2 Verification**
  - [ ] Review Phase 2 Acceptance Criteria and test manually (reload extension in Chrome).

## Phase 3: Focus Mode (Site Blocking)
*Goal: Add focus mode toggle and dynamic site-blocking with redirection.*

- [x] **3.1 Background & Permissions Setup**
  - [x] Add `declarativeNetRequest`, `declarativeNetRequestWithHostAccess` to `manifest.json` permissions.
  - [x] Register `background.js` as service worker in `manifest.json`.
  - [x] Create `background.js`, `blocked.html`, `blocked.css`, and `blocked.js` files.
- [x] **3.2 Focus Mode Toggle**
  - [x] Add Pill-shaped toggle button to top-right of `newtab.html`.
  - [x] Style toggle states (OFF: subdued, ON: highlighted red/amber border).
  - [x] Write logic to load toggle state `focusModeEnabled` from storage.
  - [x] Write toggle click handler (save new state to storage).
- [x] **3.3 Blocking Rules Engine (background.js)**
  - [x] Define default block list array in `background.js` and save to `blockList` storage key on install.
  - [x] Listen for changes to `focusModeEnabled` or `blockList` via `chrome.storage.onChanged`.
  - [x] Write function to generate dynamic `declarativeNetRequest` rules targeting `blocked.html`.
  - [x] Write function to apply dynamic rules when Focus Mode is ON.
  - [x] Write function to remove all dynamic rules when Focus Mode is OFF.
- [x] **3.4 Blocked Page UI & Logic**
  - [x] Build `blocked.html` matching the new tab aesthetic (wallpaper, dark overlay).
  - [x] Add centered content: Icon, "You're in Focus Mode", current focus text, and "Disable Focus Mode" button.
  - [x] Write `blocked.js` to fetch current `focusText` and `wallpaperData` from storage for display.
  - [x] Implement "Disable Focus Mode" click handler (set `focusModeEnabled` = false, redirect back to attempted URL via query param).
- [x] **Phase 3 Verification**
  - [ ] Review Phase 3 Acceptance Criteria and test manually (reload extension in Chrome).

## Phase 4: Settings Panel
*Goal: Add a gear icon and slide-in panel to manage profile, wallpaper, and block list.*

- [x] **4.1 Settings Panel Shell**
  - [x] Add gear icon to bottom-right of `newtab.html` (opacity hover effects).
  - [x] Add slide-in drawer UI for Settings Panel (right-aligned, hidden by default, semi-opaque dark bg).
  - [x] Implement open/close logic (gear click, 'X' close button, click outside panel overlay).
  - [x] Add CSS transition for sliding (`transform: translateX`).
- [x] **4.2 Profile Settings**
  - [x] Add "Your Name" section with text input and "Save Name" button.
  - [x] Load current `userName` into input on panel open.
  - [x] Implement save logic (validate < 30 chars, update storage, live update greeting DOM).
- [x] **4.3 Wallpaper Settings**
  - [x] Add "Background Wallpaper" section with thumbnail preview, hidden `<input type="file">`, and "Reset" button.
  - [x] Implement image upload logic (FileReader to Base64, save to `wallpaperData` storage).
  - [x] Implement live wallpaper update on the current page.
  - [x] Implement "Reset to Default" logic (clear `wallpaperData`, restore CSS background to default image).
  - [x] Handle >5MB image warnings gracefully.
- [x] **4.4 Block List Settings**
  - [x] Add "Blocked Sites" section with list of domain chips, text input, and "Add" button.
  - [x] Load and render current `blockList` as removable chips (with 'X' icons).
  - [x] Implement Add Domain logic (strip url protocols, validate regex, prevent duplicates).
  - [x] Implement Save Block List logic (update storage, trigger rule re-evaluation in background.js if ON).
  - [x] Implement Remove Domain logic (update storage, trigger rule re-evaluation).
  - [x] Implement "Reset to Defaults" logic (restore initial array, save to storage).
- [x] **Phase 4 Verification**
  - [ ] Review Phase 4 Acceptance Criteria and test manually (reload extension in Chrome).

## Final Polish & Deployment
- [ ] Conduct full UI layout review against PRD Section 5.
- [ ] Perform Error Handling testing (PRD Section 7).
- [ ] Run complete Testing Checklist (PRD Section 10).
