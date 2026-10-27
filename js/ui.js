/* Shared UI pieces: icons, chips, switches, toasts, screen-reader announcements,
   dialogs and the once-a-second refresh of live values. */
(function () {
  'use strict';
  const Paw = (window.Paw = window.Paw || {});
  const C = Paw.config;
  const U = Paw.util;
  const t = (k, v) => Paw.i18n.t(k, v);

  const icon = (name, cls) => `<svg class="icon${cls ? ' ' + cls : ''}" aria-hidden="true" focusable="false"><use href="#i-${name}"/></svg>`;

  // Status = colored mark + shape (check vs. exclamation) + text, never color alone.
  function status(level, label) {
    return `<span class="status status--${level}"><span class="status__mark">${icon(level === 'good' ? 'check' : 'exclaim')}</span>${U.esc(label)}</span>`;
  }
  function moodChip(mood) {
    const m = C.MOODS[mood] || C.MOODS.happy;
    return `<span class="chip">${icon(m.icon)}${U.esc(t(m.label))}</span>`;
  }
  function activityChip(activity, species) {
    const act = C.ACTIVITIES[activity] ? activity : 'resting';
    return `<span class="chip">${icon(C.ACTIVITIES[act].icon)}${U.esc(activityName(species, act))}</span>`;
  }
  function battery(pct) {
    const p = Math.round(pct);
    const level = p < 20 ? 'low' : p < 40 ? 'mid' : 'ok';
    return `<span class="battery battery--${level}"><svg class="battery__icon" viewBox="0 0 26 14" aria-hidden="true" focusable="false"><rect class="battery__case" x="0.75" y="0.75" width="21.5" height="12.5" rx="3"/><rect class="battery__fill" x="2.75" y="2.75" width="${(17.5 * p / 100).toFixed(1)}" height="8.5" rx="1.5"/><path class="battery__tip" d="M24.5 5v4"/></svg><span><span class="visually-hidden">${U.esc(t('Collar battery'))} </span>${Paw.i18n.num(p / 100, { style: 'percent' })}</span></span>`;
  }
  // A toggle with role="switch". Give it a visible `label`, or point `labelledby` at
  // visible text elsewhere (then the button shows only the track). `srLabel` is a fuller
  // name for screen readers ("Biscuit's translator") that contains the visible label.
  function switchButton(o) {
    const attrs = (o.petId ? ` data-pet="${U.esc(o.petId)}"` : '') + (o.key ? ` data-key="${o.key}"` : '') +
      (o.labelledby ? ` aria-labelledby="${o.labelledby}"` : '') + (o.describedby ? ` aria-describedby="${o.describedby}"` : '') +
      (o.srLabel ? ` aria-label="${U.esc(o.srLabel)}"` : '');
    const label = o.label ? `<span class="switch__label">${U.esc(o.label)}</span>` : '';
    return `<button type="button" class="switch" role="switch" id="${U.esc(o.id)}" aria-checked="${o.on ? 'true' : 'false'}" data-action="${o.action}"${attrs}>
      <span class="switch__track" aria-hidden="true"><span class="switch__thumb">${icon('check')}</span></span>${label}</button>`;
  }
  const language = (code) => C.LANGUAGES.find((l) => l.code === code) || C.LANGUAGES[0];
  const petColor = (pet) => `var(--pet-${pet.slot})`;
  // Display names for things stored in English (activities, moods, zones, log titles).
  const activityName = (species, act) => t(C.activityLabel(species, act));
  const zoneName = (zone) => t(zone);
  const speciesName = (species) => t((C.SPECIES[species] || C.SPECIES.dog).label);

  // Sound descriptions like "*play bow* Woof!": the *stage directions* are translated, the barks stay.
  function soundText(text) {
    if (!text) return '';
    if (Paw.i18n.has(Paw.i18n.lang, text)) return t(text);
    return String(text).replace(/\*([^*]+)\*/g, (m, inner) => '*' + t(inner) + '*');
  }

  // A language in its own name, plus its name in the interface language when that differs:
  // "Français (French)" in English, "Français (francés)" in Spanish, just "Français" in French.
  function languageLabel(l) {
    const local = Paw.i18n.languageName(l.code);
    return l.label.toLocaleLowerCase() === local.toLocaleLowerCase() ? l.label : `${l.label} (${local})`;
  }
  function languageOptions(selected) {
    return C.LANGUAGES.map((l) => `<option value="${l.code}" lang="${l.code}"${l.code === selected ? ' selected' : ''}>${U.esc(languageLabel(l))}</option>`).join('');
  }
  function petOptions(selected, withAll) {
    return (withAll ? `<option value="all"${selected === 'all' ? ' selected' : ''}>${U.esc(t('All pets'))}</option>` : '') +
      Paw.store.state.pets.map((p) => `<option value="${U.esc(p.id)}"${p.id === selected ? ' selected' : ''}>${U.esc(p.name)}</option>`).join('');
  }

  // ---- screen-reader announcements ----------------------------------------------
  let annTimer = null;
  function announce(text, quote) {
    const el = U.$('#announcer');
    if (!el) return;
    clearTimeout(annTimer);
    el.textContent = '';
    annTimer = setTimeout(() => {
      el.append(document.createTextNode(text));
      if (quote) {
        const span = document.createElement('span');
        span.lang = quote.lang;
        span.textContent = ' ' + quote.text;
        el.append(span);
      }
    }, 80);
  }

  // ---- toasts ----------------------------------------------------------------------
  function toast(message, opts) {
    const o = opts || {};
    const host = U.$('#toasts');
    const el = document.createElement('div');
    el.className = 'toast toast--' + (o.tone || 'info');
    el.innerHTML = `${icon(o.icon || 'info', 'toast__icon')}<p class="toast__msg"></p>
      ${o.actionLabel ? `<button type="button" class="btn btn-tertiary btn-sm toast__action">${U.esc(o.actionLabel)}</button>` : ''}
      <button type="button" class="icon-btn icon-btn--sm toast__close" aria-label="${U.esc(t('Dismiss notification'))}">${icon('x')}</button>`;
    el.querySelector('.toast__msg').textContent = message;
    host.appendChild(el);
    while (host.children.length > 3) host.firstElementChild.remove();
    let timer = null;
    const remove = () => {
      clearTimeout(timer);
      el.classList.add('is-leaving');
      setTimeout(() => el.remove(), 220);
    };
    const arm = () => {
      clearTimeout(timer);
      timer = setTimeout(remove, o.duration || 6000);
    };
    el.addEventListener('pointerenter', () => clearTimeout(timer));
    el.addEventListener('pointerleave', arm);
    el.addEventListener('focusin', () => clearTimeout(timer));
    el.addEventListener('focusout', arm);
    el.querySelector('.toast__close').addEventListener('click', remove);
    if (o.actionLabel) {
      el.querySelector('.toast__action').addEventListener('click', () => {
        o.action();
        remove();
      });
    }
    arm();
    if (o.announce !== false) announce(message);
  }

  // ---- dialogs -----------------------------------------------------------------------
  // Each dialog is a fresh <dialog> element that removes itself when closed. The browser
  // fires "close" asynchronously, so sharing one element could let a late close event from
  // the previous dialog wipe the next one.
  let currentDialog = null;
  function openDialog(o) {
    if (currentDialog && currentDialog.open) currentDialog.close();
    const opener = o.opener || document.activeElement;
    const el = document.createElement('dialog');
    el.className = 'dialog' + (o.className ? ' ' + o.className : '');
    if (o.labelledby) el.setAttribute('aria-labelledby', o.labelledby);
    el.innerHTML = o.html;
    document.body.appendChild(el);
    currentDialog = el;
    el.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', () => el.close()));
    // Clicking the dimmed backdrop closes the dialog.
    el.addEventListener('click', (e) => { if (e.target === el) el.close(); });
    el.addEventListener('close', () => {
      if (o.onClose) o.onClose(el.returnValue);
      el.remove();
      if (currentDialog !== el) return; // another dialog has already taken over
      currentDialog = null;
      const back = opener && document.contains(opener) ? opener : U.$('#main-content');
      if (back) back.focus({ preventScroll: true });
    }, { once: true });
    if (typeof el.showModal === 'function') el.showModal();
    else el.setAttribute('open', '');
    if (o.onOpen) o.onOpen(el);
    const focus = (o.initialFocus && el.querySelector(o.initialFocus)) || el.querySelector('[autofocus]');
    if (focus) focus.focus();
  }
  function closeDialog(value) {
    if (currentDialog && currentDialog.open) currentDialog.close(value || '');
  }
  function confirmDialog(o) {
    return new Promise((resolve) => {
      openDialog({
        className: 'dialog--sm',
        labelledby: 'confirm-title',
        html: `<div class="dialog__body">
            <h2 class="dialog__title" id="confirm-title">${U.esc(o.title)}</h2>
            <p class="dialog__text">${U.esc(o.body)}</p>
          </div>
          <div class="dialog__actions">
            <button type="button" class="btn btn-secondary" data-close>${U.esc(t('Cancel'))}</button>
            <button type="button" class="btn ${o.danger ? 'btn-danger' : 'btn-primary'}" id="confirm-ok">${U.esc(o.confirmLabel || t('Confirm'))}</button>
          </div>`,
        initialFocus: '[data-close]',
        onOpen(el) {
          // Resolve on the click itself; the dialog's close event arrives asynchronously.
          el.querySelector('#confirm-ok').addEventListener('click', () => {
            resolve(true);
            closeDialog('ok');
          });
        },
        onClose() { resolve(false); }, // no effect if already resolved by the confirm button
      });
    });
  }

  // ---- live values -------------------------------------------------------------------
  // One phrase per direction reads naturally in every language ("120 m al norte de casa").
  const FROM_HOME = {
    N: '{distance} north of home', NE: '{distance} northeast of home', E: '{distance} east of home', SE: '{distance} southeast of home',
    S: '{distance} south of home', SW: '{distance} southwest of home', W: '{distance} west of home', NW: '{distance} northwest of home',
  };
  function distanceText(r) {
    if (r.zone === 'Home') return t('At home');
    if (r.zone === 'Backyard') return t('In the backyard');
    const h = Paw.sim.fromHome(r);
    return t(FROM_HOME[h.dir] || '{distance} from home', { distance: U.fmtDistance(h.meters, { short: true }) });
  }
  function safeStatus(r) {
    if (r.inZone) return status('good', t('Inside safe zone'));
    return r.route && C.ACTIVITIES[r.activity].withOwner ? status('good', t('Out on a walk')) : status('warning', t('Outside safe zone'));
  }
  function breathText(pet, r) {
    if (pet.species === 'dog' && r.breath > 60) return t('Panting');
    return t('{n} / min', { n: Math.round(r.breath) });
  }
  function hrNote(pet, r) {
    const s = Paw.sim.hrStatus(pet, r);
    return t(s.note, { activity: Paw.i18n.lower(activityName(pet.species, r.activity)) });
  }
  const LIVE = {
    hr: (pet, r) => String(Math.round(r.hr)),
    'hr-status': (pet, r) => { const s = Paw.sim.hrStatus(pet, r); return status(s.level, t(s.label)); },
    'hr-note': (pet, r) => hrNote(pet, r),
    activity: (pet, r) => activityChip(r.activity, pet.species),
    'activity-text': (pet, r) => activityName(pet.species, r.activity),
    'pack-sub': (pet, r) => activityName(pet.species, r.activity) + ' · ' + t('{n} bpm', { n: Math.round(r.hr) }),
    zone: (pet, r) => zoneName(r.zone),
    distance: (pet, r) => distanceText(r),
    safe: (pet, r) => safeStatus(r),
    battery: (pet) => battery(pet.device.battery),
    mood: (pet, r) => moodChip(r.mood),
    temp: (pet, r) => U.fmtTemp(r.temp),
    breath: (pet, r) => breathText(pet, r),
    steps: (pet) => U.fmtNumber(Paw.store.statsFor(pet.id).steps),
    'dist-today': (pet) => U.fmtDistance(Paw.store.statsFor(pet.id).distance),
    active: (pet) => U.fmtDuration(Paw.store.statsFor(pet.id).activeSec),
    fix: (pet, r) => t('Updated {ago}', { ago: U.fmtAgo(r.lastFix) }),
  };
  const HTML_KEYS = new Set(['hr-status', 'activity', 'safe', 'battery', 'mood']);

  function refreshLive(root) {
    U.$$('[data-live]', root).forEach((el) => {
      const pet = Paw.store.getPet(el.dataset.pet);
      const r = pet && Paw.sim.runtime(pet.id);
      const fn = LIVE[el.dataset.live];
      if (!r || !fn) return;
      const v = fn(pet, r);
      if (HTML_KEYS.has(el.dataset.live)) {
        if (el.dataset.v !== v) {
          el.innerHTML = v;
          el.dataset.v = v;
        }
      } else if (el.textContent !== v) {
        el.textContent = v;
      }
    });
    U.$$('[data-beat]', root).forEach((el) => {
      const r = Paw.sim.runtime(el.dataset.beat);
      if (r) el.style.setProperty('--beat', (60 / Math.max(30, r.hr)).toFixed(3) + 's');
    });
    U.$$('[data-ago]', root).forEach((el) => {
      const v = U.fmtAgo(Number(el.dataset.ago));
      if (el.textContent !== v) el.textContent = v;
    });
  }
  // Markup for a live value (starts filled in so the page is complete before the first tick).
  function live(key, pet, tag) {
    const r = Paw.sim.runtime(pet.id);
    const v = r ? LIVE[key](pet, r) : '';
    const t = tag || 'span';
    return `<${t} data-live="${key}" data-pet="${U.esc(pet.id)}"${HTML_KEYS.has(key) ? ` data-v="${U.esc(v)}"` : ''}>${HTML_KEYS.has(key) ? v : U.esc(v)}</${t}>`;
  }
  function beatingHeart(pet, cls) {
    const r = Paw.sim.runtime(pet.id);
    const beat = r ? (60 / Math.max(30, r.hr)).toFixed(3) : '0.8';
    return `<svg class="icon heart-beat${cls ? ' ' + cls : ''}" data-beat="${U.esc(pet.id)}" style="--beat:${beat}s" aria-hidden="true" focusable="false"><use href="#i-heart-fill"/></svg>`;
  }

  // Swap avatar faces when a pet falls asleep, wakes up or gets playful.
  function refreshAvatars(petId) {
    const pet = Paw.store.getPet(petId);
    const r = pet && Paw.sim.runtime(petId);
    if (!r) return;
    const state = Paw.avatars.stateFor(r.activity, r.mood);
    U.$$(`[data-avatar="${CSS.escape(petId)}"]`).forEach((el) => {
      if (el.dataset.state === state) return;
      el.dataset.state = state;
      el.innerHTML = Paw.avatars.svg(pet, state);
    });
  }
  function avatar(pet, size) {
    const r = Paw.sim.runtime(pet.id);
    return Paw.avatars.wrap(pet, { size, state: r ? Paw.avatars.stateFor(r.activity, r.mood) : 'calm' });
  }

  Paw.ui = {
    icon, status, moodChip, activityChip, battery, switchButton, language, petColor,
    activityName, zoneName, speciesName, languageLabel, soundText,
    languageOptions, petOptions, announce, toast, openDialog, closeDialog, confirm: confirmDialog,
    refreshLive, live, beatingHeart, refreshAvatars, avatar, distanceText,
  };
})();
