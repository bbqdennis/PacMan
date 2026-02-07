import { cloneMaze, createMazeApi, roundCenter, isNearCenter } from "./maze.js";
import { updatePacman } from "./pacman.js";
import { createGhosts, updateGhostMode, updateGhosts } from "./ghosts.js";
import { consumePlayerTile, checkGhostCollisions } from "./collisions.js";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const TILE = 20;
const HUD_HEIGHT = 120;
const MAZE_TOP = HUD_HEIGHT;

const PLAYER_SPEED = 84;
const GHOST_SPEED = 74;
const FRIGHTENED_SPEED = 52;
const EATEN_SPEED = 132;
const FRIGHTENED_DURATION = 8;
const LIFE_LOST_PAUSE = 1.1;
const START_DELAY = 1.5;
const START_LIVES = 3;
const GHOST_RESPAWN_DELAY = 2.2;

const MODE_SCHEDULE = [
  { mode: "scatter", duration: 7 },
  { mode: "chase", duration: 20 },
  { mode: "scatter", duration: 7 },
  { mode: "chase", duration: 20 },
  { mode: "scatter", duration: 5 },
  { mode: "chase", duration: 20 },
  { mode: "scatter", duration: 5 },
  { mode: "chase", duration: Infinity },
];

const DIRS = {
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
};

const KEY_TO_DIR = {
  ArrowLeft: "left",
  ArrowRight: "right",
  ArrowUp: "up",
  ArrowDown: "down",
  KeyA: "left",
  KeyD: "right",
  KeyW: "up",
  KeyS: "down",
};

const GHOST_META = [
  { name: "blinky", color: "#ff3232", home: { x: 13.5, y: 11.5 }, release: 0, scatter: { x: 26.5, y: 0.5 } },
  { name: "pinky", color: "#ff9ed9", home: { x: 14.5, y: 13.5 }, release: 4, scatter: { x: 1.5, y: 0.5 } },
  { name: "inky", color: "#50f5ff", home: { x: 12.5, y: 13.5 }, release: 8, scatter: { x: 26.5, y: 28.5 } },
  { name: "clyde", color: "#ffb347", home: { x: 15.5, y: 13.5 }, release: 12, scatter: { x: 1.5, y: 28.5 } },
];

const state = {
  mode: "start",
  level: 1,
  score: 0,
  highScore: 0,
  lives: START_LIVES,
  maze: [],
  pelletsLeft: 0,
  frightenedTimer: 0,
  ghostEatChain: 0,
  lifeLostTimer: 0,
  startTimer: START_DELAY,
  elapsed: 0,
  modeTimer: 0,
  modePhase: 0,
  ghostMode: "scatter",
  fruit: null,
  fruitSpawnedAt: new Set(),
  player: null,
  ghosts: [],
};

const mazeApi = createMazeApi(state);
const { tileAt, setTile, canMoveTo, warpEntity } = mazeApi;

function reverseDirection(entity) {
  if (entity.dir === "left") entity.dir = "right";
  else if (entity.dir === "right") entity.dir = "left";
  else if (entity.dir === "up") entity.dir = "down";
  else if (entity.dir === "down") entity.dir = "up";
}

function setupGhostModes() {
  state.modeTimer = MODE_SCHEDULE[0].duration;
  state.modePhase = 0;
  state.ghostMode = MODE_SCHEDULE[0].mode;
}

function placeInitialEntities() {
  state.player = {
    x: 13.5,
    y: 21.5,
    dir: "left",
    nextDir: "left",
    mouth: 0,
  };
  state.ghosts = createGhosts(GHOST_META);
}

function resetLevel() {
  state.maze = cloneMaze();
  state.pelletsLeft = 0;

  for (let y = 0; y < state.maze.length; y++) {
    for (let x = 0; x < state.maze[y].length; x++) {
      if (state.maze[y][x] === "." || state.maze[y][x] === "o") state.pelletsLeft++;
    }
  }

  state.frightenedTimer = 0;
  state.ghostEatChain = 0;
  state.lifeLostTimer = 0;
  state.startTimer = START_DELAY;
  state.fruit = null;
  state.fruitSpawnedAt = new Set();
  placeInitialEntities();
  setupGhostModes();
}

function startNewGame() {
  state.level = 1;
  state.score = 0;
  state.lives = START_LIVES;
  state.mode = "playing";
  resetLevel();
}

function loseLife() {
  state.lives--;
  if (state.lives <= 0) {
    state.mode = "game_over";
    state.highScore = Math.max(state.highScore, state.score);
    return;
  }

  state.mode = "life_lost";
  state.lifeLostTimer = LIFE_LOST_PAUSE;
  placeInitialEntities();
  setupGhostModes();
  state.frightenedTimer = 0;
  state.startTimer = START_DELAY;
}

