# Review: studio-web · 2026-09-29

This is the design studio's browser code (`plugin/skills/design-interface/assets/studio-engine/web/`), moved here from greenfield-mode. Two groups use it. The user compares the models' variants on the pan/zoom canvas, comments on them, tunes them and approves one. Each model reads the Components view and `check_components.mjs`, which shares `component-scan.js`, to prove its screens are built from listed parts before the approved variant is promoted into `web/`. Only four files changed in this range: `board.js`, `styles.css` and `index.html` (the dots layer for the pan lag) and `component-scan.js` (`signatureOf`). `frame.js` and `components.js` are pure renames (100% similarity), so the React variant flow gets nothing new here. Files reviewed: 19, 4,519 lines. Ran: nothing (this reviewer ran on the old read-only agent definition, no shell). The lead's `tools.txt` shows `test_studio.mjs` 97 passed and `test_app.mjs` 17 passed.

<a id="p1"></a>
## 1. The components check misses a hand-drawn repeat when its copies differ by a state class · Important

**Context.** Each model builds its screens from parts and must list every custom part in `variant.json` (`references/variant-brief.md` step 3). `check_components.mjs` and the Components view flag "a structure drawn more than once that no part covers", so hand-drawn copies don't reach `web/` as duplicate markup. The brief also says to "Show the difficult states the data holds", so copies of one structure often differ by a status or selected class.

**Impact.**
- **React variants.** A model hand-draws a 3-step stepper or 3 KPI tiles as `className={cn("flex items-center gap-2 rounded-md p-3", step.done ? "bg-primary" : step.current ? "ring-2 ring-primary" : "bg-muted")}`. Each copy gets its own signature, so there are three groups of one each. Inside the page shell part, `n > 1` fails for every group, the check prints `0 problems`, and the unnamed repeat is promoted into `web/` as three hand-drawn copies.
- **Mixed states.** With 5 rows and 1 selected, the check reports 4×, not 5×. `isListWrapper` also stops seeing the `ul` as a list, because its children's keys differ.
- **Hand-written (`--no-app`) studios.** A base class that starts like a Tailwind prefix is now read as a utility: `order-card`, `list-row`, `top-bar`, `row-head`, `text-block`. So `class="order-card is-late"` and `class="order-card is-paid"` stop grouping as `li.order-card`, which the old code caught.

**Why.** For any class list that holds one "utility", the whole sorted list becomes the group key. The same file's `lookOf` treats differing classes as looks of one part, but the unlisted path treats them as different structures. `UTILITY_PREFIX` matches hand-written names that begin `order-`, `list-`, `row-`, `top-`, `text-` and similar.

**Current code** (`plugin/skills/design-interface/assets/studio-engine/web/component-scan.js:75-85`)

```js
export function signatureOf(el) {
  const tag = el.tagName.toLowerCase()
  if (el.dataset.part) return { signature: `[data-part=${el.dataset.part}]`, selector: `[data-part="${cssEscape(el.dataset.part)}"]` }
  const classes = [...el.classList].filter((name) => !name.startsWith("__"))
  if (!classes.length) return null
  if (classes.some(isUtility)) {
    const sorted = [...classes].sort()
    return { signature: `${tag}.${sorted.join(".")}`, selector: sorted.map((name) => `.${cssEscape(name)}`).join("") }
  }
  return { signature: `${tag}.${classes[0]}`, selector: `.${cssEscape(classes[0])}` }
}
```

(`component-scan.js:184` uses the same key for list detection: `const key = (child) => entries.get(child)?.part?.name ?? signatureOf(child)?.signature ?? child.tagName`)

