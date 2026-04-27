# FocusTab — Phase 5, 6 & 7 PRD

**Product Name:** FocusTab (Existing Extension)
**Owner:** Sanjay Polamarasetti
**Version:** 2.0
**Builds On:** Existing Phase 1–4 (newtab.html, newtab.js, newtab.css, background.js)

> ⚠️ IMPORTANT FOR AI CODING TOOL:
> This PRD adds NEW features to the EXISTING FocusTab Chrome Extension.
> Do NOT rewrite existing files from scratch.
> Only ADD new code to existing files — newtab.html, newtab.js, newtab.css.
> Do NOT break any existing Phase 1–4 features.

---

## Phase 5 — Daily Motivational Quote

### Goal
Show a new motivational quote every day, automatically, below the Today's Focus section.

---

### 5.1 Quote Display UI

- Position: Centered on screen, below the `.focus-display` section
- Layout:
  - A small label above: `"DAILY QUOTE"` in small caps, muted color (same style as `"TODAY'S FOCUS"` label)
  - Below it: The quote text in italic, light font weight, white color
  - Below the quote: The author name in smaller muted text — `"— Author Name"`
- Width: max `560px`, centered
- Animation: Fade in smoothly on load (same `cardFadeIn` animation already in CSS)

---

### 5.2 Quote Data

- Store a hardcoded list of **30 motivational quotes** as a JavaScript array inside `newtab.js`
- Each quote object:
```json
{
  "text": "The secret of getting ahead is getting started.",
  "author": "Mark Twain"
}
```

**Use these 30 quotes:**
1. "The secret of getting ahead is getting started." — Mark Twain
2. "It always seems impossible until it's done." — Nelson Mandela
3. "Don't watch the clock; do what it does. Keep going." — Sam Levenson
4. "The future depends on what you do today." — Mahatma Gandhi
5. "Success is not final, failure is not fatal: it is the courage to continue that counts." — Winston Churchill
6. "Believe you can and you're halfway there." — Theodore Roosevelt
7. "Your time is limited, don't waste it living someone else's life." — Steve Jobs
8. "Hard work beats talent when talent doesn't work hard." — Tim Notke
9. "Dream big and dare to fail." — Norman Vaughan
10. "Do one thing every day that scares you." — Eleanor Roosevelt
11. "What you get by achieving your goals is not as important as what you become." — Zig Ziglar
12. "The only way to do great work is to love what you do." — Steve Jobs
13. "In the middle of every difficulty lies opportunity." — Albert Einstein
14. "Life is what happens when you're busy making other plans." — John Lennon
15. "Strive not to be a success, but rather to be of value." — Albert Einstein
16. "You miss 100% of the shots you don't take." — Wayne Gretzky
17. "Whether you think you can or you think you can't, you're right." — Henry Ford
18. "The best time to plant a tree was 20 years ago. The second best time is now." — Chinese Proverb
19. "An unexamined life is not worth living." — Socrates
20. "Spread love everywhere you go." — Mother Teresa
21. "When you reach the end of your rope, tie a knot in it and hang on." — Franklin D. Roosevelt
22. "Always remember that you are absolutely unique." — Margaret Mead
23. "Do not go where the path may lead, go instead where there is no path and leave a trail." — Ralph Waldo Emerson
24. "You will face many defeats in life, but never let yourself be defeated." — Maya Angelou
25. "The greatest glory in living lies not in never falling, but in rising every time we fall." — Nelson Mandela
26. "In the end, it's not the years in your life that count. It's the life in your years." — Abraham Lincoln
27. "Never let the fear of striking out keep you from playing the game." — Babe Ruth
28. "Life is either a daring adventure or nothing at all." — Helen Keller
29. "Many of life's failures are people who did not realize how close they were to success when they gave up." — Thomas Edison
30. "You have brains in your head. You have feet in your shoes. You can steer yourself any direction you choose." — Dr. Seuss

---

### 5.3 Quote Selection Logic

- On each new tab open, get today's date as `YYYY-MM-DD`
- Convert the date to a number: `dayOfYear` (day number in the year, 1–365)
- Select quote using: `quotes[dayOfYear % quotes.length]`
- This means the same quote shows ALL DAY and automatically changes the next day
- No storage needed — purely date-based calculation
- Do NOT show a random quote on every tab open — must be stable all day

