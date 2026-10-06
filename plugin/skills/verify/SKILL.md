---
name: verify
description: Create or maintain the project's own verify skill, `.claude/skills/verify-<app>/`, which drives the real app the way a user does (launch, doctor, drive, evidence, stop) from the plan's feature files. Use on /verify. It writes the skill when the project has none, else audits and repairs it.
disable-model-invocation: true
---

# Verify

Every project needs one scripted way to drive the real app and prove what
it does. That is the project's own skill, `.claude/skills/verify-<app>/`.
This skill writes it when it is missing and keeps it honest once it exists.
Write it for the next agent, who reads it cold, mid-task.

The features are not in that skill. The plan's feature files,
`docs/plans/<project>/features/<slug>.md`, hold each feature's Scenarios,
Driving and Gotchas. The verify skill reads them and drives them. One map.

Look for `.claude/skills/verify-*/` with Launch, Doctor, Drive and Stop
sections. None: follow Create. One: follow Maintain. Several: ask which.

## Create

### 1. Learn the app from the repo

Ask the user only what the code can't tell you.

- Surface: what a user touches. Web UI, CLI or TUI, desktop, API, mobile,
  library. Pick the main one.
- Run: the repo's own dev command (`package.json`, Makefile, README), ports,
  env vars, seed data, auth.
- Drive: how an agent can work it. Existing harnesses first (Playwright in
  `e2e/`, expect scripts, PTY helpers, curl-able endpoints). Then the
  generic way: browser or CDP for web and Electron, tmux or PTY for CLI and
  TUI, HTTP for services.
- Observe: screenshots, terminal transcripts, response bodies, logs, exit
  codes, database rows.
- Isolate: can two instances run side by side (ports, data dirs, profiles)?
  If not, the skill must refuse to drive a shared instance.
- Feature files: where they are (`CLAUDE.md` names the plan
  folder). None yet: the skill still works for ad-hoc drives and says the
  map arrives with `plan-feature`.

If the checkout doesn't start as is, fix or report that first. A missing
asset the app never serves may be created as marked scaffolding and removed
in cleanup.

Done when each item has an answer from the repo or the user.

### 2. Write the skill

`.claude/skills/verify-<app>/SKILL.md` with frontmatter (`name:
verify-<app>`, a description naming the app, the surface and when to use
it) and these sections, each from what you found, no placeholders:

- Launch: the exact start command, how to tell it is ready, teardown. A
  short-lived CLI builds once, then each drive gets its own PTY or tmux
  session.
- Doctor: one read-only check that says "worth driving": process up, right
  build, our port, auth valid.
- Drive: the harness recipe with this repo's real selectors and commands.
  Stable handles (ARIA labels, data attributes, prompt strings, routes)
  over coordinates. How to run one feature file's Driving section, and all.
- Record: how to record a clip of a drive, so `interactive-explanation`
  reuses the same steps for its journey video.
- Evidence: what to capture and where (`temp/verification/<run>/`). Drive
  the real user path, capture the action and the resulting state, check
  side effects (rows, files, messages). Mocks only where production already
  isolates the external system.
- Stop: tear down what the run created. Kill what you started, never by
  process name. Keep the evidence.
- Features: the feature files' path and the rule: a drive that covers one
  entry point is incomplete when the file lists others; an empty Driving
  section is `not drivable yet`, reported, never invented.
- Helpers: every shipped script is executable and shown in the skill body.

Done when every section has real commands and selectors from this repo.

### 3. Run it once

Launch, doctor, drive one feature file's Driving section (or one path when
there are no feature files), capture evidence, stop. Check the evidence is
still there after cleanup. Fix what fails and run the cleanup after every
failed try.

Done when one full run passed and the evidence exists at its named path.

## Maintain

Edit only the verify skill's own folder and the Driving and Gotchas
sections of the feature files. Scenarios stay as they are: a behaviour the
app no longer does is a product regression to report. Product code stays.

1. Index. Every feature file with `Status: merged` or `proven` has a
   Driving section; one without is drift. A file the plan no longer lists
   is a question for the user.
2. Source wave. One read-only sub-agent per feature file, all at once. Each
   explains how the feature works from source, flags drift in Driving and
   Gotchas with citations, and returns one live recipe. They never drive
   the app or edit files.
3. Reconcile. Merge the recipes into as few app states as practical.
   Spot-check cited drift. Sweep `git log` for user-facing changes no
   feature file covers; report them as missing feature files.
4. Live pass, always, even when source looks clean. You drive, following
   the skill's Launch model. Every feature at least once. Doctor before the
   first drive, on each fresh session, and after any failed drive. Evidence
   survives every cleanup; check it at its path. Nothing a drive started
   outlives the drive. A doctor failure caused by skill drift: fix it and
   retry once. A feature you can't reach is `verified-unreachable` with the
   concrete prerequisite and the route you tried; a Driving section that
   omits that prerequisite is drift.
5. Triage. Wrong user steps: Driving drift, fix it. The harness can't drive
   working behaviour: harness gap, fix it (script executable, shown in the
   skill body), then re-drive. The app is broken: product gap, report it
   with its scenario, leave it out of this change.
6. Finish with one outcome: `clean` (nothing to change), `changed` (one set
   of proven corrections, re-read, left uncommitted for the user), or
   `blocked` (say what). Run notes stay in scratch, uncommitted.

Done when every feature file had source and live coverage and the outcome
is stated.
