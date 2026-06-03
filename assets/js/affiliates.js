/* ============================================================
 * NestPayCalc - Affiliate offer registry & render helpers
 *
 * One place to manage every affiliate offer used across the
 * site. Each calculator pulls offers by category and renders
 * them with the helper functions - keeps disclosures consistent
 * and lets you swap providers without hunting through HTML.
 *
 * To add a new affiliate:
 *   1. Add an entry to OFFERS below
 *   2. Add the `id` to the relevant CATEGORY array
 *   3. The calculator pages will pick it up automatically
 *
 * Always include rel="nofollow sponsored" on outbound links.
 * ============================================================ */
(function () {
  /* ============================================================
   * OFFER REGISTRY - currently PLACEHOLDER DATA only.
   *
   * Every entry below is a generic, non-branded slot reserved for a
   * real affiliate partner. Rates are market-illustrative (top of the
   * current UK market for the product category) - NOT specific to any
   * provider, so there's no ASA / brand-impersonation risk.
   *
   * ── How to swap in a real partner ──────────────────────────────
   *   When an affiliate sign-up is approved, replace these fields:
   *
   *     provider:   "Provider's real public name"
   *     short:      "BR"          (2–4 char abbreviation for the logo block)
   *     logoColor:  "#xxxxxx"     (their brand colour, or keep brand)
   *     rate:       "x.xx%"       (verified from their landing page)
   *     features:   [ "…", "…" ]  (3 highlights - check spec)
   *     url:        "https://partner.com/?...&utm_source=nestpaycalc"
   *
   *   Leave `product` and `meta` mostly untouched - they describe the
   *   product type, not the partner.
   *
   *   Once swapped, remove `placeholder: true` so QA / future audits
   *   know it's live.
   * ============================================================ */
  const OFFERS = {
    /* ---------- Cash ISAs ---------- */
    'isa-easy-access-1': {
      provider: 'Top easy-access Cash ISA',
      short: 'ISA',
      logoColor: '#003087',
      product: 'Cash ISA', meta: 'Easy access · FSCS protected',
      rate: 'Up to 4.85%', rateLabel: 'AER variable',
      features: ['No minimum deposit', 'Withdraw any time', 'Daily interest'],
      url: '/deals#isa',
      placeholder: true
    },
    'isa-easy-access-2': {
      provider: 'Mobile-first Cash ISA',
      short: 'ISA',
      logoColor: '#0a4dc7',
      product: 'Cash ISA', meta: 'Easy access · FSCS protected',
      rate: 'Up to 4.70%', rateLabel: 'AER variable',
      features: ['Low minimum', 'In-app management', 'Apple / Google Pay'],
      url: '/deals#isa',
      placeholder: true
    },
    'isa-fixed-1y': {
      provider: '1-year fixed Cash ISA',
      short: 'ISA',
      logoColor: '#001f5e',
      product: 'Cash ISA', meta: '1-year fixed · FSCS protected',
      rate: 'Up to 5.00%', rateLabel: 'AER fixed',
      features: ['£1,000 minimum', 'Lock in higher rate', 'Transfer in allowed'],
      url: '/deals#isa',
      placeholder: true
    },

    /* ---------- LISA ---------- */
    'lisa-1': {
      provider: 'Lifetime ISA partner',
      short: 'LISA',
      logoColor: '#00875a',
      product: 'Lifetime ISA', meta: 'Cash + Stocks options',
      rate: 'Up to 4.40%', rateLabel: 'AER · plus 25% govt bonus',
      features: ['£1 minimum to start', 'First home or 60+', 'Govt £1,000/yr bonus'],
      url: '/deals#isa',
      placeholder: true
    },

    /* ---------- SIPPs / Pensions ---------- */
    'sipp-1': {
      provider: 'Low-fee SIPP partner',
      short: 'SIPP',
      logoColor: '#003087',
      product: 'SIPP', meta: 'DIY ETF investing',
      rate: 'From 0.00%', rateLabel: 'platform fee',
      features: ['Wide ETF choice', 'No dealing fees on regular investing', 'Tax relief automatic'],
      url: '/deals#sipp',
      placeholder: true
    },
    'sipp-2': {
      provider: 'Established SIPP platform',
      short: 'SIPP',
      logoColor: '#0a4dc7',
      product: 'SIPP', meta: 'Established UK platform',
      rate: 'From 0.25%', rateLabel: 'platform fee',
      features: ['Low minimum', 'Wide fund choice', 'Drawdown-ready'],
      url: '/deals#sipp',
      placeholder: true
    },
    'sipp-3': {
      provider: 'Index-tracker SIPP',
      short: 'SIPP',
      logoColor: '#001f5e',
      product: 'SIPP', meta: 'Index-tracker specialist',
      rate: 'From 0.15%', rateLabel: 'platform fee · capped',
      features: ['Low ongoing charges', 'Multi-asset funds available', 'No exit fee'],
      url: '/deals#sipp',
      placeholder: true
    },

    /* ---------- Mortgages ---------- */
    // First live partner - approved via Awin 2026-06-03.
    // Merchant ID 126767, affiliate ID 2918949. Using the awclick.php
    // text-link variant (linkid 4789504) since every surface using this
    // entry renders text/button CTAs, not banner images. The cread.php
    // banner variant would also work but adds a tracking-pixel image
    // fetch we don't need.
    //
    // logoSrc points to the merchant's own brand logo saved locally.
    // logoColor + short stay as fallbacks (used when logoSrc fails to
    // load or for any surface that hasn't been updated to read logoSrc).
    'mortgage-remortgage-cashback': {
      provider: 'Cashback Remortgages',
      short: 'CR',
      logoColor: '#0a2855',
      logoSrc: '/assets/affiliates/cashback-remortgages.jpg',
      product: 'Remortgage broker', meta: 'No broker fees · Cashback on completion',
      rate: 'Cashback', rateLabel: 'paid on completion',
      features: ['No broker fees, ever', 'Cashback paid when your remortgage completes', 'UK whole-of-market lender access'],
      url: 'https://www.awin1.com/awclick.php?gid=606072&mid=126767&awinaffid=2918949&linkid=4789504&clickref='
    },
    'mortgage-broker-1': {
      provider: 'Whole-of-market broker',
      short: 'MOR',
      logoColor: '#003087',
      product: 'Mortgage broker', meta: 'Free advice · FCA regulated',
      rate: 'Free', rateLabel: 'no broker fee',
      features: ['Whole-of-market access', 'Online or phone', 'Up to 6 months ahead'],
      url: '/deals#mortgage',
      placeholder: true
    },
    'mortgage-broker-2': {
      provider: 'Online mortgage broker',
      short: 'MOR',
      logoColor: '#0a4dc7',
      product: 'Mortgage broker', meta: 'Digital-first · multiple lenders',
      rate: 'Free', rateLabel: 'broker fees may apply',
      features: ['Quick decision', 'Buy-to-let supported', 'Track via app'],
      url: '/deals#mortgage',
      placeholder: true
    },

    /* ---------- 0% balance transfer ---------- */
    'bt-card-1': {
      provider: '0% balance transfer card',
      short: 'BT',
      logoColor: '#003087',
      product: 'Credit card', meta: 'Up to 30 months 0% on transfers',
      rate: '30 mo', rateLabel: '0% balance transfer',
      features: ['Up to 30 months 0%', 'Transfer fee applies', 'Eligibility checker'],
      url: '/deals#cards',
      placeholder: true
    },
    'bt-card-2': {
      provider: 'Long 0% BT card',
      short: 'BT',
      logoColor: '#001f5e',
      product: 'Credit card', meta: 'Long 0% interest period',
      rate: '28 mo', rateLabel: '0% balance transfer',
      features: ['Up to 28 months 0%', 'Lower transfer fee option', 'Soft search'],
      url: '/deals#cards',
      placeholder: true
    },

    /* ---------- Free debt advice (charity, not affiliate - keep visible) ---------- */
    'stepchange': {
      provider: 'StepChange',
      short: 'SC',
      logoColor: '#e87722',
      product: 'Free debt charity', meta: 'FCA-regulated · always free',
      rate: 'Free', rateLabel: 'always',
      features: ['Online debt plan', 'No fees ever', 'Trusted UK charity'],
      url: 'https://www.stepchange.org/',
      noaffil: true     // shown without "Sponsored" label
    }
  };

  const CATEGORIES = {
    isa:       ['isa-easy-access-1', 'isa-easy-access-2', 'isa-fixed-1y'],
    lisa:      ['lisa-1'],
    sipp:      ['sipp-1', 'sipp-2', 'sipp-3'],
    mortgage:  ['mortgage-remortgage-cashback', 'mortgage-broker-1', 'mortgage-broker-2'],
    debt:      ['bt-card-1', 'bt-card-2', 'stepchange']
  };

  function escape(s) { return String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c])); }

  /* ----- 1. Personalised post-result prompt -----
     Highest-intent zone. Use the user's actual figure in the headline. */
  function renderResultPrompt({ icon = '💡', title, sub, cta = 'Compare deals', href }) {
    return `
      <a href="${escape(href)}" rel="nofollow sponsored" class="np-result-prompt no-underline" aria-label="${escape(title)}">
        <span class="np-result-prompt-icon" aria-hidden="true">${icon}</span>
        <span class="np-result-prompt-body">
          <span class="np-result-prompt-title">${escape(title)}</span>
          <span class="np-result-prompt-sub">${escape(sub)} · <span class="np-sponsored-tag" style="background:transparent;padding:0;text-transform:none;letter-spacing:0;font-size:.68rem;font-weight:500;">Sponsored</span></span>
        </span>
        <span class="np-result-prompt-cta">${escape(cta)} →</span>
      </a>`;
  }

  /* ----- 2. Comparison table - the workhorse below results ----- */
  function renderComparisonTable({ category, title = 'Top picks', subtitle = '', limit = 3 }) {
    const ids = (CATEGORIES[category] || []).slice(0, limit);
    if (!ids.length) return '';
    const rows = ids.map(id => {
      const o = OFFERS[id]; if (!o) return '';
      const logo = o.logoSrc
        ? `<span class="np-compare-logo np-compare-logo-img"><img src="${escape(o.logoSrc)}" alt="${escape(o.provider)} logo" loading="lazy" decoding="async"></span>`
        : `<span class="np-compare-logo" style="background:${o.logoColor}">${escape(o.short)}</span>`;
      return `
        <div class="np-compare-row">
          <div class="np-compare-provider">
            ${logo}
            <div>
              <div class="np-compare-name">${escape(o.provider)}</div>
              <div class="np-compare-meta">${escape(o.product)} · ${escape(o.meta)}</div>
            </div>
          </div>
          <div>
            <div class="np-compare-rate">${escape(o.rate)}</div>
            <div class="np-compare-rate-label">${escape(o.rateLabel)}</div>
          </div>
          <ul class="np-compare-features list-disc pl-4 space-y-0.5">
            ${o.features.map(f => `<li>${escape(f)}</li>`).join('')}
          </ul>
          <a href="${escape(o.url)}" rel="nofollow sponsored" class="np-compare-cta">View deal →</a>
        </div>`;
    }).join('');
    return `
      <section class="np-compare" aria-label="${escape(title)}">
        <header class="np-compare-header">
          <div>
            <div class="np-compare-title">${escape(title)}</div>
            ${subtitle ? `<div class="text-xs text-slate-500 mt-0.5">${escape(subtitle)}</div>` : ''}
          </div>
          <span class="np-sponsored-tag">Sponsored</span>
        </header>
        ${rows}
        <footer class="np-compare-footer">
          Illustrative top-of-market rates for the product category. Always verify on the provider's own site before applying. Partner links may earn NestPayCalc a commission. Not regulated financial advice.
        </footer>
      </section>`;
  }

  /* ----- 3. Inline text link - drop into prose ----- */
  function inlineLink(category, anchorText) {
    const id = (CATEGORIES[category] || [])[0];
    const o = OFFERS[id]; if (!o) return escape(anchorText);
    return `<a href="${escape(o.url)}" rel="nofollow sponsored" class="np-inline-link">${escape(anchorText)}</a>`;
  }

  /* ----- 4. Tiny row link inside breakdown tables ----- */
  function rowLink(category, anchorText) {
    const id = (CATEGORIES[category] || [])[0];
    const o = OFFERS[id]; if (!o) return '';
    return `<a href="${escape(o.url)}" rel="nofollow sponsored" class="np-row-link">${escape(anchorText)} →</a>`;
  }

  /* ----- 5. Sticky sidebar offer card ----- */
  function renderStickyOffer({ category, eyebrow, headline, body, cta = 'See deal' }) {
    const id = (CATEGORIES[category] || [])[0];
    const o = OFFERS[id]; if (!o) return '';
    // When the offer has a brand logo, show it inline with the eyebrow so the
    // sponsor is immediately identifiable. Falls back to plain eyebrow text
    // for placeholder offers without a logoSrc.
    const header = o.logoSrc
      ? `<div class="flex items-center gap-2 mb-1">
           <span class="np-compare-logo np-compare-logo-img" style="width:28px;height:28px;border-radius:8px;">
             <img src="${escape(o.logoSrc)}" alt="${escape(o.provider)} logo" loading="lazy" decoding="async">
           </span>
           <div class="np-offer-card-eyebrow">${escape(eyebrow)}</div>
         </div>`
      : `<div class="np-offer-card-eyebrow">${escape(eyebrow)}</div>`;
    return `
      <aside class="np-sticky-offer">
        ${header}
        <h3 class="font-bold text-base leading-snug">${escape(headline)}</h3>
        <p class="text-sm text-ink-soft mt-2">${escape(body)}</p>
        <div class="flex items-center justify-between mt-4 pt-4 border-t border-border">
          <div>
            <div class="text-xs text-ink-muted">${escape(o.provider)}</div>
            <div class="text-lg font-bold text-brand dark:text-blue-300">${escape(o.rate)}</div>
          </div>
          <a href="${escape(o.url)}" rel="nofollow sponsored" class="np-btn np-btn-primary text-sm py-2 px-4">${escape(cta)} →</a>
        </div>
        <div class="text-[0.65rem] text-ink-muted mt-3 text-center">Sponsored · ${escape(o.meta)}</div>
      </aside>`;
  }

  /* ----- 6. Trust strip - site-level signals on every calc.
     Inline SVGs (Lucide paths) so they render immediately on x-html
     injection without needing a refreshIcons() pass.
     Copy is deliberately specific and verifiable - no generic
     "UK-based" / blanket "FSCS-protected" claims that don't hold on
     every page (mortgage brokers aren't FSCS-protected products). ----- */
  function renderTrustStrip() {
    const ICON = 'width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"';
    return `
      <div class="np-trust-strip">
        <span class="np-trust-strip-item">
          <svg ${ICON}><path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"/><path d="m9 12 2 2 4-4"/></svg>
          All affiliate partners FCA-authorised
        </span>
        <span class="np-trust-strip-item">
          <svg ${ICON}><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
          Rates sourced from HMRC &amp; gov.uk
        </span>
        <span class="np-trust-strip-item">
          <svg ${ICON}><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          Calculations run in your browser
        </span>
        <span class="np-trust-strip-item">
          <svg ${ICON}><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/><path d="m9 16 2 2 4-4"/></svg>
          Built for the 2026/27 UK tax year
        </span>
      </div>`;
  }

  window.NPAffiliates = {
    OFFERS, CATEGORIES,
    renderResultPrompt, renderComparisonTable,
    inlineLink, rowLink,
    renderStickyOffer, renderTrustStrip
  };
})();
