// state.js
(function () {
  const LS_KEY = "relic-sim-v2";

  const DEFAULT_BASE = {
    atk: 1.0, // 倍率。1.0=等倍
    hp: 1000,
    stamina: 100,
    fp: 100,
  };

  // 18スロット（value: 直入力用, level: レベル制用）
  const DEFAULT_SLOTS = Array.from({ length: 18 }).map(() => ({
    effectId: null,
    value: 0,
    level: 0,
  }));

  function loadState() {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (!raw) return { base: { ...DEFAULT_BASE }, slots: [...DEFAULT_SLOTS] };
      const parsed = JSON.parse(raw);
      return {
        base: { ...DEFAULT_BASE, ...parsed.base },
        slots: normalizeSlots(parsed.slots),
      };
    } catch {
      return { base: { ...DEFAULT_BASE }, slots: [...DEFAULT_SLOTS] };
    }
  }

  function normalizeSlots(slots) {
    if (!Array.isArray(slots) || slots.length !== 18) return [...DEFAULT_SLOTS];
    return slots.map(s => ({
      effectId: s?.effectId ?? null,
      value: Number(s?.value) || 0,
      level: (typeof s?.level === "number") ? s.level : 0,
    }));
  }

  function saveState(state) {
    try { localStorage.setItem(LS_KEY, JSON.stringify(state)); } catch {}
  }

  function resetState() {
    const s = { base: { ...DEFAULT_BASE }, slots: [...DEFAULT_SLOTS] };
    saveState(s);
    return s;
  }

  // グローバル公開
  window.loadState = loadState;
  window.saveState = saveState;
  window.resetState = resetState;
})();
``
