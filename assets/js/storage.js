/* ============================================================
 * NestPayCalc - Local storage for saved calculations
 *
 * Single localStorage key, single schema-version, defensive reads.
 * If the schema ever changes, bump VERSION and add a migration path.
 * ============================================================ */
window.NPStorage = (function () {
  const KEY = 'np-saved-v1';
  const VERSION = 1;
  // Approximate localStorage quota — typical browsers give ~5MB per origin.
  // We warn at 80% to give the user time to clean up before hitting a write fail.
  const QUOTA_BYTES = 5 * 1024 * 1024;
  const WARN_BYTES  = 4 * 1024 * 1024;

  function read() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return { v: VERSION, saved: [] };
      const data = JSON.parse(raw);
      if (!data || data.v !== VERSION || !Array.isArray(data.saved)) {
        return { v: VERSION, saved: [] };
      }
      return data;
    } catch {
      return { v: VERSION, saved: [] };
    }
  }

  function write(data) {
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
      return true;
    } catch (err) {
      // QuotaExceededError or storage disabled (private mode in some browsers)
      console.warn('[NPStorage] write failed:', err.name);
      return false;
    }
  }

  function makeId(type) {
    const ts = Date.now().toString(36);
    const r = Math.random().toString(36).slice(2, 6);
    return `${type}-${ts}-${r}`;
  }

  /**
   * Save a new calculation snapshot.
   * snapshot = { type, name, inputs, shareParams, summary }
   *   - type:        'salary' | 'mortgage' | ...
   *   - name:        user-given label
   *   - inputs:      raw input object (for re-hydration)
   *   - shareParams: URL query params for the share link
   *   - summary:     { headlineLabel, headline, secondaryLabel, secondary, meta, breakdown[] }
   */
  function save(snapshot) {
    const data = read();
    const entry = {
      id: makeId(snapshot.type),
      type: snapshot.type,
      name: (snapshot.name || `${snapshot.type} calculation`).trim().slice(0, 80),
      inputs: snapshot.inputs || null,
      shareParams: snapshot.shareParams || {},
      summary: snapshot.summary || null,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    data.saved.unshift(entry); // newest first
    return write(data) ? entry : null;
  }

  function update(id, patch) {
    const data = read();
    const idx = data.saved.findIndex(s => s.id === id);
    if (idx < 0) return null;
    data.saved[idx] = {
      ...data.saved[idx],
      ...patch,
      // never let caller overwrite identifiers / timestamps via patch
      id: data.saved[idx].id,
      createdAt: data.saved[idx].createdAt,
      updatedAt: Date.now()
    };
    return write(data) ? data.saved[idx] : null;
  }

  function rename(id, name) {
    return update(id, { name: (name || '').trim().slice(0, 80) });
  }

  function remove(id) {
    const data = read();
    const before = data.saved.length;
    data.saved = data.saved.filter(s => s.id !== id);
    if (data.saved.length === before) return false;
    return write(data);
  }

  function get(id) {
    return read().saved.find(s => s.id === id) || null;
  }

  function getAll() {
    return read().saved;
  }

  function count() {
    return read().saved.length;
  }

  function clear() {
    return write({ v: VERSION, saved: [] });
  }

  function getStorageInfo() {
    let bytes = 0;
    try {
      const raw = localStorage.getItem(KEY) || '';
      bytes = new Blob([raw]).size;
    } catch {}
    return {
      bytes,
      quotaBytes: QUOTA_BYTES,
      percent: Math.min(100, (bytes / QUOTA_BYTES) * 100),
      warn: bytes > WARN_BYTES,
      full: bytes >= QUOTA_BYTES
    };
  }

  return { save, update, rename, remove, get, getAll, count, clear, getStorageInfo, makeId };
})();
