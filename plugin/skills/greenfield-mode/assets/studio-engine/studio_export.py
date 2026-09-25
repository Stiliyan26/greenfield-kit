"""Check a world's tokens and write DESIGN.md and design/tokens.css on approval.

DESIGN.md follows https://raw.githubusercontent.com/google-labs-code/design.md/main/docs/spec.md
"""

from datetime import datetime, timezone
import json

import studio_color

MARKER = "<!-- Written by the design studio on approval. Edit the studio, not this file. -->"
CSS_MARKER = "/* Written by the design studio on approval. Edit the studio, not this file. */"

REQUIRED_TOKENS = (
    "color-bg", "color-surface", "color-ink", "color-muted", "color-line",
    "color-primary", "color-on-primary", "color-accent", "radius-sm", "radius-md",
)
STATUS_NAMES = ("danger", "warning", "ok")
# Tokens a palette sets. A world without them gets them derived from its core tokens.
EXTENDED_TOKENS = (
    "color-secondary", "color-on-secondary", "color-tertiary", "color-on-tertiary",
    "color-primary-soft", "color-secondary-soft", "color-tertiary-soft", "color-surface-2",
)
PALETTE_ROLES = ("primary", "secondary", "tertiary", "neutral")
# One variant per model that designed the product. More than three is too many to compare.
MAX_VARIANTS = 3
# Every screen is shown at these three sizes: a Full HD monitor, a laptop and a phone.
SIZES = (
    {"id": "desktop", "label": "Desktop", "width": 1920, "height": 1080},
    {"id": "laptop", "label": "Laptop", "width": 1440, "height": 900},
    {"id": "phone", "label": "Phone", "width": 390, "height": 844},
)

# (foreground, background, minimum ratio, what the pair is used for)
CONTRAST_PAIRS = (
    ("color-ink", "color-bg", 4.5, "Body text on the page"),
    ("color-ink", "color-surface", 4.5, "Body text on surfaces"),
    ("color-muted", "color-surface", 4.5, "Secondary text on surfaces"),
    ("color-muted", "color-bg", 4.5, "Secondary text on the page"),
    ("color-on-primary", "color-primary", 4.5, "Text on primary buttons"),
    ("color-primary", "color-bg", 3.0, "Primary controls against the page"),
    ("color-accent", "color-surface", 3.0, "Accent marks against surfaces"),
    ("color-on-secondary", "color-secondary", 4.5, "Text on secondary fills"),
    ("color-on-tertiary", "color-tertiary", 4.5, "Text on tertiary fills"),
    ("color-secondary", "color-bg", 3.0, "Secondary marks against the page"),
    ("status-danger", "color-surface", 4.5, "Danger text on surfaces"),
    ("status-warning", "color-surface", 4.5, "Warning text on surfaces"),
    ("status-ok", "color-surface", 4.5, "OK text on surfaces"),
)
HUE_GUARD_DEGREES = 30
HUE_GUARD_CHROMA = 0.06
# Warning gets a narrower guard: a colored role this close reads as a warning.
WARNING_GUARD_DEGREES = 20
WARNING_GUARD_CHROMA = 0.08

DEFAULT_TYPE = {
    "display": {"font": "display", "fontSize": "32px", "fontWeight": 700, "lineHeight": 1.1},
    "heading": {"font": "display", "fontSize": "20px", "fontWeight": 650, "lineHeight": 1.25},
    "body": {"font": "body", "fontSize": "15px", "fontWeight": 400, "lineHeight": 1.5},
    "label": {"font": "body", "fontSize": "12.5px", "fontWeight": 600, "lineHeight": 1.3},
}


def effective_tokens(project, world, tuning):
    """Tokens a candidate sees: world tokens, the user's tuning, derived extras, locked status colors."""
    tokens = dict(world.get("tokens", {}))
    tokens.update(tuning.get(world["id"], {}))
    derive_extended(tokens)
    for name in STATUS_NAMES:
        tokens[f"status-{name}"] = project["status"][name]
    return tokens


