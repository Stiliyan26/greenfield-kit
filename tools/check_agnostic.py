#!/usr/bin/env python3
"""Fail when the plugin mentions the test bed.

    python3 tools/check_agnostic.py

The skills, agents, scripts and studio engine in plugin/ serve any project. Words from
examples/partyfox (its name, its roles, its data, its screen ids) belong in that folder
only. Examples in the plugin use a neutral domain: orders, customers, invoices.
"""

from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parent.parent
PLUGIN = ROOT / "plugin"
# Vendored skills that come from elsewhere; they are checked where they come from.
SKIP = {PLUGIN / "skills" / "shadcn"}
EXTENSIONS = {".md", ".py", ".js", ".mjs", ".json", ".html", ".css", ".toml", ".yml", ".yaml"}
WORDS = re.compile(
    r"partyfox|\banimators?\b|\bdeposits?\b|kids.?part(y|ies)|\bbirthday party\b"
    r"|ops-day|my-parties|my-pay|leave-requests|аниматор|парти|депозит",
    re.IGNORECASE,
)


def main():
    found = []
    for path in sorted(PLUGIN.rglob("*")):
        if not path.is_file() or path.suffix not in EXTENSIONS or any(skip in path.parents for skip in SKIP):
            continue
        # Installed packages (the explainer's renderer) are not the kit's words.
        if "node_modules" in path.parts:
            continue
        for number, line in enumerate(path.read_text(encoding="utf-8", errors="replace").splitlines(), 1):
            match = WORDS.search(line)
            if match:
                found.append(f"{path.relative_to(ROOT)}:{number}: {match.group(0)}")
    for line in found:
        print(line)
    print(f"{len(found)} project-specific word{'s' if len(found) != 1 else ''} in plugin/." if found else "No project-specific words in plugin/.")
    return 1 if found else 0


if __name__ == "__main__":
    sys.exit(main())
