// ui.js
// ==============================
// UI初期化処理
// ==============================
window.initUI = function (effects) {
  const slotGrid = document.getElementById("slot-grid");
  const results = {
    atk: document.getElementById("out-atk"),
    hp: document.getElementById("out-hp"),
    sta: document.getElementById("out-sta"),
    fp: document.getElementById("out-fp"),
  };

  // ------------------------------
  // スロット生成（18枠固定）
  // ------------------------------
  for (let i = 0; i < 18; i++) {
    const slot = document.createElement("div");
    slot.className = "slot";
    slot.dataset.index = i + 1;
    slot.innerHTML = `
      <div class="slot-header">
        <div class="slot-title">スロット${i + 1}</div>
        <span class="clear" title="クリア">✕</span>
      </div>
      <div class="slot-body subtle">未設定</div>
    `;
    slotGrid.appendChild(slot);
  }

  // ------------------------------
  // 効果ピル生成（例）
  // ------------------------------
  const list = document.getElementById("effect-list");
  effects.forEach(e => {
    const pill = document.createElement("div");
    pill.className = "effect-pill";
    pill.draggable = true;
    pill.dataset.id = e.id;
    pill.dataset.category = e.category || e.target;
    pill.innerHTML = `
      <span class="name">${e.name}</span>
      <span class="target">${e.target}</span>
    `;
    list.appendChild(pill);
  });

  // ------------------------------
  // ドラッグ＆ドロップ関連
  // ------------------------------
  let dragged = null;
  document.querySelectorAll(".effect-pill").forEach(pill => {
    pill.addEventListener("dragstart", e => {
      dragged = pill;
      e.dataTransfer.effectAllowed = "move";
    });
  });

  document.querySelectorAll(".slot").forEach(slot => {
    slot.addEventListener("dragover", e => e.preventDefault());
    slot.addEventListener("drop", e => {
      e.preventDefault();
      if (!dragged) return;
      const name = dragged.querySelector(".name").textContent;
      const category = dragged.dataset.category;
      slot.dataset.category = category;
      slot.querySelector(".slot-body").textContent = name;
      slot.querySelector(".slot-body").classList.remove("subtle");
      checkSlotConflicts(); // ← 競合チェックを呼ぶ！
    });

    // クリアボタン
    slot.querySelector(".clear").addEventListener("click", () => {
      delete slot.dataset.category;
      slot.querySelector(".slot-body").textContent = "未設定";
      slot.querySelector(".slot-body").classList.add("subtle");
      checkSlotConflicts();
    });
  });

  // ------------------------------
  // 結果更新ダミー（例）
  // ------------------------------
  function updateResults() {
    results.atk.textContent = "1.00倍";
    results.hp.textContent = "1000";
    results.sta.textContent = "100";
    results.fp.textContent = "100";
  }

  updateResults();
};

// ===============================
// 以下：競合チェックとポップアップ
// ===============================
function checkSlotConflicts() {
  const slotGrid = document.getElementById("slot-grid");
  if (!slotGrid) return;

  const slots = Array.from(slotGrid.querySelectorAll(".slot"));
  const slotData = slots.map(slot => ({
    el: slot,
    category: slot.dataset.category || null,
  }));

  // 全スロット背景リセット
  slots.forEach(s => s.classList.remove("conflict"));

  // 各3枠ごとにカテゴリ重複を確認
  for (let i = 0; i < slotData.length; i += 3) {
    const group = slotData.slice(i, i + 3);
    const seen = new Map();

    for (const s of group) {
      if (!s.category) continue;
      if (seen.has(s.category)) {
        s.el.classList.add("conflict");
        seen.get(s.category).classList.add("conflict");
        showConflictPopup();
      } else {
        seen.set(s.category, s.el);
      }
    }
  }
}

// ===============================
// ポップアップ表示（1秒）
// ===============================
let conflictTimeout;
function showConflictPopup() {
  clearTimeout(conflictTimeout);
  let popup = document.getElementById("conflict-popup");
  if (!popup) {
    popup = document.createElement("div");
    popup.id = "conflict-popup";
    popup.textContent = "存在しない組み合わせです";
    document.body.appendChild(popup);
  }

  popup.classList.add("visible");
  conflictTimeout = setTimeout(() => popup.classList.remove("visible"), 1000);
}
