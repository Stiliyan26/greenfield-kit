---
name: setup-project
description: Set up a project for the greenfield-kit workflow - copy the working rules (AGENTS.md, .agents/INSTRUCTIONS.md, coding conventions, project and verification guides) and a .claude/settings.json that enables the plugin for teammates, or install the kit's skills globally for Codex and Cursor. Use when starting a new project with the kit, or when asked to "set up the agent rules here".
---

# Set up a project for greenfield-kit

`<skill-root>` is the folder that holds this `SKILL.md`.

## Copy the working rules into a project

1. Look at the project first: an existing `AGENTS.md`, `.agents/`, `CLAUDE.md` or `.claude/settings.json`. Never overwrite one. The script skips existing files and lists them.
2. Run from the project root:

   ```
   python3 <skill-root>/scripts/setup_project.py .
   ```

3. For each skipped file, show the user the difference and ask whether to merge by hand.
4. Fill `.agents/guides/project.md` with the project's real facts and commands, and `.agents/guides/verification.md` with checks that actually exist. Replace every line in angle brackets. Don't invent commands.
5. Say what was copied, what was skipped, and what the user still has to fill in.

What gets copied:

| File | Purpose |
| --- | --- |
| `AGENTS.md` | Points every coding agent to the two files below |
| `.agents/INSTRUCTIONS.md` | The working agreement: plain words, sources, checks, finish report |
| `.agents/guides/conventions.md`, `pagination.md` | Coding rules for React/TypeScript and NestJS projects |
| `.agents/guides/project.md`, `verification.md` | Templates for this project's facts and checks |
| `.agents/README.md` | How the agent setup is organized |
| `.claude/settings.json` | Registers the greenfield-kit marketplace and enables the plugin for everyone who trusts the folder |

## Use the kit in Codex or Cursor

The same repo is a plugin marketplace for Codex (`.agents/plugins/marketplace.json`) and Cursor (`.cursor-plugin/marketplace.json`):

```
codex plugin marketplace add Stiliyan26/greenfield-kit
codex plugin add greenfield-kit@greenfield-kit
cursor-agent plugin marketplace add https://github.com/Stiliyan26/greenfield-kit
```

Codex plugins don't carry agents. Write the kit's agents as Codex custom agents:

```
python3 <skill-root>/scripts/codex_agents.py --project .    # this project's .codex/agents/
python3 <skill-root>/scripts/codex_agents.py --global      # ~/.codex/agents/
```

It overwrites only files it generated. Without plugins, Codex and Cursor read `~/.agents/skills/`:

```
python3 <skill-root>/scripts/sync_global.py            # report what differs
python3 <skill-root>/scripts/sync_global.py --push     # copy the kit's skills and agents to ~/.agents
```

`--push` replaces only the kit's own skills and agents. Ask the user before writing to their home folder.
