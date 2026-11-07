// Draws the table for one viewing seat: the board, every stack the viewer may see, both hands, the
// other player's pointer, and the hover preview. Hiding happens here (Prototyper.architecture.md PG7):
// stacks in the opponent's unrevealed private zone are not drawn at all, and the opponent's hand shows
// only card backs.

import { TOKEN_ICONS } from "../core.js";
import {
  CARD_HEIGHT, CARD_WIDTH, TOKEN_SIZE, allSlotLayouts, cardTokenRectangle, isInPrivateZone, isStackInPrivateZone,
  looseTokenRectangle, marketBlocks, privateZoneRectangle, stackRectangle,
} from "./layout.js";

const HAND_CARD_GAP = 6;

// The face of each token icon in `TOKEN_ICONS`.
export const TOKEN_FACES = Object.freeze({
  plant: { symbol: "🌿", name: "Plant" },
  rock: { symbol: "🪨", name: "Rock" },
  tool: { symbol: "🔨", name: "Tool" },
  coin: { symbol: "🪙", name: "Coin" },
});

// The symbol for each resource a card's cost, uses, stat or claim names, by lower-case name. The token
// icons are included, so a card can use what a token stands for.
const RESOURCE_SYMBOLS = Object.freeze({
  ...Object.fromEntries(Object.entries(TOKEN_FACES).map(([icon, face]) => [icon, face.symbol])),
  production: "⚙️",
  food: "🌾",
  attack: "⚔️",
  military: "⚔️",
  knowledge: "📖",
  culture: "🏛️",
  cards: "🃏",
  iron: "⛓️",
  powder: "💥",
  timber: "🪵",
  horses: "🐎",
  stone: "🧱",
});

// The icon under the art for each card type that has one; play cards have none. A Wonder's pyramid is
// drawn from three bars rather than a symbol.
const TYPE_SYMBOLS = Object.freeze({ building: "🏠", blueprint: "🏠", technology: "⚗️" });
const WONDER_TYPE = "wonder";

// Whether `viewerSeat` may see a stack's cards at all. A stack, loose or in a building slot, is hidden
// while it lies in the other seat's private zone and that seat hasn't revealed it; the empty slot
// outlines are part of the board and always drawn. The board has two sides, so the other seat is
// 1 - viewerSeat.
export function isStackVisibleTo(table, stack, viewerSeat) {
  const otherSeat = 1 - viewerSeat;
  return table.seats[otherSeat].revealed || !isStackInPrivateZone(stack, otherSeat);
}

// A loose token pile follows the same hiding rule as a loose stack; a pile on a card is drawn with
// its card's stack.
export function isLoosePileVisibleTo(table, pile, viewerSeat) {
  const otherSeat = 1 - viewerSeat;
  return table.seats[otherSeat].revealed || !isInPrivateZone(pile.position, otherSeat);
}

// One round token showing its icon, with the number of tokens when it is a pile of more than one.
export function createTokenElement(icon, count) {
  const tokenElement = createElement("div", "token", TOKEN_FACES[icon].symbol);
  tokenElement.title = TOKEN_FACES[icon].name;
  if (count > 1) {
    tokenElement.append(createElement("div", "token-count", String(count)));
  }
  return tokenElement;
}

// The piles on one card, in a row over its picture, placed relative to the card. `countOf` gives the
// number to draw for a pile, which is less than its count while part of it is being dragged.
export function createCardTokenElements(piles, countOf = pile => pile.count) {
  const drawnPiles = piles
    .filter(pile => countOf(pile) > 0)
    .sort((first, second) => TOKEN_ICONS.indexOf(first.icon) - TOKEN_ICONS.indexOf(second.icon));
  return drawnPiles.map((pile, pileIndex) => {
    const tokenElement = createTokenElement(pile.icon, countOf(pile));
    tokenElement.dataset.tokenId = pile.id;
    placeElement(tokenElement, cardTokenRectangle(pileIndex, drawnPiles.length));
    return tokenElement;
  });
}

