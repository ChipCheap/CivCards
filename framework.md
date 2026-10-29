# CivCards — Design Framework

## Intent

CivCards is a civilization-themed card game set at the turn from the late medieval era into modern times, running up to late industrialization. One card universe — the same names, artwork, roles and keywords — powers three modes:

1. **Engine Builder** *(first, primary)* — a simultaneous-turn multiplayer engine-builder / deckbuilder for 1–4 players, 30–60 minutes per game. Focused on economy and engine building, with several build paths that score in different ways. There is no hex map.
2. **Roguelike** *(later, not yet explored)* — a deckbuilder run in the spirit of Slay the Spire.
3. **Constructed** *(later)* — a CCG in the spirit of Hearthstone, where you build your deck before the match.

**The experience we're after** (inspired by Hexarchy): civilization play driven by cards, so you keep making decisions you'd never make in a classic civ game. Examples: giving up a card you'd want to build later because you badly need the resource *this* turn, or saving your civ with an emergency play that clogs your deck with junk you have to clear out later. It should be easy to learn, have enough depth (military and other threats create decisions that make or break a game), and fit in a compact session. The late game snowballs hard enough that a long game only adds 1–2 turns.

**Long-term audience:** free to play, online, with friends or solo against AI. Polish such as AI opponents comes at the end.

**What success looks like:**
- **Near term:** a low-effort online prototype where two people can play and sync cards we design, then throw away. Players track effects by hand. The goal is to find the game feel as early as possible.
- **Long term:** the game handles every effect itself. A typical Engine Builder game lasts about 13–16 turns and around 45 minutes.

## Scope

**In**
- The Engine Builder mode, designed first. The Roguelike and Constructed modes get their own frameworks later.
- One shared card identity per card across all modes, plus a shared set of core keywords.
- Simultaneous turns for 1–4 players, with AI filling empty seats or playing solo games.
- Asymmetric civilizations: different starter cards and focuses.
- A minimal per-player board: an ordered row of buildings. There is no shared map.
- A shared market with era-based stacks, a shared Modernization track, and military attack waves.
- Deck codes for sharing decks.
- An early, throwaway-friendly online prototype. It gets its own feature framework (`Prototyper.framework.md`).

**Out**
- Hexes, tiles and maps beyond the per-player building row.
- Population management (population is just a number, see Design).
- Adjacency effects of any kind.
- Real-time play.
- Matchmaking and ranked play.
- Monetization of any kind.
- Spectating (may come later).
- Progression and unlock systems (may come later, decided per mode).
- Scoring that changes depending on how the game ended (parked).

**Maybe later**
- Accounts to store decks (deck codes come first).
- Spectating.
- Progression.
- AI trained with a genetic algorithm.

## Design

### Modes and card identity
- Each card has **one identity** (name, art, role) used in every mode.
- **Rules text may differ by mode.** A card is written to work well in each mode rather than forced to do the same thing in all three.
- A **shared set of core keywords** means exactly the same thing in every mode.
- Card definitions are engine-independent data, so cards made for the prototype can move to the final engine.

### Turn structure (Engine Builder)
- All players plan and act **at the same time**. Each player can change their plan freely until they press **Ready**. The turn resolves once everyone is ready.
- The final game can have an optional lobby timer. When it runs out, unready players are auto-readied with their current plan. The prototype has no timer.
- Play is **open** within a turn. The only sealed part is Wonder bidding, if that version is kept (see Open questions).
- Once a turn starts resolving, it **never pauses for a player's decision**. Anything a player could choose during resolution is chosen beforehand, through the order of their building row or an automatic priority order.

### Card uses
A card in hand can be used in one of these ways:
- **Play:** use its effect. It goes to the discard pile and comes back later, like a normal deckbuilder.
- **Build:** place it permanently in your building row, where it produces from then on.
- **Pay:** spend it as payment for other cards. For example, a Heavy Sawmill costs 2 cards.
- **Burn:** give up the card for a one-time payoff and remove it from the game. The exact rules are open, starting from Hexarchy's version.

Some emergency effects add **junk cards** to your deck, which you later have to work to clear out. Cards claimed from the market go **into your deck** to be built later. The possible exception is Wonders (see Open questions).

### Resources
- **Cards:** the main currency.
- **Strategic resources** (such as Iron) are cards. There are **at most 1–2 copies** of each in a game. Some cards need a specific one (a Forge needs Iron).
- **Production / Workforce:** produced each turn by population, and doesn't carry over.
- **Food:** builds up from certain cards. Each time it crosses a threshold, population grows by +1. Food also mostly pays for military cards.
- **Population:** just a number that sets your workforce per turn. You never assign or manage it.
- **Knowledge:** a base amount every player gets from global Modernization, plus extra from certain buildings. It's spent in the Technology market, and it's assumed to be the same thing as "modernization tokens".
- **Military:** **Attack** and **Defense**. Some comes in each turn and some sits on buildings.
- There is no Gold and no Influence. That kind of value comes from cards.

### Market
There are four shared stacks. Each stack shows cards face-up, and a claimed card is replaced at the end of the turn.

