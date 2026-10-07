# Choosing diagrams, sketches, evidence and scenes

Read this while writing `script.json`. The shapes are in
[script-format.md](script-format.md).

## Diagrams for "How it works"

Pick from the diff. One to three.

| The diff touches | Type | Shows |
| --- | --- | --- |
| Schema, migrations | the `database` block | The generated ER with keys, one line per relation |
| A call across layers | `sequence` | One call from the screen to the server to the database and back |
| Client components | `component` (`flowchart TD`) | The component tree |
| A status or lifecycle | `state` | States and the actions between them |
| Anything else | `flowchart` | Actor → system → effect |

Tag flowchart nodes `:::added`, `:::changed`, `:::removed` or `:::kept`. The
page colours them and adds a legend.

## Sketches for the Summary

The smallest text view that makes the point. One, sometimes two or three.

| The point is | `kind` | Shows |
| --- | --- | --- |
| Which files own what, or a broad refactor | `files` | A shallow file tree with a `# note` per line |
| UI structure | `components` | A component tree |
| Runtime control flow | `calls` | A call tree |
| Logic or an algorithm | `pseudo` | Pseudocode |
| The exact new shape | `code` | The lines, with `file` and `highlight` |

Set `diff: true` when the point is what changed in a shape that already
exists; prefix lines with `+`, `-` or a space. A sketch is under 15 lines
and 70 columns, with one sentence of `text` beside it.

## Evidence

Evidence has no screenshots. The journey video shows the screens, and the
review map shows each screen once, with the changed components boxed. Add a
before/after pair only when output proves a claim the video can't: the same
test failing before and passing after, or console output. Each pair has a
`label` that names the claim.

## Merge danger

- `door`: two-way (cheap to walk back) or one-way (a destructive migration,
  deleted data, a public contract change).
- `blastRadius`: one word for what can break (`Orders`, `Auth`, `Layout`),
  with what follows in its text.
- `items`: only for an area that changes (Data, API, Users, Performance).
- `deploy`: the steps, when there are any.

## Text rules (ASD-STE100)

The build checks these and lists every sentence that breaks one.

- One idea per sentence. Active voice, present tense.
- At most 20 words in a step, 25 in any other sentence.
- The simple word: "use" not "utilize", "about" not "approximately", "to"
  not "in order to". No "simply", "just", "basically", "very".
- Use what the screen calls things. File and function names appear only in
  the architecture video and in `files`, `components`, `calls` and `code`
  sketches.
- Define a term the first time you use it.

## Videos

`journey` is for users, `architecture` is for maintainers. Each has 6–10
scenes and 2–5 minutes of narration. A scene is 2–4 sentences, 10–30 seconds.

- Journey: title → `before-after` → one `clip` per step, one idea each →
  closing `bullets`. The "before" is spoken, not recorded; say what the user
  had to do and what went wrong.
- Architecture: title → `files` → `diagram` → `code` for the lines that
  matter → `bullets` with the decisions and their Q-numbers from `plan.md`.
- Captions under 12 words, bullets under 14. The narration carries the
  detail.
- `code` scenes: 5–12 lines, under 70 columns, highlighting what the
  narration names.

## Reading budget

The build estimates the page: 200 words a minute, 15 s a diagram, 5 s a
screen, 10 s a sketch or test output. PR pages read in 2–5 minutes, task
pages in 1–3. Over budget: cut words before sections.
