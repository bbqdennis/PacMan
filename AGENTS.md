# Repository Guidelines

## Project Structure & Module Organization
This repository is a browser-based Pac-Man game with flat, root-level modules.
- `index.html`: canvas entry point and script wiring.
- `game.js`: top-level state, rendering, input handling, and game orchestration.
- `run-loop.js`: fixed-step game loop and deterministic time advance helper.
- `maze.js`, `pacman.js`, `ghosts.js`, `collisions.js`: movement, AI, and collision logic split by domain.
- `test-actions.json`: scripted input sequence used for browser validation runs.
- `output/web-game/`: generated screenshots/state snapshots from test loops.

Keep new gameplay logic in the closest domain module; avoid growing `game.js` with feature-specific internals.

## Build, Test, and Development Commands
- `npm install`: install local dependencies (Playwright).
- `npm run dev`: start local static server at `http://127.0.0.1:4173`.
- `npm start`: alias for `npm run dev`.
- `npm test`: currently prints a placeholder; do not treat as real validation.

For manual verification, run the app and exercise controls (`W/A/S/D` or arrow keys, `Space`, `P`, `R`) and inspect `output/web-game/` artifacts when generated.

## Coding Style & Naming Conventions
- Use ES module syntax (`import` / `export`) and keep modules focused.
- Follow existing style: 2-space indentation, semicolons, double quotes.
- Prefer `camelCase` for variables/functions, `UPPER_SNAKE_CASE` for constants.
- Use descriptive names tied to gameplay terms (`frightenedTimer`, `houseState`, `pelletsLeft`).
- Keep comments short and only for non-obvious behavior.

## Testing Guidelines
Automated tests are not yet configured. Validate changes with repeatable gameplay checks:
- start from `npm run dev`.
- run scripted actions from `test-actions.json` (or equivalent Playwright flow).
- confirm no console errors and expected state/visual changes in `output/web-game/`.

If adding tests, place them in a new `tests/` directory and use names like `ghosts.movement.test.js`.

## Commit & Pull Request Guidelines
Recent commits use short, imperative summaries (for example: `Fixed pacman bounding wall issue`). Keep messages focused on one change.

For PRs include:
- what changed and why,
- gameplay impact and risk areas,
- linked issue (if available),
- screenshots or state-output evidence for UI/behavior changes.
