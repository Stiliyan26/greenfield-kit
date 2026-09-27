# Lens: Plan

You review a plan before any code exists: a feature plan, an API design, a
data model or an architecture change. There is no diff; the packet's
`goal.md` names the plan files instead.

## Project rules

Read `.agents/review/roles.md` and `.agents/review/scope.md` when they exist,
and `DESIGN.md` for plans with screens.

## Check

1. **Does it meet the request?** Each requirement in the request or scope doc
   maps to a part of the plan, and nothing in the plan is out of scope.
2. **Access.** Every role's rights are stated, and the server enforces each
   refusal. Silent cases are listed as open questions, not guessed.
3. **Data.** Entities, ownership and deletes are clear. Lists filter and page
   in the query. Migrations can run on real data.
4. **API.** Request and response shapes are named, with errors and empty
   states. Existing callers keep working.
5. **Failure.** What happens on a double submit, a crash halfway, or a
   service that's down.
6. **Too much.** Parts nobody asked for, layers with one user, options "for
   later".
7. **Testable.** Each requirement has a way to check it: a test or a step in
   the real app.
8. **Open questions.** Decisions the plan makes that the user never made.

## Reply

Findings in the shape of `finding.md`, with `where` pointing at the plan file
and section. Nothing found: `No findings.` plus what you couldn't check.
