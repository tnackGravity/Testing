/*
 * Jenny Wiley Conference Center - touch panel UI (TSW-770, 1280 x 800)
 * Plain JS, no build step. All control goes through JW_BRIDGE joins (see config.js).
 */
(function () {
  'use strict';
  const C = window.JW_CONFIG, B = window.JW_BRIDGE, P = C.P, R = C.R, MAX = C.LEVEL_MAX;
  const $ = (id) => document.getElementById(id);

  /* ------------------------------------------------------------ helpers */

  function h(tag, attrs, ...kids) {
    const el = document.createElement(tag);
    if (attrs) for (const k in attrs) {
      const v = attrs[k];
      if (v == null || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k.slice(0, 2) === 'on') el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? '' : v);
    }
    kids.flat(Infinity).forEach((c) => {
      if (c == null || c === false) return;
      el.append(c.nodeType ? c : document.createTextNode(String(c)));
    });
    return el;
  }

  const ICONS = {
    power: '<path d="M12 3v9"/><path d="M6.3 6.8a8 8 0 1 0 11.4 0"/>',
    video: '<rect x="3" y="4" width="18" height="12" rx="1.5"/><path d="M12 16v4M8 20h8"/>',
    speaker: '<path d="M4 9.5h3.5L12 6v12l-4.5-3.5H4z"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/>',
    mute: '<path d="M4 9.5h3.5L12 6v12l-4.5-3.5H4z"/><path d="M16 9.5l5 5M21 9.5l-5 5"/>',
    mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3"/>',
    micoff: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3M4 3l16 18"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5V5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8"/>',
    projector: '<rect x="2.5" y="8" width="19" height="9" rx="2"/><circle cx="15.5" cy="12.5" r="2.5"/><path d="M6 12.5h4M6 17v2M18 17v2"/>',
    rooms: '<rect x="3" y="5" width="18" height="14" rx="1"/><path d="M9 5v14M15 5v14"/>',
    system: '<path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/>',
    lock: '<rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>',
    home: '<path d="M4 11l8-7 8 7"/><path d="M6 10v9h12v-9"/>',
    mixer: '<path d="M6 4v16M12 4v16M18 4v16"/><path d="M4 14h4M10 8h4M16 12h4" stroke-width="3.4"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    minus: '<path d="M5 12h14"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    back: '<path d="M20 12H7M12 6l-6 6 6 6"/>',
    alert: '<path d="M12 4l9 16H3z"/><path d="M12 10v4.5M12 17.4v.4"/>',
    plug: '<path d="M5 8h14v4l-2.5 4h-9L5 12z"/><path d="M9 8V5M15 8V5"/>',
    up: '<path d="M12 19V5M6 11l6-6 6 6"/>',
    down: '<path d="M12 5v14M6 13l6 6 6-6"/>',
    stop: '<rect x="6.5" y="6.5" width="11" height="11" rx="1.5"/>',
    person: '<circle cx="12" cy="8" r="3.5"/><path d="M5 20a7 7 0 0 1 14 0"/>',
    blank: '<rect x="3" y="5" width="18" height="13" rx="1.5"/><path d="M4 6l16 11"/>'
  };
  function icon(name, cls) {
    const s = h('span', { class: 'ico ' + (cls || '') });
    s.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICONS[name] + '</svg>';
    return s;
  }

  /* Subscriptions are grouped so a view can drop its own when it is replaced. */
  let subsView = [], subsOverlay = [], target = null;
  function bind(type, join, fn) { (target || subsView).push(B.sub(type, join, fn)); }
  function drop(list) { list.forEach((u) => u()); list.length = 0; }

  function btn(cls, kids, onTap) {
    return h('button', { class: 'btn ' + (cls || ''), type: 'button', onclick: onTap }, kids);
  }
  /* is-on when every listed digital join is high */
  function fbAll(el, joins, cls) {
    const upd = () => el.classList.toggle(cls || 'is-on', joins.every((j) => B.get('d', j)));
    joins.forEach((j) => bind('d', j, upd));
    return el;
  }
  function fbEq(el, join, value) {
    bind('a', join, (v) => el.classList.toggle('is-on', v === value));
    return el;
  }
  function near(v, pctVal) { return Math.abs(v - pctVal / 100 * MAX) < MAX * 0.006; }
  const toPct = (v) => Math.round(v / MAX * 100);

  function slider(opts) {
    const el = h('div', { class: 'sl ' + (opts.vertical ? 'sl-v' : 'sl-h') },
      h('div', { class: 'sl-track' }, h('div', { class: 'sl-fill' })), h('div', { class: 'sl-thumb' }));
    let dragging = false, lastSend = 0, val = 0;
    function paint(v) { val = v; el.style.setProperty('--p', (v / MAX * 100) + '%'); if (opts.onPaint) opts.onPaint(v); }
    function read(e) {
      const r = el.getBoundingClientRect();
      const f = opts.vertical ? 1 - (e.clientY - r.top) / r.height : (e.clientX - r.left) / r.width;
      return Math.round(Math.max(0, Math.min(1, f)) * MAX);
    }
    function move(e, force) {
      paint(read(e));
      const now = Date.now();
      if (force || now - lastSend > 70) { lastSend = now; B.setA(opts.join, val); }
    }
    el.addEventListener('pointerdown', (e) => { dragging = true; try { el.setPointerCapture(e.pointerId); } catch (x) {} move(e, true); e.preventDefault(); });
    el.addEventListener('pointermove', (e) => { if (dragging) move(e); });
    const end = (e) => { if (!dragging) return; dragging = false; B.setA(opts.join, val); };
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', end);
    bind('a', opts.join, (v) => { if (!dragging) paint(v); });
    return el;
  }

  /* ------------------------------------------------------------ state */

  const ui = { tab: 'home', modal: null, key: '', okey: '', lastMode: '' };

  function scope() {
    return C.rooms.filter((r) => B.get('d', P('d', 'inGroup' + r.id))).map((r) => r.id);
  }
  function homeRoom() { return C.rooms[(B.get('a', P('a', 'homeRoom')) || 1) - 1] || C.rooms[0]; }
  function scopeSources() { const s = scope(); return C.sources.filter((x) => s.indexOf(x.room) >= 0); }
  function layoutN() {
    const names = ['layoutDivided', 'layoutAB', 'layoutBC', 'layoutAll'];
    for (let i = 0; i < 4; i++) if (B.get('d', P('d', names[i]))) return i + 1;
    return 1;
  }
  function modeNow() {
    if (B.get('d', P('d', 'presetAV'))) return 'av';
    if (B.get('d', P('d', 'presetAudio'))) return 'audio';
    if (B.get('d', P('d', 'manual'))) return 'manual';
    return 'off';
  }
  function groupLabel() {
    const s = scope();
    const names = s.map((id) => C.room(id).name);
    return names.join(' + ') + (s.length > 1 ? ' Rooms' : ' Room');
  }
  function srcLabel(src, multi) { return multi ? C.room(src.room).name + ' - ' + src.name : src.name; }

  /* ------------------------------------------------------------ shared pieces */

  function roomMap(layoutNum, opts) {
    opts = opts || {};
    const groups = C.layouts[layoutNum - 1].groups;
    const mine = opts.highlight || [];
    const joined = (a, b) => groups.some((g) => g.indexOf(a) >= 0 && g.indexOf(b) >= 0);
    const box = (r) => h('div', { class: 'rm-room rm-' + r.id + (mine.indexOf(r.id) >= 0 ? ' is-mine' : '') },
      h('span', { class: 'rm-name' }, r.name),
      h('span', { class: 'rm-num' }, r.number),
      opts.here === r.id ? h('span', { class: 'rm-here' }, 'This panel') : null);
    const wall = (a, b) => h('div', { class: 'rm-wall' + (joined(a, b) ? ' is-open' : '') });
    return h('div', { class: 'rm ' + (opts.small ? 'rm-small' : '') },
      box(C.rooms[0]), wall('A', 'B'), box(C.rooms[1]), wall('B', 'C'), box(C.rooms[2]));
  }

  function sceneButtons(roomIds) {
    return h('div', { class: 'scene-row' }, C.lightScenes.map((sc) => {
      const b = btn('btn-tile', h('span', null, sc.name), () => roomIds.forEach((id) => B.pulse(R(id, 'd', 'lightScene' + sc.n))));
      return fbAll(b, roomIds.map((id) => R(id, 'd', 'lightScene' + sc.n)));
    }));
  }

  function sourceTile(src, multi, onTap) {
    const dot = h('span', { class: 'sig' });
    const sigText = h('span', { class: 'tile-sub' });
    bind('d', P('d', 'encSync' + src.n), (v) => { dot.classList.toggle('is-live', v); sigText.textContent = v ? 'Laptop detected' : 'Nothing plugged in'; });
    return btn('btn-source', [
      icon('plug'),
      h('span', { class: 'tile-main' }, h('span', { class: 'tile-title' }, src.name),
        multi ? h('span', { class: 'tile-room' }, C.room(src.room).name) : null, h('span', { class: 'tile-meta' }, dot, sigText))
    ], onTap);
  }

  function card(title, kids, cls) {
    return h('section', { class: 'card ' + (cls || '') }, title ? h('h3', { class: 'card-t' }, title) : null, kids);
  }

  function displayStatus(id) {
    const line = h('span', { class: 'ds-state' });
    const upd = () => {
      const proj = B.get('d', R(id, 'd', 'projWarming')) ? 'Projector warming up' : B.get('d', R(id, 'd', 'projCooling')) ? 'Projector cooling down' :
        B.get('d', R(id, 'd', 'projOn')) ? 'Projector on' : 'Projector off';
      line.textContent = proj + '  /  Screen ' + (B.get('d', R(id, 'd', 'screenDown')) ? 'down' : 'up');
    };
    ['projWarming', 'projCooling', 'projOn', 'screenDown'].forEach((n) => bind('d', R(id, 'd', n), upd));
    return h('div', { class: 'ds' }, icon('projector'), h('div', null, h('div', { class: 'ds-name' }, C.room(id).name), line));
  }

  /* ------------------------------------------------------------ pages */

  function pageLock() {
    let digits = '';
    const dots = h('div', { class: 'pin-dots' });
    const msg = h('p', { class: 'pin-msg' }, 'Enter the PIN to use this room');
    const paint = () => { dots.innerHTML = ''; for (let i = 0; i < Math.max(4, digits.length); i++) dots.append(h('span', { class: 'pin-dot' + (i < digits.length ? ' is-set' : '') })); };
    const key = (label, fn, cls) => btn('btn-key ' + (cls || ''), label, fn);
    const pad = h('div', { class: 'pin-pad' },
      [1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => key(String(n), () => { if (digits.length < 6) { digits += n; paint(); } })),
      key(icon('back'), () => { digits = digits.slice(0, -1); paint(); }, 'btn-key-alt'),
      key('0', () => { if (digits.length < 6) { digits += '0'; paint(); } }),
      key(icon('check'), () => { if (digits) B.setS(P('s', 'pinEntry'), digits); }, 'btn-key-go'));
    bind('d', P('d', 'pinBad'), (v) => {
      if (!v) return;
      digits = ''; paint(); msg.textContent = 'That PIN was not recognized. Try again.';
      dots.classList.remove('shake'); void dots.offsetWidth; dots.classList.add('shake');
    });
    paint();
    return h('div', { class: 'page page-lock' },
      h('div', { class: 'lock-left' }, icon('lock', 'ico-xl'),
        h('h1', { class: 'display' }, groupLabel()), msg,
        h('p', { class: 'hint' }, 'Need help? Contact the front desk.')),
      h('div', { class: 'lock-right' }, dots, pad));
  }

  function pageStart() {
    const s = scope();
    const big = (cls, ico, title, text, join) => btn('btn-preset ' + cls, [
      icon(ico, 'ico-xl'), h('span', { class: 'preset-t' }, title), h('span', { class: 'preset-d' }, text),
      h('span', { class: 'preset-go' }, 'Start')
    ], () => B.pulse(P('d', join)));
    const mapHost = h('div');
    const paintMap = () => { mapHost.innerHTML = ''; mapHost.append(roomMap(layoutN(), { highlight: scope(), here: homeRoom().id, small: true })); };
    ['layoutDivided', 'layoutAB', 'layoutBC', 'layoutAll'].forEach((n) => bind('d', P('d', n), paintMap));
    return h('div', { class: 'page page-start' },
      h('div', { class: 'start-main' },
        h('p', { class: 'eyebrow' }, 'Welcome'),
        h('h1', { class: 'display' }, 'How would you like to use the room?'),
        h('div', { class: 'preset-row' },
          big('preset-av', 'video', 'Audio-Video Conference', 'Projector, screen, lights and sound set for a presentation.', 'presetAV'),
          big('preset-audio', 'mic', 'Audio Only Conference', 'Microphones and sound. The projector stays off.', 'presetAudio')),
        btn('btn-manual', [icon('system'), h('span', null, h('b', null, 'Manual controls'), ' - set up the room yourself, no automatic changes')],
          () => B.pulse(P('d', 'manual')))),
      h('aside', { class: 'start-side' },
        h('h3', { class: 'card-t' }, 'Room layout'), mapHost,
        h('p', { class: 'hint' }, s.length > 1 ? 'These rooms are combined and controlled together from any of their panels.' : 'This panel controls this room only.'),
        h('p', { class: 'hint' }, 'To change the layout, choose Manual controls, then Room Layout.')),
      ridge());
  }

  function ridge() {
    const d = h('div', { class: 'ridge' });
    d.innerHTML = '<svg viewBox="0 0 1280 220" preserveAspectRatio="none" aria-hidden="true">' +
      '<path class="r1" d="M0 150 L90 118 L170 140 L280 84 L360 122 L470 70 L560 116 L660 92 L760 130 L880 76 L980 120 L1090 96 L1180 128 L1280 100 L1280 220 L0 220Z"/>' +
      '<path class="r2" d="M0 176 L120 150 L230 170 L340 132 L460 166 L580 138 L700 172 L830 140 L950 168 L1070 144 L1190 170 L1280 150 L1280 220 L0 220Z"/>' +
      '<path class="r3" d="M0 200 L160 182 L320 198 L500 178 L680 200 L860 182 L1040 198 L1280 184 L1280 220 L0 220Z"/></svg>';
    return d;
  }

  /* --- session: home (preset) views --- */

  function viewHomeAV() {
    const s = scope(), multi = s.length > 1;
    const tiles = scopeSources().map((src) => fbEq(sourceTile(src, multi, () => B.setA(P('a', 'videoAll'), src.n)), P('a', 'videoAll'), src.n));
    const blank = btn('btn-wide', [icon('blank'), h('span', null, 'Blank the screen')], () => s.forEach((id) => B.pulse(R(id, 'd', 'picMute'))));
    fbAll(blank, s.map((id) => R(id, 'd', 'picMute')));
    return h('div', { class: 'cols' },
      card('Show on screen', [
        h('p', { class: 'hint' }, 'Plug a laptop into a wall plate with the HDMI cable, then choose that plate.'),
        h('div', { class: 'tile-grid' }, tiles), blank], 'grow'),
      h('div', { class: 'col' },
        card('Lights', sceneButtons(s)),
        card(multi ? 'Displays' : 'Display', s.map(displayStatus))));
  }

  function viewHomeAudio() {
    const s = scope(), multi = s.length > 1;
    const j = P('a', 'audioSource');
    const none = fbEq(btn('btn-source', [icon('mic'), h('span', { class: 'tile-main' }, h('span', { class: 'tile-title' }, 'Microphones only'),
      h('span', { class: 'tile-meta' }, h('span', { class: 'tile-sub' }, 'No music or laptop audio')))], () => B.setA(j, 0)), j, 0);
    const tiles = scopeSources().map((src) => {
      const t = btn('btn-source', [icon('speaker'), h('span', { class: 'tile-main' }, h('span', { class: 'tile-title' }, src.name),
        multi ? h('span', { class: 'tile-room' }, C.room(src.room).name) : null,
        h('span', { class: 'tile-meta' }, h('span', { class: 'tile-sub' }, '3.5 mm audio jack')))], () => B.setA(j, src.n));
      return fbEq(t, j, src.n);
    });
    return h('div', { class: 'cols' },
      card('Play audio from', [
        h('p', { class: 'hint' }, 'Plug a phone or laptop into the 3.5 mm jack on a wall plate, then choose that plate. Wired microphones use the XLR plates.'),
        h('div', { class: 'tile-grid' }, none, tiles)], 'grow'),
      h('div', { class: 'col' },
        card('Lights', sceneButtons(s))));
  }

  /* --- session: advanced tabs --- */

  function viewVideo() {
    const s = scope(), multi = s.length > 1, srcs = scopeSources();
    return h('div', { class: 'cols cols-even' }, s.map((id) => {
      const j = R(id, 'a', 'videoSource');
      const rows = srcs.map((src) => {
        const dot = h('span', { class: 'sig' });
        bind('d', P('d', 'encSync' + src.n), (v) => dot.classList.toggle('is-live', v));
        return fbEq(btn('btn-row', [dot, h('span', null, srcLabel(src, multi))], () => B.setA(j, src.n)), j, src.n);
      });
      rows.push(fbEq(btn('btn-row btn-row-none', h('span', null, 'No source')), j, 0));
      rows[rows.length - 1].addEventListener('click', () => B.setA(j, 0));
      return card(C.room(id).name + ' projector', [displayStatus(id), h('div', { class: 'row-list' }, rows)]);
    }));
  }

  function viewAudio() {
    const s = scope(), multi = s.length > 1;
    const j = P('a', 'audioSource');
    const afv = fbAll(btn('btn-chip', 'Follow video'), [P('d', 'audioFollowsVideo')]);
    afv.addEventListener('click', () => B.pulse(P('d', 'audioFollowsVideo')));
    const chips = [fbEq(btn('btn-chip', 'None', () => B.setA(j, 0)), j, 0)].concat(
      scopeSources().map((src) => fbEq(btn('btn-chip', srcLabel(src, multi), () => B.setA(j, src.n)), j, src.n)));
    const strips = [];
    s.forEach((id) => {
      if (multi) strips.push(h('div', { class: 'strip-group' }, C.room(id).name));
      C.mics.forEach((m) => {
        const val = h('span', { class: 'strip-val' });
        const mute = btn('btn-mini', [icon('mic'), icon('micoff')], () => B.pulse(R(id, 'd', 'micMute' + m.n)));
        fbAll(mute, [R(id, 'd', 'micMute' + m.n)], 'is-muted');
        const strip = h('div', { class: 'strip strip-' + m.kind },
          h('span', { class: 'strip-name' }, m.name), val,
          slider({ vertical: true, join: R(id, 'a', 'micLevel' + m.n), onPaint: (v) => { val.textContent = toPct(v) + '%'; } }), mute);
        fbAll(strip, [R(id, 'd', 'micMute' + m.n)], 'is-muted');
        strips.push(strip);
      });
    });
    return h('div', { class: 'stack' },
      card('Program audio source', h('div', { class: 'chip-row' }, afv, h('span', { class: 'chip-sep' }), chips)),
      card('Microphone mixer', [
        h('p', { class: 'hint' }, 'Levels reset to their defaults the next time a preset is recalled.'),
        h('div', { class: 'strips' }, strips)], 'grow'));
  }

  function viewLighting() {
    const s = scope();
    const note = h('p', { class: 'banner' }, icon('lock'), h('span', null, 'Wall light switches are disabled while the system is on. They work again after shutdown.'));
    bind('d', P('d', 'wallSwitchLockout'), (v) => { note.hidden = !v; });
    return h('div', { class: 'stack' }, note, h('div', { class: 'cols cols-even grow' }, s.map((id) => {
      const zones = C.room(id).lightZones.map((zn, i) => {
        const j = R(id, 'a', 'lightZone' + (i + 1));
        const val = h('span', { class: 'zone-val' });
        bind('a', j, (v) => { val.textContent = toPct(v) === 0 ? 'Off' : toPct(v) + '%'; });
        const nudge = (d) => B.setA(j, Math.max(0, Math.min(MAX, B.get('a', j) + d * MAX * 0.05)));
        const steps = C.lightSteps.map((p) => {
          const b = btn('btn-step', p === 0 ? 'Off' : String(p), () => B.setA(j, p / 100 * MAX));
          bind('a', j, (v) => b.classList.toggle('is-on', near(v, p)));
          return b;
        });
        return h('div', { class: 'zone' },
          h('div', { class: 'zone-h' }, h('span', { class: 'zone-name' }, zn), val,
            btn('btn-mini', icon('minus'), () => nudge(-1)), btn('btn-mini', icon('plus'), () => nudge(1))),
          h('div', { class: 'step-row' }, steps));
      });
      return card(C.room(id).name, [h('div', { class: 'sub-t' }, 'Scenes'), sceneButtons([id]), h('div', { class: 'sub-t' }, 'Zones'), zones]);
    })));
  }

  function viewDisplays() {
    const s = scope();
    return h('div', { class: 'cols cols-even' }, s.map((id) => {
      const on = fbAll(btn('btn-tile', [icon('power'), h('span', null, 'On')], () => B.pulse(R(id, 'd', 'projOn'))), [R(id, 'd', 'projOn')]);
      const off = fbAll(btn('btn-tile', h('span', null, 'Off'), () => B.pulse(R(id, 'd', 'projOff'))), [R(id, 'd', 'projOff')]);
      const dn = fbAll(btn('btn-tile', [icon('down'), h('span', null, 'Down')], () => B.pulse(R(id, 'd', 'screenDown'))), [R(id, 'd', 'screenDown')]);
      const up = fbAll(btn('btn-tile', [icon('up'), h('span', null, 'Up')], () => B.pulse(R(id, 'd', 'screenUp'))), [R(id, 'd', 'screenUp')]);
      const blank = fbAll(btn('btn-wide', [icon('blank'), h('span', null, 'Blank picture')], () => B.pulse(R(id, 'd', 'picMute'))), [R(id, 'd', 'picMute')]);
      return card(C.room(id).name, [displayStatus(id),
        h('div', { class: 'sub-t' }, 'Projector'), h('div', { class: 'scene-row two' }, on, off),
        h('div', { class: 'sub-t' }, 'Projection screen'), h('div', { class: 'scene-row two' }, dn, up), blank]);
    }));
  }

  function viewLayout() {
    const names = ['layoutDivided', 'layoutAB', 'layoutBC', 'layoutAll'];
    const opts = C.layouts.map((l, i) => {
      const b = btn('btn-layout', [roomMap(l.n, { small: true, highlight: [] }), h('span', { class: 'layout-name' }, l.name)],
        () => { if (layoutN() !== l.n) { ui.modal = { type: 'layout', n: l.n }; overlay(); } });
      return fbAll(b, [P('d', names[i])]);
    });
    return h('div', { class: 'stack' },
      h('p', { class: 'hint' }, 'Match this to the partition walls. Combined rooms share one sound system, and every panel in the group controls all of it.'),
      h('div', { class: 'layout-grid' }, opts));
  }

  function viewSystem() {
    const jT = P('a', 'occTimeoutMin');
    const tVal = h('span', { class: 'stepper-val' });
    bind('a', jT, (v) => { tVal.textContent = v + ' min'; });
    const lockT = fbAll(btn('btn-toggle', [h('span', { class: 'tg' }), h('span', null, 'Require a PIN when the system is off')], () => B.pulse(P('d', 'lockEnabled'))), [P('d', 'lockEnabled')]);
    const row = (label, valueEl) => h('div', { class: 'kv' }, h('span', null, label), valueEl);
    const flag = (join, onText, offText) => { const e = h('b'); bind('d', join, (v) => { e.textContent = v ? onText : offText; e.className = v ? 'on' : ''; }); return e; };
    return h('div', { class: 'cols cols-even' },
      h('div', { class: 'col' },
        card('Automatic shutdown', [
          h('p', { class: 'hint' }, 'If the room is empty for this long, the system warns on screen and then shuts down.'),
          h('div', { class: 'stepper' }, btn('btn-mini', icon('minus'), () => B.setA(jT, Math.max(5, B.get('a', jT) - 5))), tVal,
            btn('btn-mini', icon('plus'), () => B.setA(jT, Math.min(240, B.get('a', jT) + 5))))]),
        card('Panel lock', [lockT, btn('btn-wide', [icon('lock'), h('span', null, 'Lock this panel now')], () => B.pulse(P('d', 'lockNow')))])),
      card('Status', [
        C.rooms.map((r) => row(r.name + ' occupancy', flag(R(r.id, 'd', 'occupied'), 'Occupied', 'Vacant'))),
        row('Wall light switches', flag(P('d', 'wallSwitchLockout'), 'Disabled', 'Enabled')),
        row('Started from backup switch', flag(P('d', 'backupActive'), 'Yes', 'No')),
        row('Control connection', h('b', null, B.mode() === 'live' ? 'CP4' : 'Simulator')),
        row('Interface version', h('b', null, 'v' + C.version))]));
  }

  const TABS = [
    { id: 'home', icon: 'home', name: 'Home' },
    { id: 'video', icon: 'video', name: 'Video', view: viewVideo, title: 'Video routing' },
    { id: 'audio', icon: 'mixer', name: 'Audio Mixer', view: viewAudio, title: 'Audio mixer and routing' },
    { id: 'lighting', icon: 'sun', name: 'Lighting', view: viewLighting, title: 'Lighting' },
    { id: 'displays', icon: 'projector', name: 'Displays', view: viewDisplays, title: 'Projectors and screens' },
    { id: 'layout', icon: 'rooms', name: 'Room Layout', view: viewLayout, title: 'Room layout' },
    { id: 'system', icon: 'system', name: 'System', view: viewSystem, title: 'System', feature: 'techPage' }
  ];

  function pageSession(mode) {
    const tabs = TABS.filter((t) => (!t.feature || C.features[t.feature]) && !(t.id === 'home' && mode === 'manual'));
    const nav = h('nav', { class: 'nav' }, tabs.map((t, i) => [
      (t.id !== 'home' && (i === 0 || tabs[i - 1].id === 'home')) ? h('div', { class: 'nav-cap' }, mode === 'manual' ? 'Manual controls' : 'Advanced') : null,
      btn('btn-nav' + (ui.tab === t.id ? ' is-on' : ''), [icon(t.icon), h('span', null, t.id === 'home' ? (mode === 'av' ? 'Presentation' : 'Conference') : t.name)],
        () => { ui.tab = t.id; route(); })
    ]));
    const tab = tabs.filter((t) => t.id === ui.tab)[0] || tabs[0];
    const title = tab.id === 'home' ? (mode === 'av' ? 'Audio-Video Conference' : 'Audio Only Conference') : tab.title;
    const body = tab.id === 'home' ? (mode === 'av' ? viewHomeAV() : viewHomeAudio()) : tab.view();
    return h('div', { class: 'page page-session' }, nav,
      h('div', { class: 'content' }, h('h2', { class: 'content-t' }, title), body));
  }

  /* ------------------------------------------------------------ header / footer */

  function buildHeader() {
    const name = h('div', { class: 'hdr-room' });
    const sub = h('div', { class: 'hdr-sub' });
    const pill = h('div', { class: 'pill' });
    const clock = h('div', { class: 'hdr-clock' });
    const lockB = btn('btn-icon', icon('lock'), () => B.pulse(P('d', 'lockNow')));
    lockB.setAttribute('aria-label', 'Lock panel');
    const upd = () => {
      const s = scope(), m = modeNow();
      name.textContent = groupLabel();
      sub.textContent = s.map((id) => 'Room ' + C.room(id).number).join('  /  ');
      pill.textContent = m === 'av' ? 'Audio-Video Conference' : m === 'audio' ? 'Audio Only Conference' : m === 'manual' ? 'Manual' : 'System off';
      pill.className = 'pill' + (m === 'off' ? '' : ' is-on');
      lockB.hidden = !B.get('d', P('d', 'lockEnabled')) || B.get('d', P('d', 'locked'));
    };
    target = [];
    ['inGroupA', 'inGroupB', 'inGroupC', 'presetAV', 'presetAudio', 'manual', 'lockEnabled', 'locked'].forEach((n) => bind('d', P('d', n), upd));
    bind('a', P('a', 'homeRoom'), upd);
    target = null;
    const tick = () => { clock.textContent = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }); };
    tick(); setInterval(tick, 10000);
    const mark = h('span', { class: 'brand-mark' });
    mark.innerHTML = '<svg viewBox="0 0 48 32" aria-hidden="true"><path d="M2 28 L15 9 L22 18 L30 5 L46 28Z" fill="currentColor"/></svg>';
    $('hdr').append(
      h('div', { class: 'brand' }, mark, h('div', null, h('div', { class: 'brand-n' }, C.site), h('div', { class: 'brand-s' }, C.siteSub))),
      h('div', { class: 'hdr-mid' }, name, sub),
      h('div', { class: 'hdr-right' }, pill, clock, lockB));
  }

  function buildFooter() {
    target = [];
    const hold = (cls, ico, join) => {
      const b = h('button', { class: 'btn btn-round ' + cls, type: 'button' }, icon(ico));
      const up = () => B.press(join, false);
      b.addEventListener('pointerdown', (e) => { e.preventDefault(); B.press(join, true); });
      ['pointerup', 'pointerleave', 'pointercancel'].forEach((ev) => b.addEventListener(ev, up));
      return b;
    };
    const val = h('span', { class: 'vol-val' });
    const mute = btn('btn-foot btn-mute', [icon('speaker'), icon('mute'), h('span', { class: 'lbl-a' }, 'Mute'), h('span', { class: 'lbl-b' }, 'Muted')], () => B.pulse(P('d', 'progMute')));
    fbAll(mute, [P('d', 'progMute')], 'is-muted');
    const mics = btn('btn-foot btn-mute', [icon('mic'), icon('micoff'), h('span', { class: 'lbl-a' }, 'Mute mics'), h('span', { class: 'lbl-b' }, 'Mics muted')], () => B.pulse(P('d', 'micMuteAll')));
    fbAll(mics, [P('d', 'micMuteAll')], 'is-muted');
    const quick = ['Low', 'Med', 'High'].map((n) => fbAll(btn('btn-seg', n, () => B.pulse(P('d', 'vol' + n))), [P('d', 'vol' + n)]));
    const off = btn('btn-foot btn-danger', [icon('power'), h('span', null, 'Shut down')], () => { ui.modal = { type: 'shutdown' }; overlay(); });
    const sl = slider({ join: P('a', 'progVolume'), onPaint: (v) => { val.textContent = toPct(v) + '%'; } });
    target = null;
    $('ftr').append(mics, h('div', { class: 'vol' }, h('span', { class: 'vol-lbl' }, 'Room volume'),
      hold('', 'minus', P('d', 'volDown')), sl, hold('', 'plus', P('d', 'volUp')), val),
      h('div', { class: 'seg' }, quick), mute, h('span', { class: 'spacer' }), off);
  }

  /* ------------------------------------------------------------ overlays */

  function ring(labelEl) {
    const r = h('div', { class: 'ring' }, h('div', { class: 'ring-in' }, labelEl));
    const upd = () => {
      const total = B.get('a', P('a', 'countdownTotal')) || 1, left = B.get('a', P('a', 'countdownRemain'));
      r.style.setProperty('--f', Math.round((1 - left / total) * 100) + '%');
      labelEl.textContent = left;
    };
    bind('a', P('a', 'countdownRemain'), upd); bind('a', P('a', 'countdownTotal'), upd);
    return r;
  }

  function overlay() {
    const cooling = B.get('d', P('d', 'cooling')), warming = B.get('d', P('d', 'warming'));
    const occ = B.get('d', P('d', 'occWarning')), locked = B.get('d', P('d', 'locked'));
    let kind = cooling ? 'cool' : warming ? 'warm' : occ ? 'occ' : ui.modal ? ui.modal.type + (ui.modal.n || '') : '';
    if (locked && kind !== 'cool') kind = '';
    if (kind === ui.okey) return;
    ui.okey = kind;
    const host = $('overlay');
    drop(subsOverlay); host.innerHTML = ''; host.hidden = !kind;
    if (!kind) return;
    target = subsOverlay;
    const close = () => { ui.modal = null; overlay(); };
    let box;
    if (kind === 'warm') {
      const av = modeNow() === 'av';
      box = h('div', { class: 'ov-box' }, ring(h('span', null)), h('h2', { class: 'display' }, 'Getting the room ready'),
        h('p', null, av ? 'The projector is warming up and the screen is coming down.' : 'Turning on the sound system.'), h('p', { class: 'hint' }, 'Seconds remaining'));
    } else if (kind === 'cool') {
      box = h('div', { class: 'ov-box' }, ring(h('span', null)), h('h2', { class: 'display' }, 'Shutting down'),
        h('p', null, 'The projector is cooling and the screen is going up. Microphones and speakers are muted.'), h('p', { class: 'hint' }, 'Seconds remaining'));
    } else if (kind === 'occ') {
      const n = h('b');
      bind('a', P('a', 'occWarnRemain'), (v) => { n.textContent = v; });
      box = h('div', { class: 'ov-box ov-modal' }, icon('person', 'ico-xl'), h('h2', { class: 'display' }, 'Is anyone still here?'),
        h('p', null, 'The room looks empty. The system will shut down in ', n, ' seconds.'),
        h('div', { class: 'ov-actions' }, btn('btn-primary', 'Keep system on', () => B.pulse(P('d', 'occStay')))));
    } else if (ui.modal.type === 'shutdown') {
      box = h('div', { class: 'ov-box ov-modal' }, icon('power', 'ico-xl'), h('h2', { class: 'display' }, 'Shut down the ' + groupLabel().replace(/ Rooms?$/, '') + ' system?'),
        h('p', null, 'Projectors turn off, screens go up, microphones and speakers mute, and the lights turn off.'),
        h('div', { class: 'ov-actions' }, btn('btn-ghost', 'Cancel', close),
          btn('btn-danger-solid', 'Shut down', () => { ui.modal = null; B.pulse(P('d', 'shutdown')); overlay(); })));
    } else {
      const l = C.layouts[ui.modal.n - 1];
      const joinName = ['layoutDivided', 'layoutAB', 'layoutBC', 'layoutAll'][l.n - 1];
      box = h('div', { class: 'ov-box ov-modal' }, roomMap(l.n, { small: true }), h('h2', { class: 'display' }, 'Change layout to ' + l.name + '?'),
        h('p', null, 'This changes how every panel in the conference center controls the rooms. Make sure the partition walls match.'),
        h('div', { class: 'ov-actions' }, btn('btn-ghost', 'Cancel', close),
          btn('btn-primary', 'Change layout', () => { ui.modal = null; B.pulse(P('d', joinName)); overlay(); })));
    }
    target = null;
    host.append(box);
  }

  /* ------------------------------------------------------------ routing */

  let pending = false;
  function schedule() { if (pending) return; pending = true; setTimeout(() => { pending = false; route(); }, 0); }

  function route() {
    const locked = B.get('d', P('d', 'locked')), mode = modeNow();
    const screen = locked ? 'lock' : mode === 'off' ? 'start' : 'session';
    if (mode !== ui.lastMode) { ui.lastMode = mode; ui.tab = mode === 'manual' ? 'video' : 'home'; ui.modal = null; }
    if (screen !== 'session') ui.modal = null;
    const key = [screen, mode, scope().join(''), homeRoom().id, ui.tab].join('|');
    if (key !== ui.key) {
      ui.key = key;
      drop(subsView);
      const view = $('view');
      view.innerHTML = '';
      view.append(screen === 'lock' ? pageLock() : screen === 'start' ? pageStart() : pageSession(mode));
      $('ftr').hidden = screen !== 'session';
      $('stage').className = 'is-' + screen;
    }
    overlay();
  }

  /* ------------------------------------------------------------ demo toolbar + scaling */

  function buildDemoBar() {
    const bar = $('demo-bar');
    bar.hidden = false;
    const rooms = C.rooms.map((r) => {
      const b = h('button', { type: 'button', class: 'db-btn' }, r.name);
      b.addEventListener('click', () => { window.JW_SIM.setHome(r.id); paint(); });
      return b;
    });
    let sw = false;
    const swB = h('button', { type: 'button', class: 'db-btn' });
    swB.addEventListener('click', () => { sw = !sw; window.JW_SIM.backupSwitch(sw); paint(); });
    const vac = h('button', { type: 'button', class: 'db-btn' }, 'Simulate empty room');
    vac.addEventListener('click', () => window.JW_SIM.vacate());
    function paint() {
      rooms.forEach((b, i) => b.classList.toggle('is-on', C.rooms[i].id === window.JW_SIM.home()));
      swB.textContent = 'Backup switch: ' + (sw ? 'SYSTEM ON' : 'off');
      swB.classList.toggle('is-on', sw);
    }
    paint();
    bar.append(h('span', { class: 'db-tag' }, 'DEMO'), h('span', { class: 'db-lbl' }, 'Panel in:'), ...rooms,
      h('span', { class: 'db-sep' }), swB, vac, h('span', { class: 'db-sep' }), h('span', { class: 'db-lbl' }, 'PIN ' + window.JW_SIM.pin()));
  }

  function fit() {
    const bar = $('demo-bar');
    const bh = bar.hidden ? 0 : bar.offsetHeight;
    const s = Math.min(window.innerWidth / C.panel.width, (window.innerHeight - bh) / C.panel.height);
    const wrap = $('stage-wrap');
    $('stage').style.transform = 'scale(' + s + ')';
    wrap.style.width = C.panel.width * s + 'px';
    wrap.style.height = C.panel.height * s + 'px';
  }

  /* ------------------------------------------------------------ boot */

  B.init((mode) => {
    document.body.classList.add('mode-' + mode);
    if (mode === 'sim') {
      const m = /[?&]room=([ABC])/i.exec(location.search);
      window.JW_SIM.start(m ? m[1].toUpperCase() : 'A');
      buildDemoBar();
    }
    buildHeader();
    buildFooter();
    ['locked', 'presetAV', 'presetAudio', 'manual', 'warming', 'cooling', 'occWarning', 'inGroupA', 'inGroupB', 'inGroupC']
      .forEach((n) => B.sub('d', P('d', n), schedule));
    B.sub('a', P('a', 'homeRoom'), schedule);
    window.addEventListener('resize', fit);
    fit();
    route();
  });
})();
