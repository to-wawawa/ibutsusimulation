// ui.js（10/8以前の完全版）

document.addEventListener("DOMContentLoaded", () => {
  // --------------------------
  // 折りたたみUI
  // --------------------------
  const collapsibles = document.querySelectorAll(".collapsible");
  collapsibles.forEach(btn => {
    btn.addEventListener("click", () => {
      const target = document.getElementById(btn.dataset.target);
      if (!target) return;
      if (target.classList.contains("open")) {
        target.classList.remove("open");
        btn.classList.remove("active");
      } else {
        target.classList.add("open");
        btn.classList.add("active");
      }
    });
  });

  // --------------------------
  // パレットタブ切り替え
  // --------------------------
  const tabButtons = document.querySelectorAll(".tab-btn");
  tabButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const parent = btn.parentElement;
      if (!parent) return;

      // 全タブを非アクティブ化
      parent.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
      // クリックしたタブをアクティブ化
      btn.classList.add("active");

      // 表示する効果リスト切り替え
      const targetId = btn.dataset.target;
      const effectList = document.getElementById("effect-list");
      if (effectList) {
        Array.from(effectList.children).forEach(child => {
          if (child.dataset.genre === targetId) {
            child.style.display = "";
          } else {
            child.style.display = "none";
          }
        });
      }
    });
  });

  // --------------------------
  // 効果検索
  // --------------------------
  const searchInput = document.getElementById("palette-search");
  if (searchInput) {
    searchInput.addEventListener("input", () => {
      const filter = searchInput.value.toLowerCase();
      const effectList = document.getElementById("effect-list");
      if (!effectList) return;
      Array.from(effectList.children).forEach(item => {
        const name = item.querySelector(".name")?.textContent.toLowerCase() || "";
        if (name.includes(filter)) {
          item.style.display = "";
        } else {
          item.style.display = "none";
        }
      });
    });
  }

  // --------------------------
  // スロット初期化
  // --------------------------
  const slotGrid = document.getElementById("slot-grid");
  if (slotGrid) {
    for (let i = 0; i < 18; i++) {
      const slot = document.createElement("div");
      slot.className = "slot";
      slot.dataset.index = i;

      // ヘッダー
      const header = document.createElement("div");
      header.className = "slot-header";
      const title = document.createElement("span");
      title.className = "slot-title";
      title.textContent = `スロット ${i + 1}`;
      header.appendChild(title);
      slot.appendChild(header);

      // ボディ
      const body = document.createElement("div");
      body.className = "slot-body";
      slot.appendChild(body);

      slotGrid.appendChild(slot);
    }
  }

  // --------------------------
  // スロットのクリアボタン
  // --------------------------
  slotGrid?.addEventListener("click", e => {
    if (e.target.classList.contains("clear")) {
      const slot = e.target.closest(".slot");
      if (slot) {
        slot.querySelector(".slot-body").innerHTML = "";
        slot.classList.remove("hover", "conflict");
      }
    }
  });

  // --------------------------
  // ドラッグ＆ドロップ初期化（効果リスト → スロット）
  // --------------------------
  const effectList = document.getElementById("effect-list");
  effectList?.querySelectorAll(".effect-pill").forEach(pill => {
    pill.setAttribute("draggable", "true");
    pill.addEventListener("dragstart", e => {
      e.dataTransfer.setData("text/plain", pill.dataset.id);
    });
  });

  slotGrid?.querySelectorAll(".slot").forEach(slot => {
    slot.addEventListener("dragover", e => e.preventDefault());
    slot.addEventListener("drop", e => {
      e.preventDefault();
      const id = e.dataTransfer.getData("text/plain");
      const effect = document.querySelector(`.effect-pill[data-id='${id}']`);
      if (!effect) return;
      const body = slot.querySelector(".slot-body");
      if (body) {
        const clone = effect.cloneNode(true);
        clone.classList.remove("dragging");
        body.appendChild(clone);
      }
    });
  });

  // --------------------------
  // 検出・競合ポップアップ初期化
  // --------------------------
  const conflictPopup = document.getElementById("conflict-popup");
  if (conflictPopup) {
    // 必要に応じて visible クラスを付与/削除
  }
});
