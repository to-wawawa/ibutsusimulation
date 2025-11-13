// main.js
// 分割された効果データを全カテゴリから読み込み、UIに統合反映する

window.addEventListener("DOMContentLoaded", async () => {
  try {
    // 各カテゴリごとのJSONファイル（miscも含む）
    const categories = [
      "stats",
      "attack",
      "arts",
      "magic",
      "cut",
      "resist",
      "heal",
      "action",
      "weapon_skill",
      "weapon_infusion",
      "item",
      "map",
      "team",
      "exclusive",
      "misc"
    ];

    // 各カテゴリファイルの読み込み関数
    const loadCategory = async (cat) => {
      const path = `./effectsまとめ/${cat}.json`;
      const res = await fetch(path);
      if (!res.ok) throw new Error(`${cat}.json 読み込み失敗`);
      const json = await res.json();
      console.log(`📦 Loaded ${cat}.json (${json.length} entries)`);
      return json;
    };

    // すべてのカテゴリを並行で読み込み
    const results = await Promise.all(
      categories.map(cat =>
        loadCategory(cat).catch(err => {
          console.warn(`⚠ ${cat}.json 読み込みスキップ:`, err.message);
          return [];
        })
      )
    );

    // 全カテゴリのデータをまとめる
    const allEffects = results.flat();

    console.log(`✅ 効果データ読み込み完了: ${allEffects.length} 件 (${categories.length}カテゴリ)`);

    // UI初期化処理へ渡す
    if (window.initUI) {
      window.initUI(allEffects);
    } else {
      console.error("❌ initUI 関数が見つかりません。ui.js の読み込みを確認してください。");
    }

  } catch (err) {
    console.error("❌ 効果データ読み込みエラー:", err);

    // フォールバック対応
    if (window.FALLBACK_EFFECTS) {
      console.warn("⚠ FALLBACK_EFFECTS を使用します。");
      window.initUI(window.FALLBACK_EFFECTS);
    } else {
      alert("効果データの読み込みに失敗しました。");
    }
  }
});
