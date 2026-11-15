# Join Map — Jenny Wiley Conference Center UCI v0.2.0

> Generated from `app/js/config.js` by `npm run joinmap`. Do not edit by hand.

All three TSW-770 panels load the same project and use the same join numbers.

- **Panel joins (1–99)** follow the panel. The CP4 resolves them against the room group that panel currently belongs to, so each panel needs its own instance of this logic.
- **Room joins (101–399)** are absolute and identical on every panel: Iroquois = 100 + offset, Shawnee = 200 + offset, Cherokee = 300 + offset.
- Levels are 0–65535. Source numbers: 0 = none, 1 = ENC-A1, 2 = ENC-A2, 3 = ENC-B1, 4 = ENC-B2, 5 = ENC-C1, 6 = ENC-C2.
- Buttons are momentary (high on press, low on release). Toggles act on the rising edge.

## Panel joins

### Digital

| Join | Name | Direction | Description |
|---:|---|---|---|
| 1 | `presetAV` | Both | Recall Preset 1 "Audio-Video Conference" / active fb |
| 2 | `presetAudio` | Both | Recall Preset 2 "Audio Only Conference" / active fb |
| 3 | `manual` | Both | Start in Manual mode (no automation) / active fb |
| 4 | `shutdown` | Panel → CP4 | System Shutdown (sent after on-panel confirm) |
| 5 | `systemOn` | CP4 → Panel | Group system is on |
| 6 | `warming` | CP4 → Panel | Startup / projector warm-up in progress |
| 7 | `cooling` | CP4 → Panel | Shutdown / projector cool-down in progress |
| 8 | `lockEnabled` | Both | PIN lockout feature enabled (toggle on System page) |
| 9 | `pinOk` | CP4 → Panel | Pulse: PIN accepted |
| 10 | `pinBad` | CP4 → Panel | Pulse: PIN rejected |
| 11 | `inGroupA` | CP4 → Panel | Iroquois is in this panel's group |
| 12 | `inGroupB` | CP4 → Panel | Shawnee is in this panel's group |
| 13 | `inGroupC` | CP4 → Panel | Cherokee is in this panel's group |
| 14 | `volUp` | Panel → CP4 | Program volume ramp up (press and hold) |
| 15 | `volDown` | Panel → CP4 | Program volume ramp down (press and hold) |
| 16 | `progMute` | Both | Loudspeaker mute toggle / muted fb |
| 17 | `volLow` | Both | Quick volume: Low / fb |
| 18 | `volMed` | Both | Quick volume: Medium (nominal) / fb |
| 19 | `volHigh` | Both | Quick volume: High / fb |
| 20 | `micMuteAll` | Both | Mute all microphones toggle / all-muted fb |
| 21 | `audioFollowsVideo` | Both | Audio-follows-video toggle / fb |
| 22 | `occWarning` | CP4 → Panel | Vacancy shutdown warning is showing |
| 23 | `occStay` | Panel → CP4 | Cancel vacancy shutdown ("Keep system on") |
| 24 | `wallSwitchLockout` | CP4 → Panel | Lighting wall station (by others) is disabled |
| 25 | `locked` | CP4 → Panel | Panel is locked - show PIN page |
| 26 | `lockNow` | Panel → CP4 | Lock this panel now |
| 31 | `layoutDivided` | Both | Room layout: all divided / fb |
| 32 | `layoutAB` | Both | Room layout: Iroquois + Shawnee / fb |
| 33 | `layoutBC` | Both | Room layout: Shawnee + Cherokee / fb |
| 34 | `layoutAll` | Both | Room layout: all combined / fb |
| 51 | `encSync1` | CP4 → Panel | ENC-A1 HDMI sync detected |
| 52 | `encSync2` | CP4 → Panel | ENC-A2 HDMI sync detected |
| 53 | `encSync3` | CP4 → Panel | ENC-B1 HDMI sync detected |
| 54 | `encSync4` | CP4 → Panel | ENC-B2 HDMI sync detected |
| 55 | `encSync5` | CP4 → Panel | ENC-C1 HDMI sync detected |
| 56 | `encSync6` | CP4 → Panel | ENC-C2 HDMI sync detected |
| 57 | `backupActive` | CP4 → Panel | System was started from the backup toggle switch |

### Analog

| Join | Name | Direction | Description |
|---:|---|---|---|
| 1 | `progVolume` | Both | Program (loudspeaker) level 0-65535 |
| 2 | `homeRoom` | CP4 → Panel | Which room this panel is in: 1 Iroquois, 2 Shawnee, 3 Cherokee |
| 3 | `countdownRemain` | CP4 → Panel | Warm-up / cool-down seconds remaining |
| 4 | `countdownTotal` | CP4 → Panel | Warm-up / cool-down total seconds |
| 5 | `occTimeoutMin` | Both | Vacancy shutdown threshold, minutes |
| 6 | `occWarnRemain` | CP4 → Panel | Seconds until vacancy shutdown |
| 7 | `audioSource` | Both | Program audio source 0 none, 1-6 encoder (used when not following video) |
| 8 | `videoAll` | Both | Route one source to every display in the group: 0 none, 1-6; fb 99 = mixed |

