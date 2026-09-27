#!/usr/bin/env python3
"""Check the variants in a studio folder, the way the studio page and Approve will.

    python3 check_variant.py <studio folder> [--variant <id>]

Lists problems in project.json and variant.json (including a missing components
list or dark look), screens without a file, and the
contrast and hue checks that fail on each variant's own look. Font coverage of the
product's scripts is checked in the studio page, which can ask Google Fonts.
Exits 1 when anything fails.
"""

import argparse
import json
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "assets" / "studio-engine"))
import studio_export  # noqa: E402


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("studio", type=Path, help="The project's studio/ folder")
    parser.add_argument("--variant", help="Check only this variant id")
    args = parser.parse_args()

    content = args.studio.resolve()
    project = json.loads((content / "project.json").read_text(encoding="utf-8"))
    variants, load_problems = studio_export.load_variants(content)
    project.update(variants=variants, _loadProblems=load_problems)
    problems = studio_export.validate_project(project, content)
    if args.variant:
        if args.variant not in {item["id"] for item in variants}:
            parser.error(f"No candidates/{args.variant}/variant.json in {content}")
        problems = [item for item in problems if f"'{args.variant}'" in item or "project.json" in item or "status." in item]
        variants = [item for item in variants if item["id"] == args.variant]

    failed = list(problems)
    screen_ids = [screen["id"] for screen in project.get("screens", [])]
    for variant in variants:
        if variant.get("components") is None:
            failed += studio_export.component_problems(variant, screen_ids)
        failed += [item for item in studio_export.dark_problems(project, variant, required=True) if "has no dark look" in item]
        try:
            tokens = studio_export.effective_tokens(project, variant["world"], {})
        except (KeyError, ValueError) as error:
            failed.append(f"Variant '{variant['id']}' look can't be built: {error}")
            continue
        looks = [("", tokens)]
        if variant["world"].get("dark") and "dark" in studio_export.themes(project):
            looks.append((" (dark)", studio_export.effective_tokens(project, variant["world"], {}, "dark")))
        for suffix, look in looks:
            for check in studio_export.run_checks(look):
                if not check["pass"]:
                    detail = f" ({check['ratio']}:1, needs {check['minimum']}:1)" if check["kind"] == "contrast" else ""
                    failed.append(f"Variant '{variant['id']}'{suffix}: {check['label']}{detail}")

    for line in failed:
        print(f"✗ {line}")
    names = ", ".join(item["id"] for item in variants) or "none"
    print(f"{len(failed)} problems in {len(variants)} variant{'s' if len(variants) != 1 else ''} ({names}).")
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
