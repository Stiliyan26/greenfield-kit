# Review: studio-scripts · 2026-09-29

This is the code behind the design = code flow. Up to three models write React + shadcn screens into `studio/app/src/variants/<id>/`, and `npm run build` turns them into the studio's candidate pages. The Python engine serves those pages with live tokens, and Approve writes `DESIGN.md` and `design/*.css`. `promote_variant.py` then copies the approved variant into `web/`, and `compare_screens.mjs` checks every route pixel by pixel against the studio. The users are the lead agent, the design models, the background promotion agent, and the user in the studio page. Files reviewed: 26 (scripts 10, engine .py 3, studio-app 13), about 1,000 new or changed lines, with the renamed files read around their hunks. Ran: nothing (this reviewer ran on the old read-only agent definition, no shell). As read-only evidence I used an earlier promote run left in the session scratchpad (`scratchpad/trial/`, abbreviated `trial/` below; full path is under "Not run").

<a id="p100"></a>
## 100. Parallel models break each other's builds · Critical

**Context.** design-interface step 4 starts up to three models in parallel (`SKILL.md:62-68`). Each one writes only `studio/app/src/variants/<id>/` and must pass `npm run build` in the one shared `studio/app` (`variant-brief.md:93`). That build is the only way a model's screens reach the studio.

**Impact.**
- **Type errors spread.** The build type-checks all of `src/` with `noUnusedLocals`. So model A's build fails on model B's half-written file; one unused import is enough. The brief forbids A from touching B's folder, so A can only wait or report a failure.
- **Builds race.** `config()` and `closeBundle()` both delete the shared `entries/` folder. Two builds running at once delete each other's entry pages, and one fails on a missing entry or leaves a partial `candidates/`.
- **Approval drops for no reason.** Every build rewrites every variant's `candidates/<id>/` files. After approval, any rebuild touches the approved variant's folder, and `changed_since_approval` (`studio_server.py:76-85`) drops the approval to draft even though nothing in it changed.

**Why.** One build covers every variant: the type-check, the entries, the output and `variant.json` are all shared.

**Current code** (`plugin/skills/design-interface/assets/studio-app/package.json:8`)

```json
    "build": "tsc -p tsconfig.app.json --noEmit && vite build",
```

**Current code** (`plugin/skills/design-interface/assets/studio-app/studio-build.ts:35-38`)

```ts
    config() {
      const project = readProject()
      const input: Record<string, string> = {}
      rmSync(ENTRIES, { recursive: true, force: true })
```

**Current code** (`plugin/skills/design-interface/assets/studio-app/studio-build.ts:53-57`)

```ts
    closeBundle() {
      const screens = readScreens()
      for (const variant of variantIds()) writeVariantJson(variant, screens)
      rmSync(ENTRIES, { recursive: true, force: true })
    },
```

**Proved by.** Not run. Proving it needs a scratch studio with variants `a` and `b`:
- Add an unused `import { Badge } from "@/components/ui/badge"` to `src/variants/b/screens/<screen>.tsx`, then run `cd studio/app && npm run build`. Expect a TS6133 error in `variants/b` and exit 1, although `a` is clean.
- Run `npm run build & npm run build; wait`. Expect one build to fail on a missing `entries/<variant>/<screen>.html`.

**Fix options**

- **A (recommended).** Build one variant per run: `npm run build -- <id>`.

  ```js
  // studio/app/build-variant.mjs  ("build": "node build-variant.mjs")
  import { execFileSync } from "node:child_process"
  import { writeFileSync } from "node:fs"
  const id = process.argv[2]
  if (!id) { console.error("Usage: npm run build -- <variant id>"); process.exit(2) }
  const config = `tsconfig.${id}.json`
  writeFileSync(config, JSON.stringify({ extends: "./tsconfig.app.json", include: ["src/*.ts", "src/*.tsx", "src/components", "src/lib", "src/hooks", `src/variants/${id}`] }))
  execFileSync("npx", ["tsc", "-p", config, "--noEmit"], { stdio: "inherit" })
  execFileSync("npx", ["vite", "build"], { stdio: "inherit", env: { ...process.env, STUDIO_VARIANT: id } })
  ```

  ```ts
  // studio-build.ts: build and clean only this variant
  const ONLY = process.env.STUDIO_VARIANT
  // variantIds(): return ONLY ? all.filter((id) => id === ONLY) : all
  // config():   rmSync(path.join(ENTRIES, variant), …) per variant, not ENTRIES;
  //             return { build: { rollupOptions: { input }, assetsDir: ONLY ? `${ONLY}/assets` : "assets" } }
  // closeBundle(): rmSync(path.join(ENTRIES, variant), …) per built variant
  ```

  Cost: about 40 lines plus one line in the brief. It also fixes the stale bundles in #113, and gitignore gets `tsconfig.*.json`.

- **B.** Keep one build, but serialize it with a lock folder (`mkdir .build-lock`, retry) and drop `noUnusedLocals` from the studio build. Cost: about 15 lines. A model is still blocked by another model's real type errors.

**Test to add.** "Two models building at once each get their own candidate pages, and one model's type error doesn't fail the other's build."

**Decision.** [ ] fix now: A / B · [ ] later · [ ] not a problem · [ ] explain more

**Status.** open

<a id="p101"></a>
## 101. Promotion can ship code edited after approval, and the check still passes · Important

**Context.** Approve writes `DESIGN.md` and `design/*.css` for the selected variant at one revision. `promote_variant.py` then copies `studio/app/src/variants/<id>/` and `src/data.ts` into `web/`. The studio is supposed to drop an approval when the approved design changes on disk (`studio.md:306-308`).

