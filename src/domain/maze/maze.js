export const MAZE_TEMPLATE = [
  "############################",
  "#............##............#",
  "#.####.#####.##.#####.####.#",
  "#o####.#####.##.#####.####o#",
  "#.####.#####.##.#####.####.#",
  "#..........................#",
  "#.####.##.########.##.####.#",
  "#.####.##.########.##.####.#",
  "#......##....##....##......#",
  "######.##### ## #####.######",
  "######.##### ## #####.######",
  "######.##          ##.######",
  "######.## ###==### ##.######",
  "      .   #      #   .      ",
  "######.## #      # ##.######",
  "######.## ######## ##.######",
  "######.##          ##.######",
  "######.## ######## ##.######",
  "#............##............#",
  "#.####.#####.##.#####.####.#",
  "#.####.#####.##.#####.####.#",
  "#o..##................##..o#",
  "###.##.##.########.##.##.###",
  "###.##.##.########.##.##.###",
  "#......##....##....##......#",
  "#.##########.##.##########.#",
  "#.##########.##.##########.#",
  "#..........................#",
  "############################",
];

export function cloneMaze() {
  return MAZE_TEMPLATE.map((row) => row.split(""));
}

export function roundCenter(n) {
  return Math.floor(n) + 0.5;
}

export function isNearCenter(entity, epsilon = 0.08) {
  return (
    Math.abs(entity.x - roundCenter(entity.x)) < epsilon &&
    Math.abs(entity.y - roundCenter(entity.y)) < epsilon
  );
}

export function createMazeApi(state) {
  function wrapTileX(tx) {
    const width = state.maze[0].length;
    return ((tx % width) + width) % width;
  }

  function tileAt(tx, ty) {
    if (ty < 0 || ty >= state.maze.length) return "#";
    const wrappedTx = wrapTileX(tx);
    return state.maze[ty][wrappedTx];
  }

  function setTile(tx, ty, value) {
    if (ty < 0 || ty >= state.maze.length) return;
    if (tx < 0 || tx >= state.maze[0].length) return;
    state.maze[ty][tx] = value;
  }

  function isWall(tx, ty, allowGate = false) {
    const tile = tileAt(tx, ty);
    if (tile === "#") return true;
    if (tile === "=" && !allowGate) return true;
    return false;
  }

  function canMoveTo(x, y, dir, opts = {}) {
    const allowGate = Boolean(opts.allowGate);
    const radius = opts.radius ?? 0.36;
    const dx = dir.x * radius;
    const dy = dir.y * radius;
    const probes = [
      { x: x + dx, y: y + dy },
      { x: x + dx + (dir.y !== 0 ? -0.22 : 0), y: y + dy + (dir.x !== 0 ? -0.22 : 0) },
      { x: x + dx + (dir.y !== 0 ? 0.22 : 0), y: y + dy + (dir.x !== 0 ? 0.22 : 0) },
    ];

    for (const p of probes) {
      if (isWall(Math.floor(p.x), Math.floor(p.y), allowGate)) return false;
    }
    return true;
  }

  function warpEntity(entity) {
    const width = state.maze[0].length;
    if (entity.x < -0.5) entity.x = width - 0.5;
    if (entity.x > width - 0.5) entity.x = -0.5;
  }

  return {
    tileAt,
    setTile,
    isWall,
    canMoveTo,
    warpEntity,
  };
}
