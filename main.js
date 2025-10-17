import { initUI } from "./ui.js";
import { EFFECTS as FALLBACK_EFFECTS } from "./data.js";

async function loadEffects() {
  try {
    const res = await fetch("./effects.json", { cache: "no-store" });
    if (!res.ok) throw new Error("effects.json not found");
    const json = await res.json();
    const ok = json.filter(e => e.id && e.name && e.target && e.stackMode);
    if (!ok.length) throw new Error("no valid entries");
    console.info(`✅ effects.json 読み込み成功: ${ok.length} 件`);
    return ok;
  } catch (err) {
    console.warn("⚠ effects.json 読み込み失敗。data.jsを使用:", err.message);
    return FALLBACK_EFFECTS;
  }
}

window.addEventListener("DOMContentLoaded", async () => {
  const effects = await loadEffects();
  initUI(effects);
});