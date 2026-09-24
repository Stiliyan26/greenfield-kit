# Checks for this repo

Run the checks that match the changed files. Commands are in `project.md`. A check that is missing, skipped or failing is not a pass.

## Studio engine or greenfield-mode scripts

1. Check the syntax of every changed Python and JavaScript file.
2. Run the end-to-end studio test. It must print `0 failed`.
3. Start the PartyFox studio, capture it with `--studio`, and look at the captures at 1440, 1024 and 390.
4. Ask the `design-critic` agent to score changed studio UI. Under 70 means revise first.

## Studio content in examples/partyfox

1. The token check prints `0 problems`.
2. Capture every candidate and read `capture.md`: no sideways scroll, no console errors, fonts loaded.

## Skills, agents and the plugin

1. Read each changed skill as a future agent would: links, commands, paths and stage order must exist.
2. Both `claude plugin validate` commands pass with `--strict`, and `python3 tools/check_manifests.py` prints `Manifests agree.`
3. After changing an agent, regenerate `.codex/agents/` with `codex_agents.py --project .`.
4. After changing a skill or agent, bump the version with `tools/check_manifests.py --bump <version>` so installed copies update.
5. To test Codex without touching your setup: `CODEX_HOME=<temp> codex plugin marketplace add .` then `codex plugin add greenfield-kit@greenfield-kit`.

Keep screenshots and test output in `temp/verification/`. Report what each check showed and what was not checked.
