#!/usr/bin/env python3
"""Check that the Claude Code, Codex and Cursor manifests agree on name and version.

    python3 tools/check_manifests.py            # report, exit 1 on a mismatch
    python3 tools/check_manifests.py --bump 0.2.0   # set the version everywhere
"""

import argparse
import json
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parent.parent
PLUGINS = ["plugin/.claude-plugin/plugin.json", "plugin/plugin.json", "plugin/.cursor-plugin/plugin.json"]
MARKETPLACES = [".claude-plugin/marketplace.json", ".agents/plugins/marketplace.json", ".cursor-plugin/marketplace.json"]


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--bump", help="New version for every plugin manifest")
    args = parser.parse_args()
    problems = []
    manifests = {path: json.loads((ROOT / path).read_text(encoding="utf-8")) for path in PLUGINS}
    if args.bump:
        for path, value in manifests.items():
            value["version"] = args.bump
            (ROOT / path).write_text(json.dumps(value, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    names = {value["name"] for value in manifests.values()}
    versions = {value.get("version") for value in manifests.values()}
    if len(names) != 1:
        problems.append(f"plugin names differ: {sorted(names)}")
    if len(versions) != 1:
        problems.append(f"versions differ: { {path: value.get('version') for path, value in manifests.items()} }")
    name = next(iter(names))
    for path in MARKETPLACES:
        entries = json.loads((ROOT / path).read_text(encoding="utf-8"))["plugins"]
        if not any(entry["name"] == name for entry in entries):
            problems.append(f"{path} does not list {name}")
    for problem in problems:
        print(problem)
    print("Manifests agree." if not problems else f"{len(problems)} problem(s).", f"{name} {next(iter(versions))}")
    return 1 if problems else 0


if __name__ == "__main__":
    sys.exit(main())
