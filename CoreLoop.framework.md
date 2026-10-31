# Core Loop — Design Framework

## Intent

This framework sets out the rules of a single Engine Builder turn: what kinds of cards exist, what
limits how many you can play, how cards are drawn and kept, how buildings produce, how goods and
Coin work, and how the building row is laid out. It is the base the first real card set is written
against. The cards themselves live in the card files, not here.

**The model in one line:** population is the hands that do the work, and your hand of cards is the
agenda, meaning the projects open to your civilization this turn. Playing a card sends your people to
work. Drawing is how far your administration reaches, redrawing is reorganizing, and Coin pays for
flexibility (redraws, foreign goods) rather than raw output.

**The game we're after:**
- A mixed engine. You play about 3–5 cards a turn, build one every 1–2 turns, and end the game with
  about 8–12 buildings. The deck and the building row both matter.
- Build early, play late. A building pays back its cost in about 4–5 turns, so building is worth most
  early on and playing is worth most in the last few turns.
- Cards with identity. Buildings feed each other through goods, made cards and tags, instead of every
  card being a plain "+X".

**Success:** the first card set can be written against these rules and played by hand in the
prototype, and playtests show the intended arc: investing early, a strong engine in mid-game, a
snowball in the late game.

## Scope

**In**
- Card kinds, and what each can be used for.
- The play limit, hand limit, drawing, keeping, redrawing and the undo lock.
- Buildings: how they produce, made cards, the Produce action, stored goods, storage, upgrades.
- Goods and production chains, and tags.
- Coin: where it comes from, what it buys, the cap.
- Trading partners (computer-run neighbouring civilizations that trade but don't play).
- Ventures (pay now, collect a bigger return later).
- Junk types and their cures.
- The building row: rings, slot prices, Walls, the order attacks follow.

**Out**
- The cards themselves: the first set, starter decks, partner lists. They go in the card files.
- How Technology and Modernization differ from Blueprints (next exploration; see `bench.md`).
- Culture and other ways to win (on `bench.md`).
- Military expeditions against trading partners (`backlog.md`).
- How the military system resolves, which stays as written in `framework.md`.

## Design

### Card kinds

A card has one kind, so a card never makes you pick how to use it in the middle of a turn.

- **Action cards** are **played**. Playing one uses one of your plays, which is your population
  working. An action can make Production, Food or Knowledge, trigger buildings (Produce), start a
  venture, send military, and so on. Afterwards it goes to the discard pile unless its text says
  otherwise.
- **Blueprints** are **built** into a slot in your row. Building uses no play. You pay its cost with
  what your plays made (Production, cards, a strategic resource, Coin on some cards).
- **Wonders** are build-only.
- **Strategic resources** are cards, as in `framework.md`.
- **Junk** cards do nothing (see Junk).
- **Pay** and **Burn** from `framework.md` work for every kind: any card can be spent as payment or
  burned.

*Game choice, with its cost:* `framework.md`'s intent gives as its example "giving up a card you'd want
to build later because you badly need the resource *this* turn". With separate kinds, a card can no
longer be either played or built. That tension now comes only through Pay and Burn: you spend a
blueprint as payment instead of building it. It was chosen so play has less friction.

### Plays and population

- **Population is the number of cards you can Play in a turn.** You start at 3.
- Production does not come from population. It comes from cards and buildings.
- Food builds up as in `framework.md`, and each threshold gives +1 population. Thresholds rise, so
  population stays at roughly 3–7 over a game. Every +1 population is a permanent extra play.
- Building, using buildings, redrawing and trading never use plays.

### Hand, drawing and keeping

- At the start of a turn you **draw up to your hand limit**. The base limit is 5 in era 1 and goes up
  by 1 each era (6, 7, 8). Some cards change it.
- At the end of a turn **you choose which cards to keep**, and the rest are discarded.
- **Kept cards count against your hand limit**, so keeping a card means drawing one fewer. The
  exceptions are **strategic resources** and cards with the **Retain** keyword, such as a standing
  army.
- There is no maximum hand size. The limit only sets how many cards you draw up to.
- Effects that draw give you the cards **at once**.
- **The undo lock.** Until Ready you can change your plan freely. But any action that reveals hidden
  information, such as a draw, a redraw or a reshuffle, locks every action before it that turn. The
  game's shuffle is seeded and repeatable, so without the lock you could draw, look, undo, and know
  your next card. Public information, such as a building making a known card, does not lock anything.
- **Redraw:** pay 1 Coin to discard a card and draw a new one. This locks undo like any draw. There is
  no free redraw.

### Buildings

A building does what its type says, and different types work differently. That is on purpose, so that,
for example, military buildings aren't all "+X Attack".

- **Running by itself:** some buildings produce every turn with no action needed.
- **Triggered:** some buildings work only when a **Produce** action card triggers them. The Produce
  card says how many buildings it triggers, and you choose which.
- **Making cards:** some buildings put action cards into your hand, which you can play that same turn.
  Each made card says what happens to it afterwards: removed after use, discarded at the end of the
  turn, or joining your deck. *Example:* a Cannon Foundry makes 2 Cannon cards. They join your deck,
  because the foundry represents a lasting capacity to produce, and they leave again when a wave sends
  them, since `framework.md` says a wave's "units are used up".
- **Converters** take goods and make other goods or bigger payoffs.
- **Using a building never uses a play.** You decide during planning when to spend goods or run a
  converter, in any order, so the order of buildings in the row never matters for production.

### Goods and storage

- **Goods** are a small set of materials per era, such as Grain, Fuel, Ore, Saltpetre and Cloth. Each
  good is made by several buildings, so a chain never depends on one card turning up.
- **During a turn there is no storage limit.** Goods you make can be used right away, as many as you
  have.
- **Storage:** an ordinary building holds 1 good. **Storage buildings** (Granary, Warehouse, Mill)
  hold 3 or more, with bigger ones in later eras, and they take goods of any type. Only storage
  buildings take goods from elsewhere.
- **Storage is settled at the end of the turn, automatically.** You never move goods by hand. The
  steps:
  1. **Each building keeps what it can hold itself.** Goods stay on the building that made them, up to
     that building's own storage.
  2. **The excess goes into storage.** First come goods that no building made (bought from a trading
     partner, or made by an action card); then goods beyond what their building can hold, building by
     building from the innermost slot outward. When there are several storage buildings, the
     innermost fills first.
  3. **What still doesn't fit is discarded.**
  4. **Leftover storage room pulls goods inward.** If storage still has room, goods held by ordinary
     buildings move into it, innermost building first, until the storage is full. This empties the
     innermost buildings first. Storage never pulls goods from other storage buildings.
- The result: storage takes goods from the centre first, while goods left on ordinary buildings sit
  furthest out. Attacks come from the outside in, so those outer goods are the most exposed.
- **Selling goods:** a stored or unspent good sells for 1 Coin, or 2 Coin to a trading partner that
  wants it. These are starting values.

### Tags

Buildings carry tags from a small fixed set of about six: Agriculture, Industry, Military, Science,
Trade and State. Cards refer to them, for example "your Industry buildings +1" or "trigger 2
Agriculture buildings". Tags also give a civilization its focus without special rules: Europe could
lean Industry and Trade, China Agriculture and State.

### Upgrades

A **modernization card** is built onto an older building. It replaces that building in its slot,
costs less than a new building, pays no ring surcharge, and keeps the old building's stored good.
*Example line:* Bloomery → Blast Furnace → Steelworks.

### Coin

- **Where it comes from:** at the end of a turn, unspent Production turns into Coin at **3:1**.
  Production can also pay Coin costs during the turn at the same 3:1. Trade cards make Coin, and so
  does selling goods.
- **What it buys:** redraws (1 Coin each), goods from trading partners, ventures, and Coin costs
  printed on some cards.
- **It never pays Production costs.** The exchange only goes one way: Production can become Coin,
  but Coin never becomes Production.
- **Cap:** 5. Treasury and Bank buildings raise it. Coin over the cap at the end of the turn is lost.
- It never buys Food or Technology.

### Trading partners

- Each game draws **2–3 trading partners**, and every player sees the same ones.
- Each partner has a cultural profile with an **export list per era** that shifts slowly. *Example:*
  an Egyptian partner selling sugar cane in era 3 and other typical goods earlier, or a partner that
  mostly sells metals.
- Each turn, every partner's offer refreshes from its list for the current era. You buy with Coin.
- Partners sell **ordinary goods only**: never strategic resources, and never stand-ins for them.
- Each partner also has a **wanted list**. Selling it a good it wants pays more.
- A purchase never fails because of another player. If two players buy the same good, both get it.

### Ventures

A venture is paid for now (Coin, Production or cards) and pays back a larger return 2–3 turns later.
Joint-stock companies and colonial voyages are the theme. While a venture is waiting to pay out, it
can't be stolen. Its return arrives at the start of the turn it names.

### Junk

- There are several junk types: **Unrest**, **Pollution**, and other civil problems from
  industrialization, crowded cities and poor sanitation.
- Junk does nothing. It takes up hand space and counts against your hand limit.
- Each type is cleared by its own kind of card: sanitation clears Pollution, reforms clear Unrest.
  Any junk can also be Burned, at a cost.

### The building row

- The row is laid out in rings around your city centre:

  | Ring | Slots | Surcharge to build there |
  |---|---|---|
  | Centre | 1–4 | +0 |
  | Town | 5–8 | +2 |
  | Outskirts | 9–12 | +5 |
  | Industrial (opens in era 3) | 13–16 | higher (to tune) |

- You choose a slot when you build. A building **stays in its slot** until it is destroyed or upgraded
  in place.
- You can build further out early, but you pay the higher surcharge. That surcharge stands for
  transport costs. **Transport technologies** (roads, canals, railway) lower it.
- **Attacks hit from the outside in.** Cheap outer buildings are your natural decoys.
- While a **Walls** building stands, buildings in the centre ring get extra Defense (about +3). Cannon
  from later eras can get past old walls.
- A destroyed building leaves an empty slot. You can build there again at that ring's price. Its
  stored good goes to the raider.

### Raids

A successful raid steals **stored goods first, from the outermost buildings inward, then banked
Coin**. Everything else follows `framework.md`.

### Turn outline

1. **Start:** draw up to your hand limit. Buildings that run by themselves produce, and
   card-making buildings put their cards into your hand. Ventures that are due pay out.
2. **Planning** (free and undoable up to the undo lock, all players at once): play up to your
   population in action cards, build, run buildings and converters, trade with partners, redraw.
3. **Ready.** The turn resolves as `framework.md` describes: market claims, waves.
4. **End:** choose cards to keep and discard the rest. Unspent Production becomes Coin at 3:1, Coin
   over the cap is lost, and goods are settled into storage as described under Goods and storage.

## Edge cases

| Case | Decided behavior |
|---|---|
| You make more goods than you can store | Use them freely during the turn. At the end, each building keeps what it can hold, the excess moves into storage buildings (innermost first), and the rest is discarded. |
| Bought goods are still unused at the end of the turn | They go into storage first, before any building's excess. |
| Storage still has room after taking the excess | It pulls goods from ordinary buildings, innermost first, until full. It never pulls from other storage buildings. |
| Coin would go above the cap | The extra is lost at the end of the turn. |
| A draw would reveal a card, then you want to undo something earlier | Not possible. The draw locked everything before it. Things done after the draw can still be undone, up to the next lock. |
| A building that makes cards is built mid-turn | Its cards come into your hand right away, playable this turn, unless its text says otherwise. They come from a known building, so they don't lock undo. |
| A kept card and a strategic resource are both in hand at the end of the turn | The kept card counts against next turn's draw; the strategic resource doesn't. |
| An upgrade targets a building holding a good | The upgrade keeps the good. |
| A building is destroyed | Its slot becomes empty and can be rebuilt at that ring's price. Its stored good goes to the raider. |
| Two players buy the same trading-partner good | Both get it. |
| A venture comes due while Coin is at the cap | Coin above the cap is lost at the end of that turn. |
| A raid succeeds against a player with no stored goods | It takes banked Coin; with no Coin either, it steals nothing. |
| An effect would lower population | Default: population never drops below the starting 3. Nothing in this framework lowers it. |
| Junk fills the hand | You still draw up to the limit, and redraw or Burn can clear it. Junk never makes you lose by itself, as in `framework.md`. |

## Boundaries & invariants

**Always**
- **C-A1.** Population is the number of cards you can Play in a turn. Building, using buildings,
  redrawing and trading never use plays.
- **C-A2.** Any action that reveals hidden information locks undo for everything before it that turn.
- **C-A3.** At the end of a turn, a building holds no more goods than its storage allows (1 by
  default). During the turn, goods aren't limited.
- **C-A4.** A building stays in its slot until it is destroyed or upgraded in place.
- **C-A5.** Strategic resources and Retain cards never count against the hand limit.
- **C-A6.** Coin never exceeds the cap at the end of a turn, and never pays Production costs.

**Never**
- **C-N1.** Nothing depends on which buildings are neighbours. Slot cost and the order of attacks and
  storage depend only on position from the centre.
- **C-N2.** Junk never does anything by itself.
- **C-N3.** Trading partners never sell strategic resources or stand-ins for them.
- **C-N4.** A trading-partner purchase never fails because of what another player did.

## Relation to project framework

**Project goals this serves:**
- The intent's "keep making decisions you'd never make in a classic civ game": what to keep, what to
  bank, when to build further out, which converter to feed.
- "The late game snowballs": population becomes plays, Coin and converters compound, and transport
  technologies make the outer rings cheap.
- Asymmetric civilizations, through tags.

**Project invariants it inherits:**
- **A2:** "All players act at the same time. Resolution never pauses to wait for a player's
  decision." Buildings, storage and conversion are decided during planning or run automatically.
- **A5:** "Given the same starting shuffle (random seed) and the same player choices, it always
  produces the same result." This is the reason for the undo lock (C-A2).
- **A8:** "No rule needs two or more humans." Trading goes through computer-run partners, not between
  players.
- **N1:** "No hexes, tiles, population assignment, adjacency effects or real-time play." The rings
  use position, never neighbours (C-N1).
- **N2:** "A market claim never fails because of what another player did." Partner purchases follow
  the same rule (C-N4).
- **N6:** "A strategic resource never has more than 1–2 copies in the game." Partners never sell
  them (C-N3).

**Project framework lines amended by this design** (changed in `framework.md` at the same time):
- Population sets plays, and Production comes from cards and buildings.
- Card uses: action cards are played and blueprints are built.
- Coin exists, kept narrow.
- Hand size: you draw up to an era-based limit.
- Attack targets: from the outer ring inward.
- The market gains trading partners.

## Standards adopted

**Accepted**
- Keyword tooltips (Retain, Produce, and the rest).
- A cost preview when you pick a slot, including the ring surcharge.
- A visible marker showing where undo is locked.
- A turn-log line for every trade, sale, conversion, storage loss and raid.
- Choosing which cards to keep should take one quick action in the final UI.
- **Prototype:** you draw by hand, goods are counters on building cards (this needs a small prototype
  change), and Coin gets its own counter.

**Rejected**
- Moving goods by hand between buildings. It adds fiddly busywork for no real decision.

## Open questions

Each has a recommended default.

1. **Food thresholds for population growth.** *Default: they rise, so population stays at about 3–7;
   tune in playtests.*
2. **Production-to-Coin rate.** *Default: 3:1; try 4:1 if Coin floods in.*
3. **Ring surcharges.** *Default: +0 / +2 / +5, and +8 for the industrial ring. Transport technologies
   take 1–3 off each.*
4. **Redraw price against the cap.** *Default: 1 Coin with a cap of 5. If cycling is too strong, try
   Hexarchy's price of 2 and raise the cap to keep them in step (2 per redraw, cap 6).*
5. **Walls.** *Default: +3 Defense to the centre ring; era-3 artillery ignores old walls.*
6. **How large venture returns are.** *Default: about double the stake, 2–3 turns later.*
7. **The tag list.** *Default: Agriculture, Industry, Military, Science, Trade, State.*
8. **The goods per era.** *Default: about 5 per era, each made by at least 2 buildings. The list goes
   in the card files.*
9. **The trading-partner pool.** *Default: about 6 partners, 2–3 drawn per game. Their lists go in the
   card files.*
10. **Hand limit by era.** *Default: 5 / 6 / 7 / 8.*
