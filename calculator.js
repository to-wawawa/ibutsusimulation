// calculator.js
//
// スロット情報とeffects.jsonを用いて最終ステータスを算出する
// ui.js が呼び出すグローバル関数 window.calculate(base, slots, effectsDict) を提供する

(function () {
  /**
   * 効果データからレベルに応じた値を取得
   * - effects.json 側で valuesByLevel または levels のいずれかを使用可
   */
  function calcEffectValue(effect, level) {
    if (!effect) return 0;
    const arr = effect.valuesByLevel || effect.levels || [];
    if (!Array.isArray(arr) || !arr.length) return 0;

    const idx = Math.max(0, Math.min(level || 0, arr.length - 1));
    const val = Number(arr[idx]);
    return Number.isFinite(val) ? val : 0;
  }

  /**
   * メイン計算関数
   * @param {object} base - { atk, hp, stamina, fp } 基礎値
   * @param {Array} slots - [{ effectId, level, value }]
   * @param {object} effectsDict - idをキーとした効果辞書
   */
  function calculate(base, slots, effectsDict) {
    let atkMul = 1.0;
    let atkAdd = 0;
    let hpAdd = 0;
    let staAdd = 0;
    let fpAdd = 0;

    for (const s of slots) {
      if (!s || !s.effectId) continue;
      const eff = effectsDict[s.effectId];
      if (!eff) continue;

      const val = calcEffectValue(eff, s.level ?? 0);
      const target = (eff.target || "").toLowerCase();
      const mode = eff.stackMode || "additiveFlat";

      switch (target) {
        case "atk":
          if (mode === "multiplicativePercent") {
            atkMul *= 1 + val;
          } else if (mode === "additivePercent") {
            atkAdd += val;
          } else if (mode === "additiveFlat") {
            atkAdd += val;
          }
          break;

        case "hp":
          if (mode === "additiveFlat") hpAdd += val;
          else if (mode === "additivePercent") hpAdd += base.hp * val;
          break;

        case "stamina":
          if (mode === "additiveFlat") staAdd += val;
          else if (mode === "additivePercent") staAdd += base.stamina * val;
          break;

        case "fp":
          if (mode === "additiveFlat") fpAdd += val;
          else if (mode === "additivePercent") fpAdd += base.fp * val;
          break;

        default:
          // "other"や不明targetは無視（将来拡張用）
          break;
      }
    }

    // 計算結果を返す
    return {
      atkMultiplier: atkMul + atkAdd, // 加算と乗算を合わせて扱う
      hp: Math.round(base.hp + hpAdd),
      stamina: Math.round(base.stamina + staAdd),
      fp: Math.round(base.fp + fpAdd),
    };
  }

  // グローバル公開（ui.js から呼び出される）
  window.calculate = calculate;
})();
