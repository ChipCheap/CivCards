// The transport: the only module that knows how messages travel (Prototyper.architecture.md PG4). It
// uses PeerJS, loaded by index.html as the global `Peer`, and PeerJS's free public broker to introduce
// the browsers. Everything above it sees rooms, plain-data messages and plain-word failures.

// Our room ids share the public broker with other apps; the prefix keeps them apart.
const BROKER_ID_PREFIX = "civcards-";
const CONNECT_TIMEOUT_MILLISECONDS = 20000;
// Each side sends a heartbeat every second without anyone doing anything. A tab that closes abruptly
// says no goodbye, so a full minute with nothing received counts as gone. The minute is generous
// because browsers slow timers down in background tabs, and a player switching tabs must not be dropped.
const HEARTBEAT_INTERVAL_MILLISECONDS = 1000;
const SILENCE_LIMIT_MILLISECONDS = 60000;

export const FAILURE = Object.freeze({
  libraryMissing: "library-missing",
  codeTaken: "code-taken",
  codeNotFound: "code-not-found",
  brokerUnreachable: "broker-unreachable",
  browserIncompatible: "browser-incompatible",
  connectionBlocked: "connection-blocked",
});

// Opens a room other browsers can join with `code`. Handlers:
//   onOpen(), onGuestMessage(guestId, message), onGuestDisconnected(guestId), onFailure(failure)
// Returns { send(guestId, message), disconnect(guestId) }.
export function openRoom(code, handlers) {
  const guests = new Map();
  let nextGuestId = 1;
  if (typeof Peer !== "function") {
    handlers.onFailure(FAILURE.libraryMissing);
    return { send() {}, disconnect() {} };
  }
  const peer = new Peer(BROKER_ID_PREFIX + code);
  let isOpen = false;

  peer.on("open", () => {
    isOpen = true;
    handlers.onOpen();
  });
  peer.on("error", error => {
    // Once the room is open the broker is only needed for newcomers, so losing it is not a failure.
    if (!isOpen) {
      peer.destroy();
      handlers.onFailure(error.type === "unavailable-id" ? FAILURE.codeTaken : describeBrokerError(error));
    }
  });
  peer.on("connection", dataConnection => {
    const guestId = nextGuestId++;
    const link = watchConnection(dataConnection, {
      onMessage: message => handlers.onGuestMessage(guestId, message),
      onClosed: () => {
        guests.delete(guestId);
        handlers.onGuestDisconnected(guestId);
      },
    });
    guests.set(guestId, link);
  });

  return {
    send(guestId, message) {
      guests.get(guestId)?.send(message);
    },
    disconnect(guestId) {
      guests.get(guestId)?.close();
    },
  };
}

// Joins the room opened under `code`. Handlers:
//   onOpen(), onMessage(message), onDisconnected(), onFailure(failure)
// Returns { send(message) }.
export function joinRoom(code, handlers) {
  if (typeof Peer !== "function") {
    handlers.onFailure(FAILURE.libraryMissing);
    return { send() {} };
  }
  const peer = new Peer();
  let link;
  let hasFailed = false;
  let isOpen = false;

  function fail(failure) {
    if (!hasFailed && !isOpen) {
      hasFailed = true;
      peer.destroy();
      handlers.onFailure(failure);
    }
  }

  const timeout = setTimeout(() => fail(FAILURE.connectionBlocked), CONNECT_TIMEOUT_MILLISECONDS);
  peer.on("error", error => fail(describeBrokerError(error)));
  peer.on("open", () => {
    link = watchConnection(peer.connect(BROKER_ID_PREFIX + code, { reliable: true }), {
      onOpen: () => {
        clearTimeout(timeout);
        isOpen = true;
        handlers.onOpen();
      },
      onMessage: handlers.onMessage,
      onClosed: () => {
        clearTimeout(timeout);
        if (isOpen) {
          handlers.onDisconnected();
        } else {
          fail(FAILURE.connectionBlocked);
        }
      },
    });
  });

  return {
    send(message) {
      link?.send(message);
    },
  };
}

// Wraps one PeerJS data connection: frames messages, sends heartbeats, and reports the connection
// closed exactly once — on a close, a failed network path, an error, or too long a silence.
// Handlers: onOpen() (optional), onMessage(message), onClosed().
function watchConnection(dataConnection, handlers) {
  let lastHeardAt = performance.now();
  let heartbeatTimer;
  let isClosed = false;

  function close() {
    if (isClosed) {
      return;
    }
    isClosed = true;
    clearInterval(heartbeatTimer);
    dataConnection.close();
    handlers.onClosed();
  }

  dataConnection.on("open", () => {
    lastHeardAt = performance.now();
    heartbeatTimer = setInterval(() => {
      if (performance.now() - lastHeardAt > SILENCE_LIMIT_MILLISECONDS) {
        close();
        return;
      }
      dataConnection.send({ type: "heartbeat" });
    }, HEARTBEAT_INTERVAL_MILLISECONDS);
    handlers.onOpen?.();
  });
  dataConnection.on("data", frame => {
    lastHeardAt = performance.now();
    if (typeof frame === "object" && frame !== null && frame.type === "message") {
      handlers.onMessage(frame.body);
    }
  });
  dataConnection.on("iceStateChanged", state => {
    if (state === "failed") {
      close();
    }
  });
  dataConnection.on("close", close);
  dataConnection.on("error", close);

  return {
    send(message) {
      if (!isClosed && dataConnection.open) {
        dataConnection.send({ type: "message", body: message });
      }
    },
    close,
  };
}

function describeBrokerError(error) {
  switch (error.type) {
    case "peer-unavailable":
      return FAILURE.codeNotFound;
    case "browser-incompatible":
      return FAILURE.browserIncompatible;
    default:
      return FAILURE.brokerUnreachable;
  }
}
