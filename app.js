(() => {
  'use strict';

  const STORAGE_EVENTS = 'weeproof.events';
  const STORAGE_NEXT_REMINDER = 'weeproof.nextReminderAt';
  const STORAGE_INTERVAL = 'weeproof.intervalMinutes';
  const STORAGE_SOUND = 'weeproof.sound';
  const STORAGE_VIBRATE = 'weeproof.vibrate';

  const els = {
    lastWeeValue: document.getElementById('lastWeeValue'),
    countdownValue: document.getElementById('countdownValue'),
    nextLabel: document.getElementById('nextLabel'),
    logWeeBtn: document.getElementById('logWeeBtn'),
    logAccidentBtn: document.getElementById('logAccidentBtn'),
    historyList: document.getElementById('historyList'),
    todayCount: document.getElementById('todayCount'),
    notifyBanner: document.getElementById('notifyBanner'),
    enableNotifyBtn: document.getElementById('enableNotifyBtn'),
    settingsBtn: document.getElementById('settingsBtn'),
    settingsSheet: document.getElementById('settingsSheet'),
    sheetBackdrop: document.getElementById('sheetBackdrop'),
    closeSheetBtn: document.getElementById('closeSheetBtn'),
    intervalSelect: document.getElementById('intervalSelect'),
    soundToggle: document.getElementById('soundToggle'),
    vibrateToggle: document.getElementById('vibrateToggle'),
    clearHistoryBtn: document.getElementById('clearHistoryBtn'),
    toast: document.getElementById('toast'),
    editReminderBtn: document.getElementById('editReminderBtn'),
    reminderSheet: document.getElementById('reminderSheet'),
    reminderSheetBackdrop: document.getElementById('reminderSheetBackdrop'),
    closeReminderSheetBtn: document.getElementById('closeReminderSheetBtn'),
    currentTargetValue: document.getElementById('currentTargetValue'),
    chipRow: document.querySelector('#reminderSheet .chip-row'),
    exactTimeInput: document.getElementById('exactTimeInput'),
    setExactTimeBtn: document.getElementById('setExactTimeBtn'),
    resetReminderBtn: document.getElementById('resetReminderBtn'),
  };

  let events = loadEvents();
  let intervalMinutes = parseInt(localStorage.getItem(STORAGE_INTERVAL) || '60', 10);
  let soundOn = localStorage.getItem(STORAGE_SOUND) !== 'false';
  let vibrateOn = localStorage.getItem(STORAGE_VIBRATE) !== 'false';
  let nextReminderAt = loadNextReminderAt();
  let reminderTimer = null;
  let audioCtx = null;

  function loadEvents() {
    try {
      const raw = JSON.parse(localStorage.getItem(STORAGE_EVENTS) || '[]');
      if (!Array.isArray(raw)) return [];
      // Migrate the old format (plain timestamp numbers) to {ts, type}.
      return raw.map((e) => (typeof e === 'number' ? { ts: e, type: 'wee' } : e));
    } catch {
      return [];
    }
  }

  function saveEvents() {
    localStorage.setItem(STORAGE_EVENTS, JSON.stringify(events));
  }

  function loadNextReminderAt() {
    const raw = localStorage.getItem(STORAGE_NEXT_REMINDER);
    return raw ? parseInt(raw, 10) : null;
  }

  function saveNextReminderAt() {
    if (nextReminderAt === null) {
      localStorage.removeItem(STORAGE_NEXT_REMINDER);
    } else {
      localStorage.setItem(STORAGE_NEXT_REMINDER, String(nextReminderAt));
    }
  }

  function intervalMs() {
    return intervalMinutes * 60 * 1000;
  }

  // --- Reminder scheduling -------------------------------------------------
  // Every new wee resets the next reminder to (that wee's time + interval).
  // If nothing is logged in time, the reminder keeps firing every `interval`
  // from the last log until a new wee resets it.

  function resetReminderFrom(timestampMs) {
    nextReminderAt = timestampMs + intervalMs();
    saveNextReminderAt();
    scheduleTimer();
  }

  function clearTimer() {
    if (reminderTimer) {
      clearTimeout(reminderTimer);
      reminderTimer = null;
    }
  }

  function scheduleTimer() {
    clearTimer();
    if (nextReminderAt === null) return;
    const delay = nextReminderAt - Date.now();
    if (delay <= 0) {
      catchUpReminders();
      return;
    }
    // setTimeout is capped well above any interval we offer, no chunking needed.
    reminderTimer = setTimeout(onReminderDue, delay);
  }

  function onReminderDue() {
    fireReminder();
    nextReminderAt = nextReminderAt + intervalMs();
    saveNextReminderAt();
    scheduleTimer();
  }

  // Called on load / visibility change in case the OS suspended the tab and
  // the timer never fired while backgrounded.
  function catchUpReminders() {
    if (nextReminderAt === null) return;
    const now = Date.now();
    if (nextReminderAt > now) {
      scheduleTimer();
      return;
    }
    fireReminder();
    while (nextReminderAt <= now) {
      nextReminderAt += intervalMs();
    }
    saveNextReminderAt();
    scheduleTimer();
  }

  function fireReminder() {
    const title = 'Weeproof';
    const body = "It's been a while — might be time for a wee.";
    showNotification(title, body);
    playChime();
    doVibrate();
  }

  // --- Notifications ---------------------------------------------------------

  function notificationsSupported() {
    return 'Notification' in window;
  }

  function updateNotifyBanner() {
    if (!notificationsSupported()) {
      els.notifyBanner.classList.add('hidden');
      return;
    }
    els.notifyBanner.classList.toggle('hidden', Notification.permission === 'granted');
  }

  async function requestNotificationPermission() {
    if (!notificationsSupported()) return;
    try {
      const perm = await Notification.requestPermission();
      updateNotifyBanner();
      if (perm === 'granted') {
        showToast('Reminders enabled');
      }
    } catch {
      /* ignore */
    }
  }

  async function showNotification(title, body) {
    if (!notificationsSupported() || Notification.permission !== 'granted') {
      showToast(body);
      return;
    }
    try {
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg) {
          reg.showNotification(title, {
            body,
            icon: 'icons/icon-192.png',
            badge: 'icons/icon-192.png',
            tag: 'weeproof-reminder',
            renotify: true,
          });
          return;
        }
      }
      new Notification(title, { body, icon: 'icons/icon-192.png' });
    } catch {
      showToast(body);
    }
  }

  function doVibrate() {
    if (vibrateOn && 'vibrate' in navigator) {
      navigator.vibrate([200, 100, 200]);
    }
  }

  function playChime() {
    if (!soundOn) return;
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      const now = audioCtx.currentTime;
      [880, 1108].forEach((freq, i) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        const start = now + i * 0.18;
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(0.25, start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.3);
        osc.connect(gain).connect(audioCtx.destination);
        osc.start(start);
        osc.stop(start + 0.32);
      });
    } catch {
      /* ignore audio errors */
    }
  }

  // --- Rendering ---------------------------------------------------------

  function formatTime(ts) {
    return new Date(ts).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }

  function formatDuration(ms, { compact = false } = {}) {
    const totalSeconds = Math.max(0, Math.round(ms / 1000));
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    if (compact) {
      if (h > 0) return `${h}h ${m}m`;
      if (m > 0) return `${m}m`;
      return `${s}s`;
    }
    const parts = [];
    if (h > 0) parts.push(`${h}h`);
    parts.push(`${String(m).padStart(h > 0 ? 2 : 1, '0')}m`);
    parts.push(`${String(s).padStart(2, '0')}s`);
    return parts.join(' ');
  }

  function isToday(ts) {
    const d = new Date(ts);
    const now = new Date();
    return (
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate()
    );
  }

  function render() {
    const lastEvent = events[events.length - 1];
    if (!lastEvent) {
      els.lastWeeValue.textContent = 'Nothing logged yet';
    } else {
      const ago = formatDuration(Date.now() - lastEvent.ts, { compact: true });
      els.lastWeeValue.textContent =
        lastEvent.type === 'accident'
          ? `⚠️ Accident · ${formatTime(lastEvent.ts)} · ${ago} ago`
          : `${formatTime(lastEvent.ts)} · ${ago} ago`;
    }

    if (nextReminderAt === null) {
      els.nextLabel.textContent = 'Next reminder';
      els.countdownValue.textContent = '—';
      els.countdownValue.classList.remove('overdue');
    } else {
      const remaining = nextReminderAt - Date.now();
      if (remaining <= 0) {
        els.nextLabel.textContent = 'Reminder';
        els.countdownValue.textContent = 'Due now';
        els.countdownValue.classList.add('overdue');
      } else {
        els.nextLabel.textContent = 'Next reminder in';
        els.countdownValue.textContent = formatDuration(remaining);
        els.countdownValue.classList.remove('overdue');
      }
    }

    renderHistory();
  }

  function renderHistory() {
    const todayEvents = events.filter((e) => isToday(e.ts)).slice().reverse();
    const weeCount = todayEvents.filter((e) => e.type !== 'accident').length;
    const accidentCount = todayEvents.length - weeCount;
    els.todayCount.textContent =
      `${weeCount} wee${weeCount === 1 ? '' : 's'}` +
      (accidentCount > 0 ? ` · ${accidentCount} accident${accidentCount === 1 ? '' : 's'}` : '');

    if (todayEvents.length === 0) {
      els.historyList.innerHTML = '<li class="empty-state">Nothing logged yet today.</li>';
      return;
    }

    els.historyList.innerHTML = '';
    todayEvents.forEach((e) => {
      const isAccident = e.type === 'accident';
      const li = document.createElement('li');
      li.className = 'history-item' + (isAccident ? ' accident' : '');
      li.innerHTML = `
        <div>
          <div class="history-item-time">${formatTime(e.ts)}${
            isAccident ? '<span class="history-item-type">Accident</span>' : ''
          }</div>
          <div class="history-item-ago">${formatDuration(Date.now() - e.ts, { compact: true })} ago</div>
        </div>
        <button class="history-item-delete" aria-label="Delete entry" data-ts="${e.ts}">✕</button>
      `;
      els.historyList.appendChild(li);
    });
  }

  function showToast(message) {
    els.toast.textContent = message;
    els.toast.classList.remove('hidden');
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => els.toast.classList.add('hidden'), 2600);
  }

  // --- Actions ---------------------------------------------------------

  function logEvent(type) {
    const now = Date.now();
    events.push({ ts: now, type });
    events.sort((a, b) => a.ts - b.ts);
    saveEvents();
    resetReminderFrom(now);
    render();
    showToast(
      type === 'accident'
        ? 'Accident logged — next reminder in ' + intervalMinutes + ' min'
        : 'Logged — next reminder in ' + intervalMinutes + ' min'
    );
  }

  function logWee() {
    logEvent('wee');
  }

  function logAccident() {
    logEvent('accident');
  }

  function deleteEvent(ts) {
    events = events.filter((e) => e.ts !== ts);
    saveEvents();

    const lastEvent = events[events.length - 1];
    resetReminderFrom(lastEvent ? lastEvent.ts : Date.now());
    render();
  }

  function clearTodayHistory() {
    events = events.filter((e) => !isToday(e.ts));
    saveEvents();
    const lastEvent = events[events.length - 1];
    resetReminderFrom(lastEvent ? lastEvent.ts : Date.now());
    render();
    closeSheet();
  }

  function openSheet() {
    els.settingsSheet.classList.remove('hidden');
  }

  function closeSheet() {
    els.settingsSheet.classList.add('hidden');
  }

  // --- Reminder override ---------------------------------------------------

  function updateCurrentTargetDisplay() {
    els.currentTargetValue.innerHTML =
      nextReminderAt === null
        ? 'Not scheduled'
        : `Currently set for <strong>${formatTime(nextReminderAt)}</strong>`;
  }

  function openReminderSheet() {
    updateCurrentTargetDisplay();
    const base = nextReminderAt === null ? Date.now() : nextReminderAt;
    const d = new Date(base);
    els.exactTimeInput.value =
      String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
    els.reminderSheet.classList.remove('hidden');
  }

  function closeReminderSheet() {
    els.reminderSheet.classList.add('hidden');
  }

  function adjustReminder(deltaMinutes) {
    const base = nextReminderAt === null ? Date.now() : nextReminderAt;
    nextReminderAt = base + deltaMinutes * 60 * 1000;
    saveNextReminderAt();
    scheduleTimer();
    render();
    updateCurrentTargetDisplay();
  }

  function setReminderToExactTime() {
    const match = /^(\d{2}):(\d{2})$/.exec(els.exactTimeInput.value || '');
    if (!match) return;
    const [, hh, mm] = match;
    const target = new Date();
    target.setHours(parseInt(hh, 10), parseInt(mm, 10), 0, 0);
    if (target.getTime() <= Date.now()) {
      target.setDate(target.getDate() + 1);
    }
    nextReminderAt = target.getTime();
    saveNextReminderAt();
    scheduleTimer();
    render();
    updateCurrentTargetDisplay();
    showToast('Next reminder set for ' + formatTime(nextReminderAt));
  }

  function resetReminderToDefault() {
    const lastEvent = events[events.length - 1];
    resetReminderFrom(lastEvent ? lastEvent.ts : Date.now());
    render();
    updateCurrentTargetDisplay();
  }

  // --- Wiring ---------------------------------------------------------

  els.logWeeBtn.addEventListener('click', logWee);
  els.logAccidentBtn.addEventListener('click', logAccident);

  els.historyList.addEventListener('click', (e) => {
    const btn = e.target.closest('.history-item-delete');
    if (!btn) return;
    deleteEvent(parseInt(btn.dataset.ts, 10));
  });

  els.enableNotifyBtn.addEventListener('click', requestNotificationPermission);

  els.settingsBtn.addEventListener('click', openSheet);
  els.closeSheetBtn.addEventListener('click', closeSheet);
  els.sheetBackdrop.addEventListener('click', closeSheet);

  els.intervalSelect.value = String(intervalMinutes);
  els.intervalSelect.addEventListener('change', () => {
    intervalMinutes = parseInt(els.intervalSelect.value, 10);
    localStorage.setItem(STORAGE_INTERVAL, String(intervalMinutes));
    const lastEvent = events[events.length - 1];
    resetReminderFrom(lastEvent ? lastEvent.ts : Date.now());
    render();
  });

  els.soundToggle.checked = soundOn;
  els.soundToggle.addEventListener('change', () => {
    soundOn = els.soundToggle.checked;
    localStorage.setItem(STORAGE_SOUND, String(soundOn));
  });

  els.vibrateToggle.checked = vibrateOn;
  els.vibrateToggle.addEventListener('change', () => {
    vibrateOn = els.vibrateToggle.checked;
    localStorage.setItem(STORAGE_VIBRATE, String(vibrateOn));
  });

  els.clearHistoryBtn.addEventListener('click', clearTodayHistory);

  els.editReminderBtn.addEventListener('click', openReminderSheet);
  els.closeReminderSheetBtn.addEventListener('click', closeReminderSheet);
  els.reminderSheetBackdrop.addEventListener('click', closeReminderSheet);
  els.chipRow.addEventListener('click', (e) => {
    const btn = e.target.closest('.chip-btn');
    if (!btn) return;
    adjustReminder(parseInt(btn.dataset.adjust, 10));
  });
  els.setExactTimeBtn.addEventListener('click', setReminderToExactTime);
  els.resetReminderBtn.addEventListener('click', resetReminderToDefault);

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      catchUpReminders();
      render();
    }
  });

  window.addEventListener('focus', () => {
    catchUpReminders();
    render();
  });

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => {
      /* offline support is best-effort */
    });
  }

  // --- Init ---------------------------------------------------------

  updateNotifyBanner();
  if (nextReminderAt === null) {
    // No wee logged yet (fresh install, or history cleared) - still start
    // an hourly reminder cycle from now so the countdown isn't blank.
    resetReminderFrom(Date.now());
  } else {
    scheduleTimer();
  }
  render();
  setInterval(render, 1000);
})();
