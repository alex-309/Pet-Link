/* Landing page: what Pet-Link is, a live mini demo of talking to a pet (your words play as its
   own sounds, then it answers out loud), the features, and the way into the demo app. It shares
   the app's config, language files, pet sounds and voices, but doesn't start the simulation. */
(function () {
  'use strict';
  const Paw = window.Paw;
  const C = Paw.config;
  const U = Paw.util;
  const t = (k, v) => Paw.i18n.t(k, v);
  const e = (k, v) => U.esc(t(k, v)); // translated and escaped for markup
  const icon = (name, cls) => `<svg class="icon${cls ? ' ' + cls : ''}" aria-hidden="true" focusable="false"><use href="#i-${name}"/></svg>`;
  const APP = 'app.html';
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  // One pet of each kind for the demo. All fictional; the first three are the app's sample pack.
  const PETS = [
    { id: 'lp-biscuit', name: 'Biscuit', species: 'dog', size: 'large', coat: 'golden', slot: 1 },
    { id: 'lp-luna', name: 'Luna', species: 'cat', coat: 'gray', slot: 2 },
    { id: 'lp-kiwi', name: 'Kiwi', species: 'bird', coat: 'leaf', slot: 3 },
    { id: 'lp-clover', name: 'Clover', species: 'rabbit', coat: 'cream', slot: 4 },
    { id: 'lp-peanut', name: 'Peanut', species: 'hamster', coat: 'golden', slot: 5 },
    { id: 'lp-comet', name: 'Comet', species: 'horse', coat: 'chocolate', slot: 6 },
    { id: 'lp-shelly', name: 'Shelly', species: 'turtle', coat: 'olive', slot: 3 },
  ];
  // The quick phrases shown in the demo: walk, food, play, love, sleep (see talk.js).
  const PHRASES = [0, 1, 2, 3, 6];

  let root = null;
  let current = PETS[0];
  let turn = null; // the exchange on screen: { said, sounds, kind, reply, mood, lang, waiting }
  let seq = 0;
  const runtimes = {};
  const samples = {};

  // A demo pet with a translator that speaks the page's language.
  const asPet = (p) => Object.assign({}, p, {
    translator: { on: true, volume: 70, voice: C.SPECIES[p.species].voice, lang: Paw.i18n.locale, voiceName: '' },
  });
  const petColor = (p) => `var(--pet-${p.slot})`;
  const speciesName = (p) => t(C.SPECIES[p.species].label);
  const avatar = (p, size, state) => Paw.avatars.wrap(p, { size, state: state || 'calm' });
  // "*sniff sniff* Woof?": the stage directions are translated, the barks stay.
  const soundText = (s) => String(s || '').replace(/\*([^*]+)\*/g, (m, inner) => '*' + t(inner) + '*');
  const italics = (s) => U.esc(s).replace(/\*([^*]+)\*/g, '<em>$1</em>');

  // ---- language: shared with the app ------------------------------------------------
  function savedLang() {
    try {
      const s = JSON.parse(U.storage.get(C.STORAGE_KEY) || 'null');
      if (s && s.settings && s.settings.uiLang) return s.settings.uiLang;
    } catch (err) { /* fall through */ }
    return U.storage.get(C.LANG_KEY) || 'auto';
  }
  function saveLang(value) {
    U.storage.set(C.LANG_KEY, value);
    // If the app already has saved data, keep its setting in step too.
    try {
      const s = JSON.parse(U.storage.get(C.STORAGE_KEY) || 'null');
      if (s && s.v === 1 && Array.isArray(s.pets)) {
        s.settings = Object.assign({}, s.settings, { uiLang: value });
        U.storage.set(C.STORAGE_KEY, JSON.stringify(s));
      }
    } catch (err) { /* the app keeps its own choice */ }
  }
  function langPicker() {
    const current = Paw.i18n.lang;
    const label = current === 'en' ? 'Language' : `${t('Language')} (Language)`;
    return `<label class="lang-pick" title="${U.esc(label)}">
        ${icon('globe')}<span class="lang-pick__code" aria-hidden="true">${current.toUpperCase()}</span>${icon('chevron-down', 'lang-pick__chev')}
        <select class="lang-pick__select" id="lp-lang" aria-label="${U.esc(label)}">${C.LANGUAGES.map((l) => `<option value="${l.short}" lang="${l.code}"${l.short === current ? ' selected' : ''}>${U.esc(l.label)}</option>`).join('')}</select>
      </label>`;
  }

  // ---- page sections -------------------------------------------------------------------
  const brandMark = '<svg class="brand__mark" viewBox="0 0 32 32" aria-hidden="true" focusable="false"><path class="brand__bubble" d="M7 3.5h18A4.5 4.5 0 0 1 29.5 8v12a4.5 4.5 0 0 1-4.5 4.5H14l-6.5 5v-5H7A4.5 4.5 0 0 1 2.5 20V8A4.5 4.5 0 0 1 7 3.5z"/><use href="#i-paw" x="6" y="3" width="20" height="20" class="brand__paw"/></svg>';

  function header() {
    return `<header class="lp-nav">
        <div class="lp-wrap lp-nav__row">
          <a class="brand" href="./" aria-label="${e('{app} home', { app: C.APP_NAME })}">${brandMark}<span class="brand__name">${U.esc(C.APP_NAME)}</span></a>
          <span class="badge badge--demo lp-nav__badge">${e('Demo')}</span>
          <nav class="lp-nav__links" aria-label="${e('Main')}">
            <a href="#how">${e('How it works')}</a>
            <a href="#features">${e('Features')}</a>
            <a href="#privacy">${e('Privacy')}</a>
          </nav>
          <div class="lp-nav__actions">
            ${langPicker()}
            <a class="btn btn-primary btn-sm lp-nav__cta" href="${APP}">${e('Try the demo')}</a>
          </div>
        </div>
      </header>`;
  }

  function hero() {
    return `<section class="lp-hero" aria-labelledby="lp-title">
        <div class="lp-wrap lp-hero__grid">
          <div class="lp-hero__text">
            <p class="lp-eyebrow">${icon('paw')}${e('Smart collar concept')}</p>
            <h1 class="lp-title" id="lp-title" tabindex="-1">${e('Talk to your pet.')} <span class="lp-title__accent">${e('Hear it talk back.')}</span></h1>
            <p class="lp-lede">${e('{app} is a smart collar concept that shows where your pet is, keeps an eye on its heart rate, and plays what you say as barks, meows and chirps. Then your pet answers out loud, in any of seven languages.', { app: C.APP_NAME })}</p>
            <div class="lp-hero__ctas">
              <a class="btn btn-primary lp-btn-lg" href="${APP}">${e('Try the demo')}${icon('arrow-right')}</a>
              <a class="btn btn-secondary lp-btn-lg" href="#how">${e('See how it works')}</a>
            </div>
            <p class="lp-note">${icon('shield')}<span>${e('A design prototype. Everything in the demo is simulated and stays in your browser.')}</span></p>
          </div>
          <div class="lp-hero__demo" id="lp-demo-slot">${demoCard()}</div>
        </div>
      </section>`;
  }

  function demoCard() {
    const p = current;
    return `<div class="lp-demo" id="lp-demo" style="--pet:${petColor(p)}">
        <div class="lp-demo__head">
          ${avatar(p, 'lg', 'active')}
          <div class="lp-demo__who">
            <p class="lp-demo__name">${U.esc(p.name)}</p>
            <p class="lp-demo__kind">${U.esc(speciesName(p))} · ${U.esc(Paw.petSounds.inLabel(p.species))}</p>
          </div>
          <span class="waves" aria-hidden="true"><span></span><span></span><span></span><span></span><span></span></span>
        </div>
        <div class="lp-demo__pets" role="group" aria-label="${e('Pick a pet')}">
          ${PETS.map((x) => `<button type="button" class="lp-pick" id="lp-pick-${x.id}" data-lp="pick" data-pet="${x.id}" aria-pressed="${x.id === p.id}" aria-label="${U.esc(x.name + ', ' + speciesName(x))}" title="${U.esc(x.name)}" style="--pet:${petColor(x)}">${avatar(x, 'sm')}</button>`).join('')}
        </div>
        <ol class="lp-convo" id="lp-convo" aria-live="polite" aria-label="${e('Conversation with {name}', { name: p.name })}">${convo()}</ol>
        <p class="lp-demo__label" id="lp-phrase-label">${e('Tap a phrase')}</p>
        <div class="lp-phrases" role="group" aria-labelledby="lp-phrase-label">
          ${PHRASES.map((i) => Paw.talk.quick(Paw.i18n.lang)[i]).map((q, i) => `<button type="button" class="quick__chip" id="lp-say-${i}" data-lp="say" data-text="${U.esc(q)}" lang="${U.esc(Paw.i18n.locale)}">${U.esc(q)}</button>`).join('')}
        </div>
        <p class="lp-demo__hint">${icon('volume')}<span>${e('Turn your sound on. {name} hears your words in its own animal sounds, then answers out loud.', { name: p.name })}</span></p>
      </div>`;
  }

  // Before anyone taps, the card shows a real exchange with the first phrase (silently), so it's
  // clear at a glance what the collar does.
  function sample(p) {
    const key = p.id + ':' + Paw.i18n.lang;
    if (!samples[key]) {
      const pet = asPet(p);
      const said = Paw.talk.quick(Paw.i18n.lang)[PHRASES[0]];
      const rep = Paw.talk.reply(pet, said, { mood: 'happy', recent: [], recentTalk: [] });
      samples[key] = { said, sounds: Paw.petSounds.translate(pet, said).text, kind: Paw.petSounds.inLabel(p.species), reply: rep.text, mood: rep.mood, lang: pet.translator.lang, waiting: false, sample: true };
    }
    return samples[key];
  }
  const shown = () => turn || sample(current);

  function convo() {
    const p = current;
    const x = shown();
    const m = C.MOODS[x.mood] || C.MOODS.happy;
    return `<li class="lp-msg lp-msg--me">
          <p class="lp-bubble lp-bubble--me">${U.esc(x.said)}</p>
          <div class="lp-petsay">
            <p><span class="bubble__label">${U.esc(x.kind)}</span> <span class="lp-petsay__text">${U.esc(x.sounds)}</span></p>
            <button type="button" class="icon-btn icon-btn--sm" id="lp-replay" data-lp="replay" aria-label="${e('Play it as pet sounds')}" title="${e('Play it as pet sounds')}">${icon('play')}</button>
          </div>
        </li>
        ${x.waiting
          ? `<li class="lp-msg lp-msg--pet">${avatar(p, 'sm')}<p class="lp-bubble lp-bubble--pet lp-bubble--typing"><span class="dots" aria-hidden="true"><i></i><i></i><i></i></span><span>${e('{name} is answering…', { name: p.name })}</span></p></li>`
          : `<li class="lp-msg lp-msg--pet${x.sample ? '' : ' is-new'}">${avatar(p, 'sm')}<div class="lp-msg__body"><p class="lp-bubble lp-bubble--pet" lang="${U.esc(x.lang)}">${U.esc(x.reply)}</p><p class="lp-msg__meta"><span class="chip">${icon(m.icon)}${e(m.label)}</span></p></div></li>`}`;
  }

  function steps() {
    const items = [
      ['mic', 'You talk', 'Tap the microphone and speak, or type. It understands greetings, walks, food, play, bedtime, baths and praise in seven languages.'],
      ['volume', 'The collar plays it in pet sounds', 'The speaker on the collar plays what you said in your pet’s own sounds: barks for a dog, meows for a cat, chirps for a bird.'],
      ['chat', 'Your pet answers', 'A moment later your pet replies out loud, in its own voice and language. Every exchange is saved in its log.'],
    ];
    return `<section class="lp-section" id="how" aria-labelledby="how-title">
        <div class="lp-wrap">
          <h2 class="lp-h2" id="how-title">${e('How a conversation works')}</h2>
          <ol class="lp-steps">${items.map(([ic, title, body], i) => `
            <li class="lp-step">
              <span class="lp-step__num" aria-hidden="true">${Paw.i18n.num(i + 1)}</span>
              <h3 class="lp-h3">${icon(ic)}${e(title)}</h3>
              <p>${e(body)}</p>
            </li>`).join('')}
          </ol>
        </div>
      </section>`;
  }

  // Small product fragments shown inside the feature cards (decorative; the text says it all).
  function mapShot() {
    return `<div class="lp-shot lp-shot--map">
        <svg viewBox="0 0 320 180" role="presentation" focusable="false">
          <rect width="320" height="180" fill="var(--map-ground)"/>
          <rect x="196" y="10" width="114" height="74" rx="14" fill="var(--map-park)"/>
          <ellipse cx="262" cy="46" rx="26" ry="16" fill="var(--map-water)" stroke="var(--map-water-edge)" stroke-width="2"/>
          <path d="M0 98H320M176 0V180" stroke="var(--map-road-edge)" stroke-width="20"/>
          <path d="M0 98H320M176 0V180" stroke="var(--map-road)" stroke-width="16"/>
          <rect x="18" y="120" width="34" height="24" rx="5" fill="var(--map-house)" stroke="var(--map-house-line)" stroke-width="1.5"/>
          <rect x="216" y="122" width="34" height="24" rx="5" fill="var(--map-house)" stroke="var(--map-house-line)" stroke-width="1.5"/>
          <circle cx="104" cy="132" r="54" fill="var(--accent)" fill-opacity="0.08" stroke="var(--accent)" stroke-width="2" stroke-dasharray="7 6"/>
          <rect x="88" y="120" width="32" height="24" rx="5" fill="var(--accent-tint)" stroke="var(--accent)" stroke-width="2"/>
          <path d="M104 132 C 130 110, 150 104, 176 98 S 220 80, 238 62" fill="none" stroke="var(--pet-1)" stroke-width="3" stroke-linecap="round" opacity="0.7"/>
          <circle cx="238" cy="62" r="11" fill="var(--surface-card)" stroke="var(--pet-1)" stroke-width="3"/>
          <circle cx="238" cy="62" r="4" fill="var(--pet-1)"/>
        </svg>
        <span class="lp-shot__tag">${icon('pin')}Bark Park · ${e('Out on a walk')}</span>
      </div>`;
  }
  function healthShot() {
    return `<div class="lp-shot lp-shot--health">
        <div class="lp-shot__hr">${icon('heart-fill', 'heart-beat')}<strong>104</strong><span>${e('bpm')}</span></div>
        <svg class="lp-shot__ecg" viewBox="0 0 300 60" role="presentation" focusable="false" preserveAspectRatio="none">
          <path d="M0 40 H40 l6 -6 l6 6 H70 l5 -30 l6 46 l5 -16 H120 l8 -8 l8 8 H150 l6 -6 l6 6 H180 l5 -30 l6 46 l5 -16 H230 l8 -8 l8 8 H300" fill="none" stroke="var(--heart)" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
        </svg>
        <p class="lp-shot__meta"><span class="lp-shot__ok">${e('Normal')}</span>${e('Usual resting range {low}–{high} bpm', { low: 60, high: 100 })}</p>
      </div>`;
  }
  function thoughtShot() {
    const bank = (Paw.phrases.bank[Paw.i18n.lang] || Paw.phrases.bank.en).curious;
    const line = (bank.dog && bank.dog[0]) || bank.all[0];
    return `<div class="lp-shot lp-shot--thought">
        ${avatar(PETS[0], 'md', 'active')}
        <figure class="thought">
          <blockquote class="thought__text" lang="${U.esc(Paw.i18n.locale)}">${U.esc(line)}</blockquote>
          <figcaption class="thought__meta"><span class="chip">${icon('search')}${e('Curious')}</span>${e('Heard')} ${italics(soundText('*sniff sniff*'))}</figcaption>
        </figure>
      </div>`;
  }
  function logShot() {
    const today = U.startOfDay();
    const rows = [
      ['route', t('Run in the park'), [U.fmtDuration(25 * 60), U.fmtDistance(1800)], today + 7.5 * 3600e3],
      ['bowl', t('Breakfast'), [U.fmtDuration(8 * 60)], today + 8.25 * 3600e3],
      ['alert', t('Left the safe zone'), [t('Last seen: {place}', { place: t('Near the corner café') })], today + 11.6 * 3600e3],
    ];
    return `<ul class="lp-shot lp-shot--logs">${rows.map(([ic, title, bits, ts]) => `
        <li><span class="lp-shot__icon">${icon(ic)}</span><span class="lp-shot__row"><strong>${U.esc(title)}</strong><span>${U.esc(bits.join(' · '))}</span></span><time>${U.esc(U.fmtTime(ts))}</time></li>`).join('')}
      </ul>`;
  }

  function features() {
    const cards = [
      [1, 'pin', 'Map', 'Always know where they are', 'See every pet on a map of the neighborhood with its recent path, and get an alert when one wanders out of its safe zone alone.', mapShot],
      [2, 'heart', 'Health', 'A heartbeat you can see', 'A live heart rate with an ECG-style trace and the usual resting range for its species and size, plus steps, sleep, temperature and breathing.', healthShot],
      [3, 'chat', 'Translator', 'Listen in on their thoughts', 'Hear what your pet might be thinking, or talk to it and hear the answer. It’s all invented for fun.', thoughtShot],
      [4, 'journal', 'Logs', 'Every walk, nap and chat, kept', 'Walks, meals, naps, safe-zone alerts and every translation in one place, with search, filters and export.', logShot],
    ];
    return `<section class="lp-section" id="features" aria-labelledby="features-title">
        <div class="lp-wrap">
          <h2 class="lp-h2" id="features-title">${e('What the collar keeps track of')}</h2>
          <div class="lp-features">${cards.map(([slot, ic, kicker, title, body, shot]) => `
            <article class="lp-feature" style="--pet:var(--pet-${slot})" aria-labelledby="lp-f-${slot}">
              <div class="lp-feature__text">
                <p class="lp-feature__kicker">${icon(ic)}${e(kicker)}</p>
                <h3 class="lp-h3" id="lp-f-${slot}">${e(title)}</h3>
                <p>${e(body)}</p>
              </div>
              <div class="lp-feature__shot" aria-hidden="true">${shot()}</div>
            </article>`).join('')}
          </div>
        </div>
      </section>`;
  }

  function species() {
    const words = (p) => {
      const w = Paw.petSounds.SPECIES[p.species].words;
      return Object.keys(w).slice(0, 3).map((k) => w[k][0]).join(' · ');
    };
    return `<section class="lp-section" id="pets" aria-labelledby="pets-title">
        <div class="lp-wrap">
          <div class="lp-band">
            <div class="lp-band__head">
              <h2 class="lp-h2" id="pets-title">${e('Seven kinds of pets, seven languages')}</h2>
              <p>${e('Dogs, cats, rabbits, birds, hamsters, horses and turtles each have their own sounds. Tap one to hear it say hello.')}</p>
            </div>
            <ul class="lp-animals">${PETS.map((p) => `
              <li><button type="button" class="lp-animal" id="lp-hear-${p.id}" data-lp="hear" data-pet="${p.id}" style="--pet:${petColor(p)}">
                ${avatar(p, 'lg')}
                <span class="lp-animal__name">${U.esc(speciesName(p))}</span>
                <span class="lp-animal__words">${U.esc(words(p))}</span>
                <span class="lp-animal__play">${icon('play')}<span class="visually-hidden">${e('Play')}</span></span>
              </button></li>`).join('')}
            </ul>
            <div class="lp-langs">
              <p>${e('Every pet can answer in')}</p>
              <ul>${C.LANGUAGES.map((l) => `<li lang="${l.code}">${U.esc(l.label)}</li>`).join('')}</ul>
            </div>
          </div>
        </div>
      </section>`;
  }

  function privacy() {
    const items = [
      ['pin', 'Locations are made up.', 'The map shows a fictional neighborhood.'],
      ['heart', 'Health numbers are generated.', 'They aren’t medical or veterinary advice.'],
      ['chat', 'Translations are invented for fun.', 'Pets don’t actually speak human languages.'],
      ['shield', 'Your data stays on this device.', 'Pets and logs are saved in this browser only.'],
    ];
    return `<section class="lp-section" id="privacy" aria-labelledby="privacy-title">
        <div class="lp-wrap">
          <h2 class="lp-h2" id="privacy-title">${e('Good to know before you try it')}</h2>
          <ul class="lp-facts">${items.map(([ic, strong, rest]) => `
            <li class="lp-fact"><span class="lp-fact__icon">${icon(ic)}</span><p><strong>${e(strong)}</strong> ${e(rest)}</p></li>`).join('')}
          </ul>
          <p class="lp-facts__more"><a class="link" href="${APP}#preferences">${e('Privacy and legal')}</a></p>
        </div>
      </section>`;
  }

  function cta() {
    return `<section class="lp-section" aria-labelledby="cta-title">
        <div class="lp-wrap">
          <div class="lp-cta">
            <div class="lp-cta__pack" aria-hidden="true">${PETS.slice(0, 3).map((p) => avatar(p, 'lg', 'active')).join('')}</div>
            <div class="lp-cta__text">
              <h2 class="lp-h2" id="cta-title">${e('Meet the sample pack')}</h2>
              <p>${e('Biscuit, Luna and Kiwi are waiting in the demo. No sign-up, nothing to install.')}</p>
            </div>
            <a class="btn lp-btn-lg lp-cta__btn" href="${APP}">${e('Open the demo')}${icon('arrow-right')}</a>
          </div>
        </div>
      </section>`;
  }

  function footer() {
    return `<footer class="lp-footer">
        <div class="lp-wrap lp-footer__row">
          <div class="lp-footer__about">
            <p class="lp-footer__brand">${brandMark}<span>${U.esc(C.APP_NAME)}</span><span class="badge badge--demo">${e('Demo')}</span></p>
            <p>${e('{app} is a design prototype for a fictional smart collar. It isn’t connected to any device. Locations, heart rate, temperature, breathing, battery levels and translations are all generated by this app.', { app: C.APP_NAME })}</p>
          </div>
          <nav class="lp-footer__links" aria-label="${e('Footer')}">
            <a href="${APP}">${e('Open the demo')}</a>
            <a href="${APP}#preferences">${e('Privacy and legal')}</a>
          </nav>
        </div>
      </footer>`;
  }

  // ---- rendering -----------------------------------------------------------------------
  function render() {
    root.innerHTML = header() + `<main class="lp-main" id="lp-main" tabindex="-1">${hero()}${steps()}${features()}${species()}${privacy()}${cta()}</main>` + footer();
    Paw.i18n.applyStatic(document);
  }
  function renderDemo(focusId) {
    const slot = root.querySelector('#lp-demo-slot');
    if (!slot) return;
    slot.innerHTML = demoCard();
    const el = focusId && document.getElementById(focusId);
    if (el) el.focus({ preventScroll: true });
  }
  function renderConvo() {
    const list = root.querySelector('#lp-convo');
    if (list) list.innerHTML = convo();
  }

  // ---- the demo ------------------------------------------------------------------------
  // Say the pet's answer out loud: in the page's language, or the same line in another language
  // the device can speak (every reply exists in all seven).
  function speak(pet, rep, langOverride) {
    if (!Paw.voice.supported) return;
    let lang = langOverride || pet.translator.lang;
    const same = Paw.sim.langShort(lang) === Paw.sim.langShort(pet.translator.lang);
    const moved = !same && Paw.sim.retranslate({ key: rep.key }, lang);
    let line = moved ? moved.text : rep.text;
    if (Paw.voice.ready && Paw.voice.voiceCount && !Paw.voice.voiceFor(lang)) {
      const alt = Paw.voice.fallbackLang(Paw.sim.langShort(lang));
      const re = alt && Paw.sim.retranslate({ key: rep.key }, alt);
      if (re) { line = re.text; lang = alt; }
    }
    const style = C.VOICE_STYLES[pet.translator.voice] || C.VOICE_STYLES.normal;
    Paw.voice.speak({ text: line, lang, voiceName: '', volume: 0.75, pitch: style.pitch, rate: style.rate, petId: pet.id, retry: langOverride ? null : { rep } });
  }

  async function exchange(text) {
    const pet = asPet(current);
    const id = ++seq;
    Paw.voice.unlock();
    Paw.voice.stop();
    const sounds = Paw.petSounds.translate(pet, text);
    turn = { said: text, sounds: sounds.text, kind: Paw.petSounds.inLabel(pet.species), waiting: true };
    renderConvo();
    const seconds = await Paw.petSounds.play(pet, sounds, 0.8).catch(() => 0);
    await wait(seconds * 1000 + (U.reducedMotion() ? 250 : 650));
    if (id !== seq) return; // a newer phrase took over
    const r = runtimes[pet.id] || (runtimes[pet.id] = { mood: 'happy', recent: [], recentTalk: [] });
    const rep = Paw.talk.reply(pet, text, r);
    Object.assign(turn, { waiting: false, reply: rep.text, mood: rep.mood, lang: pet.translator.lang });
    renderConvo();
    speak(pet, rep);
  }
  function replay() {
    Paw.voice.unlock();
    const pet = asPet(current);
    Paw.petSounds.play(pet, Paw.petSounds.translate(pet, shown().said), 0.8).catch(() => 0);
  }
  // The species band: each animal says hello in its own sounds.
  function hear(petId, button) {
    const p = PETS.find((x) => x.id === petId);
    if (!p) return;
    Paw.voice.unlock();
    const pet = asPet(p);
    button.classList.add('is-playing');
    Paw.petSounds.play(pet, Paw.petSounds.translate(pet, 'Hello!'), 0.8)
      .then((seconds) => wait(Math.max(400, seconds * 1000)))
      .then(() => button.classList.remove('is-playing'), () => button.classList.remove('is-playing'));
  }

  function onClick(ev) {
    const el = ev.target.closest('[data-lp]');
    if (!el) return;
    const what = el.dataset.lp;
    if (what === 'pick') {
      const p = PETS.find((x) => x.id === el.dataset.pet);
      if (!p || p === current) return;
      seq++;
      Paw.voice.stop();
      current = p;
      turn = null;
      renderDemo(el.id);
    } else if (what === 'say') {
      exchange(el.dataset.text);
    } else if (what === 'replay') {
      replay();
    } else if (what === 'hear') {
      hear(el.dataset.pet, el);
    }
  }

  function setLanguage(value) {
    saveLang(value);
    Paw.i18n.set(value);
    seq++;
    Paw.voice.stop();
    turn = null;
    const y = window.scrollY;
    render();
    window.scrollTo(0, y);
    const picker = document.getElementById('lp-lang');
    if (picker) picker.focus({ preventScroll: true });
  }

  function init() {
    root = document.getElementById('landing');
    Paw.i18n.set(savedLang());
    Paw.voice.init();
    Paw.petSounds.init();
    render();
    root.addEventListener('click', onClick);
    root.addEventListener('change', (ev) => { if (ev.target.id === 'lp-lang') setLanguage(ev.target.value); });
    Paw.voice.on((type, item) => {
      const card = document.getElementById('lp-demo');
      if (type === 'start' && card && item && item.petId === current.id) card.classList.add('is-speaking');
      else if ((type === 'end' || type === 'idle') && card) card.classList.remove('is-speaking');
      // Every voice for that language failed: say it in one the device can speak.
      else if (type === 'unavailable' && item && item.retry) {
        const alt = Paw.voice.fallbackLang(Paw.sim.langShort(item.lang));
        if (alt) speak(asPet(PETS.find((x) => x.id === item.petId) || current), item.retry.rep, alt);
      }
    });
    // The page is drawn by script, so jump to a linked section once it exists.
    if (location.hash.length > 1) {
      const target = document.getElementById(location.hash.slice(1));
      if (target) target.scrollIntoView();
    }
    if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol) && !U.inFrame) {
      navigator.serviceWorker.register('sw.js').catch(() => { /* offline support is optional */ });
    }
  }

  init();
})();
