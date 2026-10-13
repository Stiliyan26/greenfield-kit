#!/usr/bin/env python3
"""Check how the plugin's skills and agents refer to each other.

    python3 tools/check_refs.py

Errors, exit 1: a reference that points at nothing.
  - "the `x` skill", "`x` agent" or "skill `x`" where x is no skill or agent
  - `x` anywhere, where x is a skill or agent that git shows was deleted
    (from history, or from HEAD but not yet committed)
  - a relative Markdown link whose target file does not exist
  - the README table and the plugin's skills and agents disagree
Warnings, exit 0: coupling. A skill names a skill or agent outside
HANDOFFS below. Each warning is an edit to make when that skill is next
touched, or a handoff to add to HANDOFFS on purpose.
"""

import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PLUGIN = ROOT / "plugin"

# Who may name whom. `start` maps stages to skills, so it may name any.
# Every skill may name the hub, `write-code`. Anything else a skill names is
# a coupling warning. This is the one place the skill graph is written down.
HUB = "write-code"
HANDOFFS = {
    "start": {"*"},
    "design-interface": {"shadcn", "design-critic"},
    "deliver-feature": {"design-critic"},
    "plan-feature": {"review"},
    "review": {"interactive-explanation"},
    "write-code": {"shadcn"},
}

# Words that are values in a skill, not references, though a skill shares
# the name: shadcn's `start` template.
VALUES = {"shadcn": {"start"}}

# Skills named in prose that live outside this plugin.
EXTERNAL = {"frontend-design", "skill-creator", "writing-great-skills", "pstack"}

NAME = r"[a-z0-9][a-z0-9-]*"
NAMED_AS_SKILL = re.compile(
    rf"`({NAME})`\s+(?:skill|agent)s?\b|\b(?:skill|agent)\s+`({NAME})`"
)
BACKTICKED = re.compile(rf"`({NAME})`")
LINK = re.compile(r"\]\(([^)\s]+)\)")
INLINE_CODE = re.compile(r"`[^`]*`")
STATUS_VALUE = re.compile(rf"Status(?::| is| to)?\s*`{NAME}`")
FENCE = re.compile(r"^\s*(```|~~~)")
README_ROW = re.compile(rf"^\|\s*`({NAME})`(?:\s+agent)?\s*\|", re.M)


# The flawed sample skill skill-creator-plus audits, dead link on purpose.
SKIP = ("node_modules", "examples")


def markdown_files():
    for path in sorted(PLUGIN.rglob("*.md")):
        if not any(part in SKIP for part in path.parts):
            yield path
    yield ROOT / "README.md"
    yield ROOT / "CLAUDE.md"


def prose_lines(path):
    """Line number and text of each line outside fenced code blocks."""
    fenced = False
    for n, line in enumerate(path.read_text().splitlines(), 1):
        if FENCE.match(line):
            fenced = not fenced
        elif not fenced:
            yield n, line


def git_lines(*args):
    try:
        out = subprocess.run(["git", *args], cwd=ROOT, capture_output=True, text=True, check=True)
    except (OSError, subprocess.CalledProcessError):
        return []
    return out.stdout.split()


def retired_names(known):
    """Skill and agent names git once had that no longer exist."""
    deleted = git_lines(
        "log", "--all", "--no-renames", "--diff-filter=D", "--name-only", "--format=",
        "--", "*skills/*/SKILL.md", "*agents/*.md",
    )
    in_head = git_lines("ls-tree", "-r", "--name-only", "HEAD", "--", "plugin/skills", "plugin/agents")
    names = set()
    for path in deleted + in_head:
        m = re.search(r"skills/([^/]+)/SKILL\.md$|agents/([^/]+)\.md$", path)
        if m:
            names.add(m.group(1) or m.group(2))
    return names - known


def own_files(skill_dir):
    """SKILL.md and references: what loads when the skill runs."""
    yield skill_dir / "SKILL.md"
    yield from sorted((skill_dir / "references").glob("*.md"))


def main():
    skills = {p.parent.name for p in PLUGIN.glob("skills/*/SKILL.md")}
    agents = {p.stem for p in PLUGIN.glob("agents/*.md")}
    known = skills | agents
    retired = retired_names(known)
    errors, warnings = [], []

    for path in markdown_files():
        rel = path.relative_to(ROOT)
        for n, line in prose_lines(path):
            for m in NAMED_AS_SKILL.finditer(line):
                name = m.group(1) or m.group(2)
                if name not in known and name not in EXTERNAL:
                    errors.append(f"{rel}:{n}  `{name}` is named as a skill or agent but none exists")
            for name in BACKTICKED.findall(line):
                if name in retired:
                    errors.append(f"{rel}:{n}  `{name}` was a skill or agent and is gone")
            for m in LINK.finditer(INLINE_CODE.sub("", line)):
                target = m.group(1).split("#")[0]
                if not target or re.match(r"[a-z]+:", target) or target.startswith("/"):
                    continue
                if "<" not in target and not (path.parent / target).exists():
                    errors.append(f"{rel}:{n}  link to {target} points at no file")

    readme = set(README_ROW.findall((ROOT / "README.md").read_text()))
    for name in sorted(known - readme):
        errors.append(f"README.md  `{name}` has no row in the skill table")
    for name in sorted(readme - known):
        errors.append(f"README.md  row `{name}` matches no skill or agent")

    for skill in sorted(skills):
        allowed = HANDOFFS.get(skill, set())
        if "*" in allowed:
            continue
        allowed = allowed | {HUB, skill} | VALUES.get(skill, set())
        for path in own_files(PLUGIN / "skills" / skill):
            rel = path.relative_to(ROOT)
            for n, line in prose_lines(path):
                for name in BACKTICKED.findall(STATUS_VALUE.sub("", line)):
                    if name in known and name not in allowed:
                        warnings.append(f"{rel}:{n}  names `{name}`")

    for line in errors:
        print(f"ERROR  {line}")
    for line in warnings:
        print(f"WARN   {line}")
    print(f"{len(errors)} errors, {len(warnings)} coupling warnings")
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
