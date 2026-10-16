#!/usr/bin/env python3
"""Check how the skills and agents of one library refer to each other.

    python3 check_refs.py <root> [--handoffs FILE] [--readme FILE] [--also FILE ...]

<root> holds `skills/<name>/SKILL.md` and, optionally, `agents/<name>.md`.
Works on any library: a plugin folder, `~/.claude`, a project's `.claude`.

Errors, exit 1: a reference that points at nothing.
  - "the `x` skill", "`x` agent" or "skill `x`" where x is no skill or agent
  - "the x skill" where x is a skill or agent that git shows was deleted or
    renamed (in history, or in HEAD but not on disk); skipped outside git.
    A bare `x` is not checked: old names are often plain words or values.
  - a relative Markdown link whose target file does not exist
  - with --readme: the README table and the skills and agents disagree
Warnings, exit 0: coupling. A skill names a skill or agent it does not hand
off to. Each warning is a relation to maintain: remove the name, or add the
handoff to the --handoffs file on purpose. SKILL.md and every Markdown file
under references/ are checked.
Exit 2: the check could not run (a missing or unreadable file, bad JSON).

--handoffs FILE is JSON. Every key is optional:
  { "hub": "coding-rules",                  a skill every skill may name
    "handoffs": { "run-pipeline": ["*"], "plan-orders": ["review-code"] },
    "values": { "format-invoices": ["draft"] },  words that are values, not names
    "external": ["skill-creator"],          skills named that live elsewhere
    "stack": { "words": ["django", "celery"],  words of one tech stack
               "allowed": ["skills/coding-rules/stacks"] } }  folders that may use them
Without it, no skill may name another: every cross-name is a warning.
With "stack", a stack word in prose outside an allowed folder is a warning:
the skill should say the role (the check command, the server folder) or
read the project's stack file.
"""

import argparse
import json
import re
import subprocess
import sys
from pathlib import Path

NAME = r"[a-z0-9][a-z0-9-]*"
NAMED_AS_SKILL = re.compile(
    rf"`({NAME})`\s+(?:skill|agent)s?\b|\b(?:skill|agent)\s+`({NAME})`"
)
BACKTICKED = re.compile(rf"`({NAME})`")
# A skill named in plain words: "the verify skill".
PLAIN_SKILL = re.compile(rf"\b({NAME})\s+skill\b")
LINK = re.compile(r"\]\(([^)\s]+)\)")
INLINE_CODE = re.compile(r"`[^`]*`")
# Status values such as "Status `review`" are workflow states that can share
# a name with a skill; they are not references to it.
STATUS_VALUE = re.compile(rf"Status(?::| is| to)?\s*`{NAME}`")
FENCE = re.compile(r"^\s*(```|~~~)")
README_ROW = re.compile(rf"^\|\s*`({NAME})`(?:\s+agent)?\s*\|", re.M)
SKILL_PATH = re.compile(r"skills/([^/]+)/SKILL\.md$|agents/([^/]+)\.md$")

# Folders never scanned: installed packages, sample skills with dead links
# on purpose, and skills synced from claude.ai.
SKIP = ("node_modules", "examples", ".git", "synced", ".trash")


class InputError(Exception):
    """A file given on the command line is missing, unreadable or not valid JSON."""


def read_file(path, what):
    try:
        return Path(path).read_text(errors="replace")
    except OSError as err:
        raise InputError(f"cannot read the {what} {path}: {err.strerror or err}. Check the path.")


def prose_lines(path, what="file"):
    """Line number and text of each line outside fenced code blocks."""
    fenced = False
    for n, line in enumerate(read_file(path, what).splitlines(), 1):
        if FENCE.match(line):
            fenced = not fenced
        elif not fenced:
            yield n, line


def git_text(root, *args):
    try:
        out = subprocess.run(["git", *args], cwd=root, capture_output=True, text=True, check=True)
    except (OSError, subprocess.CalledProcessError):
        return ""
    return out.stdout


def skill_name(path):
    m = SKILL_PATH.search(path)
    return (m.group(1) or m.group(2)) if m else None


def retired_names(root, known):
    """Skill and agent names git once had that are gone now, mapped to the new
    name when git saw a rename, else to None."""
    spec = ("--", "*skills/*/SKILL.md", "*agents/*.md")
    gone = {}
    deleted = git_text(root, "log", "--all", "--no-renames", "--diff-filter=D", "--name-only", "--format=", *spec)
    in_head = git_text(root, "ls-tree", "-r", "--name-only", "HEAD", "--", "skills", "agents")
    for path in (deleted + "\n" + in_head).split():
        name = skill_name(path)
        if name and name not in known:
            gone.setdefault(name, None)
    renames = git_text(root, "log", "--all", "-M", "--diff-filter=R", "--name-status", "--format=", *spec)
    renames += git_text(root, "diff", "-M", "--name-status", "HEAD", *spec)
    for row in renames.splitlines():
        parts = row.split("\t")
        if len(parts) == 3 and parts[0].startswith("R"):
            old, new = skill_name(parts[1]), skill_name(parts[2])
            if old in gone and new in known:
                gone[old] = new
    return gone


def own_files(skill_dir):
    """SKILL.md and every Markdown file under references/: what loads when the skill runs."""
    yield skill_dir / "SKILL.md"
    yield from sorted(p for p in (skill_dir / "references").rglob("*.md")
                      if not any(part in SKIP for part in p.parts))


