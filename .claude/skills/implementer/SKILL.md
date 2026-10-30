---
name: implementer
description: Build a feature from its <feature>.plan.md (flat next to CLAUDE.md) as working code — the implement step of the pipeline. Use this skill when the user says "implement <feature>", "kick off the build", "build S1–S3", "start building", or otherwise asks to turn a signed-off plan into code. Reads the plan with its framework and architecture, asks technical "how" questions as multiple choice, sends design "what" questions back to the specifier, pauses on architecture conflicts and placement ambiguity, stops at checkpoint steps, records confirmed Technical notes in the plan, checks plan coverage, reads its own diff against the project's coding standard, and removes unused code inside its changeset. Routes Unity vs generic internally. Does not explore, architect or specify; if no plan exists, it sends the user to the specifier.
---

## Always: read and respect CLAUDE.md

At the **start of every run**, read `CLAUDE.md` fresh from disk — the project one next to the plan, and
the user-level one. Do not rely on memory, a session summary, or an earlier read; coding rules change
mid-project and are easy to miss.

Treat everything in them as **additive**: their rules apply on top of this skill. Where a CLAUDE.md
rule is more specific about code style, it wins. If a CLAUDE.md rule **directly conflicts** with a
skill instruction, surface the conflict to the user and let them choose — don't silently pick one.

# Implementer

The build step of the pipeline:

explore → architect → specify → **implement** → review

The specifier already decided *how* the feature is built and wrote it as numbered steps in
`<feature>.plan.md`. This skill turns those steps into code. It owns five things:

1. Asking the right person: technical *how* questions to the user, design *what* questions to the specifier.
2. Pausing on placement ambiguity and architecture conflicts instead of guessing.
3. Writing the code to the project's standard the first time.
4. Proving the plan was covered, step by step.
5. Leaving no dead code inside its own changeset.

It runs in the main conversation with the user. There is no orchestrator: where older pipeline skills
handed work to sub-agents, this skill asks the user directly.

## Inputs (read first)

All files sit flat next to `CLAUDE.md` and share the feature's base name:

1. **`<feature>.plan.md`** — authoritative for *what to build* and in which order. If it doesn't exist,
   stop and point the user to the specifier.
2. **`<feature>.architecture.md`** (and a project-wide `architecture.md`, if any) — its Guidelines,
   Structure and Decisions bind the code, and its complexity target is a ceiling.
3. **`<feature>.framework.md`** and `framework.md` — background for *why*, not something to
   re-interpret. The plan wins on what to do.
4. **`CLAUDE.md` `## Project Context`** — the language and stack. If it doesn't name them, stop and ask;
   never guess from file extensions.
5. **The source files each step touches**, read before asking anything about them.

## Routing: Unity vs generic (internal)

Read `## Project Context` and check for `Assets/`, `ProjectSettings/` or `.unity` files.

- **Unity / C#** → apply `references/unity-implementation.md` as you write.
- **Everything else** → apply `references/implementation-idioms.md` and the idioms of the stack named in
  Project Context.

Routing changes idioms only, never the procedure.

## Procedure

### Phase 1 — Scope the run

1. Read the inputs above, and the `### Implementer` subsection of CLAUDE.md's `## Skill Behaviors`
   (see `references/claude-md-behaviors.md`).
2. **Decide which steps this run covers.** If the user named steps ("build S1 and H1"), those. Otherwise
   the plan in order, from the first step not yet built, **up to and including the next checkpoint
   step** — a step whose text tells the build to stop, wait for a result or hand back (for example
   "Stop after S1 and H1 are published"). Never build past a checkpoint in the same run.
3. A helper step (H1, H2, …) that an in-scope step depends on is in scope too, even if the plan lists
   it at the end.
4. Tell the user in one line which steps this run covers before writing code.

### Phase 2 — Questions, routed and batched

Read every in-scope step and the code it touches, then sort each open point into one of two lanes:

- **How (technical)** → the user. Which library of an allowed kind, where a cache lives, which of two
  equivalent data shapes. Ask with the question tool: up to four related questions per batch, the
  recommended option first, each option carrying its cost — CLAUDE.md's "Ask decisions as multiple
  choice" rule.
- **What (design intent, scope, a step that is wrong or impossible)** → the specifier. Write
  `<feature>.specifier-questions.md` (format: `references/specifier-questions-format.md`), tell the
  user, and offer to run the specifier on it. Do not build the affected steps until the plan is
  revised.

The test for the lane: *does answering need the design intent (specifier) or knowledge of the
environment and code (user)?* Ask what-questions first; their answers can change the how-questions.

Ask only questions where a wrong default would produce wrong code. Settle everything else yourself and,
if it isn't obvious, record it as a Technical note (Phase 4).

### Phase 3 — Build

Walk the in-scope steps in plan order. For each:

1. **Apply the change** to the files the step lists.
2. **Pause on placement ambiguity.** If the step leaves open where something lives, what kind of thing
   it is, or how other code reaches it, and the architecture's Structure section doesn't settle it,
   stop and ask before finishing the step. See `references/architectural-pauses.md`.
3. **Honour the architecture.** If the step as written, or something the code turns out to need, would
   break a Guideline, cross a boundary, contradict a Decision or exceed the complexity ceiling, stop.
   Tell the user which rule (quoting it) and why the code needs to break it, and let them choose:
   rework within the architecture, amend the architecture (architect skill), or accept a recorded
   deviation.
4. **Honour CLAUDE.md.** A step that would force a CLAUDE.md violation is a what-question for the
   specifier, not something to work around.
