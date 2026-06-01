/* ============================================================
 * NestPayCalc - Motion module
 *
 *   1. Scroll reveal     - IntersectionObserver fade-ups on .np-reveal
 *   2. Chart.js theme    - Inter font, refined tooltip, neutral gridlines
 *                          (token-neutral so it works in both light + dark)
 *   3. Stable focus mgmt - focus a calculator's main heading on view
 *                          transition into a calc page (a11y win)
 *
 * Honours prefers-reduced-motion: reduce - all reveals become instant.
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

    // Tooltip - matches our modal style
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

    // Scales - neutral gridlines that work in both modes
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

    // Animation - refined easing & duration
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
     speed win - works perfectly with cross-document view transitions. */
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

  /* ---------- 5. Tween-on-change number directive ----------
     `x-num.gbp="result.takeHome"`  → animates between values with NPF.gbp().
     Modifiers: .gbp .gbp2 .pct .num   (fallback: rounded integer) */
  function registerNumDirective() {
    if (!window.Alpine) return;
    if (window.Alpine.__numRegistered) return;
    window.Alpine.__numRegistered = true;
    window.Alpine.directive('num', (el, { expression, modifiers }, { evaluateLater, effect }) => {
      const NPF = window.NPF || {};
      let fmt = (n) => String(Math.round(n));
      if (modifiers.includes('gbp'))  fmt = (n) => NPF.gbp(n);
      if (modifiers.includes('gbp2')) fmt = (n) => NPF.gbp2(n);
      if (modifiers.includes('pct'))  fmt = (n) => NPF.pct(n, 1);
      if (modifiers.includes('num'))  fmt = (n) => NPF.num(n, 0);

      const duration = prefersReduced ? 0 : 360;
      const ease = (t) => 1 - Math.pow(1 - t, 3);
      let raf = null;
      let currentVal = 0;
      let firstRun = true;

      const getValue = evaluateLater(expression);

      effect(() => {
        getValue(target => {
          target = +target;
          if (!Number.isFinite(target)) return;
          if (firstRun || duration === 0) {
            currentVal = target;
            el.textContent = fmt(target);
            firstRun = false;
            return;
          }
          if (raf) cancelAnimationFrame(raf);
          const startTime = performance.now();
          const startVal = currentVal;
          const tick = (now) => {
            const t = Math.min(1, (now - startTime) / duration);
            currentVal = startVal + (target - startVal) * ease(t);
            el.textContent = fmt(currentVal);
            if (t < 1) raf = requestAnimationFrame(tick);
            else { currentVal = target; el.textContent = fmt(target); raf = null; }
          };
          raf = requestAnimationFrame(tick);
        });
      });
    });
  }

  /* ---------- 6. Range slider live brand-fill ----------
     Sets --fill: NN% on every range input on change/load. CSS does the rest. */
  function updateSliderFill(slider) {
    const min = +slider.min || 0;
    const max = +slider.max || 100;
    const val = +slider.value;
    const pct = Math.max(0, Math.min(100, ((val - min) / (max - min)) * 100));
    slider.style.setProperty('--fill', pct + '%');
  }
  function setupSliderFill() {
    document.querySelectorAll('input[type="range"]').forEach(updateSliderFill);
    document.addEventListener('input', (e) => {
      if (e.target && e.target.tagName === 'INPUT' && e.target.type === 'range') {
        updateSliderFill(e.target);
      }
    }, { passive: true });
    // After Alpine renders, sliders bound via x-model may need a re-scan
    document.addEventListener('alpine:initialized', () => {
      requestAnimationFrame(() => document.querySelectorAll('input[type="range"]').forEach(updateSliderFill));
    });
  }

  /* ---------- 7. Theme-aware chart colours ----------
     getChartColors() returns a palette that adapts to dark / light mode.
     Calc pages call this when creating their chart's dataset colors,
     and listen for `np:themechange` to redraw with fresh colours. */
  function getChartColors() {
    const isDark = document.documentElement.classList.contains('dark');
    return {
      isDark,
      brand:    isDark ? '#60a5fa' : '#003087',
      brandFill:isDark ? 'rgba(96,165,250,0.18)' : 'rgba(0,48,135,0.08)',
      accent:   isDark ? '#34d399' : '#00875a',
      accentFill: isDark ? 'rgba(52,211,153,0.18)' : 'rgba(0,135,90,0.10)',
      rose:     isDark ? '#fb7185' : '#dc2626',
      amber:    isDark ? '#fbbf24' : '#f59e0b',
      violet:   isDark ? '#c4b5fd' : '#7c3aed',
      sky:      isDark ? '#7dd3fc' : '#0ea5e9',
      ink:      isDark ? 'rgba(232,236,245,0.85)' : 'rgba(11,18,38,0.85)',
      grid:     isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.06)'
    };
  }

  /* ---------- 8. Reading progress bar + Table of Contents ---------- */
  function setupReadingProgress() {
    const article = document.querySelector('article');
    if (!article) return;
    if (document.getElementById('np-reading-progress')) return;

    const bar = document.createElement('div');
    bar.id = 'np-reading-progress';
    bar.className = 'np-reading-progress np-no-print';
    bar.setAttribute('aria-hidden', 'true');
    document.body.appendChild(bar);

    let raf = null;
    const update = () => {
      const rect = article.getBoundingClientRect();
      const top = rect.top + window.scrollY;
      const total = article.offsetHeight - window.innerHeight;
      const scrolled = Math.max(0, window.scrollY - top);
      const pct = total > 0 ? Math.min(100, (scrolled / total) * 100) : 0;
      bar.style.setProperty('--progress', pct + '%');
      raf = null;
    };
    window.addEventListener('scroll', () => {
      if (!raf) raf = requestAnimationFrame(update);
    }, { passive: true });
    update();
  }

  function setupTOC() {
    const slot = document.getElementById('np-toc');
    const article = document.querySelector('article');
    if (!slot || !article) return;

    const h2s = Array.from(article.querySelectorAll('h2'));
    if (h2s.length < 3) { slot.remove(); return; }   // not worth a ToC

    const slug = (s) => s.toLowerCase().replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-').slice(0, 60);

    const links = h2s.map(h2 => {
      if (!h2.id) h2.id = slug(h2.textContent);
      const a = document.createElement('a');
      a.href = '#' + h2.id;
      a.className = 'np-toc-link';
      a.textContent = h2.textContent;
      return { h2, a };
    });

    slot.innerHTML = '<div class="np-toc-title">On this page</div>';
    const list = document.createElement('nav');
    list.className = 'np-toc-list';
    list.setAttribute('aria-label', 'Table of contents');
    links.forEach(({ a }) => list.appendChild(a));
    slot.appendChild(list);

    // Active section highlight via IntersectionObserver
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          links.forEach(({ a }) => a.removeAttribute('data-active'));
          const match = links.find(l => l.h2 === e.target);
          if (match) match.a.setAttribute('data-active', 'true');
        }
      });
    }, { rootMargin: '-30% 0px -60% 0px' });
    links.forEach(({ h2 }) => io.observe(h2));
  }

  /* ---------- 9. Boot ---------- */
  function init() {
    setupReveal();
    watchForChart();
    setupPrefetch();
    setupSliderFill();
    setupReadingProgress();
    setupTOC();
  }
  document.addEventListener('alpine:init', registerNumDirective);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  /* Re-run reveal after the user navigates via view transitions -
     pageshow fires on bfcache restore + cross-document VT navigation. */
  window.addEventListener('pageshow', () => {
    setupReveal();
    if (window.NP && window.NP.refreshIcons) window.NP.refreshIcons();
  });

  /* Public */
  window.NPMotion = { setupReveal, applyChartTheme, getChartColors, updateSliderFill };
})();
