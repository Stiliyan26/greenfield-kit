# Visual quality gate

Run this on every model's rendered variant before the user sees it.

The gate checks pixels, not intentions. A named skill does not make a design
good, and neither does a passing check.

`<skill-root>` means the `design-interface` folder.

## Before you build

Each model writes down, for its own variant:

- The task and the real content that decide each screen.
- Each reference it learns from: link, what to adapt, what not to copy.
  Look at the images, not only the search results.
- The source idea, the closest generic template, and the change that avoids
  it.
- The type pair, the tokens, the signature detail and where it comes from.

Nobody assigns a structure or a style. The user then sees how each model
designs.

## Mechanical checks

1. Start the studio. Capture every screen of every variant at three sizes:

   ```
   node <skill-root>/scripts/capture.mjs --url <studio url> --out temp/verification/<run>
   ```

   Done when `capture.md` exists.

2. Read `capture.md`. Fix every sideways scroll, clipped label, missing font
   and console error. A clipped label you made on purpose (a one-line
   address with a full `title`) may stay. Say so in your report.

   Done when `capture.md` lists no unexplained problem.

3. Run the token check on the source, not on the built pages:

   ```
   python3 <skill-root>/scripts/check_tokens.py --project studio/project.json studio/app/src/variants
   ```

   Done when it prints `0 problems`.

4. Run `node <skill-root>/scripts/check_components.mjs --url <studio url>`.

   Done when it prints `0 problems`.

5. Run `python3 <skill-root>/scripts/check_variant.py studio`. Open each
   variant's specimen. Each status color must keep one meaning.

   Approval stays blocked while a contrast, hue or font check fails.

   Done when `check_variant.py` lists no failing check.

## Critique by someone else

The agent that built a variant does not grade it. Ask the `design-critic`
agent. Give it:

- The capture folder, with `capture.md`.
- The contracts and the reference notes.
- `studio/taste.md` and the product brief.
- The product's hard rules, such as "only an overdue invoice is red".

It scores Originality (weight 40), Design quality (25), Craft (20) and
Function (15), with evidence from each capture. A total under 70, or any
score of 1, means "revise first".

If the agent is not registered in this session, give a general-purpose agent
the file `agents/design-critic.md` from the plugin. Tell it to follow that
file and stay read-only. Say in your report that you did this.

Done when each variant has a score with evidence.

## Revise

1. Fix the critic's top fixes. Capture and critique again.
2. If a variant is generic, change its composition or its look. Shadows and
   accent colors do not fix it.
3. After two failed passes on one idea, replace the idea. Do not polish it a
   third time.

Done when no variant is marked "revise first".

## Report to the user

Say what each variant is, what the critic scored, what you fixed and what
you could not check. If you could not capture, do not claim a visual pass.

After a rejection, the user's exact words are the next round's constraint.
The studio adds each Reject comment to `taste.md`, so later rounds see it.
