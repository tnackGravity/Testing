#!/usr/bin/env node
/* Generates docs/JOIN_MAP.md from app/js/config.js so the document can never drift from the code. */
const fs = require('fs');
const path = require('path');
const C = require('../app/js/config.js');
const DIR = { tx: 'Panel → CP4', fb: 'CP4 → Panel', both: 'Both' };
const TYPE = { d: 'Digital', a: 'Analog', s: 'Serial' };
let out = `# Join Map — Jenny Wiley Conference Center UCI v${C.version}\n\n`;
out += '> Generated from `app/js/config.js` by `npm run joinmap`. Do not edit by hand.\n\n';
out += 'All three TSW-770 panels load the same project and use the same join numbers.\n\n';
out += '- **Panel joins (1–99)** follow the panel. The CP4 resolves them against the room group that panel currently belongs to, so each panel needs its own instance of this logic.\n';
out += '- **Room joins (101–399)** are absolute and identical on every panel: Iroquois = 100 + offset, Shawnee = 200 + offset, Cherokee = 300 + offset.\n';
out += `- Levels are 0–${C.LEVEL_MAX}. Source numbers: 0 = none, ${C.sources.map(s => `${s.n} = ${s.id}`).join(', ')}.\n`;
out += '- Buttons are momentary (high on press, low on release). Toggles act on the rising edge.\n\n';
out += '## Panel joins\n\n';
for (const t of ['d', 'a', 's']) {
  out += `### ${TYPE[t]}\n\n| Join | Name | Direction | Description |\n|---:|---|---|---|\n`;
  for (const [name, e] of Object.entries(C.joins.panel[t])) out += `| ${e.j} | \`${name}\` | ${DIR[e.dir]} | ${e.d} |\n`;
  out += '\n';
}
out += '## Room joins\n\n';
for (const t of ['d', 'a']) {
  out += `### ${TYPE[t]}\n\n| Offset | Iroquois | Shawnee | Cherokee | Name | Direction | Description |\n|---:|---:|---:|---:|---|---|---|\n`;
  for (const [name, e] of Object.entries(C.joins.room[t])) {
    out += `| +${e.o} | ${100 + e.o} | ${200 + e.o} | ${300 + e.o} | \`${name}\` | ${DIR[e.dir]} | ${e.d} |\n`;
  }
  out += '\n';
}
fs.writeFileSync(path.join(__dirname, '..', 'docs', 'JOIN_MAP.md'), out);
console.log('Wrote docs/JOIN_MAP.md');
