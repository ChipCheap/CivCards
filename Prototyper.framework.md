# Prototyper — Feature Framework

Feature framework for the online prototype tool. It works inside the boundaries of `framework.md`, which
says (`## Design` → `### Prototype (first deliverable)`): "two people can **play and sync cards online**
from card designs we load from a folder, so we can try the game with a friend", with "**No rules
enforcement** at first."

## Intent

A shared 2D card table in the browser, in the spirit of Tabletop Simulator: two players open the same
link, get the same table, and move, flip, stack, draw, copy and trash cards by hand. The game's rules
live in the players' heads; the tool only keeps the table in sync. The goal is to try CivCards' game
feel with a friend as early and as cheaply as possible, and to change cards between sessions by editing
files in the repo.

**What success looks like:** you push a card change to GitHub, send your friend a link, and within a
minute or two you are both playing on the new cards. Nobody installs anything, nobody makes an account.

## Scope

**In**
- One shared 2D table with free card placement, stacking, flipping, drawing to hand, copying and trashing.
- A board laid out from the start: each player's deck and discard slots, a private zone per player, and the era 1 market.
- A private hand per player.
- A left HUD with manual counters and a notes field; a right panel with the card catalog, later-era stacks and a trash can.
- Card definitions, stack lists and art stored in the GitHub repo, served by GitHub Pages, drawn by the page.
- Joining by a room code carried in the link.
- Two players, PC only (keyboard and mouse).

**Out**
- Civilizations and civilization-specific starter decks — future content; both players use the same starter deck.
- Any rules enforcement (`framework.md` N4: "The first prototype doesn't enforce rules. Enforcement is added step by step, never as an all-at-once requirement.").
- Turn ending, the Ready button and automatic market refill — wanted later (`backlog.md`).
- Revealing hand cards to the opponent — no use for it in the game yet.
- Downloads, installs, player accounts, and any network setup by players.
- Phones and tablets.
- Undo.
- Saving and loading a game — added later as mechanics settle.
- More than two players — the design should not block it, but it is not built or tested.
- AI players and spectating.

## Design

### Joining and connection
- The site is a static page on **GitHub Pages**.
- The first player opens the site and gets a link with a room code (for example `…/#k7q2`). The second player opens that link and lands at the same table.
- Connection is **browser peer-to-peer (WebRTC)**. The first player's tab is the **host**: it holds the true table state and every other player's moves go through it. The library is the architect's choice.
- **Before anything else is built**, a minimal connection test is tried between the two real players' machines. If they can't connect, the fallback is a hosted realtime database (Firebase Realtime Database or Supabase), which needs one free account for the developer and nothing for players.

### Screen layout
- **Centre:** the shared table, a 2D pane both players see. It can be panned (middle mouse button anywhere, or left button on empty table) and zoomed (mouse wheel).
- **Your side is always at the bottom.** Each player sees the board mirrored so their own deck, discard and private zone sit just above their hand, and the opponent's side is at the top. Cards stay upright for both.
- **Bottom:** your own hand.
- **Top:** the opponent's hand, shown only as card backs (you can see how many cards they hold).
- **Left HUD:** counters and notes.
- **Right panel:** card catalog, later-era stacks, trash can.

### Stacks — the one rule
Everything on the table is a **stack**: an ordered pile of cards at one position. A single card is a stack
of one. There is no other kind of object, so there are no half-stacked cards.

- **Dropping decides by the cursor point.** When you let go, the point under your cursor decides where the
  card goes:
  - over a stack or a slot → it goes **on top** of that stack and snaps exactly onto it;
  - over empty table → it becomes a **new stack of one** at that spot.
- **While dragging, the stack you would land on is highlighted**, so you know before you let go.
- Two separate stacks may overlap on screen if you put them close together; the one moved last is drawn on top. This is only visual — they stay separate stacks, and the cursor rule still decides every drop.
- A stack shows its top card and a **count badge**. Each card keeps its own face-up / face-down state.

