export function updatePacman(state, dt, deps) {
  const { DIRS, PLAYER_SPEED, TILE, canMoveTo, roundCenter, isNearCenter, stepEntity } = deps;
  const player = state.player;
  player.mouth += dt * 10;

  if (isNearCenter(player, 0.12)) {
    const cx = roundCenter(player.x);
    const cy = roundCenter(player.y);
    if (isNearCenter(player, 0.02)) {
      player.x = cx;
      player.y = cy;
    }

    const desired = DIRS[player.nextDir];
    if (desired && canMoveTo(cx, cy, desired, { allowGate: false, radius: 0.4 })) {
      player.dir = player.nextDir;
    }
  }

  stepEntity(player, PLAYER_SPEED / TILE, dt, { allowGate: false, radius: 0.4 });
}
