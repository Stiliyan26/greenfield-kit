#!/usr/bin/env python3
"""Copy the greenfield-kit working rules into a project. Existing files are never overwritten."""

import argparse
from pathlib import Path
import shutil

TEMPLATES = Path(__file__).resolve().parent.parent / "templates"


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("project_root", type=Path, help="The project to set up")
    args = parser.parse_args()
    root = args.project_root.expanduser().resolve()
    if not root.is_dir():
        parser.error(f"Not a folder: {root}")
    copied, skipped = [], []
    for source in sorted(path for path in TEMPLATES.rglob("*") if path.is_file()):
        relative = source.relative_to(TEMPLATES)
        target = root / relative
        if target.exists():
            skipped.append(str(relative))
            continue
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(source.resolve(), target)
        copied.append(str(relative))
    print("Copied:" if copied else "Copied nothing.")
    for item in copied:
        print(f"  {item}")
    if skipped:
        print("Skipped, already there (merge by hand if needed):")
        for item in skipped:
            print(f"  {item}")
    print("Next: fill in .agents/PROJECT.md — its facts, commands and checks.")
    print("For a Bun or Node project, also run write-code/scripts/install_checks.py to install the code rules as checks.")


if __name__ == "__main__":
    main()
