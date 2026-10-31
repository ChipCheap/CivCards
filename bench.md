# Bench

## Open

Items 1–11 are mirrored in `framework.md` → `## Open questions` (same number).

1. **How Wonders are claimed.**
   - (A) Sealed bid: losers are refunded but have spent the turn; tied highest bidders all build it. Costs: a second claim rule, and an exception to "a market claim never fails because of another player's action".
   - (B) An ordinary claim at a very high cost that comes online immediately. Costs: no gamble moment.
   - *Recommendation:* playtest both by hand in the prototype, leaning (B).
2. **Exact Burn rules.** *Recommendation:* start from Hexarchy's Burn and diverge after playtests.
3. **Who chooses steal vs. destroy on a successful attack.** *Recommendation:* the attacker sets the wave's goal when sending it; targets are picked automatically on the defender's side.
4. **Modernization pacing and era thresholds.** *Recommendation:* a fixed advance each turn plus push/delay effects; eras change roughly every 4–5 turns.
5. **Knowledge = "modernization tokens"?** *Recommendation:* yes, one resource.
6. **Game-length target.** *Recommendation:* aim for 13–16 turns (10–18 at the extremes), as a goal rather than a hard rule.
7. **Make attacking the leader pay off** (e.g. plunder grows with the defender's wealth). *Recommendation:* a design goal checked in playtests, not an invariant.
8. **Pricier options that skip a strategic resource.** *Recommendation:* not a goal; revisit if lockouts feel bad.
9. **Civilization list and starter decks.** *Recommendation:* 2 contrasting civs in the prototype, sharing a base starter deck plus a few unique cards each.
10. **AI approach.** *Recommendation:* rule-based first; the headless, deterministic rules keep trained / genetic-algorithm AI possible.
11. **Hidden information in the final game** (no player's hidden state sent to other clients). *Recommendation:* the prototype is exempt; the architect decides how the final game guarantees it.

Items 12–13 are not yet in any framework.

12. **How Technology differs from Blueprints** (next exploration). Today both are cards bought from the
    market. A Technology is bought with Knowledge and "brings new cards into the game"; a Blueprint is
    bought with cards or Production. What a Technology actually *is* is still unshaped.
    - (A) A Technology is a lasting effect that takes no slot: it changes rules or boosts tagged
      buildings, and it adds its era's new cards to the market. Cost: Technology effects have to stay
      distinct from building effects.
    - (B) A Technology is a prerequisite: it unlocks certain blueprints and upgrades for you. Cost: a
      tech-tree feel, and the risk of being locked out.
    - (C) Both: a lasting effect plus the right to build certain blueprints and upgrades.
    - *Recommendation:* (C), worked through with the explorer next.
13. **Culture as another way to win.** One use already raised: Culture as a second cost of Wonders,
    because a civilization can't become culturally relevant without a culture that likes grand
    projects. Wonders in turn give unique effects and points. It clashes with
    `framework.md`'s "There is **one victory condition**: the most points when the game ends", and
    "Scoring that changes depending on how the game ended" is parked.
    - (A) Culture is a resource and a source of points inside the one victory condition: a second cost
      of Wonders, scored at the end. Cost: it isn't a separate route to victory.
    - (B) A separate culture victory that can end the game. Cost: amends the one-victory rule, and it
      needs its own announced-end rule (`framework.md` A7: "The final turn is always announced before
      it is played").
    - (C) Later. Cost: Wonders stay single-cost for now.
    - *Recommendation:* (A), explored after Technology.


## Agreed, not yet written

- **Prototype support for `CoreLoop.framework.md`:** counters for goods on building cards, and a Coin
  counter. Agreed in the core-loop exploration; needs a change to `Prototyper.framework.md` and its plan.

## Parked

- Spectating, progression / unlocks, accounts for decks, scoring that depends on how the game ended, genetic-algorithm AI training, the Roguelike and Constructed mode frameworks → `backlog.md`.
- Prototype turn structure (Ready button, turn ending, automatic market refill) → `backlog.md`.
- Unity Netcode + Relay for multiplayer (rejected for the prototype; revisit when the final game's stack is chosen) → `backlog.md`.
- Civilizations and their own starter decks (the prototype uses one shared starter deck) → `backlog.md`.
- A "New game" button that resets the table in the same room (left out of `Prototyper.plan.md`; a new game means the host reloads and sends a new link) → `backlog.md`.
- Military expeditions against trading partners (an add-on to `CoreLoop.framework.md`) → `backlog.md`.
