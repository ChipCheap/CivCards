// Where everything sits on the board, in table units, before any mirroring. This is the one place that
// holds slot rectangles, private zones and the table size (Prototyper.architecture.md Extensibility:
// "the slot positions themselves are kept in one place in the screen module").
// Seat 0's side is at the bottom, seat 1's at the top, the market in the middle.

import {
  BUILDING_SLOTS_PER_SEAT, DISPLAY_SLOTS_PER_MARKET, MARKET_STARTS, buildingSlotId, deckSlotId, discardSlotId, displaySlotId,
  mainBuildingSlotId, starterBuildingSlotId, supplySlotId,
} from "../core.js";

export const CARD_WIDTH = 100;
export const CARD_HEIGHT = 140;
export const TABLE_WIDTH = 1800;
export const TABLE_HEIGHT = 2580;
// A token is a little over a third of a card's width.
export const TOKEN_SIZE = 36;

const GAP = 20;
const EDGE = 40;
const LABEL_HEIGHT = 30;
const PRIVATE_ZONE_COLUMNS = 10;
// Three rows of building slots, and below them the main and starter buildings side by side.
const PRIVATE_ZONE_ROWS = 4;
const BUILDING_COLUMNS = 4;
const SEAT_SIDES = 2;
// Tokens on a card sit in a row across the middle of its art, which style.css places 5 to 50 units
// from the card's top.
const CARD_TOKEN_ROW_CENTRE_Y = 27.5;
const CARD_TOKEN_SPACING = 4;

// The rings of the building row, innermost first, each one row of BUILDING_COLUMNS slots.
const RING_NAMES = Object.freeze(["Centre", "Town", "Outskirts"]);

const MARKET_NAMES = Object.freeze({
  "market-resources": "Strategic resources",
  "market-tech": "Technology",
  "market-blueprints": "Developments",
  "market-wonders": "Wonders",
});

