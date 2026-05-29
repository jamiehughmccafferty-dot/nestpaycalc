/**
 * scripts/build-og.js
 *
 * Render assets/og/og-generator.html to assets/og/site.png at 1200×630.
 *
 * Usage:
 *   1. npm i -D puppeteer            (one-off, ~200MB install)
 *   2. npm run build:og              (added in package.json)
 *
 * Run this once after any visual change to the OG template, and after every
 * tax-year update so the share image's "2026/27" pill stays current.
 */
const path = require('path');
const { pathToFileURL } = require('url');

(async () => {
  let puppeteer;
  try { puppeteer = require('puppeteer'); }
  catch {
    console.error('\n  Puppeteer is not installed.');
    console.error('  Run:  npm i -D puppeteer\n');
    process.exit(1);
  }

  const file = path.resolve(__dirname, '..', 'assets', 'og', 'og-generator.html');
  const out  = path.resolve(__dirname, '..', 'assets', 'og', 'site.png');

  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720, deviceScaleFactor: 2 });
  await page.goto(pathToFileURL(file).href, { waitUntil: 'networkidle0' });
  const card = await page.$('#card');
  await card.screenshot({ path: out, omitBackground: false });
  await browser.close();

  console.log('  ✓ Wrote', path.relative(process.cwd(), out));
})().catch(err => { console.error(err); process.exit(1); });
