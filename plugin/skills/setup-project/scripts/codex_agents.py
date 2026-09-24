#!/usr/bin/env python3
"""Turn the kit's agents (agents/*.md) into Codex custom agents (.codex/agents/*.toml).

Codex plugins carry skills but not agents, so this writes the agents where Codex
reads them:

    python3 codex_agents.py --project .     # <project>/.codex/agents/
    python3 codex_agents.py --global        # $CODEX_HOME/agents or ~/.codex/agents/

It overwrites only files it generated itself; other files are left alone.
"""

import argparse
import os
from pathlib import Path
import re
import sys

AGENTS = Path(__file__).resolve().parents[3] / "agents"
HEADER = "# Generated from the greenfield-kit agents/ folder by codex_agents.py; do not edit."
WRITE_TOOLS = {"edit", "write", "bash", "multiedit", "notebookedit"}


def parse(path):
    text = path.read_text(encoding="utf-8")
    match = re.match(r"^---\n(.*?)\n---\n(.*)$", text, re.S)
    if not match:
        raise ValueError(f"{path.name} has no frontmatter")
    meta = dict(line.split(":", 1) for line in match.group(1).splitlines() if ":" in line)
    meta = {key.strip(): value.strip() for key, value in meta.items()}
    return meta, match.group(2).strip()


def basic(value):
    return '"' + value.replace("\\", "\\\\").replace('"', '\\"') + '"'


def to_toml(meta, body):
    tools = {tool.strip().lower() for tool in meta.get("tools", "").split(",") if tool.strip()}
    sandbox = "read-only" if tools and not tools & WRITE_TOOLS else "workspace-write"
    instructions = body.replace("\\", "\\\\").replace('"""', '\\"\\"\\"')
    return "\n".join([
        HEADER,
        f"name = {basic(meta['name'])}",
        f"description = {basic(meta['description'])}",
        f'sandbox_mode = "{sandbox}"',
        f'developer_instructions = """\n{instructions}\n"""',
        "",
    ])


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    where = parser.add_mutually_exclusive_group(required=True)
    where.add_argument("--project", type=Path, help="Project root; writes <root>/.codex/agents/")
    where.add_argument("--global", dest="global_", action="store_true", help="Write to $CODEX_HOME/agents or ~/.codex/agents/")
    args = parser.parse_args()
    target = (args.project.expanduser().resolve() / ".codex" / "agents") if args.project else Path(os.environ.get("CODEX_HOME", Path.home() / ".codex")) / "agents"
    target.mkdir(parents=True, exist_ok=True)
    for source in sorted(AGENTS.glob("*.md")):
        meta, body = parse(source)
        destination = target / f"{meta['name']}.toml"
        if destination.exists():
            first = destination.read_text(encoding="utf-8").splitlines()[:1]
            if first != [HEADER] and "Generated from" not in (first[0] if first else ""):
                print(f"skipped {destination} (not generated; merge by hand)")
                continue
        destination.write_text(to_toml(meta, body), encoding="utf-8")
        print(f"wrote   {destination}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