| Stack | Claimed with | Notes |
|---|---|---|
| Strategic resources | Military | At most 1–2 copies of each in a game |
| Technology | Knowledge | Split by era; brings new cards into the game |
| Blueprints | Cards or Production | Split by era |
| Wonders | Very high cost | Bid, or claimed like other cards (open) |

- **Claims buy time; nobody bids.** You state a claim, pay for it, and get the card. If several players claim the same card in the same turn, **all of them get it**, and it leaves only after that turn. The tension comes from waiting: you hold off a turn to grow your economy and hope nobody takes the card first.
- The Technology and Blueprint stacks change when the era changes.

### Modernization, eras, end of game
- A shared **Modernization** track always moves forward. Some builds push it faster, some slow it down, and it can never be stopped.
- There are **3–4 eras**, from the late medieval period to late industrialization. An era begins the first time Modernization reaches its threshold, and it changes the market stacks.
- **The end is always announced.** Either everyone can see Modernization will cross the line this turn, or it has crossed and everyone plays one last turn. Scores are then counted.

### Scoring
- There is **one victory condition**: the most points when the game ends.
- Points come from achievements such as production per turn, certain buildings, technology progress and strategic resources.
- Players see only the **leaderboard order**: no exact scores, and no "far ahead" hint.
- Ties are broken by higher production per turn, then shared victory.

### Military and player interaction
- **Interaction:** players react to the visible claims in the market and to what scouting reveals. They take key cards before opponents can, and use military to slow down whoever is ahead.
- **Range:** each opponent's distance is hidden until you first scout it with at least one military unit.
- **Waves:** an attack is sent as a wave and arrives 1–4 turns later. It can't be recalled, and its units are used up.
- **On arrival:**
  - Each attacker's wave is checked **separately** against the defender's full Defense. Defense is a threshold, not a health bar, and it is checked when the wave arrives.
  - If Attack is not higher than Defense, nothing happens.
  - If Attack is higher, the leftover either **steals resources** for the attacker or **destroys buildings** whose Defense is lower than that leftover. Destroying gains the attacker little.
  - Targets are picked automatically from the defender's building-row order or priority settings. A player can put buildings up front as decoys that soak up hits.
  - The attacker sees a **snapshot of the defender's state** at the moment the wave arrives, like scouting in a real-time strategy game.
- **It should balance itself:** beating up a weaker player gains little. Leaders fight each other, and players behind catch up.

### Hidden information
- Opponents' builds are **hidden** by default.
- **Visible to all:** market claims, the leaderboard order, the Modernization track, and the last-turn warning.
- **Revealed by play:** an opponent's range (once scouted) and their state when your wave arrives.

### Civilizations
- **Asymmetric starts:** each civilization has different starter cards and a different focus. Scouting gives real strategic information.

### AI
- AI plays by exactly the same rules as humans, either rule-based or trained, possibly with a genetic algorithm. It fills empty seats, plays solo games, and stands in for disconnected players.

### Prototype (first deliverable)
- The first goal: two people can **play and sync cards online** from card designs we load from a folder, so we can try the game with a friend.
- **What it needs:**
  - Players track numbers by hand, with counters for the main resources (Production, Food, Population, Knowledge, Attack, Defense).
  - A free-text notes field.
  - Joining by game code.
  - Static hosting is fine (GitHub Pages or similar), and nobody does any network setup.
- **No rules enforcement** at first. Enforcement can be added step by step as mechanics settle.
- It's fine to lose the game state if the host leaves or refreshes. Other players can rejoin their seat as long as the host is still connected.
- The details live in `Prototyper.framework.md`.

## Edge cases

| Case | Decided behavior |
|---|---|
| Several players claim the same market card in one turn | All of them get it. It leaves the market after the turn and is replaced. |
| Several players claim the same strategic resource in one turn | All of them get a copy. Rare cards stay rare because each starts with only 1–2 copies. |
| Several Wonder bids tie for highest (if Wonders are bid for) | All tied players build the Wonder, with its points and effects. |
| Several waves arrive at one defender in the same turn | Each is checked separately against full Defense, so players can't team up to break a defense together. |
| Defense changes while a wave is on the way | Defense is checked when the wave arrives. |
| An attack would need a choice (what to steal, what to destroy) | Picked automatically from the defender's row order or priority settings. Nobody is asked. |
| A player is attacked over and over | No elimination. Only built buildings can be destroyed; the deck, hand and base workforce cannot. |
| Deck and discard are both empty | You draw nothing that turn. |
| Junk cards pile up | They slow you down, but they can never make you lose by themselves. |
| A strategic resource is gone and a build path needs it | You adapt into other resources and builds. Pricier options that skip the resource are possible but not a goal. |
| A market stack runs out | It stays empty. |
| Hand size | No limit. |
| Modernization will cross the line this turn | Everyone can see it; the turn finishes, then scores are counted. |
| Modernization has crossed the line | Everyone plays one last turn, then scores are counted. |
| Tied final score | Higher production per turn wins; if still tied, shared victory. |
| A player disconnects (prototype) | Their seat stays reserved while the host is connected, and they rejoin it. Losing the game when the host leaves is accepted. |
| A player disconnects (final game) | They rejoin the same seat. Until then, AI plays their turns. |
| A slow player (final game) | Optional lobby timer, after which they are auto-readied with their current plan. |
| A player is ready, then wants to change their plan | They can change it freely until the turn resolves. |

