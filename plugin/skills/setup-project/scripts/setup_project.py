#!/usr/bin/env python3
"""Copy the stistack working rules into a project. Existing files are never overwritten."""

import argparse
import json
from pathlib import Path
import shutil

TEMPLATES = Path(__file__).resolve().parent.parent / "templates"
STACKS = Path(__file__).resolve().parents[2] / "write-code" / "stacks"
IGNORED = ["temp/", ".playwright-mcp/"]


def ignore_scratch(root):
    """Add the test and browser output folders to .gitignore; return the lines added."""
    gitignore = root / ".gitignore"
    text = gitignore.read_text() if gitignore.exists() else ""
    missing = [line for line in IGNORED if line not in text.splitlines()]
    if missing:
        if text and not text.endswith("\n"):
            text += "\n"
        text += "\n# Test and browser output, deleted when a task is done\n" + "\n".join(missing) + "\n"
        gitignore.write_text(text)
    return missing


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
    ignored = ignore_scratch(root)
    print("Copied:" if copied else "Copied nothing.")
    for item in copied:
        print(f"  {item}")
    if skipped:
        print("Skipped, already there (merge by hand if needed):")
        for item in skipped:
            print(f"  {item}")
    if ignored:
        print(f"Added to .gitignore: {', '.join(ignored)}")
    print(f"Next: install the stack's checks:\n  {install_checks_line(root)}")
    print("Then fill in CLAUDE.md: the project's facts, commands and checks.")


def install_checks_line(root):
    """Return the command that installs the checks for the stack named in .claude/stack.json."""
    stack_file = root / ".claude" / "stack.json"
    try:
        name = json.loads(stack_file.read_text())["name"]
    except (OSError, ValueError, KeyError) as error:
        return f"(no stack name: {stack_file} could not be read: {error}. Set its \"name\", then run this script again.)"
    script = STACKS / name / "install_checks.py"
    if not script.is_file():
        return f"(no install script for stack \"{name}\": {script} does not exist. Pick a folder under {STACKS}.)"
    return f"python3 {script} {root}"


if __name__ == "__main__":
    main()