**Proved by.** Not run. Two ways to prove it:
- In any studio page, run `page.evaluate(async () => { const { signatureOf } = await import("/_studio/component-scan.js"); const li = (c) => Object.assign(document.createElement("li"), { className: c }); return [li("flex items-center gap-2 bg-primary"), li("flex items-center gap-2 bg-muted"), li("order-card is-late"), li("order-card is-paid")].map((el) => signatureOf(el).signature) })`. Reading the code, it should return four different signatures (`li.bg-primary.flex.gap-2.items-center`, `li.bg-muted.flex.gap-2.items-center`, `li.is-late.order-card`, `li.is-paid.order-card`).
- End to end: add a React variant screen with three differently-stated hand-drawn steps inside `[data-part=page]`, then run `node plugin/skills/design-interface/scripts/check_components.mjs --url http://127.0.0.1:<port> --variant <id>`. Expected today: `0 problems`.

**Fix options**

- **A (recommended).** Group by the first class when it's a real base name (the old hand-written rule). Otherwise group by the classes that shape the element and ignore the ones that only paint it.

  ```js
  // Classes that only paint one copy (color, ring, state and breakpoint variants,
  // arbitrary values) tell looks of one structure apart, not two structures.
  const LOOK = /[:[/]|^(?:bg|text|border|ring|shadow|opacity|outline|fill|stroke|from|via|to|decoration)-/
  export function signatureOf(el) {
    const tag = el.tagName.toLowerCase()
    if (el.dataset.part) return { signature: `[data-part=${el.dataset.part}]`, selector: `[data-part="${cssEscape(el.dataset.part)}"]` }
    const classes = [...el.classList].filter((name) => !name.startsWith("__"))
    if (!classes.length) return null
    if (!isUtility(classes[0])) return { signature: `${tag}.${classes[0]}`, selector: `.${cssEscape(classes[0])}` }
    const shape = classes.filter((name) => !LOOK.test(name)).sort()
    const named = shape.length ? shape : [...classes].sort()
    return { signature: `${tag}.${named.join(".")}`, selector: named.map((name) => `.${cssEscape(name)}`).join("") }
  }
  ```

  Cost: one regex and 3 changed lines. This fixes the React path, which is now the main one. A legacy hand-written `order-card is-late` still splits.

- **B.** Keep `signatureOf` as it is. After grouping in `findUnlisted`, merge groups whose elements share a parent and a tag and most of their classes (for example ≥ 60%). Use the same test in `isListWrapper`. Cost: about 15 lines and a threshold to tune. It covers both hand-written and Tailwind screens.

**Test to add.** "Three copies of one hand-drawn row that differ only by a status class are reported as one repeat 3×". Add it to `test_app.mjs`'s React fixture (next to "check_components.mjs passes (shadcn parts found by data-slot)"). Also add "A hand-written `order-card is-late` / `order-card is-paid` pair groups as `li.order-card`" to `test_studio.mjs`. Nothing tests `signatureOf` today: neither the `data-part` branch nor the Tailwind branch.

**Decision.** [ ] fix now: A / B · [ ] later · [ ] not a problem · [ ] explain more

**Status.** open

<a id="p2"></a>
## 2. A model that excuses a Tailwind repeat by the name the check prints excuses nothing · Important

**Context.** When a repeat is truly not a part, the brief says to put it in `notComponents` with a selector and a reason (`references/studio.md` "variant.json"). The check tells the model to do that and names the repeat by its signature. `component-scan.js` now builds that signature from the raw Tailwind class list.

**Impact.** Tailwind classes often contain `:`, `[` or `/` (`sm:grid-cols-2`, `hover:bg-muted`, `bg-primary/10`, `w-[37%]`). The check prints something like `draws li.flex.gap-3.hover:bg-muted.items-center 4×`. The model copies that name as its `notComponents` selector. In `ignored()`, `el.matches` throws a SyntaxError, the error is swallowed, and the element is never excused. The check keeps failing with no hint why, and the model guesses or loops. Nothing else validates the selector: `check_variant.py` only checks that a selector and a why exist. A `data-part` value that starts with a digit (`[data-part=2col]`) breaks the same way. The group already carries a correctly escaped `selector`, but no code reads it.

