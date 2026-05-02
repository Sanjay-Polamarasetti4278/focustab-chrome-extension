# FocusTab — Phase 8 & 9 PRD
# Daily Focus Time KPI & Analytics Dashboard

**Product Name:** FocusTab (Existing Extension)
**Owner:** Sanjay Polamarasetti
**Version:** 3.0
**Builds On:** Existing Phase 1–7

> ⚠️ IMPORTANT FOR AI CODING TOOL:
> This PRD adds NEW features to the EXISTING FocusTab Chrome Extension.
> Do NOT rewrite existing files from scratch.
> Only ADD new code to existing files — newtab.html, newtab.js, newtab.css.
> Do NOT break any existing Phase 1–7 features.

---

## Phase 8 — Daily Focus Time KPI (Data Collection)

### Goal
Silently track and store daily usage data in the background so the Analytics Dashboard (Phase 9) has real data to display. This phase is invisible to the user — no UI changes.

---

### 8.1 What Data to Track

Track the following every day and store in `chrome.storage.local`:

| Metric | How to Track |
|---|---|
| Total time spent in extension | Track seconds from when new tab opens to when it loses focus |
| Focus goal set or not | Already tracked via `focusDate` |
| Tasks completed per day | Count tasks marked done each day |
| Pomodoro sessions completed | Count every time Focus timer hits 00:00 |
| Current streak | Already tracked via `streakCount` |
| Most productive day | Derived from total focus time per day of week |

---

### 8.2 Data Storage Structure

Store all analytics data under one key: `analyticsLog`

Schema — a JSON object where each key is a date string `YYYY-MM-DD`:

```json
{
  "2026-04-27": {
    "date": "2026-04-27",
    "dayOfWeek": "Monday",
    "focusSet": true,
    "focusText": "Complete N8N Automations",
    "tasksCompleted": 3,
    "pomodoroSessions": 4,
    "timeInExtension": 1820,
    "streakCount": 5
  },
  "2026-04-28": {
    "date": "2026-04-28",
    "dayOfWeek": "Tuesday",
    "focusSet": false,
    "focusText": "",
    "tasksCompleted": 1,
    "pomodoroSessions": 2,
    "timeInExtension": 640,
    "streakCount": 0
  }
}
```

**Field descriptions:**
- `date` — YYYY-MM-DD
- `dayOfWeek` — Full day name (Monday, Tuesday etc.)
- `focusSet` — true if user set a focus goal that day
- `focusText` — what the focus was
- `tasksCompleted` — number of tasks marked done that day
- `pomodoroSessions` — number of completed 25-min focus sessions
- `timeInExtension` — total seconds the new tab was open and active
- `streakCount` — streak count on that day

---

### 8.3 Tracking Logic in newtab.js

**Time in Extension:**
- When the new tab page loads: record `sessionStartTime = Date.now()`
- Use `document.addEventListener('visibilitychange')`:
  - When tab becomes hidden: calculate elapsed seconds, add to today's `timeInExtension`
  - When tab becomes visible again: reset `sessionStartTime = Date.now()`
- Also save on `window.beforeunload` event
- Save accumulated time to `analyticsLog[today].timeInExtension`

**Tasks Completed:**
- Every time a task checkbox is clicked to mark DONE:
  - Increment `analyticsLog[today].tasksCompleted` by 1
- If a task is unchecked (marked undone):
  - Decrement `analyticsLog[today].tasksCompleted` by 1 (minimum 0)

**Pomodoro Sessions:**
- Every time the Pomodoro Focus timer hits 00:00 (completes a session):
  - Increment `analyticsLog[today].pomodoroSessions` by 1

**Focus Set:**
- When user submits their daily focus:
  - Set `analyticsLog[today].focusSet = true`
  - Set `analyticsLog[today].focusText = focusText`
  - Set `analyticsLog[today].streakCount = streakCount`

**Daily Init:**
- On every new tab open, check if `analyticsLog[today]` exists
- If NOT: create a new entry for today with all values set to 0/false
- If YES: just load existing data and continue accumulating

**Data Retention:**
- Keep only last 90 days of data
- On each new tab open, delete entries older than 90 days
- This prevents storage from growing indefinitely

