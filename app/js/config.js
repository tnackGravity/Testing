/*
 * Jenny Wiley Conference Center - UCI configuration
 * Single source of truth for rooms, devices and the CP4 join map.
 * docs/JOIN_MAP.md is generated from this file (npm run joinmap).
 *
 * Device IDs match drawings AV-601 / AV-602 (Gravity Technology Solutions, proj. 002283).
 */
(function (root) {
  'use strict';

  var CONFIG = {
    version: '0.2.0',
    site: 'Jenny Wiley',
    siteSub: 'Conference Center',
    panel: { width: 1280, height: 800, model: 'TSW-770' },

    /* Feature flags - items still to be confirmed with the owner / other trades */
    features: {
      pinLock: true,       // spec 3.2.A.f - optional, at owner's discretion
      techPage: true
    },

    /* Rooms, west to east as drawn on AV-301 */
    rooms: [
      {
        id: 'A', n: 1, name: 'Iroquois', number: '106', panel: 'TP-A1', screenWall: 'west',
        display: { projector: 'PRJ-A1', decoder: 'DEC-A1', screen: 'SRN-A1' },
        lightZones: ['Front Row', 'Task Lighting']
      },
      {
        id: 'B', n: 2, name: 'Shawnee', number: '107', panel: 'TP-B1', screenWall: 'north',
        display: { projector: 'PRJ-B1', decoder: 'DEC-B1', screen: 'SRN-B1' },
        lightZones: ['Front Row', 'Task Lighting']
      },
      {
        id: 'C', n: 3, name: 'Cherokee', number: '108', panel: 'TP-C1', screenWall: 'east',
        display: { projector: 'PRJ-C1', decoder: 'DEC-C1', screen: 'SRN-C1' },
        lightZones: ['Front Row', 'Task Lighting']
      }
    ],

    /* DM-NVX-E20 wall plate encoders: HDMI + 3.5 mm line in. Index = source number on the wire. */
    sources: [
      { n: 1, id: 'ENC-A1', room: 'A', name: 'Front Wall Plate' },
      { n: 2, id: 'ENC-A2', room: 'A', name: 'Side Wall Plate' },
      { n: 3, id: 'ENC-B1', room: 'B', name: 'Front Wall Plate' },
      { n: 4, id: 'ENC-B2', room: 'B', name: 'Side Wall Plate' },
      { n: 5, id: 'ENC-C1', room: 'C', name: 'Floor Box' },
      { n: 6, id: 'ENC-C2', room: 'C', name: 'Front Wall Plate' }
    ],

    /* Eight mixer channels per room: 4 x Shure MXW + 4 x RDL DD-BN22 XLR inputs */
    mics: [
      { n: 1, name: 'Handheld 1', kind: 'wireless' },
      { n: 2, name: 'Handheld 2', kind: 'wireless' },
      { n: 3, name: 'Lavalier 1', kind: 'wireless' },
      { n: 4, name: 'Lavalier 2', kind: 'wireless' },
      { n: 5, name: 'Front XLR 1', kind: 'wired' },
      { n: 6, name: 'Front XLR 2', kind: 'wired' },
      { n: 7, name: 'Side XLR 1', kind: 'wired' },
      { n: 8, name: 'Side XLR 2', kind: 'wired' }
    ],

    lightScenes: [
      { n: 1, name: 'Full' },
      { n: 2, name: 'Presentation' },
      { n: 3, name: 'Dim' },
      { n: 4, name: 'Off' }
    ],
    lightSteps: [0, 25, 50, 75, 100],

    /* Layouts the two operable partitions allow */
    layouts: [
      { n: 1, key: 'divided', name: 'All Divided', groups: [['A'], ['B'], ['C']] },
      { n: 2, key: 'ab', name: 'Iroquois + Shawnee', groups: [['A', 'B'], ['C']] },
      { n: 3, key: 'bc', name: 'Shawnee + Cherokee', groups: [['A'], ['B', 'C']] },
      { n: 4, key: 'all', name: 'All Combined', groups: [['A', 'B', 'C']] }
    ],

    /* Analog conventions */
    LEVEL_MAX: 65535,       // all levels (volume, mic, lighting) are 0-65535
    SRC_NONE: 0,            // video / audio source "none"
    SRC_MIXED: 99,          // feedback only: displays in the group are on different sources

    /* ------------------------------------------------------------------
     * JOIN MAP
     * Every panel runs the same project and the same join numbers.
     * "panel" joins are resolved by the CP4 per panel (they follow that
     * panel's room group). "room" joins are absolute: base + offset.
     * dir: 'tx' panel -> CP4, 'fb' CP4 -> panel, 'both' same number each way.
     * ------------------------------------------------------------------ */
    joins: {
      panel: {
        d: {
          presetAV:          { j: 1,  dir: 'both', d: 'Recall Preset 1 "Audio-Video Conference" / active fb' },
          presetAudio:       { j: 2,  dir: 'both', d: 'Recall Preset 2 "Audio Only Conference" / active fb' },
          manual:            { j: 3,  dir: 'both', d: 'Start in Manual mode (no automation) / active fb' },
          shutdown:          { j: 4,  dir: 'tx',   d: 'System Shutdown (sent after on-panel confirm)' },
          systemOn:          { j: 5,  dir: 'fb',   d: 'Group system is on' },
          warming:           { j: 6,  dir: 'fb',   d: 'Startup / projector warm-up in progress' },
          cooling:           { j: 7,  dir: 'fb',   d: 'Shutdown / projector cool-down in progress' },
          lockEnabled:       { j: 8,  dir: 'both', d: 'PIN lockout feature enabled (toggle on System page)' },
          pinOk:             { j: 9,  dir: 'fb',   d: 'Pulse: PIN accepted' },
          pinBad:            { j: 10, dir: 'fb',   d: 'Pulse: PIN rejected' },
          inGroupA:          { j: 11, dir: 'fb',   d: 'Iroquois is in this panel\'s group' },
          inGroupB:          { j: 12, dir: 'fb',   d: 'Shawnee is in this panel\'s group' },
          inGroupC:          { j: 13, dir: 'fb',   d: 'Cherokee is in this panel\'s group' },
          volUp:             { j: 14, dir: 'tx',   d: 'Program volume ramp up (press and hold)' },
          volDown:           { j: 15, dir: 'tx',   d: 'Program volume ramp down (press and hold)' },
          progMute:          { j: 16, dir: 'both', d: 'Loudspeaker mute toggle / muted fb' },
          volLow:            { j: 17, dir: 'both', d: 'Quick volume: Low / fb' },
          volMed:            { j: 18, dir: 'both', d: 'Quick volume: Medium (nominal) / fb' },
          volHigh:           { j: 19, dir: 'both', d: 'Quick volume: High / fb' },
          micMuteAll:        { j: 20, dir: 'both', d: 'Mute all microphones toggle / all-muted fb' },
          audioFollowsVideo: { j: 21, dir: 'both', d: 'Audio-follows-video toggle / fb' },
          occWarning:        { j: 22, dir: 'fb',   d: 'Vacancy shutdown warning is showing' },
          occStay:           { j: 23, dir: 'tx',   d: 'Cancel vacancy shutdown ("Keep system on")' },
          wallSwitchLockout: { j: 24, dir: 'fb',   d: 'Lighting wall station (by others) is disabled' },
          locked:            { j: 25, dir: 'fb',   d: 'Panel is locked - show PIN page' },
          lockNow:           { j: 26, dir: 'tx',   d: 'Lock this panel now' },
          layoutDivided:     { j: 31, dir: 'both', d: 'Room layout: all divided / fb' },
          layoutAB:          { j: 32, dir: 'both', d: 'Room layout: Iroquois + Shawnee / fb' },
          layoutBC:          { j: 33, dir: 'both', d: 'Room layout: Shawnee + Cherokee / fb' },
          layoutAll:         { j: 34, dir: 'both', d: 'Room layout: all combined / fb' },
          encSync1:          { j: 51, dir: 'fb',   d: 'ENC-A1 HDMI sync detected' },
          encSync2:          { j: 52, dir: 'fb',   d: 'ENC-A2 HDMI sync detected' },
          encSync3:          { j: 53, dir: 'fb',   d: 'ENC-B1 HDMI sync detected' },
          encSync4:          { j: 54, dir: 'fb',   d: 'ENC-B2 HDMI sync detected' },
          encSync5:          { j: 55, dir: 'fb',   d: 'ENC-C1 HDMI sync detected' },
          encSync6:          { j: 56, dir: 'fb',   d: 'ENC-C2 HDMI sync detected' },
          backupActive:      { j: 57, dir: 'fb',   d: 'System was started from the backup toggle switch' }
        },
        a: {
          progVolume:      { j: 1, dir: 'both', d: 'Program (loudspeaker) level 0-65535' },
          homeRoom:        { j: 2, dir: 'fb',   d: 'Which room this panel is in: 1 Iroquois, 2 Shawnee, 3 Cherokee' },
          countdownRemain: { j: 3, dir: 'fb',   d: 'Warm-up / cool-down seconds remaining' },
          countdownTotal:  { j: 4, dir: 'fb',   d: 'Warm-up / cool-down total seconds' },
          occTimeoutMin:   { j: 5, dir: 'both', d: 'Vacancy shutdown threshold, minutes' },
          occWarnRemain:   { j: 6, dir: 'fb',   d: 'Seconds until vacancy shutdown' },
          audioSource:     { j: 7, dir: 'both', d: 'Program audio source 0 none, 1-6 encoder (used when not following video)' },
          videoAll:        { j: 8, dir: 'both', d: 'Route one source to every display in the group: 0 none, 1-6; fb 99 = mixed' }
        },
        s: {
          pinEntry:  { j: 1, dir: 'tx', d: 'PIN digits entered on the lock page' },
          groupName: { j: 2, dir: 'fb', d: 'Group name, e.g. "Iroquois + Shawnee"' },
          statusText:{ j: 3, dir: 'fb', d: 'One-line status message' }
        }
      },

      roomBase: { A: 100, B: 200, C: 300 },

      room: {
        d: {
          projOn:      { o: 1,  dir: 'both', d: 'Projector power on / on fb' },
          projOff:     { o: 2,  dir: 'both', d: 'Projector power off / off fb' },
          projWarming: { o: 3,  dir: 'fb',   d: 'Projector warming' },
          projCooling: { o: 4,  dir: 'fb',   d: 'Projector cooling' },
          screenDown:  { o: 5,  dir: 'both', d: 'Screen down / down fb' },
          screenUp:    { o: 6,  dir: 'both', d: 'Screen up / up fb' },
          picMute:     { o: 8,  dir: 'both', d: 'Picture mute (blank) toggle / fb' },
          occupied:    { o: 10, dir: 'fb',   d: 'CEN-ODT-C-POE reports occupied' },
          lightScene1: { o: 31, dir: 'both', d: 'Lighting scene: Full / fb' },
          lightScene2: { o: 32, dir: 'both', d: 'Lighting scene: Presentation (task 50%, front row off) / fb' },
          lightScene3: { o: 33, dir: 'both', d: 'Lighting scene: Dim / fb' },
          lightScene4: { o: 34, dir: 'both', d: 'Lighting scene: Off / fb' },
          micMute1:    { o: 51, dir: 'both', d: 'Mic 1 (Handheld 1) mute toggle / fb' },
          micMute2:    { o: 52, dir: 'both', d: 'Mic 2 (Handheld 2) mute toggle / fb' },
          micMute3:    { o: 53, dir: 'both', d: 'Mic 3 (Lavalier 1) mute toggle / fb' },
          micMute4:    { o: 54, dir: 'both', d: 'Mic 4 (Lavalier 2) mute toggle / fb' },
          micMute5:    { o: 55, dir: 'both', d: 'Mic 5 (Front XLR 1) mute toggle / fb' },
          micMute6:    { o: 56, dir: 'both', d: 'Mic 6 (Front XLR 2) mute toggle / fb' },
          micMute7:    { o: 57, dir: 'both', d: 'Mic 7 (Side XLR 1) mute toggle / fb' },
          micMute8:    { o: 58, dir: 'both', d: 'Mic 8 (Side XLR 2) mute toggle / fb' }
        },
        a: {
          videoSource: { o: 1,  dir: 'both', d: 'Display source: 0 none, 1-6 encoder' },
          lightZone1:  { o: 11, dir: 'both', d: 'Lighting zone 1 (Front Row) level 0-65535' },
          lightZone2:  { o: 12, dir: 'both', d: 'Lighting zone 2 (Task Lighting) level 0-65535' },
          lightZone3:  { o: 13, dir: 'both', d: 'Lighting zone 3 (spare) level' },
          lightZone4:  { o: 14, dir: 'both', d: 'Lighting zone 4 (spare) level' },
          micLevel1:   { o: 21, dir: 'both', d: 'Mic 1 level 0-65535' },
          micLevel2:   { o: 22, dir: 'both', d: 'Mic 2 level' },
          micLevel3:   { o: 23, dir: 'both', d: 'Mic 3 level' },
          micLevel4:   { o: 24, dir: 'both', d: 'Mic 4 level' },
          micLevel5:   { o: 25, dir: 'both', d: 'Mic 5 level' },
          micLevel6:   { o: 26, dir: 'both', d: 'Mic 6 level' },
          micLevel7:   { o: 27, dir: 'both', d: 'Mic 7 level' },
          micLevel8:   { o: 28, dir: 'both', d: 'Mic 8 level' }
        },
        s: {}
      }
    }
  };

  /* Join helpers ---------------------------------------------------- */
  CONFIG.P = function (type, name) {
    var e = CONFIG.joins.panel[type][name];
    if (!e) throw new Error('Unknown panel join ' + type + ':' + name);
    return e.j;
  };
  CONFIG.R = function (roomId, type, name) {
    var e = CONFIG.joins.room[type][name];
    if (!e) throw new Error('Unknown room join ' + type + ':' + name);
    return CONFIG.joins.roomBase[roomId] + e.o;
  };
  CONFIG.room = function (id) {
    for (var i = 0; i < CONFIG.rooms.length; i++) if (CONFIG.rooms[i].id === id) return CONFIG.rooms[i];
    return null;
  };
  CONFIG.source = function (n) {
    for (var i = 0; i < CONFIG.sources.length; i++) if (CONFIG.sources[i].n === n) return CONFIG.sources[i];
    return null;
  };

  root.JW_CONFIG = CONFIG;
  if (typeof module !== 'undefined' && module.exports) module.exports = CONFIG;
})(typeof window !== 'undefined' ? window : globalThis);
