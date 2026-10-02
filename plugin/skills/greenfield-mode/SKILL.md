---
name: greenfield-mode
description: Run a new project end to end with the user - from the brief to the interface, components, system design, API endpoints and data model, to a working production-grade app. Use when starting a new project or restarting its design.
---

# Greenfield mode

You lead the whole pipeline across turns and move each step forward. The user gives the information
and says where it comes from: client calls, notes, or their own words. You go through the proejct together:
you guide, ask and check; the user decides.

## Stages

Do them in order. Each stage ends with something the user approves.

### 1. Brief and grill

- Read the evidence and draft `BRIEF.md`. Each line cites its source from what
  the user gave. Mark lines you suggest with (AI). List unknowns separately.
- Interview the user relentlessly about every aspect of the brief until you
  reach a shared understanding. Walk down each branch of the design tree,
  resolving dependencies between decisions one by one. Ask one question at a
  time. If the evidence or existing code answers a question, look there
  instead of asking.
- Done when every unknown is answered or marked "later".

### 2. Design interface

- Use the `design-interface` skill with the user. Start with the 2–3 key
  screens; the rest follow their look.
- Done when the user approves the design in the studio.

### 3. System design

- When the design is approved, start a background agent to promote it into
  the real app folder drafting the real components. ([promote.md](../design-interface/references/promote.md))

## The fork after Approve

Approval is the fork. 3A needs no decisions, so it runs in the background
while 3B runs with the user in chat. A screen change during planning goes
back through the studio: re-approve, and 3A promotes the changed screens
again. It never goes straight into `web/`. The join is: plan approved and
promotion accepted. Then 3C.

## Fixed rules

- Worktrees for every agent that writes code. One shared checkout only for
  agents that don't edit (reviewers, which may run code, and the critic).
- Coordination is files and git: the feature files, the ownership lists, the
  `requests/` folder and the merge order. A runtime's task list or messaging
  is an extra on top, never what the flow depends on.
- Feature agents never edit `shared/`, the schema or the contract; they write
  a request. You never write features; you answer requests and merge.
- End-to-end scenarios are written in the plan, made green per feature, and
  run all together on the merged app at the end.
- Building asks the user almost nothing. A question during a feature means
  the plan was incomplete: update the plan, then continue.
- A part or a look the approved design doesn't have goes back to the studio.
- The `review` skill runs the same flow four times: on the plan files before
  approval, by each feature agent on its own diff before it reports done, at
  every merge by you, and on the whole app before proof. One reviewer per
  feature; reviewers may run code to prove a finding but never edit. It writes
  `reviews/<date>-<target>/`; the user ticks, then fix agents work from the
  ticks. The design critic is the review of stage 2.

## Small changes

Not everything re-enters the whole loop. A new screen or a look change goes
to `design-interface`. A data or API change updates the plan and its contract.
A wiring-only fix goes straight to `deliver-feature`.
