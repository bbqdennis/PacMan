export function createGhosts(GHOST_META) {
  return GHOST_META.map((g, index) => ({
    ...g,
    index,
    x: g.home.x,
    y: g.home.y,
    dir: "left",
    frightened: false,
    eaten: false,
    houseState: g.release > 0 ? "waiting" : "outside",
    houseDir: -1,
    respawnTimer: 0,
    eatenTimer: 0,
    releaseTimer: g.release,
    lastDecisionTile: null,
  }));
}

export function updateGhostMode(state, dt, deps) {
  // Use a pure chase model for directional behavior; do not periodically reverse.
  state.ghostMode = "chase";
}

function frightenedChoice(ghost, options, elapsed) {
  const seed = Math.floor(elapsed * 60) + ghost.index * 7;
  return options[Math.abs(seed) % options.length];
}

function pickRandom(options) {
  if (options.length === 0) return null;
  const idx = Math.floor(Math.random() * options.length);
  return options[idx];
}

function oppositeDir(name) {
  if (name === "up") return "down";
  if (name === "down") return "up";
  if (name === "left") return "right";
  if (name === "right") return "left";
  return null;
}

function chooseGhostDirection(ghost, state, allowGate, deps) {
  const { DIRS, tileAt } = deps;
  const allDirs = ["up", "right", "down", "left"];
  const tx = Math.floor(ghost.x);
  const ty = Math.floor(ghost.y);
  const passable = {};

  for (const name of allDirs) {
    const d = DIRS[name];
    const tile = tileAt(tx + d.x, ty + d.y);
    passable[name] = tile !== "#" && (allowGate || tile !== "=");
  }

  const movable = allDirs.filter((name) => passable[name]);
  if (movable.length === 0) return ghost.dir;
  if (ghost.frightened && !ghost.eaten) return frightenedChoice(ghost, movable, state.elapsed);

  const target = ghost.eaten ? ghost.home : state.player;
  const reverse = oppositeDir(ghost.dir);
  const candidates = allDirs.filter((name) => passable[name] && name !== reverse);

  // Dead-end fallback: allow reverse only when no other legal direction exists.
  if (candidates.length === 0) {
    if (reverse && passable[reverse]) return reverse;
    return ghost.dir;
  }

  // At each intersection, choose the direction that most reduces distance to target.
  let bestDist = Infinity;
  let bestDirs = [];
  for (const name of candidates) {
    const d = DIRS[name];
    const nx = tx + d.x + 0.5;
    const ny = ty + d.y + 0.5;
    const dist = Math.hypot(target.x - nx, target.y - ny);
    if (dist < bestDist - 1e-6) {
      bestDist = dist;
      bestDirs = [name];
    } else if (Math.abs(dist - bestDist) <= 1e-6) {
      bestDirs.push(name);
    }
  }

  if (bestDirs.length === 1) return bestDirs[0];
  if (ghost.dir && bestDirs.includes(ghost.dir)) return ghost.dir;
  return pickRandom(bestDirs);
}

