/*
 * Bridge between the UI and the control system.
 *
 *  - On a Crestron panel (CrComLib present + running on a touchscreen) joins go to the CP4.
 *  - Anywhere else (desktop browser, GitHub Pages demo) joins go to the built-in
 *    simulator in sim.js, which behaves like the CP4 program will.
 *
 * The UI only ever talks to this API:
 *    JW_BRIDGE.sub(type, join, cb) -> unsubscribe fn      type: 'd' | 'a' | 's'
 *    JW_BRIDGE.get(type, join)
 *    JW_BRIDGE.press(join, bool) / pulse(join) / setA(join, n) / setS(join, str)
 */
(function () {
  'use strict';

  var cache = { d: {}, a: {}, s: {} };
  var subs = { d: {}, a: {}, s: {} };
  var CR_TYPE = { d: 'b', a: 'n', s: 's' };
  var mode = 'pending';           // 'live' | 'sim'
  var crSubscribed = {};
  var sink = null;                // simulator inbound handler

  function deliver(type, join, value) {
    if (type === 'd') value = !!value;
    if (type === 'a') value = Number(value) || 0;
    if (type === 's') value = value == null ? '' : String(value);
    cache[type][join] = value;
    var list = subs[type][join];
    if (list) list.slice().forEach(function (cb) { cb(value); });
  }

  function ensureCrSub(type, join) {
    var key = type + join;
    if (mode !== 'live' || crSubscribed[key]) return;
    crSubscribed[key] = true;
    window.CrComLib.subscribeState(CR_TYPE[type], String(join), function (v) { deliver(type, join, v); });
  }

  function send(type, join, value) {
    if (mode === 'live') {
      window.CrComLib.publishEvent(CR_TYPE[type], String(join), value);
    } else if (sink) {
      sink(type, join, value);
    }
  }

  var B = {
    mode: function () { return mode; },
    get: function (type, join) {
      var v = cache[type][join];
      if (v === undefined) return type === 'd' ? false : type === 'a' ? 0 : '';
      return v;
    },
    sub: function (type, join, cb) {
      (subs[type][join] = subs[type][join] || []).push(cb);
      ensureCrSub(type, join);
      cb(B.get(type, join));
      return function () {
        var l = subs[type][join] || [];
        var i = l.indexOf(cb);
        if (i >= 0) l.splice(i, 1);
      };
    },
    press: function (join, down) { send('d', join, !!down); },
    pulse: function (join) { send('d', join, true); send('d', join, false); },
    setA: function (join, n) { send('a', join, Math.round(n)); },
    setS: function (join, str) { send('s', join, String(str)); },

    /* simulator side */
    _attachSim: function (handler) { sink = handler; },
    _emit: deliver,

    /* Decide live vs sim. Calls back once ready. */
    init: function (done) {
      var forceSim = /[?&]sim=1/.test(location.search);
      function finish(m) {
        mode = m;
        if (m === 'live') {
          Object.keys(subs).forEach(function (t) {
            Object.keys(subs[t]).forEach(function (j) { ensureCrSub(t, j); });
          });
        }
        done(m);
      }
      if (forceSim) return finish('sim');
      var s = document.createElement('script');
      s.src = 'vendor/cr-com-lib.js';
      s.onload = function () {
        var lib = window.CrComLib;
        var onPanel = lib && typeof lib.isCrestronTouchscreen === 'function' && lib.isCrestronTouchscreen();
        finish(onPanel ? 'live' : 'sim');
      };
      s.onerror = function () { finish('sim'); };
      document.head.appendChild(s);
    }
  };

  window.JW_BRIDGE = B;
})();
