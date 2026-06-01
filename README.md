# NestPayCalc

Free UK financial calculators - salary / take-home pay, mortgage & SDLT,
savings & ISA, pension / retirement, debt payoff, budget planner.

**Stack:** static HTML · precompiled Tailwind CSS · Alpine.js · Chart.js (lazy)
**Tax year:** 2026/27 (configured centrally in `assets/js/uk-rates.js`)
**Hosting target:** Vercel (works on Cloudflare Pages / Netlify / any static host too)

---

## Local development

```bash
npm install                # one-off
npm run dev                # watches styles.src.css → styles.css
npm run serve              # http://localhost:8000
```

Edit `assets/css/styles.src.css` for design tokens / components.
The watcher rebuilds `assets/css/styles.css` on save.

### Build for production

```bash
npm run build:css          # one-off CSS build (~45 KB minified)
npm run build:og           # regenerates assets/og/site.png (needs puppeteer)
npm run build              # both, in order
```

---

## Deploying to Vercel (primary path)

```bash
# 1. push to GitHub
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/<you>/nestpaycalc.git
git push -u origin main

# 2. Vercel → Add New Project → Import the GitHub repo
#    Framework Preset:    Other  (auto-detected; vercel.json overrides anyway)
#    Build Command:       npm run build:css      (already in vercel.json)
#    Output Directory:    .                       (already in vercel.json)
#    Install Command:     npm install            (default)
#    Root Directory:      ./

# 3. Add the custom domain in Vercel → Project → Settings → Domains
#    Vercel handles DNS + SSL automatically when you point your registrar's
#    nameservers (or set the A / CNAME records they show you).

# 4. Submit https://nestpaycalc.com/sitemap.xml to Google Search Console.
```

The included `vercel.json` does all the heavy lifting:
- **`cleanUrls: true`** → `/about` works as well as `/about.html`
- Security headers (HSTS, X-Content-Type-Options, Permissions-Policy, etc.)
- Long-cache `styles.css`, short-cache HTML so tax-year fixes propagate fast
- Build-on-push runs `npm run build:css` automatically

### Alternative: Cloudflare Pages

The Cloudflare-format `_headers` and `_redirects` files are also in the repo
(harmless when Vercel is used - Vercel ignores them). If you ever switch:
Cloudflare → Pages → Connect to Git, build command `npm run build:css`,
output directory `/`. Done.

### Updating the OG image

The site references `https://nestpaycalc.com/assets/og/site.png` from every page's
`<meta property="og:image">`. To generate it:

**Easy way (Chrome DevTools):**

1. Open `assets/og/og-generator.html` in Chrome at 100% zoom
2. DevTools → Elements panel → right-click the `#card` element →
   "Capture node screenshot"
3. Save as `assets/og/site.png` - done

**Automated (CI-friendly):**

```bash
npm install --save-dev puppeteer    # ~200 MB one-off
npm run build:og                    # writes assets/og/site.png at 2400×1260
```

Re-run after any visual change to the OG template, and once a year after the
tax-year bump so the "2026/27" pill stays current.

---

## Project structure

