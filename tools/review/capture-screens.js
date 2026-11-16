const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const out = '/home/claude/work/pdf/shots';
(async () => {
  const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 2 });
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto('file:///home/claude/testing/app/index.html?sim=1');
  await page.addStyleTag({ content: '#demo-bar{display:none!important}' });
  await page.evaluate(() => window.dispatchEvent(new Event('resize')));
  const w = ms => page.waitForTimeout(ms);
  const shot = async n => { await w(300); await page.screenshot({ path: `${out}/${n}.png` }); };
  const pin = async () => { await page.locator('.pin-pad').waitFor(); await page.evaluate(() => JW_BRIDGE.setS(JW_CONFIG.P('s', 'pinEntry'), '1234')); await w(200); };
  const pulse = n => page.evaluate(n => JW_BRIDGE.pulse(JW_CONFIG.P('d', n)), n);
  const nav = t => page.locator('.nav button', { hasText: t }).first().click();
  const tap = t => page.locator('#stage button', { hasText: t }).first().click();
  await w(300);
  // PIN page with two digits entered so the dots read
  await page.locator('.pin-pad button', { hasText: '1' }).first().click(); await page.locator('.pin-pad button', { hasText: '2' }).first().click();
  await shot('lock'); await pin(); await shot('start');
  await pulse('presetAV'); await w(1200); await shot('warm'); await w(9800); await shot('av');
  for (const [t, n] of [['Video', 'video'], ['Audio Mixer', 'audio'], ['Lighting', 'lighting'], ['Displays', 'displays'], ['Room Layout', 'layout'], ['System', 'system']]) { await nav(t); await shot(n); }
  await nav('Room Layout'); await page.locator('.btn-layout', { hasText: 'All Combined' }).click(); await shot('layout-confirm'); await tap('Cancel');
  await nav('Presentation'); await page.locator('#ftr button', { hasText: 'Shut down' }).click(); await shot('shutdown-confirm'); await tap('Cancel');
  await page.evaluate(() => JW_SIM.vacate()); await w(1200); await shot('occ'); await tap('Keep system on');
  await pulse('shutdown'); await w(1500); await shot('cool'); await w(11500);
  await pin(); await pulse('presetAudio'); await w(3700); await shot('conf');
  await pulse('shutdown'); await w(4000); await pin(); await pulse('manual'); await w(300); await shot('manual');
  await pulse('layoutAll'); await w(300); await pulse('shutdown'); await w(4000); await pin(); await shot('start-all');
  await pulse('presetAV'); await w(10800); await shot('av-all');
  for (const [t, n] of [['Video', 'video-all'], ['Audio Mixer', 'audio-all'], ['Lighting', 'lighting-all'], ['Displays', 'displays-all']]) { await nav(t); await shot(n); }
  console.log(errs.length ? errs.join('\n') : 'no errors');
  await browser.close();
})();
