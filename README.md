# Pac-Man Arcade Tribute

A browser-based Pac-Man game inspired by the classic arcade experience.

## Requirements

- Node.js + npm
- Python 3 (used as a lightweight static file server)

## Run with npm

1. Install dependencies:

```bash
npm install
```

2. Start the game server:

```bash
npm run dev
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

- `/Users/dennischeng/Desktop/Codex/PacMan/index.html`: Canvas page entry
- `/Users/dennischeng/Desktop/Codex/PacMan/game.js`: Game setup, render, input wiring
- `/Users/dennischeng/Desktop/Codex/PacMan/controls.js`: Keyboard/touch control bindings
- `/Users/dennischeng/Desktop/Codex/PacMan/run-loop.js`: Update loop and frame runner
- `/Users/dennischeng/Desktop/Codex/PacMan/maze.js`: Maze data + movement collision API
- `/Users/dennischeng/Desktop/Codex/PacMan/pacman.js`: Pac-Man movement update
- `/Users/dennischeng/Desktop/Codex/PacMan/ghosts.js`: Ghost movement and mode behavior
- `/Users/dennischeng/Desktop/Codex/PacMan/collisions.js`: Pellet/fruit/ghost collision handling

## Dev Notes

- The game exposes `window.render_game_to_text()` for text-state inspection.
- The game exposes `window.advanceTime(ms)` for deterministic simulation steps.
