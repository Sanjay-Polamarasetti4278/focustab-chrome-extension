/**
 * FocusTab — newtab.js
 * Phase 1: Clock, Date, Greeting, Wallpaper
 * Phase 2: Daily Focus Prompt, Task List
 * Phase 3: Focus Mode Toggle
 * Phase 4: Settings Panel (Name, Wallpaper, Block List)
 */

'use strict';

/* ════════════════════════════════════════
   Constants
   ════════════════════════════════════════ */

const DEFAULT_USER_NAME = 'Sanjay';
const TASK_LIMIT = 50;
const DEFAULT_BLOCK_LIST = [
  'instagram.com','youtube.com','linkedin.com','twitter.com',
  'x.com','facebook.com','reddit.com','tiktok.com',
  'pinterest.com','snapchat.com',
];
const DOMAIN_REGEX = /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const DAY_NAMES   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const MONTH_NAMES = ['January','February','March','April','May','June',
                     'July','August','September','October','November','December'];

/* ════════════════════════════════════════
   Storage Helpers
   ════════════════════════════════════════ */

function storageGet(keys, defaults = {}) {
  return new Promise((resolve) => {
    try {
      chrome.storage.local.get(keys, (result) => {
        if (chrome.runtime.lastError) {
          console.warn('[FocusTab] storage.get error:', chrome.runtime.lastError.message);
          resolve(defaults);
        } else {
          resolve({ ...defaults, ...result });
        }
      });
    } catch (err) {
      console.warn('[FocusTab] storage.get exception:', err);
      resolve(defaults);
    }
  });
}

function storageSet(data) {
  return new Promise((resolve) => {
    try {
      chrome.storage.local.set(data, () => {
        if (chrome.runtime.lastError) {
          console.warn('[FocusTab] storage.set error:', chrome.runtime.lastError.message);
        }
        resolve();
      });
    } catch (err) {
      console.warn('[FocusTab] storage.set exception:', err);
      resolve();
    }
  });
}

/* ════════════════════════════════════════
   Phase 1 — Clock & Date
   ════════════════════════════════════════ */

const clockEl    = document.getElementById('clock');
const dateEl     = document.getElementById('date');
const greetingEl = document.getElementById('greeting');

