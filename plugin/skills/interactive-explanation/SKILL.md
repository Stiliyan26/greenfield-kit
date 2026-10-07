---
name: interactive-explanation
description: Show what a change does as a local page with videos, and write the PR description from the same script. Use in pr mode when a feature file reaches Status review or the foundation is done; in task mode after a smaller change; or on /interactive-explanation <slug> [task|pr].
---

# Interactive explanation

You turn one change into a page the user can read in a few minutes, with a
journey video for users and an architecture video for maintainers. In `pr`
mode the same script also becomes the PR description. The user reads,
watches and approves; nobody reads the diff.

`<skill-root>` is the folder this `SKILL.md` is in. Everything you make goes
in `temp/explainers/<slug>/` in the project. It is gitignored and deleted at
the end.

## Two modes

| | `pr` | `task` |
| --- | --- | --- |
| When | A feature file reached `Status: review`, or the foundation is done | A smaller change with something to see |
| Steps | 1 to 6 | 1, 2, 4, 6 |
| Videos | Architecture always; journey when the UI changed | A journey only when worth watching |
| Ask before recording | Yes, show the narration first | No |

Nothing to see (a typo, a config value, research): skip the explainer and
say so.

## The page

The page and the PR body have the same sections in the same order. A section
the script doesn't have is left out.

1. Summary: what a user can do now, the impact, one to three sketches
2. Merge danger: the door, the blast radius, deploy steps
3. Evidence: the journey video, the tests, and before/after test output
4. Review map: each changed component boxed on its screen. These are the
   only screenshots; the journey video already shows the plain screens
5. How it works: diagrams and the architecture video
6. Before → After
7. Data model
8. Outcome: the decisions with their Q-numbers

## Setup, once per machine and project

- `ffmpeg` and `ffprobe` on the path.
- `cd <skill-root>/remotion && bun install`.
- The project's `.claude/explain.config.json`, written by `setup-project`.
  Every key is optional: `brand`, `context` (where plan, feature files and
  `DESIGN.md` live), `database` (a command that prints schema facts),
  `journey` (the verify skill's serve, doctor, drive and stop commands, the
  recorder, where evidence lands). No `journey`: no journey video.
- A voice key. Narration uses OpenRouter when `OPENROUTER_API_KEY` is in
  the shell, `.claude/local/explain.env` or `~/.claude/explain.env`. The
  first time a build finds none, give the user this once and let them run
  it. Never read, print or commit the file.

  ```
  mkdir -p ~/.claude && chmod 700 ~/.claude
  printf 'OPENROUTER_API_KEY=<paste here>\n' > ~/.claude/explain.env && chmod 600 ~/.claude/explain.env
  ```

  They decline: build with `--voice say` and don't ask again this session.

## 1. Research

Read the diff (`git diff main...HEAD`, `git log main..HEAD`), the feature
file, `plan.md` and `DESIGN.md`. For screens, read the Driving section and
the e2e spec and reuse their selectors.

Choose the diagrams, sketches, evidence and merge danger with
[writing.md](references/writing.md). For a PR, also list 3–6 journey steps
with what each was like before, and 3–6 architecture decisions with their
Q-numbers.

Ask the user one message with only what the code can't tell you: the
audience, the role to record as, any "before" you're unsure of.

Done when you can say in one line what the user can do now that they
couldn't before.

## 2. Script

Write `temp/explainers/<slug>/script.json` in the shape of
[script-format.md](references/script-format.md), with the text rules in
[writing.md](references/writing.md).

For a PR, show the user the narration as a numbered list with the diagram
types. Wait for a yes.

Done when the script validates (`build.mjs --pr-only` prints no style
warnings) and, for a PR, the user said yes.

## 3. Record the journey

Needs `journey` in the config. Write the recipe at `journey.recipe`: one
test per clip, each calling `recordClip` from `journey.recorder`, following
the feature file's Driving section. Call `point` before each click and
`pause` between actions. One idea per clip, 10–40 seconds. Save a screenshot
at each screen with a changed component and list it in `screens`; the
review map boxes the components on it.

Run `journey.serve`, then `journey.doctor`, then `journey.drive <recipe>`,
then `journey.stop`. Use seeded accounts. Never record against a
development or production database.

Done when every clip and screenshot is in `journey.evidence`.

## 4. Build and check

```sh
node <skill-root>/scripts/build.mjs <slug>            # check → narration → clips → render → page
node <skill-root>/scripts/build.mjs <slug> --pr       # also pr-body.md
node <skill-root>/scripts/build.mjs <slug> --pr-only  # the PR body only, fast
node <skill-root>/scripts/build.mjs <slug> --voice say
```

Narration is cached and clips are reused, so rebuilds are cheap. "Cannot
render yet" names what is missing.

Open `index.html` and fix without asking: narration that runs past its clip
(split the scene), a scene that says more than it shows (move detail to the
narration), a diagram too wide (`LR` to `TD`, or split it), any style
warning, a reading time over budget.

Done when the page opens clean and you've told the user its sections and
each video's length.

## 5. Publish the PR description

`--pr` prints the publish command. It runs in the explainer folder and
uploads the media to GitHub, so nothing is committed:

```sh
gh pr edit 53 --body-file pr-body.md --attach ./review/a.png --attach ./journey.mp4
```

Needs gh 2.99 or later. Files must be 10 MB or less; the build warns about
bigger ones. Without `prUrl` in the script the command is `gh pr create`.

Ask before you run it. Publishing is the user's call.

Done when the PR shows the page's sections and the videos play.

## 6. Clean up

After the publish succeeds (PR), or after the user has seen the page (task):

```sh
rm -rf temp/explainers/<slug> <the journey recipe>
```

Done when the folder is gone.

## Changing the skill

Scripts live in `scripts/` (`build.mjs` is the entry, `page/` the page) and
the renderer in `remotion/`. A new scene kind changes six places together:
`remotion/src/types.ts`, a component in `remotion/src/scenes/`, a case in
`Explainer.tsx`, `SceneKind` in `scripts/constants.mjs`, the checks in
`scripts/validate-script.mjs`, and the scene table in
`references/script-format.md`.
