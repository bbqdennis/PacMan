# Pac-Man Arcade Tribute

A browser-based Pac-Man game inspired by the classic arcade experience.

## Requirements

- Node.js (with Corepack enabled for `pnpm`)
- Python 3 (used as a lightweight static file server)

## Run with pnpm

1. Install dependencies:

```bash
pnpm install
```

2. Start the game server:

```bash
pnpm dev
```

3. Open the game:

- [http://127.0.0.1:4173](http://127.0.0.1:4173)

## Controls

- Move: Arrow keys or `W/A/S/D`
- Mobile move: Swipe on the game canvas
- Start / Resume: `Enter` or `Space`
- Mobile start / resume: Tap the on-screen `Tap to Start` button
- Pause / Unpause: `P`
- Restart run: `R`
- Fullscreen toggle: `F`

## Project Structure

- `/Users/dennischeng/Desktop/Codex/PacMan/index.html`: Canvas page shell
- `/Users/dennischeng/Desktop/Codex/PacMan/src/app/main.js`: App entry
- `/Users/dennischeng/Desktop/Codex/PacMan/src/features/game.js`: Game orchestration/state wiring
- `/Users/dennischeng/Desktop/Codex/PacMan/src/features/draw.js`: Rendering and HUD/overlay drawing
- `/Users/dennischeng/Desktop/Codex/PacMan/src/features/controls.js`: Keyboard/touch control bindings
- `/Users/dennischeng/Desktop/Codex/PacMan/src/core/run-loop.js`: Update loop and deterministic stepping
- `/Users/dennischeng/Desktop/Codex/PacMan/src/domain/maze.js`: Maze data + movement collision API
- `/Users/dennischeng/Desktop/Codex/PacMan/src/domain/pacman.js`: Pac-Man movement update
- `/Users/dennischeng/Desktop/Codex/PacMan/src/domain/ghosts.js`: Ghost movement and mode behavior
- `/Users/dennischeng/Desktop/Codex/PacMan/src/domain/collisions.js`: Pellet/fruit/ghost collision handling

## Dev Notes

- The game exposes `window.render_game_to_text()` for text-state inspection.
- The game exposes `window.advanceTime(ms)` for deterministic simulation steps.
