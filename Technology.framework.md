# Technology — Design Framework

## Intent

This framework sets out what a Technology is in the Engine Builder, how it differs from a Blueprint,
and how research drives the shared Modernization track and shapes what exists in each game.

**The core distinction:** a building is something your civilization *has*. It sits in a slot,
produces, and can be raided or destroyed. A Technology is something your civilization *knows*. It
takes no slot, can never be lost, and changes what can be built and how well things work.

**The model:** technology always spreads between civilizations, slowly but surely. A Technology
therefore works for everyone, but most strongly and soonest for the player who researched it. What
gets researched decides what exists in this particular game: if nobody researches steam, railways
never appear.

**What this adds to the game:**
- Research is a race for a head start, not a lock on the technology.
- Decks can grow again. Spread copies of Technologies add good cards to decks, while built blueprints
  leave the deck for good.
- Every game's later eras look different, because the Blueprint stacks are shaped by what was
  researched.
- Slowing Modernization becomes a real weapon. A late era keeps everyone else on prototypes, while a
  player waiting for the full building may never see it.

**Success:** in playtests, players argue over when to research, not just what. Choosing between
taking a prototype now and waiting for the full building is a real decision, and two games with
different research paths end with visibly different worlds.

## Scope

**In**
- What a Technology does, where it goes, and what the researcher and other players each get.
- Prototype buildings, and how they upgrade.
- How Technologies spread to other players.
- How research shapes the Blueprint stacks and follow-up Technologies.
- Research pushing Modernization; Technology points.
- The Technology market across eras.

**Out**
- The Technologies themselves: they go in the card files.
- Culture and Wonders (on `bench.md`).
- How Knowledge is earned, which stays as in `framework.md`.
- The base pace of Modernization and the era thresholds (`framework.md` open question 4, apart from
  the research push decided here).

## Design

### Where a Technology goes

A claimed Technology goes straight into your **tech display**. It takes effect at once and lasts the
whole game. It takes no building slot, never enters your deck or hand, and can't be stolen or
destroyed. Other players see what you researched, because market claims are public.

### What a Technology does

Each Technology has two sides:

- **For the researcher:** its full effect, plus **one of its cards straight into hand**, playable or
  buildable that turn. That makes *when* you claim a Technology a decision. The card in hand is
  known, so it doesn't lock undo.
- **For everyone else:** a weaker copy, shuffled into their deck **at the start of the next era**,
  whether they want it or not. A player who has no use for it can Burn it for fuel; otherwise it's a
  dead card. This timing is the default for designing cards, not a rule, so a Technology may spread at
  once if its text says so.

What the two sides contain depends on the Technology:
- **Abstract Technologies,** such as Hygiene, give the researcher a better card or rule. *Example:*
  everyone gets a Healthcare card, but the researcher's public healthcare means their copy costs no
  Coin to play.
- **Infrastructure Technologies,** such as better roads or railways, change rules like the ring
  surcharges in `CoreLoop.framework.md`.
- **Building Technologies** unlock a next-era building early (see Prototypes).

### Prototypes

- A building Technology gives the researcher a **prototype** of a next-era building: it produces
  about half of what the full building does (rounded down, but at least 1) and costs the full price.
- At the next era, everyone else gets the same prototype shuffled into their deck.
- The **full building** is shuffled into the next era's Blueprint stack, and only because someone
  researched it. It may turn up late, or not before that era ends, which is why the prototype is
  still worth taking.
- When the full blueprint is claimed, it can be built onto a prototype at a discount, using the
  upgrade rule in `CoreLoop.framework.md`: it keeps the slot and pays no ring surcharge.

### Research shapes the world

- **Each era's Blueprint stack** contains a small core of cards that always appear, plus the
  blueprints that the previous era's research added. Research largely decides what can be built
  later.
- **Follow-up Technologies** (Steam → Railway) enter the next era's Technology stack only if someone
  researched their base Technology. A player needs no prerequisites, but the world does.
- What nobody researched never comes into existence in that game.

### The Technology market

- It offers the **current era's Technologies** only, claimed with Knowledge, as in `framework.md`.
- At the era change, unclaimed Technologies leave the market for good.
- If several players claim the same Technology in one turn, all of them get the researcher's version,
  as with any market claim in `framework.md`.

### Modernization

