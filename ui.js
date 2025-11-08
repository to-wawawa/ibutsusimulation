// ui.js
// UI生成とイベント処理を司る

window.initUI = function (effects) {
  const app = document.getElementById("app");
  if (!app) {
    console.error("UIのルート要素 #app が見つかりません。");
    return;
  }

  // --------------------------------
  // 🔧 初期変数と状態
  // --------------------------------
  const state = {
    slots: Array(9).fill(null), // 3枠×3セット = 9スロット
    openSections: JSON.parse(localStorage.getItem("openSections") || "{}"),
  };

  // --------------------------------
  // 🔧 ポップアップ（競合警告）を生成
  // --------------------------------
  const popup = document.createElement("div");
  popup.id = "conflict-popup";
  popup.textContent = "存在しない組み合わせです";
  document.body.appendChild(popup);

  function showPopup() {
    popup.classList.add("visible");
    setTimeout(() => popup.classList.remove("visible"), 1000);
  }

  // --------------------------------
  // 🔧 効果カテゴリを抽出
  // --------------------------------
  const categories = [...new Set(effects.map(e => e.category || "その他"))];

  // --------------------------------
  // 🔧 メイン構造生成
  // --------------------------------
  app.innerHTML = `
    <section>
      <h2 class="collapsible" data-target="palette">効果一覧</h2>
      <div id="palette" class="collapsible-target"></div>

      <h2 class="collapsible" data-target="slots">スロット</h2>
      <div id="slots" class="collapsible-target"></div>

      <h2>結果</h2>
      <div class="results" id="results">効果を選択してください。</div>
    </section>
  `;

  const paletteEl = document.getElementById("palette");
  const slotsEl = document.getElementById("slots");
  const resultsEl = document.getElementById("results");

  // --------------------------------
  // 🔧 タブ式カテゴリ一覧
  // --------------------------------
  const tabsEl = document.createElement("div");
  tabsEl.className = "tabs";

  const listEl = document.createElement("div");
  listEl.className = "effect-list";

  let activeCat = categories[0];

  function renderTabs() {
    tabsEl.innerHTML = "";
    for (const cat of categories) {
      const btn = document.createElement("button");
      btn.textContent = cat;
      btn.className = "tab-btn" + (cat === activeCat ? " active" : "");
      btn.onclick = () => {
        activeCat = cat;
        renderTabs();
        renderList();
      };
      tabsEl.appendChild(btn);
    }
  }

  function renderList() {
    listEl.innerHTML = "";
    const filtered = effects.filter(e => (e.category || "その他") === activeCat);
    for (const eff of filtered) {
      const pill = document.createElement("div");
      pill.className = "effect-pill";
      pill.innerHTML = `
        <div class="name">${eff.name}</div>
        <div class="target">${eff.target}</div>
      `;
      pill.draggable = true;
      pill.ondragstart = ev => {
        ev.dataTransfer.setData("text/plain", eff.id);
      };
      listEl.appendChild(pill);
    }
  }

  renderTabs();
  renderList();

  paletteEl.appendChild(tabsEl);
  paletteEl.appendChild(listEl);

  // --------------------------------
  // 🔧 スロット生成
  // --------------------------------
  const slotGrid = document.createElement("div");
  slotGrid.className = "slot-grid";
  slotsEl.appendChild(slotGrid);

  for (let i = 0; i < state.slots.length; i++) {
    const slot = document.createElement("div");
    slot.className = "slot";
    slot.dataset.index = i;

    slot.innerHTML = `
      <div class="slot-header">
        <div class="slot-title">スロット ${i + 1}</div>
        <div class="clear" title="クリア">✕</div>
      </div>
      <div class="slot-body">
        <div class="effect-title subtle">未設定</div>
        <select class="level" disabled>
          <option value="0">Lv0</option>
          <option value="1">Lv1</option>
          <option value="2">Lv2</option>
          <option value="3">Lv3</option>
          <option value="4">Lv4</option>
        </select>
      </div>
    `;

    // ドロップ対応
    slot.ondragover = ev => ev.preventDefault();
    slot.ondrop = ev => {
      ev.preventDefault();
      const id = ev.dataTransfer.getData("text/plain");
      const eff = effects.find(e => e.id === id);
      if (eff) applyEffectToSlot(i, eff);
    };

    slot.querySelector(".clear").onclick = () => clearSlot(i);
    slot.querySelector(".level").onchange = () => updateResults();
    slotGrid.appendChild(slot);
  }

  // --------------------------------
  // 🔧 効果適用・更新ロジック
  // --------------------------------
  function applyEffectToSlot(index, eff) {
    const category = eff.category || "その他";
    const groupStart = Math.floor(index / 3) * 3;
    const group = [groupStart, groupStart + 1, groupStart + 2];

    // 同グループ内のカテゴリ重複を確認
    for (const j of group) {
      if (state.slots[j] && (state.slots[j].category || "その他") === category) {
        markConflict(group);
        showPopup();
        return;
      }
    }

    // 適用
    state.slots[index] = eff;
    renderSlot(index);
    updateResults();
  }

  function clearSlot(index) {
    state.slots[index] = null;
    renderSlot(index);
    updateResults();
  }

  function markConflict(group) {
    for (const j of group) {
      const slotEl = slotGrid.querySelector(`.slot[data-index="${j}"]`);
      slotEl.classList.add("conflict");
      setTimeout(() => slotEl.classList.remove("conflict"), 1200);
    }
  }

  function renderSlot(index) {
    const slot = slotGrid.querySelector(`.slot[data-index="${index}"]`);
    const eff = state.slots[index];
    const titleEl = slot.querySelector(".effect-title");
    const levelSel = slot.querySelector(".level");

    if (!eff) {
      titleEl.textContent = "未設定";
      titleEl.classList.add("subtle");
      levelSel.disabled = true;
      levelSel.value = "0";
      return;
    }

    titleEl.textContent = eff.name;
    titleEl.classList.remove("subtle");
    levelSel.disabled = false;
  }

  // --------------------------------
  // 🔧 結果表示（安定化）
  // --------------------------------
  function updateResults() {
    const summary = [];
    for (let i = 0; i < state.slots.length; i++) {
      const eff = state.slots[i];
      if (!eff) continue;
      const slotEl = slotGrid.querySelector(`.slot[data-index="${i}"]`);
      const level = Number(slotEl.querySelector(".level").value);
      const value =
        eff.valuesByLevel && eff.valuesByLevel[level] !== undefined
          ? eff.valuesByLevel[level]
          : (eff.default || 0) * (1 + level * 0.03);

      summary.push(`<div>${eff.name}: <strong>+${value}${eff.valueUnit || "%"}</strong></div>`);
    }

    resultsEl.innerHTML = summary.length
      ? summary.join("")
      : "効果を選択してください。";
  }

  // --------------------------------
  // 🔧 折りたたみセクション管理
  // --------------------------------
  const collapsibles = document.querySelectorAll(".collapsible");
  collapsibles.forEach(btn => {
    const targetId = btn.dataset.target;
    const target = document.getElementById(targetId);

    const isOpen = !!state.openSections[targetId];
    btn.classList.toggle("active", isOpen);
    target.classList.toggle("open", isOpen);

    btn.addEventListener("click", () => {
      const nowOpen = !target.classList.contains("open");
      target.classList.toggle("open", nowOpen);
      btn.classList.toggle("active", nowOpen);
      state.openSections[targetId] = nowOpen;
      localStorage.setItem("openSections", JSON.stringify(state.openSections));
    });
  });
};
