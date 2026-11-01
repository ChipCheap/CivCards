# Era 1 cards — draft for review

A first card list for era 1 of the Engine Builder, written against `framework.md`,
`CoreLoop.framework.md`, `Technology.framework.md` and `Culture.framework.md`, and drawn from
`History.research.md`. It is a pool to review and trim, not yet the card files. Once reviewed, it goes
into `prototype/cards/cards.csv` and `stacks.csv`, replacing today's sample cards.

**Every number is a first guess** to be tuned in playtests. The effects are what each card is *for*.
The **In history** column says what the thing was, so each card has something real to hang effects on.

## How the era is cut

- **Era 1 covers what Europe had up to about 1600**: the medieval baseline (knights, castles,
  watermills, guilds, Gothic cathedrals) and the Renaissance (printing, gunpowder, the star fort, the
  counting house). All of it comes as blueprints, actions, Wonders and strategic resources.
- **The era-1 Technology stack holds what came after 1600**: the telescope, the flintlock, the
  joint-stock company, the first steam engine. Researching one brings an era-2 building in early as a
  prototype, as `Technology.framework.md` intends: a building Technology "gives the researcher a
  **prototype** of a next-era building".
- **Europe only.** The East China set comes later, as a civilization of its own.
- **An era lasts about 4 turns**, and a player claims 1–2 Blueprint cards a turn: **about 5 claims per
  player per era**. That is 10 cards for two players and 20 for four, fewer when players claim the
  same card (`framework.md`: "all of them get it"). A stack of about 20 covers four players, and in a
  two-player game half of it never shows up, which keeps games different.

## Rules the list follows

1. **Every market card has a claim price.** Some also print a price to build or play them. Building
   always adds the ring surcharge ("Centre +0, Town +2, Outskirts +5", `CoreLoop.framework.md`).
2. **Action cards come from three places:** the starter deck, the Blueprint stack (claimed like
   blueprints, then shuffled into your deck), and buildings and Technologies that make them.
3. **Small inventions are action cards**, stronger than the base cards. The base cards make 3
   Production or 2 Food. A later-era card like a conveyor belt might make 7. Upgrades exist only where
   one building really grows out of another: here, only the Blast Furnace onto the Bloomery.
4. **Made cards** (put into your hand by a building each turn) are **removed at the end of the turn if
   not played**, unless the card says otherwise. *(My default.)*
5. **Units** work like the prototype's Militia: play one, pay its price, get its Attack and Defense.
   Sending waves follows `framework.md` as it stands.
6. **A strategic resource is shown, not spent.** By default it only gives a bonus while you hold it;
   a few also unlock a card (here Silver, Copper and Saltpetre). *(Shown, not spent: my default.
   Bonus first, unlocking the exception: your call.)*

## Goods of era 1

`CoreLoop.framework.md` open question 8: "about 5 per era, each made by at least 2 buildings". This
list has six.

| Good | Made by | Used by |
|---|---|---|
| Grain | Open Fields, Manor | Windmill, Brewery, Nitre Beds; can be eaten as 1 Food |
| Timber | Woodcutters' Camp, Manor *(your choice each turn)* | Bloomery, Blast Furnace, Powder Mill, Nitre Beds |
| Wool | Sheep Pasture, Monastery | Weavers' Hall, Spinning Wheel |
| Cloth | Weavers' Hall, Spinning Wheel | Sells for 2 Coin (3 to a partner that wants it); Hanseatic Convoy |
| Iron | Bog-Iron Pit, Bloomery, Blast Furnace, Pumped Mine | Smithy, Knights, Gun Foundry |
| Powder | Powder Mill, Nitre Beds | Arquebusiers, Cannon, Corned Powder |

- **Grain can be eaten:** 1 Grain becomes 1 Food at any time during planning. That gives Grain a
  floor, and mills and breweries do better than that.
- **Powder has two routes.** The Powder Mill needs Saltpetre, a strategic resource with one copy, and
  is fast. Nitre Beds need no Saltpetre and are slow.

