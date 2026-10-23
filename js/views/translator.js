/* Translator: the live "voice box" demo for the selected pet, plus controls for every collar. */
(function () {
  'use strict';
  const Paw = (window.Paw = window.Paw || {});
  const C = Paw.config;
  const U = Paw.util;
  const ui = () => Paw.ui;
  let typeTimer = null;
  let listening = null;
  let previewTimer = null;

  function voiceHint(lang) {
    if (!Paw.voice.supported) return 'This browser can’t speak out loud, so translations appear as text only.';
    if (!Paw.voice.voiceCount) return 'Loading your device’s voices…';
    const v = Paw.voice.voiceFor(lang);
    if (!v) return `No ${ui().language(lang).english} voice is installed on this device, so its default voice will read the translation.`;
    return `Reads with “${v.name}”${v.localService ? ', a voice on this device.' : ', an online voice from your browser.'}`;
  }

  function bubble(pet, fresh) {
    const r = Paw.sim.runtime(pet.id);
    const t = r && r.lastThought;
    if (!pet.translator.on) {
      return `<div class="bubble bubble--muted"><p class="bubble__text">Turn the translator on to hear what ${U.esc(pet.name)} is thinking.</p></div>`;
    }
    if (!t) return '<div class="bubble bubble--muted"><p class="bubble__text">Listening for the first bark…</p></div>';
    return `<div class="bubble${fresh ? ' is-new' : ''}">
        <p class="bubble__heard"><span class="bubble__label">Heard</span>${U.esc(t.sound)}</p>
        <p class="bubble__text" lang="${t.lang}">${U.esc(t.text)}</p>
        <p class="bubble__meta">${ui().moodChip(t.mood)}<span>${U.esc(ui().language(t.lang).label)}</span><span data-ago="${t.ts}">${U.esc(U.fmtAgo(t.ts))}</span></p>
      </div>`;
  }

  function recent(pet) {
    const items = Paw.store.state.logs.filter((l) => l.petId === pet.id && l.kind === 'thought').slice(0, 6);
    if (!items.length) return '<li class="empty-note">No translations yet.</li>';
    return items.map((l) => Paw.logItem(l, { compact: true })).join('');
  }

  function levels(volume) {
    const lit = Math.ceil(volume / 20);
    return [0, 1, 2, 3, 4].map((i) => `<i${i < lit ? ' class="on"' : ''}></i>`).join('');
  }

  // Reveal a new translation a few letters at a time (instant when motion is reduced).
  function typeOut(el) {
    clearInterval(typeTimer);
    if (!el || U.reducedMotion()) return;
    const chars = Array.from(el.textContent);
    const step = Math.max(1, Math.round(chars.length / 40));
    let i = 0;
    el.textContent = '';
    typeTimer = setInterval(() => {
      i = Math.min(chars.length, i + step);
      el.textContent = chars.slice(0, i).join('');
      if (i >= chars.length) clearInterval(typeTimer);
    }, 28);
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
      const poss = U.esc(u.possessive(pet.name));
      return `<header class="view-head">
          <div class="view-head__text">
            <p class="eyebrow">${u.icon('chat')}Translator</p>
            <h1 class="view-title" tabindex="-1">${poss} translator</h1>
          </div>
        </header>
        <div class="tr-layout" style="--pet:${u.petColor(pet)}">
          <div class="tr-col">
          <section class="card stage${t.on ? '' : ' is-off'}" id="stage" data-speaking="${pid}" aria-labelledby="stage-title">
            <div class="card-head">
              <h2 class="card-title" id="stage-title">Live translation</h2>
              ${t.on ? u.status('good', 'Listening') : u.status('warning', 'Translator off')}
            </div>
            <div class="stage__scene">
              <div class="stage__pet">
                ${u.avatar(pet, 'xl')}
                <span class="waves" aria-hidden="true"><span></span><span></span><span></span><span></span><span></span></span>
              </div>
              <div class="stage__bubble" id="stage-bubble">${bubble(pet)}</div>
            </div>
            <div class="stage__actions">
              ${t.on
                ? `<button type="button" class="btn btn-primary" id="listen-btn" data-action="listen-now" data-pet="${pid}">${u.icon('ear')}Listen now</button>`
                : `<button type="button" class="btn btn-primary" id="listen-btn" data-action="toggle-translator" data-pet="${pid}">${u.icon('power')}Turn translator on</button>`}
              <button type="button" class="btn btn-secondary" id="replay-btn" data-action="replay-latest" data-pet="${pid}">${u.icon('play')}Replay</button>
              <button type="button" class="btn btn-tertiary" id="stop-btn" data-action="stop-voice">${u.icon('stop')}Stop speaking</button>
            </div>
          </section>

          <section class="card tr-recent" aria-labelledby="recent-tr-title">
            <div class="card-head">
              <h2 class="card-title" id="recent-tr-title">Recent translations</h2>
              <a class="link" href="#logs" data-action="logs-tab-link" data-tab="thoughts">See all</a>
            </div>
            <ol class="log-entries" id="tr-recent">${recent(pet)}</ol>
          </section>
          </div>

          <div class="tr-col">
          <section class="card voicebox" aria-labelledby="vb-title">
            <div class="card-head">
              <h2 class="card-title" id="vb-title">Voice box</h2>
              ${u.live('battery', pet)}
            </div>
            <p class="card-text">The speaker on ${poss} collar. In this demo it plays through your device.</p>
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
              <div class="select"><select class="input" id="vb-lang" data-change="vb-lang" data-pet="${pid}" aria-describedby="vb-lang-hint">${u.languageOptions(t.lang)}</select>${u.icon('chevron-down', 'select__icon')}</div>
              <p class="field__hint" id="vb-lang-hint">${U.esc(voiceHint(t.lang))}</p>
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
        <p class="disclaimer">${u.icon('info')}<span>Translations are invented for entertainment. They don’t describe what animals actually think or feel.</span></p>`;
    },
    unmount() {
      clearInterval(typeTimer);
      clearTimeout(listening);
      clearTimeout(previewTimer);
      listening = null;
    },
    on(type, d, root) {
      const pet = Paw.store.selectedPet();
      if (!pet) return;
      if (type === 'thought' && d.petId === pet.id) {
        clearTimeout(listening);
        listening = null;
        root.querySelector('#stage').classList.remove('is-listening');
        const listen = root.querySelector('#listen-btn');
        if (listen) listen.removeAttribute('aria-disabled');
        const box = root.querySelector('#stage-bubble');
        box.innerHTML = bubble(pet, true);
        typeOut(box.querySelector('.bubble__text'));
      } else if (type === 'logs') {
        const list = root.querySelector('#tr-recent');
        if (list) list.innerHTML = recent(pet);
      } else if (type === 'translator') {
        const p = Paw.store.getPet(d.id);
        const sub = p && root.querySelector(`[data-tr-sub="${CSS.escape(d.id)}"]`);
        if (sub) sub.textContent = `${ui().language(p.translator.lang).label} · ${p.translator.volume}%`;
      } else if (type === 'voices') {
        const hint = root.querySelector('#vb-lang-hint');
        if (hint) hint.textContent = voiceHint(pet.translator.lang);
      }
    },
    actions: {
      'listen-now': (el, e, root) => {
        const pet = Paw.store.getPet(el.dataset.pet);
        if (!pet || !pet.translator.on || listening) return;
        Paw.voice.unlock();
        root.querySelector('#stage').classList.add('is-listening');
        root.querySelector('#stage-bubble').innerHTML = `<div class="bubble bubble--muted bubble--listening"><p class="bubble__text">${ui().icon('ear')}Listening to ${U.esc(pet.name)}…</p></div>`;
        el.setAttribute('aria-disabled', 'true');
        listening = setTimeout(() => {
          listening = null;
          el.removeAttribute('aria-disabled');
          Paw.sim.think(pet.id, { manual: true });
        }, U.reducedMotion() ? 300 : 1300);
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
        Paw.store.setTranslator(id, { lang });
        const L = ui().language(lang);
        Paw.store.addLog({ kind: 'activity', type: 'device', petId: id, ts: Date.now(), title: 'Translator language changed', detail: L.label === L.english ? L.label : `${L.label} (${L.english})`, source: 'app' });
      },
      'vb-voice': (el, e) => {
        const id = el.dataset.pet;
        Paw.store.setTranslator(id, { voice: e.target.value });
        clearTimeout(previewTimer);
        previewTimer = setTimeout(() => Paw.app.speakFor(id, Paw.phrases.speakerTest[Paw.sim.langShort(Paw.store.getPet(id).translator.lang)], { requireOn: true }), 450);
      },
    },
  };
})();
