/* Lightweight, accessible charts: a line chart with a reference band (heart rate)
   and labeled horizontal bars. Every chart also has a table version. */
(function () {
  'use strict';
  const Paw = (window.Paw = window.Paw || {});
  const U = Paw.util;

  function niceScale(lo, hi, count) {
    if (hi - lo < 4) { lo -= 4; hi += 4; }
    const raw = (hi - lo) / count;
    const mag = Math.pow(10, Math.floor(Math.log10(raw)));
    const norm = raw / mag;
    const step = (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 2.5 ? 2.5 : norm <= 5 ? 5 : 10) * mag;
    const min = Math.floor(lo / step) * step;
    const max = Math.ceil(hi / step) * step;
    const ticks = [];
    for (let v = min; v <= max + step / 1000; v += step) ticks.push(Math.round(v));
    return { min, max, ticks };
  }

  function timeTicks(t0, t1, width) {
    const steps = [60e3, 5 * 60e3, 15 * 60e3, 30 * 60e3, 3600e3, 2 * 3600e3, 3 * 3600e3, 6 * 3600e3];
    const most = Math.max(2, Math.floor(width / 96));
    const step = steps.find((s) => (t1 - t0) / s <= most) || steps[steps.length - 1];
    const ticks = [];
    for (let t = Math.ceil(t0 / step) * step; t <= t1; t += step) ticks.push(t);
    return ticks;
  }

  /* opts: { data: [{t, v}], band: [lo, hi], bandLabel, unit, color, label,
             xFormat(t), tipFormat(t), empty, height } */
  function line(el, opts) {
    const data = opts.data.filter((d) => d.v != null);
    if (data.length < 2) {
      el.innerHTML = `<p class="chart-empty">${U.esc(opts.empty || 'Not enough data yet.')}</p>`;
      return;
    }
    const W = Math.max(260, Math.round(el.clientWidth || 600));
    const H = opts.height || 220;
    const pad = { l: 40, r: 44, t: 12, b: 30 };
    const vals = data.map((d) => d.v);
    let lo = Math.min.apply(null, vals);
    let hi = Math.max.apply(null, vals);
    if (opts.band) {
      lo = Math.min(lo, opts.band[0]);
      hi = Math.max(hi, opts.band[1]);
    }
    const sc = niceScale(lo, hi, 4);
    const t0 = data[0].t;
    const t1 = data[data.length - 1].t;
    const X = (t) => pad.l + ((t - t0) / Math.max(1, t1 - t0)) * (W - pad.l - pad.r);
    const Y = (v) => pad.t + (1 - (v - sc.min) / (sc.max - sc.min)) * (H - pad.t - pad.b);
    const base = H - pad.b;
    const f = (n) => n.toFixed(1);

    let s = `<svg class="chart__svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" aria-hidden="true" focusable="false">`;
    sc.ticks.forEach((v) => {
      s += `<line class="chart__grid" x1="${pad.l}" x2="${W - pad.r}" y1="${f(Y(v))}" y2="${f(Y(v))}"/>`;
      s += `<text class="chart__tick" x="${pad.l - 8}" y="${f(Y(v))}" dy="0.32em" text-anchor="end">${v}</text>`;
    });
    if (opts.band) {
      const yt = Y(opts.band[1]);
      const yb = Y(opts.band[0]);
      s += `<rect class="chart__band" x="${pad.l}" y="${f(yt)}" width="${W - pad.l - pad.r}" height="${f(yb - yt)}"/>`;
      if (yb - yt > 18) s += `<text class="chart__band-label" x="${pad.l + 8}" y="${f(yt + 13)}">${U.esc(opts.bandLabel || '')}</text>`;
    }
    s += `<line class="chart__axis" x1="${pad.l}" x2="${W - pad.r}" y1="${base}" y2="${base}"/>`;
    timeTicks(t0, t1, W - pad.l - pad.r).forEach((t) => {
      const x = X(t);
      if (x < pad.l + 14 || x > W - pad.r - 14) return;
      s += `<text class="chart__tick" x="${f(x)}" y="${H - 9}" text-anchor="middle">${U.esc(opts.xFormat(t))}</text>`;
    });
    const pts = data.map((d) => [X(d.t), Y(d.v)]);
    const lineD = 'M' + pts.map((p) => f(p[0]) + ' ' + f(p[1])).join('L');
    const areaD = lineD + `L${f(pts[pts.length - 1][0])} ${base}L${f(pts[0][0])} ${base}Z`;
    s += `<path class="chart__area" d="${areaD}" style="fill:${opts.color}"/>`;
    s += `<path class="chart__line" d="${lineD}" style="stroke:${opts.color}"/>`;
    const last = pts[pts.length - 1];
    s += `<circle class="chart__dot" cx="${f(last[0])}" cy="${f(last[1])}" r="4" style="fill:${opts.color}"/>`;
    s += `<text class="chart__end" x="${f(last[0] + 8)}" y="${f(last[1])}" dy="0.32em">${data[data.length - 1].v}</text>`;
    s += `<g class="chart__hover" visibility="hidden"><line class="chart__cross" y1="${pad.t}" y2="${base}"/><circle class="chart__hdot" r="5" style="fill:${opts.color}"/></g>`;
    s += '</svg>';

    el.innerHTML = `<div class="chart__frame" tabindex="0" role="group" aria-label="${U.esc(opts.label)}. Use the left and right arrow keys to read values.">${s}<div class="chart__tip" role="status" aria-live="polite" hidden></div></div>`;

    const frame = el.firstElementChild;
    const svg = frame.querySelector('svg');
    const hover = svg.querySelector('.chart__hover');
    const cross = hover.querySelector('line');
    const hdot = hover.querySelector('circle');
    const tip = frame.querySelector('.chart__tip');
    let idx = -1;

    function show(i) {
      idx = U.clamp(i, 0, data.length - 1);
      const [x, y] = pts[idx];
      cross.setAttribute('x1', f(x));
      cross.setAttribute('x2', f(x));
      hdot.setAttribute('cx', f(x));
      hdot.setAttribute('cy', f(y));
      hover.setAttribute('visibility', 'visible');
      tip.textContent = '';
      const strong = document.createElement('strong');
      strong.textContent = data[idx].v + ' ' + opts.unit;
      const span = document.createElement('span');
      span.textContent = (opts.tipFormat || opts.xFormat)(data[idx].t);
      tip.append(strong, span);
      tip.hidden = false;
      const scale = svg.getBoundingClientRect().width / W || 1;
      const half = tip.offsetWidth / 2 || 50;
      tip.style.left = U.clamp(x * scale, half, frame.clientWidth - half) + 'px';
      tip.style.top = Math.max(0, y * scale - tip.offsetHeight - 12) + 'px';
      el.dataset.active = '1';
    }
    function hide() {
      hover.setAttribute('visibility', 'hidden');
      tip.hidden = true;
      idx = -1;
      delete el.dataset.active;
    }
    frame.addEventListener('pointermove', (e) => {
      const rect = svg.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * W;
      let best = 0;
      let bd = Infinity;
      for (let i = 0; i < pts.length; i++) {
        const d = Math.abs(pts[i][0] - x);
        if (d < bd) { bd = d; best = i; }
      }
      show(best);
    });
    frame.addEventListener('pointerleave', hide);
    frame.addEventListener('blur', hide);
    frame.addEventListener('keydown', (e) => {
      const keys = { ArrowLeft: -1, ArrowRight: 1 };
      if (e.key in keys) {
        e.preventDefault();
        show(idx < 0 ? data.length - 1 : idx + keys[e.key]);
      } else if (e.key === 'Home' || e.key === 'End') {
        e.preventDefault();
        show(e.key === 'Home' ? 0 : data.length - 1);
      } else if (e.key === 'Escape') {
        hide();
      }
    });
  }

  // True while someone is reading the chart (hover or keyboard), so live updates wait.
  const busy = (el) => !!el && (el.dataset.active === '1' || el.contains(document.activeElement));

  /* Horizontal bars with the value at each bar's tip.
     items: [{ label, value, display, icon }]; zero values are left out of the bars. */
  function bars(el, opts) {
    const items = opts.items.filter((i) => i.value > 0);
    if (!items.length) {
      el.innerHTML = `<p class="chart-empty">${U.esc(opts.empty || 'Nothing to show yet.')}</p>`;
      return;
    }
    const max = Math.max.apply(null, items.map((i) => i.value));
    // One shared label column (sized to the longest label) keeps every bar on the same baseline.
    const longest = Math.max.apply(null, items.map((i) => i.label.length));
    el.innerHTML = `<ul class="bars${opts.animate ? ' bars--animate' : ''}" aria-label="${U.esc(opts.label)}" style="--label-w:calc(${longest}ch + ${items.some((i) => i.icon) ? 28 : 4}px)">${items.map((it) => `
      <li class="bars__row">
        <span class="bars__label">${it.icon ? Paw.ui.icon(it.icon) : ''}${U.esc(it.label)}</span>
        <span class="bars__track">
          <span class="bars__bar" style="--w:${(it.value / max).toFixed(4)};background:${opts.color}"></span>
          <span class="bars__value">${U.esc(it.display)}</span>
        </span>
      </li>`).join('')}</ul>`;
  }

  // rows: array of arrays of cell text; first column is a row header.
  function table(caption, headers, rows) {
    return `<table class="data-table"><caption>${U.esc(caption)}</caption>
      <thead><tr>${headers.map((h) => `<th scope="col">${U.esc(h)}</th>`).join('')}</tr></thead>
      <tbody>${rows.map((r) => `<tr>${r.map((c, i) => (i === 0 ? `<th scope="row">${U.esc(c)}</th>` : `<td>${U.esc(c)}</td>`)).join('')}</tr>`).join('')}</tbody>
    </table>`;
  }

  Paw.charts = { line, bars, table, busy };
})();