---

### 8.4 Storage Keys

| Key | Type | Description |
|---|---|---|
| `analyticsLog` | JSON object | All daily analytics data, keyed by date |

---

### Acceptance Criteria — Phase 8
- [ ] `analyticsLog` is created in storage on first new tab open
- [ ] Today's entry is initialized with zeros if it doesn't exist
- [ ] Time in extension accumulates correctly when tab is hidden/shown
- [ ] Task completions are tracked correctly
- [ ] Pomodoro completions are tracked correctly
- [ ] Focus set status is tracked correctly
- [ ] Data older than 90 days is automatically deleted
- [ ] No console errors
- [ ] No visible UI changes — this phase is purely data collection

---

## Phase 9 — Analytics Dashboard (Full Screen Panel)

### Goal
A beautiful, full-screen analytics dashboard that opens when the user clicks an Analytics button on the new tab page. Shows all tracked KPIs with charts and insights for the last 90 days.

---

### 9.1 Analytics Button UI

- Position: Top-left corner of the new tab page
- Style: Same pill-shaped button style as Focus Mode button
- Label: `📊 Analytics`
- Clicking opens the Analytics Dashboard as a full-screen overlay
- Same open/close pattern as the Settings panel (slide-in or fade-in)

**HTML to add in `newtab.html`:**
```html
<!-- Phase 9: Analytics Button -->
<div class="topbar-left">
  <button class="analytics-btn" id="analyticsBtn">
    <span>📊</span>
    <span>Analytics</span>
  </button>
</div>
```

**CSS for button:**
```css
.topbar-left {
  position: fixed;
  top: 28px;
  left: 28px;
  z-index: 50;
}

.analytics-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(0, 0, 0, 0.35);
  border: 1px solid rgba(255, 255, 255, 0.18);
  backdrop-filter: var(--backdrop-blur);
  -webkit-backdrop-filter: var(--backdrop-blur);
  border-radius: var(--border-radius-pill);
  color: rgba(255, 255, 255, 0.7);
  font-family: var(--font-family);
  font-size: 0.82rem;
  font-weight: 500;
  padding: 8px 16px;
  cursor: pointer;
  letter-spacing: 0.02em;
  transition: all var(--transition-default);
}

.analytics-btn:hover {
  color: var(--color-white);
  border-color: rgba(255, 255, 255, 0.35);
  background: rgba(0, 0, 0, 0.5);
}
```

---

### 9.2 Analytics Dashboard Panel

- Type: Full-screen overlay panel (not a separate page)
- Opens over the new tab page with a dark overlay behind it
- Has a close button `✕` in the top-right corner
- Clicking outside the panel closes it
- Scrollable content inside

**HTML Structure:**
```html
<!-- Phase 9: Analytics Dashboard Overlay -->
<div class="analytics-overlay" id="analyticsOverlay"></div>

<div class="analytics-panel" id="analyticsPanel">
  <div class="analytics-panel__header">
    <h2 class="analytics-panel__title">📊 Your Focus Analytics</h2>
    <button class="analytics-panel__close" id="analyticsClose">✕</button>
  </div>
  <div class="analytics-panel__body" id="analyticsPanelBody">
    <!-- KPI Cards Row -->
    <div class="analytics-kpi-row" id="analyticsKpiRow"></div>
    <!-- Charts Section -->
    <div class="analytics-charts" id="analyticsCharts"></div>
    <!-- Streak Calendar -->
    <div class="analytics-calendar" id="analyticsCalendar"></div>
  </div>
</div>
```

---

### 9.3 KPI Cards (Top Row)

Show 6 KPI cards in a row at the top of the dashboard:

| KPI Card | Value | Icon |
|---|---|---|
| Total Focus Time | Total hours across 90 days | ⏱️ |
| Current Streak | Current consecutive days | 🔥 |
| Best Streak | Highest streak ever recorded | 🏆 |
| Tasks Completed | Total tasks done in 90 days | ✅ |
| Pomodoro Sessions | Total sessions completed | 🍅 |
| Most Productive Day | Day of week with most focus time | 📅 |

