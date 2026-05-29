/* NestPayCalc - shared header, footer, dark mode, helpers */
(function () {
  const ROOT = (function findRoot() {
    // depth-detect: pages in /calculators/ or /blog/ need ../ prefix
    const path = window.location.pathname.replace(/\\/g, '/');
    if (/\/calculators\//.test(path) || /\/blog\//.test(path)) return '../';
    return '';
  })();

  const NAV = [
    { label: 'Home', href: ROOT + 'index.html' },
    {
      label: 'Calculators', children: [
        { label: 'Salary / Take-Home', href: ROOT + 'calculators/salary.html' },
        { label: 'Mortgage & SDLT',    href: ROOT + 'calculators/mortgage.html' },
        { label: 'Savings & ISA',      href: ROOT + 'calculators/savings.html' },
        { label: 'Pension / Retirement', href: ROOT + 'calculators/pension.html' },
        { label: 'Debt Payoff',        href: ROOT + 'calculators/debt.html' },
        { label: 'Budget Planner',     href: ROOT + 'calculators/budget.html' }
      ]
    },
    { label: 'Saved',      href: ROOT + 'saved.html' },
    { label: 'Best Deals', href: ROOT + 'deals.html' },
    { label: 'Resources',  href: ROOT + 'blog/index.html' },
    { label: 'About',      href: ROOT + 'about.html' },
    { label: 'Contact',    href: ROOT + 'contact.html' }
  ];

  function topBannerHTML() {
    if (localStorage.getItem('np-banner-dismissed') === '1') return '';
    return `
<div class="np-top-banner np-no-print" id="np-top-banner">
  <span><strong>Featured:</strong> Earn up to 5.00% AER tax-free in a fixed Cash ISA.</span>
  <a href="${ROOT}deals.html#isa" rel="nofollow sponsored">Compare ISAs →</a>
  <button class="np-top-banner-close" id="np-top-banner-close" aria-label="Dismiss">×</button>
</div>`;
  }

  function navHTML() {
    return `
<header data-vt="header" class="np-no-print sticky top-0 z-40 bg-surface/85 backdrop-blur-md border-b border-border">
  <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="header-inner flex items-center justify-between">
      <a href="${ROOT}index.html" class="flex items-center gap-2 font-bold text-lg text-brand tracking-tight">
        <svg width="28" height="28" viewBox="0 0 32 32" fill="none" aria-hidden="true">
          <path d="M4 22c0-6 5.5-10 12-10s12 4 12 10v2H4v-2z" fill="currentColor"/>
          <path d="M4 22c0-6 5.5-10 12-10s12 4 12 10" stroke="rgb(var(--accent))" stroke-width="2" fill="none"/>
          <text x="16" y="21" text-anchor="middle" font-size="11" font-weight="700" fill="#fff">£</text>
        </svg>
        NestPayCalc
      </a>
      <nav class="hidden lg:flex items-center gap-1" aria-label="Primary">
        ${NAV.map(item => item.children
          ? `<div class="relative group">
              <button class="px-3 py-2 text-sm font-medium text-ink-soft hover:text-brand inline-flex items-center gap-1 transition-colors">
                ${item.label}
                <i data-lucide="chevron-down" class="w-3.5 h-3.5 transition-transform group-hover:rotate-180"></i>
              </button>
              <div class="absolute left-0 top-full pt-2 invisible opacity-0 translate-y-1 group-hover:visible group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200">
                <div class="np-card w-64 p-2">
                  ${item.children.map(c => `<a href="${c.href}" class="block px-3 py-2 rounded-lg text-sm text-ink-soft hover:text-ink hover:bg-surface-3 transition-colors">${c.label}</a>`).join('')}
                </div>
              </div>
            </div>`
          : `<a href="${item.href}" class="px-3 py-2 text-sm font-medium text-ink-soft hover:text-brand transition-colors">${item.label}</a>`
        ).join('')}
        <button id="np-darkmode" class="ml-2 p-2 rounded-lg text-ink-soft hover:text-ink hover:bg-surface-3 transition-colors" aria-label="Toggle dark mode">
          <i data-lucide="moon" class="w-5 h-5 dark:hidden"></i>
          <i data-lucide="sun" class="w-5 h-5 hidden dark:block"></i>
        </button>
      </nav>
      <button id="np-mobile-toggle" class="lg:hidden p-2 rounded-lg text-ink-soft hover:text-ink hover:bg-surface-3 transition-colors" aria-label="Open menu" aria-expanded="false">
        <i data-lucide="menu" class="w-6 h-6"></i>
      </button>
    </div>
    <div id="np-mobile-menu" class="lg:hidden hidden pb-4 space-y-1">
      ${NAV.map(item => item.children
        ? `<details class="border-t border-border pt-2">
            <summary class="px-3 py-2 text-sm font-semibold cursor-pointer text-ink">${item.label}</summary>
            ${item.children.map(c => `<a href="${c.href}" class="block px-6 py-2 text-sm text-ink-soft hover:text-brand transition-colors">${c.label}</a>`).join('')}
          </details>`
        : `<a href="${item.href}" class="block px-3 py-2 text-sm font-medium text-ink-soft hover:text-brand border-t border-border transition-colors">${item.label}</a>`
      ).join('')}
      <button id="np-darkmode-mobile" class="w-full text-left px-3 py-2 text-sm font-medium border-t border-border text-ink-soft hover:text-brand transition-colors">Toggle dark mode</button>
    </div>
  </div>
</header>`;
  }

  function footerHTML() {
    const yr = new Date().getFullYear();
    return `
<footer class="np-no-print mt-22 border-t border-border bg-surface-3">
  <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
    <div class="grid md:grid-cols-4 gap-10">
      <div>
        <div class="flex items-center gap-2 font-bold text-lg text-brand mb-3 tracking-tight">
          <svg width="28" height="28" viewBox="0 0 32 32" fill="none" aria-hidden="true">
            <path d="M4 22c0-6 5.5-10 12-10s12 4 12 10v2H4v-2z" fill="currentColor"/>
            <path d="M4 22c0-6 5.5-10 12-10s12 4 12 10" stroke="rgb(var(--accent))" stroke-width="2" fill="none"/>
            <text x="16" y="21" text-anchor="middle" font-size="11" font-weight="700" fill="#fff">£</text>
          </svg>
          NestPayCalc
        </div>
        <p class="text-sm text-ink-muted leading-relaxed">Free UK financial calculators — accurate, easy, and built for real-world UK rules.</p>
      </div>
      <div>
        <h3 class="font-semibold text-ink mb-3 text-xs uppercase tracking-wider text-ink-muted">Calculators</h3>
        <ul class="space-y-2 text-sm">
          <li><a class="text-ink-soft hover:text-brand transition-colors" href="${ROOT}calculators/salary.html">Salary / Take-Home</a></li>
          <li><a class="text-ink-soft hover:text-brand transition-colors" href="${ROOT}calculators/mortgage.html">Mortgage &amp; SDLT</a></li>
          <li><a class="text-ink-soft hover:text-brand transition-colors" href="${ROOT}calculators/savings.html">Savings &amp; ISA</a></li>
          <li><a class="text-ink-soft hover:text-brand transition-colors" href="${ROOT}calculators/pension.html">Pension</a></li>
          <li><a class="text-ink-soft hover:text-brand transition-colors" href="${ROOT}calculators/debt.html">Debt Payoff</a></li>
          <li><a class="text-ink-soft hover:text-brand transition-colors" href="${ROOT}calculators/budget.html">Budget Planner</a></li>
        </ul>
      </div>
      <div>
        <h3 class="font-semibold text-ink mb-3 text-xs uppercase tracking-wider text-ink-muted">Resources</h3>
        <ul class="space-y-2 text-sm">
          <li><a class="text-ink-soft hover:text-brand transition-colors" href="${ROOT}blog/index.html">Blog &amp; Guides</a></li>
          <li><a class="text-ink-soft hover:text-brand transition-colors" href="${ROOT}faq.html">FAQ</a></li>
          <li><a class="text-ink-soft hover:text-brand transition-colors" href="${ROOT}glossary.html">Glossary</a></li>
          <li><a class="text-ink-soft hover:text-brand transition-colors" href="${ROOT}deals.html">Best Deals</a></li>
          <li><a class="text-ink-soft hover:text-brand transition-colors" href="${ROOT}saved.html">Saved</a></li>
        </ul>
      </div>
      <div>
        <h3 class="font-semibold text-ink mb-3 text-xs uppercase tracking-wider text-ink-muted">Company</h3>
        <ul class="space-y-2 text-sm">
          <li><a class="text-ink-soft hover:text-brand transition-colors" href="${ROOT}about.html">About</a></li>
          <li><a class="text-ink-soft hover:text-brand transition-colors" href="${ROOT}contact.html">Contact</a></li>
          <li><a class="text-ink-soft hover:text-brand transition-colors" href="${ROOT}about.html#privacy">Privacy</a></li>
          <li><a class="text-ink-soft hover:text-brand transition-colors" href="${ROOT}about.html#editorial">Editorial Standards</a></li>
        </ul>
      </div>
    </div>
    <div class="mt-12 pt-8 border-t border-border text-xs text-ink-muted space-y-3 leading-relaxed">
      <p><strong class="text-ink-soft">Important:</strong> The information and calculators on NestPayCalc are for illustrative purposes only and do not constitute financial, tax or legal advice. Tax rates, allowances and thresholds are correct to the best of our knowledge for the 2026/27 UK tax year but may change. Always consult a qualified, FCA-regulated financial adviser, accountant or solicitor before making decisions.</p>
      <p><strong class="text-ink-soft">Affiliate disclosure:</strong> Some links on this site (including those marked "Best Deals" or "Compare deals") are affiliate links. If you click through and take out a product, NestPayCalc may receive a commission at no extra cost to you. This never affects which products we choose to feature. We do not provide regulated financial advice. For free, impartial guidance see <a href="https://www.moneyhelper.org.uk/" rel="nofollow noopener" target="_blank" class="underline hover:text-brand transition-colors">MoneyHelper</a>, the government-backed service.</p>
      <p>&copy; ${yr} NestPayCalc · UK calculators · Tax year 2026/27</p>
      <p>NestPayCalc is operated by <strong class="text-ink-soft">Croft &amp; Hugh Digital LTD</strong> · <a href="mailto:hello@crofthughdigital.co.uk" class="underline hover:text-brand transition-colors">hello@crofthughdigital.co.uk</a></p>
    </div>
  </div>
</footer>`;
  }

  function injectDisclaimerBar() {
    return `
<div class="np-disclaimer mt-6">
  <strong>For illustrative purposes only.</strong> Not financial advice — figures are based on current UK rates which may change. For regulated advice please consult an FCA-authorised adviser. Affiliate links may earn us a commission.
</div>`;
  }

  function setupDarkMode() {
    const stored = localStorage.getItem('np-theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = stored || (prefersDark ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', theme === 'dark');

    function toggle() {
      const isDark = document.documentElement.classList.toggle('dark');
      localStorage.setItem('np-theme', isDark ? 'dark' : 'light');
    }
    document.getElementById('np-darkmode')?.addEventListener('click', toggle);
    document.getElementById('np-darkmode-mobile')?.addEventListener('click', toggle);
  }

  function setupMobileMenu() {
    const btn = document.getElementById('np-mobile-toggle');
    const menu = document.getElementById('np-mobile-menu');
    btn?.addEventListener('click', () => {
      const open = menu.classList.toggle('hidden') === false;
      btn.setAttribute('aria-expanded', open);
    });
  }

  function setupTopBanner() {
    const close = document.getElementById('np-top-banner-close');
    close?.addEventListener('click', () => {
      const banner = document.getElementById('np-top-banner');
      if (banner) banner.remove();
      localStorage.setItem('np-banner-dismissed', '1');
    });
  }

  /* Sticky shrink-on-scroll header. rAF-throttled to keep INP perfect. */
  function setupHeaderScroll() {
    const header = document.querySelector('header[data-vt="header"]');
    if (!header) return;
    let ticking = false;
    const update = () => {
      const scrolled = window.scrollY > 8;
      if ((header.dataset.scrolled === 'true') !== scrolled) {
        header.dataset.scrolled = scrolled ? 'true' : 'false';
      }
      ticking = false;
    };
    const onScroll = () => {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    update();
  }

  // Lucide icons — modern, consistent stroke icons used across all buttons.
  // We load it once site-wide via common.js and expose a refresh helper so any
  // dynamic content (modals, etc.) can re-render its icons after injection.
  const lucideReady = new Promise((resolve) => {
    if (window.lucide) return resolve();
    const s = document.createElement('script');
    s.src = 'https://unpkg.com/lucide@latest/dist/umd/lucide.min.js';
    s.async = true;
    s.onload = resolve;
    s.onerror = () => resolve(); // never block on icon CDN failure
    document.head.appendChild(s);
  });

  // Motion module — scroll reveal + Chart.js theme.
  // Loaded eagerly because Chart.js may be already on the page when this runs.
  (function loadMotion() {
    if (document.querySelector('script[data-np-motion]')) return;
    const s = document.createElement('script');
    s.src = ROOT + 'assets/js/motion.js';
    s.async = false;
    s.dataset.npMotion = '1';
    document.head.appendChild(s);
  })();

  function refreshIcons(scope) {
    if (window.lucide && window.lucide.createIcons) {
      try { window.lucide.createIcons(scope ? { context: scope } : undefined); } catch {}
    }
  }

  // Inject on DOM ready
  document.addEventListener('DOMContentLoaded', async () => {
    const bannerSlot = document.getElementById('np-top-banner-slot');
    const headerSlot = document.getElementById('np-header');
    const footerSlot = document.getElementById('np-footer');
    const disclaimerSlot = document.getElementById('np-disclaimer');
    if (bannerSlot) bannerSlot.outerHTML = topBannerHTML();
    if (headerSlot) headerSlot.outerHTML = navHTML();
    if (footerSlot) footerSlot.outerHTML = footerHTML();
    if (disclaimerSlot) disclaimerSlot.outerHTML = injectDisclaimerBar();
    setupDarkMode();
    setupMobileMenu();
    setupTopBanner();
    setupHeaderScroll();
    await lucideReady;
    refreshIcons();
  });

  // expose helpers
  window.NP = window.NP || {};
  window.NP.ROOT = ROOT;
  window.NP.refreshIcons = refreshIcons;
})();
