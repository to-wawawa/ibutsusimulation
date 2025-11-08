// ui.js（最適化版）

document.addEventListener("DOMContentLoaded", () => {
  // 折りたたみUI
  document.querySelectorAll(".collapsible").forEach(btn => {
    btn.addEventListener("click", () => {
      const target = document.getElementById(btn.dataset.target);
      if (!target) return;
      btn.classList.toggle("active");
      target.classList.toggle("open");
    });
  });

  // タブ切り替え
  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const parent = btn.parentElement;
      if (!parent) return;
      parent.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      const targetId = btn.dataset.target;
      const effectList = document.getElementById("effect-list");
      if (effectList) {
        Array.from(effectList.children).forEach(item => {
          item.style.display = (!targetId || item.dataset.genre === targetId) ? "" : "none";
        });
      }
    });
  });

  // 効果検索
  const searchInput = document.getElementById("palette-search");
  searchInput?.addEventListener("input", () => {
    const filter = searchInput.value.toLowerCase();
    document.querySelectorAll("#effect-list .effect-pill").forEach(item => {
      const name = item.querySelector(".name")?.textContent.toLowerCase() || "";
      item.style.display = name.includes(filter) ? "" : "none";
    });
  });

  // スロット初期化
  const slotGrid = document.getElementById("slot-grid");
  if (slotGrid) {
    for (let i = 0; i < 18; i++) {
      const slot = document.createElement("div");
      slot.className = "slot";
      slot.dataset.index = i;

      const header = document.createElement("div");
      header.className = "slot-header";
      const title = document.createElement("span");
      title.className = "slot-title";
      title.textContent = `スロット ${i + 1}`;
      header.appendChild(title);
      slot.appendChild(header);

      const body = document.createElement("div");
      body.className = "slot-body";
      slot.appendChild(body);

      slotGrid.appendChild(slot);
    }
  }

  // スロットクリア
  slotGrid?.addEventListener("click", e => {
    if (e.target.classList.contains("clear")) {
      const slot = e.target.closest(".slot");
      if (slot) {
        slot.querySelector(".slot-body").innerHTML = "";
        slot.classList.remove("hover", "conflict");
      }
    }
  });

  // ドラッグ＆ドロップ
  document.querySelectorAll(".effect-pill").forEach(pill => {
    pill.setAttribute("draggable", "true");
    pill.addEventListener("dragstart", e => e.dataTransfer.setData("text/plain", pill.dataset.id));
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
});
