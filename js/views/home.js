/* Home: the whole pack at a glance. */
(function () {
  'use strict';
  const Paw = (window.Paw = window.Paw || {});
  const C = Paw.config;
  const U = Paw.util;
  const ui = () => Paw.ui;
  const t = (k, v) => Paw.i18n.t(k, v);

  function greeting() {
    const h = new Date().getHours();
    if (h >= 5 && h < 12) return t('Good morning! Here’s your pack.');
    if (h >= 12 && h < 18) return t('Good afternoon! Here’s your pack.');
    return t('Good evening! Here’s your pack.');
  }

  function thoughtBlock(pet, fresh) {
    const r = Paw.sim.runtime(pet.id);
    const last = r && r.lastThought;
    if (!pet.translator.on) {
      return `<p class="thought thought--empty">${ui().icon('volume-off')}${U.esc(t('Translator is off.'))}</p>`;
    }
    if (!last) return `<p class="thought thought--empty">${ui().icon('ear')}${U.esc(t('Listening for the first bark…'))}</p>`;
    return `<figure class="thought${fresh ? ' is-new' : ''}">
        <blockquote class="thought__text" lang="${last.lang}">${U.esc(last.text)}</blockquote>
        <figcaption class="thought__meta">${ui().moodChip(last.mood)}<span data-ago="${last.ts}">${U.esc(U.fmtAgo(last.ts))}</span></figcaption>
      </figure>`;
  }

  function petCard(pet) {
    const u = ui();
    const selected = pet.id === Paw.store.state.selectedPetId;
    const age = pet.age != null ? `<span class="pet-card__age">${U.esc(Paw.i18n.tn(pet.age, '{n} yr', '{n} yrs'))}</span>` : null;
    const meta = [U.esc(pet.breed ? t(pet.breed) : u.speciesName(pet.species)), age].filter(Boolean).join(' · ');
    const pid = U.esc(pet.id);
    const name = U.esc(pet.name);
    const v = { name: pet.name };
    return `<article class="pet-card${selected ? ' is-selected' : ''}" data-card="${pid}" aria-labelledby="pc-${pid}-name" style="--pet:${u.petColor(pet)}">
        <header class="pet-card__head">
          ${u.avatar(pet, 'lg')}
          <div class="pet-card__id">
            <h2 class="pet-card__name" id="pc-${pid}-name"><span class="pet-dot" aria-hidden="true"></span>${name}</h2>
            <p class="pet-card__meta">${meta}</p>
          </div>
          ${u.live('battery', pet)}
        </header>
        <div class="pet-card__thought" id="pc-${pid}-thought">${thoughtBlock(pet)}</div>
        <dl class="pet-card__stats">
          <div class="stat"><dt>${U.esc(t('Heart rate'))}</dt><dd class="stat__hr">${u.beatingHeart(pet)}${u.live('hr', pet, 'strong')}<span class="stat__unit">${U.esc(t('bpm'))}</span></dd></div>
          <div class="stat"><dt>${U.esc(t('Doing'))}</dt><dd>${u.live('activity', pet)}</dd></div>
          <div class="stat stat--wide"><dt>${U.esc(t('Location'))}</dt><dd>${u.live('zone', pet, 'strong')}<span class="stat__sub">${u.live('distance', pet)}</span></dd></div>
        </dl>
        <footer class="pet-card__actions">
          ${u.switchButton({ id: `pc-${pet.id}-tr`, on: pet.translator.on, label: t('Translator'), srLabel: t("{name}’s translator", v), action: 'toggle-translator', petId: pet.id })}
          <div class="pet-card__links">
            <button type="button" class="icon-btn" id="pc-${pid}-play" data-action="replay-latest" data-pet="${pid}" aria-label="${U.esc(t("Play {name}’s latest translation", v))}" title="${U.esc(t('Play latest translation'))}">${u.icon('play')}</button>
            <a class="icon-btn" href="#map" data-action="pick-pet" data-pet="${pid}" aria-label="${U.esc(t('Show {name} on the map', v))}" title="${U.esc(t('Map'))}">${u.icon('pin')}</a>
            <a class="icon-btn" href="#health" data-action="pick-pet" data-pet="${pid}" aria-label="${U.esc(t("{name}’s health", v))}" title="${U.esc(t('Health'))}">${u.icon('heart')}</a>
            <a class="icon-btn" href="#translator" data-action="pick-pet" data-pet="${pid}" aria-label="${U.esc(t("{name}’s translator", v))}" title="${U.esc(t('Translator'))}">${u.icon('chat')}</a>
          </div>
        </footer>
      </article>`;
  }

  const thoughtsToday = (petId) => {
    const since = U.startOfDay();
    return Paw.store.state.logs.filter((l) => l.petId === petId && l.kind === 'thought' && l.ts >= since).length;
  };

  function todayTable(pets) {
    const u = ui();
    return `<div class="table-scroll" tabindex="0" role="region" aria-label="${U.esc(t('Today so far, table'))}"><table class="data-table">
        <caption class="visually-hidden">${U.esc(t('Today so far for each pet'))}</caption>
        <thead><tr><th scope="col">${U.esc(t('Pet'))}</th><th scope="col">${U.esc(t('Distance'))}</th><th scope="col">${U.esc(t('Active'))}</th><th scope="col" class="col-steps">${U.esc(t('Steps'))}</th><th scope="col">${U.esc(t('Translations'))}</th></tr></thead>
        <tbody>${pets.map((p) => `<tr>
          <th scope="row"><span class="cell-pet">${u.avatar(p, 'xs')}${U.esc(p.name)}</span></th>
          <td>${u.live('dist-today', p)}</td><td>${u.live('active', p)}</td><td class="col-steps">${u.live('steps', p)}</td>
          <td data-thought-count="${U.esc(p.id)}">${Paw.i18n.num(thoughtsToday(p.id))}</td></tr>`).join('')}</tbody>
      </table></div>`;
  }

  function feed() {
    const items = Paw.store.state.logs.slice(0, 6);
    if (!items.length) return `<p class="empty-note">${U.esc(t('Nothing logged yet. New activity will show up here.'))}</p>`;
    return `<ol class="log-entries">${items.map((l) => Paw.logItem(l, { showPet: true, compact: true })).join('')}</ol>`;
  }

  function emptyState() {
    const dog = { id: 'empty-dog', species: 'dog', coat: 'golden' };
    const cat = { id: 'empty-cat', species: 'cat', coat: 'ginger' };
    return `<section class="empty-state">
        <div class="empty-state__art" aria-hidden="true">${Paw.avatars.wrap(dog, { size: 'xl', state: 'calm' })}${Paw.avatars.wrap(cat, { size: 'xl', state: 'sleeping' })}</div>
        <h2 class="empty-state__title">${U.esc(t('No pets yet'))}</h2>
        <p class="empty-state__text">${U.esc(t('Add a dog or cat to start a simulated collar for it.'))}</p>
        <div class="empty-state__actions">
          <button type="button" class="btn btn-primary" data-action="add-pet">${ui().icon('plus')}${U.esc(t('Add a pet'))}</button>
          <button type="button" class="btn btn-secondary" data-action="reset-demo">${U.esc(t('Restore the sample pack'))}</button>
        </div>
      </section>`;
  }

  Paw.views = Paw.views || {};
  Paw.views.home = {
    title: 'Home (tab)',
    handlesSelect: true,
    render() {
      const s = Paw.store.state;
      const pets = s.pets;
      const lede = pets.length
        ? Paw.i18n.tn(pets.length, '{n} collar connected. Readings refresh every second.', '{n} collars connected. Readings refresh every second.')
        : t('Start by adding a pet.');
      const head = `<header class="view-head">
          <div class="view-head__text">
            <p class="eyebrow">${U.esc(U.fmtDate(Date.now()))}</p>
            <h1 class="view-title" tabindex="-1">${U.esc(greeting())}</h1>
            <p class="lede">${U.esc(lede)}</p>
          </div>
          <div class="view-head__actions">
            <button type="button" class="btn btn-secondary" data-action="log-entry"${pets.length ? '' : ' disabled'}>${ui().icon('plus')}${U.esc(t('Log activity'))}</button>
            <button type="button" class="btn btn-primary" data-action="add-pet"${pets.length >= C.MAX_PETS ? ' disabled' : ''}>${ui().icon('paw')}${U.esc(t('Add pet'))}</button>
          </div>
        </header>`;
      if (!pets.length) return head + emptyState();
      return head + `
        <section class="pack-grid" aria-label="${U.esc(t('Your pets'))}">${pets.map(petCard).join('')}</section>
        <div class="home-lower">
          <section class="card" aria-labelledby="today-title">
            <h2 class="card-title" id="today-title">${U.esc(t('Today so far'))}</h2>
            ${todayTable(pets)}
          </section>
          <section class="card" aria-labelledby="recent-title">
            <div class="card-head">
              <h2 class="card-title" id="recent-title">${U.esc(t('Recent activity'))}</h2>
              <a class="link" href="#logs">${U.esc(t('See all logs'))}</a>
            </div>
            <div id="home-feed">${feed()}</div>
          </section>
        </div>`;
    },
    on(type, d, root) {
      if (type === 'thought') {
        const pet = Paw.store.getPet(d.petId);
        const box = root.querySelector(`#pc-${CSS.escape(d.petId)}-thought`);
        if (pet && box) box.innerHTML = thoughtBlock(pet, true);
        const cell = root.querySelector(`[data-thought-count="${CSS.escape(d.petId)}"]`);
        if (cell) cell.textContent = Paw.i18n.num(thoughtsToday(d.petId));
      } else if (type === 'translator') {
        const pet = Paw.store.getPet(d.id);
        const box = root.querySelector(`#pc-${CSS.escape(d.id)}-thought`);
        if (pet && box) box.innerHTML = thoughtBlock(pet);
      } else if (type === 'logs') {
        const box = root.querySelector('#home-feed');
        if (box) box.innerHTML = feed();
      } else if (type === 'select') {
        U.$$('.pet-card', root).forEach((card) => card.classList.toggle('is-selected', card.dataset.card === d.id));
      }
    },
  };
})();