function formatTime(now) {
  let h = now.getHours();
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${String(now.getMinutes()).padStart(2,'0')} ${ampm}`;
}

function formatDate(now) {
  return `${DAY_NAMES[now.getDay()]}, ${MONTH_NAMES[now.getMonth()]} ${now.getDate()}`;
}

function updateClock() {
  const now = new Date();
  clockEl.textContent = formatTime(now);
  dateEl.textContent  = formatDate(now);
}

/* ════════════════════════════════════════
   Phase 1 — Greeting
   ════════════════════════════════════════ */

function getGreetingPrefix(hour) {
  if (hour >= 5  && hour < 12) return 'Good morning';
  if (hour >= 12 && hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function renderGreeting(name) {
  const safe = (name && name.trim()) ? name.trim() : 'there';
  greetingEl.textContent = `${getGreetingPrefix(new Date().getHours())}, ${safe}`;
}

/* ════════════════════════════════════════
   Phase 1 — Wallpaper
   ════════════════════════════════════════ */

const wallpaperEl = document.getElementById('wallpaper');

async function applyWallpaper(base64 = null) {
  if (base64) {
    wallpaperEl.style.backgroundImage = `url('${base64}')`;
    return;
  }
  const { wallpaperData } = await storageGet(['wallpaperData'], { wallpaperData: null });
  if (wallpaperData) {
    wallpaperEl.style.backgroundImage = `url('${wallpaperData}')`;
  }
  // else: CSS default (assets/default-wallpaper.jpg) is already applied
}

/* ════════════════════════════════════════
   Phase 2 — Focus System
   ════════════════════════════════════════ */

const focusPromptEl      = document.getElementById('focus-prompt');
const focusPromptNameEl  = document.getElementById('focus-prompt-name');
const focusInputEl       = document.getElementById('focus-input');
const focusInputRowEl    = document.getElementById('focus-input-row');
const focusSubmitBtnEl   = document.getElementById('focus-submit-btn');
const focusDisplayEl     = document.getElementById('focus-display');
const focusDisplayTextEl = document.getElementById('focus-display-text');
const focusEditBtnEl     = document.getElementById('focus-edit-btn');

function getTodayDateString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function showFocusPrompt(prefill = '') {
  focusInputEl.value = prefill;
  focusPromptEl.classList.remove('hidden');
  focusDisplayEl.classList.add('hidden');
  setTimeout(() => focusInputEl.focus(), 50);
}

function showFocusDisplay(text) {
  focusDisplayTextEl.textContent = text;
  focusDisplayEl.classList.remove('hidden');
  focusPromptEl.classList.add('hidden');
}

async function handleFocusSubmit() {
  const text = focusInputEl.value.trim();
  if (!text) {
    focusInputRowEl.classList.remove('shake');
    void focusInputRowEl.offsetWidth;
    focusInputRowEl.classList.add('shake');
    return;
  }
  
  const today = getTodayDateString();
  const yesterday = getYesterdayDateString();
  const { streakCount, streakLastDate } = await storageGet(['streakCount', 'streakLastDate'], { streakCount: 0, streakLastDate: '' });
  
  let newStreakCount = streakCount;
  if (streakLastDate === yesterday) {
    newStreakCount += 1;
  } else if (streakLastDate !== today) {
    newStreakCount = 1;
  }
  
  await storageSet({ 
    focusText: text, 
    focusDate: today,
    streakCount: newStreakCount,
    streakLastDate: today
  });
  
  if (typeof updateStreakDisplay === 'function') {
    updateStreakDisplay(newStreakCount);
  }
  showFocusDisplay(text);
}

async function initFocus(userName) {
  const safe = (userName && userName.trim()) ? userName.trim() : 'there';
  if (focusPromptNameEl) focusPromptNameEl.textContent = safe;

  const { focusText, focusDate } = await storageGet(
    ['focusText','focusDate'], { focusText: '', focusDate: '' }
  );
  const today = getTodayDateString();

  if (focusDate === today && focusText) {
    showFocusDisplay(focusText);
  } else {
    if (focusDate !== today) await storageSet({ focusText: '', focusDate: '' });
    showFocusPrompt();
  }

  focusSubmitBtnEl.addEventListener('click', handleFocusSubmit);
  focusInputEl.addEventListener('keydown', (e) => { if (e.key === 'Enter') handleFocusSubmit(); });
  focusEditBtnEl.addEventListener('click', async () => {
    const { focusText: cur } = await storageGet(['focusText'], { focusText: '' });
    showFocusPrompt(cur);
  });
  focusInputRowEl.addEventListener('animationend', () => focusInputRowEl.classList.remove('shake'));
}

/* ════════════════════════════════════════
   Phase 2 — Task List
   ════════════════════════════════════════ */

const taskInputEl    = document.getElementById('task-input');
const taskListEl     = document.getElementById('task-list');
const taskLimitMsgEl = document.getElementById('task-limit-msg');

let tasks = [];

function generateId() {
  return (crypto && crypto.randomUUID) ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function updateTaskInputState() {
  const atLimit = tasks.length >= TASK_LIMIT;
  taskInputEl.disabled = atLimit;
  taskLimitMsgEl.classList.toggle('hidden', !atLimit);
}

function buildCheckboxSVG(done) {
  if (done) return `<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <circle cx="8" cy="8" r="7.5" stroke="rgba(255,255,255,0.6)" fill="rgba(255,255,255,0.15)"/>
    <path d="M4.5 8l2.5 2.5 4-4" stroke="rgba(255,255,255,0.9)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  return `<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <circle cx="8" cy="8" r="7.5" stroke="rgba(255,255,255,0.35)"/></svg>`;
}