**Taking and moving**
- **Drag** on a stack takes **only the top card**.
- **Shift + drag** takes the **whole stack**. Dropped onto another stack, it goes on top with its order kept.

**Keys** (with the cursor over a stack, or while holding a card)
- **1–9:** draw that many cards from the top into your hand.

**Your hand**
- **Drawing turns a card face-up.** Any card that enters your hand from the table (by number key, the menu, or dragging it in) arrives face-up.
- **Cards keep their state everywhere else.** In your hand you can flip a card face-down with F, and then you hold it without seeing its face. A card dragged from your hand onto the table lands the way it is in your hand.
- You can reorder your hand by dragging a card to another position in it.
- **F:** flip the card under the cursor (the top card of a stack), or the card you are holding.
- **Shift + F:** flip the whole stack, reversing its order — this is how a discard pile becomes a face-down deck.
- **Ctrl + Shift + F:** turn every card of the stack the same way up, keeping the order. A mixed stack turns the way most of its cards already face (face-up on a tie); pressing it again turns them all the other way.
- **R:** shuffle the stack.
- **C:** create a copy of the card under the cursor or in your hand, next to the cursor.
- **Right-click:** a menu with the same actions (draw 1, draw N, flip, flip stack, flip all with the order kept, shuffle, copy, delete).
- **Search** (optional for the first build, only if it works cleanly): look through a stack and pull one chosen card out.

### Board and slots
- A **slot** is a fixed, outlined place on the board. A stack dropped on it snaps into it, and the slot stays on the board **even when empty**, so a deck always has a home to return to.
- **Each player** has on their side of the board:
  - a **deck slot** and a **discard slot**;
  - a **private zone** for their building row (see Hidden information). It holds 12 **building slots** in three rows of four (centre 1–4, town 5–8, outskirts 9–12, the rings of `CoreLoop.framework.md`, with the outskirts furthest from you) and a **main-building slot** below them, centred, for the starting town's building. The rest of the zone stays free for loose cards.
- **The shared market** has, for each of its four stacks (Strategic resources, Technology, Developments, Wonders — the stacks in `framework.md` `### Market`), a face-down **supply slot** and **3 face-up display slots**. Players claim by copying a displayed card (C) and refill the display by hand.
- **The starting layout comes from the repo.** The stacks file says where each predefined stack starts: in a named slot on the board, or in the right panel. Era 1 market stacks start on the board; the era 2, 3 and 4 stacks start in the right panel, to be dragged onto the market when an era begins.
- **Starter decks:** both players start with **the same starter deck**, placed shuffled and face-down in their deck slot. Civilizations and their own starter decks are future content.
- **Setup the tool does once, when a table starts:** every stack that starts on the board is shuffled face-down into its slot, and each market stack's 3 display slots are filled face-up from its supply. Opening hands are drawn by hand. Setup is not a card rule, so PN1 still holds.

### Tokens
- **Tokens** stand for goods kept on a building (`CoreLoop.framework.md`: stored goods). A token is a round marker a little over a third of a card's width, with an icon: plant, rock, tool or coin.
- The right panel has **four token bags**, one per icon, each an endless supply: drag a token out as often as needed.
- **Dropped on a card**, a token lies over the card's picture, in its top third. Tokens of the same icon on one card form a **pile** with a small number in its bottom right corner, where a stack shows its card count. The icon fills most of the circle without touching its edge. **Dropped on the bare table**, a token lies loose; dropped on a loose pile of its icon, it joins it.
- **Tokens belong to the top card of a stack.** Moving that card or the whole stack takes them along; a card put on top takes them over; taking the top card off carries them away.
- A card that goes into a hand **loses its tokens**.
- **Drag** takes one token off a pile, **Shift + drag** the whole pile. **Double-click** a pile to pick another icon for it, from every good and resource the cards use, so a token can stand for anything a building makes. The **trash can** removes tokens.
- Tokens follow the private zone's hiding like cards do: on a hidden card, or loose in an unrevealed zone, the opponent doesn't see them.

