/* Original pet face illustrations, drawn as inline SVG (viewBox 0 0 100 100).
   The face reacts to what the pet is doing: closed eyes when sleeping, livelier when active. */
(function () {
  'use strict';
  const Paw = (window.Paw = window.Paw || {});
  const INK = '#2b2420';
  const PALE = '#f6f1e7';
  const PINK = '#f2a7b5';
  const NOSE = '#e58c9c';

  function coatOf(pet) {
    const C = Paw.config;
    return C.COATS[pet.coat] || C.COATS[(C.SPECIES[pet.species] || C.SPECIES.dog).coats[0]];
  }

  function eyes(c, lx, rx, y, cat) {
    if (c.dark) {
      const iris = cat ? '#e8b64c' : PALE;
      return `<g class="av-eyes">
        <ellipse cx="${lx}" cy="${y}" rx="${cat ? 4.8 : 5.4}" ry="${cat ? 5.8 : 5.4}" fill="${iris}"/>
        <ellipse cx="${rx}" cy="${y}" rx="${cat ? 4.8 : 5.4}" ry="${cat ? 5.8 : 5.4}" fill="${iris}"/>
        <ellipse cx="${lx}" cy="${y}" rx="${cat ? 1.7 : 3.4}" ry="${cat ? 4.4 : 3.4}" fill="${INK}"/>
        <ellipse cx="${rx}" cy="${y}" rx="${cat ? 1.7 : 3.4}" ry="${cat ? 4.4 : 3.4}" fill="${INK}"/></g>`;
    }
    const ryE = cat ? 5.3 : 4.3;
    return `<g class="av-eyes">
      <ellipse cx="${lx}" cy="${y}" rx="4.3" ry="${ryE}" fill="${INK}"/>
      <ellipse cx="${rx}" cy="${y}" rx="4.3" ry="${ryE}" fill="${INK}"/>
      <circle cx="${lx + 1.4}" cy="${y - 1.6}" r="1.3" fill="#fff" opacity=".9"/>
      <circle cx="${rx + 1.4}" cy="${y - 1.6}" r="1.3" fill="#fff" opacity=".9"/></g>`;
  }

  function closedEyes(c, lx, rx, y) {
    const stroke = c.dark ? PALE : INK;
    return `<g class="av-eyes-closed" fill="none" stroke="${stroke}" stroke-width="2.2" stroke-linecap="round">
      <path d="M${lx - 4.5} ${y} q4.5 3.6 9 0"/><path d="M${rx - 4.5} ${y} q4.5 3.6 9 0"/></g>`;
  }
  const look = (c, state, lx, rx, y, cat) => (state === 'sleeping' ? closedEyes(c, lx, rx, y) : eyes(c, lx, rx, y, cat));
  const cheeks = (y, spread) => `<circle cx="${50 - spread}" cy="${y}" r="4" fill="#f28b9a" opacity=".26"/><circle cx="${50 + spread}" cy="${y}" r="4" fill="#f28b9a" opacity=".26"/>`;
  const zzz = '<g class="av-zzz" fill="currentColor"><text x="72" y="27" font-size="13" font-weight="700">z</text><text x="82" y="17" font-size="9" font-weight="700">z</text></g>';
  const sleepy = (state) => (state === 'sleeping' ? zzz : '');

  function dog(c, state) {
    return `
      <g class="av-ear av-ear--l"><ellipse cx="24" cy="46" rx="12.5" ry="22" transform="rotate(20 24 46)" fill="${c.shade}"/></g>
      <g class="av-ear av-ear--r"><ellipse cx="76" cy="46" rx="12.5" ry="22" transform="rotate(-20 76 46)" fill="${c.shade}"/></g>
      <circle cx="50" cy="52" r="30" fill="${c.base}"/>
      <ellipse cx="50" cy="66" rx="16.5" ry="12.5" fill="${c.light}"/>
      ${look(c, state, 39, 61, 49, false)}
      <ellipse cx="50" cy="59.5" rx="6.2" ry="4.4" fill="${INK}"/>
      <path d="M50 63.5v3.5M43.5 68.5q6.5 5 13 0" fill="none" stroke="${INK}" stroke-width="2.2" stroke-linecap="round"/>
      ${state === 'active' ? '<path class="av-tongue" d="M46.5 70.6q3.5 8.4 7 0z" fill="#e8798b"/>' : ''}
      ${cheeks(61, 18)}${sleepy(state)}`;
  }

  function cat(c, state) {
    const whisker = c.dark ? PALE : '#5a4a42';
    return `
      <g class="av-ear av-ear--l"><path d="M21 47 26 12 47 30z" fill="${c.shade}"/><path d="M26.5 37 28.8 21 39.5 30.5z" fill="${PINK}" opacity=".75"/></g>
      <g class="av-ear av-ear--r"><path d="M79 47 74 12 53 30z" fill="${c.shade}"/><path d="M73.5 37 71.2 21 60.5 30.5z" fill="${PINK}" opacity=".75"/></g>
      <ellipse cx="50" cy="55" rx="33" ry="29" fill="${c.base}"/>
      <ellipse cx="50" cy="66.5" rx="13.5" ry="9.5" fill="${c.light}"/>
      ${look(c, state, 38, 62, 52, true)}
      <path d="M46.6 59.6h6.8L50 63.2z" fill="${NOSE}"/>
      <path d="M50 63.2v2.2M45.2 66.4q2.4 2.6 4.8-.9q2.4 3.5 4.8.9" fill="none" stroke="#5a4a42" stroke-width="1.8" stroke-linecap="round"/>
      <g stroke="${whisker}" stroke-width="1.4" stroke-linecap="round" opacity=".7"><path d="M31 61 13 57M31 65 13 67M69 61 87 57M69 65 87 67"/></g>
      ${cheeks(62, 17)}${sleepy(state)}`;
  }

  function rabbit(c, state) {
    const whisker = c.dark ? PALE : '#5a4a42';
    return `
      <g class="av-ear av-ear--l"><ellipse cx="38" cy="27" rx="9" ry="22" transform="rotate(-10 38 27)" fill="${c.shade}"/><ellipse cx="38" cy="29" rx="4.4" ry="15" transform="rotate(-10 38 29)" fill="${PINK}" opacity=".7"/></g>
      <g class="av-ear av-ear--r"><ellipse cx="62" cy="27" rx="9" ry="22" transform="rotate(10 62 27)" fill="${c.shade}"/><ellipse cx="62" cy="29" rx="4.4" ry="15" transform="rotate(10 62 29)" fill="${PINK}" opacity=".7"/></g>
      <ellipse cx="50" cy="63" rx="29" ry="25" fill="${c.base}"/>
      <circle cx="44.5" cy="71" r="7.5" fill="${c.light}"/><circle cx="55.5" cy="71" r="7.5" fill="${c.light}"/>
      ${look(c, state, 39, 61, 59, false)}
      <path d="M47 65.2h6l-3 3.2z" fill="${NOSE}"/>
      <path d="M50 68.4v2.4" stroke="${INK}" stroke-width="1.6" stroke-linecap="round"/>
      ${state === 'active' ? '<rect x="47.6" y="72.4" width="4.8" height="5.2" rx="1.2" fill="#fff" stroke="#d9d2c5" stroke-width=".8"/>' : ''}
      <g stroke="${whisker}" stroke-width="1.2" stroke-linecap="round" opacity=".6"><path d="M37 70 22 67M37 73 22 76M63 70 78 67M63 73 78 76"/></g>
      ${cheeks(67, 20)}${sleepy(state)}`;
  }

  function bird(c, state) {
    const ring = state === 'sleeping'
      ? `<g fill="none" stroke="${INK}" stroke-width="2.2" stroke-linecap="round"><path d="M33.5 50q4.5 3.6 9 0"/><path d="M57.5 50q4.5 3.6 9 0"/></g>`
      : `<g class="av-eyes"><circle cx="38" cy="50" r="3.7" fill="${INK}"/><circle cx="62" cy="50" r="3.7" fill="${INK}"/><circle cx="39.2" cy="48.6" r="1.1" fill="#fff"/><circle cx="63.2" cy="48.6" r="1.1" fill="#fff"/></g>`;
    return `
      <g class="av-ear av-ear--l"><path d="M44 27c-3-9 2-16 8-18-1 6 0 12 4 16z" fill="${c.shade}"/></g>
      <g class="av-ear av-ear--r"><path d="M52 26c1-8 7-13 13-13-3 5-4 10-2 15z" fill="${c.shade}"/></g>
      <circle cx="50" cy="55" r="30" fill="${c.base}"/>
      <ellipse cx="50" cy="67" rx="18" ry="15" fill="${c.light}"/>
      <circle cx="38" cy="50" r="6.4" fill="#fff" opacity=".9"/><circle cx="62" cy="50" r="6.4" fill="#fff" opacity=".9"/>
      ${ring}
      <path d="M43.5 57c2-5.6 11-5.6 13 0 .2 5.4-3 9.6-6.5 11.8-3.5-2.2-6.7-6.4-6.5-11.8z" fill="#f0a33a"/>
      <path d="M45.5 61.5q4.5 2.4 9 0" fill="none" stroke="#c97c1c" stroke-width="1.3" stroke-linecap="round"/>
      ${state === 'active' ? '<path d="M47 66.5q3 3.2 6 0" fill="#8a4b2b"/>' : ''}
      <circle cx="33" cy="66" r="3.4" fill="${c.shade}" opacity=".85"/><circle cx="67" cy="66" r="3.4" fill="${c.shade}" opacity=".85"/>
      ${sleepy(state)}`;
  }

  function hamster(c, state) {
    return `
      <g class="av-ear av-ear--l"><circle cx="28" cy="31" r="10" fill="${c.shade}"/><circle cx="28" cy="31" r="5" fill="${PINK}" opacity=".7"/></g>
      <g class="av-ear av-ear--r"><circle cx="72" cy="31" r="10" fill="${c.shade}"/><circle cx="72" cy="31" r="5" fill="${PINK}" opacity=".7"/></g>
      <ellipse cx="50" cy="58" rx="34" ry="30" fill="${c.base}"/>
      <ellipse cx="30" cy="67" rx="12.5" ry="10.5" fill="${c.light}"/><ellipse cx="70" cy="67" rx="12.5" ry="10.5" fill="${c.light}"/>
      <ellipse cx="50" cy="67" rx="10.5" ry="8.5" fill="${c.light}"/>
      ${state === 'sleeping' ? closedEyes(c, 40, 60, 51) : `<g class="av-eyes"><circle cx="40" cy="51" r="3.6" fill="${c.dark ? PALE : INK}"/><circle cx="60" cy="51" r="3.6" fill="${c.dark ? PALE : INK}"/><circle cx="41" cy="50" r="1" fill="#fff"/><circle cx="61" cy="50" r="1" fill="#fff"/></g>`}
      <circle cx="50" cy="60.5" r="2.5" fill="${NOSE}"/>
      <path d="M50 63v2M47 66q3 2.4 6 0" fill="none" stroke="#5a4a42" stroke-width="1.5" stroke-linecap="round"/>
      ${state === 'active' ? '<rect x="48" y="66.6" width="1.8" height="3.2" rx=".6" fill="#fff"/><rect x="50.2" y="66.6" width="1.8" height="3.2" rx=".6" fill="#fff"/>' : ''}
      ${cheeks(64, 21)}${sleepy(state)}`;
  }

  function horse(c, state) {
    const mane = c.dark ? '#141215' : c.shade;
    return `
      <g class="av-ear av-ear--l"><path d="M33 27 29 7 44 20z" fill="${c.shade}"/></g>
      <g class="av-ear av-ear--r"><path d="M67 27 71 7 56 20z" fill="${c.shade}"/></g>
      <ellipse cx="50" cy="53" rx="24" ry="33" fill="${c.base}"/>
      <path d="M50 30c-2.2 10-3 21-2 32h4c1-11 .2-22-2-32z" fill="${c.light}" opacity=".85"/>
      <path d="M38 23c5-7 19-7 24 0-4 1-7 5-8 10-2-3.6-5-5.4-8-5.4-3 0-5.6 1.4-8 3.4 0-3 0-5.6 0-8z" fill="${mane}"/>
      ${look(c, state, 37, 63, 48, false)}
      <ellipse cx="50" cy="76" rx="16.5" ry="12.5" fill="${c.shade}" opacity=".5"/>
      <ellipse cx="44.5" cy="77" rx="2.2" ry="3" fill="${INK}" opacity=".85"/><ellipse cx="55.5" cy="77" rx="2.2" ry="3" fill="${INK}" opacity=".85"/>
      <path d="M44.5 84.5q5.5 3 11 0" fill="none" stroke="${INK}" stroke-width="2" stroke-linecap="round"/>
      ${sleepy(state)}`;
  }

  function turtle(c, state) {
    return `
      <ellipse cx="50" cy="97" rx="45" ry="28" fill="${c.shade}"/>
      <path d="M21 86l13-9h32l13 9M34 77l-5 19M66 77l5 19M50 77v20" fill="none" stroke="${c.light}" stroke-width="2.2" stroke-linejoin="round" opacity=".55"/>
      <ellipse cx="50" cy="55" rx="25" ry="23" fill="${c.base}"/>
      <ellipse cx="50" cy="63" rx="15" ry="8" fill="${c.light}" opacity=".7"/>
      ${state === 'sleeping' ? closedEyes(c, 40, 60, 51) : `<g class="av-eyes"><circle cx="40" cy="51" r="4.4" fill="${INK}"/><circle cx="60" cy="51" r="4.4" fill="${INK}"/><circle cx="41.4" cy="49.4" r="1.4" fill="#fff"/><circle cx="61.4" cy="49.4" r="1.4" fill="#fff"/></g><path d="M35 46.5q5-3 10 0M55 46.5q5-3 10 0" fill="none" stroke="${c.shade}" stroke-width="1.8" stroke-linecap="round"/>`}
      <circle cx="47.5" cy="59" r="1.2" fill="${INK}"/><circle cx="52.5" cy="59" r="1.2" fill="${INK}"/>
      <path d="M41.5 64.5q8.5 6 17 0" fill="none" stroke="${INK}" stroke-width="2" stroke-linecap="round"/>
      ${cheeks(62, 15)}${sleepy(state)}`;
  }

  const DRAW = { dog, cat, rabbit, bird, hamster, horse, turtle };

  function inner(pet, state) {
    return (DRAW[pet.species] || dog)(coatOf(pet), state);
  }

  function svg(pet, state) {
    return `<svg class="avatar" viewBox="0 0 100 100" aria-hidden="true" focusable="false">${inner(pet, state)}</svg>`;
  }

  function stateFor(activity, mood) {
    if (activity === 'sleeping') return 'sleeping';
    if (activity === 'playing' || activity === 'running' || mood === 'excited' || mood === 'playful') return 'active';
    return 'calm';
  }

  // A round avatar "chip". size: xs | sm | md | lg | xl
  function wrap(pet, opts) {
    const o = opts || {};
    const state = o.state || 'calm';
    const delay = (Paw.util.hash(pet.id) % 50) / 10;
    return `<span class="avatar-wrap avatar-wrap--${o.size || 'md'}" data-avatar="${Paw.util.esc(pet.id)}" data-state="${state}" style="--coat-bg:${coatOf(pet).light};--blink-delay:-${delay}s">${svg(pet, state)}</span>`;
  }

  Paw.avatars = { inner, svg, wrap, stateFor, coatOf };
})();
