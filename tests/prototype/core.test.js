import { test } from "node:test";
import assert from "node:assert/strict";
import { apply, createTable, deckSlotId, discardSlotId, displaySlotId, supplySlotId } from "../../prototype/js/core.js";

// A small seeded generator (mulberry32), so every test sees the same shuffles.
function createRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6D2B79F5) >>> 0;
    let mixed = state;
    mixed = Math.imul(mixed ^ (mixed >>> 15), mixed | 1);
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61);
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  };
}

const CARD_DEFINITIONS = ["farm", "workshop", "iron", "coal", "t1", "t2", "t3", "t4", "t5", "steam"]
  .map(id => ({ id, name: id, type: "", era: "1", cost: "", text: "", art: "" }));

const STACK_DEFINITIONS = [
  { name: "Starter deck", start: "player-deck", definitionIds: ["farm", "farm", "workshop", "workshop"] },
  { name: "Era 1 Technology", start: "market-tech", definitionIds: ["t1", "t2", "t3", "t4", "t5"] },
  { name: "Era 1 Resources", start: "market-resources", definitionIds: ["iron", "coal"] },
  { name: "Era 2 Technology", start: "panel", definitionIds: ["steam", "steam"] },
];

function newTable(seed = 1) {
  return createTable(CARD_DEFINITIONS, STACK_DEFINITIONS, 2, createRandom(seed));
}

function stackById(table, stackId) {
  return table.stacks.find(stack => stack.id === stackId);
}

function applyAll(table, seat, requests, random = createRandom(7)) {
  return requests.reduce((current, request) => apply(current, seat, request, random), table);
}

function newestStack(table) {
  return table.stacks.at(-1);
}

test("setup gives each seat its own shuffled, face-down deck and an empty discard", () => {
  const table = newTable();
  const firstDeck = stackById(table, deckSlotId(0));
  const secondDeck = stackById(table, deckSlotId(1));
  assert.equal(firstDeck.cards.length, 4);
  assert.equal(secondDeck.cards.length, 4);
  assert.ok(firstDeck.cards.every(card => !card.faceUp));
  const firstIds = new Set(firstDeck.cards.map(card => card.id));
  assert.ok(secondDeck.cards.every(card => !firstIds.has(card.id)), "the seats share no card instances");
  assert.deepEqual(stackById(table, discardSlotId(0)).cards, []);
  assert.deepEqual(stackById(table, discardSlotId(1)).cards, []);
});

test("setup fills 3 face-up displays per market stack from its shuffled supply", () => {
  const table = newTable();
  for (let displayNumber = 1; displayNumber <= 3; displayNumber++) {
    const display = stackById(table, displaySlotId("market-tech", displayNumber));
    assert.equal(display.cards.length, 1);
    assert.equal(display.cards[0].faceUp, true);
  }
  const supply = stackById(table, supplySlotId("market-tech"));
  assert.equal(supply.cards.length, 2);
  assert.ok(supply.cards.every(card => !card.faceUp));
});

test("setup fills fewer displays when a supply runs short, and keeps every slot", () => {
  const table = newTable();
  assert.equal(stackById(table, displaySlotId("market-resources", 1)).cards.length, 1);
  assert.equal(stackById(table, displaySlotId("market-resources", 2)).cards.length, 1);
  assert.equal(stackById(table, displaySlotId("market-resources", 3)).cards.length, 0);
  assert.equal(stackById(table, supplySlotId("market-wonders")).cards.length, 0);
  assert.ok(stackById(table, displaySlotId("market-wonders", 3)).isSlot);
});

test("setup keeps panel stacks off the table and starts the shared counters", () => {
  const table = newTable();
  assert.deepEqual(table.panelStacks, [{ name: "Era 2 Technology", definitionIds: ["steam", "steam"] }]);
  assert.ok(table.stacks.every(stack => stack.cards.every(card => card.definitionId !== "steam")));
  assert.deepEqual(table.counters, { modernization: 0, turn: 1 });
});