def derive_extended(tokens):
    """Fill the palette tokens a world doesn't set, from its core tokens. The web twin is checks.js."""
    mix = studio_color.mix
    tokens.setdefault("color-secondary", tokens["color-primary"])
    tokens.setdefault("color-tertiary", tokens["color-accent"])
    tokens.setdefault("color-on-secondary", studio_color.on_color(tokens["color-secondary"]))
    tokens.setdefault("color-on-tertiary", studio_color.on_color(tokens["color-tertiary"]))
    tokens.setdefault("color-primary-soft", mix(tokens["color-primary"], tokens["color-surface"], 0.14))
    tokens.setdefault("color-secondary-soft", mix(tokens["color-secondary"], tokens["color-surface"], 0.14))
    tokens.setdefault("color-tertiary-soft", mix(tokens["color-tertiary"], tokens["color-surface"], 0.16))
    tokens.setdefault("color-surface-2", mix(tokens["color-ink"], tokens["color-surface"], 0.05))
    return tokens


def palette_tokens(seeds):
    """Map four palette seeds to color tokens. The web twin is paletteTokens in color.js."""
    tone, on = studio_color.tone, studio_color.on_color
    lightness, chroma, hue = studio_color.parse(seeds["neutral"])
    neutral = (0, min(chroma, 0.035), hue)

    def grey(level):
        return studio_color.fmt(studio_color.fit((level, neutral[1], neutral[2])))
    tokens = {
        "color-bg": grey(0.965), "color-surface": grey(0.992), "color-surface-2": grey(0.935),
        "color-line": grey(0.87), "color-muted": grey(0.47), "color-ink": grey(0.21),
    }
    for role in ("primary", "secondary", "tertiary"):
        value = studio_color.role_color(seeds[role], tokens["color-surface"])
        tokens[f"color-{role}"] = value
        tokens[f"color-on-{role}"] = on(value)
        tokens[f"color-{role}-soft"] = tone(value, 0.93)
    tokens["color-accent"] = tokens["color-tertiary"]
    return tokens


def run_checks(tokens):
    """Return a list of check results. A result with pass False blocks approval."""
    results = []
    for foreground, background, minimum, use in CONTRAST_PAIRS:
        if foreground not in tokens or background not in tokens:
            continue
        ratio = studio_color.contrast(tokens[foreground], tokens[background])
        results.append({
            "id": f"{foreground}/{background}", "kind": "contrast", "label": use,
            "ratio": round(ratio, 2), "minimum": minimum, "pass": ratio >= minimum - 0.005,
        })
    danger = studio_color.parse(tokens["status-danger"])
    for name in ("color-primary", "color-secondary", "color-accent"):
        if name not in tokens:
            continue
        lightness, chroma, hue = studio_color.parse(tokens[name])
        distance = studio_color.hue_distance(hue, danger[2])
        clash = chroma >= HUE_GUARD_CHROMA and distance < HUE_GUARD_DEGREES
        results.append({
            "id": f"{name}/hue", "kind": "hue", "label": f"{name} stays clear of the danger red",
            "distance": round(distance), "pass": not clash,
        })
    warning = studio_color.parse(tokens["status-warning"])
    for name in ("color-primary", "color-secondary", "color-accent"):
        if name not in tokens:
            continue
        _, chroma, hue = studio_color.parse(tokens[name])
        distance = studio_color.hue_distance(hue, warning[2])
        clash = chroma >= WARNING_GUARD_CHROMA and warning[1] >= WARNING_GUARD_CHROMA and distance < WARNING_GUARD_DEGREES
        results.append({
            "id": f"{name}/warning", "kind": "hue", "label": f"{name} stays clear of the warning amber",
            "distance": round(distance), "pass": not clash,
        })
    for name, value in tokens.items():
        if name.startswith(("color-", "status-")) and not studio_color.in_gamut(studio_color.parse(value)):
            results.append({"id": f"{name}/gamut", "kind": "gamut", "label": f"{name} is outside sRGB and will be clipped", "pass": True, "warning": True})
    return results


