// Turns mouse and keyboard into table requests: dragging and dropping, the keys, the right-click menu
// and search. The cursor point at drop time alone picks where a card goes (Prototyper.framework.md
// PA3). It also sends this player's pointer and held card to the other player as presence.

import { CARD_HEIGHT, CARD_WIDTH, containsPoint, isInPrivateZone, stackRect } from "./layout.js";
import { createCardBack, createCardFace, createElement, isStackVisibleTo } from "./render.js";

const DRAG_THRESHOLD_PIXELS = 4;
const PRESENCE_INTERVAL_MILLISECONDS = 50;
// A drop is drawn as done until the next table arrives; if none comes, the card goes back after this.
const PENDING_DROP_LIMIT_MILLISECONDS = 1500;
// A copy lands this far to the right of the card it copies, in table units, overlapping it a little
// so both stay readable.
const COPY_SHIFT = 40;
const DRAW_KEYS = Object.freeze(["Digit1", "Digit2", "Digit3", "Digit4", "Digit5", "Digit6", "Digit7", "Digit8", "Digit9"]);

// `screen` is the drawing side from createScreen; `sendRequest` and `sendPresence` go to the session.
export function createInput({ viewportElement, handElement, panelElement, screen, view, seat, cards, sendRequest, sendPresence }) {
  const definitions = new Map(cards.map(card => [card.id, card]));
  let table;
  let pointer = { clientX: 0, clientY: 0 };
  // What the cursor is over when nothing is held: { stackId } or { handIndex }, or null.
  let hovered = null;
  // The drag in progress, or null. `source` is one of { stackId, wholeStack }, { handIndex },
  // { definitionId } (catalog card) or { panelStackName }.
  let drag = null;
  let lastPresenceAt = 0;
  let openPopup = null;

  viewportElement.addEventListener("pointerdown", event => {
    const stackElement = event.target.closest("[data-stack-id]");
    if (event.button === 0 && stackElement !== null) {
      startDrag(event, { stackId: stackElement.dataset.stackId, wholeStack: event.shiftKey });
    }
  });
  handElement.addEventListener("pointerdown", event => {
    const cardElement = event.target.closest("[data-hand-index]");
    if (event.button === 0 && cardElement !== null) {
      startDrag(event, { handIndex: Number(cardElement.dataset.handIndex) });
    }
  });
  panelElement.addEventListener("pointerdown", event => {
    const catalogElement = event.target.closest(".catalog-card");
    const panelStackElement = event.target.closest(".panel-stack");
    if (event.button !== 0) {
      return;
    }
    if (catalogElement !== null) {
      startDrag(event, { definitionId: catalogElement.dataset.definitionId });
    } else if (panelStackElement !== null) {
      startDrag(event, { panelStackName: panelStackElement.dataset.panelStack });
    }
  });

  window.addEventListener("pointermove", event => {
    pointer = { clientX: event.clientX, clientY: event.clientY };
    if (drag === null) {
      hovered = hoveredThing(event.target);
    } else if (!drag.isMoving && !drag.isDropping
      && Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) > DRAG_THRESHOLD_PIXELS) {
      beginMoving();
    }
    if (drag?.isMoving) {
      placeGhost();
      highlightTarget(resolveDrop(event.clientX, event.clientY));
    }
    sendPresenceSoon();
  });
  viewportElement.addEventListener("pointerleave", () => {
    if (drag === null) {
      sendPresence(null);
    }
  });
  window.addEventListener("pointerup", event => {
    if (drag === null || drag.isDropping) {
      return;
    }
    if (drag.isMoving) {
      drop(resolveDrop(event.clientX, event.clientY));
    } else {
      drag = null;
    }
  });

  window.addEventListener("keydown", event => {
    if (event.repeat || event.ctrlKey || event.metaKey || event.altKey || isTyping(event.target)) {
      return;
    }
    if (event.code === "Escape") {
      closePopup();
      if (drag?.isMoving && !drag.isDropping) {
        cancelDrag();
      }
      return;
    }
    const focus = drag?.isMoving ? drag.source : hovered;
    if (focus === null) {
      return;
    }
    const drawCount = DRAW_KEYS.indexOf(event.code) + 1;
    if (drawCount > 0 && focus.stackId !== undefined) {
      sendRequest({ kind: "draw", stackId: focus.stackId, count: drawCount });
    } else if (event.code === "KeyF" && event.shiftKey && focus.stackId !== undefined) {
      sendRequest({ kind: "flip-stack", stackId: focus.stackId });
    } else if (event.code === "KeyF" && !event.shiftKey && cardSource(focus) !== undefined) {
      sendRequest({ kind: "flip", from: cardSource(focus) });
    } else if (event.code === "KeyR" && focus.stackId !== undefined) {
      sendRequest({ kind: "shuffle", stackId: focus.stackId });
    } else if (event.code === "KeyC" && focus.stackId !== undefined) {
      sendRequest({ kind: "copy", from: { stackId: focus.stackId }, position: besideStack(focus.stackId) });
    } else if (event.code === "KeyC" && focus.handIndex !== undefined) {
      sendRequest({ kind: "copy", from: { handIndex: focus.handIndex } });
    }
  });

  viewportElement.addEventListener("contextmenu", event => {
    const stackElement = event.target.closest("[data-stack-id]");
    if (stackElement === null) {
      return;
    }
    event.preventDefault();
    openStackMenu(stackElement.dataset.stackId, event.clientX, event.clientY);
  });
  window.addEventListener("pointerdown", event => {
    if (openPopup !== null && !openPopup.contains(event.target)) {
      closePopup();
    }
  }, { capture: true });

  // --- Dragging ---

  function startDrag(event, source) {
    event.preventDefault();
    // A new drag settles a drop still waiting for its table.
    endDrag();
    drag = { source, startX: event.clientX, startY: event.clientY, isMoving: false, isDropping: false };
  }

  function beginMoving() {
    const { source } = drag;
    if (source.stackId !== undefined) {
      const stack = findStack(source.stackId);
      if (stack === undefined || (stack.heldBy !== null && stack.heldBy !== seat)) {
        drag = null;
        return;
      }
      sendRequest({ kind: "grab", stackId: source.stackId });
    }
    drag.isMoving = true;
    drag.ghostElement = createElement("div", "drag-ghost");
    document.body.append(drag.ghostElement);
    refreshGhost();
    placeGhost();
    if (source.stackId !== undefined || source.handIndex !== undefined) {
      screen.setDragSource(source);
    }
  }

  // The ghost shows the card as the table has it now, so a flip while dragging shows at once.
  function refreshGhost() {
    const { source, ghostElement } = drag;
    let cardElement;
    if (source.definitionId !== undefined) {
      cardElement = createCardFace(definitions.get(source.definitionId));
    } else if (source.panelStackName !== undefined) {
      cardElement = createCardBack();
    } else {
      const card = heldCard();
      cardElement = card.faceUp ? createCardFace(definitions.get(card.definitionId)) : createCardBack();
    }
    ghostElement.replaceChildren(cardElement);
  }

  function placeGhost() {
    drag.ghostElement.style.left = `${pointer.clientX - CARD_WIDTH / 2}px`;
    drag.ghostElement.style.top = `${pointer.clientY - CARD_HEIGHT / 2}px`;
  }

  function heldCard() {
    const { source } = drag;
    if (source.handIndex !== undefined) {
      return table.seats[seat].hand[source.handIndex];
    }
    return findStack(source.stackId).cards.at(-1);
  }

  // Where a drop at this screen point lands: the trash, the hand at an index, a stack or slot, or an
  // empty table point. Null means nowhere useful, and the card goes back.
  function resolveDrop(clientX, clientY) {
    if (isOver(panelElement.querySelector(".trash-can"), clientX, clientY)) {
      return { trash: true };
    }
    if (isOver(handElement, clientX, clientY)) {
      return { handIndex: handIndexAt(clientX) };
    }
    if (!isOver(viewportElement, clientX, clientY)) {
      return null;
    }
    const point = view.toTablePoint(clientX, clientY);
    const stack = stackAt(point);
    return stack === undefined ? { position: point } : { stackId: stack.id, position: point };
  }

  // The topmost stack or slot under a table point that this player may see. The stack being lifted
  // doesn't count when nothing of it would stay behind.
  function stackAt(point) {
    for (let i = table.stacks.length - 1; i >= 0; i--) {
      const stack = table.stacks[i];
      if (isLiftedAway(stack) || !containsPoint(stackRect(stack), point)) {
        continue;
      }
      if (stack.isSlot || isStackVisibleTo(table, stack, seat)) {
        return stack;
      }
    }
    return undefined;
  }

  function isLiftedAway(stack) {
    const source = drag?.source;
    if (source?.stackId !== stack.id || stack.isSlot) {
      return false;
    }
    return source.wholeStack || stack.cards.length === 1;
  }

  function handIndexAt(clientX) {
    const cardElements = [...handElement.querySelectorAll("[data-hand-index]")];
    const index = cardElements.filter(cardElement => {
      const bounds = cardElement.getBoundingClientRect();
      return bounds.left + bounds.width / 2 < clientX;
    }).length;
    // Moving a card within the hand: the index counts after the card has left.
    const sourceIndex = drag?.source.handIndex;
    return sourceIndex !== undefined && sourceIndex < index ? index - 1 : index;
  }

  function highlightTarget(target) {
    screen.setHighlight(target?.stackId ?? null);
    panelElement.querySelector(".trash-can").classList.toggle("is-target", target?.trash === true);
  }

  function drop(target) {
    const requests = target === null ? [] : dropRequests(drag.source, target);
    highlightTarget(null);
    if (requests.length === 0) {
      cancelDrag();
      return;
    }
    if (drag.source.stackId !== undefined) {
      requests.push({ kind: "release", stackId: drag.source.stackId });
    }
    // The card stays where it was dropped until the next table shows the result. The host applies
    // requests at once, so this is set before sending.
    drag.isDropping = true;
    drag.pendingTimer = setTimeout(endDrag, PENDING_DROP_LIMIT_MILLISECONDS);
    for (const request of requests) {
      sendRequest(request);
    }
    sendPresence(presenceNow());
  }

  function dropRequests(source, target) {
    if (source.definitionId !== undefined || source.panelStackName !== undefined) {
      if (target.position === undefined) {
        return [];
      }
      return source.definitionId !== undefined
        ? [{ kind: "spawn-card", definitionId: source.definitionId, position: target.position }]
        : [{ kind: "spawn-stack", name: source.panelStackName, position: target.position }];
    }
    if (source.wholeStack) {
      if (target.trash) {
        return [{ kind: "trash-stack", stackId: source.stackId }];
      }
      if (target.handIndex !== undefined) {
        return [{ kind: "draw", stackId: source.stackId, count: findStack(source.stackId).cards.length }];
      }
      return [{ kind: "move-stack", stackId: source.stackId, to: tableTarget(target) }];
    }
    const from = source.stackId !== undefined ? { stackId: source.stackId } : { handIndex: source.handIndex };
    if (target.trash) {
      return [{ kind: "trash-card", from }];
    }
    if (target.handIndex !== undefined) {
      return [{ kind: "move-card", from, to: { handIndex: target.handIndex } }];
    }
    if (source.stackId !== undefined && target.stackId === source.stackId) {
      return [];
    }
    return [{ kind: "move-card", from, to: tableTarget(target) }];
  }

  function tableTarget(target) {
    return target.stackId !== undefined ? { stackId: target.stackId } : { position: target.position };
  }

  function cancelDrag() {
    if (drag?.isMoving && drag.source.stackId !== undefined && !drag.isDropping) {
      sendRequest({ kind: "release", stackId: drag.source.stackId });
    }
    endDrag();
  }

  function endDrag() {
    if (drag === null) {
      return;
    }
    clearTimeout(drag.pendingTimer);
    drag.ghostElement?.remove();
    const wasLifting = drag.isMoving && (drag.source.stackId !== undefined || drag.source.handIndex !== undefined);
    drag = null;
    highlightTarget(null);
    if (wasLifting) {
      screen.setDragSource(null);
    }
    sendPresence(presenceNow());
  }

  // --- Presence ---

  function sendPresenceSoon() {
    const now = performance.now();
    if (now - lastPresenceAt >= PRESENCE_INTERVAL_MILLISECONDS) {
      lastPresenceAt = now;
      sendPresence(presenceNow());
    }
  }

  function presenceNow() {
    const cursor = tablePointUnderPointer();
    if (cursor === undefined) {
      return null;
    }
    return { cursor, held: drag?.isMoving && !drag.isDropping ? { definitionId: shownHeldDefinitionId() } : null };
  }

  // The opponent learns which card is held only if it is face-up and they could already see it there.
  function shownHeldDefinitionId() {
    const { source } = drag;
    if (source.stackId === undefined) {
      return null;
    }
    const stack = findStack(source.stackId);
    const card = stack.cards.at(-1);
    const isInOwnHiddenZone = !stack.isSlot && isInPrivateZone(stack.position, seat) && !table.seats[seat].revealed;
    return card.faceUp && !isInOwnHiddenZone ? card.definitionId : null;
  }

  // --- Menu and search ---

  function openStackMenu(stackId, clientX, clientY) {
    const actions = [
      ["Draw 1", () => sendRequest({ kind: "draw", stackId, count: 1 })],
      ["Draw…", () => {
        const count = Number.parseInt(window.prompt("Draw how many cards?", "2") ?? "", 10);
        if (Number.isInteger(count) && count > 0) {
          sendRequest({ kind: "draw", stackId, count });
        }
      }],
      ["Flip top card", () => sendRequest({ kind: "flip", from: { stackId } })],
      ["Flip stack", () => sendRequest({ kind: "flip-stack", stackId })],
      ["Shuffle", () => sendRequest({ kind: "shuffle", stackId })],
      ["Copy top card", () => sendRequest({ kind: "copy", from: { stackId }, position: besideStack(stackId) })],
      ["Search…", () => openSearch(stackId)],
      ["Delete top card", () => sendRequest({ kind: "trash-card", from: { stackId } })],
      ["Delete stack", () => sendRequest({ kind: "trash-stack", stackId })],
    ];
    const menuElement = createElement("div", "context-menu");
    for (const [caption, action] of actions) {
      const itemButton = createElement("button", "context-menu-item", caption);
      itemButton.type = "button";
      itemButton.addEventListener("click", () => {
        closePopup();
        action();
      });
      menuElement.append(itemButton);
    }
    menuElement.style.left = `${clientX}px`;
    menuElement.style.top = `${clientY}px`;
    showPopup(menuElement);
  }

  // Lists a stack's cards, top first, with every face shown to the searcher only.
  function openSearch(stackId) {
    const stack = findStack(stackId);
    const dialogElement = createElement("div", "search-dialog");
    dialogElement.append(createElement("p", "search-title", `Search (${stack.cards.length} cards) — click one to take it into your hand`));
    const listElement = createElement("div", "search-list");
    for (const card of [...stack.cards].reverse()) {
      const faceElement = createCardFace(definitions.get(card.definitionId));
      faceElement.addEventListener("click", () => {
        closePopup();
        sendRequest({ kind: "take-card", stackId, cardId: card.id });
      });
      listElement.append(faceElement);
    }
    const closeButton = createElement("button", "search-close", "Close");
    closeButton.type = "button";
    closeButton.addEventListener("click", closePopup);
    dialogElement.append(listElement, closeButton);
    showPopup(dialogElement);
  }

  function showPopup(popupElement) {
    closePopup();
    openPopup = popupElement;
    document.body.append(popupElement);
  }

  function closePopup() {
    openPopup?.remove();
    openPopup = null;
  }

  // --- Helpers ---

  function findStack(stackId) {
    return table.stacks.find(stack => stack.id === stackId);
  }

  function hoveredThing(element) {
    const stackElement = element.closest?.("[data-stack-id]") ?? null;
    if (stackElement !== null) {
      return { stackId: stackElement.dataset.stackId };
    }
    const handCardElement = element.closest?.("[data-hand-index]") ?? null;
    return handCardElement === null ? null : { handIndex: Number(handCardElement.dataset.handIndex) };
  }

  // A stack's top card or a hand card, as a request's `from`; undefined for catalog and panel drags.
  function cardSource(focus) {
    if (focus.stackId !== undefined) {
      return { stackId: focus.stackId };
    }
    if (focus.handIndex !== undefined) {
      return { handIndex: focus.handIndex };
    }
    return undefined;
  }

  function tablePointUnderPointer() {
    return isOver(viewportElement, pointer.clientX, pointer.clientY)
      ? view.toTablePoint(pointer.clientX, pointer.clientY)
      : undefined;
  }

  // The centre of a copy of this stack's top card: slightly to the right of it.
  function besideStack(stackId) {
    const rect = stackRect(findStack(stackId));
    return { x: rect.x + rect.width / 2 + COPY_SHIFT, y: rect.y + rect.height / 2 };
  }

  return {
    // Keeps the input in step with the table: ends a finished drop, and drops a drag whose stack was
    // taken by the other player first or no longer exists.
    setTable(nextTable) {
      table = nextTable;
      if (drag?.isDropping) {
        endDrag();
        return;
      }
      if (!drag?.isMoving) {
        return;
      }
      const { source } = drag;
      if (source.stackId !== undefined) {
        const stack = findStack(source.stackId);
        if (stack === undefined || stack.cards.length === 0 || (stack.heldBy !== null && stack.heldBy !== seat)) {
          endDrag();
          return;
        }
      }
      if (source.handIndex !== undefined && table.seats[seat].hand[source.handIndex] === undefined) {
        endDrag();
        return;
      }
      refreshGhost();
    },
  };
}

function isOver(element, clientX, clientY) {
  const bounds = element.getBoundingClientRect();
  return clientX >= bounds.left && clientX <= bounds.right && clientY >= bounds.top && clientY <= bounds.bottom;
}

function isTyping(element) {
  return element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement
    || element instanceof HTMLSelectElement || element.isContentEditable === true;
}
