/* Small helpers shared by every module: DOM, formatting, randomness, files. */
(function () {
  'use strict';
  const Paw = (window.Paw = window.Paw || {});

  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  const esc = (value) => String(value == null ? '' : value).replace(/[&<>"']/g, (c) => ESC[c]);

  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const rand = (lo, hi) => lo + Math.random() * (hi - lo);
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  function weighted(weights, rng) {
    const r = rng || Math.random;
    const entries = Object.entries(weights).filter(([, w]) => w > 0);
    const total = entries.reduce((s, [, w]) => s + w, 0);
    let x = r() * total;
    for (const [key, w] of entries) {
      x -= w;
      if (x <= 0) return key;
    }
    return entries.length ? entries[entries.length - 1][0] : null;
  }

  function hash(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  // Deterministic PRNG (mulberry32) so seeded history looks the same on every load.
  function seeded(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function gauss(rng) {
    const r = rng || Math.random;
    return (r() + r() + r() + r() - 2) / 0.58; // cheap approximation, sd ≈ 1
  }

  const uid = (prefix) => (prefix || 'id') + '-' + Math.random().toString(36).slice(2, 9);

  // ---- time -----------------------------------------------------------------
  const MIN = 60 * 1000;
  const DAY = 24 * 60 * MIN;

  function dayKey(ts) {
    const d = new Date(ts == null ? Date.now() : ts);
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function startOfDay(ts) {
    const d = new Date(ts == null ? Date.now() : ts);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }
  const fmtTime = (ts) => new Date(ts).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  function fmtDay(ts) {
    const today = startOfDay();
    const day = startOfDay(ts);
    if (day === today) return 'Today';
    if (day === today - DAY) return 'Yesterday';
    return new Date(ts).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
  }
  function fmtAgo(ts) {
    const s = Math.round((Date.now() - ts) / 1000);
    if (s < 10) return 'just now';
    if (s < 60) return s + ' s ago';
    const m = Math.round(s / 60);
    if (m < 60) return m + ' min ago';
    const h = Math.round(m / 60);
    if (h < 24) return h + ' h ago';
    return fmtDay(ts);
  }
  function fmtDuration(sec) {
    const s = Math.max(0, Math.round(sec));
    if (s < 60) return s + ' s';
    const m = Math.round(s / 60);
    if (m < 60) return m + ' min';
    const h = Math.floor(m / 60);
    const rem = m % 60;
    return rem ? h + ' h ' + rem + ' min' : h + ' h';
  }

  // ---- units ----------------------------------------------------------------
  const units = () => (Paw.store && Paw.store.state ? Paw.store.state.settings.units : 'metric');
  function fmtDistance(m, opts) {
    const short = opts && opts.short;
    if (units() === 'imperial') {
      const ft = m * 3.28084;
      if (ft < 1000 || short) return Math.round(ft).toLocaleString() + ' ft';
      return (m / 1609.344).toFixed(2) + ' mi';
    }
    if (m < 1000 || short) return Math.round(m).toLocaleString() + ' m';
    return (m / 1000).toFixed(m < 10000 ? 2 : 1) + ' km';
  }
  function fmtTemp(c) {
    return units() === 'imperial' ? (c * 9 / 5 + 32).toFixed(1) + ' °F' : c.toFixed(1) + ' °C';
  }
  const fmtNumber = (n) => Math.round(n).toLocaleString();

  function compass(dx, dy) {
    if (Math.hypot(dx, dy) < 1) return '';
    const deg = (Math.atan2(dx, -dy) * 180 / Math.PI + 360) % 360;
    return ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.round(deg / 45) % 8];
  }
  const COMPASS_WORDS = { N: 'north', NE: 'northeast', E: 'east', SE: 'southeast', S: 'south', SW: 'southwest', W: 'west', NW: 'northwest' };

  // ---- environment ----------------------------------------------------------
  const motionQuery = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  function reducedMotion() {
    const pref = Paw.store && Paw.store.state ? Paw.store.state.settings.motion : 'system';
    if (pref === 'reduce') return true;
    if (pref === 'full') return false;
    return !!(motionQuery && motionQuery.matches);
  }

  const storage = {
    get(key) {
      try { return window.localStorage.getItem(key); } catch (e) { return null; }
    },
    set(key, value) {
      try { window.localStorage.setItem(key, value); return true; } catch (e) { return false; }
    },
    remove(key) {
      try { window.localStorage.removeItem(key); } catch (e) { /* ignore */ }
    },
  };

  function debounce(fn, ms) {
    let t = null;
    return function () {
      const args = arguments;
      clearTimeout(t);
      t = setTimeout(() => fn.apply(null, args), ms);
    };
  }

  // ---- files ----------------------------------------------------------------
  // When the page runs as a claude.ai Artifact, the viewer only allows saving
  // files through its "downloads" capability; in a normal browser we use a blob link.
  let downloadsCap = null;
  function hostDownloads() {
    if (!downloadsCap && window.claude && typeof window.claude.use === 'function') {
      downloadsCap = window.claude.use('downloads').catch(() => null);
    }
    return downloadsCap || Promise.resolve(null);
  }
  const inFrame = (() => {
    try { return window.self !== window.top; } catch (e) { return true; }
  })();

  async function saveFile(filename, text, mime) {
    const host = await hostDownloads();
    if (host) {
      try {
        await host.save({ filename, data: text });
        return 'saved';
      } catch (err) {
        return err && err.code === 'declined' ? 'declined' : 'unavailable';
      }
    }
    if (inFrame && window.claude) return 'unavailable';
    const blob = new Blob([text], { type: mime || 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    return 'saved';
  }

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (e) {
      return false;
    }
  }

  function csvCell(v) {
    let s = String(v == null ? '' : v);
    // Keep spreadsheet apps from running user text (pet names, notes) as a formula.
    if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
    return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }

  // Whether this page can hand the viewer a file (Artifacts need the downloads capability).
  async function canSaveFiles() {
    const host = await hostDownloads();
    return !!host || !window.claude;
  }

  Paw.util = {
    $, $$, esc, clamp, lerp, rand, pick, weighted, hash, seeded, gauss, uid,
    MIN, DAY, dayKey, startOfDay, fmtTime, fmtDay, fmtAgo, fmtDuration,
    fmtDistance, fmtTemp, fmtNumber, compass, COMPASS_WORDS,
    reducedMotion, motionQuery, storage, debounce,
    hostDownloads, saveFile, copyText, csvCell, canSaveFiles, inFrame,
  };
})();
