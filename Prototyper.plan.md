# Plan: Prototyper

**Outer iteration:** 1
**Realizes framework:** Prototyper.framework.md (+ framework.md)
**Within architecture:** Prototyper.architecture.md, complexity target 2 (simple)
**Previous version:** none — first iteration

## Changes from previous iteration

None — first iteration.

## Framework coverage map

Goals G1–G25 are this plan's own numbering, each one a behaviour, edge case or invariant from
`Prototyper.framework.md`. Labels quoted from other files: PA/PN are `Prototyper.framework.md`'s
invariants, PG/PD are `Prototyper.architecture.md`'s guidelines and decisions.

| Framework goal | Plan steps |
|---|---|
| G1: Join by opening a link with a room code; first visitor hosts (PA1) | S8, S9 |
| G2: Connection test before anything else is built | S1, S2 |
| G3: Host's state is the truth; every change goes through the host (PA2) | S4, S8 |
| G4: Screen layout — pannable/zoomable table, own hand bottom, opponent hand as backs top, left HUD, right panel, own side mirrored to the bottom | S7, S10, S11, S16 |
| G5: Everything is a stack; cursor point decides the drop; target highlight; visual overlap only; count badge; per-card face state (PA3) | S4, S12 |
| G6: Drag takes the top card; Shift + drag takes the whole stack | S4, S12 |
| G7: Keys 1–9, F (incl. while holding), Shift + F, R, C and right-click menu | S4, S13 |
| G8: Search a stack (optional, only if clean) | S17 |
| G9: Hand — entering it turns a card face-up; cards keep state otherwise; F works in hand; reorder; drag back out | S4, S12, S13, S16 |
| G10: Slots stay when empty; per-player deck and discard slots and private zone; market supply + 3 display slots per stack | S5, S10 |
| G11: Starting layout from the stacks file; era 2–4 stacks in the panel; same starter deck for both; setup shuffles and fills displays | S3, S5 |
| G12: Copy with C; trash can deletes cards and stacks for everyone | S4, S14 |
| G13: Private zone fully hidden from the opponent; Reveal buildings toggle; hand shown as backs; everything else visible (PA4) | S4, S11, S15 |
| G14: Left HUD — private counters, shared Modernization and turn counters, private notes | S4, S15 |
| G15: Right panel — catalog filterable by type and era, drag to create; panel stacks; trash can | S14 |
| G16: Card data as CSV in the repo; one card template; generic back; missing art tolerated (PA5) | S3, S11 |
| G17: Hover preview to read cards | S11 |
| G18: Each player's cursor and held card visible to the other | S8, S9, S11, S12 |
| G19: Simultaneous grab — first grab wins, card locked until dropped | S4, S9 |
| G20: Drop into opponent's zone allowed; card leaving your zone becomes visible | S11, S12 |
| G21: Draw from an empty stack or more than its size draws what is there | S4 |
| G22: Host refresh loses the game; guest refresh rejoins their seat | S8, S9 |
| G23: A third person is refused while two seats are taken | S8 |
| G24: Host's card definitions win for a joining player | S8, S9 |
| G25: No build step and no server of our own (PN2); no rules enforcement (PN1) | H1, S4, S7 |

## Plan steps

### S1: Connection test page
**Covers:** G2
**Files:** `prototype/connection-test.html` (new)
**Description:** A standalone page, published with the prototype, that loads the pinned PeerJS client from a CDN*. Opened without a hash, it registers on PeerJS's public broker under the id `civcards-<code>` (a random 5-letter code), shows a "copy this link" box with `connection-test.html#<code>`, and waits. Opened with a hash, it connects to that id. Once connected, both sides exchange a ping every second and show round-trip time*, plus a large plain-language status line*: "Waiting for the other player", "Connected — it works", or "Could not connect" with the reason (broker unreachable, code not found, direct connection blocked by the network)*. A connection attempt that hasn't succeeded within 20 seconds counts as failed.
**Rationale:** Prototyper.framework.md: "Before anything else is built, a minimal connection test is tried between the two real players' machines." The `civcards-` prefix keeps our codes from colliding with other apps on the shared public broker.

