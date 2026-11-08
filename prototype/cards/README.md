# Card files

The prototype reads its cards from this folder. Edit the files, push to `main`, and the published page
picks them up after about a minute. Open them in Excel, LibreOffice or Google Sheets and save as CSV;
files separated by `;` (how Excel saves CSV in German) work too.

A row with a mistake is skipped, and the host sees a list of skipped rows with their spreadsheet row
numbers when the table starts. The rest of the cards still load. An unknown resource name or an hp
that isn't a whole number is listed the same way; its card still loads.

## `cards.csv` — one row per card

| Column | What goes in it |
|---|---|
| `id` | A short unique name for the card, used by `stacks.csv` (for example `forge`). Required, no duplicates. |
| `name` | The name printed on the card. |
| `type` | Building, Unit, Technology, … — free text, used by the catalog's type filter. |
| `era` | The era number, used by the catalog's era filter. |
| `origin` | Optional. Where the card comes from, printed after the era (for example `Starter` or `Made by Stables`). |
| `cost` | What it costs to play or build, top left (for example `1 Food` or `2 Food, Iron, Powder`). An amount is drawn as its icon with the number on it; a resource written alone is needed or used up and drawn as a small icon, so write it once per unit. Leave empty for a free card. |
| `stat` | Optional. The card's quick value, one amount (for example `3 Production` or `4 Attack`), drawn top right. A strategic resource card writes the resource it provides, without a number (`Iron`). |
| `hp` | Optional. A building's or Wonder's hit points, a whole number, drawn as a wall under the stat. |
| `claim` | Optional. The market price, bottom left, written like `cost` (for example `4 Production` or `8 Production, Stone`). A Wonder's price, and any strategic resource it needs, go here. |
| `text` | The rules text. Line breaks inside a cell are kept. An amount of a resource, like `+3 Production`, is shown with its icon. |
| `art` | A picture's file name in `art/` (for example `forge.png`). Leave empty for no picture; a missing file just leaves the picture out. |

Resource names are the ones in `js/resources.js` (Production, Food, Knowledge, Culture, Coin, Attack,
Military, Cards, Plant, Rock, Tool, Grain, Timber, Wool, Cloth, Iron, Powder, Horses, Stone, Coal, Salt).
A name not on that list shows its first two letters and is listed when the table starts.

## `stacks.csv` — one row per card in a ready-made stack

| Column | What goes in it |
|---|---|
| `stack` | The stack's name. Rows with the same name form one stack. |
| `card` | A card `id` from `cards.csv`. |
| `count` | How many copies of that card, 1 or more. |
| `start` | Where the stack starts (see below). Every row of one stack must give the same value. |

`start` values:

- `player-deck` — each player gets their own copy, shuffled face-down in their deck slot.
- `market-resources`, `market-tech`, `market-blueprints`, `market-wonders` — shuffled face-down into that
  market's supply; its 3 display slots are then filled face-up.
- `panel` — not on the table at the start; listed in the right panel, where it can be dragged out as a
  fresh shuffled copy as often as needed (later eras, junk cards).

## Art

Put pictures in `art/`. Any size works; they are shown cropped to a short strip on the card.

## Tests

From the repository root:

```bash
node --test "tests/prototype/*.test.js"
```