**KPI Card design:**
- Frosted glass card (same style as task panel)
- Large number/value at top
- Small label below
- Emoji icon in top-right corner of card
- Animate in with `cardFadeIn` on open

**CSS for KPI cards:**
```css
.analytics-kpi-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
  margin-bottom: 24px;
}

.kpi-card {
  background: var(--color-card-bg);
  border: 1px solid var(--color-card-border);
  backdrop-filter: var(--backdrop-blur);
  -webkit-backdrop-filter: var(--backdrop-blur);
  border-radius: var(--border-radius-card);
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  position: relative;
  animation: cardFadeIn 0.35s ease;
}

.kpi-card__icon {
  position: absolute;
  top: 14px;
  right: 16px;
  font-size: 1.2rem;
  opacity: 0.6;
}

.kpi-card__value {
  font-size: 1.8rem;
  font-weight: 200;
  color: var(--color-white);
  line-height: 1;
}

.kpi-card__label {
  font-size: 0.72rem;
  font-weight: 500;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--color-muted);
}
```

---

### 9.4 Charts Section

Show 3 charts below the KPI cards:

**Chart 1 — Daily Focus Time (Bar Chart)**
- Title: `"Focus Time — Last 30 Days"`
- X-axis: Last 30 dates (DD/MM format)
- Y-axis: Minutes spent in extension
- Bar color: `rgba(100, 180, 255, 0.7)` (soft blue)
- Show only last 30 days for readability

**Chart 2 — Tasks Completed (Bar Chart)**
- Title: `"Tasks Completed — Last 30 Days"`
- X-axis: Last 30 dates
- Y-axis: Number of tasks completed
- Bar color: `rgba(100, 220, 130, 0.7)` (soft green)

**Chart 3 — Pomodoro Sessions (Bar Chart)**
- Title: `"Pomodoro Sessions — Last 30 Days"`
- X-axis: Last 30 dates
- Y-axis: Number of sessions
- Bar color: `rgba(255, 150, 100, 0.7)` (soft orange)

**Chart Implementation:**
- Use **Chart.js** loaded from CDN (no npm needed):
```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js"></script>
```
- Add this script tag to `newtab.html` in the `<head>` section
- Each chart renders inside a `<canvas>` element
- Dark theme: transparent background, white labels, white gridlines at 10% opacity

**Chart CSS:**
```css
.analytics-charts {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-bottom: 24px;
}

.chart-card {
  background: var(--color-card-bg);
  border: 1px solid var(--color-card-border);
  backdrop-filter: var(--backdrop-blur);
  -webkit-backdrop-filter: var(--backdrop-blur);
  border-radius: var(--border-radius-card);
  padding: 20px;
}

.chart-card__title {
  font-size: 0.78rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--color-muted);
  margin-bottom: 14px;
}

.chart-card canvas {
  max-height: 180px;
}
```

---

### 9.5 Streak Calendar (Last 90 Days)

- Title: `"Focus Streak — Last 90 Days"`
- A grid of 90 small squares (like GitHub contribution graph)
- Each square = one day
- Colors:
  - Focus set that day → `rgba(100, 220, 130, 0.8)` (green)
  - No focus set → `rgba(255, 255, 255, 0.08)` (dim)
  - Today → highlighted border
- Hovering a square shows a tooltip: `"April 27 — Focus: Complete N8N Automations"`
- 7 squares per row (one week per row)
- Oldest date top-left, newest bottom-right

**CSS:**
```css
.analytics-calendar {
  background: var(--color-card-bg);
  border: 1px solid var(--color-card-border);
  backdrop-filter: var(--backdrop-blur);
  -webkit-backdrop-filter: var(--backdrop-blur);
  border-radius: var(--border-radius-card);
  padding: 20px;
  margin-bottom: 24px;
}

.calendar-title {
  font-size: 0.78rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--color-muted);
  margin-bottom: 14px;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(13, 1fr);
  gap: 4px;
}

.calendar-day {
  aspect-ratio: 1;
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.08);
  cursor: pointer;
  transition: transform 0.15s ease;
  position: relative;
}

.calendar-day--active {
  background: rgba(100, 220, 130, 0.8);
}

.calendar-day--today {
  border: 1px solid rgba(255, 255, 255, 0.5);
}

.calendar-day:hover {
  transform: scale(1.2);
}

.calendar-tooltip {
  position: absolute;
  bottom: 120%;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.85);
  color: var(--color-white);
  font-size: 0.7rem;
  padding: 4px 8px;
  border-radius: 4px;
  white-space: nowrap;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.15s ease;
  z-index: 300;
}

.calendar-day:hover .calendar-tooltip {
  opacity: 1;
}
```

