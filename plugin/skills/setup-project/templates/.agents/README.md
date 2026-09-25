# Agent setup

`AGENTS.md` points every coding agent to `.agents/INSTRUCTIONS.md` and `.agents/PROJECT.md`.

- `INSTRUCTIONS.md` is the working agreement: how to talk, where facts come from, which checks count.
- `PROJECT.md` is this project's facts, commands, checks and rules. Keep it short and true.
- Shared skills and agents come from the greenfield-kit plugin. In Claude Code they are named `greenfield-kit:<skill>`.
- How to write and place code is the `write-code` skill, not a file here. Its ESLint preset checks the mechanical half.
- Project-only skills go in `.agents/skills/`, project-only agents in `.agents/agents/`.
