/* App shell: routing, navigation, global actions, and wiring the simulation to the UI. */
(function () {
  'use strict';
  const Paw = window.Paw;
  const C = Paw.config;
  const U = Paw.util;
  const ui = Paw.ui;
  const ROUTES = ['home', 'map', 'health', 'translator', 'logs', 'preferences'];
  const main = () => U.$('#main-content');
  const settings = () => Paw.store.state.settings;
  const getPet = (id) => Paw.store.getPet(id);
  const zoneAlerted = new Set();
  const placeSeen = new Map();
  const lastVolume = new Map();
  let routeName = null;
  let view = null;

  Paw.views.noPets = (title) => `<header class="view-head">
      <div class="view-head__text"><h1 class="view-title" tabindex="-1">${U.esc(title)}</h1></div>
    </header>
    <section class="empty-state">
      <h2 class="empty-state__title">No pets yet</h2>
      <p class="empty-state__text">Add a pet to bring this page to life.</p>
      <div class="empty-state__actions"><button type="button" class="btn btn-primary" data-action="add-pet">${ui.icon('plus')}Add a pet</button></div>
    </section>`;

  // ---- theme & motion ---------------------------------------------------------------
  function applyTheme() {
    const root = document.documentElement;
    const t = settings().theme;
    if (t === 'light' || t === 'dark') {
      root.dataset.theme = t;
      root.dataset.themeOwner = 'app';
    } else if (root.dataset.themeOwner === 'app') {
      // Only clear a theme this app set; a host page may set its own.
      delete root.dataset.theme;
      delete root.dataset.themeOwner;
    }
  }
  // The theme actually showing: the app's choice, a host page's choice, or the device setting.
  const darkQuery = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
  function effectiveTheme() {
    const t = settings().theme;
    if (t === 'light' || t === 'dark') return t;
    const host = document.documentElement.dataset.theme;
    if (host === 'light' || host === 'dark') return host;
    return darkQuery && darkQuery.matches ? 'dark' : 'light';
  }
  function updateThemeButton() {
    const dark = effectiveTheme() === 'dark';
    const btn = U.$('#btn-theme');
    const label = dark ? 'Switch to light mode' : 'Switch to dark mode';
    btn.setAttribute('aria-label', label);
    btn.title = label;
    btn.innerHTML = ui.icon(dark ? 'sun' : 'moon');
  }
  function applyMotion() {
    const m = settings().motion;
    if (m === 'reduce' || m === 'full') document.documentElement.dataset.motion = m;
    else delete document.documentElement.dataset.motion;
  }

  // ---- shell -----------------------------------------------------------------------
  function setAppName() {
    U.$$('[data-app-name]').forEach((el) => { el.textContent = C.APP_NAME; });
    U.$$('[data-app-name-label]').forEach((el) => el.setAttribute('aria-label', C.APP_NAME + ' home'));
  }

  function renderPack() {
    const s = Paw.store.state;
    U.$('#pack-list').innerHTML = s.pets.map((p) => `<li>
        <button type="button" class="pack-item" id="pack-${U.esc(p.id)}" data-action="select-pet" data-pet="${U.esc(p.id)}" aria-pressed="${p.id === s.selectedPetId}" style="--pet:${ui.petColor(p)}">
          ${ui.avatar(p, 'sm')}
          <span class="pack-item__text"><span class="pack-item__name">${U.esc(p.name)}</span><span class="pack-item__sub">${ui.live('pack-sub', p)}</span></span>
          <span class="pet-dot" aria-hidden="true"></span>
        </button></li>`).join('');
    U.$('.pack__add').hidden = s.pets.length >= C.MAX_PETS;
  }

  function renderChips() {
    const s = Paw.store.state;
    const host = U.$('#pet-chips');
    host.innerHTML = s.pets.map((p) => `<button type="button" class="pet-chip" id="chip-${U.esc(p.id)}" data-action="select-pet" data-pet="${U.esc(p.id)}" aria-pressed="${p.id === s.selectedPetId}" style="--pet:${ui.petColor(p)}">${ui.avatar(p, 'xs')}<span>${U.esc(p.name)}</span></button>`).join('') +
      (s.pets.length < C.MAX_PETS ? `<button type="button" class="pet-chip pet-chip--add" data-action="add-pet" aria-label="Add a pet" title="Add a pet">${ui.icon('plus')}</button>` : '');
    host.hidden = !s.pets.length;
  }

  function syncSelection() {
    const id = Paw.store.state.selectedPetId;
    U.$$('[data-action="select-pet"]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.pet === id)));
  }

  function updateStatus() {
    const s = settings();
    U.$('#live-status').innerHTML = s.paused
      ? `<span class="live-dot live-dot--paused" aria-hidden="true"></span>Paused`
      : `<span class="live-dot" aria-hidden="true"></span>Live<span class="live-status__sub">&nbsp;· demo data</span>`;
    const pause = U.$('#btn-pause');
    const pauseLabel = s.paused ? 'Resume live data' : 'Pause live data';
    pause.setAttribute('aria-label', pauseLabel);
    pause.title = pauseLabel;
    pause.innerHTML = ui.icon(s.paused ? 'play' : 'pause');
    const quiet = U.$('#btn-quiet');
    quiet.setAttribute('aria-pressed', String(!!s.quiet));
    quiet.title = s.quiet ? 'Quiet mode is on: every voice box is silent' : 'Quiet mode: silence every voice box';
    quiet.innerHTML = ui.icon(s.quiet ? 'volume-off' : 'volume');
    document.body.classList.toggle('is-paused', !!s.paused);
  }

  // ---- routing ---------------------------------------------------------------------
  function currentRoute() {
    const t = location.hash.replace(/^#/, '');
    return ROUTES.indexOf(t) !== -1 ? t : null;
  }

  function renderView(enter) {
    const m = main();
    m.innerHTML = `<div class="view view--${routeName}${enter ? ' view--enter' : ''}">${view.render()}</div>`;
    if (view.mount) view.mount(m);
    ui.refreshLive(m);
  }

  function go(name, opts) {
    const o = opts || {};
    if (view && view.unmount) view.unmount();
    routeName = name;
    view = Paw.views[name];
    renderView(true);
    U.$$('[data-route-link]').forEach((a) => {
      if (a.dataset.routeLink === name) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
    document.title = name === 'home' ? C.APP_NAME : `${view.title} · ${C.APP_NAME}`;
    if (o.focus) {
      window.scrollTo(0, 0);
      const h = main().querySelector('h1');
      if (h) h.focus({ preventScroll: true });
    }
  }

  // Re-render the current view in place, keeping scroll position and focus. If the focused
  // control no longer exists (say, the pet it belonged to was removed), focus the page heading.
  function refreshView() {
    if (!view) return;
    const active = document.activeElement;
    const wasInMain = !!active && main().contains(active);
    const id = wasInMain ? active.id : null;
    const y = window.scrollY;
    if (view.unmount) view.unmount();
    renderView(false);
    window.scrollTo(0, y);
    if (wasInMain) {
      const target = (id && document.getElementById(id)) || main().querySelector('h1');
      if (target) target.focus({ preventScroll: true });
    }
  }

  // ---- speech ----------------------------------------------------------------------
  // Speak through this device, the demo stand-in for the collar's voice box.
  function speakFor(petId, text, opts) {
    const o = opts || {};
    const pet = getPet(petId);
    if (!pet || !text) return false;
    const s = settings();
    const explain = (msg, extra) => { if (o.explain) ui.toast(msg, Object.assign({ icon: 'volume-off' }, extra)); };
    if (o.requireOn && !pet.translator.on) {
      explain(`${ui.possessive(pet.name)} translator is off.`, { actionLabel: 'Turn on', action: () => toggleTranslator(petId) });
      return false;
    }
    if (s.quiet) {
      explain('Quiet mode is on, so voice boxes are silent.', { actionLabel: 'Turn off', action: () => Paw.store.setSetting('quiet', false) });
      return false;
    }
    if (!pet.translator.volume) {
      explain(`${ui.possessive(pet.name)} voice box volume is at 0%.`, {
        actionLabel: 'Set to 60%',
        action: () => {
          Paw.store.setTranslator(petId, { volume: 60 });
          if (routeName === 'translator') refreshView();
        },
      });
      return false;
    }
    if (!Paw.voice.supported) {
      explain('This browser can’t speak out loud. Translations still appear as text.', { icon: 'info' });
      return false;
    }
    if (Paw.voice.listening) return false; // don't talk into the microphone
    const style = C.VOICE_STYLES[pet.translator.voice] || C.VOICE_STYLES.normal;
    const volume = pet.translator.volume / 100;
    let lang = o.lang || pet.translator.lang;
    let line = text;
    let voiceName = lang === pet.translator.lang ? pet.translator.voiceName : '';
    // No voice for this language on the device: say the same line in a language it can speak,
    // so the pet never goes silent. (Every line exists in all app languages.)
    if (Paw.voice.ready && Paw.voice.voiceCount && !Paw.voice.voiceFor(lang)) {
      const alt = Paw.voice.fallbackLang(Paw.sim.langShort(lang));
      if (alt) {
        const re = o.key ? Paw.sim.retranslate({ key: o.key }, alt) : null;
        if (re) line = re.text;
        else if (o.texts && o.texts[Paw.sim.langShort(alt)]) line = o.texts[Paw.sim.langShort(alt)];
        lang = alt;
        voiceName = '';
      }
    }
    // retry: how to say it again in another language if every voice for this one fails.
    const retry = o.retried ? null : { lang: o.lang, key: o.key, texts: o.texts };
    const say = () => Paw.voice.speak({ text: line, lang, voiceName, volume, pitch: style.pitch, rate: style.rate, petId, retry });
    if (o.chime && s.chime) {
      Paw.voice.chime(volume);
      setTimeout(say, 380);
    } else {
      say();
    }
    return true;
  }

  // Play what you said to a pet as that pet's own sounds (tr from Paw.petSounds.translate).
  // Resolves with the length in seconds, or 0 when nothing played.
  function petSay(petId, tr, opts) {
    const o = opts || {};
    const pet = getPet(petId);
    if (!pet || !tr) return Promise.resolve(0);
    const explain = (msg, extra) => { if (o.explain) ui.toast(msg, Object.assign({ icon: 'volume-off' }, extra)); };
    if (!pet.translator.on) {
      explain(`${ui.possessive(pet.name)} translator is off.`, { actionLabel: 'Turn on', action: () => toggleTranslator(petId) });
      return Promise.resolve(0);
    }
    if (settings().quiet) {
      explain('Quiet mode is on, so voice boxes are silent.', { actionLabel: 'Turn off', action: () => Paw.store.setSetting('quiet', false) });
      return Promise.resolve(0);
    }
    if (!pet.translator.volume) {
      explain(`${ui.possessive(pet.name)} voice box volume is at 0%.`);
      return Promise.resolve(0);
    }
    return Paw.petSounds.play(pet, tr, (pet.translator.volume / 100) * 0.9).catch(() => 0);
  }

  function setSpeaking(petId, on) {
    if (!petId) {
      U.$$('.is-speaking').forEach((el) => el.classList.remove('is-speaking'));
      return;
    }
    U.$$(`[data-speaking="${CSS.escape(petId)}"]`).forEach((el) => el.classList.toggle('is-speaking', on));
  }

  // ---- actions -----------------------------------------------------------------------
  function toggleTranslator(petId) {
    const pet = getPet(petId);
    if (!pet) return;
    const on = !pet.translator.on;
    if (!on && Paw.voice.current && Paw.voice.current.petId === petId) Paw.voice.stop();
    Paw.store.setTranslator(petId, { on });
    Paw.sim.translatorChanged(petId, on);
    Paw.store.addLog({ kind: 'activity', type: 'device', petId, ts: Date.now(), title: on ? 'Translator turned on' : 'Translator turned off', source: 'app' });
  }

  function setPaused(paused) {
    Paw.store.setSetting('paused', paused);
    if (paused) Paw.voice.stop();
    else Paw.sim.resume();
    ui.announce(paused ? 'Live data paused.' : 'Live data resumed.');
  }

  async function removePet(petId) {
    const pet = getPet(petId);
    if (!pet) return;
    const ok = await ui.confirm({
      title: `Remove ${pet.name}?`,
      body: `This deletes ${ui.possessive(pet.name)} collar, logs and history from this device. You can’t undo this.`,
      confirmLabel: 'Remove',
      danger: true,
    });
    if (!ok) return;
    Paw.store.removePet(petId);
    ui.toast(`${pet.name} was removed.`, { icon: 'check' });
  }

  function pingCollar(petId) {
    const pet = getPet(petId);
    if (!pet) return;
    if (!settings().quiet) Paw.voice.ping(0.6);
    Paw.store.addLog({ kind: 'activity', type: 'device', petId, ts: Date.now(), title: 'Collar pinged', detail: 'Beeped three times', source: 'app' });
    ui.toast(settings().quiet ? `Pinged ${ui.possessive(pet.name)} collar. Quiet mode kept this device silent.` : `${ui.possessive(pet.name)} collar beeped three times.`, { icon: 'bell' });
  }

  function deleteLog(id) {
    const entry = Paw.store.state.logs.find((l) => l.id === id);
    if (!entry) return;
    Paw.store.removeLogs((l) => l.id === id);
    ui.toast('Entry deleted.', { icon: 'trash', actionLabel: 'Undo', action: () => Paw.store.addLog(entry) });
  }

  const GLOBAL = {
    actions: {
      'add-pet': () => Paw.dialogs.petForm(),
      'edit-pet': (el) => Paw.dialogs.petForm(el.dataset.pet),
      'remove-pet': (el) => removePet(el.dataset.pet),
      'select-pet': (el) => Paw.store.selectPet(el.dataset.pet),
      'pick-pet': (el) => Paw.store.selectPet(el.dataset.pet),
      'toggle-translator': (el) => toggleTranslator(el.dataset.pet),
      'toggle-setting': (el) => Paw.store.setSetting(el.dataset.key, !settings()[el.dataset.key]),
      'toggle-pause': () => setPaused(!settings().paused),
      'toggle-quiet': () => Paw.store.setSetting('quiet', !settings().quiet),
      'toggle-theme': () => Paw.store.setSetting('theme', effectiveTheme() === 'dark' ? 'light' : 'dark'),
      'open-demo': () => Paw.dialogs.demoControls(),
      'log-entry': (el) => Paw.dialogs.logEntry(el.dataset.type),
      export: () => Paw.dialogs.exportData(),
      'stop-voice': () => Paw.voice.stop(),
      'ping-collar': (el) => pingCollar(el.dataset.pet),
      'delete-log': (el) => deleteLog(el.dataset.log),
      'logs-tab-link': (el) => Paw.views.logs.setTab(el.dataset.tab),
      'replay-latest': (el) => {
        const pet = getPet(el.dataset.pet);
        const r = pet && Paw.sim.runtime(pet.id);
        if (!r) return;
        // A pet with nothing translated yet (one just added, say) comes up with a line now;
        // the new thought is spoken like any other.
        if (!r.lastThought) {
          if (pet.translator.on) Paw.sim.think(pet.id, { manual: true });
          else ui.toast(`${ui.possessive(pet.name)} translator is off.`, { icon: 'volume-off', actionLabel: 'Turn on', action: () => toggleTranslator(pet.id) });
          return;
        }
        speakFor(pet.id, r.lastThought.text, { lang: r.lastThought.lang, key: r.lastThought.key, requireOn: true, explain: true });
      },
      'replay-log': (el) => {
        const l = Paw.store.state.logs.find((x) => x.id === el.dataset.log);
        if (l) speakFor(l.petId, l.text, { lang: l.lang, key: l.key, explain: true });
      },
      'play-sounds': (el) => {
        const pet = getPet(el.dataset.pet);
        if (pet) petSay(pet.id, Paw.petSounds.translate(pet, el.dataset.text), { explain: true });
      },
      'test-speaker': (el) => {
        const pet = getPet(el.dataset.pet);
        if (pet) speakFor(pet.id, Paw.phrases.speakerTest[Paw.sim.langShort(pet.translator.lang)], { texts: Paw.phrases.speakerTest, requireOn: true, explain: true });
      },
      'toggle-mute': (el) => {
        const pet = getPet(el.dataset.pet);
        if (!pet) return;
        if (pet.translator.volume) {
          lastVolume.set(pet.id, pet.translator.volume);
          Paw.store.setTranslator(pet.id, { volume: 0 });
          Paw.voice.stop();
        } else {
          Paw.store.setTranslator(pet.id, { volume: lastVolume.get(pet.id) || 60 });
        }
        refreshView();
      },
      'clear-logs': async () => {
        const ok = await ui.confirm({ title: 'Clear all logs?', body: 'This deletes every log entry for every pet on this device. Pets and settings stay.', confirmLabel: 'Clear logs', danger: true });
        if (!ok) return;
        Paw.store.removeLogs(() => true);
        ui.toast('All logs cleared.', { icon: 'check' });
      },
      'reset-demo': async () => {
        const ok = await ui.confirm({ title: 'Reset the demo?', body: 'This deletes your pets, logs and settings on this device and brings back the sample pack.', confirmLabel: 'Reset', danger: true });
        if (!ok) return;
        Paw.voice.stop();
        Paw.store.resetAll();
        ui.toast('Demo reset. The sample pack is back.', { icon: 'refresh' });
      },
    },
    changes: {},
    inputs: {
      'zone-radius': (el) => {
        const v = Number(el.value);
        Paw.store.setSetting('safeRadius', v);
        el.setAttribute('aria-valuetext', U.fmtDistance(v));
        el.style.setProperty('--val', (((v - 80) / 220) * 100).toFixed(1) + '%');
      },
    },
  };

  // One delegated listener per event type. Global handlers run first, then the view's.
  function delegate(kind, e) {
    const attr = kind === 'click' ? 'action' : kind;
    const el = e.target.closest(`[data-${attr}]`);
    if (!el) return;
    if (kind === 'click' && (el.disabled || el.getAttribute('aria-disabled') === 'true')) return;
    const table = kind === 'click' ? 'actions' : kind === 'change' ? 'changes' : 'inputs';
    const name = el.dataset[attr];
    const global = GLOBAL[table][name];
    const local = view && view[table] && main().contains(el) ? view[table][name] : null;
    if (global) global(el, e, main());
    if (local) local(el, e, main());
  }

  // ---- simulation events ---------------------------------------------------------------
  function onThought(t) {
    const pet = getPet(t.petId);
    if (!pet) return;
    const entry = Object.assign({}, t);
    delete entry.manual;
    Paw.store.addLog(entry);
    // Lines the person asked for (a reply, Listen in, Play) say why they're silent; background chatter doesn't.
    if (pet.translator.on) speakFor(pet.id, t.text, { lang: t.lang, key: t.key, chime: true, explain: t.manual });
    if (settings().announce) ui.announce(`${pet.name} says:`, { text: t.text, lang: t.lang });
    ui.refreshAvatars(pet.id);
    if (view && view.on) view.on('thought', t, main());
  }

  function onZone(d) {
    const pet = getPet(d.petId);
    if (!pet) return;
    if (!d.inZone && !d.withOwner) {
      zoneAlerted.add(pet.id);
      Paw.store.addLog({ kind: 'activity', type: 'zone', petId: pet.id, ts: Date.now(), title: 'Left the safe zone', detail: 'Last seen: ' + d.zone, source: 'collar' });
      if (settings().zoneAlerts) {
        ui.toast(`${pet.name} left the safe zone. Last seen: ${d.zone}.`, {
          tone: 'warning', icon: 'alert', duration: 9000, actionLabel: 'Show on map',
          action: () => {
            Paw.store.selectPet(pet.id);
            location.hash = 'map';
          },
        });
      }
    } else if (d.inZone && zoneAlerted.has(pet.id)) {
      zoneAlerted.delete(pet.id);
      Paw.store.addLog({ kind: 'activity', type: 'zone', petId: pet.id, ts: Date.now(), title: 'Back inside the safe zone', source: 'collar' });
      if (settings().zoneAlerts) ui.toast(`${pet.name} is back inside the safe zone.`, { icon: 'shield' });
    }
  }

  function onPlace(d) {
    if (d.zone !== 'Bark Park' && d.zone !== 'Community garden') return;
    const key = d.petId + d.zone;
    if (Date.now() - (placeSeen.get(key) || 0) < 2 * U.MIN) return;
    placeSeen.set(key, Date.now());
    Paw.store.addLog({ kind: 'activity', type: 'zone', petId: d.petId, ts: Date.now(), title: 'Arrived at ' + d.zone, source: 'collar' });
  }

  function wire() {
    Paw.store.subscribe((topic, d) => {
      switch (topic) {
        case 'settings':
          if (d.key === 'theme') {
            applyTheme();
            updateThemeButton();
            const radio = U.$(`input[name="theme"][value="${d.value}"]`);
            if (radio) radio.checked = true;
          }
          if (d.key === 'motion') applyMotion();
          if (d.key === 'paused' || d.key === 'quiet') updateStatus();
          if (d.key === 'quiet' && d.value) Paw.voice.stop();
          U.$$(`[data-action="toggle-setting"][data-key="${d.key}"]`).forEach((b) => b.setAttribute('aria-checked', String(!!d.value)));
          if (d.key === 'units' && routeName !== 'preferences') refreshView();
          else if (view && view.on) view.on('settings', d, main());
          break;
        case 'select':
          syncSelection();
          if (view && view.handlesSelect) {
            if (view.on) view.on('select', d, main());
          } else {
            refreshView();
          }
          break;
        case 'pets':
          renderPack();
          renderChips();
          if (d.removed) Paw.sim.remove(d.removed);
          Paw.store.state.pets.forEach((p) => Paw.sim.ensure(p));
          refreshView();
          break;
        case 'translator': {
          const pet = getPet(d.id);
          if (!pet) break;
          U.$$(`[role="switch"][data-action="toggle-translator"][data-pet="${CSS.escape(d.id)}"]`)
            .forEach((b) => b.setAttribute('aria-checked', String(pet.translator.on)));
          if (routeName === 'translator' && ('on' in d.patch || 'lang' in d.patch)) refreshView();
          else if (view && view.on) view.on('translator', Object.assign({}, d), main());
          break;
        }
        case 'device':
          ui.refreshLive(document);
          break;
        case 'logs':
          if (view && view.on) view.on('logs', d, main());
          break;
        case 'reset':
          zoneAlerted.clear();
          Paw.sim.reset();
          Paw.sim.start();
          applyTheme();
          updateThemeButton();
          applyMotion();
          renderPack();
          renderChips();
          updateStatus();
          go(routeName || 'home', { focus: true });
          break;
        default:
      }
    });

    Paw.sim.on((type, d) => {
      switch (type) {
        case 'tick':
          ui.refreshLive(document);
          if (view && view.tick) view.tick(main());
          break;
        case 'thought':
          onThought(d);
          break;
        case 'activity-log':
          Paw.store.addLog(d);
          break;
        case 'activity':
          ui.refreshAvatars(d.petId);
          if (view && view.on) view.on('activity', d, main());
          break;
        case 'zone':
          onZone(d);
          break;
        case 'place':
          onPlace(d);
          break;
        case 'battery-low': {
          const pet = getPet(d.petId);
          if (!pet) break;
          const pct = Math.round(d.battery);
          ui.toast(`${ui.possessive(pet.name)} collar battery is low (${pct}%).`, {
            tone: 'warning', icon: 'alert', actionLabel: 'Charge it', action: () => Paw.store.setBattery(pet.id, 100),
          });
          Paw.store.addLog({ kind: 'activity', type: 'device', petId: pet.id, ts: Date.now(), title: 'Collar battery low', detail: pct + '% left', source: 'collar' });
          break;
        }
        case 'hr-spike':
          Paw.store.addLog({ kind: 'activity', type: 'health', petId: d.petId, ts: Date.now(), title: 'Heart rate rose while resting', detail: 'Probably a startle', source: 'collar' });
          break;
        default:
      }
    });

    Paw.voice.on((type, item) => {
      if (type === 'start' && item) setSpeaking(item.petId, true);
      else if (type === 'end' && item) setSpeaking(item.petId, false);
      else if (type === 'idle') setSpeaking(null, false);
      else if ((type === 'voices' || type === 'voice-failed') && view && view.on) view.on('voices', {}, main());
      // Every voice for that language failed: say it again, which falls back to another language.
      else if (type === 'unavailable' && item && item.retry) speakFor(item.petId, item.text, Object.assign({}, item.retry, { retried: true }));
    });

    document.addEventListener('click', (e) => delegate('click', e));
    document.addEventListener('change', (e) => delegate('change', e));
    document.addEventListener('input', (e) => delegate('input', e));

    window.addEventListener('hashchange', () => {
      const r = currentRoute();
      if (r && r !== routeName) go(r, { focus: true });
    });

    // Skip link: move focus without changing the route in the address bar.
    U.$('.skip-link').addEventListener('click', (e) => {
      e.preventDefault();
      main().focus();
    });
  }

  function registerServiceWorker() {
    if (!('serviceWorker' in navigator) || !/^https?:$/.test(location.protocol) || U.inFrame) return;
    navigator.serviceWorker.register('sw.js').catch(() => { /* offline support is optional */ });
  }

  function init() {
    Paw.store.init();
    applyTheme();
    applyMotion();
    setAppName();
    Paw.voice.init();
    Paw.petSounds.init();
    Paw.sim.start();
    U.hostDownloads();
    renderPack();
    renderChips();
    updateStatus();
    updateThemeButton();
    if (darkQuery && darkQuery.addEventListener) darkQuery.addEventListener('change', updateThemeButton);
    wire();
    go(currentRoute() || 'home', { focus: false });
    if (!U.storage.get(C.ACK_KEY)) Paw.dialogs.welcome();
    registerServiceWorker();
  }

  Paw.app = { refreshView, setPaused, speakFor, petSay, toggleTranslator, go: (r) => { location.hash = r; } };
  init();
})();