def load_config(path):
    if not path:
        config = {}
    else:
        try:
            config = json.loads(read_file(path, "handoffs file"))
        except json.JSONDecodeError as err:
            raise InputError(f"the handoffs file {path} is not valid JSON: {err.msg} at line {err.lineno}.")
        if not isinstance(config, dict):
            raise InputError(f"the handoffs file {path} must hold a JSON object; see --help for the keys.")
    return {
        "hub": config.get("hub"),
        "handoffs": {k: set(v) for k, v in config.get("handoffs", {}).items()},
        "values": {k: set(v) for k, v in config.get("values", {}).items()},
        "external": set(config.get("external", [])),
        "stack_words": [w.lower() for w in config.get("stack", {}).get("words", [])],
        "stack_allowed": tuple(config.get("stack", {}).get("allowed", [])),
    }


def gone_text(name, retired):
    new = retired.get(name)
    return f"was renamed to `{new}`" if new else "was a skill or agent and is gone"


def check(args):
    root = Path(args.root).resolve()
    if not root.is_dir():
        raise InputError(f"the root {args.root} is not a folder. Give the folder that holds skills/.")
    for path, what in [(f, "--also file") for f in args.also] + [(args.readme, "README")]:
        if path and not Path(path).is_file():
            raise InputError(f"the {what} {path} does not exist. Check the path.")
    config = load_config(args.handoffs)
    skills = {p.parent.name for p in root.glob("skills/*/SKILL.md")}
    agents = {p.stem for p in root.glob("agents/*.md")}
    known = skills | agents
    if not known:
        raise InputError(f"no skills/*/SKILL.md or agents/*.md under {root}.")
    retired = retired_names(root, known)
    errors, warnings = [], []

    files = [
        p for folder in ("skills", "agents") for p in sorted((root / folder).rglob("*.md"))
        if not any(part in SKIP for part in p.parts)
    ]
    files += [Path(f).resolve() for f in args.also]
    if args.readme:
        files.append(Path(args.readme).resolve())
    for path in files:
        rel = path.relative_to(root) if root in path.parents else path
        for n, line in prose_lines(path):
            for m in NAMED_AS_SKILL.finditer(line):
                name = m.group(1) or m.group(2)
                if name in retired:
                    errors.append(f"{rel}:{n}  `{name}` {gone_text(name, retired)}")
                elif name not in known and name not in config["external"]:
                    errors.append(f"{rel}:{n}  `{name}` is named as a skill or agent but none exists")
            for name in PLAIN_SKILL.findall(INLINE_CODE.sub("", line)):
                if name in retired:
                    errors.append(f"{rel}:{n}  `{name}` {gone_text(name, retired)}")
            for m in LINK.finditer(INLINE_CODE.sub("", line)):
                target = m.group(1).split("#")[0]
                if not target or re.match(r"[a-z]+:", target) or target.startswith("/"):
                    continue
                if "<" not in target and not (path.parent / target).exists():
                    errors.append(f"{rel}:{n}  link to {target} points at no file")

    if args.readme:
        readme = set(README_ROW.findall(read_file(args.readme, "README")))
        for name in sorted(known - readme):
            errors.append(f"{args.readme}  `{name}` has no row in the skill table")
        for name in sorted(readme - known):
            errors.append(f"{args.readme}  row `{name}` matches no skill or agent")

    for skill in sorted(skills):
        allowed = config["handoffs"].get(skill, set())
        if "*" in allowed:
            continue
        allowed = allowed | {skill} | config["values"].get(skill, set())
        if config["hub"]:
            allowed.add(config["hub"])
        for path in own_files(root / "skills" / skill):
            rel = path.relative_to(root)
            for n, line in prose_lines(path):
                clean = STATUS_VALUE.sub("", line)
                for name in BACKTICKED.findall(clean) + PLAIN_SKILL.findall(clean):
                    if name in known and name not in allowed:
                        warnings.append(f"{rel}:{n}  names `{name}`")

    if config["stack_words"]:
        pattern = re.compile(r"(?<![a-z0-9/-])(" + "|".join(re.escape(w) for w in config["stack_words"]) + r")(?![a-z0-9-])", re.I)
        for path in files:
            if root not in path.parents:
                continue  # --also and --readme files describe the stack on purpose
            rel = path.relative_to(root)
            if str(rel).startswith(config["stack_allowed"]):
                continue
            hits = {}
            for n, line in prose_lines(path):
                for word in pattern.findall(line):
                    hits.setdefault(word.lower(), n)
            if hits:
                words = ", ".join(f"{w} (line {n})" for w, n in sorted(hits.items(), key=lambda kv: kv[1]))
                warnings.append(f"{rel}  stack words: {words}")

    for line in errors:
        print(f"ERROR  {line}")
    for line in sorted(set(warnings), key=warnings.index):
        print(f"WARN   {line}")
    print(f"{len(errors)} errors, {len(set(warnings))} coupling warnings")
    return 1 if errors else 0


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("root", help="folder with skills/ and, optionally, agents/")
    ap.add_argument("--handoffs", help="JSON: who may name whom")
    ap.add_argument("--readme", help="README with a `name` table to check against the library")
    ap.add_argument("--also", nargs="*", default=[], help="more Markdown files to check for dead references")
    args = ap.parse_args()
    try:
        return check(args)
    except InputError as err:
        print(f"Could not run: {err}")
        return 2


if __name__ == "__main__":
    sys.exit(main())