def load_variants(content):
    """Read every studio/candidates/<id>/variant.json: one per model that designed the product.

    A variant's world (its look) takes the variant's id, so tuning and palettes key on it.
    Returns (variants, problems).
    """
    variants, problems = [], []
    folder = content / "candidates"
    for path in sorted(folder.glob("*/variant.json")) if folder.is_dir() else []:
        variant_id = path.parent.name
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
        except (OSError, ValueError) as error:
            problems.append(f"candidates/{variant_id}/variant.json can't be read: {error}")
            continue
        if not isinstance(data, dict) or not isinstance(data.get("world", {}), dict):
            problems.append(f"candidates/{variant_id}/variant.json must be an object with a world object")
            continue
        world = {**data.get("world", {}), "id": variant_id}
        world.setdefault("name", data.get("model") or variant_id)
        variants.append({"id": variant_id, "model": str(data.get("model", "")), "summary": str(data.get("summary", "")),
                         "order": data.get("order", 0), "world": world})
    variants.sort(key=lambda item: (item["order"] if isinstance(item["order"], (int, float)) else 0, item["id"]))
    return variants, problems


def preview_path(variant_id, screen_id):
    """Every variant keeps one file per screen in its own folder."""
    return f"/candidates/{variant_id}/{screen_id}.html"


def validate_project(project, content=None):
    """Return a list of problems in project.json and the variant folders that the agent must fix.

    With the studio folder as `content`, also check that every screen file exists.
    """
    try:
        return find_problems(project, content)
    except (AttributeError, KeyError, TypeError) as error:
        return [f"project.json has the wrong shape: {type(error).__name__} {error}"]


def find_problems(project, content=None):
    problems = list(project.get("_loadProblems", []))
    for key in ("name", "screens", "status"):
        if key not in project:
            problems.append(f"project.json is missing '{key}'")
    if len(problems) > len(project.get("_loadProblems", [])):
        return problems
    if not project["screens"]:
        problems.append("Add one screen to project.json for every view the brief names")
    variants = project.get("variants", [])
    if not variants:
        problems.append("Add one variant per model: studio/candidates/<id>/variant.json and one <screen>.html per screen")
    if len(variants) > MAX_VARIANTS:
        problems.append(f"Show at most {MAX_VARIANTS} variants, one per model; there are {len(variants)}")
    for name in STATUS_NAMES:
        try:
            studio_color.parse(project["status"].get(name, ""))
        except ValueError as error:
            problems.append(f"status.{name}: {error}")
    screen_ids = [screen["id"] for screen in project["screens"]]
    repeated = sorted({screen for screen in screen_ids if screen_ids.count(screen) > 1})
    if repeated:
        problems.append(f"Screen ids must be unique: {', '.join(repeated)}")
    if content is not None:
        for variant_id, absent in missing_previews(project, content).items():
            problems.append(f"Variant '{variant_id}' has no file yet for: {', '.join(absent)}")
    for variant in variants:
        if not variant["model"]:
            problems.append(f"Variant '{variant['id']}' must name the model that built it in variant.json")
        world = variant["world"]
        tokens = world.get("tokens", {})
        for name in REQUIRED_TOKENS:
            if name not in tokens:
                problems.append(f"Variant '{variant['id']}' world is missing token {name}")
        for name, value in tokens.items():
            if name.startswith("color-"):
                try:
                    studio_color.parse(value)
                except ValueError as error:
                    problems.append(f"Variant '{variant['id']}' {name}: {error}")
        fonts = world.get("fonts", {})
        if not fonts.get("display") or not fonts.get("body"):
            problems.append(f"Variant '{variant['id']}' world needs fonts.display and fonts.body")
    return problems


def missing_previews(project, content):
    """Screens whose file isn't in a variant's folder yet, per variant id."""
    missing = {}
    for variant in project.get("variants", []):
        absent = [screen["id"] for screen in project["screens"]
                  if not (content / preview_path(variant["id"], screen["id"]).lstrip("/")).is_file()]
        if absent:
            missing[variant["id"]] = absent
    return missing


def family_name(stack):
    return str(stack).split(",")[0].strip().strip("\"'")


def font_stack(value):
    return value if "," in value else f"{value}, system-ui, sans-serif"


