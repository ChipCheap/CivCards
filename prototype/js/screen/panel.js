// The right panel: the card catalog with a text search and type and era filters, the predefined panel
// stacks, and the trash can. It collapses to a thin strip on the right that is still the trash can.
// It only draws; dragging out of it and onto the trash is handled by the input module, which finds
// catalog cards by data-definition-id, panel stacks by data-panel-stack and the trash by .trash-can.

import { createCardFace, createElement } from "./render.js";

const ALL_OPTION = "";
const COLLAPSED_STORAGE_KEY = "civcards-panel-collapsed";

export function createPanel(panelElement, cards) {
  const collapseButton = createElement("button", "panel-collapse");
  collapseButton.type = "button";
  const searchInput = createElement("input", "catalog-search");
  searchInput.type = "search";
  searchInput.placeholder = "Search card text";
  searchInput.spellcheck = false;
  const regexCheckbox = createElement("input", "");
  regexCheckbox.type = "checkbox";
  regexCheckbox.checked = true;
  const regexLabel = createElement("label", "regex-toggle", "Regex");
  regexLabel.prepend(regexCheckbox);
  const typeFilter = createFilter("Type", cards.map(card => card.type));
  const eraFilter = createFilter("Era", cards.map(card => card.era));
  const catalogElement = createElement("div", "catalog");
  const panelStacksElement = createElement("div", "panel-stacks");
  const trashElement = createElement("div", "trash-can", "Trash — drop cards here to remove them");

  const panelContent = createElement("div", "panel-content");
  panelContent.append(
    createElement("h2", "panel-heading", "Cards"),
    searchInput,
    regexLabel,
    typeFilter.labelElement,
    eraFilter.labelElement,
    catalogElement,
    createElement("h2", "panel-heading", "Stacks"),
    panelStacksElement,
  );
  panelElement.append(collapseButton, panelContent, trashElement);

  function drawCatalog() {
    const textMatcher = createTextMatcher(searchInput.value, regexCheckbox.checked);
    searchInput.classList.toggle("is-invalid", textMatcher === undefined);
    searchInput.title = textMatcher === undefined ? "Not a valid regular expression" : "";
    const shownCards = cards.filter(card =>
      (typeFilter.selectElement.value === ALL_OPTION || card.type === typeFilter.selectElement.value)
      && (eraFilter.selectElement.value === ALL_OPTION || card.era === eraFilter.selectElement.value)
      && (textMatcher === undefined || textMatcher(searchableText(card))));
    catalogElement.replaceChildren(...shownCards.map(card => {
      const entryElement = createElement("div", "catalog-card");
      entryElement.dataset.definitionId = card.id;
      entryElement.append(createCardFace(card));
      return entryElement;
    }));
  }

  function setCollapsed(isCollapsed) {
    panelElement.classList.toggle("is-collapsed", isCollapsed);
    collapseButton.textContent = isCollapsed ? "◀" : "▶";
    collapseButton.title = isCollapsed ? "Show the card panel" : "Hide the card panel";
    try {
      localStorage.setItem(COLLAPSED_STORAGE_KEY, String(isCollapsed));
    } catch {
      // Without storage the panel simply opens expanded next time.
    }
  }

  collapseButton.addEventListener("click", () => setCollapsed(!panelElement.classList.contains("is-collapsed")));
  searchInput.addEventListener("input", drawCatalog);
  regexCheckbox.addEventListener("change", drawCatalog);
  typeFilter.selectElement.addEventListener("change", drawCatalog);
  eraFilter.selectElement.addEventListener("change", drawCatalog);
  setCollapsed(readCollapsed());
  drawCatalog();

  let hasDrawnPanelStacks = false;

  return {
    // Panel stacks are fixed for the whole game, so they are drawn from the first table only.
    showTable(table) {
      if (hasDrawnPanelStacks) {
        return;
      }
      hasDrawnPanelStacks = true;
      panelStacksElement.replaceChildren(...table.panelStacks.map(panelStack => {
        const entryElement = createElement("div", "panel-stack", `${panelStack.name} (${panelStack.definitionIds.length})`);
        entryElement.dataset.panelStack = panelStack.name;
        return entryElement;
      }));
    },
  };
}

// All the text on a card, one field per line, as the search sees it:
// "Farm\nBuilding Era 1\n1 card\nProduces 1 Food each turn."
function searchableText(card) {
  const kind = [card.type, card.era === "" ? "" : `Era ${card.era}`].filter(Boolean).join(" ");
  return [card.name, kind, card.cost, card.text].filter(Boolean).join("\n");
}

// A test for the searched text, or undefined when the pattern is not a valid regular expression.
// An empty query matches everything. Case is ignored; in regex mode ^ and $ match at every line.
function createTextMatcher(query, isRegex) {
  if (query === "") {
    return () => true;
  }
  if (!isRegex) {
    const lowerQuery = query.toLowerCase();
    return text => text.toLowerCase().includes(lowerQuery);
  }
  try {
    const pattern = new RegExp(query, "im");
    return text => pattern.test(text);
  } catch {
    return undefined;
  }
}

function readCollapsed() {
  try {
    return localStorage.getItem(COLLAPSED_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

function createFilter(caption, values) {
  const labelElement = createElement("label", "panel-filter", caption);
  const selectElement = document.createElement("select");
  const options = [ALL_OPTION, ...new Set(values.filter(value => value !== ""))].map(value => {
    const optionElement = document.createElement("option");
    optionElement.value = value;
    optionElement.textContent = value === ALL_OPTION ? "All" : value;
    return optionElement;
  });
  selectElement.append(...options);
  labelElement.append(selectElement);
  return { labelElement, selectElement };
}
