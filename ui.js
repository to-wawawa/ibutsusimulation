// =====================================================
// ui.js - 遺物効果シミュレーター 完全版（固有遺物対応）
// =====================================================

(function () {
  function initUI(effects) {
    const EFFECTS = Array.isArray(effects) ? effects : [];
    const effectsDict = Object.fromEntries(EFFECTS.map(e => [e.id, e]));
    const state = window.loadState();

    // ===========================
    // タブ構成に固有遺物を追加
    // ===========================
    const TAB_ORDER = ["atk", "hp", "fp", "stamina", "def", "special", "other", "unique"];
    const TAB_LABELS = {
      atk: "攻撃",
      hp: "HP",
      fp: "FP",
      stamina: "スタミナ",
      def: "防御・耐性",
      special: "特殊",
      other: "その他",
      unique: "固有遺物"
    };
    let activeTab = loadActiveTab();

    // ===========================
    // DOM取得
    // ===========================
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

    elBaseAtk.value = (Number(state.base.atk) || 1.0).toFixed(2);
    elBaseHp.value = String(state.base.hp);
    elBaseSta.value = String(state.base.stamina);
    elBaseFp.value = String(state.base.fp);

    // ===========================
    // 固有遺物のセット構成データ
    // ===========================
    const UNIQUE_RELICS = {
      "にび色の砥石": ["atk_phys_pct", "arts_fire_followup"],
      "銀の雫": ["arts_gauge_gain_enemy", "arcane_plus_1_3"],
      "追跡者の耳飾り": ["arts_fire_followup", "atk_hit_recovery", "atk_stamina_recover"],
      "石の杭": ["arts_extend_skill_duration", "arts_skill_cooldown"],
      "三冊目の本": ["atk_hp_recover_weapon", "arts_wave_roar_heal"],
      "魔女のブローチ": ["arts_team_heal", "arts_wave_on_guard", "vigor_plus_1_3"],
      "砕けた魔女のブローチ": ["arts_team_heal", "arts_wave_on_guard", "vigor_plus_1_3"],
      "割れた封蝋": ["atk_gain_rune", "atk_critical_boost"],
      "聖律の刃": ["weapon_holy_infusion", "atk_critical_boost", "atk_phys_pct"],
      "金色の露": ["atk_arts_buff_lady", "attribute_attack_up"],
      "頭冠のメダル": ["atk_phys_pct", "atk_critical_boost"],
      "祝福された鉄貨": ["hp_regen_blessed_coin", "vigor_plus_1_3"],
      "ちぎれた組み紐": ["atk_when_hit_boost", "strength_plus_1_3"],
      "黒爪の首飾り": ["arts_gauge_gain_enemy", "arts_gauge_gain_critical", "poise_plus_1_3"],
      "小さな化粧道具": ["arts_attack_buff_family", "collector_rune_bonus"],
      "古びたミニアチュール": ["arts_aoe_blast", "arts_team_heal"],
      "夜の痕跡": ["atk_magic_pct"],
      "骨のような石": ["hp_arts_buff_hermit", "int_plus_1_3"],
      "祝福された花": ["arts_wave_roar_heal", "dex_plus_1_3"],
      "黄金の萌芽": ["arts_wave_roar_heal", "hp_low_aoe_regen", "hp_guard_heal"],
      "獣の夜": ["atk_stamina_recover", "weapon_fire_infusion"],
      "爵の夜": ["atk_critical_boost", "arts_gauge_gain_critical", "crit_stamina_recovery"],
      "識の夜": ["max_fp_flat", "weapon_poison_infusion", "atk_poison_pct"],
      "深海の夜": ["max_hp_flat", "bless_flask_team", "item_team_share"],
      "魔の夜": ["collector_discount", "gesture_madness_build", "atk_fp_restore_madness"],
      "狩人の夜": ["max_stamina_flat", "guard_counter_boost", "atk_hp_recover_weapon"],
      "霞の夜": ["frost_hide_on_trigger", "arts_frost_fog", "atk_frost_pct"],
      "王の夜": ["arts_weapon_swap_attribute", "attribute_attack_up", "weapon_change_buff"],
      "獣の暗き夜": ["atk_stamina_recover", "atk_when_hit_boost", "atk_fire_pct"],
      "爵の暗き夜": ["atk_critical_boost", "atk_gain_rune"],
      "識の暗き夜": ["max_fp_flat", "atk_fp_restore_madness", "tower_fp_boost"],
      "深海の暗き夜": ["max_hp_flat", "hp_regen_passive", "hp_low_aoe_regen"],
      "魔の暗き夜": ["atk_when_hit_boost", "gesture_madness_build", "atk_fp_restore_madness"],
      "狩人の暗き夜": ["max_stamina_flat", "attribute_attack_up", "arts_gauge_gain_enemy"],
      "霞の暗き夜": ["frost_hide_on_trigger", "weapon_frost_infusion", "cut_phys_pct"]
    };
    // ===========================
    // タブ描画処理
    // ===========================
    function renderTabs() {
      elTabs.innerHTML = "";
      TAB_ORDER.forEach(key => {
        const btn = document.createElement("button");
        btn.className = "tab-btn" + (activeTab === key ? " active" : "");
        btn.textContent = TAB_LABELS[key] || key;
        btn.dataset.tab = key;
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

    // ===========================
    // 効果リスト描画処理
    // ===========================
    function renderPalette(q = "") {
      elList.innerHTML = "";
      const ql = q.trim().toLowerCase();

      if (activeTab === "unique") {
        // 固有遺物一覧
        Object.keys(UNIQUE_RELICS).forEach(name => {
          const pill = document.createElement("div");
          pill.className = "effect-pill relic";
          pill.draggable = true;
          pill.textContent = name;
          pill.addEventListener("dragstart", ev => {
            ev.dataTransfer.setData("type", "relic");
            ev.dataTransfer.setData("relicName", name);
          });
          pill.addEventListener("click", () => {
            equipRelicToSlots(name);
          });
          elList.appendChild(pill);
        });
        return;
      }

      // 通常効果
      const inTab = EFFECTS.filter(e => {
        if (activeTab === "other") {
          return !["atk", "hp", "fp", "stamina", "def", "special"].includes(
            (e.target || "").toLowerCase()
          );
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
        pill.innerHTML = `<span class="name">${e.name}</span>`;
        pill.addEventListener("dragstart", ev => {
          ev.dataTransfer.setData("type", "effect");
          ev.dataTransfer.setData("effectId", e.id);
        });
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
    }
    renderPalette();
    elSearch.addEventListener("input", () => renderPalette(elSearch.value));

    // ===========================
    // スロット描画処理
    // ===========================
    function renderSlots() {
      elGrid.innerHTML = "";
      state.slots.forEach((slot, i) => {
        const el = document.createElement("div");
        el.className = "slot";
        el.dataset.index = String(i);

        if (isDeepSlot(i)) {
          el.style.borderColor = "#c9a13d";
          el.style.background = "rgba(201,161,61,0.05)";
        }

        el.addEventListener("dragover", ev => ev.preventDefault());
        el.addEventListener("drop", ev => {
          ev.preventDefault();
          const type = ev.dataTransfer.getData("type");
          if (type === "effect") {
            const effId = ev.dataTransfer.getData("effectId");
            if (effectsDict[effId]) equipEffectToSlot(effId, i);
          } else if (type === "relic") {
            const relicName = ev.dataTransfer.getData("relicName");
            equipRelicToSlots(relicName);
          }
        });

        const header = document.createElement("div");
        header.className = "slot-header";
        header.innerHTML = `
          <div class="slot-title">スロット ${i + 1}${isDeepSlot(i) ? "（深夜）" : ""}</div>
          <div class="clear">クリア</div>
        `;
        header.querySelector(".clear").addEventListener("click", () => {
          state.slots[i] = { effectId: null, value: 0, level: 0 };
          persistAndRefresh();
        });
        el.appendChild(header);

        const body = document.createElement("div");
        body.className = "slot-body";

        const eff = effectsDict[slot.effectId];
        if (!eff) {
          body.textContent = "効果をドラッグまたはクリックで装着";
          body.style.color = "#999";
        } else {
          const title = document.createElement("div");
          title.className = "effect-title";
          title.textContent = eff.name;
          body.appendChild(title);

          const row = document.createElement("div");
          row.className = "inline-control";
          // --- 値の表示フォーマッタ ---
          function formatDisplayValue(eff, rawVal) {
            // valueUnit が "%" のときはパーセント表示（小数2桁）
            const unit = (eff.valueUnit || "%").toLowerCase();
            if (unit === "%" || unit === "percent" || unit === "pct") {
              return `${Number(rawVal).toFixed(2)}%`;
            }
            return String(Number(rawVal));
          }

          // --- レベル対応 or 直接入力 ---
          if (Array.isArray(eff.valuesByLevel) && eff.valuesByLevel.length > 0) {
            // レベル制
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
            arrow.textContent = "→";

            const valueSpan = document.createElement("span");
            const val = resolveLevelValue(eff, Number(select.value));
            valueSpan.textContent = formatDisplayValue(eff, val);

            select.addEventListener("change", () => {
              const lv = Number(select.value);
              state.slots[i].level = lv;
              state.slots[i].value = resolveLevelValue(eff, lv);
              window.saveState(state);
              const v = resolveLevelValue(eff, lv);
              valueSpan.textContent = formatDisplayValue(eff, v);
              renderResult();
            });

            row.appendChild(select);
            row.appendChild(arrow);
            row.appendChild(valueSpan);
          } else {
            // 直接入力
            const input = document.createElement("input");
            input.type = "number";
            input.value = String(slot.value ?? eff.default ?? 0);
            const arrow = document.createElement("span");
            arrow.textContent = "→";
            const unit = document.createElement("span");
            unit.className = "value";
            unit.textContent = formatDisplayValue(eff, input.value);

            input.addEventListener("input", () => {
              let v = Number(input.value);
              if (!Number.isFinite(v)) v = 0;
              if (typeof eff.cap === "number") v = Math.min(v, eff.cap);
              state.slots[i].value = v;
              window.saveState(state);
              unit.textContent = formatDisplayValue(eff, v);
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
    }

    // ===========================
    // 計算＆結果表示
    // ===========================
    function renderResult() {
      const base = {
        atk: Number(elBaseAtk.value) || 1.0,
        hp: Number(elBaseHp.value) || 0,
        stamina: Number(elBaseSta.value) || 0,
        fp: Number(elBaseFp.value) || 0,
      };
      const result = window.calculate(base, state.slots, effectsDict);

      // 「想定：魔力攻撃+4 なら 1.12倍」→ 表示は「+12.00%」、計算は倍率で、は calculator.js 側で担保済み
      outAtk.textContent = `${result.atkMultiplier.toFixed(2)}x`;
      outHp.textContent = String(result.hp);
      outSta.textContent = String(result.stamina);
      outFp.textContent = String(result.fp);
    }

    function persistAndRefresh(save = true) {
      state.base = {
        atk: Number(elBaseAtk.value) || 1.0,
        hp: Number(elBaseHp.value) || 0,
        stamina: Number(elBaseSta.value) || 0,
        fp: Number(elBaseFp.value) || 0,
      };
      if (save) window.saveState(state);
      renderSlots();
      renderResult();
    }

    [elBaseAtk, elBaseHp, elBaseSta, elBaseFp].forEach(el =>
      el.addEventListener("input", () => persistAndRefresh(false))
    );

    // 修正対象箇所（既存のリセット処理を置き換え）
    elReset.addEventListener("click", () => {
      // 「すべてリセット」＝各スロットの「クリア」を全押下した扱い
      for (let i = 0; i < state.slots.length; i++) {
        state.slots[i] = { effectId: null, value: 0, level: 0 };
      }

      // 競合ポップアップなどが表示されている場合は非表示にする
      const popup = document.getElementById("conflict-popup");
      if (popup) popup.classList.remove("visible");

      // 保存＆再描画
      if (typeof persistAndRefresh === "function") {
        persistAndRefresh();
      } else {
        window.saveState(state);
        renderSlots();
        renderResult();
      }

      console.log("🧹 全スロットをクリアしました（ボタン一括押下相当）");
    });



    // ===========================
    // ヘルパー群
    // ===========================
    const isDeepSlot = i => i >= 9; // 10〜18 が深夜

    function findNextEmptySlotIndex() {
      return state.slots.findIndex(s => !s?.effectId);
    }

    function showConflictPopup(msg) {
      const el = document.getElementById("conflict-popup");
      if (!el) return;
      el.classList.remove("visible");
      void el.offsetWidth; // reflow
      el.textContent = msg;
      el.classList.add("visible");
      clearTimeout(el._timer);
      el._timer = setTimeout(() => el.classList.remove("visible"), 2000);
    }

    function getFamilyKey(eff) {
      const id = String(eff?.id || "");
      if (eff?.baseId) return String(eff.baseId);
      const stripped = id
        .replace(/(\+?\d+)$/i, "")
        .replace(/_plus(_?\d+)?$/i, "")
        .replace(/_lv(l)?_?\d+$/i, "")
        .replace(/_level_?\d+$/i, "")
        .replace(/_rank_?\d+$/i, "");
      return stripped || id;
    }

    // 同一セット内で target が重複していないか
    function hasDuplicateCategoryInSet(slotIndex, target) {
      const setStart = Math.floor(slotIndex / 3) * 3;
      const setEnd = setStart + 3;
      for (let i = setStart; i < setEnd; i++) {
        if (i === slotIndex) continue;
        const effId = state.slots[i].effectId;
        if (!effId) continue;
        const e = effectsDict[effId];
        if (e && (e.target || "").toLowerCase() === (target || "").toLowerCase()) return true;
      }
      return false;
    }

    // 同一セット内で family / overlap の競合チェック
    function isConflictWithExisting(eff, slotIndex) {
      if (!eff) return null;
      const thisFam = getFamilyKey(eff);
      const thisOverlap = eff.overlap || null;
      const setStart = Math.floor(slotIndex / 3) * 3;
      const setEnd = setStart + 3;

      for (let i = setStart; i < setEnd; i++) {
        if (i === slotIndex) continue;
        const s = state.slots[i];
        if (!s.effectId) continue;
        const e2 = effectsDict[s.effectId];
        if (!e2) continue;

        const fam2 = getFamilyKey(e2);
        if (thisFam === fam2) return `${eff.name} と ${e2.name} は同系統（ファミリー）です（同セット内不可）。`;

        if (thisOverlap && e2.overlap === thisOverlap && !(eff.allowOverlap || e2.allowOverlap)) {
          return `${thisOverlap} 系の効果は同セット内で1つまでです。`;
        }

        if (thisOverlap === "特定キャラクター" && e2.overlap === "特定キャラクター") {
          return "同セット内ではキャラクター固有効果を複数付けられません。";
        }
      }
      return null;
    }

    function resolveLevelValue(eff, level) {
      const arr = eff.valuesByLevel || [];
      const idx = Math.max(0, Math.min(level, arr.length - 1));
      return Number(arr[idx]) || 0;
    }

    // 効果装着（単体）— 深夜制約＆同セット内ルールのみチェック
    function equipEffectToSlot(effId, slotIndex) {
      const eff = effectsDict[effId];
      if (!eff) return;

      const deep = isDeepSlot(slotIndex);
      if (deep && eff.allowDeep === false) {
        return showConflictPopup("この効果は【深夜】スロットには装着できません。");
      }
      if (!deep && eff.deepOnly === true) {
        return showConflictPopup("この効果は【深夜】スロット専用です。");
      }

      // 同セット内カテゴリ重複チェック
      if (hasDuplicateCategoryInSet(slotIndex, eff.target)) {
        return showConflictPopup("同一セット内に同カテゴリ効果は装着できません。");
      }

      // 同セット内の overlap / family 競合チェック
      const overlapConflict = isConflictWithExisting(eff, slotIndex);
      if (overlapConflict) return showConflictPopup(overlapConflict);

      // レベル制のデフォルト：先頭が0かつ複数段ある場合は +1 を初期
      const hasLevels = Array.isArray(eff.valuesByLevel) && eff.valuesByLevel.length > 0;
      let defaultLevel = 0;
      if (hasLevels && Number(eff.valuesByLevel[0]) === 0 && eff.valuesByLevel.length > 1) {
        defaultLevel = 1;
      }

      state.slots[slotIndex].effectId = effId;
      state.slots[slotIndex].level = defaultLevel;
      state.slots[slotIndex].value = resolveLevelValue(eff, defaultLevel);
      window.saveState(state);
      renderSlots();
      renderResult();
    }
    // 固有遺物のセット装着
    // 仕様：
    //  - スロット1〜9（= 3セット分）のうち、空きの多いセットを優先して詰める
    //  - 十分な空きがない場合は「1〜3（セットA）」を上書き
    function equipRelicToSlots(relicName) {
      const ids = UNIQUE_RELICS[relicName];
      if (!ids || !ids.length) return;

      // 1〜9 の中で、空き数が多いセットを探す
      const candidateSets = [
        { start: 0,  empty: countEmpty(0) },
        { start: 3,  empty: countEmpty(3) },
        { start: 6,  empty: countEmpty(6) },
      ].sort((a, b) => b.empty - a.empty);

      let targetStart = candidateSets[0].empty > 0 ? candidateSets[0].start : 0; // 空きが全く無ければ 0〜2 を上書き
      const slotsInSet = [targetStart, targetStart + 1, targetStart + 2];

      // まず空きに詰める → 足りなければ先頭から上書き
      let fillIndexes = [];
      for (const si of slotsInSet) {
        if (!state.slots[si]?.effectId) fillIndexes.push(si);
      }
      const remain = ids.slice(fillIndexes.length);
      const overwriteIndexes = slotsInSet.filter(i => !fillIndexes.includes(i)).slice(0, remain.length);

      const placingOrder = [...fillIndexes, ...overwriteIndexes];

      ids.forEach((effId, idx) => {
        const slotIndex = placingOrder[idx] ?? slotsInSet[idx % 3];
        // 深夜制約はこの時点では関係ない（1〜9のみを対象）のでスキップ
        // 同セット競合も「固有遺物パック」は優先的に上書きする設計とし、競合チェックは行わない
        const eff = effectsDict[effId];
        if (!eff) return;
        const hasLevels = Array.isArray(eff.valuesByLevel) && eff.valuesByLevel.length > 0;
        let defaultLevel = 0;
        if (hasLevels && Number(eff.valuesByLevel[0]) === 0 && eff.valuesByLevel.length > 1) {
          defaultLevel = 1;
        }
        state.slots[slotIndex].effectId = effId;
        state.slots[slotIndex].level = defaultLevel;
        state.slots[slotIndex].value = resolveLevelValue(eff, defaultLevel);
      });

      window.saveState(state);
      renderSlots();
      renderResult();

      function countEmpty(start) {
        let c = 0;
        for (let i = start; i < start + 3; i++) {
          if (!state.slots[i]?.effectId) c++;
        }
        return c;
      }
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

  

// 初期描画
renderSlots();
renderResult();

// タイトル行クリックで開閉（スマホ・PC共通）
setupHeaderToggles();
}

function setupHeaderToggles() {
  const headers = document.querySelectorAll("h2.collapsible");

  headers.forEach(header => {
    const targetId = header.dataset.target;
    if (!targetId) return;

    const target = document.getElementById(targetId);
    if (!target) return;

    header.addEventListener("click", () => {
      // スマホ幅のみ折りたたみを有効化
      if (window.matchMedia("(max-width: 700px)").matches) {
        header.classList.toggle("collapsed");
        target.classList.toggle("collapsed");
      }
    });
  });
}

const tabs = document.querySelector('.tabs');
let isDown = false;
let startX;
let scrollLeft;

tabs.addEventListener('mousedown', (e) => {
  isDown = true;
  tabs.classList.add('dragging');
  startX = e.pageX - tabs.offsetLeft;
  scrollLeft = tabs.scrollLeft;
});
tabs.addEventListener('mouseleave', () => {
  isDown = false;
  tabs.classList.remove('dragging');
});
tabs.addEventListener('mouseup', () => {
  isDown = false;
  tabs.classList.remove('dragging');
});
tabs.addEventListener('mousemove', (e) => {
  if (!isDown) return;
  e.preventDefault();
  const x = e.pageX - tabs.offsetLeft;
  const walk = (x - startX) * 1.2; // ドラッグ速度
  tabs.scrollLeft = scrollLeft - walk;
});


// グローバル公開
window.initUI = initUI;
})();
