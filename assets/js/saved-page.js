/* ============================================================
 * NestPayCalc - Saved Calculations page
 * Reads from NPStorage and renders a card grid with rename / delete /
 * re-open / share controls. Empty-state when nothing's saved.
 * ============================================================ */
function savedApp() {
  const TYPE_LABELS = {
    salary:   { label: 'Salary',   icon: 'wallet',         color: '#003087' },
    mortgage: { label: 'Mortgage', icon: 'home',           color: '#0d4d8c' },
    savings:  { label: 'Savings',  icon: 'piggy-bank',     color: '#00875a' },
    pension:  { label: 'Pension',  icon: 'circle-dollar-sign', color: '#7c3aed' },
    debt:     { label: 'Debt',     icon: 'credit-card',    color: '#dc2626' },
    budget:   { label: 'Budget',   icon: 'pie-chart',      color: '#f59e0b' }
  };

  return {
    items: [],
    storageInfo: { bytes: 0, percent: 0, warn: false, full: false },
    editingId: null,
    editingName: '',
    confirmDeleteAll: false,
    TYPE_LABELS,

    init() {
      this.refresh();
    },

    refresh() {
      this.items = window.NPStorage.getAll();
      this.storageInfo = window.NPStorage.getStorageInfo();
      this.$nextTick(() => window.NP?.refreshIcons?.());
    },

    typeMeta(t) {
      return this.TYPE_LABELS[t] || { label: t, icon: 'file-text', color: '#64748b' };
    },

    formatDate(ts) {
      try {
        const d = new Date(ts);
        return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
      } catch { return ''; }
    },

    formatBytes(b) {
      if (b < 1024) return b + ' B';
      if (b < 1024 * 1024) return (b / 1024).toFixed(1) + ' KB';
      return (b / (1024 * 1024)).toFixed(2) + ' MB';
    },

    /** Open the original calculator with this entry's params. */
    openItem(item) {
      const root = (window.NP && window.NP.ROOT) || '';
      const url = window.NPSaveShare.buildShareUrl(item.type, item.shareParams);
      window.location.href = url;
    },

    /** Open the share modal pre-loaded with this entry. */
    shareItem(item) {
      window.NPSaveShare.openShare({
        type: item.type,
        shareParams: item.shareParams,
        summary: item.summary
      });
    },

    /** Inline rename. */
    startRename(item) {
      this.editingId = item.id;
      this.editingName = item.name;
      this.$nextTick(() => {
        const input = document.querySelector(`[data-rename-id="${item.id}"]`);
        input?.focus();
        input?.select();
      });
    },

    cancelRename() {
      this.editingId = null;
      this.editingName = '';
    },

    saveRename() {
      const name = (this.editingName || '').trim();
      if (!name || !this.editingId) { this.cancelRename(); return; }
      window.NPStorage.rename(this.editingId, name);
      this.cancelRename();
      this.refresh();
      window.NPSaveShare.toast('Renamed');
    },

    deleteItem(item) {
      if (!confirm(`Delete "${item.name}"? This can't be undone.`)) return;
      window.NPStorage.remove(item.id);
      this.refresh();
      window.NPSaveShare.toast('Deleted');
    },

    deleteAll() {
      window.NPStorage.clear();
      this.confirmDeleteAll = false;
      this.refresh();
      window.NPSaveShare.toast('All saved calculations deleted');
    }
  };
}
