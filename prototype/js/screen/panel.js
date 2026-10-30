// The right panel: the card catalog with type and era filters, the predefined panel stacks, and the
// trash can. It only draws; dragging out of it and onto the trash is handled by the input module, which
// finds catalog cards by data-definition-id, panel stacks by data-panel-stack and the trash by .trash-can.

import { createCardFace, createElement } from "./render.js";

const ALL_OPTION = "";

export function createPanel(panelElement, cards) {
  const typeFilter = createFilter("Type", cards.map(card => card.type));
  const eraFilter = createFilter("Era", cards.map(card => card.era));
  const catalogElement = createElement("div", "catalog");
  const panelStacksElement = createElement("div", "panel-stacks");
  const trashElement = createElement("div", "trash-can", "Trash — drop cards here to remove them");

  panelElement.append(
    createElement("h2", "panel-heading", "Cards"),
    typeFilter.labelElement,
    eraFilter.labelElement,
    catalogElement,
    createElement("h2", "panel-heading", "Stacks"),
    panelStacksElement,
    trashElement,
  );

  function drawCatalog() {
    const shownCards = cards.filter(card =>
      (typeFilter.selectElement.value === ALL_OPTION || card.type === typeFilter.selectElement.value)
      && (eraFilter.selectElement.value === ALL_OPTION || card.era === eraFilter.selectElement.value));
    catalogElement.replaceChildren(...shownCards.map(card => {
      const entryElement = createElement("div", "catalog-card");
      entryElement.dataset.definitionId = card.id;
      entryElement.append(createCardFace(card));
      return entryElement;
    }));
  }

  typeFilter.selectElement.addEventListener("change", drawCatalog);
  eraFilter.selectElement.addEventListener("change", drawCatalog);
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
