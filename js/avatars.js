/* Original dog and cat face illustrations, drawn as inline SVG (viewBox 0 0 100 100).
   The face reacts to what the pet is doing: closed eyes when sleeping, tongue out when active. */
(function () {
  'use strict';
  const Paw = (window.Paw = window.Paw || {});
  const INK = '#2b2420';
  const PALE = '#f6f1e7';

  function coatOf(pet) {
    return Paw.config.COATS[pet.coat] || Paw.config.COATS.golden;
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
    const rxE = cat ? 4.3 : 4.3;
    const ryE = cat ? 5.3 : 4.3;
    return `<g class="av-eyes">
      <ellipse cx="${lx}" cy="${y}" rx="${rxE}" ry="${ryE}" fill="${INK}"/>
      <ellipse cx="${rx}" cy="${y}" rx="${rxE}" ry="${ryE}" fill="${INK}"/>
      <circle cx="${lx + 1.4}" cy="${y - 1.6}" r="1.3" fill="#fff" opacity=".9"/>
      <circle cx="${rx + 1.4}" cy="${y - 1.6}" r="1.3" fill="#fff" opacity=".9"/></g>`;
  }

  function closedEyes(c, lx, rx, y) {
    const stroke = c.dark ? PALE : INK;
    return `<g class="av-eyes-closed" fill="none" stroke="${stroke}" stroke-width="2.2" stroke-linecap="round">
      <path d="M${lx - 4.5} ${y} q4.5 3.6 9 0"/><path d="M${rx - 4.5} ${y} q4.5 3.6 9 0"/></g>`;
  }

  const zzz = '<g class="av-zzz" fill="currentColor"><text x="70" y="27" font-size="13" font-weight="700">z</text><text x="80" y="17" font-size="9" font-weight="700">z</text></g>';

  function dog(c, state) {
    return `
      <g class="av-ear av-ear--l"><ellipse cx="24" cy="46" rx="12.5" ry="22" transform="rotate(20 24 46)" fill="${c.shade}"/></g>
      <g class="av-ear av-ear--r"><ellipse cx="76" cy="46" rx="12.5" ry="22" transform="rotate(-20 76 46)" fill="${c.shade}"/></g>
      <circle cx="50" cy="52" r="30" fill="${c.base}"/>
      <ellipse cx="50" cy="66" rx="16.5" ry="12.5" fill="${c.light}"/>
      ${state === 'sleeping' ? closedEyes(c, 39, 61, 49) : eyes(c, 39, 61, 49, false)}
      <ellipse cx="50" cy="59.5" rx="6.2" ry="4.4" fill="${INK}"/>
      <path d="M50 63.5v3.5M43.5 68.5q6.5 5 13 0" fill="none" stroke="${INK}" stroke-width="2.2" stroke-linecap="round"/>
      ${state === 'active' ? '<path class="av-tongue" d="M46.5 70.6q3.5 8.4 7 0z" fill="#e8798b"/>' : ''}
      <circle cx="32" cy="61" r="4.2" fill="#f28b9a" opacity=".28"/><circle cx="68" cy="61" r="4.2" fill="#f28b9a" opacity=".28"/>
      ${state === 'sleeping' ? zzz : ''}`;
  }

  function cat(c, state) {
    const whisker = c.dark ? PALE : '#5a4a42';
    return `
      <g class="av-ear av-ear--l"><path d="M21 47 26 12 47 30z" fill="${c.shade}"/><path d="M26.5 37 28.8 21 39.5 30.5z" fill="#f2a7b5" opacity=".75"/></g>
      <g class="av-ear av-ear--r"><path d="M79 47 74 12 53 30z" fill="${c.shade}"/><path d="M73.5 37 71.2 21 60.5 30.5z" fill="#f2a7b5" opacity=".75"/></g>
      <ellipse cx="50" cy="55" rx="33" ry="29" fill="${c.base}"/>
      <ellipse cx="50" cy="66.5" rx="13.5" ry="9.5" fill="${c.light}"/>
      ${state === 'sleeping' ? closedEyes(c, 38, 62, 52) : eyes(c, 38, 62, 52, true)}
      <path d="M46.6 59.6h6.8L50 63.2z" fill="#e58c9c"/>
      <path d="M50 63.2v2.2M45.2 66.4q2.4 2.6 4.8-.9q2.4 3.5 4.8.9" fill="none" stroke="#5a4a42" stroke-width="1.8" stroke-linecap="round"/>
      <g stroke="${whisker}" stroke-width="1.4" stroke-linecap="round" opacity=".7"><path d="M31 61 13 57M31 65 13 67M69 61 87 57M69 65 87 67"/></g>
      <circle cx="33" cy="62" r="3.8" fill="#f28b9a" opacity=".25"/><circle cx="67" cy="62" r="3.8" fill="#f28b9a" opacity=".25"/>
      ${state === 'sleeping' ? zzz : ''}`;
  }

  function inner(pet, state) {
    const c = coatOf(pet);
    return pet.species === 'cat' ? cat(c, state) : dog(c, state);
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
