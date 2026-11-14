#!/usr/bin/env node
/* Copies the CrComLib UMD bundle from node_modules into app/vendor so it ships inside the .ch5z. */
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const pkg = path.join(root, 'node_modules', '@crestron', 'ch5-crcomlib');
function find(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { const r = find(p); if (r) return r; }
    else if (e.name === 'cr-com-lib.js' && /umd/.test(p)) return p;
  }
  return null;
}
if (!fs.existsSync(pkg)) { console.error('Run "npm install" first.'); process.exit(1); }
const src = find(pkg);
if (!src) { console.error('Could not find umd/cr-com-lib.js inside @crestron/ch5-crcomlib.'); process.exit(1); }
fs.copyFileSync(src, path.join(root, 'app', 'vendor', 'cr-com-lib.js'));
console.log('Copied', path.relative(root, src), '-> app/vendor/cr-com-lib.js');
