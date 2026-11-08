# Card authoring

The working notes for designing card effects: the playstyles cards should serve, the fields cards
come from, the mechanics they can use, the queue of cards still to brainstorm, and a log of what was
decided and why. The `card-brainstorm` skill (`.claude/skills/card-brainstorm/`) reads and updates
this file every round.

## Archetypes

The playstyles the card pool should make possible. Each needs enough cards that a player can lean
into it, and a weakness another archetype can use.

### Science

Goes into the sciences to rush Modernization and out-tech the others: Technologies are worth more
than their cost, and a head start on later eras' buildings is the edge. Advanced eras' prices hurt
everyone else more than the science player.
- **Wants:** Knowledge, Technologies early, prototypes, effects that push Modernization.
- **Fields:** Science, some Industry.
- **Weak against:** an early raid; Knowledge buys no defense. Slowing Modernization hurts it most.

### Feudal

A long-lived feudal state that keeps its old structure and adds modernized equipment where it pays:
manors, knights and castles, later fitted with guns and better farming. The opposite of the science
rush: it wants the eras to last.
- **Wants:** Agriculture and State buildings, units, Food, sturdy buildings (HP), effects that slow
  Modernization.
- **Fields:** Agriculture, Military, State.
- **Weak against:** falling behind in the late eras' buildings if it never researches.

### Commerce

A trade state that wants to be resource-efficient and overproduce, so it can claim as much as
possible from the market.
- **Wants:** Coin, goods to sell to trading partners, ventures, cheap claims, converters that turn
  surplus into value.
- **Fields:** Trade, Industry.
- **Weak against:** raids on its stored goods; the Coin cap.

### Cultural utopia

Inward-looking: builds Wonders one after another and racks up points and other value steadily.
- **Wants:** Culture, Wonders, Culture buildings, effects that clear Unrest.
- **Fields:** Culture, State, some Agriculture.
- **Weak against:** attacks on its Wonders; points that only count while the Wonder stands
  (`Culture.framework.md`).

## Fields

Where a thing was used in real life. They are the seven building tags of `CoreLoop.framework.md`
("Agriculture, Industry, Military, Science, Trade, State and Culture"), so a card's field is also the
tag its buildings carry.

| Field | What belongs here | Archetypes it feeds |
|---|---|---|
| Agriculture | Fields, livestock, crop rotation, mills for grain | Feudal, Cultural utopia |
| Industry | Mines, smelting, crafts, machines, power | Commerce, Science |
| Military | Units, fortifications, weapons, powder | Feudal |
| Science | Instruments, universities, observatories, learning | Science |
| Trade | Markets, banking, shipping, navigation for trade | Commerce |
| State | Administration, law, coinage, the lord's estate | Feudal, Cultural utopia |
| Culture | Churches, the arts, Wonders, festivals | Cultural utopia |

## Mechanics vocabulary

What a card can do, as the frameworks already define it. A new mechanic gets added here when a round
introduces it.

- **Make resources:** Production, Food, Knowledge, Culture, Coin, Attack (`framework.md` Resources).
- **Produce:** trigger buildings that only work when a card triggers them (`CoreLoop.framework.md`).
- **Converter:** a building that turns goods into other goods or payoffs.
- **Goods and tokens:** goods sit on buildings as tokens; storage keeps them between turns.
- **Made cards:** a building or Technology puts a card into your hand each turn, or into your deck
  once.
- **Ventures:** pay now, get a bigger return a few turns later.
- **Upgrades:** a building built onto an older one, kept for real descendants (Bloomery → Blast
  Furnace).
- **Technology:** a researcher's version, spread copies for everyone else at the next era, prototypes
  of next-era buildings, follow-up Technologies (`Technology.framework.md`).
- **Modernization:** push or slow the shared track.
- **Scout:** look at an opponent's hidden zone or hand.
- **Junk and Burn:** add junk as a cost, clear it, or Burn a card for a one-time payoff.
- **Strategic resources:** held, not spent; needed to claim or build some cards.
- **Building HP:** how much leftover Attack a raid needs to destroy a building.
- **Ring surcharge:** building further out costs more; transport lowers it.

## Queue

Era 1 inventions (action cards in the Development stack) and Era 1 Technologies, from
`Era1.cards.md`, three per round, grouped by field.

1. **Agriculture:** Heavy Plough, Three-Field Rotation, Turnips and Clover *(Technology)*.
2. **Power and building:** Horse Collar, Trip Hammer, Treadwheel Crane.
3. **Industry:** Spinning Wheel, Atmospheric Engine *(Technology)*, Canal Building *(Technology)*.
4. **Trade:** Double-Entry Bookkeeping, Joint-Stock Company *(Technology)*, Coffeehouses
   *(Technology)*.
5. **Science:** Mechanical Clock, Astrolabe, Telescope *(Technology)*.
6. **Navigation and war:** Mariner's Compass, Corned Powder, Flintlock and Bayonet *(Technology)*.

## Card log

Decided cards, newest last: the effect, why, and the archetype it serves.

*(None yet.)*
