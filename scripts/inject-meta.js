/**
 * scripts/inject-meta.js — one-shot, idempotent.
 *
 * Inserts favicon + manifest + OG/Twitter image + og:url tags into every
 * HTML file in the project, with correct relative paths.
 *
 * Safe to re-run: skips files that already contain `og:url`.
 *
 * Run:  node scripts/inject-meta.js
 */
const fs = require('fs');
const path = require('path');

const SITE = 'https://nestpaycalc.com';
const OG_IMAGE = `${SITE}/assets/og/site.png`;

// Files relative to project root.
const FILES = [
  { file: 'index.html',                  ogUrl: `${SITE}/` },
  { file: 'about.html',                  ogUrl: `${SITE}/about.html` },
  { file: 'contact.html',                ogUrl: `${SITE}/contact.html` },
  { file: 'faq.html',                    ogUrl: `${SITE}/faq.html` },
  { file: 'glossary.html',               ogUrl: `${SITE}/glossary.html` },
  { file: 'deals.html',                  ogUrl: `${SITE}/deals.html` },
  { file: 'saved.html',                  ogUrl: `${SITE}/saved.html` },
  { file: '404.html',                    ogUrl: `${SITE}/404.html` },
  { file: 'blog/index.html',             ogUrl: `${SITE}/blog/` },
  { file: 'calculators/salary.html',     ogUrl: `${SITE}/calculators/salary.html` },
  { file: 'calculators/mortgage.html',   ogUrl: `${SITE}/calculators/mortgage.html` },
  { file: 'calculators/savings.html',    ogUrl: `${SITE}/calculators/savings.html` },
  { file: 'calculators/pension.html',    ogUrl: `${SITE}/calculators/pension.html` },
  { file: 'calculators/debt.html',       ogUrl: `${SITE}/calculators/debt.html` },
  { file: 'calculators/budget.html',     ogUrl: `${SITE}/calculators/budget.html` }
];

function buildBlock({ ogUrl }, depth) {
  const rel = depth > 0 ? '../'.repeat(depth) : '';
  return [
    '',
    `<link rel="icon" type="image/svg+xml" href="${rel}assets/favicon.svg">`,
    `<link rel="manifest" href="${rel}site.webmanifest">`,
    `<meta property="og:image" content="${OG_IMAGE}">`,
    `<meta property="og:image:width" content="1200">`,
    `<meta property="og:image:height" content="630">`,
    `<meta property="og:url" content="${ogUrl}">`,
    `<meta name="twitter:image" content="${OG_IMAGE}">`,
    ''
  ].join('\n');
}

let touched = 0, skipped = 0;
for (const entry of FILES) {
  const abs = path.resolve(__dirname, '..', entry.file);
  if (!fs.existsSync(abs)) { console.warn('miss:', entry.file); continue; }
  let html = fs.readFileSync(abs, 'utf8');
  if (/og:url/.test(html)) { skipped++; continue; }
  const depth = entry.file.split('/').length - 1;
  const block = buildBlock(entry, depth);

  // Insert after the theme-color meta tag.
  const re = /(<meta\s+name="theme-color"[^>]*>)/i;
  if (!re.test(html)) {
    console.warn('no theme-color anchor in', entry.file);
    continue;
  }
  html = html.replace(re, `$1${block}`);
  fs.writeFileSync(abs, html);
  touched++;
  console.log('✓', entry.file);
}
console.log(`\nDone. ${touched} updated, ${skipped} already had og:url.`);
