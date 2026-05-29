/* ============================================================
 * NestPayCalc - Affiliate offer registry & render helpers
 *
 * One place to manage every affiliate offer used across the
 * site. Each calculator pulls offers by category and renders
 * them with the helper functions — keeps disclosures consistent
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
  const OFFERS = {
    /* ---------- Cash ISAs ---------- */
    'isa-easy-access-1': {
      provider: 'Trading 212', short: 'T212',
      logoColor: '#000000',
      product: 'Cash ISA', meta: 'Easy access · FSCS protected',
      rate: '4.85%', rateLabel: 'AER variable',
      features: ['No min deposit', 'Instant withdrawals', 'Daily interest'],
      url: 'https://www.trading212.com/?utm_source=nestpaycalc'
    },
    'isa-easy-access-2': {
      provider: 'Chip', short: 'CHIP',
      logoColor: '#9b6cff',
      product: 'Cash ISA', meta: 'Easy access · FSCS protected',
      rate: '4.74%', rateLabel: 'AER variable',
      features: ['£1 minimum', 'Mobile-first', 'Apple/Google Pay'],
      url: 'https://getchip.uk/?utm_source=nestpaycalc'
    },
    'isa-fixed-1y': {
      provider: 'Hampshire Trust Bank', short: 'HTB',
      logoColor: '#0d4d8c',
      product: 'Cash ISA', meta: '1-year fixed · FSCS protected',
      rate: '5.00%', rateLabel: 'AER fixed',
      features: ['£1,000 min', 'No early access', 'Transfer in allowed'],
      url: '#'
    },

    /* ---------- LISA ---------- */
    'lisa-1': {
      provider: 'Moneybox', short: 'MB',
      logoColor: '#0066ff',
      product: 'Lifetime ISA', meta: 'Cash + Stocks options',
      rate: '4.40%', rateLabel: 'AER · plus 25% govt bonus',
      features: ['£1 minimum', 'First home or 60+', 'In-app management'],
      url: '#'
    },

    /* ---------- SIPPs / Pensions ---------- */
    'sipp-1': {
      provider: 'InvestEngine', short: 'IE',
      logoColor: '#1f2937',
      product: 'SIPP', meta: '0% platform fee on DIY ETFs',
      rate: '0.00%', rateLabel: 'platform fee',
      features: ['600+ ETFs', 'No dealing fees', 'Tax relief automatic'],
      url: '#'
    },
    'sipp-2': {
      provider: 'AJ Bell', short: 'AJB',
      logoColor: '#003087',
      product: 'SIPP', meta: 'Established UK platform',
      rate: '0.25%', rateLabel: 'platform fee',
      features: ['£25 minimum', 'Wide fund choice', 'Drawdown ready'],
      url: '#'
    },
    'sipp-3': {
      provider: 'Vanguard', short: 'VG',
      logoColor: '#a8201f',
      product: 'SIPP', meta: 'Index-tracker specialist',
      rate: '0.15%', rateLabel: 'platform fee · capped',
      features: ['Low ongoing charges', 'LifeStrategy funds', 'No exit fee'],
      url: '#'
    },

    /* ---------- Mortgages ---------- */
    'mortgage-broker-1': {
      provider: 'L&C Mortgages', short: 'L&C',
      logoColor: '#e30613',
      product: 'Whole-of-market broker', meta: 'Free advice · FCA regulated',
      rate: 'Free', rateLabel: 'no broker fee',
      features: ['Whole-of-market', 'Online or phone', 'Up to 6 months ahead'],
      url: '#'
    },
    'mortgage-broker-2': {
      provider: 'Habito', short: 'H',
      logoColor: '#ff5b5b',
      product: 'Online broker', meta: 'Digital-first · 90+ lenders',
      rate: 'Free', rateLabel: 'broker fees may apply',
      features: ['Quick decision', 'Buy-to-let too', 'Track via app'],
      url: '#'
    },

    /* ---------- 0% balance transfer ---------- */
    'bt-card-1': {
      provider: 'Barclaycard', short: 'BC',
      logoColor: '#00aeef',
      product: 'Platinum 0% BT', meta: 'Up to 30 months 0% interest',
      rate: '30 mo', rateLabel: '0% balance transfer',
      features: ['3.45% transfer fee', 'No annual fee', 'Eligibility check'],
      url: '#'
    },
    'bt-card-2': {
      provider: 'Tesco Bank', short: 'TB',
      logoColor: '#005eb8',
      product: 'Clubcard Plus BT', meta: 'Up to 28 months 0%',
      rate: '28 mo', rateLabel: '0% balance transfer',
      features: ['2.99% transfer fee', 'Earns Clubcard points', 'Soft search'],
      url: '#'
    },

    /* ---------- Free debt advice (not affiliate, ethical signal) ---------- */
    'stepchange': {
      provider: 'StepChange', short: 'SC',
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
    mortgage:  ['mortgage-broker-1', 'mortgage-broker-2'],
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

  /* ----- 2. Comparison table — the workhorse below results ----- */
  function renderComparisonTable({ category, title = 'Top picks', subtitle = '', limit = 3 }) {
    const ids = (CATEGORIES[category] || []).slice(0, limit);
    if (!ids.length) return '';
    const rows = ids.map(id => {
      const o = OFFERS[id]; if (!o) return '';
      return `
        <div class="np-compare-row">
          <div class="np-compare-provider">
            <span class="np-compare-logo" style="background:${o.logoColor}">${escape(o.short)}</span>
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
          Featured partners. Rates correct at last update — verify on the provider's site. NestPayCalc may earn a commission. This is not regulated financial advice.
        </footer>
      </section>`;
  }

  /* ----- 3. Inline text link — drop into prose ----- */
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
    return `
      <aside class="np-sticky-offer">
        <div class="np-offer-card-eyebrow">${escape(eyebrow)}</div>
        <h3 class="font-bold text-base leading-snug">${escape(headline)}</h3>
        <p class="text-sm text-slate-600 dark:text-slate-400 mt-2">${escape(body)}</p>
        <div class="flex items-center justify-between mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
          <div>
            <div class="text-xs text-slate-500">${escape(o.provider)}</div>
            <div class="text-lg font-bold text-brand dark:text-blue-300">${escape(o.rate)}</div>
          </div>
          <a href="${escape(o.url)}" rel="nofollow sponsored" class="np-btn np-btn-primary text-sm py-2 px-4">${escape(cta)} →</a>
        </div>
        <div class="text-[0.65rem] text-slate-400 mt-3 text-center">Sponsored · ${escape(o.meta)}</div>
      </aside>`;
  }

  /* ----- 6. Trust strip — provider logos + signals ----- */
  function renderTrustStrip() {
    return `
      <div class="np-trust-strip">
        <span class="np-trust-strip-item">🛡️ FSCS protected partners</span>
        <span class="np-trust-strip-item">⚖️ FCA regulated</span>
        <span class="np-trust-strip-item">🇬🇧 UK based</span>
        <span class="np-trust-strip-item">🔒 No data stored</span>
      </div>`;
  }

  window.NPAffiliates = {
    OFFERS, CATEGORIES,
    renderResultPrompt, renderComparisonTable,
    inlineLink, rowLink,
    renderStickyOffer, renderTrustStrip
  };
})();
