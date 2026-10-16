# What changed

Add this section when a change alters how something works: the app, a tool or Claude's replies. Skip it for refactors, fixes that keep the same behaviour, docs and answers.

`<skill-root>` is the folder that holds this skill's `SKILL.md`.

1. Set up the sketch script once per machine. Run `npm install` in `<skill-root>/scripts/`. Put `rsvg-convert` on the path (`brew install librsvg` on macOS). Done when `node <skill-root>/scripts/sketch.mjs` prints its usage line.
2. Write a sketch spec. The format is in the header of `<skill-root>/scripts/sketch.mjs`. Size each box at approximately 11 px per character of its longest line, plus 40. Done when the spec has a Before part and an After part.
3. Run `node <skill-root>/scripts/sketch.mjs <spec.json> ~/.claude/diagrams/<project>/<slug>.png`. Done when the PNG exists.
4. Open the PNG with Read and check it. If a label overflows a box, return to step 2. Done when all text fits.
5. Delete the spec file. Done when only the PNG and its `.excalidraw` file remain.
6. Put the image on the first line of the reply. Write the four lines near the end. Done when both are in the reply.

```
![Before and after](<home>/.claude/diagrams/<project>/<slug>.png)

... result line, body, Your move, Sources ...

## What changed
- **Before:** <one line>
- **After:** <one line>
- **What I did:** <files and change, one line>
- **Impact:** <what the user or the app now does differently, one line>
```

Reason: one picture and four lines show the change faster than paragraphs. Keep the PNG under the home folder: a chat panel cannot show images from `/tmp`.
