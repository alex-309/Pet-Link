/* Speaks translations aloud with the browser's built-in speech synthesis, standing
   in for the collar's physical voice box. Sounds (chime, collar ping) are generated
   with the Web Audio API, so there are no audio files to license. */
(function () {
  'use strict';
  const Paw = (window.Paw = window.Paw || {});
  const U = Paw.util;

  const synth = window.speechSynthesis;
  const supported = !!synth && typeof window.SpeechSynthesisUtterance === 'function';
  const listeners = new Set();
  const queue = [];
  let voices = [];
  let current = null;
  let unlocked = false;
  let audio = null;

  function emit(type, item) {
    listeners.forEach((fn) => {
      try { fn(type, item); } catch (err) { console.error(err); }
    });
  }

  function loadVoices() {
    voices = supported ? synth.getVoices() : [];
    emit('voices');
  }

  // Prefer a voice installed on the device (no network) that matches the language.
  function voiceFor(lang) {
    if (!voices.length) return null;
    const want = lang.toLowerCase();
    const base = want.split('-')[0];
    const norm = (v) => v.lang.replace('_', '-').toLowerCase();
    const exact = voices.filter((v) => norm(v) === want);
    const pool = exact.length ? exact : voices.filter((v) => norm(v).split('-')[0] === base);
    return pool.find((v) => v.localService) || pool[0] || null;
  }

  function ensureAudio() {
    if (!audio) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      try { audio = new AC(); } catch (e) { return null; }
    }
    if (audio.state === 'suspended') audio.resume().catch(() => {});
    return audio;
  }

  // Browsers only allow sound after the person interacts with the page.
  function unlock() {
    if (unlocked) return;
    unlocked = true;
    ensureAudio();
    if (supported) {
      try {
        const u = new SpeechSynthesisUtterance(' ');
        u.volume = 0;
        synth.speak(u);
      } catch (e) { /* ignore */ }
    }
  }

  function init() {
    if (supported) {
      loadVoices();
      if (typeof synth.addEventListener === 'function') synth.addEventListener('voiceschanged', loadVoices);
      else synth.onvoiceschanged = loadVoices;
    }
    window.addEventListener('pointerdown', unlock, { capture: true });
    window.addEventListener('keydown', unlock, { capture: true });
  }

  function next() {
    const item = queue.shift();
    if (!item) {
      current = null;
      emit('idle');
      return;
    }
    current = item;
    const u = new SpeechSynthesisUtterance(item.text);
    u.lang = item.lang;
    const v = voiceFor(item.lang);
    if (v) u.voice = v;
    u.volume = U.clamp(item.volume, 0, 1);
    u.pitch = U.clamp(item.pitch || 1, 0, 2);
    u.rate = U.clamp(item.rate || 1, 0.5, 1.6);
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      clearTimeout(guard);
      emit('end', item);
      current = null;
      setTimeout(next, 250);
    };
    u.onstart = () => emit('start', item);
    u.onend = finish;
    u.onerror = finish;
    // Some browsers never fire "end"; don't let the queue get stuck.
    const guard = setTimeout(finish, 3000 + item.text.length * 140 / (u.rate || 1));
    try {
      synth.speak(u);
      emit('queued', item);
    } catch (e) {
      finish();
    }
  }

  // item: { text, lang, volume (0–1), pitch, rate, petId }
  function speak(item) {
    if (!supported || !item.text || item.volume <= 0) return false;
    while (queue.length >= 2) queue.shift(); // keep the queue short and current
    queue.push(item);
    if (!current) next();
    return true;
  }

  function stop() {
    queue.length = 0;
    if (supported) {
      try { synth.cancel(); } catch (e) { /* ignore */ }
    }
    if (current) {
      const item = current;
      current = null;
      emit('end', item);
    }
    emit('idle');
  }

  function tone(ctx, freq, start, dur, gain, type) {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type || 'sine';
    osc.frequency.value = freq;
    const t0 = ctx.currentTime + start;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), t0 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  // Soft two-note chime before a translation. volume: 0–1
  function chime(volume) {
    const ctx = unlocked && ensureAudio();
    if (!ctx || volume <= 0) return;
    tone(ctx, 784, 0, 0.18, 0.12 * volume);
    tone(ctx, 1175, 0.11, 0.26, 0.1 * volume);
  }

  // Three bright beeps from the collar ("Ping collar" on the map).
  function ping(volume) {
    const ctx = ensureAudio();
    if (!ctx || volume <= 0) return;
    [0, 0.28, 0.56].forEach((t) => tone(ctx, 1568, t, 0.16, 0.16 * volume, 'triangle'));
  }

  Paw.voice = {
    init, speak, stop, chime, ping, voiceFor, unlock,
    get supported() { return supported; },
    get voiceCount() { return voices.length; },
    get current() { return current; },
    on: (fn) => { listeners.add(fn); return () => listeners.delete(fn); },
  };
})();
