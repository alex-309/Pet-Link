/* The illustrated neighborhood map. It is drawn locally as SVG, so it needs no
   map service, sends no location anywhere and has no tile licensing to worry about. */
(function () {
  'use strict';
  const Paw = (window.Paw = window.Paw || {});
  const C = Paw.config;
  const U = Paw.util;
  const M = C.MAP;
  const ZOOMS = [1, 1.6, 2.5, 4];

  // Place names are translated when drawn; street names stay as they are.
  const LABELS = [
    { text: 'Bark Park', x: 842, y: 125, p: 1 },
    { text: 'Home', x: 345, y: 396, p: 1, home: true },
    { text: 'Willow Ave', x: 110, y: 290, p: 2 },
    { text: 'Maple St', x: 110, y: 560, p: 2 },
    { text: 'Willow Ave', x: 820, y: 290, p: 3 },
    { text: 'Maple St', x: 820, y: 560, p: 3 },
    { text: 'Birch Ln', x: 200, y: 440, p: 2, rotate: true },
    { text: 'Cedar Rd', x: 610, y: 440, p: 2, rotate: true },
    { text: 'Vet clinic', x: 700, y: 360, p: 2 },
    { text: 'Corner café', x: 905, y: 360, p: 3 },
    { text: 'Community garden', x: 815, y: 472, p: 3 },
    { text: 'Backyard', x: 350, y: 455, p: 3 },
  ];

  function baseLayer() {
    let s = `<rect class="m-ground" width="${M.width}" height="${M.height}"/>`;
    M.blocks.forEach(([x, y, w, h]) => { s += `<rect class="m-block" x="${x}" y="${y}" width="${w}" height="${h}" rx="10"/>`; });
    const P = M.park;
    s += `<rect class="m-park" x="${P.x}" y="${P.y}" width="${P.w}" height="${P.h}" rx="18"/>`;
    s += '<ellipse class="m-path" cx="842" cy="125" rx="105" ry="78"/><path class="m-path" d="M634 262 700 222 737 172"/>';
    const W = M.pond;
    s += `<ellipse class="m-water" cx="${W.cx}" cy="${W.cy}" rx="${W.rx}" ry="${W.ry}"/>`;
    const G = M.garden;
    s += `<rect class="m-garden" x="${G.x}" y="${G.y}" width="${G.w}" height="${G.h}" rx="10"/>`;
    for (let i = 0; i < 4; i++) s += `<rect class="m-bed" x="${G.x + 16}" y="${G.y + 14 + i * 22}" width="${G.w - 32}" height="11" rx="5.5"/>`;
    M.roads.forEach((r) => { s += `<line class="m-road-edge" x1="${r.x1}" y1="${r.y1}" x2="${r.x2}" y2="${r.y2}"/>`; });
    M.roads.forEach((r) => { s += `<line class="m-road" x1="${r.x1}" y1="${r.y1}" x2="${r.x2}" y2="${r.y2}"/>`; });
    M.roads.forEach((r) => { s += `<line class="m-road-mid" x1="${r.x1}" y1="${r.y1}" x2="${r.x2}" y2="${r.y2}"/>`; });
    M.houses.forEach(([x, y, w, h]) => {
      s += `<rect class="m-house" x="${x}" y="${y}" width="${w}" height="${h}" rx="4"/>`;
      s += `<line class="m-ridge" x1="${x + 7}" y1="${y + h / 2}" x2="${x + w - 7}" y2="${y + h / 2}"/>`;
    });
    const Y = M.backyard;
    s += `<rect class="m-yard" x="${Y.x}" y="${Y.y}" width="${Y.w}" height="${Y.h}" rx="8"/>`;
    const H = M.homeHouse;
    s += `<rect class="m-home" x="${H.x}" y="${H.y}" width="${H.w}" height="${H.h}" rx="6"/>`;
    s += `<line class="m-home-ridge" x1="${H.x + 9}" y1="${H.y + H.h / 2}" x2="${H.x + H.w - 9}" y2="${H.y + H.h / 2}"/>`;
    M.pois.forEach((p) => { s += `<rect class="m-poi" x="${p.x - p.w / 2}" y="${p.y - p.h / 2}" width="${p.w}" height="${p.h}" rx="6"/>`; });
    M.trees.forEach(([x, y, r]) => {
      s += `<circle class="m-tree" cx="${x}" cy="${y}" r="${r}"/><circle class="m-tree-top" cx="${x - r * 0.25}" cy="${y - r * 0.25}" r="${(r * 0.55).toFixed(1)}"/>`;
    });
    return s;
  }

  function labelsLayer() {
    return LABELS.map((l) => {
      const rot = l.rotate ? ` transform="rotate(-90 ${l.x} ${l.y})"` : '';
      return `<text class="m-label m-label--p${l.p}${l.home ? ' m-label--home' : ''}" x="${l.x}" y="${l.y}" text-anchor="middle" dy="0.35em"${rot}>${U.esc(Paw.i18n.t(l.text))}</text>`;
    }).join('');
  }

  function markerMarkup(pet) {
    return `<g class="m-marker" data-pet="${U.esc(pet.id)}" style="--pet:var(--pet-${pet.slot})">
      <circle class="m-marker__pulse" r="24"/>
      <circle class="m-marker__ring" r="18"/>
      <svg class="m-marker__face" x="-15" y="-15" width="30" height="30" viewBox="0 0 100 100">${Paw.avatars.inner(pet, 'calm')}</svg>
      <g class="m-marker__tag" transform="translate(0 32)"><rect class="m-marker__tag-bg" x="-30" y="-10" width="60" height="20" rx="10"/><text class="m-marker__name" text-anchor="middle" dy="0.35em">${U.esc(pet.name)}</text></g>
    </g>`;
  }

  /* opts: { selectedId, onSelect(id), onFollowChange(follow) } */
  function create(container, opts) {
    const o = opts || {};
    container.innerHTML = `<svg class="map-svg" viewBox="0 0 ${M.width} ${M.height}" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false">
      <g class="m-base">${baseLayer()}</g>
      <g class="m-zone"><circle class="m-zone__fill" cx="${M.zoneCenter.x}" cy="${M.zoneCenter.y}" r="0"/><circle class="m-zone__line" cx="${M.zoneCenter.x}" cy="${M.zoneCenter.y}" r="0" vector-effect="non-scaling-stroke"/></g>
      <g class="m-trails"></g>
      <g class="m-labels">${labelsLayer()}</g>
      <g class="m-markers"></g>
    </svg>`;
    const svg = container.firstElementChild;
    const trailsG = svg.querySelector('.m-trails');
    const markersG = svg.querySelector('.m-markers');
    const labelsG = svg.querySelector('.m-labels');
    const zoneCircles = svg.querySelectorAll('.m-zone circle');

    const narrow = container.clientWidth < 600;
    const view = { cx: M.zoneCenter.x, cy: M.zoneCenter.y, zoom: narrow ? 1.6 : 1 };
    let follow = narrow;
    let selected = o.selectedId;
    let k = 1;
    let raf = 0;
    let last = performance.now();
    let drag = null;
    const disp = new Map();
    const markers = new Map();

    function applyView() {
      const vw = M.width / view.zoom;
      const vh = M.height / view.zoom;
      view.cx = U.clamp(view.cx, vw / 2, M.width - vw / 2);
      view.cy = U.clamp(view.cy, vh / 2, M.height - vh / 2);
      svg.setAttribute('viewBox', `${(view.cx - vw / 2).toFixed(1)} ${(view.cy - vh / 2).toFixed(1)} ${vw.toFixed(1)} ${vh.toFixed(1)}`);
      const px = svg.clientWidth || container.clientWidth || 600;
      k = vw / px;
      const ppu = px / vw;
      svg.dataset.detail = ppu >= 0.85 ? '3' : ppu >= 0.55 ? '2' : '1';
      labelsG.style.fontSize = (12 * k).toFixed(2) + 'px';
      labelsG.style.strokeWidth = (3 * k).toFixed(2) + 'px';
      container.classList.toggle('is-zoomed', view.zoom > 1);
    }

    function syncMarkers() {
      const pets = Paw.store.state.pets;
      const ids = new Set(pets.map((p) => p.id));
      markers.forEach((g, id) => {
        if (!ids.has(id)) { g.remove(); markers.delete(id); disp.delete(id); }
      });
      pets.forEach((pet) => {
        let g = markers.get(pet.id);
        if (!g) {
          markersG.insertAdjacentHTML('beforeend', markerMarkup(pet));
          g = markersG.lastElementChild;
          markers.set(pet.id, g);
          const r = Paw.sim.runtime(pet.id);
          if (r) disp.set(pet.id, { x: r.pos.x, y: r.pos.y });
        }
        const text = g.querySelector('.m-marker__name');
        text.textContent = pet.name;
        let w = 0;
        try { w = text.getComputedTextLength(); } catch (e) { w = 0; }
        if (!w) w = pet.name.length * 7;
        const bg = g.querySelector('.m-marker__tag-bg');
        bg.setAttribute('x', (-(w / 2) - 9).toFixed(1));
        bg.setAttribute('width', (w + 18).toFixed(1));
        g.style.setProperty('--pet', `var(--pet-${pet.slot})`);
        g.classList.toggle('is-selected', pet.id === selected);
      });
      const sel = markers.get(selected);
      if (sel) markersG.appendChild(sel); // draw the selected pet on top
      updateTrails();
    }

    function updateTrails() {
      const show = !container.classList.contains('hide-trails');
      let s = '';
      if (show) {
        Paw.store.state.pets.forEach((pet) => {
          const r = Paw.sim.runtime(pet.id);
          const d = disp.get(pet.id);
          if (!r || r.trail.length < 2) return;
          const pts = r.trail.map((p) => p.x + ',' + p.y);
          if (d) pts.push(d.x.toFixed(1) + ',' + d.y.toFixed(1));
          s += `<polyline class="m-trail${pet.id === selected ? ' is-selected' : ''}" style="stroke:var(--pet-${pet.slot})" points="${pts.join(' ')}" vector-effect="non-scaling-stroke"/>`;
        });
      }
      trailsG.innerHTML = s;
    }

    function updateZone() {
      const r = Paw.store.state.settings.safeRadius;
      zoneCircles.forEach((c) => c.setAttribute('r', r));
    }

    function frame(now) {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      const snap = U.reducedMotion();
      const ease = 1 - Math.exp(-dt * 4);
      Paw.store.state.pets.forEach((pet) => {
        const r = Paw.sim.runtime(pet.id);
        const g = markers.get(pet.id);
        if (!r || !g) return;
        let d = disp.get(pet.id);
        if (!d) { d = { x: r.pos.x, y: r.pos.y }; disp.set(pet.id, d); }
        if (snap) { d.x = r.pos.x; d.y = r.pos.y; } else {
          d.x += (r.pos.x - d.x) * ease;
          d.y += (r.pos.y - d.y) * ease;
        }
        g.setAttribute('transform', `translate(${d.x.toFixed(1)} ${d.y.toFixed(1)}) scale(${k.toFixed(3)})`);
      });
      if (follow && view.zoom > 1 && !drag) {
        const d = disp.get(selected);
        if (d) {
          const a = snap ? 1 : 1 - Math.exp(-dt * 3);
          view.cx += (d.x - view.cx) * a;
          view.cy += (d.y - view.cy) * a;
        }
      }
      applyView();
      raf = requestAnimationFrame(frame);
    }

    function startLoop() {
      if (!raf && !document.hidden) {
        last = performance.now();
        raf = requestAnimationFrame(frame);
      }
    }
    function stopLoop() {
      cancelAnimationFrame(raf);
      raf = 0;
    }
    const onVisibility = () => (document.hidden ? stopLoop() : startLoop());
    document.addEventListener('visibilitychange', onVisibility);

    function setFollow(value) {
      follow = value;
      if (o.onFollowChange) o.onFollowChange(follow);
    }

    function zoom(dir) {
      const i = ZOOMS.indexOf(view.zoom);
      const next = ZOOMS[U.clamp((i < 0 ? 0 : i) + dir, 0, ZOOMS.length - 1)];
      if (next === view.zoom) return;
      view.zoom = next;
      if (follow) {
        const d = disp.get(selected);
        if (d) { view.cx = d.x; view.cy = d.y; }
      }
      applyView();
    }

    function pan(dxPx, dyPx) {
      view.cx += dxPx * k;
      view.cy += dyPx * k;
      if (follow) setFollow(false);
      applyView();
    }

    // Pointer: drag to pan (when zoomed in), tap a marker to select that pet.
    svg.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      drag = { x: e.clientX, y: e.clientY, cx: view.cx, cy: view.cy, moved: false, id: e.pointerId };
    });
    svg.addEventListener('pointermove', (e) => {
      if (!drag || view.zoom <= 1) return;
      const dx = e.clientX - drag.x;
      const dy = e.clientY - drag.y;
      if (!drag.moved && Math.hypot(dx, dy) > 5) {
        drag.moved = true;
        try { svg.setPointerCapture(drag.id); } catch (err) { /* ignore */ }
        if (follow) setFollow(false);
      }
      if (drag.moved) {
        view.cx = drag.cx - dx * k;
        view.cy = drag.cy - dy * k;
        applyView();
      }
    });
    const endDrag = (e) => {
      if (drag && !drag.moved && e.type === 'pointerup') {
        const hit = e.target.closest && e.target.closest('.m-marker');
        if (hit && o.onSelect) o.onSelect(hit.dataset.pet);
      }
      drag = null;
    };
    svg.addEventListener('pointerup', endDrag);
    svg.addEventListener('pointercancel', endDrag);

    container.addEventListener('keydown', (e) => {
      const step = 60;
      const keys = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
      if (keys[e.key]) {
        e.preventDefault();
        if (view.zoom === 1) zoom(1);
        pan(keys[e.key][0], keys[e.key][1]);
      } else if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        zoom(1);
      } else if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        zoom(-1);
      }
    });

    const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(() => applyView()) : null;
    if (ro) ro.observe(container);

    function ping(petId) {
      const g = markers.get(petId);
      if (!g) return;
      [0, 450, 900].forEach((delay) => setTimeout(() => {
        const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        c.setAttribute('class', 'm-ping');
        c.setAttribute('r', '18');
        g.insertBefore(c, g.firstChild);
        setTimeout(() => c.remove(), 1800);
      }, delay));
    }

    applyView();
    updateZone();
    syncMarkers();
    startLoop();

    return {
      setSelected(id) {
        selected = id;
        syncMarkers();
        if (follow) {
          const d = disp.get(id);
          if (d && view.zoom > 1) { view.cx = d.x; view.cy = d.y; }
        }
      },
      follow(on) {
        setFollow(on);
        if (on && view.zoom === 1) zoom(1);
      },
      get following() { return follow; },
      zoom,
      ping,
      refresh: syncMarkers,
      tick: updateTrails,
      updateZone,
      destroy() {
        stopLoop();
        document.removeEventListener('visibilitychange', onVisibility);
        if (ro) ro.disconnect();
      },
    };
  }

  Paw.map = { create };
})();
