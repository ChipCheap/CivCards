// Where everything sits on the board, in table units, before any mirroring. This is the one place that
// holds slot rectangles, private zones and the table size (Prototyper.architecture.md Extensibility:
// "the slot positions themselves are kept in one place in the screen module").
// Seat 0's side is at the bottom, seat 1's at the top, the market in the middle.

import { DISPLAY_SLOTS_PER_MARKET, MARKET_STARTS, deckSlotId, discardSlotId, displaySlotId, supplySlotId } from "../core.js";

export const CARD_WIDTH = 100;
export const CARD_HEIGHT = 140;
export const TABLE_WIDTH = 1800;
export const TABLE_HEIGHT = 1900;

const GAP = 20;
const EDGE = 40;
const LABEL_HEIGHT = 30;
const PRIVATE_ZONE_COLUMNS = 10;
const PRIVATE_ZONE_ROWS = 2;
const SEAT_SIDES = 2;

const MARKET_NAMES = Object.freeze({
  "market-resources": "Strategic resources",
  "market-tech": "Technology",
  "market-blueprints": "Blueprints",
  "market-wonders": "Wonders",
});

// Seat 0's side; seat 1's side is the same, mirrored top to bottom.
const BOTTOM_PRIVATE_ZONE = (() => {
  const width = PRIVATE_ZONE_COLUMNS * CARD_WIDTH + (PRIVATE_ZONE_COLUMNS + 1) * GAP;
  const height = PRIVATE_ZONE_ROWS * CARD_HEIGHT + (PRIVATE_ZONE_ROWS + 1) * GAP;
  return { x: TABLE_WIDTH - EDGE - width, y: TABLE_HEIGHT - EDGE - height, width, height };
})();
const BOTTOM_PILE_Y = BOTTOM_PRIVATE_ZONE.y + (BOTTOM_PRIVATE_ZONE.height - CARD_HEIGHT) / 2;
const BOTTOM_DECK = { x: EDGE + 2 * GAP, y: BOTTOM_PILE_Y, width: CARD_WIDTH, height: CARD_HEIGHT };
const BOTTOM_DISCARD = { x: BOTTOM_DECK.x + CARD_WIDTH + 2 * GAP, y: BOTTOM_PILE_Y, width: CARD_WIDTH, height: CARD_HEIGHT };

// The four market stacks in a 2 × 2 block around the centre: a supply followed by its displays. The
// rows leave LABEL_HEIGHT free above each block in both the plain and the mirrored view.
const MARKET_BLOCK_WIDTH = (DISPLAY_SLOTS_PER_MARKET + 1) * CARD_WIDTH + DISPLAY_SLOTS_PER_MARKET * GAP;
const MARKET_COLUMN_X = [TABLE_WIDTH / 2 - 2 * GAP - MARKET_BLOCK_WIDTH, TABLE_WIDTH / 2 + 2 * GAP];
const MARKET_ROW_Y = [
  TABLE_HEIGHT / 2 - 2 * GAP - CARD_HEIGHT,
  TABLE_HEIGHT / 2 + 2 * GAP + LABEL_HEIGHT,
];

// slot id → { rect, label }
const SLOTS = new Map();
// One per market stack: { title, rect } covering its supply and display slots.
const MARKET_BLOCKS = [];

for (let seat = 0; seat < SEAT_SIDES; seat++) {
  SLOTS.set(deckSlotId(seat), { rect: sideRect(BOTTOM_DECK, seat), label: "Deck" });
  SLOTS.set(discardSlotId(seat), { rect: sideRect(BOTTOM_DISCARD, seat), label: "Discard" });
}
MARKET_STARTS.forEach((market, marketIndex) => {
  const x = MARKET_COLUMN_X[marketIndex % 2];
  const y = MARKET_ROW_Y[Math.floor(marketIndex / 2)];
  MARKET_BLOCKS.push({ title: MARKET_NAMES[market], rect: { x, y, width: MARKET_BLOCK_WIDTH, height: CARD_HEIGHT } });
  SLOTS.set(supplySlotId(market), { rect: { x, y, width: CARD_WIDTH, height: CARD_HEIGHT }, label: "Supply" });
  for (let displayNumber = 1; displayNumber <= DISPLAY_SLOTS_PER_MARKET; displayNumber++) {
    const displayX = x + displayNumber * (CARD_WIDTH + GAP);
    SLOTS.set(displaySlotId(market, displayNumber), { rect: { x: displayX, y, width: CARD_WIDTH, height: CARD_HEIGHT }, label: "" });
  }
});

export function allSlotLayouts() {
  return [...SLOTS.entries()].map(([slotId, slot]) => ({ slotId, ...slot }));
}

export function marketBlocks() {
  return MARKET_BLOCKS;
}

export function privateZoneRect(seat) {
  return sideRect(BOTTOM_PRIVATE_ZONE, seat);
}

// The rectangle a stack covers: its slot's, or a card's size around a loose stack's centre position.
export function stackRect(stack) {
  if (stack.isSlot) {
    return SLOTS.get(stack.id).rect;
  }
  return { x: stack.position.x - CARD_WIDTH / 2, y: stack.position.y - CARD_HEIGHT / 2, width: CARD_WIDTH, height: CARD_HEIGHT };
}

export function containsPoint(rect, point) {
  return point.x >= rect.x && point.x <= rect.x + rect.width && point.y >= rect.y && point.y <= rect.y + rect.height;
}

export function isInPrivateZone(point, seat) {
  return containsPoint(privateZoneRect(seat), point);
}

function sideRect(bottomRect, seat) {
  return seat === 0 ? bottomRect : { ...bottomRect, y: TABLE_HEIGHT - bottomRect.y - bottomRect.height };
}
