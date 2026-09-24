# PartyFox agent setup

`AGENTS.md` points all supported coding agents to `.agents/INSTRUCTIONS.md` and `.agents/guides/project.md`. `.claude/skills` and `.claude/agents` link to the project-local sources here. The available commands and current workspace state are in `guides/project.md`.

## Workflow

| Task | Skill |
| --- | --- |
| Take a new product from brief through visual choice, architecture, and feature delivery | `greenfield-mode` |
| Explore or change a screen's design | `design-interface` |
| Plan requirements, roles, data, and API behavior | `plan-feature` |
| Build an agreed feature in working slices | `deliver-feature` |
| Critique, typeset, adapt, or polish UI | `impeccable` |
| Set a product-specific visual direction before coding | `frontend-design` (global) |
| Design purposeful animation | `design-animations` |
| Review code without editing | `reviewer` agent |

Use `/greenfield-mode` in Cursor or `$greenfield-mode` in Codex. Cursor can pin it as a custom mode. The generic workflow skills, `frontend-design`, and `impeccable` are installed in `~/.agents/skills/` for other local projects. The initializer creates a fresh studio only when the mode is used in a project without one. Before showing concepts, the agent records distinct direction contracts, renders desktop and phone views, and runs the [visual quality gate](skills/design-interface/references/visual-quality.md).

## Local design studio

Run `python3 studio/server.py` from the repository root and open `http://127.0.0.1:4173/`. The controls update the real PartyFox calendar, booking, and animator examples. Changes save to `studio/selection.json`. The user can leave feedback or approve a specific revision; editing afterward returns the status to draft. The agent reads that file before continuing the design or architecture.

The studio is a local review interface with fake data. It does not call a model or deploy an application. New design rounds change the local candidate files and refresh the same browser page.

For another product, use the globally installed workflow skills or install these same generic skills in that project's `.agents/skills/`. The initializer makes a neutral `studio/`; the agent then creates that product's designs. The precise steps are in [`greenfield-mode/references/new-project.md`](skills/greenfield-mode/references/new-project.md). This PartyFox studio and its sample data stay in this project.

## Source layout

```text
.agents/skills/greenfield-mode/   Cross-stage coordinator
.agents/skills/design-interface/  Design process
.agents/skills/plan-feature/      Product and architecture planning
.agents/skills/deliver-feature/   Working feature delivery
.agents/skills/impeccable/       Installed design-quality skill
studio/                           Local comparison interface and selection
PRODUCT.md                        Working product facts and unknowns
```

The older React prototype and its npm scripts are absent from this workspace. See `guides/verification.md` for checks that can actually run now. If the application returns later, update the guides to match its commands before using them.
