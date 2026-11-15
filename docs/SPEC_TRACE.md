# Spec trace — Section 274100, 3.2 Programming

Where each requirement lives in UCI v0.2.0. "CP4" marks behaviour the control program must perform; the simulator (`app/js/sim.js`) already models it.

| Spec | Requirement | In the interface | CP4 |
|---|---|---|---|
| 3.2.A | Simplified interface with automated startups | Start page: two preset cards and Manual controls | |
| a | **Preset 1: Audio-Video Conference** | Start page card → Presentation page | join D1 |
| a.1 | Task lighting 50 %, front row off; adjustable manually | "Presentation" scene lit after recall; Lighting tab for manual changes | ✔ |
| a.2 | Nominal audio levels | Volume returns to Med | ✔ |
| a.3 | Audio follows active video source | "Follow video" on (Audio Mixer tab) | ✔ |
| a.4 | Audio and microphones unmuted | Mute and Mute mics clear | ✔ |
| a.5 | Lighting wall switch disabled | Banner on Lighting tab; status on System tab | ✔ |
| b | **Preset 2: Audio Only Conference** | Start page card → Conference page | join D2 |
| b.1 | No lighting preference; adjustable from panel | Lights left as found; scene buttons on the page | ✔ |
| b.2 | No shade preference; adjustable from panel | **Not provided.** Shade control removed in v0.2.0; no shade controller on AV-601 | — |
| b.3 | Nominal audio levels | Volume returns to Med | ✔ |
| b.4 | Audio from XLR plates or 3.5 mm on HDMI plates | "Play audio from" tiles; XLR channels in the mixer | ✔ |
| b.5 | Audio and microphones unmuted | Mute and Mute mics clear | ✔ |
| b.6 | Lighting wall switch disabled | As a.5 | ✔ |
| c | **Manual controls**, separate from the start page | "Manual controls" on Start; same tabs appear as "Advanced" inside a preset | join D3 |
| c.1 | Several lighting presets per zone | Lighting tab: Off / 25 / 50 / 75 / 100 and ± per zone, plus room scenes | |
| c.2 | Divide or combine rooms | Room Layout tab, with confirmation | ✔ |
| c.3 | Mixer for mic and program levels; overwritten by presets | Audio Mixer tab; note under the title | ✔ |
| c.4 | Audio source selector | Audio Mixer tab → Program audio source | |
| c.5 | Video source selector to the projector | Video tab, one column per projector | |
| c.6 | Screen and projector power controls | Displays tab | |
| c.7 | Lighting wall switch disabled | As a.5 | ✔ |
| d | **Manual backup switch** | Not on the panel by design. Demo bar toggle; "Started from backup switch" on System tab | ✔ |
| d.1–d.5 | On: all components on, rooms divided, Preset 1, green LED when warm. Off: shutdown | Modelled in the simulator | ✔ I/O 1–6, relay 7 |
| e | **System shutdown** from every control page | Shut down button in the footer of every session page, with confirmation | join D4 |
| e.1.a | Projectors off with cool-down timer | Cool-down overlay with countdown | ✔ |
| e.1.b | Screens up, tied to the timer | Stated on the overlay; screen feedback | ✔ |
| e.1.c | Microphones muted | | ✔ |
| e.1.d | Amplifier outputs muted | | ✔ |
| e.1.e | Wall switch re-enabled | Banner clears | ✔ |
| e.1.f | Return to PIN lockout (if used) | Lock page after cool-down | ✔ |
| e.1.g | Lights to 0 % or another preset | Simulator uses 0 % | ✔ |
| f | **Optional touch panel lockout** | PIN page; on/off on System tab; "Lock now" in header | ✔ |
| g | **Occupancy shutdown** | "Is anyone still here?" overlay with countdown and Keep system on; threshold on System tab | ✔ |

## Drawing items carried into the interface

| Drawing | Item | Use |
|---|---|---|
| AV-301 | Rooms 106 / 107 / 108 west to east; Cherokee double width | Room map proportions and order |
| AV-601 | ENC-A1/A2, B1/B2, C1/C2 | Six sources; names from mounting notes (front wall, side wall, floor box) |
| AV-601 | DEC / PRJ / SRN per room, screens on relays 1–6 | One display per room: power, screen up/down |
| AV-601 | nLight NIO-X on COM 1–3 | Lighting per room |
| AV-601 | CEN-ODT-C-POE per room | Occupancy status and vacancy shutdown |
| AV-601 | TOG-01/02/03 on I/O 1–6 | Backup switch |
| AV-602 | MXW access point per room; 2 handheld + 2 lavalier | Mixer channels 1–4 |
| AV-602 | Two RDL DD-BN22 plates per room | Mixer channels 5–8 |
| AV-602 | Amp channels A1, B1, C1, C2 | Room volume (C1+C2 linked) |
