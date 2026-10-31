# Culture — Design Framework

## Intent

This framework sets out Culture and Wonders in the Engine Builder: what Culture is, where it comes
from, what it buys, and how Wonders are claimed.

**The model:** Culture is a civilization's appetite for grand projects. It is mostly a resource you
spend on Wonders, since a civilization can't become culturally great without a culture that likes
building on a grand scale. The buildings that make Culture are themselves a big source of points:
expensive to build, a large swing in score, and only worth it if you can keep them standing.

**What this adds to the game:**
- A build path of its own. The framework's intent asks for "several build paths that score in
  different ways", and Culture is a path for players who pour Production into a few large, exposed
  investments instead of a broad engine.
- A defensive reason to invest: Culture is a main cure for Unrest.
- Wonders become contested. If several players want the same Wonder, the one who offers the most
  Culture gets it.

**What it deliberately is not:** a separate way to win. Culture never ends the game or wins it by
itself. There stays one victory condition: the most points when the game ends.

**Success:** in playtests, a Culture-heavy player can win on points against an industrial engine, and
deciding whether to spend Culture on a Wonder now or keep building it up is a real decision.

## Scope

**In**
- Culture as a resource: sources, carry-over, uses.
- Culture buildings and their points.
- Wonders: cost, claiming, what happens when several players claim the same one, and where they go.
- Culture's link to Unrest.
- The Culture tag.

**Out**
- The Wonders and Culture buildings themselves (card files).
- Military and raid rules, which follow `framework.md` and `CoreLoop.framework.md`.
- A separate culture victory (rejected; see Intent).

## Design

### Culture

- **Where it comes from:** Culture buildings, such as a theatre, academy, cathedral or salon, make it
  every turn. Some actions, such as a festival or patronage, make it once. A card may turn Coin into
  Culture, but there is no general exchange rate into Culture.
- **It builds up and carries over** from turn to turn, like Food. There is no cap.
- **What it buys:** mostly Wonders. Some cards also spend it.
- **It cures Unrest.** Culture actions and buildings (festivals, churches, theatres) are a main way to
  clear Unrest junk cards.
- **It can't be stolen.** Raids take goods, then Coin, as in `CoreLoop.framework.md`. A Culture
  player's weak spot is their buildings, not their bank.
- **Unspent Culture scores nothing** at the end. Its value lies in what you buy with it.

### Culture buildings

- They carry the **Culture tag**, the 7th tag in `CoreLoop.framework.md`'s list.
- They are expensive and worth a lot of points. Their points count **only while they stand**.
- They follow the normal raid rules. Their own Defense, the centre ring and Walls protect them.

### Wonders

- **Cost:** Production plus Culture. Both are spent.
- **Claiming:** you claim a Wonder like any market card, pick its slot (ring surcharge included), and
  offer an amount of Culture of at least its printed Culture cost.
- **Claims are hidden.** Like every market claim, nobody sees it, nor the Culture offered, until the
  turn resolves. Then all claims are revealed and resolved together.
- **Several claimants:** the highest Culture offer gets the Wonder and pays its whole offer. If
  several players tie for the highest offer, all of them build it. This is the one exception to
  `framework.md`'s N2, "A market claim never fails because of what another player did".
- **Losers** get their Culture back in full at resolution. Their Production also comes back at
  resolution, after planning is over, so it can only become Coin at 3:1. Losing costs something
  without a separate penalty.
- **Where it goes:** the Wonder is built at resolution in the slot you picked, and works from the
  next turn. It doesn't go into your deck.
- Wonders give unique effects and points. Like Culture buildings, they follow the normal raid rules,
  and their points count only while they stand.

## Edge cases

| Case | Decided behavior |
|---|---|
| Only one player claims a Wonder | They get it and pay their whole Culture offer. |
| Several players tie for the highest Culture offer | All of them build the Wonder, with its points and effects. |
| A player loses a Wonder to a higher offer | Culture refunded in full at resolution. Production refunded at resolution, so it can only become Coin at 3:1. |
| A Wonder is destroyed | It leaves the game, and its points go with it. |
| A Culture building is destroyed | Its points are lost; its slot can be built again as in `CoreLoop.framework.md`. |
| A raid succeeds against a player with lots of Culture | Culture is untouched; the raid takes goods, then Coin. |
| The game ends with Culture unspent | It scores nothing. |

## Boundaries & invariants

**Always**
- **CU-A1.** Culture comes only from Culture buildings and card effects. Nothing gives a general
  exchange rate into it.
- **CU-A2.** A Wonder claim, like every market claim, stays hidden until the turn resolves, including
  the Culture offered.
- **CU-A3.** Every Wonder claimant either gets the Wonder or gets their Culture back in full.
- **CU-A4.** Points from Culture buildings and Wonders count only if the building is still standing at
  the end.

**Never**
- **CU-N1.** Culture can't be stolen.
- **CU-N2.** Unspent Culture never scores.
- **CU-N3.** Culture never ends the game or wins it by itself. There stays one victory condition.

## Relation to project framework

**Project goals this serves:**
- "Several build paths that score in different ways": Culture is its own path.
- "Military and other threats create decisions that make or break a game": Culture's points sit in
  buildings that can be destroyed.
- One victory condition, hidden exact scores (A6), and an announced end (A7) all stay intact, because
  Culture never ends the game.

**Project invariants it inherits:**
- **A6:** "Hidden information stays hidden: opponents' builds and exact scores." Culture totals stay
  hidden like everything else in a player's state.
- **A7:** "The final turn is always announced before it is played." Culture can't trigger an end.
- **N2:** "A market claim never fails because of what another player did." Wonders are its one
  exception, amended in `framework.md` at the same time.

**Changes made at the same time:**
- `framework.md`: Culture as a resource; Wonders' cost and claiming; Culture buildings and Wonders as
  sources of points; open question 1 marked settled; N2's exception made definite.
- `framework.md`: **every market claim stays hidden until the turn resolves.** This was decided in this
  exploration for all claims, not only Wonders. *Game choice, with its cost:* players can no longer
  react within a turn to what a rival claims; claiming becomes a blind, simultaneous choice. In return,
  there is no race to claim first and no live bidding war.
- `CoreLoop.framework.md`: Culture joins the tag list.

## Standards adopted

**Accepted**
- The resolution log reveals every claim, every Culture offer on a Wonder, and who won.
- Culture gets its own counter in the prototype.
- A Wonder's tooltip shows its Production and Culture cost and its points.

## Open questions

Each has a recommended default.

1. **Points for Culture buildings and Wonders.** *Default: Culture buildings about 2 / 3 / 4 / 5 points
   by era; Wonders about 5–8, on top of their effect. Tune in playtests.*
2. **How many Wonders per era.** *Default: about 4 in each era's Wonder stack, 3 shown at a time.*
3. **Culture costs of Wonders.** *Default: roughly 3–4 turns' worth of one good Culture building's
   output.*
