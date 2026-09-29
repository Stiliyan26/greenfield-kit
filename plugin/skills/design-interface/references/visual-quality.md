# Visual quality gate

Run this on every model's rendered variant before the user sees it.
It checks pixels, not intentions. Naming a skill doesn't make a design good,
and neither does a passing check.

`<studio-scripts>` means this skill's `scripts/` folder.

## Before building

Each model, for its own variant, writes down:

- The task and the real content that decide each screen.
- The references it learns from: link, what to adapt, what not to copy. Look
  at the images, not only the search results.
- The source idea, and the closest generic template plus the change that
  avoids it.
- The type pair, the tokens, the signature detail and where it comes from.

Models design on their own from the same brief. Nobody assigns them a
structure or a style, so the user sees how each model designs.

## Mechanical checks

1. Start the studio and capture every screen of every variant at the three sizes:

   ```
   node <studio-scripts>/capture.mjs --url <studio url> --out temp/verification/<run>
   ```

2. Read `capture.md`. Fix every sideways scroll, clipped label, missing font
   and console error. A clipped label you made on purpose, such as a one-line
   address with a full `title`, may stay. Say so in your report.

3. Run the token check. It must print `0 problems`:

   ```
   python3 <studio-scripts>/check_tokens.py --project studio/project.json studio/candidates
   ```

4. Run `python3 <studio-scripts>/check_variant.py studio` and open each
   variant's specimen. Status colors must keep one meaning each. Approval
   stays blocked while any contrast, hue or font check fails.

## Critique by someone else

The agent that built a variant may not grade it. Ask the `design-critic`
agent. Give it:

- The capture folder, including `capture.md`.
- The contracts and the reference notes.
- `studio/taste.md` and the product brief.
- The product's hard rules, such as "only an overdue invoice is red".

It scores Originality (weight 40), Design quality (25), Craft (20) and
Function (15), with evidence from each capture. A total under 70, or any score
of 1, means "revise first".

If the `design-critic` agent isn't registered in this session, give a
general-purpose agent the file `agents/design-critic.md` from the greenfield-kit plugin. Tell it to
follow that file and stay read-only. Say in your report that you did this.

## Revise

- Fix the critic's top fixes, then capture and critique again.
- If a candidate is generic, change its composition or its world. Shadows and
  accent colors won't fix it.
- After two failed passes on the same idea, replace the idea. Don't polish it
  a third time.
- Keep captures and critiques in `temp/verification/<run>/` until the user has
  seen them.

## Report to the user

Say what each candidate is, what the critic scored, what you fixed, and what
you couldn't check. If you couldn't capture, don't claim a visual pass.

After a rejection, the user's exact words become the next round's constraint.
The studio adds each Reject comment to `taste.md`, so later rounds see it too.
