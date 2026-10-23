/* Speaks translations aloud with the browser's built-in speech synthesis, standing
   in for the collar's physical voice box, and listens through the browser's speech
   recognition when you talk to a pet. Sounds (chime, collar ping) are generated with
   the Web Audio API, so there are no audio files to license. */
(function () {
  'use strict';
  const Paw = (window.Paw = window.Paw || {});
  const U = Paw.util;

  const synth = window.speechSynthesis;
  const supported = !!synth && typeof window.SpeechSynthesisUtterance === 'function';
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const listeners = new Set();
  const queue = [];
  let voices = [];
  let ready = !supported; // true once the voice list has loaded (or we stopped waiting)
  let current = null;
  let unlocked = false;
  let audio = null;
  let recognizer = null;

  function emit(type, item) {
    listeners.forEach((fn) => {
      try { fn(type, item); } catch (err) { console.error(err); }
    });
  }

  function loadVoices() {
    voices = supported ? synth.getVoices() : [];
    if (voices.length && !ready) ready = true;
    emit('voices');
  }

  const tag = (v) => String(v.lang || '').replace(/_/g, '-').toLowerCase();
  const keyOf = (v) => v.voiceURI || v.name;

  // Voices the device lists but that turned out not to speak. Skipped for the rest of the visit.
  const broken = new Set();
  // Apple's novelty and old MacinTalk voices (Bells, Zarvox…) are never the automatic choice.
  const NOVELTY = /^(Albert|Bad News|Bahh|Bells|Boing|Bubbles|Cellos|Deranged|Fred|Good News|Hysterical|Jester|Junior|Kathy|Organ|Pipe Organ|Princess|Ralph|Superstar|Trinoids|Whisper|Wobble|Zarvox)$/;
  // Apple's Eloquence voices are named like "Eddy (French (France))". They work but sound robotic,
  // and some of that family (such as "Daniel (French (France))" on some Macs) are listed but silent.
  const ELOQUENCE = /^[^()]+ \([^()]+\([^()]+\)\)$/;

  // Lower is better: natural on-device voices first, then online ones, then robotic ones,
  // preferring the exact region. Broken voices go last.
  function score(v, want) {
    return (broken.has(keyOf(v)) ? 1000 : 0) + (NOVELTY.test(v.name) ? 100 : 0) + (ELOQUENCE.test(v.name) ? 20 : 0) +
      (v.localService === false ? 10 : 0) + (tag(v) === want ? 0 : 5);
  }
  // Every voice for a language, best first.
  function voicesFor(lang) {
    const want = String(lang).toLowerCase();
    const base = want.split('-')[0];
    return voices
      .filter((v) => tag(v).split('-')[0] === base)
      .sort((a, b) => score(a, want) - score(b, want) || a.name.localeCompare(b.name));
  }
  // The voice to use: the chosen one if it works, otherwise the best working one.
  function voiceFor(lang, preferredName) {
    const list = voicesFor(lang).filter((v) => !broken.has(keyOf(v)));
    if (preferredName) {
      const chosen = list.find((v) => v.name === preferredName);
      if (chosen) return chosen;
    }
    return list[0] || null;
  }
  const isBroken = (v) => !!v && broken.has(keyOf(v));
  // When the device has no voice for a language, the app language it can speak instead:
  // the person's own language first, then English, then anything available.
  function fallbackLang(missingShort) {
    const L = Paw.config.LANGUAGES;
    const wanted = [].concat(navigator.languages || [], navigator.language || [], 'en');
    for (const code of wanted) {
      const short = String(code).split('-')[0];
      const match = short !== missingShort && L.find((l) => l.short === short);
      if (match && voicesFor(match.code).length) return match.code;
    }
    const any = L.find((l) => l.short !== missingShort && voicesFor(l.code).length);
    return any ? any.code : null;
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
      // Some browsers never fire "voiceschanged": keep asking for a few seconds.
      let tries = 0;
      const poll = setInterval(() => {
        tries++;
        if (voices.length || tries > 16) {
          clearInterval(poll);
          ready = true;
          emit('voices');
        } else {
          loadVoices();
        }
      }, 250);
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
    const v = voiceFor(item.lang, item.voiceName);
    if (!v && ready && voices.length && voicesFor(item.lang).length) {
      // Every voice for this language failed; let the app pick another language.
      emit('unavailable', item);
      setTimeout(next, 0);
      return;
    }
    current = item;
    const u = new SpeechSynthesisUtterance(item.text);
    u.lang = item.lang;
    if (v) u.voice = v;
    u.volume = U.clamp(item.volume, 0, 1);
    u.pitch = U.clamp(item.pitch || 1, 0, 2);
    u.rate = U.clamp(item.rate || 1, 0.5, 1.6);
    const t0 = Date.now();
    let done = false;
    const finish = (e) => {
      if (done) return;
      done = true;
      clearTimeout(guard);
      if (current !== item) return; // stopped (stop() already reported it)
      current = null;
      // A voice that errors, or "finishes" faster than anyone could say the line, is listed
      // by the device but can't actually speak. Skip it and say the line with the next one.
      const tooFast = e && e.type === 'end' && item.text.length >= 8 && Date.now() - t0 < (item.text.length * 22) / u.rate && !synth.speaking;
      const failed = e && e.type === 'error' && !/interrupted|canceled/.test(e.error || '');
      if (v && (tooFast || failed) && (item.tries || 0) < 3) {
        broken.add(keyOf(v));
        item.tries = (item.tries || 0) + 1;
        emit('voice-failed', { item, voice: v.name });
        queue.unshift(item);
        setTimeout(next, 30);
        return;
      }
      emit('end', item);
      setTimeout(next, 250);
    };
    u.onstart = () => emit('start', item);
    u.onend = finish;
    u.onerror = finish;
    // Some browsers never fire "end"; don't let the queue get stuck.
    const guard = setTimeout(finish, 3000 + item.text.length * 140 / (u.rate || 1));
    try {
      if (synth.paused) synth.resume();
      synth.speak(u);
      emit('queued', item);
    } catch (e) {
      finish();
    }
  }

  // item: { text, lang, voiceName, volume (0–1), pitch, rate, petId }
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
    emit('stop');
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

  // ---- listening ------------------------------------------------------------------
  // Speech recognition is offered where the browser has it. Inside a claude.ai Artifact
  // the microphone isn't available, so it's hidden there.
  const canListen = !!Recognition && !(U.inFrame && window.claude);

  /* o: { lang, onInterim(text), onEnd(finalText), onError(code) } */
  function listen(o) {
    stopListening();
    stop(); // don't let the microphone hear the voice box
    let rec;
    try {
      rec = new Recognition();
    } catch (e) {
      if (o.onError) o.onError('unavailable');
      return false;
    }
    recognizer = rec;
    rec.lang = o.lang || navigator.language || 'en-US';
    rec.interimResults = true;
    rec.continuous = false;
    rec.maxAlternatives = 1;
    let finalText = '';
    rec.onresult = (e) => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i];
        if (res.isFinal) finalText += res[0].transcript;
        else interim += res[0].transcript;
      }
      if (o.onInterim) o.onInterim((finalText + ' ' + interim).trim());
    };
    rec.onerror = (e) => { if (o.onError) o.onError(e.error || 'error'); };
    rec.onend = () => {
      if (recognizer === rec) recognizer = null;
      if (o.onEnd) o.onEnd(finalText.trim());
    };
    try {
      rec.start();
    } catch (e) {
      recognizer = null;
      if (o.onError) o.onError('unavailable');
      return false;
    }
    return true;
  }
  function stopListening() {
    if (recognizer) {
      try { recognizer.stop(); } catch (e) { /* ignore */ }
    }
  }

  Paw.voice = {
    init, speak, stop, chime, ping, voicesFor, voiceFor, isBroken, fallbackLang, unlock, listen, stopListening,
    audio: ensureAudio,
    notify: emit, // lets other sound makers (pet sounds) light up the same "speaking" visuals
    get supported() { return supported; },
    get ready() { return ready; },
    get voiceCount() { return voices.length; },
    get current() { return current; },
    get canListen() { return canListen; },
    get listening() { return !!recognizer; },
    on: (fn) => { listeners.add(fn); return () => listeners.delete(fn); },
  };
})();
