/*
 * Simulated CP4.
 *
 * Runs only when the UI is NOT on a Crestron panel. It answers the same joins
 * the real program will, so the demo behaves like the finished system and this
 * file doubles as a behavioural reference for the CP4 program (spec 274100, 3.2).
 *
 * Timings are shortened for demo purposes - see WARM / COOL below.
 */
(function () {
  'use strict';
  var C = window.JW_CONFIG, B = window.JW_BRIDGE;
  var MAX = C.LEVEL_MAX;

  var WARM = 10;          // s, projector warm-up (real: ~30-45 s, set in CP4)
  var COOL = 12;          // s, projector cool-down (real: ~60-90 s)
  var AUDIO_START = 3;    // s, audio-only startup
  var OCC_WARN = 30;      // s, vacancy warning countdown
  var VOL = { low: 0.35, med: 0.6, high: 0.8 };
  var SCENES = { 1: [100, 100], 2: [0, 50], 3: [25, 25], 4: [0, 0] };

  function pct(p) { return Math.round(p / 100 * MAX); }

  function newRoom() {
    var mics = [];
    for (var i = 0; i < 8; i++) mics.push({ mute: true, level: 0.7 });
    return {
      mode: 'off', phase: 'off', count: 0, total: 0,
      proj: 'off', projCount: 0, screen: 'up', picMute: false, vsrc: 0,
      zones: [pct(100), pct(100), 0, 0], shade: 'open',
      mics: mics, vol: VOL.med, mute: true, asrc: 0, afv: true,
      occupied: true, occWarn: 0, locked: true, lockout: false, backup: false
    };
  }

  var S = {
    layout: 1, home: 'A', pin: '1234', lockEnabled: true, occTimeoutMin: 30,
    sync: [true, false, true, false, true, true],
    rooms: { A: newRoom(), B: newRoom(), C: newRoom() }
  };
  var SHARED = ['mode', 'phase', 'count', 'total', 'vol', 'mute', 'asrc', 'afv', 'occWarn', 'locked', 'lockout', 'backup'];
  var ramp = 0;

  function layout() { return C.layouts[S.layout - 1]; }
  function groupOf(id) {
    var g = layout().groups;
    for (var i = 0; i < g.length; i++) if (g[i].indexOf(id) >= 0) return g[i];
    return [id];
  }
  function each(ids, fn) { ids.forEach(function (id) { fn(S.rooms[id], id); }); }
  function setG(ids, patch) { each(ids, function (r) { for (var k in patch) r[k] = patch[k]; }); }
  function firstSource(roomId) {
    for (var i = 0; i < C.sources.length; i++) if (C.sources[i].room === roomId) return C.sources[i].n;
    return 0;
  }

  /* ---------------- Behaviour (spec 3.2) ---------------- */

  function projOn(r) {
    if (r.proj === 'on' || r.proj === 'warming') return;
    r.proj = 'warming'; r.projCount = WARM;
  }
  function projOff(r) {
    if (r.proj === 'off' || r.proj === 'cooling') return;
    r.proj = 'cooling'; r.projCount = COOL; r.picMute = false;
  }

  function recall(ids, mode, leadId) {
    var lead = S.rooms[leadId || ids[0]];
    if (lead.phase === 'cooling') return;
    var common = { mode: mode, mute: false, lockout: true, occWarn: 0 };
    if (lead.mode === 'off') common.vol = VOL.med;

    if (mode === 'av') {
      var src = ids.length > 1 ? firstSource(leadId || ids[0]) : 0;
      each(ids, function (r, id) {
        r.zones[0] = SCENES[2][0] ? pct(SCENES[2][0]) : 0;      // front row off
        r.zones[1] = pct(SCENES[2][1]);                          // task lighting 50 %
        projOn(r); r.screen = 'down'; r.picMute = false;
        r.vsrc = src || firstSource(id);
        r.mics.forEach(function (m) { m.mute = false; });
      });
      common.vol = VOL.med; common.afv = true;
      var warming = ids.some(function (id) { return S.rooms[id].proj === 'warming'; });
      common.phase = warming ? 'warming' : 'on';
      common.count = warming ? WARM : 0; common.total = warming ? WARM : 0;
    } else if (mode === 'audio') {
      each(ids, function (r) { r.mics.forEach(function (m) { m.mute = false; }); });
      common.vol = VOL.med; common.afv = false; common.asrc = firstSource(leadId || ids[0]);
      var cold = lead.mode === 'off';
      common.phase = cold ? 'warming' : 'on';
      common.count = cold ? AUDIO_START : 0; common.total = cold ? AUDIO_START : 0;
    } else { // manual: power the audio path, change nothing else
      each(ids, function (r) { r.mics.forEach(function (m) { m.mute = false; }); });
      common.phase = 'on'; common.count = 0; common.total = 0;
    }
    setG(ids, common);
  }

  function shutdown(ids) {
    var anyProj = false;
    each(ids, function (r) {
      if (r.proj === 'on' || r.proj === 'warming') anyProj = true;
      projOff(r);
      r.screen = 'up'; r.vsrc = 0;
      r.mics.forEach(function (m) { m.mute = true; });
      r.zones = [0, 0, 0, 0];
    });
    var t = anyProj ? COOL : 3;
    setG(ids, { mode: 'off', phase: 'cooling', count: t, total: t, mute: true, lockout: false, occWarn: 0, backup: false });
  }

  function setLayout(n, requester) {
    if (n === S.layout) return;
    S.layout = n;
    layout().groups.forEach(function (g) {
      if (g.length < 2) return;
      var lead = g.indexOf(requester) >= 0 ? requester : (g.filter(function (id) { return S.rooms[id].mode !== 'off'; })[0] || g[0]);
      var src = S.rooms[lead];
      each(g, function (r) { SHARED.forEach(function (k) { r[k] = src[k]; }); });
      /* rooms joining a running group adopt its preset so the group behaves as one room */
      if (src.mode === 'av' || src.mode === 'audio') recall(g, src.mode, lead);
    });
  }

  function tick() {
    var dirty = false;
    ['A', 'B', 'C'].forEach(function (id) {
      var r = S.rooms[id];
      if (r.projCount > 0) {
        r.projCount--; dirty = true;
        if (r.projCount === 0) r.proj = r.proj === 'warming' ? 'on' : 'off';
      }
      if (r.count > 0) {
        r.count--; dirty = true;
        if (r.count === 0) {
          if (r.phase === 'warming') r.phase = 'on';
          else if (r.phase === 'cooling') { r.phase = 'off'; r.locked = S.lockEnabled; }
        }
      }
    });
    layout().groups.forEach(function (g) {
      var lead = S.rooms[g[0]];
      if (lead.occWarn > 0) {
        var left = lead.occWarn - 1; dirty = true;
        if (left === 0) shutdown(g); else setG(g, { occWarn: left });
      }
    });
    if (dirty) sync();
  }

  function rampTick() {
    if (!ramp) return;
    var g = groupOf(S.home), r = S.rooms[S.home];
    setG(g, { vol: Math.max(0, Math.min(1, r.vol + ramp * 0.02)) });
    sync();
  }

  /* ---------------- Feedback ---------------- */

  var sent = { d: {}, a: {}, s: {} };
  function put(type, join, v) {
    if (sent[type][join] === v) return;
    sent[type][join] = v;
    B._emit(type, join, v);
  }
  function near(a, b) { return Math.abs(a - b) < 0.011; }

  function sync() {
    var h = S.home, L = S.rooms[h], g = groupOf(h), P = C.P;
    put('d', P('d', 'presetAV'), L.mode === 'av');
    put('d', P('d', 'presetAudio'), L.mode === 'audio');
    put('d', P('d', 'manual'), L.mode === 'manual');
    put('d', P('d', 'systemOn'), L.mode !== 'off');
    put('d', P('d', 'warming'), L.phase === 'warming');
    put('d', P('d', 'cooling'), L.phase === 'cooling');
    put('d', P('d', 'lockEnabled'), S.lockEnabled);
    put('d', P('d', 'inGroupA'), g.indexOf('A') >= 0);
    put('d', P('d', 'inGroupB'), g.indexOf('B') >= 0);
    put('d', P('d', 'inGroupC'), g.indexOf('C') >= 0);
    put('d', P('d', 'progMute'), L.mute);
    put('d', P('d', 'volLow'), near(L.vol, VOL.low));
    put('d', P('d', 'volMed'), near(L.vol, VOL.med));
    put('d', P('d', 'volHigh'), near(L.vol, VOL.high));
    put('d', P('d', 'micMuteAll'), g.every(function (id) { return S.rooms[id].mics.every(function (m) { return m.mute; }); }));
    put('d', P('d', 'audioFollowsVideo'), L.afv);
    put('d', P('d', 'occWarning'), L.occWarn > 0);
    put('d', P('d', 'wallSwitchLockout'), L.lockout);
    put('d', P('d', 'locked'), S.lockEnabled && L.locked);
    put('d', P('d', 'layoutDivided'), S.layout === 1);
    put('d', P('d', 'layoutAB'), S.layout === 2);
    put('d', P('d', 'layoutBC'), S.layout === 3);
    put('d', P('d', 'layoutAll'), S.layout === 4);
    put('d', P('d', 'backupActive'), L.backup);
    for (var i = 0; i < 6; i++) put('d', P('d', 'encSync' + (i + 1)), S.sync[i]);

    var v0 = S.rooms[g[0]].vsrc;
    var same = g.every(function (id) { return S.rooms[id].vsrc === v0; });
    put('a', P('a', 'progVolume'), Math.round(L.vol * MAX));
    put('a', P('a', 'homeRoom'), C.room(h).n);
    put('a', P('a', 'countdownRemain'), L.count);
    put('a', P('a', 'countdownTotal'), L.total);
    put('a', P('a', 'occTimeoutMin'), S.occTimeoutMin);
    put('a', P('a', 'occWarnRemain'), L.occWarn);
    put('a', P('a', 'audioSource'), L.afv ? L.vsrc : L.asrc);
    put('a', P('a', 'videoAll'), same ? v0 : C.SRC_MIXED);

    put('s', P('s', 'groupName'), g.map(function (id) { return C.room(id).name; }).join(' + '));
    put('s', P('s', 'statusText'),
      L.phase === 'warming' ? 'Starting up' : L.phase === 'cooling' ? 'Shutting down' :
      L.mode === 'off' ? 'System off' : 'System on');

    ['A', 'B', 'C'].forEach(function (id) {
      var r = S.rooms[id], R = function (t, n) { return C.R(id, t, n); };
      put('d', R('d', 'projOn'), r.proj === 'on' || r.proj === 'warming');
      put('d', R('d', 'projOff'), r.proj === 'off' || r.proj === 'cooling');
      put('d', R('d', 'projWarming'), r.proj === 'warming');
      put('d', R('d', 'projCooling'), r.proj === 'cooling');
      put('d', R('d', 'screenDown'), r.screen === 'down');
      put('d', R('d', 'screenUp'), r.screen === 'up');
      put('d', R('d', 'picMute'), r.picMute);
      put('d', R('d', 'occupied'), r.occupied);
      for (var s = 1; s <= 4; s++) {
        put('d', R('d', 'lightScene' + s), r.zones[0] === pct(SCENES[s][0]) && r.zones[1] === pct(SCENES[s][1]));
      }
      put('d', R('d', 'shadeOpen'), r.shade === 'open');
      put('d', R('d', 'shadeClose'), r.shade === 'closed');
      put('a', R('a', 'videoSource'), r.vsrc);
      for (var z = 0; z < 4; z++) put('a', R('a', 'lightZone' + (z + 1)), r.zones[z]);
      r.mics.forEach(function (m, k) {
        put('d', R('d', 'micMute' + (k + 1)), m.mute);
        put('a', R('a', 'micLevel' + (k + 1)), Math.round(m.level * MAX));
      });
    });
  }

  /* ---------------- Inbound joins ---------------- */

  var rev = { panel: { d: {}, a: {}, s: {} }, room: { d: {}, a: {}, s: {} } };
  ['d', 'a', 's'].forEach(function (t) {
    Object.keys(C.joins.panel[t]).forEach(function (n) { rev.panel[t][C.joins.panel[t][n].j] = n; });
    Object.keys(C.joins.room[t]).forEach(function (n) { rev.room[t][C.joins.room[t][n].o] = n; });
  });
  function resolve(type, join) {
    if (join < 100) return { scope: 'panel', name: rev.panel[type][join] };
    var id = join < 200 ? 'A' : join < 300 ? 'B' : 'C';
    return { scope: 'room', id: id, name: rev.room[type][join - C.joins.roomBase[id]] };
  }

  function onDigital(join, down) {
    var t = resolve('d', join), h = S.home, g = groupOf(h), L = S.rooms[h];
    if (!t.name) return;
    if (t.scope === 'panel') {
      if (t.name === 'volUp') { ramp = down ? 1 : 0; return; }
      if (t.name === 'volDown') { ramp = down ? -1 : 0; return; }
      if (!down) return;
      switch (t.name) {
        case 'presetAV': recall(g, 'av', h); break;
        case 'presetAudio': recall(g, 'audio', h); break;
        case 'manual': recall(g, 'manual', h); break;
        case 'shutdown': shutdown(g); break;
        case 'lockEnabled':
          S.lockEnabled = !S.lockEnabled;
          if (!S.lockEnabled) each(['A', 'B', 'C'], function (r) { r.locked = false; });
          break;
        case 'progMute': setG(g, { mute: !L.mute }); break;
        case 'volLow': setG(g, { vol: VOL.low }); break;
        case 'volMed': setG(g, { vol: VOL.med }); break;
        case 'volHigh': setG(g, { vol: VOL.high }); break;
        case 'micMuteAll':
          var all = g.every(function (id) { return S.rooms[id].mics.every(function (m) { return m.mute; }); });
          each(g, function (r) { r.mics.forEach(function (m) { m.mute = !all; }); });
          break;
        case 'audioFollowsVideo': setG(g, { afv: !L.afv, asrc: L.afv ? L.vsrc : L.asrc }); break;
        case 'occStay': setG(g, { occWarn: 0 }); each(g, function (r) { r.occupied = true; }); break;
        case 'lockNow': if (S.lockEnabled) setG(g, { locked: true }); break;
        case 'layoutDivided': setLayout(1, h); break;
        case 'layoutAB': setLayout(2, h); break;
        case 'layoutBC': setLayout(3, h); break;
        case 'layoutAll': setLayout(4, h); break;
      }
    } else {
      if (!down) return;
      var r = S.rooms[t.id], m;
      if ((m = /^micMute(\d)$/.exec(t.name))) { var mic = r.mics[m[1] - 1]; mic.mute = !mic.mute; }
      else if ((m = /^lightScene(\d)$/.exec(t.name))) { r.zones[0] = pct(SCENES[m[1]][0]); r.zones[1] = pct(SCENES[m[1]][1]); }
      else switch (t.name) {
        case 'projOn': projOn(r); break;
        case 'projOff': projOff(r); break;
        case 'screenDown': r.screen = 'down'; break;
        case 'screenUp': r.screen = 'up'; break;
        case 'picMute': if (r.proj === 'on') r.picMute = !r.picMute; break;
        case 'shadeOpen': r.shade = 'open'; break;
        case 'shadeClose': r.shade = 'closed'; break;
        case 'shadeStop': r.shade = 'stopped'; break;
      }
    }
    sync();
  }

  function onAnalog(join, v) {
    var t = resolve('a', join), h = S.home, g = groupOf(h), m;
    if (!t.name) return;
    if (t.scope === 'panel') {
      if (t.name === 'progVolume') setG(g, { vol: v / MAX });
      else if (t.name === 'occTimeoutMin') S.occTimeoutMin = Math.max(5, Math.min(240, v));
      else if (t.name === 'audioSource') setG(g, { asrc: v, afv: false });
      else if (t.name === 'videoAll') each(g, function (r) { r.vsrc = v; });
    } else {
      var r = S.rooms[t.id];
      if (t.name === 'videoSource') r.vsrc = v;
      else if ((m = /^lightZone(\d)$/.exec(t.name))) r.zones[m[1] - 1] = v;
      else if ((m = /^micLevel(\d)$/.exec(t.name))) r.mics[m[1] - 1].level = v / MAX;
    }
    sync();
  }

  function onSerial(join, str) {
    if (join !== C.P('s', 'pinEntry')) return;
    var ok = str === S.pin;
    if (ok) setG(groupOf(S.home), { locked: false });
    var j = C.P('d', ok ? 'pinOk' : 'pinBad');
    B._emit('d', j, true); B._emit('d', j, false);
    sync();
  }

  /* ---------------- Demo hooks (toolbar outside the panel) ---------------- */

  window.JW_SIM = {
    start: function (home) {
      if (home && S.rooms[home]) S.home = home;
      B._attachSim(function (type, join, value) {
        if (type === 'd') onDigital(join, value);
        else if (type === 'a') onAnalog(join, value);
        else onSerial(join, value);
      });
      setInterval(tick, 1000);
      setInterval(rampTick, 80);
      sync();
    },
    setHome: function (id) { ramp = 0; S.home = id; sync(); },
    home: function () { return S.home; },
    pin: function () { return S.pin; },
    /* TOG-0x backup switch: divided + Preset 1 everywhere, or shutdown everywhere */
    backupSwitch: function (on) {
      if (on) {
        setLayout(1, S.home);
        ['A', 'B', 'C'].forEach(function (id) { recall([id], 'av', id); S.rooms[id].backup = true; });
      } else {
        layout().groups.forEach(function (g) { if (S.rooms[g[0]].mode !== 'off') shutdown(g); });
      }
      sync();
    },
    /* Jump straight to the vacancy warning (real system waits occTimeoutMin first) */
    vacate: function () {
      var g = groupOf(S.home);
      if (S.rooms[S.home].mode === 'off') return;
      each(g, function (r) { r.occupied = false; });
      setG(g, { occWarn: OCC_WARN });
      sync();
    },
    _state: S
  };
})();
