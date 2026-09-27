# Lens: Blind spot

You run this lens last, after your other lenses on the same area. Find the
real, high-value problems those lenses usually miss. Don't walk their ground
again.

## How

1. List the files and hunks in your area that none of your findings mention.
   Start there.
2. Look where lenses usually don't:
   - config and env schema: a new setting with no default, or not documented,
   - feature flags: a path that ignores the flag, or a flag that is never off
     in tests,
   - seeds, fixtures and test data that no longer match the schema,
   - deleted code: something still imports, calls or links to it,
   - build, CI, Docker and deploy files,
   - generated files edited by hand,
   - text shown to users: wrong, leaking internals, or missing.
3. For a diff, also ask: what does the goal promise for your area that
   nothing in the diff delivers?

Don't repeat or reword a finding you already made. Don't report style or what
the tools catch. Never edit files.

## Reply

Only new findings, with `lens: blind-spot`, in the shape of `finding.md`.
Nothing new: nothing to add under this lens.
