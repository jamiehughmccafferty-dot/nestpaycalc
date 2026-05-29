/* ============================================================
 * NestPayCalc — Motion module
 *
 *   1. Scroll reveal     — IntersectionObserver fade-ups on .np-reveal
 *   2. Chart.js theme    — Inter font, refined tooltip, neutral gridlines
 *                          (token-neutral so it works in both light + dark)
 *   3. Stable focus mgmt — focus a calculator's main heading on view
 *                          transition into a calc page (a11y win)
 *
 * Honours prefers-reduced-motion: reduce — all reveals become instant.
 * ============================================================ */
(function () {

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 1. Scroll reveal ---------- */
  function setupReveal(scope) {
    const root = scope || document;
    const els  = root.querySelectorAll('.np-reveal:not(.np-revealed)');
    if (!els.length) return;

    if (prefersReduced || !('IntersectionObserver' in window)) {
      els.forEach(el => el.classList.add('np-revealed'));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('np-revealed');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.05, rootMargin: '0px 0px -8% 0px' });

    els.forEach(el => io.observe(el));
  }

  /* ---------- 2. Chart.js theme ----------
     Applied once Chart is detected (it loads via CDN on calc pages).
     Uses semi-transparent neutrals so the same theme reads well in
     both light and dark mode without needing to re-theme on toggle. */
  function applyChartTheme() {
    if (!window.Chart || window.Chart.__npThemed) return;
    const C = window.Chart;
    C.defaults.font.family = "'Inter', system-ui, -apple-system, sans-serif";
    C.defaults.font.size   = 12;
    C.defaults.font.weight = 500;
    C.defaults.color       = 'rgb(127 140 160 / 0.95)';
    C.defaults.borderColor = 'rgb(127 140 160 / 0.18)';

    // Tooltip — matches our modal style
    const t = C.defaults.plugins.tooltip;
    t.backgroundColor = 'rgb(15 23 42 / 0.95)';
    t.titleColor      = '#fff';
    t.bodyColor       = 'rgb(229 233 240)';
    t.borderColor     = 'rgb(255 255 255 / 0.08)';
    t.borderWidth     = 1;
    t.padding         = 12;
    t.cornerRadius    = 10;
    t.titleFont       = { size: 12, weight: '700', family: "'Inter', sans-serif" };
    t.bodyFont        = { size: 12, weight: '500', family: "'Inter', sans-serif" };
    t.titleMarginBottom = 6;
    t.boxPadding      = 6;
    t.usePointStyle   = true;
    t.displayColors   = true;

    // Legend
    if (C.defaults.plugins.legend) {
      C.defaults.plugins.legend.labels.font = { size: 12, weight: '500', family: "'Inter', sans-serif" };
      C.defaults.plugins.legend.labels.boxWidth = 10;
      C.defaults.plugins.legend.labels.boxHeight = 10;
      C.defaults.plugins.legend.labels.padding = 14;
      C.defaults.plugins.legend.labels.usePointStyle = true;
    }

    // Scales — neutral gridlines that work in both modes
    if (C.defaults.scale) {
      C.defaults.scale.grid.color     = 'rgb(127 140 160 / 0.12)';
      C.defaults.scale.grid.tickColor = 'transparent';
      C.defaults.scale.grid.drawTicks = false;
      C.defaults.scale.ticks.color    = 'rgb(127 140 160 / 0.85)';
      C.defaults.scale.ticks.font     = { size: 11, weight: '500', family: "'Inter', sans-serif" };
      C.defaults.scale.ticks.padding  = 8;
      C.defaults.scale.border.display = false;
    }

    // Defaults for individual chart types
    C.defaults.elements.line.tension     = 0.35;
    C.defaults.elements.line.borderWidth = 2.5;
    C.defaults.elements.point.radius     = 0;
    C.defaults.elements.point.hoverRadius = 5;
    C.defaults.elements.arc.borderWidth  = 0;
    C.defaults.elements.bar.borderRadius = 6;
    C.defaults.elements.bar.borderSkipped = false;

    // Animation — refined easing & duration
    C.defaults.animation.duration = prefersReduced ? 0 : 600;
    C.defaults.animation.easing   = 'easeOutQuart';

    window.Chart.__npThemed = true;
  }

  /* Watch for Chart.js arriving late (CDN deferred) */
  function watchForChart() {
    if (window.Chart) return applyChartTheme();
    let tries = 0;
    const t = setInterval(() => {
      if (window.Chart || tries++ > 60) {
        clearInterval(t);
        applyChartTheme();
      }
    }, 100);
  }

  /* ---------- 3. Lazy loaders ----------
     Calc pages don't load Chart.js up-front any more. The first draw() call
     awaits NPLoad.chart() which dynamically injects the script (once). */
  const NPLoad = (function () {
    let chartPromise = null;
    function chart() {
      if (window.Chart) return Promise.resolve();
      if (chartPromise) return chartPromise;
      chartPromise = new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js';
        s.async = true;
        s.onload  = () => { applyChartTheme(); resolve(); };
        s.onerror = reject;
        document.head.appendChild(s);
      });
      return chartPromise;
    }
    return { chart };
  })();
  window.NPLoad = NPLoad;

  /* ---------- 4. Prefetch-on-hover ----------
     Quietly prefetches any same-origin link the user hovers over, so the
     next navigation is already in cache. Tiny bandwidth hit, big perceived
     speed win — works perfectly with cross-document view transitions. */
  function setupPrefetch() {
    if (prefersReduced) return;
    const conn = navigator.connection;
    if (conn && (conn.saveData || /2g/.test(conn.effectiveType || ''))) return;

    const seen = new Set();
    const tryPrefetch = (href) => {
      if (seen.has(href)) return;
      seen.add(href);
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = href;
      link.as = 'document';
      document.head.appendChild(link);
    };
    document.addEventListener('mouseover', (e) => {
      const a = e.target.closest && e.target.closest('a[href]');
      if (!a) return;
      let url;
      try { url = new URL(a.href, location.href); } catch { return; }
      if (url.origin !== location.origin) return;
      if (url.pathname === location.pathname) return;
      tryPrefetch(url.href);
    }, { passive: true, capture: true });
  }

  /* ---------- 5. Boot ---------- */
  function init() {
    setupReveal();
    watchForChart();
    setupPrefetch();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  /* Re-run reveal after the user navigates via view transitions —
     pageshow fires on bfcache restore + cross-document VT navigation. */
  window.addEventListener('pageshow', () => {
    setupReveal();
    if (window.NP && window.NP.refreshIcons) window.NP.refreshIcons();
  });

  /* Public */
  window.NPMotion = { setupReveal, applyChartTheme };
})();
