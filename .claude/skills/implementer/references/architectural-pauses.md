# Architectural Pauses

When to stop building and ask the user, and when to just decide.

The point of pausing: placement decisions cascade. A wrong call early ripples into every later step.

## Check the architecture first

Before pausing, read `<feature>.architecture.md` (and `architecture.md`): its **Structure** section
names the modules and what each owns, and its **Guidelines** say what may depend on what. If they answer
the question, follow them and don't ask. Pause only when they don't.

## What needs a pause

Decisions whose wrong answer spreads beyond the current step:

1. **Where a new module or top-level type lives**, when the plan and the architecture don't say.
2. **What kind of thing it is**, where the project has several kinds: module function vs object with
   state; long-lived vs per-use; synchronous vs asynchronous; part of the core vs part of the screen.
3. **How existing code reaches it**: direct import, passed in, looked up in a registry, sent as an
   event or message.
4. **The shape of a new public interface** whose signatures the plan leaves open, when every caller
   would depend on the choice.
5. **Extending an existing module vs creating a new one**, when module size and responsibility rules
   make it a real choice.
6. **A type that straddles a boundary** the architecture draws (core and screen, host and guest,
   game logic and network): which side owns it.
7. **Anything that fixes a data format** others will rely on — saved files, network messages, file
   formats users edit — unless the plan states the format exactly.

## What does not need a pause

Decisions that stay inside one file or function. Decide, and record a Technical note if the choice isn't
obvious:

- Local names and scoping.
- Whether a helper is private to its module.
- The shape of data a function owns from start to end.
- Loop constructs, local error-handling style, other purely local idioms.
- Splitting a long function into private helpers.

**Test:** if the user would have to look beyond one file to predict the consequences, pause.

## How to pause

1. **Stop.** Don't finish the step "for now" and come back.
2. **Collect every related placement question** in the rest of the in-scope steps, so they're answered
   together.
3. **Ask with the question tool**, up to four per batch. For each: the step it concerns, 2–3 options
   with their costs, and the option you would pick, listed first and marked as recommended.
4. **Wait.** Don't build around the question and patch it later.
5. Record the answer as a Technical note (confirmed with the user in Phase 4), then continue.
