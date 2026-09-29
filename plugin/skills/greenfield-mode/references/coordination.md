# Coordinating parallel feature agents

Duplication happens when two agents are allowed to write the same kind of
code. So the rules are about ownership first; messaging comes second.

```
LEAD (you): owns shared/, entities, schema, contract, app shell; merges one feature at a time
   │
   ├── feature A (worktree, own branch)   edits only the files its feature file lists
   ├── feature B (worktree, own branch)   reads shared/INDEX.md before writing any helper or part
   └── feature C (worktree, own branch)   needs something shared → requests/<feature>-<name>.md
                                          → the lead adds it to shared/, pushes → the agent rebases
   merge queue: rebase → all tests → review (fit lens catches duplicates) → merge → next
```

## Before the fan-out (stage 4, Foundation)

1. Build what every feature depends on: the schema, auth, the API skeleton
   from the contract, the app shell (the promoted `web/`).
2. Build `shared/`: every entity, helper and UI part that two or more feature
   files use. The approved design already gives the parts
   (`web/src/design/parts/`).
3. Write `shared/INDEX.md`: one line per item, name, what it does, import
   path. Agents grep this before writing anything.
4. Commit. The fan-out starts from this commit.

## During a wave (stage 5)

The lead's only jobs are answering requests and merging.

- **A feature agent** works in its own worktree on its own branch, edits only
  the files in its feature file's Owns list, imports from `shared/` and never
  edits it. Before writing any helper or part it reads `INDEX.md`. When
  something is missing it writes `docs/plans/<project>/requests/<feature>-<name>.md`
  (what, why, the signature it needs) and continues with the rest of its
  feature. No local copies, ever.
- **The lead** reads `requests/`, adds the item to `shared/` and `INDEX.md`,
  pushes, marks the request answered, and tells the agent to rebase.
- **Merge, one feature at a time,** in the wave's order: rebase on main, run
  every test and scenario, run the `review` skill (its fit lens is the
  duplication check), then merge. A diff that touches files outside the
  feature's Owns list, or adds a helper `INDEX.md` already covers, is sent
  back, not merged.
- **Waves.** Features with no dependency run in wave 1. A feature that needs
  another's endpoint runs after that one merged. Ten agents at once only
  makes sense for ten independent features, which is rare; three to four per
  wave is the usual size.

## The runtime

Ask at fan-out setup which runtime carries the agents. Whichever it is, the
feature files, the ownership lists, `requests/` and the merge order are the
same; the runtime only adds live messaging or a task list on top.

| Runtime | What it adds | Notes |
| --- | --- | --- |
| Claude Code agent teams | A lead spawns named teammates; shared task list with claiming and dependencies; peer messages | Default when the lead runs in Claude Code. Experimental; 2–4 teammates work best; teammates don't survive `/resume` |
| Codex multi-agent | Roles in `.codex/agents/*.toml`; results land in the lead's context | Default cap of 6 threads |
| Cursor Projects | A cloud coordinator dispatches and merges; the laptop can close | Merging is Cursor's, not the kit's; use only when that is acceptable |
| Plain worktrees | Nothing: the lead starts one CLI per worktree (`claude -p`, `codex exec`, `cursor-agent`) and coordinates through the files | Works everywhere; the fallback |

Defaults: agent teams in Claude Code, plain worktrees elsewhere.

## Never

- A shared checkout for two agents that write code.
- `git stash` across worktrees.
- An agent asking the user a product question mid-feature: it writes the
  question in its report and the plan is updated.
