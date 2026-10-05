---
name: create-verification-skill
description: "Generate a project-local verification skill that drives the app the way a user does - launch, doctor, drive, evidence, stop - any language, framework or platform. It reads the plan's feature files as its map; it never keeps a second one. Use for /create-verification-skill, \"make a verify skill for this repo\", or when a project has no scripted way to prove UI, CLI or service behaviour."
disable-model-invocation: true
---

# Create a verification skill

Every serious project needs a scripted way to drive the real app and prove
behaviour: launch it, exercise a feature the way a user would, capture
evidence. This skill generates that as a project-local skill,
`.claude/skills/verify-<app>/`, tailored to the repo. You write it for the
next agent, not for a human: it will be read cold, mid-task, by an agent that
has never seen the app.

The features themselves are not in the skill. The plan's feature files,
`docs/plans/<project>/features/<slug>.md`, hold each feature's Scenarios,
Driving and Gotchas sections. The verify skill reads them and drives them.
One map, written once.

## 1. Interview the repo, not the user

Answer these from the codebase and only ask the user what you cannot observe:

- **Surface:** what does a user touch? A web UI, a CLI or TUI, a desktop app,
  an API, a mobile app, a library? Pick the primary one and note the rest.
- **Run:** how does the app start locally? Prefer the repo's own documented
  dev command (`package.json` scripts, a Makefile, the README). Note ports,
  env vars, seed data, auth.
- **Drive:** how can an agent interact with it programmatically? Existing
  harnesses first: Playwright specs in `e2e/`, expect scripts, PTY helpers,
  curl-able endpoints, a debug port. Only then a generic recipe: browser or
  CDP for web and Electron, a tmux or PTY harness for CLI and TUI, plain HTTP
  for services.
- **Observe:** what evidence can be captured? Screenshots, terminal
  transcripts, response bodies, logs, exit codes, database rows.
- **Isolate:** can two instances run side by side (ports, data dirs,
  profiles)? If not, say so in the generated skill: refusing to double-drive
  a shared instance beats corrupting the user's session.
- **Feature files:** where they are (`.agents/PROJECT.md` names the plan
  folder). No feature files yet → the skill still works for ad-hoc drives,
  and says the map arrives with `plan-feature`.

If the checkout doesn't build or start as-is, fix that first (or report it
precisely) before generating; a skill written against a broken base teaches
wrong steps. When an irrelevant missing asset blocks startup (a static dir the
API never serves, a sample config), the generated skill may create it, clearly
marked as verification scaffolding, and remove it in cleanup.

## 2. Generate the skill

Write `.claude/skills/verify-<app>/SKILL.md` with YAML frontmatter
(`name: verify-<app>` and a `description` that names the app, the surface,
and when to reach for it; without frontmatter the skill never registers) and
these sections, each grounded in what the interview found, no placeholders:

- **Launch:** the exact command that starts the app for verification, and
  how to tell it's ready (a log line, a port answering, a prompt). Include
  teardown. For a short-lived CLI or TUI there is no server to keep alive:
  launch means build once, then start each drive in its own PTY or tmux
  session.
- **Doctor:** one read-only check that answers "is this instance worth
  driving?": process up, right build, port owned by us, auth valid. An agent
  runs this first whenever anything looks off.
- **Drive:** the harness recipe with real selectors and commands from this
  repo, not examples. Prefer stable handles (ARIA labels, data attributes,
  prompt strings, route paths) over coordinates and tab order. Then: how to
  run one feature file's Driving section, and how to run them all.
- **Record:** how to record a clip of a drive (`recordClip` from the
  project's recorder, or the harness's video option), so the
  `interactive-explanation` skill can reuse the same steps for its journey
  video. Same recipe, two outputs.
- **Evidence:** what to capture and where it goes
  (`temp/verification/<run>/`). The proof standards: exercise the real user
  path, not internal setters or test-only endpoints; capture the action and
  the resulting state, not just the final screen; verify side effects (rows,
  files, messages) alongside what's visible; mocks only where a production
  boundary already isolates the external system. When the safe path is a
  dry-run, verify what it skips by observing (files, network) rather than
  trusting its name.
- **Stop:** how to tear down what the run created. Never kill by process
  name; kill what you started. Cleanup removes instances and scratch state,
  never the evidence.
- **Features:** the path of the feature files and the rule: the map is their
  Scenarios, Driving and Gotchas sections; a drive that covers one entry
  point is incomplete when a feature file lists others; a feature with an
  empty Driving section is `not drivable yet`, reported, never invented.
- **Helpers:** any script the skill ships is executable and its invocation
  is shown in the skill body.

## 3. Prove the generated skill before handing it over

Run its own instructions end to end once: launch, doctor, drive one feature
file's Driving section (or one ad-hoc path when there are no feature files),
capture evidence, stop. After cleanup, confirm the evidence still exists at
the named location; a cleanup that eats the proof fails this step. Fix what
fails, and run the generated cleanup after every failed iteration too, so
broken attempts don't strand processes and ports. A generated skill that was
never executed is a draft, not a deliverable.

## 4. Offer the maintenance loop

Point the user at `/maintain-verification-skill` for keeping the skill and
the feature files' Driving sections honest as the app changes.