function createTaskElement(task) {
  const li = document.createElement('li');
  li.className = `task-item${task.done ? ' task-item--done' : ''}`;
  li.dataset.id = task.id;
  const cb = document.createElement('button');
  cb.className = 'task-item__checkbox';
  cb.setAttribute('aria-label', task.done ? 'Mark incomplete' : 'Mark complete');
  cb.innerHTML = buildCheckboxSVG(task.done);
  const span = document.createElement('span');
  span.className = 'task-item__text';
  span.textContent = task.text;
  const del = document.createElement('button');
  del.className = 'task-item__delete';
  del.setAttribute('aria-label', 'Delete task');
  del.textContent = '✕';
  li.append(cb, span, del);
  cb.addEventListener('click',  () => toggleTask(task.id));
  del.addEventListener('click', () => deleteTask(task.id));
  return li;
}

function renderAllTasks() {
  taskListEl.innerHTML = '';
  [...tasks.filter(t => !t.done), ...tasks.filter(t => t.done)]
    .forEach(t => taskListEl.appendChild(createTaskElement(t)));
  updateTaskInputState();
}

async function persistTasks() { await storageSet({ tasks }); }

async function loadTasks() {
  const { tasks: stored } = await storageGet(['tasks'], { tasks: [] });
  tasks = Array.isArray(stored) ? stored : [];
  renderAllTasks();
}

async function addTask(text) {
  if (tasks.length >= TASK_LIMIT) return;
  tasks.push({ id: generateId(), text, done: false, createdAt: new Date().toISOString() });
  await persistTasks();
  renderAllTasks();
  taskListEl.scrollTop = taskListEl.scrollHeight;
}

async function toggleTask(id) {
  const t = tasks.find(t => t.id === id);
  if (t) { t.done = !t.done; await persistTasks(); renderAllTasks(); }
}

async function deleteTask(id) {
  tasks = tasks.filter(t => t.id !== id);
  await persistTasks();
  renderAllTasks();
}

function initTaskList() {
  taskInputEl.addEventListener('keydown', async (e) => {
    if (e.key !== 'Enter') return;
    const text = taskInputEl.value.trim();
    if (!text) return;
    taskInputEl.value = '';
    await addTask(text);
  });
}

/* ════════════════════════════════════════
   Phase 3 — Focus Mode Toggle
   ════════════════════════════════════════ */

const focusModeBtnEl   = document.getElementById('focus-mode-btn');
const focusModeLabelEl = document.getElementById('focus-mode-label');

let focusModeEnabled = false;

function renderFocusModeBtn(enabled) {
  focusModeEnabled = enabled;
  focusModeBtnEl.setAttribute('aria-pressed', String(enabled));
  focusModeBtnEl.classList.toggle('focus-mode-btn--on', enabled);
  focusModeLabelEl.textContent = enabled ? 'Focus Mode ON' : 'Focus Mode';
}

async function initFocusMode() {
  const { focusModeEnabled: stored } = await storageGet(
    ['focusModeEnabled'], { focusModeEnabled: false }
  );
  renderFocusModeBtn(Boolean(stored));

  focusModeBtnEl.addEventListener('click', async () => {
    const next = !focusModeEnabled;
    await storageSet({ focusModeEnabled: next });
    renderFocusModeBtn(next);
    // background.js reacts to storage change and updates rules
  });
}

/* ════════════════════════════════════════
   Phase 4 — Settings Panel
   ════════════════════════════════════════ */

const settingsBtnEl      = document.getElementById('settings-btn');
const settingsOverlayEl  = document.getElementById('settings-overlay');
const settingsPanelEl    = document.getElementById('settings-panel');
const settingsCloseBtnEl = document.getElementById('settings-close-btn');

function openSettings() {
  settingsPanelEl.classList.add('settings-panel--open');
  settingsPanelEl.setAttribute('aria-hidden', 'false');
  settingsOverlayEl.classList.add('settings-overlay--visible');
  settingsOverlayEl.setAttribute('aria-hidden', 'false');
  populateSettings();
}

