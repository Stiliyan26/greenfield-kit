---
name: plan-feature
description: Plan a new project or a big feature with the user before any code - what it does, how to know it's done, and the database/API/screen design. Two modes - AI proposes and the user approves, or the user leads and the AI questions and checks. Use for new projects, or features that touch the database, API, permissions, or several screens.
---

# Plan a feature or project

Use this for a new project, or a feature with a database, API or permission
change, both frontend and backend, or a new flow or screen. Small changes skip
planning.

## Start

1. **Read what exists.** In an existing project: the project profile
   (`.agents/PROJECT.md`), related code and tests, access rules, earlier plans.
   Fit what's there; don't re-ask questions already answered. If `DESIGN.md`
   exists, it settles the look; link it instead of asking about colors or
   fonts. In a new project:
   the brief and any constraints the user gave.
2. **Pick the mode.** If the user didn't say, ask once:
   - **You propose**: you draft the whole plan, then go through it with the user.
   - **I lead**: the user explains how it should work; you ask and check.

## Mode: you propose

1. Draft the plan, using [plan.md](references/plan.md). For each real choice, give 2-3 options in
   plain words, the tradeoff, and your recommendation with evidence.
2. Walk the user through the decisions one at a time, biggest first. Change the
   plan as they answer.
3. Mark the plan **Approved** only when the user says so.

## Mode: I lead

1. List the open questions, most important first. Ask one at a time, or a few
   small related ones together.
2. When the user explains their approach, check it against the code, docs or a
   quick test before answering.
3. Reply honestly:
   - **It holds:** agree and move on. Don't argue for show.
   - **You see a real problem:** say it once, concretely: what breaks, when, and
     your evidence. Offer an alternative.
4. If the user answers the problem or brings better evidence, agree. If you
   still disagree, allow one more round at most. Then record both views and let
   the user decide; it's their call. Never repeat an objection without new evidence.

## Rules for both modes

- Be sure of your facts. Label each one as checked (code, docs, test) or a guess.
- New project: choose stack, hosting and data storage from actual needs (team
  skills, data, scale, budget), not fashion. One deployable app until there is a
  real reason to split it.
- Existing project: keep its stack and structure. Propose a change only when the
  current way can't do the job, and say why.
- For every action, say which roles may do it. A missing rule is an open
  question, not a yes.
- With approved screens, walk each one: every action and every piece of data
  it shows needs an endpoint and a role rule in the plan. Then write, per
  endpoint, what each role gets back. A role must never receive a field its
  screens don't show.
- When times are stored in UTC but shown in local time, say where a local
  day, week and month start and end.
- Start with the smallest version someone can actually use.
- For a new API, module or shared helper, write how the caller will use it
  first (the call and what comes back), then the types and files behind it.
  For a real choice, sketch two different shapes before picking one.
- Reject these shapes: a wrapper that only passes the same arguments on; a
  module whose callers must call several methods in order to do one thing;
  database or wire types leaking into other modules; files split by step
  (load, validate, save) instead of by what they own.
- Database changes: say what happens to existing data and whether it can be
  undone. Add an index only for a query you can name.
- You only plan. Don't write product code, run migrations, create tickets, or
  message anyone.
- If the code later needs something the plan doesn't say, update the plan and
  tell the user. Don't quietly drift from it.

## The plan itself

The shape of the plan, and where to save it, is in
[plan.md](references/plan.md).