## Starter deck (10 cards, every player)

| Card | Copies | Effect |
|---|---|---|
| Labour | 3 | +3 Production. |
| Harvest | 2 | +2 Food. |
| Militia | 2 | Unit. Pay 1 Food: Attack 1, Defense 1. |
| Workday | 1 | +1 Production. Produce 1 (trigger one building). |
| Study | 1 | +2 Knowledge. |
| Emergency Levy | 1 | +5 Production. Add 1 Unrest to your discard pile. |

## Starting towns *(new, for review)*

Europe in 1450 was full of towns that already stood. So each player picks **a starting town**: a small
established town with 1–2 buildings already built. It is a separate pick from the civilization, whose
own bonus comes on top (`framework.md`: "The civilization's own bonus comes on top"). The starter deck
stays shared. This replaces my earlier default of Open Fields in slot 1 for everyone.

**Yardstick** *(my own, for balancing towns against each other)*: a starting town is worth about one
extra starter card every turn, roughly 3–4 Production. A town that gives more pays for it with a
drawback.

### Mill Town

*In history:* many towns grew up around mills on a river. Toulouse's Bazacle mills on the Garonne were
run by a company whose shares were traded, one of the first in Europe.

- **Built:** a **River Mill** in slot 1. Each turn: **+4 Production**, with no Produce card needed.
- **The river** takes 3 slots, one in each ring (slots 2, 6 and 10): nothing can be built there, and
  it can't be attacked.
- **Cost in numbers:** +4 Production is about half again what a starting hand makes. The lost slots
  hurt late: by the end of era 2 a player has built about 6–8 buildings, so the river starts pushing
  buildings outward around era 3.

### Castle Town

*In history:* towns that grew in the shelter of a castle: the German *Burg* towns and the English
castle boroughs, whose lord protected the market and took its tolls.

- **Built:** **Stables** (slot 1) and a **Bog-Iron Pit** (slot 9). The pit is there because a Knight
  costs 2 Food and 1 Iron to play; without it, the Knight the Stables make each turn would be dead.
- **Drawback:** no economy beyond the Iron, and every Knight eats 2 Food.

### Hanse Port

*In history:* trading towns such as Lübeck and Bruges, whose market halls handled goods from the
whole North Sea and Baltic.

