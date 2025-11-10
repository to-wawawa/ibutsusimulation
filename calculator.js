// calculator.js
//
// スロット情報と効果データを用いて最終ステータスを算出する
// ui.js が呼び出すグローバル関数 window.calculate(base, slots, effectsDict) を提供する

(function () {
  // stackMode の表記ゆれを吸収
  function normalizeMode(mode) {
    switch ((mode || "").toLowerCase()) {
      case "flat":
      case "add":
      case "addflat":
      case "additiveflat":
        return "additiveFlat";
      case "addpercent":
      case "percentadd":
      case "additivepercent":
        return "additivePercent";
      case "mulpercent":
      case "percentmul":
      case "multiplicativepercent":
        return "multiplicativePercent";
      default:
        return mode || "additiveFlat";
    }
  }

  // 値の取得（レベル表 or スロット直入力 or デフォルト）
  function getEffectRawValue(effect, slot) {
    const arr = effect.valuesByLevel || effect.levels;
    if (Array.isArray(arr) && arr.length) {
      const idx = Math.max(0, Math.min((slot.level ?? 0), arr.length - 1));
      const v = Number(arr[idx]);
      return Number.isFinite(v) ? v : 0;
    }
    // レベル表がない場合は、スロット直入力 or effect.default を使う
    const v = Number(slot.value);
    if (Number.isFinite(v) && v !== 0) return v;
    const d = Number(effect.default);
    return Number.isFinite(d) ? d : 0;
  }

  // 単位（% or flat）に応じて正規化（% は 100 で割る）
  function toEngineValue(effect, rawVal) {
    const unit = (effect.valueUnit || "%").toLowerCase();
    if (unit === "%" || unit === "percent" || unit === "pct") {
      return rawVal / 100;
    }
    return rawVal; // "flat"
  }

  /**
   * メイン計算関数
   * @param {object} base - { atk, hp, stamina, fp } 基礎値
   * @param {Array} slots - [{ effectId, level, value }]
   * @param {object} effectsDict - idをキーとした効果辞書
   */
  function calculate(base, slots, effectsDict) {
    // 攻撃倍率
    let atkFlatAdd = 0;     // 乗算前に基礎倍率へフラット加算
    let atkPctAdd = 0;      // 乗算前の加算パーセント（足し合わせ）
    let atkMul = 1.0;       // 乗算系（乗算で重ねる）

    // HP/スタミナ/FP
    let hpFlatAdd = 0, hpPctAdd = 0, hpMul = 1.0;
    let staFlatAdd = 0, staPctAdd = 0, staMul = 1.0;
    let fpFlatAdd = 0, fpPctAdd = 0, fpMul = 1.0;

    for (const s of (slots || [])) {
      if (!s || !s.effectId) continue;
      const eff = effectsDict[s.effectId];
      if (!eff) continue;

      const mode = normalizeMode(eff.stackMode);
      const rawVal = getEffectRawValue(eff, s);
      const val = toEngineValue(eff, rawVal); // % は 100 で割る

      const target = (eff.target || "").toLowerCase();
      switch (target) {
        case "atk": {
          if (mode === "multiplicativePercent") {
            atkMul *= (1 + val);
          } else if (mode === "additivePercent") {
            atkPctAdd += val;
          } else {
            // additiveFlat
            atkFlatAdd += val;
          }
          break;
        }
        case "hp": {
          if (mode === "multiplicativePercent") {
            hpMul *= (1 + val);
          } else if (mode === "additivePercent") {
            hpPctAdd += val;
          } else {
            hpFlatAdd += val;
          }
          break;
        }
        case "stamina": {
          if (mode === "multiplicativePercent") {
            staMul *= (1 + val);
          } else if (mode === "additivePercent") {
            staPctAdd += val;
          } else {
            staFlatAdd += val;
          }
          break;
        }
        case "fp": {
          if (mode === "multiplicativePercent") {
            fpMul *= (1 + val);
          } else if (mode === "additivePercent") {
            fpPctAdd += val;
          } else {
            fpFlatAdd += val;
          }
          break;
        }
        default:
          // 将来拡張用: other 等は無視
          break;
      }
    }

    // 最終値
    const atkMultiplier = (base.atk + atkFlatAdd) * (1 + atkPctAdd) * atkMul;
    const hp = Math.round((base.hp + hpFlatAdd) * (1 + hpPctAdd) * hpMul);
    const stamina = Math.round((base.stamina + staFlatAdd) * (1 + staPctAdd) * staMul);
    const fp = Math.round((base.fp + fpFlatAdd) * (1 + fpPctAdd) * fpMul);

    return { atkMultiplier, hp, stamina, fp };
  }

  // グローバル公開（ui.js から呼び出される）
  window.calculate = calculate;
})();
