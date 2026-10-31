# Review: Prototyper

**Date:** 2026-10-31
**Reviewed:** everything in `prototype/` and `tests/prototype/` at commit `35c0f87`
**Against:** `Prototyper.plan.md`, `Prototyper.architecture.md`, the project `CLAUDE.md` and the user-level
`CLAUDE.md` ("Write code to the standard the first time")
**Effort:** high — one reviewer pass, findings not separately verified

Findings are labelled **R1–R10** (labels from this review, most severe first).

## Status (2026-10-31)

| Finding | Status | How it was checked |
|---|---|---|
| R1 | **Fixed** — each new table forgets a hovered stack or hand card that is gone or hidden, and closes a menu or search whose stack is gone | Browser: drew a hovered stack empty, pressed C — no error |
| R2 | **Fixed** — pressing anywhere but a text field takes focus out of that field | Browser: typed in Notes, pressed the table, drew with a key |
| R3 | **Fixed** — an open room retries the broker every 5 s after losing it | Code only; a broker outage can't be produced locally |
| R4 | **Fixed** — a new drag cancels the last one and releases its lock; a move with no button held and `pointercancel` cancel a drag | Browser, two tabs: the guest saw the lock released |
| R5 | **Fixed** — after every redraw the preview follows the card under the pointer or hides | Browser: deleted the hovered card, the preview hid |
| R6 | **Fixed** — ending a pan removes all three of its listeners | Code only |
| R7 | **Fixed** — "no pointer on the table" is sent once until the pointer returns | Code only |
| R8 | **Fixed** — Numpad 1–9 draw like the number row | Browser: Numpad 3 drew 3 |
| R9 | **Fixed** — only a quote at the start of a cell opens a quoted section | New loader test (31 tests, all passing) |
| R10 | **Open** — the `rect` → `rectangle` rename, in its own commit | — |

## Decision

Agreed with the user on 2026-10-31:

1. Fix R1–R9 (the correctness and efficiency findings) in one change, checked in the browser.
2. Afterwards, rename `rect` → `rectangle` (R10) **in a commit of its own** that changes nothing else and is
   proven behaviour-neutral: every test identical before and after. User-level CLAUDE.md: "A rename is
   made with a semantic tool, never find-and-replace, in a commit that changes nothing else".

## The two CLAUDE.md rules asked about

- **Whole-word names** — holds everywhere except `rect` (R10). The only single-letter names are `i`/`j`
  as loop indices and `x`/`y` as coordinates, which the rule allows: "The only short names are `i`, `j`,
  `k` for loop indices and `x`, `y` for coordinates."
- **Null checks only where data enters** — holds. Every check sits at an entry point (network messages
  in `session.js`, `transport.js`, `core.js`'s request handling and `render.js`'s presence check; browser
  storage in `hud.js` and `panel.js`; the CSV files in `loader.js`; browser events in `input.js`) or on
  state that is empty by design (no drag in progress, no popup open, no guest connected).

## Findings

### R1 — Stale stack id crashes copy and search · correctness
**Where:** `prototype/js/screen/input.js:450` (`besideStack`), also `openSearch` (~line 386)
**What:** `besideStack` and `openSearch` use `findStack(stackId)` without checking the result, but the id can
be stale: `hovered` is refreshed only when the pointer moves, and an open menu keeps the id it was opened with.
**Failure:** hover a 2-card loose stack and press 2 — both cards are drawn and the stack is removed, but
`hovered` still names it. Pressing C runs `stackRect(undefined)` and throws a TypeError. The same happens when
a right-click menu stays open while the opponent trashes that stack and you then click "Copy top card" or
"Search…".

### R2 — Keys go into Notes after clicking the table · correctness
**Where:** `prototype/js/screen/input.js:133` (`startDrag`), and the pan in `prototype/js/screen/view.js:66`
**What:** both call `preventDefault()` on pointerdown, which also stops the browser moving focus away from a
focused Notes box or counter field.
**Failure:** type in Notes, click a stack or the table, hover the deck and press 3 — nothing is drawn and "3"
is typed into your notes. F, R and C behave the same.

### R3 — Host never reconnects to the broker · correctness
**Where:** `prototype/js/transport.js:36` (`openRoom`)
**What:** PeerJS's `disconnected` event is ignored, so after the host loses its connection to the public
broker (network blip, laptop sleep) its room id is gone there and `peer.reconnect()` is never called.
**Failure:** the host's broker connection drops briefly while the direct link to the guest survives; the guest
then refreshes and gets "No table with this code is open" although the host's table is live. Breaks G22
("guest refresh rejoins their seat").

### R4 — A new drag drops an old lock without releasing it · correctness
**Where:** `prototype/js/screen/input.js:135` (`startDrag` calls `endDrag()`, not `cancelDrag()`); no
`pointercancel` handling
**Failure:** start dragging a deck card, Alt-Tab away and release the button in another window (the page never
gets pointerup). Back in the game, pressing on another stack discards the old drag without `release`: the deck
stays locked to you and the opponent can't use it until you disconnect.

### R5 — Hover preview sticks after a re-render · correctness
**Where:** `prototype/js/screen/render.js:85`
**What:** the preview hides only on `pointerout` from a face; a re-render removes elements without firing it.
**Failure:** hover a market card while the opponent takes it — the large preview of a card that is no longer
there stays on screen until the pointer later leaves some other card.

### R6 — Each pan leaves a stale listener behind · efficiency
**Where:** `prototype/js/screen/view.js:81`
**What:** every pan adds `pointerup` and `pointercancel` listeners with `{ once: true }`; only the one that
fires is removed.
**Failure:** stale listeners pile up over a session; each stale `pointerup` closure runs on every later
pointerup in the table, card drags included.

### R7 — Presence "null" sent 20 times a second off the table · efficiency
**Where:** `prototype/js/screen/input.js:67` (`sendPresenceSoon`)
**Failure:** moving the mouse over your HUD, hand or the catalog sends about 20 identical "no pointer"
messages a second; one, when the pointer leaves the table, is enough.

### R8 — Number-pad 1–9 don't draw · correctness
**Where:** `prototype/js/screen/input.js:15` (`DRAW_KEYS`)
**What:** only `Digit1`–`Digit9` are handled, not `Numpad1`–`Numpad9`; `Prototyper.framework.md` says "Number
keys 1–9 over a stack draw that many cards into your hand."
**Failure:** a player pressing Numpad 3 over their deck gets nothing, with no hint why.

### R9 — A quote in the middle of a cell corrupts following rows · correctness
**Where:** `prototype/js/loader.js:152` (`parseCsv`)
**What:** any `"` starts a quoted section, not only one at the start of a cell.
**Failure:** a hand-written row such as `banner,Banner,Building,1,,Raise the "Banner" of war,` swallows the rest
of the line and the following rows until the quotes balance again. Cards silently vanish or merge, with
nothing in the problem list. (Files saved by Excel or Google Sheets quote such cells correctly.)

### R10 — Abbreviation `rect` breaks the whole-word rule · conventions
**Where:** 40 uses in `prototype/js/screen/layout.js` (e.g. line 79, `stackRect`), `render.js`, `input.js`,
`view.js` — `rect`, `stackRect`, `privateZoneRect`, `toBoardRect` and their locals.
**Rule:** user-level CLAUDE.md, "Write code to the standard the first time": "Names are whole words — what the
thing is, in the project's own vocabulary."
**Fix:** rename to `rectangle` in its own proven-neutral commit (see Decision).