### Copy and trash
- **C** creates a copy. This is how a market claim works: `framework.md` says "If several players claim the same card in the same turn, **all of them get it**", so each claimant copies the displayed card instead of taking the one object.
- A **trash can** on the right panel deletes any card or stack dropped on it, for everyone. This also covers Burn ("remove it from the game").

### Private zone and hidden information
- **Anything outside a private zone is visible to both players.** That includes deck and discard slots, which are not in the zone by default.
- Each player's **private zone** hides its cards **completely** from the opponent — not even card backs. That includes cards in its building slots; only the empty slot outlines show. This is where your building row lives, matching `framework.md` A6: "Hidden information stays hidden: opponents' builds and exact scores."
- The owner has a **Reveal buildings** button that removes the hiding, so the opponent sees the zone's contents (for scouting and wave arrivals). Pressing it again hides them again.
- Your **hand** shows to the opponent as card backs only, and there is no way to reveal it.
- Players are trusted: hidden cards still travel to the opponent's browser and are only not drawn. `framework.md` open question 11 exempts the prototype ("*Default: the prototype is exempt (it trusts players).*").

### Left HUD
- **Your counters**, adjusted by hand: Production, Food, Population, Knowledge, Attack, Defense (the list in `framework.md`). Private to you.
- **Shared counters**, seen and changed by both players: Modernization, and a turn number.
- A free-text **notes** field, private to you.

### Right panel
- The **card catalog**: every card defined in the repo, filterable by type and era, dragged onto the table to create a card.
- A **text search** over the catalog, a regular expression by default (a checkbox switches to plain text). It matches against all the text on a card, one field per line: name, then type, era and origin (`Unit Era 1 Starter`), then each of cost, uses, stat and claim that the card has, then rules text — so Militia is searched as `Militia\nUnit Era 1 Starter\nCost 1 Food\nStat 1 Attack`.
- The panel **collapses to the right**: a ◀ button reopens it. While collapsed, the thin strip that remains is still the trash can.
- **Predefined stacks** whose starting place is the panel — the era 2, 3 and 4 market stacks, and any other prepared stacks — dragged out as a whole stack.
- The **trash can**.

