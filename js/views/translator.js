/* Translator: talk to the selected pet (your words play as its own sounds) and hear it
   answer, listen in on what it's thinking, and control every pet's voice box. Everything
   here is invented for fun. */
(function () {
  'use strict';
  const Paw = (window.Paw = window.Paw || {});
  const C = Paw.config;
  const U = Paw.util;
  const ui = () => Paw.ui;
  let typeTimer = null;
  let previewTimer = null;
  let typing = false; // "Type instead" chosen for this visit
  let live = null; // what the microphone is hearing right now: { petId, text }
  const drafts = []; // things the owner said that are still waiting for an answer: { petId, text, sounds, ts }
  const listeningFor = new Set(); // pets we're "listening in" on

  // ---- voices -----------------------------------------------------------------------
  function platform() {
    const ua = navigator.userAgent || '';
    const p = (navigator.userAgentData && navigator.userAgentData.platform) || navigator.platform || '';
    if (/iPhone|iPad|iPod/.test(ua) || (/Mac/.test(p) && navigator.maxTouchPoints > 1)) return 'ios';
    if (/Android/.test(ua)) return 'android';
    if (/CrOS/.test(ua)) return 'chromeos';
    if (/Mac/.test(p) || /Mac OS/.test(ua)) return 'mac';
    if (/Win/.test(p) || /Windows/.test(ua)) return 'windows';
    return 'other';
  }
  const HELP = {
    mac: 'Open System Settings, then Accessibility, then Spoken Content (called Read & Speak on newer macOS). Next to System voice, choose Manage Voices and add a {lang} voice.',
    ios: 'Open Settings, then Accessibility, then Spoken Content, then Voices. Choose {lang} and download a voice.',
    windows: 'Open Settings, then Time & language, then Speech. Under Manage voices, choose Add voices and pick {lang}.',
    android: 'Open Settings, then System, then Languages & input, then Text-to-speech output. Under the preferred engine, install the {lang} voice data.',
    chromeos: 'Open Settings, then Accessibility, then Text-to-speech, then Speech engines, and add a {lang} voice.',
    other: "Add a {lang} text-to-speech voice in your device's accessibility or speech settings.",
  };

  function voiceInfo(pet) {
    const L = ui().language(pet.translator.lang);
    if (!Paw.voice.supported) return { kind: 'none', text: 'This browser can’t speak out loud, so translations appear as text only.' };
    if (!Paw.voice.ready) return { kind: 'loading', text: 'Looking for voices on this device…' };
    if (!Paw.voice.voiceCount) return { kind: 'none', text: 'This browser didn’t provide any voices, so translations appear as text only.' };
    const chosenName = pet.translator.voiceName;
    const chosen = chosenName && Paw.voice.voicesFor(pet.translator.lang).find((x) => x.name === chosenName);
    const v = Paw.voice.voiceFor(pet.translator.lang, chosenName);
    if (v) {
      const swap = chosen && Paw.voice.isBroken(chosen) ? `${chosen.name} didn’t make a sound on this device, so ${pet.name} uses ${v.name} instead. ` : '';
      return { kind: swap ? 'missing' : 'ok', text: swap + `Speaks with ${v.name}${v.localService === false ? ', an online voice from your browser.' : ', a voice on this device.'}` };
    }
    const alt = Paw.voice.fallbackLang(L.short);
    const altName = alt ? ui().language(alt).english : null;
    return {
      kind: 'missing',
      text: `This device has no working ${L.english} voice${altName ? `, so ${pet.name} says the same thing in ${altName} out loud for now` : ''}. The text still appears in ${L.english}.`,
    };
  }
  function voiceHelp(pet) {
    const L = ui().language(pet.translator.lang);
    return `<details class="voice-help"><summary>How to add a ${U.esc(L.english)} voice</summary>
      <p>${U.esc(HELP[platform()].replace('{lang}', L.english))}</p>
      <p>Some browsers, like Chrome, also offer online voices when you’re connected to the internet. Reload this page after adding a voice.</p>
    </details>`;
  }
  function voiceOptions(pet) {
    const list = Paw.voice.voicesFor(pet.translator.lang);
    const chosen = pet.translator.voiceName || '';
    const auto = Paw.voice.voiceFor(pet.translator.lang);
    if (!list.length) return `<option value="">${Paw.voice.ready ? 'No voices for this language' : 'Looking for voices…'}</option>`;
    const where = (v) => (Paw.voice.isBroken(v) ? 'doesn’t work on this device' : v.localService === false ? 'online' : 'on this device');
    return `<option value=""${chosen ? '' : ' selected'}>Automatic${auto ? ` (${U.esc(auto.name)})` : ''}</option>` +
      list.map((v) => `<option value="${U.esc(v.name)}"${v.name === chosen ? ' selected' : ''}>${U.esc(v.name)} · ${where(v)}</option>`).join('');
  }
  function updateVoiceUI(root, pet) {
    const select = root.querySelector('#vb-voice-name');
    if (!select) return;
    select.innerHTML = voiceOptions(pet);
    select.disabled = !Paw.voice.voicesFor(pet.translator.lang).length;
    const info = voiceInfo(pet);
    const hint = root.querySelector('#vb-voice-hint');
    hint.textContent = info.text;
    hint.classList.toggle('field__hint--warn', info.kind === 'missing');
    root.querySelector('#vb-voice-help').innerHTML = info.kind === 'missing' && !Paw.voice.voiceFor(pet.translator.lang) ? voiceHelp(pet) : '';
  }

  // ---- conversation -------------------------------------------------------------------
  const sound = (s) => U.esc(s || '').replace(/\*([^*]+)\*/g, '<em>$1</em>');

  function petMessage(l, pet) {
    const u = ui();
    const lid = U.esc(l.id || '');
    return `<li class="msg msg--pet" data-msg="${lid}">
        ${u.avatar(pet, 'sm')}
        <div class="msg__body">
          <div class="msg__bubble">
            <div class="msg__top">
              <p class="msg__heard"><span class="bubble__label">Heard</span>${sound(l.sound)}</p>
              ${l.id ? `<button type="button" class="icon-btn icon-btn--sm" id="play-${lid}" data-action="replay-log" data-log="${lid}" aria-label="Play this" title="Play">${u.icon('play')}</button>` : ''}
            </div>
            <p class="msg__text" lang="${U.esc(l.lang)}">${U.esc(l.text)}</p>
          </div>
          <p class="msg__meta">${u.moodChip(l.mood)}<span>${U.esc(u.language(l.lang).label)}</span><time datetime="${new Date(l.ts).toISOString()}">${U.esc(U.fmtTime(l.ts))}</time></p>
        </div>
      </li>`;
  }
  // What you said, and underneath it the same thing in your pet's sounds.
  function myMessage(text, ts, sounds, pet) {
    const kind = Paw.petSounds.label(pet.species);
    return `<li class="msg msg--me">
        <div class="msg__body">
          <div class="msg__bubble"><p class="msg__text">${U.esc(text)}</p></div>
          ${sounds ? `<div class="petsay">
            <p class="petsay__line"><span class="bubble__label">In ${kind}</span><span class="petsay__text">${U.esc(sounds)}</span></p>
            <button type="button" class="icon-btn icon-btn--sm" data-action="play-sounds" data-pet="${U.esc(pet.id)}" data-text="${U.esc(text)}" aria-label="Play it in ${kind}" title="Play it in ${kind}">${ui().icon('play')}</button>
          </div>` : ''}
          <p class="msg__meta"><span>You</span><time datetime="${new Date(ts).toISOString()}">${U.esc(U.fmtTime(ts))}</time></p>
        </div>
      </li>`;
  }
  function liveMessage(text) {
    return `<li class="msg msg--me msg--live" id="live-msg">
        <div class="msg__body">
          <div class="msg__bubble"><p class="msg__text" id="live-text">${text ? U.esc(text) : 'Listening…'}</p></div>
          <p class="msg__meta"><span class="rec-dot" aria-hidden="true"></span><span>Listening</span></p>
        </div>
      </li>`;
  }
  function typingRow(pet, listening) {
    return `<li class="msg msg--pet msg--typing">
        ${ui().avatar(pet, 'sm')}
        <div class="msg__body"><div class="msg__bubble">
          <span class="dots" aria-hidden="true"><i></i><i></i><i></i></span>
          <span class="msg__typing-text">${listening ? 'Listening in…' : U.esc(pet.name) + ' is answering…'}</span>
        </div></div>
      </li>`;
  }
  function threadHTML(pet) {
    const said = Paw.store.state.logs.filter((l) => l.petId === pet.id && l.kind === 'thought').slice(0, 12).reverse();
    const waiting = drafts.filter((d) => d.petId === pet.id);
    let html = '';
    said.forEach((l) => {
      if (l.prompt) html += myMessage(l.prompt, l.ts - 1, l.promptSounds || Paw.petSounds.translate(pet, l.prompt).text, pet);
      html += petMessage(l, pet);
    });
    waiting.forEach((d) => { html += myMessage(d.text, d.ts, d.sounds, pet); });
    if (live && live.petId === pet.id) html += liveMessage(live.text);
    if (waiting.length || listeningFor.has(pet.id)) html += typingRow(pet, !waiting.length);
    if (!html) html = `<li class="thread__empty">Say hi to ${U.esc(pet.name)}! Tap the microphone and talk, or pick a phrase below.</li>`;
    return html;
  }
  function scrollThread(thread, instant) {
    if (thread) thread.scrollTo({ top: thread.scrollHeight, behavior: instant || U.reducedMotion() ? 'auto' : 'smooth' });
  }
  function renderThread(root, pet, fresh) {
    const thread = root.querySelector('#thread');
    if (!thread) return;
    thread.innerHTML = threadHTML(pet);
    if (fresh) {
      const last = Array.from(thread.querySelectorAll('.msg--pet:not(.msg--typing)')).pop();
      if (last) {
        last.classList.add('is-new');
        typeOut(last.querySelector('.msg__text'));
      }
    }
    scrollThread(thread);
  }

  // Reveal a new reply a few letters at a time (instant when motion is reduced). The text keeps
  // its final size while it types, so the thread scrolls to the right place straight away.
  function typeOut(el) {
    clearInterval(typeTimer);
    if (!el || U.reducedMotion()) return;
    const chars = Array.from(el.textContent);
    const step = Math.max(1, Math.round(chars.length / 40));
    let i = 0;
    el.style.minWidth = el.offsetWidth + 'px';
    el.style.minHeight = el.offsetHeight + 'px';
    el.textContent = '';
    typeTimer = setInterval(() => {
      i = Math.min(chars.length, i + step);
      el.textContent = chars.slice(0, i).join('');
      if (i < chars.length) return;
      clearInterval(typeTimer);
      el.style.minWidth = el.style.minHeight = '';
    }, 28);
  }

  // You say something: it plays as the pet's own sounds, then the pet answers.
  async function send(root, petId, text) {
    const pet = Paw.store.getPet(petId);
    const said = String(text || '').trim().slice(0, 140);
    if (!pet || !said) return;
    if (!pet.translator.on) {
      ui().toast(`${ui().possessive(pet.name)} translator is off. Turn it on to talk.`, { icon: 'info' });
      return;
    }
    Paw.voice.unlock();
    const tr = Paw.petSounds.translate(pet, said);
    const draft = { petId, text: said, sounds: tr.text, ts: Date.now() };
    drafts.push(draft);
    renderThread(root, pet, false);
    if (Paw.store.state.settings.announce) ui().announce(`In ${tr.label}: ${tr.text}`);
    const seconds = await Paw.app.petSay(petId, tr);
    const think = U.reducedMotion() ? 300 : 700 + Math.min(800, said.length * 10);
    setTimeout(() => {
      const p = Paw.store.getPet(petId);
      if (p && p.translator.on) {
        Paw.sim.respond(petId, said, tr.text);
      } else if (drafts.indexOf(draft) !== -1) {
        drafts.splice(drafts.indexOf(draft), 1); // translator switched off before the answer
      }
    }, seconds * 1000 + think);
  }

  const talkLang = () => {
    const s = Paw.store.state.settings.talkLang;
    return s && s !== 'auto' ? s : navigator.language || 'en-US';
  };
  const MIC_ERRORS = {
    'not-allowed': 'Microphone access is blocked. Allow it in your browser’s site settings, or type your message instead.',
    'service-not-allowed': 'Microphone access is blocked. Allow it in your browser’s site settings, or type your message instead.',
    'no-speech': 'I didn’t catch that. Tap the microphone and try again, or pick a phrase.',
    'audio-capture': 'No microphone was found. You can type your message instead.',
    network: 'Speech recognition needs an internet connection in this browser. You can type instead.',
  };

  function setMicState(root, on) {
    const btn = root.querySelector('#mic-btn');
    if (!btn) return;
    btn.classList.toggle('is-listening', on);
    const label = btn.querySelector('#mic-label');
    if (label) label.textContent = on ? 'Listening… tap to stop' : 'Tap to talk';
    else {
      btn.setAttribute('aria-label', on ? 'Stop listening' : 'Talk with your voice');
      btn.title = on ? 'Stop listening' : 'Talk with your voice';
    }
  }

  async function toggleMic(root) {
    if (Paw.voice.listening) {
      Paw.voice.stopListening();
      return;
    }
    const pet = Paw.store.selectedPet();
    if (!pet || !pet.translator.on) return;
    if (!Paw.store.state.settings.micConsent) {
      const ok = await ui().confirm({
        title: 'Talk with your voice?',
        body: 'Pet-Link turns what you say into text with your browser’s speech recognition, then plays it to your pet as pet sounds. Your browser may send the audio to its maker, such as Google or Apple, to do that. Pet-Link doesn’t record or keep your voice.',
        confirmLabel: 'Use the microphone',
      });
      if (!ok) return;
      Paw.store.setSetting('micConsent', true);
    }
    const done = () => {
      setMicState(root, false);
      const had = live;
      live = null;
      return had;
    };
    live = { petId: pet.id, text: '' };
    renderThread(root, pet, false);
    setMicState(root, true);
    ui().announce(`Listening. Say something to ${pet.name}.`);
    const started = Paw.voice.listen({
      lang: talkLang(),
      onInterim: (text) => {
        if (!live) return;
        live.text = text;
        const el = root.querySelector('#live-text');
        if (el) el.textContent = text || 'Listening…';
        scrollThread(root.querySelector('#thread'), true);
      },
      onError: (code) => {
        if (code !== 'aborted') ui().toast(MIC_ERRORS[code] || 'The microphone isn’t available right now. You can type instead.', { icon: 'info' });
      },
      onEnd: (finalText) => {
        done();
        if (finalText) send(root, pet.id, finalText);
        else renderThread(root, pet, false);
      },
    });
    if (!started) {
      done();
      renderThread(root, pet, false);
    }
  }

  function composerHTML(pet) {
    const u = ui();
    const pid = U.esc(pet.id);
    const name = U.esc(pet.name);
    const kind = Paw.petSounds.label(pet.species);
    const canMic = Paw.voice.canListen;
    const textMode = !canMic || typing;
    const chips = `<div class="quick" role="group" aria-label="Quick phrases">
        ${Paw.talk.QUICK.map((q, i) => `<button type="button" class="quick__chip" id="quick-${i}" data-action="talk-quick" data-text="${U.esc(q)}">${U.esc(q)}</button>`).join('')}
      </div>`;
    const talkRow = textMode ? '' : `<div class="talk">
        <button type="button" class="talk__mic" id="mic-btn" data-action="talk-mic" aria-describedby="talk-hint">${u.icon('mic')}<span id="mic-label">Tap to talk</span></button>
        <button type="button" class="icon-btn talk__alt" id="type-btn" data-action="talk-type" aria-label="Type instead" title="Type instead">${u.icon('keyboard')}</button>
      </div>`;
    const form = `<form class="composer" id="composer" data-pet="${pid}" autocomplete="off"${textMode ? '' : ' hidden'}>
        <label class="visually-hidden" for="composer-input">Say something to ${name}</label>
        <input class="input composer__input" id="composer-input" type="text" maxlength="140" placeholder="Say something…" enterkeyhint="send" aria-describedby="talk-hint">
        ${textMode && canMic ? `<button type="button" class="icon-btn composer__mic" id="mic-btn" data-action="talk-mic" aria-label="Talk with your voice" title="Talk with your voice">${u.icon('mic')}</button>` : ''}
        <button type="submit" class="btn btn-primary composer__send" id="send-btn">${u.icon('send')}<span>Send</span></button>
      </form>`;
    const hint = canMic
      ? `Say something and ${name} hears it in ${kind}, then answers.`
      : `Voice input isn’t available here, so type what you’d say. ${name} hears it in ${kind}, then answers.`;
    return `${chips}${talkRow}${form}<p class="talk__hint" id="talk-hint">${hint}</p>`;
  }

  function levels(volume) {
    const lit = Math.ceil(volume / 20);
    return [0, 1, 2, 3, 4].map((i) => `<i${i < lit ? ' class="on"' : ''}></i>`).join('');
  }

  Paw.views = Paw.views || {};
  Paw.views.translator = {
    title: 'Translator',
    render() {
      const pet = Paw.store.selectedPet();
      if (!pet) return Paw.views.noPets('Translator');
      const u = ui();
      const t = pet.translator;
      const pid = U.esc(pet.id);
      const name = U.esc(pet.name);
      const poss = U.esc(u.possessive(pet.name));
      const info = voiceInfo(pet);
      const composer = t.on
        ? composerHTML(pet)
        : `<div class="convo__off">
              <p>${poss} translator is off, so you can’t talk and ${name} can’t answer.</p>
              <button type="button" class="btn btn-primary" id="turn-on-btn" data-action="toggle-translator" data-pet="${pid}">${u.icon('power')}Turn translator on</button>
            </div>`;
      return `<header class="view-head">
          <div class="view-head__text">
            <p class="eyebrow">${u.icon('chat')}Translator</p>
            <h1 class="view-title" tabindex="-1">${poss} translator</h1>
          </div>
        </header>
        <div class="tr-layout" style="--pet:${u.petColor(pet)}">
          <div class="tr-col">
            <section class="card convo${t.on ? '' : ' is-off'}" id="convo" data-speaking="${pid}" aria-labelledby="convo-title">
              <div class="convo__head">
                ${u.avatar(pet, 'lg')}
                <div class="convo__who">
                  <h2 class="card-title" id="convo-title">Talk with ${name}</h2>
                  <p class="convo__status">${t.on ? u.status('good', 'Listening') : u.status('warning', 'Translator off')}<span class="waves" aria-hidden="true"><span></span><span></span><span></span><span></span><span></span></span></p>
                </div>
                <div class="convo__tools">
                  <button type="button" class="btn btn-secondary btn-sm" id="listen-btn" data-action="listen-now" data-pet="${pid}"${t.on ? '' : ' disabled'}>${u.icon('ear')}Listen in</button>
                  <button type="button" class="icon-btn" id="stop-btn" data-action="stop-voice" aria-label="Stop the voice box" title="Stop the voice box">${u.icon('stop')}</button>
                </div>
              </div>
              <ol class="thread" id="thread" aria-label="Conversation with ${name}">${threadHTML(pet)}</ol>
              ${composer}
              <p class="convo__note">Pet sounds and replies are made up for fun. Keep the volume gentle around real pets.${Paw.voice.canListen && t.on ? ' The microphone uses your browser’s speech recognition.' : ''}</p>
            </section>
          </div>

          <div class="tr-col">
            <section class="card voicebox" aria-labelledby="vb-title">
              <div class="card-head">
                <h2 class="card-title" id="vb-title">Voice box</h2>
                ${u.live('battery', pet)}
              </div>
              <p class="card-text">The speaker on ${poss} collar. It plays your words to ${name} in ${U.esc(Paw.petSounds.label(pet.species).toLowerCase())} sounds and says ${U.esc(u.possessive(pet.name))} answers out loud. In this demo it plays through your device.</p>
              <div class="device${t.on ? ' is-on' : ''}" data-speaking="${pid}" aria-hidden="true">
                <div class="device__body"><span class="device__grille"></span><span class="device__led"></span></div>
                <div class="device__levels" id="vb-levels">${levels(t.volume)}</div>
              </div>
              <div class="vb-row">
                ${u.switchButton({ id: 'vb-power', on: t.on, label: 'Power', srPrefix: u.possessive(pet.name) + ' voice box', action: 'toggle-translator', petId: pet.id })}
                <span class="vb-state">${t.on ? 'On' : 'Off'}</span>
              </div>
              <div class="field">
                <label class="field__label" for="vb-volume">Volume</label>
                <div class="range-row">
                  <button type="button" class="icon-btn" id="vb-mute" data-action="toggle-mute" data-pet="${pid}" aria-label="${t.volume ? 'Mute' : 'Unmute'}" title="${t.volume ? 'Mute' : 'Unmute'}">${u.icon(t.volume ? 'volume' : 'volume-off')}</button>
                  <input type="range" id="vb-volume" min="0" max="100" step="5" value="${t.volume}" data-input="vb-volume" data-pet="${pid}" aria-valuetext="${t.volume}%" style="--val:${t.volume}%">
                  <output id="vb-volume-out" for="vb-volume">${t.volume}%</output>
                </div>
              </div>
              <div class="field">
                <label class="field__label" for="vb-lang">Language</label>
                <div class="select"><select class="input" id="vb-lang" data-change="vb-lang" data-pet="${pid}">${u.languageOptions(t.lang)}</select>${u.icon('chevron-down', 'select__icon')}</div>
              </div>
              <div class="field">
                <label class="field__label" for="vb-voice-name">Voice</label>
                <div class="select"><select class="input" id="vb-voice-name" data-change="vb-voice-name" data-pet="${pid}" aria-describedby="vb-voice-hint"${Paw.voice.voicesFor(t.lang).length ? '' : ' disabled'}>${voiceOptions(pet)}</select>${u.icon('chevron-down', 'select__icon')}</div>
                <p class="field__hint${info.kind === 'missing' ? ' field__hint--warn' : ''}" id="vb-voice-hint">${U.esc(info.text)}</p>
                <div id="vb-voice-help">${info.kind === 'missing' && !Paw.voice.voiceFor(t.lang) ? voiceHelp(pet) : ''}</div>
              </div>
              <fieldset class="field" data-change="vb-voice" data-pet="${pid}">
                <legend class="field__label">Voice style</legend>
                <div class="segmented segmented--wide">
                  ${Object.entries(C.VOICE_STYLES).map(([k, v]) => `<label><input type="radio" name="vb-voice" value="${k}"${t.voice === k ? ' checked' : ''}><span>${v.label}</span></label>`).join('')}
                </div>
              </fieldset>
              <button type="button" class="btn btn-secondary btn-block" id="test-btn" data-action="test-speaker" data-pet="${pid}">${u.icon('volume')}Test speaker</button>
            </section>

            <section class="card tr-all" aria-labelledby="all-tr-title">
              <h2 class="card-title" id="all-tr-title">Every pet’s voice box</h2>
              <ul class="pack-controls">${Paw.store.state.pets.map((p) => `
                <li class="pack-controls__item" style="--pet:${u.petColor(p)}">
                  ${u.avatar(p, 'sm')}
                  <span class="pack-controls__text"><span class="pack-controls__name">${U.esc(p.name)}</span><span class="pack-controls__sub" data-tr-sub="${U.esc(p.id)}">${U.esc(u.language(p.translator.lang).label)} · ${p.translator.volume}%</span></span>
                  ${u.switchButton({ id: `all-tr-${p.id}`, on: p.translator.on, label: 'Translator', srPrefix: u.possessive(p.name), action: 'toggle-translator', petId: p.id })}
                </li>`).join('')}</ul>
            </section>
          </div>
        </div>
        <p class="disclaimer">${u.icon('info')}<span>Pet sounds, translations and replies are invented for entertainment. They don’t describe what animals actually think or feel.</span></p>`;
    },
    mount(root) {
      const form = root.querySelector('#composer');
      if (form) {
        form.addEventListener('submit', (e) => {
          e.preventDefault();
          const input = form.querySelector('#composer-input');
          send(root, form.dataset.pet, input.value);
          input.value = '';
        });
      }
      scrollThread(root.querySelector('#thread'), true);
    },
    unmount() {
      clearInterval(typeTimer);
      clearTimeout(previewTimer);
      live = null;
      Paw.voice.stopListening();
    },
    on(type, d, root) {
      const pet = Paw.store.selectedPet();
      if (!pet) return;
      if (type === 'thought' && d.petId === pet.id) {
        if (d.prompt) {
          const i = drafts.findIndex((x) => x.petId === d.petId && x.text === d.prompt);
          if (i !== -1) drafts.splice(i, 1);
        }
        listeningFor.delete(d.petId);
        // The log entry is written just before this event, so the thread can be rebuilt from it.
        renderThread(root, pet, true);
      } else if (type === 'thought' && d.prompt) {
        const i = drafts.findIndex((x) => x.petId === d.petId && x.text === d.prompt);
        if (i !== -1) drafts.splice(i, 1);
      } else if (type === 'translator') {
        const p = Paw.store.getPet(d.id);
        const sub = p && root.querySelector(`[data-tr-sub="${CSS.escape(d.id)}"]`);
        if (sub) sub.textContent = `${ui().language(p.translator.lang).label} · ${p.translator.volume}%`;
        if (d.id === pet.id && 'voiceName' in d.patch) updateVoiceUI(root, pet);
      } else if (type === 'voices') {
        updateVoiceUI(root, pet);
      }
    },
    actions: {
      'listen-now': (el, e, root) => {
        const pet = Paw.store.getPet(el.dataset.pet);
        if (!pet || !pet.translator.on || listeningFor.has(pet.id)) return;
        Paw.voice.unlock();
        listeningFor.add(pet.id);
        renderThread(root, pet, false);
        setTimeout(() => Paw.sim.think(pet.id, { manual: true }), U.reducedMotion() ? 300 : 1300);
      },
      'talk-quick': (el, e, root) => {
        const pet = Paw.store.selectedPet();
        if (pet) send(root, pet.id, el.dataset.text);
      },
      'talk-mic': (el, e, root) => { toggleMic(root); },
      'talk-type': (el, e, root) => {
        typing = true;
        Paw.app.refreshView();
        const input = root.querySelector('#composer-input');
        if (input) input.focus();
      },
    },
    inputs: {
      'vb-volume': (el, e, root) => {
        const volume = Number(el.value);
        Paw.store.setTranslator(el.dataset.pet, { volume });
        el.setAttribute('aria-valuetext', volume + '%');
        el.style.setProperty('--val', volume + '%');
        root.querySelector('#vb-volume-out').textContent = volume + '%';
        root.querySelector('#vb-levels').innerHTML = levels(volume);
        const mute = root.querySelector('#vb-mute');
        mute.setAttribute('aria-label', volume ? 'Mute' : 'Unmute');
        mute.title = volume ? 'Mute' : 'Unmute';
        mute.innerHTML = ui().icon(volume ? 'volume' : 'volume-off');
      },
    },
    changes: {
      'vb-lang': (el) => {
        const id = el.dataset.pet;
        const lang = el.value;
        const r = Paw.sim.runtime(id);
        if (r && r.lastThought) r.lastThought = Paw.sim.retranslate(r.lastThought, lang) || r.lastThought;
        Paw.store.setTranslator(id, { lang, voiceName: '' });
        const L = ui().language(lang);
        Paw.store.addLog({ kind: 'activity', type: 'device', petId: id, ts: Date.now(), title: 'Translator language changed', detail: L.label === L.english ? L.label : `${L.label} (${L.english})`, source: 'app' });
      },
      'vb-voice-name': (el) => {
        const id = el.dataset.pet;
        Paw.store.setTranslator(id, { voiceName: el.value });
        preview(id);
      },
      'vb-voice': (el, e) => {
        Paw.store.setTranslator(el.dataset.pet, { voice: e.target.value });
        preview(el.dataset.pet);
      },
    },
  };

  // Let the person hear a voice or style change right away.
  function preview(petId) {
    clearTimeout(previewTimer);
    previewTimer = setTimeout(() => {
      const pet = Paw.store.getPet(petId);
      if (pet) Paw.app.speakFor(petId, Paw.phrases.speakerTest[Paw.sim.langShort(pet.translator.lang)], { texts: Paw.phrases.speakerTest, requireOn: true });
    }, 450);
  }
})();
