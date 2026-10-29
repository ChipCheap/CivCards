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


### Prototype

- **Connection test between your two PCs** (`Prototyper.architecture.md` → Infrastructure). A minimal page tries to connect the two real players through PeerJS's free public broker. *If it connects:* build on it. *If it doesn't:* swap the transport module for a hosted realtime database used only as a message relay (one free account for you; nothing for players). Pending until the test is run.

## Agreed, not yet written

- **Implementer skill** — none exists (DungeonCrawler only had the agent file). Write a current one in `.claude/skills/implementer/`, reading the flat `name.plan.md`, once specification is done and before the first build.

## Parked

- Spectating, progression / unlocks, accounts for decks, scoring that depends on how the game ended, genetic-algorithm AI training, the Roguelike and Constructed mode frameworks → `backlog.md`.
- Prototype turn structure (Ready button, turn ending, automatic market refill) → `backlog.md`.
- Unity Netcode + Relay for multiplayer (rejected for the prototype; revisit when the final game's stack is chosen) → `backlog.md`.
- Civilizations and their own starter decks (the prototype uses one shared starter deck) → `backlog.md`.