function closeSettings() {
  settingsPanelEl.classList.remove('settings-panel--open');
  settingsPanelEl.setAttribute('aria-hidden', 'true');
  settingsOverlayEl.classList.remove('settings-overlay--visible');
  settingsOverlayEl.setAttribute('aria-hidden', 'true');
}

/* ── Section A: Name ── */

const settingsNameInputEl = document.getElementById('settings-name-input');
const settingsNameSaveEl  = document.getElementById('settings-name-save');
const settingsNameMsgEl   = document.getElementById('settings-name-msg');

function showMsg(el, text, type = '') {
  el.textContent = text;
  el.className   = `settings-msg${type ? ` settings-msg--${type}` : ''}`;
  clearTimeout(el._t);
  el._t = setTimeout(() => { el.textContent = ''; }, 3000);
}

async function saveName() {
  const val = settingsNameInputEl.value.trim();
  if (!val)       { showMsg(settingsNameMsgEl, 'Name cannot be empty.', 'error');   return; }
  if (val.length > 30) { showMsg(settingsNameMsgEl, 'Name too long (max 30 chars).', 'error'); return; }
  await storageSet({ userName: val });
  renderGreeting(val);
  if (focusPromptNameEl) focusPromptNameEl.textContent = val;
  showMsg(settingsNameMsgEl, 'Name saved!', 'success');
}

/* ── Section B: Wallpaper ── */

const wallpaperPreviewEl  = document.getElementById('wallpaper-preview');
const wallpaperFileInputEl = document.getElementById('wallpaper-file-input');
const wallpaperUploadBtnEl = document.getElementById('wallpaper-upload-btn');
const wallpaperResetBtnEl  = document.getElementById('wallpaper-reset-btn');
const settingsWallMsgEl    = document.getElementById('settings-wallpaper-msg');

function updateWallpaperPreview(src) {
  wallpaperPreviewEl.style.backgroundImage = src ? `url('${src}')` : `url('assets/default-wallpaper.jpg')`;
}

async function handleWallpaperUpload(file) {
  if (!file) return;
  if (file.size > 5 * 1024 * 1024) {
    showMsg(settingsWallMsgEl, 'Image may be too large (>5MB). Attempting anyway…');
  }
  const reader = new FileReader();
  reader.onload = async (e) => {
    const base64 = e.target.result;
    await storageSet({ wallpaperData: base64 });
    applyWallpaper(base64);
    updateWallpaperPreview(base64);
    showMsg(settingsWallMsgEl, 'Wallpaper updated!', 'success');
  };
  reader.onerror = () => showMsg(settingsWallMsgEl, 'Failed to read image.', 'error');
  reader.readAsDataURL(file);
}

async function resetWallpaper() {
  await storageSet({ wallpaperData: null });
  wallpaperEl.style.backgroundImage = `url('assets/default-wallpaper.jpg')`;
  updateWallpaperPreview(null);
  showMsg(settingsWallMsgEl, 'Wallpaper reset to default.', 'success');
}

/* ── Section C: Block List ── */

const blockListChipsEl  = document.getElementById('block-list-chips');
const blockDomainInputEl = document.getElementById('block-domain-input');
const blockDomainAddBtnEl = document.getElementById('block-domain-add-btn');
const settingsBlockMsgEl  = document.getElementById('settings-block-msg');
const blockListResetBtnEl = document.getElementById('block-list-reset-btn');

let blockList = [...DEFAULT_BLOCK_LIST];

