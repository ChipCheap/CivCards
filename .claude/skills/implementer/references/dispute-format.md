# `<feature>.implementer-disputed.md` Format

When the implementer believes a review finding misreads *what the code actually does*, it writes
`<feature>.implementer-disputed.md`, flat next to `CLAUDE.md`, and puts it to the user (and, when a
review skill produced the finding, to that skill for one answer round).

The file is short-lived: delete it once the disputes are settled.

## When to dispute and when to accept

The implementer's standing is narrow: **what the code actually does.**

Legitimate disputes:

- The finding misreads a method's callers ("it says it runs every frame; it only runs from the
  pick-up event").
- The finding calls something unused that is wired indirectly (a decorator, a serializer, an event
  registered by name).
- The finding describes a path that can't be reached.
- The finding says the code does X when it demonstrably does Y.

Not disputes:

- "The fix would change the plan." → a what-question for the specifier.
- "This conflicts with the framework." → a what-question for the specifier.
- "I don't think this matters." → accept the finding.
- "I prefer another style." → CLAUDE.md decides; if it is silent, accept the finding.

When in doubt, accept. Disputes cost a round trip.

## Format

```markdown
# Implementer-Disputed Findings: <feature>

**Plan under discussion:** <feature>.plan.md (current)

## Dispute 1

**Finding (verbatim):**
<the full finding: ID, location, root cause, effect, suggested fix>

**Implementer's position:**
<2–4 sentences: what the code actually does, with file:line references. Mechanics only.>

**Evidence:**
- File and line: <path:line>
- Callers: <each with path:line>, or wiring source: <where and how it is registered>

**What to verify:**
<one concrete question, e.g. "Is the caller list at screen/input.js:88 complete?">

## Dispute 2

<same structure>
```

## Resolution

- **Conceded** → the finding is dropped.
- **Held, with new detail** → accept the finding.
- **Held, without movement** → the user decides.

One round only. Delete the file once every dispute is settled.
