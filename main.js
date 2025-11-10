// main.js
// 効果データ（effects.json）をロードし、UIを初期化する
window.addEventListener("DOMContentLoaded", async () => {
  try {
    // effects.json を読み込む
    const res = await fetch("./effects.json");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    // UI初期化
    window.initUI(data);
    console.log(`✅ effects.json loaded (${data.length} entries)`);
  } catch (err) {
    console.error("❌ effects.json の読み込みに失敗:", err);

    // フォールバックで起動
    if (window.FALLBACK_EFFECTS) {
      console.warn("⚠ effects.json の代わりに FALLBACK_EFFECTS を使用します。");
      window.initUI(window.FALLBACK_EFFECTS);
    } else {
      alert("効果データの読み込みに失敗しました。");
    }
  }
});
