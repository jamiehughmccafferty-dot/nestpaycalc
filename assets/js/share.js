/* NestPayCalc - share / save / print helpers */
window.NPShare = {
  buildShareUrl(state) {
    const url = new URL(window.location.href);
    url.search = '';
    Object.entries(state).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, v);
    });
    return url.toString();
  },
  readState(keys) {
    const params = new URLSearchParams(window.location.search);
    const out = {};
    keys.forEach(k => { if (params.has(k)) out[k] = params.get(k); });
    return out;
  },
  async copy(url) {
    try {
      await navigator.clipboard.writeText(url);
      return true;
    } catch { return false; }
  },
  async share(state, title) {
    const url = this.buildShareUrl(state);
    if (navigator.share) {
      try { await navigator.share({ title, url }); return 'shared'; } catch { return 'cancelled'; }
    }
    const ok = await this.copy(url);
    return ok ? 'copied' : 'failed';
  },
  print() { window.print(); }
};
