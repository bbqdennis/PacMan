export function createRenderer(options) {
  const { canvas, ctx, state, tile, hudHeight, mazeTop, dirs, syncStartButton } = options;

  function drawMaze() {
    const h = state.maze.length;
    const w = state.maze[0].length;
    ctx.fillStyle = "#000";
    ctx.fillRect(0, mazeTop, w * tile, h * tile);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const mazeTile = state.maze[y][x];
        const px = x * tile;
        const py = mazeTop + y * tile;
        if (mazeTile === "#") {
          ctx.fillStyle = "#0a2fff";
          ctx.fillRect(px + 1, py + 1, tile - 2, tile - 2);
          ctx.fillStyle = "#79abff";
          ctx.fillRect(px + 5, py + 5, tile - 10, tile - 10);
        } else if (mazeTile === "=") {
          ctx.fillStyle = "#ffb3d9";
          ctx.fillRect(px + 2, py + tile / 2 - 1.5, tile - 4, 3);
        } else if (mazeTile === "." || mazeTile === "o") {
          ctx.fillStyle = mazeTile === "o" ? "#ffd9d9" : "#f4df95";
          const pulse = mazeTile === "o" ? 4.1 + Math.sin(state.elapsed * 8) * 0.7 : 1.9;
          ctx.beginPath();
          ctx.arc(px + tile / 2, py + tile / 2, pulse, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  }

  function drawPacman() {
    const p = state.player;
    const px = p.x * tile;
    const py = mazeTop + p.y * tile;
    const mouthOpen = 0.22 + Math.abs(Math.sin(p.mouth)) * 0.26;
    let base = 0;
    if (p.dir === "right") base = 0;
    if (p.dir === "left") base = Math.PI;
    if (p.dir === "up") base = -Math.PI / 2;
    if (p.dir === "down") base = Math.PI / 2;
    ctx.fillStyle = "#ffd400";
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.arc(px, py, tile * 0.4, base + mouthOpen, base - mouthOpen + Math.PI * 2);
    ctx.closePath();
    ctx.fill();
  }

  function drawGhost(ghost) {
    const px = ghost.x * tile;
    const py = mazeTop + ghost.y * tile;
    const bodyW = tile * 0.86;
    const bodyH = tile * 0.92;
    const left = px - bodyW / 2;
    const top = py - bodyH / 2;
    const wave = Math.sin(state.elapsed * 11 + px * 0.03) * 1.2;
    let color = ghost.color;
    if (ghost.eaten) color = "#111";
    else if (ghost.frightened) {
      const flash = state.frightenedTimer < 2 && Math.floor(state.elapsed * 10) % 2 === 0;
      color = flash ? "#f7f7f7" : "#2b4dff";
    }
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(px, top + bodyW / 2, bodyW / 2, Math.PI, 0);
    ctx.lineTo(left + bodyW, top + bodyH - 4);
    for (let i = 0; i < 4; i++) {
      const x = left + bodyW - i * (bodyW / 4);
      const y = top + bodyH - (i % 2 === 0 ? 5 + wave : 1 + wave);
      ctx.lineTo(x, y);
    }
    ctx.lineTo(left, top + bodyW / 2);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(px - 5, py - 2, 4, 0, Math.PI * 2);
    ctx.arc(px + 5, py - 2, 4, 0, Math.PI * 2);
    ctx.fill();
    const eyeDir = ghost.eaten ? { x: 0, y: 0 } : dirs[ghost.dir] || dirs.left;
    ctx.fillStyle = "#1935c9";
    ctx.beginPath();
    ctx.arc(px - 5 + eyeDir.x * 1.8, py - 2 + eyeDir.y * 1.8, 2, 0, Math.PI * 2);
    ctx.arc(px + 5 + eyeDir.x * 1.8, py - 2 + eyeDir.y * 1.8, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawFruit() {
    if (!state.fruit) return;
    const px = state.fruit.x * tile;
    const py = mazeTop + state.fruit.y * tile;
    ctx.fillStyle = "#df2727";
    ctx.beginPath();
    ctx.arc(px - 3, py + 2, 5, 0, Math.PI * 2);
    ctx.arc(px + 3, py + 2, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#68d04c";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(px, py - 7);
    ctx.lineTo(px + 3, py - 10);
    ctx.stroke();
  }

  function drawLives() {
    for (let i = 0; i < state.lives; i++) {
      const x = 28 + i * 26;
      const y = 84;
      ctx.fillStyle = "#ffd400";
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.arc(x, y, 10, 0.35, Math.PI * 1.65);
      ctx.closePath();
      ctx.fill();
    }
  }

  function drawHUD() {
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, canvas.width, hudHeight);
    ctx.fillStyle = "#fff";
    ctx.textAlign = "left";
    ctx.font = "bold 14px Verdana";
    ctx.fillText("1UP", 22, 20);
    ctx.textAlign = "center";
    ctx.fillText("HIGH SCORE", canvas.width / 2, 20);
    ctx.font = "bold 32px monospace";
    ctx.fillStyle = "#fff";
    ctx.textAlign = "left";
    ctx.fillText(state.score.toString().padStart(5, "0"), 22, 54);
    ctx.textAlign = "center";
    ctx.fillText(state.highScore.toString().padStart(5, "0"), canvas.width / 2, 54);
    ctx.textAlign = "right";
    ctx.font = "bold 14px Verdana";
    ctx.fillStyle = "#fff";
    ctx.fillText(`LEVEL ${state.level}`, canvas.width - 18, 56);
    ctx.textAlign = "center";
    ctx.font = "bold 20px Trebuchet MS";
    ctx.fillStyle = "#ffe95f";
    ctx.fillText("PAC-MAN", canvas.width / 2, 88);
    drawLives();
    ctx.font = "14px Verdana";
    ctx.textAlign = "right";
    ctx.fillStyle = "#e6e6e6";
    ctx.fillText("CREDIT 1", canvas.width - 18, 92);
  }

  function drawCenteredMessage(text, y, size = 36) {
    ctx.fillStyle = "#ffe95f";
    ctx.font = `bold ${size}px Trebuchet MS`;
    ctx.textAlign = "center";
    ctx.fillText(text, canvas.width / 2, y);
  }

  function drawStartOverlay() {
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawCenteredMessage("READY!", 320, 42);
    ctx.fillStyle = "#fff";
    ctx.font = "18px Verdana";
    ctx.fillText("Tap Start / Press Enter or Space", canvas.width / 2, 362);
    ctx.fillText("Swipe or Arrow Keys / WASD to Move", canvas.width / 2, 392);
    ctx.fillText("P: Pause   F: Fullscreen", canvas.width / 2, 422);
  }

  function drawPauseOverlay(label) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.62)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawCenteredMessage(label, 350, 38);
    ctx.fillStyle = "#fff";
    ctx.font = "18px Verdana";
    ctx.fillText("Enter / Space to Continue", canvas.width / 2, 382);
  }

  function drawReadyInMaze() {
    if (state.mode === "playing" && state.startTimer > 0) {
      drawCenteredMessage("READY!", mazeTop + 410, 32);
    }
  }

  return function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawHUD();
    drawMaze();
    drawFruit();
    drawPacman();
    for (const ghost of state.ghosts) drawGhost(ghost);
    drawReadyInMaze();
    if (state.mode === "start") drawStartOverlay();
    if (state.mode === "paused") drawPauseOverlay("PAUSED");
    if (state.mode === "game_over") drawPauseOverlay("GAME OVER");
    if (state.mode === "life_lost") drawPauseOverlay("OUCH!");
    syncStartButton();
  };
}
