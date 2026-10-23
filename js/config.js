/* Static configuration: product name, species models, activities, moods,
   languages and the fictional neighborhood the simulated collars move around. */
(function () {
  'use strict';
  const Paw = (window.Paw = window.Paw || {});

  // Product name. If you rename the app, also update <title> and the brand
  // aria-labels in index.html, manifest.webmanifest and README.md.
  const APP_NAME = 'Pet-Link';
  const STORAGE_KEY = 'petlink.v2';
  const ACK_KEY = 'petlink.ack';
  const MAX_PETS = 6; // one identity color per pet (validated categorical palette)
  const MAX_LOGS = 1200;

  // Body models are loose demo values based on commonly quoted ranges, not veterinary guidance.
  // hr: resting heart rate in bpm (dogs vary by size). tempC: body temperature. breathing: per minute.
  // home: where the pet lives on the map. speed: how fast it moves compared with a dog.
  const FUR = ['golden', 'cream', 'ginger', 'chocolate', 'gray', 'charcoal', 'black', 'white'];
  const SPECIES = {
    dog: {
      label: 'Dog', hr: { small: [90, 130], medium: [70, 110], large: [60, 100] }, tempC: [38.3, 39.2], breathing: [15, 30],
      activeScale: 1, stepsPerMeter: 1.6, speed: 1, home: 'house', canWalk: true, sizes: true,
      coats: FUR, breedHint: 'Golden Retriever', voice: 'normal',
    },
    cat: {
      label: 'Cat', hr: [140, 200], tempC: [38.1, 39.2], breathing: [20, 30],
      activeScale: 0.6, stepsPerMeter: 1.8, speed: 1, home: 'house',
      coats: FUR, breedHint: 'Tabby', voice: 'high',
    },
    rabbit: {
      label: 'Rabbit', hr: [130, 250], tempC: [38.5, 40], breathing: [30, 60],
      activeScale: 0.6, stepsPerMeter: 2.5, speed: 0.9, home: 'yard',
      coats: ['white', 'cream', 'gray', 'chocolate', 'ginger', 'charcoal', 'black'], breedHint: 'Holland Lop', voice: 'high',
    },
    bird: {
      label: 'Bird', hr: [180, 350], tempC: [40, 42], breathing: [25, 45],
      activeScale: 0.5, stepsPerMeter: 1, speed: 1.1, home: 'house',
      coats: ['leaf', 'sky', 'sunny', 'white', 'gray'], breedHint: 'Budgie', voice: 'squeaky',
    },
    hamster: {
      label: 'Hamster', hr: [250, 450], tempC: [36, 38], breathing: [40, 120],
      activeScale: 0.4, stepsPerMeter: 6, speed: 0.4, home: 'house',
      coats: ['golden', 'cream', 'ginger', 'white', 'gray'], breedHint: 'Syrian', voice: 'squeaky',
    },
    horse: {
      label: 'Horse', hr: [28, 44], tempC: [37.2, 38.3], breathing: [8, 16],
      activeScale: 3, stepsPerMeter: 0.7, speed: 1.5, home: 'paddock', canWalk: true,
      coats: ['chocolate', 'ginger', 'golden', 'gray', 'white', 'charcoal', 'black'], breedHint: 'Arabian', voice: 'deep',
    },
    turtle: {
      label: 'Turtle', hr: [20, 40], tempC: [24, 30], breathing: [2, 8],
      activeScale: 0.5, stepsPerMeter: 4, speed: 0.12, home: 'yard',
      coats: ['olive', 'moss', 'sand'], breedHint: 'Red-eared slider', voice: 'deep',
    },
  };
  const SPECIES_ORDER = ['dog', 'cat', 'rabbit', 'bird', 'hamster', 'horse', 'turtle'];
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
  // What each species calls an activity, where it differs.
  const ACTIVITY_NAMES = {
    cat: { running: 'Zoomies' },
    rabbit: { running: 'Zoomies', playing: 'Binkies' },
    bird: { running: 'Flying' },
    hamster: { running: 'Wheel run' },
    horse: { walking: 'Trail ride', running: 'Galloping', eating: 'Grazing' },
    turtle: { running: 'Scooting', resting: 'Basking' },
  };
  const activityLabel = (species, act) => (ACTIVITY_NAMES[species] && ACTIVITY_NAMES[species][act]) || ACTIVITIES[act].label;

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

  // Colors for the avatar illustrations: base (fur, feathers or skin), shade (ears, crest,
  // shell) and light (muzzle, face). Each species offers its own subset.
  const COATS = {
    golden: { label: 'Golden', base: '#e2a453', shade: '#b8772f', light: '#f6ddb4' },
    cream: { label: 'Cream', base: '#eed9b6', shade: '#c9a97e', light: '#fbf1e1' },
    ginger: { label: 'Ginger', base: '#e08a45', shade: '#b2622a', light: '#f5c79e' },
    chocolate: { label: 'Chocolate', base: '#8a5a3b', shade: '#5e3b25', light: '#c69c7e' },
    gray: { label: 'Gray', base: '#9ba3ad', shade: '#6e7681', light: '#d5dae0' },
    charcoal: { label: 'Charcoal', base: '#4a4a50', shade: '#2e2e33', light: '#9a9aa3', dark: true },
    black: { label: 'Black', base: '#2c2b2f', shade: '#18171a', light: '#6d6b72', dark: true },
    white: { label: 'White', base: '#f4f1ec', shade: '#cfc7bc', light: '#ffffff' },
    leaf: { label: 'Leaf green', base: '#7cb84a', shade: '#4f8a2c', light: '#f3e9a6' },
    sky: { label: 'Sky blue', base: '#5ba7e1', shade: '#2f72ad', light: '#f4f1ec' },
    sunny: { label: 'Sunny yellow', base: '#f2c94c', shade: '#c9951c', light: '#fff4cc' },
    olive: { label: 'Olive', base: '#8f9c45', shade: '#5b4a2a', light: '#d9dca8' },
    moss: { label: 'Moss', base: '#6c8c45', shade: '#3e5a2a', light: '#c4d6a2' },
    sand: { label: 'Sand', base: '#c9a46b', shade: '#7a5b34', light: '#ecdcbc' },
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
    // Where each kind of pet rests, sleeps and eats: indoors, in a backyard hutch, or in the paddock.
    spots: {
      house: { couch: { x: 345, y: 356 }, bed: { x: 326, y: 368 }, bowl: { x: 364, y: 372 } },
      yard: { couch: { x: 306, y: 422 }, bed: { x: 300, y: 414 }, bowl: { x: 322, y: 428 } },
      paddock: { couch: { x: 392, y: 482 }, bed: { x: 398, y: 488 }, bowl: { x: 378, y: 476 } },
    },
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
    SPECIES, SPECIES_ORDER, SIZES, ACTIVITIES, ACTIVITY_ORDER, activityLabel, MOODS, MOOD_ORDER,
    LANGUAGES, VOICE_STYLES, COATS, LOG_TYPES, MANUAL_TYPES, LOG_CATEGORIES,
    ACTIVITY_LOG_TYPE, SIM_SPEEDS, CHATTINESS, MAP, ROUTES,
  };
})();
