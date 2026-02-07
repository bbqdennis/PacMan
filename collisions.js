function spawnFruitIfNeeded(state) {
  const candidates = [
    { x: 13.5, y: 17.5 },
    { x: 12.5, y: 18.5 },
    { x: 15.5, y: 18.5 },
    { x: 12.5, y: 21.5 },
    { x: 15.5, y: 21.5 },
  ];

  const pickFruitSpot = () => {
    for (const pos of candidates) {
      const tx = Math.floor(pos.x);
      const ty = Math.floor(pos.y);
      const row = state.maze[ty];
      const tile = row ? row[tx] : "#";
      if (tile !== "#" && tile !== "=") return pos;
    }
    return null;
  };

  const fractions = [0.7, 0.3];
  const total = 242;
  for (const fraction of fractions) {
    const threshold = Math.floor(total * fraction);
    if (state.pelletsLeft <= threshold && !state.fruitSpawnedAt.has(threshold)) {
      state.fruitSpawnedAt.add(threshold);
      const spawnPos = pickFruitSpot();
      if (spawnPos) state.fruit = { x: spawnPos.x, y: spawnPos.y, timer: 9 };
    }
  }
}

export function consumePlayerTile(state, deps) {
  const { tileAt, setTile, reverseDirection, FRIGHTENED_DURATION, completeLevel } = deps;
  const tx = Math.floor(state.player.x);
  const ty = Math.floor(state.player.y);
  const tile = tileAt(tx, ty);

  if (tile === ".") {
    setTile(tx, ty, " ");
    state.score += 10;
    state.pelletsLeft--;
  } else if (tile === "o") {
    setTile(tx, ty, " ");
    state.score += 50;
    state.pelletsLeft--;
    state.frightenedTimer = FRIGHTENED_DURATION;
    state.ghostEatChain = 0;
    for (const ghost of state.ghosts) {
      if (!ghost.eaten) {
        ghost.frightened = true;
        reverseDirection(ghost);
      }
    }
  }

  if (state.fruit && Math.hypot(state.player.x - state.fruit.x, state.player.y - state.fruit.y) < 0.7) {
    state.score += 100 * state.level;
    state.fruit = null;
  }

  state.highScore = Math.max(state.highScore, state.score);
  spawnFruitIfNeeded(state);

  if (state.pelletsLeft <= 0) {
    completeLevel();
  }
}

export function checkGhostCollisions(state, loseLife) {
  const p = state.player;
  for (const ghost of state.ghosts) {
    if (ghost.houseState !== "outside") continue;

    const distance = Math.hypot(ghost.x - p.x, ghost.y - p.y);
    if (distance >= 0.62) continue;

    if (ghost.frightened && !ghost.eaten) {
      ghost.eaten = true;
      ghost.frightened = false;
      state.ghostEatChain++;
      state.score += 200 * Math.pow(2, Math.max(0, state.ghostEatChain - 1));
      continue;
    }

    if (!ghost.eaten) {
      loseLife();
      return;
    }
  }
}