---

### 5.4 CSS for Quote Section

Add these new styles to `newtab.css`:

```css
.quote-section {
  margin-top: 18px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  animation: cardFadeIn 0.35s ease;
  max-width: 560px;
  text-align: center;
}

.quote-section__label {
  font-size: 0.7rem;
  font-weight: 500;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--color-muted);
}

.quote-section__text {
  font-size: clamp(0.85rem, 1.6vw, 1rem);
  font-weight: 300;
  font-style: italic;
  color: rgba(255, 255, 255, 0.85);
  line-height: 1.6;
}

.quote-section__author {
  font-size: 0.78rem;
  font-weight: 400;
  color: var(--color-muted);
  margin-top: 2px;
}
```

---

### 5.5 HTML Addition

Add this block inside `newtab.html` directly below the `.focus-display` div:

```html
<!-- Phase 5: Daily Quote -->
<div class="quote-section" id="quoteSection">
  <span class="quote-section__label">Daily Quote</span>
  <p class="quote-section__text" id="quoteText"></p>
  <span class="quote-section__author" id="quoteAuthor"></span>
</div>
```

---

### 5.6 Storage Keys

No new storage keys needed for Phase 5.

---

### Acceptance Criteria — Phase 5
- [ ] A quote appears below the Today's Focus section every day
- [ ] The same quote shows all day — does not change on every tab open
- [ ] The quote changes automatically the next day
- [ ] Author name shows below the quote
- [ ] Fades in smoothly on load
- [ ] No console errors

---

## Phase 6 — Daily Focus Streak Counter

### Goal
Track and show how many consecutive days the user has set a daily focus. Motivates consistency.

---

### 6.1 Streak Display UI

- Position: Inside the `.clock-section`, directly below the greeting text
- Layout:
  - A fire emoji 🔥 followed by: `"5 day streak"` (or whatever the count is)
  - Font: Small, muted, same style as the date text
  - If streak is 0 or 1: Show `"Start your streak today!"` instead of a number
  - If streak is 1: Show `"🔥 1 day streak"`
  - If streak >= 2: Show `"🔥 X day streak"`

---

### 6.2 Streak Logic

**Storage keys needed:**

| Key | Type | Description |
|---|---|---|
| `streakCount` | number | Current streak count |
| `streakLastDate` | string | Last date (YYYY-MM-DD) the user set a focus |

**Rules:**
- When the user **submits their daily focus** (clicks "Set Focus" button):
  - Get today's date as `YYYY-MM-DD`
  - Get `streakLastDate` from storage
  - If `streakLastDate` is yesterday → increment `streakCount` by 1
  - If `streakLastDate` is today → do nothing (already counted today)
  - If `streakLastDate` is older than yesterday OR empty → reset `streakCount` to 1
  - Save new `streakCount` and `streakLastDate` = today
- On new tab open: just read `streakCount` and display it
- Streak does NOT reset just because the user opens a new tab — only resets when they set a new focus after skipping a day

---

### 6.3 CSS for Streak

Add to `newtab.css`:

```css
.streak-display {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin-top: 8px;
  font-size: 0.82rem;
  color: var(--color-muted);
  font-weight: 400;
  letter-spacing: 0.03em;
  animation: greetingFadeIn 0.7s 0.5s ease forwards;
  opacity: 0;
}

.streak-display__emoji {
  font-size: 0.9rem;
}
```

---

### 6.4 HTML Addition

Add this inside `newtab.html` directly below the `.greeting` div:

```html
<!-- Phase 6: Streak Counter -->
<div class="streak-display" id="streakDisplay">
  <span class="streak-display__emoji">🔥</span>
  <span id="streakText">Start your streak today!</span>
</div>
```

---

### 6.5 Storage Keys

| Key | Type | Description |
|---|---|---|
| `streakCount` | number | Current consecutive day streak |
| `streakLastDate` | string | YYYY-MM-DD of last focus set |

---

### Acceptance Criteria — Phase 6
- [ ] Streak counter shows below the greeting
- [ ] Streak increments by 1 when user sets focus on a new day
- [ ] Streak resets to 1 if user skips a day
- [ ] Shows "Start your streak today!" when streak is 0
- [ ] Shows "🔥 X day streak" when streak >= 1
- [ ] Streak persists across browser restarts
- [ ] No console errors

