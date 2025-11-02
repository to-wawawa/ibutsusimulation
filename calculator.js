// calculator.js
//
// 各スロットに選択された効果(effectId)とレベル(level=0~4)を基に
// 最終的な atk / hp / sta / fp などの値を算出する。

import { getState } from "./state.js";

/**
 * 効果IDから該当の効果データを取得
 */
export function getEffectById(effects, id) {
  return effects.find(e => e.id === id) || null;
}

/**
 * 指定された効果とレベルから、実際の値を算出
 * - effect.levels に 0~4 の値が格納されている
 */
export function calcEffectValue(effect, level) {
  if (!effect || !Array.isArray(effect.levels)) return 0;
  const idx = Math.max(0, Math.min(level, effect.levels.length - 1));
  return effect.levels[idx] || 0;
}

/**
 * メイン計算関数
 * - state.slots には [{ effectId: "atk_magic_pct", level: 4 }, ...] が入っている想定
 * - effects.json を参照して各効果値を加算・乗算
 */
export function calculateAll(effects) {
  const state = getState();

  // 基礎値
  const baseAtk = Number(state.base.atk) || 1.0;
  const baseHp = Number(state.base.hp) || 1000;
  const baseSta = Number(state.base.sta) || 100;
  const baseFp = Number(state.base.fp) || 100;

  // 結果を初期化
  let atkMul = 1.0;   // 乗算系
  let atkAdd = 0.0;   // 加算系(%)
  let hpAdd = 0.0;    // 固定加算
  let staAdd = 0.0;
  let fpAdd = 0.0;

  // 各スロットを処理
  for (const slot of state.slots) {
    if (!slot || !slot.effectId) continue;
    const effect = getEffectById(effects, slot.effectId);
    if (!effect) continue;

    const val = calcEffectValue(effect, slot.level ?? 0);
    const mode = effect.stackMode;
    const target = effect.target;

    // ------------------------------
    // 効果タイプ別の処理
    // ------------------------------
    if (target === "atk") {
      if (mode === "multiplicativePercent") {
        atkMul *= 1 + val; // 例：+0.12 → 1.12倍
      } else if (mode === "additivePercent") {
        atkAdd += val;     // 例：+0.12 → 加算
      }
    }
    else if (target === "hp") {
      if (mode === "additiveFlat") {
        hpAdd += val;      // 固定値加算
      } else if (mode === "additivePercent") {
        hpAdd += baseHp * val;
      }
    }
    else if (target === "sta") {
      if (mode === "additiveFlat") staAdd += val;
    }
    else if (target === "fp") {
      if (mode === "additiveFlat") fpAdd += val;
      else if (mode === "multiplicativePercent") fpAdd += baseFp * val;
    }
  }

  // ------------------------------
  // 最終値算出
  // ------------------------------
  const finalAtk = baseAtk * atkMul + atkAdd;
  const finalHp = baseHp + hpAdd;
  const finalSta = baseSta + staAdd;
  const finalFp = baseFp + fpAdd;

  return {
    atk: finalAtk,
    hp: finalHp,
    sta: finalSta,
    fp: finalFp
  };
}
