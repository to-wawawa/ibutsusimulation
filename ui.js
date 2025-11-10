// ui.js
// グローバル公開: window.initUI = initUI
(function () {
  function initUI(effects) {
    const EFFECTS = Array.isArray(effects) ? effects : [];
    const effectsDict = Object.fromEntries(EFFECTS.map(e => [e.id, e]));
    const state = window.loadState();

    // タブ設定
    const TAB_ORDER = ["atk", "hp", "fp", "stamina", "other"];
    const TAB_LABELS = { atk: "攻撃力倍率", hp: "HP", fp: "FP", stamina: "スタミナ", other: "その他" };
    let activeTab = loadActiveTab();

    // DOM参照
    const elBaseAtk = document.getElementById("base-atk");
    const elBaseHp = document.getElementById("base-hp");
    const elBaseSta = document.getElementById("base-sta");
    const elBaseFp = document.getElementById("base-fp");
    const elReset = document.getElementById("reset-btn");
    const elTabs = document.getElementById("palette-tabs");
    const elList = document.getElementById("effect-list");
    const elSearch = document.getElementById("palette-search");
    const elGrid = document.getElementById("slot-grid");
    const outAtk = document.getElementById("out-atk");
    const outHp = document.getElementById("out-hp");
    const outSta = document.getElementById("out-sta");
    const outFp = document.getElementById("out-fp");

    // 基礎値をUIへ
    elBaseAtk.value = (Number(state.base.atk) || 1.0).toFixed(2);
    elBaseHp.value = String(state.base.hp);
    elBaseSta.value = String(state.base.stamina);
    elBaseFp.value = String(state.base.fp);

    // === タブ描画 ===
    function renderTabs() {
      elTabs.innerHTML = "";
      TAB_ORDER.forEach(key => {
        const btn = document.createElement("button");
        btn.className = "tab-btn" + (activeTab === key ? " active" : "");
        btn.type = "button";
        btn.dataset.tab = key;
        btn.textContent = TAB_LABELS[key] || key;
        btn.addEventListener("click", () => {
          activeTab = key;
          saveActiveTab(activeTab);
          renderTabs();
          renderPalette(elSearch.value);
        });
        elTabs.appendChild(btn);
      });
    }
    renderTabs();

    // === 効果ジャンルリスト ===
    const renderPalette = (q = "") => {
      elList.innerHTML = "";
      const ql = q.trim().toLowerCase();

      const inTab = EFFECTS.filter(e => {
        if (activeTab === "other") {
          return !["atk", "hp", "fp", "stamina"].includes((e.target || "").toLowerCase());
        }
        return (e.target || "").toLowerCase() === activeTab;
      });

      const items = inTab.filter(e => {
        if (!ql) return true;
        const t = (e.name + " " + (e.note || "")).toLowerCase();
        return t.includes(ql);
      });

      for (const e of items) {
        const pill = document.createElement("div");
        pill.className = "effect-pill";
        pill.draggable = true;
        pill.dataset.effectId = e.id;

        // 👇 修正：名前のみ表示（stackMode/target非表示）
        pill.innerHTML = `<span class="name">${e.name}</span>`;

        pill.addEventListener("dragstart", ev => ev.dataTransfer.setData("text/plain", e.id));
        pill.addEventListener("click", () => {
          const idx = findNextEmptySlotIndex();
          if (idx !== -1) equipEffectToSlot(e.id, idx);
          else showConflictPopup("空きスロットがありません。");
        });
        elList.appendChild(pill);
      }

      if (!items.length) {
        const empty = document.createElement("div");
        empty.className = "warn";
        empty.textContent = "効果が見つかりません。";
        elList.appendChild(empty);
      }
    };
    renderPalette();
    elSearch.addEventListener("input", () => renderPalette(elSearch.value));

    // === スロット描画 ===
    const renderSlots = () => {
      elGrid.innerHTML = "";
      state.slots.forEach((slot, i) => {
        const el = document.createElement("div");
        el.className = "slot";
        el.dataset.index = String(i);

        // 深度スロットの視覚区別
        if (isDeepSlot(i)) {
          el.style.borderColor = "#c9a13d";
          el.style.background = "rgba(201,161,61,0.05)";
        }

        el.addEventListener("dragover", ev => ev.preventDefault());
        el.addEventListener("drop", ev => {
          ev.preventDefault();
          const effId = ev.dataTransfer.getData("text/plain");
          if (effectsDict[effId]) equipEffectToSlot(effId, i);
        });

        // ヘッダ
        const header = document.createElement("div");
        header.className = "slot-header";
        header.innerHTML = `
          <div class="slot-title">スロット ${i + 1}${isDeepSlot(i) ? "（深度）" : ""}</div>
          <div class="clear">クリア</div>
        `;
        header.querySelector(".clear").addEventListener("click", () => {
          state.slots[i] = { effectId: null, value: 0, level: 0 };
          persistAndRefresh();
        });
        el.appendChild(header);

        // 本文
        const body = document.createElement("div");
        body.className = "slot-body";

        const eff = effectsDict[slot.effectId];
        if (!eff) {
          body.textContent = "効果ジャンルをドラッグ＆ドロップ（またはタップ装着）";
          body.style.color = "#999";
        } else {
          const title = document.createElement("div");
          title.className = "effect-title";
          title.textContent = eff.name;
          body.appendChild(title);

          const row = document.createElement("div");
          row.className = "inline-control";

          // レベル対応
          if (Array.isArray(eff.valuesByLevel) && eff.valuesByLevel.length > 0) {
            const maxLv = eff.valuesByLevel.length - 1;
            const select = document.createElement("select");
            for (let lv = 0; lv <= maxLv; lv++) {
              const opt = document.createElement("option");
              opt.value = lv;
              opt.textContent = lv === 0 ? "（無印）" : `+${lv}`;
              select.appendChild(opt);
            }
            select.value = String(slot.level ?? 0);

            const arrow = document.createElement("span");
            arrow.className = "arrow";
            arrow.textContent = "→";

            const valueSpan = document.createElement("span");
            valueSpan.className = "value";

            const val = resolveLevelValue(eff, Number(select.value));
            const unit = eff.valueUnit === "%" ? "%" : "";
            valueSpan.textContent = `${(val * (eff.valueUnit === "%" ? 100 : 1)).toFixed(2)}${unit}`;

            select.addEventListener("change", () => {
              const lv = Number(select.value);
              state.slots[i].level = lv;
              state.slots[i].value = resolveLevelValue(eff, lv);
              window.saveState(state);
              const v = resolveLevelValue(eff, lv);
              valueSpan.textContent = `${(v * (eff.valueUnit === "%" ? 100 : 1)).toFixed(2)}${unit}`;
              renderResult();
            });

            row.appendChild(select);
            row.appendChild(arrow);
            row.appendChild(valueSpan);
          } else {
            const input = document.createElement("input");
            input.type = "number";
            input.value = String(slot.value ?? eff.default ?? 0);
            input.step = eff.valueUnit === "%" ? "0.1" : "1";
            const arrow = document.createElement("span");
            arrow.textContent = "→";
            const unit = document.createElement("span");
            unit.className = "value";
            unit.textContent = `${input.value}${eff.valueUnit === "%" ? "%" : ""}`;
            input.addEventListener("input", () => {
              let v = Number(input.value);
              if (!Number.isFinite(v)) v = 0;
              if (typeof eff.cap === "number") v = Math.min(v, eff.cap);
              state.slots[i].value = v;
              window.saveState(state);
              unit.textContent = `${v}${eff.valueUnit === "%" ? "%" : ""}`;
              renderResult();
            });
            row.appendChild(input);
            row.appendChild(arrow);
            row.appendChild(unit);
          }

          body.appendChild(row);
        }

        el.appendChild(body);
        elGrid.appendChild(el);
      });
    };

    // === 計算＆結果 ===
    const renderResult = () => {
      const base = {
        atk: Number(elBaseAtk.value) || 1.0,
        hp: Number(elBaseHp.value) || 0,
        stamina: Number(elBaseSta.value) || 0,
        fp: Number(elBaseFp.value) || 0,
      };
      const result = window.calculate(base, state.slots, effectsDict);
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
      if (save) window.saveState(state);
      renderSlots();
      renderResult();
    };

    [elBaseAtk, elBaseHp, elBaseSta, elBaseFp].forEach(el =>
      el.addEventListener("input", () => persistAndRefresh(false))
    );

    elReset.addEventListener("click", () => {
      const s = window.resetState();
      Object.assign(state, s);
      persistAndRefresh();
    });

    // === ヘルパー群 ===
    function findNextEmptySlotIndex() {
      return state.slots.findIndex(s => !s?.effectId);
    }

    function isDeepSlot(index) {
      return index >= 9; // 10〜18
    }

    function hasDuplicateCategoryInSet(slotIndex, target) {
      const setStart = Math.floor(slotIndex / 3) * 3;
      const setEnd = setStart + 3;
      for (let i = setStart; i < setEnd; i++) {
        if (i === slotIndex) continue;
        const effId = state.slots[i].effectId;
        if (!effId) continue;
        const e = effectsDict[effId];
        if (e && e.target === target) return true;
      }
      return false;
    }

    // ✅ 改良版ポップアップ（2秒表示、重複可）
    function showConflictPopup(msg) {
      const el = document.getElementById("conflict-popup");
      if (!el) return;
      el.classList.remove("visible");
      void el.offsetWidth;
      el.textContent = msg;
      el.classList.add("visible");
      clearTimeout(el._timer);
      el._timer = setTimeout(() => el.classList.remove("visible"), 2000);
    }

    function equipEffectToSlot(effId, slotIndex) {
      const eff = effectsDict[effId];
      if (!eff) return;

      const deep = isDeepSlot(slotIndex);

      if (deep && eff.allowDeep === false) {
        showConflictPopup("この効果は【深度】スロットには装着できません。");
        return;
      }
      if (!deep && eff.deepOnly === true) {
        showConflictPopup("この効果は【深度】スロット専用です。");
        return;
      }
      if (hasDuplicateCategoryInSet(slotIndex, eff.target)) {
        showConflictPopup("同一セット内に同カテゴリ効果は装着できません。");
        return;
      }

      // 通常装着
      state.slots[slotIndex].effectId = effId;
      state.slots[slotIndex].level = 0;
      state.slots[slotIndex].value = resolveLevelValue(eff, 0);
      window.saveState(state);
      renderSlots();
      renderResult();
    }

    function resolveLevelValue(eff, level) {
      const arr = eff.valuesByLevel || [];
      const idx = Math.max(0, Math.min(level, arr.length - 1));
      return Number(arr[idx]) || 0;
    }

    function loadActiveTab() {
      try {
        const v = localStorage.getItem("relic-sim-active-tab");
        return TAB_ORDER.includes(v) ? v : "atk";
      } catch { return "atk"; }
    }
    function saveActiveTab(v) {
      try { localStorage.setItem("relic-sim-active-tab", v); } catch {}
    }

    renderSlots();
    renderResult();
  }

  window.initUI = initUI;
})();
