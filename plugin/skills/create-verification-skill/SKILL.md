---
name: create-verification-skill
description: Write a project skill that starts the real app, drives it the way a user does, and saves proof - with a map of the app's features. Use when a project has no scripted way to prove its screens, API or CLI work, or for "make a verify skill for this repo".
---

<!-- Adapted from pstack (github.com/cursor/plugins, MIT, (c) 2026 Lauren Tan). -->

# Create a verification skill

Every project needs one scripted way to start the real app, use a feature the
way a user would, and save proof. This skill writes that as
`.agents/skills/verify-<app>/`. Write it for the next agent, who reads it cold
in the middle of a task and has never seen the app. [example.md](references/example.md)
shows a finished one — copy its shape, never its values.

## 1. Learn it from the repo, not the user

Answer these from the code. Ask the user only what the code can't tell you.

- **Surface:** what does a user touch? Web UI, API, CLI, mobile app. Pick the
  main one and note the others.
- **Start:** how does the app start locally? Prefer the repo's own commands.
  Note ports, settings, seed data and logins.
- **Drive:** how can an agent use it from a script? Existing tools first
  (Playwright specs, API test helpers). Only then a generic one.
- **Proof:** what can be saved? Screenshots, response bodies, exit codes,
  database rows, logs.
- **Isolation:** can two copies run side by side? If not, say so in the
  skill. Refusing to drive a shared copy beats breaking someone's session.

If the app doesn't start as it is, fix that first or report exactly why. A
skill written against a broken start teaches wrong steps.

## 2. Write the skill

`.agents/skills/verify-<app>/SKILL.md` needs a `name: verify-<app>` and a
`description` that names the app, the surface and when to use it. Fill every
section from what step 1 found. No placeholders.

- **Launch:** the exact start command, how to tell it's ready, and how to stop
  it.
- **Doctor:** one read-only check: is this copy worth driving? Process up,
  right build, our ports, login works. Run it first, and again whenever
  something looks off.
- **Drive:** real selectors and commands from this repo, not examples. Prefer
  stable handles: roles and names, labels, routes. Never screen positions.
- **Evidence:** what to save and where. Use the real user path, not test-only
  shortcuts. Save the action and the resulting state, not only the last
  screen. Check side effects (saved rows, sent messages) as well as the
  screen.
- **Cleanup:** stop only what this run started, never by process name.
  Cleanup removes the app and scratch data, never the evidence.
- **Helpers:** every script it ships runs as shown in the skill.

## 3. Start the feature map

Create `verify-<app>/features/README.md` and one file per user feature. Start
with the top 3-5, taken from routes, menus or docs. The README lists the
starting state, driving rules, proof rules and the features. Each feature
file has a title, one paragraph, then these four sections in order:

1. `Sub-features`: short IDs, one line each.
2. `How to get to it (user POV)`: every way a user reaches it.
3. `Driving it with <tool>`: starts with `Preconditions:`, then each user action
   with its exact command and what you should see.
4. `Gotchas`: traps that waste or spoil a run.

A proof that drives one convenient entry point is incomplete when the map
lists others.

## 4. Prove it before handing it over

Run the new skill's own steps once: launch, doctor, drive ONE mapped feature,
save evidence, clean up. After cleanup, check the evidence is still where the
skill says. Fix what fails, and run cleanup after every failed try too. A
skill that was never run is a draft, not a deliverable.

## 5. Point to upkeep

Tell the user about `maintain-verification-skill` for keeping the map true as
the app changes.