// One card face from the card template: the play cost over the top-left corner (the main costs as
// their own icons with a number, then a circle per resource used), the quick stat over the top-right
// corner, the art, the type icon under it, the era and origin line, the name, the rules text, and the
// claim price in the bottom-left corner.
export function createCardFace(definition) {
  const faceElement = createElement("div", "card face");
  faceElement.dataset.definitionId = definition.id;

  const artElement = createElement("div", "card-art");
  if (definition.art !== "") {
    const pictureElement = createElement("img", "card-picture");
    pictureElement.alt = "";
    pictureElement.src = `cards/art/${encodeURIComponent(definition.art)}`;
    // A missing picture leaves the card readable without it.
    pictureElement.addEventListener("error", () => pictureElement.remove(), { once: true });
    artElement.append(pictureElement);
  }
  faceElement.append(artElement);

  if (definition.cost.length > 0 || definition.uses.length > 0) {
    const costsElement = createElement("div", "card-costs");
    costsElement.append(
      ...definition.cost.map(({ amount, resource }) => createAmountIcon("card-cost", amount, resource)),
      ...definition.uses.map(resource => createResourceCircle("card-use", resource)),
    );
    faceElement.append(costsElement);
  }
  if (definition.stat !== null) {
    faceElement.append(createAmountIcon("card-stat", definition.stat.amount, definition.stat.resource));
  }

  const typeName = definition.type.toLowerCase();
  const hasTypeIcon = typeName === WONDER_TYPE || Object.hasOwn(TYPE_SYMBOLS, typeName);
  if (hasTypeIcon) {
    const typeElement = createElement("div", "card-type", TYPE_SYMBOLS[typeName]);
    typeElement.title = definition.type;
    if (typeName === WONDER_TYPE) {
      typeElement.append(...["top", "middle", "bottom"].map(level => createElement("div", `pyramid-bar ${level}`)));
    }
    faceElement.append(typeElement);
  }

  const bodyElement = createElement("div", "card-body");
  bodyElement.classList.toggle("has-type-icon", hasTypeIcon);
  bodyElement.classList.toggle("has-claim", definition.claim.length > 0);
  const eraLine = [definition.era === "" ? "" : `Era ${definition.era}`, definition.origin].filter(Boolean).join(" · ");
  bodyElement.append(createElement("div", "card-era", eraLine), createElement("div", "card-name", definition.name));
  if (definition.text !== "") {
    bodyElement.append(createElement("div", "card-text", definition.text));
  }
  faceElement.append(bodyElement);

  if (definition.claim.length > 0) {
    const claimElement = createElement("div", "card-claim");
    claimElement.title = "Claim price";
    claimElement.append(...definition.claim.map(({ amount, resource }) => createResourceCircle("card-claim-amount", resource, amount)));
    faceElement.append(claimElement);
  }
  return faceElement;
}

// A resource's own icon, drawn large, with the amount written over it.
function createAmountIcon(className, amount, resource) {
  const iconElement = createElement("div", `card-amount ${className}`, resourceSymbol(resource));
  iconElement.title = `${amount} ${resource}`;
  iconElement.append(createElement("span", "card-amount-number", String(amount)));
  return iconElement;
}

// A small circle with a resource's icon, and its amount when it has one.
function createResourceCircle(className, resource, amount) {
  const circleElement = createElement("div", `card-circle ${className}`);
  circleElement.title = amount === undefined ? resource : `${amount} ${resource}`;
  if (amount !== undefined) {
    circleElement.append(createElement("span", "card-circle-number", String(amount)));
  }
  circleElement.append(createElement("span", "card-circle-symbol", resourceSymbol(resource)));
  return circleElement;
}

// A resource without a symbol of its own shows its first two letters, so a new name still reads.
function resourceSymbol(resource) {
  return RESOURCE_SYMBOLS[resource.toLowerCase()] ?? resource.slice(0, 2);
}

export function createCardBack() {
  return createElement("div", "card back", "CivCards");
}

