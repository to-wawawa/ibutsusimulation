// main.js
// file:// で開いた場合は effects.json を読まず data.js を使う
// http(s) で開いた場合は effects.json を優先
(function () {
  function isFileProtocol() {
    try { return location.protocol === "file:"; } catch { return true; }
  }

  function start(effects) {
    // ui.js はグローバルに読み込むのではなく、ここで動的 import を避けるために
    // window.initUI を使用（ui.js 末尾で window.initUI = initUI しています）
    if (typeof window.initUI === "function") {
      window.initUI(effects);
    } else {
      console.error("ui.js が読み込まれていません。");
    }
  }

  async function loadEffects() {
    if (isFileProtocol()) {
      // file 直開き → data.js のグローバル EFFECTS を使用
      if (Array.isArray(window.FALLBACK_EFFECTS)) {
        console.info("file:// 直開きのため data.js の EFFECTS を使用します");
        return window.FALLBACK_EFFECTS;
      }
      console.warn("data.js の EFFECTS が見つかりません。空データで起動します。");
      return [];
    }

    // http(s) → effects.json を優先
    try {
      const res = await fetch("./effects.json", { cache: "no-store" });
      if (!res.ok) throw new Error("effects.json not found");
      const json = await res.json();

      const ok = [];
      for (const e of json) {
        if (!e?.id || !e?.name || !e?.target || !e?.stackMode) {
          console.warn("effects.json: 欠落キーのためスキップ:", e);
          continue;
        }
        if (!e.valueUnit) e.valueUnit = e.stackMode === "flat" ? "flat" : "%";
        if (Array.isArray(e.valuesByLevel)) {
          e.valuesByLevel = e.valuesByLevel.map(n => Number(n) || 0);
          if (typeof e.maxLevel !== "number") {
            e.maxLevel = Math.max(0, e.valuesByLevel.length - 1);
          }
        }
        ok.push(e);
      }
      if (!ok.length) throw new Error("no valid entries");
      console.info(`effects.json 読み込み: ${ok.length} 件`);
      return ok;
    } catch (err) {
      console.warn("effects.json 取得に失敗。data.js を使用:", err.message);
      return Array.isArray(window.FALLBACK_EFFECTS) ? window.FALLBACK_EFFECTS : [];
    }
  }

  // スクリプトの読み込み順: index.html → main.js → ui.js, calculator.js, state.js, data.js
  // なので DOMContentLoaded 待ちで実行
  window.addEventListener("DOMContentLoaded", async () => {
    const effects = await loadEffects();
    start(effects);
  });
})();
