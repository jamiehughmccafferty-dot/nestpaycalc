/**
 * scripts/inject-meta.js - one-shot, idempotent.
 *
 * Injects per-page social + favicon + manifest meta:
 *   • favicon (SVG) + site.webmanifest
 *   • og:url, og:title, og:description, og:type, og:locale
 *   • og:image, og:image:width, og:image:height
 *   • twitter:card, twitter:title, twitter:description, twitter:image
 *
 * Safe to re-run: scrubs any existing og:* / twitter:* / favicon / manifest
 * tags before inserting fresh ones (so re-runs after copy changes are clean).
 *
 * Run:  node scripts/inject-meta.js
 */
const fs = require('fs');
const path = require('path');

const SITE     = 'https://nestpaycalc.com';
const OG_IMAGE = `${SITE}/assets/og/site.png`;

// Each entry: { file, ogUrl, ogTitle, ogDescription, ogType? }
// ogTitle should be ~50–60 chars (Twitter cap), ogDescription ~140–160 chars.
const FILES = [
  {
    file: 'index.html',
    ogUrl: `${SITE}/`,
    ogTitle: 'NestPayCalc - Free UK Financial Calculators (2026/27)',
    ogDescription: 'Free, accurate UK calculators for take-home pay, mortgage & SDLT, savings & ISA, pension, debt and budget. Built on current HMRC rules. No sign-up.'
  },
  {
    file: 'about.html',
    ogUrl: `${SITE}/about`,
    ogTitle: 'About NestPayCalc - Editorial standards & affiliate disclosure',
    ogDescription: 'NestPayCalc is operated by Croft & Hugh Digital LTD. Our editorial standards, affiliate disclosure and privacy policy explained plainly.'
  },
  {
    file: 'contact.html',
    ogUrl: `${SITE}/contact`,
    ogTitle: 'Contact NestPayCalc',
    ogDescription: 'Email Hello@crofthughdigital.co.uk or send us a message - rate corrections, bugs, calculator requests and partnership enquiries welcome.'
  },
  {
    file: 'faq.html',
    ogUrl: `${SITE}/faq`,
    ogTitle: 'UK personal finance FAQ - NestPayCalc',
    ogDescription: 'Quick answers to common UK money questions: tax codes, ISA allowances, National Insurance, student loans, stamp duty and pension contributions.'
  },
  {
    file: 'glossary.html',
    ogUrl: `${SITE}/glossary`,
    ogTitle: 'UK personal finance glossary - plain-English jargon-buster',
    ogDescription: 'AER, APR, BIK, ISA, LBTT, LTT, PAYE, SDLT, SIPP and more - every UK personal-finance term explained simply.'
  },
  {
    file: 'deals.html',
    ogUrl: `${SITE}/deals`,
    ogTitle: 'Best UK financial deals - Cash ISAs, mortgages, SIPPs & more',
    ogDescription: 'Hand-picked UK deals across savings, mortgages, pensions and credit cards. Affiliate links with full disclosure. Not regulated financial advice.'
  },
  {
    file: 'saved.html',
    ogUrl: `${SITE}/saved`,
    ogTitle: 'Saved Calculations - NestPayCalc',
    ogDescription: 'Your saved UK financial calculations, stored locally in your browser. Private, no account, no sync.'
  },
  {
    file: '404.html',
    ogUrl: `${SITE}/404`,
    ogTitle: 'Page not found - NestPayCalc',
    ogDescription: 'That page slipped through the net. Try one of our UK financial calculators instead.'
  },
  {
    file: 'blog/index.html',
    ogUrl: `${SITE}/blog/`,
    ogTitle: 'UK personal finance blog & guides - NestPayCalc',
    ogDescription: 'Plain-English UK money guides - income tax, ISAs, pensions, mortgages, debt and budgeting. Every figure cross-referenced against HMRC.'
  },

  // ─── Calculator pages - keyword-rich for SERP CTR ─────────────────────
  {
    file: 'calculators/salary.html',
    ogUrl: `${SITE}/calculators/salary`,
    ogTitle: 'UK Salary & Take-Home Pay Calculator 2026/27',
    ogDescription: 'See your UK take-home pay in seconds. Income tax, National Insurance, pension (3 types), student loans (Plans 1, 2, 4, 5, PG), Scottish bands. Built for 2026/27.'
  },
  {
    file: 'calculators/mortgage.html',
    ogUrl: `${SITE}/calculators/mortgage`,
    ogTitle: 'UK Mortgage & Stamp Duty Calculator 2026/27',
    ogDescription: 'Mortgage repayments + stamp duty (SDLT, LBTT, LTT) with first-time buyer relief and overpayment savings. Amortisation chart and LTV included.'
  },
  {
    file: 'calculators/savings.html',
    ogUrl: `${SITE}/calculators/savings`,
    ogTitle: 'UK Savings & ISA Compound Interest Calculator',
    ogDescription: 'Project compound interest growth on UK savings and ISAs (Cash, Stocks & Shares, LISA). Inflation-adjusted real value included.'
  },
  {
    file: 'calculators/pension.html',
    ogUrl: `${SITE}/calculators/pension`,
    ogTitle: 'UK Pension & Retirement Calculator 2026/27',
    ogDescription: 'Forecast your UK pension pot, retirement income and State Pension. Compare 4% drawdown vs annuity. Auto-enrol contributions modelled.'
  },
  {
    file: 'calculators/debt.html',
    ogUrl: `${SITE}/calculators/debt`,
    ogTitle: 'UK Debt Payoff Calculator - Snowball vs Avalanche',
    ogDescription: 'Compare snowball vs avalanche strategies on UK credit cards, loans and overdrafts. See months to debt-free and interest saved.'
  },
  {
    file: 'calculators/budget.html',
    ogUrl: `${SITE}/calculators/budget`,
    ogTitle: 'UK Budget Planner - 50/30/20 with Council Tax & energy',
    ogDescription: 'Build a UK monthly budget with the 50/30/20 rule across realistic categories - rent, Council Tax, energy, transport, broadband and more.'
  },

  // ─── Blog articles ────────────────────────────────────────────────────
  {
    file: 'blog/how-uk-income-tax-works.html',
    ogUrl: `${SITE}/blog/how-uk-income-tax-works`,
    ogTitle: 'How UK income tax works in 2026/27 - plain-English guide',
    ogDescription: 'Bands, the personal allowance, the £100k tax trap, Scotland\'s six bands, NI, tax codes - with worked examples. Updated for 2026/27.',
    ogType: 'article'
  },
  {
    file: 'blog/uk-stamp-duty-explained.html',
    ogUrl: `${SITE}/blog/uk-stamp-duty-explained`,
    ogTitle: 'UK stamp duty 2026/27 - SDLT, LBTT & LTT explained',
    ogDescription: 'Plain-English guide to UK stamp duty for 2026/27 - bands for England/NI (SDLT), Scotland (LBTT) and Wales (LTT), first-time buyer relief, second-home surcharge, with a live calculator.',
    ogType: 'article'
  },
  {
    file: 'blog/cash-isa-vs-stocks-and-shares-isa.html',
    ogUrl: `${SITE}/blog/cash-isa-vs-stocks-and-shares-isa`,
    ogTitle: 'Cash ISA vs Stocks & Shares ISA in 2026/27 - which one?',
    ogDescription: 'A clear comparison for UK savers - returns, risk, time horizons, splitting your £20,000 allowance, with a live side-by-side projection.',
    ogType: 'article'
  },
  {
    file: 'blog/when-is-salary-sacrifice-worth-it.html',
    ogUrl: `${SITE}/blog/when-is-salary-sacrifice-worth-it`,
    ogTitle: 'When is salary sacrifice worth it? UK guide 2026/27',
    ogDescription: 'How UK salary sacrifice cuts income tax AND NI, with worked examples for basic, higher, additional rate and the £100k taper. Plus a live savings calculator and the catches to know.',
    ogType: 'article'
  }
];