---

### 9.6 Analytics Panel CSS

```css
/* Analytics Overlay */
.analytics-overlay {
  position: fixed;
  inset: 0;
  z-index: 299;
  background: rgba(0, 0, 0, 0.6);
  opacity: 0;
  pointer-events: none;
  transition: opacity var(--transition-slow);
}

.analytics-overlay--visible {
  opacity: 1;
  pointer-events: all;
}

/* Analytics Panel */
.analytics-panel {
  position: fixed;
  inset: 0;
  z-index: 300;
  background: rgba(8, 8, 18, 0.96);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  transform: translateY(100%);
  transition: transform var(--transition-slow);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.analytics-panel--open {
  transform: translateY(0);
}

.analytics-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 28px 40px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  flex-shrink: 0;
}

.analytics-panel__title {
  font-size: 1.2rem;
  font-weight: 500;
  color: var(--color-white);
  letter-spacing: 0.02em;
}

.analytics-panel__close {
  background: none;
  border: none;
  color: var(--color-muted);
  font-size: 1rem;
  cursor: pointer;
  padding: 6px 10px;
  border-radius: 6px;
  transition: color var(--transition-default), background var(--transition-default);
}

.analytics-panel__close:hover {
  color: var(--color-white);
  background: rgba(255, 255, 255, 0.08);
}

.analytics-panel__body {
  flex: 1;
  overflow-y: auto;
  padding: 28px 40px 40px;
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.1) transparent;
}

.analytics-panel__body::-webkit-scrollbar { width: 4px; }
.analytics-panel__body::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
}

.analytics-section-title {
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--color-muted);
  margin-bottom: 14px;
  margin-top: 8px;
}
```

---

### 9.7 Open/Close Logic in newtab.js

```javascript
// Open Analytics
document.getElementById('analyticsBtn').addEventListener('click', () => {
  document.getElementById('analyticsOverlay').classList.add('analytics-overlay--visible');
  document.getElementById('analyticsPanel').classList.add('analytics-panel--open');
  renderAnalytics(); // Build the dashboard content
});

// Close Analytics
function closeAnalytics() {
  document.getElementById('analyticsOverlay').classList.remove('analytics-overlay--visible');
  document.getElementById('analyticsPanel').classList.remove('analytics-panel--open');
}

document.getElementById('analyticsClose').addEventListener('click', closeAnalytics);
document.getElementById('analyticsOverlay').addEventListener('click', closeAnalytics);
```

---

### 9.8 renderAnalytics() Function

This function runs every time the dashboard is opened. It:
1. Reads `analyticsLog` from `chrome.storage.local`
2. Calculates all KPI values
3. Renders KPI cards
4. Renders 3 Chart.js charts
5. Renders the 90-day calendar grid

**KPI Calculations:**
```javascript
function calculateKPIs(log) {
  const dates = Object.keys(log).sort();
  const last90 = dates.slice(-90);

  const totalFocusSeconds = last90.reduce((sum, d) => sum + (log[d].timeInExtension || 0), 0);
  const totalHours = (totalFocusSeconds / 3600).toFixed(1);

  const totalTasks = last90.reduce((sum, d) => sum + (log[d].tasksCompleted || 0), 0);
  const totalPomodoros = last90.reduce((sum, d) => sum + (log[d].pomodoroSessions || 0), 0);

  // Most productive day of week
  const dayTotals = {};
  last90.forEach(d => {
    const day = log[d].dayOfWeek;
    dayTotals[day] = (dayTotals[day] || 0) + (log[d].timeInExtension || 0);
  });
  const mostProductiveDay = Object.entries(dayTotals).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

  // Best streak
  const bestStreak = Math.max(...last90.map(d => log[d].streakCount || 0));

  return { totalHours, totalTasks, totalPomodoros, mostProductiveDay, bestStreak };
}
```

