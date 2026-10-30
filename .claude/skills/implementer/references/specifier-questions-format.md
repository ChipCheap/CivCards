# `<feature>.specifier-questions.md` Format

When the implementer hits a question about *what* to build rather than *how* — design intent, scope, or
a plan step that is wrong or impossible as written — it writes `<feature>.specifier-questions.md`, flat
next to `CLAUDE.md`, tells the user, and offers to run the specifier on it. The specifier answers by
revising the plan (see its "Re-planning" section).

The file is short-lived: delete it once the plan has been revised and the implementer has accepted the
revision.

## When to use this file

Use it when the answer needs the design intent:

- "S3 says fire an event when the data refreshes. Does 'refresh' mean newly fetched data only, or also
  stale data replaced from a cache?"
- "S5 calls for saving, but neither the plan nor the framework says what persists."
- "S4 says make this a singleton, but CLAUDE.md forbids singletons. Is the step wrong?"
- "S2 changes `UserView`, which doesn't exist. Missing step, rename or typo?"

Do **not** use it for:

- Technical choices the user can answer (which allowed library, where a cache lives) — ask the user.
- Bugs — that's a review.
- Style — CLAUDE.md decides; where it is silent, follow the conventions of the stack in Project Context.

## Format

```markdown
# Specifier Questions: <feature>

**Plan under discussion:** <feature>.plan.md (current)
**Raised during:** <Phase 2 | Phase 3 | Phase 6>

## Question 1

**Plan reference:** <step ID, e.g. S3>
**Plan text (verbatim):**
> <the relevant line(s) from the plan>

**Why this is a design question, not a technical one:**
<1–2 sentences: why the implementer can't answer it without the design intent or scope>

**What the implementer needs to know:**
<the concrete question, answerable directly>

**Candidate answers:**
<2–3 interpretations to pick from, or "none — please specify">

## Question 2

<same structure>

## Build status

<one of:>
- "Nothing has been built for the affected steps."
- "S1 and S2 are built; the questions above block S3 and S5."
- "Everything is built except the items above, which need a plan revision first."
```

## After the specifier responds

The specifier revises `<feature>.plan.md` (versioning the old one as `<feature>.plan.v<N>.md`). The
implementer re-reads the plan and continues. One round: if a question is still open after it, the user
decides.

## Cleanup

Delete the file once every question is resolved. It must not survive into the next build run.
