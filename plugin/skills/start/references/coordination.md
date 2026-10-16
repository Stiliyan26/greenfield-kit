# Coordinating the agents

Use no worktrees: one checkout, one branch per feature, ownership by folder.
Parallel work is cheap where agents cannot collide.

```
LEAD (you): owns plan.md, the feature files, server/shared/, shared/, the schema; merges one PR at a time
   │
   ├── feature N      backend agent   the server folder, entities/<thing>/api, features/<action>/api
   │                  frontend agent  the views folder, widgets, features/<action>/{ui,model}, entities/<thing>/{ui,queries}
   │                  same checkout, branch feature/<slug>, each commits only its own folders
   │
   └── feature N−1    verify run + explainer build, then the PR for the user
```

## Before the first feature (stage 5, Foundation)

1. Build what every feature needs: the routes and views from the design
   pack, the database schema and first migration, auth, `server/shared/`,
   `shared/ui/` from the design, the check command and the `verify-<app>`
   skill.

   Done when the app runs and the check command is clean.

2. Land the foundation as a PR with an explainer (`interactive-explanation`,
   pr mode). The user approves. Merge it. Features start from that commit.

   Done when the foundation is on main.

## During a feature (stage 6)

1. Branch `feature/<slug>` from main. Start the backend `deliver-feature`
   agent with the feature file. It commits the contract and stops. Start the
   frontend agent. Tell the backend agent to continue. Run both in the background.

   Done when both agents run.

2. Each time an agent stops, read its report and every new file in
   `requests/`. Commit each requested item on `feature/<slug>`, by path. Tell
   the agent to continue. For a plan question, update the plan first. Send
   product questions to the user, one at a time, never to the agents.

   Never commit to main during a feature: uncommitted edits of the other agent
   block a rebase. The item reaches main with the PR.

   Done when every request has a commit or an answer.

3. When both agents report ready, write Driving, Gotchas and Trace into the
   feature file from both reports. Set `Status: review`. Rebase on main. Run
   the full suite three times, the check command and the e2e suite. Then run
   the verify skill on every Driving section merged so far. Send back a diff
   that touches files outside the Owns lists.

   Done when every check is green and the diff stays inside the Owns lists.

4. Build the explainer (`interactive-explanation`, pr mode) and open the PR.
   The user reads, watches and approves. Merge. Set `Status: merged`.
   Meanwhile, start the next feature's agents. They rebase when the previous
   PR merges.

   Done when the PR is merged and the next feature's agents run.

## The runtime

No agent can send a message while it works. Reports and files are the only
channel. An agent writes `requests/` and its report, then stops. The lead
reads them and tells it to continue.

| Runtime | How the lead starts and continues an agent |
| --- | --- |
| Claude Code subagents | The Agent tool, in the background; continue a stopped agent with a message to it. The default |
| Plain CLIs | `claude -p` per agent; continue with `claude -p --resume <session>`. The fallback |

## Never

- Use `git stash`.
- Let two agents write the same folder.
- Let an agent ask the user a product question. It writes the question in its
  report, and the lead updates the plan.
- Merge without the explainer and the user's yes.
