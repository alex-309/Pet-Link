/* Your words in your pet's own sounds. When you talk to a pet, the collar "translates" what
   you said into a made-up string of that animal's sounds (barks, meows, chirps, nickers…) and
   plays it. It isn't a real animal language, just invented for fun, but the same sentence
   always comes out the same way. The sounds are synthesized with the Web Audio API, so there
   are no recordings to license. */
(function () {
  'use strict';
  const Paw = (window.Paw = window.Paw || {});
  const U = Paw.util;
  const C = Paw.config;

  // ---- vocabulary --------------------------------------------------------------------
  // For each species: how its sounds are written, which sounds suit each kind of message
  // (the intents in talk.js), sounds per word, and the pause between sounds in seconds.
  const SPECIES = {
    dog: {
      label: 'Dog', density: 0.55, gap: 0.13, max: 6,
      words: { woof: ['Woof', 'Wuf'], arf: ['Arf', 'Ruff'], yip: ['Yip'], whine: ['Awrr'], growl: ['Grrr'], awoo: ['Awoo'], huff: ['Wuff'] },
      use: {
        greet: ['woof', 'arf'], howareyou: ['woof', 'huff'], walk: ['arf', 'yip', 'awoo'], food: ['arf', 'yip', 'whine'], play: ['arf', 'yip', 'woof'],
        care: ['whine', 'huff'], sleep: ['huff', 'whine'], scold: ['growl', 'huff'], love: ['whine', 'huff', 'arf'], fallback: ['woof', 'arf', 'huff'],
      },
    },
    cat: {
      label: 'Cat', density: 0.45, gap: 0.22, max: 5,
      words: { meow: ['Meow', 'Miaow'], mew: ['Mew'], mrrp: ['Mrrp', 'Prrt'], purr: ['Purrr'], hiss: ['Hsss'], yowl: ['Mrraow'] },
      use: {
        greet: ['mrrp', 'meow'], howareyou: ['mrrp', 'meow'], walk: ['meow', 'mew'], food: ['meow', 'yowl', 'mew'], play: ['mrrp', 'mew'],
        care: ['yowl', 'hiss'], sleep: ['purr', 'mew'], scold: ['hiss', 'mew'], love: ['purr', 'mrrp'], fallback: ['meow', 'mrrp', 'mew'],
      },
    },
    rabbit: {
      label: 'Rabbit', density: 0.4, gap: 0.16, max: 5,
      words: { honk: ['Honk', 'Oink'], thump: ['Thump'], brrr: ['Brrr'], grunt: ['Hnf'] },
      use: {
        greet: ['honk'], howareyou: ['honk', 'brrr'], walk: ['honk', 'thump'], food: ['honk', 'brrr'], play: ['honk', 'thump'],
        care: ['thump', 'grunt'], sleep: ['brrr'], scold: ['thump', 'grunt'], love: ['brrr', 'honk'], fallback: ['honk', 'brrr'],
      },
    },
    bird: {
      label: 'Bird', density: 0.8, gap: 0.06, max: 8,
      words: { tweet: ['Tweet'], chirp: ['Chirp', 'Cheep'], warble: ['Tweedle'], trill: ['Trrrill'], squawk: ['Squawk'] },
      use: {
        greet: ['tweet', 'chirp'], howareyou: ['chirp', 'warble'], walk: ['trill', 'tweet'], food: ['chirp', 'squawk'], play: ['warble', 'trill'],
        care: ['squawk', 'chirp'], sleep: ['chirp'], scold: ['squawk'], love: ['warble', 'tweet'], fallback: ['tweet', 'chirp', 'warble'],
      },
    },
    hamster: {
      label: 'Hamster', density: 0.6, gap: 0.07, max: 6,
      words: { squeak: ['Squeak'], eek: ['Eek'], chitter: ['Chit-chit'] },
      use: {
        greet: ['squeak'], howareyou: ['squeak'], walk: ['squeak', 'eek'], food: ['squeak', 'eek'], play: ['squeak', 'eek'],
        care: ['eek'], sleep: ['squeak'], scold: ['chitter'], love: ['squeak'], fallback: ['squeak', 'eek'],
      },
    },
    horse: {
      label: 'Horse', density: 0.35, gap: 0.3, max: 4,
      words: { neigh: ['Neigh'], nicker: ['Hu-hu-hu'], snort: ['Pfff'] },
      use: {
        greet: ['nicker'], howareyou: ['nicker'], walk: ['neigh', 'snort'], food: ['nicker'], play: ['neigh', 'snort'],
        care: ['snort'], sleep: ['snort', 'nicker'], scold: ['snort'], love: ['nicker'], fallback: ['nicker', 'snort', 'neigh'],
      },
    },
    turtle: {
      label: 'Turtle', density: 0.25, gap: 0.5, max: 3,
      words: { hmm: ['Hmm'], blub: ['Blub'], hiss: ['Hsss'] },
      use: {
        greet: ['hmm', 'blub'], howareyou: ['hmm'], walk: ['blub'], food: ['hmm'], play: ['blub'],
        care: ['hiss'], sleep: ['hmm'], scold: ['hiss'], love: ['hmm', 'blub'], fallback: ['hmm', 'blub'],
      },
    },
  };

  // How the message's mood colors the sounds: [pitch, length, loudness].
  const MOOD = {
    walk: [1.08, 0.9, 1.1], play: [1.06, 0.92, 1.05], food: [1.04, 1, 1], greet: [1.03, 1, 1], love: [0.98, 1.1, 0.85],
    sleep: [0.93, 1.25, 0.6], scold: [0.95, 1, 1], care: [1, 1.1, 0.9], howareyou: [1, 1, 0.95], fallback: [1, 1, 1],
  };
  const EXCITED = { greet: 1, walk: 1, food: 1, play: 1 };

  const label = (species) => (SPECIES[species] || SPECIES.dog).label;
  // "In Dog", "Auf Hündisch", "犬語で": the label over your words played as pet sounds.
  const inLabel = (species) => Paw.i18n.t('In ' + label(species));

  // Split what was said into phrases, each with its word count and ending.
  function phrasesOf(text) {
    const out = [];
    const re = /([^.!?,;:…。！？、]+)([.!?,;:…。！？、]*)/g;
    let m;
    while ((m = re.exec(text))) {
      const body = m[1].trim();
      if (!body) continue;
      const p = m[2];
      const end = /[?？]/.test(p) ? '?' : /[!！]/.test(p) ? '!' : /[,;:、]/.test(p) ? ',' : p ? '.' : '';
      const cjk = (body.match(/[぀-ヿ㐀-鿿]/g) || []).length;
      const words = body.split(/\s+/).filter(Boolean).length;
      out.push({ words: Math.max(1, cjk ? Math.ceil(cjk / 2) : words), end });
    }
    return out.length ? out : [{ words: 1, end: '' }];
  }

  // pet: needs species; said: what the person said. Returns the written sounds and the calls to play.
  function translate(pet, said) {
    const sp = SPECIES[pet.species] || SPECIES.dog;
    const text = String(said || '').trim();
    const intent = Paw.talk.intentOf(text);
    const rng = U.seeded(U.hash(pet.species + ':' + text.toLowerCase()));
    const pool = sp.use[intent] || sp.use.fallback;
    const phrases = phrasesOf(text);
    const calls = [];
    const parts = [];
    let left = sp.max;
    phrases.forEach((ph, pi) => {
      if (left <= 0) return;
      const n = Math.min(left, 4, Math.max(1, Math.round(ph.words * sp.density + rng() * 0.8)));
      left -= n;
      const last = pi === phrases.length - 1 || left <= 0;
      const end = ph.end || (last ? (EXCITED[intent] ? '!' : '.') : ',');
      const group = [];
      for (let i = 0; i < n; i++) group.push(pool[Math.floor(rng() * pool.length)]);
      group.forEach((type, i) => calls.push({ type, rise: end === '?' && i === n - 1, loud: end === '!', pause: i === n - 1 && !last }));
      parts.push({ words: write(sp, group, rng), end });
    });
    // Capitalize the start of each sentence, like the original.
    const out = parts.map((p, i) => {
      const cap = i === 0 || parts[i - 1].end !== ',';
      return (cap ? p.words.charAt(0).toUpperCase() + p.words.slice(1) : p.words) + p.end;
    });
    return { species: pet.species, label: sp.label, intent, text: out.join(' '), calls };
  }
  // Repeated sounds join up ("arf-arf"); each kind of sound keeps one spelling per phrase.
  function write(sp, group, rng) {
    const form = {};
    const words = [];
    group.forEach((type, i) => {
      const forms = sp.words[type];
      const w = (form[type] = form[type] || forms[Math.floor(rng() * forms.length)]).toLowerCase();
      const prev = words[words.length - 1];
      if (prev && group[i - 1] === type && w.indexOf('-') === -1 && prev.split('-').length < 3) words[words.length - 1] = prev + '-' + w;
      else words.push(w);
    });
    return words.join(' ');
  }

  // ---- synthesis ---------------------------------------------------------------------
  // Each sound is a small "voice": an oscillator (the vocal folds) shaped by band-pass
  // formant filters (the mouth), plus optional breath noise, vibrato, pulsing and a filter
  // sweep. Frequencies are in Hz and contours are [position 0–1, value] points.
  const F = (pts, k) => pts.map(([p, f]) => [p, f * k]);
  const VOICES = {
    dog: {
      woof: (k) => ({
        dur: 0.2, wave: 'sawtooth', drive: 3, f0: F([[0, 290], [0.12, 380], [0.5, 330], [1, 220]], k),
        formants: [{ f: [[0, 500], [0.25, 650], [1, 380]], q: 2.5, g: 3 }, { f: [[0, 1100], [0.25, 1300], [1, 800]], q: 3.5, g: 1.8 }, { f: 2600, q: 3, g: 0.5 }],
        noise: { g: 0.45, f: 1400, q: 0.6, env: [[0, 0], [0.03, 1], [0.4, 0.2], [0.9, 0]] },
        env: [[0, 0], [0.04, 1], [0.45, 0.7], [1, 0]],
      }),
      arf: (k) => ({
        dur: 0.15, wave: 'sawtooth', drive: 3, f0: F([[0, 360], [0.2, 470], [1, 300]], k),
        formants: [{ f: [[0, 700], [1, 560]], q: 2.5, g: 3 }, { f: [[0, 1500], [1, 1150]], q: 3.5, g: 2 }, { f: 2800, q: 3, g: 0.6 }],
        noise: { g: 0.4, f: 1600, q: 0.6, env: [[0, 0], [0.03, 1], [0.35, 0.2], [0.9, 0]] },
        env: [[0, 0], [0.03, 1], [0.4, 0.75], [1, 0]],
      }),
      yip: (k) => ({
        dur: 0.1, wave: 'sawtooth', drive: 2, f0: F([[0, 620], [0.3, 760], [1, 560]], k),
        formants: [{ f: 950, q: 3, g: 2.4 }, { f: 2200, q: 4, g: 1.4 }], dry: 0.15,
        noise: { g: 0.2, f: 2000, q: 0.7, env: [[0, 0], [0.05, 1], [0.5, 0]] },
        env: [[0, 0], [0.05, 1], [0.5, 0.7], [1, 0]],
      }),
      whine: (k) => ({
        dur: 0.55, wave: 'sawtooth', f0: F([[0, 820], [0.3, 960], [1, 700]], k), vib: [6, 0.03],
        formants: [{ f: [[0, 1000], [1, 900]], q: 2, g: 2 }, { f: 2400, q: 3, g: 0.9 }], lp: [[0, 2600], [1, 2000]],
        noise: { g: 0.04, f: 3000, q: 0.5 },
        env: [[0, 0], [0.15, 1], [0.7, 0.8], [1, 0]], gain: 0.8,
      }),
      growl: (k) => ({
        dur: 0.75, wave: 'sawtooth', drive: 4, f0: F([[0, 110], [0.5, 120], [1, 100]], k), am: [27, 0.8],
        formants: [{ f: 330, q: 2, g: 3 }, { f: 850, q: 2.5, g: 1.4 }], lp: [[0, 900], [1, 700]],
        noise: { g: 0.5, f: 600, q: 0.8 },
        env: [[0, 0], [0.1, 1], [0.8, 0.9], [1, 0]],
      }),
      awoo: (k) => ({
        dur: 0.9, wave: 'sawtooth', f0: F([[0, 480], [0.25, 600], [0.7, 640], [1, 500]], k), vib: [5, 0.02],
        formants: [{ f: [[0, 420], [0.3, 620], [1, 450]], q: 4, g: 3 }, { f: [[0, 900], [0.3, 1100], [1, 820]], q: 5, g: 1.5 }],
        noise: { g: 0.04, f: 2500, q: 0.5 },
        env: [[0, 0], [0.12, 1], [0.8, 0.85], [1, 0]], gain: 0.9,
      }),
      huff: (k) => ({
        dur: 0.14, wave: 'sawtooth', f0: F([[0, 230], [1, 170]], k),
        formants: [{ f: 420, q: 2, g: 2 }, { f: 950, q: 3, g: 1 }],
        noise: { g: 0.7, f: 750, q: 0.6, env: [[0, 0], [0.05, 1], [1, 0]] },
        env: [[0, 0], [0.05, 1], [1, 0]], gain: 0.7,
      }),
    },
    cat: {
      meow: (k) => ({
        dur: 0.62, wave: 'sawtooth', f0: F([[0, 470], [0.3, 680], [0.6, 640], [1, 400]], k), vib: [5.5, 0.015],
        formants: [
          { f: [[0, 380], [0.25, 760], [0.6, 900], [1, 450]], q: 5, g: 3 },
          { f: [[0, 1900], [0.25, 1700], [0.6, 1350], [1, 900]], q: 6, g: 2.2 },
          { f: [[0, 2900], [1, 2600]], q: 5, g: 0.8 },
        ],
        lp: [[0, 700], [0.12, 4500], [0.85, 3500], [1, 1200]],
        noise: { g: 0.05, f: 3000, q: 0.5 },
        env: [[0, 0], [0.1, 0.9], [0.45, 1], [0.85, 0.7], [1, 0]],
      }),
      mew: (k) => ({
        dur: 0.3, wave: 'sawtooth', f0: F([[0, 650], [0.4, 820], [1, 560]], k), vib: [6, 0.015],
        formants: [{ f: [[0, 450], [0.4, 800], [1, 550]], q: 5, g: 3 }, { f: [[0, 2000], [1, 1400]], q: 6, g: 2 }],
        lp: [[0, 900], [0.15, 5000], [1, 2000]],
        env: [[0, 0], [0.12, 1], [0.7, 0.7], [1, 0]], gain: 0.85,
      }),
      mrrp: (k) => ({
        dur: 0.26, wave: 'sawtooth', f0: F([[0, 520], [1, 700]], k), am: [24, 0.85],
        formants: [{ f: [[0, 450], [1, 700]], q: 4, g: 3 }, { f: [[0, 1300], [1, 1650]], q: 5, g: 2 }],
        env: [[0, 0], [0.08, 1], [0.8, 0.8], [1, 0]], gain: 0.9,
      }),
      purr: () => ({
        dur: 1, wave: 'sawtooth', f0: [[0, 24], [0.5, 27], [1, 25]],
        formants: [{ f: 300, q: 1, g: 3 }, { f: 900, q: 1, g: 1 }], lp: [[0, 1200], [1, 1200]],
        noise: { g: 0.35, f: 500, q: 0.7 }, am: [25, 0.6],
        env: [[0, 0], [0.15, 1], [0.85, 1], [1, 0]], gain: 0.8,
      }),
      hiss: () => ({ dur: 0.6, noise: { g: 1, f: 4500, q: 0.6 }, env: [[0, 0], [0.05, 1], [0.6, 0.8], [1, 0]], gain: 0.7 }),
      yowl: (k) => ({
        dur: 0.95, wave: 'sawtooth', f0: F([[0, 440], [0.3, 620], [0.7, 590], [1, 360]], k), vib: [6, 0.025],
        formants: [{ f: [[0, 380], [0.2, 800], [0.7, 880], [1, 420]], q: 5, g: 3 }, { f: [[0, 1900], [0.2, 1600], [0.7, 1300], [1, 850]], q: 6, g: 2.2 }],
        lp: [[0, 700], [0.1, 4500], [0.85, 3000], [1, 1000]],
        noise: { g: 0.05, f: 3000, q: 0.5 },
        env: [[0, 0], [0.1, 0.9], [0.5, 1], [0.85, 0.75], [1, 0]],
      }),
    },
    rabbit: {
      thump: () => ({
        dur: 0.22, wave: 'sine', f0: [[0, 120], [0.25, 62], [1, 42]], dry: 1.4,
        noise: { g: 0.6, f: 200, q: 0.7, type: 'lowpass', env: [[0, 1], [0.2, 0.2], [0.6, 0]] },
        env: [[0, 0], [0.02, 1], [0.3, 0.45], [1, 0]], gain: 1.2,
      }),
      honk: (k) => ({
        dur: 0.1, wave: 'sawtooth', f0: F([[0, 240], [1, 205]], k),
        formants: [{ f: 680, q: 6, g: 3 }, { f: 1550, q: 6, g: 2 }], noise: { g: 0.25, f: 1200, q: 0.8 },
        env: [[0, 0], [0.1, 1], [0.6, 0.7], [1, 0]], gain: 0.7,
      }),
      brrr: () => ({ dur: 0.6, noise: { g: 1, f: 2400, q: 1.5 }, am: [22, 1, 'square'], env: [[0, 0], [0.1, 1], [0.9, 0.9], [1, 0]], gain: 0.4 }),
      grunt: (k) => ({
        dur: 0.14, wave: 'sawtooth', f0: F([[0, 160], [1, 120]], k), formants: [{ f: 500, q: 3, g: 2 }, { f: 1100, q: 4, g: 1 }],
        noise: { g: 0.4, f: 700, q: 0.8 }, env: [[0, 0], [0.08, 1], [1, 0]], gain: 0.7,
      }),
    },
    bird: {
      tweet: (k, r) => [0, 0.11].slice(0, r() < 0.5 ? 1 : 2).map((at) => ({
        at, dur: 0.09, wave: 'sine', f0: F([[0, 2500], [1, 4300]], k), harm: [[2, 0.12]], dry: 1,
        env: [[0, 0], [0.15, 1], [0.7, 0.7], [1, 0]], gain: 0.7,
      })),
      chirp: (k) => ({ dur: 0.07, wave: 'sine', f0: F([[0, 4300], [1, 2800]], k), harm: [[2, 0.1]], dry: 1, env: [[0, 0], [0.1, 1], [0.6, 0.6], [1, 0]], gain: 0.7 }),
      warble: (k) => ({ dur: 0.32, wave: 'sine', f0: F([[0, 2900], [1, 3400]], k), vib: [32, 0.12], dry: 1, env: [[0, 0], [0.1, 1], [0.85, 0.8], [1, 0]], gain: 0.6 }),
      trill: (k) => ({ dur: 0.3, wave: 'sine', f0: F([[0, 3200], [1, 3500]], k), am: [28, 1], dry: 1, env: [[0, 0], [0.05, 1], [0.9, 0.9], [1, 0]], gain: 0.7 }),
      squawk: (k) => ({
        dur: 0.24, wave: 'sawtooth', drive: 3, f0: F([[0, 1100], [0.3, 1300], [1, 950]], k),
        formants: [{ f: 1800, q: 2, g: 2 }, { f: 3200, q: 3, g: 1.5 }], noise: { g: 0.5, f: 2500, q: 0.7 },
        env: [[0, 0], [0.05, 1], [0.6, 0.8], [1, 0]], gain: 0.75,
      }),
    },
    hamster: {
      squeak: (k) => ({ dur: 0.11, wave: 'triangle', f0: F([[0, 2300], [0.5, 2900], [1, 2650]], k), vib: [38, 0.03], dry: 1, env: [[0, 0], [0.1, 1], [0.7, 0.8], [1, 0]], gain: 0.6 }),
      eek: (k) => ({ dur: 0.07, wave: 'triangle', f0: F([[0, 3000], [1, 3600]], k), dry: 1, env: [[0, 0], [0.1, 1], [1, 0]], gain: 0.6 }),
      chitter: () => ({ dur: 0.45, noise: { g: 1, f: 3500, q: 2 }, am: [18, 1, 'square'], env: [[0, 0], [0.05, 1], [0.9, 0.9], [1, 0]], gain: 0.55 }),
    },
    horse: {
      neigh: (k) => ({
        dur: 1.25, wave: 'sawtooth', f0: F([[0, 760], [0.08, 900], [0.35, 820], [0.7, 520], [1, 330]], k), vib: [11, 0.07],
        harm: [[1.42, 0.25]], am: [12, 0], amEnv: [[0, 0], [0.4, 0.1], [1, 0.9]],
        formants: [{ f: [[0, 800], [1, 550]], q: 3, g: 2.5 }, { f: [[0, 1700], [1, 1100]], q: 4, g: 1.8 }, { f: 2600, q: 3, g: 0.6 }],
        noise: { g: 0.15, f: 2000, q: 0.5 },
        env: [[0, 0], [0.06, 1], [0.5, 0.9], [0.85, 0.7], [1, 0]],
      }),
      nicker: (k) => ({
        dur: 0.6, wave: 'sawtooth', f0: F([[0, 130], [1, 105]], k), am: [11, 0.9],
        formants: [{ f: 450, q: 2, g: 3 }, { f: 1000, q: 3, g: 1.5 }], noise: { g: 0.3, f: 600, q: 0.8 },
        env: [[0, 0], [0.1, 1], [0.8, 0.8], [1, 0]], gain: 0.85,
      }),
      snort: () => ({
        dur: 0.32, wave: 'sawtooth', f0: [[0, 85], [1, 60]], formants: [{ f: 300, q: 1, g: 1 }], am: [30, 0.7],
        noise: { g: 1.2, f: 900, q: 0.6 }, env: [[0, 0], [0.04, 1], [0.4, 0.6], [1, 0]], gain: 0.8,
      }),
    },
    turtle: {
      hmm: (k) => ({ dur: 0.7, wave: 'triangle', f0: F([[0, 125], [1, 100]], k), dry: 1, lp: [[0, 600], [1, 500]], env: [[0, 0], [0.25, 1], [0.8, 0.8], [1, 0]], gain: 0.7 }),
      blub: (k, r) => [0, 0.12 + r() * 0.08].map((at) => ({ at, dur: 0.07, wave: 'sine', f0: F([[0, 260], [1, 760]], k), dry: 1, env: [[0, 0], [0.1, 1], [1, 0]], gain: 0.6 })),
      hiss: () => ({ dur: 0.5, noise: { g: 0.8, f: 3800, q: 0.6 }, env: [[0, 0], [0.1, 1], [0.7, 0.6], [1, 0]], gain: 0.5 }),
    },
  };

  // Pitch: the voice-box style (gently), and for dogs their size.
  function pitchOf(pet) {
    const style = (C.VOICE_STYLES[pet.translator && pet.translator.voice] || C.VOICE_STYLES.normal).pitch;
    let k = Math.pow(style, 0.45);
    if (pet.species === 'dog') k *= { small: 1.5, medium: 1.12, large: 0.85 }[pet.size] || 1;
    return k;
  }

  // A question ends on a rising note.
  const rise = (pts) => pts.map(([p, f]) => [p, f * (1 + 0.35 * Math.max(0, (p - 0.4) / 0.6))]);

  // Lay the sounds out in time.
  function plan(pet, tr) {
    const sp = SPECIES[tr.species] || SPECIES.dog;
    const kinds = VOICES[tr.species] || VOICES.dog;
    const rng = U.seeded(U.hash('play:' + tr.species + ':' + tr.text));
    const mood = MOOD[tr.intent] || MOOD.fallback;
    const k = pitchOf(pet) * mood[0];
    const items = [];
    let t = 0.04;
    tr.calls.forEach((c) => {
      const made = kinds[c.type](k * (0.96 + rng() * 0.08), rng);
      let span = 0;
      (Array.isArray(made) ? made : [made]).forEach((s) => {
        s.dur *= mood[1];
        if (c.rise && s.f0) s.f0 = rise(s.f0);
        s.gain = (s.gain || 1) * mood[2] * (c.loud ? 1.15 : 1);
        items.push({ t: t + (s.at || 0) * mood[1], s });
        span = Math.max(span, (s.at || 0) * mood[1] + s.dur);
      });
      t += span + sp.gap * (0.75 + rng() * 0.5) + (c.pause ? 0.22 : 0);
    });
    return { items, total: t + 0.15 };
  }

  const RATE = 44100;
  let noiseBuf = null;
  function noiseFor(ctx) {
    if (!noiseBuf) {
      noiseBuf = ctx.createBuffer(1, RATE, RATE);
      const d = noiseBuf.getChannelData(0);
      const r = U.seeded(7);
      for (let i = 0; i < d.length; i++) d[i] = r() * 2 - 1;
    }
    return noiseBuf;
  }
  // Points are [position 0–1, value]; ramps between them across the sound.
  function curve(param, pts, t0, dur, scale, exp) {
    const s = scale == null ? 1 : scale;
    param.setValueAtTime(Math.max(exp ? 1 : 0, pts[0][1] * s), t0);
    for (let i = 1; i < pts.length; i++) {
      const at = t0 + pts[i][0] * dur;
      if (exp) param.exponentialRampToValueAtTime(Math.max(1, pts[i][1] * s), at);
      else param.linearRampToValueAtTime(pts[i][1] * s, at);
    }
  }
  let shapes = {};
  function driveCurve(amount) {
    if (!shapes[amount]) {
      const c = new Float32Array(1024);
      for (let i = 0; i < c.length; i++) c[i] = Math.tanh(((i / 511.5) - 1) * amount) / Math.tanh(amount);
      shapes[amount] = c;
    }
    return shapes[amount];
  }

  function voice(ctx, out, t0, s) {
    const end = t0 + s.dur + 0.02;
    const mix = ctx.createGain();
    if (s.f0) {
      let src = ctx.createGain();
      const oscs = [];
      const main = ctx.createOscillator();
      main.type = s.wave || 'sawtooth';
      curve(main.frequency, s.f0, t0, s.dur, 1, true);
      main.connect(src);
      oscs.push([main, 1]);
      (s.harm || []).forEach(([ratio, g]) => {
        const o = ctx.createOscillator();
        o.type = 'sine';
        curve(o.frequency, s.f0, t0, s.dur, ratio, true);
        const og = ctx.createGain();
        og.gain.value = g;
        o.connect(og).connect(src);
        oscs.push([o, ratio]);
      });
      if (s.vib) {
        const mean = s.f0.reduce((a, p) => a + p[1], 0) / s.f0.length;
        const lfo = ctx.createOscillator();
        lfo.frequency.value = s.vib[0];
        oscs.forEach(([o, ratio]) => {
          const depth = ctx.createGain();
          depth.gain.value = mean * s.vib[1] * ratio;
          lfo.connect(depth).connect(o.frequency);
        });
        lfo.start(t0);
        lfo.stop(end);
      }
      if (s.drive) {
        const ws = ctx.createWaveShaper();
        ws.curve = driveCurve(s.drive);
        src.connect(ws);
        src = ws;
      }
      (s.formants || []).forEach((fm) => {
        const bp = ctx.createBiquadFilter();
        bp.type = 'bandpass';
        bp.Q.value = fm.q;
        curve(bp.frequency, typeof fm.f === 'number' ? [[0, fm.f]] : fm.f, t0, s.dur, 1, true);
        const g = ctx.createGain();
        g.gain.value = fm.g;
        src.connect(bp).connect(g).connect(mix);
      });
      if (s.dry) {
        const g = ctx.createGain();
        g.gain.value = s.dry;
        src.connect(g).connect(mix);
      }
      oscs.forEach(([o]) => { o.start(t0); o.stop(end); });
    }
    if (s.noise) {
      const n = ctx.createBufferSource();
      n.buffer = noiseFor(ctx);
      n.loop = true;
      const f = ctx.createBiquadFilter();
      f.type = s.noise.type || 'bandpass';
      f.frequency.value = s.noise.f;
      f.Q.value = s.noise.q || 0.7;
      const g = ctx.createGain();
      g.gain.value = 0;
      curve(g.gain, s.noise.env || [[0, 1], [1, 1]], t0, s.dur, s.noise.g);
      n.connect(f).connect(g).connect(mix);
      n.start(t0, (t0 * 7.3) % 0.9);
      n.stop(end);
    }
    let node = mix;
    if (s.lp) {
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.Q.value = 0.7;
      curve(lp.frequency, s.lp, t0, s.dur, 1, true);
      node = node.connect(lp);
    }
    const amp = ctx.createGain();
    amp.gain.value = 0;
    curve(amp.gain, s.env, t0, s.dur, s.gain == null ? 1 : s.gain);
    node = node.connect(amp);
    if (s.am) {
      // Pulsing for trills, purrs and growls: gain swings by the depth around (1 - depth/2).
      const am = ctx.createGain();
      const lfo = ctx.createOscillator();
      lfo.type = s.am[2] || 'sine';
      lfo.frequency.value = s.am[0];
      const d = ctx.createGain();
      const depth = s.amEnv || [[0, s.am[1]], [1, s.am[1]]];
      curve(am.gain, depth.map(([p, v]) => [p, 1 - v / 2]), t0, s.dur);
      curve(d.gain, depth.map(([p, v]) => [p, v / 2]), t0, s.dur);
      lfo.connect(d).connect(am.gain);
      lfo.start(t0);
      lfo.stop(end);
      node = node.connect(am);
    }
    node.connect(out);
  }

  // Even out loudness across species: aim for a steady average level without clipping.
  function level(buf) {
    const d = buf.getChannelData(0);
    let peak = 0;
    let sum = 0;
    for (let i = 0; i < d.length; i++) {
      const a = Math.abs(d[i]);
      if (a > peak) peak = a;
      sum += d[i] * d[i];
    }
    if (peak < 1e-4) return false;
    const rms = Math.sqrt(sum / d.length);
    const k = Math.min(0.9 / peak, 0.16 / rms);
    for (let i = 0; i < d.length; i++) d[i] *= k;
    return true;
  }

  const cache = new Map();
  // Render the sounds into an audio buffer (fast, off-screen). Resolves null when unsupported.
  function render(pet, tr) {
    const OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    if (!OAC || !tr || !tr.calls.length) return Promise.resolve(null);
    const key = [tr.species, pitchOf(pet).toFixed(3), tr.text].join('|');
    if (cache.has(key)) return Promise.resolve(cache.get(key));
    const p = plan(pet, tr);
    let ctx;
    try {
      ctx = new OAC(1, Math.ceil(p.total * RATE), RATE);
      p.items.forEach(({ t, s }) => voice(ctx, ctx.destination, t, s));
    } catch (e) {
      return Promise.resolve(null);
    }
    return new Promise((resolve) => {
      ctx.oncomplete = (e) => resolve(e.renderedBuffer);
      const r = ctx.startRendering();
      if (r && r.then) r.then(resolve, () => resolve(null));
    }).then((buf) => {
      if (!buf || !level(buf)) return null;
      cache.set(key, buf);
      if (cache.size > 16) cache.delete(cache.keys().next().value);
      return buf;
    });
  }

  // ---- playback ----------------------------------------------------------------------
  let playing = null;
  // Plays through the device speaker (the collar's voice box in this demo). volume: 0–1.
  // Resolves with the length in seconds, or 0 if nothing played.
  async function play(pet, tr, volume) {
    const ctx = Paw.voice.audio();
    if (!ctx) return 0;
    const buf = await render(pet, tr);
    if (!buf) return 0;
    Paw.voice.stop(); // the voice box says one thing at a time
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const gain = ctx.createGain();
    gain.gain.value = U.clamp(volume, 0, 1);
    src.connect(gain).connect(ctx.destination);
    const item = { petId: pet.id, kind: 'sounds', text: tr.text };
    src.onended = () => {
      if (!playing || playing.src !== src) return;
      playing = null;
      Paw.voice.notify('end', item);
    };
    playing = { src, item };
    src.start();
    Paw.voice.notify('start', item);
    return buf.duration;
  }
  function stop() {
    if (!playing) return;
    const p = playing;
    playing = null;
    try { p.src.stop(); } catch (e) { /* already stopped */ }
    Paw.voice.notify('end', p.item);
  }

  function init() {
    Paw.voice.on((type) => { if (type === 'stop') stop(); });
  }

  Paw.petSounds = { init, translate, render, play, stop, label, inLabel, SPECIES };
})();
