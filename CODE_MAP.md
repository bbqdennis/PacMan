# CODE_MAP

Feature-to-files index for this repository.  
Read this file before making any code change.

## Architecture Baseline

This repo follows `~/.codex/ARCHITECTURE.md` with layered folders under `src/`:

- `src/app`: app entry/bootstrapping
- `src/features`: UI/orchestration (no IO)
- `src/domain`: pure game rules/logic
- `src/core`: runtime infrastructure
- `src/data`: not used yet

Dependency intent:

- `features -> domain`
- `core` is shared infrastructure
- `domain -> nothing`
- `features` must not depend on `data`

## Feature Map (Edit Scope)

Use this map to decide which files are allowed for each feature change.

| Feature | Primary files to read/modify | Expand only if strictly required |
|---|---|---|
| App shell and canvas bootstrapping | `index.html`, `src/app/main.js`, `src/features/game.js` | `README.md` |
| Input handling (keyboard/pause/restart/fullscreen/mobile swipe) | `src/features/controls.js`, `src/features/game.js` | `index.html` |
| HUD and rendering (score/lives/overlays/sprites) | `src/features/draw.js` | `src/features/game.js` |
| Main game state orchestration (mode transitions, level reset, entity setup) | `src/features/game.js` | `src/domain/maze.js`, `src/domain/ghosts.js`, `src/domain/collisions.js` |
| Fixed-step update loop and deterministic time advance | `src/core/run-loop.js` | `src/features/game.js` |
| Maze layout, wall/gate checks, tunnel warp, movement probes | `src/domain/maze.js` | `src/features/game.js` |
| Pac-Man movement and turn buffering | `src/domain/pacman.js` | `src/domain/maze.js`, `src/features/game.js` |
| Ghost spawning/state machine/path selection/speed behavior | `src/domain/ghosts.js` | `src/domain/maze.js`, `src/features/game.js` |
| Pellet/power pellet/fruit consumption and scoring | `src/domain/collisions.js` | `src/features/game.js`, `src/domain/maze.js` |
| Ghost-vs-player collision resolution (life loss / ghost eaten) | `src/domain/collisions.js` | `src/domain/ghosts.js`, `src/features/game.js` |
| Deterministic test hooks (`window.advanceTime`, `window.render_game_to_text`) | `src/features/game.js`, `src/core/run-loop.js` | `README.md` |
| Scripted browser action inputs | `test-actions.json` | `README.md` |
| Package scripts / local tooling | `package.json` | `README.md` |
| Progress logs / iteration notes | `progress.md` | none |
| Developer docs and usage instructions | `README.md`, `AGENTS.md`, `CODE_MAP.md` | none |

## File Responsibilities

- `index.html`: page shell, canvas node, base styles, module entry script.
- `src/app/main.js`: app startup entry.
- `src/features/game.js`: orchestration layer only (wiring domain/core modules, input routing, high-level state).
- `src/features/draw.js`: canvas rendering pipeline and overlay/HUD drawing.
- `src/features/controls.js`: keyboard + touch input wiring.
- `src/core/run-loop.js`: frame loop, fixed timestep, deterministic advance helper.
- `src/domain/maze.js`: maze template and movement/collision utility API.
- `src/domain/pacman.js`: player movement update only.
- `src/domain/ghosts.js`: ghost AI/state transitions and movement decisions.
- `src/domain/collisions.js`: tile consumption, fruit spawn/collect, ghost collision outcomes.
- `test-actions.json`: deterministic/manual browser input sequence sample.
- `README.md`: install/run/controls and project overview.
- `progress.md`: chronological change log.

## Change Rules for New Work

- If a change spans multiple responsibilities, split code by module responsibility above.
- Do not put feature-specific gameplay logic into `src/core/run-loop.js`.
- Do not move domain rules into `index.html`.
- Keep every file under 500 lines; split when approaching the limit.
- When introducing a new major feature, add a new row to this `CODE_MAP.md`.