function completeLevel() {
  state.level++;
  state.score += 1000;
  resetLevel();
}

function stepEntity(entity, speed, dt, opts = {}) {
  const dir = DIRS[entity.dir];
  if (!dir) return false;
  let moved = false;

  if (dir.x !== 0 && Math.abs(entity.y - roundCenter(entity.y)) < 0.15) {
    entity.y = roundCenter(entity.y);
  }
  if (dir.y !== 0 && Math.abs(entity.x - roundCenter(entity.x)) < 0.15) {
    entity.x = roundCenter(entity.x);
  }

  if (isNearCenter(entity, 0.01)) {
    entity.x = roundCenter(entity.x);
    entity.y = roundCenter(entity.y);
  }

  if (canMoveTo(entity.x, entity.y, dir, opts)) {
    entity.x += dir.x * speed * dt;
    entity.y += dir.y * speed * dt;
    moved = true;
  } else {
    entity.x = roundCenter(entity.x);
    entity.y = roundCenter(entity.y);
  }

  warpEntity(entity);
  return moved;
}

function update(dt) {
  state.elapsed += dt;

  if (state.mode === "life_lost") {
    state.lifeLostTimer -= dt;
    if (state.lifeLostTimer <= 0) state.mode = "playing";
    return;
  }

  if (state.mode !== "playing") return;

  if (state.startTimer > 0) {
    state.startTimer -= dt;
    return;
  }

  if (state.fruit) {
    state.fruit.timer -= dt;
    if (state.fruit.timer <= 0) state.fruit = null;
  }

  if (state.frightenedTimer > 0) {
    state.frightenedTimer -= dt;
    if (state.frightenedTimer <= 0) {
      state.frightenedTimer = 0;
      state.ghostEatChain = 0;
      for (const ghost of state.ghosts) {
        if (!ghost.eaten) ghost.frightened = false;
      }
    }
  }

  updateGhostMode(state, dt, { MODE_SCHEDULE, reverseDirection });

  updatePacman(state, dt, {
    DIRS,
    PLAYER_SPEED,
    TILE,
    canMoveTo,
    roundCenter,
    isNearCenter,
    stepEntity,
  });

  consumePlayerTile(state, {
    tileAt,
    setTile,
    reverseDirection,
    FRIGHTENED_DURATION,
    completeLevel,
  });

  updateGhosts(state, dt, {
    DIRS,
    TILE,
    GHOST_SPEED,
    FRIGHTENED_SPEED,
    EATEN_SPEED,
    GHOST_RESPAWN_DELAY,
    roundCenter,
    isNearCenter,
    tileAt,
    canMoveTo,
    stepEntity,
  });

  checkGhostCollisions(state, loseLife);
}