def tokens_css(project, world, tokens, revision, stamp, palette=None):
    fonts = world["fonts"]
    lines = [CSS_MARKER, f"/* {project['name']} · world {world['name']} · revision {revision} · {stamp} */"]
    if fonts.get("google"):
        lines.append(f'@import url("https://fonts.googleapis.com/css2?{fonts["google"]}&display=swap");')
    lines.append(":root {")
    for name, value in tokens.items():
        lines.append(f"  --{name}: {value};")
    lines.append(f"  --font-display: {font_stack(fonts['display'])};")
    lines.append(f"  --font-body: {font_stack(fonts['body'])};")
    if palette:
        lines.append(f"  /* Tonal scales of the {palette.get('name', 'chosen')} palette */")
        for role in PALETTE_ROLES:
            for step, value in studio_color.tonal_scale(palette["seeds"][role]).items():
                lines.append(f"  --{role}-{step}: {value};")
    lines.append("}")
    return "\n".join(lines) + "\n"


def design_md(project, variant, world, tokens, checks, font_checks, revision, stamp, palette=None):
    fonts = world["fonts"]
    type_scale = {**DEFAULT_TYPE, **world.get("type", {})}
    colors = {name.removeprefix("color-"): studio_color.to_hex(value) for name, value in tokens.items() if name.startswith("color-")}
    colors.update({name: studio_color.to_hex(value) for name, value in tokens.items() if name.startswith("status-")})
    rounded = {name.removeprefix("radius-"): value for name, value in tokens.items() if name.startswith("radius-")}
    spacing = {name.removeprefix("space-"): value for name, value in tokens.items() if name.startswith("space-")}
    typography = {}
    for role, spec in type_scale.items():
        entry = {"fontFamily": font_stack(fonts[spec.get("font", "body")])}
        entry.update({key: value for key, value in spec.items() if key != "font"})
        typography[role] = entry
    front = {
        "name": project["name"],
        "description": world.get("summary", ""),
        "colors": colors,
        "typography": typography,
        "rounded": rounded,
        "components": {
            "button-primary": {"backgroundColor": "{colors.primary}", "textColor": "{colors.on-primary}", "rounded": "{rounded.sm}", "typography": "{typography.label}"},
            "surface": {"backgroundColor": "{colors.surface}", "textColor": "{colors.ink}", "rounded": "{rounded.md}"},
            "alert-danger": {"backgroundColor": "{colors.surface}", "textColor": "{colors.status-danger}", "rounded": "{rounded.sm}"},
        },
    }
    if spacing:
        front["spacing"] = spacing

    body = [
        "---", yaml(front).rstrip(), "---", "", MARKER, "",
        "## Overview", "",
        f"{world['name']}: {world.get('summary', '')}",
        "",
        f"Signature detail: {world.get('signature', 'not named')}.",
        "",
        f"Palette: {palette['name']} (primary {palette['seeds']['primary']}, secondary {palette['seeds']['secondary']}, tertiary {palette['seeds']['tertiary']}, neutral {palette['seeds']['neutral']})." if palette else "Palette: the world's own colors.",
        "",
        f"Approved in the design studio at revision {revision} on {stamp}. Designed by {variant['model'] or variant['id']}"
        + (f": {variant['summary']}" if variant.get("summary") else "."),
        "Build with `design/tokens.css`. Do not copy raw colors or font names into components.",
        "",
        "## Colors", "",
        "| Role | Token | Value | sRGB |", "| --- | --- | --- | --- |",
    ]
    for name, value in tokens.items():
        if name.startswith(("color-", "status-")):
            body.append(f"| {name.split('-', 1)[1]} | `--{name}` | `{value}` | `{studio_color.to_hex(value)}` |")
    if palette:
        steps = studio_color.TONES
        body += ["", "Tonal scales (`--<role>-<tone>` in `design/tokens.css`):", "",
                 "| Role | " + " | ".join(str(step) for step in steps) + " |", "| --- |" + " --- |" * len(steps)]
        for role in PALETTE_ROLES:
            scale = studio_color.tonal_scale(palette["seeds"][role])
            body.append(f"| {role} | " + " | ".join(f"`{scale[step]}`" for step in steps) + " |")
    meanings = project.get("statusMeaning", {})
    body += ["", "Status colors are locked for the whole product and never change with the world:", ""]
    for name in STATUS_NAMES:
        body.append(f"- `--status-{name}`: {meanings.get(name, 'no meaning recorded')}")
    body += ["", "Contrast at approval (WCAG 2):", "", "| Pair | Use | Ratio | Minimum |", "| --- | --- | --- | --- |"]
    for check in checks:
        if check["kind"] == "contrast":
            body.append(f"| {check['id']} | {check['label']} | {check['ratio']}:1 | {check['minimum']}:1 |")
    body += ["", "## Typography", "",
             f"- Display: {font_stack(fonts['display'])}",
             f"- Body: {font_stack(fonts['body'])}"]
    if fonts.get("google"):
        body.append(f"- Loaded from Google Fonts: `{fonts['google']}`")
    scripts = ", ".join(project.get("scripts", [])) or "latin"
    if not font_checks:
        body.append(f"- Script coverage ({scripts}): not checked at approval")
    for family, result in (font_checks or {}).items():
        body.append(f"- {family}: {'covers ' + scripts if result == 'ok' else result}")
    body += ["", "| Role | Font | Size | Weight | Line height |", "| --- | --- | --- | --- | --- |"]
    for role, spec in type_scale.items():
        body.append(f"| {role} | {spec.get('font', 'body')} | {spec.get('fontSize')} | {spec.get('fontWeight')} | {spec.get('lineHeight')} |")
    sizes = ", ".join(f"{size['width']}×{size['height']}" for size in SIZES)
    body += ["", "## Screens", "", f"Approved screens, which are the visual reference for delivery. Each works at {sizes}.", ""]
    for screen in project["screens"]:
        role = f" ({screen['role']})" if screen.get("role") else ""
        need = f" Answers: {screen['requirement']}" if screen.get("requirement") else ""
        body.append(f"- {screen['label']}{role}: `studio{preview_path(variant['id'], screen['id'])}`.{need}")
    body += ["", "## Shapes", ""]
    for name, value in rounded.items():
        body.append(f"- `--radius-{name}`: {value}")
    body += ["", "## Components", "",
             "Extract components from the approved screens above. The frontmatter lists the base roles.", "",
             "## Do's and Don'ts", "",
             "- Do use `var(--…)` tokens from `design/tokens.css` for every color, font, and radius.",
             "- Do keep each status color for its one meaning only.",
             "- Don't add raw hex, rgb, hsl, or oklch values, or font names, in components. `check_tokens.py` fails on them.",
             "- Don't change the look while building a feature. Return to the studio for a new revision instead."]
    for rule in world.get("rules", []):
        body.append(f"- {rule}")
    return "\n".join(body) + "\n"