- **Built:** a **Market Hall** (slot 1). Each turn: **+2 Coin**. Coin cap +2.
- **Drawback:** Coin never pays Production (`CoreLoop.framework.md`: "It never pays Production
  costs"), so this town claims blueprints more slowly. The cap raise is needed: at the standard cap of
  5, two Coin a turn would soon be wasted.

### Cathedral City

*In history:* a bishop's seat. Its cathedral school trained clergy and taught Latin, and the schools
of Chartres and Paris grew into the first universities.

- **Built:** a **Cathedral School** (slot 1). Each turn: +1 Culture, +2 Knowledge. No points.
- **Drawback:** the slowest economy of the five; it bets on Wonders and research. Without its own
  rule it needed the second Knowledge to keep up with the others.

### Mining Town

*In history:* silver and iron towns such as Kutná Hora and Freiberg, which rulers drew miners to with
their own laws and tax breaks.

- **Built:** a **Bog-Iron Pit** (slot 1) and a **Smithy** (slot 2). Together: +1 Iron each turn,
  which the Smithy turns into +3 Production, or which you keep for Knights and guns.

Five towns against four seats, so one can go if it doesn't play well.

## Nations *(new, for review)*

In the prototype the civilizations are European nations (`framework.md`: "in the prototype, the
civilizations are European nations, since era 1 is Europe only"). Each has one bonus; the bonuses are
the rules I first drafted onto the towns. Any nation can pick any town.

| Nation | Bonus | Effect | In history |
|---|---|---|---|
| France | Feudal levy | Your Militia are Attack 2, Defense 2. | The largest kingdom in western Europe, raising its armies from vassals who owed about 40 days of armed service a year and brought their own men. |
| Venice | Staple right | Each turn, the first good you buy from a trading partner costs 1 Coin less. | A merchant republic between Europe and the East. German traders had to sell through Venice's Fondaco dei Tedeschi, and the city taxed every deal. |
| Holy Roman Empire | Mining freedom | You claim strategic resources for 1 Military less (at least 1). | A patchwork of princes and free cities under an elected emperor. Its rulers drew miners to the Harz, the Ore Mountains and Bohemia with their own laws and tax breaks. |
| Castile | Pilgrims | Your Wonders cost 1 Culture less. | United with Aragon in 1479 to form Spain, and sailed to the Americas from 1492. Santiago de Compostela, in its north-west, drew pilgrims from all over Europe. |

England is the obvious fifth (a bonus around its yeoman longbowmen) if a spare is wanted.

## Blueprint stack: buildings

Claim = the market price, in Production. Extra = a price paid when building, on top of the ring
surcharge; most have none. Pts = points at the end, only while it stands (`Culture.framework.md`:
Culture buildings about "2 / 3 / 4 / 5 points by era").

### Agriculture

| Card | Tags | Claim | Extra | Effect | In history |
|---|---|---|---|---|---|
| Open Fields | Agriculture | 3 | — | Each turn: +1 Grain. | Large unfenced fields around a village, split into long strips farmed by different households. The village ploughed, sowed and harvested together. |
| Sheep Pasture | Agriculture | 2 | — | Each turn: +1 Wool. Cheap, made for the outskirts. | Grazing kept for wool, not meat. English wool fed the looms of Flanders and Italy; later, lords fenced off common land for sheep. |
| Fishery | Agriculture | 3 | — | Each turn: +1 Food. | Fish ponds, weirs and coastal boats. The Church banned meat on many fast days but allowed fish, so salted herring and pond carp were staples. |
| Manor | Agriculture, State | 5 | — | Each turn: +1 Grain or +1 Timber, and a **Corvée** into your hand. | A lord's estate: his own fields, the peasants' strips, woods and a mill. Peasants owed him days of unpaid labour (corvée) and part of their harvest. |
| Windmill | Agriculture, Industry | 4 | — | Produce: spend up to 2 Grain for +2 Food each. | Wind-driven mills grinding grain, common from the late 1100s where rivers were too flat or froze. Lords often forced tenants to grind at their mill, for a fee. |
| Granary | Agriculture | 3 | — | Storage 3 (any goods). | A raised, dry store that kept grain from damp and rats. Towns kept public granaries to sell grain cheaply in famine years and head off riots. |
| Brewery | Agriculture, Trade | 3 | — | Converter: 2 Grain → +1 Culture and +1 Coin. | Ale and beer were everyday drinks and a source of calories. Monasteries and town brewers made it; hops, from the 1300s, let beer keep and travel. |
| Nitre Beds | Agriculture, Industry | 3 | — | Converter: 1 Grain and 1 Timber → 1 Powder. | Heaps of manure, earth, straw and urine left to rot for a year or more, yielding saltpetre for gunpowder. Saltpetre men could also dig up barn floors. |

### Industry

| Card | Tags | Claim | Extra | Effect | In history |
|---|---|---|---|---|---|
| Woodcutters' Camp | Industry | 2 | — | Each turn: +1 Timber. | Woodcutters and charcoal burners. Wood was the fuel and building material for everything, and ironworks burned whole forests as charcoal. |
| Bog-Iron Pit | Industry | 3 | — | Each turn: +1 Iron. | Iron ore dug from bogs, where it forms in lumps near the surface. Poor but easy to get: most early medieval iron in northern Europe came from it. |
| Bloomery | Industry | 4 | — | Converter: 1 Timber → 1 Iron and +1 Production. | A small clay furnace burning charcoal and ore into a spongy lump of iron, the "bloom", then hammered to drive out slag. One batch at a time. |
| Blast Furnace | Industry | 4 | — | **Upgrade onto a Bloomery.** Each turn: +1 Iron. Converter: 1 Timber → 2 Iron. | A tall furnace with water-driven bellows, hot enough to melt iron so it runs out as cast iron, without stopping. Spread from the 1400s; far more iron per worker. |
| Pumped Mine | Industry | 6 | — | Each turn: +2 Iron. | Deep mines kept dry by pumps and hoists driven by water wheels and horses. Agricola's *De re metallica* (1556) drew them in detail. |
| Smithy | Industry, Military | 4 | — | Converter: 1 Iron → +3 Production. | The blacksmith forged tools, nails, horseshoes, ploughshares and weapons from bar iron. Every village had one; armourers worked in the towns. |
| Watermill | Industry | 5 | — | Produce: +4 Production. | A river-turned wheel that ground grain and also drove hammers, saws, bellows and cloth-fulling stocks. England's Domesday Book (1086) counted about 5,600. |
| Weavers' Hall | Industry, Trade | 4 | — | Converter: up to 2 Wool → 1 Cloth each. | Weaving workshops and the hall where the weavers' guild checked and sold cloth. Flemish and Italian towns grew rich on fine woollens. |
| Masons' Lodge | Industry | 4 | — | Each turn: +1 Production. Your Wonders cost 2 Production less. | The workshop and guild of the stonemasons on a great building site. Lodges kept the geometry of cathedral building, and masons moved from site to site. |
| Powder Mill | Industry, Military | 5 | — | **Needs Saltpetre.** Converter: 1 Timber → 2 Powder. | A mill grinding saltpetre, sulphur and charcoal into gunpowder, often water-driven. Powder mills blew up regularly and were built away from towns. |
| Gun Foundry | Industry, Military | 6 | 2 Iron | **Needs Copper.** Each turn: a **Cannon** into your hand. | Cannon were cast in bronze by the same craftsmen who cast church bells. Bronze cost more than iron but was safer: it bent before it burst. |

### Trade and State

| Card | Tags | Claim | Extra | Effect | In history |
|---|---|---|---|---|---|
| Market Square | Trade | 4 | — | Each turn: +1 Coin. Coin cap +1. | The town's marketplace, held under a charter from a lord or king. Market days drew farmers and traders, and the town collected tolls and stall fees. |
| Harbour | Trade | 5 | — | Goods from trading partners cost you 1 Coin less (at least 1). Adds a **Hanseatic Convoy** to your deck when built. | Quays, cranes and warehouses for loading ships. Ports such as Lübeck, Bruges and Venice controlled whole trade routes. |
| Shipyard | Trade, Military | 6 | 2 Timber | Each turn: +1 Production. Adds a **Caravel Voyage** to your deck when built. | Where ships were built and repaired: the Hanse's cogs, and the caravels and carracks of the Portuguese voyages. |
| Counting House | Trade | 5 | — | Each turn: +1 Coin. Coin cap +2. | Merchant bankers' offices handling accounts, bills of exchange and loans across Europe. The Medici and the Fugger ran networks of them and lent to kings and popes. |
| Guildhall | Trade, State | 6 | — | Each turn: +1 Production for every 2 Industry buildings you have. | Seat of the craft and merchant guilds, which set prices, quality and wages and decided who could practise a trade. Strong guilds often ran the town council. |
| Mint | State, Trade | 5 | — | **Needs Silver.** Each turn: +1 Coin. Coin cap +3. | Where silver was struck into coin under the ruler's authority. Minting brought profit and power, and rulers made money by debasing the coin. |
| Hospital | State | 4 | — | Each turn: remove 1 Sickness or Unrest from your hand. | Run by monasteries, religious orders or town charities, caring for the sick, the poor and pilgrims. Leper and plague houses kept contagion outside the walls. |

### Military

| Card | Tags | Claim | Extra | Effect | In history |
|---|---|---|---|---|---|
| Town Walls | Military, State | 6 | — | Defense 2. While it stands, your centre-ring buildings get +3 Defense. (The "Walls" of `CoreLoop.framework.md`.) | Stone walls with towers and gates. They kept out raiders and let the town charge tolls at its gates; citizens took turns on watch. |
| Keep | Military, State | 6 | — | Defense 4. Each turn: a **Men-at-Arms** into your hand. | The strong central tower of a castle: the lord's home and the last refuge in a siege. Its garrison of men-at-arms held the land around it. |
| Stables | Military | 4 | — | Each turn: a **Knight** into your hand. | Stables and pasture for warhorses. Keeping a knight mounted cost a fortune: warhorses trained for years and needed grain, not just grass. |
| Archery Butts | Military | 3 | — | Each turn: a **Longbowmen** into your hand. | Earth mounds used as targets. English law required men to practise the longbow on Sundays and holidays, which supplied the archers of Crécy and Agincourt. |
| Star Fort | Military | 8 | 2 cards | Defense 6. Your centre-ring buildings get +2 Defense. | Low, thick, angled walls with arrow-shaped bastions, so cannonballs glanced off and every wall could be covered by fire. An Italian answer to cannon, about 1500. |

### Culture and Science

| Card | Tags | Claim | Extra | Effect | In history |
|---|---|---|---|---|---|
| Parish Church | Culture | 4 | — | Each turn: +1 Culture. 2 pts. Adds a **Festival** to your deck when built. | The centre of village life: baptisms, weddings, burials, feast days and news. Paid for by the tithe, a tenth of the harvest. |
| Monastery | Culture, Science, Agriculture | 6 | — | Each turn: +1 Culture, +1 Knowledge, +1 Wool. 2 pts. | Monks living by a rule of prayer and work. Monasteries farmed, kept sheep, brewed, copied books and ran schools; some were among the richest landowners. |
| University | Science, Culture | 7 | — | Each turn: +2 Knowledge. 2 pts. Adds a **Disputation** to your deck when built. | Self-governing guilds of masters and students teaching law, medicine, theology and the arts. Latin let scholars move freely between them. |
| Printing House | Science, Culture | 6 | — | Each turn: +1 Knowledge, +1 Culture. 2 pts. | Printing with movable metal type, after Gutenberg in Mainz around 1450. By 1500, presses ran in over 250 towns and books had become cheap. |
| Botanical Garden | Science, Agriculture | 5 | — | Each turn: +1 Knowledge, +1 Food. | Gardens of medicinal plants for training doctors, first at Pisa and Padua in the 1540s. New plants from the Americas and Asia were grown and studied there. |

**33 buildings**, more than an era needs. Mark favourites and we trim the stack to about 20 cards,
buildings and actions together.

## Blueprint stack: action cards

Claimed like blueprints, then shuffled into your deck. Claim = the market price, in Production.
Play = a price paid when playing it, on top of the play itself.

### Inventions

| Card | Claim | Play | Effect | In history |
|---|---|---|---|---|
| Heavy Plough | 2 | — | +2 Food. Your Open Fields make +1 Grain each this turn. | A wheeled iron plough that turned heavy, wet clay, pulled by teams of oxen. It opened the rich soils of northern Europe. |
| Horse Collar | 2 | — | +3 Production. Produce 1. | A padded collar that let a horse pull with its shoulders without choking. Horses replaced oxen for ploughing and hauling: faster, though dearer to feed. |
| Three-Field Rotation | 3 | — | +1 Food for each of your Agriculture buildings, at least +2. | Fields rotated through winter grain, spring crops (oats, beans, peas) and a fallow year. Two thirds of the land bore a crop each year instead of half. |
| Spinning Wheel | 2 | — | Turn up to 3 Wool into Cloth. No building needed. | A wheel-driven spindle that spun wool into thread far faster than a hand spindle. In Europe from the 1200s, mostly worked at home. |
| Trip Hammer | 2 | — | Produce 2, Industry buildings only. | A heavy hammer lifted by cams on a water-wheel shaft and dropped again and again, to forge iron, crush ore or pound cloth. |
| Treadwheel Crane | 3 | — | +5 Production, only for a Wonder or a ring surcharge. | A crane driven by men walking inside a big wooden wheel. It lifted stone to the tops of cathedrals and unloaded ships in harbours. |
| Mechanical Clock | 3 | — | Draw 2 cards. +1 Production. | Weight-driven clocks in church and town towers from about 1300, striking the hours. Work and markets began to follow the clock rather than the sun. |
| Mariner's Compass | 2 | — | Buy up to 2 goods from trading partners for 1 Coin less each. | A magnetised needle pointing north, used at sea from the 1200s. Ships could hold a course under cloud and sail in winter. |
| Astrolabe | 2 | — | +2 Knowledge. Scout one opponent. | A brass instrument measuring the height of the sun or a star to find latitude and the time. Portuguese navigators used a simple sea version on Atlantic voyages. |
| Double-Entry Bookkeeping | 3 | — | +2 Coin. Your Coin cap is +2 until the end of the turn. | Every sum written twice, as debit and credit, so the books must balance. Italian merchants used it; Luca Pacioli wrote it down in 1494. |
| Corned Powder | 2 | — | Spend up to 2 Powder: +2 Attack each this turn. | Gunpowder wetted, pressed and broken into grains instead of left as dust. It burned faster and more evenly, and kept better. |

### Economy, Culture and emergencies

| Card | Claim | Play | Effect |
|---|---|---|---|
| Tithe | 2 | — | +2 Food, +1 Culture. |
| Market Day | 2 | — | Sell up to 3 goods this turn for 1 Coin more each. |
| Annual Fair | 3 | — | This turn, every trading partner counts as wanting every good. |
| Patronage | 2 | 2 Coin | +3 Culture. (`Culture.framework.md`: "A card may turn Coin into Culture".) |
| Pilgrimage | 2 | — | +1 Culture, +1 Coin. |
| Royal Charter | 3 | — | Remove up to 2 Unrest from your hand and discard pile. +1 Coin. |
| Herbalist | 1 | — | Remove 1 Sickness from your hand. +1 Food. |
| Forced Loan | 1 | — | +3 Coin. Add 1 Debt to your discard pile. |
| Clipped Coinage | 1 | — | +3 Coin. Add 1 Unrest to your discard pile. |

Forced Loan and Clipped Coinage are emergency plays in the spirit of Emergency Levy: help now, junk
later.

### Units

| Card | Claim | Play | Effect |
|---|---|---|---|
| Pike Square | 2 | 2 Food | Attack 1, Defense 4. |
| Arquebusiers | 3 | 1 Food, 1 Powder | Attack 3, Defense 2. |
| Free Company | 2 | 3 Coin | Attack 3, Defense 1. Removed after use. Mercenaries, paid in Coin instead of Food. |
| Outriders | 1 | 1 Food | Attack 1. Scout one opponent. |

**24 actions** in the stack.

## Action cards made by buildings

| Card | Made by | Play | Effect |
|---|---|---|---|
| Corvée | Manor (each turn, into hand) | — | +3 Production. |
| Men-at-Arms | Keep (each turn, into hand) | 2 Food | Unit. Attack 2, Defense 2. |
| Knight | Stables (each turn, into hand) | 2 Food, 1 Iron | Unit. Attack 4, Defense 1. |
| Longbowmen | Archery Butts (each turn, into hand) | 1 Food | Unit. Attack 1, Defense 3. |
| Cannon | Gun Foundry (each turn, into hand) | 1 Powder | Unit. Attack 5, Defense 0. |
| Hanseatic Convoy | Harbour (into deck when built) | 2 Coin, 1 Cloth | Venture. Two turns later: +5 Coin. |
| Caravel Voyage | Shipyard (into deck when built) | 3 Coin | Venture. Three turns later: +4 Coin, +2 Culture. |
| Festival | Parish Church (into deck when built) | — | +2 Culture. Remove 1 Unrest from your hand. |
| Disputation | University (into deck when built) | — | +2 Knowledge. Draw 1 card. |

Knights need Iron and cannon need Powder, so each army leans on a chain: iron for a knightly army,
powder and copper for guns.

## Strategic resources (claimed with Military, one copy each)

`framework.md` N6: "A strategic resource never has more than 1–2 copies in the game."

| Card | Claim | Needed by | While you hold it | In history |
|---|---|---|---|---|
| Destriers | Military 2 | — | Your Knights get +1 Attack. | The great warhorses of knights, bred for strength and trained for battle. A destrier cost many times an ordinary horse. |
| Silver | Military 2 | Mint | Coin cap +1. | The metal of European coinage. Mines at Kutná Hora, Freiberg and the Tyrol fed the mints; later Potosí in the Americas flooded Europe with it. |
| Copper | Military 2 | Gun Foundry | — | Mined at Falun in Sweden, in the Harz and in Slovakia. Mixed with tin it makes bronze, for bells and cannon. |
| Saltpetre | Military 2 | Powder Mill | — | Potassium nitrate, about three quarters of gunpowder. Scraped from cellars and stables or grown in nitre beds, later shipped in from India. |
| Alum | Military 1 | — | Your Cloth sells for 1 Coin more. | **Not aluminium:** a mineral salt that fixes dyes in cloth so the colour holds. Vital to fine cloth; from 1461 the Pope's mines at Tolfa held a near monopoly. |
| Marble | Military 1 | — | Your Wonders cost 2 Production less. | Fine stone for sculpture and grand buildings, above all from Carrara in Tuscany, where Michelangelo chose his blocks. |

## Technology stack (era 1: what came after 1600)

Claimed with Knowledge, about 3 in era 1 (`Technology.framework.md` open question 3: "roughly
3 / 5 / 7 / 9"). Researcher = who claimed it, with its card straight into hand. Spread = what
everyone else gets at the start of era 2. Follow-up = the Technology it lets into era 2's stack.

| Technology | Kind | Researcher | Spread | Follow-up | In history |
|---|---|---|---|---|---|
| Joint-Stock Company | Building | Prototype **Chartered Company** (Trade): your ventures return 1 more; each turn +1 Coin. | The same prototype | Stock Exchange | Companies owned by many shareholders who shared profit and risk, such as the English (1600) and Dutch (1602) East India Companies. Shares could be sold on. |
| Atmospheric Engine | Building | Prototype **Pumping Engine** (Industry): each of your buildings that makes Iron makes 1 more. | The same prototype | Watt Engine | Newcomen's steam engine (1712): steam condensed in a cylinder leaves a vacuum, and air pressure drives the piston. Built to pump water out of mines. |
| Coffeehouses | Building | Prototype **Coffeehouse** (Trade, Culture): each turn +1 Coin, +1 Culture. | The same prototype | Newspapers | From the 1650s, where merchants, scholars and newsmen met to talk and deal. Lloyd's insurance and London's stock exchange began in coffeehouses. |
| Flintlock and Bayonet | Abstract | Your units +1 Attack. Card: **Fusiliers** (Unit; pay 1 Food and 1 Powder: Attack 3, Defense 3). | A Fusiliers into the deck | Line Infantry | The flintlock fired with a spark from flint, surer than a burning match. The socket bayonet (about 1690) made every musket a pike and ended the pike square. |
| Telescope | Abstract | Each turn +1 Knowledge. Card: **Star Charts** (+2 Knowledge; scout one opponent). | A Star Charts into the deck | Royal Observatory | Made in the Netherlands in 1608; Galileo turned one on the sky in 1609–10 and found Jupiter's moons. Navies and armies soon used it too. |
| Turnips and Clover | Abstract | Your Agriculture buildings make +1 Food each turn. Card: **Clover Ley** (+4 Food). | A Clover Ley into the deck | Seed Drill | Fodder crops that replaced the fallow year (the Norfolk four-course rotation). Clover feeds the soil, turnips feed livestock through winter: more animals, more manure. |
| Canal Building | Infrastructure | Your town and outskirts surcharges are 1 lower. Card: **Barge Haul** (build one building this turn with no ring surcharge). | A Barge Haul into the deck | Canal Network | Canals with locks carried heavy goods cheaply inland. France's Canal du Midi (1681) and England's Bridgewater Canal (1761) opened the canal age. |

A spread copy is always a card, because `Technology.framework.md` T-N1 says "A Technology never takes a
building slot and never sits in a deck or hand": the Technology itself stays in the researcher's
display, and only its cards travel. The researcher keeps the extra rule on top (T-A4: "No player ever
gets a stronger version of a Technology than its researcher").

That's seven against a default of six (`Technology.framework.md` open question 1: "about 6 per era
stack").

## Wonders (era 1)

Production + Culture, both spent. If several players claim the same Wonder, the highest Culture
offer gets it. Points count only while it stands.

| Wonder | Tags | Cost | Pts | Effect | In history |
|---|---|---|---|---|---|
| Gothic Cathedral | Culture | 10 Production, 4 Culture | 7 | Each turn: +1 Culture, and remove 1 Unrest from your hand. | Vast churches of pointed arches, flying buttresses and stained glass, such as Chartres and Cologne. Built over generations, they drew pilgrims and trade. |
| Studium Generale | Science, Culture | 8 Production, 3 Culture | 5 | Each turn: +2 Knowledge. | The medieval name for a university open to students from everywhere, its degrees valid across Christendom. Bologna and Paris were the first. |
| Arsenal of Venice | Military, Industry | 10 Production, 3 Culture | 5 | Each turn: a **Galley** into your hand (Unit; pay 2 Food: Attack 3, Defense 2). | Venice's state shipyard, with thousands of workers building galleys from standard parts along a canal. At its peak it could finish a ship in a day. |
| Uraniborg | Science | 9 Production, 3 Culture | 5 | Each turn: +1 Knowledge. Modernization moves +1 each turn. | Tycho Brahe's observatory on the island of Hven (1576). Its huge instruments measured the stars more precisely than ever before, without a telescope. |
| Walled City | Military, State | 9 Production, 3 Culture | 5 | Your centre and town rings get +2 Defense. | A city ringed by full defences of walls, towers and gates, like Carcassonne or Ávila. Taking one meant a long siege. |
| Hanseatic Kontor | Trade | 8 Production, 3 Culture | 5 | Every trading partner counts as wanting Cloth. Coin cap +2. | The Hanseatic League's walled trading posts abroad, with their own laws: the Steelyard in London, Bryggen in Bergen, the Peterhof in Novgorod. |

That's six against a default of four (`Culture.framework.md` open question 2: "about 4 in each era's
Wonder stack").

## Junk

| Card | Comes from | Cleared by |
|---|---|---|
| Unrest | Emergency Levy, Clipped Coinage | Festival, Royal Charter, Hospital, Gothic Cathedral; or Burn |
| Sickness *(new)* | Not yet placed; meant for crowded towns and later events | Hospital, Herbalist; or Burn |
| Debt *(new)* | Forced Loan | Pay 2 Coin during planning; or Burn |

`CoreLoop.framework.md` C-N2: "Junk never does anything by itself." All three just sit in your hand.
Paying off Debt is your own action, like a Burn.

## What changes against today's sample cards

- **Replaced:** Farm, Workshop and Scholar become Labour, Harvest, Study and Open Fields. The sample
  Technologies (Printing Press, Crop Rotation, Gunpowder, Banking, Navigation, Astronomy) are era-1
  things, so they become the Printing House, Powder Mill, Counting House, Mariner's Compass and
  Uraniborg; the Technology stack is the list above.
- **Dropped as strategic resources:** Coal (a later era), Timber and Iron (now goods), Salt, Stone
  (Marble takes its role), Horses (now Destriers).
- **Dropped Wonders:** Great Library, Royal Palace and Citadel (replaced by the six above), and the
  Grand Canal (China's set).