```
nestpaycalc/
├── index.html              Homepage
├── about.html              About + editorial / privacy / affiliate disclosure
├── contact.html
├── faq.html                FAQPage schema embedded
├── glossary.html
├── deals.html              Affiliate hub
├── saved.html              Saved Calculations (localStorage)
├── 404.html                Branded 404
├── blog/index.html         Article hub (placeholder articles)
├── calculators/            All 6 calculators
│   ├── salary.html         Full PAYE (rUK + Scotland, NI, student loans, pension)
│   ├── mortgage.html       Repayments + SDLT/LBTT/LTT + overpayments
│   ├── savings.html        Compound interest + ISA/LISA
│   ├── pension.html        Pot projection + State Pension + drawdown/annuity
│   ├── debt.html           Snowball / avalanche with proper cascade
│   └── budget.html         50/30/20 + UK categories
├── assets/
│   ├── css/
│   │   ├── styles.src.css  ← edit this (Tailwind + design tokens + components)
│   │   └── styles.css      ← generated, don't edit
│   ├── js/
│   │   ├── uk-rates.js     ⚠ UPDATE YEARLY - all tax thresholds live here
│   │   ├── format.js       £/%/number formatters
│   │   ├── common.js       Header/footer, dark mode, scroll header, prefetch
│   │   ├── motion.js       Scroll reveal, Chart.js theme, lazy loaders
│   │   ├── share.js        URL-param share helper
│   │   ├── storage.js      localStorage CRUD for saved calcs
│   │   ├── save-share.js   Modal (focus trap, social share, image gen)
│   │   ├── saved-page.js   Saved Calculations page Alpine app
│   │   ├── affiliates.js   Central offer registry + render helpers
│   │   └── <calc>.js       Per-calculator engine (salary.js etc.)
│   ├── og/
│   │   ├── site.svg        SVG OG fallback
│   │   ├── og-generator.html  Browser template you can screenshot
│   │   └── site.png        ← generated (1200×630)
│   └── favicon.svg
├── scripts/                One-shot maintenance scripts
│   ├── build-og.js         Puppeteer renderer for site.png
│   ├── inject-meta.js      Re-injects social/favicon/manifest meta
│   └── inject-jsonld.js    Re-injects Organization / Breadcrumb / WebApplication
├── _headers                Cloudflare Pages response headers
├── _redirects              Cloudflare Pages redirects
├── sitemap.xml
├── robots.txt
├── site.webmanifest        PWA-ish manifest (favicon, theme)
├── tailwind.config.js
├── package.json
└── README.md
```

---

## ⚠ Updating UK rates each tax year

All HMRC / gov.uk rates live in **one file**: `assets/js/uk-rates.js`.

Update it **early April** when the new tax year starts on the 6th, and again
after any UK Budget that changes thresholds.

### Checklist

| Item | Source |
|---|---|
| Income tax bands & PA (rUK)         | <https://www.gov.uk/income-tax-rates> |
| Scottish income tax                 | <https://www.gov.scot/policies/taxes/income-tax/> |
| National Insurance (Class 1)        | <https://www.gov.uk/national-insurance-rates-letters> |
| Student loans (Plans 1, 2, 4, 5, PG)| <https://www.gov.uk/repaying-your-student-loan/what-you-pay> |
| State Pension                       | <https://www.gov.uk/state-pension> |
| ISA / LISA / Pension allowances     | <https://www.gov.uk/individual-savings-accounts> |
| SDLT (England & NI)                 | <https://www.gov.uk/stamp-duty-land-tax> |
| LBTT (Scotland)                     | <https://revenue.scot/taxes/land-buildings-transaction-tax> |
| LTT (Wales)                         | <https://gov.wales/land-transaction-tax-guide> |

After updating numbers, also bump the `taxYear:` constant at the top of
`uk-rates.js` and re-run `npm run build:og` so the share image's tax-year
pill is current.

---

## Architecture decisions worth knowing

- **No SPA, no client-side routing.** Each page is a real HTML file. Cross-document
  View Transitions API + hover prefetch make it *feel* like an SPA without the
  framework cost.
- **Calc results never animate in.** Scroll-reveal applies only to marketing
  surfaces. Numbers appear instantly - non-negotiable for a financial tool.
- **localStorage, not cookies.** Saved calculations live on the user's device.
  No accounts. No tracking.
- **Affiliate links** are tagged `rel="nofollow sponsored"` everywhere.
  Disclosure runs in the footer on every page. Single offer per zone - no
  choice paralysis. Debt calculator suppresses affiliate offers when it detects
  the user is in financial crisis (heuristic: high debt-to-min ratio + no
  extra payment).
- **Dark mode** is fully token-driven. Every component reads CSS vars so a
  single class flip (`.dark` on `<html>`) re-themes the entire site.
- **Charts** are lazy-loaded (~70 KB). The first `draw()` call dynamically
  injects Chart.js, then applies the brand theme.

---

## Disclaimers (every page)

> For illustrative purposes only. Not financial advice - figures are based on
> current UK rates which may change. For regulated advice please consult an
> FCA-authorised adviser. Affiliate links may earn us a commission.

Injected automatically by `common.js` wherever `<div id="np-disclaimer"></div>`
appears.

---

© NestPayCalc - UK calculators · Tax year 2026/27