---

## Phase 7 — Pomodoro Timer Widget

### Goal
Add a simple Pomodoro timer to the new tab page — 25 minute focus sessions with 5 minute breaks.

---

### 7.1 Pomodoro Timer UI

- Position: Bottom-right area of the screen, next to the settings gear icon
- Layout: A compact card (same frosted-glass style as task panel)
- Width: `200px`
- Contents:
  - Label at top: `"POMODORO"` in small caps, muted
  - Large timer display: `25:00` counting down
  - Below timer: current mode label — `"Focus"` or `"Break"`
  - Two buttons side by side:
    - `▶ Start` — starts the timer
    - `↺ Reset` — resets to 25:00
  - When timer is running, Start button changes to `⏸ Pause`

---

### 7.2 Timer Logic

**Pomodoro cycle:**
- Focus session: **25 minutes** (1500 seconds)
- Short break: **5 minutes** (300 seconds)
- One full cycle = Focus → Break → Focus → Break...

**Behavior:**
- On page load: timer shows `25:00`, mode is `"Focus"`, timer is NOT running
- Click Start: timer begins counting down every second
- Click Pause: timer pauses at current time
- Click Reset: timer resets to 25:00, mode resets to Focus, stops running
- When Focus timer hits `00:00`:
  - Play a soft audio beep (use Web Audio API — no external audio files needed)
  - Automatically switch to Break mode (5:00)
  - Show a brief notification text: `"Break time! 🎉"`
  - Timer does NOT auto-start the break — user must click Start again
- When Break timer hits `00:00`:
  - Play audio beep
  - Switch back to Focus mode (25:00)
  - Show: `"Back to focus! 💪"`
  - Timer does NOT auto-start — user must click Start

**Audio beep using Web Audio API (no files needed):**
```javascript
function playBeep() {
  const ctx = new AudioContext();
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();
  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);
  oscillator.frequency.value = 880;
  gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
  oscillator.start(ctx.currentTime);
  oscillator.stop(ctx.currentTime + 0.8);
}
```

**Timer persistence:**
- Timer state is NOT saved to storage
- If the user opens a new tab, the timer resets to default
- This is intentional — Pomodoro is a per-session tool

---

### 7.3 CSS for Pomodoro Widget

Add to `newtab.css`:

```css
.pomodoro-panel {
  pointer-events: all;
  width: 200px;
  background: var(--color-card-bg);
  border: 1px solid var(--color-card-border);
  backdrop-filter: var(--backdrop-blur);
  -webkit-backdrop-filter: var(--backdrop-blur);
  border-radius: var(--border-radius-card);
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  animation: cardFadeIn 0.45s 0.2s ease both;
}

.pomodoro-panel__title {
  font-size: 0.78rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--color-muted);
}

.pomodoro-panel__timer {
  font-size: 2rem;
  font-weight: 200;
  color: var(--color-white);
  text-align: center;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.04em;
  line-height: 1;
}

.pomodoro-panel__mode {
  font-size: 0.78rem;
  color: var(--color-muted);
  text-align: center;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.pomodoro-panel__mode--break {
  color: #66d9a0;
}

.pomodoro-panel__buttons {
  display: flex;
  gap: 8px;
}

.pomodoro-btn {
  flex: 1;
  background: rgba(255, 255, 255, 0.10);
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: var(--border-radius-pill);
  color: var(--color-white);
  font-family: var(--font-family);
  font-size: 0.78rem;
  font-weight: 500;
  padding: 7px 6px;
  cursor: pointer;
  text-align: center;
  transition: background var(--transition-default), border-color var(--transition-default);
}

.pomodoro-btn:hover {
  background: rgba(255, 255, 255, 0.18);
  border-color: rgba(255, 255, 255, 0.35);
}

.pomodoro-btn--active {
  background: rgba(255, 77, 77, 0.15);
  border-color: rgba(255, 77, 77, 0.5);
  color: #ff8080;
}

.pomodoro-panel__message {
  font-size: 0.75rem;
  text-align: center;
  color: #66d9a0;
  min-height: 1em;
  transition: opacity 0.3s ease;
}
```

