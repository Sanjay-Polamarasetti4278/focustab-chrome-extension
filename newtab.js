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
  await storageSet({ focusText: text, focusDate: getTodayDateString() });
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
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
