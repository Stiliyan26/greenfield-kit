# Tool checks for review

Tools run before any agent. If a tool can catch a problem, no agent reports it.
All of these go into the project's gate command (for example `npm run gates`)
and fail CI.

Old code usually breaks the new limits in many places. Freeze what's there in
a baseline, so only new problems fail, and shrink the baseline over time. Never
turn a rule into a warning to get green.

| Check | Tool | Limit | Baseline |
| --- | --- | --- | --- |
| File too long | ESLint `max-lines` | 450 (skip blanks, comments) | `eslint-suppressions.json` |
| Function too long | ESLint `max-lines-per-function` | 60; 120 for components (`.tsx`) | same |
| Nesting too deep | ESLint `max-depth` | 2 | same |
| Too many branches | ESLint `complexity` | 10 | same |
| Circular imports | dependency-cruiser `no-circular` | runtime cycles | fix, or `--ignore-known` |
| Folder layers | dependency-cruiser | `app → pages → features → entities → shared`; other slices through `index.ts` | same |
| Copied code | jscpd | 10 lines / 70 tokens | `scripts/gates/baseline.json` |
| Dead code | knip | unused files, exports, packages | same |

`write-code`'s `bun run check` already has `max-lines`, `max-depth`,
`import/no-cycle`, the layer direction and knip. Add the rest.

## Set it up (Node project)

1. **ESLint limits.** Add to each package's ESLint config (tests off):

   ```js
   {
     files: ['**/*.{ts,tsx}'],
     rules: {
       'max-lines': ['error', { max: 450, skipBlankLines: true, skipComments: true }],
       'max-lines-per-function': ['error', { max: 60, skipBlankLines: true, skipComments: true }],
       'max-depth': ['error', 2],
       complexity: ['error', 10],
     },
   },
   { files: ['**/*.tsx'], rules: { 'max-lines-per-function': ['error', { max: 120, skipBlankLines: true, skipComments: true }] } },
   { files: ['**/*.{test,spec}.{ts,tsx}'], rules: { 'max-lines': 'off', 'max-lines-per-function': 'off', 'max-depth': 'off', complexity: 'off' } },
   ```

   Then freeze today's violations (ESLint 9.24 or newer):

   ```
   npx eslint <src> --suppress-all
   ```

   Commit `eslint-suppressions.json`. When you fix old code, run
   `npx eslint <src> --prune-suppressions`.

2. **Import rules.** `npm install -D dependency-cruiser`, copy
   [dependency-cruiser.frontend.cjs](../assets/gates/dependency-cruiser.frontend.cjs)
   or [dependency-cruiser.backend.cjs](../assets/gates/dependency-cruiser.backend.cjs)
   to `.dependency-cruiser.cjs`, point `tsConfig` at the right file, and add a
   `"deps": "depcruise src"` script.
   - Cycles made only of `import type` are allowed; they vanish at runtime.
   - On the backend, entity ↔ entity relations are allowed; ORMs resolve them
     lazily. Measure before adding a "modules only through index.ts" rule: in
     an ORM codebase, entities and enums are usually imported directly, and
     the rule would only add noise.
   - Check a rule works: add an import that breaks it, run `deps`, see it
     fail, remove it.

3. **Copied and dead code.** `npm install -D jscpd knip` in each package,
   copy [baseline.mjs](../assets/gates/baseline.mjs) to
   `scripts/gates/baseline.mjs`, set `PACKAGES`, then:

   ```
   node scripts/gates/baseline.mjs --update   # once, and commit baseline.json
   node scripts/gates/baseline.mjs            # in the gate command
   ```

4. **Gate command.** Add the new checks to the project's gate script and to
   CI. Run it once on a clean checkout: it must pass before anything else
   changes.

5. **Write it down.** Put the gate command in `CLAUDE.md` → Commands,
   so the review skill can run it.
