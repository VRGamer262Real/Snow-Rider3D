(() => {
  const state = {
    open: false,
    noClip: false,
    giftBoost: false,
    progressBoost: false,
    stabilize: true,
    freezeGuard: false,
    lastTick: performance.now()
  };

  const menuId = "snowRiderModMenu";
  const SAFE_KEYS = [
    "player", "sleigh", "controller", "physics", "movement", "rigidbody",
    "transform", "velocity", "position", "progress", "present", "gift",
    "coin", "score", "level", "health", "life", "dead", "crash", "gameover",
    "paused", "isdead", "isdeadly", "collision", "hitbox"
  ];

  function setMenuOpen(open) {
    state.open = open;
    const menu = document.getElementById(menuId);
    if (menu) menu.style.display = open ? "block" : "none";
  }

  function safeObjectKeys(obj) {
    try {
      return Object.keys(obj || {});
    } catch (error) {
      return [];
    }
  }

  function walkObjects(root, maxDepth = 3, depth = 0, seen = new Set()) {
    if (!root || typeof root !== "object" || depth > maxDepth) return [];
    if (seen.has(root)) return [];
    seen.add(root);

    const hits = [];
    const keys = safeObjectKeys(root);

    for (const key of keys) {
      const value = root[key];
      const lower = String(key).toLowerCase();
      if (value && typeof value === "object" && SAFE_KEYS.some(token => lower.includes(token))) {
        hits.push({ key, value });
      }
      if (value && typeof value === "object") {
        hits.push(...walkObjects(value, maxDepth, depth + 1, seen));
      }
    }

    return hits;
  }

  function pickTargets() {
    const hits = walkObjects(window, 3);
    const result = { player: null, progress: null, currency: null, physics: null, health: null };

    for (const { key, value } of hits) {
      const lower = String(key).toLowerCase();
      if (!result.player && (lower.includes("player") || lower.includes("sleigh") || lower.includes("controller") || lower.includes("rigidbody") || lower.includes("transform"))) {
        result.player = value;
      }
      if (!result.physics && (lower.includes("physics") || lower.includes("movement") || lower.includes("velocity") || lower.includes("position"))) {
        result.physics = value;
      }
      if (!result.progress && (lower.includes("progress") || lower.includes("level") || lower.includes("score"))) {
        result.progress = value;
      }
      if (!result.currency && (lower.includes("present") || lower.includes("gift") || lower.includes("coin"))) {
        result.currency = value;
      }
      if (!result.health && (lower.includes("health") || lower.includes("life") || lower.includes("dead") || lower.includes("gameover") || lower.includes("crash"))) {
        result.health = value;
      }
    }

    return result;
  }

  function setNumber(obj, key, value) {
    if (!obj || typeof obj !== "object") return;
    try {
      obj[key] = value;
    } catch (error) {
      // no-op
    }
  }

  function spoofDeathShield() {
    const targets = pickTargets();
    const candidates = [targets.player, targets.physics, targets.health].filter(Boolean);

    for (const target of candidates) {
      if (!target || typeof target !== "object") continue;

      for (const key of safeObjectKeys(target)) {
        const lower = String(key).toLowerCase();
        if (
          lower.includes("dead") ||
          lower.includes("gameover") ||
          lower.includes("crash") ||
          lower.includes("fail") ||
          lower.includes("hit") ||
          lower.includes("collision") ||
          lower.includes("hurt") ||
          lower.includes("destroy") ||
          lower.includes("ispaused")
        ) {
          try {
            target[key] = false;
          } catch (error) {
            // no-op
          }
        }
      }

      if ("dead" in target) target.dead = false;
      if ("isDead" in target) target.isDead = false;
      if ("isGameOver" in target) target.isGameOver = false;
      if ("gameOver" in target) target.gameOver = false;
      if ("crashed" in target) target.crashed = false;
      if ("canCollide" in target) target.canCollide = false;
      if ("isGrounded" in target) target.isGrounded = true;
      if ("colliderEnabled" in target) target.colliderEnabled = false;
      if ("collisionEnabled" in target) target.collisionEnabled = false;
      if ("isPaused" in target) target.isPaused = false;
      if ("paused" in target) target.paused = false;
      if ("timeScale" in target) target.timeScale = 1;
      if ("speed" in target && typeof target.speed === "number") target.speed = Math.max(target.speed, 18);
    }
  }

  function applyNoClip() {
    const targets = pickTargets();
    const candidates = [targets.player, targets.physics].filter(Boolean);

    for (const target of candidates) {
      if (!target || typeof target !== "object") continue;

      if ("gravity" in target) target.gravity = 0;
      if ("yVelocity" in target) target.yVelocity = 0;
      if ("velocityY" in target) target.velocityY = 0;
      if ("jumpForce" in target) target.jumpForce = 0;
      if ("fallSpeed" in target) target.fallSpeed = 0;
      if ("verticalSpeed" in target) target.verticalSpeed = 0;
      if ("canCollide" in target) target.canCollide = false;
      if ("isGrounded" in target) target.isGrounded = true;
      if ("colliderEnabled" in target) target.colliderEnabled = false;
      if ("collisionEnabled" in target) target.collisionEnabled = false;
      if (target.position && typeof target.position === "object") {
        if (typeof target.position.y === "number") target.position.y = Number(target.position.y);
      }
      if (target.transform && target.transform.position && typeof target.transform.position === "object") {
        if (typeof target.transform.position.y === "number") target.transform.position.y = Number(target.transform.position.y);
      }
    }

    spoofDeathShield();
  }

  function applyGiftBoost() {
    const targets = pickTargets();
    const allTargets = [targets.progress, targets.currency].filter(Boolean);

    for (const target of allTargets) {
      if (!target || typeof target !== "object") continue;

      for (const key of safeObjectKeys(target)) {
        const lower = String(key).toLowerCase();
        if (lower.includes("present") || lower.includes("gift") || lower.includes("coin") || lower.includes("score")) {
          const value = Number(target[key]);
          if (!Number.isNaN(value)) target[key] = value + 500;
        }
      }
    }

    try {
      const keys = ["presents", "gifts", "coins"];
      for (const key of keys) {
        const current = Number(window.localStorage.getItem(key) || 0);
        window.localStorage.setItem(key, String(current + 500));
      }
    } catch (error) {
      // no-op
    }
  }

  function grantProgress() {
    try {
      const keys = ["progress", "level", "score", "presents", "coins", "gifts"];
      for (const key of keys) {
        const current = Number(window.localStorage.getItem(key) || 0);
        window.localStorage.setItem(key, String(current + 1000));
      }
    } catch (error) {
      // no-op
    }

    const targets = pickTargets();
    const allTargets = [targets.progress, targets.currency].filter(Boolean);

    for (const target of allTargets) {
      if (!target || typeof target !== "object") continue;

      for (const key of safeObjectKeys(target)) {
        const lower = String(key).toLowerCase();
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
      }
    }
  }

  function stabilizeRuntime() {
    if (!state.stabilize) return;

    try {
      const root = window;
      const keys = safeObjectKeys(root);

      for (const key of keys) {
        const value = root[key];
        const lower = String(key).toLowerCase();
        if (value && typeof value === "object") {
          if ("timeScale" in value) value.timeScale = 1;
          if ("paused" in value) value.paused = false;
          if ("isPaused" in value) value.isPaused = false;
          if (lower.includes("loader") || lower.includes("game") || lower.includes("manager")) {
            if ("timeScale" in value) value.timeScale = 1;
          }
        }
      }

      if (window.requestAnimationFrame) {
        const now = performance.now();
        if (state.freezeGuard && now - state.lastTick > 1200) {
          document.body.style.filter = "none";
          state.freezeGuard = false;
        }
        state.lastTick = now;
      }
    } catch (error) {
      // no-op
    }
  }

  function makeMenu() {
    const menu = document.createElement("div");
    menu.id = menuId;
    menu.style.position = "fixed";
    menu.style.top = "20px";
    menu.style.right = "20px";
    menu.style.width = "230px";
    menu.style.padding = "12px";
    menu.style.background = "rgba(9, 13, 27, 0.92)";
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
      spoofDeathShield();
    });

    addToggle("More Presents", (enabled) => {
      state.giftBoost = enabled;
      if (enabled) applyGiftBoost();
    });

    addToggle("Stabilize", (enabled) => {
      state.stabilize = enabled;
      if (enabled) stabilizeRuntime();
    });

    const progressBtn = document.createElement("button");
    progressBtn.textContent = "Give More Progress";
    progressBtn.style.width = "100%";
    progressBtn.style.marginTop = "8px";
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
      spoofDeathShield();
    };
    menu.appendChild(progressBtn);

    document.body.appendChild(menu);
  }

  function installHotkeys() {
    document.addEventListener("keydown", (event) => {
      const key = event.key.toLowerCase();
      if (key === "m") {
        event.preventDefault();
        setMenuOpen(!state.open);
      }
      if (key === "h") {
        event.preventDefault();
        spoofDeathShield();
        grantProgress();
      }
    });

    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) {
        stabilizeRuntime();
        spoofDeathShield();
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
    if (state.stabilize) {
      stabilizeRuntime();
      spoofDeathShield();
    }
  }

  makeMenu();
  installHotkeys();
  setInterval(loop, 250);
})();
