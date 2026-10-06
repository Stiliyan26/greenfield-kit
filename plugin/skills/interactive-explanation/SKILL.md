---
name: interactive-explanation
description: >-
  Show the user what a change does, as a local page instead of a diff.
  "pr" mode for every feature or foundation PR: the full page, a narrated
  journey video and an architecture video, and the PR description from the
  same script. "task" mode after a smaller piece of work (before → after,
  diagrams, screens). Mermaid diagrams, ASD-STE100 text. Use when a feature
  file is done, when the foundation is done, or on /interactive-explanation <slug> [task|pr].
---

# Interactive explanation

A page that lets the user **see** one change instead of reading its diff. In
the kit's pipeline every feature and the foundation land as a PR with this
explainer in `pr` mode; the user watches, reads and approves. A change with no
feature file (a color, one more field) gets no explainer and no PR.

The work folder is `temp/explainers/<slug>/` in the project (gitignored). It
holds `index.html`, plus `journey.mp4`, `architecture.mp4` and `pr-body.md`
when the mode needs them. Never commit it; delete it when done (step 6).

**The build** runs from the project root:

```
node <skill-root>/scripts/build.mjs <slug>
```

`<skill-root>` is this skill's folder (`.claude/skills/interactive-explanation`
or the plugin's copy). It needs `ffmpeg` and `ffprobe` on the path, and the
renderer installed once per machine: `cd <skill-root>/remotion && bun install`.
Set `EXPLAIN_ROOT` when you can't run from the project root.

## Project setup

The skill holds no project knowledge. Read `.claude/explain.config.json`
first; every key is optional:

| Key | Meaning |
| --- | --- |
| `brand` | Name on the page and videos. Default: the repo folder name |
| `database` | `{ command, cwd }`: prints schema facts as JSON for the tables passed to it ([format](references/script-format.md#schema-facts)). Without it, draw schemas as an `er` diagram |
| `journey` | `{ serve, doctor, drive, stop, recorder, recipe, evidence, needs }`: the verify skill's launch, doctor, drive and stop commands, the clip recorder, the recipe path, where evidence lands (`temp/verification`), what must be running. Without it, skip the journey video |
| `context` | Folders with the plan and feature files (`docs/plans/<project>`), design rules (`DESIGN.md`) and test helpers |
| `voiceEnv` | A project-only override of the voice key file (default `.claude/local/explain.env`). Most projects leave it out; see **The voice key** below |

`setup-project` writes a starter config; the `verify-<app>` skill's Record
section is the `journey.recorder`.

### The voice key

Narration uses OpenRouter when `OPENROUTER_API_KEY` is set, read in this
order: the shell, the project's `.claude/local/explain.env`, the user's
`~/.claude/explain.env`. The user's file is set once and serves every
project. Without a key, narration uses macOS `say`.

The first time a build on this machine finds no key, ask the user once,
before the build, and give them the command to run themselves. Never ask
them to paste the key in chat, never read or print the file, never commit
it:

```
mkdir -p ~/.claude && chmod 700 ~/.claude
printf 'OPENROUTER_API_KEY=<paste here>\n' > ~/.claude/explain.env && chmod 600 ~/.claude/explain.env
```

If they'd rather not, build with `--voice say` and don't ask again in that
session. The model and voice have defaults (`google/gemini-3.8-flash-lite-tts`,
`Kore`; about $0.06 for five minutes); `EXPLAIN_TTS_MODEL` and
`EXPLAIN_TTS_VOICE` in the same file change them. Never ask the user to buy
anything.

## Modes

| | `pr` (every feature and foundation PR) | `task` (a smaller piece of work) |
| --- | --- | --- |
| When | A feature file reached `Status: review`, or the foundation is done | You changed code, schema or UI without a feature file and there is something to see |
| Reading time | 2–5 min | 1–3 min |
| Required | `description`, `impact`, `outcome`, 1–3 `sketches`, `evidence`, 1–3 diagrams, `risks` (door and blast radius), `tests`, at least one video | `description`, `impact`, `outcome`, and `beforeAfter`, a diagram or a sketch |
| Videos | Architecture always; journey when the UI changed | Only a journey, and only when the UI change is worth watching |
| Ask first? | Show the narration and diagram choice before recording | No. Build, open, put the path in the final reply |

Skip the explainer only when there is nothing to see (a typo, a comment, a
config value, research) and say so. For a task, do steps 1, 2, 4 and 6; name
the slug after the task (`order-row-warning`).

The page shows only the sections the script has: header (title, PR link,
reading time, impact, door and blast radius chips) → Summary (+ sketches) →
Review map → Before → After → How it works (+ architecture video) → Data
model → Evidence (+ journey video and tests) → Outcome → Merge danger.

`pr-body.md` has the same content and Mermaid, so the PR and the page never
drift. It opens with **Summary**, **Evidence** and **Merge Danger**, then the
Review map. Everything else folds into a "Full explanation" `<details>` block.

**Review map** (automatic when screens have component boxes): each screen is
cropped to the changed components, with one numbered box each (green added,
amber changed). Under each screen come the files to read, top to bottom: the
boxed component, then the changed files it imports, indented. Each file links
to its diff in the PR. Changed files that are on no screen follow, grouped by
top folder, then tests, then docs and config. The diff is against the PR's base
branch (or `base`, or `main`), uncommitted work included. Add one line per file
in `review.notes` when a file name does not say enough.

## 1. Research

Read before you write:

- `git diff main...HEAD` and `git log main..HEAD`, or the scope the user
  names.
- The feature file, `plan.md` (its Decisions with Q-numbers) and `DESIGN.md`
  (`context`).
- For screens, the feature file's Driving section and the e2e spec that
  already drive them. Reuse their selectors.

Pick the "How it works" diagrams from the diff:

| The diff touches | Use | Shows |
| --- | --- | --- |
| Schema, migrations | the `database` block | The generated ER (PK / FK / UK) and one row per relation. You write only what each link means |
| A call across layers | `sequence` | One call from the screen through the server function to the database and back |
| Client components | `component` (`flowchart TD`) | The component tree |
| A status or lifecycle | `state` | States and the actions between them |
| Anything else | `flowchart` | Actor → system → effect |

Tag flowchart nodes `:::added`, `:::changed`, `:::removed` or `:::kept`; the
page adds colours and a legend.

Pick the Summary **sketches** from the diff: the smallest text view that makes
the point. Use one, sometimes two or three, never all of them:

| The point is | `kind` | Shows |
| --- | --- | --- |
| Which files own what, or a broad refactor | `files` | A shallow file tree with a `# note` per line |
| UI structure, with the state and module boundaries that matter | `components` | A component tree |
| Runtime control flow | `calls` | A call tree |
| Logic or an algorithm | `pseudo` | Pseudocode |
| The exact new shape, when most of it is new or order matters | `code` | The lines, with `file` and `highlight` |

Set `diff: true` when the point is what changes and the shape already exists:
prefix each line with `+`, `-` or a space. Keep only the calls, files, props
and states the point needs.

Collect **evidence**: a before and an after for each claim. A screenshot pair
is best when the change is visible. Otherwise use a test run: the same test
failing before and passing after, or console output. For a "before" shot,
drive the recipe on the base branch with a `-before` step name.

Decide the **merge danger**. A two-way door is cheap to walk back. A one-way
door is not: a destructive migration, deleted data, a public contract change.
The blast radius is one word for what can break (`Orders`, `Auth`,
`Layout`), with the ramifications in its text.

For a PR, also note the 3–6 journey steps (and what each was like before),
and the 3–6 architecture decisions: the file split, which layer holds which
state, where a rule lives and why, each with its Q-number from `plan.md`.
Then ask the user, in one message, only what the code cannot tell you: the
audience, the role to record as, and any part of the "before" you are unsure
of.

## 2. Script

Write `temp/explainers/<slug>/script.json`. Shapes, scene kinds and an
example are in [references/script-format.md](references/script-format.md).

- `description`: 2–5 things a user can do, in the user's words. `impact`:
  one sentence a manager would repeat. Decisions go in `outcome` with the
  Q-number in the text. Deploy steps go in `risks.deploy`.
- `sketches`: each has one sentence of `text` next to it. A sketch is under
  15 lines and 70 columns.
- `evidence`: each pair has a `label` that names the claim it proves.
- `risks`: `door` and `blastRadius` first. Add `items` (Data, API, Users,
  Performance) only for an area that changes.
- **Reading budget**: the build estimates the page (200 words a minute, 15 s
  a diagram, 5 s a screen, 10 s a sketch or test output) and warns over the
  limit. Cut words before
  sections.
- **All text is ASD-STE100**: page, PR body and narration.
  - One idea per sentence, active voice, present tense.
  - At most 20 words in a step and 25 in any other sentence.
  - Use the simple word ("use", not "utilize"; "about", not "approximately";
    "to", not "in order to"). No "simply", "just", "basically", "very".
  - Use what the screen calls things. File and function names belong only
    in the architecture video and the Summary sketches (files, components,
    calls, code). The prose next to a sketch still uses screen words.
  - Define a term the first time you use it.
  - The build lists every sentence that breaks a rule. Fix them all before
    you show the user.
- **Videos**: `journey` is for users and `architecture` is for maintainers.
  Give each 6–10 scenes and 2–5 minutes of narration in total. Each scene
  has 2–4 sentences, 10–30 s spoken.
  - Journey: title → `before-after` → one `clip` per step (one idea each) →
    closing `bullets`.
  - Architecture: title → `files` → `diagram` → `code` for the lines that
    matter → `bullets` with the decisions and their Q-numbers.
  - The "before" is spoken, not recorded. Make it concrete: what the user had
    to do, and what went wrong.
  - Captions stay under 12 words and bullets under 14. The narration carries
    the detail.
  - `code` scenes show the 5–12 lines that carry the idea, under 70 columns,
    highlighting what the narration names.

For a PR, show the user the narration as a numbered list with the diagram
types. Get a yes before you record.

## 3. Record the journey (needs `journey`)

Write the recipe at `journey.recipe`: one test per clip, each calling
`recordClip` from `journey.recorder`. The steps are the feature file's
Driving section; copy the style of the recorder and a nearby e2e spec. Inside
a clip, call `point` before each click and `pause` between actions. Keep each
clip to one idea of 10–40 s. Clips are silent, so never time actions to the
words.

Use seeded accounts and data. Save a screenshot at each screen the page shows,
using the project's evidence helper, and list each one in `screens` as
`"<feature>/<step>"`. For the review map, the helper also writes
`<step>.components.json` next to each shot ([format](references/script-format.md#component-boxes)).

Run `journey.serve` (keep it running), then `journey.doctor`, then
`journey.drive <recipe>`, then `journey.stop`. The build takes the newest
clips and shots from `journey.evidence`. Never record against a development or
production database.

## 4. Build and review

```sh
node <skill-root>/scripts/build.mjs <slug>                      # check → tts → clips → render → page
node <skill-root>/scripts/build.mjs <slug> --pr                 # also write pr-body.md
node <skill-root>/scripts/build.mjs <slug> --pr-only            # check, then only pr-body.md (fast loop)
node <skill-root>/scripts/build.mjs <slug> --quality draft      # half size, for timing only
node <skill-root>/scripts/build.mjs <slug> --only architecture  # one video
node <skill-root>/scripts/build.mjs <slug> --voice say          # ignore the API key
```

Narration is cached and clips are reused, so a rebuild after a script edit is
cheap. "Cannot render yet" names the missing narration or clip.

Open `index.html` and fix these problems without being asked:

- Narration that runs many seconds past its clip: split the scene. (A held
  last frame is fine.)
- A scene that says more than it shows: move the detail into the narration or
  a `code` scene.
- A Mermaid diagram that is too wide: switch `LR` to `TD`, or split it.
  Labels that collide in a video diagram: nudge `x`/`y`.
- Any style warning, or a reading estimate over the budget.

Then tell the user what the page has: the sections, and each video with its
length.

## 5. Publish the PR description

`pr-body.md` holds the full explanation with the screenshots and videos as
local paths. `--pr` prints the command that publishes it. The command runs
in the explainer folder, for example:

```sh
gh pr edit 53 --body-file pr-body.md --attach ./screens/a.png --attach ./journey.mp4
```

The command attaches the review map images too. `--attach` needs gh 2.99 or
later and push access to the repo. It uploads each file to GitHub and replaces
the local path in the body with the uploaded URL, so nothing is committed.
Without `prUrl` in the script, the command is `gh pr create`. Ask before you
run it: publishing is the user's call.

- Images and videos must be 10 MB or less. The render re-encodes a larger
  video to fit, and the build warns about any file that is still too big.
- A video is a player only as `![](./video.mp4)` alone in its paragraph. The
  body already writes it that way.

## 6. Clean up

`temp/explainers/<slug>/` is a work folder, not output to keep. Delete it, and
the journey recipe, when the work is done:

- **PR:** after the publish command succeeds. GitHub now holds the media.
- **Task:** after the user has seen the page, or when the next task starts.

```sh
rm -rf temp/explainers/<slug> <journey.recipe for this slug>
```

A later rebuild synthesizes the narration again and needs the clips again.
Keep the folder only while the user still asks for changes.

## Changing the skill

Scripts are in `scripts/` (`build.mjs` is the entry; `page/` holds the
page), and the video renderer is in `remotion/`. To add a scene kind, change
these together:

- the type in `remotion/src/types.ts`
- a component in `remotion/src/scenes/`
- a case in `Explainer.tsx`
- `SceneKind` in `scripts/constants.mjs`
- the field checks in `scripts/validate-script.mjs`
- a row in the scene table in `references/script-format.md`

Use the tokens in `theme.ts`.