### Serial

| Join | Name | Direction | Description |
|---:|---|---|---|
| 1 | `pinEntry` | Panel → CP4 | PIN digits entered on the lock page |
| 2 | `groupName` | CP4 → Panel | Group name, e.g. "Iroquois + Shawnee" |
| 3 | `statusText` | CP4 → Panel | One-line status message |

## Room joins

### Digital

| Offset | Iroquois | Shawnee | Cherokee | Name | Direction | Description |
|---:|---:|---:|---:|---|---|---|
| +1 | 101 | 201 | 301 | `projOn` | Both | Projector power on / on fb |
| +2 | 102 | 202 | 302 | `projOff` | Both | Projector power off / off fb |
| +3 | 103 | 203 | 303 | `projWarming` | CP4 → Panel | Projector warming |
| +4 | 104 | 204 | 304 | `projCooling` | CP4 → Panel | Projector cooling |
| +5 | 105 | 205 | 305 | `screenDown` | Both | Screen down / down fb |
| +6 | 106 | 206 | 306 | `screenUp` | Both | Screen up / up fb |
| +8 | 108 | 208 | 308 | `picMute` | Both | Picture mute (blank) toggle / fb |
| +10 | 110 | 210 | 310 | `occupied` | CP4 → Panel | CEN-ODT-C-POE reports occupied |
| +31 | 131 | 231 | 331 | `lightScene1` | Both | Lighting scene: Full / fb |
| +32 | 132 | 232 | 332 | `lightScene2` | Both | Lighting scene: Presentation (task 50%, front row off) / fb |
| +33 | 133 | 233 | 333 | `lightScene3` | Both | Lighting scene: Dim / fb |
| +34 | 134 | 234 | 334 | `lightScene4` | Both | Lighting scene: Off / fb |
| +51 | 151 | 251 | 351 | `micMute1` | Both | Mic 1 (Handheld 1) mute toggle / fb |
| +52 | 152 | 252 | 352 | `micMute2` | Both | Mic 2 (Handheld 2) mute toggle / fb |
| +53 | 153 | 253 | 353 | `micMute3` | Both | Mic 3 (Lavalier 1) mute toggle / fb |
| +54 | 154 | 254 | 354 | `micMute4` | Both | Mic 4 (Lavalier 2) mute toggle / fb |
| +55 | 155 | 255 | 355 | `micMute5` | Both | Mic 5 (Front XLR 1) mute toggle / fb |
| +56 | 156 | 256 | 356 | `micMute6` | Both | Mic 6 (Front XLR 2) mute toggle / fb |
| +57 | 157 | 257 | 357 | `micMute7` | Both | Mic 7 (Side XLR 1) mute toggle / fb |
| +58 | 158 | 258 | 358 | `micMute8` | Both | Mic 8 (Side XLR 2) mute toggle / fb |

### Analog

| Offset | Iroquois | Shawnee | Cherokee | Name | Direction | Description |
|---:|---:|---:|---:|---|---|---|
| +1 | 101 | 201 | 301 | `videoSource` | Both | Display source: 0 none, 1-6 encoder |
| +11 | 111 | 211 | 311 | `lightZone1` | Both | Lighting zone 1 (Front Row) level 0-65535 |
| +12 | 112 | 212 | 312 | `lightZone2` | Both | Lighting zone 2 (Task Lighting) level 0-65535 |
| +13 | 113 | 213 | 313 | `lightZone3` | Both | Lighting zone 3 (spare) level |
| +14 | 114 | 214 | 314 | `lightZone4` | Both | Lighting zone 4 (spare) level |
| +21 | 121 | 221 | 321 | `micLevel1` | Both | Mic 1 level 0-65535 |
| +22 | 122 | 222 | 322 | `micLevel2` | Both | Mic 2 level |
| +23 | 123 | 223 | 323 | `micLevel3` | Both | Mic 3 level |
| +24 | 124 | 224 | 324 | `micLevel4` | Both | Mic 4 level |
| +25 | 125 | 225 | 325 | `micLevel5` | Both | Mic 5 level |
| +26 | 126 | 226 | 326 | `micLevel6` | Both | Mic 6 level |
| +27 | 127 | 227 | 327 | `micLevel7` | Both | Mic 7 level |
| +28 | 128 | 228 | 328 | `micLevel8` | Both | Mic 8 level |