---

### 9.9 Empty State

If `analyticsLog` is empty or has less than 1 day of data:
- Show a centered message:
  - Large emoji: 📊
  - Text: `"No data yet!"`
  - Subtext: `"Start using FocusTab and your analytics will appear here after your first day."`

---

### 9.10 Storage Keys

| Key | Type | Description |
|---|---|---|
| `analyticsLog` | JSON object | All daily data keyed by YYYY-MM-DD |

---

### Acceptance Criteria — Phase 9
- [ ] 📊 Analytics button shows in top-left of new tab page
- [ ] Clicking it opens the full-screen dashboard smoothly
- [ ] ✕ button and clicking outside closes the dashboard
- [ ] 6 KPI cards show with correct values
- [ ] 3 bar charts render correctly with Chart.js
- [ ] 90-day calendar grid renders correctly
- [ ] Green squares show days focus was set
- [ ] Hover tooltip shows date and focus text
- [ ] Empty state shows when no data exists
- [ ] All existing Phase 1-7 features still work
- [ ] No console errors

---

## Build Order for Antigravity

Build Phase 8 first (data collection), test it, then build Phase 9 (dashboard).

**Phase 8 prompt:**
```
@focustab-phase8-9-prd.md
Build Phase 8 - Daily Focus Time KPI Data Collection into the existing FocusTab extension.
This phase has NO UI changes — only add background data tracking logic to newtab.js.
Track: time in extension, tasks completed, pomodoro sessions, focus set status.
Store everything in chrome.storage.local under key "analyticsLog".
Do not change or break any existing Phase 1-7 features.
```

**Phase 9 prompt:**
```
@focustab-phase8-9-prd.md
Build Phase 9 - Analytics Dashboard into the existing FocusTab extension.
Add the Analytics button in the top-left, and a full-screen analytics panel.
Use Chart.js from CDN for the bar charts.
Show 6 KPI cards, 3 bar charts (focus time, tasks, pomodoro), and a 90-day calendar grid.
Do not change or break any existing Phase 1-8 features.
```

---

## Final UI Layout (After Phase 8 & 9)

```
┌─────────────────────────────────────────────────┐
│ [📊 Analytics]              [🎯 Focus Mode ON]   │
│                                                  │
│              3:15 PM                             │
│           MONDAY, APRIL 27                       │
│         Good afternoon, Sanjay                   │
│           🔥 5 day streak                        │
│                                                  │
│              TODAY'S FOCUS                       │
│         Complete N8N Automations ✏️              │
│                                                  │
│              DAILY QUOTE                         │
│    "Life is a daring adventure..."               │
│              — Helen Keller                      │
│                                                  │
│  ┌─────────────┐     ┌──────────┐               │
│  │  Tasks      │     │POMODORO  │               │
│  │ ○ Buy milk  │     │  24:32   │               │
│  └─────────────┘     └──────────┘          [⚙️] │
└─────────────────────────────────────────────────┘

── When Analytics button clicked ──────────────────
┌─────────────────────────────────────────────────┐
│  📊 Your Focus Analytics               [✕]      │
│                                                  │
│  ┌──────┐ ┌──────┐ ┌──────┐                    │
│  │12.4h │ │🔥 5  │ │🏆 12 │  ← KPI Cards       │
│  │Focus │ │Streak│ │Best  │                     │
│  └──────┘ └──────┘ └──────┘                    │
│  ┌──────┐ ┌──────┐ ┌──────┐                    │
│  │ 47   │ │  23  │ │ Mon  │                     │
│  │Tasks │ │Pomo  │ │Best  │                     │
│  └──────┘ └──────┘ └──────┘                    │
│                                                  │
│  [Bar Chart - Focus Time]                        │
│  [Bar Chart - Tasks Completed]                   │
│  [Bar Chart - Pomodoro Sessions]                 │
│                                                  │
│  [90-day Calendar Grid ████░░██░░░░]             │
└─────────────────────────────────────────────────┘
```

---

*Hand this PRD to Antigravity — Phase 8 first, then Phase 9. Always test in Chrome after each phase.*