function normalizeDomain(raw) {
  return raw.trim()
    .replace(/^https?:\/\//i, '')
    .replace(/^www\./i, '')
    .replace(/\/.*$/, '')
    .toLowerCase();
}

function renderBlockChips() {
  blockListChipsEl.innerHTML = '';
  blockList.forEach((domain) => {
    const chip = document.createElement('span');
    chip.className = 'chip';
    chip.setAttribute('role', 'listitem');
    const label = document.createElement('span');
    label.textContent = domain;
    const removeBtn = document.createElement('button');
    removeBtn.className = 'chip__remove';
    removeBtn.setAttribute('aria-label', `Remove ${domain}`);
    removeBtn.textContent = '✕';
    removeBtn.addEventListener('click', () => removeDomain(domain));
    chip.append(label, removeBtn);
    blockListChipsEl.appendChild(chip);
  });
}

async function saveBlockList() {
  await storageSet({ blockList });
  // background.js will react via storage.onChanged and update rules if focus mode is on
}

async function addDomain() {
  const raw = blockDomainInputEl.value;
  const domain = normalizeDomain(raw);
  if (!domain) { showMsg(settingsBlockMsgEl, 'Domain cannot be empty.', 'error'); return; }
  if (!DOMAIN_REGEX.test(domain)) { showMsg(settingsBlockMsgEl, 'Invalid domain format.', 'error'); return; }
  if (blockList.includes(domain)) { showMsg(settingsBlockMsgEl, 'Already in list.'); return; }
  blockList.push(domain);
  blockDomainInputEl.value = '';
  renderBlockChips();
  await saveBlockList();
  showMsg(settingsBlockMsgEl, `${domain} added.`, 'success');
}

async function removeDomain(domain) {
  blockList = blockList.filter(d => d !== domain);
  renderBlockChips();
  await saveBlockList();
}

async function resetBlockList() {
  blockList = [...DEFAULT_BLOCK_LIST];
  renderBlockChips();
  await saveBlockList();
  showMsg(settingsBlockMsgEl, 'Block list reset to defaults.', 'success');
}

/* ── Populate panel with current values on open ── */
async function populateSettings() {
  const { userName, wallpaperData, blockList: stored } =
    await storageGet(['userName','wallpaperData','blockList'], {
      userName: DEFAULT_USER_NAME, wallpaperData: null, blockList: DEFAULT_BLOCK_LIST,
    });

  settingsNameInputEl.value = userName || DEFAULT_USER_NAME;
  updateWallpaperPreview(wallpaperData);

  blockList = Array.isArray(stored) && stored.length ? stored : [...DEFAULT_BLOCK_LIST];
  renderBlockChips();
}

function initSettings() {
  settingsBtnEl.addEventListener('click',       openSettings);
  settingsCloseBtnEl.addEventListener('click',  closeSettings);
  settingsOverlayEl.addEventListener('click',   closeSettings);

  settingsNameSaveEl.addEventListener('click',  saveName);
  settingsNameInputEl.addEventListener('keydown', (e) => { if (e.key === 'Enter') saveName(); });

  wallpaperUploadBtnEl.addEventListener('click', () => wallpaperFileInputEl.click());
  wallpaperFileInputEl.addEventListener('change', (e) => handleWallpaperUpload(e.target.files[0]));
  wallpaperResetBtnEl.addEventListener('click',  resetWallpaper);

  blockDomainAddBtnEl.addEventListener('click', addDomain);
  blockDomainInputEl.addEventListener('keydown', (e) => { if (e.key === 'Enter') addDomain(); });
  blockListResetBtnEl.addEventListener('click', resetBlockList);
}

/* ════════════════════════════════════════
   Phase 6 — Daily Focus Streak Counter
   ════════════════════════════════════════ */

const streakTextEl = document.getElementById('streakText');

function updateStreakDisplay(count) {
  if (!streakTextEl) return;
  if (count <= 0) {
    streakTextEl.textContent = 'Start your streak today!';
  } else if (count === 1) {
    streakTextEl.textContent = '1 day streak';
  } else {
    streakTextEl.textContent = `${count} day streak`;
  }
}

async function initStreak() {
  const { streakCount } = await storageGet(['streakCount'], { streakCount: 0 });
  updateStreakDisplay(streakCount);
}

function getYesterdayDateString() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

/* ════════════════════════════════════════
   Phase 5 — Daily Motivational Quote
   ════════════════════════════════════════ */

const quotes = [
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
  { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
  { text: "The future depends on what you do today.", author: "Mahatma Gandhi" },
  { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
  { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
  { text: "Your time is limited, don't waste it living someone else's life.", author: "Steve Jobs" },
  { text: "Hard work beats talent when talent doesn't work hard.", author: "Tim Notke" },
  { text: "Dream big and dare to fail.", author: "Norman Vaughan" },
  { text: "Do one thing every day that scares you.", author: "Eleanor Roosevelt" },
  { text: "What you get by achieving your goals is not as important as what you become.", author: "Zig Ziglar" },
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "In the middle of every difficulty lies opportunity.", author: "Albert Einstein" },
  { text: "Life is what happens when you're busy making other plans.", author: "John Lennon" },
  { text: "Strive not to be a success, but rather to be of value.", author: "Albert Einstein" },
  { text: "You miss 100% of the shots you don't take.", author: "Wayne Gretzky" },
  { text: "Whether you think you can or you think you can't, you're right.", author: "Henry Ford" },
  { text: "The best time to plant a tree was 20 years ago. The second best time is now.", author: "Chinese Proverb" },
  { text: "An unexamined life is not worth living.", author: "Socrates" },
  { text: "Spread love everywhere you go.", author: "Mother Teresa" },
  { text: "When you reach the end of your rope, tie a knot in it and hang on.", author: "Franklin D. Roosevelt" },
  { text: "Always remember that you are absolutely unique.", author: "Margaret Mead" },
  { text: "Do not go where the path may lead, go instead where there is no path and leave a trail.", author: "Ralph Waldo Emerson" },
  { text: "You will face many defeats in life, but never let yourself be defeated.", author: "Maya Angelou" },
  { text: "The greatest glory in living lies not in never falling, but in rising every time we fall.", author: "Nelson Mandela" },
  { text: "In the end, it's not the years in your life that count. It's the life in your years.", author: "Abraham Lincoln" },
  { text: "Never let the fear of striking out keep you from playing the game.", author: "Babe Ruth" },
  { text: "Life is either a daring adventure or nothing at all.", author: "Helen Keller" },
  { text: "Many of life's failures are people who did not realize how close they were to success when they gave up.", author: "Thomas Edison" },
  { text: "You have brains in your head. You have feet in your shoes. You can steer yourself any direction you choose.", author: "Dr. Seuss" }
];

const quoteTextEl = document.getElementById('quoteText');
const quoteAuthorEl = document.getElementById('quoteAuthor');

function initDailyQuote() {
  const today = new Date();
  const start = new Date(today.getFullYear(), 0, 0);
  const diff = today - start;
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.floor(diff / oneDay);
  
  const quote = quotes[dayOfYear % quotes.length];
  
  if (quoteTextEl && quoteAuthorEl) {
    quoteTextEl.textContent = `"${quote.text}"`;
    quoteAuthorEl.textContent = `— ${quote.author}`;
  }
}

/* ════════════════════════════════════════
   Phase 7 — Pomodoro Timer
   ════════════════════════════════════════ */

const FOCUS_SECONDS = 1500; // 25 mins
const BREAK_SECONDS = 300;  // 5 mins

let pomodoroTime = FOCUS_SECONDS;
let pomodoroMode = 'Focus'; // 'Focus' or 'Break'
let pomodoroInterval = null;
let pomodoroIsRunning = false;

const pomodoroTimerEl = document.getElementById('pomodoroTimer');
const pomodoroModeEl = document.getElementById('pomodoroMode');
const pomodoroStartBtnEl = document.getElementById('pomodoroStartBtn');
const pomodoroResetBtnEl = document.getElementById('pomodoroResetBtn');
const pomodoroMessageEl = document.getElementById('pomodoroMessage');

function playBeep() {
  try {
    const ctx = new window.AudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    oscillator.frequency.value = 880;
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.8);
  } catch (err) {
    console.warn('[FocusTab] Web Audio API failed:', err);
  }
}

function formatPomodoroTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function updatePomodoroUI() {
  if (pomodoroTimerEl) pomodoroTimerEl.textContent = formatPomodoroTime(pomodoroTime);
  
  if (pomodoroModeEl) {
    pomodoroModeEl.textContent = pomodoroMode;
    if (pomodoroMode === 'Break') {
      pomodoroModeEl.classList.add('pomodoro-panel__mode--break');
    } else {
      pomodoroModeEl.classList.remove('pomodoro-panel__mode--break');
    }
  }

  if (pomodoroStartBtnEl) {
    if (pomodoroIsRunning) {
      pomodoroStartBtnEl.innerHTML = '⏸ Pause';
      pomodoroStartBtnEl.classList.add('pomodoro-btn--active');
    } else {
      pomodoroStartBtnEl.innerHTML = '▶ Start';
      pomodoroStartBtnEl.classList.remove('pomodoro-btn--active');
    }
  }
}

function showPomodoroMessage(msg) {
  if (!pomodoroMessageEl) return;
  pomodoroMessageEl.textContent = msg;
  pomodoroMessageEl.style.opacity = '1';
  setTimeout(() => {
    pomodoroMessageEl.style.opacity = '0';
  }, 4000);
}

function stopPomodoroTimer() {
  pomodoroIsRunning = false;
  if (pomodoroInterval) {
    clearInterval(pomodoroInterval);
    pomodoroInterval = null;
  }
}

function handlePomodoroTick() {
  if (pomodoroTime > 0) {
    pomodoroTime--;
    updatePomodoroUI();
  } else {
    stopPomodoroTimer();
    playBeep();
    
    if (pomodoroMode === 'Focus') {
      pomodoroMode = 'Break';
      pomodoroTime = BREAK_SECONDS;
      showPomodoroMessage('Break time! 🎉');
    } else {
      pomodoroMode = 'Focus';
      pomodoroTime = FOCUS_SECONDS;
      showPomodoroMessage('Back to focus! 💪');
    }
    updatePomodoroUI();
  }
}

function startPomodoro() {
  if (!pomodoroIsRunning) {
    pomodoroIsRunning = true;
    pomodoroInterval = setInterval(handlePomodoroTick, 1000);
    updatePomodoroUI();
  }
}

function pausePomodoro() {
  stopPomodoroTimer();
  updatePomodoroUI();
}

function togglePomodoro() {
  if (pomodoroIsRunning) {
    pausePomodoro();
  } else {
    startPomodoro();
  }
}

function resetPomodoro() {
  stopPomodoroTimer();
  pomodoroMode = 'Focus';
  pomodoroTime = FOCUS_SECONDS;
  if (pomodoroMessageEl) pomodoroMessageEl.textContent = '';
  updatePomodoroUI();
}

function initPomodoro() {
  if (pomodoroStartBtnEl) {
    pomodoroStartBtnEl.addEventListener('click', togglePomodoro);
  }
  if (pomodoroResetBtnEl) {
    pomodoroResetBtnEl.addEventListener('click', resetPomodoro);
  }
  updatePomodoroUI();
}

/* ════════════════════════════════════════
   Storage Seeding
   ════════════════════════════════════════ */

async function seedDefaultStorage() {
  const data = await storageGet(['userName'], { userName: null });
  if (!data.userName) await storageSet({ userName: DEFAULT_USER_NAME });
  return { userName: data.userName || DEFAULT_USER_NAME };
}

/* ════════════════════════════════════════
   Init
   ════════════════════════════════════════ */

async function init() {
  const { userName } = await seedDefaultStorage();

  await applyWallpaper();
  updateClock();
  setInterval(updateClock, 1000);
  renderGreeting(userName);

  await initFocus(userName);
  await loadTasks();
  initTaskList();
  await initFocusMode();
  initSettings();
  initDailyQuote();
  await initStreak();
  initPomodoro();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
