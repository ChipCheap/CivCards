// Draws the table for one viewing seat: the board, every stack the viewer may see, both hands, the
// other player's pointer, and the hover preview. Hiding happens here (Prototyper.architecture.md PG7):
// stacks in the opponent's unrevealed private zone are not drawn at all, and the opponent's hand shows
// only card backs.

import { CARD_HEIGHT, CARD_WIDTH, allSlotLayouts, isInPrivateZone, marketBlocks, privateZoneRect, stackRect } from "./layout.js";

const HAND_CARD_GAP = 6;

// Whether `viewerSeat` may see a stack at all. Slots are always visible; a loose stack is hidden while
// it lies in the other seat's private zone and that seat hasn't revealed it. The board has two sides,
// so the other seat is 1 - viewerSeat.
export function isStackVisibleTo(table, stack, viewerSeat) {
  const otherSeat = 1 - viewerSeat;
  return stack.isSlot || table.seats[otherSeat].revealed || !isInPrivateZone(stack.position, otherSeat);
}

// One card face from the card template.
export function createCardFace(definition) {
  const faceElement = createElement("div", "card face");
  faceElement.dataset.definitionId = definition.id;
  faceElement.append(createElement("div", "card-name", definition.name));
  const kind = [definition.type, definition.era === "" ? "" : `Era ${definition.era}`].filter(Boolean).join(" · ");
  faceElement.append(createElement("div", "card-kind", kind));
  if (definition.art !== "") {
    const artElement = createElement("img", "card-art");
    artElement.alt = "";
    artElement.src = `cards/art/${encodeURIComponent(definition.art)}`;
    // A missing picture leaves the card readable without it.
    artElement.addEventListener("error", () => artElement.remove(), { once: true });
    faceElement.append(artElement);
  }
  if (definition.cost !== "") {
    faceElement.append(createElement("div", "card-cost", definition.cost));
  }
  faceElement.append(createElement("div", "card-text", definition.text));
  return faceElement;
}

export function createCardBack() {
  return createElement("div", "card back", "CivCards");
}

// `cards` are the card definitions; `view` comes from createView for this seat.
export function createScreen({ boardElement, handElement, opponentHandElement, previewElement, view, seat, cards }) {
  const definitions = new Map(cards.map(card => [card.id, card]));
  const opponentSeat = 1 - seat;
  let currentTable;
  // What the local player is dragging, drawn as already lifted: { stackId, wholeStack } or { handIndex }.
  let dragSource = null;
  // The stack or slot id a drop would land on, highlighted.
  let highlightedId = null;

  boardElement.style.setProperty("--card-width", `${CARD_WIDTH}px`);
  boardElement.style.setProperty("--card-height", `${CARD_HEIGHT}px`);
  const ownZoneLabel = drawPrivateZone(seat, "own");
  const opponentZoneLabel = drawPrivateZone(opponentSeat, "opponent");
  for (const { slotId, rect, label } of allSlotLayouts()) {
    const slotElement = createElement("div", "slot", label);
    slotElement.dataset.slotId = slotId;
    placeElement(slotElement, view.toBoardRect(rect));
    boardElement.append(slotElement);
  }
  // Titles go above each market block as this viewer sees it, so they stay on top when mirrored.
  for (const block of marketBlocks()) {
    const titleElement = createElement("div", "market-title", block.title);
    const boardRect = view.toBoardRect(block.rect);
    titleElement.style.left = `${boardRect.x}px`;
    titleElement.style.top = `${boardRect.y}px`;
    boardElement.append(titleElement);
  }
  const stackLayer = createElement("div", "stack-layer");
  const presenceLayer = createElement("div", "presence-layer");
  boardElement.append(stackLayer, presenceLayer);

  // Any face-up card anywhere on the page can be read larger.
  document.addEventListener("pointerover", event => {
    const face = event.target.closest(".card.face");
    if (face === null || previewElement.contains(face)) {
      return;
    }
    previewElement.replaceChildren(createCardFace(definitions.get(face.dataset.definitionId)));
    previewElement.hidden = false;
  });
  document.addEventListener("pointerout", event => {
    if (event.target.closest(".card.face") !== null) {
      previewElement.hidden = true;
    }
  });
  // The strip changes width with the window and when the right panel collapses or opens.
  new ResizeObserver(() => fitHand()).observe(handElement);

  function drawPrivateZone(zoneSeat, owner) {
    const zoneElement = createElement("div", `private-zone ${owner}`);
    placeElement(zoneElement, view.toBoardRect(privateZoneRect(zoneSeat)));
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

  function createStackElement(stack, cardsToDraw) {
    const stackElement = createElement("div", "stack");
    stackElement.dataset.stackId = stack.id;
    stackElement.classList.toggle("is-held", stack.heldBy !== null && stack.heldBy !== seat);
    placeElement(stackElement, view.toBoardRect(stackRect(stack)));
    stackElement.append(createCardElement(cardsToDraw.at(-1)));
    if (cardsToDraw.length > 1) {
      stackElement.append(createElement("div", "count-badge", String(cardsToDraw.length)));
    }
    return stackElement;
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
        stackElements.push(createStackElement(stack, cardsToDraw));
      }
    }
    stackLayer.replaceChildren(...stackElements);
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

function placeElement(element, rect) {
  element.style.left = `${rect.x}px`;
  element.style.top = `${rect.y}px`;
  element.style.width = `${rect.width}px`;
  element.style.height = `${rect.height}px`;
}