**Why.** The signature (an unescaped display key) is shown where a selector is expected. The escaped `selector` travels through `summarize` and `aggregateUnlisted` but is never printed or used, so it is a field nobody reads.

**Current code** (`plugin/skills/design-interface/scripts/check_components.mjs:72`)

```js
    problems.push(`${label} draws ${item.signature} ${item.total}× (${where} at ${item.width}) but no part covers it: add it to components, or to notComponents with a reason ("${item.sample}")`)
```

and (`plugin/skills/design-interface/assets/studio-engine/web/component-scan.js:89`)

```js
  const ignored = (el) => ignore.some((selector) => { try { return el.matches(selector) } catch { return false } })
```

**Proved by.** Not run. In any page, `page.evaluate(() => { try { document.body.matches("li.flex.gap-3.hover:bg-muted.items-center"); return "ok" } catch (e) { return e.name } })` should return `SyntaxError`. End to end: add `{ "selector": "<the printed signature>", "why": "…" }` to a React variant's `notComponents`, then run `node plugin/skills/design-interface/scripts/check_components.mjs --url http://127.0.0.1:<port> --variant <id>`. The same problem is still printed.

**Fix options**

- **A (recommended).** Print the escaped selector the scan already computes, so the unused field gets its reader.

  ```js
    problems.push(`${label} draws ${item.signature} ${item.total}× (${where} at ${item.width}) but no part covers it: add it to components, or to notComponents with a reason, selector \`${item.selector}\` ("${item.sample}")`)
  ```

  Cost: one line. The Components view's code line (`components.js:316`, `cmap-sig-code`) should show `groupItem.selector` the same way.

- **B.** Make the signature the escaped selector itself (`signature: \`${tag}${selector}\``), so every name shown is valid CSS. Cost: labels get backslashes (`li.hover\:bg-muted`), and the key changes for any saved Components-view state.

**Test to add.** "A repeat with a `hover:` class is excused by the selector the check prints". Put it in `test_studio.mjs` next to "notComponents excuses a repeat with a reason".

**Decision.** [ ] fix now: A / B · [ ] later · [ ] not a problem · [ ] explain more

**Status.** open

<a id="p3"></a>
## 3. The empty canvas tells models to write files into the build's output folder · Later

**Context.** In the new flow, each model writes `studio/app/src/variants/<id>/variant.json` and `screens/*.tsx`. `npm run build` writes `studio/candidates/<id>/` (`references/studio.md` "The studio app"). Only `--no-app` studios hand-write `candidates/`. The canvas shows this note when no variant is built yet: after models have written code but before anyone has run the build.

**Impact.** An agent or user sees an empty studio and is told to create `studio/candidates/<id>/variant.json` and screen files by hand. Anything written there is overwritten by the next build, and the real fix (run `npm run build` in `studio/app`) isn't mentioned. This is the kind of stale old-studio-path text the goal asks to remove.

**Why.** The line predates the React flow and wasn't updated when the studio moved.

**Current code** (`plugin/skills/design-interface/assets/studio-engine/web/board.js:49`)

```js
    if (!variants.length) return [note("No variants yet. Each model writes studio/candidates/<id>/variant.json and one file per screen.")]
```

**Proved by.** Not run. Start a fresh studio with `init_studio.py` (app mode), run `python3 studio/server.py`, and open the page before any build. The canvas shows that sentence. Screenshot to take: `captures/3-empty-canvas.png`.

**Fix options**

- **A (recommended).** Name the build and keep the hand-written case.

  ```js
    if (!variants.length) return [note("No variants yet. Each model writes studio/app/src/variants/<id>/ and runs npm run build in studio/app, which fills studio/candidates/. A hand-written studio puts variant.json and one file per screen in studio/candidates/<id>/.")]
  ```

  Cost: one line.

**Test to add.** "The empty canvas names the build step". In `test_studio.mjs`, before the fixture variants are copied in, check that the canvas text includes `npm run build`.

