export function createGameRunner(options) {
  const {
    state,
    render,
    modeSchedule,
    reverseDirection,
    playerSpeed,
    frightenedDuration,
    ghostSpeed,
    frightenedSpeed,
    eatenSpeed,
    ghostRespawnDelay,
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
    dirs,
    tileSize,
    roundCenter,
    isNearCenter,
  } = options;

  const FIXED_DT = 1 / 60;
  let lastTime = performance.now();
  let accumulator = 0;

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

    updateGhostMode(state, dt, {
      MODE_SCHEDULE: modeSchedule,
      reverseDirection,
    });

    updatePacman(state, dt, {
      DIRS: dirs,
      PLAYER_SPEED: playerSpeed,
      TILE: tileSize,
      canMoveTo,
      roundCenter,
      isNearCenter,
      stepEntity,
    });

    consumePlayerTile(state, {
      tileAt,
      setTile,
      reverseDirection,
      FRIGHTENED_DURATION: frightenedDuration,
      completeLevel,
    });

    updateGhosts(state, dt, {
      DIRS: dirs,
      TILE: tileSize,
      GHOST_SPEED: ghostSpeed,
      FRIGHTENED_SPEED: frightenedSpeed,
      EATEN_SPEED: eatenSpeed,
      GHOST_RESPAWN_DELAY: ghostRespawnDelay,
      roundCenter,
      isNearCenter,
      tileAt,
      canMoveTo,
      stepEntity,
    });

    checkGhostCollisions(state, loseLife);
  }

  function advanceTime(ms) {
    const steps = Math.max(1, Math.round(ms / (1000 / 60)));
    for (let i = 0; i < steps; i++) update(FIXED_DT);
    render();
  }

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

  function start() {
    lastTime = performance.now();
    accumulator = 0;
    requestAnimationFrame(frameLoop);
  }

  return {
    update,
    advanceTime,
    start,
  };
}
