/* ============================================================
 * NestPayCalc - Save & Share modal (Alpine.store)
 *
 * Single global modal that any calculator can open via:
 *   window.NPSaveShare.openSave({ type, name, inputs, shareParams, summary })
 *   window.NPSaveShare.openShare({ type, shareParams, summary })
 *
 * snapshot = {
 *   type:        'salary' | 'mortgage' | 'savings' | 'pension' | 'debt' | 'budget'
 *   name:        suggested name (user can edit)
 *   inputs:      raw input object (currently unused but kept for future re-hydration)
 *   shareParams: { gs: 35000, ... }  // becomes URL ?gs=35000…
 *   summary:     {
 *     headline:        '£2,408',
 *     headlineLabel:   'Monthly take-home',
 *     secondary:       '£28,896',
 *     secondaryLabel:  'Yearly take-home',
 *     meta:            '2026/27 · England, Wales or NI',
 *     icon:            'wallet',  // lucide name for save-confirmation card
 *     calcLabel:       'Salary Calculator',
 *     rows: [
 *       { label: 'Income tax', value: '£4,990' },
 *       { label: 'NI',         value: '£1,989' }
 *     ]
 *   }
 * }
 * ============================================================ */
(function () {

  /* ----- Social platforms ----- */
  const SOCIAL = {
    whatsapp: { name: 'WhatsApp', icon: 'message-circle', color: '#25d366',
      build: (url, text) => `https://wa.me/?text=${encodeURIComponent(text + '\n\n' + url)}` },
    twitter:  { name: 'X', icon: 'twitter', color: '#000000',
      build: (url, text) => `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}` },
    linkedin: { name: 'LinkedIn', icon: 'linkedin', color: '#0a66c2',
      build: (url) => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}` },
    facebook: { name: 'Facebook', icon: 'facebook', color: '#1877f2',
      build: (url) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}` }
  };

  function buildShareUrl(type, params) {
    // Build absolute URL that re-hydrates the calculator with these params.
    const root = (window.NP && window.NP.ROOT) || '';
    let base;
    try {
      base = new URL(`${root}calculators/${type}.html`, window.location.href).href;
    } catch {
      base = `${window.location.origin}/calculators/${type}.html`;
    }
    const url = new URL(base);
    Object.entries(params || {}).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, v);
    });
    return url.toString();
  }

  /* ----- html2canvas lazy loader ----- */
  let html2canvasPromise = null;
  function ensureHtml2Canvas() {
    if (window.html2canvas) return Promise.resolve();
    if (html2canvasPromise) return html2canvasPromise;
    html2canvasPromise = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js';
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
    return html2canvasPromise;
  }

  /* ----- Branded share card builder ----- */
  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
  }

  function buildShareCardHTML(snap) {
    const s = snap.summary || {};
    const calcLabel = s.calcLabel || (snap.type ? snap.type.charAt(0).toUpperCase() + snap.type.slice(1) : 'Calculator');
    const meta = s.meta || '';
    const rows = (s.rows || []).slice(0, 3);

    /* All inline styles - html2canvas renders these reliably across browsers */
    const wrap   = `width:1200px;height:630px;background:linear-gradient(135deg,#003087 0%,#001f5e 100%);color:#fff;padding:56px 64px;box-sizing:border-box;font-family:'Inter',system-ui,-apple-system,sans-serif;position:relative;overflow:hidden;display:flex;flex-direction:column;justify-content:space-between;`;
    const blob1  = `position:absolute;top:-220px;right:-220px;width:560px;height:560px;border-radius:50%;background:radial-gradient(closest-side,rgba(0,135,90,.45),rgba(0,135,90,0));pointer-events:none;`;
    const blob2  = `position:absolute;bottom:-180px;left:-120px;width:420px;height:420px;border-radius:50%;background:radial-gradient(closest-side,rgba(255,255,255,.06),rgba(255,255,255,0));pointer-events:none;`;
    const top    = `display:flex;align-items:center;justify-content:space-between;position:relative;z-index:1;`;
    const brand  = `display:flex;align-items:center;gap:14px;font-weight:800;font-size:26px;letter-spacing:-.02em;`;
    const tag    = `font-size:13px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;padding:8px 14px;border-radius:999px;background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.22);`;
    const mid    = `position:relative;z-index:1;`;
    const eye    = `font-size:16px;font-weight:600;opacity:.7;letter-spacing:.08em;text-transform:uppercase;margin-bottom:14px;`;
    const head   = `font-size:84px;font-weight:800;letter-spacing:-.035em;line-height:1;font-variant-numeric:tabular-nums;`;
    const sub    = `font-size:22px;font-weight:500;opacity:.85;margin-top:18px;`;
    const stats  = `display:flex;gap:48px;margin-top:30px;padding-top:22px;border-top:1px solid rgba(255,255,255,.2);`;
    const stat   = `display:flex;flex-direction:column;gap:4px;`;
    const sLabel = `font-size:13px;opacity:.65;font-weight:500;letter-spacing:.04em;text-transform:uppercase;`;
    const sValue = `font-size:24px;font-weight:700;font-variant-numeric:tabular-nums;`;
    const foot   = `display:flex;align-items:center;justify-content:space-between;position:relative;z-index:1;padding-top:20px;border-top:1px solid rgba(255,255,255,.18);font-size:15px;`;
    const footL  = `opacity:.75;`;
    const footR  = `display:flex;align-items:center;gap:8px;font-weight:700;`;
    const footRDot = `width:6px;height:6px;border-radius:50%;background:#00875a;display:inline-block;`;

    const statsHtml = rows.map(r => `
      <div style="${stat}">
        <div style="${sLabel}">${escapeHtml(r.label)}</div>
        <div style="${sValue}">${escapeHtml(r.value)}</div>
      </div>`).join('');

    return `
      <div data-share-card style="${wrap}">
        <div style="${blob1}"></div>
        <div style="${blob2}"></div>

        <div style="${top}">
          <div style="${brand}">
            <svg width="44" height="44" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 22c0-6 5.5-10 12-10s12 4 12 10v2H4v-2z" fill="#fff"/>
              <text x="16" y="21.5" text-anchor="middle" font-family="Inter, system-ui, sans-serif" font-size="11" font-weight="800" fill="#003087">£</text>
            </svg>
            NestPayCalc
          </div>
          <div style="${tag}">${escapeHtml(calcLabel)}</div>
        </div>

        <div style="${mid}">
          <div style="${eye}">${escapeHtml(s.headlineLabel || 'Result')}</div>
          <div style="${head}">${escapeHtml(s.headline || '')}</div>
          <div style="${sub}">${escapeHtml(s.secondaryLabel ? s.secondaryLabel + ': ' + s.secondary : (s.secondary || ''))}</div>
          ${statsHtml ? `<div style="${stats}">${statsHtml}</div>` : ''}
        </div>

        <div style="${foot}">
          <span style="${footL}">${escapeHtml(meta)}</span>
          <span style="${footR}"><span style="${footRDot}"></span>nestpaycalc.com · Free UK calculators</span>
        </div>
      </div>`;
  }

  /* ----- Toast helper ----- */
  function ensureToastStack() {
    let s = document.getElementById('np-toast-stack');
    if (!s) {
      s = document.createElement('div');
      s.id = 'np-toast-stack';
      s.className = 'np-toast-stack';
      document.body.appendChild(s);
    }
    return s;
  }

  function toast(message, action) {
    const stack = ensureToastStack();
    const el = document.createElement('div');
    el.className = 'np-toast';
    const linkHTML = action ? `<a href="${escapeHtml(action.href)}">${escapeHtml(action.label)}</a>` : '';
    el.innerHTML = `<svg class="np-toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12l5 5L20 7"/></svg>
      <span>${escapeHtml(message)}${linkHTML ? ' · ' + linkHTML : ''}</span>`;
    stack.appendChild(el);
    setTimeout(() => {
      el.classList.add('np-toast-leaving');
      setTimeout(() => el.remove(), 220);
    }, 4200);
  }

  /* ----- Modal HTML (injected once, controlled by Alpine.store) ----- */
  const MODAL_HTML = `
<template id="np-modal-template">
<div id="np-save-share-modal" x-data x-show="$store.npss.open" x-cloak
     @keydown.escape.window="$store.npss.close()"
     class="np-modal-backdrop np-no-print"
     @click.self="$store.npss.close()"
     role="dialog" aria-modal="true" aria-labelledby="np-modal-title">
  <div class="np-modal">
    <div class="np-modal-header">
      <div>
        <div id="np-modal-title" class="np-modal-title" x-text="$store.npss.mode === 'save' ? 'Save this calculation' : 'Share your results'"></div>
        <div class="np-modal-sub" x-text="$store.npss.mode === 'save' ? 'Stored locally on this device - no account needed.' : 'Send a link or download a branded image.'"></div>
      </div>
      <button class="np-modal-close" @click="$store.npss.close()" aria-label="Close">
        <i data-lucide="x" class="w-5 h-5"></i>
      </button>
    </div>

    <!-- SAVE MODE -->
    <div class="np-modal-body" x-show="$store.npss.mode === 'save'">
      <div class="np-save-summary" x-show="$store.npss.payload">
        <div class="np-save-summary-icon">
          <i :data-lucide="$store.npss.payload?.summary?.icon || 'wallet'" class="w-5 h-5"></i>
        </div>
        <div class="flex-1 min-w-0">
          <div class="np-save-summary-headline" x-text="$store.npss.payload?.summary?.headline || ''"></div>
          <div class="np-save-summary-meta">
            <span x-text="$store.npss.payload?.summary?.headlineLabel || ''"></span>
            <template x-if="$store.npss.payload?.summary?.meta"><span> · <span x-text="$store.npss.payload.summary.meta"></span></span></template>
          </div>
        </div>
      </div>

      <form class="np-save-form mt-4" @submit.prevent="$store.npss.saveNow()">
        <label>
          <span class="np-label">Name</span>
          <input type="text" class="np-input" maxlength="80" required
                 x-model="$store.npss.saveName"
                 placeholder="e.g. My £48k salary 2026"
                 @keydown.enter.prevent="$store.npss.saveNow()">
        </label>
        <p class="text-xs text-rose-600" x-show="$store.npss.saveError" x-text="$store.npss.saveError"></p>
        <p class="text-xs text-slate-500 dark:text-slate-400">
          Saved on this device only - clearing your browser data will remove it.
        </p>
        <div class="flex gap-2 mt-2">
          <button type="button" class="np-btn np-btn-ghost flex-1" @click="$store.npss.close()">Cancel</button>
          <button type="submit" class="np-btn np-btn-primary flex-1">
            <i data-lucide="bookmark" class="w-4 h-4"></i> Save calculation
          </button>
        </div>
      </form>
    </div>

    <!-- SHARE MODE -->
    <div class="np-modal-body" x-show="$store.npss.mode === 'share'">
      <div class="np-save-summary" x-show="$store.npss.payload">
        <div class="np-save-summary-icon">
          <i :data-lucide="$store.npss.payload?.summary?.icon || 'wallet'" class="w-5 h-5"></i>
        </div>
        <div class="flex-1 min-w-0">
          <div class="np-save-summary-headline" x-text="$store.npss.payload?.summary?.headline || ''"></div>
          <div class="np-save-summary-meta" x-text="$store.npss.payload?.summary?.headlineLabel || ''"></div>
        </div>
      </div>

      <div class="np-share-grid">
        <button type="button" class="np-share-tile" @click="$store.npss.shareTo('whatsapp')">
          <div class="np-share-tile-icon" style="background:#25d366"><i data-lucide="message-circle" class="w-5 h-5"></i></div>
          WhatsApp
        </button>
        <button type="button" class="np-share-tile" @click="$store.npss.shareTo('twitter')">
          <div class="np-share-tile-icon" style="background:#000"><i data-lucide="twitter" class="w-5 h-5"></i></div>
          X (Twitter)
        </button>
        <button type="button" class="np-share-tile" @click="$store.npss.shareTo('linkedin')">
          <div class="np-share-tile-icon" style="background:#0a66c2"><i data-lucide="linkedin" class="w-5 h-5"></i></div>
          LinkedIn
        </button>
        <button type="button" class="np-share-tile" @click="$store.npss.shareTo('facebook')">
          <div class="np-share-tile-icon" style="background:#1877f2"><i data-lucide="facebook" class="w-5 h-5"></i></div>
          Facebook
        </button>
      </div>

      <div class="np-link-row">
        <span class="np-link-text" x-text="$store.npss.shareUrl"></span>
        <button type="button" class="np-link-copy" @click="$store.npss.copyLink()" :data-copied="$store.npss.copied">
          <i :data-lucide="$store.npss.copied ? 'check' : 'copy'" class="w-3.5 h-3.5"></i>
          <span x-text="$store.npss.copied ? 'Copied' : 'Copy'"></span>
        </button>
      </div>

      <button type="button" class="np-btn np-btn-ghost w-full mt-3" @click="$store.npss.downloadImage()" :disabled="$store.npss.imageBusy">
        <template x-if="!$store.npss.imageBusy"><i data-lucide="image" class="w-4 h-4"></i></template>
        <template x-if="$store.npss.imageBusy"><i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i></template>
        <span x-text="$store.npss.imageBusy ? 'Generating image…' : 'Download as branded image'"></span>
      </button>

      <p class="text-xs text-slate-500 dark:text-slate-400 mt-3">
        The link contains your input figures so the recipient sees the same calculation.
      </p>
    </div>
  </div>
</div>
</template>`;

  function injectModal() {
    if (document.getElementById('np-save-share-modal')) return;
    const tmp = document.createElement('div');
    tmp.innerHTML = MODAL_HTML;
    const tpl = tmp.querySelector('template');
    const node = tpl.content.firstElementChild.cloneNode(true);
    if (document.body) {
      document.body.appendChild(node);
    } else {
      document.addEventListener('DOMContentLoaded', () => document.body.appendChild(node));
    }
  }

  injectModal();

  /* ----- Focus trap helpers - keep keyboard focus inside the modal ----- */
  const FOCUSABLE = 'button:not([disabled]),[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
  let _lastOpener = null;
  let _trapHandler = null;

  function installTrap(modalEl) {
    removeTrap(); // safety
    _trapHandler = (e) => {
      if (e.key !== 'Tab') return;
      const focusables = Array.from(modalEl.querySelectorAll(FOCUSABLE))
        .filter(el => el.offsetParent !== null);
      if (!focusables.length) return;
      const first = focusables[0];
      const last  = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault(); last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault(); first.focus();
      }
    };
    modalEl.addEventListener('keydown', _trapHandler);
  }
  function removeTrap() {
    if (_trapHandler) {
      const modal = document.querySelector('#np-save-share-modal');
      modal?.removeEventListener('keydown', _trapHandler);
      _trapHandler = null;
    }
  }

  /* ----- Alpine.store registration ----- */
  document.addEventListener('alpine:init', () => {
    window.Alpine.store('npss', {
      open: false,
      mode: 'save',
      payload: null,
      saveName: '',
      saveError: '',
      shareUrl: '',
      copied: false,
      imageBusy: false,

      openSave(payload) {
        _lastOpener = document.activeElement;
        this.payload = payload;
        this.shareUrl = buildShareUrl(payload.type, payload.shareParams);
        this.saveName = payload.name || this._suggestName(payload);
        this.saveError = '';
        this.mode = 'save';
        this.open = true;
        this._afterOpen();
      },

      openShare(payload) {
        _lastOpener = document.activeElement;
        this.payload = payload;
        this.shareUrl = buildShareUrl(payload.type, payload.shareParams);
        this.copied = false;
        this.mode = 'share';
        this.open = true;
        this._afterOpen();
      },

      close() {
        this.open = false;
        this.payload = null;
        removeTrap();
        // Restore focus to whatever opened us - important for keyboard users.
        if (_lastOpener && typeof _lastOpener.focus === 'function') {
          _lastOpener.focus();
        }
        _lastOpener = null;
      },

      _afterOpen() {
        // Re-render Lucide icons inside the modal, focus the right field,
        // and install the focus trap.
        setTimeout(() => {
          if (window.NP && window.NP.refreshIcons) window.NP.refreshIcons();
          const modal = document.querySelector('#np-save-share-modal .np-modal');
          if (!modal) return;
          installTrap(modal);
          if (this.mode === 'save') {
            const input = modal.querySelector('input[type="text"]');
            input?.focus();
            input?.select();
          } else {
            // Share mode: focus the copy-link button as a sensible primary action
            modal.querySelector('.np-link-copy')?.focus();
          }
        }, 30);
      },

      _suggestName(payload) {
        const yr = new Date().getFullYear();
        const head = (payload.summary && payload.summary.headline) || '';
        const labels = {
          salary: 'My salary', mortgage: 'My mortgage', savings: 'My savings',
          pension: 'My pension', debt: 'My debts', budget: 'My budget'
        };
        const label = labels[payload.type] || 'My calculation';
        return head ? `${label} ${head} (${yr})` : `${label} (${yr})`;
      },

      saveNow() {
        const name = (this.saveName || '').trim();
        if (!name) { this.saveError = 'Give your calculation a name'; return; }
        const entry = window.NPStorage.save({
          type: this.payload.type,
          name,
          inputs: this.payload.inputs,
          shareParams: this.payload.shareParams,
          summary: this.payload.summary
        });
        if (!entry) { this.saveError = 'Could not save - your browser storage may be full'; return; }
        const root = (window.NP && window.NP.ROOT) || '';
        this.close();
        toast(`Saved as "${entry.name}"`, { label: 'View saved', href: root + 'saved.html' });
      },

      async copyLink() {
        try {
          await navigator.clipboard.writeText(this.shareUrl);
          this.copied = true;
          setTimeout(() => { this.copied = false; }, 1800);
        } catch {
          this.copied = false;
        }
      },

      shareTo(platform) {
        const def = SOCIAL[platform];
        if (!def) return;
        const text = (this.payload && this.payload.summary)
          ? `My UK ${this.payload.summary.calcLabel || 'calculation'}: ${this.payload.summary.headline} ${this.payload.summary.headlineLabel || ''}`.trim()
          : 'Check out my UK calculation';
        const url = def.build(this.shareUrl, text);
        window.open(url, '_blank', 'noopener,noreferrer,width=620,height=640');
      },

      async downloadImage() {
        if (this.imageBusy || !this.payload) return;
        this.imageBusy = true;
        // Render the card in an off-screen container with explicit dimensions
        // so html2canvas always captures the full 1200×630 frame.
        const wrap = document.createElement('div');
        wrap.style.cssText = 'position:fixed;top:0;left:-2000px;width:1200px;height:630px;pointer-events:none;z-index:-1;overflow:hidden;';
        wrap.innerHTML = buildShareCardHTML(this.payload);
        document.body.appendChild(wrap);
        try {
          await ensureHtml2Canvas();
          const card = wrap.querySelector('[data-share-card]');
          // Force-load Inter so html2canvas uses the right font weights
          await (document.fonts && document.fonts.ready);
          const canvas = await window.html2canvas(card, {
            backgroundColor: null, scale: 2, logging: false, useCORS: true,
            width: 1200, height: 630, windowWidth: 1200, windowHeight: 630
          });
          await new Promise(res => {
            canvas.toBlob(blob => {
              if (!blob) return res();
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `nestpaycalc-${this.payload.type}.png`;
              document.body.appendChild(a); a.click(); a.remove();
              setTimeout(() => URL.revokeObjectURL(url), 1000);
              res();
            }, 'image/png');
          });
          toast('Image downloaded');
        } catch (err) {
          console.error('[NPSaveShare] image gen failed:', err);
          toast('Could not generate image - try again');
        } finally {
          wrap.remove();
          this.imageBusy = false;
        }
      }
    });
  });

  /* ----- Public API ----- */
  window.NPSaveShare = {
    openSave(payload) {
      const fire = () => window.Alpine?.store('npss')?.openSave(payload);
      window.Alpine ? fire() : document.addEventListener('alpine:initialized', fire, { once: true });
    },
    openShare(payload) {
      const fire = () => window.Alpine?.store('npss')?.openShare(payload);
      window.Alpine ? fire() : document.addEventListener('alpine:initialized', fire, { once: true });
    },
    toast,
    buildShareUrl
  };

})();
