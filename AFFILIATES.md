# Affiliate placement audit - NestPayCalc

Single source of truth for every commercial slot on the site, what drives it, and how to activate it when an affiliate sign-up is approved.

---

## 0 · Affiliate networks signed up to

Running log of networks the site is registered with. Update each row as approvals and rejections come in.

| Network | Status | Signed up | Verification | Notes |
|---|---|---|---|---|
| **FlexOffers** | Pending approval | 2026-05-31 | ✅ meta `fo-verify` on homepage | Big US-headquartered network. Manual approval, usually 1–3 days. |
| **Awin** | Pending approval | 2026-05-31 | (verify on approval - usually DNS TXT or Mastertag JS snippet) | Strong UK fintech roster (Barclaycard, Skipton, Habito, Plum, etc.). After approval expect a request to embed the **Awin Mastertag** - a one-line JS snippet for conversion tracking. |
| **Impact.com** | Pending approval | 2026-05-31 | ✅ meta `impact-site-verification` on homepage | Hosts Trading 212, Wise, Plum, eToro. Stricter review (3–7 days) but unlocks the most relevant UK retail-investing partners. |
| _Tradedoubler_ | _not yet_ | - | - | UK-focused, decent for ISA / banking advertisers. |
| _Direct programs_ | _not yet_ | - | - | Some big UK fintechs (Moneybox, Plum, Chase) run direct affiliate programs - best rates if approved. |

### Where ownership verification tags live

Any meta tag a network gives you to prove site ownership goes in **`index.html`**, inside the block marked:

```html
<!-- ===== Affiliate / search-engine ownership verifications ===== -->
…
<!-- ===== end verifications ===== -->
```

Each one gets a `<!-- NetworkName - applied YYYY-MM-DD -->` comment above it so you can audit later.

---

## 1 · The central registry

**`assets/js/affiliates.js`** - every affiliate offer on the entire site is defined in the `OFFERS` object at the top of this file. Edit one entry there, every placement that references it updates automatically.

Each offer has:

```js
'isa-easy-access-1': {
  provider:   'Top easy-access Cash ISA',  // visible name
  short:      'ISA',                        // logo block (2–4 chars)
  logoColor:  '#003087',                    // logo background
  product:    'Cash ISA',                   // product type
  meta:       'Easy access · FSCS protected',
  rate:       'Up to 4.85%',                // headline rate
  rateLabel:  'AER variable',               // small label under rate
  features:   [ '…', '…', '…' ],            // 3 bullet highlights
  url:        '/deals#isa',                 // CTA destination
  placeholder: true                          // remove when going live
}
```

### Categories map

The same file has a `CATEGORIES` map that groups offers for each calculator to consume:

| Key | Used on | Offers |
|---|---|---|
| `isa`      | Salary, Savings, Budget, Homepage | 3 Cash ISA placeholders |
| `lisa`     | Savings (LISA context) | 1 LISA placeholder |
| `sipp`     | Salary (higher-rate), Pension | 3 SIPP placeholders |
| `mortgage` | Mortgage | 2 broker placeholders |
| `debt`     | Debt | 2 BT card placeholders + StepChange (charity, non-affiliate) |

---

## 2 · Every placement zone, where it lives, and what it shows

### Zone A - Top banner (site-wide)
- **File:** `assets/js/common.js` (function `topBannerHTML`)
- **Trigger:** every page, dismissible per-user
- **Content:** single line of copy + link to `/deals#isa`
- **Activation:** when an ISA partner is live, update the link from `/deals#isa` to the partner's tracked URL, and refresh the copy if you have a specific deal headline

### Zone B - Personalised post-result prompt
- **File:** `assets/js/affiliates.js` → `renderResultPrompt()`
- **Triggered from:** each calculator's `renderAffiliates()` Alpine method (salary, mortgage, savings, pension, debt, budget)
- **Visual:** the gradient-tinted card that appears right under the headline result, calling out the user's specific number ("You'll pay £4,486 in tax - recover up to 40% via pension top-ups")
- **Activation:** copy stays the same. The `href` field in each calc's `renderAffiliates()` method points at `/deals#isa` etc. - swap to the partner URL when live.

### Zone C - Comparison table
- **File:** `assets/js/affiliates.js` → `renderComparisonTable()`
- **Triggered from:** each calculator + homepage
- **Visual:** the 3-row editorial-style table that appears below results - logo block + provider + rate + features + "View deal →" CTA
- **Activation:** rows are auto-generated from the `CATEGORIES` map. Replace placeholder offers in `OFFERS` and the tables update site-wide.

### Zone D - Sticky sidebar offer
- **File:** `assets/js/affiliates.js` → `renderStickyOffer()`
- **Triggered from:** Salary, Mortgage, Savings, Pension calculators (desktop only)
- **Visual:** the small card pinned in the input column that stays in view while the user scrolls
- **Activation:** uses the first offer from the relevant category. Once partners are live, no code change needed.

### Zone E - Inline contextual links in prose
- **File:** `assets/js/affiliates.js` → `inlineLink()`
- **Triggered from:** Salary calc + Mortgage calc explainer text
- **Visual:** subtle underlined link with a ↗ icon, embedded in body copy
- **Examples in the code:**
  - Salary calc: *"…use a [tax-free Cash ISA] for emergency funds…"* + *"…a [low-fee SIPP] lets you top up pension…"*
  - Mortgage calc: *"…a [whole-of-market mortgage broker] can compare deals you can't get direct."*