**Impact.** That guard watches only `candidates/<id>/` (the built pages) and `project.json`. It doesn't watch the source the app flow edits. Suppose an agent handles a late comment by editing `src/variants/<id>/parts/*.tsx` or `src/data.ts` after approval:
- **Without a rebuild:** the studio still says approved and promotion copies the edited source. The compare checks it against the old build, so only a change over 1% of pixels is flagged (see #103).
- **With a rebuild:** `selection.json` on disk still says approved until something calls `selection()`. Promotion reads the file directly, copies the edit, and the compare checks new code against the new build, so every row says "ok".

The result is that `web/` holds a design the user never approved, and the compare report says it matches.

**Why.** Approval records no fingerprint of the code it approved, and promotion trusts `status` alone.

**Current code** (`plugin/skills/design-interface/assets/studio-engine/studio_server.py:76-85`)

```python
    def changed_since_approval(self, selection):
        """True when project.json or a file in the approved model's folder is newer than the approval."""
        try:
            approved_at = datetime.fromisoformat(selection["exported"]["at"]).timestamp()
        except (KeyError, TypeError, ValueError):
            return False
        folder = self.content / "candidates" / selection["variant"]
        paths = [self.content / "project.json", *(folder.iterdir() if folder.is_dir() else [])]
        # The approval time is stored to the second; allow that second.
        return any(path.is_file() and path.stat().st_mtime > approved_at + 1 for path in paths)
```

**Current code** (`plugin/skills/design-interface/scripts/promote_variant.py:102-107`)

```python
    selection = json.loads((studio / "selection.json").read_text(encoding="utf-8"))
    variant = args.variant or selection.get("variant")
    if not variant:
        parser.error("No variant: approve one in the studio or pass --variant")
    if not args.variant and selection.get("status") != "approved":
        parser.error(f"'{variant}' is not approved in the studio yet")
```

**Proved by.** Not run. Run `node plugin/skills/design-interface/scripts/test_app.mjs --keep`. In the kept project:
1. Edit `studio/app/src/variants/paper/parts/order-card.tsx` (`size="sm"` → `size="lg"`).
2. Run `cd studio/app && npm run build`.
3. Without opening the studio, run `python3 promote_variant.py <root> --check --studio-url <url>`.

Expect exit 0, and `web/src/design/parts/order-card.tsx` containing `size="lg"`.

**Fix options**

- **A (recommended).** Fingerprint the source at approval, and check it in both the studio and promotion.

  ```python
  # studio_export.py
  def source_hash(content, variant):
      src = content / "app" / "src"
      digest = hashlib.sha256()
      for path in sorted([*(src / "variants" / variant).rglob("*"), src / "data.ts", src / "index.css"]):
          if path.is_file():
              digest.update(str(path.relative_to(src)).encode())
              digest.update(path.read_bytes())
      return digest.hexdigest()
  # studio_server.approve(): exported={..., "source": studio_export.source_hash(self.studio.content, variant["id"])}
  # changed_since_approval(): also True when exported.get("source") differs from the current hash (app studios only)
  # promote_variant.py, after the status check:
  #   if selection.get("exported", {}).get("source") != studio_export.source_hash(studio, variant):
  #       parser.error("The approved variant changed since approval; approve it again in the studio")
  ```

  Cost: about 20 lines across three files.

- **B.** At approval, copy the variant to `design/source/` and promote from that copy. Cost: a second copy of the code in git. Edits after approval then silently never reach `web/`.

**Test to add.** "Editing the approved variant's source after approval blocks promotion until the user approves again."

**Decision.** [ ] fix now: A / B · [ ] later · [ ] not a problem · [ ] explain more

**Status.** open

<a id="p102"></a>
## 102. The pixel check can't be re-run on the current code after promotion · Important

**Context.** `promote.md` steps 2–3 say: after a failed comparison, fix the app and "run the check again"; after the motion pass, "Run the comparison again afterwards at rest". When `promote_variant.py` runs without `--check`, it prints the command for the check.

**Impact.**
- **The printed next step refuses.** It is `promote_variant.py --check`, and that now stops at "web exists; move it first". The same happens after "Install or build failed", which leaves a half-made `web/`.
- **The only other route compares an old build.** `compare_screens.mjs` serves `web/dist` with `vite preview` and never builds. After a fix or a motion pass in `src/design/`, it checks the old build. So motion that changes a resting screen still passes the re-check.

**Why.** Promotion is one-shot, and the stand-alone compare assumes `dist/` is current.

**Current code** (`plugin/skills/design-interface/scripts/promote_variant.py:150-154`)

```python
    if run(["npm", "install", "--no-audit", "--no-fund"], out).returncode or run(["npm", "run", "build"], out).returncode:
        sys.exit("Install or build failed; fix the app before checking it")
    if not args.check:
        print(f"Next: python3 {Path(__file__).name} --check, with the studio running, to prove the routes match the approved screens")
        return
```

**Current code** (`plugin/skills/design-interface/scripts/compare_screens.mjs:30-33`)

```js
const port = 4300 + Math.floor(Math.random() * 500)
const preview = spawn("npx", ["vite", "preview", "--host", "127.0.0.1", "--port", String(port), "--strictPort"], { cwd: app, stdio: "ignore" })
const appUrl = `http://127.0.0.1:${port}`
await waitFor(appUrl)
```

**Proved by.** Not run.
1. Run `python3 promote_variant.py <root>`, then the command it prints. Expect `web exists; move it first`.
2. Change a class in `web/src/design/screens/<screen>.tsx` and run `node compare_screens.mjs --app web --variant <id>` without building. Expect every row "ok".

**Fix options**

- **A (recommended).** The compare builds first, and promotion prints the compare command as the next step.

  ```js
  import { spawn, spawnSync } from "node:child_process"
  const build = spawnSync("npm", ["run", "build"], { cwd: app, stdio: "inherit" })
  if (build.status) { console.error(`npm run build failed in ${app}`); process.exit(1) }
  ```

  In `promote_variant.py`, the next-step line becomes `node <skill>/scripts/compare_screens.mjs --app web --variant <id>`. Cost: about 5 lines.

- **B.** Add `--recheck` to `promote_variant.py`: skip the copy when `web/` exists, then build and compare. Cost: about 10 lines, and there are then two ways to do one thing.

**Test to add.** "Changing a promoted screen after promotion makes the re-run comparison fail."

**Decision.** [ ] fix now: A / B · [ ] later · [ ] not a problem · [ ] explain more

**Status.** open

<a id="p103"></a>
## 103. The 1% threshold lets a wrong part pass as "matches" · Important

**Context.** `compare_screens.mjs` is the proof that `web/` shows what the user approved (`promote.md` step 2). A capture passes when fewer than 1% of its full-page pixels differ.

**Impact.**
- **Desktop:** 1% of a 1920×1080 capture is 20,736 px. A 120×40 button is 4,800 px (0.23%) and a status badge about 1,800 px (0.09%). A wrong color, a missing badge, a different icon or a changed label on one part passes at 1920 and 1440.
- **Phone:** 1% is 3,292 px, so a small part passes at 390 too.
- **Noise:** the earlier trial run measured 0.15–0.28% at desktop for identical code (`trial/temp/verification/promote/compare.md`). Real drift gets most of the 1% budget.
- **No location:** `compare.md` gives only a percentage and no diff image, so nobody can see where the differences are.

**Why.** The check is one global ratio over the whole page.

**Current code** (`plugin/skills/design-interface/scripts/compare_screens.mjs:55`)

```js
        const ok = diff.percent <= threshold && diff.sameSize
```

**Current code** (`plugin/skills/design-interface/scripts/compare_screens.mjs:96-100`)

```js
    let differ = 0
    for (let i = 0; i < pa.length; i += 4) {
      if (Math.abs(pa[i] - pb[i]) + Math.abs(pa[i + 1] - pb[i + 1]) + Math.abs(pa[i + 2] - pb[i + 2]) > 24) differ++
    }
    return { percent: (differ / (width * height)) * 100, sameSize, a: `${imgA.width}×${imgA.height}`, b: `${imgB.width}×${imgB.height}` }
```

**Proved by.** Not run. In test_app's kept `web/`, change the order card's `<Button size="sm">` to `variant="outline"` and rebuild. Then run `node compare_screens.mjs --app web --variant paper --studio-url <url>`. Expect all 12 rows "ok".

**Fix options**

- **A (recommended).** Add a local rule and a diff image. Count differing pixels per 16×16 block and fail when any block is more than half changed. Keep the global ratio. Write `<screen>__<width>__<theme>__diff.png` with the changed pixels marked.

  ```js
  const block = 16, cols = Math.ceil(width / block), blocks = new Map()
  for (let i = 0, p = 0; i < pa.length; i += 4, p++) {
    if (Math.abs(pa[i] - pb[i]) + Math.abs(pa[i + 1] - pb[i + 1]) + Math.abs(pa[i + 2] - pb[i + 2]) > 24) {
      differ++
      const key = Math.floor((p % width) / block) + Math.floor(p / width / block) * cols
      blocks.set(key, (blocks.get(key) || 0) + 1)
    }
  }
  let worst = 0
  for (const count of blocks.values()) worst = Math.max(worst, count)
  return { percent: (differ / (width * height)) * 100, worstBlock: (worst / (block * block)) * 100, sameSize, /* … */ }
  // ok = diff.percent <= threshold && diff.worstBlock <= 50 && diff.sameSize
  ```

  Cost: about 20 lines. Calibrate the 50% on test_app first.

- **B.** Lower the threshold to 0.3%. Cost: 1 line. It sits close to the measured noise, so the check may turn flaky.

**Test to add.** "Recoloring one button in the promoted app fails the comparison."

**Decision.** [ ] fix now: A / B · [ ] later · [ ] not a problem · [ ] explain more

**Status.** open

<a id="p104"></a>
## 104. Importing parts through a folder index crashes the studio build · Important

**Context.** After Vite bundles, the build follows each screen's local imports inside its variant to list the shadcn parts it uses (`studio-build.ts`, `shadcnParts`). The kit's own rules tell models to import a feature through its `index.ts` (`write-code/references/structure.md:24-30`), and the brief points models at write-code for splitting screens.

**Impact.** Take a screen with `import { OrderCard } from "../parts"`, where `parts/index.ts` exists. `resolveLocal` returns the folder itself, because `existsSync` is true for a folder. `readFileSync` then throws EISDIR inside `closeBundle`, and `npm run build` fails after the bundle was already written. The model sees a Node error it can't relate to its code.

**Why.** The candidate check tests existence, not "is a file". The `endsWith("/")` guard never matches a resolved path.

**Current code** (`plugin/skills/design-interface/assets/studio-app/studio-build.ts:120-126`)

```ts
function resolveLocal(from: string, spec: string): string | null {
  const base = spec.startsWith("@/") ? path.join(APP, "src", spec.slice(2)) : path.resolve(path.dirname(from), spec)
  for (const candidate of [base, `${base}.tsx`, `${base}.ts`, path.join(base, "index.tsx"), path.join(base, "index.ts")]) {
    if (existsSync(candidate) && !candidate.endsWith("/")) return candidate
  }
  return null
}
```

**Proved by.** Not run. In test_app's kept studio:
1. Add `studio/app/src/variants/paper/parts/index.ts` with `export { OrderCard } from "./order-card"`.
2. Change a screen's import to `from "../parts"`.
3. Run `npm run build`.

Expect `EISDIR: illegal operation on a directory, read`.

**Fix options**

- **A (recommended).** Accept only files.

  ```ts
  import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs"
  // …
    if (existsSync(candidate) && statSync(candidate).isFile()) return candidate
  ```

  Cost: 2 lines.

**Test to add.** "A variant that imports its parts through `parts/index.ts` builds and lists the shadcn parts those parts use."

**Decision.** [ ] fix now: A · [ ] later · [ ] not a problem · [ ] explain more

**Status.** open

<a id="p105"></a>
## 105. A model that follows the brief can fail the components check, and overlays are listed twice · Important

**Context.** The build adds one Components entry for every shadcn part a screen imports, and `check_components.mjs` requires each listed part to be found on its screens. The brief allows a dialog or menu to be "rendered open on a screen, or listed with its trigger", and tells the model to list overlays itself with `shadcn` set. `studio.md:239-240` says "The build adds every other shadcn part".

**Impact.**
- **An open dialog fails the check.** A dialog, sheet or popover rendered open with no trigger gets an auto entry whose selector is `[data-slot="dialog-trigger"]`. The check reports the part missing, and the model can't fix it: its `variant.json` can't remove auto entries, and each build rewrites `candidates/<id>/variant.json`.
- **A mounted `<Toaster />` fails the check.** Sonner renders `[data-sonner-toaster]` only while a toast shows (`trial/web/node_modules/sonner/dist/index.mjs:1153`). The same applies to a Skeleton that only appears in a loading state, and a Calendar inside a closed popover.
- **Overlays appear twice.** Every overlay the model lists as the brief says is also auto-added ("Dialog" or "Dialog (shadcn)"). So `DESIGN.md`'s Components table shows the same part twice.

**Why.** Auto entries are removed only when their generated title matches a listed name, not when the shadcn part is already listed. The trigger-only selector can't see an open overlay.

**Current code** (`plugin/skills/design-interface/assets/studio-app/studio-build.ts:128-133`)

```ts
function selectorFor(name: string): string | null {
  if (name === "sonner") return "[data-sonner-toaster]"
  if (name in ROOT_SLOT) return ROOT_SLOT[name] ? `[data-slot="${ROOT_SLOT[name]}"]` : null
  if (OPENED_BY_TRIGGER.has(name)) return `[data-slot="${name}-trigger"]`
  return `[data-slot="${name}"]`
}
```

**Current code** (`plugin/skills/design-interface/assets/studio-app/studio-build.ts:145-152`)

```ts
  const names = new Set(listed.map((part) => part.name))
  const auto: Part[] = []
  for (const [name, ids] of [...shadcnParts(variant, screens)].sort()) {
    const selector = selectorFor(name)
    if (!selector) continue
    let label = title(name)
    if (names.has(label)) label = `${label} (shadcn)`
    auto.push({ name: label, what: `shadcn ${name}`, screens: [...ids].sort(), selector, shadcn: name, auto: true })
```

**Proved by.** Not run.
- Add `import { Toaster } from "@/components/ui/sonner"` and `<Toaster />` to a screen. Run `npm run build`, then `node check_components.mjs --url <url> --variant paper`. Expect `part Sonner names orders, but [data-sonner-toaster] finds nothing there`.
- List `{ "name": "Confirm dialog", "shadcn": "dialog", … }` and import dialog. Expect both "Confirm dialog" and "Dialog" in `candidates/paper/variant.json`.

**Fix options**

- **A (recommended).** Skip shadcn parts the model already listed, find open overlays by their content, and don't auto-list parts that mount nothing at rest.

  ```ts
  const listedShadcn = new Set(listed.map((part) => part.shadcn).filter(Boolean))
  for (const [name, ids] of [...shadcnParts(variant, screens)].sort()) {
    if (listedShadcn.has(name)) continue
    // …
  }
  function selectorFor(name: string): string | null {
    if (name === "sonner" || name === "skeleton") return null // nothing on screen at rest
    if (name in ROOT_SLOT) return ROOT_SLOT[name] ? `[data-slot="${ROOT_SLOT[name]}"]` : null
    if (OPENED_BY_TRIGGER.has(name)) return `[data-slot="${name}-trigger"], [data-slot="${name}-content"]`
    return `[data-slot="${name}"]`
  }
  ```

  Cost: about 6 lines, and a note in `studio.md` that toasts and skeletons are listed by hand when they matter.

- **B.** `check_components.mjs` reports auto parts it can't find as "not seen at rest" instead of as problems. Cost: about 4 lines. It keeps the duplicate rows and hides real misses.

**Test to add.** "A screen with a dialog rendered open and a mounted Toaster passes the components check, and a listed dialog appears once in DESIGN.md."

**Decision.** [ ] fix now: A / B · [ ] later · [ ] not a problem · [ ] explain more

**Status.** open

<a id="p106"></a>
## 106. DESIGN.md still tells delivery to rebuild the parts by hand · Important

**Context.** Approval writes `DESIGN.md`, which every later skill reads. In the new flow, the approved parts are already code: `web/src/design/parts/` and `web/src/components/ui/`. `promote.md` says delivery "builds new screens from the same shadcn parts and `src/design/parts/`". The components gallery stage was removed.

**Impact.** The Components section written at approval still carries the old flow's instructions:
- "Build each one to match the screens listed."
- shadcn rows: "add them with `npx shadcn@latest add <name>`", which is already installed. Re-adding with overwrite resets any tweaks.
- custom rows: "build them by hand from the named screens".

A delivery agent following `DESIGN.md` makes a second copy of parts that already exist, which is exactly the drift the flow was built to remove. The Screens section points at `studio/candidates/<id>/<screen>.html`, a built bundle, not the `.tsx` source. The studio's Components view still says "Build by hand … The components stage builds each one from these screens" (`components-catalog.js:59-61`), and no components stage exists any more.

**Why.** `components_md` and the catalog text were not updated when the gallery stage was replaced by promotion.

**Current code** (`plugin/skills/design-interface/assets/studio-engine/studio_export.py:575-580`)

```python
    lines = ["## Components", "",
             f"The parts {variant['model'] or variant['id']} named for this design. Build each one to match the screens listed.",
             "",
             "- `shadcn` rows: add them with the `shadcn` skill (`npx shadcn@latest add <name>`). "
             "`design/shadcn.css` gives them this design's colors, fonts and radius. Change layout and variants, never colors.",
             "- `custom` rows: build them by hand from the named screens, with `var(--…)` tokens only.",
```

**Current code** (`plugin/skills/design-interface/assets/studio-engine/web/components-catalog.js:61`)

```js
    ${section("custom", "Build by hand", "This product's own parts. The components stage builds each one from these screens.", custom.sort(byUse).map(partCard))}
```

**Proved by.** Read. test_app's approval writes this text. Not run: `node test_app.mjs --keep`, then `grep -n "build them by hand" <kept>/DESIGN.md`.

**Fix options**

- **A (recommended).** When `studio/app` exists, write the app-flow text. Keep the old text for `--no-app` studios.

  ```python
  lines = ["## Components", "",
           f"The parts {variant['model'] or variant['id']} built for this design. They are code already: "
           "`studio/app/src/variants/<id>/parts/` and `src/components/ui/`, promoted to `web/src/design/parts/` and `web/src/components/ui/`.",
           "",
           "- Reuse them for new screens. Change layout and variants, never colors; `design/shadcn.css` themes the shadcn rows.",
           "- A part the design doesn't have goes back to the studio for a new revision.",
           "- \"Find it\" is a CSS selector in the approved screens.",
  ```

  Then rename the "Build from" column to "Kind", point Screens at `studio/app/src/variants/<id>/screens/<screen>.tsx`, and change the catalog labels to "Custom" and "This product's own parts, in the variant's parts/ folder." Cost: about 15 lines plus a flag into `design_md`.

**Test to add.** "DESIGN.md for an app studio points delivery at the existing parts and never says to build or add them."

**Decision.** [ ] fix now: A · [ ] later · [ ] not a problem · [ ] explain more

**Status.** open

<a id="p107"></a>
## 107. A light-only product shows shadcn's dark styles in the promoted app · Important

**Context.** `project.json` may set `"themes": ["light"]`. Approval then writes no `.dark` blocks (`studio_server.py:363`). The promoted `main.tsx` decides dark mode, and `compare_screens.mjs` checks both themes for every product.

**Impact.**
- **Wrong look on dark-mode machines.** `main.tsx` adds `.dark` to `<html>` whenever the OS prefers dark, whatever the product's themes. Tokens stay light, but every shadcn `dark:` utility switches on. Outline buttons get `dark:bg-input/30`, destructive buttons, inputs, tabs and others change (the trial's `button.tsx:13,19`).
- **Meaningless dark rows.** For such a product, the compare's six dark captures compare the studio's light page with this mixed state.

**Why.** The promoted app and the compare ignore `themes`.

**Current code** (`plugin/skills/design-interface/scripts/promote_variant.py:67-70`)

```python
// ?theme=dark|light pins the theme; otherwise the system setting decides.
const requested = new URLSearchParams(location.search).get("theme")
const dark = requested ? requested === "dark" : matchMedia("(prefers-color-scheme: dark)").matches
document.documentElement.classList.toggle("dark", dark)
```

**Current code** (`plugin/skills/design-interface/scripts/compare_screens.mjs:42`)

```js
      for (const theme of ["light", "dark"]) {
```

**Proved by.** Not run. Use test_app with `"themes": ["light"]` added to the fixture project, then open `web/` at `/orders?theme=dark`. Expect `<html class="dark">` with light tokens, and outline buttons tinted by `--input`.

**Fix options**

- **A (recommended).** Write the themes into `main.tsx`, and have the compare loop over them.

  ```python
  has_dark = "true" if "dark" in project.get("themes", ["light", "dark"]) else "false"
  # MAIN_TSX: const dark = {has_dark} && (requested ? requested === "dark" : matchMedia("(prefers-color-scheme: dark)").matches)
  ```

  ```js
  for (const theme of project.themes ?? ["light", "dark"]) {
  ```

  Cost: about 4 lines.

**Test to add.** "A light-only product never sets the dark class, and its comparison has no dark rows."

**Decision.** [ ] fix now: A · [ ] later · [ ] not a problem · [ ] explain more

**Status.** open

<a id="p108"></a>
## 108. The promoted tsconfig still lists the removed build plugin · Later

**Context.** Promotion leaves `studio-build.ts` out of `web/` and tries to remove it from `tsconfig.node.json`.

**Impact.** The replace looks for `"vite.config.ts", "studio-build.ts"` on one line. The template writes them on separate lines, so nothing changes, and `web/tsconfig.node.json` names a file that doesn't exist. Nothing fails today, because the build only type-checks `tsconfig.app.json`. It is a stale reference for the next reader, and any `tsc -b` setup would check a config that is wrong. The trial's older `web/` has the fixed line; the current template doesn't.

**Why.** A string replace on formatted JSON.

**Current code** (`plugin/skills/design-interface/scripts/promote_variant.py:138-139`)

```python
    node_config = out / "tsconfig.node.json"
    node_config.write_text(node_config.read_text(encoding="utf-8").replace('"vite.config.ts", "studio-build.ts"', '"vite.config.ts"'), encoding="utf-8")
```

**Current code** (`plugin/skills/design-interface/assets/studio-app/tsconfig.node.json:17-20`)

```json
  "include": [
    "vite.config.ts",
    "studio-build.ts"
  ]
```

**Proved by.** Read (the two blocks above). Not run: `node test_app.mjs --keep`, then `cat <kept>/web/tsconfig.node.json`.

**Fix options**

- **A (recommended).** Edit it as JSON.

  ```python
  node = json.loads(node_config.read_text(encoding="utf-8"))
  node["include"] = [name for name in node["include"] if name != "studio-build.ts"]
  node_config.write_text(json.dumps(node, indent=2) + "\n", encoding="utf-8")
  ```

  Cost: 3 lines.

**Test to add.** "The promoted tsconfig.node.json names only files that exist."

**Decision.** [ ] fix now: A · [ ] later · [ ] not a problem · [ ] explain more

**Status.** open

<a id="p109"></a>
## 109. `@/variants/<id>/…` imports work in the studio and break the promoted app · Later

**Context.** The tsconfig alias `@/*` lets a variant import its own files as `@/variants/<id>/parts/x`, and the build deliberately follows that form (`LOCAL_IMPORT`). Promotion moves the variant to `src/design/`.

**Impact.** A variant that uses the alias passes every studio check. Promotion then fails with "Cannot find module '@/variants/…'" and leaves a half-made `web/` (see #102).

**Why.** Promotion copies the code without rewriting the paths that name the variant folder.

**Current code** (`plugin/skills/design-interface/assets/studio-app/studio-build.ts:19`)

```ts
const LOCAL_IMPORT = /from\s+["'](\.{1,2}\/[^"']+|@\/variants\/[^"']+)["']/g
```

**Current code** (`plugin/skills/design-interface/scripts/promote_variant.py:121-122`)

```python
    shutil.copytree(app, out, ignore=lambda folder, names: [name for name in names if name in SKIP or name == "variants"])
    shutil.copytree(source, out / "src" / "design", ignore=shutil.ignore_patterns("variant.json"))
```

**Proved by.** Not run. In test_app's fixture, change `from "../parts/order-card"` to `from "@/variants/paper/parts/order-card"`, then run `node test_app.mjs`. Expect "promote_variant.py builds web/" to fail with TS2307.

**Fix options**

- **A (recommended).** Rewrite the alias during promotion.

  ```python
  for file in (out / "src" / "design").rglob("*.ts*"):
      text = file.read_text(encoding="utf-8")
      file.write_text(text.replace(f"@/variants/{variant}/", "@/design/"), encoding="utf-8")
  ```

  Cost: 3 lines.

- **B.** Stop following `@/variants/` in the build, and have `check_tokens.py` or `check_variant.py` flag it. The brief already says `../parts/*`. Cost: about 5 lines.

**Test to add.** "A variant that imports its parts through @/variants/<id> promotes and builds."

**Decision.** [ ] fix now: A / B · [ ] later · [ ] not a problem · [ ] explain more

**Status.** open

<a id="p110"></a>
## 110. Some screen ids break or collide in the promoted main.tsx · Later

**Context.** Promotion turns each screen id into an import name for `main.tsx`. Screen ids are not pattern-checked (`studio_export.py:237-240` checks only that they are unique).

**Impact.**
- **Clash with the template.** A screen id `screen` becomes `Screen`, which clashes with `const Screen = screens[id]`, so the build fails.
- **Invalid names.** An id that starts with a digit (`2fa`) or contains a dot or space gives an invalid identifier.
- **Collisions.** `order-list` and `order_list`, both valid ids, become the same `OrderList`.

In each case promotion stops on a compile error.

**Why.** Import names are built from the id.

**Current code** (`plugin/skills/design-interface/scripts/promote_variant.py:85-86`)

```python
def ident(screen_id):
    return "".join(part[:1].upper() + part[1:] for part in screen_id.replace("_", "-").split("-"))
```

**Current code** (`plugin/skills/design-interface/scripts/promote_variant.py:127-128`)

```python
    imports = "\n".join(f'import {ident(screen)} from "./design/screens/{screen}"' for screen in screens)
    entries = "\n".join(f'  "{screen}": {ident(screen)},' for screen in screens)
```

**Proved by.** Not run. Use test_app with a screen id `screen`. Expect `npm run build` in `web/` to fail with "Identifier 'Screen' has already been declared".

**Fix options**

- **A (recommended).** Name imports by position, and validate ids the way `studio_export.py:329` already validates `base`.

  ```python
  imports = "\n".join(f'import Screen{i} from "./design/screens/{screen}"' for i, screen in enumerate(screens))
  entries = "\n".join(f'  "{screen}": Screen{i},' for i, screen in enumerate(screens))
  # find_problems(): ids must match [a-z][a-z0-9-]*
  ```

  Cost: 4 lines.

**Test to add.** "A project whose screen ids include `screen` and `order_list` promotes and builds."

**Decision.** [ ] fix now: A · [ ] later · [ ] not a problem · [ ] explain more

**Status.** open

<a id="p111"></a>
## 111. The promoted package name can be invalid for npm · Later

**Context.** Promotion names `web/package.json` after the product.

**Impact.** Only spaces are replaced. A product called "Склад Плюс", "Café & Co" or "A/B Tools" gets a package name npm rejects as not URL-safe. The user works in Bulgarian, so a Cyrillic name is likely. npm may refuse `npm install` or warn, depending on version.

**Why.** No slug rule.

**Current code** (`plugin/skills/design-interface/scripts/promote_variant.py:142`)

```python
    data["name"] = project["name"].lower().replace(" ", "-") + "-web"
```

**Proved by.** Not run: in a scratch folder, `npm init -y`, set `"name": "склад-плюс-web"`, run `npm install`.

**Fix options**

- **A (recommended).**

  ```python
  slug = re.sub(r"[^a-z0-9]+", "-", project["name"].lower()).strip("-") or "app"
  data["name"] = f"{slug}-web"
  ```

  Cost: 2 lines.

**Test to add.** "A product with a Cyrillic name promotes with a valid package name."

**Decision.** [ ] fix now: A · [ ] later · [ ] not a problem · [ ] explain more

**Status.** open

<a id="p112"></a>
## 112. A failed install leaves a half-made studio that init then refuses to replace · Later

**Context.** `init_studio.py` creates `studio/`, then runs `npm install` and `shadcn add --all`. Both are network steps that can fail. It refuses to run when `studio/` exists.

**Impact.** When the network drops or npm fails, the script ends with a traceback (`check=True`). `studio/` and `studio/app/` stay half-installed, and the rerun says "Studio already exists; inspect it instead of overwriting". Nothing tells the agent to delete it.

**Why.** The slow steps run after the folder is created, with no cleanup.

**Current code** (`plugin/skills/design-interface/scripts/init_studio.py:58-65`)

```python
    if not args.no_app:
        app = destination / "app"
        shutil.copytree(SKILL / "assets" / "studio-app", app)
        (app / "src" / "studio-theme.css").write_text(studio_export.studio_theme_css(), encoding="utf-8")
        (app / "src" / "variants").mkdir()
        run(["npm", "install", "--no-audit", "--no-fund"], app)
        run(["npx", "shadcn@latest", "add", "--all", "--yes", "--overwrite"], app)
        print(f"Created {app}: every shadcn part is in src/components/ui")
```

**Proved by.** Not run: with the network off, run `python3 init_studio.py <tmp> --name X`, then run it again. Expect a traceback, then "Studio already exists".

**Fix options**

- **A (recommended).**

  ```python
  try:
      run(["npm", "install", "--no-audit", "--no-fund"], app)
      run(["npx", "shadcn@latest", "add", "--all", "--yes", "--overwrite"], app)
  except subprocess.CalledProcessError:
      shutil.rmtree(destination)
      sys.exit("npm install or shadcn add failed; studio/ was removed. Fix the cause and run init again.")
  ```

  Cost: 5 lines.

**Test to add.** "A failed npm install leaves no studio folder behind."

**Decision.** [ ] fix now: A · [ ] later · [ ] not a problem · [ ] explain more

**Status.** open

<a id="p113"></a>
## 113. Build output piles up in git · Later

**Context.** The studio build writes to `studio/candidates/` without emptying it. That folder is committed: `studio/.gitignore` holds only `.engine-path`, and `DESIGN.md` points at the pages. `web/` gets its `.gitignore` copied from the studio app.

**Impact.**
- **Stale bundles.** Every build adds newly hashed bundles under `candidates/assets/` and never removes the old ones. Dozens of builds across three models leave hundreds of dead JS and CSS files in the repo.
- **`dist/` committed.** `web/.gitignore` has no `dist/`, so the promoted app's build output is committable.

**Why.** `emptyOutDir: false` on a shared output folder, and a gitignore written for the studio app, not for `web/`.

**Current code** (`plugin/skills/design-interface/assets/studio-app/vite.config.ts:26-29`)

```ts
  build: {
    outDir: "../../candidates",
    emptyOutDir: false,
  },
```

**Current code** (`plugin/skills/design-interface/assets/studio-app/.gitignore:1-3`)

```
node_modules/
entries/
*.tsbuildinfo
```

**Proved by.** Read. The trial's `web/.gitignore` has the same three lines, and `web/dist/index.html` exists. Not run: run `npm run build` twice after a change, then `ls studio/candidates/assets | wc -l`.

**Fix options**

- **A (recommended).** Use #100 A's per-variant `assetsDir` and remove `candidates/<id>/assets` before each build. Add `dist/` to the template `.gitignore`. Cost: 3 lines on top of #100.

**Test to add.** "Rebuilding a variant leaves exactly one set of its bundles in candidates."

**Decision.** [ ] fix now: A · [ ] later · [ ] not a problem · [ ] explain more

**Status.** open

<a id="p114"></a>
## 114. Dev mode points at URLs that don't exist · Later

**Context.** `npm run dev` in `studio/app` is the documented quick-preview path (`studio.md:184-186`).

**Impact.** The docs say pages are at `/<id>/<screen>.html`. With `base: "/candidates/"`, Vite dev answers those with a 404 ("did you mean /candidates/…"). The `/data.js` proxy forwards to a file nothing serves; it is left over from the HTML candidates.

**Why.** The config and docs were not aligned after the move to the app.

**Current code** (`plugin/skills/design-interface/assets/studio-app/vite.config.ts:16`)

```ts
  base: "/candidates/",
```

**Current code** (`plugin/skills/design-interface/assets/studio-app/vite.config.ts:24`)

```ts
    proxy: { "/_studio": studioUrl, "/api": studioUrl, "/data.js": studioUrl },
```

**Proved by.** Read; `grep -rn "data.js" plugin/` finds only this line. Not run: `STUDIO_URL=<url> npm run dev`, then open `http://localhost:5173/paper/orders.html?world=paper`.

**Fix options**

- **A (recommended).** Drop `"/data.js"` from the proxy, and have `studio.md` say `/candidates/<id>/<screen>.html?world=<id>`. Cost: 2 lines.

**Test to add.** "The dev server serves a screen at the URL studio.md names."

**Decision.** [ ] fix now: A · [ ] later · [ ] not a problem · [ ] explain more

**Status.** open

<a id="p115"></a>
## 115. The "frame script first" test passes when the script is missing · Later

**Context.** test_app checks that built pages load the studio frame script before the app bundle, which tokens, fonts and pins depend on.

**Impact.** If the frame script tag is missing, `indexOf` returns -1, which is less than the assets index, so the check passes. The later token probes would catch the gap, but this named check proves nothing on its own.

**Why.** A missing value is not ruled out.

**Current code** (`plugin/skills/design-interface/scripts/test_app.mjs:79`)

```js
  check("a built page loads the studio frame script first", html.indexOf("/_studio/frame.js") < html.indexOf("/candidates/assets/"))
```

**Proved by.** Read.

**Fix options**

- **A (recommended).**

  ```js
  const frameAt = html.indexOf("/_studio/frame.js")
  check("a built page loads the studio frame script first", frameAt >= 0 && frameAt < html.indexOf("/candidates/assets/"))
  ```

  Cost: 2 lines.

**Test to add.** This is the test.

**Decision.** [ ] fix now: A · [ ] later · [ ] not a problem · [ ] explain more

**Status.** open

<a id="p116"></a>
## 116. The comparison can leave a preview server running, or measure the wrong server · Later

**Context.** `compare_screens.mjs` starts `vite preview` on a random port, then launches Chromium.

**Impact.**
- **Orphaned server.** The preview is started outside the `try`. If it doesn't answer within 20 s, or Chromium fails to launch (Playwright missing), the script throws and the preview keeps running.
- **Wrong server.** `waitFor` accepts any answer on the port. If something else already listens there, `--strictPort` makes Vite exit, and the comparison screenshots the other server.

**Why.** The process is created before the cleanup scope, and the readiness check doesn't confirm it is the app.

**Current code** (`plugin/skills/design-interface/scripts/compare_screens.mjs:30-36`)

```js
const port = 4300 + Math.floor(Math.random() * 500)
const preview = spawn("npx", ["vite", "preview", "--host", "127.0.0.1", "--port", String(port), "--strictPort"], { cwd: app, stdio: "ignore" })
const appUrl = `http://127.0.0.1:${port}`
await waitFor(appUrl)

const { chromium } = await loadPlaywright()
const browser = await chromium.launch()
```

**Proved by.** Not run: `STUDIO_PLAYWRIGHT=/nonexistent node compare_screens.mjs --app web --variant paper`, then `lsof -i :4300-4800`.

**Fix options**

- **A (recommended).** Start everything inside `try`, close with optional chaining in `finally`, and have `waitFor` require the app's `<div id="root">` in the response body. Cost: about 8 lines.

**Test to add.** "A failed browser launch leaves no preview server running."

**Decision.** [ ] fix now: A · [ ] later · [ ] not a problem · [ ] explain more

**Status.** open

## Not run

- Nothing was run: this reviewer had only Read/Grep/Glob. Skipped: `node --check` / `python3 -m py_compile` on the changed scripts, `node plugin/skills/design-interface/scripts/test_studio.mjs`, `node plugin/skills/design-interface/scripts/test_app.mjs --keep`, the scratch studio, and screenshots (so `captures/` is empty). Each problem names the command that would prove it.
- Phone-width match: the scratchpad trial (an earlier run) shows 390 px rows at 10.8–18.0% DIFFERS (`/private/tmp/claude-501/-Users-stiliyan26-projects-Business-Freedom-OS/3f07355a-58f6-4615-a1e1-96b490d8117e/scratchpad/trial/temp/verification/promote/compare.md`), while `tools.txt` says the current test passes all 12. Not confirmed on the current code: run `node test_app.mjs --keep`, then read `<kept>/temp/verification/promote/compare.md`.
- `.agents/review/` has only `config.json`, with no roles, scope, paging or conventions rules files. Only the general checklist and write-code's rules were applied.
- The studio page's own UI (focus, phone width of the studio chrome) and `component-scan.js`'s new Tailwind grouping were not driven.

## Already there

- `plugin/skills/design-interface/scripts/check_tokens.py:108-111`: with `--project`, the allowed token names are the union of every variant's tokens, so a screen that uses another model's token name passes.
- `plugin/skills/design-interface/assets/studio-engine/studio_server.py:333`: the studio shows a world's dark look even when `project.json` sets `"themes": ["light"]`; it checks `world.dark`, not `themes`. This relates to #107.
- `examples/partyfox/docs/plans/partyfox/plan.md:251`: still describes the removed components stage and its `/_components` gallery. It is outside this feature, for the docs reviewer.
