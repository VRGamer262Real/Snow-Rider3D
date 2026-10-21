(() => {
  const state = {
    open: false,
    noClip: false,
    giftBoost: false
  };

  const menuId = "snowRiderModMenu";
  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

  function makeMenu() {
    const menu = document.createElement("div");
    menu.id = menuId;
    menu.style.position = "fixed";
    menu.style.top = "20px";
    menu.style.right = "20px";
    menu.style.width = "220px";
    menu.style.padding = "12px";
    menu.style.background = "rgba(10,14,26,0.9)";
    menu.style.border = "1px solid rgba(255,255,255,0.25)";
    menu.style.borderRadius = "10px";
    menu.style.color = "#fff";
    menu.style.fontFamily = "Arial, sans-serif";
    menu.style.fontSize = "13px";
    menu.style.boxShadow = "0 8px 30px rgba(0,0,0,0.4)";
    menu.style.zIndex = "999999";
    menu.style.display = "none";

    const title = document.createElement("div");
    title.textContent = "Snow Rider Mod Menu";
    title.style.fontWeight = "700";
    title.style.marginBottom = "10px";
    title.style.fontSize = "15px";
    menu.appendChild(title);

    const addToggle = (label, enabled, onToggle) => {
      const row = document.createElement("div");
      row.style.display = "flex";
      row.style.alignItems = "center";
      row.style.justifyContent = "space-between";
      row.style.marginBottom = "8px";

      const text = document.createElement("span");
      text.textContent = label;

      const button = document.createElement("button");
      button.textContent = enabled ? "ON" : "OFF";
      button.style.border = "none";
      button.style.borderRadius = "999px";
      button.style.padding = "6px 10px";
      button.style.cursor = "pointer";
      button.style.background = enabled ? "#32d296" : "#444";
      button.style.color = "#fff";
      button.style.fontWeight = "700";
      button.onclick = () => onToggle(button);

      row.append(text, button);
      menu.appendChild(row);
      return button;
    };

    const noClipBtn = addToggle("No Clip", state.noClip, (btn) => {
      state.noClip = !state.noClip;
      btn.textContent = state.noClip ? "ON" : "OFF";
      btn.style.background = state.noClip ? "#32d296" : "#444";
      applyNoClip();
    });

    const giftsBtn = addToggle("More Presents", state.giftBoost, (btn) => {
      state.giftBoost = !state.giftBoost;
      btn.textContent = state.giftBoost ? "ON" : "OFF";
      btn.style.background = state.giftBoost ? "#32d296" : "#444";
      applyGiftBoost();
    });

    const progressBtn = document.createElement("button");
    progressBtn.textContent = "Give More Progress";
    progressBtn.style.width = "100%";
    progressBtn.style.marginTop = "8px";
    progressBtn.style.padding = "8px 10px";
    progressBtn.style.borderRadius = "8px";
    progressBtn.style.border = "none";
    progressBtn.style.background = "#ffb703";
    progressBtn.style.color = "#111";
    progressBtn.style.fontWeight = "700";
    progressBtn.style.cursor = "pointer";
    progressBtn.onclick = () => {
      grantProgress();
      alert("Progress boosted.");
    };
    menu.appendChild(progressBtn);

    document.body.appendChild(menu);
    return { menu, noClipBtn, giftsBtn };
  }

  function setMenuOpen(open) {
    state.open = open;
    const menu = document.getElementById(menuId);
    if (menu) menu.style.display = open ? "block" : "none";
  }

  function findObjects() {
    const candidates = [];

    function walk(obj, seen = new Set()) {
      if (!obj || typeof obj !== "object") return;
      if (seen.has(obj)) return;
      seen.add(obj);

      if (Array.isArray(obj)) {
        obj.forEach(v => walk(v, seen));
        return;
      }

      for (const key of Object.keys(obj)) {
        const value = obj[key];
        const name = String(key).toLowerCase();

        if (
          name.includes("player") ||
          name.includes("sleigh") ||
          name.includes("controller") ||
          name.includes("movement") ||
          name.includes("physics") ||
          name.includes("progress") ||
          name.includes("present") ||
          name.includes("gift") ||
          name.includes("coin") ||
          name.includes("score") ||
          name.includes("level")
        ) {
          candidates.push({ key, value });
        }

        if (value && typeof value === "object") walk(value, seen);
      }
    }

    walk(window);
    return candidates;
  }

  function getGameState() {
    const candidates = findObjects();
    const result = {};

    for (const item of candidates) {
      const n = item.key.toLowerCase();
      if (n.includes("player") || n.includes("sleigh") || n.includes("controller")) result.player = item.value;
      if (n.includes("progress") || n.includes("level") || n.includes("score")) result.progress = item.value;
      if (n.includes("present") || n.includes("gift") || n.includes("coin")) result.currency = item.value;
      if (n.includes("physics") || n.includes("movement")) result.physics = item.value;
    }

    return result;
  }

  function applyNoClip() {
    const game = getGameState();

    if (!game.player && !game.physics) {
      console.log("NoClip target not found yet. Retrying on next tick.");
      return;
    }

    const targetPool = [game.player, game.physics];

    for (const target of targetPool) {
      if (!target || typeof target !== "object") continue;

      if ("gravity" in target) target.gravity = 0;
      if ("yVelocity" in target) target.yVelocity = 0;
      if ("velocityY" in target) target.velocityY = 0;
      if ("jumpForce" in target) target.jumpForce = 0;
      if ("position" in target && target.position) {
        target.position.y = target.position.y || 0;
        target.position.y = Number(target.position.y);
      }

      if ("canCollide" in target) target.canCollide = false;
      if ("isGrounded" in target) target.isGrounded = true;
      if ("colliderEnabled" in target) target.colliderEnabled = false;
    }
  }

  function applyGiftBoost() {
    const game = getGameState();

    const progressTargets = [game.progress, game.currency];
    for (const target of progressTargets) {
      if (!target || typeof target !== "object") continue;

      for (const key of Object.keys(target)) {
        const low = String(key).toLowerCase();
        if (low.includes("present") || low.includes("gift") || low.includes("coin") || low.includes("score")) {
          const value = Number(target[key]);
          if (!Number.isNaN(value)) {
            target[key] = value + 500;
          }
        }
      }
    }

    try {
      if (window.localStorage) {
        const current = Number(window.localStorage.getItem("presents") || 0);
        window.localStorage.setItem("presents", String(current + 500));
      }
    } catch (e) {}
  }

  function grantProgress() {
    try {
      if (window.localStorage) {
        const keyList = ["progress", "level", "score", "presents", "coins", "gifts"];
        for (const key of keyList) {
          const value = Number(window.localStorage.getItem(key) || 0);
          window.localStorage.setItem(key, String(value + 1000));
        }
      }
    } catch (e) {}

    const game = getGameState();
    for (const target of [game.progress, game.currency]) {
      if (!target || typeof target !== "object") continue;

      for (const key of Object.keys(target)) {
        const low = String(key).toLowerCase();
        if (
          low.includes("progress") ||
          low.includes("level") ||
          low.includes("score") ||
          low.includes("present") ||
          low.includes("gift") ||
          low.includes("coin")
        ) {
          const value = Number(target[key]);
          if (!Number.isNaN(value)) target[key] = value + 1000;
        }
      }
    }
  }

  function installHotkeys() {
    document.addEventListener("keydown", (e) => {
      const key = e.key.toLowerCase();
      if (key === "m") {
        e.preventDefault();
        setMenuOpen(!state.open);
      }
    });
  }

  function init() {
    makeMenu();
    installHotkeys();

    setInterval(() => {
      if (state.noClip) applyNoClip();
      if (state.giftBoost) applyGiftBoost();
    }, 250);
  }

  init();
})();
