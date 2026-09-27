(async function () {
  "use strict";

  var kikxApp = kikxSdk.createApp();
  var kv = new kikxSdk.KVService(kikxApp);

  var canvas = document.getElementById("board");
  var ctx = canvas.getContext("2d");

  var scoreEl = document.getElementById("score");
  var bestEl = document.getElementById("best");

  var overlay = document.getElementById("overlay");
  var titleEl = document.getElementById("title");
  var msgEl = document.getElementById("msg");
  var startBtn = document.getElementById("startBtn");
  var dpad = document.getElementById("dpad");

  /*
   * ============================================================
   * CONFIG
   * ============================================================
   */

  var GRID = 24;
  var CELL = canvas.width / GRID;

  var BASE_SPEED = 125;
  var MIN_SPEED = 55;

  var MAX_QUEUE = 3;

  /*
   * ============================================================
   * COLORS
   * ============================================================
   */

  var THEMES = {
    neon: {
      background: "#07080f",
      grid: "rgba(124,124,255,0.06)",
      bodyA: [34, 211, 238],
      bodyB: [124, 108, 255],
      head: "#a8f4ff",
      food: "#ff3d9a",
      accent: "#7c6cff",
      obstacle: "#29213e"
    },

    cyber: {
      background: "#050b08",
      grid: "rgba(0,255,150,0.06)",
      bodyA: [0, 255, 150],
      bodyB: [0, 150, 255],
      head: "#b5ffe5",
      food: "#ff3158",
      accent: "#00ff96",
      obstacle: "#142c25"
    },

    sunset: {
      background: "#10070c",
      grid: "rgba(255,130,80,0.06)",
      bodyA: [255, 180, 70],
      bodyB: [255, 70, 150],
      head: "#fff0bd",
      food: "#ff416c",
      accent: "#ff8a3d",
      obstacle: "#3b1d2a"
    },

    // 4
    ocean: {
      background: "#03131c",
      grid: "rgba(0,220,255,0.06)",
      bodyA: [0, 210, 255],
      bodyB: [30, 90, 220],
      head: "#c5f8ff",
      food: "#00ffd5",
      accent: "#00cfff",
      obstacle: "#103342"
    },

    // 5
    toxic: {
      background: "#0a1004",
      grid: "rgba(150,255,0,0.06)",
      bodyA: [170, 255, 0],
      bodyB: [40, 180, 70],
      head: "#eaffbd",
      food: "#ffea00",
      accent: "#9cff00",
      obstacle: "#203414"
    },

    // 6
    purple: {
      background: "#0c0614",
      grid: "rgba(210,100,255,0.06)",
      bodyA: [220, 90, 255],
      bodyB: [110, 50, 220],
      head: "#f0d6ff",
      food: "#ff4fd8",
      accent: "#c45cff",
      obstacle: "#2b1642"
    },

    // 7
    bloodMoon: {
      background: "#120305",
      grid: "rgba(255,50,70,0.06)",
      bodyA: [255, 50, 70],
      bodyB: [150, 20, 35],
      head: "#ffd6d9",
      food: "#ffb000",
      accent: "#ff3045",
      obstacle: "#40141a"
    },

    // 8
    arctic: {
      background: "#071219",
      grid: "rgba(170,240,255,0.07)",
      bodyA: [130, 230, 255],
      bodyB: [80, 150, 255],
      head: "#effcff",
      food: "#ffffff",
      accent: "#7eeaff",
      obstacle: "#193442"
    },

    // 9
    matrix: {
      background: "#020802",
      grid: "rgba(0,255,70,0.05)",
      bodyA: [0, 255, 70],
      bodyB: [0, 130, 40],
      head: "#caffd5",
      food: "#dfff00",
      accent: "#00ff46",
      obstacle: "#103018"
    },

    // 10
    lava: {
      background: "#140603",
      grid: "rgba(255,100,0,0.06)",
      bodyA: [255, 120, 20],
      bodyB: [220, 35, 10],
      head: "#fff0c2",
      food: "#ffe600",
      accent: "#ff5a00",
      obstacle: "#4a1a0c"
    },

    // 11
    synthwave: {
      background: "#10051c",
      grid: "rgba(255,0,220,0.07)",
      bodyA: [255, 40, 220],
      bodyB: [80, 40, 255],
      head: "#ffd6fa",
      food: "#00f5ff",
      accent: "#ff39e6",
      obstacle: "#351348"
    },

    // 12
    gold: {
      background: "#100d04",
      grid: "rgba(255,210,70,0.06)",
      bodyA: [255, 215, 70],
      bodyB: [190, 120, 20],
      head: "#fff4c4",
      food: "#ffffff",
      accent: "#ffc400",
      obstacle: "#3b2c0d"
    },

    // 13
    void: {
      background: "#000000",
      grid: "rgba(255,255,255,0.035)",
      bodyA: [180, 180, 255],
      bodyB: [70, 70, 150],
      head: "#ffffff",
      food: "#ff00ff",
      accent: "#8b5cff",
      obstacle: "#171222"
    },

    // 14
    emerald: {
      background: "#03100c",
      grid: "rgba(40,255,180,0.06)",
      bodyA: [40, 255, 180],
      bodyB: [20, 150, 100],
      head: "#d5fff0",
      food: "#ffdf4d",
      accent: "#2dffb0",
      obstacle: "#12382c"
    },

    // 15
    cherry: {
      background: "#12050a",
      grid: "rgba(255,80,130,0.06)",
      bodyA: [255, 80, 130],
      bodyB: [190, 30, 90],
      head: "#ffe0e9",
      food: "#ffffff",
      accent: "#ff4f91",
      obstacle: "#3b1424"
    }
  };

  var themeNames = Object.keys(THEMES);
  var themeIndex = 0;

  var THEME = THEMES.neon;

  function updateTheme() {
    themeIndex = (level - 1) % themeNames.length;

    THEME = THEMES[themeNames[themeIndex]];
  }

  /*
   * ============================================================
   * GAME STATE
   * ============================================================
   */

  var snake;
  var dir;
  var queue;

  var food;
  var bonusFood;

  var obstacles = [];
  var portals = [];

  var score = 0;
  var best = 0;

  var level = 1;
  var combo = 0;
  var maxCombo = 0;

  var stepMs = BASE_SPEED;

  var acc = 0;
  var last = 0;

  var state = "idle";

  /*
   * ============================================================
   * POWER UPS
   * ============================================================
   */

  var power = {
    slow: 0,
    ghost: 0,
    magnet: 0,
    double: 0,
    shield: 0
  };

  /*
   * ============================================================
   * EFFECTS
   * ============================================================
   */

  var particles = [];

  var shake = 0;
  var flash = 0;

  var deathTimer = 0;

  var foodPulse = 0;

  var gameTime = 0;

  var fruitsCollected = 0;

  var totalMoves = 0;

  var perfectMoves = 0;

  var nearMisses = 0;

  /*
   * ============================================================
   * AUDIO
   * ============================================================
   */

  var audioCtx = null;

  function initAudio() {
    if (audioCtx) {
      return;
    }

    try {
      var AudioContext = window.AudioContext;

      if (AudioContext) {
        audioCtx = new AudioContext();
      }
    } catch (e) {
      audioCtx = null;
    }
  }

  function sound(type) {
    if (!audioCtx) {
      return;
    }

    if (audioCtx.state === "suspended") {
      audioCtx.resume();
    }

    var osc = audioCtx.createOscillator();
    var gain = audioCtx.createGain();

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    var now = audioCtx.currentTime;

    var frequency = 440;
    var duration = 0.08;

    if (type === "food") {
      frequency = 620;
      duration = 0.08;
    }

    if (type === "bonus") {
      frequency = 880;
      duration = 0.16;
    }

    if (type === "power") {
      frequency = 520;
      duration = 0.2;
    }

    if (type === "level") {
      frequency = 740;
      duration = 0.25;
    }

    if (type === "hit") {
      frequency = 110;
      duration = 0.25;
    }

    if (type === "start") {
      frequency = 440;
      duration = 0.12;
    }

    if (type === "combo") {
      frequency = 980;
      duration = 0.12;
    }

    osc.frequency.setValueAtTime(frequency, now);

    if (type === "level") {
      osc.frequency.exponentialRampToValueAtTime(
        frequency * 1.8,
        now + duration
      );
    }

    if (type === "hit") {
      osc.frequency.exponentialRampToValueAtTime(40, now + duration);
    }

    gain.gain.setValueAtTime(0.001, now);

    gain.gain.exponentialRampToValueAtTime(0.08, now + 0.01);

    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.start(now);
    osc.stop(now + duration);
  }

  /*
   * ============================================================
   * STORAGE
   * ============================================================
   */

  best = await kv.getOrSet("best", 0);

  best = Number(best) || 0;

  bestEl.textContent = String(best);

  /*
   * ============================================================
   * HELPERS
   * ============================================================
   */

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function randomInt(max) {
    return Math.floor(Math.random() * max);
  }

  function sameCell(a, b) {
    return a && b && a.x === b.x && a.y === b.y;
  }

  function occupied(x, y) {
    for (var i = 0; i < snake.length; i++) {
      if (snake[i].x === x && snake[i].y === y) {
        return true;
      }
    }

    for (var j = 0; j < obstacles.length; j++) {
      if (obstacles[j].x === x && obstacles[j].y === y) {
        return true;
      }
    }

    return false;
  }

  function randomFreeCell() {
    var attempts = 200;

    while (attempts--) {
      var x = randomInt(GRID);
      var y = randomInt(GRID);

      if (!occupied(x, y)) {
        return {
          x: x,
          y: y
        };
      }
    }

    return null;
  }

  function respawnSnakeSafely() {
    var length = snake.length;
    var attempts = 200;

    while (attempts--) {
      var safe = randomFreeCell();

      if (!safe) {
        continue;
      }

      // Try horizontal placement.
      if (safe.x + length <= GRID) {
        snake = [];

        for (var i = 0; i < length; i++) {
          snake.push({
            x: safe.x + i,
            y: safe.y
          });
        }

        dir = {
          x: -1,
          y: 0
        };

        queue = [];

        return true;
      }

      // Try horizontal placement to the left.
      if (safe.x - length + 1 >= 0) {
        snake = [];

        for (var i = 0; i < length; i++) {
          snake.push({
            x: safe.x - i,
            y: safe.y
          });
        }

        dir = {
          x: 1,
          y: 0
        };

        queue = [];

        return true;
      }
    }

    return false;
  }

  /*
   * ============================================================
   * RESET
   * ============================================================
   */

  function reset() {
    THEME = THEMES.neon;
    themeIndex = 0;

    snake = [
      { x: 8, y: 12 },
      { x: 7, y: 12 },
      { x: 6, y: 12 }
    ];

    dir = {
      x: 1,
      y: 0
    };

    queue = [];

    score = 0;
    level = 1;
    combo = 0;
    maxCombo = 0;

    stepMs = BASE_SPEED;

    acc = 0;

    gameTime = 0;

    fruitsCollected = 0;
    totalMoves = 0;
    perfectMoves = 0;
    nearMisses = 0;

    power.slow = 0;
    power.ghost = 0;
    power.magnet = 0;
    power.double = 0;
    power.shield = 0;

    obstacles = [];
    portals = [];

    particles = [];

    shake = 0;
    flash = 0;

    bonusFood = null;

    scoreEl.textContent = "0";

    createObstacles();

    createPortals();

    placeFood();
  }

  /*
   * ============================================================
   * OBSTACLES
   * ============================================================
   */

  function createObstacles() {
    obstacles = [];

    var count = Math.min(18, Math.floor(level / 2));

    for (var i = 0; i < count; i++) {
      var cell = randomFreeCell();

      if (cell) {
        obstacles.push(cell);
      }
    }
  }

  /*
   * ============================================================
   * PORTALS
   * ============================================================
   */

  function createPortals() {
    portals = [];

    if (level < 4) {
      return;
    }

    var a = randomFreeCell();
    var b = randomFreeCell();

    if (!a || !b || sameCell(a, b)) {
      return;
    }

    portals.push({
      x: a.x,
      y: a.y
    });

    portals.push({
      x: b.x,
      y: b.y
    });
  }

  function teleportIfNeeded(head) {
    if (portals.length !== 2) {
      return;
    }

    if (sameCell(head, portals[0])) {
      head.x = portals[1].x;
      head.y = portals[1].y;

      addParticles(
        head.x * CELL + CELL / 2,
        head.y * CELL + CELL / 2,
        THEME.accent,
        14
      );

      sound("power");
    } else if (sameCell(head, portals[1])) {
      head.x = portals[0].x;
      head.y = portals[0].y;

      addParticles(
        head.x * CELL + CELL / 2,
        head.y * CELL + CELL / 2,
        THEME.accent,
        14
      );

      sound("power");
    }
  }

  /*
   * ============================================================
   * FOOD
   * ============================================================
   */

  function placeFood() {
    food = randomFreeCell();

    if (Math.random() < 0.08) {
      bonusFood = randomFreeCell();
    } else {
      bonusFood = null;
    }
  }

  /*
   * ============================================================
   * DIRECTION
   * ============================================================
   */

  function setDir(nx, ny) {
    var cur = queue.length ? queue[queue.length - 1] : dir;

    if (cur.x === -nx && cur.y === -ny) {
      return;
    }

    if (cur.x === nx && cur.y === ny) {
      return;
    }

    if (queue.length >= MAX_QUEUE) {
      return;
    }

    queue.push({
      x: nx,
      y: ny
    });
  }

  /*
   * ============================================================
   * POWER UPS
   * ============================================================
   */

  function activateRandomPower(x, y) {
    var types = ["slow", "ghost", "magnet", "double", "shield"];

    var type = types[randomInt(types.length)];

    power[type] = 5000;

    addParticles(x, y, "#ffffff", 24);

    flash = 0.18;

    sound("power");
  }

  function updatePower(dt) {
    var keys = Object.keys(power);

    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];

      if (power[key] > 0) {
        power[key] -= dt;

        if (power[key] < 0) {
          power[key] = 0;
        }
      }
    }
  }

  /*
   * ============================================================
   * STEP
   * ============================================================
   */

  function step() {
    if (queue.length) {
      dir = queue.shift();
    }

    var head = {
      x: snake[0].x + dir.x,
      y: snake[0].y + dir.y
    };

    /*
     * Wrap walls.
     */

    if (head.x < 0) {
      head.x = GRID - 1;
    }

    if (head.x >= GRID) {
      head.x = 0;
    }

    if (head.y < 0) {
      head.y = GRID - 1;
    }

    if (head.y >= GRID) {
      head.y = 0;
    }

    teleportIfNeeded(head);

    /*
     * Obstacle collision.
     */

    if (!power.ghost) {
      for (var o = 0; o < obstacles.length; o++) {
        if (sameCell(head, obstacles[o])) {
          if (power.shield) {
            power.shield = 0;

            if (respawnSnakeSafely()) {
              power.ghost = 3000; // 3 seconds of invincibility
              addParticles(
                snake[0].x * CELL + CELL / 2,
                snake[0].y * CELL + CELL / 2,
                "#ffffff",
                30
              );

              shake = 10;
              return;
            }
          }

          return gameOver();
        }
      }
    }

    /*
     * Magnet.
     */

    if (power.magnet && food) {
      var mdx = food.x - head.x;
      var mdy = food.y - head.y;

      if (Math.abs(mdx) + Math.abs(mdy) <= 3) {
        food.x += mdx === 0 ? 0 : mdx > 0 ? -1 : 1;

        food.y += mdy === 0 ? 0 : mdy > 0 ? -1 : 1;
      }
    }

    /*
     * Food.
     */

    var growing = food && sameCell(head, food);

    var eatingBonus = bonusFood && sameCell(head, bonusFood);

    /*
     * Tail collision.
     */

    var checkLen = growing || eatingBonus ? snake.length : snake.length - 1;

    if (!power.ghost) {
      for (var i = 0; i < checkLen; i++) {
        if (snake[i].x === head.x && snake[i].y === head.y) {
          if (power.shield) {
            power.shield = 0;

            if (respawnSnakeSafely()) {
              power.ghost = 3000; // 3 seconds of invincibility
              addParticles(
                snake[0].x * CELL + CELL / 2,
                snake[0].y * CELL + CELL / 2,
                "#ffffff",
                30
              );

              shake = 10;
              return;
            }
          }

          return gameOver();
        }
      }
    }

    snake.unshift(head);

    totalMoves++;

    /*
     * Near miss detection.
     */

    var danger = false;

    for (var d = 0; d < Math.min(5, snake.length - 1); d++) {
      var sx = snake[d].x;
      var sy = snake[d].y;

      if (Math.abs(sx - head.x) + Math.abs(sy - head.y) <= 1) {
        danger = true;
        break;
      }
    }

    if (danger) {
      nearMisses++;
      shake = Math.max(shake, 2);
    }

    /*
     * Eat normal food.
     */

    if (growing) {
      eatFood(false);
    } else if (!eatingBonus) {
      snake.pop();
    }

    /*
     * Eat bonus food.
     */

    if (eatingBonus) {
      eatFood(true);
    }

    /*
     * Random power-up.
     */

    if ((growing || eatingBonus) && Math.random() < 0.18) {
      activateRandomPower(head.x * CELL + CELL / 2, head.y * CELL + CELL / 2);
    }

    /*
     * Update speed.
     */

    updateLevel();
  }

  /*
   * ============================================================
   * EAT
   * ============================================================
   */

  function eatFood(bonus) {
    fruitsCollected++;

    combo++;

    if (combo > maxCombo) {
      maxCombo = combo;
    }

    var multiplier = 1 + Math.floor(combo / 5);

    if (power.double) {
      multiplier *= 2;
    }

    var gained = bonus ? 10 * multiplier : multiplier;

    score += gained;

    scoreEl.textContent = String(score);

    var head = snake[0];

    addParticles(
      head.x * CELL + CELL / 2,
      head.y * CELL + CELL / 2,
      bonus ? "#ffe66d" : THEME.food,
      bonus ? 30 : 18
    );

    shake = bonus ? 8 : 3;

    flash = bonus ? 0.25 : 0.08;

    sound(bonus ? "bonus" : combo >= 5 ? "combo" : "food");

    if (bonus) {
      bonusFood = null;
    } else {
      placeFood();
    }

    /*
     * Combo timeout is refreshed.
     */

    comboTimer = 1800;
  }

  /*
   * ============================================================
   * LEVEL
   * ============================================================
   */

  function updateLevel() {
    var next = Math.floor(score / 10) + 1;

    if (next > level) {
      level = next;

      updateTheme();

      stepMs = Math.max(MIN_SPEED, BASE_SPEED - (level - 1) * 5);

      createObstacles();
      createPortals();

      addParticles(canvas.width / 2, canvas.height / 2, THEME.accent, 50);

      flash = 0.3;
      shake = 8;

      sound("level");
    }
  }

  /*
   * ============================================================
   * COMBO
   * ============================================================
   */

  var comboTimer = 0;

  function updateCombo(dt) {
    if (combo <= 0) {
      return;
    }

    comboTimer -= dt;

    if (comboTimer <= 0) {
      combo = 0;
      comboTimer = 0;
    }
  }

  /*
   * ============================================================
   * PARTICLES
   * ============================================================
   */

  function addParticles(x, y, color, amount) {
    for (var i = 0; i < amount; i++) {
      var angle = Math.random() * Math.PI * 2;

      var speed = 30 + Math.random() * 130;

      particles.push({
        x: x,
        y: y,

        vx: Math.cos(angle) * speed,

        vy: Math.sin(angle) * speed,

        life: 0.4 + Math.random() * 0.6,

        maxLife: 1,

        size: 1.5 + Math.random() * 4,

        color: color
      });
    }
  }

  function updateParticles(dt) {
    for (var i = particles.length - 1; i >= 0; i--) {
      var p = particles[i];

      p.life -= dt / 1000;

      p.x += (p.vx * dt) / 1000;

      p.y += (p.vy * dt) / 1000;

      p.vx *= 0.98;
      p.vy *= 0.98;

      if (p.life <= 0) {
        particles.splice(i, 1);
      }
    }
  }

  function drawParticles() {
    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];

      ctx.globalAlpha = Math.max(0, p.life);

      ctx.fillStyle = p.color;

      ctx.beginPath();

      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);

      ctx.fill();
    }

    ctx.globalAlpha = 1;
  }

  /*
   * ============================================================
   * DRAW HELPERS
   * ============================================================
   */

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();

    ctx.moveTo(x + r, y);

    ctx.arcTo(x + w, y, x + w, y + h, r);

    ctx.arcTo(x + w, y + h, x, y + h, r);

    ctx.arcTo(x, y + h, x, y, r);

    ctx.arcTo(x, y, x + w, y, r);

    ctx.closePath();
  }

  /*
   * ============================================================
   * DRAW
   * ============================================================
   */

  function draw() {
    var sx = shake > 0 ? (Math.random() - 0.5) * shake : 0;

    var sy = shake > 0 ? (Math.random() - 0.5) * shake : 0;

    ctx.save();

    ctx.translate(sx, sy);

    /*
     * Background.
     */

    ctx.fillStyle = THEME.background;

    ctx.fillRect(-20, -20, canvas.width + 40, canvas.height + 40);

    /*
     * Grid.
     */

    ctx.fillStyle = THEME.grid;

    for (var y = 0; y < GRID; y++) {
      for (var x = 0; x < GRID; x++) {
        ctx.fillRect(
          x * CELL + CELL / 2 - 1,

          y * CELL + CELL / 2 - 1,

          2,
          2
        );
      }
    }

    /*
     * Portals.
     */

    drawPortals();

    /*
     * Obstacles.
     */

    drawObstacles();

    /*
     * Food.
     */

    drawFood(food, false);

    drawFood(bonusFood, true);

    /*
     * Snake.
     */

    drawSnake();

    /*
     * Particles.
     */

    drawParticles();

    /*
     * HUD inside canvas.
     */

    drawCanvasHud();

    /*
     * Flash.
     */

    if (flash > 0) {
      ctx.fillStyle = "rgba(255,255,255," + flash + ")";

      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    ctx.restore();
  }

  /*
   * ============================================================
   * DRAW FOOD
   * ============================================================
   */

  function drawFood(item, bonus) {
    if (!item) {
      return;
    }

    var cx = item.x * CELL + CELL / 2;

    var cy = item.y * CELL + CELL / 2;

    var pulse = 1 + Math.sin(foodPulse * 0.008) * 0.12;

    var color = bonus ? "#ffe66d" : THEME.food;

    ctx.save();

    ctx.shadowColor = color;

    ctx.shadowBlur = bonus ? 28 : 18;

    ctx.fillStyle = color;

    ctx.beginPath();

    ctx.arc(cx, cy, CELL * 0.3 * pulse, 0, Math.PI * 2);

    ctx.fill();

    /*
     * Bonus star.
     */

    if (bonus) {
      ctx.strokeStyle = "#ffffff";

      ctx.lineWidth = 2;

      ctx.beginPath();

      for (var i = 0; i < 5; i++) {
        var angle = -Math.PI / 2 + (i * Math.PI * 2) / 5;

        var x = cx + Math.cos(angle) * CELL * 0.42;

        var y = cy + Math.sin(angle) * CELL * 0.42;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }

      ctx.closePath();

      ctx.stroke();
    }

    ctx.restore();
  }

  /*
   * ============================================================
   * DRAW OBSTACLES
   * ============================================================
   */

  function drawObstacles() {
    for (var i = 0; i < obstacles.length; i++) {
      var o = obstacles[i];

      ctx.save();

      ctx.fillStyle = THEME.obstacle;

      ctx.shadowColor = THEME.accent;

      ctx.shadowBlur = 5;

      roundRect(o.x * CELL + 2, o.y * CELL + 2, CELL - 4, CELL - 4, 5);

      ctx.fill();

      ctx.restore();
    }
  }

  /*
   * ============================================================
   * DRAW PORTALS
   * ============================================================
   */

  function drawPortals() {
    for (var i = 0; i < portals.length; i++) {
      var p = portals[i];

      var cx = p.x * CELL + CELL / 2;

      var cy = p.y * CELL + CELL / 2;

      ctx.save();

      ctx.strokeStyle = THEME.accent;

      ctx.shadowColor = THEME.accent;

      ctx.shadowBlur = 12;

      ctx.lineWidth = 2;

      ctx.beginPath();

      ctx.arc(
        cx,
        cy,
        CELL * 0.35,
        foodPulse * 0.004,
        foodPulse * 0.004 + Math.PI * 1.5
      );

      ctx.stroke();

      ctx.restore();
    }
  }

  /*
   * ============================================================
   * DRAW SNAKE
   * ============================================================
   */

  function drawSnake() {
    for (var i = snake.length - 1; i >= 0; i--) {
      var s = snake[i];

      var f = i / Math.max(1, snake.length - 1);

      var alpha = power.ghost ? 0.65 : 1;

      if (i === 0) {
        drawHead(s, alpha);

        continue;
      }

      var r = Math.round(
        THEME.bodyA[0] + (THEME.bodyB[0] - THEME.bodyA[0]) * f
      );

      var g = Math.round(
        THEME.bodyA[1] + (THEME.bodyB[1] - THEME.bodyA[1]) * f
      );

      var b = Math.round(
        THEME.bodyA[2] + (THEME.bodyB[2] - THEME.bodyA[2]) * f
      );

      ctx.globalAlpha = alpha;

      ctx.fillStyle = "rgb(" + r + "," + g + "," + b + ")";

      roundRect(s.x * CELL + 1, s.y * CELL + 1, CELL - 2, CELL - 2, 5);

      ctx.fill();
    }

    ctx.globalAlpha = 1;
  }

  /*
   * ============================================================
   * HEAD
   * ============================================================
   */

  function drawHead(s, alpha) {
    ctx.save();

    ctx.globalAlpha = alpha;

    ctx.fillStyle = THEME.head;

    ctx.shadowColor = THEME.head;

    ctx.shadowBlur = power.shield ? 24 : 14;

    roundRect(s.x * CELL + 1, s.y * CELL + 1, CELL - 2, CELL - 2, 6);

    ctx.fill();

    /*
     * Shield ring.
     */

    if (power.shield) {
      ctx.strokeStyle = "#ffffff";

      ctx.lineWidth = 2;

      ctx.beginPath();

      ctx.arc(
        s.x * CELL + CELL / 2,
        s.y * CELL + CELL / 2,
        CELL * 0.55,
        0,
        Math.PI * 2
      );

      ctx.stroke();
    }

    /*
     * Eyes.
     */

    var centerX = s.x * CELL + CELL / 2;

    var centerY = s.y * CELL + CELL / 2;

    var sideX = -dir.y * CELL * 0.13;

    var sideY = dir.x * CELL * 0.13;

    var forwardX = dir.x * CELL * 0.16;

    var forwardY = dir.y * CELL * 0.16;

    drawEye(
      centerX + forwardX + sideX,

      centerY + forwardY + sideY
    );

    drawEye(
      centerX + forwardX - sideX,

      centerY + forwardY - sideY
    );

    ctx.restore();
  }

  function drawEye(x, y) {
    ctx.fillStyle = "#10121c";

    ctx.beginPath();

    ctx.arc(x, y, CELL * 0.055, 0, Math.PI * 2);

    ctx.fill();
  }

  /*
   * ============================================================
   * CANVAS HUD
   * ============================================================
   */

  function drawCanvasHud() {
    ctx.save();

    ctx.font = "bold 12px system-ui";

    ctx.textBaseline = "top";

    ctx.fillStyle = "rgba(255,255,255,0.7)";

    ctx.fillText("LV " + level, 8, 8);

    if (combo > 1) {
      ctx.fillStyle = "#ffe66d";

      ctx.fillText("x" + (1 + Math.floor(combo / 5)) + " COMBO", 8, 25);
    }

    /*
     * Active powers.
     */

    var powers = [];

    if (power.slow) {
      powers.push("SLOW");
    }

    if (power.ghost) {
      powers.push("GHOST");
    }

    if (power.magnet) {
      powers.push("MAGNET");
    }

    if (power.double) {
      powers.push("2X");
    }

    if (power.shield) {
      powers.push("SHIELD");
    }

    if (powers.length) {
      ctx.fillStyle = "#ffffff";

      ctx.fillText(powers.join(" • "), 8, canvas.height - 18);
    }

    ctx.restore();
  }

  /*
   * ============================================================
   * UPDATE
   * ============================================================
   */

  function update(dt) {
    gameTime += dt;

    foodPulse += dt;

    if (shake > 0) {
      shake -= dt * 0.04;

      if (shake < 0) {
        shake = 0;
      }
    }

    if (flash > 0) {
      flash -= dt * 0.001;

      if (flash < 0) {
        flash = 0;
      }
    }

    updateParticles(dt);

    updatePower(dt);

    updateCombo(dt);
  }

  /*
   * ============================================================
   * GAME LOOP
   * ============================================================
   */

  function loop(now) {
    if (state !== "running") {
      return;
    }

    var dt = now - last;

    last = now;

    update(dt);

    var speed = stepMs;

    if (power.slow) {
      speed *= 1.65;
    }

    acc += dt;

    var guard = 0;

    while (acc >= speed && guard < 8) {
      acc -= speed;

      step();

      guard++;

      if (state !== "running") {
        break;
      }
    }

    draw();

    if (state === "running") {
      requestAnimationFrame(loop);
    }
  }

  /*
   * ============================================================
   * BEST SCORE
   * ============================================================
   */

  async function saveBest() {
    if (score <= best) {
      return;
    }

    best = score;

    bestEl.textContent = String(best);

    try {
      await kv.set("best", best);
    } catch (e) {
      console.warn("Could not save best score", e);
    }
  }

  /*
   * ============================================================
   * ACHIEVEMENTS
   * ============================================================
   */

  async function unlockAchievement(id) {
    try {
      var key = "achievement_" + id;

      var unlocked = await kv.get(key);

      if (unlocked) {
        return;
      }

      await kv.set(key, true);

      showToast("Achievement unlocked: " + id);
    } catch (e) {
      console.warn("Achievement error", e);
    }
  }

  function checkAchievements() {
    if (score >= 10) {
      unlockAchievement("10 POINTS");
    }

    if (score >= 50) {
      unlockAchievement("50 POINTS");
    }

    if (score >= 100) {
      unlockAchievement("CENTURY");
    }

    if (maxCombo >= 10) {
      unlockAchievement("COMBO MASTER");
    }

    if (nearMisses >= 10) {
      unlockAchievement("CLOSE CALL");
    }
  }

  /*
   * ============================================================
   * TOAST
   * ============================================================
   */

  var toastTimer = 0;
  var toastText = "";

  function showToast(text) {
    toastText = text;
    toastTimer = 2200;
  }

  function drawToast() {
    if (toastTimer <= 0) {
      return;
    }

    ctx.save();

    ctx.globalAlpha = Math.min(1, toastTimer / 300);

    var textWidth = ctx.measureText(toastText).width;

    ctx.fillStyle = "rgba(10,10,20,0.9)";

    roundRect(
      canvas.width / 2 - textWidth / 2 - 20,

      canvas.height / 2 - 20,

      textWidth + 40,
      40,
      12
    );

    ctx.fill();

    ctx.fillStyle = "#ffffff";

    ctx.font = "bold 13px system-ui";

    ctx.textAlign = "center";

    ctx.textBaseline = "middle";

    ctx.fillText(toastText, canvas.width / 2, canvas.height / 2);

    ctx.restore();
  }

  /*
   * ============================================================
   * GAME OVER
   * ============================================================
   */

  async function gameOver() {
    if (state === "over") {
      return;
    }

    state = "over";

    sound("hit");

    shake = 18;

    flash = 0.4;

    addParticles(
      snake[0].x * CELL + CELL / 2,

      snake[0].y * CELL + CELL / 2,

      "#ff3d9a",

      60
    );

    await saveBest();

    checkAchievements();

    draw();

    showOverlay(
      "Game Over",

      "Score: " + score + " • Level: " + level + " • Best: " + best,

      "Play again"
    );
  }

  /*
   * ============================================================
   * WIN
   * ============================================================
   */

  async function win() {
    state = "over";

    sound("level");

    addParticles(canvas.width / 2, canvas.height / 2, "#ffffff", 120);

    await saveBest();

    showOverlay(
      "Perfect Run! 🎉",

      "You filled the board with " + score + " points.",

      "Play again"
    );
  }

  /*
   * ============================================================
   * PAUSE
   * ============================================================
   */

  function pause() {
    if (state !== "running") {
      return;
    }

    state = "paused";

    showOverlay("Paused", "Ready to continue?", "Resume");
  }

  function resume() {
    if (state !== "paused") {
      return;
    }

    state = "running";

    overlay.classList.add("hidden");

    last = performance.now();

    requestAnimationFrame(loop);
  }

  /*
   * ============================================================
   * START
   * ============================================================
   */

  async function start() {
    initAudio();

    if (audioCtx && audioCtx.state === "suspended") {
      audioCtx.resume();
    }

    reset();

    state = "running";

    overlay.classList.add("hidden");

    sound("start");

    last = performance.now();

    requestAnimationFrame(loop);
  }

  /*
   * ============================================================
   * OVERLAY
   * ============================================================
   */

  function showOverlay(title, msg, btn) {
    titleEl.textContent = title;

    msgEl.textContent = msg;

    startBtn.textContent = btn;

    overlay.classList.remove("hidden");
  }

  /*
   * ============================================================
   * KEYBOARD
   * ============================================================
   */

  var KEYS = {
    ArrowUp: [0, -1],
    KeyW: [0, -1],

    ArrowDown: [0, 1],
    KeyS: [0, 1],

    ArrowLeft: [-1, 0],
    KeyA: [-1, 0],

    ArrowRight: [1, 0],
    KeyD: [1, 0]
  };

  window.addEventListener("keydown", function (e) {
    if (KEYS[e.code]) {
      e.preventDefault();

      if (state === "running") {
        setDir(KEYS[e.code][0], KEYS[e.code][1]);
      }

      return;
    }

    /*
     * Pause.
     */

    if (e.code === "KeyP") {
      e.preventDefault();

      if (state === "running") {
        pause();
      } else if (state === "paused") {
        resume();
      }

      return;
    }

    /*
     * Start.
     */

    if (e.code === "Space") {
      e.preventDefault();

      if (state === "idle" || state === "over") {
        start();
      } else if (state === "paused") {
        resume();
      }

      return;
    }

    /*
     * Theme.
     */

    if (e.code === "KeyT") {
      themeIndex++;

      if (themeIndex >= themeNames.length) {
        themeIndex = 0;
      }

      THEME = THEMES[themeNames[themeIndex]];

      draw();
    }
  });

  /*
   * ============================================================
   * BUTTON
   * ============================================================
   */

  startBtn.addEventListener("click", function () {
    if (state === "paused") {
      resume();
    } else {
      start();
    }
  });

  /*
   * ============================================================
   * MOBILE D-PAD
   * ============================================================
   */

  if (dpad) {
    var DPAD_DIRECTIONS = {
      up: [0, -1],
      down: [0, 1],
      left: [-1, 0],
      right: [1, 0]
    };

    dpad.querySelectorAll(".dpad-btn").forEach(function (button) {
      function handleDirection(e) {
        e.preventDefault();

        initAudio();

        var direction = button.dataset.direction;

        var vector = DPAD_DIRECTIONS[direction];

        if (!vector) {
          return;
        }

        if (state === "idle" || state === "over") {
          start();
        }

        if (state !== "running") {
          return;
        }

        setDir(vector[0], vector[1]);
      }

      button.addEventListener("pointerdown", handleDirection);

      button.addEventListener("contextmenu", function (e) {
        e.preventDefault();
      });
    });
  }

  /*
   * ============================================================
   * SWIPE
   * ============================================================
   */

  var tStart = null;

  canvas.addEventListener(
    "touchstart",
    function (e) {
      tStart = e.changedTouches[0];
    },
    {
      passive: true
    }
  );

  canvas.addEventListener(
    "touchend",
    function (e) {
      if (!tStart) {
        return;
      }

      initAudio();

      var t = e.changedTouches[0];

      var dx = t.clientX - tStart.clientX;

      var dy = t.clientY - tStart.clientY;

      tStart = null;

      /*
       * Tap.
       */

      if (Math.abs(dx) < 24 && Math.abs(dy) < 24) {
        if (state !== "running") {
          start();
        }

        return;
      }

      if (state !== "running") {
        return;
      }

      if (Math.abs(dx) > Math.abs(dy)) {
        setDir(dx > 0 ? 1 : -1, 0);
      } else {
        setDir(0, dy > 0 ? 1 : -1);
      }
    },
    {
      passive: true
    }
  );

  /*
   * ============================================================
   * VISIBILITY
   * ============================================================
   */

  document.addEventListener("visibilitychange", function () {
    if (document.hidden) {
      pause();
    }
  });

  kikxApp.onBlur(pause);

  /*
   * ============================================================
   * EFFECT LOOP
   * ============================================================
   */

  function effectsLoop(now) {
    if (toastTimer > 0) {
      toastTimer -= 16;
    }

    /*
     * Draw effects even while
     * paused/game over.
     */

    if (state !== "running") {
      updateParticles(16);
      draw();
      drawToast();
    }

    requestAnimationFrame(effectsLoop);
  }

  /*
   * ============================================================
   * BOOT
   * ============================================================
   */

  state = "idle";

  reset();

  draw();

  requestAnimationFrame(effectsLoop);
})();
