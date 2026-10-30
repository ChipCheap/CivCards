// Wires the page together: decides host or guest from the address, loads the cards on the host,
// starts the session and the screen, and shows the session's status on the page.

import { loadCardData } from "./loader.js";
import { SESSION_FAILURE, startGuest, startHost } from "./session.js";
import { createScreen } from "./screen/render.js";
import { createView } from "./screen/view.js";

const FAILURE_MESSAGES = Object.freeze({
  [SESSION_FAILURE.codeNotFound]: ["No table with this code is open", "Ask the host for a fresh link, or start a table of your own."],
  [SESSION_FAILURE.hostLeft]: ["The host left — this table is gone", "Tables live in the host's browser tab, so the game ended when it closed."],
  [SESSION_FAILURE.tableFull]: ["This table is full", "Two players are already seated."],
  [SESSION_FAILURE.brokerUnreachable]: ["Could not reach the PeerJS broker", "The free service that introduces the players didn't answer. Check your connection or try again later."],
  [SESSION_FAILURE.connectionBlocked]: ["Could not connect to the host", "Your two networks may block each other. The connection test page can tell you more."],
  [SESSION_FAILURE.browserIncompatible]: ["This browser can't make direct connections", "Try a current Chrome, Edge or Firefox."],
  [SESSION_FAILURE.libraryMissing]: ["The networking library didn't load", "The page couldn't download PeerJS from cdn.jsdelivr.net. Check your connection or any content blocker."],
});

const viewportElement = document.getElementById("table-viewport");
const boardElement = document.getElementById("board");
const screenElements = {
  boardElement,
  handElement: document.getElementById("own-hand"),
  opponentHandElement: document.getElementById("opponent-hand"),
  previewElement: document.getElementById("card-preview"),
};
const roomCodeElement = document.getElementById("room-code");
const connectionStateElement = document.getElementById("connection-state");
const copyInviteButton = document.getElementById("copy-invite");

document.getElementById("new-table").addEventListener("click", () => location.assign(location.pathname));
document.getElementById("dismiss-problems").addEventListener("click", () => {
  document.getElementById("problems").hidden = true;
});
copyInviteButton.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(location.href);
    copyInviteButton.textContent = "Copied";
  } catch {
    copyInviteButton.textContent = location.href;
  }
});

const roomCode = location.hash.slice(1).trim().toUpperCase();
if (roomCode === "") {
  hostTable();
} else {
  joinTable(roomCode);
}

async function hostTable() {
  connectionStateElement.textContent = "Loading cards…";
  let cardData;
  try {
    cardData = await loadCardData(new URL("cards/", document.baseURI));
  } catch (error) {
    showFailure("The card files could not be loaded", error.message);
    return;
  }
  showProblems(cardData.problems);
  const screen = createScreen({
    ...screenElements,
    view: createView(viewportElement, boardElement, false),
    seat: 0,
    cards: cardData.cards,
  });
  startHost({
    cardData,
    random: Math.random,
    onTable: screen.showTable,
    onPresence: screen.showPresence,
    onStatus: showStatus,
  });
}

function joinTable(code) {
  roomCodeElement.textContent = `Table ${code}`;
  connectionStateElement.textContent = "Joining…";
  let screen;
  startGuest({
    code,
    onReady: ({ seat, cards, table }) => {
      // Seat 1 sees the board mirrored, so its own side is at the bottom too.
      screen = createScreen({
        ...screenElements,
        view: createView(viewportElement, boardElement, seat === 1),
        seat,
        cards,
      });
      screen.showTable(table);
    },
    onTable: table => screen.showTable(table),
    onPresence: (seat, presence) => screen.showPresence(seat, presence),
    onStatus: showStatus,
  });
}

function showStatus(status) {
  switch (status.kind) {
    case "hosting":
      history.replaceState(null, "", `#${status.code}`);
      roomCodeElement.textContent = `Table ${status.code}`;
      connectionStateElement.textContent = "Waiting for the other player";
      copyInviteButton.hidden = false;
      break;
    case "guest-joined":
      connectionStateElement.textContent = "Other player connected";
      break;
    case "guest-left":
      connectionStateElement.textContent = "Other player disconnected — their seat is kept";
      break;
    case "joined":
      connectionStateElement.textContent = "Connected to the host";
      break;
    case "failed":
      connectionStateElement.textContent = "Not connected";
      showFailure(...FAILURE_MESSAGES[status.failure]);
      break;
  }
}

function showProblems(problems) {
  if (problems.length === 0) {
    return;
  }
  document.getElementById("problem-list").replaceChildren(...problems.map(problem => {
    const item = document.createElement("li");
    item.textContent = problem;
    return item;
  }));
  document.getElementById("problems").hidden = false;
}

function showFailure(title, detail) {
  document.getElementById("overlay-title").textContent = title;
  document.getElementById("overlay-detail").textContent = detail;
  document.getElementById("overlay").hidden = false;
}
