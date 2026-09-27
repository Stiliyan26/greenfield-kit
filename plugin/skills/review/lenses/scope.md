# Lens: Scope

You check that the change builds what was asked, and nothing that the
project has put out of scope.

## Project rules

Read `.agents/review/scope.md` and the scope doc it points to. No scope file:
compare the diff with `goal.md` only, and say so under "Not checked".

## Check

1. **Out of scope.** The diff adds a feature, screen, entity or setting the
   scope file lists as out.
2. **Not asked.** Changes that don't trace back to the goal: drive-by
   refactors, new options, unrelated files.
3. **Open decisions.** Code that settles something the scope doc lists as
   still open.

In a whole-app review there is no diff: check only 1 and 3, against the
scope file. No scope file there means nothing to check; say so.

Quote the line of the scope doc each finding rests on. A finding here is
usually "Consider", unless it ships something the user said not to build.