---

### 7.4 HTML Addition

Add this inside `.bottom-bar__right` in `newtab.html`, before the settings gear button:

```html
<!-- Phase 7: Pomodoro Timer -->
<div class="pomodoro-panel" id="pomodoroPanel">
  <div class="pomodoro-panel__title">Pomodoro</div>
  <div class="pomodoro-panel__timer" id="pomodoroTimer">25:00</div>
  <div class="pomodoro-panel__mode" id="pomodoroMode">Focus</div>
  <div class="pomodoro-panel__buttons">
    <button class="pomodoro-btn" id="pomodoroStartBtn">▶ Start</button>
    <button class="pomodoro-btn" id="pomodoroResetBtn">↺ Reset</button>
  </div>
  <div class="pomodoro-panel__message" id="pomodoroMessage"></div>
</div>
```

---

### 7.5 Storage Keys

No new storage keys needed for Phase 7 (timer is session-only).

---

### Acceptance Criteria — Phase 7
- [ ] Pomodoro widget appears in bottom-right next to the gear icon
- [ ] Timer starts at 25:00 and counts down when Start is clicked
- [ ] Pause button stops the timer at current time
- [ ] Resume continues from where it paused
- [ ] Reset returns to 25:00 and stops
- [ ] When Focus timer hits 00:00 — beep plays, switches to Break (5:00)
- [ ] When Break timer hits 00:00 — beep plays, switches back to Focus (25:00)
- [ ] Mode label updates correctly between "Focus" and "Break"
- [ ] Brief message shows when session ends
- [ ] Timer resets on new tab open (no persistence)
- [ ] No console errors

---

## Full Storage Keys Reference (All Phases)

| Key | Type | Phase | Description |
|---|---|---|---|
| `userName` | string | 1 | User's display name |
| `focusText` | string | 2 | Today's focus intention |
| `focusDate` | string | 2 | Date focus was set (YYYY-MM-DD) |
| `tasks` | JSON array | 2 | All task items |
| `focusModeEnabled` | boolean | 3 | Whether Focus Mode is active |
| `blockList` | string array | 3 | Domains to block |
| `wallpaperData` | string | 4 | Base64 wallpaper image |
| `streakCount` | number | 6 | Current day streak |
| `streakLastDate` | string | 6 | Last date focus was set |

---

## Final UI Layout (After All Phases)

```
┌─────────────────────────────────────────────────┐
│                                  [🎯 Focus Mode] │
│                                                  │
│              3:15 PM                             │
│           MONDAY, APRIL 27                       │
│         Good afternoon, Sanjay                   │
│           🔥 5 day streak          ← NEW Ph6     │
│                                                  │
│              TODAY'S FOCUS                       │
│         Complete N8N Automations ✏️              │
│                                                  │
│              DAILY QUOTE           ← NEW Ph5     │
│    "The secret of getting ahead..."              │
│              — Mark Twain                        │
│                                                  │
│  ┌─────────────┐     ┌──────────┐               │
│  │  Tasks      │     │POMODORO  │← NEW Ph7       │
│  │ ○ Buy milk  │     │  24:32   │               │
│  │ [Add task…] │     │  Focus   │               │
│  └─────────────┘     │▶ Start ↺│          [⚙️] │
│                       └──────────┘               │
└─────────────────────────────────────────────────┘
```

---

## Build Order for Antigravity

Build one phase at a time. Test each before moving to the next.

**Phase 5 prompt:**
```
@focustab-phase5-7-prd.md
Build Phase 5 - Daily Motivational Quote into the existing FocusTab extension.
Only add new code. Do not change or break any existing Phase 1-4 features.
```

**Phase 6 prompt:**
```
@focustab-phase5-7-prd.md
Build Phase 6 - Daily Focus Streak Counter into the existing FocusTab extension.
Only add new code. Do not change or break any existing Phase 1-5 features.
```

**Phase 7 prompt:**
```
@focustab-phase5-7-prd.md
Build Phase 7 - Pomodoro Timer Widget into the existing FocusTab extension.
Only add new code. Do not change or break any existing Phase 1-6 features.
```

---

*Hand this PRD to Antigravity phase by phase. Always test in Chrome after each phase before proceeding.*
