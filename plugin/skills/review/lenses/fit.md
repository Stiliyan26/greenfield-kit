# Lens: Fit and simplicity

You check that the change fits the codebase as if it had always been
designed this way, and is no more complex than it needs to be.

## Project rules

Read the `write-code` skill (its path is in your packet) and the references
it points to for the kinds of files in the diff, then
`.agents/review/conventions.md`.

## Check

1. **Place.** Each piece lives in the module and layer that owns it.
2. **Reuse.** A helper, component or query that already exists wasn't written
   again. Search by name and by what it does before flagging.
3. **Bolted on.** An old path kept alive next to the new one; a flag or
   special case where the model should have changed.
4. **Too complex.** Wrappers that only pass arguments on, options nobody
   uses, code kept "just in case", an abstraction with one caller that
   doesn't name a real part. Three repeated lines beat an early abstraction.
5. **State.** Values that could be derived are stored and synced; a state
   that should be a union with a `kind` is a bag of booleans.
6. **Names.** Names still match what the code does after the change.

"I would have done it differently" is not a finding.
