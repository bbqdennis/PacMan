Original prompt: Build and iterate a playable web game in this workspace, validating changes with a Playwright loop. [$develop-web-game](/Users/dennischeng/.codex/skills/develop-web-game/SKILL.md) 幫我寫一個標準既食鬼遊戲呀，要完全模擬當年街機版既界面同地圖

## 2026-02-07
- Initialized project with `index.html` + `game.js`.
- Implemented first playable Pac-Man-style build:
  - Maze grid with pellets, power pellets, tunnel wrap, ghost gate.
  - Pac-Man movement with turn buffering.
  - Four ghosts with release timers, frightened mode, eaten/respawn behavior.
  - Score, high score, lives, level reset.
  - Start, pause, game-over flow + fullscreen toggle (`f`).
  - Added `window.render_game_to_text` and deterministic `window.advanceTime(ms)` hook.
- Next: run Playwright loop, inspect screenshots and state JSON, then tune map/visual parity and behavior bugs.
- Installed local npm deps (`playwright`) and configured runtime to execute Playwright loop in this environment.
- Ran multiple Playwright iterations using the provided client and custom action bursts.
- Fixed major gameplay bug: center-snapping tolerance previously froze movement after tiny displacement.
- Improved arcade-like behavior and presentation:
  - Added scatter/chase mode schedule and per-ghost targeting heuristics.
  - Added start delay (`READY!`) pacing and fruit spawn/collect mechanic.
  - Refined HUD to arcade-inspired `1UP`/`HIGH SCORE` style.
- Validation summary from latest Playwright run:
  - Screenshots generated: `output/web-game/shot-0.png`..`shot-4.png`.
  - Text states generated: `output/web-game/state-0.json`..`state-4.json`.
  - No console/page errors captured by client.
  - Score and pellets change as expected during movement and pellet consumption.

### TODO / suggestions for next iteration
- Tighten map geometry details to closer match original arcade tile-by-tile wall curves and lane thickness.
- Add authentic intro/chomp/siren/siren-speedup audio timing layers.
- Implement precise original ghost release + speed tables per level and tunnel slowdown behavior.
- Implement original bonus fruit sequence by level and point table display.
- Add attract-mode/demo screen and original intermission polish.

## 2026-02-07 (bugfix pass)
- User-reported issues addressed:
  - Pac-Man looked visually clipped into walls while moving.
  - Ghosts appeared stuck in house and did not reliably come out/chase.
- Code fixes in `game.js`:
  - Increased movement collision probe radius and added lane-axis snapping in `stepEntity` so rendered sprites remain centered in corridors.
  - Reduced Pac-Man render radius to better match collision envelope.
  - Added ghost house state machine: `waiting` (bounce in house) -> `exiting` (move to gate and pass through) -> `outside` (normal chase/scatter logic).
  - Allowed gate crossing while exiting/eaten; kept collision checks disabled only for `waiting` ghosts.
  - Exposed `houseState` in `render_game_to_text` for deterministic test visibility.
- Verification:
  - Ran Playwright client against `http://127.0.0.1:4173` for 5 iterations.
  - Latest artifacts: `output/web-game/shot-0.png`..`shot-4.png`, `output/web-game/state-0.json`..`state-4.json`.
  - State confirms ghost transitions (`waiting` -> `exiting` -> `outside`) and all ghosts outside with `releaseTimer: 0`.

## 2026-02-07 (alignment + AI behavior pass)
- User requested center-based positioning semantics and a simpler relative-position chase preference.
- Code updates in `game.js`:
  - Switched draw coordinates for Pac-Man / ghosts / fruit to use entity center coordinates directly.
  - Reworked ghost chase decision:
    - Determine Pac-Man relative quadrant from each ghost.
    - Prefer horizontal/vertical direction toward player with slight randomized tie order.
    - If blocked, fall through to next candidate direction (including reverse last).
  - Added ghost respawn hold in house after being eaten:
    - New `respawning` house state with `respawnTimer`.
    - After timer expires, ghost exits house and rejoins play.
  - Added `respawnTimer` to `render_game_to_text` for test observability.
- Verification:
  - Ran Playwright client for 6 iterations after changes.
  - New artifacts: `output/web-game/shot-0.png`..`shot-5.png`, `output/web-game/state-0.json`..`state-5.json`.
  - Confirmed: ghosts transition from `waiting/exiting` to `outside`; chase movement is directional.
  - Note: this action burst did not force a power-pellet ghost-eaten event, so respawn delay path is code-verified but not scenario-covered by this run.

## 2026-02-07 (modularization + ghost movement stability)
- Refactored monolithic `game.js` into modules:
  - `maze.js`: maze template, tile/wall checks, movement probes, warp.
  - `pacman.js`: player movement update.
  - `ghosts.js`: ghost release/exiting/chase/scatter/respawn movement logic.
  - `collisions.js`: pellet/power pellet/fruit consumption and ghost-player collisions.
  - `game.js`: top-level orchestration, render, input, loop, text-state hook.