The shared Modernization track moves a fixed amount every turn, plus **+1 for every Technology
claimed**, plus other effects that push or slow it. A Technology claimed by several players in the
same turn still counts once. Research hastens the eras and the end of the game, so a research leader
also controls the pace.

### Points

Each Technology in your display scores **its era number** (1–4) at the end of the game. Spread copies
score nothing.

### At the era change

In this order, once the turn's claims have resolved:
1. Unclaimed Technologies of the old era leave.
2. The new era's Technology stack is formed: its core Technologies plus the follow-ups whose base was
   researched.
3. The new era's Blueprint stack is formed: its core blueprints plus those added by research.
4. Spread copies of last era's Technologies are shuffled into the draw piles of the players who didn't
   research them.

## Edge cases

| Case | Decided behavior |
|---|---|
| Several players claim the same Technology in one turn | All of them get the researcher's version and its card in hand. Modernization +1 once. None of them gets a spread copy. |
| A Technology is claimed in the turn the era changes | Claims resolve first, so it counts: its spread copies and full blueprint join the new era. |
| Spread copies arrive | They're shuffled into the draw pile at the start of the new era, before planning, so this never collides with the undo lock. |
| A spread copy is unwanted | It sits as a dead card; Burn it for fuel. |
| A Technology is researched in the final era | There is no next era. The researcher gets the full building directly, and nothing spreads. |
| Nobody researches a Technology | It leaves at the era change; its buildings and follow-ups never enter the game. |
| A follow-up's base was never researched | The follow-up is removed from the new era's stack before it is shuffled. |
| The full blueprint never turns up before the era ends | Prototypes stay as they are. Whether it can come back in a later era is open question 4 (default: no). |
| The researcher already holds a spread copy's card | Can't happen: researchers get no spread copy of their own Technology. |

## Boundaries & invariants

**Always**
- **T-A1.** A Technology in your display lasts the whole game. It can't be stolen, destroyed or lost.
- **T-A2.** Every Technology claimed pushes Modernization +1, once per Technology however many players
  claim it.
- **T-A3.** A card tied to a Technology enters the game only if someone has researched that
  Technology.
- **T-A4.** No player ever gets a stronger version of a Technology than its researcher.

**Never**
- **T-N1.** A Technology never takes a building slot and never sits in a deck or hand.
- **T-N2.** The Technology market never offers a Technology from an era other than the current one.
- **T-N3.** Claiming a Technology never requires owning another one. Follow-ups depend on the world,
  not on the player.

## Relation to project framework

**Project goals this serves:**
- The intent's "keep making decisions you'd never make in a classic civ game": when to research, and
  whether to take a prototype or wait.
- "The late game snowballs": research pushes Modernization and adds stronger blueprints.
- Interaction without direct conflict: your research changes every other player's deck and every
  later market.

**Project invariants it inherits:**
- **A1:** "Every game ends. Modernization can be slowed but never stopped." Research only ever pushes
  the track forward.
- **A6:** "Hidden information stays hidden." Research is visible through market claims, which
  `framework.md` already makes public.
- **N2:** "A market claim never fails because of what another player did." Shared claims of one
  Technology all succeed.
- **N3:** "A player is never eliminated or left unable to act." Spread copies can always be Burned.

**Inherited from `CoreLoop.framework.md`:**
- The upgrade rule that prototypes use.
- **C-A2:** "Any action that reveals hidden information locks undo for everything before it that
  turn." The researcher's card in hand is known, so it doesn't lock.

**Project framework lines amended by this design** (changed in `framework.md` at the same time):
- Technologies go into the tech display, not the deck.
- Open question 4's default for Modernization gains +1 for every Technology claimed.

## Standards adopted

**Accepted**
- A summary at each era change: what entered your deck, and what came into existence in the world.
- A tooltip on every Technology showing both the researcher's version and the spread version.
- A log line for each spread.
- Your tech display is always visible to you.

## Open questions

Each has a recommended default.

1. **How many Technologies per era.** *Default: about 6 per era stack, with 3 shown at a time as in
   `framework.md`.*
2. **The size of each era's core Blueprint stack.** *Default: about half the era's stack is core cards;
   the other half comes from research.*
3. **Knowledge prices by era.** *Default: rising with the era (roughly 3 / 5 / 7 / 9); tune in
   playtests.*
4. **Whether a full blueprint missed in its own era can return later.** *Default: no. A missed
   building stays a prototype for that game.*
