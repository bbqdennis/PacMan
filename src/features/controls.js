const KEY_TO_DIR = {
  ArrowLeft: "left",
  ArrowRight: "right",
  ArrowUp: "up",
  ArrowDown: "down",
  KeyA: "left",
  KeyD: "right",
  KeyW: "up",
  KeyS: "down",
};

const TAP_THRESHOLD = 18;
const SWIPE_THRESHOLD = 24;

function toSwipeDirection(dx, dy) {
  if (Math.abs(dx) >= Math.abs(dy)) return dx > 0 ? "right" : "left";
  return dy > 0 ? "down" : "up";
}

export function setupControls({
  canvas,
  startButton,
  onDirection,
  onStartOrResume,
  onPauseToggle,
  onRestart,
  onToggleFullscreen,
  onBlurPause,
  getMode,
}) {
  let touchStart = null;

  function handleKeyDown(event) {
    const dir = KEY_TO_DIR[event.code];
    if (dir) {
      onDirection(dir);
      event.preventDefault();
      return;
    }

    if (event.code === "Enter" || event.code === "Space") {
      onStartOrResume();
      event.preventDefault();
      return;
    }

    if (event.code === "KeyP") {
      onPauseToggle();
      event.preventDefault();
      return;
    }

    if (event.code === "KeyR") {
      onRestart();
      event.preventDefault();
      return;
    }

    if (event.code === "KeyF") {
      onToggleFullscreen();
      event.preventDefault();
    }
  }

  function handlePointerDown(event) {
    if (event.pointerType !== "touch") return;
    touchStart = { x: event.clientX, y: event.clientY, id: event.pointerId };
    event.preventDefault();
  }

  function handlePointerUp(event) {
    if (event.pointerType !== "touch" || !touchStart || touchStart.id !== event.pointerId) return;

    const dx = event.clientX - touchStart.x;
    const dy = event.clientY - touchStart.y;
    const maxMove = Math.max(Math.abs(dx), Math.abs(dy));

    touchStart = null;
    event.preventDefault();

    if (maxMove <= TAP_THRESHOLD) {
      if (getMode() !== "playing") onStartOrResume();
      return;
    }

    if (maxMove < SWIPE_THRESHOLD) return;
    onDirection(toSwipeDirection(dx, dy));
  }

  function handlePointerCancel(event) {
    if (event.pointerType === "touch") touchStart = null;
  }

  function handleStartButton(event) {
    event.preventDefault();
    onStartOrResume();
  }

  window.addEventListener("keydown", handleKeyDown);
  window.addEventListener("blur", onBlurPause);
  canvas.addEventListener("pointerdown", handlePointerDown, { passive: false });
  canvas.addEventListener("pointerup", handlePointerUp, { passive: false });
  canvas.addEventListener("pointercancel", handlePointerCancel);
  if (startButton) {
    startButton.addEventListener("click", handleStartButton);
    startButton.addEventListener("touchend", handleStartButton, { passive: false });
  }

  return () => {
    window.removeEventListener("keydown", handleKeyDown);
    window.removeEventListener("blur", onBlurPause);
    canvas.removeEventListener("pointerdown", handlePointerDown);
    canvas.removeEventListener("pointerup", handlePointerUp);
    canvas.removeEventListener("pointercancel", handlePointerCancel);
    if (startButton) {
      startButton.removeEventListener("click", handleStartButton);
      startButton.removeEventListener("touchend", handleStartButton);
    }
  };
}
