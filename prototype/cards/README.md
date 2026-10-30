# Card files

The prototype reads its cards from this folder. Edit the files, push to `main`, and the published page
picks them up after about a minute. Open them in Excel, LibreOffice or Google Sheets and save as CSV;
files separated by `;` (how Excel saves CSV in German) work too.

A row with a mistake is skipped, and the host sees a list of skipped rows with their spreadsheet row
numbers when the table starts. The rest of the cards still load.

## `cards.csv` — one row per card

| Column | What goes in it |
|---|---|
| `id` | A short unique name for the card, used by `stacks.csv` (for example `forge`). Required, no duplicates. |
| `name` | The name printed on the card. |
| `type` | Building, Unit, Technology, … — free text, used by the catalog's type filter. |
| `era` | The era number, used by the catalog's era filter. |
| `cost` | Free text, printed as written (for example `2 cards, needs Iron`). |
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
