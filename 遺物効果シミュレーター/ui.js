// ui.js
import { calculate } from "./calculator.js";
import { loadState, saveState, resetState } from "./state.js";

export function initUI(EFFECTS) {
  const effectsDict = Object.fromEntries(EFFECTS.map(e => [e.id, e]));
  const state = loadState();

  // DOM refs
  const elBaseAtk = document.getElementById("base-atk");
  const elBaseHp = document.getElementById("base-hp");
  const elBaseSta = document.getElementById("base-sta");
  const elBaseFp = document.getElementById("base-fp");
  const elReset = document.getElementById("reset-btn");

  const elList = document.getElementById("effect-list");
  const elSearch = document.getElementById("palette-search");
  const elGrid = document.getElementById("slot-grid");

  const outAtk = document.getElementById("out-atk");
  const outHp = document.getElementById("out-hp");
  const outSta = document.getElementById("out-sta");
  const outFp = document.getElementById("out-fp");

  const elTabs = document.createElement("div");
elTabs.className = "effect-tabs";
elSearch.insertAdjacentElement("afterend", elTabs);

const CATEGORIES = [
  { key: "all", label: "すべて" },
  { key: "atk", label: "攻撃力倍率" },
  { key: "hp", label: "HP" },
  { key: "fp", label: "FP" },
  { key: "stamina", label: "スタミナ" },
  { key: "other", label: "その他" },
];

let currentCategory = "all";

for (const cat of CATEGORIES) {
  const btn = document.createElement("button");
  btn.textContent = cat.label;
  btn.className = "tab-btn" + (cat.key === currentCategory ? " active" : "");
  btn.addEventListener("click", () => {
    currentCategory = cat.key;
    // active切り替え
    elTabs.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    renderPalette(elSearch.value);
  });
  elTabs.appendChild(btn);
}

  // 基礎値をUIへ
  elBaseAtk.value = (Number(state.base.atk) || 1.0).toFixed(2);
  elBaseHp.value = String(state.base.hp);
  elBaseSta.value = String(state.base.stamina);
  elBaseFp.value = String(state.base.fp);

  // パレット描画
const renderPalette = (q = "") => {
  elList.innerHTML = "";
  const items = EFFECTS.filter(e => {
    const matchesSearch = !q || (e.name + " " + (e.note || "")).toLowerCase().includes(q.toLowerCase());
    const matchesCat =
      currentCategory === "all" ? true :
      currentCategory === "other" ? !["atk", "hp", "fp", "stamina"].includes(e.target) :
      e.target === currentCategory;
    return matchesSearch && matchesCat;
  });

  for (const e of items) {
    const pill = document.createElement("div");
    pill.className = "effect-pill";
    pill.draggable = true;
    pill.dataset.effectId = e.id;
    pill.innerHTML = `
      <span class="name">${e.name}</span>
    `;
    pill.addEventListener("dragstart", (ev) => {
      ev.dataTransfer.setData("text/plain", e.id);
    });
    elList.appendChild(pill);
  }
};

// 一応残しておく　      <span class="target">${e.target} / ${e.stackMode}</span>

// 検索イベント
elSearch.addEventListener("input", () => renderPalette(elSearch.value));
renderPalette();
  renderPalette();
  elSearch.addEventListener("input", () => renderPalette(elSearch.value));

  // スロット描画
  const renderSlots = () => {
    elGrid.innerHTML = "";
    state.slots.forEach((slot, i) => {
      const el = document.createElement("div");
      el.className = "slot";
      el.dataset.index = String(i);

      // DnD
      el.addEventListener("dragover", (ev) => {
        ev.preventDefault();
        el.classList.add("hover");
      });
      el.addEventListener("dragleave", () => el.classList.remove("hover"));
      el.addEventListener("drop", (ev) => {
        ev.preventDefault();
        el.classList.remove("hover");
        const effId = ev.dataTransfer.getData("text/plain");
        if (!effectsDict[effId]) return;
        state.slots[i].effectId = effId;

        // 初期値設定（レベル制は level=0、固定 or 直入力は default）
        const eff = effectsDict[effId];
        if (Array.isArray(eff.valuesByLevel)) {
          state.slots[i].level = 0;
          state.slots[i].value = 0;
        } else {
          const d = typeof eff.default === "number" ? eff.default : 0;
          state.slots[i].value = d;
          state.slots[i].level = 0;
        }
        persistAndRefresh();
      });

      // ヘッダ
      const header = document.createElement("div");
      header.className = "slot-header";
      const sTitle = document.createElement("div");
      sTitle.className = "slot-title";
      sTitle.textContent = `スロット ${i + 1}`;
      const clear = document.createElement("div");
      clear.className = "clear";
      clear.textContent = "クリア";
      clear.addEventListener("click", () => {
        state.slots[i] = { effectId: null, value: 0, level: 0 };
        persistAndRefresh();
      });
      header.appendChild(sTitle);
      header.appendChild(clear);
      el.appendChild(header);

      // 本文
      const body = document.createElement("div");
      body.className = "slot-body";

      if (slot.effectId) {
        const eff = effectsDict[slot.effectId];
        if (!eff) {
          const warn = document.createElement("div");
          warn.className = "warn";
          warn.style.gridColumn = "1 / -1";
          warn.textContent = `不明な効果ID: ${slot.effectId}（effects.json に存在しません）`;
          body.appendChild(warn);
        } else {
          // タイトル: 「名称 0～+N（レベル制のみ）」
          const title = document.createElement("div");
          title.className = "effect-title";
          if (Array.isArray(eff.valuesByLevel) && eff.valuesByLevel.length > 0) {
            const maxLevel = (typeof eff.maxLevel === "number")
              ? eff.maxLevel
              : (eff.valuesByLevel.length - 1);
            title.textContent = `${eff.name} 0～+${Math.min(4, maxLevel)}`;
          } else {
            title.textContent = eff.name;
          }
          body.appendChild(title);

          // 行: プルダウン（または入力 or 固定表示） → 実効値
          const row = document.createElement("div");
          row.className = "inline-control";

          if (Array.isArray(eff.valuesByLevel) && eff.valuesByLevel.length > 0) {
            // レベル制（プルダウン）
            const maxLevel = (typeof eff.maxLevel === "number")
              ? eff.maxLevel
              : (eff.valuesByLevel.length - 1);

            const select = document.createElement("select");
            for (let lv = 0; lv <= Math.min(4, maxLevel); lv++) {
              const opt = document.createElement("option");
              opt.value = String(lv);
              opt.textContent = `+${lv}`;
              select.appendChild(opt);
            }
            select.value = String(Math.min(slot.level ?? 0, Math.min(4, maxLevel)));

            const arrow = document.createElement("span");
            arrow.className = "arrow";
            arrow.textContent = "→";

            const unit = eff.valueUnit === "%" ? "%" : "";
            const valueSpan = document.createElement("span");
            valueSpan.className = "value";
            valueSpan.textContent = `${resolveLevelValue(eff, Number(select.value))}${unit}`;

            select.addEventListener("change", () => {
              state.slots[i].level = Number(select.value);
              saveState(state);
              valueSpan.textContent = `${resolveLevelValue(eff, state.slots[i].level)}${unit}`;
              renderResult();
            });

            row.appendChild(select);
            row.appendChild(arrow);
            row.appendChild(valueSpan);
          } else {
            // 非レベル制：固定値なら入力欄を出さず、固定値だけ表示
            if (isFixedValueEffect(eff)) {
              const arrow = document.createElement("span");
              arrow.className = "arrow";
              arrow.textContent = "→";

              const value = typeof eff.fixedValue === "number"
                ? eff.fixedValue
                : (typeof eff.default === "number" ? eff.default : 0);

              const unit = document.createElement("span");
              unit.className = "value";
              unit.textContent = `${value}${eff.valueUnit === "%" ? "%" : ""}`;

              // ステートは一応固定値を保持
              state.slots[i].value = value;

              row.appendChild(document.createTextNode("固定"));
              row.appendChild(arrow);
              row.appendChild(unit);
            } else {
              // 従来の数値直入力
              const input = document.createElement("input");
              input.type = "number";
              input.step = eff.valueUnit === "%" ? "0.1" : "1";
              input.value = String(slot.value ?? eff.default ?? 0);

              const arrow = document.createElement("span");
              arrow.className = "arrow";
              arrow.textContent = "→";

              const unit = document.createElement("span");
              unit.className = "value";
              unit.textContent = `${input.value}${eff.valueUnit === "%" ? "%" : ""}`;

              input.addEventListener("input", () => {
                let v = Number(input.value);
                if (!Number.isFinite(v)) v = 0;
                if (typeof eff.cap === "number") v = Math.min(v, eff.cap);
                state.slots[i].value = v;
                saveState(state);
                unit.textContent = `${v}${eff.valueUnit === "%" ? "%" : ""}`;
                renderResult();
              });

              row.appendChild(input);
              row.appendChild(arrow);
              row.appendChild(unit);
            }
          }

          body.appendChild(row);
        }
      } else {
        const empty = document.createElement("div");
        empty.style.color = "#9aa4b2";
        empty.textContent = "効果ジャンルをドラッグ＆ドロップ";
        body.appendChild(empty);
      }

      el.appendChild(body);
      elGrid.appendChild(el);
    });
  };

  // 計算＆表示
  const renderResult = () => {
    const base = {
      atk: Number(elBaseAtk.value) || 1.0,
      hp: Number(elBaseHp.value) || 0,
      stamina: Number(elBaseSta.value) || 0,
      fp: Number(elBaseFp.value) || 0,
    };
    const result = calculate(base, state.slots, effectsDict);
    outAtk.textContent = `${result.atkMultiplier.toFixed(2)}x`;
    outHp.textContent = String(result.hp);
    outSta.textContent = String(result.stamina);
    outFp.textContent = String(result.fp);
  };

  const persistAndRefresh = (save = true) => {
    state.base = {
      atk: Number(elBaseAtk.value) || 1.0,
      hp: Number(elBaseHp.value) || 0,
      stamina: Number(elBaseSta.value) || 0,
      fp: Number(elBaseFp.value) || 0,
    };
    if (save) saveState(state);
    renderSlots();
    renderResult();
  };

  // 基礎値変更イベント
  [elBaseAtk, elBaseHp, elBaseSta, elBaseFp].forEach(el =>
    el.addEventListener("input", () => persistAndRefresh(false))
  );

  elReset.addEventListener("click", () => {
    const s = resetState();
    elBaseAtk.value = s.base.atk.toFixed(2);
    elBaseHp.value = String(s.base.hp);
    elBaseSta.value = String(s.base.stamina);
    elBaseFp.value = String(s.base.fp);
    state.base = s.base;
    state.slots = s.slots;
    persistAndRefresh();
  });

  // 初期描画
  renderSlots();
  renderResult();

  function resolveLevelValue(eff, level) {
    const arr = eff.valuesByLevel || [];
    const maxIndex = typeof eff.maxLevel === "number" ? eff.maxLevel : (arr.length - 1);
    const idx = Math.max(0, Math.min(maxIndex, level || 0));
    return Number(arr[idx]) || 0;
  }

  function isFixedValueEffect(eff) {
    // 明示フラグがあれば優先
    if (eff.inputLocked === true) return true;

    // default と cap が同値なら固定値とみなす（例: +100 しかない）
    if (typeof eff.default === "number" && typeof eff.cap === "number" && eff.default === eff.cap) {
      return true;
    }
    return false;
  }
}