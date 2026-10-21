(() => {
  const state = {
    open: false,
    noClip: false,
    giftBoost: false,
    progressBoost: false
  };

  const menuId = "snowRiderModMenu";

  function setMenuOpen(open) {
    state.open = open;
    const menu = document.getElementById(menuId);
    if (menu) menu.style.display = open ? "block" : "none";
  }

  function findGameObjects() {
    const targets = [];

    function walk(value, seen = new Set()) {
      if (!value || typeof value !== "object") return;
      if (seen.has(value)) return;
      seen.add(value);

      if (Array.isArray(value)) {
        value.forEach(item => walk(item, seen));
        return;
      }

      Object.keys(value).forEach((key) => {
        const lower = key.toLowerCase();
        if (
          lower.includes("player") ||
          lower.includes("sleigh") ||
          lower.includes("controller") ||
          lower.includes("movement") ||
          lower.includes("physics") ||
          lower.includes("progress") ||
          lower.includes("present") ||
          lower.includes("gift") ||
          lower.includes("coin") ||
          lower.includes("score") ||
          lower.includes("level")
        ) {
          targets.push({ key, value: value[key] });
        }
        walk(value[key], seen);
      });
    }

    walk(window);
    return targets;
  }

  function getBestTargets() {
    const targets = findGameObjects();
    const result = { player: null, progress: null, currency: null, physics: null };

    targets.forEach(({ key, value }) => {
      const lower = key.toLowerCase();
      if (!result.player && (lower.includes("player") || lower.includes("sleigh") || lower.includes("controller"))) {
        result.player = value;
      }
      if (!result.physics && (lower.includes("physics") || lower.includes("movement"))) {
        result.physics = value;
      }
      if (!result.progress && (lower.includes("progress") || lower.includes("level") || lower.includes("score"))) {
        result.progress = value;
      }
      if (!result.currency && (lower.includes("present") || lower.includes("gift") || lower.includes("coin"))) {
        result.currency = value;
      }
    });

    return result;
  }

  function applyNoClip() {
    const { player, physics } = getBestTargets();
    const candidates = [player, physics].filter(Boolean);

    candidates.forEach((target) => {
      if (!target || typeof target !== "object") return;

      if ("gravity" in target) target.gravity = 0;
      if ("yVelocity" in target) target.yVelocity = 0;
      if ("velocityY" in target) target.velocityY = 0;
      if ("jumpForce" in target) target.jumpForce = 0;
      if ("canCollide" in target) target.canCollide = false;
      if ("isGrounded" in target) target.isGrounded = true;
      if ("colliderEnabled" in target) target.colliderEnabled = false;
      if (target.position && typeof target.position === "object") {
        if (typeof target.position.y === "number") target.position.y = Number(target.position.y);
      }
    });
  }

  function applyGiftBoost() {
    const { progress, currency } = getBestTargets();
    const targets = [progress, currency].filter(Boolean);

    targets.forEach((target) => {
      if (!target || typeof target !== "object") return;

      Object.keys(target).forEach((key) => {
        const lower = key.toLowerCase();
        if (lower.includes("present") || lower.includes("gift") || lower.includes("coin") || lower.includes("score")) {
          const value = Number(target[key]);
          if (!Number.isNaN(value)) target[key] = value + 500;
        }
      });
    });

    try {
      const keyList = ["presents", "gifts", "coins"];
      keyList.forEach((key) => {
        const current = Number(window.localStorage.getItem(key) || 0);
        window.localStorage.setItem(key, String(current + 500));
      });
    } catch (error) {
      // No-op when storage is blocked.
    }
  }

  function grantProgress() {
    try {
      const keyList = ["progress", "level", "score", "presents", "coins", "gifts"];
      keyList.forEach((key) => {
        const current = Number(window.localStorage.getItem(key) || 0);
        window.localStorage.setItem(key, String(current + 1000));
      });
    } catch (error) {
      // No-op when storage is blocked.
    }

    const { progress, currency } = getBestTargets();
    const targets = [progress, currency].filter(Boolean);

    targets.forEach((target) => {
      if (!target || typeof target !== "object") return;

      Object.keys(target).forEach((key) => {
        const lower = key.toLowerCase();
        if (
          lower.includes("progress") ||
          lower.includes("level") ||
          lower.includes("score") ||
          lower.includes("present") ||
          lower.includes("gift") ||
          lower.includes("coin")
        ) {
          const value = Number(target[key]);
          if (!Number.isNaN(value)) target[key] = value + 1000;
        }
      });
    });
  }

  function makeMenu() {
    const menu = document.createElement("div");
    menu.id = menuId;
    menu.style.position = "fixed";
    menu.style.top = "20px";
    menu.style.right = "20px";
    menu.style.width = "220px";
    menu.style.padding = "12px";
    menu.style.background = "rgba(9, 13, 27, 0.9)";
    menu.style.border = "1px solid rgba(255,255,255,0.2)";
    menu.style.borderRadius = "12px";
    menu.style.color = "#ffffff";
    menu.style.fontFamily = "Arial, sans-serif";
    menu.style.fontSize = "13px";
    menu.style.zIndex = "999999";
    menu.style.boxShadow = "0 8px 24px rgba(0,0,0,0.35)";
    menu.style.display = "none";

    const title = document.createElement("div");
    title.textContent = "Snow Rider Mod Menu";
    title.style.fontWeight = "700";
    title.style.fontSize = "15px";
    title.style.marginBottom = "10px";
    menu.appendChild(title);

    const addToggle = (label, onToggle) => {
      const row = document.createElement("div");
      row.style.display = "flex";
      row.style.alignItems = "center";
      row.style.justifyContent = "space-between";
      row.style.marginBottom = "8px";

      const labelEl = document.createElement("span");
      labelEl.textContent = label;

      const button = document.createElement("button");
      button.textContent = "OFF";
      button.style.background = "#3a3a3a";
      button.style.border = "none";
      button.style.borderRadius = "999px";
      button.style.padding = "6px 10px";
      button.style.color = "#ffffff";
      button.style.cursor = "pointer";
      button.style.fontWeight = "700";

      let enabled = false;
      button.onclick = () => {
        enabled = !enabled;
        button.textContent = enabled ? "ON" : "OFF";
        button.style.background = enabled ? "#2ec27e" : "#3a3a3a";
        onToggle(enabled);
      };

      row.appendChild(labelEl);
      row.appendChild(button);
      menu.appendChild(row);
    };

    addToggle("No Clip", (enabled) => {
      state.noClip = enabled;
      if (enabled) applyNoClip();
    });

    addToggle("More Presents", (enabled) => {
      state.giftBoost = enabled;
      if (enabled) applyGiftBoost();
    });

    const progressBtn = document.createElement("button");
    progressBtn.textContent = "Give More Progress";
    progressBtn.style.width = "100%";
    progressBtn.style.marginTop = "6px";
    progressBtn.style.padding = "8px 10px";
    progressBtn.style.border = "none";
    progressBtn.style.borderRadius = "8px";
    progressBtn.style.background = "#f5b700";
    progressBtn.style.color = "#101010";
    progressBtn.style.fontWeight = "700";
    progressBtn.style.cursor = "pointer";
    progressBtn.onclick = () => {
      state.progressBoost = true;
      grantProgress();
    };
    menu.appendChild(progressBtn);

    document.body.appendChild(menu);
  }

  function installHotkeys() {
    document.addEventListener("keydown", (event) => {
      if (event.key.toLowerCase() === "m") {
        event.preventDefault();
        setMenuOpen(!state.open);
      }
    });
  }

  function loop() {
    if (state.noClip) applyNoClip();
    if (state.giftBoost) applyGiftBoost();
    if (state.progressBoost) {
      grantProgress();
      state.progressBoost = false;
    }
  }

  makeMenu();
  installHotkeys();
  setInterval(loop, 250);
})();
