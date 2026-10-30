// The left HUD below the room status: your six private counters and your notes, which stay in this
// browser and never travel; the shared Modernization and turn counters, which go through the host; and
// the toggle that reveals your private zone to the opponent.

import { createElement } from "./render.js";

const PRIVATE_COUNTERS = Object.freeze(["Production", "Food", "Population", "Knowledge", "Attack", "Defense"]);
const SHARED_COUNTERS = Object.freeze([
  { key: "modernization", caption: "Modernization" },
  { key: "turn", caption: "Turn" },
]);
const STORAGE_KEY_PREFIX = "civcards-private-";

export function createHud(hudElement, seat, sendRequest) {
  const privateValues = { counters: Object.fromEntries(PRIVATE_COUNTERS.map(name => [name, 0])), notes: "" };
  // Unknown until the host's room is open; until then nothing is saved.
  let storageKey = null;

  const privateSection = createElement("section", "hud-section");
  privateSection.append(createElement("h2", "hud-heading", "Your counters"), createElement("p", "hud-hint", "Only you see these."));
  const counterInputs = new Map();
  for (const name of PRIVATE_COUNTERS) {
    const valueInput = document.createElement("input");
    valueInput.type = "number";
    valueInput.className = "counter-value";
    valueInput.value = "0";
    valueInput.addEventListener("change", () => {
      const typedValue = Number.parseInt(valueInput.value, 10);
      setPrivateCounter(name, Number.isNaN(typedValue) ? privateValues.counters[name] : typedValue);
    });
    counterInputs.set(name, valueInput);
    privateSection.append(createCounterRow(name, valueInput,
      () => setPrivateCounter(name, privateValues.counters[name] - 1),
      () => setPrivateCounter(name, privateValues.counters[name] + 1)));
  }
  const notesInput = createElement("textarea", "notes");
  notesInput.rows = 6;
  notesInput.placeholder = "Notes";
  notesInput.addEventListener("input", () => {
    privateValues.notes = notesInput.value;
    save();
  });
  privateSection.append(notesInput);

  const sharedSection = createElement("section", "hud-section");
  sharedSection.append(createElement("h2", "hud-heading", "Shared"));
  const sharedValueElements = new Map();
  for (const { key, caption } of SHARED_COUNTERS) {
    const valueElement = createElement("span", "counter-value shared");
    sharedValueElements.set(key, valueElement);
    sharedSection.append(createCounterRow(caption, valueElement,
      () => sendRequest({ kind: "add-counter", counter: key, amount: -1 }),
      () => sendRequest({ kind: "add-counter", counter: key, amount: 1 })));
  }

  const revealButton = createElement("button", "reveal-toggle");
  revealButton.type = "button";
  revealButton.addEventListener("click", () => sendRequest({ kind: "toggle-reveal" }));
  sharedSection.append(revealButton);

  hudElement.append(privateSection, sharedSection);

  function setPrivateCounter(name, value) {
    privateValues.counters[name] = value;
    counterInputs.get(name).value = String(value);
    save();
  }

  // Browser storage can be unavailable (private windows, blocked site data); the values then last
  // only as long as the page.
  function save() {
    if (storageKey === null) {
      return;
    }
    try {
      localStorage.setItem(storageKey, JSON.stringify(privateValues));
    } catch {
      // Nothing to do: the values stay on screen.
    }
  }

  function load() {
    try {
      return JSON.parse(localStorage.getItem(storageKey) ?? "null");
    } catch {
      return null;
    }
  }

  return {
    // Keys the private values to the room, picking up what this browser saved for it before.
    useRoomCode(code) {
      storageKey = STORAGE_KEY_PREFIX + code;
      const saved = load();
      if (typeof saved?.counters === "object" && saved.counters !== null && typeof saved.notes === "string") {
        for (const name of PRIVATE_COUNTERS) {
          if (Number.isInteger(saved.counters[name])) {
            setPrivateCounter(name, saved.counters[name]);
          }
        }
        privateValues.notes = saved.notes;
        notesInput.value = saved.notes;
      }
      save();
    },

    showTable(table) {
      for (const [key, valueElement] of sharedValueElements) {
        valueElement.textContent = String(table.counters[key]);
      }
      revealButton.textContent = table.seats[seat].revealed ? "Hide my buildings" : "Reveal my buildings";
      revealButton.classList.toggle("is-revealed", table.seats[seat].revealed);
    },
  };
}

function createCounterRow(caption, valueElement, onDecrease, onIncrease) {
  const rowElement = createElement("div", "counter-row");
  const decreaseButton = createElement("button", "counter-step", "−");
  decreaseButton.type = "button";
  decreaseButton.addEventListener("click", onDecrease);
  const increaseButton = createElement("button", "counter-step", "+");
  increaseButton.type = "button";
  increaseButton.addEventListener("click", onIncrease);
  rowElement.append(createElement("span", "counter-caption", caption), decreaseButton, valueElement, increaseButton);
  return rowElement;
}
