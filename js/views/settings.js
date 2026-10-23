/* Settings: pets, appearance, units, live demo options, data and the legal notes. */
(function () {
  'use strict';
  const Paw = (window.Paw = window.Paw || {});
  const C = Paw.config;
  const U = Paw.util;
  const ui = () => Paw.ui;

  function radios(name, current, options) {
    return `<div class="segmented">${options.map(([v, label]) => `<label><input type="radio" name="${name}" value="${v}"${String(current) === String(v) ? ' checked' : ''}><span>${label}</span></label>`).join('')}</div>`;
  }
  function settingSwitch(id, key, label, hint) {
    const s = Paw.store.state.settings;
    return `<div class="setting">
        <div class="setting__text"><span class="setting__label" id="${id}-label">${label}</span>${hint ? `<span class="setting__hint" id="${id}-hint">${hint}</span>` : ''}</div>
        ${ui().switchButton({ id, on: !!s[key], action: 'toggle-setting', key, labelledby: id + '-label', describedby: hint ? id + '-hint' : '' })}
      </div>`;
  }

  function petRow(p) {
    const u = ui();
    const bits = [C.SPECIES[p.species].label, p.breed, 'Collar ' + p.device.id].filter(Boolean);
    const name = U.esc(p.name);
    return `<li class="pet-row" style="--pet:${u.petColor(p)}">
        ${u.avatar(p, 'md')}
        <div class="pet-row__text">
          <p class="pet-row__name"><span class="pet-dot" aria-hidden="true"></span>${name}${p.sample ? '<span class="badge">Sample</span>' : ''}</p>
          <p class="pet-row__sub">${U.esc(bits.join(' · '))}</p>
        </div>
        <div class="pet-row__actions">
          <button type="button" class="icon-btn" id="edit-${U.esc(p.id)}" data-action="edit-pet" data-pet="${U.esc(p.id)}" aria-label="Edit ${name}" title="Edit">${u.icon('pencil')}</button>
          <button type="button" class="icon-btn" id="remove-${U.esc(p.id)}" data-action="remove-pet" data-pet="${U.esc(p.id)}" aria-label="Remove ${name}" title="Remove">${u.icon('trash')}</button>
        </div>
      </li>`;
  }

  Paw.views = Paw.views || {};
  Paw.views.preferences = {
    title: 'Settings',
    handlesSelect: true,
    render() {
      const s = Paw.store.state.settings;
      const pets = Paw.store.state.pets;
      const u = ui();
      const name = U.esc(C.APP_NAME);
      return `<header class="view-head">
          <div class="view-head__text">
            <p class="eyebrow">${u.icon('sliders')}Settings</p>
            <h1 class="view-title" tabindex="-1">Settings</h1>
          </div>
        </header>
        <div class="settings">
          <section class="card" aria-labelledby="set-pets">
            <div class="card-head">
              <h2 class="card-title" id="set-pets">Your pets</h2>
              <button type="button" class="btn btn-secondary btn-sm" data-action="add-pet"${pets.length >= C.MAX_PETS ? ' disabled' : ''}>${u.icon('plus')}Add pet</button>
            </div>
            ${pets.length ? `<ul class="pet-rows">${pets.map(petRow).join('')}</ul>` : '<p class="empty-note">No pets yet.</p>'}
            <p class="card-text card-text--muted">Up to ${C.MAX_PETS} pets. Each one gets its own collar, voice box and color on charts and the map.</p>
          </section>

          <section class="card" aria-labelledby="set-look">
            <h2 class="card-title" id="set-look">Appearance</h2>
            <fieldset class="setting setting--stack" data-change="setting" data-key="theme">
              <legend class="setting__label">Theme</legend>
              ${radios('theme', s.theme, [['system', 'Match device'], ['light', 'Light'], ['dark', 'Dark']])}
            </fieldset>
            <fieldset class="setting setting--stack" data-change="setting" data-key="motion">
              <legend class="setting__label">Animation</legend>
              ${radios('motion', s.motion, [['system', 'Match device'], ['reduce', 'Reduced'], ['full', 'Full']])}
              <p class="setting__hint">Reduced turns off the heartbeat pulse, map gliding, typing effect and other movement.</p>
            </fieldset>
            <fieldset class="setting setting--stack" data-change="setting" data-key="units">
              <legend class="setting__label">Units</legend>
              ${radios('units', s.units, [['metric', 'Metric (m, km, °C)'], ['imperial', 'Imperial (ft, mi, °F)']])}
            </fieldset>
          </section>

          <section class="card" aria-labelledby="set-live">
            <h2 class="card-title" id="set-live">Live demo</h2>
            <div class="setting">
              <div class="setting__text"><span class="setting__label">Live data</span><span class="setting__hint" id="set-pause-hint">${s.paused ? 'Paused. Readings and positions are frozen.' : 'Updating every second.'}</span></div>
              <button type="button" class="btn btn-secondary btn-sm" id="set-pause" data-action="toggle-pause">${s.paused ? u.icon('play') + 'Resume' : u.icon('pause') + 'Pause'}</button>
            </div>
            <fieldset class="setting setting--stack" data-change="setting" data-key="speed">
              <legend class="setting__label">Demo speed</legend>
              ${radios('speed', s.speed, C.SIM_SPEEDS.map((v) => [v, v + '×']))}
            </fieldset>
            <fieldset class="setting setting--stack" data-change="setting" data-key="chattiness">
              <legend class="setting__label">How often pets talk</legend>
              ${radios('chattiness', s.chattiness, Object.entries(C.CHATTINESS).map(([k, v]) => [k, v.label]))}
            </fieldset>
            ${settingSwitch('set-quiet', 'quiet', 'Quiet mode', 'Silences every voice box. Translations still appear as text.')}
            ${settingSwitch('set-chime', 'chime', 'Chime before translations', 'A short two-note sound before the voice speaks.')}
            ${settingSwitch('set-announce', 'announce', 'Announce translations to screen readers', 'Reads new translations aloud with your screen reader.')}
            ${settingSwitch('set-zone', 'zoneAlerts', 'Safe-zone alerts', 'Shows a notice when a pet leaves the safe zone on its own.')}
          </section>

          <section class="card" aria-labelledby="set-talk">
            <h2 class="card-title" id="set-talk">Talking to pets</h2>
            <div class="setting setting--stack">
              <label class="setting__label" for="set-talk-lang">Language you speak</label>
              <div class="select"><select class="input input--compact" id="set-talk-lang" data-change="setting-select" data-key="talkLang">
                <option value="auto"${s.talkLang === 'auto' ? ' selected' : ''}>Match my browser</option>
                ${C.LANGUAGES.map((l) => `<option value="${l.code}" lang="${l.code}"${s.talkLang === l.code ? ' selected' : ''}>${U.esc(l.label)}${l.label !== l.english ? ' (' + l.english + ')' : ''}</option>`).join('')}
              </select>${u.icon('chevron-down', 'select__icon')}</div>
              <p class="setting__hint">Used when you talk to a pet with the microphone. Pets always answer in their own translator language.</p>
            </div>
            <div class="setting">
              <div class="setting__text"><span class="setting__label">Microphone</span><span class="setting__hint">${!Paw.voice.canListen
                ? 'Voice input isn’t available in this browser. You can always type to your pet.'
                : s.micConsent ? 'You allowed voice input. Your browser may still ask for microphone permission.' : 'Pet-Link asks before it uses the microphone for the first time.'}</span></div>
              ${s.micConsent ? '<button type="button" class="btn btn-secondary btn-sm" id="set-mic-reset" data-action="reset-mic">Ask me again</button>' : ''}
            </div>
          </section>

          <section class="card" aria-labelledby="set-data">
            <h2 class="card-title" id="set-data">Data and privacy</h2>
            <p class="card-text">${Paw.store.storageOk
              ? 'Your pets, settings and logs are saved in this browser on this device. Nothing is sent anywhere.'
              : 'This browser isn’t allowing the app to save data, so changes will be lost when you close the page.'}</p>
            <div class="button-row">
              <button type="button" class="btn btn-secondary" data-action="export">${u.icon('download')}Export logs</button>
              <button type="button" class="btn btn-secondary" data-action="clear-logs">${u.icon('trash')}Clear all logs</button>
              <button type="button" class="btn btn-danger-outline" data-action="reset-demo">${u.icon('refresh')}Reset the demo</button>
            </div>
            <p class="card-text card-text--muted">Reset deletes your pets, logs and settings on this device and brings back the sample pack.</p>
          </section>

          <section class="card legal" aria-labelledby="set-about">
            <h2 class="card-title" id="set-about">About and legal</h2>
            <details class="legal__item" open>
              <summary>Demo disclaimer</summary>
              <p>${name} is a design prototype for a fictional smart collar. It isn’t connected to any device. Locations, heart rate, temperature, breathing, battery levels and translations are all generated by this app.</p>
              <p>Translations are invented for entertainment. They don’t describe what an animal actually thinks or feels.</p>
              <p>Health readings aren’t medical or veterinary advice, and this app is not a medical device. If you’re worried about your pet, contact a veterinarian.</p>
            </details>
            <details class="legal__item">
              <summary>Privacy</summary>
              <ul>
                <li>No account, ads, analytics or cookies.</li>
                <li>Pets, settings and logs are saved in this browser’s local storage on this device only. Reset the demo or clear your browser data to delete them.</li>
                <li>The app doesn’t use your real location or camera.</li>
                <li>The microphone is used only when you tap it to talk to a pet. Your browser turns your speech into text, and some browsers send the audio to their maker to do that. Pet-Link never records or keeps it.</li>
                <li>Fonts, icons, illustrations and the map are bundled with the app, so it doesn’t contact other websites.</li>
                <li>Speech uses the voices on your device. If a language has no voice installed, some browsers use an online voice from the browser maker, which receives the text being spoken.</li>
              </ul>
            </details>
            <details class="legal__item">
              <summary>Accessibility</summary>
              <p>${name} aims to meet WCAG 2.2 level AA. It works with a keyboard and screen readers, shows a visible focus outline, uses colors with enough contrast, follows your reduced-motion setting, lets you pause live updates and offers text versions of the map and every chart.</p>
              <p>If something gets in your way, note the page and what happened and share it with the project team.</p>
            </details>
            <details class="legal__item">
              <summary>Credits and licenses</summary>
              <ul>
                <li>Illustrations, icons and the map were made for this project.</li>
                <li>Typefaces: Inter (Rasmus Andersson and the Inter project authors) and Fredoka (the Fredoka project authors), both used under the SIL Open Font License 1.1. The license texts are in assets/fonts.</li>
                <li>Breed names describe the sample pets. All pet names, streets and places on the map are fictional.</li>
              </ul>
            </details>
          </section>
        </div>`;
    },
    // Radios and switches update themselves; only rebuild what depends on other data.
    on(type, d, root) {
      if (type === 'pets') Paw.app.refreshView();
      if (type === 'settings' && d.key === 'paused') {
        const btn = root.querySelector('#set-pause');
        if (btn) btn.innerHTML = d.value ? ui().icon('play') + 'Resume' : ui().icon('pause') + 'Pause';
        const hint = root.querySelector('#set-pause-hint');
        if (hint) hint.textContent = d.value ? 'Paused. Readings and positions are frozen.' : 'Updating every second.';
      }
    },
    changes: {
      setting: (el, e) => {
        const key = el.dataset.key;
        const raw = e.target.value;
        Paw.store.setSetting(key, key === 'speed' ? Number(raw) : raw);
      },
      'setting-select': (el) => Paw.store.setSetting(el.dataset.key, el.value),
    },
    actions: {
      'reset-mic': () => {
        Paw.store.setSetting('micConsent', false);
        Paw.app.refreshView();
      },
    },
  };
})();
