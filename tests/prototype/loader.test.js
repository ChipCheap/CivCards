import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { parseCardData } from "../../prototype/js/loader.js";

const CARDS_HEADER = "id,name,type,era,cost,text,art";
const STACKS_HEADER = "stack,card,count,start";

test("quoted cells keep separators, line breaks and doubled quotes", () => {
  const cardsText = `${CARDS_HEADER}\nforge,Forge,Blueprint,1,"2 Production, 1 Culture","Defense 1\nSays ""hello""",forge.png\n`;
  const { cards, problems } = parseCardData(cardsText, STACKS_HEADER);
  assert.deepEqual(problems, []);
  assert.deepEqual(cards, [{
    id: "forge", name: "Forge", type: "Blueprint", era: "1", origin: "",
    cost: [{ amount: 2, resource: "Production" }, { amount: 1, resource: "Culture" }],
    stat: null, hp: null, claim: [],
    text: "Defense 1\nSays \"hello\"", art: "forge.png",
  }]);
});

test("the optional columns give origin, a stat, hit points and a claim price; a resource may stand without an amount", () => {
  const cardsText = "id,name,type,era,origin,cost,stat,hp,claim,text,art\n"
    + "knight,Knight,Unit,1,Made by Stables,\"2 Food, Iron, Powder\",4 Attack,2,\"8 Production, Stone\",,\n";
  const { cards, problems } = parseCardData(cardsText, STACKS_HEADER);
  assert.deepEqual(problems, []);
  assert.equal(cards[0].origin, "Made by Stables");
  assert.deepEqual(cards[0].cost, [
    { amount: 2, resource: "Food" }, { amount: null, resource: "Iron" }, { amount: null, resource: "Powder" },
  ]);
  assert.deepEqual(cards[0].stat, { amount: 4, resource: "Attack" });
  assert.equal(cards[0].hp, 2);
  assert.deepEqual(cards[0].claim, [{ amount: 8, resource: "Production" }, { amount: null, resource: "Stone" }]);
});

test("unknown resources, extra stats and bad hit points are listed, and the card still loads", () => {
  const cardsText = "id,name,type,era,cost,stat,hp,claim,text,art\n"
    + "odd,Odd,,1,3 Gold,\"1 Attack, 2 Food\",lots,,,\n";
  const { cards, problems } = parseCardData(cardsText, STACKS_HEADER);
  assert.deepEqual(cards[0].cost, [{ amount: 3, resource: "Gold" }]);
  assert.deepEqual(cards[0].stat, { amount: 1, resource: "Attack" });
  assert.equal(cards[0].hp, null);
  assert.equal(problems.length, 3);
  assert.match(problems[0], /^cards\.csv row 2: stat "1 Attack, 2 Food" has more than one entry/);
  assert.match(problems[1], /^cards\.csv row 2: hp "lots" is not a whole number/);
  assert.match(problems[2], /^cards\.csv row 2: cost names "Gold", which has no icon/);
});

test("a quote in the middle of an unquoted cell is kept as text and doesn't swallow later rows", () => {
  const cardsText = `${CARDS_HEADER}\nbanner,Banner,Building,1,,Raise the "Banner" of war,\nfarm,Farm,Building,1,,Food,\n`;
  const { cards, problems } = parseCardData(cardsText, STACKS_HEADER);
  assert.deepEqual(problems, []);
  assert.deepEqual(cards.map(card => [card.id, card.text]), [["banner", "Raise the \"Banner\" of war"], ["farm", "Food"]]);
});

test("Windows line endings and a byte-order mark are handled", () => {
  const cardsText = `﻿${CARDS_HEADER}\r\nfarm,Farm,Building,1,,"Line one\r\nLine two",\r\n`;
  const { cards, problems } = parseCardData(cardsText, STACKS_HEADER);
  assert.deepEqual(problems, []);
  assert.equal(cards[0].id, "farm");
  assert.equal(cards[0].text, "Line one\nLine two");
});

test("semicolon-separated files, as German Excel saves them, are read too", () => {
  const cardsText = "id;name;type;era;cost;text;art\nfarm;Farm;Building;1;1 Food;\"Food; lots of it\";\n";
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