export function updateGhosts(state, dt, deps) {
  const {
    DIRS,
    GHOST_SPEED,
    FRIGHTENED_SPEED,
    EATEN_SPEED,
    GHOST_RESPAWN_DELAY,
    roundCenter,
    isNearCenter,
    stepEntity,
  } = deps;

  for (const ghost of state.ghosts) {
    if (ghost.eaten) {
      ghost.eatenTimer += dt;
      if (ghost.eatenTimer > 6) {
        ghost.eaten = false;
        ghost.frightened = false;
        ghost.houseState = "respawning";
        ghost.respawnTimer = GHOST_RESPAWN_DELAY;
        ghost.x = ghost.home.x;
        ghost.y = ghost.home.y;
        ghost.dir = "up";
        ghost.lastDecisionTile = null;
        ghost.eatenTimer = 0;
        continue;
      }
    } else {
      ghost.eatenTimer = 0;
    }

    if (ghost.houseState === "respawning") {
      ghost.respawnTimer -= dt;
      ghost.x = ghost.home.x;
      ghost.y = ghost.home.y;
      ghost.dir = "up";
      ghost.lastDecisionTile = null;
      if (ghost.respawnTimer <= 0) {
        ghost.respawnTimer = 0;
        ghost.houseState = "exiting";
      }
      continue;
    }

    if (ghost.houseState === "waiting") {
      ghost.releaseTimer -= dt;
      if (ghost.releaseTimer <= 0) {
        ghost.releaseTimer = 0;
        ghost.houseState = "exiting";
        ghost.dir = "up";
        ghost.lastDecisionTile = null;
      } else {
        const minY = ghost.home.y - 0.45;
        const maxY = ghost.home.y + 0.45;
        ghost.y += ghost.houseDir * (GHOST_SPEED / deps.TILE) * dt * 0.7;
        if (ghost.y <= minY) {
          ghost.y = minY;
          ghost.houseDir = 1;
        } else if (ghost.y >= maxY) {
          ghost.y = maxY;
          ghost.houseDir = -1;
        }
        continue;
      }
    }

    if (ghost.houseState === "exiting") {
      const targetX = 13.5;
      if (Math.abs(ghost.x - targetX) > 0.04) {
        ghost.dir = ghost.x > targetX ? "left" : "right";
      } else {
        ghost.x = targetX;
        ghost.dir = "up";
      }

      const movedOut = stepEntity(ghost, GHOST_SPEED / deps.TILE, dt, { allowGate: true, radius: 0.3 });
      if (!movedOut) ghost.lastDecisionTile = null;
      if (ghost.y <= 11.6) {
        ghost.houseState = "outside";
        ghost.dir = "left";
        ghost.lastDecisionTile = null;
      }
      continue;
    }

    if (ghost.eaten && Math.hypot(ghost.x - ghost.home.x, ghost.y - ghost.home.y) < 0.5) {
      ghost.eaten = false;
      ghost.frightened = false;
      ghost.houseState = "respawning";
      ghost.respawnTimer = GHOST_RESPAWN_DELAY;
      ghost.x = ghost.home.x;
      ghost.y = ghost.home.y;
      ghost.dir = "up";
      ghost.lastDecisionTile = null;
      ghost.eatenTimer = 0;
      continue;
    }

    if (isNearCenter(ghost, 0.08)) {
      const cx = roundCenter(ghost.x);
      const cy = roundCenter(ghost.y);
      if (isNearCenter(ghost, 0.015)) {
        ghost.x = cx;
        ghost.y = cy;
      }
      const tx = Math.floor(ghost.x);
      const ty = Math.floor(ghost.y);
      const tileKey = `${tx},${ty}`;
      if (ghost.lastDecisionTile !== tileKey) {
        const allowGateChoice = ghost.eaten || ghost.houseState === "exiting";
        ghost.dir = chooseGhostDirection(ghost, state, allowGateChoice, { DIRS, tileAt: deps.tileAt });
        ghost.lastDecisionTile = tileKey;
      }
    }

    const speed = ghost.eaten ? EATEN_SPEED : ghost.frightened ? FRIGHTENED_SPEED : GHOST_SPEED;
    const allowGate = ghost.eaten || ghost.houseState === "exiting";
    const moved = stepEntity(ghost, speed / deps.TILE, dt, { allowGate, radius: 0.3 });
    if (!moved) {
      const allowGateChoice = ghost.eaten || ghost.houseState === "exiting";
      ghost.lastDecisionTile = null;
      ghost.dir = chooseGhostDirection(ghost, state, allowGateChoice, { DIRS, tileAt: deps.tileAt });
      ghost.lastDecisionTile = `${Math.floor(ghost.x)},${Math.floor(ghost.y)}`;
      stepEntity(ghost, speed / deps.TILE, dt, { allowGate, radius: 0.3 });
    }
  }
}