// `cards` are the card definitions; `view` comes from createView for this seat.
export function createScreen({ boardElement, handElement, opponentHandElement, previewElement, view, seat, cards }) {
  const definitions = new Map(cards.map(card => [card.id, card]));
  const opponentSeat = 1 - seat;
  let currentTable;
  // What the local player is dragging, drawn as already lifted: { stackId, wholeStack }, { handIndex }
  // or { tokenId, wholePile }.
  let dragSource = null;
  // The stack or slot id a drop would land on, highlighted.
  let highlightedId = null;

  boardElement.style.setProperty("--card-width", `${CARD_WIDTH}px`);
  boardElement.style.setProperty("--card-height", `${CARD_HEIGHT}px`);
  document.documentElement.style.setProperty("--token-size", `${TOKEN_SIZE}px`);
  const ownZoneLabel = drawPrivateZone(seat, "own");
  const opponentZoneLabel = drawPrivateZone(opponentSeat, "opponent");
  for (const { slotId, rectangle, label } of allSlotLayouts()) {
    const slotElement = createElement("div", "slot", label);
    slotElement.dataset.slotId = slotId;
    placeElement(slotElement, view.toBoardRectangle(rectangle));
    boardElement.append(slotElement);
  }
  // Titles go above each market block as this viewer sees it, so they stay on top when mirrored.
  for (const block of marketBlocks()) {
    const titleElement = createElement("div", "market-title", block.title);
    const boardRectangle = view.toBoardRectangle(block.rectangle);
    titleElement.style.left = `${boardRectangle.x}px`;
    titleElement.style.top = `${boardRectangle.y}px`;
    boardElement.append(titleElement);
  }
  const stackLayer = createElement("div", "stack-layer");
  const presenceLayer = createElement("div", "presence-layer");
  boardElement.append(stackLayer, presenceLayer);

  // Any face-up card anywhere on the page can be read larger.
  let lastPointer = { clientX: 0, clientY: 0 };
  document.addEventListener("pointermove", event => {
    lastPointer = { clientX: event.clientX, clientY: event.clientY };
  });
  document.addEventListener("pointerover", event => {
    const face = event.target.closest(".card.face");
    if (face !== null && !previewElement.contains(face)) {
      showPreview(face);
    }
  });
  document.addEventListener("pointerout", event => {
    if (event.target.closest(".card.face") !== null) {
      previewElement.hidden = true;
    }
  });

  function showPreview(face) {
    previewElement.replaceChildren(createCardFace(definitions.get(face.dataset.definitionId)));
    previewElement.hidden = false;
  }

  // A redraw replaces card elements without any pointerout, so the preview follows whatever face is
  // now under the pointer, or hides when there is none.
  function refreshPreview() {
    if (previewElement.hidden) {
      return;
    }
    const face = document.elementFromPoint(lastPointer.clientX, lastPointer.clientY)?.closest(".card.face") ?? null;
    if (face === null || previewElement.contains(face)) {
      previewElement.hidden = true;
    } else {
      showPreview(face);
    }
  }
  // The strip changes width with the window and when the right panel collapses or opens.
  new ResizeObserver(() => fitHand()).observe(handElement);

  function drawPrivateZone(zoneSeat, owner) {
    const zoneElement = createElement("div", `private-zone ${owner}`);
    placeElement(zoneElement, view.toBoardRectangle(privateZoneRectangle(zoneSeat)));
    const labelElement = createElement("div", "private-zone-label");
    zoneElement.append(labelElement);
    boardElement.append(zoneElement);
    return labelElement;
  }

  // The cards of a stack as drawn now: without the lifted card, or none if the whole stack is lifted.
  function drawnCards(stack) {
    if (dragSource?.stackId !== stack.id) {
      return stack.cards;
    }
    return dragSource.wholeStack ? [] : stack.cards.slice(0, -1);
  }

  // How many tokens of a pile are drawn where it lies: fewer while some are being dragged.
  function drawnTokenCount(pile) {
    if (dragSource?.tokenId !== pile.id) {
      return pile.count;
    }
    return dragSource.wholePile ? 0 : pile.count - 1;
  }

  function createStackElement(stack, cardsToDraw, tokenPiles) {
    const stackElement = createElement("div", "stack");
    stackElement.dataset.stackId = stack.id;
    stackElement.classList.toggle("is-held", stack.heldBy !== null && stack.heldBy !== seat);
    placeElement(stackElement, view.toBoardRectangle(stackRectangle(stack)));
    const topCard = cardsToDraw.at(-1);
    stackElement.append(createCardElement(topCard));
    stackElement.append(...createCardTokenElements(tokenPiles.filter(pile => pile.cardId === topCard.id), drawnTokenCount));
    if (cardsToDraw.length > 1) {
      stackElement.append(createElement("div", "count-badge", String(cardsToDraw.length)));
    }
    return stackElement;
  }

  function createLooseTokenElement(pile) {
    const tokenElement = createTokenElement(pile.icon, drawnTokenCount(pile));
    tokenElement.dataset.tokenId = pile.id;
    placeElement(tokenElement, view.toBoardRectangle(looseTokenRectangle(pile.position)));
    return tokenElement;
  }

  function createCardElement(card) {
    return card.faceUp ? createCardFace(definitions.get(card.definitionId)) : createCardBack();
  }

  function createHandCardElement(card, handIndex) {
    const cardElement = createCardElement(card);
    cardElement.dataset.handIndex = String(handIndex);
    cardElement.classList.toggle("is-lifted", dragSource?.handIndex === handIndex);
    return cardElement;
  }

  // Cards sit side by side while they fit; past that they overlap evenly to fill the strip.
  function fitHand() {
    const handCards = [...handElement.children];
    const availableWidth = handElement.clientWidth - 2 * HAND_CARD_GAP;
    const naturalWidth = handCards.length * (CARD_WIDTH + HAND_CARD_GAP);
    const overlap = handCards.length > 1 && naturalWidth > availableWidth
      ? (availableWidth - CARD_WIDTH) / (handCards.length - 1) - CARD_WIDTH
      : HAND_CARD_GAP;
    handCards.forEach((cardElement, handIndex) => {
      cardElement.style.marginLeft = handIndex === 0 ? "0px" : `${overlap}px`;
    });
  }

  function applyHighlight() {
    for (const element of boardElement.querySelectorAll(".is-target")) {
      element.classList.remove("is-target");
    }
    if (highlightedId !== null) {
      for (const element of boardElement.querySelectorAll(`[data-stack-id="${highlightedId}"], [data-slot-id="${highlightedId}"]`)) {
        element.classList.add("is-target");
      }
    }
  }

  function draw() {
    const table = currentTable;
    const stackElements = [];
    for (const stack of table.stacks) {
      const cardsToDraw = drawnCards(stack);
      if (cardsToDraw.length > 0 && isStackVisibleTo(table, stack, seat)) {
        stackElements.push(createStackElement(stack, cardsToDraw, table.tokens));
      }
    }
    // Loose tokens lie above every card.
    const looseTokenElements = table.tokens
      .filter(pile => pile.cardId === null && drawnTokenCount(pile) > 0 && isLoosePileVisibleTo(table, pile, seat))
      .map(createLooseTokenElement);
    stackLayer.replaceChildren(...stackElements, ...looseTokenElements);
    applyHighlight();
    ownZoneLabel.textContent = table.seats[seat].revealed
      ? "Your buildings — revealed to your opponent"
      : "Your buildings — hidden from your opponent";
    opponentZoneLabel.textContent = table.seats[opponentSeat].revealed
      ? "Opponent's buildings — revealed"
      : "Opponent's buildings — hidden";
    handElement.replaceChildren(...table.seats[seat].hand.map(createHandCardElement));
    fitHand();
    const opponentHandSize = table.seats[opponentSeat].hand.length;
    opponentHandElement.replaceChildren(
      createElement("div", "hand-count", `Opponent's hand: ${opponentHandSize}`),
      ...Array.from({ length: opponentHandSize }, createCardBack),
    );
    refreshPreview();
  }

  return {
    showTable(table) {
      currentTable = table;
      draw();
    },

    setDragSource(source) {
      dragSource = source;
      draw();
    },

    setHighlight(targetId) {
      highlightedId = targetId;
      applyHighlight();
    },

    // `presence` is null (the other player's pointer left the table) or
    // { cursor: { x, y }, held: null | { definitionId } } in table units. The sender leaves
    // definitionId null for any card this viewer may not see, so only its back is drawn.
    showPresence(presenceSeat, presence) {
      if (presenceSeat !== opponentSeat) {
        return;
      }
      if (presence === null) {
        presenceLayer.replaceChildren();
        return;
      }
      if (!isPresence(presence)) {
        return;
      }
      const boardPoint = view.toBoardPoint(presence.cursor);
      const pointerElement = createElement("div", "presence-pointer", "Opponent");
      pointerElement.style.left = `${boardPoint.x}px`;
      pointerElement.style.top = `${boardPoint.y}px`;
      if (presence.held !== null) {
        const heldDefinition = definitions.get(presence.held.definitionId);
        const heldElement = heldDefinition === undefined ? createCardBack() : createCardFace(heldDefinition);
        heldElement.classList.add("held-card");
        pointerElement.append(heldElement);
      }
      presenceLayer.replaceChildren(pointerElement);
    },
  };
}

// Presence arrives over the network, so its shape is checked before use.
function isPresence(presence) {
  return typeof presence === "object"
    && Number.isFinite(presence.cursor?.x) && Number.isFinite(presence.cursor?.y)
    && (presence.held === null || (typeof presence.held === "object" && "definitionId" in presence.held));
}

export function createElement(tagName, className, text) {
  const element = document.createElement(tagName);
  element.className = className;
  if (text !== undefined) {
    element.textContent = text;
  }
  return element;
}

function placeElement(element, rectangle) {
  element.style.left = `${rectangle.x}px`;
  element.style.top = `${rectangle.y}px`;
  element.style.width = `${rectangle.width}px`;
  element.style.height = `${rectangle.height}px`;
}
