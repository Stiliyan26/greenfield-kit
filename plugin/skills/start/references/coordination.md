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
2. Land it as a PR with an explainer (`interactive-explanation`, pr mode).
   The user approves; you merge. Features start from that commit.

## During a feature (stage 6)

1. Branch `feature/<slug>` from main. Start the backend `deliver-feature`
   agent with the feature file. It commits the contract, reports and stops.
2. Start the frontend agent, then tell the backend agent to continue. Both
   run in the background; the skill carries the ownership, contract-first
   and no-stash rules.
3. Each time an agent stops, read its report and every new file in
   `requests/`. Commit each requested item on `feature/<slug>`, by path, then
   tell the agent to continue. Never commit to main during a feature: the
   other agent's uncommitted edits block a branch switch and a rebase. The
   item reaches main with the PR. A plan question: update the plan first.
   Product questions go to the user, one at a time; never to the agents.
4. When both report ready: write Driving, Gotchas and Trace into the
   feature file from both reports, set `Status: review`, rebase on main, run the full suite three times,
   `bun run check`, the e2e suite, then the verify skill on every Driving
   section merged so far. A diff that touches files outside the Owns lists
   is sent back, not merged.
5. Build the explainer (`interactive-explanation`, pr mode) and open the PR.
   The user reads, watches and approves. Merge. Feature `Status: merged`.
6. Meanwhile, start the next feature's agents. Their branch starts from
   main; they rebase when the previous PR merges.

## The runtime

No agent can send a message while it works. Reports and files are the only
channel: an agent writes `requests/` and its report, then stops; the lead
reads them and tells it to continue.

| Runtime | How the lead starts and continues an agent |
| --- | --- |
| Claude Code subagents | The Agent tool, in the background; continue a stopped agent with a message to it. The default |
| Plain CLIs | `claude -p` per agent; continue with `claude -p --resume <session>`. The fallback |

## Resuming

A resumed lead reads `STATUS.md`, then every feature file whose Status isn't
`merged`, compares what the file lists with `git status` and the
branch, and says in one message where things stand before carrying on.

## Never

- A worktree, or `git stash`.
- Two agents writing the same folder.
- An agent asking the user a product question mid-feature: it writes the
  question in its report and the plan is updated.
- A merge without the explainer and the user's yes.
