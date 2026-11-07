// Turns mouse and keyboard into table requests: dragging and dropping, the keys, the right-click menu
// and search. The cursor point at drop time alone picks where a card goes (Prototyper.framework.md
// PA3). It also sends this player's pointer and held card to the other player as presence.

import { RESOURCES, TOKEN_ICONS } from "../resources.js";
import { CARD_HEIGHT, CARD_WIDTH, TOKEN_SIZE, containsPoint, isStackInPrivateZone, looseTokenRectangle, stackRectangle } from "./layout.js";
import {
  createCardBack, createCardFace, createCardTokenElements, createElement, createTokenElement, isLoosePileVisibleTo, isStackVisibleTo,
} from "./render.js";

const DRAG_THRESHOLD_PIXELS = 4;
const PRESENCE_INTERVAL_MILLISECONDS = 50;
// A drop is drawn as done until the next table arrives; if none comes, the card goes back after this.
const PENDING_DROP_LIMIT_MILLISECONDS = 1500;
// A copy lands this far to the right of the card it copies, in table units, overlapping it a little
// so both stay readable.
const COPY_SHIFT = 40;
// The number keys above the letters and on the number pad both draw.
const DRAW_KEY_PATTERN = /^(?:Digit|Numpad)([1-9])$/;

// `screen` is the drawing side from createScreen; `sendRequest` and `sendPresence` go to the session.
export function createInput({ viewportElement, handElement, panelElement, screen, view, seat, cards, sendRequest, sendPresence }) {
  const definitions = new Map(cards.map(card => [card.id, card]));
  let table;
  let pointer = { clientX: 0, clientY: 0 };
  // What the cursor is over when nothing is held: { stackId } or { handIndex }, or null.
  let hovered = null;
  // The drag in progress, or null. `source` is one of { stackId, wholeStack }, { handIndex },
  // { definitionId } (catalog card), { panelStackName }, { tokenId, wholePile } (a pile on the table)
  // or { tokenIcon } (a token bag).
  let drag = null;
  let lastPresenceAt = 0;
  // "No pointer on the table" needs sending only once until the pointer comes back.
  let hasSentNoPointer = false;
  // The open menu, search or token picker, and the stack it acts on (none for the token picker).
  let openPopup = null;
  let popupStackId = null;

  // A token lies on top of its card, so it is found first.
  viewportElement.addEventListener("pointerdown", event => {
    if (event.button !== 0) {
      return;
    }
    const tokenElement = event.target.closest("[data-token-id]");
    const stackElement = event.target.closest("[data-stack-id]");
    if (tokenElement !== null) {
      startDrag(event, { tokenId: tokenElement.dataset.tokenId, wholePile: event.shiftKey });
    } else if (stackElement !== null) {
      startDrag(event, { stackId: stackElement.dataset.stackId, wholeStack: event.shiftKey });
    }
  });
  viewportElement.addEventListener("dblclick", event => {
    const tokenElement = event.target.closest("[data-token-id]");
    if (tokenElement !== null) {
      openTokenPicker(tokenElement.dataset.tokenId, event.clientX, event.clientY);
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
    const tokenBagElement = event.target.closest(".token-bag");
    if (event.button !== 0) {
      return;
    }
    if (tokenBagElement !== null) {
      startDrag(event, { tokenIcon: tokenBagElement.dataset.tokenIcon });
    } else if (catalogElement !== null) {
      startDrag(event, { definitionId: catalogElement.dataset.definitionId });
    } else if (panelStackElement !== null) {
      startDrag(event, { panelStackName: panelStackElement.dataset.panelStack });
    }
  });

  window.addEventListener("pointermove", event => {
    pointer = { clientX: event.clientX, clientY: event.clientY };
    // A button released outside the window never sends pointerup; the next move shows it is up.
    if (drag?.isMoving && !drag.isDropping && event.buttons === 0) {
      cancelDrag();
    }
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
      publishPresence(null);
    }
  });
  window.addEventListener("pointercancel", () => {
    if (drag?.isMoving && !drag.isDropping) {
      cancelDrag();
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
    // Ctrl + Shift + F is the one table key that uses Ctrl; every other Ctrl key stays the browser's.
    const isFlipAll = event.code === "KeyF" && event.ctrlKey && event.shiftKey;
    if (event.repeat || (event.ctrlKey && !isFlipAll) || event.metaKey || event.altKey || isTyping(event.target)) {
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
    const drawKeyMatch = DRAW_KEY_PATTERN.exec(event.code);
    if (isFlipAll) {
      if (focus.stackId !== undefined) {
        event.preventDefault();
        sendRequest({ kind: "flip-all", stackId: focus.stackId });
      }
    } else if (drawKeyMatch !== null && focus.stackId !== undefined) {
      sendRequest({ kind: "draw", stackId: focus.stackId, count: Number(drawKeyMatch[1]) });
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
    // Card drags and panning cancel the browser's default, which would otherwise move focus; pressing
    // anywhere but a text field leaves that field, so keys act on the table again.
    if (isTyping(document.activeElement) && !isTyping(event.target)) {
      document.activeElement.blur();
    }
  }, { capture: true });

  // --- Dragging ---

  function startDrag(event, source) {
    event.preventDefault();
    // A new drag settles the last one: a drop still waiting for its table ends, an unfinished drag is
    // cancelled and its lock released.
    cancelDrag();
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
    if (isLiftingFromTable(source)) {
      screen.setDragSource(source);
    }
  }

  // Whether the drag takes something that is on the table or in the hand, which is then drawn as lifted.
  function isLiftingFromTable(source) {
    return source.stackId !== undefined || source.handIndex !== undefined || source.tokenId !== undefined;
  }

  // The ghost shows the card as the table has it now, so a flip while dragging shows at once. A card
  // taken from the top of a stack carries its tokens along.
  function refreshGhost() {
    const { source, ghostElement } = drag;
    ghostElement.classList.toggle("is-token", isTokenDrag());
    if (source.tokenIcon !== undefined) {
      ghostElement.replaceChildren(createTokenElement(source.tokenIcon, 1));
      return;
    }
    if (source.tokenId !== undefined) {
      const pile = findTokenPile(source.tokenId);
      ghostElement.replaceChildren(createTokenElement(pile.icon, source.wholePile ? pile.count : 1));
      return;
    }
    if (source.definitionId !== undefined) {
      ghostElement.replaceChildren(createCardFace(definitions.get(source.definitionId)));
      return;
    }
    if (source.panelStackName !== undefined) {
      ghostElement.replaceChildren(createCardBack());
      return;
    }
    const card = heldCard();
    const cardElement = card.faceUp ? createCardFace(definitions.get(card.definitionId)) : createCardBack();
    const tokenPiles = source.stackId === undefined ? [] : table.tokens.filter(pile => pile.cardId === card.id);
    ghostElement.replaceChildren(cardElement, ...createCardTokenElements(tokenPiles));
  }

  function placeGhost() {
    const width = isTokenDrag() ? TOKEN_SIZE : CARD_WIDTH;
    const height = isTokenDrag() ? TOKEN_SIZE : CARD_HEIGHT;
    drag.ghostElement.style.left = `${pointer.clientX - width / 2}px`;
    drag.ghostElement.style.top = `${pointer.clientY - height / 2}px`;
  }

  function isTokenDrag() {
    return drag.source.tokenId !== undefined || drag.source.tokenIcon !== undefined;
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
    const pile = isTokenDrag() ? loosePileAt(point) : undefined;
    if (pile !== undefined) {
      return { tokenId: pile.id, position: point };
    }
    const stack = stackAt(point);
    return stack === undefined ? { position: point } : { stackId: stack.id, position: point };
  }

  // The topmost loose pile under a table point, visible to this player, that the dragged token could
  // join: one showing the same icon, other than the pile being dragged from.
  function loosePileAt(point) {
    const icon = drag.source.tokenIcon ?? findTokenPile(drag.source.tokenId).icon;
    return table.tokens.findLast(pile => pile.cardId === null && pile.icon === icon && pile.id !== drag.source.tokenId
      && isLoosePileVisibleTo(table, pile, seat) && containsPoint(looseTokenRectangle(pile.position), point));
  }

  // The topmost stack or slot under a table point that this player may see. The stack being lifted
  // doesn't count when nothing of it would stay behind.
  function stackAt(point) {
    for (let i = table.stacks.length - 1; i >= 0; i--) {
      const stack = table.stacks[i];
      if (isLiftedAway(stack) || !containsPoint(stackRectangle(stack), point)) {
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
    publishPresence(presenceNow());
  }

  function dropRequests(source, target) {
    if (source.tokenIcon !== undefined || source.tokenId !== undefined) {
      return tokenDropRequests(source, target);
    }
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

  // Tokens go onto a card, a pile of their icon or the bare table; the hand doesn't take them.
  function tokenDropRequests(source, target) {
    if (target.handIndex !== undefined || (target.trash && source.tokenIcon !== undefined)) {
      return [];
    }
    if (target.trash) {
      return [{ kind: "trash-token", tokenId: source.tokenId, wholePile: source.wholePile }];
    }
    const to = target.tokenId !== undefined ? { tokenId: target.tokenId } : tableTarget(target);
    return source.tokenIcon !== undefined
      ? [{ kind: "spawn-token", icon: source.tokenIcon, to }]
      : [{ kind: "move-token", tokenId: source.tokenId, wholePile: source.wholePile, to }];
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
    const wasLifting = drag.isMoving && isLiftingFromTable(drag.source);
    drag = null;
    highlightTarget(null);
    if (wasLifting) {
      screen.setDragSource(null);
    }
    publishPresence(presenceNow());
  }

  // --- Presence ---

  function sendPresenceSoon() {
    const now = performance.now();
    if (now - lastPresenceAt >= PRESENCE_INTERVAL_MILLISECONDS) {
      lastPresenceAt = now;
      publishPresence(presenceNow());
    }
  }

  function publishPresence(presence) {
    if (presence === null && hasSentNoPointer) {
      return;
    }
    hasSentNoPointer = presence === null;
    sendPresence(presence);
  }

  function presenceNow() {
    const cursor = tablePointUnderPointer();
    if (cursor === undefined) {
      return null;
    }
    const isHoldingCard = drag?.isMoving && !drag.isDropping && !isTokenDrag();
    return { cursor, held: isHoldingCard ? { definitionId: shownHeldDefinitionId() } : null };
  }

  // The opponent learns which card is held only if it is face-up and they could already see it there.
  function shownHeldDefinitionId() {
    const { source } = drag;
    if (source.stackId === undefined) {
      return null;
    }
    const stack = findStack(source.stackId);
    const card = stack.cards.at(-1);
    const isInOwnHiddenZone = isStackInPrivateZone(stack, seat) && !table.seats[seat].revealed;
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
      ["Flip all, order kept", () => sendRequest({ kind: "flip-all", stackId })],
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
    showPopup(menuElement, stackId);
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
    showPopup(dialogElement, stackId);
  }

  // A small window of every token icon, so a token can stand for any good; picking one changes what
  // the whole pile shows.
  function openTokenPicker(tokenId, clientX, clientY) {
    const pickerElement = createElement("div", "context-menu token-picker");
    for (const icon of TOKEN_ICONS) {
      const iconButton = createElement("button", "context-menu-item", `${RESOURCES[icon].symbol} ${RESOURCES[icon].name}`);
      iconButton.type = "button";
      iconButton.addEventListener("click", () => {
        closePopup();
        sendRequest({ kind: "set-token-icon", tokenId, icon });
      });
      pickerElement.append(iconButton);
    }
    pickerElement.style.left = `${clientX}px`;
    pickerElement.style.top = `${clientY}px`;
    showPopup(pickerElement, null);
  }

  function showPopup(popupElement, stackId) {
    closePopup();
    openPopup = popupElement;
    popupStackId = stackId;
    document.body.append(popupElement);
  }

  function closePopup() {
    openPopup?.remove();
    openPopup = null;
    popupStackId = null;
  }

  // --- Helpers ---

  function findStack(stackId) {
    return table.stacks.find(stack => stack.id === stackId);
  }

  function findTokenPile(tokenId) {
    return table.tokens.find(pile => pile.id === tokenId);
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

  // Whether a hovered or menu target still exists for this player: a visible stack with cards in it, or
  // a card in the hand.
  function isStillThere(target) {
    if (target.handIndex !== undefined) {
      return target.handIndex < table.seats[seat].hand.length;
    }
    const stack = findStack(target.stackId);
    return stack !== undefined && stack.cards.length > 0 && isStackVisibleTo(table, stack, seat);
  }

  // The centre of a copy of this stack's top card: slightly to the right of it.
  function besideStack(stackId) {
    const rectangle = stackRectangle(findStack(stackId));
    return { x: rectangle.x + rectangle.width / 2 + COPY_SHIFT, y: rectangle.y + rectangle.height / 2 };
  }

  return {
    // Keeps the input in step with the table: forgets a hovered stack or hand card that is gone or now
    // hidden, closes a menu or search whose stack is gone, ends a finished drop, and drops a drag whose
    // stack was taken by the other player first, or whose stack or token pile no longer exists.
    setTable(nextTable) {
      table = nextTable;
      if (hovered !== null && !isStillThere(hovered)) {
        hovered = null;
      }
      if (popupStackId !== null && !isStillThere({ stackId: popupStackId })) {
        closePopup();
      }
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
      if (source.tokenId !== undefined && findTokenPile(source.tokenId) === undefined) {
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
