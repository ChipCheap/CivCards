// Turns table units into screen pixels and back: the pan and zoom of the table, and the mirroring that
// puts each player's own side at the bottom. Positions stored in the table are always unmirrored;
// mirroring happens only here.

import { TABLE_HEIGHT, TABLE_WIDTH } from "./layout.js";

const MINIMUM_SCALE = 0.2;
const MAXIMUM_SCALE = 3;
const WHEEL_ZOOM_SPEED = 0.0015;
const FIT_MARGIN = 16;
const LEFT_BUTTON = 0;
const MIDDLE_BUTTON = 1;

// `viewportElement` is the visible table area; `boardElement` is the full-size board inside it, which
// this view moves and scales. The middle button pans from anywhere; the left button pans from empty
// board (anything that isn't a card stack), since on a stack it drags a card.
export function createView(viewportElement, boardElement, isMirrored) {
  let scale = 1;
  let offsetX = 0;
  let offsetY = 0;

  boardElement.style.width = `${TABLE_WIDTH}px`;
  boardElement.style.height = `${TABLE_HEIGHT}px`;

  function applyTransform() {
    boardElement.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
  }

  function fitToViewport() {
    const bounds = viewportElement.getBoundingClientRect();
    scale = clampScale(Math.min(
      (bounds.width - 2 * FIT_MARGIN) / TABLE_WIDTH,
      (bounds.height - 2 * FIT_MARGIN) / TABLE_HEIGHT,
    ));
    offsetX = (bounds.width - TABLE_WIDTH * scale) / 2;
    offsetY = (bounds.height - TABLE_HEIGHT * scale) / 2;
    applyTransform();
  }

  viewportElement.addEventListener("wheel", event => {
    event.preventDefault();
    const bounds = viewportElement.getBoundingClientRect();
    const pointerX = event.clientX - bounds.left;
    const pointerY = event.clientY - bounds.top;
    const nextScale = clampScale(scale * Math.exp(-event.deltaY * WHEEL_ZOOM_SPEED));
    // Keep the board point under the pointer where it is while the scale changes.
    offsetX = pointerX - (pointerX - offsetX) * (nextScale / scale);
    offsetY = pointerY - (pointerY - offsetY) * (nextScale / scale);
    scale = nextScale;
    applyTransform();
  }, { passive: false });

  // The browser's middle-click autoscroll starts on mousedown, so it is stopped there.
  viewportElement.addEventListener("mousedown", event => {
    if (event.button === MIDDLE_BUTTON) {
      event.preventDefault();
    }
  });

  viewportElement.addEventListener("pointerdown", event => {
    const isMiddlePan = event.button === MIDDLE_BUTTON;
    const isLeftPan = event.button === LEFT_BUTTON && event.target.closest(".stack") === null;
    if (!isMiddlePan && !isLeftPan) {
      return;
    }
    event.preventDefault();
    const startX = event.clientX - offsetX;
    const startY = event.clientY - offsetY;
    viewportElement.setPointerCapture(event.pointerId);
    viewportElement.classList.add("is-panning");
    const pan = moveEvent => {
      offsetX = moveEvent.clientX - startX;
      offsetY = moveEvent.clientY - startY;
      applyTransform();
    };
    // Whichever of pointerup and pointercancel ends the pan, all three listeners go with it.
    const stopPanning = () => {
      viewportElement.removeEventListener("pointermove", pan);
      viewportElement.removeEventListener("pointerup", stopPanning);
      viewportElement.removeEventListener("pointercancel", stopPanning);
      viewportElement.classList.remove("is-panning");
    };
    viewportElement.addEventListener("pointermove", pan);
    viewportElement.addEventListener("pointerup", stopPanning);
    viewportElement.addEventListener("pointercancel", stopPanning);
  });

  fitToViewport();

  return {
    // A rectangle in table units, as board-element coordinates for this viewer.
    toBoardRectangle(rectangle) {
      return isMirrored ? { ...rectangle, y: TABLE_HEIGHT - rectangle.y - rectangle.height } : rectangle;
    },
    // A point in table units, as board-element coordinates for this viewer.
    toBoardPoint(point) {
      return isMirrored ? { x: point.x, y: TABLE_HEIGHT - point.y } : point;
    },
    // A pointer position on screen, as an unmirrored point in table units.
    toTablePoint(clientX, clientY) {
      const bounds = viewportElement.getBoundingClientRect();
      const boardX = (clientX - bounds.left - offsetX) / scale;
      const boardY = (clientY - bounds.top - offsetY) / scale;
      return { x: boardX, y: isMirrored ? TABLE_HEIGHT - boardY : boardY };
    },
  };
}

function clampScale(value) {
  return Math.min(MAXIMUM_SCALE, Math.max(MINIMUM_SCALE, value));
}
