/* The interface language. Every piece of interface text is written in English and looked up here
   with t('English text', { name: 'Biscuit' }); the other languages live in js/i18n/<lang>.js.
   Anything missing falls back to English, so a new string never shows up blank. Pets keep
   speaking their own translator language; this only changes the app around them. */
(function () {
  'use strict';
  const Paw = (window.Paw = window.Paw || {});
  const C = Paw.config;
  // English needs entries only where one English word means two things in other languages:
  // "Home" the start page (Inicio, Accueil, ホーム) vs. "Home" the pet's house (Casa, Maison, 家).
  const dicts = { en: { 'Home (tab)': 'Home' } };
  const listeners = new Set();
  let lang = 'en';

  const shortOf = (code) => String(code || '').split('-')[0].toLowerCase();
  const supported = (short) => C.LANGUAGES.some((l) => l.short === short);
  const info = (short) => C.LANGUAGES.find((l) => l.short === short) || C.LANGUAGES[0];

  // "auto" means the first of the browser's languages that the app speaks, else English.
  function resolve(choice) {
    if (choice && choice !== 'auto' && supported(shortOf(choice))) return shortOf(choice);
    const wanted = [].concat(navigator.languages || [], navigator.language || []);
    for (const code of wanted) if (supported(shortOf(code))) return shortOf(code);
    return 'en';
  }

  function fill(text, vars) {
    if (!vars) return text;
    return text.replace(/\{(\w+)\}/g, (m, k) => (vars[k] == null ? m : String(vars[k])));
  }
  function t(key, vars) {
    const d = dicts[lang];
    let hit = d && Object.prototype.hasOwnProperty.call(d, key) ? d[key] : key;
    // English possessives: "Biscuit’s", but "Charles’".
    if (lang === 'en' && vars && /s$/i.test(vars.name || '')) hit = hit.replace(/\{name\}’s/g, '{name}’');
    return fill(hit, vars);
  }
  // Plurals: pick the English "one" or "other" form by the current language's rules, then translate it.
  let plural = null;
  function tn(n, one, other, vars) {
    const v = Object.assign({ n: num(n) }, vars);
    // Zero reads as plural everywhere except French ("0 entrée"), whatever the plural rules say.
    const rule = n === 0 && lang !== 'fr' ? 'other' : plural ? plural.select(n) : n === 1 ? 'one' : 'other';
    return t(rule === 'one' ? one : other, v);
  }
  // Lower-case a translated word to use mid-sentence (German keeps nouns capitalized).
  const lower = (s) => (lang === 'de' || lang === 'ja' ? s : String(s).toLocaleLowerCase(locale()));

  const locale = () => info(lang).code;
  const num = (n, opts) => Number(n).toLocaleString(locale(), opts);

  // A language's name in the current interface language, cased for use mid-sentence:
  // "French", "francés", "Französisch", "フランス語".
  let names = null;
  function languageName(code) {
    const short = shortOf(code);
    try {
      const n = names && names.of(short);
      if (n && n !== short) return n;
    } catch (e) { /* fall through */ }
    return t(info(short).english);
  }

  function set(choice) {
    const next = resolve(choice);
    lang = next;
    try { plural = new Intl.PluralRules(locale()); } catch (e) { plural = null; }
    try { names = new Intl.DisplayNames([locale()], { type: 'language' }); } catch (e) { names = null; }
    document.documentElement.lang = locale();
    listeners.forEach((fn) => {
      try { fn(lang); } catch (err) { console.error(err); }
    });
    return lang;
  }

  function add(code, dict) {
    dicts[code] = Object.assign(dicts[code] || {}, dict);
  }

  // Swap the static text in index.html: data-i18n (text), data-i18n-label (aria-label and title).
  function applyStatic(root) {
    (root || document).querySelectorAll('[data-i18n]').forEach((el) => {
      if (!el.dataset.i18nKey) el.dataset.i18nKey = el.dataset.i18n || el.textContent.trim();
      el.textContent = t(el.dataset.i18nKey);
    });
    (root || document).querySelectorAll('[data-i18n-label]').forEach((el) => {
      const key = el.dataset.i18nLabel;
      el.setAttribute('aria-label', t(key));
      if (el.hasAttribute('title')) el.title = t(key);
    });
  }

  Paw.i18n = {
    t, tn, lower, set, add, resolve, applyStatic, languageName, num,
    get lang() { return lang; },
    get locale() { return locale(); },
    has: (code, key) => !!dicts[code] && Object.prototype.hasOwnProperty.call(dicts[code], key),
    dict: (code) => dicts[code] || {},
    on: (fn) => { listeners.add(fn); return () => listeners.delete(fn); },
  };
})();