**Technical note:** *Pinned PeerJS 1.5.5, the latest stable release (2.0 is still beta), loaded from jsDelivr with a subresource integrity hash.
**Technical note:** *Added a silence check: if no ping reply arrives for 5 seconds, the page reports "Lost contact with the other player". A tab that closes abruptly sends no close signal, so without this the remaining page kept showing "Connected — it works". Deviation: beyond the step text.
**Technical note:** *PeerJS's default settings include its free relay (TURN) servers, so a blocked direct connection can still succeed through a relay. The page therefore also reports the route it got: "direct between your two browsers" or "through a PeerJS relay server". Deviation: this report goes beyond the step text.
**Technical note:** *Added an on-page event list ("What happened") with timestamps, so a failure can be reported exactly. Deviation: beyond the step text.

### S2: Checkpoint — run the connection test with the real players
**Covers:** G2
**Files:** none
**Description:** Stop after S1 and H1 are published. The user and their friend open the test from their own PCs and report the status line. If it says "Connected", continue with S3. If it fails, stop the build and return to the specifier: the transport is swapped for a hosted realtime database used only as a message relay (`Prototyper.architecture.md` Infrastructure: "the transport module is swapped for a hosted realtime database … used only as a message relay"), which changes S8 and S9 only.

### S3: Card loader
**Covers:** G11, G16
**Files:** `prototype/js/loader.js` (new), `prototype/cards/cards.csv` (new, sample), `prototype/cards/stacks.csv` (new, sample), `prototype/cards/art/` (new, empty with a `.gitkeep`)
**Description:** Fetch both CSV files (with a cache-busting query so a fresh push is seen) and parse them into plain data. Cards: `id, name, type, era, cost, text, art`. Stacks: `stack, card, count, start`, where `start` is `player-deck` (each player gets their own copy), a market slot name (`market-resources`, `market-tech`, `market-blueprints`, `market-wonders`), or `panel`. Card text keeps line breaks; no other markup. Bad rows (missing id, duplicate id, a stack naming an unknown card, an unknown start value, a non-numeric count) are skipped and collected into a problem list returned alongside the data; loading never throws for bad content. The parsing functions take text in and return data out, so they are testable in Node. Sample files hold a handful of placeholder cards: a 10-card starter deck, at least 6 cards in each era 1 market stack, and a small era 2 stack in the panel.
**Rationale:** PG5: "Only the card loader reads CSV. Everything else works with card and stack definitions." A CSV parsing library may be used (PD10), pinned and listed in the architecture's Third-party code section.

