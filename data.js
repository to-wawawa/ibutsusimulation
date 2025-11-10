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
      stackMode: "additiveFlat",
      valueUnit: "flat",
      valuesByLevel: [100],
      maxLevel: 0,
      inputLocked: true
    },
    {
      id: "max_fp_flat",
      name: "最大FP上昇（固定）",
      target: "fp",
      stackMode: "additiveFlat",
      valueUnit: "flat",
      valuesByLevel: [25],
      maxLevel: 0,
      inputLocked: true
    },
    {
      id: "vigor_plus_1_3",
      name: "生命力+1~3（最大HP固定加算）",
      target: "hp",
      stackMode: "additiveFlat",
      valueUnit: "flat",
      valuesByLevel: [0, 20, 40, 60],
      maxLevel: 3
    }
  ];
})();
