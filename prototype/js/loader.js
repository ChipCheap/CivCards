// The card loader: the only code that reads the card files (Prototyper.architecture.md PG5).
// It turns cards.csv and stacks.csv into card and stack definitions, and lists every row it had to
// skip instead of failing, so a typo in one card never stops a game.

import { MARKET_STARTS, PANEL_START, PLAYER_DECK_START } from "./core.js";

const CARD_COLUMNS = Object.freeze(["id", "name", "type", "era", "cost", "text", "art"]);
const STACK_COLUMNS = Object.freeze(["stack", "card", "count", "start"]);
const VALID_STARTS = new Set([PLAYER_DECK_START, PANEL_START, ...MARKET_STARTS]);

// Fetches both files from `folderUrl` (a URL ending in "/"). The query string makes GitHub Pages and
// the browser hand out the version just pushed rather than a cached one. A missing file throws;
// bad rows inside a file don't.
export async function loadCardData(folderUrl) {
  const [cardsText, stacksText] = await Promise.all([
    fetchText(new URL("cards.csv", folderUrl)),
    fetchText(new URL("stacks.csv", folderUrl)),
  ]);
  return parseCardData(cardsText, stacksText);
}

// Returns { cards, stacks, problems }. `cards` are card definitions, `stacks` are
// { name, start, definitionIds } with every card repeated by its count, `problems` are messages.
export function parseCardData(cardsText, stacksText) {
  const problems = [];
  const cards = parseCards(cardsText, problems);
  const stacks = parseStacks(stacksText, new Set(cards.map(card => card.id)), problems);
  return { cards, stacks, problems };
}

async function fetchText(url) {
  url.searchParams.set("v", Date.now().toString());
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Could not load ${url.pathname} (HTTP ${response.status}).`);
  }
  return response.text();
}

function parseCards(text, problems) {
  const cards = [];
  const seenIds = new Set();
  for (const row of readRows(text, "cards.csv", CARD_COLUMNS, problems)) {
    const id = row.values.id.trim();
    if (id === "") {
      problems.push(`cards.csv row ${row.number}: no id; row skipped.`);
      continue;
    }
    if (seenIds.has(id)) {
      problems.push(`cards.csv row ${row.number}: id "${id}" is used twice; row skipped.`);
      continue;
    }
    seenIds.add(id);
    cards.push({
      id,
      name: row.values.name.trim(),
      type: row.values.type.trim(),
      era: row.values.era.trim(),
      cost: row.values.cost.trim(),
      text: row.values.text.trim(),
      art: row.values.art.trim(),
    });
  }
  return cards;
}

function parseStacks(text, knownCardIds, problems) {
  const stacksByName = new Map();
  for (const row of readRows(text, "stacks.csv", STACK_COLUMNS, problems)) {
    const name = row.values.stack.trim();
    const cardId = row.values.card.trim();
    const countText = row.values.count.trim();
    const start = row.values.start.trim();
    const rowProblem = findStackRowProblem(name, cardId, countText, start, knownCardIds, stacksByName.get(name));
    if (rowProblem !== undefined) {
      problems.push(`stacks.csv row ${row.number}: ${rowProblem}; row skipped.`);
      continue;
    }
    if (!stacksByName.has(name)) {
      stacksByName.set(name, { name, start, definitionIds: [] });
    }
    const definitionIds = stacksByName.get(name).definitionIds;
    for (let i = 0; i < Number(countText); i++) {
      definitionIds.push(cardId);
    }
  }
  return [...stacksByName.values()];
}

function findStackRowProblem(name, cardId, countText, start, knownCardIds, existingStack) {
  if (name === "") {
    return "no stack name";
  }
  if (!knownCardIds.has(cardId)) {
    return `card "${cardId}" is not in cards.csv`;
  }
  if (!/^[1-9]\d*$/.test(countText)) {
    return `count "${countText}" is not a whole number of at least 1`;
  }
  if (!VALID_STARTS.has(start)) {
    return `start "${start}" is not one of ${[...VALID_STARTS].join(", ")}`;
  }
  if (existingStack !== undefined && existingStack.start !== start) {
    return `stack "${name}" already starts at "${existingStack.start}", not "${start}"`;
  }
  return undefined;
}

// Yields { number, values } per data row, with `values` keyed by lower-case column name. `number` is
// the row as a spreadsheet shows it (the header is row 1). Rows with every cell empty are skipped.
function* readRows(text, fileName, requiredColumns, problems) {
  const [header, ...records] = parseCsv(text);
  const columns = (header ?? []).map(column => column.trim().toLowerCase());
  const missingColumns = requiredColumns.filter(column => !columns.includes(column));
  if (missingColumns.length > 0) {
    problems.push(`${fileName}: missing column(s) ${missingColumns.join(", ")}; the whole file was skipped.`);
    return;
  }
  for (const [recordIndex, record] of records.entries()) {
    if (record.every(cell => cell.trim() === "")) {
      continue;
    }
    const values = Object.fromEntries(columns.map((column, columnIndex) => [column, record[columnIndex] ?? ""]));
    yield { number: recordIndex + 2, values };
  }
}

// Reads CSV as spreadsheets write it: quoted cells may hold separators, line breaks and doubled quotes.
// The separator is a comma, or a semicolon when the header has semicolons and no commas, which is how
// Excel saves CSV in German and other comma-decimal locales.
function parseCsv(text) {
  const source = text.replace(/^﻿/, "").replace(/\r\n?/g, "\n");
  const headerEnd = source.indexOf("\n");
  const headerLine = headerEnd === -1 ? source : source.slice(0, headerEnd);
  const separator = headerLine.includes(";") && !headerLine.includes(",") ? ";" : ",";
  const records = [];
  let record = [];
  let cell = "";
  let isQuoted = false;
  for (let i = 0; i < source.length; i++) {
    const character = source[i];
    if (isQuoted) {
      if (character !== "\"") {
        cell += character;
      } else if (source[i + 1] === "\"") {
        cell += "\"";
        i++;
      } else {
        isQuoted = false;
      }
    } else if (character === "\"") {
      isQuoted = true;
    } else if (character === separator) {
      record.push(cell);
      cell = "";
    } else if (character === "\n") {
      record.push(cell);
      records.push(record);
      record = [];
      cell = "";
    } else {
      cell += character;
    }
  }
  if (cell !== "" || record.length > 0) {
    record.push(cell);
    records.push(record);
  }
  return records;
}
