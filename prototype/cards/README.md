# Card files

The prototype reads its cards from this folder. Edit the files, push to `main`, and the published page
picks them up after about a minute. Open them in Excel, LibreOffice or Google Sheets and save as CSV;
files separated by `;` (how Excel saves CSV in German) work too.

A row with a mistake is skipped, and the host sees a list of skipped rows with their spreadsheet row
numbers when the table starts. The rest of the cards still load. A cost, stat or claim that isn't
written as amounts is left empty and listed the same way; its card still loads.

## `cards.csv` — one row per card

| Column | What goes in it |
|---|---|
| `id` | A short unique name for the card, used by `stacks.csv` (for example `forge`). Required, no duplicates. |
| `name` | The name printed on the card. |
| `type` | Building, Unit, Technology, … — free text, used by the catalog's type filter. |
| `era` | The era number, used by the catalog's era filter. |
| `origin` | Optional. Where the card comes from, printed after the era (for example `Starter` or `Made by Stables`). |
| `cost` | What it costs to play, as amounts (for example `1 Food` or `2 Production, 1 Culture`). Leave empty for a free card. Each amount is drawn as its icon with the number on it, top left. |
| `uses` | Optional. Tokens or strategic resources the card consumes, one circle each, next to the cost (for example `Iron, Powder` or `2 Powder`). |
| `stat` | Optional. The card's quick value, one amount (for example `3 Production` or `4 Attack`), drawn top right. |
| `claim` | Optional. The market price, as amounts (for example `4 Production`), drawn bottom left. A Wonder's price goes here. |
| `text` | The rules text. Line breaks inside a cell are kept. |
| `art` | A picture's file name in `art/` (for example `forge.png`). Leave empty for no picture; a missing file just leaves the picture out. |

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
