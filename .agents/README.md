# Agent setup for this repo

`AGENTS.md` points every coding agent to `.agents/INSTRUCTIONS.md` and `.agents/guides/project.md`.

The kit's skills and agents live in `plugin/`. `.agents/skills/` and `.agents/agents/` hold symlinks to them, plus `impeccable`, which is installed separately. `.claude/skills` and `.claude/agents` point here. Edit the files under `plugin/`, never the links.

When you add, remove or rename a skill or agent, add or remove its symlink here and update the table in the root `README.md` in the same change.
