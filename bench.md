# Bench

## Open

Items 2–11 are mirrored in `framework.md` → `## Open questions` (same number). Item 1, how Wonders are
claimed, is settled in `Culture.framework.md`.

2. **Exact Burn rules.** *Recommendation:* start from Hexarchy's Burn and diverge after playtests.
3. **Who chooses steal vs. destroy on a successful attack.** *Recommendation:* the attacker sets the wave's goal when sending it; targets are picked automatically on the defender's side.
4. **Modernization pacing and era thresholds.** *Recommendation:* a fixed advance each turn, plus +1 for every Technology claimed (settled in `Technology.framework.md`), plus other push/delay effects; eras change roughly every 4–5 turns.
5. **Knowledge = "modernization tokens"?** *Recommendation:* yes, one resource.
6. **Game-length target.** *Recommendation:* aim for 13–16 turns (10–18 at the extremes), as a goal rather than a hard rule.
7. **Make attacking the leader pay off** (e.g. plunder grows with the defender's wealth). *Recommendation:* a design goal checked in playtests, not an invariant.
8. **Pricier options that skip a strategic resource.** *Recommendation:* not a goal; revisit if lockouts feel bad.
9. **Civilization list and starter decks.** *Partly settled:* the prototype's civilizations are European nations, about four, each with its own bonus. *Recommendation for the rest:* a shared base starter deck plus a few unique cards each; China later.
10. **AI approach.** *Recommendation:* rule-based first; the headless, deterministic rules keep trained / genetic-algorithm AI possible.
11. **Hidden information in the final game** (no player's hidden state sent to other clients). *Recommendation:* the prototype is exempt; the architect decides how the final game guarantees it.

**Era 1 cards** (`Era1.cards.md`, waiting on your review). My defaults where the frameworks are silent:

- **Made cards that go unplayed.** *Recommendation:* a card a building puts into your hand each turn is removed at the end of the turn if not played. The alternative is that it joins the deck, which floods decks with units.
- **Strategic resources are shown, not spent.** *Recommendation:* holding one lets you claim or build what needs it. Spending would make each copy usable once in the whole game.
- **Starting towns** (your idea; section in `Era1.cards.md`, rule in `framework.md` → Civilizations). Settled: a town is a separate pick from the civilization; the Mill Town's river blocks slots 2, 6 and 10; the Castle Town starts with Stables and a Bog-Iron Pit. Still to review: the five towns' numbers.
- **Which nations, with which bonus.** Drafted in `Era1.cards.md`: France (Feudal levy), Venice (Staple right), the Holy Roman Empire (Mining freedom), Castile (Pilgrims). *Recommendation:* these four; England is the obvious fifth, with a longbow bonus of its own, if you want a spare.
- **Workday has nothing to trigger.** Its "Produce 1" only triggers buildings that need a Produce card, and no starting town has one (Open Fields and the River Mill run by themselves). *Recommendation:* Workday reads "Produce 1. If you have no building to trigger, +2 Production instead."
- **Units attack only, for now** (your call; a shield icon under the sword can bring Defense back later). Defense then comes only from buildings and Wonders, as `framework.md` already allows ("some sits on buildings"). *What it costs:* a defender can no longer answer a wave by playing units that turn, so defense is slower to raise than attack; and Pike Square and Longbowmen, whose point was Defense, need a new role. *Recommendation:* Pike Square becomes a cheap, steady attacker; Longbowmen become the cheap unit of the Archery Butts.
- **Two new junk types, Sickness and Debt.** Debt comes from Forced Loan; Sickness has no source yet. *Recommendation:* keep both; give Sickness a source in era 2 (crowded towns).
- **Trimming the pool.** An era is about 4 turns at 1–2 claims a turn: about 5 claims per player, so 10 for two players and 20 for four. 33 buildings and 24 actions in the pool. *Recommendation:* about 20 cards in the era-1 Blueprint stack after your review (enough for four players), 6 Technologies, 4 Wonders.

## Agreed, not yet written

- **Hit points for the Era 1 buildings and Wonders** in `Era1.cards.md`: 1–2 for early buildings,
  more for Town Walls, Keep, Star Fort and the Wonders, rising with later eras. They are the building
  "Defense" of `framework.md`'s raid rule ("destroys buildings whose Defense is lower than that
  leftover"), shown on the card as a 🧱 wall.
- **Era 1 cards into the prototype.** The starter deck is in (`prototype/cards/`). Once you've
  reviewed `Era1.cards.md`, the chosen market cards go into `cards.csv` and `stacks.csv` as well,
  replacing the remaining sample cards.

- **Prototype support for the design frameworks:** a Coin counter and a Culture counter (`CoreLoop.framework.md`, `Culture.framework.md`), and a way to keep market
  claims hidden until the turn ends, as `framework.md` now requires. Until then, players can write
  their claims in the notes field and reveal them together. Needs a change to `Prototyper.framework.md`
  and its plan.

## Parked

- Spectating, progression / unlocks, accounts for decks, scoring that depends on how the game ended, genetic-algorithm AI training, the Roguelike and Constructed mode frameworks → `backlog.md`.
- Prototype turn structure (Ready button, turn ending, automatic market refill) → `backlog.md`.
- Unity Netcode + Relay for multiplayer (rejected for the prototype; revisit when the final game's stack is chosen) → `backlog.md`.
- Civilizations and their own starter decks (the prototype uses one shared starter deck) → `backlog.md`.
- A "New game" button that resets the table in the same room (left out of `Prototyper.plan.md`; a new game means the host reloads and sends a new link) → `backlog.md`.
- Claiming costs an action token, Millennium Blades style (revisit after the first live test) → `backlog.md`.
- Military expeditions against trading partners (an add-on to `CoreLoop.framework.md`) → `backlog.md`.
