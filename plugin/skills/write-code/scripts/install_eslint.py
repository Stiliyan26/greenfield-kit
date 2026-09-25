#!/usr/bin/env python3
"""Install the greenfield-kit ESLint preset into a project.

    python3 install_eslint.py <project-root> [--as eslint.config.mjs] [--force]

Copies the preset next to the project's package.json and prints the packages it
needs. An existing file is never overwritten without --force.
"""

import argparse
import json
from pathlib import Path
import shutil
import sys

PRESET = Path(__file__).resolve().parent.parent / "assets" / "eslint.config.mjs"

# eslint and @eslint/js must stay on the same major. Letting @eslint/js float
# pulls the next major in, and every import/* rule then fails to resolve.
PACKAGES = {
    "eslint": "^9",
    "@eslint/js": "^9",
    "typescript-eslint": "",
    "eslint-plugin-import": "",
    "eslint-plugin-simple-import-sort": "",
    "eslint-plugin-unused-imports": "",
    "eslint-plugin-react": "",
    "eslint-plugin-react-hooks": "",
    "eslint-plugin-jsx-a11y": "",
    "@stylistic/eslint-plugin": "",
    "eslint-import-resolver-typescript": "",
}


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("project_root", type=Path, help="The folder holding package.json")
    parser.add_argument("--as", dest="name", default="eslint.config.mjs", help="File name to write (default: eslint.config.mjs)")
    parser.add_argument("--force", action="store_true", help="Overwrite an existing config")
    args = parser.parse_args()

    root = args.project_root.expanduser().resolve()
    if not root.is_dir():
        parser.error(f"Not a folder: {root}")

    package_json = root / "package.json"
    if not package_json.is_file():
        parser.error(f"No package.json in {root}. The preset only fits a Node project.")

    target = root / args.name
    if target.exists() and not args.force:
        print(f"{target} already exists. Left it alone.")
        print(f"To keep both, run again with --as eslint.greenfield.mjs and spread it from your config:")
        print('  import greenfield from "./eslint.greenfield.mjs"')
        print("  export default [...greenfield, { rules: { /* yours */ } }]")
        return 1

    shutil.copyfile(PRESET, target)
    print(f"Wrote {target.relative_to(root)}")

    missing = missing_packages(package_json)
    if missing:
        print("\nInstall what it needs:")
        print("  npm i -D " + " ".join(missing))
    else:
        print("\nEvery package it needs is already in package.json.")

    print("\nThen, after each TypeScript edit, on the files you touched:")
    print("  npx eslint --fix <files>")
    print("\nSet SRC in the config if the frontend layers are not under src/.")
    return 0


def missing_packages(package_json: Path) -> list[str]:
    try:
        data = json.loads(package_json.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return [spec(name) for name in PACKAGES]
    installed = set(data.get("dependencies", {})) | set(data.get("devDependencies", {}))
    return [spec(name) for name in PACKAGES if name not in installed]


def spec(name: str) -> str:
    version = PACKAGES[name]
    return f"{name}@{version}" if version else name


if __name__ == "__main__":
    sys.exit(main())
