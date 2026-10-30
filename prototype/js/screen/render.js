// Draws the table for one viewing seat: the board, every stack the viewer may see, both hands, the
// other player's pointer, and the hover preview. Hiding happens here (Prototyper.architecture.md PG7):
// stacks in the opponent's unrevealed private zone are not drawn at all, and the opponent's hand shows
// only card backs.

import { CARD_HEIGHT, CARD_WIDTH, allSlotLayouts, isInPrivateZone, looseStackRect, marketBlocks, privateZoneRect, slotLayout } from "./layout.js";

// `cards` are the card definitions; `view` comes from createView for this seat.
export function createScreen({ boardElement, handElement, opponentHandElement, previewElement, view, seat, cards }) {
  const definitions = new Map(cards.map(card => [card.id, card]));
  // The board has two sides, so the opponent is the other seat.
  const opponentSeat = 1 - seat;

  boardElement.style.setProperty("--card-width", `${CARD_WIDTH}px`);
  boardElement.style.setProperty("--card-height", `${CARD_HEIGHT}px`);
  const ownZoneLabel = drawPrivateZone(seat, "own");
  const opponentZoneLabel = drawPrivateZone(opponentSeat, "opponent");
  for (const { rect, label } of allSlotLayouts()) {
    const slotElement = createElement("div", "slot", label);
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

  for (const container of [boardElement, handElement]) {
    container.addEventListener("pointerover", event => {
      const face = event.target.closest(".card.face");
      if (face === null) {
        return;
      }
      previewElement.replaceChildren(createFaceElement(definitions.get(face.dataset.definitionId)));
      previewElement.hidden = false;
    });
    container.addEventListener("pointerout", event => {
      if (event.target.closest(".card.face") !== null) {
        previewElement.hidden = true;
      }
    });
  }

  function drawPrivateZone(zoneSeat, owner) {
    const zoneElement = createElement("div", `private-zone ${owner}`);
    placeElement(zoneElement, view.toBoardRect(privateZoneRect(zoneSeat)));
    const labelElement = createElement("div", "private-zone-label");
    zoneElement.append(labelElement);
    boardElement.append(zoneElement);
    return labelElement;
  }

  function isVisible(table, stack) {
    if (stack.cards.length === 0) {
      return false;
    }
    if (stack.isSlot || table.seats[opponentSeat].revealed) {
      return true;
    }
    return !isInPrivateZone(stack.position, opponentSeat);
  }

  function createStackElement(stack) {
    const stackElement = createElement("div", "stack");
    stackElement.dataset.stackId = stack.id;
    stackElement.classList.toggle("is-held", stack.heldBy !== null);
    const rect = stack.isSlot ? slotLayout(stack.id).rect : looseStackRect(stack.position);
    placeElement(stackElement, view.toBoardRect(rect));
    stackElement.append(createCardElement(stack.cards.at(-1)));
    if (stack.cards.length > 1) {
      stackElement.append(createElement("div", "count-badge", String(stack.cards.length)));
    }
    return stackElement;
  }

  function createCardElement(card) {
    return card.faceUp ? createFaceElement(definitions.get(card.definitionId)) : createBackElement();
  }

  function createFaceElement(definition) {
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

  return {
    showTable(table) {
      stackLayer.replaceChildren(...table.stacks.filter(stack => isVisible(table, stack)).map(createStackElement));
      ownZoneLabel.textContent = table.seats[seat].revealed
        ? "Your buildings — revealed to your opponent"
        : "Your buildings — hidden from your opponent";
      opponentZoneLabel.textContent = table.seats[opponentSeat].revealed
        ? "Opponent's buildings — revealed"
        : "Opponent's buildings — hidden";
      handElement.replaceChildren(...table.seats[seat].hand.map(createCardElement));
      const opponentHandSize = table.seats[opponentSeat].hand.length;
      opponentHandElement.replaceChildren(
        createElement("div", "hand-count", `Opponent's hand: ${opponentHandSize}`),
        ...Array.from({ length: opponentHandSize }, createBackElement),
      );
    },

    // `presence` is { cursor: { x, y }, held: null | { definitionId } } in table units. The sender
    // leaves definitionId null for any card this viewer may not see, so only its back is drawn.
    showPresence(presenceSeat, presence) {
      if (presenceSeat !== opponentSeat || !isPresence(presence)) {
        return;
      }
      const boardPoint = view.toBoardPoint(presence.cursor);
      const pointerElement = createElement("div", "presence-pointer", "Opponent");
      pointerElement.style.left = `${boardPoint.x}px`;
      pointerElement.style.top = `${boardPoint.y}px`;
      if (presence.held !== null) {
        const heldDefinition = definitions.get(presence.held.definitionId);
        const heldElement = heldDefinition === undefined ? createBackElement() : createFaceElement(heldDefinition);
        heldElement.classList.add("held-card");
        pointerElement.append(heldElement);
      }
      presenceLayer.replaceChildren(pointerElement);
    },
  };
}

// Presence arrives over the network, so its shape is checked before use.
function isPresence(presence) {
  return typeof presence === "object" && presence !== null
    && Number.isFinite(presence.cursor?.x) && Number.isFinite(presence.cursor?.y)
    && (presence.held === null || (typeof presence.held === "object" && "definitionId" in presence.held));
}

function createBackElement() {
  return createElement("div", "card back", "CivCards");
}

function createElement(tagName, className, text) {
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