function drawMaze() {
  const h = state.maze.length;
  const w = state.maze[0].length;
  ctx.fillStyle = "#000";
  ctx.fillRect(0, MAZE_TOP, w * TILE, h * TILE);

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const tile = state.maze[y][x];
      const px = x * TILE;
      const py = MAZE_TOP + y * TILE;

      if (tile === "#") {
        ctx.fillStyle = "#0a2fff";
        ctx.fillRect(px + 1, py + 1, TILE - 2, TILE - 2);
        ctx.fillStyle = "#79abff";
        ctx.fillRect(px + 5, py + 5, TILE - 10, TILE - 10);
      } else if (tile === "=") {
        ctx.fillStyle = "#ffb3d9";
        ctx.fillRect(px + 2, py + TILE / 2 - 1.5, TILE - 4, 3);
      } else if (tile === "." || tile === "o") {
        ctx.fillStyle = tile === "o" ? "#ffd9d9" : "#f4df95";
        const pulse = tile === "o" ? 4.1 + Math.sin(state.elapsed * 8) * 0.7 : 1.9;
        ctx.beginPath();
        ctx.arc(px + TILE / 2, py + TILE / 2, pulse, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}

function drawPacman() {
  const p = state.player;
  const px = p.x * TILE;
  const py = MAZE_TOP + p.y * TILE;
  const mouthOpen = 0.22 + Math.abs(Math.sin(p.mouth)) * 0.26;

  let base = 0;
  if (p.dir === "right") base = 0;
  if (p.dir === "left") base = Math.PI;
  if (p.dir === "up") base = -Math.PI / 2;
  if (p.dir === "down") base = Math.PI / 2;

  ctx.fillStyle = "#ffd400";
  ctx.beginPath();
  ctx.moveTo(px, py);
  ctx.arc(px, py, TILE * 0.4, base + mouthOpen, base - mouthOpen + Math.PI * 2);
  ctx.closePath();
  ctx.fill();
}

function drawGhost(ghost) {
  const px = ghost.x * TILE;
  const py = MAZE_TOP + ghost.y * TILE;
  const bodyW = TILE * 0.86;
  const bodyH = TILE * 0.92;
  const left = px - bodyW / 2;
  const top = py - bodyH / 2;
  const wave = Math.sin(state.elapsed * 11 + px * 0.03) * 1.2;

  let color = ghost.color;
  if (ghost.eaten) color = "#111";
  else if (ghost.frightened) {
    const flash = state.frightenedTimer < 2 && Math.floor(state.elapsed * 10) % 2 === 0;
    color = flash ? "#f7f7f7" : "#2b4dff";
  }

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(px, top + bodyW / 2, bodyW / 2, Math.PI, 0);
  ctx.lineTo(left + bodyW, top + bodyH - 4);
  for (let i = 0; i < 4; i++) {
    const x = left + bodyW - i * (bodyW / 4);
    const y = top + bodyH - (i % 2 === 0 ? 5 + wave : 1 + wave);
    ctx.lineTo(x, y);
  }
  ctx.lineTo(left, top + bodyW / 2);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(px - 5, py - 2, 4, 0, Math.PI * 2);
  ctx.arc(px + 5, py - 2, 4, 0, Math.PI * 2);
  ctx.fill();

  const eyeDir = ghost.eaten ? { x: 0, y: 0 } : DIRS[ghost.dir] || DIRS.left;
  ctx.fillStyle = "#1935c9";
  ctx.beginPath();
  ctx.arc(px - 5 + eyeDir.x * 1.8, py - 2 + eyeDir.y * 1.8, 2, 0, Math.PI * 2);
  ctx.arc(px + 5 + eyeDir.x * 1.8, py - 2 + eyeDir.y * 1.8, 2, 0, Math.PI * 2);
  ctx.fill();
}

function drawFruit() {
  if (!state.fruit) return;
  const px = state.fruit.x * TILE;
  const py = MAZE_TOP + state.fruit.y * TILE;

  ctx.fillStyle = "#df2727";
  ctx.beginPath();
  ctx.arc(px - 3, py + 2, 5, 0, Math.PI * 2);
  ctx.arc(px + 3, py + 2, 5, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#68d04c";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(px, py - 7);
  ctx.lineTo(px + 3, py - 10);
  ctx.stroke();
}

function drawLives() {
  for (let i = 0; i < state.lives; i++) {
    const x = 28 + i * 26;
    const y = 84;
    ctx.fillStyle = "#ffd400";
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.arc(x, y, 10, 0.35, Math.PI * 1.65);
    ctx.closePath();
    ctx.fill();
  }
}

function drawHUD() {
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, canvas.width, HUD_HEIGHT);

  ctx.fillStyle = "#fff";
  ctx.textAlign = "left";
  ctx.font = "bold 14px Verdana";
  ctx.fillText("1UP", 22, 20);
  ctx.textAlign = "center";
  ctx.fillText("HIGH SCORE", canvas.width / 2, 20);

  ctx.font = "bold 32px monospace";
  ctx.fillStyle = "#fff";
  ctx.textAlign = "left";
  ctx.fillText(state.score.toString().padStart(5, "0"), 22, 54);
  ctx.textAlign = "center";
  ctx.fillText(state.highScore.toString().padStart(5, "0"), canvas.width / 2, 54);

  ctx.textAlign = "right";
  ctx.font = "bold 14px Verdana";
  ctx.fillStyle = "#fff";
  ctx.fillText(`LEVEL ${state.level}`, canvas.width - 18, 56);
  ctx.textAlign = "center";
  ctx.font = "bold 20px Trebuchet MS";
  ctx.fillStyle = "#ffe95f";
  ctx.fillText("PAC-MAN", canvas.width / 2, 88);

  drawLives();

  ctx.font = "14px Verdana";
  ctx.textAlign = "right";
  ctx.fillStyle = "#e6e6e6";
  ctx.fillText("CREDIT 1", canvas.width - 18, 92);
}

function drawCenteredMessage(text, y, size = 36) {
  ctx.fillStyle = "#ffe95f";
  ctx.font = `bold ${size}px Trebuchet MS`;
  ctx.textAlign = "center";
  ctx.fillText(text, canvas.width / 2, y);
}

function drawStartOverlay() {
  ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  drawCenteredMessage("READY!", 320, 42);
  ctx.fillStyle = "#fff";
  ctx.font = "18px Verdana";
  ctx.fillText("Press Enter / Space to Start", canvas.width / 2, 362);
  ctx.fillText("Arrow Keys or WASD to Move", canvas.width / 2, 392);
  ctx.fillText("P: Pause   F: Fullscreen", canvas.width / 2, 422);
}

function drawPauseOverlay(label) {
  ctx.fillStyle = "rgba(0, 0, 0, 0.62)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  drawCenteredMessage(label, 350, 38);
  ctx.fillStyle = "#fff";
  ctx.font = "18px Verdana";
  ctx.fillText("Enter / Space to Continue", canvas.width / 2, 382);
}

function drawReadyInMaze() {
  if (state.mode === "playing" && state.startTimer > 0) {
    drawCenteredMessage("READY!", MAZE_TOP + 410, 32);
  }
}

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawHUD();
  drawMaze();
  drawFruit();
  drawPacman();
  for (const ghost of state.ghosts) drawGhost(ghost);

  drawReadyInMaze();

  if (state.mode === "start") drawStartOverlay();
  if (state.mode === "paused") drawPauseOverlay("PAUSED");
  if (state.mode === "game_over") drawPauseOverlay("GAME OVER");
  if (state.mode === "life_lost") drawPauseOverlay("OUCH!");
}

function triggerStartOrResume() {
  if (state.mode === "start") {
    startNewGame();
    return;
  }
  if (state.mode === "paused") {
    state.mode = "playing";
    return;
  }
  if (state.mode === "game_over") {
    startNewGame();
  }
}

function handleKeyDown(event) {
  const dir = KEY_TO_DIR[event.code];
  if (dir && state.player) {
    state.player.nextDir = dir;
    event.preventDefault();
    return;
  }

  if (event.code === "Enter" || event.code === "Space") {
    triggerStartOrResume();
    event.preventDefault();
    return;
  }

  if (event.code === "KeyP" && state.mode === "playing") {
    state.mode = "paused";
    event.preventDefault();
    return;
  }

  if (event.code === "KeyP" && state.mode === "paused") {
    state.mode = "playing";
    event.preventDefault();
    return;
  }

  if (event.code === "KeyR") {
    startNewGame();
    event.preventDefault();
    return;
  }

  if (event.code === "KeyF") {
    if (!document.fullscreenElement) canvas.requestFullscreen?.();
    else document.exitFullscreen?.();
    event.preventDefault();
  }
}

window.addEventListener("keydown", handleKeyDown);
window.addEventListener("resize", render);
window.addEventListener("blur", () => {
  if (state.mode === "playing") state.mode = "paused";
});

function buildTextState() {
  const payload = {
    coordinateSystem: {
      origin: "top-left of maze grid",
      xDirection: "x increases to the right",
      yDirection: "y increases downward",
      tileSizePx: TILE,
      mazeTopPx: MAZE_TOP,
    },
    mode: state.mode,
    score: state.score,
    highScore: state.highScore,
    level: state.level,
    lives: state.lives,
    pelletsLeft: state.pelletsLeft,
    frightenedTimer: Number(state.frightenedTimer.toFixed(2)),
    startTimer: Number(Math.max(0, state.startTimer).toFixed(2)),
    ghostMode: state.ghostMode,
    fruit: state.fruit
      ? {
          x: Number(state.fruit.x.toFixed(2)),
          y: Number(state.fruit.y.toFixed(2)),
          timer: Number(state.fruit.timer.toFixed(2)),
        }
      : null,
    player: {
      x: Number(state.player.x.toFixed(2)),
      y: Number(state.player.y.toFixed(2)),
      dir: state.player.dir,
      queuedDirection: state.player.nextDir,
    },
    ghosts: state.ghosts.map((g) => ({
      name: g.name,
      x: Number(g.x.toFixed(2)),
      y: Number(g.y.toFixed(2)),
      dir: g.dir,
      houseState: g.houseState,
      frightened: g.frightened,
      eaten: g.eaten,
      respawnTimer: Number(Math.max(0, g.respawnTimer).toFixed(2)),
      releaseTimer: Number(Math.max(0, g.releaseTimer).toFixed(2)),
    })),
  };
  return JSON.stringify(payload);
}

window.render_game_to_text = buildTextState;

window.advanceTime = (ms) => {
  const steps = Math.max(1, Math.round(ms / (1000 / 60)));
  for (let i = 0; i < steps; i++) update(1 / 60);
  render();
};

resetLevel();
render();

let lastTime = performance.now();
let accumulator = 0;
const FIXED_DT = 1 / 60;

function frameLoop(now) {
  const delta = Math.min(0.05, (now - lastTime) / 1000);
  lastTime = now;
  accumulator += delta;

  while (accumulator >= FIXED_DT) {
    update(FIXED_DT);
    accumulator -= FIXED_DT;
  }

  render();
  requestAnimationFrame(frameLoop);
}

requestAnimationFrame(frameLoop);
