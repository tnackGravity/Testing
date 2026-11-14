# Jenny Wiley Conference Center — Touch Panel Interface (UCI)

Crestron HTML5 (CH5) user interface for the three-way divisible conference room at Jenny Wiley State Resort Park: Iroquois (106), Shawnee (107) and Cherokee (108).

- **Target:** 3 × Crestron TSW-770 (1280 × 800), one per room, controlled by one CP4
- **Status:** v0.1.0 — first UCI revision, for review. The CP4 program has not been written yet.
- **Basis:** Section 274100 (April 2026), especially 3.2 Programming; drawings AV-301, AV-302, AV-601, AV-602 (project 002283)

## Try the demo

The interface runs in any browser with a built-in simulated CP4, so every button does what the finished system will do.

**Locally** — open `app/index.html` directly, or:

```
npm start
```

**On GitHub Pages** — push to `main`; the included workflow publishes the `app/` folder. One-time setup: repo Settings → Pages → Source → *GitHub Actions*.

The grey bar above the panel belongs to the demo only and never appears on a real panel. It lets you:

| Control | What it does |
|---|---|
| Panel in: Iroquois / Shawnee / Cherokee | Stand at a different room's panel |
| Backup switch | Flip the manual backup toggle (TOG-0x) |
| Simulate empty room | Jump straight to the vacancy shutdown warning |
| PIN 1234 | The demo lockout PIN |

Add `?room=B` to the URL to start at the Shawnee panel. Demo warm-up and cool-down are shortened to 10 s and 12 s.

## What is in this revision

| Screen | Purpose |
|---|---|
| PIN lock | Optional lockout shown when the system is off |
| Start | Two preset choices plus Manual controls, with a map of the current room layout |
| Presentation (Preset 1) | Pick a wall plate to show, blank the screen, light scenes, display status |
| Conference (Preset 2) | Pick an audio source, light scenes, shades |
| Video | Any source in the group to any projector in the group |
| Audio Mixer | Program source, audio-follows-video, eight mic channels per room |
| Lighting | Scenes per room, level presets per zone |
| Shades | Open / stop / close per room |
| Displays | Projector power, screen up/down, picture blank |
| Room Layout | Divide or combine: all divided, Iroquois+Shawnee, Shawnee+Cherokee, all combined |
| System | Vacancy timeout, PIN lock on/off, status |

Room volume, Low/Med/High, speaker mute, mic mute and Shut down stay on screen for the whole session. Warm-up, cool-down, vacancy warning and confirmations appear as overlays.

`docs/SPEC_TRACE.md` maps every line of spec section 3.2 to where it lives in the interface.

## Repository layout

```
app/                    The interface. This folder is what gets archived to .ch5z
  index.html
  css/tokens.css        Colours, fonts, sizes — the only place to change the look
  css/app.css
  js/config.js          Rooms, devices and the join map (single source of truth)
  js/bridge.js          Talks to the CP4 on a panel, or to the simulator in a browser
  js/sim.js             Simulated CP4 — also the behavioural reference for the real program
  js/app.js             Screens and controls
  vendor/               CrComLib is copied here at build time (not committed)
docs/
  JOIN_MAP.md           Generated from config.js — npm run joinmap
  SPEC_TRACE.md         Spec 3.2 requirement → screen
tools/                  Join map generator, CrComLib copy script
.github/workflows/      GitHub Pages demo
```

No framework and no build step: what is in `app/` is what the panel runs.

## Loading onto a panel

Not needed for review; for when a revision is ready to try on hardware.

```
npm install
npm run archive                      # copies CrComLib into app/vendor, writes dist/jw-conference-uci.ch5z
PANEL_HOST=<panel ip> npm run deploy
```

On a panel the interface detects CrComLib, skips the simulator, and uses the joins in `docs/JOIN_MAP.md`. Until the CP4 program exists, a panel will sit on the Start page with no feedback.

The `archive` and `deploy` scripts use Crestron's `ch5-cli`. They were written from the documented command form and have **not** been run against hardware from this repo yet — check them on first use.

## How the three panels work together

Every panel runs the same project with the same join numbers.

- **Panel joins (1–99)** — presets, volume, shutdown, lock, layout. The CP4 applies them to whichever group that panel's room is currently in.
- **Room joins (100s / 200s / 300s)** — projector, screen, lights, shades, mics for Iroquois / Shawnee / Cherokee.

The CP4 tells each panel which rooms are in its group. The panel then shows controls for exactly those rooms, so panels in a combined group mirror each other.

## Assumptions to confirm

These were decided to get a first revision built. Each is isolated so a change is small.

1. **Colours.** The parks.ky.gov stylesheet could not be read programmatically, so the palette (forest green, parchment, trail-marker gold) is an interpretation of the Kentucky State Parks look, not sampled values. It is dark on purpose, so the panel does not glare in a room dimmed for projection. Everything lives in `app/css/tokens.css`.
2. **No logo.** The header uses a text wordmark and a generic ridge mark. Supply the approved Kentucky State Parks artwork if it should appear.
3. **Shades.** The spec calls for shade control (2.0.B, 3.2 Preset 2) but AV-601 shows no shade controller. Open / stop / close per room is included behind `features.shades` in `config.js`.
4. **Lighting zones.** Two zones per room are assumed (Front Row, Task Lighting) with four scenes. Real zone names, counts and nLight scene numbers need to come from the lighting provider.
5. **Backup switch.** Spec 3.2.d describes one switch at the rack that powers on all rooms, divided, in Preset 1. AV-601 shows three (TOG-01/02/03), one per room. The simulator follows the spec wording.
6. **Combining while running.** When rooms join a group that is already on, the simulator applies the running preset to the whole group. The spec does not say.
7. **Cherokee audio.** Cherokee has two amplifier zones (C1, C2); the interface treats them as one room volume.
8. **Microphones.** Four wireless (2 handheld, 2 lavalier) and four wired XLR inputs per room, per AV-602.
9. **PIN.** 4–6 digits, checked by the CP4. Whether to use a lockout at all, and the PIN, are the owner's call.
10. **Vacancy shutdown.** Default 30 minutes with a 30-second on-screen warning; adjustable on the System page.

## Revision workflow

Each UCI revision is a tagged commit (`v0.1.0`, `v0.2.0`, …) with an entry in `CHANGELOG.md`. Join numbers are frozen once the CP4 program starts; until then, change `config.js` and run `npm run joinmap`.
