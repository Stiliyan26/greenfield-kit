---
name: interactive-explanation
description: Show what a change does as a local page with videos, and write the PR description from the same script. Use when a feature file reaches Status review, when the foundation is done, after a smaller change that has something to see, or when the user runs /interactive-explanation with a slug and a mode (task or pr).
---

# Interactive explanation

Turn one change into a page that the user reads in a few minutes. The page
has a journey video for users and an architecture video for maintainers. In
`pr` mode the same script is also the PR description. The user reads,
watches and approves. Nobody reads the diff.

`<skill-root>` is the folder that holds this `SKILL.md`. Put everything you
make in `temp/explainers/<slug>/` in the project. Git ignores it. Delete it
at the end.

## Two modes

| | `pr` | `task` |
| --- | --- | --- |
| When | A feature file reached `Status: review`, or the foundation is done | A smaller change with something to see |
| Steps | 1 to 6 | 1, 2, 4, 6 |
| Videos | Architecture always; journey when the UI changed | A journey only when worth watching |
| Ask before recording | Yes, show the narration first | No |

If there is nothing to see (a typo, a config value, research), skip the
explainer and say so.

## The page

The page and the PR body have the same sections in the same order. Leave out
a section that the script does not have.

1. Summary: what a user can do now, the impact, one to three sketches
2. Merge danger: the door, the blast radius, deploy steps
3. Evidence: the journey video, the tests, and before/after test output
4. Review map: each changed component boxed on its screen. These are the
   only screenshots. The journey video already shows the plain screens
5. How it works: diagrams and the architecture video
6. Before → After
7. Data model
8. Outcome: the decisions with their Q-numbers

## Setup, once per machine and project

1. Put `ffmpeg` and `ffprobe` on the path.
2. Run `cd <skill-root>/remotion && bun install`.
3. Read the project's `.claude/explain.config.json`. Every key is optional.
   - `brand`
   - `context`: where the plan, the feature files and `DESIGN.md` live
   - `database`: a command that prints schema facts
   - `journey`: the serve, doctor, drive and stop commands, the recorder
     and where evidence lands. Without `journey`, make no journey video.
4. Check for a voice key. Narration uses OpenRouter when `OPENROUTER_API_KEY`
   is in the shell, in `.claude/local/explain.env` or in
   `~/.claude/explain.env`. `references/explain.env.example` shows the file.
   If the first build finds no key, give the user these commands once.
   Let the user run them. Never read, print or commit the file.

   ```
   mkdir -p ~/.claude && chmod 700 ~/.claude
   printf 'OPENROUTER_API_KEY=<paste here>\n' > ~/.claude/explain.env && chmod 600 ~/.claude/explain.env
   ```

   If the user declines, build with `--voice say`. Do not ask again in this
   session.

Done when the tools run, the config is read and a voice is chosen.

## 1. Research

1. Read the diff (`git diff main...HEAD`, `git log main..HEAD`), the feature
   file, `plan.md` and `DESIGN.md`.
2. For screens, read the Driving section and the e2e spec. Reuse their
   selectors.
3. Choose the diagrams, sketches, evidence and merge danger with
   [writing.md](references/writing.md).
4. For a PR, list 3–6 journey steps, with what each was like before. Also
   list 3–6 architecture decisions with their Q-numbers.
5. Ask the user one message. Ask only what the code cannot tell you: the
   audience, the role to record as, any "before" you are unsure of.

Done when you can say in one line what the user can do now that they could
not before.

## 2. Script

1. Write `temp/explainers/<slug>/script.json` in the shape of
   [script-format.md](references/script-format.md). Follow the text rules in
   [writing.md](references/writing.md).
2. For a PR, show the narration to the user as a numbered list with the
   diagram types. Wait for a yes.

Done when the script validates (`build.mjs --pr-only` prints no style
warnings) and, for a PR, the user said yes.

## 3. Record the journey

This step needs `journey` in the config.

1. Write the recipe at `journey.recipe`. Use one test per clip. Each test
   calls `recordClip` from `journey.recorder`. Follow the Driving section of
   the feature file.
2. Call `point` before each click. Call `pause` between actions.
3. Show one idea per clip, 10–40 seconds.
4. Save a screenshot at each screen with a changed component. List it in
   `screens`. The review map boxes the components on it.
5. Run `journey.serve`, then `journey.doctor`, then `journey.drive <recipe>`,
   then `journey.stop`.
6. Use seeded accounts. Never record against a development or production
   database.

Done when every clip and screenshot is in `journey.evidence`.

## 4. Build and check

```sh
node <skill-root>/scripts/build.mjs <slug>            # check → narration → clips → render → page
node <skill-root>/scripts/build.mjs <slug> --pr       # also pr-body.md
node <skill-root>/scripts/build.mjs <slug> --pr-only  # the PR body only, fast
node <skill-root>/scripts/build.mjs <slug> --voice say
```

Narration is cached and clips are reused, so a rebuild is cheap. The message
"Cannot render yet" names what is missing.

1. Run the build.
2. Open `index.html`. Fix these without asking:
   - Narration that runs past its clip: split the scene.
   - A scene that says more than it shows: move the detail to the narration.
   - A diagram that is too wide: change `LR` to `TD`, or split it.
   - Any style warning.
   - A reading time over budget.
3. Tell the user the sections of the page and the length of each video.

Done when the page opens clean and the user knows its sections and video
lengths.

## 5. Publish the PR description

1. Run `build.mjs <slug> --pr`. It prints the publish command. The command
   runs in the explainer folder. It uploads the media to GitHub, so Git
   commits nothing.

   ```sh
   gh pr edit 53 --body-file pr-body.md --attach ./review/a.png --attach ./journey.mp4
   ```

2. Use gh 2.99 or later. Keep each file at 10 MB or less. The build warns
   about bigger files.
3. If the script has no `prUrl`, the command is `gh pr create`.
4. Ask the user before you run the command. Publishing is the user's call.

Done when the PR shows the page's sections and the videos play.

## 6. Clean up

Start after the publish succeeds (PR), or after the user has seen the page
(task). The page keeps its own copies of the shots. Delete this change's
test output too: `temp/verification/<slug>/` and each review or verify run
there that this page used. Keep a folder that another feature still uses.
Delete `.playwright-mcp/` when no other agent drives a browser.

```sh
rm -rf temp/explainers/<slug> <the journey recipe> temp/verification/<slug> <the runs this page used>
```

Done when the folders are gone.

## Changing the skill

Scripts live in `scripts/`. `build.mjs` is the entry and `page/` holds the
page. The renderer lives in `remotion/`. `tsconfig.json` and `bun.lock` pin
the build. `src/Root.tsx` registers the compositions. `src/ReviewShot.tsx`
draws the review shots. Each scene kind has one component in
`src/scenes/`: `Title.tsx`, `BeforeAfter.tsx`, `Clip.tsx`, `Files.tsx`,
`Diagram.tsx`, `Code.tsx` and `Bullets.tsx`. `shared.tsx` holds their common
parts.

A new scene kind changes six places together:

1. `remotion/src/types.ts`
2. A component in `remotion/src/scenes/`
3. A case in `Explainer.tsx`
4. `SceneKind` in `scripts/constants.mjs`
5. The checks in `scripts/validate-script.mjs`
6. The scene table in `references/script-format.md`

Reason: the six places must agree. A scene kind that one of them lacks
fails at validation or at render.