test("the same random source gives the same table", () => {
  assert.deepEqual(newTable(42), newTable(42));
  const requests = [{ kind: "shuffle", stackId: deckSlotId(0) }, { kind: "draw", stackId: deckSlotId(0), count: 2 }];
  assert.deepEqual(applyAll(newTable(42), 0, requests, createRandom(3)), applyAll(newTable(42), 0, requests, createRandom(3)));
});

test("dragging a stack takes only its top card", () => {
  const table = newTable();
  const deckBefore = stackById(table, deckSlotId(0)).cards;
  const after = apply(table, 0, { kind: "move-card", from: { stackId: deckSlotId(0) }, to: { position: { x: 10, y: 20 } } }, createRandom(1));
  assert.deepEqual(stackById(after, deckSlotId(0)).cards, deckBefore.slice(0, -1));
  assert.deepEqual(newestStack(after).cards, [deckBefore.at(-1)]);
  assert.deepEqual(newestStack(after).position, { x: 10, y: 20 });
});

test("dropping a card onto a stack puts it on top", () => {
  let table = newTable();
  table = apply(table, 0, { kind: "spawn-card", definitionId: "iron", position: { x: 0, y: 0 } }, createRandom(1));
  const ironStackId = newestStack(table).id;
  const movedCard = stackById(table, displaySlotId("market-tech", 1)).cards[0];
  table = apply(table, 0, { kind: "move-card", from: { stackId: displaySlotId("market-tech", 1) }, to: { stackId: ironStackId } }, createRandom(1));
  const ironStack = stackById(table, ironStackId);
  assert.equal(ironStack.cards.length, 2);
  assert.deepEqual(ironStack.cards.at(-1), movedCard);
});

test("taking the last card from a slot keeps the slot; from a loose stack removes the stack", () => {
  let table = newTable();
  table = apply(table, 0, { kind: "move-card", from: { stackId: displaySlotId("market-tech", 1) }, to: { position: { x: 5, y: 5 } } }, createRandom(1));
  const display = stackById(table, displaySlotId("market-tech", 1));
  assert.ok(display !== undefined && display.cards.length === 0, "the emptied slot stays");
  const looseStackId = newestStack(table).id;
  table = apply(table, 0, { kind: "move-card", from: { stackId: looseStackId }, to: { stackId: displaySlotId("market-tech", 1) } }, createRandom(1));
  assert.equal(stackById(table, looseStackId), undefined, "the emptied loose stack is gone");
  assert.equal(stackById(table, displaySlotId("market-tech", 1)).cards.length, 1);
});

test("moving a whole stack keeps its order", () => {
  const table = newTable();
  const deckCards = stackById(table, deckSlotId(0)).cards;
  const after = apply(table, 0, { kind: "move-stack", stackId: deckSlotId(0), to: { position: { x: 1, y: 2 } } }, createRandom(1));
  assert.deepEqual(newestStack(after).cards, deckCards);
  assert.deepEqual(stackById(after, deckSlotId(0)).cards, []);
  const onDiscard = apply(after, 0, { kind: "move-stack", stackId: newestStack(after).id, to: { stackId: discardSlotId(0) } }, createRandom(1));
  assert.deepEqual(stackById(onDiscard, discardSlotId(0)).cards, deckCards);
});

test("flipping a whole stack reverses its order and flips every card", () => {
  const table = newTable();
  const deckCards = stackById(table, deckSlotId(0)).cards;
  const after = apply(table, 0, { kind: "flip-stack", stackId: deckSlotId(0) }, createRandom(1));
  const expected = [...deckCards].reverse().map(card => ({ ...card, faceUp: true }));
  assert.deepEqual(stackById(after, deckSlotId(0)).cards, expected);
});

test("flip turns over only the top card", () => {
  const table = newTable();
  const after = apply(table, 0, { kind: "flip", from: { stackId: deckSlotId(0) } }, createRandom(1));
  const cards = stackById(after, deckSlotId(0)).cards;
  assert.equal(cards.at(-1).faceUp, true);
  assert.ok(cards.slice(0, -1).every(card => !card.faceUp));
});

test("drawing more cards than a stack holds draws what is there, face-up", () => {
  const table = newTable();
  const after = apply(table, 1, { kind: "draw", stackId: deckSlotId(1), count: 9 }, createRandom(1));
  assert.equal(after.seats[1].hand.length, 4);
  assert.ok(after.seats[1].hand.every(card => card.faceUp));
  assert.equal(stackById(after, deckSlotId(1)).cards.length, 0);
  assert.equal(after.seats[0].hand.length, 0, "only the requester's hand fills");
});

test("a card in hand can be flipped face-down and keeps that state when played", () => {
  let table = newTable();
  table = applyAll(table, 0, [
    { kind: "draw", stackId: deckSlotId(0), count: 1 },
    { kind: "flip", from: { handIndex: 0 } },
  ]);
  assert.equal(table.seats[0].hand[0].faceUp, false);
  table = apply(table, 0, { kind: "move-card", from: { handIndex: 0 }, to: { position: { x: 0, y: 0 } } }, createRandom(1));
  assert.equal(table.seats[0].hand.length, 0);
  assert.equal(newestStack(table).cards[0].faceUp, false);
});

test("a card dragged into the hand turns face-up", () => {
  const table = newTable();
  const after = apply(table, 0, { kind: "move-card", from: { stackId: deckSlotId(0) }, to: { handIndex: 0 } }, createRandom(1));
  assert.equal(after.seats[0].hand.length, 1);
  assert.equal(after.seats[0].hand[0].faceUp, true);
});

test("cards in hand can be reordered", () => {
  let table = applyAll(newTable(), 0, [{ kind: "draw", stackId: deckSlotId(0), count: 3 }]);
  const [first, second, third] = table.seats[0].hand;
  table = apply(table, 0, { kind: "move-card", from: { handIndex: 0 }, to: { handIndex: 2 } }, createRandom(1));
  assert.deepEqual(table.seats[0].hand, [second, third, first]);
});

test("searching takes one chosen card out of a stack into the hand, face-up", () => {
  const table = newTable();
  const deckCards = stackById(table, deckSlotId(0)).cards;
  const chosen = deckCards[1];
  const after = apply(table, 0, { kind: "take-card", stackId: deckSlotId(0), cardId: chosen.id }, createRandom(1));
  assert.deepEqual(after.seats[0].hand, [{ ...chosen, faceUp: true }]);
  assert.deepEqual(stackById(after, deckSlotId(0)).cards, deckCards.filter(card => card.id !== chosen.id));
  assert.equal(apply(table, 0, { kind: "take-card", stackId: deckSlotId(0), cardId: "no-such-card" }, createRandom(1)), table);
});

test("a copy keeps the definition and face state with a new id", () => {
  const table = newTable();
  const original = stackById(table, displaySlotId("market-tech", 1)).cards[0];
  const after = apply(table, 1, { kind: "copy", from: { stackId: displaySlotId("market-tech", 1) }, position: { x: 3, y: 4 } }, createRandom(1));
  const duplicate = newestStack(after).cards[0];
  assert.equal(duplicate.definitionId, original.definitionId);
  assert.equal(duplicate.faceUp, original.faceUp);
  assert.notEqual(duplicate.id, original.id);
  assert.deepEqual(stackById(after, displaySlotId("market-tech", 1)).cards, [original], "the original stays");
});

test("a copy of a hand card goes right after it in the hand", () => {
  let table = applyAll(newTable(), 0, [
    { kind: "draw", stackId: deckSlotId(0), count: 2 },
    { kind: "flip", from: { handIndex: 0 } },
  ]);
  const [first, second] = table.seats[0].hand;
  table = apply(table, 0, { kind: "copy", from: { handIndex: 0 } }, createRandom(1));
  const hand = table.seats[0].hand;
  assert.equal(hand.length, 3);
  assert.deepEqual([hand[0], hand[2]], [first, second]);
  assert.equal(hand[1].definitionId, first.definitionId);
  assert.equal(hand[1].faceUp, false, "the copy keeps the original's face state");
  assert.notEqual(hand[1].id, first.id);
});

test("trashing a card removes it; trashing a stack empties a slot or removes a loose stack", () => {
  let table = newTable();
  table = apply(table, 0, { kind: "trash-card", from: { stackId: displaySlotId("market-tech", 2) } }, createRandom(1));
  assert.equal(stackById(table, displaySlotId("market-tech", 2)).cards.length, 0);
  table = apply(table, 0, { kind: "trash-stack", stackId: deckSlotId(0) }, createRandom(1));
  assert.equal(stackById(table, deckSlotId(0)).cards.length, 0);
  table = apply(table, 0, { kind: "spawn-stack", name: "Era 2 Technology", position: { x: 0, y: 0 } }, createRandom(1));
  const spawnedId = newestStack(table).id;
  assert.equal(newestStack(table).cards.length, 2);
  assert.ok(newestStack(table).cards.every(card => !card.faceUp));
  table = apply(table, 0, { kind: "trash-stack", stackId: spawnedId }, createRandom(1));
  assert.equal(stackById(table, spawnedId), undefined);
});

test("a stack grabbed by one seat can't be used by the other until released", () => {
  let table = apply(newTable(), 0, { kind: "grab", stackId: deckSlotId(0) }, createRandom(1));
  assert.equal(stackById(table, deckSlotId(0)).heldBy, 0);
  const blockedRequests = [
    { kind: "grab", stackId: deckSlotId(0) },
    { kind: "move-card", from: { stackId: deckSlotId(0) }, to: { handIndex: 0 } },
    { kind: "draw", stackId: deckSlotId(0), count: 1 },
    { kind: "release", stackId: deckSlotId(0) },
  ];
  for (const request of blockedRequests) {
    assert.equal(apply(table, 1, request, createRandom(1)), table, `${request.kind} by the other seat is ignored`);
  }
  table = apply(table, 0, { kind: "release", stackId: deckSlotId(0) }, createRandom(1));
  table = apply(table, 1, { kind: "grab", stackId: deckSlotId(0) }, createRandom(1));
  assert.equal(stackById(table, deckSlotId(0)).heldBy, 1);
});

test("requests that don't fit the table are ignored and return the same table", () => {
  const table = newTable();
  const unfitting = [
    null,
    "draw",
    { kind: "no-such-request" },
    { kind: "toString" },
    { kind: "draw", stackId: "no-such-stack", count: 1 },
    { kind: "draw", stackId: deckSlotId(0), count: 0 },
    { kind: "draw", stackId: discardSlotId(0), count: 1 },
    { kind: "move-card", from: { handIndex: 0 }, to: { position: { x: 0, y: 0 } } },
    { kind: "move-card", from: { stackId: deckSlotId(0) }, to: { stackId: deckSlotId(0) } },
    { kind: "move-card", from: { stackId: deckSlotId(0) }, to: { position: { x: "left", y: 0 } } },
    { kind: "spawn-card", definitionId: "no-such-card", position: { x: 0, y: 0 } },
    { kind: "add-counter", counter: "gold", amount: 1 },
    { kind: "add-counter", counter: "turn", amount: 0.5 },
  ];
  for (const request of unfitting) {
    assert.equal(apply(table, 0, request, createRandom(1)), table, JSON.stringify(request));
  }
  assert.equal(apply(table, 2, { kind: "toggle-reveal" }, createRandom(1)), table, "an unknown seat is ignored");
});

test("every accepted request advances the sequence number", () => {
  const table = newTable();
  const after = applyAll(table, 0, [{ kind: "toggle-reveal" }, { kind: "flip", from: { stackId: deckSlotId(0) } }]);
  assert.equal(after.sequence, table.sequence + 2);
  assert.equal(after.seats[0].revealed, true);
});

test("two simultaneous +1 clicks on a shared counter both count", () => {
  const after = applyAll(newTable(), 0, [
    { kind: "add-counter", counter: "modernization", amount: 1 },
    { kind: "add-counter", counter: "modernization", amount: 1 },
  ]);
  assert.equal(after.counters.modernization, 2);
});
