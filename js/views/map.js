/* Map: simulated GPS for every pet, with the selected pet's details. */
(function () {
  'use strict';
  const Paw = (window.Paw = window.Paw || {});
  const U = Paw.util;
  const ui = () => Paw.ui;
  let map = null;

  function side(pet) {
    const u = ui();
    const s = Paw.store.state.settings;
    const poss = U.esc(u.possessive(pet.name));
    return `<section class="card" aria-labelledby="loc-title">
        <div class="card-head">
          <h2 class="card-title" id="loc-title">${poss} location</h2>
          ${u.live('safe', pet)}
        </div>
        <div class="loc">
          ${u.avatar(pet, 'md')}
          <div class="loc__text">
            <p class="loc__zone">${u.live('zone', pet, 'strong')}</p>
            <p class="loc__sub">${u.live('distance', pet)}</p>
          </div>
        </div>
        <dl class="kv">
          <div><dt>Doing</dt><dd>${u.live('activity', pet)}</dd></div>
          <div><dt>Walked today</dt><dd>${u.live('dist-today', pet)}</dd></div>
          <div><dt>GPS accuracy</dt><dd>±3 m, simulated</dd></div>
          <div><dt>Last position</dt><dd>${u.live('fix', pet)}</dd></div>
        </dl>
        <button type="button" class="btn btn-secondary btn-block" id="ping-btn" data-action="ping-collar" data-pet="${U.esc(pet.id)}">${u.icon('bell')}Ping ${poss} collar</button>
      </section>
      <section class="card" aria-labelledby="zone-title">
        <h2 class="card-title" id="zone-title">Safe zone</h2>
        <p class="card-text">Get an alert when a pet leaves this area on its own. Walks and runs with you don’t trigger alerts.</p>
        <div class="field">
          <label class="field__label" for="zone-radius">Radius around home</label>
          <div class="range-row">
            <input type="range" id="zone-radius" min="80" max="300" step="10" value="${s.safeRadius}" data-input="zone-radius" aria-valuetext="${U.esc(U.fmtDistance(s.safeRadius))}" style="--val:${((s.safeRadius - 80) / 220 * 100).toFixed(1)}%">
            <output id="zone-radius-out" for="zone-radius">${U.esc(U.fmtDistance(s.safeRadius))}</output>
          </div>
        </div>
        ${u.switchButton({ id: 'zone-alerts', on: s.zoneAlerts, label: 'Safe-zone alerts', action: 'toggle-setting', key: 'zoneAlerts' })}
      </section>
      <section class="card" aria-labelledby="where-title">
        <h2 class="card-title" id="where-title">Where everyone is</h2>
        <ul class="where">${Paw.store.state.pets.map((p) => `<li>
          <button type="button" class="where__item" id="where-${U.esc(p.id)}" data-action="select-pet" data-pet="${U.esc(p.id)}" aria-pressed="${p.id === pet.id}" style="--pet:${u.petColor(p)}">
            ${u.avatar(p, 'sm')}
            <span class="where__text"><span class="where__name"><span class="pet-dot" aria-hidden="true"></span>${U.esc(p.name)}</span><span class="where__sub">${u.live('zone', p)} · ${u.live('distance', p)}</span></span>
            ${u.live('safe', p)}
          </button></li>`).join('')}</ul>
      </section>`;
  }

  function updateFollowButton(root) {
    const btn = root.querySelector('#map-follow');
    if (btn && map) btn.setAttribute('aria-pressed', map.following ? 'true' : 'false');
  }

  Paw.views = Paw.views || {};
  Paw.views.map = {
    title: 'Map',
    handlesSelect: true,
    render() {
      const pet = Paw.store.selectedPet();
      if (!pet) return Paw.views.noPets('Live map');
      const u = ui();
      const radius = Paw.store.state.settings.safeRadius;
      return `<header class="view-head">
          <div class="view-head__text">
            <p class="eyebrow">${u.icon('pin')}Live location</p>
            <h1 class="view-title" tabindex="-1">Live map</h1>
            <p class="lede">Each collar reports its position every second. Tap a pet to see where it is.</p>
          </div>
        </header>
        <div class="map-layout">
          <section class="card map-card" aria-labelledby="map-card-title">
            <h2 class="visually-hidden" id="map-card-title">Neighborhood map</h2>
            <div class="map-card__bar">
              <div class="map-tools" role="group" aria-label="Map view">
                <button type="button" class="icon-btn" data-action="map-zoom" data-dir="1" aria-label="Zoom in" title="Zoom in">${u.icon('plus')}</button>
                <button type="button" class="icon-btn" data-action="map-zoom" data-dir="-1" aria-label="Zoom out" title="Zoom out">${u.icon('minus')}</button>
                <button type="button" class="btn btn-secondary btn-sm" id="map-follow" data-action="map-follow" aria-pressed="false">${u.icon('target')}<span>Follow <span id="map-follow-name">${U.esc(pet.name)}</span></span></button>
              </div>
              <div class="map-toggles">
                <label class="check"><input type="checkbox" id="map-trails" data-change="map-trails" checked><span>Trails</span></label>
                <label class="check"><input type="checkbox" id="map-zone" data-change="map-zone" checked><span>Safe zone</span></label>
              </div>
            </div>
            <div class="map-frame" id="map-frame" tabindex="0" role="group" aria-roledescription="map" aria-label="Neighborhood map" aria-describedby="map-help"></div>
            <p class="visually-hidden" id="map-help">Arrow keys pan the map and plus or minus zoom. Every pet’s location is also listed under Where everyone is.</p>
            <ul class="map-legend">
              <li><span class="legend-swatch legend-swatch--home" aria-hidden="true"></span>Home</li>
              <li><span class="legend-swatch legend-swatch--zone" aria-hidden="true"></span>Safe zone, <span id="legend-radius">${U.esc(U.fmtDistance(radius))}</span> radius</li>
              <li><span class="legend-swatch legend-swatch--trail" aria-hidden="true"></span>Recent path</li>
            </ul>
          </section>
          <div class="map-side" id="map-side">${side(pet)}</div>
        </div>`;
    },
    mount(root) {
      const frame = root.querySelector('#map-frame');
      if (!frame) return;
      map = Paw.map.create(frame, {
        selectedId: Paw.store.state.selectedPetId,
        onSelect: (id) => Paw.store.selectPet(id),
        onFollowChange: () => updateFollowButton(root),
      });
      updateFollowButton(root);
    },
    unmount() {
      if (map) map.destroy();
      map = null;
    },
    tick() {
      if (map) map.tick();
    },
    on(type, d, root) {
      if (!map) return;
      if (type === 'select') {
        const pet = Paw.store.selectedPet();
        const sideEl = root.querySelector('#map-side');
        const focusId = document.activeElement && sideEl.contains(document.activeElement) ? document.activeElement.id : null;
        sideEl.innerHTML = side(pet);
        if (focusId && document.getElementById(focusId)) document.getElementById(focusId).focus();
        root.querySelector('#map-follow-name').textContent = pet.name;
        map.setSelected(pet.id);
      } else if (type === 'settings' && d.key === 'safeRadius') {
        map.updateZone();
        const text = U.fmtDistance(d.value);
        const out = root.querySelector('#zone-radius-out');
        if (out) out.textContent = text;
        const legend = root.querySelector('#legend-radius');
        if (legend) legend.textContent = text;
      }
    },
    actions: {
      'map-zoom': (el) => map && map.zoom(Number(el.dataset.dir)),
      'map-follow': (el, e, root) => {
        if (!map) return;
        map.follow(!map.following);
        updateFollowButton(root);
      },
      'ping-collar': (el) => map && map.ping(el.dataset.pet),
    },
    changes: {
      'map-trails': (el, e, root) => {
        root.querySelector('#map-frame').classList.toggle('hide-trails', !el.checked);
        if (map) map.tick();
      },
      'map-zone': (el, e, root) => root.querySelector('#map-frame').classList.toggle('hide-zone', !el.checked),
    },
  };
})();
