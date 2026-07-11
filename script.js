(function() {
  const els = {
    startDate: document.getElementById('startDate'),
    totalHours: document.getElementById('totalHours'),
    hoursPerDay: document.getElementById('hoursPerDay'),
    skipWeekends: document.getElementById('skipWeekends'),
    generateBtn: document.getElementById('generateBtn'),
    clearBtn: document.getElementById('clearBtn'),
    progressSection: document.getElementById('progressSection'),
    logSection: document.getElementById('logSection'),
    emptyState: document.getElementById('emptyState'),
    tableWrap: document.getElementById('tableWrap'),
    addDayBtn: document.getElementById('addDayBtn'),
    rowCount: document.getElementById('rowCount'),
    statLogged: document.getElementById('statLogged'),
    statRemaining: document.getElementById('statRemaining'),
    statProgress: document.getElementById('statProgress'),
    statCompletion: document.getElementById('statCompletion'),
    progressFill: document.getElementById('progressFill'),
    hintBanner: document.getElementById('hintBanner'),
    themeToggle: document.getElementById('themeToggle'),
    modalOverlay: document.getElementById('modalOverlay'),
    modalMessage: document.getElementById('modalMessage'),
    modalActions: document.getElementById('modalActions'),
    modalCancel: document.getElementById('modalCancel'),
    modalConfirm: document.getElementById('modalConfirm'),
  };

  // Custom modal to replace window.confirm/alert, which sandboxed artifact
  // iframes block silently (the click handler throws and nothing happens).
  let modalResolve = null;

  function closeModal(result) {
    els.modalOverlay.classList.remove('show');
    if (modalResolve) {
      modalResolve(result);
      modalResolve = null;
    }
  }

  function showConfirm(message) {
    els.modalMessage.textContent = message;
    els.modalActions.style.display = 'flex';
    els.modalCancel.style.display = 'inline-block';
    els.modalConfirm.textContent = 'Confirm';
    els.modalOverlay.classList.add('show');
    return new Promise(resolve => { modalResolve = resolve; });
  }

  function showAlert(message) {
    els.modalMessage.textContent = message;
    els.modalCancel.style.display = 'none';
    els.modalConfirm.textContent = 'OK';
    els.modalOverlay.classList.add('show');
    return new Promise(resolve => { modalResolve = resolve; });
  }

  els.modalCancel.addEventListener('click', () => closeModal(false));
  els.modalConfirm.addEventListener('click', () => closeModal(true));
  els.modalOverlay.addEventListener('click', (ev) => {
    if (ev.target === els.modalOverlay) closeModal(false);
  });
  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape' && els.modalOverlay.classList.contains('show')) closeModal(false);
  });

  let config = null;   // { startDate, totalHours, hoursPerDay, skipWeekends }
  let entries = [];     // [{ date: 'YYYY-MM-DD', hours: number }]

  const CONFIG_KEY = 'dtr:config';
  const ENTRIES_KEY = 'dtr:entries';
  const THEME_KEY = 'dtr:theme';

  const storage = {
    async get(key, isSecure) {
      if (window.storage) return window.storage.get(key, isSecure);
      return { value: localStorage.getItem(key) };
    },
    async set(key, value, isSecure) {
      if (window.storage) return window.storage.set(key, value, isSecure);
      localStorage.setItem(key, value);
    },
    async delete(key, isSecure) {
      if (window.storage) return window.storage.delete(key, isSecure);
      localStorage.removeItem(key);
    },
  };

  function todayStr() {
    return toLocalISODate(new Date());
  }

  function toLocalISODate(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  function fmtDate(str) {
    const d = new Date(str + 'T00:00:00');
    if (window.innerWidth <= 720) {
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    }
    return d.toLocaleDateString(undefined, { month: 'short', day: '2-digit', year: 'numeric' });
  }

  function dayName(str) {
    const d = new Date(str + 'T00:00:00');
    return d.toLocaleDateString(undefined, { weekday: 'short' });
  }

  function isWeekend(dateObj) {
    const d = dateObj.getDay();
    return d === 0 || d === 6;
  }

  function nextDate(dateStr, skipWeekends) {
    const d = new Date(dateStr + 'T00:00:00');
    do {
      d.setDate(d.getDate() + 1);
    } while (skipWeekends && isWeekend(d));
    return toLocalISODate(d);
  }

  function generateSchedule(cfg) {
    const list = [];
    let d = new Date(cfg.startDate + 'T00:00:00');
    const count = Math.max(1, Math.ceil(cfg.totalHours / cfg.hoursPerDay));
    // include start date itself if it qualifies
    if (!(cfg.skipWeekends && isWeekend(d))) {
      list.push({ date: toLocalISODate(d), hours: cfg.hoursPerDay, status: 'work' });
    }
    while (list.length < count) {
      d.setDate(d.getDate() + 1);
      if (cfg.skipWeekends && isWeekend(d)) continue;
      list.push({ date: toLocalISODate(d), hours: cfg.hoursPerDay, status: 'work' });
    }
    return list;
  }

  async function loadState() {
    try {
      const c = await storage.get(CONFIG_KEY, false);
      if (c && c.value) config = JSON.parse(c.value);
    } catch (e) { config = null; }
    try {
      const e = await storage.get(ENTRIES_KEY, false);
      if (e && e.value) entries = JSON.parse(e.value);
      entries = entries.map(row => ({ status: 'work', ...row }));
    } catch (e) { entries = []; }

    let theme = 'system';
    try {
      const t = await storage.get(THEME_KEY, false);
      if (t && t.value) theme = t.value;
    } catch (e) { theme = 'system'; }
    applyTheme(theme);
  }

  async function saveConfig() {
    try { await storage.set(CONFIG_KEY, JSON.stringify(config), false); }
    catch (e) { console.error('Storage error saving config', e); }
  }

  async function saveEntries() {
    try { await storage.set(ENTRIES_KEY, JSON.stringify(entries), false); }
    catch (e) { console.error('Storage error saving entries', e); }
  }

  function applyTheme(mode) {
    const root = document.documentElement;
    if (mode === 'dark') {
      root.classList.add('dark');
    } else if (mode === 'light') {
      root.classList.remove('dark');
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.toggle('dark', prefersDark);
    }
    [...els.themeToggle.querySelectorAll('button')].forEach(b => {
      b.classList.toggle('active', b.dataset.theme === mode);
    });
    window.__dtrThemeMode = mode;
  }

  els.themeToggle.addEventListener('click', (ev) => {
    const btn = ev.target.closest('button');
    if (!btn) return;
    const mode = btn.dataset.theme;
    applyTheme(mode);
    storage.set(THEME_KEY, mode, false).catch(() => {});
  });

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (window.__dtrThemeMode === 'system') applyTheme('system');
  });

  function computeStats() {
    const today = todayStr();
    const totalHours = config ? config.totalHours : 0;

    // Only count days that have actually happened and were worked —
    // future/pending days and absent/holiday days don't count as logged.
    let loggedHours = 0;
    entries.forEach(row => {
      const status = row.status || 'work';
      const isLogged = status === 'work' && row.date <= today && Number(row.hours) > 0;
      if (isLogged) loggedHours += Number(row.hours) || 0;
    });

    // Projected cumulative across the whole planned schedule, used only to
    // estimate a completion date assuming future days go as planned.
    let projected = 0;
    let completionDate = null;
    entries.forEach(row => {
      projected += Number(row.hours) || 0;
      if (!completionDate && projected >= totalHours && totalHours > 0) {
        completionDate = row.date;
      }
    });

    const remaining = Math.max(0, totalHours - loggedHours);
    const progress = totalHours > 0 ? Math.min(100, (loggedHours / totalHours) * 100) : 0;
    return { cumulative: loggedHours, remaining, progress, completionDate };
  }

  function render() {
    const hasSchedule = config && entries.length > 0;
    els.emptyState.style.display = hasSchedule ? 'none' : 'block';
    els.progressSection.style.display = hasSchedule ? 'block' : 'none';
    els.logSection.style.display = hasSchedule ? 'block' : 'none';
    els.clearBtn.style.display = hasSchedule ? 'inline-block' : 'none';
    els.generateBtn.textContent = hasSchedule ? 'Regenerate schedule' : 'Generate schedule';

    if (config) {
      els.startDate.value = config.startDate;
      els.totalHours.value = config.totalHours;
      els.hoursPerDay.value = config.hoursPerDay;
      els.skipWeekends.checked = !!config.skipWeekends;
    }

    if (!hasSchedule) return;

    const stats = computeStats();
    els.statLogged.textContent = stats.cumulative.toFixed(1).replace(/\.0$/, '');
    els.statRemaining.textContent = stats.remaining.toFixed(1).replace(/\.0$/, '');
    els.statProgress.textContent = Math.round(stats.progress) + '%';
    els.statCompletion.textContent = stats.completionDate ? fmtDate(stats.completionDate) : '—';
    els.progressFill.style.width = stats.progress + '%';

    if (!stats.completionDate) {
      els.hintBanner.textContent = 'The current schedule doesn\u2019t reach the target yet — add more days below, or increase daily hours.';
      els.hintBanner.classList.add('show');
    } else {
      els.hintBanner.classList.remove('show');
    }

    renderTable(stats);
    els.rowCount.textContent = entries.length + (entries.length === 1 ? ' day' : ' days');
  }

  function renderTable(stats) {
    const today = todayStr();
    let cumulative = 0;
    let rows = '';
    entries.forEach((row, i) => {
      const status = row.status || 'work';
      cumulative += Number(row.hours) || 0;
      const isToday = row.date === today;
      const isFuture = row.date > today;
      const isOff = status === 'absent' || status === 'holiday';
      const statusDone = !isOff && row.date <= today && Number(row.hours) > 0;

      let pillLabel, pillClass;
      if (status === 'absent') { pillLabel = 'Absent'; pillClass = 'absent'; }
      else if (status === 'holiday') { pillLabel = 'Holiday'; pillClass = 'holiday'; }
      else { pillLabel = statusDone ? 'Logged' : 'Pending'; pillClass = statusDone ? 'done' : ''; }

      rows += `
        <tr class="${isToday ? 'today' : ''} ${isFuture ? 'future' : ''}">
          <td class="mono">${fmtDate(row.date)}</td>
          <td class="day-name mono">${dayName(row.date)}</td>
          <td>
            <input type="number" class="hours-input" min="0" step="0.5" value="${row.hours}" data-index="${i}" ${isOff ? 'disabled' : ''} />
          </td>
          <td><span class="pill ${pillClass}">${pillLabel}</span></td>
          <td class="mono">${cumulative.toFixed(1).replace(/\.0$/, '')}</td>
          <td class="actions-cell">
            <details class="actions-menu">
              <summary>&hellip;</summary>
              <div class="actions-panel">
                <button class="menu-item" data-action="work" data-index="${i}">Work day${status === 'work' ? '<span class="check">&check;</span>' : ''}</button>
                <button class="menu-item" data-action="absent" data-index="${i}">Absent${status === 'absent' ? '<span class="check">&check;</span>' : ''}</button>
                <button class="menu-item" data-action="holiday" data-index="${i}">Holiday${status === 'holiday' ? '<span class="check">&check;</span>' : ''}</button>
                <div class="menu-divider"></div>
                <button class="menu-item" data-action="remove" data-index="${i}">Remove day</button>
              </div>
            </details>
          </td>
        </tr>`;
    });

    els.tableWrap.innerHTML = `
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Day</th>
            <th>Hours</th>
            <th>Status</th>
            <th>Total</th>
            <th style="text-align:right;">Actions</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>`;

    els.tableWrap.querySelectorAll('.hours-input').forEach(input => {
      input.addEventListener('change', (ev) => {
        const idx = Number(ev.target.dataset.index);
        const val = parseFloat(ev.target.value);
        entries[idx].hours = isNaN(val) ? 0 : val;
        saveEntries();
        render();
      });
    });

    const detailsEls = els.tableWrap.querySelectorAll('details.actions-menu');
    detailsEls.forEach(d => {
      d.addEventListener('toggle', () => {
        if (d.open) {
          detailsEls.forEach(other => { if (other !== d) other.open = false; });
        }
      });
    });

    els.tableWrap.querySelectorAll('.menu-item').forEach(btn => {
      btn.addEventListener('click', (ev) => {
        const idx = Number(ev.currentTarget.dataset.index);
        const action = ev.currentTarget.dataset.action;
        const row = entries[idx];
        if (action === 'remove') {
          entries.splice(idx, 1);
        } else {
          const wasOff = row.status === 'absent' || row.status === 'holiday';
          row.status = action;
          if (action === 'absent' || action === 'holiday') {
            row.hours = 0;
          } else if (wasOff) {
            // switching back to a work day — restore the standard daily hours
            row.hours = config.hoursPerDay;
          }
        }
        saveEntries();
        render();
      });
    });
  }

  els.generateBtn.addEventListener('click', async () => {
    const startDate = els.startDate.value;
    const totalHours = parseFloat(els.totalHours.value);
    const hoursPerDay = parseFloat(els.hoursPerDay.value);
    const skipWeekends = els.skipWeekends.checked;

    if (!startDate || !totalHours || totalHours <= 0 || !hoursPerDay || hoursPerDay <= 0) {
      await showAlert('Please fill in a start date, a total hours target above 0, and standard hours per day above 0.');
      return;
    }

    if (entries.length > 0) {
      const ok = await showConfirm('This will replace your current logged schedule with a new one. Continue?');
      if (!ok) return;
    }

    config = { startDate, totalHours, hoursPerDay, skipWeekends };
    entries = generateSchedule(config);
    await saveConfig();
    await saveEntries();
    render();
  });

  els.addDayBtn.addEventListener('click', () => {
    if (!config) return;
    const last = entries.length ? entries[entries.length - 1].date : config.startDate;
    const d = entries.length ? nextDate(last, config.skipWeekends) : config.startDate;
    entries.push({ date: d, hours: config.hoursPerDay, status: 'work' });
    saveEntries();
    render();
  });

  els.clearBtn.addEventListener('click', async () => {
    const ok = await showConfirm('This will permanently delete your schedule and logged hours. Continue?');
    if (!ok) return;
    config = null;
    entries = [];
    try { await storage.delete(CONFIG_KEY, false); } catch (e) { /* key may not exist */ }
    try { await storage.delete(ENTRIES_KEY, false); } catch (e) { /* key may not exist */ }
    els.startDate.value = todayStr();
    els.totalHours.value = '';
    els.hoursPerDay.value = '';
    els.skipWeekends.checked = false;
    render();
  });

  document.addEventListener('click', (ev) => {
    document.querySelectorAll('details.actions-menu[open]').forEach(d => {
      if (!d.contains(ev.target)) d.removeAttribute('open');
    });
  });

  (async function init() {
    els.startDate.value = todayStr();
    await loadState();
    render();
    if ('serviceWorker' in navigator) {
      try { await navigator.serviceWorker.register('sw.js'); } catch (e) { /* noop */ }
    }
  })();
})();
