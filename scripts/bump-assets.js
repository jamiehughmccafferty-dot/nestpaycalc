/**
 * scripts/bump-assets.js
 *
 * Rewrites the `?v=YYYY-MM-DD` query string on every local JS + CSS
 * reference in every HTML file. Forces every browser - desktop, mobile,
 * cached or not - to fetch a fresh copy on the next visit, which is the
 * only reliable way to invalidate already-cached assets sitting under
 * the Cache-Control max-age window in vercel.json.
 *
 * Run after any meaningful change to:
 *   - assets/js/*.js        (engine, common, affiliates, motion, …)
 *   - assets/css/styles.css (rebuilt from styles.src.css by Tailwind)
 *
 * Usage:  npm run bump  (or:  node scripts/bump-assets.js [version])
 *
 * Default version is today's date in YYYY-MM-DD. Pass a custom version
 * to override (e.g. for a hotfix bump within the same day).
 */
const fs   = require('fs');
const path = require('path');

const VERSION = process.argv[2] || new Date().toISOString().slice(0, 10);
const SKIP    = new Set(['node_modules', '.git', 'dist', '.next', '.vercel']);

function walk(dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const fp = path.join(dir, e.name);
    if (e.isDirectory()) { if (!SKIP.has(e.name)) out.push(...walk(fp)); continue; }
    if (e.name.endsWith('.html')) out.push(fp);
  }
  return out;
}

let files = 0, js = 0, css = 0;
for (const fp of walk(process.cwd())) {
  const before = fs.readFileSync(fp, 'utf8');
  let after = before;
  // Local JS: <script src="...assets/js/X.js"> or with existing ?v=...
  after = after.replace(/(src="(?:\.\.\/)?assets\/js\/[^"?]+\.js)(?:\?v=[^"]*)?(")/g,
    (m, a, b) => { js++; return a + '?v=' + VERSION + b; });
  // Local CSS link: <link ... href="...assets/css/styles.css"> or with existing ?v=...
  after = after.replace(/(href="(?:\.\.\/)?assets\/css\/styles\.css)(?:\?v=[^"]*)?(")/g,
    (m, a, b) => { css++; return a + '?v=' + VERSION + b; });
  if (after !== before) { fs.writeFileSync(fp, after); files++; }
}

console.log(`Bumped to ?v=${VERSION}  |  files: ${files}  JS: ${js}  CSS: ${css}`);