function metaBlock(entry, depth) {
  const rel = depth > 0 ? '../'.repeat(depth) : '';
  const ogType = entry.ogType || 'website';
  return [
    '',
    '<!-- ===== Social + favicon + manifest (managed by scripts/inject-meta.js) ===== -->',
    `<link rel="icon" type="image/svg+xml" href="${rel}assets/favicon.svg">`,
    `<link rel="manifest" href="${rel}site.webmanifest">`,
    `<meta property="og:title" content="${entry.ogTitle}">`,
    `<meta property="og:description" content="${entry.ogDescription}">`,
    `<meta property="og:url" content="${entry.ogUrl}">`,
    `<meta property="og:type" content="${ogType}">`,
    `<meta property="og:locale" content="en_GB">`,
    `<meta property="og:image" content="${OG_IMAGE}">`,
    `<meta property="og:image:width" content="1200">`,
    `<meta property="og:image:height" content="630">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${entry.ogTitle}">`,
    `<meta name="twitter:description" content="${entry.ogDescription}">`,
    `<meta name="twitter:image" content="${OG_IMAGE}">`,
    '<!-- ===== end social block ===== -->',
    ''
  ].join('\n');
}

/** Strip the block previously injected (between the begin/end markers),
 *  plus any stray favicon/manifest/og:/twitter: tags that may exist
 *  from earlier script versions. */
function stripExisting(html) {
  html = html.replace(/[ \t]*<!-- ===== Social \+ favicon \+ manifest \(managed by scripts\/inject-meta\.js\) ===== -->[\s\S]*?<!-- ===== end social block ===== -->\s*\n?/g, '');
  // Belt + braces: any leftover tags from earlier script versions
  html = html.replace(/[ \t]*<link rel="icon"[^>]*>\n?/g, '');
  html = html.replace(/[ \t]*<link rel="manifest"[^>]*>\n?/g, '');
  html = html.replace(/[ \t]*<meta\s+property="og:[^"]+"[^>]*>\n?/g, '');
  html = html.replace(/[ \t]*<meta\s+name="twitter:[^"]+"[^>]*>\n?/g, '');
  return html;
}

let touched = 0, missed = 0;
for (const entry of FILES) {
  const abs = path.resolve(__dirname, '..', entry.file);
  if (!fs.existsSync(abs)) { console.warn('miss:', entry.file); missed++; continue; }
  let html = fs.readFileSync(abs, 'utf8');
  html = stripExisting(html);

  const re = /(<meta\s+name="theme-color"[^>]*>)/i;
  if (!re.test(html)) {
    console.warn('no theme-color anchor in', entry.file);
    missed++;
    continue;
  }
  const depth = entry.file.split('/').length - 1;
  html = html.replace(re, `$1${metaBlock(entry, depth)}`);
  fs.writeFileSync(abs, html);
  touched++;
  console.log('✓', entry.file);
}
console.log(`\nDone. ${touched} updated, ${missed} skipped.`);