- **Activation:** uses the first offer from the relevant category - no per-page change needed.

### Zone F - Trust strip
- **File:** `assets/js/affiliates.js` → `renderTrustStrip()`
- **Triggered from:** every calculator results page
- **Visual:** small horizontal strip - *🛡️ FSCS protected partners · ⚖️ FCA regulated · 🇬🇧 UK based · 🔒 No data stored*
- **Activation:** purely a trust signal. No partner URLs. No change required.

### Zone G - Deals hub
- **File:** `deals.html`
- **Visual:** four sections (ISA / Mortgage / SIPP / Cards), each with a grid of placeholder cards currently showing "Coming soon" CTAs
- **Activation:** when a partner is approved, swap the relevant `<a href="#"` to their tracked URL and change "Coming soon" → partner-appropriate CTA (e.g. *"Open ISA"*, *"Get a broker quote"*).
- The footer block at the bottom of the page already says *"Affiliate partner links will be marked `rel="sponsored"` once live"* - keep that until at least 50% of slots are filled.

### Zone H - Article inline links
- **Files:** `blog/cash-isa-vs-stocks-and-shares-isa.html` (1 link), `blog/uk-stamp-duty-explained.html` (1 link)
- **Visual:** within the article body, descriptive sentence with a single inline link to a relevant deals section
- **Activation:** swap the `href` from `../deals.html#isa` (etc.) to the partner URL when relevant. Or leave pointing to deals page and let the user pick.

### Zone I - Footer disclosure
- **File:** `assets/js/common.js` (function `footerHTML`)
- **Visible on:** every page
- **Content:** the standing affiliate disclosure paragraph + MoneyHelper link
- **Activation:** no change needed. Required to stay visible forever per ASA / CMA guidance.

### Zone J - About page disclosure
- **File:** `about.html`
- **Visible on:** /about
- **Content:** the dedicated "Affiliate disclosure" `<h2>` section
- **Activation:** no change. Update only if the disclosure language needs strengthening after partner audits.

---

## 3 · How to swap in a real partner (5-minute drill)

For example, you sign up to **Trading 212** for the easy-access ISA slot.

1. Open `assets/js/affiliates.js`.
2. Find the `'isa-easy-access-1'` entry in `OFFERS`.
3. Replace:
   - `provider:  'Top easy-access Cash ISA'`  →  `provider:  'Trading 212'`
   - `short:     'ISA'`                        →  `short:     'T212'`
   - `logoColor: '#003087'`                    →  `logoColor: '#000000'`
   - `rate:      'Up to 4.85%'`                →  verify on their site
   - `url:       '/deals#isa'`                 →  `url: 'https://www.trading212.com/promo/...&utm_source=nestpaycalc'`
4. Delete the `placeholder: true` line.
5. Save → push to GitHub → Vercel rebuilds and the offer is live **everywhere it appears** (homepage comparison table, salary calc, savings calc, sticky sidebar, inline links).
6. Update `deals.html` - find the matching `<a href="#"…>Coming soon</a>` → replace with the same `href` and a partner-appropriate CTA label.

You do NOT need to edit any calculator HTML file directly.

---

## 4 · QA checklist before any partner goes live

- [ ] **Verify rate** on the partner's own landing page within the last 24 hours
- [ ] **Tracking URL** includes a UTM (or partner's own tracking ID) so you can attribute conversions
- [ ] **`rel="nofollow sponsored"`** on every outbound link - this is automatic via the render helpers but confirm in deals.html
- [ ] **Disclosure** - confirm footer disclosure + deals.html header disclosure are both visible
- [ ] **No misleading claims** - never say "best", "highest" unless you can prove it; "top-of-market" or "featured" are safer
- [ ] **Test the link** - paste it into an incognito window and complete the partner's flow to confirm tracking fires
- [ ] **Update this document** - note which slot is now live, removing it from the placeholder list

---

## 5 · ASA / CMA compliance shortlist

The CMA's [Hidden Ads Guidance](https://www.gov.uk/government/publications/social-media-endorsements-guide-for-influencers) applies even though we're a comparison site, not an influencer. Key musts:

- Disclosure must be **upfront** (we have it in the footer, deals header, and About page) ✅
- `rel="sponsored"` on every outbound affiliate link ✅
- Don't imply a product is recommended/endorsed by NestPayCalc - say "featured" or "partner" instead
- Always show product downsides as well as upsides (e.g., "capital at risk" on stocks ISAs) ✅ already in copy
- Never say "best" or "lowest" without sourcing - top-of-market is fine

---

## 6 · Quick reference: file map

```
assets/js/affiliates.js         ← OFFERS registry, CATEGORIES map, render functions
assets/js/common.js             ← top banner + footer disclosure
deals.html                      ← /deals hub with category sections
about.html                      ← affiliate disclosure section
blog/*.html                     ← inline links from articles
calculators/*.html              ← each Alpine app calls NPAffiliates.* render functions
```

Edit `affiliates.js` first. Edit `deals.html` to mirror. Everything else flows automatically.
