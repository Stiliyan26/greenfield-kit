# Coordinating the agents

No worktrees. One checkout, one branch per feature, and ownership by folder.
Parallel work is cheap where agents can't collide: planning while the studio
designs, a backend agent and a frontend agent on one feature, and the verify
run and explainer of the last feature while the next is built.

```
LEAD (you): owns plan.md, the feature files, server/shared/, shared/, the schema; merges one PR at a time
   │
   ├── feature N      backend agent   src/server/<area>/**, entities/<thing>/api, features/<action>/api
   │                  frontend agent  src/views, widgets, features/<action>/{ui,model}, entities/<thing>/{ui,queries}
   │                  same checkout, branch feature/<slug>, each commits only its own folders
   │
   └── feature N−1    verify run + explainer build, then the PR for the user
```

## Before the first feature (stage 5, Foundation)

1. Build what every feature depends on: the promoted routes and views, the
   drizzle schema and first migration, auth, `server/shared/`, `shared/ui/`
   from the design, `bun run check`, the `verify-<app>` skill.
2. Write `shared/INDEX.md`: one line per shared helper, part and server
   helper: name, what it does, import path. Agents grep this before writing
   anything.
3. Land it as a PR with an explainer (`interactive-explanation`, pr mode).
   The user approves; you merge. Features start from that commit.

## During a feature (stage 6)

1. Branch `feature/<slug>` from main. Start the two `deliver-feature` agents
   with the feature file, the sections they own, and the rule to commit only
   their folders. The backend agent's first commit is the contract (the zod
   schema and the `*.functions.ts` wrappers); the frontend agent builds
   against it.
2. Your only jobs while they work: answer `requests/` (add the item to the
   foundation on main, tell both agents to rebase) and update the plan when
   an agent's report asks a question. Product questions go to the user, one
   at a time; never to the agents.
3. When both report ready: rebase on main, run the full suite three times,
   `bun run check`, the e2e suite, then the verify skill on every Driving
   section merged so far. A diff that touches files outside the Owns lists
   is sent back, not merged.
4. Build the explainer (`interactive-explanation`, pr mode) and open the PR.
   The user reads, watches and approves. Merge. Feature `Status: merged`.
5. Meanwhile, start the next feature's agents. Their branch starts from
   main; they rebase when the previous PR merges.

## The runtime

Whichever runtime carries the agents, the feature files, the Owns lists,
`requests/` and the merge order are the same; the runtime only adds live
messaging or a task list on top.

| Runtime | What it adds | Notes |
| --- | --- | --- |
| Claude Code agent teams | A lead spawns the two agents as named teammates; peer messages for "the contract is in" | Default when the lead runs in Claude Code. Teammates don't survive `/resume`; the feature file's Status and Trace are what a resumed lead reads |
| Codex multi-agent | Roles in `.codex/agents/*.toml`; results land in the lead's context | Default cap of 6 threads |
| Plain CLIs | The lead starts `claude -p` or `codex exec` per agent and coordinates through the files | Works everywhere; the fallback |

## Resuming

A resumed lead reads `STATUS.md`, then every feature file whose Status isn't
`merged` or `proven`, compares what the file lists with `git status` and the
branch, and says in one message where things stand before carrying on.

## Never

- A worktree, or `git stash`.
- Two agents writing the same folder.
- An agent asking the user a product question mid-feature: it writes the
  question in its report and the plan is updated.
- A merge without the explainer and the user's yes.
