#!/usr/bin/env python3
"""Fail on colors and fonts written outside the design tokens.

    python3 check_tokens.py [--tokens design/tokens.css | --project studio/project.json] PATH...

PATH can be files or folders. It flags raw hex, rgb(), hsl(), oklch() and similar
values, common named colors, and font-family or font values that name a font
instead of var(--font-…). With --tokens or --project it also flags var(--…)
names that the tokens do not define. Add the comment `tokens-ignore` on a line
to skip it, and say why next to it.
"""

import argparse
import json
from pathlib import Path
import re
import sys

EXTENSIONS = {".css", ".scss", ".html", ".js", ".jsx", ".mjs", ".ts", ".tsx", ".vue", ".svelte", ".astro"}
SKIP_DIRS = {"node_modules", "dist", "build", ".git", ".next", "coverage", "__pycache__"}
KEYWORDS = {"inherit", "initial", "unset", "revert", "revert-layer"}

HEX = re.compile(r"(?<![\w&/-])#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})(?![\w-])")
URL_BEFORE = re.compile(r"""(?:href|src|xlink:href|action|to)\s*=\s*["']?$|url\(\s*["']?$""")
COLOR_FUNCTION = re.compile(r"(?<![\w-])(rgba?|hsla?|hwb|lab|lch|oklab|oklch)\(")
NAMED = re.compile(
    r"(?:(?<![\w-])(?:color|background|background-color|border|border-(?:top|right|bottom|left)|border(?:-[a-z]+)?-color|outline|outline-color|fill|stroke|box-shadow|text-shadow|caret-color|accent-color)"
    r"|(?<![\w])(?:backgroundColor|borderColor|textColor))\s*:\s*[\"'`]?([^;{}\"'`\n]*)"
)
NAMED_COLORS = re.compile(r"(?<![\w-])(white|black|red|green|blue|gray|grey|orange|yellow|purple|pink|brown|navy|teal|silver|gold)(?![\w-])", re.I)
FONT_FAMILY = re.compile(r"(?:(?<![\w-])font-family|(?<![\w])fontFamily)\s*:\s*(?:([\"'`])(.*?)\1|([^;{}\n]+))")
FONT_SHORTHAND = re.compile(r"(?<![\w-])font\s*:\s*([^;{}\n]+)")
VAR = re.compile(r"var\(\s*--((?:color|font|radius|status|space|shadow)-[a-z0-9-]+)")
DEFINED = re.compile(r"--([a-z0-9-]+)\s*:")
# The studio sets these for every world: from a palette, or derived from the core tokens.
PALETTE_TOKENS = {
    "color-secondary", "color-on-secondary", "color-tertiary", "color-on-tertiary",
    "color-primary-soft", "color-secondary-soft", "color-tertiary-soft", "color-surface-2",
}


def strip_comments(text):
    """Blank out /* */ and <!-- --> comments but keep line numbers."""
    def blank(match):
        return re.sub(r"[^\n]", " ", match.group(0))
    return re.sub(r"<!--.*?-->", blank, re.sub(r"/\*.*?\*/", blank, text, flags=re.S), flags=re.S)


def only_tokens(value):
    value = value.strip().rstrip("\"'`,").strip()
    if value in KEYWORDS:
        return True
    parts = [part.strip() for part in value.split(",")]
    return all(re.fullmatch(r"var\(--font-[a-z0-9-]+(?:,\s*[^)]*)?\)", part) or part in KEYWORDS for part in parts if part)


def check_file(path, defined):
    findings = []
    lines = strip_comments(path.read_text(encoding="utf-8", errors="replace")).split("\n")
    for number, line in enumerate(lines, 1):
        if "tokens-ignore" in line:
            continue
        for match in HEX.finditer(line):
            if not URL_BEFORE.search(line[:match.start()]):
                findings.append((number, "raw-color", match.group(0)))
        for match in COLOR_FUNCTION.finditer(line):
            findings.append((number, "raw-color", f"{match.group(1)}(…)"))
        for match in NAMED.finditer(line):
            for color in NAMED_COLORS.finditer(match.group(1)):
                findings.append((number, "named-color", color.group(1)))
        for match in FONT_FAMILY.finditer(line):
            value = match.group(2) if match.group(1) else match.group(3)
            if not only_tokens(value):
                findings.append((number, "raw-font", value.strip()[:60]))
        for match in FONT_SHORTHAND.finditer(line):
            value = match.group(1).strip()
            if value not in KEYWORDS and "var(--font-" not in value:
                findings.append((number, "raw-font", f"font: {value[:60]}"))
        if defined is not None:
            for match in VAR.finditer(line):
                if match.group(1) not in defined:
                    findings.append((number, "unknown-token", f"--{match.group(1)}"))
    return findings


def defined_names(args):
    if args.tokens:
        return set(DEFINED.findall(Path(args.tokens).read_text(encoding="utf-8")))
    if args.project:
        project = json.loads(Path(args.project).read_text(encoding="utf-8"))
        names = {"font-display", "font-body"} | {f"status-{name}" for name in project.get("status", {})} | PALETTE_TOKENS
        # Each model's look lives in studio/candidates/<variant>/variant.json.
        for variant in sorted(Path(args.project).parent.glob("candidates/*/variant.json")):
            names |= set(json.loads(variant.read_text(encoding="utf-8")).get("world", {}).get("tokens", {}))
        return names
    return None


def files(paths, skip):
    for path in paths:
        if path.is_dir():
            for child in sorted(path.rglob("*")):
                if child.suffix in EXTENSIONS and child.is_file() and not SKIP_DIRS & set(child.parts) and child.resolve() != skip:
                    yield child
        elif path.suffix in EXTENSIONS and path.resolve() != skip:
            yield path


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    source = parser.add_mutually_exclusive_group()
    source.add_argument("--tokens", help="tokens.css that defines the allowed var(--…) names")
    source.add_argument("--project", help="studio/project.json; the variants in studio/candidates/*/variant.json define the allowed names")
    parser.add_argument("paths", nargs="+", type=Path)
    args = parser.parse_args()
    defined = defined_names(args)
    skip = Path(args.tokens).resolve() if args.tokens else None
    total = 0
    checked = 0
    for path in files(args.paths, skip):
        checked += 1
        for number, rule, detail in check_file(path, defined):
            total += 1
            print(f"{path}:{number}: {rule}: {detail}")
    if not checked:
        print("No files to check.", file=sys.stderr)
        return 2
    print(f"{total} problem{'s' if total != 1 else ''} in {checked} file{'s' if checked != 1 else ''}.")
    return 1 if total else 0


if __name__ == "__main__":
    sys.exit(main())
