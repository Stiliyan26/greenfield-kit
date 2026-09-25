# Agent setup for this repo

`AGENTS.md` points every coding agent to `.agents/INSTRUCTIONS.md` and `.agents/PROJECT.md`.

The kit's skills and agents live in `plugin/`. `.agents/skills/` and `.agents/agents/` hold symlinks to them, plus `impeccable`, which is installed separately. `.claude/skills` and `.claude/agents` point here. Edit the files under `plugin/`, never the links.

`INSTRUCTIONS.md` is a symlink to the `setup-project` template, so editing it changes what new projects receive. `PROJECT.md` is this repo's own facts, commands and checks — not a template.

How to write and place code is the `write-code` skill, not a file in here. There is no `guides/` folder any more.

When you add, remove or rename a skill or agent, add or remove its symlink here and update the table in the root `README.md` in the same change.
