# Unused Code Rules

What to remove, what to keep with a TODO, and what never to touch — plus the caution that keeps the
implementer from removing code the runtime calls in ways a reader can't see.

## Scope (strict)

**Only the changeset**: files created or changed in this build run. Everything else is off-limits, however
dead it looks; it belongs to another run. Reading or opening a file does not put it in scope.

## Decision tree

For each element inside the changeset that looks unused:

```
1. Could it be called indirectly (framework, reflection, serializer, event registered by name,
   lifecycle hook, test discovery)?
   → YES: leave it. No removal, no TODO.

2. Is it required by an interface or contract, even with an empty body?
   → YES: keep it. TODO if the body is empty.

3. Did the plan introduce it?
   → Used in this run: not unused. Skip.
   → For a later step: keep it, add a TODO naming the step, list it under
     "Unused-but-required" in the report.

4. Incidental (neither plan-mandated nor indirectly called) and genuinely unused?
   → Remove it. List it under "Removed" in the report.

5. Can't tell?
   → Ask the user. Don't remove, don't TODO on your own.
```

## Indirect calls a reader can miss

Don't remove anything that might be reached through one of these without checking it isn't:

- **Decorators and annotations** that register the element (routes, listeners, test cases, DI providers).
- **Reflection or lookup by name** (methods called by string, members enumerated by name, conventional
  method names a framework looks for).
- **Dependency injection** — constructors the container calls.
- **Serialization and wire formats** — fields read or written by name (JSON, CSV columns, network
  messages, saved files, Unity serialized fields). Removing one silently breaks the format.
- **Code generators** and their inputs.
- **Event, message and DOM handlers** dispatched by lookup (including handlers attached through HTML
  attributes or registered by event name).
- **Framework lifecycle hooks** (Unity `Awake`/`OnEnable`, custom element callbacks, plugin `init`).
- **Test discovery** by name pattern or attribute.

Anything public, decorated, conventionally named or attached to a framework type: ask before removing.
Leaving an unused element costs little; breaking indirect wiring shows up only at runtime.

Project-specific patterns of this kind live in CLAUDE.md's `### Implementer` subsection; read them at
startup and add them to this list.

## TODO format

For elements kept but not yet used, in the language's comment syntax:

```
// TODO: <reason> — see <feature>.plan.md <step ID>
```

Examples:

- `// TODO: Called once S9 adds the guest side — see Prototyper.plan.md S9`
- `// TODO: Required by the transport contract; body comes in S9 — see Prototyper.plan.md S9`

Every TODO names a plan step or an "Out of scope" item, so the reviewer and the user can check it.

## Report sections

**Removed** — each element removed:

```
- prototype/js/core.js :: unused helper cloneStack()
```

**Unused-but-required (TODOs)** — each element kept with a TODO:

```
- prototype/js/session.js :: handleGuestHello() — Prototyper.plan.md S8
```

The user must be able to search for `TODO:` and match each hit to this list.

## Never

- Remove anything outside the changeset.
- Remove a public element that might be called indirectly, without asking.
- Remove fields used by serializers, file formats or network messages.
- Remove lifecycle or hook methods, even with empty bodies.
- "Soft-remove" with a deprecation marker. It is keep-with-TODO or remove; nothing in between.