### S4: Table core — state and requests
**Covers:** G3, G5, G6, G7, G9, G12, G13, G14, G19, G21, G25
**Files:** `prototype/js/core.js` (new)
**Description:** Define the table as plain data: stacks (id, ordered card instances, either a slot name or a table position), card instances (instance id, card definition id, face-up flag), hands per seat (ordered card instances), seats (list), shared counters (Modernization, turn), reveal flag per seat, lock per stack top (seat holding it) and a snapshot sequence number. Provide `createTable(definitions, stacks, seats, random)` for setup (S5) and `apply(table, seat, request, random)` returning the new table. Request kinds: grab, release, move-top (to stack, slot, table position or hand index), move-stack, flip-top, flip-held, flip-stack (reverses order and flips each card), shuffle, draw-n (to the requester's hand, turning cards face-up), hand-flip, hand-reorder, copy (new instance of the same definition and face state, as a new stack at a given position), trash (card or stack), spawn (card or panel stack at a position), counter-add (shared counters, by amount, so simultaneous clicks both count), reveal-toggle (own seat only). Rules: a request that doesn't fit the current table (unknown stack, card no longer on top, stack locked by the other seat, counter that doesn't exist) is ignored and the table is returned unchanged — never an exception. Taking the last card from a slot leaves the slot (empty); taking the last card from a loose stack removes the stack. Drawing more than a stack holds draws what is there. A card entering a hand becomes face-up; a card leaving a hand keeps its state. Randomness (shuffle, new ids) comes only from the `random` argument. No browser globals.
**Rationale:** PG1: "The table core is pure"; PG2: "Every change is a request"; PG3: requests and snapshots are plain data. Ignoring invalid requests is enough because the host re-sends the snapshot (S8), which corrects any screen that guessed wrong. Card-rule checks are deliberately absent (PN1: "No rules enforcement in the first version").

### S5: Table core — setup
**Covers:** G10, G11
**Files:** `prototype/js/core.js`
**Description:** `createTable` builds the starting table from the stack definitions: for each seat, a copy of every `player-deck` stack goes shuffled face-down into that seat's deck slot, and its discard slot starts empty; every market stack goes shuffled face-down into its supply slot and then its 3 display slots are filled face-up from the top of that supply (fewer if the supply runs short); `panel` stacks are not placed on the table but stay listed for the right panel. Slots are named, e.g. `seat0-deck`, `seat0-discard`, `market-tech-supply`, `market-tech-display-1`. Shared counters start at 0 and turn at 1.
**Rationale:** Prototyper.framework.md: "every stack that starts on the board is shuffled face-down into its slot, and each market stack's 3 display slots are filled face-up from its supply."

### S6: Core tests
**Covers:** G5, G6, G7, G9, G12, G19, G21 (verification)
**Files:** `tests/prototype/core.test.js` (new), `tests/prototype/loader.test.js` (new)
**Description:** Tests with Node's built-in test runner (`node --test tests/prototype`), no packages. Core: dropping onto a stack puts the card on top; dragging takes only the top card; move-stack keeps order; flip-stack reverses order and flips each card; draw-n with too few cards; cards entering a hand turn face-up and keep state leaving it; copy keeps definition and face state with a new id; trash of a card and of a stack; last card from a slot keeps the slot, from a loose stack removes it; a grab on a stack locked by the other seat is ignored; setup fills 3 displays per market stack and gives each seat its own shuffled deck; the same `random` gives the same table. Loader: quoted multi-line text, each bad-row case lands in the problem list.
**Rationale:** PD9: "Automated tests for the table core only, run locally with Node."

### S7: Page shell and module wiring
**Covers:** G4
**Files:** `prototype/index.html` (new), `prototype/style.css` (new), `prototype/js/main.js` (new)
**Description:** The page with four regions (left HUD, centre table, bottom hand strip, top opponent-hand strip, right panel) and an overlay area for status messages. `main.js` loads the modules as ES modules; on the host it runs the card loader (S3) and hands the definitions to the session; it starts the session (S8) and the screen (S10), and passes the session's snapshot updates to the screen and the screen's requests to the session. No build step: the browser loads files as they are.

### S8: Session — host side
**Covers:** G1, G3, G22, G23, G24
**Files:** `prototype/js/session.js` (new)
**Description:** Opened without a hash, the page becomes host: it receives the loaded cards from `main.js` (S7), shows any loader problems in a dismissible panel, creates the table (S5) with seat 0 for itself, opens a room through the transport (S9) under a new random code, puts `#<code>` into its own address bar, and shows a "Copy invite link" button. It applies every request (its own and the guest's) through `core.apply`, increments the snapshot sequence and sends the full snapshot to all connected players. On a guest's hello (carrying a seat token kept in the guest's browser storage per room), it assigns seat 1 to a new token, re-admits the same token to seat 1 (replacing an older connection with that token), and refuses any other token while seat 1 is taken ("This table is full"). It sends a joining guest a welcome with the card definitions and the current snapshot. When a guest disconnects, any lock held by that seat is released and the card stays where it was. Presence messages from one player are relayed to the other untouched.
**Rationale:** PD5: "Requests to the host; the host applies them and sends the whole table … to everyone after each change." Seat 1 is the only guest seat, but seats stay a list (PG11).

### S9: Session — guest side, and transport
**Covers:** G1, G18, G19, G22, G24
**Files:** `prototype/js/session.js`, `prototype/js/transport.js` (new)
**Description:** Transport: the only module that imports PeerJS (PG4: "Only the transport module touches the networking library"). It offers open-room(code), join-room(code), send, and events for message, connect, disconnect and failure, using the id scheme from S1. Guest: opened with `#<code>`, the page joins that room, sends hello with its seat token, takes the card definitions from the welcome (it does not fetch the CSVs), and keeps the snapshot with the highest sequence number, ignoring older ones. Its requests go to the host; on drag start it sends grab and lets the card follow the cursor at once; if the next snapshot shows the lock went to the other player, the screen drops the drag and the card snaps back. Failures show a plain overlay with a "Start a new table" button: "No table with this code is open" (code not found), "The host left — this table is gone" (host disconnected), "This table is full".
**Rationale:** Letting the guest drag at once and correcting from the snapshot keeps dragging responsive without waiting a network round trip for every grab.

### S10: Screen — board layout and view
**Covers:** G4, G10
**Files:** `prototype/js/screen/layout.js` (new), `prototype/js/screen/view.js` (new)
**Description:** `layout.js` is the one place that holds slot rectangles, private-zone rectangles and the table size in table units, for seat 0's side at the bottom and seat 1's side at the top, with the market in the middle. The private zone fits at least two rows of ten cards. `view.js` converts between table units and screen pixels, including pan (drag on empty table) and zoom (mouse wheel), and mirrors the table vertically for seat 1 so each player sees their own side at the bottom. Positions stored in the table are always in unmirrored table units; mirroring is screen-only.
**Rationale:** `Prototyper.architecture.md` Extensibility: "the slot positions themselves are kept in one place in the screen module".

### S11: Screen — drawing
**Covers:** G4, G13, G16, G17, G18, G20
**Files:** `prototype/js/screen/render.js` (new), `prototype/style.css`
**Description:** Draw each stack as page elements: its top card (face from the card template — name, type, era, cost, text, art — or the generic back), a count badge when it holds more than one card, and outlined empty slots. Missing art shows the card without the picture. Draw your own hand at the bottom, faces or backs as each card's state says; draw the opponent's hand at the top as backs only, so only the count shows. Hiding: for the viewing seat, any stack whose centre lies in the opponent's private zone is not drawn at all unless that opponent's reveal flag is on, and the opponent's held card is drawn as a back unless it is face-up and came from a place the viewer could see. Hovering a visible card shows an enlarged preview in a fixed corner. The other player's cursor is drawn as a small labelled pointer.
**Rationale:** PG7: "Hiding happens in the screen." Showing a held card as a back when it comes from a hand or a private zone stops a drag from leaking a hidden card (PA4: "Cards in a player's private zone and hand are never drawn face-up on the opponent's screen").

### S12: Screen — drag and drop
**Covers:** G5, G6, G9, G20
**Files:** `prototype/js/screen/input.js` (new)
**Description:** Mouse down on a stack starts dragging its top card (grab request); with Shift held, the whole stack. While dragging, the stack or slot under the cursor point is highlighted, and position updates go out as presence about 20 times a second. On release, the cursor point alone picks the target: a visible stack or slot → move onto it; the hand strip → into the hand at that index; the trash can → trash; empty table → new stack at that point. Dragging within your hand reorders it; dragging a hand card out places it per the same rules. Stacks hidden from the viewer (inside the opponent's unrevealed zone) are never targets or grab sources, but the zone's empty area is a valid drop spot. Release sends the move and a release of the lock.
**Rationale:** PA3: "the cursor point at drop time alone decides which stack a card joins."

### S13: Screen — keys and right-click menu
**Covers:** G7, G9
**Files:** `prototype/js/screen/input.js`
**Description:** With the cursor over a visible stack or hand card, or while holding a card: 1–9 draws that many into your hand, F flips the top card / the held card / the hovered hand card, Shift + F flips the whole stack, R shuffles, C copies (the copy appears as a new stack just beside the cursor). Right-click on a stack opens a menu with draw 1, draw N (asks for a number), flip, flip stack, shuffle, copy, delete. Keys are ignored while typing in the notes field or any input.

### S14: Screen — right panel
**Covers:** G12, G15
**Files:** `prototype/js/screen/panel.js` (new)
**Description:** Lists all card definitions as small cards, with type and era filters, and the predefined `panel` stacks (e.g. the era 2–4 market stacks) by name and size. Dragging a catalog card onto the table spawns a new face-up card; dragging a panel stack spawns that whole stack shuffled face-down (each drag creates a fresh copy, so the stack stays available in the panel). The trash can sits at the bottom of the panel and highlights as a drop target.

### S15: Screen — left HUD
**Covers:** G13, G14
**Files:** `prototype/js/screen/hud.js` (new)
**Description:** Six private counters (Production, Food, Population, Knowledge, Attack, Defense) with − / + buttons and a typed value, and a notes box; both live only in the player's own browser storage, keyed by room code, and never travel. Shared Modernization and turn counters with − / +, sent as counter-add requests. A Reveal buildings toggle for your own private zone, showing its current state. Room code and connection state at the top.
**Rationale:** Private values never need the host, so keeping them local is simpler and survives a host refresh. Shared counters go through the host (PA2).

### S16: Hand strips
**Covers:** G4, G9
**Files:** `prototype/js/screen/render.js`, `prototype/js/screen/input.js`
**Description:** The bottom strip lays out your hand in order, spreading or overlapping cards to fit the width; the top strip shows the opponent's backs. Hover preview works on your face-up hand cards only.

### S17: Search (optional)
**Covers:** G8
**Files:** `prototype/js/screen/input.js`, `prototype/js/core.js`
**Description:** A right-click "Search" on a visible stack opens a list of its cards (faces shown to the searcher only); clicking one moves it into the searcher's hand via a take-card request. Build only after S1–S16 work; drop it if it doesn't come out cleanly.
**Rationale:** Prototyper.framework.md: "Search (optional for the first build, only if it works cleanly)".

## Helper steps

### H1: GitHub Pages publishing workflow
**Justification:** S1 must be reachable by both players before anything else, and PD8 chose publishing `prototype/` through GitHub Actions.
**Files:** `.github/workflows/pages.yml` (new)
**Description:** On every push to `main`, upload `prototype/` unchanged as the Pages artifact and deploy it*. No build step. One manual step for the user, done once: repo Settings → Pages → Source: GitHub Actions.

**Technical note:** *Actions pinned to their current major versions: `actions/checkout@v7`, `actions/configure-pages@v6`, `actions/upload-pages-artifact@v5`, `actions/deploy-pages@v5`. The workflow can also be started by hand from the Actions tab.

### H2: Prototype README
**Justification:** The card files are edited by hand; the format rules (columns, `start` values, art file names) need to be written down where the user edits.
**Files:** `prototype/cards/README.md` (new)
**Description:** Short reference for `cards.csv` and `stacks.csv` columns, the allowed `start` values, where art goes, and how to run the core tests.

## Assumptions

- Exactly two players; seat 0 is the host, seat 1 the guest.
- Players are trusted; nobody edits messages or the page to cheat (PD7).
- Both players use a desktop browser with a keyboard and mouse.
- A table holds at most a few hundred cards, so full snapshots on every change are fine.
- The data channel delivers messages in order and reliably while connected; the snapshot sequence number only guards against stale snapshots after a reconnect.
- The host does not refresh mid-game on purpose; if it does, the game is gone.
- Card art files are small images (a few hundred KB at most each).
- The user flips GitHub Pages to "GitHub Actions" once, by hand.

## Out of scope

- Turn ending, Ready and market refill (`backlog.md`).
- Reset or new game without reloading: a new game means the host reloads and sends a new link.
- Undo, saving and loading.
- Rules enforcement of any kind (PN1).
- Phones, tablets, more than two players.
- Hiding cards from someone reading browser developer tools (PD7).
- A relay server for networks that block direct connections (S2 decides the fallback instead).

## Acceptance criteria

- **G1 satisfied when:** opening the site shows a copyable link; the friend opening it lands at the same table with no installs or accounts.
- **G2 satisfied when:** the connection test page reports "Connected" or a clear failure reason between the two real PCs, before S3 starts.
- **G3 satisfied when:** every table change made by either player appears on both screens, and no screen code changes the table except by sending a request.
- **G4 satisfied when:** each player sees their own deck, discard and private zone at the bottom just above their hand, the opponent's side at the top, the HUD left and the panel right; the table pans and zooms.
- **G5 satisfied when:** a card dropped with the cursor over a stack ends exactly on top of it; dropped over empty table it becomes its own stack even if it overlaps another; the target highlights during the drag; badges show counts.
- **G6 satisfied when:** dragging a stack moves only its top card; Shift + drag moves the whole stack with its order kept.
- **G7 satisfied when:** 1–9, F (also while holding), Shift + F, R, C and every right-click entry do what Prototyper.framework.md describes.
- **G8 satisfied when:** either search works as described, or it is absent and nothing else is affected.
- **G9 satisfied when:** drawn cards arrive face-up; F flips a hand card face-down and you then see its back; a hand card dragged out lands in its current state; the hand can be reordered.
- **G10 satisfied when:** emptied slots stay outlined and accept drops; each market stack shows a supply and 3 displays.
- **G11 satisfied when:** a new table has both decks shuffled face-down in their slots, every market supply shuffled with 3 displays filled face-up, and the era 2+ stacks listed in the panel — all taken from `stacks.csv`.
- **G12 satisfied when:** C makes an independent copy; dropping a card or stack on the trash removes it for both players.
- **G13 satisfied when:** the opponent sees nothing of your private zone (not even backs) until you toggle Reveal buildings, sees your hand only as backs, and sees everything else.
- **G14 satisfied when:** your six counters and notes are invisible to the opponent and survive your own refresh; Modernization and turn changes show on both screens, and two simultaneous +1 clicks give +2.
- **G15 satisfied when:** the catalog filters by type and era; dragging a card or panel stack out creates it.
- **G16 satisfied when:** editing `cards.csv`, pushing and reloading shows the changed card; a card with a missing art file still shows its text; bad rows are listed, not fatal.
- **G17 satisfied when:** hovering a visible card shows a readable enlarged preview.
- **G18 satisfied when:** each player sees the other's cursor and held card moving.
- **G19 satisfied when:** when both grab the same card, one gets it and the other's drag snaps back.
- **G20 satisfied when:** a card dropped into the opponent's zone disappears from your view; a card moved out of your zone appears for the opponent.
- **G21 satisfied when:** pressing 5 over a 3-card stack draws 3; over an empty slot nothing happens.
- **G22 satisfied when:** the guest refreshing returns to seat 1 with the same table; the host leaving shows the guest "The host left — this table is gone".
- **G23 satisfied when:** a third browser opening the link sees "This table is full".
- **G24 satisfied when:** a guest who loaded the page before a card push still sees the host's card definitions.
- **G25 satisfied when:** the published folder runs as plain files with no build, and nothing in the code checks card rules.
