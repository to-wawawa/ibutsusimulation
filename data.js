// data.js
// effects.json が読み込めなかった時に使う最低限のダミーデータ（レベルありの例）
export const EFFECTS = [
  {
    id: "atk_phys_pct",
    name: "物理攻撃力上昇（%）",
    target: "atk",
    stackMode: "multiplicativePercent",
    valueUnit: "%",
    // +0~+4 の効果量（例）
    tierStart: 0,
    levels: [3, 4, 5, 8, 10], // +0..+4
    defaultLevel: 0,
    cap: 12,
    note: "フォールバック: +0~4 = 3/4/5/8/10%"
  },
  {
    id: "vigor_plus_1_3",
    name: "生命力+1~3（最大HP固定加算）",
    target: "hp",
    stackMode: "flat",
    valueUnit: "flat",
    tierStart: 1,
    levels: [20, 40, 60], // +1..+3
    defaultLevel: 1,
    cap: 60,
    note: "フォールバック: +1=20, +2=40, +3=60"
  },
  {
    id: "atk_first_normal_hit",
    name: "通常攻撃の1段目強化",
    target: "atk",
    stackMode: "multiplicativePercent",
    valueUnit: "%",
    tierStart: 0,
    levels: [13], // 約1.13倍のみ
    defaultLevel: 0,
    cap: 13,
    note: "フォールバック: 1段目のみ"
  }
];