**Decision.** [ ] fix now: A · [ ] later · [ ] not a problem · [ ] explain more

**Status.** open

<a id="p4"></a>
## 4. No test would catch the canvas dots drifting off the screens during a pan · Later

**Context.** The pan-lag fix moves the dot grid from the board's `background-position` into its own `#board-dots` layer. The layer slides by `view.x mod step` and only repaints its `background-size` on a zoom. Reading it, the change looks right: the offset stays within one step (max step 48 px at the 2× zoom cap, and the layer is 100 px oversized), the tile phase matches the old `background-position`, and the layer sits under `#board-world` in DOM order with `pointer-events: none`. But no test drives a pan or checks the layer.

**Impact.** A later change to `paintView`, `.board-dots` sizing or `MAX_ZOOM` could leave dots out of step with the frames, or show a bare strip at the right or bottom edge after a pan. `test_studio.mjs` only clicks zoom in and fit, so it would still pass. The lag itself (the reason for the change) isn't measured anywhere either.

**Why.** The fix came without a check at the level where it can break: the browser.

**Current code** (`plugin/skills/design-interface/assets/studio-engine/web/board.js:187-190`)

```js
    // Only a zoom repaints the dots; a pan just slides their layer by less than one step.
    if (dots !== dotsSize) { dotsSize = dots; dotsLayer.style.backgroundSize = `${dots}px ${dots}px` }
    const shift = (value) => ((value % dots) + dots) % dots - dots
    dotsLayer.style.transform = `translate(${shift(view.x)}px, ${shift(view.y)}px)`
```

**Proved by.** Not run. `node plugin/skills/design-interface/scripts/test_studio.mjs` doesn't exercise it (grep finds no `mouse.`, `drag` or `wheel` in the test). A manual check would be to start the PartyFox studio (`.agents/PROJECT.md` → Commands), drag the canvas at 200% and at 2%, and capture `captures/4-pan-dots.png`.

**Fix options**

- **A (recommended).** Add a Playwright step to `test_studio.mjs`. Read `#board-dots`' transform and `background-size`, drag the board by (37, 23) with `page.mouse`, wait one animation frame and 200 ms, then check that the new translate equals the old one plus (37, 23), modulo the step, and that `background-size` didn't change. Cost: about 12 lines.

**Test to add.** "Dragging the canvas slides the dot grid with the frames and doesn't resize it".

**Decision.** [ ] fix now: A · [ ] later · [ ] not a problem · [ ] explain more

**Status.** open

## Not run

- No shell in this reviewer, so none of these ran:
  - `node --check` on the 19 files.
  - `node plugin/skills/design-interface/scripts/test_studio.mjs` (the lead's run shows 97 passed).
  - The PartyFox studio with Playwright or `scripts/capture.mjs`, so the pan-lag fix was not seen or timed: drag the canvas in the Performance panel and check that no full-board paint happens per frame.
- The proof commands in #1–#4 above.
- Project rules: `.agents/review/` holds only `config.json`. There are no roles, scope, paging or conventions files, so Scope (checklist §8) and the conventions part of Fit were checked against `goal.md` and `write-code/SKILL.md` only.
- `frame.js` and `components.js` were not changed in this range (100% renames), so nothing in this feature carries the React variant flow. The design = code proof (promotion, `compare_screens.mjs` waiting on `data-studio-ready` and then a 300 ms settle while React renders) belongs to the scripts reviewer.

## Already there

- `plugin/skills/design-interface/assets/studio-engine/web/component-scan.js:89`: a `notComponents` selector is matched with `el.matches`. This also excuses every element that carries more classes than the selector (`.flex.gap-2` excuses `div.flex.gap-2.rounded-lg.border`), and an invalid selector is silently ignored instead of reported.
- `plugin/skills/design-interface/assets/studio-engine/web/component-scan.js:113-114`: a group with any element outside every listed part is kept even with a single element, so the result depends on whether the model lists a page shell.
