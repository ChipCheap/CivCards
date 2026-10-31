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
9. **Civilization list and starter decks.** *Recommendation:* 2 contrasting civs in the prototype, sharing a base starter deck plus a few unique cards each.
10. **AI approach.** *Recommendation:* rule-based first; the headless, deterministic rules keep trained / genetic-algorithm AI possible.
11. **Hidden information in the final game** (no player's hidden state sent to other clients). *Recommendation:* the prototype is exempt; the architect decides how the final game guarantees it.

## Agreed, not yet written

- **Prototype support for the design frameworks:** counters for goods on building cards, a Coin counter
  and a Culture counter (`CoreLoop.framework.md`, `Culture.framework.md`), and a way to keep market
  claims hidden until the turn ends, as `framework.md` now requires. Until then, players can write
  their claims in the notes field and reveal them together. Needs a change to `Prototyper.framework.md`
  and its plan.

## Parked

- Spectating, progression / unlocks, accounts for decks, scoring that depends on how the game ended, genetic-algorithm AI training, the Roguelike and Constructed mode frameworks → `backlog.md`.
- Prototype turn structure (Ready button, turn ending, automatic market refill) → `backlog.md`.
- Unity Netcode + Relay for multiplayer (rejected for the prototype; revisit when the final game's stack is chosen) → `backlog.md`.
- Civilizations and their own starter decks (the prototype uses one shared starter deck) → `backlog.md`.
- A "New game" button that resets the table in the same room (left out of `Prototyper.plan.md`; a new game means the host reloads and sends a new link) → `backlog.md`.
- Military expeditions against trading partners (an add-on to `CoreLoop.framework.md`) → `backlog.md`.
