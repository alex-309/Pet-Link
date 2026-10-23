/* Logs: translated thoughts and feelings, and everything else the collars or you recorded. */
(function () {
  'use strict';
  const Paw = (window.Paw = window.Paw || {});
  const C = Paw.config;
  const U = Paw.util;
  const ui = () => Paw.ui;

  const f = { tab: 'thoughts', pet: 'all', period: 'week', mood: 'all', cat: 'all', q: '', limit: 60 };
  const PERIODS = { today: 'Today', week: 'Last 7 days', all: 'All time' };

  // "*tail thump*" style stage directions read better in italics.
  const sound = (s) => U.esc(s).replace(/\*([^*]+)\*/g, '<em>$1</em>');

  // One log entry. Shared by Home, Translator and Logs.
  function logItem(l, opts) {
    const o = opts || {};
    const pet = Paw.store.getPet(l.petId);
    if (!pet) return '';
    const u = ui();
    const who = o.showPet ? `<span class="log-item__who" style="--pet:${u.petColor(pet)}">${u.avatar(pet, 'xs')}${U.esc(pet.name)}</span>` : '';
    const when = o.compact && U.startOfDay(l.ts) !== U.startOfDay() ? U.fmtDay(l.ts) + ', ' + U.fmtTime(l.ts) : U.fmtTime(l.ts);
    const time = `<time class="log-item__time" datetime="${new Date(l.ts).toISOString()}">${U.esc(when)}</time>`;
    const lid = U.esc(l.id);
    if (l.kind === 'thought') {
      const m = C.MOODS[l.mood] || C.MOODS.happy;
      return `<li class="log-item log-item--thought">
          <span class="log-item__icon" aria-hidden="true">${u.icon(m.icon)}</span>
          <div class="log-item__body">
            <p class="log-item__line">${who}<span class="log-item__title">${m.label}</span>${time}</p>
            <blockquote class="log-item__quote" lang="${U.esc(l.lang)}">${U.esc(l.text)}</blockquote>
            <p class="log-item__meta">Heard ${sound(l.sound || '')} · ${U.esc(u.language(l.lang).label)}</p>
          </div>
          <button type="button" class="icon-btn icon-btn--sm log-item__action" id="play-${lid}" data-action="replay-log" data-log="${lid}" aria-label="Play this translation" title="Play">${u.icon('play')}</button>
        </li>`;
    }
    const T = C.LOG_TYPES[l.type] || C.LOG_TYPES.note;
    const bits = [];
    if (l.durationSec) bits.push(U.fmtDuration(l.durationSec));
    if (l.distance) bits.push(U.fmtDistance(l.distance));
    if (l.detail) bits.push(l.detail);
    if (l.source === 'manual') bits.push('Added by you');
    return `<li class="log-item log-item--${T.cat}">
        <span class="log-item__icon" aria-hidden="true">${u.icon(T.icon)}</span>
        <div class="log-item__body">
          <p class="log-item__line">${who}<span class="log-item__title">${U.esc(l.title || T.label)}</span>${time}</p>
          ${bits.length ? `<p class="log-item__meta">${U.esc(bits.join(' · '))}</p>` : ''}
          ${l.note ? `<p class="log-item__note">${U.esc(l.note)}</p>` : ''}
        </div>
        ${l.source === 'manual' && !o.compact ? `<button type="button" class="icon-btn icon-btn--sm log-item__action" id="del-${lid}" data-action="delete-log" data-log="${lid}" aria-label="Delete this ${U.esc(T.label.toLowerCase())} entry" title="Delete">${u.icon('trash')}</button>` : ''}
      </li>`;
  }
  Paw.logItem = logItem;

  const since = () => (f.period === 'today' ? U.startOfDay() : f.period === 'week' ? Date.now() - 7 * U.DAY : 0);

  function base(l, kind) {
    if (kind === 'thought' ? l.kind !== 'thought' : l.kind === 'thought') return false;
    if (f.pet !== 'all' && l.petId !== f.pet) return false;
    return l.ts >= since();
  }
  function search(l) {
    if (!f.q) return true;
    const pet = Paw.store.getPet(l.petId);
    const hay = [l.text, l.title, l.note, l.detail, l.sound, pet && pet.name, l.mood && C.MOODS[l.mood] && C.MOODS[l.mood].label]
      .filter(Boolean).join(' ').toLowerCase();
    return hay.indexOf(f.q.toLowerCase()) !== -1;
  }
  function results() {
    const kind = f.tab === 'thoughts' ? 'thought' : 'activity';
    return Paw.store.state.logs.filter((l) => base(l, kind) && search(l) &&
      (kind === 'thought' ? f.mood === 'all' || l.mood === f.mood : f.cat === 'all' || (C.LOG_TYPES[l.type] || {}).cat === f.cat));
  }

  function listHTML(entries) {
    if (!entries.length) {
      return `<div class="empty-note empty-note--box">${ui().icon('search')}<p>No entries match these filters. Try a longer time range or clear the search.</p></div>`;
    }
    let html = '';
    let day = null;
    entries.slice(0, f.limit).forEach((l) => {
      const d = U.fmtDay(l.ts);
      if (d !== day) {
        if (day !== null) html += '</ol></li>';
        html += `<li class="log-day"><h3 class="log-day__title">${U.esc(d)}</h3><ol class="log-entries">`;
        day = d;
      }
      html += logItem(l, { showPet: f.pet === 'all' });
    });
    html += '</ol></li>';
    const more = entries.length > f.limit
      ? `<button type="button" class="btn btn-secondary logs-more" id="logs-more" data-action="logs-more">Show ${Math.min(60, entries.length - f.limit)} more</button>`
      : '';
    return `<ol class="log-days">${html}</ol>${more}`;
  }

  function moodChart(root) {
    const el = root.querySelector('#mood-chart');
    if (!el) return;
    const entries = Paw.store.state.logs.filter((l) => base(l, 'thought') && search(l));
    const counts = {};
    C.MOOD_ORDER.forEach((m) => { counts[m] = 0; });
    entries.forEach((l) => { if (counts[l.mood] != null) counts[l.mood]++; });
    const pet = f.pet !== 'all' ? Paw.store.getPet(f.pet) : null;
    const items = C.MOOD_ORDER.map((m) => ({ label: C.MOODS[m].label, icon: C.MOODS[m].icon, value: counts[m], display: String(counts[m]) }));
    const label = `Mood mix${pet ? ' for ' + pet.name : ''}, ${PERIODS[f.period].toLowerCase()}`;
    Paw.charts.bars(el, { items, color: pet ? ui().petColor(pet) : 'var(--series-neutral)', label, empty: 'No translations in this range yet.' });
    root.querySelector('#mood-table').innerHTML = Paw.charts.table(label, ['Mood', 'Translations', 'Share'],
      items.map((i) => [i.label, String(i.value), entries.length ? Math.round((i.value / entries.length) * 100) + '%' : '0%']));
  }

  function tabCount(kind) {
    return Paw.store.state.logs.filter((l) => base(l, kind)).length;
  }

  function updateResults(root) {
    const entries = results();
    const listEl = root.querySelector('#log-list');
    if (!listEl) return;
    const active = document.activeElement;
    const focusId = active && listEl.contains(active) ? active.id : null;
    listEl.innerHTML = listHTML(entries);
    if (focusId) {
      const back = document.getElementById(focusId);
      if (back) back.focus();
    }
    root.querySelector('#logs-count').textContent = entries.length === 1 ? '1 entry' : `${entries.length.toLocaleString()} entries`;
    root.querySelector('#count-thoughts').textContent = tabCount('thought');
    root.querySelector('#count-activity').textContent = tabCount('activity');
    moodChart(root);
  }
  const queueUpdate = U.debounce((root) => { if (root.isConnected) updateResults(root); }, 250);

  function select(id, label, key, options) {
    return `<div class="field filters__field">
        <label class="field__label" for="${id}">${label}</label>
        <div class="select"><select class="input input--compact" id="${id}" data-change="logs-filter" data-key="${key}">${options}</select>${ui().icon('chevron-down', 'select__icon')}</div>
      </div>`;
  }
  const opts = (map, current) => Object.entries(map).map(([k, v]) => `<option value="${k}"${k === current ? ' selected' : ''}>${U.esc(v)}</option>`).join('');

  Paw.views = Paw.views || {};
  Paw.views.logs = {
    title: 'Logs',
    handlesSelect: true,
    setTab(tab) {
      f.tab = tab === 'activity' ? 'activity' : 'thoughts';
      f.limit = 60;
    },
    render() {
      const u = ui();
      if (f.pet !== 'all' && !Paw.store.getPet(f.pet)) f.pet = 'all';
      const thoughts = f.tab === 'thoughts';
      const moods = Object.assign({ all: 'All moods' }, ...C.MOOD_ORDER.map((m) => ({ [m]: C.MOODS[m].label })));
      const cats = Object.assign({ all: 'All types' }, C.LOG_CATEGORIES);
      const tab = (key, label, count) => `<button type="button" role="tab" class="tabs__tab" id="tab-${key}" aria-selected="${f.tab === key}" aria-controls="logs-panel" tabindex="${f.tab === key ? 0 : -1}" data-action="logs-tab" data-tab="${key}">${label}<span class="tabs__count" id="count-${key}">${count}</span></button>`;
      return `<header class="view-head">
          <div class="view-head__text">
            <p class="eyebrow">${u.icon('journal')}Logs</p>
            <h1 class="view-title" tabindex="-1">Activity and thoughts</h1>
            <p class="lede">Everything the collars noticed, plus anything you log yourself.</p>
          </div>
          <div class="view-head__actions">
            <button type="button" class="btn btn-secondary" data-action="export">${u.icon('download')}Export</button>
            <button type="button" class="btn btn-primary" data-action="log-entry">${u.icon('plus')}Log activity</button>
          </div>
        </header>
        <div class="tabs" role="tablist" aria-label="Log type">
          ${tab('thoughts', 'Thoughts and feelings', tabCount('thought'))}
          ${tab('activity', 'Activity', tabCount('activity'))}
        </div>
        <div class="logs-panel" id="logs-panel" role="tabpanel" aria-labelledby="tab-${f.tab}">
          <div class="filters" role="group" aria-label="Filters">
            ${select('f-pet', 'Pet', 'pet', u.petOptions(f.pet, true))}
            ${select('f-period', 'When', 'period', opts(PERIODS, f.period))}
            ${thoughts ? select('f-mood', 'Mood', 'mood', opts(moods, f.mood)) : select('f-cat', 'Type', 'cat', opts(cats, f.cat))}
            <div class="field filters__field filters__search">
              <label class="field__label" for="f-q">Search</label>
              <div class="search">${u.icon('search', 'search__icon')}<input class="input input--compact" type="search" id="f-q" data-input="logs-q" value="${U.esc(f.q)}" placeholder="Words, notes or pet names" autocomplete="off"></div>
            </div>
          </div>
          ${thoughts ? `<section class="card mood-card" aria-labelledby="mood-title">
              <h2 class="card-title" id="mood-title">Mood mix</h2>
              <div id="mood-chart"></div>
              <details class="table-view"><summary>Show as a table</summary><div class="table-scroll" id="mood-table" tabindex="0" role="region" aria-label="Mood mix, table"></div></details>
            </section>` : ''}
          <p class="logs-count" id="logs-count" role="status"></p>
          <div id="log-list"></div>
        </div>`;
    },
    mount(root) {
      updateResults(root);
      const list = root.querySelector('[role="tablist"]');
      list.addEventListener('keydown', (e) => {
        if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight' && e.key !== 'Home' && e.key !== 'End') return;
        e.preventDefault();
        const next = f.tab === 'thoughts' ? 'activity' : 'thoughts';
        const target = e.key === 'Home' ? 'thoughts' : e.key === 'End' ? 'activity' : next;
        if (target !== f.tab) {
          Paw.views.logs.setTab(target);
          Paw.app.refreshView();
          const t = document.getElementById('tab-' + target);
          if (t) t.focus();
        }
      });
    },
    on(type, d, root) {
      if (type === 'logs' || type === 'pets') queueUpdate(root);
    },
    actions: {
      'logs-tab': (el) => {
        if (el.dataset.tab === f.tab) return;
        Paw.views.logs.setTab(el.dataset.tab);
        Paw.app.refreshView();
      },
      'logs-more': (el, e, root) => {
        f.limit += 60;
        updateResults(root);
        const items = root.querySelectorAll('.log-item');
        const first = items[f.limit - 60];
        const target = first && first.querySelector('button, a');
        if (target) target.focus();
      },
    },
    changes: {
      'logs-filter': (el, e, root) => {
        f[el.dataset.key] = el.value;
        f.limit = 60;
        updateResults(root);
      },
    },
    inputs: {
      'logs-q': (el, e, root) => {
        f.q = el.value.trim();
        f.limit = 60;
        queueUpdate(root);
      },
    },
  };
})();
