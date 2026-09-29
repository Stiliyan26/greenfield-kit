#!/usr/bin/env python3
"""Create a project's design studio: the content folder and the studio app.

    python3 init_studio.py <project-root> --name "<product>" [--no-app]

studio/ holds the project's facts (project.json, references, the files the page
writes). studio/app/ is one Vite + React + shadcn app for every model's design:
each model writes only src/variants/<id>/, and `npm run build` there writes the
studio's candidate pages. The engine stays in this skill.
"""

import argparse
import json
from pathlib import Path
import shutil
import subprocess
import sys

SKILL = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(SKILL / "assets" / "studio-engine"))
import studio_export  # noqa: E402


def run(command, cwd):
    print("$ " + " ".join(command))
    subprocess.run(command, cwd=cwd, check=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("project_root", type=Path, help="Existing project directory")
    parser.add_argument("--name", required=True, help="Product name shown in the studio")
    parser.add_argument("--no-app", action="store_true", help="Content folder only, for hand-written HTML candidates")
    args = parser.parse_args()

    root = args.project_root.expanduser().resolve()
    if not root.is_dir():
        parser.error(f"Project directory does not exist: {root}")
    if not args.name.strip():
        parser.error("Product name cannot be blank")
    destination = root / "studio"
    if destination.exists():
        parser.error(f"Studio already exists; inspect it instead of overwriting: {destination}")
    if not args.no_app and not shutil.which("npm"):
        parser.error("npm is needed for the studio app (or pass --no-app)")

    shutil.copytree(SKILL / "assets" / "studio-content", destination)
    for folder in ("candidates", "references"):
        (destination / folder).mkdir(exist_ok=True)
    # Remember where this engine is, so server.py finds it even from a plugin cache.
    (destination / ".engine-path").write_text(str(SKILL / "assets" / "studio-engine") + "\n", encoding="utf-8")
    project_file = destination / "project.json"
    project = json.loads(project_file.read_text(encoding="utf-8"))
    project["name"] = args.name.strip()
    project_file.write_text(json.dumps(project, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Created {destination}")

    if not args.no_app:
        app = destination / "app"
        shutil.copytree(SKILL / "assets" / "studio-app", app)
        (app / "src" / "studio-theme.css").write_text(studio_export.studio_theme_css(), encoding="utf-8")
        (app / "src" / "variants").mkdir()
        run(["npm", "install", "--no-audit", "--no-fund"], app)
        run(["npx", "shadcn@latest", "add", "--all", "--yes", "--overwrite"], app)
        print(f"Created {app}: every shadcn part is in src/components/ui")

    print("Add one screen per view the brief names to studio/project.json.")
    if args.no_app:
        print("Each model then writes studio/candidates/<id>/variant.json and one <screen>.html per screen.")
    else:
        print("Write the shared data in studio/app/src/data.ts.")
        print("Each model then writes studio/app/src/variants/<id>/ (variant.json, screens/<screen>.tsx, parts/)")
        print("and runs `npm run build` in studio/app to write its candidate pages.")
    print("Run from the project root: python3 studio/server.py")


if __name__ == "__main__":
    main()
