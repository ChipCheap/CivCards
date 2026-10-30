# CLAUDE.md Behaviors — Implementer Notes

The shared mechanism is in the specifier skill's `references/claude-md-behavior-section.md`. This file
covers what is specific to the implementer.

## Subsection

`### Implementer` under `## Skill Behaviors` in the project's `CLAUDE.md`. Read at the start of every
run, before Phase 1.

## Kinds of rules that belong here

- **Removal caution:** "Never remove functions in `prototype/js/screen/` that are named `on…`; they are
  attached as DOM handlers by name."
- **Removal permission:** "Unreferenced files under `tests/` may be removed without asking."
- **Preferred idioms:** "Prefer `async`/`await` over promise chains."
- **Mandatory Technical notes:** "Always add a Technical note when a network message format changes."
- **Extra pause triggers:** "Always pause before adding a third-party library."
- **Forbidden APIs:** "No `console.log` left in committed code."

## Limits rules cannot change

- Removal stays inside the changeset. No rule can authorize removing code outside it.
- The indirect-call cautions in `unused-code-rules.md` can be added to, never reduced.
- Technical notes are always confirmed by the user before they are written into the plan.
- Placement pauses stay the implementer's judgement. Rules can add triggers ("always pause for X"),
  never remove them ("never pause for Y").
- The user-level CLAUDE.md coding standard ("Write code to the standard the first time") applies;
  a project rule can make it stricter or more specific, not switch it off.

If a rule tries to override one of these, raise it with the user at startup.
