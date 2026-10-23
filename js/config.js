/* Static configuration: product name, species models, activities, moods,
   languages and the fictional neighborhood the simulated collars move around. */
(function () {
  'use strict';
  const Paw = (window.Paw = window.Paw || {});

  // Product name. If you rename the app, also update <title> and the brand
  // aria-labels in index.html, manifest.webmanifest and README.md.
  const APP_NAME = 'Pawlyglot';
  const STORAGE_KEY = 'pawlyglot.v1';
  const ACK_KEY = 'pawlyglot.ack';
  const MAX_PETS = 6; // one identity color per pet (validated categorical palette)
  const MAX_LOGS = 1200;

  const SPECIES = {
    dog: { label: 'Dog', activeScale: 1, stepsPerMeter: 1.6, tempC: [38.3, 39.2], breathing: [15, 30] },
    cat: { label: 'Cat', activeScale: 0.6, stepsPerMeter: 1.8, tempC: [38.1, 39.2], breathing: [20, 30] },
  };

  // Resting heart-rate ranges in beats per minute. Demo values loosely based on
  // commonly quoted ranges. They are not veterinary guidance.
  const HR_REST = {
    dog: { small: [90, 130], medium: [70, 110], large: [60, 100] },
    cat: { small: [140, 200], medium: [140, 200], large: [140, 200] },
  };
  const SIZES = { small: 'Small', medium: 'Medium', large: 'Large' };

  // level: where the heart rate sits relative to the resting range (0 = low end, 1 = high end).
  // speed: map units (meters) per simulated second while moving.
  const ACTIVITIES = {
    sleeping: { label: 'Sleeping', icon: 'moon', level: -0.15, active: false },
    resting: { label: 'Resting', icon: 'sofa', level: 0.4, active: false },
    eating: { label: 'Eating', icon: 'bowl', level: 0.6, active: false },
    walking: { label: 'Walking', icon: 'route', level: 1.1, active: true, speed: 9, withOwner: true },
    exploring: { label: 'Exploring', icon: 'compass', level: 0.9, active: true, speed: 5 },
    playing: { label: 'Playing', icon: 'ball', level: 1.8, active: true, speed: 6 },
    running: { label: 'Running', icon: 'bolt', level: 2.4, active: true, speed: 16, withOwner: true },
  };
  const ACTIVITY_ORDER = ['sleeping', 'resting', 'eating', 'walking', 'exploring', 'playing', 'running'];

  const MOODS = {
    happy: { label: 'Happy', icon: 'smile' },
    playful: { label: 'Playful', icon: 'ball' },
    excited: { label: 'Excited', icon: 'sparkle' },
    hungry: { label: 'Hungry', icon: 'bowl' },
    sleepy: { label: 'Sleepy', icon: 'moon' },
    curious: { label: 'Curious', icon: 'search' },
    loving: { label: 'Loving', icon: 'heart' },
    nervous: { label: 'Nervous', icon: 'umbrella' },
    sassy: { label: 'Sassy', icon: 'crown' },
  };
  const MOOD_ORDER = Object.keys(MOODS);

  const LANGUAGES = [
    { code: 'en-US', short: 'en', label: 'English', english: 'English' },
    { code: 'es-ES', short: 'es', label: 'Español', english: 'Spanish' },
    { code: 'fr-FR', short: 'fr', label: 'Français', english: 'French' },
    { code: 'de-DE', short: 'de', label: 'Deutsch', english: 'German' },
    { code: 'it-IT', short: 'it', label: 'Italiano', english: 'Italian' },
    { code: 'pt-BR', short: 'pt', label: 'Português', english: 'Portuguese' },
    { code: 'ja-JP', short: 'ja', label: '日本語', english: 'Japanese' },
  ];

  const VOICE_STYLES = {
    deep: { label: 'Deep', pitch: 0.6, rate: 0.92 },
    normal: { label: 'Normal', pitch: 1, rate: 1 },
    high: { label: 'High', pitch: 1.4, rate: 1.05 },
    squeaky: { label: 'Squeaky', pitch: 1.9, rate: 1.12 },
  };

  // Coat colors for the avatar illustrations (base fur, darker ears, lighter muzzle).
  const COATS = {
    golden: { label: 'Golden', base: '#e2a453', shade: '#b8772f', light: '#f6ddb4' },
    cream: { label: 'Cream', base: '#eed9b6', shade: '#c9a97e', light: '#fbf1e1' },
    ginger: { label: 'Ginger', base: '#e08a45', shade: '#b2622a', light: '#f5c79e' },
    chocolate: { label: 'Chocolate', base: '#8a5a3b', shade: '#5e3b25', light: '#c69c7e' },
    gray: { label: 'Gray', base: '#9ba3ad', shade: '#6e7681', light: '#d5dae0' },
    charcoal: { label: 'Charcoal', base: '#4a4a50', shade: '#2e2e33', light: '#9a9aa3', dark: true },
    white: { label: 'White', base: '#f4f1ec', shade: '#cfc7bc', light: '#ffffff' },
  };

  const LOG_TYPES = {
    walk: { label: 'Walk', icon: 'route', cat: 'activity' },
    run: { label: 'Run', icon: 'bolt', cat: 'activity' },
    play: { label: 'Play', icon: 'ball', cat: 'activity' },
    explore: { label: 'Exploring', icon: 'compass', cat: 'activity' },
    meal: { label: 'Meal', icon: 'bowl', cat: 'activity' },
    nap: { label: 'Sleep', icon: 'moon', cat: 'activity' },
    groom: { label: 'Grooming', icon: 'scissors', cat: 'care' },
    meds: { label: 'Medication', icon: 'pill', cat: 'care' },
    vet: { label: 'Vet visit', icon: 'stethoscope', cat: 'care' },
    note: { label: 'Note', icon: 'pencil', cat: 'care' },
    zone: { label: 'Location', icon: 'pin', cat: 'location' },
    health: { label: 'Heart rate', icon: 'heart', cat: 'health' },
    device: { label: 'Collar', icon: 'collar', cat: 'device' },
  };
  const MANUAL_TYPES = ['walk', 'meal', 'play', 'nap', 'groom', 'meds', 'vet', 'note'];
  const LOG_CATEGORIES = { activity: 'Activity', care: 'Care', location: 'Location', health: 'Health', device: 'Collar' };
  const ACTIVITY_LOG_TYPE = { walking: 'walk', running: 'run', playing: 'play', exploring: 'explore', eating: 'meal', sleeping: 'nap' };

  const SIM_SPEEDS = [1, 2, 4];
  // Seconds between automatic translations for each pet whose translator is on.
  const CHATTINESS = {
    quiet: { label: 'Quiet', range: [90, 160] },
    normal: { label: 'Normal', range: [35, 70] },
    chatty: { label: 'Chatty', range: [14, 28] },
  };

  // The fictional neighborhood. 1 map unit = 1 meter. Roads are center lines.
  const MAP = {
    width: 1000,
    height: 700,
    roadWidth: 30,
    home: { x: 345, y: 362 },
    door: { x: 345, y: 334 },
    zoneCenter: { x: 345, y: 362 },
    spots: { couch: { x: 345, y: 356 }, bed: { x: 326, y: 368 }, bowl: { x: 364, y: 372 } },
    homeHouse: { x: 305, y: 332, w: 80, h: 56 },
    backyard: { x: 285, y: 402, w: 130, h: 100 },
    park: { x: 640, y: 15, w: 345, h: 245 },
    pond: { cx: 842, cy: 125, rx: 72, ry: 45 },
    garden: { x: 650, y: 420, w: 330, h: 105 },
    roads: [
      { name: 'Willow Avenue', short: 'Willow Ave', x1: 0, y1: 290, x2: 1000, y2: 290 },
      { name: 'Maple Street', short: 'Maple St', x1: 0, y1: 560, x2: 1000, y2: 560 },
      { name: 'Birch Lane', short: 'Birch Ln', x1: 200, y1: 0, x2: 200, y2: 700 },
      { name: 'Cedar Road', short: 'Cedar Rd', x1: 610, y1: 0, x2: 610, y2: 700 },
    ],
    blocks: [
      [0, 0, 179, 269], [221, 0, 368, 269], [631, 0, 369, 269],
      [0, 311, 179, 228], [221, 311, 368, 228], [631, 311, 369, 228],
      [0, 581, 179, 119], [221, 581, 368, 119], [631, 581, 369, 119],
    ],
    houses: [
      [20, 20, 60, 44], [100, 20, 60, 44], [20, 95, 60, 44], [100, 95, 60, 44], [20, 170, 60, 44], [100, 170, 60, 44],
      [235, 25, 64, 46], [318, 25, 64, 46], [401, 25, 64, 46], [484, 25, 64, 46],
      [235, 110, 64, 46], [318, 110, 64, 46], [401, 110, 64, 46], [484, 110, 64, 46],
      [235, 195, 64, 46], [318, 195, 64, 46], [401, 195, 64, 46], [484, 195, 64, 46],
      [20, 330, 60, 44], [100, 330, 60, 44], [20, 410, 60, 44], [100, 410, 60, 44], [20, 488, 60, 40], [100, 488, 60, 40],
      [232, 332, 58, 48], [430, 332, 64, 48], [512, 332, 64, 48], [430, 420, 64, 48], [512, 420, 64, 48], [232, 420, 40, 60],
      [20, 600, 60, 44], [100, 600, 60, 44],
      [235, 600, 64, 46], [318, 600, 64, 46], [401, 600, 64, 46], [484, 600, 64, 46],
      [650, 600, 64, 46], [733, 600, 64, 46], [816, 600, 64, 46], [899, 600, 64, 46],
    ],
    trees: [
      [670, 45, 14], [702, 82, 16], [668, 140, 13], [690, 205, 15], [745, 38, 12], [760, 232, 14],
      [930, 40, 15], [965, 95, 12], [962, 182, 16], [918, 238, 13], [822, 236, 12], [878, 218, 11],
      [192, 345, 9], [208, 470, 9], [598, 400, 9], [622, 520, 9], [150, 296, 8], [455, 576, 8],
    ],
    pois: [
      { id: 'vet', label: 'Vet clinic', x: 700, y: 360, w: 90, h: 60, icon: 'stethoscope' },
      { id: 'cafe', label: 'Corner café', x: 905, y: 360, w: 100, h: 60, icon: 'cup' },
    ],
  };

  function ellipseLoop(cx, cy, rx, ry, steps, startDeg, laps) {
    const pts = [];
    const total = steps * (laps || 1);
    for (let i = 0; i <= total; i++) {
      const a = ((startDeg || 180) - (i / steps) * 360) * (Math.PI / 180);
      pts.push([Math.round(cx + rx * Math.cos(a)), Math.round(cy + ry * Math.sin(a))]);
    }
    return pts;
  }

  // Walking routes (with an owner). Each starts and ends at the front door.
  const toPark = [[345, 334], [345, 309], [470, 309], [592, 309], [634, 262], [700, 222], [737, 172]];
  const ROUTES = {
    park: toPark
      .concat(ellipseLoop(842, 125, 105, 78, 16, 180, 1))
      .concat(toPark.slice().reverse()),
    block: [[345, 334], [345, 309], [219, 309], [219, 541], [591, 541], [591, 309], [345, 309], [345, 334]],
    run: toPark
      .concat(ellipseLoop(842, 125, 122, 94, 18, 180, 2))
      .concat(toPark.slice().reverse()),
  };

  Paw.config = {
    APP_NAME, STORAGE_KEY, ACK_KEY, MAX_PETS, MAX_LOGS,
    SPECIES, HR_REST, SIZES, ACTIVITIES, ACTIVITY_ORDER, MOODS, MOOD_ORDER,
    LANGUAGES, VOICE_STYLES, COATS, LOG_TYPES, MANUAL_TYPES, LOG_CATEGORIES,
    ACTIVITY_LOG_TYPE, SIM_SPEEDS, CHATTINESS, MAP, ROUTES,
  };
})();
