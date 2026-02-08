# CODE_MAP

Feature-to-files index for this repository.  
Read this file before making any code change.

## Architecture Baseline

This repo is currently **flat at root** (no `src/` yet), but changes should still follow the layered intent from `~/.codex/ARCHITECTURE.md`:

- `features` role (UI/orchestration): `index.html`, `game.js`
- `domain` role (game rules/logic): `maze.js`, `pacman.js`, `ghosts.js`, `collisions.js`
- `core` role (runtime loop infra): `run-loop.js`
- `data` role: not used yet (no external API/DB/storage layer in current project)

Dependency intent:

- `game.js` can import from domain/core modules.
- Domain modules must stay framework/IO free and must not depend on UI/data.
- No direct `features -> data` dependency (not applicable yet, keep this rule).

## Feature Map (Edit Scope)

Use this map to decide which files are allowed for each feature change.

| Feature | Primary files to read/modify | Expand only if strictly required |
|---|---|---|
| App shell and canvas bootstrapping | `index.html`, `game.js` | `README.md` |
| Input handling (keyboard/pause/restart/fullscreen) | `game.js` | `index.html` |
| HUD and rendering (score/lives/overlays/sprites) | `game.js` | `index.html` |
| Main game state orchestration (mode transitions, level reset, entity setup) | `game.js` | `maze.js`, `ghosts.js`, `collisions.js` |
| Fixed-step update loop and deterministic time advance | `run-loop.js` | `game.js` |
| Maze layout, wall/gate checks, tunnel warp, movement probes | `maze.js` | `game.js` |
| Pac-Man movement and turn buffering | `pacman.js` | `maze.js`, `game.js` |
| Ghost spawning/state machine/path selection/speed behavior | `ghosts.js` | `maze.js`, `game.js` |
| Pellet/power pellet/fruit consumption and scoring | `collisions.js` | `game.js`, `maze.js` |
| Ghost-vs-player collision resolution (life loss / ghost eaten) | `collisions.js` | `ghosts.js`, `game.js` |
| Deterministic test hooks (`window.advanceTime`, `window.render_game_to_text`) | `game.js`, `run-loop.js` | `README.md` |
| Scripted browser action inputs | `test-actions.json` | `README.md` |
| Progress logs / iteration notes | `progress.md` | none |
| Package scripts / local tooling | `package.json` | `README.md` |
| Developer docs and usage instructions | `README.md`, `AGENTS.md`, `CODE_MAP.md` | none |

## File Responsibilities

- `index.html`: page shell, canvas node, base styles, module entry script.
- `game.js`: orchestration layer only (wiring domain/core modules, render pipeline, input routing, high-level state).
- `run-loop.js`: frame loop, fixed timestep, deterministic advance helper.
- `maze.js`: maze template and movement/collision utility API.
- `pacman.js`: player movement update only.
- `ghosts.js`: ghost AI/state transitions and movement decisions.
- `collisions.js`: tile consumption, fruit spawn/collect, ghost collision outcomes.
- `test-actions.json`: deterministic/manual browser input sequence sample.
- `README.md`: install/run/controls and project overview.
- `progress.md`: chronological change log.

## Change Rules for New Work

- If a change spans multiple responsibilities, split code by module responsibility above.
- Do not put feature-specific gameplay logic into `run-loop.js`.
- Do not move domain rules into `index.html`.
- Keep every file under 500 lines; split when approaching the limit.
- When introducing a new major feature, add a new row to this `CODE_MAP.md`.

