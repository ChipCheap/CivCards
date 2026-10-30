# Architecture — Prototyper

**Created:** 2026-10-29
**Derives from:** `framework.md`, `Prototyper.framework.md`
**Complexity target:** 2 (simple) (scope: feature)

## Overview

The prototype is a static page of plain JavaScript modules, published from `prototype/` on GitHub Pages.
One player's browser is the **host**: it owns the table, applies every change, and sends the whole table
to everyone after each change. Every other part of the page either feeds requests to the host or draws
what the host sent. The table logic is plain data and plain functions with no screen or network inside,
so it can be tested on its own and kept small.

This serves `Prototyper.framework.md` PA2 ("The host's state is the truth. Every change made by a player
goes through the host and reaches every player") directly, and keeps PN2 ("The page never needs a build
step or a server of our own to run").

Labels in this file are **PD** (Prototyper Decision) and **PG** (Prototyper Guideline), following the
PA / PN labels in `Prototyper.framework.md`.

## Guidelines

Each rule is checkable; the reviewer flags violations, and the implementer raises any design that would
need to break one instead of working around it.

- **PG1. The table core is pure.** It has no access to the page, the network, timers or its own randomness. Randomness (shuffles, generated ids) is handed in from outside, so the same inputs always give the same table.
- **PG2. Every change is a request.** A request is plain data describing one action ("move card 41 onto stack 7", "flip stack 3"). The host applies it through the core's single apply step and nothing else edits the table. The host's own actions go through the same path as the guest's.
- **PG3. Requests and snapshots are plain data** that survive being sent over the network unchanged (no functions, no page elements, no circular references).
- **PG4. Only the transport module touches the networking library.** Nothing else knows how messages travel.
- **PG5. Only the card loader reads CSV.** Everything else works with card and stack definitions.
- **PG6. The screen never changes the table.** It draws the latest snapshot and turns mouse and keyboard input into requests.
- **PG7. Hiding happens in the screen.** Given the viewing player's seat, the screen never draws face-up the opponent's hand cards or the contents of the opponent's private zone unless it is revealed (`Prototyper.framework.md` PA4: "Cards in a player's private zone and hand are never drawn face-up on the opponent's screen, unless the owner reveals the private zone.").
- **PG8. Presence is not state.** Live cursor positions and cards being dragged travel as separate, throwaway messages. Losing one is harmless, and they never enter the table or a snapshot.
- **PG9. No build step.** The browser loads the modules directly. Third-party code follows PD10.
- **PG10. Stay at complexity 2.** No rules engine, no plugin system, no general event bus, no configurable screen framework. When a feature seems to need one, raise it instead of building it.
- **PG11. Seats are a list, not a pair.** The table never assumes exactly two players, even though only two are built and tested (`Prototyper.framework.md` Scope: "More than two players — the design should not block it, but it is not built or tested.").

## Structure

Five modules, each with one job. Arrows show what may depend on what; nothing depends upward.

```
 Screen & input ──► Session ──► Transport ──► (networking library)
       │               │
       │               ▼
       └──────────► Table core ◄── Card loader (definitions as data)
```

- **Card loader.** Reads `cards.csv` and `stacks.csv` from the published folder and turns them into card definitions and stack definitions, including each predefined stack's starting place (a slot name or the right panel). It reports missing art without failing.
- **Table core.** Holds the shape of the table: stacks with their ordered cards and face-up/face-down state, positions, slots, hands, private zones and their reveal flags, counters, notes and seats. It builds the starting table from the definitions and applies requests (move, take top card, move whole stack, flip, flip stack, shuffle, draw N, copy, trash, counter change, reveal toggle). Pure, per PG1.
- **Session.** On the host, it owns the true table, applies incoming requests through the core, and sends the snapshot to every player. On a guest, it keeps the latest snapshot and forwards requests to the host. It also handles seats and rejoining, sends the host's card definitions to a joining player (the edge case in `Prototyper.framework.md`: "The host's card definitions win"), resolves simultaneous grabs (first grab wins, card locked until dropped), and relays presence messages.
- **Transport.** Opens a room, joins a room by code, sends and receives messages. It is the only module that knows about the broker and peer-to-peer connections, per PG4, so the database fallback replaces this module alone.
- **Screen & input.** Draws the table, hands, slots, HUD and right panel from the snapshot using page elements and one card template, and draws presence. Turns drag, drop, keys (1–9, F, Shift+F, R, C) and the right-click menu into requests. Applies the hiding rule, per PG7. It works out which stack a drop lands on from the cursor point (`Prototyper.framework.md` PA3) and puts that target into the request.

**Data flow for one action:** input → request → session → (network, for a guest) → host session → core applies → new snapshot → network → every session → screen redraws.

**Repo layout:**
- `prototype/` — the published page: the HTML page, the modules, and `cards/` (`cards.csv`, `stacks.csv`, `art/`).
- `tests/prototype/` — tests for the table core, run locally with Node; not published.
- `.github/workflows/` — the Pages publishing workflow.

## Decisions

### PD1: Architecture scope
- **Chosen:** Prototype only (`Prototyper.architecture.md`). The final game's `architecture.md` waits until its engine is chosen.
- **Why:** CLAUDE.md says the final stack is "Likely Unity / C# (not yet locked)", so a project-wide architecture now would rest on guesses.
- **Drawbacks:** No architectural guardrails yet for the final game's rules engine.
- **Alternatives considered:** Both files now. Lost because the project-wide file would likely be rewritten once the engine is chosen.

### PD2: Complexity target
- **Chosen:** 2 (simple), feature-wide ceiling.
- **Why:** A throwaway tool with no rules enforcement (`Prototyper.framework.md` PN1: "No rules enforcement in the first version").
- **Drawbacks:** Turn structure later (Ready, turn ending, market refill, in `backlog.md`) may need some rework rather than slotting into ready-made machinery.
- **Alternatives considered:** 1 (basic) — would make the repo-defined board layout, rejoin and the fallback painful. 3 (moderate) — more code before the first game.

### PD3: Code shape
- **Chosen:** A handful of plain JavaScript modules loaded directly by the browser, one per job.
- **Why:** No build step (PN2), easy to follow, and module borders match the structure above.
- **Drawbacks:** No UI framework; the HUD and panels are written by hand.
- **Alternatives considered:** One single file — hard to navigate past ~1,500 lines, and the fallback would touch everything. A UI framework from a CDN — a second way of thinking about the screen, and drag-and-drop is hand-written anyway.

### PD4: Rendering
- **Chosen:** Page elements, styled by one card template; pan and zoom by transforming the table.
- **Why:** Card text is the bulk of a card. Text wrapping, fonts, hover preview and clicks come for free.
- **Drawbacks:** Slows with many hundreds of cards on screen; a game has around 200.
- **Alternatives considered:** Canvas drawing — card text, hit-testing and preview all hand-written. A 2D graphics library — card text still awkward, and a big dependency for a throwaway tool.

### PD5: Sync model
- **Chosen:** Requests to the host; the host applies them and sends the whole table (a snapshot, about 20 KB) to everyone after each change. Presence travels separately (PG8).
- **Why:** Self-healing — a missed message is fixed by the next snapshot — and rejoining is just receiving a snapshot.
- **Drawbacks:** More data per move than strictly needed; irrelevant for two players.
- **Alternatives considered:** Sending only changes — needs a full resend anyway when a message is missed. Every browser replaying moves — shuffles and copies must match everywhere, one divergence breaks the game silently; above the complexity ceiling.

### PD6: Matchmaking (how browsers find each other)
- **Chosen:** The free public broker run by the open-source PeerJS project. The room code becomes the host's address on the broker.
- **Why:** Free, no signup, open source. The broker only sees the introduction (room code and both players' internet addresses); game data goes directly between the browsers over an encrypted connection.
- **Drawbacks:** Donation-funded, with no uptime promise; slow handshakes and timeouts have been reported. If it is down, nobody can connect. Running our own broker would need a server of ours, which PN2 rules out.
- **Alternatives considered:** Public trackers (relay networks used by other apps) — no single service to depend on, but slower and more erratic to connect and harder to debug.

### PD7: Hidden cards
- **Chosen:** Every player receives the full table; the screen hides what the viewer may not see (PG7).
- **Why:** Simplest, and matches `Prototyper.framework.md` ("Players are trusted: hidden cards still travel to the opponent's browser and are only not drawn") and `framework.md` open question 11's exemption for the prototype.
- **Drawbacks:** A player with browser developer tools could peek. Accepted.
- **Alternatives considered:** The host strips each player's snapshot — no peeking and practice for the final game, but per-player snapshots, and the host still sees everything.

### PD8: Hosting layout
- **Chosen:** The page and card files live in `prototype/`; a small GitHub Actions workflow publishes that folder unchanged to GitHub Pages on every push to `main`.
- **Why:** A clearly named folder; the design documents stay off the public site; the workflow only copies files, so nothing is built (PN2).
- **Drawbacks:** A one-time switch in the repo's Pages settings (source: GitHub Actions) and one workflow file to keep.
- **Alternatives considered:** A `docs/` folder — no workflow, but the name would hold the game, not documents. Repo root — zero setup, but every design file becomes a public web page.

### PD9: Tests
- **Chosen:** Automated tests for the table core only, run locally with Node, kept outside the published folder.
- **Why:** The core is pure (PG1), so stacking, drawing, flipping, copying and snapshots can be checked without a browser or a second player.
- **Drawbacks:** A little extra code; Node needed on the developer's PC. Screen and network are checked by playing.
- **Alternatives considered:** Play-testing only — a stacking or sync bug shows up mid-game and is hard to reproduce.

### PD10: Third-party code
- **Chosen:** Allowed only where it replaces something hard (for example the peer-to-peer connection, CSV parsing). Each library is loaded from a CDN at a pinned version and listed under `## Infrastructure` → Third-party code. The implementer adds a library by listing it there, and raises anything outside those kinds.
- **Why:** Saves fiddly work (quoted multi-line card text in CSV) without letting the throwaway tool collect dependencies.
- **Drawbacks:** Each library is one more outside thing that can break.
- **Alternatives considered:** Networking library only — fewer dependencies, but a hand-written CSV parser. Freely — fastest, but hard to audit later.

## Infrastructure

- **Hosting:** GitHub Pages, published from `prototype/` by GitHub Actions (PD8). The repo is public, so Pages is free.
- **Matchmaking:** PeerJS's free public broker (PD6). No relay server for strict networks.
- **Connection check first.** Before the tool is built, a minimal connection test runs between the two real players' PCs (`Prototyper.framework.md`: "Before anything else is built, a minimal connection test is tried between the two real players' machines").
- **Fallback:** if the test fails, the transport module is swapped for a hosted realtime database (Firebase Realtime Database or Supabase) used **only as a message relay** between the host and guests. The host still owns the table, so nothing outside the transport changes. Cost: one free account for the developer; players still need nothing.
- **Persistence:** none. The table lives in the host's tab; losing it on a host refresh is accepted (`framework.md`: "It's fine to lose the game state if the host leaves or refreshes").
- **Third-party code** (PD10), each pinned and loaded from a CDN:
  - the PeerJS client library, version 1.5.5 from jsDelivr with an integrity hash (networking);
  - a CSV parser, if the implementer finds quoted multi-line card text worth one.

## Extensibility

Bounded to what the explored design needs:

- **Transport swap** — the database fallback replaces the transport module only (PG4).
- **New actions** — a new table action is a new request kind applied by the core. This is where the backlog's turn structure (Ready, turn ending, market refill) attaches when it comes, as a separate step (`Prototyper.framework.md` PN1).
- **New card fields** — a new CSV column flows through the loader and the card template; nothing else changes.
- **Board layout** — which stacks start where comes from `stacks.csv`; the slot positions themselves are kept in one place in the screen module.
- **More seats** — seats are a list (PG11); only the screen layout would need rethinking.
- **Save and load** (backlog) — a snapshot is already plain data (PG3), so exporting and importing it is a small addition.

## Relation to project architecture

There is no project-wide `architecture.md` yet (PD1). This file stays within `framework.md`:
- A4: "Card definitions are engine-independent data." — cards are CSV data, never code (PG5).
- N4: "The first prototype doesn't enforce rules." — no rules engine (PG10).
- A6: "Hidden information stays hidden: opponents' builds and exact scores." — honoured on screen only (PD7), under open question 11's exemption for the prototype.

## Open questions

None. The connection test's result decides whether the fallback is needed; it is tracked in `bench.md`.
