---
name: setup-project
description: Set up a project for greenfield-kit - copy the working rules and a .claude/settings.json that enables the plugin, and install the write-code checks. Use when starting a project with the kit, or when asked to "set up the agent rules here".
---

# Set up a project

`<skill-root>` is the folder this `SKILL.md` is in.

1. Look for `AGENTS.md`, `.agents/`, `CLAUDE.md` and `.claude/settings.json`
   in the project. The script never overwrites one; it skips it and says so.
2. From the project root:

   ```
   python3 <skill-root>/scripts/setup_project.py .
   ```

   It copies `AGENTS.md`, `.agents/INSTRUCTIONS.md` (the working agreement),
   `.agents/PROJECT.md` (the project's facts, to fill in), `.agents/README.md`,
   `.agents/explain.config.json` and `.claude/settings.json` (enables the
   plugin for everyone who trusts the folder).
3. For each skipped file, show the difference and ask whether to merge by
   hand.
4. Fill `.agents/PROJECT.md` with real commands and checks. Leave no line in
   angle brackets. Write only commands you have run.
5. Bun or Node project: install the code rules as checks.

   ```
   python3 <plugin>/skills/write-code/scripts/install_checks.py .
   ```

   It writes `.oxlintrc.json`, `eslint.config.mjs` and `knip.json`, adds
   `bun run check` and `check:fix` to `package.json`, and prints the
   packages to install. Keep a file the team already has and likes; say so.
6. Say what was copied, what was skipped, and what the user still fills in.

Done when the files exist, `bun run check` runs, and `.agents/PROJECT.md`
has no angle brackets left.
