---
name: verify
description: Creates or maintains the project's own verify skill, named verify- plus the app's name in `.claude/skills/`, which drives the real app the way a user does (launch, doctor, drive, evidence, stop) from the plan's feature files. Writes it when the project has none, else audits and repairs it. Use when the user asks to check that the app works, to drive the app, to set up the browser check, or runs /verify.
---

# Verify

Every project needs one scripted way to drive the real app and prove what
it does. That is the project's `verify-<app>` skill, in
`.claude/skills/verify-<app>/`. This skill writes it when it is missing and
keeps it correct once it exists.

The next agent reads the project's `verify-<app>` skill cold, in the middle
of a task. Write it for that reader.

The feature files hold the features, not the project's `verify-<app>`
skill. Each feature file has Scenarios, Driving and Gotchas. The project's
`CLAUDE.md` names the plan folder that holds them. The project's
`verify-<app>` skill reads them and drives them. One map.

Look for `.claude/skills/verify-*/` with Launch, Doctor, Drive and Stop
sections.

- None found: follow Create.
- One found: follow Maintain.
- Several found: ask the user which one.

## Create

Copy this checklist into the reply and tick it off:

```text
Create progress:
- [ ] 1 Each item learned from the repo or the user
- [ ] 2 SKILL.md written with real commands and selectors
- [ ] 3 One full run passed, evidence at its path
- [ ] 4 A fresh agent ran it cold
```

1. **Learn the app from the repo.** Ask the user only what the code cannot
   tell you. Find these items:
   - Surface: what a user touches (web UI, CLI, TUI, desktop, API, mobile,
     library). Pick the main one.
   - Run: the repo's own dev command (`package.json`, Makefile, README),
     ports, env vars, seed data, auth.
   - Drive: how an agent works the app. Use existing harnesses first
     (Playwright in `e2e/`, expect scripts, PTY helpers, endpoints that
     curl can call). Then the generic way: browser or CDP for web and
     Electron, tmux or PTY for CLI and TUI, HTTP for services.
   - Observe: screenshots, terminal transcripts, response bodies, logs,
     exit codes, database rows.
   - Isolate: can two instances run side by side (ports, data dirs,
     profiles)? If not, the skill must refuse to drive a shared instance.
   - Feature files: the plan folder that `CLAUDE.md` names. If there are
     none, the skill still drives ad-hoc paths and says that the
     feature-file map arrives with the plan.

   If the checkout does not start as is, fix it or report it first. You may
   create a missing asset that the app never serves. Mark it as scaffolding
   and remove it in cleanup.

   Done when each item has an answer from the repo or the user.

2. **Write the skill.** Create `.claude/skills/verify-<app>/SKILL.md`. Use
   this frontmatter: `name: verify-<app>` and a description that names the
   app, the surface and when to use it. Use these section names exactly,
   because Maintain finds the skill by them. Write each from what you
   found. Leave no placeholder.
   [example-verify-skill.md](references/example-verify-skill.md) shows the
   bar.
   - Launch: the exact start command, how to tell that the app is ready,
     and the teardown. A short-lived CLI builds once. Each drive then gets
     its own PTY or tmux session.
   - Doctor: one read-only check that says "worth driving". Check that the
     process is up, the build is right, the port is ours and auth is valid.
   - Drive: the harness recipe with this repo's real selectors and
     commands. Use stable handles (ARIA labels, data attributes, prompt
     strings, routes), not coordinates. Say how to run one feature file's
     Driving section, and how to run all of them.
   - Record: how to record a clip of a drive.
   - Evidence: what to capture and where (`temp/verification/<run>/`).
     Drive the real user path. Capture the action and the resulting state.
     Check side effects (rows, files, messages). Use mocks only where
     production already isolates the external system.
   - Stop: tear down what the run created. Kill only what you started,
     never by process name. Keep the evidence.
   - Features: the path of the feature files, and this rule. A drive that
     covers one entry point is incomplete when the file lists others. An
     empty Driving section is `not drivable yet`. Report it. Never invent
     one.
   - Helpers: make every shipped script executable and show it in the skill
     body.

   Done when every section has real commands and selectors from this repo.

3. **Run it once.** Launch, run doctor, drive one feature file's Driving
   section (or one path when there are no feature files), capture evidence
   and stop. Check that the evidence is still there after cleanup. Run the
   cleanup after every failed try. If a step fails, fix the skill and
   return to the start of this step.

   Done when one full run passed and the evidence exists at its named path.

4. **Test it cold.** Start one sub-agent that did not write the skill. Give
   it only the path of the new `SKILL.md` and one feature file. It runs
   Launch, Doctor, Drive and Stop and reports each gap it met. If it reports
   a gap, fix the skill and return to step 3.

   Done when a fresh sub-agent finished a run with no gap.

   Reason: the author knows what the file leaves out. Only a cold reader
   finds those gaps.

## Maintain

Edit only the folder of the project's `verify-<app>` skill and the Driving
and Gotchas sections of the feature files. Leave Scenarios as they are. A
behaviour the app no longer has is a product regression: report it. Leave
product code alone.

Copy this checklist into the reply and tick it off:

```text
Maintain progress:
- [ ] 1 Index: each merged feature file checked
- [ ] 2 Source wave: every sub-agent returned
- [ ] 3 Reconcile: one recipe set, git log swept
- [ ] 4 Live pass: every feature driven or unreachable
- [ ] 5 Triage: every failure labelled
- [ ] 6 Outcome stated
```

1. **Index.** Check every feature file that the plan marks as merged for a
   Driving section. A file without one is drift. A file that the plan no
   longer lists is a question for the user.

   Done when each feature file is marked in the index or in the questions.

2. **Run the source wave.** Start one read-only sub-agent per feature file,
   all at once. Each sub-agent explains from source how the feature works.
   It flags drift in Driving and Gotchas with citations. It returns one
   live recipe. It never drives the app and never edits files.

   Done when every sub-agent has returned.

3. **Reconcile.** Merge the recipes into as few app states as practical.
   Spot-check the cited drift. Sweep `git log` for user-facing changes that
   no feature file covers. Report them as missing feature files.

   Done when one merged recipe set exists and the sweep is reported.

4. **Run the live pass.** Do this even when the source looks clean. You
   drive, and you follow the skill's Launch model.
   - Drive every feature at least once.
   - Run doctor before the first drive, on each fresh session and after
     any failed drive.
   - Let evidence survive every cleanup. Check it at its path.
   - Let nothing that a drive started outlive the drive.
   - A doctor failure from skill drift: fix it and retry once.
   - A feature you cannot reach is `verified-unreachable`. State the
     concrete prerequisite and the route you tried. A Driving section that
     omits that prerequisite is drift.

   Done when every feature was driven or marked `verified-unreachable`.

5. **Triage.** Sort each failure:
   - Wrong user steps: Driving drift. Fix it, then return to step 4 for
     that feature.
   - The harness cannot drive working behaviour: harness gap. Fix it
     (script executable and shown in the skill body), then return to step
     4 for that feature.
   - The app is broken: product gap. Report it with its scenario. Leave it
     out of this change.

   Done when every failure has one of the three labels.

6. **Finish with one outcome.**
   - `clean`: nothing to change.
   - `changed`: one set of proven corrections. Re-read it. Leave it
     uncommitted for the user.
   - `blocked`: say why.

   Keep run notes in scratch, uncommitted.

   Done when every feature file had source and live coverage and the
   outcome is stated.

Reason: a skill that drifts from the app fails silently. A live pass on
every run catches that drift before the next agent trusts the skill.
