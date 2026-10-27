/* Settings: pets, appearance, units, live demo options, data and the legal notes. */
(function () {
  'use strict';
  const Paw = (window.Paw = window.Paw || {});
  const C = Paw.config;
  const U = Paw.util;
  const ui = () => Paw.ui;
  const t = (k, v) => Paw.i18n.t(k, v);

  function radios(name, current, options) {
    return `<div class="segmented">${options.map(([v, label]) => `<label><input type="radio" name="${name}" value="${v}"${String(current) === String(v) ? ' checked' : ''}><span>${U.esc(label)}</span></label>`).join('')}</div>`;
  }
  function settingSwitch(id, key, label, hint) {
    const s = Paw.store.state.settings;
    return `<div class="setting">
        <div class="setting__text"><span class="setting__label" id="${id}-label">${U.esc(t(label))}</span>${hint ? `<span class="setting__hint" id="${id}-hint">${U.esc(t(hint))}</span>` : ''}</div>
        ${ui().switchButton({ id, on: !!s[key], action: 'toggle-setting', key, labelledby: id + '-label', describedby: hint ? id + '-hint' : '' })}
      </div>`;
  }
  // A language picker: "match" first, then every language in its own name.
  function languageSelect(id, key, current, autoLabel) {
    return `<div class="select"><select class="input input--compact" id="${id}" data-change="setting-select" data-key="${key}">
        <option value="auto"${current === 'auto' ? ' selected' : ''}>${U.esc(t(autoLabel))}</option>
        ${C.LANGUAGES.map((l) => {
          const value = key === 'uiLang' ? l.short : l.code;
          return `<option value="${value}" lang="${l.code}"${current === value ? ' selected' : ''}>${U.esc(ui().languageLabel(l))}</option>`;
        }).join('')}
      </select>${ui().icon('chevron-down', 'select__icon')}</div>`;
  }

  function petRow(p) {
    const u = ui();
    const bits = [u.speciesName(p.species), p.breed ? t(p.breed) : '', t('Collar {id}', { id: p.device.id })].filter(Boolean);
    const name = U.esc(p.name);
    return `<li class="pet-row" style="--pet:${u.petColor(p)}">
        ${u.avatar(p, 'md')}
        <div class="pet-row__text">
          <p class="pet-row__name"><span class="pet-dot" aria-hidden="true"></span>${name}${p.sample ? `<span class="badge">${U.esc(t('Sample'))}</span>` : ''}</p>
          <p class="pet-row__sub">${U.esc(bits.join(' · '))}</p>
        </div>
        <div class="pet-row__actions">
          <button type="button" class="icon-btn" id="edit-${U.esc(p.id)}" data-action="edit-pet" data-pet="${U.esc(p.id)}" aria-label="${U.esc(t('Edit {name}', { name: p.name }))}" title="${U.esc(t('Edit'))}">${u.icon('pencil')}</button>
          <button type="button" class="icon-btn" id="remove-${U.esc(p.id)}" data-action="remove-pet" data-pet="${U.esc(p.id)}" aria-label="${U.esc(t('Remove {name}', { name: p.name }))}" title="${U.esc(t('Remove'))}">${u.icon('trash')}</button>
        </div>
      </li>`;
  }

  const pauseHint = (paused) => (paused ? t('Paused. Readings and positions are frozen.') : t('Updating every second.'));
  const pauseLabel = (paused) => (paused ? ui().icon('play') + U.esc(t('Resume')) : ui().icon('pause') + U.esc(t('Pause')));

  Paw.views = Paw.views || {};
  Paw.views.preferences = {
    title: 'Settings',
    handlesSelect: true,
    render() {
      const s = Paw.store.state.settings;
      const pets = Paw.store.state.pets;
      const u = ui();
      const app = { app: C.APP_NAME };
      return `<header class="view-head">
          <div class="view-head__text">
            <p class="eyebrow">${u.icon('sliders')}${U.esc(t('Settings'))}</p>
            <h1 class="view-title" tabindex="-1">${U.esc(t('Settings'))}</h1>
          </div>
        </header>
        <div class="settings">
          <section class="card" aria-labelledby="set-pets">
            <div class="card-head">
              <h2 class="card-title" id="set-pets">${U.esc(t('Your pets'))}</h2>
              <button type="button" class="btn btn-secondary btn-sm" data-action="add-pet"${pets.length >= C.MAX_PETS ? ' disabled' : ''}>${u.icon('plus')}${U.esc(t('Add pet'))}</button>
            </div>
            ${pets.length ? `<ul class="pet-rows">${pets.map(petRow).join('')}</ul>` : `<p class="empty-note">${U.esc(t('No pets yet.'))}</p>`}
            <p class="card-text card-text--muted">${U.esc(t('Up to {n} pets. Each one gets its own collar, voice box and color on charts and the map.', { n: C.MAX_PETS }))}</p>
          </section>

          <section class="card" aria-labelledby="set-look">
            <h2 class="card-title" id="set-look">${U.esc(t('Language and appearance'))}</h2>
            <div class="setting setting--stack">
              <label class="setting__label" for="set-ui-lang">${U.esc(t('App language'))}</label>
              ${languageSelect('set-ui-lang', 'uiLang', s.uiLang || 'auto', 'Match my browser')}
              <p class="setting__hint">${U.esc(t('Changes every menu, button and message. You can also switch it from the globe button at the top of every page. Pets keep speaking their own translator language.'))}</p>
            </div>
            <fieldset class="setting setting--stack" data-change="setting" data-key="theme">
              <legend class="setting__label">${U.esc(t('Theme'))}</legend>
              ${radios('theme', s.theme, [['system', t('Match device')], ['light', t('Light')], ['dark', t('Dark')]])}
            </fieldset>
            <fieldset class="setting setting--stack" data-change="setting" data-key="motion">
              <legend class="setting__label">${U.esc(t('Animation'))}</legend>
              ${radios('motion', s.motion, [['system', t('Match device')], ['reduce', t('Reduced')], ['full', t('Full')]])}
              <p class="setting__hint">${U.esc(t('Reduced turns off the heartbeat pulse, map gliding, typing effect and other movement.'))}</p>
            </fieldset>
            <fieldset class="setting setting--stack" data-change="setting" data-key="units">
              <legend class="setting__label">${U.esc(t('Units'))}</legend>
              ${radios('units', s.units, [['metric', t('Metric (m, km, °C)')], ['imperial', t('Imperial (ft, mi, °F)')]])}
            </fieldset>
          </section>

          <section class="card" aria-labelledby="set-live">
            <h2 class="card-title" id="set-live">${U.esc(t('Live demo'))}</h2>
            <div class="setting">
              <div class="setting__text"><span class="setting__label">${U.esc(t('Live data'))}</span><span class="setting__hint" id="set-pause-hint">${U.esc(pauseHint(s.paused))}</span></div>
              <button type="button" class="btn btn-secondary btn-sm" id="set-pause" data-action="toggle-pause">${pauseLabel(s.paused)}</button>
            </div>
            <fieldset class="setting setting--stack" data-change="setting" data-key="speed">
              <legend class="setting__label">${U.esc(t('Demo speed'))}</legend>
              ${radios('speed', s.speed, C.SIM_SPEEDS.map((v) => [v, v + '×']))}
            </fieldset>
            <fieldset class="setting setting--stack" data-change="setting" data-key="chattiness">
              <legend class="setting__label">${U.esc(t('How often pets talk'))}</legend>
              ${radios('chattiness', s.chattiness, Object.entries(C.CHATTINESS).map(([k, v]) => [k, t(v.label)]))}
            </fieldset>
            ${settingSwitch('set-quiet', 'quiet', 'Quiet mode', 'Silences every voice box. Translations still appear as text.')}
            ${settingSwitch('set-chime', 'chime', 'Chime before translations', 'A short two-note sound before the voice speaks.')}
            ${settingSwitch('set-announce', 'announce', 'Announce translations to screen readers', 'Reads new translations aloud with your screen reader.')}
            ${settingSwitch('set-zone', 'zoneAlerts', 'Safe-zone alerts', 'Shows a notice when a pet leaves the safe zone on its own.')}
          </section>

          <section class="card" aria-labelledby="set-talk">
            <h2 class="card-title" id="set-talk">${U.esc(t('Talking to pets'))}</h2>
            <div class="setting setting--stack">
              <label class="setting__label" for="set-talk-lang">${U.esc(t('Language you speak'))}</label>
              ${languageSelect('set-talk-lang', 'talkLang', s.talkLang, 'Match the app language')}
              <p class="setting__hint">${U.esc(t('Used when you talk to a pet with the microphone. Pets always answer in their own translator language.'))}</p>
            </div>
            <div class="setting">
              <div class="setting__text"><span class="setting__label">${U.esc(t('Microphone'))}</span><span class="setting__hint">${U.esc(!Paw.voice.canListen
                ? t('Voice input isn’t available in this browser. You can always type to your pet.')
                : s.micConsent ? t('You allowed voice input. Your browser may still ask for microphone permission.') : t('{app} asks before it uses the microphone for the first time.', app))}</span></div>
              ${s.micConsent ? `<button type="button" class="btn btn-secondary btn-sm" id="set-mic-reset" data-action="reset-mic">${U.esc(t('Ask me again'))}</button>` : ''}
            </div>
          </section>

          <section class="card" aria-labelledby="set-data">
            <h2 class="card-title" id="set-data">${U.esc(t('Data and privacy'))}</h2>
            <p class="card-text">${U.esc(Paw.store.storageOk
              ? t('Your pets, settings and logs are saved in this browser on this device. Nothing is sent anywhere.')
              : t('This browser isn’t allowing the app to save data, so changes will be lost when you close the page.'))}</p>
            <div class="button-row">
              <button type="button" class="btn btn-secondary" data-action="export">${u.icon('download')}${U.esc(t('Export logs'))}</button>
              <button type="button" class="btn btn-secondary" data-action="clear-logs">${u.icon('trash')}${U.esc(t('Clear all logs'))}</button>
              <button type="button" class="btn btn-danger-outline" data-action="reset-demo">${u.icon('refresh')}${U.esc(t('Reset the demo'))}</button>
            </div>
            <p class="card-text card-text--muted">${U.esc(t('Reset deletes your pets, logs and settings on this device and brings back the sample pack.'))}</p>
          </section>

          <section class="card legal" aria-labelledby="set-about">
            <h2 class="card-title" id="set-about">${U.esc(t('About and legal'))}</h2>
            <details class="legal__item" open>
              <summary>${U.esc(t('Demo disclaimer'))}</summary>
              <p>${U.esc(t('{app} is a design prototype for a fictional smart collar. It isn’t connected to any device. Locations, heart rate, temperature, breathing, battery levels and translations are all generated by this app.', app))}</p>
              <p>${U.esc(t('Translations are invented for entertainment. They don’t describe what an animal actually thinks or feels.'))}</p>
              <p>${U.esc(t('Health readings aren’t medical or veterinary advice, and this app is not a medical device. If you’re worried about your pet, contact a veterinarian.'))}</p>
            </details>
            <details class="legal__item">
              <summary>${U.esc(t('Privacy'))}</summary>
              <ul>
                <li>${U.esc(t('No account, ads, analytics or cookies.'))}</li>
                <li>${U.esc(t('Pets, settings and logs are saved in this browser’s local storage on this device only. Reset the demo or clear your browser data to delete them.'))}</li>
                <li>${U.esc(t('The app doesn’t use your real location or camera.'))}</li>
                <li>${U.esc(t('The microphone is used only when you tap it to talk to a pet. Your browser turns your speech into text, and some browsers send the audio to their maker to do that. {app} never records or keeps it.', app))}</li>
                <li>${U.esc(t('Fonts, icons, illustrations and the map are bundled with the app, so it doesn’t contact other websites.'))}</li>
                <li>${U.esc(t('Speech uses the voices on your device. If a language has no voice installed, some browsers use an online voice from the browser maker, which receives the text being spoken.'))}</li>
              </ul>
            </details>
            <details class="legal__item">
              <summary>${U.esc(t('Accessibility'))}</summary>
              <p>${U.esc(t('{app} aims to meet WCAG 2.2 level AA. It works with a keyboard and screen readers, shows a visible focus outline, uses colors with enough contrast, follows your reduced-motion setting, lets you pause live updates and offers text versions of the map and every chart.', app))}</p>
              <p>${U.esc(t('If something gets in your way, note the page and what happened and share it with the project team.'))}</p>
            </details>
            <details class="legal__item">
              <summary>${U.esc(t('Credits and licenses'))}</summary>
              <ul>
                <li>${U.esc(t('Illustrations, icons and the map were made for this project.'))}</li>
                <li>${U.esc(t('Typefaces: Inter (Rasmus Andersson and the Inter project authors) and Fredoka (the Fredoka project authors), both used under the SIL Open Font License 1.1. The license texts are in assets/fonts.'))}</li>
                <li>${U.esc(t('Breed names describe the sample pets. All pet names, streets and places on the map are fictional.'))}</li>
                <li>${U.esc(t('Interface translations were written for this demo.'))}</li>
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
        if (btn) btn.innerHTML = pauseLabel(d.value);
        const hint = root.querySelector('#set-pause-hint');
        if (hint) hint.textContent = pauseHint(d.value);
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
