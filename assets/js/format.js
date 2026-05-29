/* NestPayCalc - formatters */
window.NPF = {
  gbp(v, opts = {}) {
    const n = Number.isFinite(v) ? v : 0;
    return new Intl.NumberFormat('en-GB', {
      style: 'currency', currency: 'GBP',
      minimumFractionDigits: opts.dp ?? 0,
      maximumFractionDigits: opts.dp ?? 0
    }).format(n);
  },
  gbp2(v) { return this.gbp(v, { dp: 2 }); },
  pct(v, dp = 2) {
    const n = Number.isFinite(v) ? v : 0;
    return n.toFixed(dp) + '%';
  },
  num(v, dp = 0) {
    const n = Number.isFinite(v) ? v : 0;
    return new Intl.NumberFormat('en-GB', {
      minimumFractionDigits: dp, maximumFractionDigits: dp
    }).format(n);
  },
  parseNum(v) {
    if (v === null || v === undefined) return 0;
    if (typeof v === 'number') return v;
    const s = String(v).replace(/[£,\s]/g, '');
    const n = parseFloat(s);
    return Number.isFinite(n) ? n : 0;
  }
};
