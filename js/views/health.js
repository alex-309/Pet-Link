/* Health: live heart rate (with an ECG-style trace), vitals and history. All simulated. */
(function () {
  'use strict';
  const Paw = (window.Paw = window.Paw || {});
  const C = Paw.config;
  const U = Paw.util;
  const ui = () => Paw.ui;

  const RANGES = { live: 'Last 5 minutes', hour: 'Last hour', day: 'Last 12 hours' };
  let range = 'live';
  let ecg = null;
  let ro = null;
  let chartKey = '';
  let actAt = 0;

  const avg = (arr) => arr.reduce((s, p) => s + p.v, 0) / arr.length;

  function series(pet) {
    if (range === 'live') {
      const r = Paw.sim.runtime(pet.id);
      return r ? r.live.slice(-60) : [];
    }
    const s = Paw.store.state.hr[pet.id];
    if (!s || !s.values.length) return [];
    const pts = s.values.map((v, i) => ({ t: s.start + i * U.MIN, v }));
    if (range === 'hour') return pts.slice(-60);
    const out = [];
    for (let i = 0; i < pts.length; i += 5) {
      const chunk = pts.slice(i, i + 5);
      out.push({ t: chunk[0].t, v: Math.round(avg(chunk)) });
    }
    return out;
  }

  function bucketRows(pts) {
    const size = range === 'live' ? 30e3 : range === 'hour' ? 5 * 60e3 : 3600e3;
    const groups = new Map();
    pts.forEach((p) => {
      const key = Math.floor(p.t / size) * size;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(p.v);
    });
    return Array.from(groups.entries()).map(([t, vs]) => [
      range === 'live' ? new Date(t).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', second: '2-digit' }) : U.fmtTime(t),
      String(Math.round(vs.reduce((a, b) => a + b, 0) / vs.length)),
      String(Math.min.apply(null, vs)),
      String(Math.max.apply(null, vs)),
    ]);
  }

  function drawChart(root, pet, force) {
    const el = root.querySelector('#hr-chart');
    if (!el) return;
    const pts = series(pet);
    const key = range + ':' + pts.length + ':' + (pts.length ? pts[pts.length - 1].t : 0) + ':' + el.clientWidth;
    if (!force && (key === chartKey || Paw.charts.busy(el))) return;
    chartKey = key;
    const [lo, hi] = Paw.sim.restRange(pet);
    Paw.charts.line(el, {
      data: pts,
      band: [lo, hi],
      bandLabel: 'Usual resting range',
      unit: 'bpm',
      color: ui().petColor(pet),
      label: `${ui().possessive(pet.name)} heart rate, ${RANGES[range].toLowerCase()}`,
      height: 220,
      xFormat: (t) => U.fmtTime(t),
      tipFormat: (t) => (range === 'live' ? new Date(t).toLocaleTimeString() : U.fmtTime(t)),
      empty: range === 'live'
        ? 'Collecting live readings. The first points appear within a few seconds.'
        : 'No history yet. Readings build up while the collar is on.',
    });
    const summary = root.querySelector('#hr-summary');
    const table = root.querySelector('#hr-table');
    if (pts.length >= 2) {
      const vs = pts.map((p) => p.v);
      summary.textContent = `${RANGES[range]}: average ${Math.round(avg(pts))} bpm, lowest ${Math.min.apply(null, vs)}, highest ${Math.max.apply(null, vs)}.`;
      table.innerHTML = Paw.charts.table(`${ui().possessive(pet.name)} heart rate, ${RANGES[range].toLowerCase()}`, ['Time', 'Average bpm', 'Lowest', 'Highest'], bucketRows(pts));
    } else {
      summary.textContent = '';
      table.innerHTML = '<p class="empty-note">No readings yet.</p>';
    }
  }

  function drawActivity(root, pet, animate) {
    const el = root.querySelector('#act-chart');
    if (!el) return;
    const st = Paw.store.statsFor(pet.id);
    const total = C.ACTIVITY_ORDER.reduce((s, a) => s + (st.bySec[a] || 0), 0);
    const items = C.ACTIVITY_ORDER.map((a) => ({
      label: C.ACTIVITIES[a].label, icon: C.ACTIVITIES[a].icon, value: st.bySec[a] || 0, display: U.fmtDuration(st.bySec[a] || 0),
    }));
    Paw.charts.bars(el, { items, animate, color: ui().petColor(pet), label: `Time by activity today for ${pet.name}`, empty: 'No activity recorded yet today.' });
    root.querySelector('#act-table').innerHTML = Paw.charts.table(`Time by activity today for ${pet.name}`, ['Activity', 'Time', 'Share of day so far'],
      items.map((i) => [i.label, i.display, total ? Math.round((i.value / total) * 100) + '%' : '0%']));
  }

  // The scale of the resting-range meter.
  function meterScale(pet) {
    const [lo, hi] = Paw.sim.restRange(pet);
    return [Math.floor((lo * 0.6) / 10) * 10, Math.ceil((hi * 1.9) / 10) * 10];
  }
  function updateMeter(root, pet) {
    const mark = root.querySelector('#hr-mark');
    const r = Paw.sim.runtime(pet.id);
    if (!mark || !r) return;
    const [min, max] = meterScale(pet);
    mark.style.left = U.clamp(((r.hr - min) / (max - min)) * 100, 0, 100).toFixed(1) + '%';
  }

  // A scrolling ECG-style trace, drawn on canvas. Static when motion is reduced.
  function startEcg(canvas, petId) {
    const ctx = canvas.getContext('2d');
    const SPEED = 70; // pixels per second
    let w = 0;
    let h = 0;
    let dpr = 1;
    let buf = new Float32Array(1);
    let head = 0;
    let phase = 0;
    let carry = 0;
    let last = performance.now();
    let raf = 0;
    let color = '#e5484d';
    let colorAt = 0;

    const g = (p, c, wdt) => Math.exp(-Math.pow((p - c) / wdt, 2));
    const wave = (p) => 0.12 * g(p, 0.18, 0.035) - 0.12 * g(p, 0.36, 0.012) + g(p, 0.4, 0.014) - 0.22 * g(p, 0.44, 0.014) + 0.25 * g(p, 0.65, 0.05);
    const bpm = () => {
      const r = Paw.sim.runtime(petId);
      return r ? r.hr : 80;
    };
    function advance(n) {
      const step = bpm() / 60 / SPEED;
      for (let i = 0; i < n; i++) {
        phase = (phase + step) % 1;
        buf[head] = wave(phase);
        head = (head + 1) % buf.length;
      }
    }
    function size() {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      w = canvas.clientWidth || 300;
      h = canvas.clientHeight || 72;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      buf = new Float32Array(Math.max(2, Math.round(w)));
      head = 0;
      advance(buf.length); // start with a full trace
    }
    function draw() {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      ctx.beginPath();
      for (let x = 0; x < buf.length; x++) {
        const y = h * 0.64 - buf[(head + x) % buf.length] * h * 0.52;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.stroke();
      const lastY = h * 0.64 - buf[(head + buf.length - 1) % buf.length] * h * 0.52;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(w - 3, lastY, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    function frame(now) {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      if (now - colorAt > 1000) {
        color = getComputedStyle(canvas).getPropertyValue('--heart').trim() || color;
        colorAt = now;
      }
      if (!Paw.store.state.settings.paused && !U.reducedMotion()) {
        const px = dt * SPEED + carry;
        const n = Math.floor(px);
        carry = px - n;
        advance(n);
      }
      draw();
      raf = requestAnimationFrame(frame);
    }
    const onVis = () => {
      cancelAnimationFrame(raf);
      if (!document.hidden) {
        last = performance.now();
        raf = requestAnimationFrame(frame);
      }
    };
    size();
    raf = requestAnimationFrame(frame);
    document.addEventListener('visibilitychange', onVis);
    return {
      resize: size,
      stop() {
        cancelAnimationFrame(raf);
        document.removeEventListener('visibilitychange', onVis);
      },
    };
  }

  function tile(iconName, label, value) {
    return `<div class="tile"><dt class="tile__label">${ui().icon(iconName)}${label}</dt><dd class="tile__value">${value}</dd></div>`;
  }

  Paw.views = Paw.views || {};
  Paw.views.health = {
    title: 'Health',
    render() {
      const pet = Paw.store.selectedPet();
      if (!pet) return Paw.views.noPets('Health');
      const u = ui();
      const [lo, hi] = Paw.sim.restRange(pet);
      const [min, max] = meterScale(pet);
      const band = `left:${(((lo - min) / (max - min)) * 100).toFixed(1)}%;width:${(((hi - lo) / (max - min)) * 100).toFixed(1)}%`;
      const poss = U.esc(u.possessive(pet.name));
      return `<header class="view-head">
          <div class="view-head__text">
            <p class="eyebrow">${u.icon('heart')}Vitals</p>
            <h1 class="view-title" tabindex="-1">${poss} health</h1>
          </div>
          <div class="view-head__actions">
            <button type="button" class="btn btn-secondary" data-action="log-entry" data-type="vet">${u.icon('plus')}Log a health event</button>
          </div>
        </header>
        <div class="health-top" style="--pet:${u.petColor(pet)}">
          <section class="card hr-card" aria-labelledby="hr-title">
            <div class="card-head">
              <h2 class="card-title" id="hr-title">Heart rate</h2>
              ${u.live('hr-status', pet)}
            </div>
            <div class="hr-hero">
              ${u.beatingHeart(pet, 'hr-hero__heart')}
              <p class="hr-hero__value"><span class="hero-num">${u.live('hr', pet)}</span><span class="hr-hero__unit">bpm</span></p>
            </div>
            <canvas class="ecg" id="ecg" aria-hidden="true"></canvas>
            <div class="meter" aria-hidden="true">
              <div class="meter__track"><span class="meter__band" style="${band}"></span><span class="meter__mark" id="hr-mark"></span></div>
              <div class="meter__labels"><span>${min}</span><span>Usual resting range ${lo}–${hi} bpm</span><span>${max}</span></div>
            </div>
            <p class="hr-note">${u.live('hr-note', pet)}</p>
          </section>
          <section class="card vitals-card" aria-labelledby="vitals-title">
            <h2 class="card-title" id="vitals-title">Today so far</h2>
            <dl class="tiles">
              ${tile('route', 'Distance', u.live('dist-today', pet))}
              ${tile('paw', 'Steps', u.live('steps', pet))}
              ${tile('bolt', 'Active time', u.live('active', pet))}
              ${tile('moon', 'Sleep last night', U.esc(U.fmtDuration(Paw.sim.lastNightSleep(pet, Date.now()))))}
              ${tile('thermo', 'Body temperature', u.live('temp', pet))}
              ${tile('wind', 'Breathing', u.live('breath', pet))}
            </dl>
          </section>
        </div>
        <section class="section" aria-labelledby="hrh-title">
          <div class="section-head">
            <h2 class="section-title" id="hrh-title">Heart rate history</h2>
            <fieldset class="segmented" data-change="hr-range">
              <legend class="visually-hidden">Time range</legend>
              ${Object.entries(RANGES).map(([k, v]) => `<label><input type="radio" name="hr-range" value="${k}"${k === range ? ' checked' : ''}><span>${v}</span></label>`).join('')}
            </fieldset>
          </div>
          <div class="card chart-card">
            <div class="chart" id="hr-chart"></div>
            <p class="chart-summary" id="hr-summary"></p>
            <details class="table-view"><summary>Show as a table</summary><div class="table-scroll" id="hr-table" tabindex="0" role="region" aria-label="Heart rate history, table"></div></details>
          </div>
        </section>
        <section class="section" aria-labelledby="act-title">
          <h2 class="section-title" id="act-title">Time by activity today</h2>
          <div class="card">
            <div id="act-chart"></div>
            <details class="table-view"><summary>Show as a table</summary><div class="table-scroll" id="act-table" tabindex="0" role="region" aria-label="Time by activity, table"></div></details>
          </div>
        </section>
        <p class="disclaimer">${u.icon('info')}<span>Simulated readings for demonstration only. This app is not a medical device and doesn’t give veterinary advice. If you’re worried about your pet’s health, contact a veterinarian.</span></p>`;
    },
    mount(root) {
      const pet = Paw.store.selectedPet();
      if (!pet) return;
      chartKey = '';
      drawChart(root, pet, true);
      drawActivity(root, pet, true);
      actAt = Date.now();
      updateMeter(root, pet);
      const canvas = root.querySelector('#ecg');
      if (canvas) ecg = startEcg(canvas, pet.id);
      if (typeof ResizeObserver === 'function') {
        let width = 0;
        ro = new ResizeObserver(() => {
          const el = root.querySelector('#hr-chart');
          if (!el || el.clientWidth === width) return;
          width = el.clientWidth;
          drawChart(root, pet, true);
          if (ecg) ecg.resize();
        });
        ro.observe(root.querySelector('#hr-chart'));
      }
    },
    unmount() {
      if (ecg) ecg.stop();
      if (ro) ro.disconnect();
      ecg = null;
      ro = null;
    },
    tick(root) {
      const pet = Paw.store.selectedPet();
      if (!pet) return;
      updateMeter(root, pet);
      drawChart(root, pet, false);
      if (Date.now() - actAt > 10000) {
        drawActivity(root, pet);
        actAt = Date.now();
      }
    },
    changes: {
      'hr-range': (el, e, root) => {
        range = e.target.value;
        drawChart(root, Paw.store.selectedPet(), true);
      },
    },
  };
})();
