#!/usr/bin/env python3
"""Install `bun run check` into a project.

    python3 install_checks.py <project-root> [--force]

Copies .oxlintrc.json, eslint.config.mjs and knip.json next to the project's
package.json, adds the `check` and `check:fix` scripts, and prints the
`bun add -d` line for the packages that are missing. An existing file is never
overwritten without --force.
"""

import argparse
import json
from pathlib import Path
import shutil
import sys

ASSETS = Path(__file__).resolve().parent.parent / "assets"

FILES = {
    "oxlintrc.json": ".oxlintrc.json",
    "eslint.config.mjs": "eslint.config.mjs",
    "knip.json": "knip.json",
}

SCRIPTS = {
    "check": "oxlint -c .oxlintrc.json && oxfmt --check && tsc --noEmit && eslint . && knip",
    "check:fix": "oxlint -c .oxlintrc.json --fix && oxfmt && tsc --noEmit && eslint . --fix && knip",
}

# eslint and @eslint/js must stay on the same major. Letting @eslint/js float
# pulls the next major in, and every import/* rule then fails to resolve.
PACKAGES = {
    "oxlint": "",
    "oxfmt": "",
    "knip": "",
    "typescript": "",
    "eslint": "^9",
    "@eslint/js": "^9",
    "typescript-eslint": "",
    "eslint-plugin-import": "",
    "eslint-plugin-simple-import-sort": "",
    "@stylistic/eslint-plugin": "",
    "eslint-import-resolver-typescript": "",
}


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("project_root", type=Path, help="The folder holding package.json")
    parser.add_argument("--force", action="store_true", help="Overwrite existing config files")
    args = parser.parse_args()

    root = args.project_root.expanduser().resolve()
    package_json = root / "package.json"

    if not package_json.is_file():
        parser.error(f"No package.json in {root}. The checks only fit a Bun or Node project.")

    kept = []

    for source, name in FILES.items():
        target = root / name

        if target.exists() and not args.force:
            kept.append(name)
            continue

        shutil.copyfile(ASSETS / source, target)
        print(f"Wrote {name}")

    for name in kept:
        print(f"{name} already exists. Left it alone (use --force to replace it).")

    if "eslint.config.mjs" in kept:
        print("  To keep both, copy assets/eslint.config.mjs as eslint.greenfield.mjs and spread it from yours:")
        print('    import greenfield from "./eslint.greenfield.mjs"')
        print("    export default [...greenfield, { rules: { /* yours */ } }]")

    data = json.loads(package_json.read_text(encoding="utf-8"))
    scripts = data.setdefault("scripts", {})
    added = [name for name in SCRIPTS if name not in scripts]

    for name in added:
        scripts[name] = SCRIPTS[name]

    if added:
        package_json.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")
        print("Added scripts: " + ", ".join(added))

    missing = missing_packages(data)

    if missing:
        print("\nInstall what it needs:")
        print("  bun add -d " + " ".join(missing))
    else:
        print("\nEvery package it needs is already in package.json.")

    print("\nThen, after every edit:")
    print("  bun run check:fix")
    print("\nSet SRC in eslint.config.mjs and the paths in .oxlintrc.json if the layers are not under src/.")

    return 0


def missing_packages(data: dict) -> list[str]:
    installed = set(data.get("dependencies", {})) | set(data.get("devDependencies", {}))

    return [spec(name) for name in PACKAGES if name not in installed]


def spec(name: str) -> str:
    version = PACKAGES[name]

    return f"{name}@{version}" if version else name


if __name__ == "__main__":
    sys.exit(main())
