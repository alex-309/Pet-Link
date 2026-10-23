/* Dialogs: first-run disclaimer, add/edit pet, demo controls, log entry, export. */
(function () {
  'use strict';
  const Paw = (window.Paw = window.Paw || {});
  const C = Paw.config;
  const U = Paw.util;
  const icon = (n, c) => Paw.ui.icon(n, c);
  const closeBtn = '<button type="button" class="icon-btn" data-close aria-label="Close">' + '<svg class="icon" aria-hidden="true" focusable="false"><use href="#i-x"/></svg></button>';
  const chevron = () => icon('chevron-down', 'select__icon');

  // ---- first run ---------------------------------------------------------------------
  function welcome() {
    const dog = { id: 'welcome-dog', species: 'dog', coat: 'golden' };
    const cat = { id: 'welcome-cat', species: 'cat', coat: 'gray' };
    Paw.ui.openDialog({
      className: 'dialog--welcome',
      labelledby: 'welcome-title',
      html: `<div class="dialog__body">
          <div class="welcome__art" aria-hidden="true">
            <span class="avatar-wrap avatar-wrap--lg" style="--coat-bg:#f6ddb4">${Paw.avatars.svg(dog, 'active')}</span>
            <span class="welcome__bubble">${icon('chat')}</span>
            <span class="avatar-wrap avatar-wrap--lg" style="--coat-bg:#d5dae0">${Paw.avatars.svg(cat, 'calm')}</span>
          </div>
          <h2 class="dialog__title welcome__title" id="welcome-title">Welcome to ${U.esc(C.APP_NAME)}</h2>
          <p class="dialog__text">This is a demo app for a pet collar prototype. It isn’t connected to a real device, so everything you see is simulated.</p>
          <ul class="checklist">
            <li>${icon('pin')}<span><strong>Locations are made up.</strong> The map shows a fictional neighborhood.</span></li>
            <li>${icon('heart')}<span><strong>Health numbers are generated.</strong> They aren’t medical or veterinary advice.</span></li>
            <li>${icon('chat')}<span><strong>Translations are invented for fun.</strong> Pets don’t actually speak human languages.</span></li>
            <li>${icon('shield')}<span><strong>Your data stays on this device.</strong> Pets and logs are saved in this browser only.</span></li>
          </ul>
          <p class="dialog__note">${icon('volume')}<span>Translations are read aloud with your device’s voices. Quiet mode and the volume controls can silence them at any time.</span></p>
        </div>
        <div class="dialog__actions">
          <a class="btn btn-tertiary" href="#preferences" data-close>Privacy and legal</a>
          <button type="button" class="btn btn-primary" data-close autofocus>Start the demo</button>
        </div>`,
      onClose() { U.storage.set(C.ACK_KEY, '1'); },
    });
  }

  // ---- add / edit pet ------------------------------------------------------------------
  function petForm(petId) {
    const editing = petId ? Paw.store.getPet(petId) : null;
    if (!editing && Paw.store.state.pets.length >= C.MAX_PETS) {
      Paw.ui.toast(`You can track up to ${C.MAX_PETS} pets in this demo. Remove one in Settings to add another.`, { icon: 'info' });
      return;
    }
    const d = editing || { name: '', species: 'dog', breed: '', size: 'medium', age: null, coat: 'golden', translator: { lang: 'en-US', voice: 'normal' } };
    const radio = (name, value, label, checked, extra) => `<label><input type="radio" name="${name}" value="${value}"${checked ? ' checked' : ''}><span>${extra || ''}${label}</span></label>`;
    Paw.ui.openDialog({
      labelledby: 'pet-form-title',
      html: `<form class="dialog__form" id="pet-form" novalidate>
        <div class="dialog__head">
          <h2 class="dialog__title" id="pet-form-title">${editing ? 'Edit ' + U.esc(editing.name) : 'Add a pet'}</h2>
          ${closeBtn}
        </div>
        <div class="dialog__body form-grid">
          <div class="pet-preview" aria-hidden="true">${Paw.avatars.wrap({ id: 'preview', species: d.species, coat: d.coat }, { size: 'xl', state: 'active' })}</div>
          <div class="field">
            <label class="field__label" for="pet-name">Name</label>
            <input class="input" id="pet-name" name="name" type="text" maxlength="20" autocomplete="off" required value="${U.esc(d.name)}" aria-describedby="pet-name-error">
            <p class="field__error" id="pet-name-error" hidden></p>
          </div>
          <fieldset class="field">
            <legend class="field__label">Species</legend>
            <div class="segmented segmented--wide">
              ${radio('species', 'dog', 'Dog', d.species === 'dog')}
              ${radio('species', 'cat', 'Cat', d.species === 'cat')}
            </div>
          </fieldset>
          <div class="field-row">
            <div class="field">
              <label class="field__label" for="pet-breed">Breed <span class="field__optional">(optional)</span></label>
              <input class="input" id="pet-breed" name="breed" type="text" maxlength="32" autocomplete="off" value="${U.esc(d.breed || '')}">
            </div>
            <div class="field">
              <label class="field__label" for="pet-age">Age in years <span class="field__optional">(optional)</span></label>
              <input class="input" id="pet-age" name="age" type="number" inputmode="numeric" min="0" max="30" step="1" value="${d.age == null ? '' : d.age}" aria-describedby="pet-age-error">
              <p class="field__error" id="pet-age-error" hidden></p>
            </div>
          </div>
          <div class="field" id="pet-size-field"${d.species === 'cat' ? ' hidden' : ''}>
            <label class="field__label" for="pet-size">Size</label>
            <div class="select"><select class="input" id="pet-size" name="size" aria-describedby="pet-size-hint">
              ${Object.entries(C.SIZES).map(([k, v]) => `<option value="${k}"${d.size === k ? ' selected' : ''}>${v}</option>`).join('')}
            </select>${chevron()}</div>
            <p class="field__hint" id="pet-size-hint">Sets the usual heart-rate range the demo compares against.</p>
          </div>
          <fieldset class="field">
            <legend class="field__label">Coat color</legend>
            <div class="swatches">
              ${Object.entries(C.COATS).map(([k, c]) => `<label class="swatch" title="${c.label}"><input type="radio" name="coat" value="${k}"${d.coat === k ? ' checked' : ''}><span class="swatch__dot" style="--swatch:${c.base}"></span><span class="visually-hidden">${c.label}</span></label>`).join('')}
            </div>
          </fieldset>
          <div class="field-row">
            <div class="field">
              <label class="field__label" for="pet-lang">Translator language</label>
              <div class="select"><select class="input" id="pet-lang" name="lang">${Paw.ui.languageOptions(d.translator.lang)}</select>${chevron()}</div>
            </div>
            <div class="field">
              <label class="field__label" for="pet-voice">Voice style</label>
              <div class="select"><select class="input" id="pet-voice" name="voice">
                ${Object.entries(C.VOICE_STYLES).map(([k, v]) => `<option value="${k}"${d.translator.voice === k ? ' selected' : ''}>${v.label}</option>`).join('')}
              </select>${chevron()}</div>
            </div>
          </div>
        </div>
        <div class="dialog__actions">
          <button type="button" class="btn btn-secondary" data-close>Cancel</button>
          <button type="submit" class="btn btn-primary">${editing ? 'Save changes' : 'Add pet'}</button>
        </div>
      </form>`,
      initialFocus: '#pet-name',
      onOpen(el) {
        const form = el.querySelector('#pet-form');
        const preview = el.querySelector('.pet-preview');
        const sizeField = el.querySelector('#pet-size-field');
        const updatePreview = () => {
          const species = form.elements.species.value;
          sizeField.hidden = species === 'cat';
          preview.innerHTML = Paw.avatars.wrap({ id: 'preview', species, coat: form.elements.coat.value }, { size: 'xl', state: 'active' });
        };
        form.addEventListener('change', (e) => {
          if (e.target.name === 'species' || e.target.name === 'coat') updatePreview();
        });
        form.addEventListener('submit', (e) => {
          e.preventDefault();
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
            !name ? 'Enter a name for your pet.' : clash ? `You already have a pet named ${clash.name}. Try a different name.` : '');
          const age = Number(ageRaw);
          setError(form.elements.age, el.querySelector('#pet-age-error'),
            ageRaw && (!Number.isFinite(age) || age < 0 || age > 30) ? 'Enter an age from 0 to 30, or leave it blank.' : '');
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
            translator: { lang: form.elements.lang.value, voice: form.elements.voice.value },
          };
          if (editing) {
            Paw.store.updatePet(editing.id, data);
            Paw.ui.toast(`Saved changes to ${name}.`, { icon: 'check' });
          } else {
            const pet = Paw.store.addPet(data);
            if (pet) Paw.ui.toast(`${name} joined your pack with a simulated collar.`, { icon: 'paw' });
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
      Paw.ui.toast('Add a pet first to use the demo controls.');
      return;
    }
    const acts = [
      ['sleeping', 'Sleep'], ['resting', 'Rest'], ['eating', 'Eat'], ['walking', 'Walk'],
      ['exploring', 'Explore'], ['playing', 'Play'], ['running', 'Run'],
    ];
    const radio = (name, value, label, checked) => `<label><input type="radio" name="${name}" value="${value}"${checked ? ' checked' : ''}><span>${label}</span></label>`;
    Paw.ui.openDialog({
      labelledby: 'demo-title',
      html: `<div class="dialog__head">
          <h2 class="dialog__title" id="demo-title">Demo controls</h2>
          ${closeBtn}
        </div>
        <div class="dialog__body demo">
          <p class="dialog__text">Steer the simulation while you present. Changes apply right away.</p>
          <section class="demo__group" aria-labelledby="demo-pet-h">
            <h3 class="demo__heading" id="demo-pet-h">Choose what a pet does</h3>
            <div class="field">
              <label class="field__label" for="demo-pet">Pet</label>
              <div class="select"><select class="input" id="demo-pet">${Paw.ui.petOptions(pet.id)}</select>${chevron()}</div>
            </div>
            <div class="demo__acts" role="group" aria-label="Activity">
              ${acts.map(([a, l]) => `<button type="button" class="btn btn-secondary btn-sm" data-demo-act="${a}">${icon(C.ACTIVITIES[a].icon)}<span>${l}</span></button>`).join('')}
            </div>
            <div class="demo__acts" role="group" aria-label="Events">
              <button type="button" class="btn btn-secondary btn-sm" data-demo="speak">${icon('chat')}Say something now</button>
              <button type="button" class="btn btn-secondary btn-sm" data-demo="wander">${icon('pin')}Wander past the safe zone</button>
              <button type="button" class="btn btn-secondary btn-sm" data-demo="spook">${icon('umbrella')}Get spooked</button>
              <button type="button" class="btn btn-secondary btn-sm" data-demo="drain">${icon('collar')}Drain battery to 15%</button>
              <button type="button" class="btn btn-secondary btn-sm" data-demo="charge">${icon('bolt')}Charge battery</button>
            </div>
            <p class="dialog__status" id="demo-status" role="status"></p>
          </section>
          <section class="demo__group" aria-labelledby="demo-sim-h">
            <h3 class="demo__heading" id="demo-sim-h">Simulation</h3>
            <fieldset class="field">
              <legend class="field__label">Speed</legend>
              <div class="segmented">${C.SIM_SPEEDS.map((v) => radio('demo-speed', v, v + '×', s.speed === v)).join('')}</div>
            </fieldset>
            <fieldset class="field">
              <legend class="field__label">How often pets talk</legend>
              <div class="segmented">${Object.entries(C.CHATTINESS).map(([k, v]) => radio('demo-chat', k, v.label, s.chattiness === k)).join('')}</div>
            </fieldset>
          </section>
        </div>
        <div class="dialog__actions">
          <button type="button" class="btn btn-secondary" data-demo="pause">${s.paused ? icon('play') + 'Resume live data' : icon('pause') + 'Pause live data'}</button>
          <button type="button" class="btn btn-primary" data-close>Done</button>
        </div>`,
      onOpen(el) {
        const select = el.querySelector('#demo-pet');
        const statusEl = el.querySelector('#demo-status');
        const say = (msg) => { statusEl.textContent = msg; };
        const current = () => Paw.store.getPet(select.value);
        const syncActs = () => {
          const p = current();
          el.querySelector('[data-demo-act="walking"]').hidden = p.species === 'cat';
          el.querySelector('[data-demo-act="running"] span').textContent = p.species === 'cat' ? 'Zoomies' : 'Run';
        };
        syncActs();
        select.addEventListener('change', () => {
          Paw.store.selectPet(select.value);
          syncActs();
        });
        // Listen on this dialog's own content (rebuilt on every open) so handlers never pile up.
        const body = el.querySelector('.demo');
        body.addEventListener('click', (e) => {
          const actBtn = e.target.closest('[data-demo-act]');
          const evBtn = e.target.closest('[data-demo]');
          const p = current();
          if (actBtn) {
            const act = actBtn.dataset.demoAct;
            Paw.sim.forceActivity(p.id, act);
            say(`${p.name} is now ${C.ACTIVITIES[act].label.toLowerCase()}.`);
            return;
          }
          if (!evBtn) return;
          switch (evBtn.dataset.demo) {
            case 'speak':
              if (!p.translator.on) say(`${Paw.ui.possessive(p.name)} translator is off. Turn it on from the Translator page.`);
              else { Paw.sim.think(p.id, { manual: true }); say(`${p.name} said something. Check the Translator page.`); }
              break;
            case 'wander':
              Paw.sim.forceActivity(p.id, 'exploring', { outside: true, duration: 70 });
              say(`${p.name} is wandering off. Watch the map for the safe-zone alert.`);
              break;
            case 'spook': {
              const r = Paw.sim.runtime(p.id);
              const [lo, hi] = Paw.sim.restRange(p);
              if (r) r.hrBoost = (hi - lo) * 0.7;
              if (p.translator.on) Paw.sim.think(p.id, { mood: 'nervous', manual: true });
              say(`${p.name} got spooked. Their heart rate is rising.`);
              break;
            }
            case 'drain':
              Paw.store.setBattery(p.id, 15);
              say(`${Paw.ui.possessive(p.name)} collar battery is at 15%.`);
              break;
            case 'charge':
              Paw.store.setBattery(p.id, 100);
              say(`${Paw.ui.possessive(p.name)} collar is fully charged.`);
              break;
            default:
          }
        });
        const pauseBtn = el.querySelector('[data-demo="pause"]');
        pauseBtn.addEventListener('click', () => {
          const paused = !Paw.store.state.settings.paused;
          Paw.app.setPaused(paused);
          pauseBtn.innerHTML = paused ? icon('play') + 'Resume live data' : icon('pause') + 'Pause live data';
          say(paused ? 'Live data paused.' : 'Live data resumed.');
        });
        body.addEventListener('change', (e) => {
          if (e.target.name === 'demo-speed') Paw.store.setSetting('speed', Number(e.target.value));
          if (e.target.name === 'demo-chat') Paw.store.setSetting('chattiness', e.target.value);
        });
      },
    });
  }

  // ---- manual log entry ------------------------------------------------------------------
  function logEntry(preset) {
    const pet = Paw.store.selectedPet();
    if (!pet) {
      Paw.ui.toast('Add a pet first, then you can log activities for it.');
      return;
    }
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const type = preset && C.LOG_TYPES[preset] ? preset : 'walk';
    Paw.ui.openDialog({
      labelledby: 'log-form-title',
      html: `<form class="dialog__form" id="log-form" novalidate>
        <div class="dialog__head">
          <h2 class="dialog__title" id="log-form-title">Log an activity</h2>
          ${closeBtn}
        </div>
        <div class="dialog__body form-grid">
          <div class="field">
            <label class="field__label" for="log-pet">Pet</label>
            <div class="select"><select class="input" id="log-pet" name="pet">${Paw.ui.petOptions(pet.id)}</select>${chevron()}</div>
          </div>
          <fieldset class="field">
            <legend class="field__label">What happened?</legend>
            <div class="type-grid">
              ${C.MANUAL_TYPES.map((t) => `<label class="type-card"><input type="radio" name="type" value="${t}"${t === type ? ' checked' : ''}><span>${icon(C.LOG_TYPES[t].icon)}${C.LOG_TYPES[t].label}</span></label>`).join('')}
            </div>
          </fieldset>
          <div class="field-row">
            <div class="field">
              <label class="field__label" for="log-time">Time</label>
              <input class="input" type="time" id="log-time" name="time" value="${pad(now.getHours())}:${pad(now.getMinutes())}" required aria-describedby="log-time-error">
              <p class="field__error" id="log-time-error" hidden></p>
            </div>
            <div class="field">
              <label class="field__label" for="log-duration">Minutes <span class="field__optional">(optional)</span></label>
              <input class="input" type="number" inputmode="numeric" id="log-duration" name="duration" min="0" max="600" step="1" aria-describedby="log-duration-error">
              <p class="field__error" id="log-duration-error" hidden></p>
            </div>
          </div>
          <div class="field">
            <label class="field__label" for="log-note">Note <span class="field__optional">(optional)</span></label>
            <textarea class="input" id="log-note" name="note" rows="3" maxlength="200" aria-describedby="log-note-count"></textarea>
            <p class="field__hint" id="log-note-count">Up to 200 characters.</p>
          </div>
        </div>
        <div class="dialog__actions">
          <button type="button" class="btn btn-secondary" data-close>Cancel</button>
          <button type="submit" class="btn btn-primary">Save entry</button>
        </div>
      </form>`,
      initialFocus: '#log-pet',
      onOpen(el) {
        const form = el.querySelector('#log-form');
        const note = form.elements.note;
        const count = el.querySelector('#log-note-count');
        note.addEventListener('input', () => { count.textContent = `${note.value.length} of 200 characters.`; });
        form.addEventListener('submit', (e) => {
          e.preventDefault();
          const timeErr = el.querySelector('#log-time-error');
          const durErr = el.querySelector('#log-duration-error');
          const [h, m] = form.elements.time.value.split(':').map(Number);
          const durRaw = form.elements.duration.value.trim();
          const dur = Number(durRaw);
          const timeBad = !form.elements.time.value || isNaN(h) || isNaN(m);
          const durBad = durRaw !== '' && (!Number.isFinite(dur) || dur < 0 || dur > 600);
          const flag = (input, bad) => (bad ? input.setAttribute('aria-invalid', 'true') : input.removeAttribute('aria-invalid'));
          timeErr.textContent = timeBad ? 'Enter the time it happened, like 7:30 AM.' : '';
          timeErr.hidden = !timeBad;
          flag(form.elements.time, timeBad);
          durErr.textContent = durBad ? 'Enter minutes from 0 to 600, or leave it blank.' : '';
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
          const t = form.elements.type.value;
          const p = Paw.store.getPet(form.elements.pet.value);
          Paw.store.addLog({
            kind: 'activity', type: t, petId: p.id, ts, title: C.LOG_TYPES[t].label,
            note: note.value.trim().slice(0, 200), durationSec: durRaw === '' ? 0 : Math.round(dur * 60), source: 'manual',
          });
          Paw.ui.toast(`Logged ${C.LOG_TYPES[t].label.toLowerCase()} for ${p.name}.`, { icon: 'check' });
          Paw.ui.closeDialog('saved');
        });
      },
    });
  }

  // ---- export -------------------------------------------------------------------------------
  function logsCSV() {
    const header = ['time', 'pet', 'kind', 'type', 'mood', 'title', 'text', 'language', 'heard', 'duration_min', 'distance_m', 'note', 'source'];
    const rows = Paw.store.state.logs.map((l) => {
      const pet = Paw.store.getPet(l.petId);
      return [
        new Date(l.ts).toISOString(), pet ? pet.name : '', l.kind, l.type || '', l.mood || '', l.title || '',
        l.text || '', l.lang || '', l.sound || '', l.durationSec ? Math.round(l.durationSec / 60) : '',
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
          <h2 class="dialog__title" id="export-title">Export logs</h2>
          ${closeBtn}
        </div>
        <div class="dialog__body form-grid">
          <p class="dialog__text">Save your pack’s logs to keep or share. Exports contain simulated demo data.</p>
          <fieldset class="field">
            <legend class="field__label">Format</legend>
            <div class="segmented segmented--wide">
              <label><input type="radio" name="fmt" value="csv" checked><span>Spreadsheet (CSV)</span></label>
              <label><input type="radio" name="fmt" value="json"><span>Everything (JSON)</span></label>
            </div>
          </fieldset>
          <p class="field__hint">CSV has one row per log entry. JSON also includes your pets and settings.</p>
          <p class="dialog__status" id="export-status" role="status"></p>
        </div>
        <div class="dialog__actions">
          <button type="button" class="btn btn-secondary" id="export-copy">${icon('copy')}Copy to clipboard</button>
          ${canSave ? `<button type="button" class="btn btn-primary" id="export-save">${icon('download')}Download</button>` : ''}
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
          statusEl.textContent = ok ? 'Copied. Paste it into a spreadsheet or text file.' : 'Your browser blocked copying. Try Download instead.';
        });
        const saveBtn = el.querySelector('#export-save');
        if (saveBtn) {
          saveBtn.addEventListener('click', async () => {
            const c = content();
            const result = await U.saveFile(c.name, c.text, c.mime);
            statusEl.textContent = result === 'saved' ? `Saved ${c.name}.` : result === 'declined' ? 'Download canceled.' : 'Downloads aren’t available here. Use Copy to clipboard instead.';
          });
        }
      },
    });
  }

  Paw.dialogs = { welcome, petForm, demoControls, logEntry, exportData };
})();
