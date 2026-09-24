# PartyFox agent setup

`AGENTS.md` points all supported coding agents to `.agents/INSTRUCTIONS.md` and `.agents/guides/project.md`. `.claude/skills` and `.claude/agents` link to the project-local sources here. The available commands and current workspace state are in `guides/project.md`.

## Workflow

| Task | Skill or agent |
| --- | --- |
| Take a new product from brief through visual choice, architecture, and feature delivery | `greenfield-mode` |
| Explore or change a screen's design | `design-interface` |
| Plan requirements, roles, data, and API behavior | `plan-feature` |
| Build an agreed feature in working slices | `deliver-feature` |
| Critique, typeset, adapt, or polish UI | `impeccable` |
| Set a product-specific visual direction before coding | `frontend-design` (global) |
| Design purposeful animation | `design-animations` |
| Score candidate screenshots on the design rubric, read-only | `design-critic` agent |
| Review code or a plan without editing | `reviewer` agent |

Use `/greenfield-mode` in Cursor or `$greenfield-mode` in Codex. Cursor can pin it as a custom mode.

## How a design gets made

1. Research: Mobbin MCP in two passes, the task pattern and then polished products from other categories. Images go to `studio/references/`.
2. Layout round: two or three layouts in a neutral grey world. The user presses **Choose layout**.
3. Identity round: two or three complete worlds on that layout, each with a real Google Fonts pair, full OKLCH tokens and a signature detail. The user browses the palette library on them (primary, secondary, tertiary and neutral seeds with tonal scales, about 40 curated plus generated and saved ones), tunes inside contrast and status limits, pins comments, and presses **Approve**.
4. Before each round reaches the user, the agent captures every candidate, fixes what the capture report and token check find, and asks `design-critic` for a score. The agent may not grade its own work.
5. Approval writes `DESIGN.md` (the google-labs-code DESIGN.md format) and `design/tokens.css`. `plan-feature` links them; `deliver-feature` builds only with those tokens and runs the token check.

Likes and rejects from studio comments go to `studio/taste.md`, which every later round reads.

## Local design studio

The engine is shared and lives in `skills/greenfield-mode/assets/studio-engine/`. A project's `studio/` holds only content and a `server.py` stub that finds the engine here or in `~/.agents/skills/`. Run `python3 studio/server.py` from the project root and open the URL it prints. The full format is in [`skills/greenfield-mode/references/studio.md`](skills/greenfield-mode/references/studio.md).

The studio is a local review page with fake data. It doesn't call a model or deploy anything.

## Source layout

```text
.agents/skills/greenfield-mode/        Cross-stage coordinator
  assets/studio-engine/                Shared studio server, checks, export and page
  assets/studio-content/               What init_studio.py copies into a new project's studio/
  scripts/                             init_studio.py, capture.mjs, check_tokens.py, test_studio.mjs
  references/studio.md                 Studio format, rounds and candidate rules
.agents/skills/design-interface/       Design process and quality gate
.agents/skills/plan-feature/           Product and architecture planning
.agents/skills/deliver-feature/        Working feature delivery
.agents/skills/impeccable/             Installed design-quality skill and detector
.agents/agents/design-critic.md        Read-only design scoring agent
.agents/agents/reviewer.md             Read-only code and plan reviewer
.agents/scripts/sync_skills.py         Compare or copy skills and agents between this project and ~/.agents
studio/                                PartyFox design content and the user's saved choices
PRODUCT.md                             Working product facts and unknowns
```

## Keeping copies in step

The project copy of each skill and agent is the working version. `python3 .agents/scripts/sync_skills.py` lists what differs from `~/.agents/`. `--push` copies project versions over global ones for items in both places. `--push <name>` also installs a project-only item globally.

Codex reads agents from `.codex/agents/*.toml`, which are generated. This workspace has no `agents:sync` script, so `design-critic` has no Codex file yet; don't write one by hand.

The older React prototype and its npm scripts are absent from this workspace. See `guides/verification.md` for checks that can actually run now.
