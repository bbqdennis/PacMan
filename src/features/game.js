import { cloneMaze, createMazeApi, roundCenter, isNearCenter } from "../domain/maze.js";
import { updatePacman } from "../domain/pacman.js";
import { createGhosts, updateGhostMode, updateGhosts } from "../domain/ghosts.js";
import { consumePlayerTile, checkGhostCollisions } from "../domain/collisions.js";
import { createGameRunner } from "../core/run-loop.js";
import { setupControls } from "./controls.js";
import { createRenderer } from "./draw.js";
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const startButton = document.getElementById("start-game-btn");
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
  const stepDistance = speed * dt;
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
  const canMoveAt = (distance) =>
    canMoveTo(entity.x + dir.x * distance, entity.y + dir.y * distance, dir, opts);
  if (!canMoveAt(0)) {
    entity.x = roundCenter(entity.x);
    entity.y = roundCenter(entity.y);
  } else if (stepDistance > 0 && canMoveAt(stepDistance)) {
    entity.x += dir.x * stepDistance;
    entity.y += dir.y * stepDistance;
    moved = true;
  } else if (stepDistance > 0) {
    // Clamp movement to the largest legal forward distance this frame to avoid wall jitter.
    let lo = 0;
    let hi = stepDistance;
    for (let i = 0; i < 10; i++) {
      const mid = (lo + hi) / 2;
      if (canMoveAt(mid)) lo = mid;
      else hi = mid;
    }
    if (lo > 0.0001) {
      entity.x += dir.x * lo;
      entity.y += dir.y * lo;
      moved = true;
    }
  }
  warpEntity(entity);
  return moved;
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
function queueDirection(dir) {
  if (state.player) state.player.nextDir = dir;
}
function togglePause() {
  if (state.mode === "playing") {
    state.mode = "paused";
    return;
  }
  if (state.mode === "paused") {
    state.mode = "playing";
  }
}
function toggleFullscreen() {
  if (!document.fullscreenElement) canvas.requestFullscreen?.();
  else document.exitFullscreen?.();
}
function blurPause() {
  if (state.mode === "playing") state.mode = "paused";
}
function syncStartButton() {
  if (!startButton) return;
  if (state.mode === "start") {
    startButton.hidden = false;
    startButton.textContent = "Tap to Start";
    return;
  }
  if (state.mode === "paused") {
    startButton.hidden = false;
    startButton.textContent = "Tap to Resume";
    return;
  }
  if (state.mode === "game_over") {
    startButton.hidden = false;
    startButton.textContent = "Tap to Restart";
    return;
  }
  startButton.hidden = true;
}
const render = createRenderer({
  canvas,
  ctx,
  state,
  tile: TILE,
  hudHeight: HUD_HEIGHT,
  mazeTop: MAZE_TOP,
  dirs: DIRS,
  syncStartButton,
});
setupControls({
  canvas,
  startButton,
  onDirection: queueDirection,
  onStartOrResume: triggerStartOrResume,
  onPauseToggle: togglePause,
  onRestart: startNewGame,
  onToggleFullscreen: toggleFullscreen,
  onBlurPause: blurPause,
  getMode: () => state.mode,
});
window.addEventListener("resize", render);
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
const gameRunner = createGameRunner({
  state,
  render,
  modeSchedule: MODE_SCHEDULE,
  reverseDirection,
  playerSpeed: PLAYER_SPEED,
  frightenedDuration: FRIGHTENED_DURATION,
  ghostSpeed: GHOST_SPEED,
  frightenedSpeed: FRIGHTENED_SPEED,
  eatenSpeed: EATEN_SPEED,
  ghostRespawnDelay: GHOST_RESPAWN_DELAY,
  tileAt,
  setTile,
  canMoveTo,
  stepEntity,
  loseLife,
  completeLevel,
  updateGhostMode,
  updatePacman,
  updateGhosts,
  consumePlayerTile,
  checkGhostCollisions,
  dirs: DIRS,
  tileSize: TILE,
  roundCenter,
  isNearCenter,
});
window.advanceTime = gameRunner.advanceTime;
resetLevel();
render();
gameRunner.start();
