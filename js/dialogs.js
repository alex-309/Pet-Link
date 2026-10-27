/* Dialogs: first-run disclaimer, add/edit pet, demo controls, log entry, export. */
(function () {
  'use strict';
  const Paw = (window.Paw = window.Paw || {});
  const C = Paw.config;
  const U = Paw.util;
  const icon = (n, c) => Paw.ui.icon(n, c);
  const t = (k, v) => Paw.i18n.t(k, v);
  const e = (k, v) => U.esc(t(k, v)); // translated and escaped for markup
  const closeBtn = () => `<button type="button" class="icon-btn" data-close aria-label="${e('Close')}"><svg class="icon" aria-hidden="true" focusable="false"><use href="#i-x"/></svg></button>`;
  const chevron = () => icon('chevron-down', 'select__icon');

  // ---- first run ---------------------------------------------------------------------
  // A language picker for the first screen, so nobody has to read English to get started.
  function languageField(id) {
    return `<label class="welcome__lang">
        ${icon('globe')}<span class="visually-hidden">${e('Language')}</span>
        <select class="welcome__lang-select" id="${id}">${C.LANGUAGES.map((l) => `<option value="${l.short}" lang="${l.code}"${l.short === Paw.i18n.lang ? ' selected' : ''}>${U.esc(l.label)}</option>`).join('')}</select>
        ${icon('chevron-down')}
      </label>`;
  }

  // focusLanguage: reopening after a language change keeps focus on the picker.
  function welcome(focusLanguage) {
    const dog = { id: 'welcome-dog', species: 'dog', coat: 'golden' };
    const cat = { id: 'welcome-cat', species: 'cat', coat: 'gray' };
    let switching = false; // reopening in another language isn't the person dismissing it
    Paw.ui.openDialog({
      className: 'dialog--welcome',
      labelledby: 'welcome-title',
      html: `<div class="dialog__body">
          <div class="welcome__top">${languageField('welcome-lang')}</div>
          <div class="welcome__art" aria-hidden="true">
            <span class="avatar-wrap avatar-wrap--lg" style="--coat-bg:#f6ddb4">${Paw.avatars.svg(dog, 'active')}</span>
            <span class="welcome__bubble">${icon('chat')}</span>
            <span class="avatar-wrap avatar-wrap--lg" style="--coat-bg:#d5dae0">${Paw.avatars.svg(cat, 'calm')}</span>
          </div>
          <h2 class="dialog__title welcome__title" id="welcome-title">${e('Welcome to {app}', { app: C.APP_NAME })}</h2>
          <p class="dialog__text">${e('This is a demo app for a pet collar prototype. It isn’t connected to a real device, so everything you see is simulated.')}</p>
          <ul class="checklist">
            <li>${icon('pin')}<span><strong>${e('Locations are made up.')}</strong> ${e('The map shows a fictional neighborhood.')}</span></li>
            <li>${icon('heart')}<span><strong>${e('Health numbers are generated.')}</strong> ${e('They aren’t medical or veterinary advice.')}</span></li>
            <li>${icon('chat')}<span><strong>${e('Translations are invented for fun.')}</strong> ${e('Pets don’t actually speak human languages.')}</span></li>
            <li>${icon('shield')}<span><strong>${e('Your data stays on this device.')}</strong> ${e('Pets and logs are saved in this browser only.')}</span></li>
          </ul>
          <p class="dialog__note">${icon('volume')}<span>${e('Translations are read aloud with your device’s voices. Quiet mode and the volume controls can silence them at any time.')}</span></p>
        </div>
        <div class="dialog__actions">
          <a class="btn btn-tertiary" href="#preferences" data-close>${e('Privacy and legal')}</a>
          <button type="button" class="btn btn-primary" data-close autofocus>${e('Start the demo')}</button>
        </div>`,
      initialFocus: focusLanguage ? '#welcome-lang' : null,
      onOpen(el) {
        el.querySelector('#welcome-lang').addEventListener('change', (ev) => {
          switching = true;
          Paw.store.setSetting('uiLang', ev.target.value);
          Paw.ui.closeDialog();
          welcome(true);
        });
      },
      onClose() { if (!switching) U.storage.set(C.ACK_KEY, '1'); },
    });
  }

  // ---- add / edit pet ------------------------------------------------------------------
  function petForm(petId) {
    const editing = petId ? Paw.store.getPet(petId) : null;
    if (!editing && Paw.store.state.pets.length >= C.MAX_PETS) {
      Paw.ui.toast(t('You can track up to {n} pets in this demo. Remove one in Settings to add another.', { n: C.MAX_PETS }), { icon: 'info' });
      return;
    }
    // A new pet's translator starts in the app's language.
    const d = editing || { name: '', species: 'dog', breed: '', size: 'medium', age: null, coat: 'golden', translator: { lang: Paw.i18n.locale, voice: 'normal' } };
    const swatches = (species, selected) => {
      const coats = C.SPECIES[species].coats;
      const pick = coats.indexOf(selected) !== -1 ? selected : coats[0];
      return coats.map((k) => {
        const c = C.COATS[k];
        return `<label class="swatch" title="${e(c.label)}"><input type="radio" name="coat" value="${k}"${k === pick ? ' checked' : ''}><span class="swatch__dot" style="--swatch:${c.base}"></span><span class="visually-hidden">${e(c.label)}</span></label>`;
      }).join('');
    };
    const speciesCards = C.SPECIES_ORDER.map((k) => {
      const sp = C.SPECIES[k];
      const face = Paw.avatars.wrap({ id: 'pick-' + k, species: k, coat: sp.coats[0] }, { size: 'sm', state: 'calm' });
      return `<label class="species-card"><input type="radio" name="species" value="${k}"${d.species === k ? ' checked' : ''}><span>${face}${e(sp.label)}</span></label>`;
    }).join('');
    Paw.ui.openDialog({
      labelledby: 'pet-form-title',
      html: `<form class="dialog__form" id="pet-form" novalidate>
        <div class="dialog__head">
          <h2 class="dialog__title" id="pet-form-title">${editing ? e('Edit {name}', { name: editing.name }) : e('Add a pet')}</h2>
          ${closeBtn()}
        </div>
        <div class="dialog__body form-grid">
          <div class="pet-preview" aria-hidden="true">${Paw.avatars.wrap({ id: 'preview', species: d.species, coat: d.coat }, { size: 'xl', state: 'active' })}</div>
          <div class="field">
            <label class="field__label" for="pet-name">${e('Name')}</label>
            <input class="input" id="pet-name" name="name" type="text" maxlength="20" autocomplete="off" required value="${U.esc(d.name)}" aria-describedby="pet-name-error">
            <p class="field__error" id="pet-name-error" hidden></p>
          </div>
          <fieldset class="field">
            <legend class="field__label">${e('Kind of pet')}</legend>
            <div class="species-grid">${speciesCards}</div>
          </fieldset>
          <div class="field-row">
            <div class="field">
              <label class="field__label" for="pet-breed">${e('Breed')} <span class="field__optional">${e('(optional)')}</span></label>
              <input class="input" id="pet-breed" name="breed" type="text" maxlength="32" autocomplete="off" value="${U.esc(d.breed || '')}" placeholder="${e('For example, {breed}', { breed: t(C.SPECIES[d.species].breedHint) })}">
            </div>
            <div class="field">
              <label class="field__label" for="pet-age">${e('Age in years')} <span class="field__optional">${e('(optional)')}</span></label>
              <input class="input" id="pet-age" name="age" type="number" inputmode="numeric" min="0" max="30" step="1" value="${d.age == null ? '' : d.age}" aria-describedby="pet-age-error">
              <p class="field__error" id="pet-age-error" hidden></p>
            </div>
          </div>
          <div class="field" id="pet-size-field"${C.SPECIES[d.species].sizes ? '' : ' hidden'}>
            <label class="field__label" for="pet-size">${e('Size')}</label>
            <div class="select"><select class="input" id="pet-size" name="size" aria-describedby="pet-size-hint">
              ${Object.entries(C.SIZES).map(([k, v]) => `<option value="${k}"${d.size === k ? ' selected' : ''}>${e(v)}</option>`).join('')}
            </select>${chevron()}</div>
            <p class="field__hint" id="pet-size-hint">${e('Sets the usual heart-rate range the demo compares against.')}</p>
          </div>
          <fieldset class="field">
            <legend class="field__label">${e('Color')}</legend>
            <div class="swatches" id="pet-swatches">${swatches(d.species, d.coat)}</div>
          </fieldset>
          <div class="field-row">
            <div class="field">
              <label class="field__label" for="pet-lang">${e('Translator language')}</label>
              <div class="select"><select class="input" id="pet-lang" name="lang">${Paw.ui.languageOptions(d.translator.lang)}</select>${chevron()}</div>
            </div>
            <div class="field">
              <label class="field__label" for="pet-voice">${e('Voice style')}</label>
              <div class="select"><select class="input" id="pet-voice" name="voice">
                ${Object.entries(C.VOICE_STYLES).map(([k, v]) => `<option value="${k}"${d.translator.voice === k ? ' selected' : ''}>${e(v.label)}</option>`).join('')}
              </select>${chevron()}</div>
            </div>
          </div>
        </div>
        <div class="dialog__actions">
          <button type="button" class="btn btn-secondary" data-close>${e('Cancel')}</button>
          <button type="submit" class="btn btn-primary">${editing ? e('Save changes') : e('Add pet')}</button>
        </div>
      </form>`,
      initialFocus: '#pet-name',
      onOpen(el) {
        const form = el.querySelector('#pet-form');
        const preview = el.querySelector('.pet-preview');
        const sizeField = el.querySelector('#pet-size-field');
        const updatePreview = () => {
          preview.innerHTML = Paw.avatars.wrap({ id: 'preview', species: form.elements.species.value, coat: form.elements.coat.value }, { size: 'xl', state: 'active' });
        };
        let lastSpecies = d.species;
        form.addEventListener('change', (ev) => {
          if (ev.target.name === 'species') {
            const sp = C.SPECIES[ev.target.value];
            sizeField.hidden = !sp.sizes;
            el.querySelector('#pet-swatches').innerHTML = swatches(ev.target.value, form.elements.coat.value);
            form.elements.breed.placeholder = t('For example, {breed}', { breed: t(sp.breedHint) });
            // Suggest a fitting voice unless the person already picked a different one.
            if (form.elements.voice.value === C.SPECIES[lastSpecies].voice) form.elements.voice.value = sp.voice;
            lastSpecies = ev.target.value;
          }
          if (ev.target.name === 'species' || ev.target.name === 'coat') updatePreview();
        });
        form.addEventListener('submit', (ev) => {
          ev.preventDefault();
          const name = form.elements.name.value.trim();
          const ageRaw = form.elements.age.value.trim();
          const errors = [];
          const setError = (input, errEl, msg) => {
            errEl.textContent = msg || '';
            errEl.hidden = !msg;
            if (msg) {
              input.setAttribute('aria-invalid', 'true');
              errors.push(input);
            } else {
              input.removeAttribute('aria-invalid');
            }
          };
          const clash = Paw.store.state.pets.find((p) => p.name.toLowerCase() === name.toLowerCase() && (!editing || p.id !== editing.id));
          setError(form.elements.name, el.querySelector('#pet-name-error'),
            !name ? t('Enter a name for your pet.') : clash ? t('You already have a pet named {name}. Try a different name.', { name: clash.name }) : '');
          const age = Number(ageRaw);
          setError(form.elements.age, el.querySelector('#pet-age-error'),
            ageRaw && (!Number.isFinite(age) || age < 0 || age > 30) ? t('Enter an age from 0 to 30, or leave it blank.') : '');
          if (errors.length) {
            errors[0].focus();
            return;
          }
          const data = {
            name,
            species: form.elements.species.value,
            breed: form.elements.breed.value,
            size: form.elements.size.value,
            age: ageRaw === '' ? null : age,
            coat: form.elements.coat.value,
            translator: Object.assign({ lang: form.elements.lang.value, voice: form.elements.voice.value },
              editing && editing.translator.lang !== form.elements.lang.value ? { voiceName: '' } : {}),
          };
          if (editing) {
            Paw.store.updatePet(editing.id, data);
            Paw.ui.toast(t('Saved changes to {name}.', { name }), { icon: 'check' });
          } else {
            const pet = Paw.store.addPet(data);
            if (pet) Paw.ui.toast(t('{name} joined your pack with a simulated collar.', { name }), { icon: 'paw' });
          }
          Paw.ui.closeDialog('saved');
        });
      },
    });
  }

  // ---- demo controls -------------------------------------------------------------------
  function demoControls() {
    const s = Paw.store.state.settings;
    const pet = Paw.store.selectedPet();
    if (!pet) {
      Paw.ui.toast(t('Add a pet first to use the demo controls.'));
      return;
    }
    const acts = C.ACTIVITY_ORDER;
    const radio = (name, value, label, checked) => `<label><input type="radio" name="${name}" value="${value}"${checked ? ' checked' : ''}><span>${U.esc(label)}</span></label>`;
    const pauseLabel = (paused) => (paused ? icon('play') + e('Resume live data') : icon('pause') + e('Pause live data'));
    Paw.ui.openDialog({
      labelledby: 'demo-title',
      html: `<div class="dialog__head">
          <h2 class="dialog__title" id="demo-title">${e('Demo controls')}</h2>
          ${closeBtn()}
        </div>
        <div class="dialog__body demo">
          <p class="dialog__text">${e('Steer the simulation while you present. Changes apply right away.')}</p>
          <section class="demo__group" aria-labelledby="demo-pet-h">
            <h3 class="demo__heading" id="demo-pet-h">${e('Choose what a pet does')}</h3>
            <div class="field">
              <label class="field__label" for="demo-pet">${e('Pet')}</label>
              <div class="select"><select class="input" id="demo-pet">${Paw.ui.petOptions(pet.id)}</select>${chevron()}</div>
            </div>
            <div class="demo__acts" role="group" aria-label="${e('Activity')}">
              ${acts.map((a) => `<button type="button" class="btn btn-secondary btn-sm" data-demo-act="${a}">${icon(C.ACTIVITIES[a].icon)}<span>${U.esc(Paw.ui.activityName(pet.species, a))}</span></button>`).join('')}
            </div>
            <div class="demo__acts" role="group" aria-label="${e('Events')}">
              <button type="button" class="btn btn-secondary btn-sm" data-demo="speak">${icon('chat')}${e('Say something now')}</button>
              <button type="button" class="btn btn-secondary btn-sm" data-demo="wander">${icon('pin')}${e('Wander past the safe zone')}</button>
              <button type="button" class="btn btn-secondary btn-sm" data-demo="spook">${icon('umbrella')}${e('Get spooked')}</button>
              <button type="button" class="btn btn-secondary btn-sm" data-demo="drain">${icon('collar')}${e('Drain battery to {pct}', { pct: Paw.i18n.num(0.15, { style: 'percent' }) })}</button>
              <button type="button" class="btn btn-secondary btn-sm" data-demo="charge">${icon('bolt')}${e('Charge battery')}</button>
            </div>
            <p class="dialog__status" id="demo-status" role="status"></p>
          </section>
          <section class="demo__group" aria-labelledby="demo-sim-h">
            <h3 class="demo__heading" id="demo-sim-h">${e('Simulation')}</h3>
            <fieldset class="field">
              <legend class="field__label">${e('Speed')}</legend>
              <div class="segmented">${C.SIM_SPEEDS.map((v) => radio('demo-speed', v, v + '×', s.speed === v)).join('')}</div>
            </fieldset>
            <fieldset class="field">
              <legend class="field__label">${e('How often pets talk')}</legend>
              <div class="segmented">${Object.entries(C.CHATTINESS).map(([k, v]) => radio('demo-chat', k, t(v.label), s.chattiness === k)).join('')}</div>
            </fieldset>
          </section>
        </div>
        <div class="dialog__actions">
          <button type="button" class="btn btn-secondary" data-demo="pause">${pauseLabel(s.paused)}</button>
          <button type="button" class="btn btn-primary" data-close>${e('Done')}</button>
        </div>`,
      onOpen(el) {
        const select = el.querySelector('#demo-pet');
        const statusEl = el.querySelector('#demo-status');
        const say = (msg) => { statusEl.textContent = msg; };
        const current = () => Paw.store.getPet(select.value);
        const syncActs = () => {
          const p = current();
          acts.forEach((a) => {
            const btn = el.querySelector(`[data-demo-act="${a}"]`);
            btn.querySelector('span').textContent = Paw.ui.activityName(p.species, a);
            btn.hidden = a === 'walking' && !C.SPECIES[p.species].canWalk;
          });
        };
        syncActs();
        select.addEventListener('change', () => {
          Paw.store.selectPet(select.value);
          syncActs();
        });
        // Listen on this dialog's own content (rebuilt on every open) so handlers never pile up.
        const body = el.querySelector('.demo');
        body.addEventListener('click', (ev) => {
          const actBtn = ev.target.closest('[data-demo-act]');
          const evBtn = ev.target.closest('[data-demo]');
          const p = current();
          if (actBtn) {
            const act = actBtn.dataset.demoAct;
            Paw.sim.forceActivity(p.id, act);
            say(t('{name} switched to {activity}.', { name: p.name, activity: Paw.i18n.lower(Paw.ui.activityName(p.species, act)) }));
            return;
          }
          if (!evBtn) return;
          switch (evBtn.dataset.demo) {
            case 'speak':
              if (!p.translator.on) say(t("{name}’s translator is off. Turn it on from the Translator page.", { name: p.name }));
              else { Paw.sim.think(p.id, { manual: true }); say(t('{name} said something. Check the Translator page.', { name: p.name })); }
              break;
            case 'wander':
              Paw.sim.forceActivity(p.id, 'exploring', { outside: true, duration: 70 });
              say(t('{name} is wandering off. Watch the map for the safe-zone alert.', { name: p.name }));
              break;
            case 'spook': {
              const r = Paw.sim.runtime(p.id);
              const [lo, hi] = Paw.sim.restRange(p);
              if (r) r.hrBoost = (hi - lo) * 0.7;
              if (p.translator.on) Paw.sim.think(p.id, { mood: 'nervous', manual: true });
              say(t('{name} got spooked. Their heart rate is rising.', { name: p.name }));
              break;
            }
            case 'drain':
              Paw.store.setBattery(p.id, 15);
              say(t("{name}’s collar battery is at {pct}.", { name: p.name, pct: Paw.i18n.num(0.15, { style: 'percent' }) }));
              break;
            case 'charge':
              Paw.store.setBattery(p.id, 100);
              say(t("{name}’s collar is fully charged.", { name: p.name }));
              break;
            default:
          }
        });
        const pauseBtn = el.querySelector('[data-demo="pause"]');
        pauseBtn.addEventListener('click', () => {
          const paused = !Paw.store.state.settings.paused;
          Paw.app.setPaused(paused);
          pauseBtn.innerHTML = pauseLabel(paused);
          say(paused ? t('Live data paused.') : t('Live data resumed.'));
        });
        body.addEventListener('change', (ev) => {
          if (ev.target.name === 'demo-speed') Paw.store.setSetting('speed', Number(ev.target.value));
          if (ev.target.name === 'demo-chat') Paw.store.setSetting('chattiness', ev.target.value);
        });
      },
    });
  }

  // ---- manual log entry ------------------------------------------------------------------
  function logEntry(preset) {
    const pet = Paw.store.selectedPet();
    if (!pet) {
      Paw.ui.toast(t('Add a pet first, then you can log activities for it.'));
      return;
    }
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const type = preset && C.LOG_TYPES[preset] ? preset : 'walk';
    Paw.ui.openDialog({
      labelledby: 'log-form-title',
      html: `<form class="dialog__form" id="log-form" novalidate>
        <div class="dialog__head">
          <h2 class="dialog__title" id="log-form-title">${e('Log an activity')}</h2>
          ${closeBtn()}
        </div>
        <div class="dialog__body form-grid">
          <div class="field">
            <label class="field__label" for="log-pet">${e('Pet')}</label>
            <div class="select"><select class="input" id="log-pet" name="pet">${Paw.ui.petOptions(pet.id)}</select>${chevron()}</div>
          </div>
          <fieldset class="field">
            <legend class="field__label">${e('What happened?')}</legend>
            <div class="type-grid">
              ${C.MANUAL_TYPES.map((k) => `<label class="type-card"><input type="radio" name="type" value="${k}"${k === type ? ' checked' : ''}><span>${icon(C.LOG_TYPES[k].icon)}${e(C.LOG_TYPES[k].label)}</span></label>`).join('')}
            </div>
          </fieldset>
          <div class="field-row">
            <div class="field">
              <label class="field__label" for="log-time">${e('Time')}</label>
              <input class="input" type="time" id="log-time" name="time" value="${pad(now.getHours())}:${pad(now.getMinutes())}" required aria-describedby="log-time-error">
              <p class="field__error" id="log-time-error" hidden></p>
            </div>
            <div class="field">
              <label class="field__label" for="log-duration">${e('Minutes')} <span class="field__optional">${e('(optional)')}</span></label>
              <input class="input" type="number" inputmode="numeric" id="log-duration" name="duration" min="0" max="600" step="1" aria-describedby="log-duration-error">
              <p class="field__error" id="log-duration-error" hidden></p>
            </div>
          </div>
          <div class="field">
            <label class="field__label" for="log-note">${e('Note')} <span class="field__optional">${e('(optional)')}</span></label>
            <textarea class="input" id="log-note" name="note" rows="3" maxlength="200" aria-describedby="log-note-count"></textarea>
            <p class="field__hint" id="log-note-count">${e('Up to {n} characters.', { n: 200 })}</p>
          </div>
        </div>
        <div class="dialog__actions">
          <button type="button" class="btn btn-secondary" data-close>${e('Cancel')}</button>
          <button type="submit" class="btn btn-primary">${e('Save entry')}</button>
        </div>
      </form>`,
      initialFocus: '#log-pet',
      onOpen(el) {
        const form = el.querySelector('#log-form');
        const note = form.elements.note;
        const count = el.querySelector('#log-note-count');
        note.addEventListener('input', () => { count.textContent = t('{n} of {max} characters.', { n: note.value.length, max: 200 }); });
        form.addEventListener('submit', (ev) => {
          ev.preventDefault();
          const timeErr = el.querySelector('#log-time-error');
          const durErr = el.querySelector('#log-duration-error');
          const [h, m] = form.elements.time.value.split(':').map(Number);
          const durRaw = form.elements.duration.value.trim();
          const dur = Number(durRaw);
          const timeBad = !form.elements.time.value || isNaN(h) || isNaN(m);
          const durBad = durRaw !== '' && (!Number.isFinite(dur) || dur < 0 || dur > 600);
          const flag = (input, bad) => (bad ? input.setAttribute('aria-invalid', 'true') : input.removeAttribute('aria-invalid'));
          timeErr.textContent = timeBad ? t('Enter the time it happened, like {time}.', { time: U.fmtTime(new Date().setHours(7, 30, 0, 0)) }) : '';
          timeErr.hidden = !timeBad;
          flag(form.elements.time, timeBad);
          durErr.textContent = durBad ? t('Enter minutes from 0 to 600, or leave it blank.') : '';
          durErr.hidden = !durBad;
          flag(form.elements.duration, durBad);
          if (timeBad || durBad) {
            (timeBad ? form.elements.time : form.elements.duration).focus();
            return;
          }
          const when = new Date();
          when.setHours(h, m, 0, 0);
          let ts = when.getTime();
          if (ts > Date.now() + 5 * U.MIN) ts -= U.DAY; // a time later than now means yesterday
          const kind = form.elements.type.value;
          const p = Paw.store.getPet(form.elements.pet.value);
          Paw.store.addLog({
            kind: 'activity', type: kind, petId: p.id, ts, title: C.LOG_TYPES[kind].label,
            note: note.value.trim().slice(0, 200), durationSec: durRaw === '' ? 0 : Math.round(dur * 60), source: 'manual',
          });
          Paw.ui.toast(t('Logged {type} for {name}.', { type: Paw.i18n.lower(t(C.LOG_TYPES[kind].label)), name: p.name }), { icon: 'check' });
          Paw.ui.closeDialog('saved');
        });
      },
    });
  }

  // ---- export -------------------------------------------------------------------------------
  function logsCSV() {
    const header = ['time', 'pet', 'kind', 'type', 'mood', 'title', 'you_said', 'you_said_in_pet_sounds', 'text', 'language', 'heard', 'duration_min', 'distance_m', 'note', 'source'];
    const rows = Paw.store.state.logs.map((l) => {
      const pet = Paw.store.getPet(l.petId);
      return [
        new Date(l.ts).toISOString(), pet ? pet.name : '', l.kind, l.type || '', l.mood || '', l.title || '',
        l.prompt || '', l.promptSounds || '', l.text || '', l.lang || '', l.sound || '', l.durationSec ? Math.round(l.durationSec / 60) : '',
        l.distance || '', l.note || '', l.source || (l.kind === 'thought' ? 'collar' : ''),
      ];
    });
    return [header].concat(rows).map((r) => r.map(U.csvCell).join(',')).join('\r\n');
  }

  async function exportData() {
    const canSave = await U.canSaveFiles();
    Paw.ui.openDialog({
      labelledby: 'export-title',
      html: `<div class="dialog__head">
          <h2 class="dialog__title" id="export-title">${e('Export logs')}</h2>
          ${closeBtn()}
        </div>
        <div class="dialog__body form-grid">
          <p class="dialog__text">${e('Save your pack’s logs to keep or share. Exports contain simulated demo data.')}</p>
          <fieldset class="field">
            <legend class="field__label">${e('Format')}</legend>
            <div class="segmented segmented--wide">
              <label><input type="radio" name="fmt" value="csv" checked><span>${e('Spreadsheet (CSV)')}</span></label>
              <label><input type="radio" name="fmt" value="json"><span>${e('Everything (JSON)')}</span></label>
            </div>
          </fieldset>
          <p class="field__hint">${e('CSV has one row per log entry. JSON also includes your pets and settings.')}</p>
          <p class="dialog__status" id="export-status" role="status"></p>
        </div>
        <div class="dialog__actions">
          <button type="button" class="btn btn-secondary" id="export-copy">${icon('copy')}${e('Copy to clipboard')}</button>
          ${canSave ? `<button type="button" class="btn btn-primary" id="export-save">${icon('download')}${e('Download')}</button>` : ''}
        </div>`,
      onOpen(el) {
        const statusEl = el.querySelector('#export-status');
        const content = () => {
          const fmt = el.querySelector('input[name="fmt"]:checked').value;
          const day = U.dayKey();
          const slug = C.APP_NAME.toLowerCase().replace(/[^a-z0-9]+/g, '-');
          return fmt === 'csv'
            ? { name: `${slug}-logs-${day}.csv`, text: logsCSV(), mime: 'text/csv' }
            : { name: `${slug}-data-${day}.json`, text: Paw.store.exportJSON(), mime: 'application/json' };
        };
        el.querySelector('#export-copy').addEventListener('click', async () => {
          const ok = await U.copyText(content().text);
          statusEl.textContent = ok ? t('Copied. Paste it into a spreadsheet or text file.') : t('Your browser blocked copying. Try Download instead.');
        });
        const saveBtn = el.querySelector('#export-save');
        if (saveBtn) {
          saveBtn.addEventListener('click', async () => {
            const c = content();
            const result = await U.saveFile(c.name, c.text, c.mime);
            statusEl.textContent = result === 'saved' ? t('Saved {file}.', { file: c.name }) : result === 'declined' ? t('Download canceled.') : t('Downloads aren’t available here. Use Copy to clipboard instead.');
          });
        }
      },
    });
  }

  Paw.dialogs = { welcome, petForm, demoControls, logEntry, exportData };
})();
