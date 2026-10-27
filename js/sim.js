/* The simulated collar. Nothing here reads a real sensor: activity, location,
   heart rate, temperature, breathing, battery and "thoughts" are all generated.
   Live data runs at demo pace (activities last seconds, not hours) so a
   presentation always has something happening. */
(function () {
  'use strict';
  const Paw = (window.Paw = window.Paw || {});
  const C = Paw.config;
  const U = Paw.util;

  const runtimes = new Map();
  const listeners = new Set();
  let timer = null;
  let lastTick = 0;
  let liveAcc = 0;

  function on(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  }
  function emit(type, detail) {
    listeners.forEach((fn) => {
      try { fn(type, detail); } catch (err) { console.error(err); }
    });
  }
  const settings = () => Paw.store.state.settings;
  const petById = (id) => Paw.store.state.pets.find((p) => p.id === id);
  const species = (pet) => C.SPECIES[pet.species] || C.SPECIES.dog;

  // ---- body models ------------------------------------------------------------
  function restRange(pet) {
    const hr = species(pet).hr;
    return Array.isArray(hr) ? hr : hr[pet.size] || hr.medium;
  }
  function hrTarget(pet, activity) {
    const [lo, hi] = restRange(pet);
    let level = C.ACTIVITIES[activity].level;
    if (level > 0.4) level = 0.4 + (level - 0.4) * species(pet).activeScale;
    return lo + (hi - lo) * level;
  }
  function tempTarget(pet, activity) {
    const [lo, hi] = species(pet).tempC;
    const level = U.clamp(C.ACTIVITIES[activity].level, -0.2, 2.4);
    return lo + (hi - lo) * 0.45 + level * (hi - lo) * 0.2;
  }
  function breathTarget(pet, activity) {
    const [lo, hi] = species(pet).breathing;
    const level = C.ACTIVITIES[activity].level;
    const factor = activity === 'sleeping' ? 0.85 : 1 + Math.max(0, level - 0.4) * (pet.species === 'dog' ? 1.1 : 0.5);
    return (lo + (hi - lo) * 0.4) * factor;
  }

  // Labels and notes are English keys, translated where they're shown ({activity} is filled in there).
  function hrStatus(pet, r) {
    const [lo, hi] = restRange(pet);
    const act = C.ACTIVITIES[r.activity];
    const margin = Math.max(3, (hi - lo) * 0.05);
    if (r.hr > hi * 1.75 + margin) return { level: 'critical', label: 'Very high', note: 'Much higher than usual for this pet (simulated)' };
    if (r.hr > hi + margin) {
      return act.active
        ? { level: 'good', label: 'Active', note: 'Higher, as expected while {activity}' }
        : { level: 'warning', label: 'Elevated', note: 'Higher than usual while resting' };
    }
    if (r.hr < lo - margin) {
      return r.activity === 'sleeping'
        ? { level: 'good', label: 'Asleep', note: 'Lower, as expected during sleep' }
        : { level: 'warning', label: 'Low', note: 'Lower than the usual resting range' };
    }
    return { level: 'good', label: 'Normal', note: 'Within the usual resting range' };
  }

  // ---- a typical day, used to generate believable history ---------------------
  // Each entry is [minute of day the activity ends, activity].
  const DAY = {
    dog: [[390, 'sleeping'], [420, 'resting'], [435, 'eating'], [480, 'walking'], [600, 'sleeping'], [690, 'resting'], [720, 'playing'],
      [840, 'resting'], [930, 'sleeping'], [1000, 'exploring'], [1050, 'walking'], [1065, 'eating'], [1095, 'playing'], [1290, 'resting'], [1440, 'sleeping']],
    cat: [[360, 'resting'], [375, 'eating'], [420, 'playing'], [690, 'sleeping'], [750, 'exploring'], [900, 'sleeping'], [960, 'resting'],
      [1020, 'exploring'], [1035, 'eating'], [1050, 'running'], [1260, 'resting'], [1440, 'sleeping']],
    rabbit: [[300, 'sleeping'], [420, 'exploring'], [450, 'eating'], [600, 'resting'], [900, 'sleeping'], [960, 'resting'], [1020, 'playing'],
      [1080, 'exploring'], [1110, 'eating'], [1260, 'resting'], [1440, 'sleeping']],
    bird: [[390, 'sleeping'], [420, 'resting'], [440, 'eating'], [540, 'playing'], [660, 'resting'], [700, 'running'], [760, 'eating'],
      [900, 'resting'], [960, 'playing'], [1000, 'running'], [1020, 'eating'], [1170, 'resting'], [1440, 'sleeping']],
    hamster: [[120, 'running'], [180, 'eating'], [300, 'exploring'], [420, 'running'], [1140, 'sleeping'], [1200, 'resting'], [1230, 'eating'],
      [1320, 'running'], [1440, 'exploring']],
    horse: [[240, 'resting'], [300, 'sleeping'], [420, 'eating'], [480, 'resting'], [540, 'walking'], [720, 'eating'], [780, 'sleeping'],
      [900, 'eating'], [960, 'walking'], [1080, 'eating'], [1140, 'playing'], [1320, 'eating'], [1440, 'resting']],
    turtle: [[420, 'sleeping'], [540, 'resting'], [570, 'eating'], [720, 'exploring'], [900, 'resting'], [960, 'exploring'], [980, 'eating'],
      [1140, 'resting'], [1440, 'sleeping']],
  };
  function scheduled(kind, m) {
    if (kind === 'cat' && m < 300) return m % 120 < 20 ? 'exploring' : 'sleeping';
    const day = DAY[kind] || DAY.dog;
    for (const [end, act] of day) if (m < end) return act;
    return day[day.length - 1][1];
  }
  const scheduleShift = (pet) => (U.hash(pet.id) % 41) - 20;
  function minuteOfDay(pet, ts) {
    const d = new Date(ts);
    return (d.getHours() * 60 + d.getMinutes() + scheduleShift(pet) + 1440) % 1440;
  }
  // Meters covered per minute of each activity, for the generated history.
  const PACE = { walking: 80, running: 160, playing: 25, exploring: 12, eating: 0, resting: 0, sleeping: 0 };
  const PACE_BY_SPECIES = {
    cat: { exploring: 22 },
    rabbit: { playing: 30, exploring: 15, running: 60 },
    bird: { running: 40, playing: 10 },
    hamster: { running: 25, exploring: 3 },
    horse: { walking: 110, running: 300 },
    turtle: { exploring: 3, playing: 2, running: 5 },
  };
  const pace = (pet, act) => ((PACE_BY_SPECIES[pet.species] || {})[act] != null ? PACE_BY_SPECIES[pet.species][act] : PACE[act]);

  // ---- moods & translations ---------------------------------------------------
  const MOOD_WEIGHTS = {
    sleeping: { sleepy: 7, loving: 1, happy: 1 },
    resting: { happy: 2, loving: 3, sleepy: 2, hungry: 1, sassy: 1, curious: 1, nervous: 0.6 },
    eating: { hungry: 4, happy: 3, sassy: 0.5 },
    walking: { happy: 3, curious: 4, excited: 1.5, playful: 1 },
    exploring: { curious: 5, happy: 1, nervous: 0.8, sassy: 0.6 },
    playing: { playful: 5, excited: 3, happy: 2 },
    running: { excited: 5, playful: 3, happy: 1 },
  };
  function pickMood(pet, activity, ctx, rng) {
    const w = Object.assign({}, MOOD_WEIGHTS[activity]);
    const hour = new Date(ctx.ts).getHours();
    if ((hour >= 7 && hour < 9) || (hour >= 17 && hour < 19)) w.hungry = (w.hungry || 0) + 2.5;
    if (ctx.outside) w.curious = (w.curious || 0) + 3;
    if (pet.species === 'cat') w.sassy = (w.sassy || 0) * 2 + 1;
    else if (pet.species === 'dog') w.sassy = (w.sassy || 0) * 0.5;
    if (pet.species === 'turtle') w.sleepy = (w.sleepy || 0) + 1.5;
    return U.weighted(w, rng);
  }

  const langShort = (code) => String(code || 'en').split('-')[0];

  function makeThought(pet, mood, ts, rng, recent) {
    const r = rng || Math.random;
    const lang = pet.translator.lang;
    const group = (Paw.phrases.bank[langShort(lang)] || Paw.phrases.bank.en)[mood];
    const pool = group.all.map((t, i) => ({ t, k: mood + '.a' + i }))
      .concat((group[pet.species] || []).map((t, i) => ({ t, k: mood + '.' + pet.species + i })));
    const fresh = recent ? pool.filter((p) => recent.indexOf(p.k) === -1) : pool;
    const from = fresh.length ? fresh : pool;
    const choice = from[Math.floor(r() * from.length)];
    return {
      kind: 'thought', petId: pet.id, ts, mood, lang,
      text: choice.t, key: choice.k, sound: soundFor(pet, mood, r),
    };
  }
  function soundFor(pet, mood, rng) {
    const set = (Paw.phrases.sounds[pet.species] || Paw.phrases.sounds.dog)[mood];
    return set[Math.floor((rng || Math.random)() * set.length)];
  }

  // The same line in another language (every language lists its lines in the same order).
  function retranslate(t, lang) {
    const key = (t && t.key) || '';
    let text = null;
    if (key.indexOf('talk.') === 0) {
      text = Paw.talk.line(key, lang);
    } else {
      const m = /^(\w+)\.(a|[a-z]+?)(\d+)$/.exec(key);
      const group = m && (Paw.phrases.bank[langShort(lang)] || {})[m[1]];
      const list = group && (m[2] === 'a' ? group.all : group[m[2]]);
      text = (list && list[Number(m[3])]) || null;
    }
    return text ? Object.assign({}, t, { lang, text }) : null;
  }

  // ---- log entries for finished activities ------------------------------------
  const TITLES = {
    dog: { running: 'Run in the park', playing: 'Played in the backyard', exploring: 'Sniffed around the yard' },
    cat: { running: 'Zoomies', playing: 'Played with a toy', exploring: 'Explored the neighborhood' },
    rabbit: { running: 'Zoomies in the yard', playing: 'Binkies in the yard', exploring: 'Grazed in the backyard' },
    bird: { running: 'Flew around the house', playing: 'Played with toys', exploring: 'Explored the house' },
    hamster: { running: 'Ran on the wheel', playing: 'Rolled around in the ball', exploring: 'Explored the cage' },
    horse: { walking: 'Trail ride', running: 'Gallop in the park', playing: 'Played in the paddock', exploring: 'Wandered the paddock', eating: 'Grazing' },
    turtle: { running: 'Scooted across the yard', playing: 'Pushed a strawberry around', exploring: 'Explored the garden, slowly', resting: 'Basked' },
  };
  function activityEntry(pet, act, ts, durationSec, meters) {
    const type = C.ACTIVITY_LOG_TYPE[act];
    if (!type) return null; // resting is not logged
    if (durationSec < (act === 'eating' ? 10 : 20)) return null;
    const hour = new Date(ts).getHours();
    const own = TITLES[pet.species] || {};
    const fallback = {
      walking: 'Walk',
      eating: hour < 11 ? 'Breakfast' : hour >= 16 ? 'Dinner' : 'Snack',
      sleeping: hour >= 21 || hour < 6 ? 'Slept' : 'Nap',
    };
    return {
      kind: 'activity', type, petId: pet.id, ts, title: own[act] || fallback[act] || C.activityLabel(pet.species, act),
      durationSec: Math.round(durationSec), distance: Math.round(meters || 0), source: 'collar',
    };
  }

  function emptyStats(day) {
    const bySec = {};
    C.ACTIVITY_ORDER.forEach((a) => { bySec[a] = 0; });
    return { day, distance: 0, steps: 0, activeSec: 0, sleepSec: 0, bySec };
  }
  function addStats(stats, pet, act, sec, meters) {
    stats.bySec[act] = (stats.bySec[act] || 0) + sec;
    if (C.ACTIVITIES[act].active) stats.activeSec += sec;
    if (act === 'sleeping') stats.sleepSec += sec;
    stats.distance += meters;
    stats.steps += meters * species(pet).stepsPerMeter + (act === 'playing' ? sec * 0.8 : 0);
  }

  // Sleep between 8 pm yesterday and 8 am today, from the typical-day schedule.
  function lastNightSleep(pet, now) {
    const from = U.startOfDay(now) - 4 * 60 * U.MIN;
    const to = Math.min(now, U.startOfDay(now) + 8 * 60 * U.MIN);
    let minutes = 0;
    for (let ts = from; ts < to; ts += U.MIN) {
      if (scheduled(pet.species, minuteOfDay(pet, ts)) === 'sleeping') minutes++;
    }
    return minutes * 60;
  }

  // Generate `minutes` of believable history ending at `endTs`.
  function buildHistory(pet, endTs, minutes) {
    const rng = U.seeded(U.hash(pet.id + ':' + U.dayKey(endTs)));
    const start = Math.floor(endTs / U.MIN) * U.MIN - (minutes - 1) * U.MIN;
    const today0 = U.startOfDay(endTs);
    const stats = emptyStats(U.dayKey(endTs));
    const values = [];
    const logs = [];
    const recent = [];
    let v = hrTarget(pet, 'resting');
    let seg = null;
    let nextThought = start + (15 + rng() * 40) * U.MIN;

    const closeSeg = (s, end) => {
      const mins = (end - s.start) / U.MIN;
      const entry = activityEntry(pet, s.act, s.start, mins * 60, mins * pace(pet, s.act));
      if (entry) logs.push(entry);
    };

    for (let i = 0; i < minutes; i++) {
      const ts = start + i * U.MIN;
      const act = scheduled(pet.species, minuteOfDay(pet, ts));
      const [lo, hi] = restRange(pet);
      v = v * 0.6 + hrTarget(pet, act) * 0.4 + U.gauss(rng) * Math.max(1.5, (hi - lo) * 0.05);
      values.push(Math.round(v));
      if (!seg || seg.act !== act) {
        if (seg) closeSeg(seg, ts);
        seg = { act, start: ts };
      }
      if (ts >= today0) addStats(stats, pet, act, 60, pace(pet, act));
      if (ts >= nextThought) {
        if (act !== 'sleeping' || rng() < 0.3) {
          const mood = pickMood(pet, act, { ts, outside: false }, rng);
          const t = makeThought(pet, mood, ts + Math.floor(rng() * 50) * 1000, rng, recent);
          recent.push(t.key);
          if (recent.length > 6) recent.shift();
          logs.push(t);
        }
        nextThought = ts + (35 + rng() * 55) * U.MIN;
      }
    }
    return { hr: { start, values }, logs, stats };
  }

  // ---- geography ----------------------------------------------------------------
  const inRect = (x, y, r, pad) => x >= r.x - (pad || 0) && x <= r.x + r.w + (pad || 0) && y >= r.y - (pad || 0) && y <= r.y + r.h + (pad || 0);
  function distToSegment(px, py, s) {
    const dx = s.x2 - s.x1;
    const dy = s.y2 - s.y1;
    const t = U.clamp(((px - s.x1) * dx + (py - s.y1) * dy) / (dx * dx + dy * dy), 0, 1);
    return Math.hypot(px - (s.x1 + t * dx), py - (s.y1 + t * dy));
  }
  function zoneAt(x, y) {
    const M = C.MAP;
    if (inRect(x, y, M.homeHouse, 6)) return 'Home';
    if (inRect(x, y, M.backyard)) return 'Backyard';
    if (inRect(x, y, M.park)) return 'Bark Park';
    if (inRect(x, y, M.garden)) return 'Community garden';
    for (const poi of M.pois) {
      if (Math.hypot(x - poi.x, y - poi.y) < 55) return 'Near the ' + poi.label.toLowerCase();
    }
    for (const road of M.roads) {
      if (distToSegment(x, y, road) <= 24) return road.name;
    }
    return 'Neighborhood';
  }
  function fromHome(r) {
    const h = C.MAP.zoneCenter;
    const dx = r.pos.x - h.x;
    const dy = r.pos.y - h.y;
    return { meters: Math.hypot(dx, dy), dir: U.compass(dx, dy) };
  }
  const inMap = (p) => ({ x: U.clamp(p.x, 24, C.MAP.width - 24), y: U.clamp(p.y, 24, C.MAP.height - 24) });
  function randomIn(rect, pad) {
    return { x: U.rand(rect.x + pad, rect.x + rect.w - pad), y: U.rand(rect.y + pad, rect.y + rect.h - pad) };
  }
  const near = (p, radius) => ({ x: p.x + U.rand(-radius, radius), y: p.y + U.rand(-radius, radius) });
  function roamPoint(outside) {
    const c = C.MAP.zoneCenter;
    const radius = settings().safeRadius;
    const dist = outside ? radius + U.rand(40, 110) : U.rand(30, Math.max(40, radius - 20));
    const a = U.rand(0, Math.PI * 2);
    return inMap({ x: c.x + Math.cos(a) * dist, y: c.y + Math.sin(a) * dist });
  }
  const spotsFor = (pet) => C.MAP.spots[species(pet).home] || C.MAP.spots.house;

  // ---- runtime ------------------------------------------------------------------
  // Seconds each live activity lasts at 1× demo speed (walks and runs follow a route instead).
  const DURATIONS = {
    sleeping: [45, 80], resting: [25, 50], eating: [12, 20],
    walking: [600, 600], running: [600, 600], exploring: [40, 75], playing: [25, 45],
  };
  const NEXT = {
    dog: {
      sleeping: { resting: 3, eating: 1 },
      resting: { walking: 3, playing: 3, sleeping: 2, eating: 1, exploring: 1 },
      eating: { resting: 2, playing: 1, sleeping: 1 },
      walking: { resting: 3, eating: 1, sleeping: 1 },
      exploring: { resting: 2, playing: 1, walking: 1 },
      playing: { resting: 2, running: 1, eating: 1 },
      running: { resting: 2, eating: 1 },
    },
    cat: {
      sleeping: { resting: 2, exploring: 1, eating: 1 },
      resting: { sleeping: 3, exploring: 2, playing: 1, eating: 1 },
      eating: { resting: 2, sleeping: 1 },
      exploring: { resting: 2, sleeping: 1, playing: 1 },
      playing: { resting: 2, running: 1 },
      running: { resting: 2, sleeping: 1 },
    },
    rabbit: {
      sleeping: { resting: 2, eating: 1 },
      resting: { eating: 2, exploring: 2, playing: 1, sleeping: 2 },
      eating: { resting: 2, exploring: 1 },
      exploring: { resting: 2, playing: 1, eating: 1 },
      playing: { running: 1, resting: 2 },
      running: { resting: 2 },
    },
    bird: {
      sleeping: { resting: 2, eating: 1 },
      resting: { playing: 2, running: 1, eating: 1, sleeping: 1 },
      eating: { resting: 2, playing: 1 },
      exploring: { resting: 2 },
      playing: { resting: 2, running: 1 },
      running: { resting: 2, playing: 1 },
    },
    hamster: {
      sleeping: { resting: 2, running: 1 },
      resting: { running: 3, eating: 2, sleeping: 2, exploring: 1 },
      eating: { sleeping: 2, resting: 1 },
      exploring: { resting: 1, running: 1 },
      playing: { resting: 1 },
      running: { eating: 1, resting: 2 },
    },
    horse: {
      sleeping: { resting: 2 },
      resting: { eating: 3, walking: 2, exploring: 1, sleeping: 1 },
      eating: { resting: 2, walking: 1 },
      walking: { resting: 2, eating: 1 },
      exploring: { eating: 1, resting: 1 },
      playing: { running: 1, resting: 1 },
      running: { resting: 2, eating: 1 },
    },
    turtle: {
      sleeping: { resting: 2 },
      resting: { eating: 1, exploring: 2, sleeping: 2 },
      eating: { resting: 2 },
      exploring: { resting: 2, eating: 1 },
      playing: { resting: 1 },
      running: { resting: 1 },
    },
  };
  const OPENING = { cat: 'exploring', rabbit: 'exploring', bird: 'playing', hamster: 'running', horse: 'eating', turtle: 'resting' };

  function ensure(pet, index) {
    let r = runtimes.get(pet.id);
    if (r) return r;
    const spot = spotsFor(pet).couch;
    r = {
      petId: pet.id,
      activity: 'resting', segStartTs: Date.now(), segSec: 0, segMeters: 0, activityLeft: 30,
      pos: { x: spot.x + U.rand(-6, 6), y: spot.y + U.rand(-4, 4) },
      route: null, targets: [], wander: null, anchor: null, wheel: false,
      trail: [], trailAcc: 0,
      hr: hrTarget(pet, 'resting'), hrBoost: 0, temp: tempTarget(pet, 'resting'), breath: breathTarget(pet, 'resting'),
      mood: 'happy', zone: 'Home', inZone: true,
      nextThoughtAt: Date.now() + U.rand(6, 14) * 1000,
      recent: [], recentTalk: [], lastThought: null,
      live: [], minuteSum: 0, minuteCount: 0, minuteKey: Math.floor(Date.now() / U.MIN),
      lowWarned: pet.device.battery < 20,
      lastFix: Date.now(),
    };
    runtimes.set(pet.id, r);
    const lastThought = Paw.store.state.logs.find((l) => l.petId === pet.id && l.kind === 'thought');
    if (lastThought) {
      r.lastThought = lastThought;
      r.mood = lastThought.mood;
    }
    let opening = 'resting';
    if (index != null) opening = pet.species === 'dog' ? (index === 0 ? 'walking' : 'playing') : OPENING[pet.species] || 'resting';
    startActivity(pet, r, opening, { silent: true });
    // A few minutes of recent readings so the live chart starts full.
    const target = hrTarget(pet, r.activity);
    const [lo, hi] = restRange(pet);
    const now = Date.now();
    let v = target;
    for (let i = 36; i >= 1; i--) {
      v = v * 0.7 + target * 0.3 + U.gauss() * Math.max(1.5, (hi - lo) * 0.04);
      r.live.push({ t: now - i * 5000, v: Math.round(v) });
    }
    r.hr = v;
    return r;
  }

  function startActivity(pet, r, act, opts) {
    const o = opts || {};
    const sp = species(pet);
    if (act === 'walking' && !sp.canWalk) act = 'exploring';
    if (!o.silent && r.activity) {
      const entry = activityEntry(pet, r.activity, r.segStartTs, r.segSec, r.segMeters);
      if (entry) emit('activity-log', entry);
    }
    r.activity = act;
    r.segStartTs = Date.now();
    r.segSec = 0;
    r.segMeters = 0;
    r.route = null;
    r.targets = [];
    r.wander = null;
    r.anchor = null;
    r.wheel = false;
    const d = DURATIONS[act];
    r.activityLeft = o.duration || U.rand(d[0], d[1]);
    const M = C.MAP;
    const kind = pet.species;
    const spots = spotsFor(pet);
    const inHouse = () => randomIn(M.homeHouse, 8);
    const inYard = () => randomIn(M.backyard, 10);
    switch (act) {
      case 'walking':
        r.route = { pts: kind === 'dog' && Math.random() < 0.45 ? C.ROUTES.block : C.ROUTES.park, i: 0 };
        break;
      case 'running':
        if (kind === 'dog' || kind === 'horse') {
          r.route = { pts: C.ROUTES.run, i: 0 };
        } else {
          r.activityLeft = o.duration || U.rand(12, 20);
          if (kind === 'hamster') {
            r.wheel = true; // running in place on the wheel
            r.targets = [near(spots.bed, 2)];
          } else if (kind === 'bird') {
            r.wander = inHouse; // flying laps around the living room
          } else if (kind === 'cat') {
            r.wander = () => (Math.random() < 0.5 ? inYard() : inHouse());
          } else {
            r.wander = inYard;
          }
        }
        break;
      case 'playing':
        r.wander = kind === 'bird' || kind === 'hamster' ? () => near(spots.couch, kind === 'hamster' ? 5 : 14) : inYard;
        break;
      case 'exploring':
        if (kind === 'cat') {
          r.targets = [roamPoint(false), roamPoint(Math.random() < 0.35), roamPoint(false)];
          r.wander = () => roamPoint(Math.random() < 0.2);
        } else if (kind === 'dog') {
          r.wander = () => (Math.random() < 0.75 ? randomIn(M.backyard, 8) : { x: U.rand(300, 400), y: U.rand(312, 326) });
        } else if (kind === 'bird' || kind === 'hamster') {
          r.wander = kind === 'hamster' ? () => near(spots.bed, 6) : inHouse;
        } else {
          r.wander = inYard;
        }
        break;
      default: {
        const spot = act === 'sleeping' ? spots.bed : act === 'eating' ? spots.bowl : spots.couch;
        r.targets = [near(spot, 3)];
      }
    }
    if (o.outside) {
      r.targets = [roamPoint(true)];
      r.wander = null;
      r.wheel = false;
    }
    emit('activity', { petId: pet.id, activity: act });
  }

  function nextActivity(pet, r) {
    const table = NEXT[pet.species] || NEXT.dog;
    const w = Object.assign({}, table[r.activity] || { resting: 1 });
    const hour = new Date().getHours();
    if ((hour >= 7 && hour < 9) || (hour >= 17 && hour < 19)) w.eating = (w.eating || 0) * 3 + 0.5;
    if (!species(pet).canWalk) delete w.walking;
    return U.weighted(w) || 'resting';
  }

  function move(pet, r, dt) {
    const act = C.ACTIVITIES[r.activity];
    const mult = species(pet).speed;
    let moved = 0;
    if (r.route) {
      let budget = act.speed * mult * dt;
      while (budget > 0 && r.route.i < r.route.pts.length) {
        const [tx, ty] = r.route.pts[r.route.i];
        const d = Math.hypot(tx - r.pos.x, ty - r.pos.y);
        if (d <= budget) {
          r.pos.x = tx;
          r.pos.y = ty;
          budget -= d;
          moved += d;
          r.route.i++;
        } else {
          r.pos.x += ((tx - r.pos.x) / d) * budget;
          r.pos.y += ((ty - r.pos.y) / d) * budget;
          moved += budget;
          budget = 0;
        }
      }
      if (r.route.i >= r.route.pts.length) {
        r.route = null;
        r.activityLeft = 0; // walk finished: pick the next activity
      }
      return moved;
    }
    if (!r.targets.length && r.wander) r.targets.push(r.wander());
    if (r.targets.length) {
      const t = r.targets[0];
      const far = Math.hypot(t.x - r.pos.x, t.y - r.pos.y);
      const speed = (act.speed || (far > 60 ? 7 : 3.2)) * mult;
      let budget = speed * dt;
      while (budget > 0 && r.targets.length) {
        const tgt = r.targets[0];
        const d = Math.hypot(tgt.x - r.pos.x, tgt.y - r.pos.y);
        if (d <= budget) {
          r.pos.x = tgt.x;
          r.pos.y = tgt.y;
          budget -= d;
          moved += d;
          r.targets.shift();
          if (!r.targets.length) {
            if (r.wander) r.targets.push(r.wander());
            else r.anchor = { x: tgt.x, y: tgt.y };
          }
        } else {
          r.pos.x += ((tgt.x - r.pos.x) / d) * budget;
          r.pos.y += ((tgt.y - r.pos.y) / d) * budget;
          moved += budget;
          budget = 0;
        }
      }
      return moved;
    }
    if (r.anchor) {
      // Standing still: tiny GPS jitter, not counted as distance.
      r.pos.x = r.anchor.x + U.rand(-1.2, 1.2);
      r.pos.y = r.anchor.y + U.rand(-1.2, 1.2);
    }
    return moved;
  }

  function step(pet, r, dt, realDt, now) {
    r.activityLeft -= dt;
    r.segSec += dt;
    if (r.activityLeft <= 0 && !r.route) startActivity(pet, r, nextActivity(pet, r));

    let moved = move(pet, r, dt);
    // A hamster on its wheel covers ground without going anywhere.
    const wheelMeters = r.wheel ? 3 * dt : 0;
    r.segMeters += moved + wheelMeters;
    r.lastFix = now;

    r.trailAcc += moved;
    if (r.trailAcc > 6 || !r.trail.length) {
      r.trail.push({ x: Math.round(r.pos.x), y: Math.round(r.pos.y) });
      if (r.trail.length > 90) r.trail.shift();
      r.trailAcc = 0;
    }

    // Body signals ease toward the activity's target with a little noise.
    const [lo, hi] = restRange(pet);
    const hrGoal = hrTarget(pet, r.activity) + r.hrBoost;
    r.hr += (hrGoal - r.hr) * (1 - Math.exp(-dt / 5)) + U.gauss() * Math.max(0.9, (hi - lo) * 0.02) * Math.min(1, realDt);
    r.hrBoost *= Math.exp(-dt / 25);
    r.temp += (tempTarget(pet, r.activity) - r.temp) * (1 - Math.exp(-dt / 60));
    r.breath += (breathTarget(pet, r.activity) - r.breath) * (1 - Math.exp(-dt / 8)) + U.gauss() * 0.3;

    // Location: named place and the safe zone around home.
    const zone = zoneAt(r.pos.x, r.pos.y);
    if (zone !== r.zone) {
      const prev = r.zone;
      r.zone = zone;
      emit('place', { petId: pet.id, zone, prev });
    }
    const home = fromHome(r);
    const inZone = home.meters <= settings().safeRadius;
    if (inZone !== r.inZone) {
      r.inZone = inZone;
      emit('zone', { petId: pet.id, inZone, withOwner: !!C.ACTIVITIES[r.activity].withOwner && !!r.route, zone });
    }

    // Battery: the translator's speaker costs extra.
    const drain = (dt / 60) * (0.35 + (pet.translator.on ? 0.45 : 0));
    pet.device.battery = Math.max(1, pet.device.battery - drain);
    if (pet.device.battery < 20 && !r.lowWarned) {
      r.lowWarned = true;
      emit('battery-low', { petId: pet.id, battery: pet.device.battery });
    } else if (pet.device.battery > 25) {
      r.lowWarned = false;
    }

    Paw.store.addStats(pet.id, r.activity, dt, moved + wheelMeters);

    // Heart-rate history: one value per real minute.
    r.minuteSum += r.hr * realDt;
    r.minuteCount += realDt;
    const minuteKey = Math.floor(now / U.MIN);
    if (minuteKey !== r.minuteKey) {
      if (r.minuteCount > 0) Paw.store.pushHr(pet.id, r.minuteKey * U.MIN, Math.round(r.minuteSum / r.minuteCount));
      r.minuteKey = minuteKey;
      r.minuteSum = 0;
      r.minuteCount = 0;
    }

    if (pet.translator.on && now >= r.nextThoughtAt) think(pet.id);
  }

  function tick() {
    const now = Date.now();
    const realDt = Math.min(5, (now - lastTick) / 1000);
    lastTick = now;
    const s = settings();
    if (s.paused || realDt <= 0) return;
    const dt = realDt * s.speed;
    const pets = Paw.store.state.pets;
    pets.forEach((pet, i) => step(pet, ensure(pet, i), dt, realDt, now));

    liveAcc += realDt;
    if (liveAcc >= 5) {
      liveAcc = 0;
      pets.forEach((pet) => {
        const r = runtimes.get(pet.id);
        r.live.push({ t: now, v: Math.round(r.hr) });
        if (r.live.length > 72) r.live.shift();
      });
    }
    Paw.store.touch();
    emit('tick', { now });
  }

  function scheduleNext(pet, r, soon) {
    const s = settings();
    const [lo, hi] = soon ? [5, 10] : C.CHATTINESS[s.chattiness].range;
    r.nextThoughtAt = Date.now() + (U.rand(lo, hi) / s.speed) * 1000;
  }

  function startle(pet, r, mood) {
    if (mood === 'nervous' && !C.ACTIVITIES[r.activity].active) {
      const [lo, hi] = restRange(pet);
      r.hrBoost = (hi - lo) * 0.6;
      emit('hr-spike', { petId: pet.id });
    }
  }

  // Generate a translation now. Returns the thought, or null if the pet is unknown.
  function think(petId, opts) {
    const pet = petById(petId);
    if (!pet) return null;
    const r = ensure(pet);
    const mood = (opts && opts.mood) || pickMood(pet, r.activity, { ts: Date.now(), outside: !r.inZone });
    const t = makeThought(pet, mood, Date.now(), Math.random, r.recent);
    r.recent.push(t.key);
    if (r.recent.length > 6) r.recent.shift();
    r.mood = mood;
    r.lastThought = t;
    startle(pet, r, mood);
    scheduleNext(pet, r);
    t.manual = !!(opts && opts.manual);
    emit('thought', t);
    return t;
  }

  // The pet answers something the owner said. Returns the reply (a thought with a prompt).
  // said: what the owner said; sounds: how it came out in the pet's own sounds.
  function respond(petId, said, sounds) {
    const pet = petById(petId);
    if (!pet) return null;
    const r = ensure(pet);
    const rep = Paw.talk.reply(pet, said, r);
    const t = {
      kind: 'thought', petId: pet.id, ts: Date.now(), mood: rep.mood, lang: pet.translator.lang,
      text: rep.text, key: rep.key, sound: soundFor(pet, rep.mood), prompt: String(said).slice(0, 140), intent: rep.intent,
    };
    if (sounds) t.promptSounds = String(sounds).slice(0, 200);
    r.mood = t.mood;
    r.lastThought = t;
    startle(pet, r, t.mood);
    scheduleNext(pet, r); // don't talk over the reply with a random thought
    t.manual = true;
    emit('thought', t);
    return t;
  }

  function translatorChanged(petId, on) {
    const pet = petById(petId);
    const r = pet && runtimes.get(petId);
    if (r && on) scheduleNext(pet, r, true);
  }

  function forceActivity(petId, act, opts) {
    const pet = petById(petId);
    if (!pet) return;
    startActivity(pet, ensure(pet), act, opts);
  }

  function start() {
    Paw.store.state.pets.forEach((pet, i) => ensure(pet, i));
    lastTick = Date.now();
    if (!timer) timer = setInterval(tick, 1000);
  }
  function resume() {
    lastTick = Date.now();
  }

  Paw.sim = {
    on, start, resume, think, respond, translatorChanged, forceActivity,
    runtime: (id) => runtimes.get(id),
    ensure: (pet) => ensure(pet),
    remove: (id) => runtimes.delete(id),
    reset: () => runtimes.clear(),
    restRange, hrTarget, hrStatus, buildHistory, lastNightSleep, emptyStats, addStats,
    activityEntry, zoneAt, fromHome, langShort, makeThought, retranslate,
  };
})();
