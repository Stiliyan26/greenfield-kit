#!/usr/bin/env python3
"""Compare the greenfield-kit plugin's skills and agents with the copies in ~/.agents.

Claude Code loads the kit as a plugin. Codex and Cursor read ~/.agents/skills,
so this copies the kit there. The plugin is the source of truth.

    python3 sync_global.py                 # report what differs (exit 1 if any)
    python3 sync_global.py --push          # copy every kit skill and agent to ~/.agents
    python3 sync_global.py --push NAME     # copy only these
    python3 sync_global.py --pull NAME     # copy global copies back into the kit
"""

import argparse
import filecmp
from pathlib import Path
import shutil
import sys

# <plugin>/skills/setup-project/scripts/sync_global.py -> <plugin>
PROJECT = Path(__file__).resolve().parents[3]
IGNORE = {"__pycache__", ".DS_Store"}


def items(root, kind):
    folder = root / kind
    if not folder.is_dir():
        return {}
    if kind == "skills":
        return {path.name: path for path in folder.iterdir() if path.is_dir() and (path / "SKILL.md").exists()}
    return {path.stem: path for path in folder.glob("*.md")}


def differences(first, second):
    """Relative paths that differ between two files or folders."""
    if first.is_file() or second.is_file():
        return [] if first.is_file() and second.is_file() and filecmp.cmp(first, second, shallow=False) else [first.name]
    found = []
    compare = filecmp.dircmp(first, second, ignore=list(IGNORE))

    def walk(node, prefix):
        found.extend(f"{prefix}{name} (only in project)" for name in node.left_only)
        found.extend(f"{prefix}{name} (only in global)" for name in node.right_only)
        for name in node.common_files:
            if not filecmp.cmp(Path(node.left) / name, Path(node.right) / name, shallow=False):
                found.append(f"{prefix}{name}")
        for name, child in node.subdirs.items():
            walk(child, f"{prefix}{name}/")
    walk(compare, "")
    return found


def copy(source, target):
    if source.is_file():
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source, target)
        return
    if target.exists():
        shutil.rmtree(target)
    shutil.copytree(source, target, symlinks=True, ignore=shutil.ignore_patterns(*IGNORE))


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument("--push", action="store_true", help="copy project copies over global ones")
    mode.add_argument("--pull", action="store_true", help="copy global copies over project ones")
    parser.add_argument("--global-root", type=Path, default=Path.home() / ".agents", help="default: ~/.agents")
    parser.add_argument("names", nargs="*", help="limit to these skills or agents")
    args = parser.parse_args()
    if args.pull and not args.names:
        parser.error("--pull replaces project files; name the skills or agents to pull")

    drift = 0
    for kind in ("skills", "agents"):
        local, remote = items(PROJECT, kind), items(args.global_root, kind)
        wanted = set(args.names) or set(local) | set(remote)
        for name in sorted(wanted & (set(local) | set(remote))):
            here, there = local.get(name), remote.get(name)
            label = f"{kind}/{name}"
            if here and there:
                changed = differences(here, there)
                if not changed:
                    continue
                if args.push:
                    copy(here, there)
                    print(f"pushed  {label}: {len(changed)} file(s)")
                elif args.pull:
                    copy(there, here)
                    print(f"pulled  {label}: {len(changed)} file(s)")
                else:
                    drift += 1
                    print(f"differs {label}:\n  " + "\n  ".join(changed))
            elif here:
                if args.push and (not args.names or name in args.names):
                    copy(here, args.global_root / kind / here.name)
                    print(f"installed {label} globally")
                elif not args.push:
                    print(f"not installed {label}")
            else:
                if args.pull and name in args.names:
                    copy(there, PROJECT / kind / there.name)
                    print(f"installed {label} in the project")
                elif not args.pull:
                    pass  # other skills in ~/.agents are not the kit's business
    if not (args.push or args.pull):
        print(f"{drift} shared item(s) differ." if drift else "Shared skills and agents match.")
    return 1 if drift else 0


if __name__ == "__main__":
    sys.exit(main())
