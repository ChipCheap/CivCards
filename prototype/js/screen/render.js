// Draws the table for one viewing seat: the board, every stack the viewer may see, both hands, the
// other player's pointer, and the hover preview. Hiding happens here (Prototyper.architecture.md PG7):
// stacks in the opponent's unrevealed private zone are not drawn at all, and the opponent's hand shows
// only card backs.

import { RESOURCES, TOKEN_ICONS, isKnownResource, resourceSymbol } from "../resources.js";
import {
  CARD_HEIGHT, CARD_WIDTH, TOKEN_SIZE, allSlotLayouts, cardTokenRectangle, isInPrivateZone, isStackInPrivateZone,
  looseTokenRectangle, marketBlocks, privateZoneRectangle, stackRectangle,
} from "./layout.js";

const HAND_CARD_GAP = 6;

// The icon under the art for each card type that has one; play cards have none. A Wonder's pyramid is
// drawn from three bars, and a strategic resource shows the resource it provides.
const TYPE_SYMBOLS = Object.freeze({ building: "🏠", blueprint: "🏠", technology: "⚗️" });
const WONDER_TYPE = "wonder";
const STRATEGIC_RESOURCE_TYPE = "resource";
// A building's hit points: the leftover Attack a raid needs to beat to destroy it.
const HP_SYMBOL = "🧱";
// "+3 Production" in rules text: a signed or plain number, then one word that may name a resource.
const TEXT_AMOUNT_PATTERN = /([+-]?\d+) ([A-Za-z]+)\b/g;

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
  const tokenElement = createElement("div", "token", RESOURCES[icon].symbol);
  tokenElement.title = RESOURCES[icon].name;
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

// One card face from the card template: the play cost over the top-left corner, the quick stat and a
// building's hit points over the top-right corner, the art, the type icon under it, the era and origin
// line, the name, the rules text, and the claim price over the bottom-left corner. Everything is drawn
// as bare icons: an amount is its resource's icon with the number on top, and a resource needed or
// used up without an amount is a smaller icon of its own.
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

  if (definition.cost.length > 0) {
    const costsElement = createElement("div", "card-costs");
    costsElement.append(...definition.cost.map(createEntryIcon));
    faceElement.append(costsElement);
  }
  if (definition.stat !== null || definition.hp !== null) {
    const cornerElement = createElement("div", "card-corner");
    if (definition.stat !== null) {
      const { amount, resource } = definition.stat;
      cornerElement.append(createIcon("card-stat", resourceSymbol(resource), entryTitle(definition.stat), amount));
    }
    if (definition.hp !== null) {
      cornerElement.append(createIcon("card-hp", HP_SYMBOL, `${definition.hp} HP`, definition.hp));
    }
    faceElement.append(cornerElement);
  }

  const typeName = definition.type.toLowerCase();
  const typeSymbol = typeName === STRATEGIC_RESOURCE_TYPE
    ? resourceSymbol(definition.stat?.resource ?? definition.name)
    : TYPE_SYMBOLS[typeName];
  const hasTypeIcon = typeName === WONDER_TYPE || typeSymbol !== undefined;
  if (hasTypeIcon) {
    const typeElement = createElement("div", "card-type", typeSymbol);
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
    bodyElement.append(createElement("div", "card-text", withResourceIcons(definition.text)));
  }
  faceElement.append(bodyElement);

  if (definition.claim.length > 0) {
    const claimElement = createElement("div", "card-claim");
    claimElement.title = "Claim price";
    claimElement.append(...definition.claim.map(createEntryIcon));
    faceElement.append(claimElement);
  }
  return faceElement;
}

// A cost or claim entry: an amount is its resource's icon with the number on top; a resource needed
// or used up without an amount is a smaller icon of its own.
function createEntryIcon(entry) {
  const className = entry.amount === null ? "card-need" : "card-price";
  return createIcon(className, resourceSymbol(entry.resource), entryTitle(entry), entry.amount);
}

function entryTitle({ amount, resource }) {
  return amount === null ? resource : `${amount} ${resource}`;
}

// A bare icon, with `amount` written over it unless it is null.
function createIcon(className, symbol, title, amount) {
  const iconElement = createElement("div", `card-icon ${className}`, symbol);
  iconElement.title = title;
  if (amount !== null) {
    iconElement.append(createElement("span", "card-icon-number", String(amount)));
  }
  return iconElement;
}

// Rules text with each amount of a known resource shown as its icon: "+3 Production" reads "+3 ⚙️".
function withResourceIcons(text) {
  return text.replace(TEXT_AMOUNT_PATTERN, (match, amount, word) => isKnownResource(word) ? `${amount} ${resourceSymbol(word)}` : match);
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