### Card data and rendering
- Card definitions, stack lists and art live **in the GitHub repo** and are served by GitHub Pages together with the page. A change goes live with a commit and push, plus about a minute for Pages to redeploy.
- **Format: CSV**, edited in Excel or Google Sheets.
  - **Cards file:** one row per card — id, name, type, era, origin, cost (to play), stat (its quick value), hp (a building's hit points), claim (its market price), text, art (image file name). Costs and claims are written like `2 Production, 1 Culture, Timber`: an amount, or a resource alone when it is needed or used up.
  - **Stacks file:** one row per card in a predefined stack — stack name, card id, count, and where the stack starts (a slot name, or the panel). Starter decks are stacks too.
  - **`art/` folder** with the card images.
- JSON stays an option for later; one file per card is avoided, because GitHub Pages can't list a folder, so it would need a generated index and a build step.
- Card definitions are **data**, not code, so they can move to the final engine (`framework.md` A4: "Card definitions are engine-independent data.").
- **The card face** (in card units, the card being 100 × 140):
  - **Everything is a bare icon, never in a circle:** an amount is its resource's icon with the number on it (🌾 1); a resource needed or used up is a smaller icon of its own, one per unit, never a number.
  - **Top left:** the play cost: the main costs, then the resources needed or used up. A blueprint that needs a strategic resource (Sawmill: Timber) shows it here, since it is needed to build. A card without any is free to play.
  - **Top right:** the quick stat — 🌾 Food, ⚔️ Attack or ⚙️ Production, as its icon with the number on it. A card that only does that has no rules text. Units have Attack only for now. A strategic resource card shows the resource it provides here, without a number.
  - **Under the stat:** a building's or Wonder's **hit points**, a 🧱 wall with a number: the leftover Attack a raid must beat to destroy it (`framework.md`: a raid "destroys buildings whose Defense is lower than that leftover"). Early buildings have 1–2; later eras, walls and Wonders are sturdier.
  - Both reach a little past the card's edge.
  - **The art** across the top third (45 units tall), with the **type icon** under it: 🏠 building, a three-bar pyramid for a Wonder, ⚗️ Technology, the resource itself for a strategic resource, none for play cards.
  - **Rules text** shows each amount of a resource as its icon: "+3 Production" reads "+3 ⚙️".
  - Below: a narrow **era and origin line** (`Era 1 · Made by Stables`), the **name**, and a **text box** for keywords and the rarer unique effects.
  - **Bottom left:** the **claim price**, reaching past the corner like the cost. A Wonder's whole price is its claim price, since it is built and in effect as soon as it is claimed, so a strategic resource it needs is shown here too: without it, the Wonder can't be claimed. The same holds for a Technology that needs one (Steam Engine: Coal).
  - A stack's count badge sits at the bottom right, clear of the cost and stat.
- **The page draws each card face** from its data and art using one card template. No card images are generated ahead of time, so a layout change shows up on the next page load.
- **One generic card back** for every card.

## Edge cases

| Case | Decided behavior |
|---|---|
| You drop a card with the cursor over a stack | It goes on top of that stack, snapped exactly. |
| You drop a card with the cursor over empty table, partly covering another stack | It becomes its own stack, drawn above the other one. The two stay separate. |
| You drop a card on an empty slot | It snaps into the slot and becomes the slot's stack. |
| The last card is taken from a slot | The slot stays on the board, empty and outlined. |
| The last card is taken from a loose stack (not a slot) | The stack is gone. |
| A stack mixes face-up and face-down cards | Allowed. Each card keeps its own state; the top card shows as it is. |
| Both players grab the same card at the same moment | The host decides: the first grab wins, and the card is locked to that player until dropped. The other player sees it held. |
| A card is dropped into the opponent's private zone | Allowed. It disappears from your view, like any card in their zone. |
| A card is dragged out of your private zone | It becomes visible to the opponent as soon as it leaves the zone. |
| You draw from an empty stack, or press a number higher than the stack size | You draw what is there; nothing happens if it is empty. |
| A card or stack is dropped on the trash can by mistake | It is gone. There is no undo. |
| The host refreshes or closes their tab | The game is lost. Accepted in `framework.md`: "It's fine to lose the game state if the host leaves or refreshes." |
| The other player refreshes or loses connection | They rejoin their seat through the same link while the host is still connected. |
| A third person opens the link | They are refused while two seats are taken. |
| The two players loaded different versions of the card files (a push happened in between) | The host's card definitions win: the host sends its definitions to the joining player. Art is still loaded from Pages. |
| A card's art file is missing | The card is drawn without art; the text still shows. |

## Boundaries & invariants

Labelled **PA** (Prototyper Always) and **PN** (Prototyper Never), so they don't clash with `framework.md`'s A and N labels.

**Always**
- **PA1.** Joining is opening a link. No downloads, no installs, no player accounts, no network setup.
- **PA2.** The host's state is the truth. Every change made by a player goes through the host and reaches every player.
- **PA3.** Everything on the table is a stack of one or more cards, and the cursor point at drop time alone decides which stack a card joins.
- **PA4.** Cards and tokens in a player's private zone, and cards in their hand, are never drawn face-up on the opponent's screen, unless the owner reveals the private zone. Everything else on the table is visible to both players.
- **PA5.** Card definitions, stack lists and art come from the repo and are data, never code.

**Never**
- **PN1.** No rules enforcement in the first version. Turn structure (Ready, turn ending, market refill) comes later and only as a separate step.
- **PN2.** The page never needs a build step or a server of our own to run.

## Standards adopted

**Accepted**
- Tabletop Simulator-style controls where they fit: number keys to draw, F to flip, R to shuffle, right-click menu.
- A drop-target highlight while dragging.
- Hover preview to read cards.
- Pan and zoom on the table.
- Each player's cursor or held card is visible to the other player, so both know what the other is doing.

**Rejected for now**
- Undo and history.
- Saving and loading a game.

## Open questions

None at the moment.