def yaml(value, indent=0):
    """Tiny YAML writer for plain dicts, strings and numbers."""
    lines = []
    pad = "  " * indent
    for key, item in value.items():
        if isinstance(item, dict):
            lines.append(f"{pad}{key}:")
            lines.append(yaml(item, indent + 1).rstrip("\n"))
        elif isinstance(item, (int, float)) and not isinstance(item, bool):
            lines.append(f"{pad}{key}: {item}")
        else:
            lines.append(f"{pad}{key}: {json.dumps(str(item), ensure_ascii=False)}")
    return "\n".join(lines) + "\n"


def write_exports(project_root, project, variant, world, tokens, checks, font_checks, revision, palette=None):
    """Write both files. Refuse to replace a DESIGN.md the studio did not write."""
    stamp = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    design_path = project_root / "DESIGN.md"
    css_path = project_root / "design" / "tokens.css"
    for path, marker in ((design_path, MARKER), (css_path, CSS_MARKER)):
        if path.exists() and marker not in path.read_text(encoding="utf-8"):
            raise PermissionError(f"{path.relative_to(project_root)} exists and was not written by the studio. Move it or merge it by hand first.")
    css_path.parent.mkdir(exist_ok=True)
    design_path.write_text(design_md(project, variant, world, tokens, checks, font_checks, revision, stamp, palette), encoding="utf-8")
    css_path.write_text(tokens_css(project, world, tokens, revision, stamp, palette), encoding="utf-8")
    return [str(design_path.relative_to(project_root)), str(css_path.relative_to(project_root))]

