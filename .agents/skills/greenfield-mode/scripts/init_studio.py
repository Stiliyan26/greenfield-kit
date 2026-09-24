#!/usr/bin/env python3
"""Create a neutral local design studio in a new project."""

import argparse
import json
from pathlib import Path
import shutil


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("project_root", type=Path, help="Existing project directory")
    parser.add_argument("--name", required=True, help="Product name shown in the studio")
    args = parser.parse_args()

    root = args.project_root.expanduser().resolve()
    if not root.is_dir():
        parser.error(f"Project directory does not exist: {root}")
    if not args.name.strip():
        parser.error("Product name cannot be blank")
    destination = root / "studio"
    if destination.exists():
        parser.error(f"Studio already exists; inspect it instead of overwriting: {destination}")

    template = Path(__file__).resolve().parent.parent / "assets" / "studio-template"
    shutil.copytree(template, destination)
    project_file = destination / "project.json"
    project = json.loads(project_file.read_text(encoding="utf-8"))
    project["name"] = args.name.strip()
    project_file.write_text(json.dumps(project, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Created {destination}")
    print("Add real screens and candidate files to studio/project.json before presenting designs.")
    print(f"Then run: python3 {destination / 'server.py'}")


if __name__ == "__main__":
    main()
