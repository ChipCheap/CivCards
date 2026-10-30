import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { parseCardData } from "../../prototype/js/loader.js";

const CARDS_HEADER = "id,name,type,era,cost,text,art";
const STACKS_HEADER = "stack,card,count,start";

test("quoted cells keep separators, line breaks and doubled quotes", () => {
  const cardsText = `${CARDS_HEADER}\nforge,Forge,Blueprint,1,"2 cards, needs Iron","Defense 1\nSays ""hello""",forge.png\n`;
  const { cards, problems } = parseCardData(cardsText, STACKS_HEADER);
  assert.deepEqual(problems, []);
  assert.deepEqual(cards, [{
    id: "forge", name: "Forge", type: "Blueprint", era: "1",
    cost: "2 cards, needs Iron", text: "Defense 1\nSays \"hello\"", art: "forge.png",
  }]);
});

test("Windows line endings and a byte-order mark are handled", () => {
  const cardsText = `﻿${CARDS_HEADER}\r\nfarm,Farm,Building,1,,"Line one\r\nLine two",\r\n`;
  const { cards, problems } = parseCardData(cardsText, STACKS_HEADER);
  assert.deepEqual(problems, []);
  assert.equal(cards[0].id, "farm");
  assert.equal(cards[0].text, "Line one\nLine two");
});

test("semicolon-separated files, as German Excel saves them, are read too", () => {
  const cardsText = "id;name;type;era;cost;text;art\nfarm;Farm;Building;1;1 card;\"Food; lots of it\";\n";
  const stacksText = "stack;card;count;start\nStarter deck;farm;3;player-deck\n";
  const { cards, stacks, problems } = parseCardData(cardsText, stacksText);
  assert.deepEqual(problems, []);
  assert.equal(cards[0].text, "Food; lots of it");
  assert.deepEqual(stacks, [{ name: "Starter deck", start: "player-deck", definitionIds: ["farm", "farm", "farm"] }]);
});

test("stack rows group by name and repeat each card by its count", () => {
  const cardsText = `${CARDS_HEADER}\nfarm,Farm,,,,,\nworkshop,Workshop,,,,,\n`;
  const stacksText = `${STACKS_HEADER}\nStarter deck,farm,2,player-deck\nEra 2,workshop,1,panel\nStarter deck,workshop,1,player-deck\n`;
  const { stacks, problems } = parseCardData(cardsText, stacksText);
  assert.deepEqual(problems, []);
  assert.deepEqual(stacks, [
    { name: "Starter deck", start: "player-deck", definitionIds: ["farm", "farm", "workshop"] },
    { name: "Era 2", start: "panel", definitionIds: ["workshop"] },
  ]);
});

test("each kind of bad row is skipped and listed with its spreadsheet row number", () => {
  const cardsText = [
    CARDS_HEADER,
    "farm,Farm,,,,,",
    ",Nameless,,,,,",
    "farm,Second Farm,,,,,",
    ",,,,,,",
  ].join("\n");
  const stacksText = [
    STACKS_HEADER,
    "Deck,farm,2,player-deck",
    "Deck,ghost,1,player-deck",
    "Deck,farm,two,player-deck",
    "Deck,farm,0,player-deck",
    "Deck,farm,1,attic",
    "Deck,farm,1,panel",
    ",farm,1,panel",
  ].join("\n");
  const { cards, stacks, problems } = parseCardData(cardsText, stacksText);
  assert.deepEqual(cards.map(card => card.name), ["Farm"]);
  assert.deepEqual(stacks, [{ name: "Deck", start: "player-deck", definitionIds: ["farm", "farm"] }]);
  assert.equal(problems.length, 8);
  assert.match(problems[0], /^cards\.csv row 3: no id/);
  assert.match(problems[1], /^cards\.csv row 4: id "farm" is used twice/);
  assert.match(problems[2], /^stacks\.csv row 3: card "ghost" is not in cards\.csv/);
  assert.match(problems[3], /^stacks\.csv row 4: count "two"/);
  assert.match(problems[4], /^stacks\.csv row 5: count "0"/);
  assert.match(problems[5], /^stacks\.csv row 6: start "attic"/);
  assert.match(problems[6], /^stacks\.csv row 7: stack "Deck" already starts at "player-deck"/);
  assert.match(problems[7], /^stacks\.csv row 8: no stack name/);
});

test("a file missing a required column is skipped as a whole and listed", () => {
  const { cards, problems } = parseCardData("id,name\nfarm,Farm\n", STACKS_HEADER);
  assert.deepEqual(cards, []);
  assert.deepEqual(problems, ["cards.csv: missing column(s) type, era, cost, text, art; the whole file was skipped."]);
});

test("the sample card files in the repo load without problems", async () => {
  const folder = new URL("../../prototype/cards/", import.meta.url);
  const [cardsText, stacksText] = await Promise.all([
    readFile(new URL("cards.csv", folder), "utf8"),
    readFile(new URL("stacks.csv", folder), "utf8"),
  ]);
  const { stacks, problems } = parseCardData(cardsText, stacksText);
  assert.deepEqual(problems, []);
  const starterDeck = stacks.find(stack => stack.start === "player-deck");
  assert.equal(starterDeck.definitionIds.length, 10);
  for (const market of ["market-resources", "market-tech", "market-blueprints", "market-wonders"]) {
    const marketCards = stacks.filter(stack => stack.start === market).flatMap(stack => stack.definitionIds);
    assert.ok(marketCards.length >= 6, `${market} has at least 6 cards`);
  }
  assert.ok(stacks.some(stack => stack.start === "panel"));
});
