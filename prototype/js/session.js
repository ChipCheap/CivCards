// The session: who owns the true table and how changes reach everyone (Prototyper.architecture.md PD5).
// The host's tab holds the table, applies every request through the core and sends the whole table to
// the guest after each change. The guest forwards its requests and shows the newest table it was sent.
//
// Status events, reported through onStatus:
//   { kind: "hosting", code }     the host's room is open under `code`
//   { kind: "guest-joined" }      a guest took or retook seat 1
//   { kind: "guest-left" }        the guest's connection ended; the seat stays reserved
//   { kind: "joined" }            this guest is at the table
//   { kind: "failed", failure }   one of SESSION_FAILURE; the session is over

import { apply, createTable } from "./core.js";
import { FAILURE, joinRoom, openRoom } from "./transport.js";

export const SESSION_FAILURE = Object.freeze({ ...FAILURE, tableFull: "table-full", hostLeft: "host-left" });

// Room codes leave out I, L and O so they can't be misread as 1 or 0.
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ";
const CODE_LENGTH = 5;
const HOST_SEAT = 0;
const GUEST_SEAT = 1;
const SEAT_COUNT = 2;
const SEAT_TOKEN_KEY_PREFIX = "civcards-seat-token-";
// Time for a refusal to arrive before the host closes that connection.
const REFUSAL_GRACE_MILLISECONDS = 2000;

// Starts a table as host (seat 0). `cardData` is the card loader's result; `random` feeds the core's
// shuffles. Calls onTable(table) right away and after every change, onPresence(seat, presence) when
// the guest's cursor moves.
export function startHost({ cardData, random, onTable, onPresence, onStatus }) {
  let table = createTable(cardData.cards, cardData.stacks, SEAT_COUNT, random);
  let room;
  // The guest seat is reserved for the first seat token that says hello; guestId is its live connection.
  let guestSeatToken;
  let guestId;

  function openWithNewCode() {
    const code = createRoomCode();
    room = openRoom(code, {
      onOpen: () => onStatus({ kind: "hosting", code }),
      onGuestMessage: handleGuestMessage,
      onGuestDisconnected: handleGuestDisconnected,
      onFailure: failure => {
        if (failure === FAILURE.codeTaken) {
          openWithNewCode();
        } else {
          onStatus({ kind: "failed", failure });
        }
      },
    });
  }

  function sendToGuest(message) {
    if (guestId !== undefined) {
      room.send(guestId, message);
    }
  }

  function applyRequest(seat, request) {
    const nextTable = apply(table, seat, request, random);
    if (nextTable === table) {
      // The guest may already show the change it asked for; the unchanged table corrects it.
      if (seat === GUEST_SEAT) {
        sendToGuest({ kind: "snapshot", table });
      }
      return;
    }
    table = nextTable;
    onTable(table);
    sendToGuest({ kind: "snapshot", table });
  }

  function handleGuestMessage(senderId, message) {
    if (typeof message !== "object" || message === null) {
      return;
    }
    if (message.kind === "hello" && typeof message.seatToken === "string" && message.seatToken !== "") {
      admitGuest(senderId, message.seatToken);
      return;
    }
    // Only the admitted guest's connection may act at the table.
    if (senderId !== guestId) {
      return;
    }
    if (message.kind === "request") {
      applyRequest(GUEST_SEAT, message.request);
    } else if (message.kind === "presence") {
      onPresence(GUEST_SEAT, message.presence);
    }
  }

  function admitGuest(senderId, seatToken) {
    if (guestSeatToken !== undefined && guestSeatToken !== seatToken) {
      room.send(senderId, { kind: "refused", reason: SESSION_FAILURE.tableFull });
      setTimeout(() => room.disconnect(senderId), REFUSAL_GRACE_MILLISECONDS);
      return;
    }
    if (guestId !== undefined && guestId !== senderId) {
      room.disconnect(guestId);
    }
    guestSeatToken = seatToken;
    guestId = senderId;
    room.send(senderId, { kind: "welcome", seat: GUEST_SEAT, cards: cardData.cards, table });
    onStatus({ kind: "guest-joined" });
  }

  function handleGuestDisconnected(disconnectedId) {
    if (disconnectedId !== guestId) {
      return;
    }
    guestId = undefined;
    // Whatever the guest was dragging stays where it was and becomes usable again.
    for (const stack of table.stacks.filter(candidate => candidate.heldBy === GUEST_SEAT)) {
      applyRequest(GUEST_SEAT, { kind: "release", stackId: stack.id });
    }
    onStatus({ kind: "guest-left" });
  }

  openWithNewCode();
  onTable(table);

  return {
    seat: HOST_SEAT,
    // TODO: Called by the screen's drag, keys and HUD — see Prototyper.plan.md S12–S15
    sendRequest(request) {
      applyRequest(HOST_SEAT, request);
    },
    // TODO: Called by the screen's pointer tracking — see Prototyper.plan.md S12
    sendPresence(presence) {
      sendToGuest({ kind: "presence", seat: HOST_SEAT, presence });
    },
  };
}

// Joins the table opened under `code`. Calls onReady({ seat, cards, table }) once admitted,
// onTable(table) for every newer table, and onPresence(seat, presence) when the host's cursor moves.
export function startGuest({ code, onReady, onTable, onPresence, onStatus }) {
  let table;
  let hasEnded = false;

  function end(failure) {
    if (!hasEnded) {
      hasEnded = true;
      onStatus({ kind: "failed", failure });
    }
  }

  const room = joinRoom(code, {
    onOpen: () => room.send({ kind: "hello", seatToken: readSeatToken(code) }),
    onMessage: message => {
      if (hasEnded || typeof message !== "object" || message === null) {
        return;
      }
      if (message.kind === "welcome") {
        table = message.table;
        onReady({ seat: message.seat, cards: message.cards, table });
        onStatus({ kind: "joined" });
      } else if (message.kind === "snapshot" && table !== undefined && message.table.sequence >= table.sequence) {
        table = message.table;
        onTable(table);
      } else if (message.kind === "presence") {
        onPresence(message.seat, message.presence);
      } else if (message.kind === "refused") {
        end(SESSION_FAILURE.tableFull);
      }
    },
    onDisconnected: () => end(SESSION_FAILURE.hostLeft),
    onFailure: end,
  });

  return {
    // TODO: Called by the screen's drag, keys and HUD — see Prototyper.plan.md S12–S15
    sendRequest(request) {
      room.send({ kind: "request", request });
    },
    // TODO: Called by the screen's pointer tracking — see Prototyper.plan.md S12
    sendPresence(presence) {
      room.send({ kind: "presence", presence });
    },
  };
}

function createRoomCode() {
  const randomValues = crypto.getRandomValues(new Uint32Array(CODE_LENGTH));
  return Array.from(randomValues, value => CODE_ALPHABET[value % CODE_ALPHABET.length]).join("");
}

// The same browser keeps the same token per room, so a refreshed guest gets its seat back. Storage can
// be unavailable (private windows, blocked site data); then the token lasts only as long as the page.
function readSeatToken(code) {
  const key = SEAT_TOKEN_KEY_PREFIX + code;
  try {
    const storedToken = localStorage.getItem(key);
    if (storedToken !== null) {
      return storedToken;
    }
    const newToken = crypto.randomUUID();
    localStorage.setItem(key, newToken);
    return newToken;
  } catch {
    return crypto.randomUUID();
  }
}