// Seat 0's side; seat 1's side is the same, mirrored top to bottom. The zone leaves LABEL_HEIGHT free
// at both ends, so its label, drawn at the top as each viewer sees it, never covers a slot.
const BOTTOM_PRIVATE_ZONE = (() => {
  const width = PRIVATE_ZONE_COLUMNS * CARD_WIDTH + (PRIVATE_ZONE_COLUMNS + 1) * GAP;
  const height = PRIVATE_ZONE_ROWS * CARD_HEIGHT + (PRIVATE_ZONE_ROWS - 1) * GAP + 2 * LABEL_HEIGHT;
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
  SLOTS.set(deckSlotId(seat), { rectangle: sideRectangle(BOTTOM_DECK, seat), label: "Deck" });
  SLOTS.set(discardSlotId(seat), { rectangle: sideRectangle(BOTTOM_DISCARD, seat), label: "Discard" });
  for (let slotNumber = 1; slotNumber <= BUILDING_SLOTS_PER_SEAT; slotNumber++) {
    const ringIndex = Math.floor((slotNumber - 1) / BUILDING_COLUMNS);
    const row = RING_NAMES.length - 1 - ringIndex;
    SLOTS.set(buildingSlotId(seat, slotNumber), {
      rectangle: sideRectangle(bottomBuildingRectangle(row, (slotNumber - 1) % BUILDING_COLUMNS), seat),
      label: `${RING_NAMES[ringIndex]} ${slotNumber}`,
    });
  }
  SLOTS.set(mainBuildingSlotId(seat), {
    rectangle: sideRectangle(bottomBuildingRectangle(RING_NAMES.length, BUILDING_COLUMNS / 2 - 1), seat),
    label: "Main building",
  });
  SLOTS.set(starterBuildingSlotId(seat), {
    rectangle: sideRectangle(bottomBuildingRectangle(RING_NAMES.length, BUILDING_COLUMNS / 2), seat),
    label: "Starter building",
  });
}
MARKET_STARTS.forEach((market, marketIndex) => {
  const x = MARKET_COLUMN_X[marketIndex % 2];
  const y = MARKET_ROW_Y[Math.floor(marketIndex / 2)];
  MARKET_BLOCKS.push({ title: MARKET_NAMES[market], rectangle: { x, y, width: MARKET_BLOCK_WIDTH, height: CARD_HEIGHT } });
  SLOTS.set(supplySlotId(market), { rectangle: { x, y, width: CARD_WIDTH, height: CARD_HEIGHT }, label: "Supply" });
  for (let displayNumber = 1; displayNumber <= DISPLAY_SLOTS_PER_MARKET; displayNumber++) {
    const displayX = x + displayNumber * (CARD_WIDTH + GAP);
    SLOTS.set(displaySlotId(market, displayNumber), { rectangle: { x: displayX, y, width: CARD_WIDTH, height: CARD_HEIGHT }, label: "" });
  }
});

export function allSlotLayouts() {
  return [...SLOTS.entries()].map(([slotId, slot]) => ({ slotId, ...slot }));
}

export function marketBlocks() {
  return MARKET_BLOCKS;
}

export function privateZoneRectangle(seat) {
  return sideRectangle(BOTTOM_PRIVATE_ZONE, seat);
}

// The rectangle a stack covers: its slot's, or a card's size around a loose stack's centre position.
export function stackRectangle(stack) {
  if (stack.isSlot) {
    return SLOTS.get(stack.id).rectangle;
  }
  return { x: stack.position.x - CARD_WIDTH / 2, y: stack.position.y - CARD_HEIGHT / 2, width: CARD_WIDTH, height: CARD_HEIGHT };
}

export function containsPoint(rectangle, point) {
  return point.x >= rectangle.x && point.x <= rectangle.x + rectangle.width && point.y >= rectangle.y && point.y <= rectangle.y + rectangle.height;
}

export function isInPrivateZone(point, seat) {
  return containsPoint(privateZoneRectangle(seat), point);
}

// Whether a stack lies in a seat's private zone, judged by the centre of the rectangle it covers.
export function isStackInPrivateZone(stack, seat) {
  const rectangle = stackRectangle(stack);
  return isInPrivateZone({ x: rectangle.x + rectangle.width / 2, y: rectangle.y + rectangle.height / 2 }, seat);
}

// The rectangle a loose token pile covers, around its centre position.
export function looseTokenRectangle(position) {
  return { x: position.x - TOKEN_SIZE / 2, y: position.y - TOKEN_SIZE / 2, width: TOKEN_SIZE, height: TOKEN_SIZE };
}

// Where the pile at `pileIndex` of `pileCount` piles on one card sits, relative to the card's top-left
// corner. The row is centred and squeezes together when it would not fit the card's width.
export function cardTokenRectangle(pileIndex, pileCount) {
  const naturalStep = TOKEN_SIZE + CARD_TOKEN_SPACING;
  const step = pileCount > 1 ? Math.min(naturalStep, (CARD_WIDTH - TOKEN_SIZE - 2 * CARD_TOKEN_SPACING) / (pileCount - 1)) : 0;
  const centreX = CARD_WIDTH / 2 + (pileIndex - (pileCount - 1) / 2) * step;
  return { x: centreX - TOKEN_SIZE / 2, y: CARD_TOKEN_ROW_CENTRE_Y - TOKEN_SIZE / 2, width: TOKEN_SIZE, height: TOKEN_SIZE };
}

// A building slot on seat 0's side: the outskirts in the top row, the main and starter buildings in
// the bottom one.
function bottomBuildingRectangle(row, column) {
  return {
    x: BOTTOM_PRIVATE_ZONE.x + GAP + column * (CARD_WIDTH + GAP),
    y: BOTTOM_PRIVATE_ZONE.y + LABEL_HEIGHT + row * (CARD_HEIGHT + GAP),
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
  };
}

function sideRectangle(bottomRectangle, seat) {
  return seat === 0 ? bottomRectangle : { ...bottomRectangle, y: TABLE_HEIGHT - bottomRectangle.y - bottomRectangle.height };
}