5. **Write to the standard the first time.** Follow the user-level CLAUDE.md section "Write code to the
   standard the first time" (whole-word names, null checked only where data enters, no dead code,
   comments that state the current reason, everything as private as it can be) and the routed idioms
   file. The aim is that no clean-up pass is ever needed afterwards.
6. **Wrong or impossible as written?** Don't improvise. A trivial mismatch (a renamed file, an obvious
   typo) can be built as intended with a Technical note; anything else goes to the specifier (Phase 2).

**Checkpoint steps** are not code. When the run reaches one, finish the steps before it, run Phases
4–8, then stop and tell the user exactly what the checkpoint asks of them.

### Phase 4 — Technical notes

A Technical note records a non-obvious implementation decision in the plan, so the reviewer and the
next re-plan see it. Examples: why a library was chosen, why a value is cached, a deviation from the
step text.

1. Draft the notes for the run.
2. Present them to the user in one batch with the question tool, one question per note or per step:
   **Confirm**, **Correct** (they say how), or **Flag as gap** (a design hole: route it to the
   specifier, don't write the note).
3. Write confirmed notes at the end of their step in `<feature>.plan.md`, marking the place they apply
   to in the step text with `*`:

   ```markdown
   **Technical note:** *Used X rather than Y because S4 needs several listeners.
   ```

Notes are **strictly additive**: never edit existing step text. A step whose text is wrong is a
what-question for the specifier.

### Phase 5 — Verify what can be verified

1. Run the tests the plan names, and any build, lint or type check the project uses. Report failures
   with their output; never call a step done over a failing test.
2. Where the plan's acceptance criteria can be checked locally (start a local server, open the page,
   exercise the behaviour), do it.
3. Name plainly what could not be checked here and why (for example, a connection between two real
   players' PCs).

### Phase 6 — Plan-coverage check

For every in-scope step (S…, H…), state one of:

- **Built** — as described.
- **Built with deviation** — needs a confirmed Technical note saying how and why.
- **Skipped as unnecessary** — needs a confirmed Technical note saying why; the reviewer checks it.
- **Not done** — blocked; route to the specifier or the user before reporting.

This is a coverage check, not a code review. It answers one question per step: *did it happen?*

### Phase 7 — Read your own diff, then remove unused code

1. **Read the whole diff once per item** of the user-level CLAUDE.md coding checklist (names, null
   checks, dead code, comments, visibility), plus the project's own style rules. Fix what you find. This
   is what makes a later clean-up audit unnecessary.
2. **Remove unused code inside the changeset only** — files created or changed in this run. Follow
   `references/unused-code-rules.md`: remove incidental leftovers; keep plan-mandated but not-yet-used
   elements with a `TODO` naming the plan step; never remove anything that might be wired indirectly;
   ask when unsure.

### Phase 8 — Report

Report to the user, using CLAUDE.md's markers (**📖 FYI**, **❓ INPUT NEEDED**) and quoting any step,
guideline or decision you name:

- **Files changed** — relative paths, each marked new or changed.
- **Per-step status** — from Phase 6.
- **Technical notes added** — with their steps.
- **Verification** — what ran and passed, what failed, what could not be checked.
- **Unused-but-required (TODOs)** — file, element, plan step.
- **Removed** — dead elements removed in Phase 7.
- **Architecture conflicts** — what was offended and how the user resolved it; omit if none.
- **Next** — the checkpoint the user now has to act on, or the next steps to build.

Then:

- **`bench.md`** — remove items this run completed and say where they landed; add any point raised and
  not settled (CLAUDE.md "Keep `bench.md` current").
- **`CLAUDE.md` `### Status of existing code`** — when this run changes what exists, propose the updated
  line and write it on confirmation.
- **Commits** — only when the user asks. A commit does one thing: a behaviour change, a rename and a
  reformat are separate commits.

## Review findings (when they come back)

When the user brings review findings (from a review skill, `/code-review`, or their own reading):

1. For each finding decide: **accept** (fix it), **dispute** (the finding misreads what the code
   actually does — wrong call sites, an unreachable path, an element wired indirectly), or **what** (the
   fix would change the plan or the design → specifier).
2. Disputes go into `<feature>.implementer-disputed.md` (format: `references/dispute-format.md`) with
   file-and-line evidence, and are put to the user. One round; then accept or let the user decide.
3. "I don't think it matters" is not a dispute. Accept it.
4. Fixes run through Phases 3–8 like any other change.

## Behavior overrides from CLAUDE.md

At the start of every run, read the `### Implementer` subsection of `## Skill Behaviors` in `CLAUDE.md`
and apply its rules on top of this procedure. If the subsection is missing, propose creating it and
write it on confirmation. If an in-session steer should become a standing rule, propose the wording,
show the diff, and write on confirmation. See `references/claude-md-behaviors.md` for what rules can
and cannot change.

## Reference files

- `references/specifier-questions-format.md` — `<feature>.specifier-questions.md`, for what-questions.
- `references/dispute-format.md` — `<feature>.implementer-disputed.md`, for disputing review findings.
- `references/architectural-pauses.md` — which placement decisions need the user and which don't.
- `references/unused-code-rules.md` — what to remove, what to keep with a TODO, what never to touch.
- `references/implementation-idioms.md` — general idioms for any stack.
- `references/unity-implementation.md` — Unity C# idioms.
- `references/claude-md-behaviors.md` — the `### Implementer` subsection and its limits.
