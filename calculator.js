// calculator.js
// 仕様:
// - multiplicativePercent: (1 + v1/100) * (1 + v2/100) * ...
// - additivePercent: 1 + (sum(v)/100)
// - flat: 単純加算（HP/スタミナ/FP 向け）
// - valueUnit が "%" でない場合は「固定値」として扱う
// - レベル制（valuesByLevel）がある場合は level を数値へ解決

export function calculate(base, slots, effectsDict) {
  const buckets = { atk: [], hp: [], stamina: [], fp: [] };

  for (const s of slots) {
    if (!s?.effectId) continue;
    const eff = effectsDict[s.effectId];
    if (!eff) continue;

    // レベル → 実効果量へ解決
    let v = 0;
    if (Array.isArray(eff.valuesByLevel) && eff.valuesByLevel.length > 0 && typeof s.level === "number") {
      const maxIndex = (typeof eff.maxLevel === "number") ? eff.maxLevel : (eff.valuesByLevel.length - 1);
      const lvl = clamp(s.level, 0, maxIndex);
      v = Number(eff.valuesByLevel[lvl]) || 0;
    } else {
      v = Number(s.value) || 0; // 従来の自由入力
    }

    // cap は効果値に対して適用（あれば）
    if (typeof eff.cap === "number") v = Math.min(v, eff.cap);

    // バケットへ
    const target = eff.target;
    if (!buckets[target]) continue;
    buckets[target].push({ eff, value: v });
  }

  const atkMult = stackForTarget("atk", buckets);
  const hp = stackOnBase(base.hp, "hp", buckets);
  const stamina = stackOnBase(base.stamina, "stamina", buckets);
  const fp = stackOnBase(base.fp, "fp", buckets);

  return {
    atkMultiplier: (Number(base.atk) || 1.0) * atkMult,
    hp,
    stamina,
    fp,
  };
}

function stackForTarget(target, buckets) {
  const items = buckets[target] || [];
  let mult_mul = 1.0;
  let mult_add = 0.0;

  for (const { eff, value } of items) {
    const v = normalizePercent(eff, value);
    if (eff.stackMode === "multiplicativePercent") {
      mult_mul *= (1 + v / 100);
    } else if (eff.stackMode === "additivePercent") {
      mult_add += v;
    }
    // atk の flat は現状未対応（必要なら拡張）
  }
  return mult_mul * (1 + mult_add / 100);
}

function stackOnBase(baseValue, target, buckets) {
  const items = buckets[target] || [];
  let mult_mul = 1.0;
  let mult_add = 0.0;
  let flat_add = 0.0;

  for (const { eff, value } of items) {
    if (eff.stackMode === "flat" || eff.valueUnit !== "%") {
      flat_add += value; // 固定値
    } else if (eff.stackMode === "multiplicativePercent") {
      mult_mul *= (1 + value / 100);
    } else if (eff.stackMode === "additivePercent") {
      mult_add += value;
    }
  }
  const afterMul = baseValue * mult_mul * (1 + mult_add / 100);
  return Math.round(afterMul + flat_add);
}

function normalizePercent(eff, value) {
  return eff.valueUnit === "%" ? value : 0;
}

function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }