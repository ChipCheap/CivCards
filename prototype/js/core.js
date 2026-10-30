// The table core: the whole shared table as plain data, and the only code that changes it.
// It is pure (Prototyper.architecture.md PG1): no page, network, timers or randomness of its own,
// so the same table, requests and random source always give the same result.

export const PLAYER_DECK_START = "player-deck";
export const PANEL_START = "panel";
export const MARKET_STARTS = Object.freeze(["market-resources", "market-tech", "market-blueprints", "market-wonders"]);

export const DISPLAY_SLOTS_PER_MARKET = 3;

export function deckSlotId(seat) {
  return `seat${seat}-deck`;
}

export function discardSlotId(seat) {
  return `seat${seat}-discard`;
}

export function supplySlotId(market) {
  return `${market}-supply`;
}

export function displaySlotId(market, displayNumber) {
  return `${market}-display-${displayNumber}`;
}

// Builds the starting table: each seat's shuffled deck, every market supply shuffled with its display
// slots filled face-up, and the panel stacks kept aside for the right panel.
// `random` returns a number in [0, 1), like Math.random.
export function createTable(cardDefinitions, stackDefinitions, seatCount, random) {
  const table = {
    sequence: 0,
    nextId: 1,
    definitionIds: cardDefinitions.map(definition => definition.id),
    panelStacks: stackDefinitions
      .filter(stackDefinition => stackDefinition.start === PANEL_START)
      .map(stackDefinition => ({ name: stackDefinition.name, definitionIds: [...stackDefinition.definitionIds] })),
    counters: { modernization: 0, turn: 1 },
    seats: [],
    stacks: [],
  };

  for (let seat = 0; seat < seatCount; seat++) {
    table.seats.push({ hand: [], revealed: false });
    const deckCards = createCardsForStart(table, stackDefinitions, PLAYER_DECK_START);
    table.stacks.push(createSlotStack(deckSlotId(seat), shuffle(deckCards, random)));
    table.stacks.push(createSlotStack(discardSlotId(seat), []));
  }

  for (const market of MARKET_STARTS) {
    const supplyCards = shuffle(createCardsForStart(table, stackDefinitions, market), random);
    const displayStacks = [];
    for (let displayNumber = 1; displayNumber <= DISPLAY_SLOTS_PER_MARKET; displayNumber++) {
      const displayCards = supplyCards.length > 0 ? [{ ...supplyCards.pop(), faceUp: true }] : [];
      displayStacks.push(createSlotStack(displaySlotId(market, displayNumber), displayCards));
    }
    table.stacks.push(createSlotStack(supplySlotId(market), supplyCards), ...displayStacks);
  }

  return table;
}

// Applies one player's request and returns the new table. A request that doesn't fit the current
// table returns the same table object unchanged; it never throws, because requests arrive over the
// network and the host simply re-sends its snapshot to correct the sender.
export function apply(table, seat, request, random) {
  if (!Number.isInteger(seat) || seat < 0 || seat >= table.seats.length) {
    return table;
  }
  if (typeof request !== "object" || request === null || !Object.hasOwn(REQUEST_HANDLERS, request.kind)) {
    return table;
  }
  const nextTable = structuredClone(table);
  if (!REQUEST_HANDLERS[request.kind]({ table: nextTable, seat, request, random })) {
    return table;
  }
  nextTable.sequence += 1;
  return nextTable;
}

// Each handler changes the table it is given and returns whether anything changed.
const REQUEST_HANDLERS = Object.freeze({
  "grab": grab,
  "release": release,
  "move-card": moveCard,
  "move-stack": moveStack,
  "flip": flip,
  "flip-stack": flipStack,
  "shuffle": shuffleStack,
  "draw": draw,
  "copy": copy,
  "trash-card": trashCard,
  "trash-stack": trashStack,
  "spawn-card": spawnCard,
  "spawn-stack": spawnStack,
  "add-counter": addCounter,
  "toggle-reveal": toggleReveal,
});

// { stackId } — locks a stack to the grabbing seat while its top card is dragged.
function grab({ table, seat, request }) {
  const stack = findUsableStack(table, seat, request.stackId);
  if (stack === undefined || stack.cards.length === 0 || stack.heldBy === seat) {
    return false;
  }
  stack.heldBy = seat;
  return true;
}

// { stackId } — ends the requesting seat's lock.
function release({ table, seat, request }) {
  const stack = findStack(table, request.stackId);
  if (stack === undefined || stack.heldBy !== seat) {
    return false;
  }
  stack.heldBy = null;
  return true;
}

// { from: { stackId } | { handIndex }, to: { stackId } | { position } | { handIndex } }
// Moves one card: a stack's top card or a card in the requester's hand.
function moveCard({ table, seat, request }) {
  const source = resolveSource(table, seat, request.from);
  const target = resolveTarget(table, seat, request.to);
  if (source === undefined || target === undefined) {
    return false;
  }
  if (source.stack !== undefined && source.stack === target.stack) {
    return false;
  }
  if (source.handIndex !== undefined && source.handIndex === target.handIndex) {
    return false;
  }
  placeCard(table, seat, target, takeCard(table, seat, source));
  return true;
}

// { stackId, to: { stackId } | { position } } — moves every card of a stack, order kept.
function moveStack({ table, seat, request }) {
  const stack = findUsableStack(table, seat, request.stackId);
  if (stack === undefined || stack.cards.length === 0) {
    return false;
  }
  if (request.to?.stackId !== undefined) {
    const targetStack = findUsableStack(table, seat, request.to.stackId);
    if (targetStack === undefined || targetStack === stack) {
      return false;
    }
    targetStack.cards.push(...stack.cards);
    emptyStack(table, stack);
    return true;
  }
  if (!isPosition(request.to?.position)) {
    return false;
  }
  if (stack.isSlot) {
    table.stacks.push(createLooseStack(table, request.to.position, stack.cards));
    emptyStack(table, stack);
  } else {
    stack.position = { x: request.to.position.x, y: request.to.position.y };
  }
  return true;
}

// { from: { stackId } | { handIndex } } — flips a stack's top card or a card in the requester's hand.
function flip({ table, seat, request }) {
  const source = resolveSource(table, seat, request.from);
  if (source === undefined) {
    return false;
  }
  const card = peekCard(table, seat, source);
  card.faceUp = !card.faceUp;
  return true;
}

// { stackId } — turns the whole stack over: the order reverses and every card flips.
function flipStack({ table, seat, request }) {
  const stack = findUsableStack(table, seat, request.stackId);
  if (stack === undefined || stack.cards.length === 0) {
    return false;
  }
  stack.cards = stack.cards.reverse().map(card => ({ ...card, faceUp: !card.faceUp }));
  return true;
}

// { stackId }
function shuffleStack({ table, seat, request, random }) {
  const stack = findUsableStack(table, seat, request.stackId);
  if (stack === undefined || stack.cards.length < 2) {
    return false;
  }
  stack.cards = shuffle(stack.cards, random);
  return true;
}

// { stackId, count } — draws up to `count` cards from the top into the requester's hand, face-up.
function draw({ table, seat, request }) {
  const stack = findUsableStack(table, seat, request.stackId);
  if (stack === undefined || stack.cards.length === 0 || !Number.isInteger(request.count) || request.count < 1) {
    return false;
  }
  const hand = table.seats[seat].hand;
  const drawCount = Math.min(request.count, stack.cards.length);
  for (let i = 0; i < drawCount; i++) {
    hand.push({ ...stack.cards.pop(), faceUp: true });
  }
  if (stack.cards.length === 0) {
    emptyStack(table, stack);
  }
  return true;
}

// { from: { stackId } | { handIndex }, position } — a new card of the same definition and face state,
// as its own stack at `position`.
function copy({ table, seat, request }) {
  const source = resolveSource(table, seat, request.from);
  if (source === undefined || !isPosition(request.position)) {
    return false;
  }
  const original = peekCard(table, seat, source);
  const duplicate = createCard(table, original.definitionId, original.faceUp);
  table.stacks.push(createLooseStack(table, request.position, [duplicate]));
  return true;
}

// { from: { stackId } | { handIndex } } — removes one card from the game.
function trashCard({ table, seat, request }) {
  const source = resolveSource(table, seat, request.from);
  if (source === undefined) {
    return false;
  }
  takeCard(table, seat, source);
  return true;
}

// { stackId } — removes every card of a stack; a slot stays on the board, empty.
function trashStack({ table, seat, request }) {
  const stack = findUsableStack(table, seat, request.stackId);
  if (stack === undefined || stack.cards.length === 0) {
    return false;
  }
  emptyStack(table, stack);
  return true;
}

// { definitionId, position } — a new face-up card from the catalog.
function spawnCard({ table, request }) {
  if (!table.definitionIds.includes(request.definitionId) || !isPosition(request.position)) {
    return false;
  }
  table.stacks.push(createLooseStack(table, request.position, [createCard(table, request.definitionId, true)]));
  return true;
}

// { name, position } — a fresh shuffled, face-down copy of a panel stack.
function spawnStack({ table, request, random }) {
  const panelStack = table.panelStacks.find(candidate => candidate.name === request.name);
  if (panelStack === undefined || panelStack.definitionIds.length === 0 || !isPosition(request.position)) {
    return false;
  }
  const cards = panelStack.definitionIds.map(definitionId => createCard(table, definitionId, false));
  table.stacks.push(createLooseStack(table, request.position, shuffle(cards, random)));
  return true;
}

// { counter, amount } — adds to a shared counter, so two simultaneous +1 clicks give +2.
function addCounter({ table, request }) {
  if (!Object.hasOwn(table.counters, request.counter) || !Number.isInteger(request.amount) || request.amount === 0) {
    return false;
  }
  table.counters[request.counter] += request.amount;
  return true;
}

// {} — shows or hides the requester's own private zone to the other players.
function toggleReveal({ table, seat }) {
  table.seats[seat].revealed = !table.seats[seat].revealed;
  return true;
}

// A card source is a non-empty stack the seat may use, or a valid index into the seat's hand.
function resolveSource(table, seat, from) {
  if (from?.stackId !== undefined) {
    const stack = findUsableStack(table, seat, from.stackId);
    return stack !== undefined && stack.cards.length > 0 ? { stack } : undefined;
  }
  const hand = table.seats[seat].hand;
  if (Number.isInteger(from?.handIndex) && from.handIndex >= 0 && from.handIndex < hand.length) {
    return { handIndex: from.handIndex };
  }
  return undefined;
}

// A card target is a stack the seat may use, a table position, or a position in the seat's hand.
// A hand position counts after the moving card has left, when it comes from the same hand.
function resolveTarget(table, seat, to) {
  if (to?.stackId !== undefined) {
    const stack = findUsableStack(table, seat, to.stackId);
    return stack !== undefined ? { stack } : undefined;
  }
  if (isPosition(to?.position)) {
    return { position: { x: to.position.x, y: to.position.y } };
  }
  if (Number.isInteger(to?.handIndex) && to.handIndex >= 0) {
    return { handIndex: to.handIndex };
  }
  return undefined;
}

function peekCard(table, seat, source) {
  return source.stack !== undefined ? source.stack.cards.at(-1) : table.seats[seat].hand[source.handIndex];
}

function takeCard(table, seat, source) {
  if (source.stack !== undefined) {
    const card = source.stack.cards.pop();
    if (source.stack.cards.length === 0) {
      emptyStack(table, source.stack);
    }
    return card;
  }
  return table.seats[seat].hand.splice(source.handIndex, 1)[0];
}

// Cards entering a hand turn face-up; everywhere else a card keeps its state.
function placeCard(table, seat, target, card) {
  if (target.stack !== undefined) {
    target.stack.cards.push(card);
  } else if (target.position !== undefined) {
    table.stacks.push(createLooseStack(table, target.position, [card]));
  } else {
    const hand = table.seats[seat].hand;
    hand.splice(Math.min(target.handIndex, hand.length), 0, { ...card, faceUp: true });
  }
}

// A slot keeps its place on the board when emptied; a loose stack disappears.
function emptyStack(table, stack) {
  stack.cards = [];
  stack.heldBy = null;
  if (!stack.isSlot) {
    table.stacks.splice(table.stacks.indexOf(stack), 1);
  }
}

function findStack(table, stackId) {
  return table.stacks.find(stack => stack.id === stackId);
}

// A stack another seat is dragging from can't be used by anyone else until it is released.
function findUsableStack(table, seat, stackId) {
  const stack = findStack(table, stackId);
  return stack !== undefined && (stack.heldBy === null || stack.heldBy === seat) ? stack : undefined;
}

function isPosition(value) {
  return typeof value === "object" && value !== null && Number.isFinite(value.x) && Number.isFinite(value.y);
}

function createCardsForStart(table, stackDefinitions, start) {
  return stackDefinitions
    .filter(stackDefinition => stackDefinition.start === start)
    .flatMap(stackDefinition => stackDefinition.definitionIds.map(definitionId => createCard(table, definitionId, false)));
}

function createCard(table, definitionId, faceUp) {
  return { id: `card-${table.nextId++}`, definitionId, faceUp };
}

function createSlotStack(slotId, cards) {
  return { id: slotId, isSlot: true, position: null, cards, heldBy: null };
}

function createLooseStack(table, position, cards) {
  return { id: `stack-${table.nextId++}`, isSlot: false, position: { x: position.x, y: position.y }, cards, heldBy: null };
}

// Fisher–Yates on a copy, so the caller's array is left as it was.
function shuffle(cards, random) {
  const shuffled = [...cards];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
