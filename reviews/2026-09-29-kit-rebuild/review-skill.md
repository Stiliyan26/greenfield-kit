# Review: review-skill · 2026-09-29

The `review` skill leads one reviewer per feature. It collects the target with `scripts/triage.mjs`, and reviewers prove problems and write `reviews/<date>-<target>/<feature>.md`. The user ticks, fix agents fix in worktrees, and the reviewer closes. It is used by the lead at every greenfield-mode stage and by feature agents before they report done. Files reviewed: 9 (SKILL.md, references/{checklist,config,project-rules,report,triage,tools}.md, scripts/triage.mjs, assets/project-rules/triage.json, agents/code-reviewer.md), about 1,400 changed lines. Ran: nothing. This reviewer ran on the old read-only agent definition (no shell), so every proof below is file:lines. HRise paths were read with Glob.

<a id="p300"></a>
## 300. Fix agents start from a copy with no ticks, and merging their branches collides with the user's unsaved ticks · Critical

**Context.** Step 5 commits the review folder. Step 6 has the user edit Decision lines in the main checkout. Step 7 starts one fix agent per feature "in its own worktree, on a branch fix/<feature>", and each agent sets Status to `fixing` in its copy. Step 8 merges the branches one at a time.

**Impact.** A worktree is created from HEAD, so every fix agent's copy of `<feature>.md` has empty Decision lines. Unless the lead happens to write the problems and letters into the prompt, the agent can't tell what to fix or which option was chosen, and SKILL never lists what the prompt carries (step 4 has such a list, step 7 doesn't). Every fix branch then edits `<feature>.md` (Status → fixing) while the main checkout still has the user's uncommitted edits to that same file, so `git merge fix/<feature>` stops with "Your local changes … would be overwritten". The user can't finish the fix loop as written.

**Why.** Nothing commits the ticks before the worktrees are made. Step 7 has no brief for the fix agent. Status edits are given to agents on other branches.

**Current code** (`plugin/skills/review/SKILL.md:124`, `:131-132`, `:155-161`)

```markdown
Commit the folder (`review: <target>`), unless the user said not to.
```
```markdown
The user edits the Decision line of each problem: fix now (with the option
letter), later, not a problem, explain more. Don't tick for them. "Explain
```
```markdown
Each fix agent works in its own worktree, on a branch `fix/<feature>`, with
the `deliver-feature` rules on ownership: only that feature's files. For
each problem: write the "Test to add" first and see it fail, apply the
chosen option, run the project's tests, set the problem's Status to
`fixing` while it works and leave it there. It never touches Decision lines
and never edits another feature's problems. Its report to you is one line
per problem: fixed, or blocked and why.
```

**Proved by.** Read: SKILL.md:124 (the only commit before the ticks), :131 (ticks are later edits), :155-159 (the worktree plus a Status edit on the branch), :165 (merge). Not run: in a scratch repo, `git commit` a feature file, edit a line without committing, `git worktree add ../w -b fix/x`, edit the same file in `../w` and commit, then `git merge fix/x` in the main tree. Expected: merge refused.

**Fix options**

- **A (recommended).** Commit the ticks, keep review files off the fix branches, and give the fix agent a brief. In step 7, replace lines 155-161 with:

  ```markdown
  Before starting any fix agent: set Status to `fixing` on every "fix now"
  problem, and copy `later` / `not a problem` into Status, then commit
  (`review: decisions <target>`). Fix agents never edit files in `reviews/`.

  Give each fix agent: the feature file path, and per problem its number,
  the chosen letter and its "Test to add" line; the files it owns (the
  feature file's Owns, else the feature's folders from plan.json); the
  project's test command from `.agents/PROJECT.md` → Commands.
  Each fix agent works in its own worktree, on a branch `fix/<feature>`:
  per problem, write the test first and see it fail, apply the chosen
  option, run the tests. Its report: one line per problem, fixed or blocked
  and why.
  ```

  Cost: one paragraph. The lead becomes the only writer of Status before close.
- **B.** Keep Status edits in the fix agents, but commit the ticks before the worktrees and pass the brief. Cost: every merge still touches `reviews/`, and two passes can conflict when a problem is re-fixed.

**Test to add.** "After the user ticks and says fix, each fix agent's worktree shows the ticked options, and every fix branch merges into a checkout with no local edits."

**Decision.** [ ] fix now: A / B · [ ] later · [ ] not a problem · [ ] explain more

**Status.** open

<a id="p301"></a>
## 301. The reviewer is told to write its file but has no tool to write with · Important

**Context.** Step 4 says "Reviewers write their own `reviews/<date>-<target>/<feature>.md`", and closing edits Status lines. The plan asked for the agent to get "Bash (run only)".

**Impact.** In Claude Code the reviewer can only produce the file through a Bash heredoc or `sed`, which breaks its own rule "You never edit a project file" (the review folder is a committed project folder). Some runs will instead return the text and leave the lead guessing whether to write it. Closing ("Edit only Status lines") has the same gap. In Codex, `codex_agents.py` sees `bash` and generates `sandbox_mode = "workspace-write"`, so the "never edit" reviewer can write anywhere.

**Why.** The frontmatter lists no Write/Edit tool, and the rules never exempt the review folder.

**Current code** (`plugin/agents/code-reviewer.md:5`, `:59-61`, `:67-70`)

```markdown
tools: Read, Grep, Glob, Bash
```
```markdown
6. Write `reviews/<date>-<target>/<feature>.md` in the report shape: the
   intro, every problem in full, Critical first, then "Not run" and "Already
   there". Every problem gets the full shape, Later included.
```
```markdown
- You may run: the project's gates and tests, its start commands, Playwright,
  `curl`, `git log` and `git blame`, and read-only scripts. You never edit a
  project file, never `git add` or commit, never install packages, and
  never run a command that changes data outside a test database or a
```

**Proved by.** Read: code-reviewer.md:5 vs :59 and :85 ("Edit only Status lines"); `plugin/skills/setup-project/scripts/codex_agents.py:21,40` (bash is a write tool, so workspace-write). Also this very run: the reviewer session had no Write tool and could not write this file.

**Fix options**

- **A (recommended).** Give it Write and Edit, and say where it may use them:

  ```markdown
  tools: Read, Grep, Glob, Bash, Write, Edit
  ```
  ```markdown
  - You write only inside the review folder: your `<feature>.md` and
    `captures/`. When closing, you edit only Status lines. You never edit any
    other project file, never `git add` or commit, never install packages, …
  ```

  Cost: 2 lines. Codex stays workspace-write, which is now correct.
- **B.** The reviewer returns the file text and the lead writes it. Cost: the lead holds every feature file in context, and step 4 and code-reviewer.md step 6 change.

**Test to add.** "A reviewer started by the skill in Claude Code writes `<feature>.md` without using a shell redirect."

**Decision.** [x] fix now: A (the lead applied A during this run, before the file existed: `tools: Read, Grep, Glob, Bash, Write, Edit` and the review-folder-only rule) · [ ] later · [ ] not a problem · [ ] explain more

**Status.** fixing · applied in the working tree; proof pending the next review on 0.10.0 (this run's reviewers still ran on the 0.9.0 agent definition)

<a id="p302"></a>
## 302. Choosing "quick" changes nothing, and the documented flag makes the script fail · Important

**Context.** The plan decided `/review [target] [--quick|--full]`. config.md stores `depth`, SKILL step 2 asks "quick or full", and the README header shows Depth.

**Impact.** A user who picks quick gets a full review: step 4's list of what each reviewer receives has no depth, and neither code-reviewer.md nor the checklist mentions quick. A lead that follows config.md literally and passes `--quick` to triage gets exit 2, "Unknown argument: --quick". config.md's definition "one reviewer" also contradicts "one per feature" everywhere else.

**Why.** Depth was kept in the questions and the config, but the plumbing that carried it (the old `--quick` flag and QUICK_LENSES) was removed without a replacement.

**Current code** (`plugin/skills/review/references/config.md:25`; `plugin/skills/review/scripts/triage.mjs:87-99`)

```markdown
| `depth` | "Quick or full by default?" | Quick = correctness and fit, one reviewer, no screenshots. Full = the whole checklist. Overridden per run by `--quick` / `--full`. |
```
```js
    if (flag === '--uncommitted' || flag === '--app') {
      args[flag.slice(2)] = true;
    } else if (['--out', '--base', '--range', '--project'].includes(flag)) {
      args[flag.slice(2)] = argv[(i += 1)];
    } else if (flag === '--plan') {
      args.plan = [];

      while (i + 1 < argv.length && !argv[i + 1].startsWith('--')) {
        args.plan.push(argv[(i += 1)]);
      }
    } else {
      fail(`Unknown argument: ${flag}`);
    }
```

**Proved by.** Read: SKILL.md:94-104 (no depth in the reviewer brief); `grep -i quick plugin/agents/code-reviewer.md plugin/skills/review/references/checklist.md` finds nothing. Not run: `node plugin/skills/review/scripts/triage.mjs --out /tmp/x --app --quick` (expected exit 2, "Unknown argument: --quick").

**Fix options**

- **A (recommended).** Make depth a brief item, not a script flag. config.md row:

  ```markdown
  | `depth` | "Quick or full by default?" | Quick = checklist sections 1 (Correctness), 7 (Fit) and 9 (Last look), no screenshots; still one reviewer per feature. Full = the whole checklist. The user overrides it per run by saying "quick" or "full". |
  ```

  SKILL step 4, new bullet: `- the depth: full, or quick (checklist 1, 7 and 9 only; no screenshots),`. checklist.md, under the intro: `Quick depth: sections 1, 7 and 9 only.`

  Cost: 3 lines, no script change.
- **B.** Add `--quick` to triage.mjs and write `"depth"` into plan.json for the reviewers to read. Cost: script change, and the brief still needs the bullet.

**Test to add.** "A quick review's reviewer brief says quick, and its feature file has no UI or Access problems."

**Decision.** [ ] fix now: A / B · [ ] later · [ ] not a problem · [ ] explain more

**Status.** open

<a id="p303"></a>
## 303. Moved files count as brand-new, so the plan overstates work and the reviewer finds no hunks to read · Important

**Context.** Triage sizes features by changed lines, and the plan block, split (5,000) and merge (800) all use that number. Reviewers "read the hunks for your files" from diff.patch.

**Impact.** In this range, the biggest feature, `plugin/skills/design-interface/assets/studio-engine/web` at 4,519 lines, is almost entirely 100%-similarity renames. The reviewer is sized for 4.5k lines, but diff.patch has no hunks for 15 of its 19 files. The real changes (board.js 95%, component-scan.js 84%, index.html 98%, styles.css 99%) are a few dozen lines. Any branch that moves a folder gets the same phantom features and a wrong reviewer count.

**Why.** The file list uses `--no-renames` (a rename counts as delete plus full add), while the patch uses git's default rename detection.

**Current code** (`plugin/skills/review/scripts/triage.mjs:144-150`)

```js
  const spec = args.base ? `${args.base}...HEAD` : args.range;

  return {
    target: args.base ? { kind: 'branch', base: args.base } : { kind: 'range', range: args.range },
    files: numstat(git(root, ['diff', '--numstat', '--no-renames', spec])),
    patch: git(root, ['diff', spec]),
  };
```

**Proved by.** Read: `reviews/2026-09-29-kit-rebuild/plan.json:9-89` (the web feature, 4,519 lines) vs `diff.patch:2121-2293` (`similarity index 100%` for app.js, canvas.js, checks.js, color.js, comments.js, components.js, frame.js, icons.js, inspector.js, palettes.js, palettes.json, specimen.*). `--uncommitted` has the same split (triage.mjs:132-133).

**Fix options**

- **A (recommended).** Detect renames in both, and count only changed lines:

  ```js
  files: numstatZ(git(root, ['diff', '--numstat', '-z', '-M', spec])),
  patch: git(root, ['diff', '-M', spec]),
  ```
  ```js
  // -z: "a\td\tpath\0", or for a rename "a\td\t\0old\0new\0".
  function numstatZ(text) {
    const parts = text.split('\0');
    const files = [];

    for (let i = 0; i < parts.length - 1; ) {
      const [added, deleted, path] = parts[i].split('\t');
      const lines = added === '-' ? 0 : Number(added) + Number(deleted);

      if (path === '') {
        files.push({ path: parts[i + 2], renamedFrom: parts[i + 1], lines });
        i += 3;
      } else {
        files.push({ path, lines });
        i += 1;
      }
    }

    return files;
  }
  ```

  Cost: one function, and the same change on the `--uncommitted` line. A pure rename gets 0 lines and a `renamedFrom` the reviewer can see.
- **B.** Use `--no-renames` for the patch too, so hunks match the counts. Cost: moved files are reviewed in full as new code, which is slow but consistent.

**Test to add.** "A branch that only moves a 500-line file plans 0 changed lines for it and lists it as renamed."

**Decision.** [ ] fix now: A / B · [ ] later · [ ] not a problem · [ ] explain more

**Status.** open

<a id="p304"></a>
## 304. Without feature files, one product feature is split across reviewers and unrelated code is lumped together · Important

**Context.** The plan decided "One reviewer per feature, end to end (server + client + tests)". Without `docs/plans/*/features/*.md`, triage names features from paths, and client/server groups merge only when the names are equal.

**Impact.** On HRise (no feature files, no `.agents/review/`), time off would go to four reviewers: `time-off` (client/src/features/time-off), `leave` (server/src/leave: controllers, entities, services), `entities` (client/src/entities/leave together with employee, invoice, user…), and `e2e` (e2e/tests/employee/time-off-tab.spec.ts). `server/test/app.e2e-spec.ts` becomes a feature named `server`. report.md's own example problem cites `requests.service.ts:239` (server/src/leave) as time-off context, which this grouping can't produce. On this repo, `plugin/agents/code-reviewer.md` landed in `other` with README and DIRECTION, and `plugin/skills` became an 814-line grab-bag of six skills (plan.json:307-431). `other` is never split, so on a large app every small module piles into one reviewer. A project can't fix this without writing plan feature files, because triage.json now only reads `ignore`.

**Why.** deriveName matches on folder names only, and the old `rules` key in triage.json was dropped without a replacement.

**Current code** (`plugin/skills/review/scripts/triage.mjs:213-226`)

```js
  const after = (index) => (index >= 0 && index + 1 < dirs.length ? dirs[index + 1] : undefined);
  const byFeatures = after(dirs.indexOf('features'));

  if (byFeatures) {
    return byFeatures;
  }

  const pkgEnd = ['apps', 'packages'].includes(dirs[0]) ? 2 : 1;

  if (dirs[pkgEnd] === 'src' && dirs.length > pkgEnd + 1) {
    return dirs[pkgEnd + 1];
  }

  return dirs[0];
```

**Proved by.** Read: HRise paths `client/src/features/time-off/index.ts`, `server/src/leave/services/requests.service.ts`, `client/src/entities/leave/index.ts`, `e2e/tests/employee/time-off-tab.spec.ts`, `server/test/app.e2e-spec.ts`, traced through deriveName (`time-off`, `leave`, `entities`, `e2e`, `server`); triage.mjs:181 (`other` never split); `reviews/2026-09-29-kit-rebuild/plan.json:307-431`. Not run: `node plugin/skills/review/scripts/triage.mjs --project /Users/stiliyan26/projects/HRise --out <scratch>/hrise-app --app`.

**Fix options**

- **A (recommended).** Let a project name its features in triage.json, checked before Owns and path names:

  ```json
  { "features": { "time-off": ["^client/src/features/time-off/", "^client/src/entities/leave/", "^server/src/leave/", "time-off.*\\.spec\\.ts$"] },
    "ignore": [] }
  ```
  ```js
  function readProject(root) {
    const path = resolve(root, '.agents/review/triage.json');
    const project = existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : {};

    return {
      ignore: (project.ignore ?? []).map((p) => new RegExp(p, 'i')),
      features: Object.entries(project.features ?? {}).map(([name, patterns]) => ({
        name, source: '.agents/review/triage.json', globs: patterns.map((p) => new RegExp(p, 'i')),
      })),
    };
  }
  // main(): group(files, [...project.features, ...readFeatureFiles(root)])
  ```

  Also split `other` like any other path feature. SKILL step 3: on a project with neither file, propose the client/server pairs to merge in the plan block and offer to save them to triage.json. Cost: about 15 lines plus a triage.md section.
- **B.** No script change: SKILL step 3 tells the lead to read the path features and propose end-to-end merges (time-off + leave + e2e specs) in the plan block. Cost: judgement on every run, and it's not repeatable.

**Test to add.** "On HRise with a time-off mapping, `--app` puts client time-off, server leave and the time-off e2e specs in one feature."

**Decision.** [ ] fix now: A / B · [ ] later · [ ] not a problem · [ ] explain more

**Status.** open

<a id="p305"></a>
## 305. A feature file whose Owns paths don't match falls back to folder grouping with no warning · Important

**Context.** Grouping step 1 reads the backtick globs on each feature file's `- Owns:` line. greenfield-mode's feature-file template is the source of those lines.

**Impact.** Globs are anchored at the repo root. The template's example `src/features/orders/**` matches nothing in a greenfield project whose app lives under `web/src/`, as coordination.md:22 and deliver-feature:20 describe. A glob written `./src/...` never matches, because `./` is stripped after `.` has been escaped. Brace globs (`*.{ts,tsx}`) are escaped as literals. When two features' globs overlap, the alphabetically first file wins. In every case the script says nothing, the plan block shows path-derived names, and neither the lead nor the user learns that the plan's features were ignored.

**Why.** The `./` strip runs on the escaped string, there is no zero-match check, and triage.md doesn't say globs are relative to the repo root.

**Current code** (`plugin/skills/review/scripts/triage.mjs:328-333`)

```js
      out += char.replace(/[.+^${}()|[\]\\]/g, '\\$&');
    }
  }

  return new RegExp(`^${out.replace(/^\.\//, '')}$`);
}
```

**Proved by.** Read: globToRegExp on `./client/**` builds `^\./client/.*$` (the replace looks for `./` but the string starts with `\`), which never matches a git path. `plugin/skills/greenfield-mode/references/features.md:18` (`src/features/orders/**`) vs `references/coordination.md:22` (`web/src/design/parts/`). Not run: a scratch project with `docs/plans/p/features/a.md` containing ``- Owns: `./src/a/**` `` plus `src/a/x.ts`, then `node triage.mjs --project <scratch> --out <scratch>/out --app`. Expected: feature `a` absent, `src/a/x.ts` under a path name.

**Fix options**

- **A (recommended).** Strip `./` first, expand braces, and warn about unmatched or overlapping Owns on `--app`:

  ```js
  export function globToRegExp(glob) {
    const source = glob.replace(/^\.\//, '').replace(/\{([^}]+)\}/g, (_, alts) => `\u0000${alts.split(',').join('\u0001')}\u0000`);
    let out = '';
    // … same loop over `source`, plus:
    //   '\u0000' opens/closes "(?:", '\u0001' → "|"
    return new RegExp(`^${out}$`);
  }
  ```
  ```js
  // main(), after group(): only --app sees every file, so only it can say "matches nothing".
  if (args.app) {
    for (const f of featureFiles.filter((ff) => !files.some((file) => ff.globs.some((g) => g.test(file.path))))) {
      console.warn(`${f.source}: Owns matches no file; its files were grouped by folder`);
    }
  }
  ```

  triage.md, step 1: "Globs are relative to the repo root (`web/src/features/orders/**`)." Cost: about 20 lines. The plan block shows the warnings.
- **B.** Only strip `./` and document root-relative globs. Cost: 1 line, but a zero match stays silent.

**Test to add.** "A feature file owning `./web/src/features/orders/**` groups `web/src/features/orders/list.tsx` under that feature."

**Decision.** [ ] fix now: A / B · [ ] later · [ ] not a problem · [ ] explain more

**Status.** open

<a id="p306"></a>
## 306. Deleted files reach no reviewer, so "nothing still uses the deleted code" is never checked · Important

**Context.** checklist §9 asks every reviewer to check "deleted code that something still imports, calls or links to". goal.md worry (1) is exactly stale references to removed parts (lenses, judge, bro, reflect).

**Impact.** Triage moves every deleted file to `skipped` (in this range: 62 files, including every lens, `judge.md`, `finding.md`, bro, reflect). SKILL step 4 gives each reviewer only its feature's file list, so no reviewer is told that `lenses/judge.md` is gone. Stale links are found only by luck.

**Why.** "Deleted" was added as a skip reason (not in HEAD's triage.md) rather than as a file attribute the reviewer sees.

**Current code** (`plugin/skills/review/scripts/triage.mjs:43-49`)

```js
    const deleted = collected.patch !== undefined && !existsSync(join(root, file.path));

    if (skip || ignored || deleted) {
      skipped.push({ path: file.path, why: skip ? skip[1] : ignored ? 'project ignore rule' : 'deleted' });
    } else {
      files.push(file);
    }
```

**Proved by.** Read: `reviews/2026-09-29-kit-rebuild/plan.json:434-710` (every `"why": "deleted"` entry, in no feature); SKILL.md:94-104 (the brief carries only the feature's files); checklist.md:130.

**Fix options**

- **A (recommended).** Keep deleted files in their feature, marked:

  ```js
    if (skip || ignored) {
      skipped.push({ path: file.path, why: skip ? skip[1] : 'project ignore rule' });
    } else {
      files.push(deleted ? { ...file, deleted: true } : file);
    }
  ```

  Leave them out of the line totals (`sum` skips `deleted`). SKILL step 4 bullet: "its deleted files (plan.json `deleted: true`): search the project for anything still naming them." Cost: 3 lines plus 1 bullet.
- **B.** Keep them skipped, and have the lead hand the whole deleted list to every reviewer. Cost: each reviewer greps for files outside its feature.

**Test to add.** "A branch that deletes `lenses/judge.md` while SKILL.md still links it yields a problem in the review-skill feature."

**Decision.** [ ] fix now: A / B · [ ] later · [ ] not a problem · [ ] explain more

**Status.** open

<a id="p307"></a>
## 307. Earlier review folders are reviewed as code in later reviews · Important

**Context.** The review now writes to `reviews/<date>-<target>/` in the project and commits it. Triage still only excludes the old `temp/` location and the current `--out` folder.

**Impact.** deliver-feature commits `reviews/<date>-<feature>/` on the feature branch. The merge-stage review ("`--range` on the feature's commits") then includes the README, the feature files and the captures list as changed files. The same happens after a merge (`--base`) or with `--uncommitted` when the user said not to commit. A reviewer (usually `other`) spends time on review prose and may report "problems" in it.

**Why.** isOutput wasn't updated for the new folder.

**Current code** (`plugin/skills/review/scripts/triage.mjs:34`)

```js
  const isOutput = (path) => /^temp\//.test(path) || (!outDir.startsWith('..') && path.startsWith(`${outDir}/`));
```

**Proved by.** Read: triage.mjs:34; `plugin/skills/deliver-feature/SKILL.md:70-71` ("It writes `reviews/<date>-<feature>/`"); SKILL.md:124 (commit) and :185 (merge review is `--range` on the feature's commits). Not run: after a committed review, `node triage.mjs --out <scratch>/o --range HEAD~1..HEAD` lists `reviews/…/README.md`.

**Fix options**

- **A (recommended).**

  ```js
  const isOutput = (path) => /^(temp|reviews)\//.test(path) || (!outDir.startsWith('..') && path.startsWith(`${outDir}/`));
  ```

  Update triage.md's "Skipped" line to say `reviews/`. Cost: 1 line.
- **B.** Ship `"ignore": ["^reviews/"]` in the triage.json template. Cost: only projects that copy it are covered.

**Test to add.** "A range whose commits include a review folder plans no file under `reviews/`."

**Decision.** [ ] fix now: A / B · [ ] later · [ ] not a problem · [ ] explain more

**Status.** open

<a id="p308"></a>
## 308. Outside Claude Code, the configured models can't be applied, and fix and close have no fallback · Important

**Context.** The kit runs in Claude Code, Codex and Cursor. Step 1 asks for a reviewer and a fix model "from the models this CLI can run". Step 4 starts reviewers "on the config's reviewer model". The "No sub-agents?" fallback covers only step 4.

**Impact.** Only Claude Code's Agent tool takes a `model` argument. In Codex the reviewer is the generated `.codex/agents/code-reviewer.toml`, and `codex_agents.py` writes no model. config.md sends the Codex user to `codex --help` to pick a name that nothing ever passes. Cursor has no documented way at all. The user answers a model question, and the plan block shows "(fable)" or "(gpt-…)", while the reviews actually run on the session model. With no sub-agents, steps 7 (parallel fix agents in worktrees) and 9 (restart the reviewer) have no instructions, and step 7 conflicts with "you never fix anything during a review".

**Why.** config.md lists how to name models per CLI, but not how to launch an agent on one.

**Current code** (`plugin/skills/review/references/config.md:34-38`; `SKILL.md:111-113`)

```markdown
| CLI | How to list | Names to pass |
| --- | --- | --- |
| Claude Code | the Agent tool's `model` values | `fable`, `opus`, `sonnet`, `haiku` |
| Codex | `codex --help` → `--model`; the config's `model` | the names Codex shows |
| Cursor | `cursor-agent --list-models` | the names it prints |
```
```markdown
**No sub-agents?** Review the features one after another yourself, reading
`code-reviewer.md`, the checklist and the report shape first, and say so in
the README.
```

**Proved by.** Read: `plugin/skills/setup-project/scripts/codex_agents.py:42-48` (the toml gets name, description, sandbox and instructions, but no model); SKILL.md:89-90, 150-153 (models), 111-113 (fallback for step 4 only). Not run: whether Codex's multi-agent spawn and Cursor's agent accept a per-agent model. Check with `codex --help` and `cursor-agent --help`.

**Fix options**

- **A (recommended).** Say per CLI how an agent is started and what "model" means there, and extend the fallback:

  ```markdown
  | CLI | Start a reviewer | Model |
  | --- | --- | --- |
  | Claude Code | Agent tool, `code-reviewer`, `model: <reviewerModel>` | from config |
  | Codex | the `code-reviewer` custom agent (`codex_agents.py`) | the session's; config models are ignored — say so in the plan block |
  | Cursor | no sub-agents: the fallback below | the session's |

  **No sub-agents?** Steps 4 and 9: review or re-prove the features one after
  another yourself. Step 7: fix one feature at a time on `fix/<feature>`,
  test first, as the fix agent would; this is the one case where you fix.
  Say in the README which model actually ran.
  ```

  Only ask the model questions in step 1 when the CLI can apply them. Cost: a table and a paragraph.
- **B.** Make `codex_agents.py` write `model = "<reviewerModel>"` from `.agents/review/config.json` when it exists. Cost: the toml goes stale whenever the config changes, and Cursor is still uncovered.

**Test to add.** "In a CLI with no sub-agents, saying fix after the ticks produces one fix branch per feature and a README that names the model used."

**Decision.** [ ] fix now: A / B · [ ] later · [ ] not a problem · [ ] explain more

**Status.** open

<a id="p309"></a>
## 309. Codex in this repo still runs the old lens-and-judge reviewer · Important

**Context.** `.codex/agents/*.toml` is generated from `plugin/agents/` and must not be edited by hand (`.agents/PROJECT.md:15,45`). The repo uses its own kit while it's being worked on.

**Impact.** A Codex review in this repo starts a reviewer told to read `lenses/<lens>.md`, write to `temp/review/<run>/`, return `finding.md` findings and never run code. None of those files exist any more. The review either stops ("Started without a lens…") or writes nothing the new README step can read.

**Why.** code-reviewer.md was rewritten, but the generator wasn't re-run.

**Current code** (`.codex/agents/code-reviewer.toml:3-4`)

```toml
description = "Read-only reviewer for the review skill. The skill starts at most 5 in all - one per area of the code, each with the lens files from skills/review/lenses/ its area needs (correctness, access, contract, data, fit, tests, ui, scope, blind-spot), one with the plan lens in plan mode, and one judge - and hands each the review folder. Not for use on its own; to review a change, run the review skill."
sandbox_mode = "read-only"
```

**Proved by.** Read: `.codex/agents/code-reviewer.toml:35,41` (`temp/review/<run>/`, "no lens file … stop") vs `plugin/agents/code-reviewer.md:23,32`. The file isn't in this range's file list, so it wasn't regenerated. Not run: `python3 plugin/skills/setup-project/scripts/codex_agents.py --project . && git diff --stat .codex`.

**Fix options**

- **A (recommended).** Regenerate it and make the gates catch drift:

  ```
  python3 plugin/skills/setup-project/scripts/codex_agents.py --project .
  ```

  Add a `--check` mode to codex_agents.py (compare instead of write, exit 1 on a difference) and run it in the gates listed in `.agents/PROJECT.md`. Cost: about 10 lines.
- **B.** Regenerate only. Cost: none, and it drifts again on the next agent edit.

**Test to add.** "The gates fail when `plugin/agents/code-reviewer.md` changes and `.codex/agents/code-reviewer.toml` doesn't."

**Decision.** [ ] fix now: A / B · [ ] later · [ ] not a problem · [ ] explain more

**Status.** open

<a id="p310"></a>
## 310. The feature-stage review can't run as written, and it contradicts who may tick · Important

**Context.** deliver-feature step 6 has the feature agent run `review` on its own diff and tick and fix the problems itself. SKILL's "same flow everywhere" table repeats this.

**Impact.** The feature agent is itself a sub-agent started by the lead, and Claude Code sub-agents can't start sub-agents. So there is no `code-reviewer` and no chosen model, and the author ends up reviewing its own code through the fallback, without anyone being told. Steps 1–3 need a user (config questions, "what worries you", "Wait for the user") who isn't there. The only exception is a request that "already said to go ahead", and deliver-feature doesn't say that. The agent ticking Decision lines breaks report.md ("The user edits the Decision lines … Nobody else edits these files"), SKILL step 6 ("Don't tick for them") and step 7 (the fixer "never touches Decision lines").

**Why.** The per-feature row was added to the table without adjusting the steps it skips.

**Current code** (`plugin/skills/review/SKILL.md:184`; `references/report.md:16-18`)

```markdown
| A feature, by its agent, before it reports done | `--base` on its branch | The feature agent is also the fixer; it ticks its own Decision lines and says so in its trace |
```
```markdown
The lead writes `README.md`. Each reviewer writes its feature file. The
user edits the Decision lines. The reviewer edits the Status lines when it
closes a problem. Nobody else edits these files.
```

**Proved by.** Read: SKILL.md:184 vs :132, :159 and report.md:16-18; `plugin/skills/deliver-feature/SKILL.md:70-72`; SKILL.md:83-85 (the only exception to waiting). Nesting limit: Claude Code documents that sub-agents cannot start sub-agents. Not run: a feature agent started by greenfield-mode running `review --base main`.

**Fix options**

- **A (recommended).** Write the feature-stage variant down in one place (SKILL, under the table):

  ```markdown
  **Run by a feature agent.** No questions and no waiting: use the config,
  depth quick unless the feature file says otherwise, and put the plan block
  in the README. With no sub-agents it reviews its own diff (fallback) and
  says so. It is the one case where Decision lines are ticked by an agent:
  it writes `(agent)` after each tick.
  ```

  Add the same exception to report.md:16-18 and code-reviewer.md's "Never tick". Cost: one paragraph plus two one-line edits.
- **B.** Move the feature-stage review to the lead: the feature agent runs gates and tests and sets Status to review, and the lead's merge review is the first real review. Cost: deliver-feature step 6 and the greenfield-mode table change. The review happens later but is independent.

**Test to add.** "A feature agent's review folder has a plan block in its README and ticks marked `(agent)`, and no question was sent to the user."

**Decision.** [ ] fix now: A / B · [ ] later · [ ] not a problem · [ ] explain more

**Status.** open

<a id="p311"></a>
## 311. The lead has to guess what the user ticked, and "later" / "not a problem" never reach Status · Important

**Context.** The user edits `**Decision.** [ ] fix now: A / B · [ ] later · [ ] not a problem · [ ] explain more`, then says "fix". Step 7 reads the ticks, and step 9 closes.

**Impact.** "Circles a letter" has no Markdown form. A user may write `[x] fix now: A`, bold the A, delete B, or tick with no letter. Nothing says what a tick with no letter means (the recommended option?), what two ticks mean, what to do when "explain more" is still ticked at "fix", or what to say when nothing is ticked. report.md says Status becomes `not a problem` / `later` "copied from the decision", but step 9 handles only `fixing` and no step names who copies them. Those rows stay `open` in the README forever, and the Fixed count is wrong.

**Why.** The Decision format was written for a human reader, not for the lead that parses it. The copy step was left without an owner.

**Current code** (`plugin/skills/review/references/report.md:146-150`)

```markdown
- **Decision:** the user ticks one box and, for fix now, circles a letter.
  The reviewer never ticks it.
- **Status:** `open` → `fixing` (a fix agent has it) → `fixed` with the
  proof re-run: `fixed · proved by <command> → <output>` → or `not a
  problem` / `later` copied from the decision.
```

**Proved by.** Read: report.md:120, 146-150; SKILL.md:129-134 (step 6), 138-139 (step 7 reads only "fix now"), 172-176 (step 9 handles only `fixing`).

**Fix options**

- **A (recommended).** A parseable line and explicit rules. report.md template:

  ```markdown
  **Decision.** [ ] fix now, option: __ · [ ] later · [ ] not a problem · [ ] explain more
  ```

  SKILL step 7, first paragraph:

  ```markdown
  Read every Decision line. `[x] fix now` with no letter = the recommended
  option. More than one box, or a letter that isn't an option: ask about that
  problem. `explain more` still ticked: answer it and leave it out of this
  round. `later` / `not a problem`: copy into Status now. Nothing ticked: say
  so and stop.
  ```

  Cost: one template line and one paragraph.
- **B.** Keep the line, and add only the rules paragraph. Cost: the letter stays free-form, so users will keep marking it in different ways.

**Test to add.** "Ticking fix now with no letter fixes with the recommended option, and ticking later sets Status to later in the file and the README."

**Decision.** [ ] fix now: A / B · [ ] later · [ ] not a problem · [ ] explain more

**Status.** open

<a id="p312"></a>
## 312. A fix that lives in another feature or in shared code has no agent allowed to make it · Important

**Context.** Reviewers write cross-feature problems in their own file and name the owning feature. Step 5 moves a shared problem "to the feature file where the fix lives". Fix agents may edit "only that feature's files", and step 8 sends back a fix that touches shared code.

**Impact.** Take a problem whose fix is in `shared/`, `other` or the foundation (the step 7 example itself: "#9B needs a server migration"). The fix agent is not allowed to make it, step 8 bounces it, and no step says who fixes it. It is blocked forever. For path-derived features in a diff review, "that feature's files" is plan.json's list of changed files only, so a fix needing an untouched file in the same folder is also out of bounds. When fix agents do touch shared files, two of them can collide on the same file with no ordering rule.

**Why.** Ownership comes from deliver-feature's Owns lists. No owner was defined for shared code or for features that have no Owns.

**Current code** (`plugin/skills/review/SKILL.md:142-147`, `:165-167`)

```markdown
Fix: 9 problems ticked in 3 features
  1. time-off   #7A #8A #9B #21A     (sonnet)
  2. reporting  #13A #15A            (sonnet)
  3. people     #4A #12A #19A        (sonnet)
Foundation change: #9B needs a server migration → fable
Go? Or: a number of agents, another model.
```
```markdown
One branch at a time: rebase, run all the project's tests, read the diff
against the feature's ownership, merge. A fix that touches shared code or
another feature's files goes back to the agent with a request. Say in the
```

**Proved by.** Read: SKILL.md:146 (a "foundation change" is shown but has no rule), :155-157, :165-167; `plugin/agents/code-reviewer.md:73-74`; triage.mjs:59-61 (a path feature's files are only the changed files).

**Fix options**

- **A (recommended).** Add one shared fix agent that goes first:

  ```markdown
  Problems whose fix is in shared code, the foundation or `other` go to one
  `shared` fix agent (reviewer model). It merges first; the feature agents
  rebase on it. A feature agent owns its feature file's Owns, else the
  folders of its files in plan.json (not only the changed files).
  ```

  Cost: one paragraph. The plan block gets a `shared` line.
- **B.** The lead makes shared fixes itself after all feature branches merge. Cost: this breaks "you never fix", and those fixes skip test-first.

**Test to add.** "A ticked problem whose fix is in `shared/` is fixed on a `fix/shared` branch merged before the feature branches."

**Decision.** [ ] fix now: A / B · [ ] later · [ ] not a problem · [ ] explain more

**Status.** open

<a id="p313"></a>
## 313. The review folder name is undefined for most targets, and a same-day re-run overwrites the previous one · Later

**Context.** Everything goes to `reviews/<date>-<target>/`. The examples are only `time-off`, `app` and `plan`.

**Impact.** For `--base feat/time-off`, `--range 8efdbaf..HEAD` or `--uncommitted`, each lead invents a name, and a slash creates nested folders. A second review of the same target the same day rewrites files.txt, plan.json and the feature files, including a user's ticks. When features are merged to fit `maxReviewers`, nothing says whether the reviewer writes one file per feature or one combined file, and step 7 groups fixes "by feature file".

**Why.** The slug rule was never written.

**Current code** (`plugin/skills/review/references/report.md:3-4`)

```markdown
A review writes one folder: `reviews/<date>-<target>/` in the project
(`2026-09-29-time-off`, `2026-09-29-app`, `2026-09-29-plan`). Committed. It
```

**Proved by.** Read: report.md:3-4; SKILL.md:64, 79-81; the reviewer brief in this run named `2026-09-29-kit-rebuild`, a free choice.

**Fix options**

- **A (recommended).** One rule in report.md:

  ```markdown
  `<target>`: `app`, `plan`, `uncommitted`, the branch name with `/` → `-`,
  or `range-<a7>-<b7>`. If the folder exists, add `-2`, `-3`. A reviewer
  given merged features writes one file per feature.
  ```

  Cost: 3 lines.

**Test to add.** "Two reviews of `feat/x` on one day write `…-feat-x` and `…-feat-x-2`."

**Decision.** [ ] fix now: A · [ ] later · [ ] not a problem · [ ] explain more

**Status.** open

<a id="p314"></a>
## 314. README links to problems don't land on the problem · Later

**Context.** The README table links each problem as `[time-off](time-off.md#1)`, and feature files head problems `## 7. <title> · Critical`.

**Impact.** GitHub and editors create anchors from the heading text (`#7-editing-approved-leave-creates-a-second-request--critical`), so `#1` or `#7` opens the top of the file. The example also numbers the same problem 1 in the README and 7 in the feature file, while the rules say "the feature file uses the same number".

**Why.** The anchor form was assumed, not checked.

**Current code** (`plugin/skills/review/references/report.md:35`, `:69`)

```markdown
| 1 | Editing approved leave creates a second request | Critical | Employee: double-booked and charged twice | [time-off](time-off.md#1) | ran | | open |
```
```markdown
## 7. Editing approved leave creates a second request · Critical
```

**Proved by.** Read: report.md:35 vs :69 and :57-58.

**Fix options**

- **A (recommended).** Put an explicit anchor on each problem, and make the examples match:

  ```markdown
  <a id="p7"></a>
  ## 7. Editing approved leave creates a second request · Critical
  ```
  ```markdown
  | 7 | Editing approved leave creates a second request | … | [time-off](time-off.md#p7) | ran | | open |
  ```

  Cost: 1 line per problem.

**Test to add.** "Clicking a README row opens the feature file at that problem on GitHub."

**Decision.** [ ] fix now: A · [ ] later · [ ] not a problem · [ ] explain more

**Status.** open

<a id="p315"></a>
## 315. `--app` silently leaves out config, CI, Docker and Markdown-based code · Later

**Context.** The whole-app review is the Prove stage ("the full machine"). checklist §9 asks reviewers to look at config and env, build, CI, Docker and deploy files.

**Impact.** `--app` keeps only SOURCE extensions and `DESIGN.md`. `.json`, `.yml`, `Dockerfile`, `.env.example`, `.html` and every `.md` are dropped, and not listed under `skipped`, so the plan block can't show the gap. On this repo, a whole-app review would miss every `SKILL.md`, and those files are the product.

**Why.** The filter runs inside `collect()` rather than the skip loop.

**Current code** (`plugin/skills/review/scripts/triage.mjs:123-126`)

```js
  if (args.app) {
    const files = git(root, ['ls-files']).split('\n').filter(Boolean)
      .filter((path) => !isOutput(path) && (SOURCE.test(path) || /DESIGN\.md$/.test(path)))
      .map((path) => ({ path, lines: countLines(join(root, path)) }));
```

**Proved by.** Read: triage.mjs:20 (SOURCE), :123-126, :37-50 (only collected files reach `skipped`); checklist.md:127-131. Not run: `node triage.mjs --out <scratch>/app --app` on this repo. Expected: no `plugin/skills/*/SKILL.md`, and nothing about them in `skipped`.

**Fix options**

- **A (recommended).** Keep config and CI files, and report what's dropped:

  ```js
  const KEEP = (p) => SOURCE.test(p) || /DESIGN\.md$|(^|\/)Dockerfile$|\.ya?ml$|\.env\.example$|(^|\/)package\.json$/.test(p);
  const all = git(root, ['ls-files']).split('\n').filter(Boolean).filter((p) => !isOutput(p));
  const files = all.filter(KEEP).map((path) => ({ path, lines: countLines(join(root, path)) }));
  return { target: { kind: 'app' }, files, notSource: all.filter((p) => !KEEP(p)).length };
  ```

  Print "`<n>` non-source files not reviewed" under the plan. A project whose code is Markdown adds `"include"` regexes in triage.json. Cost: about 8 lines.

**Test to add.** "`--app` on a project with a Dockerfile and a CI workflow lists both in a feature."

**Decision.** [ ] fix now: A · [ ] later · [ ] not a problem · [ ] explain more

**Status.** open

<a id="p316"></a>
## 316. A mistyped plan path gives a 0-line "plan" feature instead of an error · Later

**Context.** Plan mode runs `triage.mjs --plan <files>` on plan.md, the contract and the feature files.

**Impact.** Paths are resolved against `--project`, not the current folder, and an unreadable file counts as 0 lines with no message. A typo or a cwd-relative path with `--project` gives a plan block showing "plan 0 lines", and the reviewer gets a file that doesn't exist. Step 0 also runs the full gate command in plan mode, where there is no code yet (the old skill skipped tools in plan mode).

**Why.** countLines swallows errors, and the plan branch never checks existence.

**Current code** (`plugin/skills/review/scripts/triage.mjs:113-118`)

```js
  if (args.plan) {
    const files = args.plan.map((file) => {
      const path = relative(root, resolve(root, file));

      return { path, lines: countLines(join(root, path)) };
    });
```

**Proved by.** Read: triage.mjs:113-118 and :345-352 (`catch { return 0; }`); SKILL.md:38-42 (no plan-mode exception). Not run: `node triage.mjs --out <scratch>/p --plan docs/plans/nope.md`. Expected: exit 0 and `plan 0 lines`.

**Fix options**

- **A (recommended).**

  ```js
      const path = relative(root, resolve(file));

      if (!existsSync(join(root, path))) {
        fail(`Plan file not found: ${file}`);
      }
  ```

  SKILL step 0: "Plan mode: skip the gates." Cost: 4 lines.

**Test to add.** "`--plan` with a missing file exits 2 and names it."

**Decision.** [ ] fix now: A · [ ] later · [ ] not a problem · [ ] explain more

**Status.** open

## Not run

- Every triage.mjs run asked for: `node plugin/skills/review/scripts/triage.mjs --out <scratchpad>/<name>` with `--app`, `--base main`, `--range 8efdbaf..HEAD`, `--uncommitted`, `--plan docs/plans/review-v2/plan.md` on this repo, and `--project /Users/stiliyan26/projects/HRise --app` / `--base main` on HRise. This reviewer had no shell. The existing `reviews/2026-09-29-kit-rebuild/plan.json` (the `--range` run) was used as evidence instead.
- `node --check plugin/skills/review/scripts/triage.mjs`.
- Scratch projects for the Owns globs (#305) and a triage.json `ignore` rule. The ignore path looks right from reading (triage.mjs:370-380; regexes are case-insensitive, and a bad regex or bad JSON throws with no friendly message), but that is not proved.
- HRise has no `docs/plans/*/features/` and no `.agents/review/`, so only path grouping could be traced there. There are no project rules files for roles, scope, paging or conventions in either repo.
- Whether Codex multi-agent and `cursor-agent` accept a per-agent model (#308): `codex --help`, `cursor-agent --help`.
- The working tree's triage.md and triage.mjs differ from the HEAD diff (the "deleted" skip reason and depth-first mergeSmall are not in diff.patch). The working-tree files were reviewed.

## Already there

- `plugin/skills/review/references/tools.md` and `assets/gates/*`: unchanged in this range, and kept as the plan decided. Tools setup was not lost.
- `plugin/skills/review/assets/project-rules/triage.json:2`: the template ships a live example rule `"^server/src/legacy/"`, which silently drops that path in any project that copies it as-is.
