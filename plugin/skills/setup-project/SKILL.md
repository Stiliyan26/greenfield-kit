---
name: setup-project
description: Set up a project for greenfield-kit - copy CLAUDE.md and the .claude/ config that enables the plugin, and install the write-code checks. Use when starting a project with the kit, or when asked to "set up the agent rules here".
---

# Set up a project

`<skill-root>` is the folder this `SKILL.md` is in.

1. Look for `CLAUDE.md` and `.claude/` in the project. The script never
   overwrites a file; it skips it and says so.
2. From the project root:

   ```
   python3 <skill-root>/scripts/setup_project.py .
   ```

   It copies `CLAUDE.md` (the working rules and the project's facts, to fill
   in), `.claude/settings.json` (enables the plugin for everyone who trusts
   the folder) and `.claude/explain.config.json`.
3. For each skipped file, show the difference and ask whether to merge by
   hand.
4. Fill `CLAUDE.md` with real commands and checks. Leave no line in angle
   brackets. Write only commands you have run.
5. Bun or Node project: install the code rules as checks.

   ```
   python3 <plugin>/skills/write-code/scripts/install_checks.py .
   ```

   It writes `.oxlintrc.json`, `eslint.config.mjs` and `knip.json`, adds
   `bun run check` and `check:fix` to `package.json`, and prints the
   packages to install. Keep a file the team already has and likes; say so.
6. Say what was copied, what was skipped, and what the user still fills in.

Done when the files exist, `bun run check` runs, and `CLAUDE.md` has no
angle brackets left.
