/* App state: pets, settings, logs, heart-rate history and today's stats.
   Saved to this browser's localStorage only. Nothing is sent anywhere. */
(function () {
  'use strict';
  const Paw = (window.Paw = window.Paw || {});
  const C = Paw.config;
  const U = Paw.util;

  const subs = new Set();
  let state = null;
  let saveTimer = null;
  let lazyTimer = null;
  let storageOk = true;
  const HR_KEEP = 720; // minutes of heart-rate history (12 hours)

  function guessUnits() {
    const lang = (navigator.languages && navigator.languages[0]) || navigator.language || 'en-US';
    return /^en-(US|LR|MM)$/i.test(lang) ? 'imperial' : 'metric';
  }

  const DEFAULT_SETTINGS = {
    theme: 'system', motion: 'system', units: guessUnits(),
    speed: 1, chattiness: 'normal', paused: false, quiet: false,
    chime: true, announce: true, zoneAlerts: true, safeRadius: 160,
    talkLang: 'auto', micConsent: false,
  };

  const SAMPLE_PETS = [
    { name: 'Biscuit', species: 'dog', breed: 'Golden Retriever', size: 'large', age: 4, coat: 'golden', battery: 86,
      translator: { on: true, volume: 70, lang: 'en-US', voice: 'normal' } },
    { name: 'Luna', species: 'cat', breed: 'Tabby', size: 'small', age: 3, coat: 'gray', battery: 64,
      translator: { on: true, volume: 60, lang: 'es-ES', voice: 'high' } },
    { name: 'Kiwi', species: 'bird', breed: 'Budgie', size: 'small', age: 2, coat: 'leaf', battery: 58,
      translator: { on: true, volume: 60, lang: 'fr-FR', voice: 'squeaky' } },
  ];
  const TRANSLATOR_DEFAULTS = { on: true, volume: 70, lang: 'en-US', voice: 'normal', voiceName: '' };

  function emit(topic, detail) {
    subs.forEach((fn) => {
      try { fn(topic, detail || {}); } catch (err) { console.error(err); }
    });
  }
  function subscribe(fn) {
    subs.add(fn);
    return () => subs.delete(fn);
  }

  // ---- persistence --------------------------------------------------------------
  function flush() {
    clearTimeout(saveTimer);
    clearTimeout(lazyTimer);
    saveTimer = null;
    lazyTimer = null;
    if (state) storageOk = U.storage.set(C.STORAGE_KEY, JSON.stringify(state));
  }
  // User actions save quickly; once-a-second simulation updates save every 15 s.
  function persist(lazy) {
    if (lazy) {
      if (!lazyTimer && !saveTimer) lazyTimer = setTimeout(flush, 15000);
      return;
    }
    clearTimeout(saveTimer);
    saveTimer = setTimeout(flush, 400);
  }
  window.addEventListener('pagehide', flush);
  document.addEventListener('visibilitychange', () => { if (document.hidden) flush(); });

  function load() {
    const raw = U.storage.get(C.STORAGE_KEY);
    if (!raw) return null;
    try {
      const s = JSON.parse(raw);
      return s && s.v === 1 && Array.isArray(s.pets) ? s : null;
    } catch (e) {
      return null;
    }
  }

  // ---- pets ---------------------------------------------------------------------
  function sanitizePet(data) {
    const out = {};
    if ('name' in data) out.name = String(data.name || '').trim().slice(0, 20);
    if ('species' in data) out.species = C.SPECIES[data.species] ? data.species : 'dog';
    if ('breed' in data) out.breed = String(data.breed || '').trim().slice(0, 32);
    if ('size' in data) out.size = C.SIZES[data.size] ? data.size : 'medium';
    if ('age' in data) out.age = data.age === '' || data.age == null || isNaN(Number(data.age)) ? null : U.clamp(Math.round(Number(data.age)), 0, 30);
    if ('coat' in data) out.coat = C.COATS[data.coat] ? data.coat : 'golden';
    return out;
  }
  // Each species has its own colors; fall back to its first one.
  function fixCoat(pet) {
    const coats = (C.SPECIES[pet.species] || C.SPECIES.dog).coats;
    if (coats.indexOf(pet.coat) === -1) pet.coat = coats[0];
    return pet;
  }
  function makePet(data, slot) {
    const base = fixCoat(sanitizePet(Object.assign({ species: 'dog', size: 'medium', coat: 'golden', breed: '', age: null }, data)));
    return Object.assign(base, {
      id: U.uid('pet'),
      slot,
      sample: !!data.sample,
      device: {
        id: 'PL-' + String(1000 + Math.floor(Math.random() * 9000)),
        battery: data.battery != null ? data.battery : 100,
        firmware: '0.9.4-demo',
      },
      translator: Object.assign({}, TRANSLATOR_DEFAULTS, data.translator || {}),
      createdAt: Date.now(),
    });
  }
  function freeSlot() {
    const used = new Set(state.pets.map((p) => p.slot));
    for (let s = 1; s <= C.MAX_PETS; s++) if (!used.has(s)) return s;
    return null;
  }
  const getPet = (id) => state.pets.find((p) => p.id === id) || null;
  const selectedPet = () => getPet(state.selectedPetId) || state.pets[0] || null;

  // ---- seed / normalize ---------------------------------------------------------
  function seed(keepSettings) {
    state = {
      v: 1,
      settings: Object.assign({}, DEFAULT_SETTINGS, keepSettings || {}),
      pets: [], logs: [], hr: {}, stats: {}, selectedPetId: null,
    };
    const now = Date.now();
    SAMPLE_PETS.forEach((data, i) => {
      const pet = makePet(Object.assign({ sample: true }, data), i + 1);
      state.pets.push(pet);
      const h = Paw.sim.buildHistory(pet, now, HR_KEEP);
      state.hr[pet.id] = h.hr;
      state.stats[pet.id] = h.stats;
      h.logs.forEach((l) => state.logs.push(l));
    });
    const [biscuit, luna, kiwi] = state.pets;
    state.logs.push(
      { kind: 'activity', type: 'groom', petId: biscuit.id, ts: now - 5.6 * 60 * U.MIN, title: 'Grooming', note: 'Brushed out the undercoat.', source: 'manual' },
      { kind: 'activity', type: 'meds', petId: luna.id, ts: now - 3.2 * 60 * U.MIN, title: 'Medication', note: 'Monthly flea treatment (sample entry).', source: 'manual' },
      { kind: 'activity', type: 'note', petId: kiwi.id, ts: now - 1.4 * 60 * U.MIN, title: 'Note', note: 'Learned to whistle the doorbell.', source: 'manual' },
    );
    state.logs.forEach((l) => { l.id = l.id || U.uid('log'); });
    state.logs.sort((a, b) => b.ts - a.ts);
    state.selectedPetId = biscuit.id;
  }

  function normalize(s) {
    s.settings = Object.assign({}, DEFAULT_SETTINGS, s.settings);
    s.settings.paused = false; // the demo always opens live
    s.logs = Array.isArray(s.logs) ? s.logs.filter((l) => l && typeof l.ts === 'number' && l.petId) : [];
    s.logs.forEach((l) => { l.id = l.id || U.uid('log'); });
    s.logs.sort((a, b) => b.ts - a.ts);
    s.hr = s.hr || {};
    s.stats = s.stats || {};
    const used = new Set();
    s.pets = s.pets.filter((p) => p && p.id && p.name).slice(0, C.MAX_PETS);
    s.pets.forEach((p) => {
      fixCoat(Object.assign(p, sanitizePet(p)));
      p.device = Object.assign({ id: 'PL-0000', battery: 80, firmware: '0.9.4-demo' }, p.device);
      p.translator = Object.assign({}, TRANSLATOR_DEFAULTS, p.translator);
      if (!C.LANGUAGES.some((l) => l.code === p.translator.lang)) p.translator.lang = 'en-US';
      if (!C.VOICE_STYLES[p.translator.voice]) p.translator.voice = 'normal';
      if (!p.slot || used.has(p.slot)) p.slot = null;
      if (p.slot) used.add(p.slot);
    });
    s.pets.forEach((p) => {
      if (!p.slot) for (let k = 1; k <= C.MAX_PETS; k++) if (!used.has(k)) { p.slot = k; used.add(k); break; }
    });
    if (!s.pets.some((p) => p.id === s.selectedPetId)) s.selectedPetId = s.pets[0] ? s.pets[0].id : null;
    return s;
  }

  function trimHr(series) {
    const extra = series.values.length - HR_KEEP;
    if (extra > 0) {
      series.values.splice(0, extra);
      series.start += extra * U.MIN;
    }
  }

  // Fill heart-rate minutes missed while the app was closed, using the typical-day model.
  function backfill() {
    const now = Date.now();
    state.pets.forEach((pet) => {
      const series = state.hr[pet.id];
      if (!series || !series.values.length) return;
      const lastTs = series.start + (series.values.length - 1) * U.MIN;
      const missing = Math.floor((now - lastTs) / U.MIN) - 1;
      if (missing <= 0) return;
      if (missing >= HR_KEEP) {
        state.hr[pet.id] = Paw.sim.buildHistory(pet, now - U.MIN, HR_KEEP).hr;
        return;
      }
      const h = Paw.sim.buildHistory(pet, now - U.MIN, missing);
      series.values.push.apply(series.values, h.hr.values);
      trimHr(series);
    });
  }

  function init() {
    const loaded = load();
    if (loaded) {
      state = normalize(loaded);
      backfill();
    } else {
      seed();
      persist();
    }
    storageOk = U.storage.set('petlink.probe', '1');
    U.storage.remove('petlink.probe');
  }

  // ---- actions --------------------------------------------------------------------
  function setSetting(key, value) {
    if (state.settings[key] === value) return;
    state.settings[key] = value;
    persist();
    emit('settings', { key, value });
  }

  function selectPet(id) {
    if (!getPet(id) || state.selectedPetId === id) return;
    state.selectedPetId = id;
    persist();
    emit('select', { id });
  }

  function addPet(data) {
    const slot = freeSlot();
    if (!slot) return null;
    const pet = makePet(data, slot);
    state.pets.push(pet);
    state.stats[pet.id] = Paw.sim.emptyStats(U.dayKey());
    state.hr[pet.id] = { start: Math.floor(Date.now() / U.MIN) * U.MIN, values: [] };
    state.selectedPetId = pet.id;
    persist();
    emit('pets', { added: pet.id });
    return pet;
  }

  function updatePet(id, patch) {
    const pet = getPet(id);
    if (!pet) return;
    fixCoat(Object.assign(pet, sanitizePet(patch)));
    if (patch.translator) Object.assign(pet.translator, patch.translator);
    persist();
    emit('pets', { updated: id });
  }

  function removePet(id) {
    if (!getPet(id)) return;
    state.pets = state.pets.filter((p) => p.id !== id);
    delete state.hr[id];
    delete state.stats[id];
    state.logs = state.logs.filter((l) => l.petId !== id);
    if (state.selectedPetId === id) state.selectedPetId = state.pets[0] ? state.pets[0].id : null;
    persist();
    emit('pets', { removed: id });
  }

  function setTranslator(id, patch) {
    const pet = getPet(id);
    if (!pet) return;
    Object.assign(pet.translator, patch);
    persist();
    emit('translator', { id, patch });
  }

  function setBattery(id, value) {
    const pet = getPet(id);
    if (!pet) return;
    pet.device.battery = U.clamp(value, 1, 100);
    persist();
    emit('device', { id });
  }

  function addLog(entry) {
    const e = Object.assign({ id: U.uid('log') }, entry);
    const logs = state.logs;
    let i = 0;
    while (i < logs.length && logs[i].ts > e.ts) i++;
    logs.splice(i, 0, e);
    if (logs.length > C.MAX_LOGS) logs.length = C.MAX_LOGS;
    persist();
    emit('logs', { added: e });
    return e;
  }

  function removeLogs(predicate) {
    const before = state.logs.length;
    state.logs = state.logs.filter((l) => !predicate(l));
    if (state.logs.length !== before) {
      persist();
      emit('logs', { removed: before - state.logs.length });
    }
  }

  function pushHr(petId, ts, bpm) {
    let series = state.hr[petId];
    if (!series) series = state.hr[petId] = { start: ts, values: [] };
    if (!series.values.length) series.start = ts;
    const idx = Math.round((ts - series.start) / U.MIN);
    if (idx < 0) return;
    if (idx < series.values.length) {
      series.values[idx] = bpm;
    } else {
      const fill = series.values.length ? series.values[series.values.length - 1] : bpm;
      while (series.values.length < idx) series.values.push(fill);
      series.values.push(bpm);
    }
    trimHr(series);
    persist(true);
  }

  function statsFor(petId) {
    const day = U.dayKey();
    let st = state.stats[petId];
    if (!st || st.day !== day) st = state.stats[petId] = Paw.sim.emptyStats(day);
    return st;
  }
  function addStats(petId, activity, sec, meters) {
    const pet = getPet(petId);
    if (pet) Paw.sim.addStats(statsFor(petId), pet, activity, sec, meters);
  }

  function resetAll() {
    const keep = state ? { theme: state.settings.theme, motion: state.settings.motion, units: state.settings.units } : {};
    U.storage.remove(C.STORAGE_KEY);
    seed(keep);
    flush();
    emit('reset');
  }

  function exportJSON() {
    return JSON.stringify({
      app: C.APP_NAME,
      exportedAt: new Date().toISOString(),
      note: 'Simulated demo data. Locations, health readings and translations are not real.',
      pets: state.pets.map((p) => ({
        name: p.name, species: p.species, breed: p.breed, size: p.size, age: p.age, coat: p.coat,
        collar: p.device.id, translator: p.translator,
      })),
      logs: state.logs.map((l) => Object.assign({}, l, { pet: (getPet(l.petId) || {}).name, time: new Date(l.ts).toISOString() })),
      settings: state.settings,
    }, null, 2);
  }

  Paw.store = {
    init, subscribe, flush,
    get state() { return state; },
    get storageOk() { return storageOk; },
    getPet, selectedPet, setSetting, selectPet, addPet, updatePet, removePet,
    setTranslator, setBattery, addLog, removeLogs, pushHr, statsFor, addStats,
    touch: () => persist(true), resetAll, exportJSON,
  };
})();