- Tuned ghost movement to fix apparent standing/jitter:
  - Reduced ghost collision probe radius for path feasibility in tight lanes.
  - Tightened center-threshold for turn decisions so ghosts commit to lanes before retargeting.
  - Kept directional-priority chase behavior based on Pac-Man relative position.
- Verification:
  - Ran Playwright client for 8 iterations post-refactor.
  - Artifacts: `output/web-game/shot-0.png`..`shot-7.png`, `output/web-game/state-0.json`..`state-7.json`.
  - State snapshots now show ghosts traversing multiple maze regions (not stuck near spawn).

## 2026-02-07 (quadrant-priority ghost rule)
- Rewrote ghost path choice in `ghosts.js` to follow user-specified local rule:
  - For current ghost tile center, evaluate four directions as wall(1)/road(0) via movement probes.
  - Determine Pac-Man relative quadrant and pick vertical/horizontal priority pair (e.g. right-up => up/right).
  - If both priority directions are open, randomly choose one.
  - If both blocked, choose randomly from other open directions.
- Kept frightened mode as random among open directions.
- Verification:
  - Ran Playwright loop for 8 iterations.
  - Artifacts updated: `output/web-game/state-0.json`..`state-7.json`, `output/web-game/shot-0.png`..`shot-7.png`.

## 2026-02-07 (tile-advance decision + no immediate backtrack)
- Updated ghost pathing to satisfy stricter movement rule:
  - Recompute next direction only after entering a new tile coordinate (`lastDecisionTile` guard).
  - Prefer directions by Pac-Man relative position, but if forward choice is blocked, use alternate open directions.
  - Do not immediately reverse direction unless in a dead-end.
- Updated file:
  - `ghosts.js` (`lastDecisionTile` state + `oppositeDir` + revised `chooseGhostDirection`).

## 2026-02-07 (ghost inertia + fruit spawn safety)
- Ghost steering:
  - Added forward-inertia preference: if current direction remains legal, keep moving instead of needless axis flipping.
  - Kept quadrant priority + blocked fallback + no-immediate-reverse constraints.
- Fruit spawning:
  - Replaced single hardcoded fruit coordinate with validated candidate list.
  - Spawn now picks the first non-wall/non-gate tile to prevent fruit appearing inside walls.

## 2026-02-07 (grid-neighbor wall decision fix)
- Root cause found for repeated wall bumping:
  - Direction selection used continuous probe checks from center, which could still report a blocked edge as temporarily passable.
- Fix:
  - `chooseGhostDirection` now uses strict tile-neighbor checks (wall=1/path=0 semantics):
    - Evaluate `up/right/down/left` by checking adjacent grid tile directly.
    - Respect gate block unless in gate-allowed state.
  - Added blocked-move recovery: if a movement step does not advance, clear cached tile decision and immediately retry with a new legal direction.
- Result from latest Playwright run:
  - Ghosts traverse multiple corridors and switch axes (not stuck repeatedly pushing one blocked side).

## 2026-02-07 (chase-priority + eaten revive safety)
- Ghost chase refinement:
  - At junctions, choose among legal non-reverse moves by minimizing next-tile distance to Pac-Man (greedy chase).
  - Tie case keeps current direction if included; otherwise random among best.
  - Removed periodic mode reversal influence in path selection by forcing chase model in `updateGhostMode`.
- Eaten ghost recovery safety:
  - Added `eatenTimer` fallback: if an eaten ghost fails to return home within threshold, force respawn flow (`respawning` -> `exiting`).

## 2026-02-07 (run-loop split + npm run + README)
- User requested:
  - Split large `game.js` by extracting update/run-loop logic.
  - Add README.
  - Run project via npm scripts.
- Refactor:
  - Added `run-loop.js` with `createGameRunner(...)` to encapsulate:
    - fixed-step `update(dt)`
    - deterministic `advanceTime(ms)`
    - animation frame loop `start()`
  - Updated `game.js` to consume `createGameRunner` and keep orchestration/render/input only.
  - Preserved `window.advanceTime` and `window.render_game_to_text` contract.
- npm scripts:
  - `package.json` now provides:
    - `npm run dev` -> `python3 -m http.server 4173`
    - `npm start` -> alias of dev
- Docs:
  - Added `README.md` with setup/run instructions, controls, and module structure.
- Verification:
  - Ran Playwright client after refactor (4 iterations) against `http://127.0.0.1:4173`.
  - New artifacts generated:
    - `output/web-game/shot-0.png`..`shot-3.png`
    - `output/web-game/state-0.json`..`state-3.json`
  - Visual check of latest screenshot (`shot-3.png`) shows expected HUD/maze/overlay rendering.
  - State JSON remains valid and consistent with gameplay transitions.
