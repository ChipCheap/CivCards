---
name: card-brainstorm
description: >
  Run one round of card brainstorming for CivCards: present the next three inventions,
  Technologies or buildings from the queue in card_authoring.md, each with what it was in real
  life, what followed from it, the field it belongs to and the archetypes it could feed, plus a few
  suggested effects. Then work the user's thoughts into decided effects, write them into the card
  files and record them in card_authoring.md. Use when the user says "next card round",
  "brainstorm cards", "let's do card effects", "continue the card brainstorm" or invokes
  /card-brainstorm. Not for exploring a whole feature (that is the explorer) or for changing the
  prototype's code.
---

# Card brainstorm

One round turns three historical things into cards. The user is the authority on what is fun; this
skill brings the history, the context and the options, then writes down what the user decides.

## At the start of every round

Read fresh from disk, every time:

- `CLAUDE.md` — its working rules apply throughout, above all **quote every rule you cite** and the
  🔍 REVIEW / ❓ INPUT NEEDED / 📖 FYI markers.
- `card_authoring.md` — the queue, the archetypes, the fields, the mechanics vocabulary and the card
  log. It is the memory of this skill.
- `framework.md`, `CoreLoop.framework.md`, `Technology.framework.md`, `Culture.framework.md` — the
  rules every effect must stay inside.
- `Era1.cards.md` (and later eras' card lists) — the current draft of each card.
- `History.research.md` — the historical source, especially "Chains worth building cards around".

## 1. Present the round

Take the next round from the **Queue** in `card_authoring.md`. Present each of the three cards in
this shape, short enough to read in one sitting:

- **Name** — kind (invention action card, building, Technology), era, field.
- **In real life:** what it was and what it did, two or three sentences.
- **What followed:** the rough chain of consequences, direct and further, in the way glass led to
  glassware and then to better chemistry. Name the later cards or eras it leads to when they exist.
- **Field and archetypes:** which field it was used in, and which archetypes in `card_authoring.md`
  it could serve.
- **Today's draft:** the effect it has in the card list now, if any, quoted.
- **Suggestions:** two or three effect ideas, each one line, saying which mechanics from the
  vocabulary it uses. Mark them as suggestions; the user decides.

End the round with what connects the three (a chain, a shared resource, a tension between them).
Do not decide effects before the user has answered.

## 2. Work through the user's thoughts

The user writes thoughts, sometimes questions. For each card:

- Answer questions directly, with history where it helps.
- Push back where an idea breaks a framework rule, makes a strictly-better card, or makes a dead
  card. Quote the rule.
- Put real decisions as multiple choice (the question tool), recommended option first, at most four
  questions at a time.
- Numbers are first guesses; say so, and compare with the base cards (Labour makes 3 Production,
  Harvest 2 Food).

## 3. Write down what is decided

When the user settles a card:

1. **The card list** (`Era1.cards.md` or the era's file): the effect, prices and any made cards or
   follow-ups.
2. **The prototype files** (`prototype/cards/cards.csv`, `stacks.csv`) when the card is, or should
   be, in the prototype: follow `prototype/cards/README.md` for the columns.
3. **Follow-ups:** a made card, a spread copy or a follow-up Technology that the effect creates gets
   its own row too, and goes into the queue if it needs its own round.
4. **`card_authoring.md`:** a card-log entry (decision, reason, archetype), any new mechanic in the
   vocabulary, and any change to an archetype's description.
5. **`bench.md`:** anything raised and not settled goes to Open, as `CLAUDE.md` requires.

Commit only when the user asks, following the git folding rule in memory.

## Keep in mind

- One round, three cards. Don't run ahead into the next round unasked.
- The history serves play: when history and fun disagree, say what the history was and let the user
  choose.
- An effect that only one archetype wants is fine; an effect every archetype wants is suspect.