## Boundaries & invariants

Labelled **A** (Always) and **N** (Never) for citing.

**Always**
- **A1.** Every game ends. Modernization can be slowed but never stopped. Slowing effects add up to only a few turns.
- **A2.** All players act at the same time. Resolution never pauses to wait for a player's decision.
- **A3.** Every card keeps one identity (name, art, role) across all modes. A shared keyword means the same thing in every mode.
- **A4.** Card definitions are engine-independent data.
- **A5.** The game rules work without any UI. Every UI interaction calls exactly one game action, and the game can run entirely without a screen. Given the same starting shuffle (random seed) and the same player choices, it always produces the same result. This is needed for AI training, simulation, replays and rejoining.
- **A6.** Hidden information stays hidden: opponents' builds and exact scores. Only the leaderboard order, market claims, scouted range and wave-arrival snapshots are shown.
- **A7.** The final turn is always announced before it is played.
- **A8.** Every core rule works with 1–4 players, with AI in empty seats. No rule needs two or more humans.
- **A9.** Effect animations add at most a couple of minutes to a game, and they can always be sped up or skipped.

**Never**
- **N1.** No hexes, tiles, population assignment, adjacency effects or real-time play.
- **N2.** A market claim never fails because of what another player did. Wonders are the only possible exception (see Open questions).
- **N3.** A player is never eliminated or left unable to act.
- **N4.** The first prototype doesn't enforce rules. Enforcement is added step by step, never as an all-at-once requirement.
- **N5.** No monetization, including pay-to-win.
- **N6.** A strategic resource never has more than 1–2 copies in the game.

## Standards adopted

**Accepted**
- Change your plan freely until Ready; the turn resolves when everyone is ready; optional lobby timer with auto-ready (no timer in the prototype).
- A readable battle and turn log that explains every automatic resolution.
- A keyword glossary and tooltips, shared across modes.
- Settings to speed up or skip effect animations.
- Accessibility: resource icons that differ by shape *and* color, adjustable text size, and timers that can be switched off.
- Saving and resuming: solo games autosave every turn; multiplayer resumes by rejoining your seat.
- A guided tutorial game against AI (late polish).
- Lobby features: rematch, deck-code sharing, AI in empty seats.
- English first, with game text kept translatable.

**Rejected for now**
- Spectating (may come later).
- Progression and unlock systems (no gameplay-affecting unlocks in the Engine Builder; revisit per mode).

## Open questions

Each has a recommended default.

1. **How Wonders are claimed.**
   - (A) **Sealed bid.** The winner pays and builds. Losers get their bid back, but their turn is spent. Tied highest bidders all build the Wonder.
   - (B) **Claimed like other cards, but very expensive**, and it takes effect **immediately** instead of going into your deck.

   *Default: playtest both by hand in the prototype. Lean towards (B)*, because it keeps "a claim never fails" true without exceptions and is simpler to explain. (A) creates a unique gamble.
2. **Exact Burn rules.** *Default: start from Hexarchy's Burn and adjust in playtests.*
3. **Who chooses between stealing and destroying.** *Default: the attacker sets the wave's goal (steal or destroy) when sending it. Targets are still picked automatically on the defender's side.*
4. **How Modernization moves and where the era thresholds are.** *Default: a fixed amount each turn, plus pushing and slowing effects. Thresholds get tuned so eras change roughly every 4–5 turns.*
5. **Are Knowledge and "modernization tokens" the same resource?** *Default: yes.*
6. **Game-length target.** *Default: aim for 13–16 turns (roughly 10–18 at the extremes). It's a goal, not a hard rule.*
7. **Make attacking the leader pay off.** *Default: write it down as a design goal checked in playtests (for example, plunder grows with the defender's wealth), not as a strict rule.*
8. **Pricier options that skip a strategic resource.** *Default: not a goal. Revisit only if lockouts feel bad in playtests.*
9. **Civilization list and starter decks.** *Default: begin with 2 contrasting civs in the prototype, sharing the same base starter deck plus a few unique cards each.*
10. **AI approach.** *Default: rule-based AI first. The headless, deterministic rules (A5: "The game rules work without any UI") keep trained or genetic-algorithm AI possible later.*
11. **Hidden information in the final game.** Because builds are hidden, the final game must not send a player's hidden state to other players' machines. *Default: the prototype is exempt (it trusts players). The architect decides how the final game guarantees this.*
12. **Roguelike and Constructed modes.** *Default: explore each in its own framework once the Engine Builder's core loop feels right in the prototype.*
13. **Accounts, spectating, progression.** *Default: out until after the Engine Builder is playable end to end.*
