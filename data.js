// data.js
// グローバル公開: window.FALLBACK_EFFECTS
(function () {
  window.FALLBACK_EFFECTS = [
    {
      id: "atk_phys_pct",
      name: "物理攻撃力上昇（%）",
      target: "atk",
      stackMode: "multiplicativePercent",
      valueUnit: "%",
      valuesByLevel: [0, 3, 4, 5, 8],
      maxLevel: 4,
      note: "フォールバック（実データは effects.json に記載）"
    },
    {
      id: "atk_magic_pct",
      name: "魔力攻撃力上昇（%）",
      target: "atk",
      stackMode: "multiplicativePercent",
      valueUnit: "%",
      valuesByLevel: [0, 4, 5, 6, 10],
      maxLevel: 4
    },
    {
      id: "max_hp_flat",
      name: "最大HP上昇（固定）",
      target: "hp",
      stackMode: "flat",
      valueUnit: "flat",
      default: 100,
      cap: 100,
      inputLocked: true
    },
    {
      id: "max_fp_flat",
      name: "最大FP上昇（固定）",
      target: "fp",
      stackMode: "flat",
      valueUnit: "flat",
      default: 25,
      cap: 25,
      inputLocked: true
    },
    {
      id: "vigor_plus_1_3",
      name: "生命力+1~3（最大HP固定加算）",
      target: "hp",
      stackMode: "flat",
      valueUnit: "flat",
      valuesByLevel: [0, 20, 40, 60, 60],
      maxLevel: 3
    },
    // ★ 追加：例の5段階（+0～+4）効果。+2 を選ぶと 6% 表示＆計算反映
    {
      id: "atk_example_pct",
      name: "攻撃力上昇（例）",
      target: "atk",
      stackMode: "multiplicativePercent", // 必要に応じて additivePercent に変更可
      valueUnit: "%",
      valuesByLevel: [4, 5, 6, 10, 12],   // +0,+1,+2,+3,+4
      maxLevel: 4,
      note: "UIは（無印）/+1/+2/+3/+4 の5段階で表示"
    }
  ];
})();
``
