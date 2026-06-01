/**
 * scripts/inject-jsonld.js - one-shot, idempotent.
 *
 * Adds rich JSON-LD schemas:
 *   • Organization (homepage)
 *   • BreadcrumbList + enriched WebApplication (each calculator)
 *
 * Identifiers each script via data-np-ld="..." so re-runs replace cleanly.
 *
 * Run:  node scripts/inject-jsonld.js
 */
const fs = require('fs');
const path = require('path');

const SITE = 'https://nestpaycalc.com';

// ─── Calculator metadata for BreadcrumbList + WebApplication ─────────────
const CALCS = [
  { file: 'calculators/salary.html',   name: 'UK Salary / Take-Home Pay Calculator',  short: 'Salary Calculator',   description: 'Calculate your UK take-home pay including income tax, National Insurance, pension and student loans for 2026/27.', keywords: 'salary calculator, take-home pay, PAYE, National Insurance, UK tax' },
  { file: 'calculators/mortgage.html', name: 'UK Mortgage & Stamp Duty Calculator',   short: 'Mortgage Calculator', description: 'Estimate UK mortgage repayments plus stamp duty (SDLT, LBTT or LTT) with first-time buyer and overpayment options.',     keywords: 'mortgage calculator, stamp duty, SDLT, LBTT, LTT, UK' },
  { file: 'calculators/savings.html',  name: 'UK Savings & ISA Calculator',           short: 'Savings Calculator',  description: 'Project compound interest growth on UK savings and ISAs, with inflation-adjusted real value.',                       keywords: 'savings calculator, ISA, compound interest, UK' },
  { file: 'calculators/pension.html',  name: 'UK Pension & Retirement Calculator',    short: 'Pension Calculator',  description: 'Forecast your UK pension pot, retirement income, State Pension and drawdown vs annuity options.',                   keywords: 'pension calculator, retirement, SIPP, UK, State Pension' },
  { file: 'calculators/debt.html',     name: 'UK Debt Payoff Calculator',             short: 'Debt Calculator',     description: 'Compare snowball vs avalanche strategies to pay off UK credit cards, loans and overdrafts faster.',                  keywords: 'debt calculator, snowball, avalanche, UK' },
  { file: 'calculators/budget.html',   name: 'UK Budget Planner',                     short: 'Budget Planner',      description: 'Build a UK monthly budget with the 50/30/20 rule across realistic categories: rent, council tax, energy and more.', keywords: 'budget calculator, 50/30/20, UK household' }
];

// ─── Renderers ────────────────────────────────────────────────────────────
function organization() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${SITE}#organization`,
    name: 'NestPayCalc',
    legalName: 'Croft & Hugh Digital LTD',
    url: `${SITE}/`,
    logo: `${SITE}/assets/favicon.svg`,
    description: 'Free UK financial calculators - salary, mortgage, savings, pension, debt and budget.',
    email: 'Hello@crofthughdigital.co.uk',
    // Companies House number - required for Companies Act 2006 s.82 disclosure
    identifier: {
      '@type': 'PropertyValue',
      propertyID: 'CompaniesHouseNumber',
      value: '17207269'
    },
    address: {
      '@type': 'PostalAddress',
      streetAddress: '71-75 Shelton Street, Covent Garden',
      addressLocality: 'London',
      postalCode: 'WC2H 9JQ',
      addressCountry: 'GB',
      addressRegion: 'England'
    },
    foundingLocation: { '@type': 'Country', name: 'United Kingdom' },
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      email: 'Hello@crofthughdigital.co.uk',
      availableLanguage: ['English']
    },
    sameAs: []
  };
}

function website() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE}#website`,
    name: 'NestPayCalc',
    url: `${SITE}/`,
    description: 'Free UK financial calculators – salary, mortgage, savings, pension, debt and budget.',
    inLanguage: 'en-GB',
    publisher: { '@id': `${SITE}#organization` }
  };
}

function breadcrumb(calc) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE}/` },
      { '@type': 'ListItem', position: 2, name: 'Calculators', item: `${SITE}/#calculators` },
      { '@type': 'ListItem', position: 3, name: calc.short, item: `${SITE}/${calc.file}` }
    ]
  };
}

function webApp(calc) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: calc.name,
    description: calc.description,
    keywords: calc.keywords,
    url: `${SITE}/${calc.file}`,
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'Any',
    browserRequirements: 'Requires JavaScript. Requires HTML5.',
    inLanguage: 'en-GB',
    isAccessibleForFree: true,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'GBP' },
    publisher: { '@id': `${SITE}#organization` },
    image: `${SITE}/assets/og/site.png`
  };
}

// ─── HTML injection helper ────────────────────────────────────────────────
function injectLd(absPath, key, json) {
  if (!fs.existsSync(absPath)) { console.warn('miss:', absPath); return false; }
  let html = fs.readFileSync(absPath, 'utf8');
  const tag = `<script type="application/ld+json" data-np-ld="${key}">\n${JSON.stringify(json, null, 2)}\n</script>`;
  const re = new RegExp(`<script type="application/ld\\+json" data-np-ld="${key}">[\\s\\S]*?</script>`, 'g');
  if (re.test(html)) {
    html = html.replace(re, tag);
  } else {
    // Insert just before </head>
    html = html.replace(/<\/head>/i, `${tag}\n</head>`);
  }
  fs.writeFileSync(absPath, html);
  return true;
}

// ─── Run ──────────────────────────────────────────────────────────────────
const root = path.resolve(__dirname, '..');

// Homepage - Organization + WebSite
injectLd(path.join(root, 'index.html'), 'org', organization());
injectLd(path.join(root, 'index.html'), 'website', website());
console.log('✓ index.html - Organization + WebSite');

// Each calc - BreadcrumbList + WebApplication
for (const calc of CALCS) {
  const abs = path.join(root, calc.file);
  injectLd(abs, 'breadcrumb', breadcrumb(calc));
  injectLd(abs, 'webapp', webApp(calc));
  console.log('✓', calc.file, '- Breadcrumb + WebApplication');
}

console.log('\nDone.');
