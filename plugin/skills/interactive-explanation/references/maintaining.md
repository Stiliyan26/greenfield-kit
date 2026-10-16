# Changing the skill

Scripts live in `scripts/`. `build.mjs` is the entry and `page/` holds the
page. The renderer lives in `remotion/`. `tsconfig.json` and
`package-lock.json` pin the build; `scripts/render.mjs` installs it with
`npm ci` on the first render. `src/Root.tsx` registers the compositions.
`src/ReviewShot.tsx` draws the review shots. Each scene kind has one
component in `src/scenes/`: `Title.tsx`, `BeforeAfter.tsx`, `Clip.tsx`,
`Files.tsx`, `Diagram.tsx`, `Code.tsx` and `Bullets.tsx`. `shared.tsx` holds
their common parts.

A new scene kind changes six places together:

1. `remotion/src/types.ts`
2. A component in `remotion/src/scenes/`
3. A case in `Explainer.tsx`
4. `SceneKind` in `scripts/constants.mjs`
5. The checks in `scripts/validate-script.mjs`
6. The scene table in `references/script-format.md`

Reason: the six places must agree. A scene kind that one of them lacks
fails at validation or at render.
