# Battle Grid — Design Framework

Feature framework, written by the explorer skill on 2026-10-22. It must stay inside `framework.md`.

**Identifiers in this file.** `BG1`–`BG9` are this feature's invariants, defined below. Project goals
`G1`–`G5` and invariants `I1`–`I20` are defined in `framework.md`.

---

## Intent

The space around the party decides how a fight works: how many enemies fit, where they can come
from, and who can reach whom. It is shown in the first-person view, and the player should read it
from the map *before* walking into it.

## Scope

**In:**

- reading the battlefield from the map;
- enemy groups, their positions and formations;
- party formation, facing and turning;
- range;
- flanks, enemies behind you, and joiners;
- large enemies;
- how width changes during a fight;
- targeting scopes;
- what the view shows.

**Out:**

- individual skills and their numbers;
- enemy target priorities (settled in `framework.md`);
- noise numbers;
- terrain tags other than walls;
- art and animation.

---

## Design

### The map model

- **Thin walls.** Walls are lines between tiles, as in Etrian Odyssey and Dungeon and Bride. Every
  tile is floor. Wall-seeing magic (Dungeon and Bride's Mystic Eye) sees through one thin wall into
  the next tile.
- The party fights on its own tile. It doesn't move during a fight; characters can only swap places.

### Reading the battlefield

- **Engagement comes only from the 4 orthogonal tiles.** Enemies attack from the front, the left,
  the right or the rear. Diagonal tiles never hold an engaging group; they only add width.
- **Width per side.**
  - Each side has 3 tiles: the orthogonal tile in that direction plus its two diagonals.
  - Each of those tiles that is open gives that side 3 slots per row, so a side is 0, 3, 6 or 9 wide.
  - **Closed** means a wall separates the tile from the party's tile.
  - A **diagonal** counts as closed if at least one of the two walls around that corner exists.
  - Every diagonal touches two sides and counts for both, rear diagonals included.
  - Example (X is the party, facing up; `|` is a wall between the front-left tile and the front
    tile; `W` marks walls behind):

    ```
    O|O O
    O X O
    W W W
    ```

    Front 6 wide, left 3, right 6, rear 0.
- **Width cuts both ways.**
  - A narrow side holds fewer enemies, and their area attacks hit fewer of you. A corridor with both
    flanks covered weakens enemy area attacks.
  - Your area attacks also hit fewer. Facing an enemy whose sides are closed lets you choke them, at
    the cost of hitting fewer at once.
  - Whether this helps or hurts depends on both line-ups.
- **Width changes only through effects.** It is computed when the fight starts and stays fixed, unless
  a skill or item changes the walls (collapsing a wall, raising a barrier, smashing a boulder). Then
  it is recomputed, and so are any large-enemy penalties.

### Enemy groups

- **Each group keeps its own formation.**
  - A group fills rows as wide as its side allows, up to 5 rows per side.
  - When a group's front row falls, its rows behind slide forward.
  - **Gaps are never filled**: a weak enemy in front can block three elites standing behind it.
- **Joiners** must reach an orthogonal tile next to the party on the map; how fast they arrive
  follows the noise rules in `framework.md`. A joiner then queues on that side as its own group,
  behind the groups already there.
- **Large enemies** take 2 to 9 slots. With fewer slots than they need, their attacks that need space
  (swipes, sweeps, claw rakes) are weakened. The penalty grows with the number of missing slots:

  | Missing slots | 1 | 2 | 3 | 4 | 5 | 6 |
  |---|---|---|---|---|---|---|
  | Weaker by | 15% | 35% | 60% | 75% | 85% | 90% |

  - Attacks that don't need space are **not** weakened. A fire breath hurts as much as in an open
    field, and a precise single-target strike can take out a party member at once.
  - Reading which part of the enemy's toolkit still works is the player's job.
  - This is what "wedged" means in `framework.md`. On the map, a large enemy still can't enter a
    passage narrower than itself.

### Party, facing and range

- **Formation.** Chosen before the fight: 2 rows × 3 lanes (more frontline) or 3 rows × 2 lanes
  (more protection at the back).
- **The formation rotates with facing.** The front row always faces the group the party looks at.
- **Turning.** Before choosing actions, the player clicks a group at the side or at the top of the
  view to turn and face it. Turning is free. Then actions are chosen as normal.
  - When the party's attacks finish off the faced group, the party turns back to where it faced
    before.
- **Range is symmetric.** Distance = the attacker's row + the target's row − 1, for both sides.
  - Rows are counted relative to the party's current facing.
  - Your front-row melee (range 1) reaches the enemy front row. A spear (range 2) lets your row 2
    reach it as well.
  - In 3 rows × 2 lanes, your 3rd row is reached only by range 3 from the enemy front row, or range
    4 from enemy row 2.
  - The longest possible distance is enemy row 5 to party row 3, which is 7.
- **Flanks: range turns sideways, +20% damage.** For a group at your side, your nearest *column* is
  range 1, instead of your front row.
- **Rear: range flips, +40–50% damage.** For a group behind you, your back row is range 1. Getting
  caught like this is to be avoided unless you are much stronger.
- **Groups you don't face always get their bonus**, flank or rear.

### Targeting scopes

Every skill states its scope precisely:

| Scope | Reaches |
|---|---|
| Single target, target row, front row | The faced side only, including all groups queued there |
| All visible enemies | Front and both flanks; the rear is safe |
| All enemies | Everyone, the rear included |

### Backstab on the map, in the grid

- An enemy that reaches the party from behind on the map gets a **free opening round**, *and* that
  round uses the rear geometry: flipped range and the +40–50% bonus. After it, the player acts and can
  turn.
- **It works both ways.** A party that ambushes from behind gets the free round against the enemy's
  flipped formation, with its back rows (archers, casters) at range 1.
- Cost: this is the harshest situation in the game. An unscouted ambush can take out your back row
  before you act. Scouting, and noticing backstab-resistant and alert enemies, become essential.
  `framework.md` already records that late-game parties may wipe groups before they act, and this
  makes that concern sharper.

### What the view shows

- **The faced group** is in the centre, standing a little further away than in Dungeon and Bride, so
  that a full group fits on screen.
- **Flank groups** appear at the left and right edges. Only their edge enemies are visible, with no
  group cards and no tooltips.
- **The rear group** appears as a strip at the top of the view.
- **"?" groups.** A group shows as "?" until the party has seen it at least side-on, by committing a
  turn facing it or facing next to it. After that it renders normally.
- **Readability is a "before" promise** (`framework.md` I6: "Every enemy behaviour and weakness can be
  read before the fight"). It is kept on the map through scouting, tells and the bestiary, not by the
  fight's display. A party flanked without preparation faces the consequences.

---

## Edge cases

| Case | Decided behaviour |
|---|---|
| The faced group is wiped and the previous facing has no group left | *Default:* the party stays facing the now-empty side. Turning is free before the next actions. |
| A side's orthogonal tile is closed but its diagonals are open | Nobody engages from that side. The open diagonals still widen the two neighbouring sides. |
| A joiner's arrival side is walled off | It has to reach another open orthogonal tile. |
| A group has more enemies than fit its side | It overflows into more rows. *Default:* beyond 5 rows on a side, the rest wait on the map tile and step in as rows free up. |
| Several groups on one side | They queue behind each other, each in its own formation. Faced-side scopes reach all of them. |
| A 9-slot enemy on a 3-wide side | 6 slots missing, so its space-needing attacks are 90% weaker. Its breath and precise attacks are unaffected. |
| An effect removes a wall mid-fight | Width is recomputed, and large-enemy penalties with it. |
| Surrounded on all four sides | Allowed. Front normal, both flanks +20%, rear +40–50%. "All visible" reaches front and flanks. |
| A "?" group behind the party | It is revealed once the party faces left or right (side-on) or turns to face it. |
| Swapping places with a rotating formation | Swaps are positions relative to the current facing. |
| Retreat | Back the way the party came, as in `framework.md`. Impossible if a group stands on that side. |
| The party ambushes an enemy from behind | Free round, with the enemy's back rows at range 1 and the rear bonus applied to them. |

---

## Boundaries & invariants

- **BG1 — Enemies engage only from the four orthogonal tiles.** Diagonals only add width.
- **BG2 — Width per side is 3 × its open tiles (0, 3, 6 or 9).** Never more than 9 per row or 5 rows
  per side.
- **BG3 — Range is symmetric**: the attacker's row + the target's row − 1, counted relative to the
  party's current facing.
- **BG4 — Gaps are never filled.** Each group keeps its own formation.
- **BG5 — Single-target and row actions reach only the faced side.** "All visible" never reaches the
  rear; only "all" reaches everything.
- **BG6 — Groups the party doesn't face always get their bonus** (flank +20%, rear +40–50%).
- **BG7 — The large-enemy penalty applies only to attacks that need space.**
- **BG8 — Width changes only through an effect that changes the walls.**
- **BG9 — A group shows as "?" until the party has seen it at least side-on.**

## Relation to project framework

- **Serves G4:** "Positioning, luring, traps, backstabs, noise and the terrain you fight on decide
  fights." Where you stand decides width, exposure and which enemy attacks still work.
- **Serves G2:** "Brute force fails." Flanks, ambushes and choke points punish walking in
  unprepared.
- **Inherits I6:** "Every enemy behaviour and weakness can be read before the fight." Here that means
  on the map, *before* the fight. The fight's display only shows edge enemies on the flanks and "?"
  for groups not yet seen.
- **Inherits I8:** "All 6 party members always fight." The formation rotates; nobody is benched.
- **Inherits I4:** "Reach never requires a specific class." Weapons such as spears give row-2 reach
  through the range formula.
- **Amends `framework.md`** (agreed during this run):
  - The provisional "6 battlefield shapes" and "each open side adds 3" are replaced by width per
    side.
  - "Wedged" is now defined as the large-enemy penalty.
  - A map backstab's free round now also uses the rear geometry.
  - Open question 1 is closed.

## Standards adopted

- Turning is a free choice made before actions each turn, so there are no fiddly facing costs.
- "?" for unseen groups, instead of hiding them entirely, so the player always knows a threat is
  there.

## Open questions

1. **Exact rear bonus: 40% or 50%.** *Default:* 50%, tuned in the slice.
2. **Fitting a 9-wide group on screen.** Nine sprites side by side need smaller or staggered enemy
   art. *Default:* stagger by row depth, decided when the renderer is designed.
3. **Turning feedback.** How the view animates when the party turns mid-fight. *Default:* a quick
   90°/180° turn, the same as movement.
4. **Total enemy cap.** Each side holds up to 9 × 5 = 45, so four sides could in theory hold 180,
   while `framework.md` sets a horde at 45. *Default:* at most 45 enemies in a fight in total; the
   rest wait on the map and step in as places free up.
5. **Other terrain in the grid** (water, ledges, rubble, loose ceilings) is a later feature
   framework. *Default:* not part of the slice.
