---
name: setup-project
description: Sets up a project for stistack - copies CLAUDE.md, the .claude/ config that enables the plugin and the stack file, and installs the stack's checks. Use when starting a project with stistack, or when asked to "set up the agent rules here".
---

# Set up a project

`<skill-root>` is the folder of this `SKILL.md`.

```text
Setup progress:
- [ ] 1 Templates copied
- [ ] 2 Skipped files resolved
- [ ] 3 Stack file matches the project
- [ ] 4 Checks installed and running
- [ ] 5 CLAUDE.md filled in
- [ ] 6 Report given
```

1. **Copy the templates.** From the project root, run:

   ```
   python3 <skill-root>/scripts/setup_project.py .
   ```

   It copies:
   - `CLAUDE.md`: the working rules and the project's facts, to fill in.
   - `.claude/settings.json`: enables the plugin for everyone who trusts the
     folder.
   - `.claude/stack.json`: the stack, with every tool and command that the
     skills call by role.
   - `.claude/explain.config.json`.

   It adds `temp/` and `.playwright-mcp/` to `.gitignore`. It never
   overwrites a file. It skips the file and says so.

   Done when the script prints what it copied and what it skipped.

2. **Resolve skipped files.** For each skipped file, show the difference.
   Ask whether to merge by hand.

   Done when each skipped file is merged or the user chose to keep it.

3. **Check the stack file.** If the project uses other tools, change the
   names, commands and paths in `.claude/stack.json`.

   Done when `stack.json` matches the project's tools.

4. **Install the stack's checks.** Run the install script for the stack's
   `name`. Step 1 printed its path. The script writes the lint, format and dead-code configs and adds
   the check scripts. It prints the packages to install. Keep a file that the
   team already has and likes. Say so.

   Done when the check command runs. If it fails because of the stack file,
   return to step 3.

5. **Fill in `CLAUDE.md`.** Write real commands and checks. Write only
   commands that you have run.

   A command that never ran misleads every later agent.

   Done when no `<…>` fill-in prompt is left in `CLAUDE.md` and each command
   ran. Patterns such as `temp/verification/<task>/` stay.

6. **Report.** Say what was copied, what was skipped and what the user still
   fills in.

   Done when the report has all three.
