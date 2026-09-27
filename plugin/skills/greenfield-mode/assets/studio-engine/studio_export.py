"""Check a world's tokens and write DESIGN.md and the design/ files on approval.

DESIGN.md follows https://raw.githubusercontent.com/google-labs-code/design.md/main/docs/spec.md
"""

from datetime import datetime, timezone
import json
import re

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
    ("color-on-status", "status-danger", 4.5, "Text on a solid danger fill"),
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


def themes(project):
    """The looks every model designs. Dark is on unless project.json sets "themes": ["light"]."""
    return project.get("themes", ["light", "dark"])


def effective_tokens(project, world, tuning, theme="light"):
    """Tokens a candidate sees: world tokens, the user's tuning, derived extras, locked status colors.

    Dark takes the world's non-color tokens (radius, space) and its `dark` colors. Tuning
    and palettes change the light look only. Status colors keep their meaning; dark uses
    project.json `statusDark` (lighter, same hue) when set.
    """
    if theme == "dark":
        dark = world.get("dark") or {}
        tokens = {name: value for name, value in world.get("tokens", {}).items() if not name.startswith("color-")}
        tokens.update({name: value for name, value in dark.items() if name.startswith("color-")})
        status = project.get("statusDark") or project["status"]
        for name in STATUS_NAMES:
            tokens[f"status-{name}"] = status[name]
        return derive_extended(tokens)
    tokens = dict(world.get("tokens", {}))
    tokens.update(tuning.get(world["id"], {}))
    for name in STATUS_NAMES:
        tokens[f"status-{name}"] = project["status"][name]
    return derive_extended(tokens)


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
    # Text on a solid status fill, such as a danger banner. White fails on a light dark-mode red.
    if "status-danger" in tokens:
        tokens.setdefault("color-on-status", studio_color.on_color(tokens["status-danger"]))
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
                         "order": data.get("order", 0), "world": world, "components": data.get("components"),
                         "notComponents": data.get("notComponents")})
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
        if project.get("statusDark") is not None:
            try:
                studio_color.parse(project["statusDark"].get(name, ""))
            except (AttributeError, ValueError) as error:
                problems.append(f"statusDark.{name}: {error}")
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
        if variant.get("components") is not None:
            problems += component_problems(variant, screen_ids)
        problems += not_component_problems(variant)
        problems += dark_problems(project, variant, required=False)
    return problems


def dark_problems(project, variant, required):
    """Problems in a variant's dark look. With `required`, a missing one is a problem too."""
    if "dark" not in themes(project):
        return []
    label = f"Variant '{variant['id']}'"
    dark = variant["world"].get("dark")
    if dark is None:
        return [f"{label} has no dark look: add world.dark to variant.json"] if required else []
    if not isinstance(dark, dict):
        return [f"{label} world.dark must be an object of color tokens"]
    problems = [f"{label} world.dark is missing {name}" for name in REQUIRED_TOKENS if name.startswith("color-") and name not in dark]
    for name, value in dark.items():
        try:
            studio_color.parse(value)
        except ValueError as error:
            problems.append(f"{label} world.dark {name}: {error}")
    return problems


def not_component_problems(variant):
    """`notComponents` lists repeated structures the model decided are not parts, each with a reason."""
    items = variant.get("notComponents")
    if items is None:
        return []
    label = f"Variant '{variant['id']}'"
    if not isinstance(items, list):
        return [f"{label} notComponents must be a list of {{selector, why}}"]
    problems = []
    for index, item in enumerate(items, 1):
        if not isinstance(item, dict) or not str(item.get("selector", "")).strip() or not str(item.get("why", "")).strip():
            problems.append(f"{label} notComponents {index} needs a selector and a why")
    return problems


def component_problems(variant, screen_ids):
    """Problems in a variant's components list. A missing list is a problem too:
    approval turns it into DESIGN.md's Components section."""
    label = f"Variant '{variant['id']}'"
    components = variant.get("components")
    if not isinstance(components, list) or not components:
        return [f"{label} lists no components in variant.json"]
    problems, names = [], []
    for index, item in enumerate(components, 1):
        if not isinstance(item, dict) or not str(item.get("name", "")).strip():
            problems.append(f"{label} component {index} needs a name")
            continue
        name = item["name"]
        names.append(name)
        for key in ("name", "what", "selector"):
            if any(mark in str(item.get(key) or "") for mark in ("\n", "`")):
                problems.append(f"{label} component {name}: '{key}' must be one line without backticks")
        if not str(item.get("what", "")).strip():
            problems.append(f"{label} component {name} needs 'what'")
        screens = item.get("screens")
        if not isinstance(screens, list) or not screens:
            problems.append(f"{label} component {name} needs the screens it appears on")
        else:
            unknown = [screen for screen in screens if screen not in screen_ids]
            if unknown:
                problems.append(f"{label} component {name} names unknown screens: {', '.join(map(str, unknown))}")
        base = item.get("shadcn")
        if base is not None and not (isinstance(base, str) and re.fullmatch(r"[a-z][a-z0-9-]*", base)):
            problems.append(f"{label} component {name}: 'shadcn' is a component name such as \"dialog\", or null for a custom one")
    repeated = sorted({name for name in names if names.count(name) > 1})
    if repeated:
        problems.append(f"{label} component names repeat: {', '.join(repeated)}")
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


def fonts_css(project, world, revision, stamp):
    """The font import on its own. A CSS @import only works before every other rule,
    so an app imports this file first and tokens.css after its framework."""
    google = world["fonts"].get("google")
    lines = [CSS_MARKER, f"/* {project['name']} · world {world['name']} · revision {revision} · {stamp} */",
             "/* Import this file before anything else, including Tailwind. */"]
    lines.append(f'@import url("https://fonts.googleapis.com/css2?{google}&display=swap");' if google
                 else "/* The approved fonts are not on Google Fonts; load them in the app. */")
    return "\n".join(lines) + "\n"


def tokens_css(project, world, tokens, revision, stamp, palette=None, dark=None):
    fonts = world["fonts"]
    lines = [CSS_MARKER, f"/* {project['name']} · world {world['name']} · revision {revision} · {stamp} */",
             "/* Fonts load from design/fonts.css. Dark applies under .dark or [data-theme=dark] on <html>. */"]
    lines.append(":root {")
    lines.append("  color-scheme: light;")
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
    if dark:
        lines.append(".dark, [data-theme=\"dark\"] {")
        lines.append("  color-scheme: dark;")
        for name, value in dark.items():
            if name.startswith(("color-", "status-")):
                lines.append(f"  --{name}: {value};")
        lines.append("}")
    return "\n".join(lines) + "\n"


# shadcn's theme variable → the approved token it takes. shadcn's "secondary" and
# "accent" are quiet fills (a plain button, a hovered menu item), not the look's own
# secondary and accent colors, so they map to quiet tokens.
SHADCN_COLORS = (
    ("background", "color-bg"), ("foreground", "color-ink"),
    ("card", "color-surface"), ("card-foreground", "color-ink"),
    ("popover", "color-surface"), ("popover-foreground", "color-ink"),
    ("primary", "color-primary"), ("primary-foreground", "color-on-primary"),
    ("secondary", "color-surface-2"), ("secondary-foreground", "color-ink"),
    ("muted", "color-surface-2"), ("muted-foreground", "color-muted"),
    ("accent", "color-primary-soft"), ("accent-foreground", "color-ink"),
    ("destructive", "status-danger"),
    ("border", "color-line"), ("input", "color-line"), ("ring", "color-primary"),
    ("chart-1", "color-primary"), ("chart-2", "color-secondary"), ("chart-3", "color-tertiary"),
    ("chart-4", "color-accent"), ("chart-5", "color-muted"),
    ("sidebar", "color-surface"), ("sidebar-foreground", "color-ink"),
    ("sidebar-primary", "color-primary"), ("sidebar-primary-foreground", "color-on-primary"),
    ("sidebar-accent", "color-primary-soft"), ("sidebar-accent-foreground", "color-ink"),
    ("sidebar-border", "color-line"), ("sidebar-ring", "color-primary"),
)
# shadcn components use rounded-lg for controls, rounded-xl and up for cards and
# dialogs, rounded-4xl for badges, rounded-md and rounded-sm for small inner parts.
SHADCN_RADII = (("sm", "sm"), ("md", "sm"), ("lg", "md"), ("xl", "lg"), ("2xl", "lg"), ("3xl", "lg"), ("4xl", "pill"))


def shadcn_css(project, world, tokens, revision, stamp, dark=None):
    """Point shadcn's theme at the approved tokens.

    shadcn's own theme reuses names such as --color-primary and --radius-md, so
    this file replaces the @theme inline, :root and .dark blocks `shadcn init`
    writes. Values are copied from the tokens, never shadcn's defaults. Colors are
    copied rather than linked with var(), so the two files can't form a loop.
    """
    fonts = world["fonts"]
    radius = {name.removeprefix("radius-"): value for name, value in tokens.items() if name.startswith("radius-")}
    radius.setdefault("lg", radius["md"])
    radius.setdefault("pill", "999px")
    lines = [CSS_MARKER, f"/* {project['name']} · world {world['name']} · revision {revision} · {stamp} */",
             "/* shadcn/ui theme from the approved tokens. Import it right after design/tokens.css, in place of",
             "   the @theme inline, :root and .dark blocks that `shadcn init` writes. */",
             "@theme inline {",
             f"  --font-sans: {font_stack(fonts['body'])};",
             f"  --font-heading: {font_stack(fonts['display'])};"]
    lines += [f"  --color-{name}: var(--{name});" for name, _ in SHADCN_COLORS]
    lines += [f"  --radius-{step}: {radius[source]};" for step, source in SHADCN_RADII]
    lines += ["}", ":root {"]
    lines += [f"  --{name}: {tokens[source]};" for name, source in SHADCN_COLORS]
    lines += [f"  --radius: {radius['md']};", "}"]
    if dark:
        lines += [".dark, [data-theme=\"dark\"] {"] + [f"  --{name}: {dark[source]};" for name, source in SHADCN_COLORS] + ["}"]
    return "\n".join(lines) + "\n"


def design_md(project, variant, world, tokens, checks, font_checks, revision, stamp, palette=None, dark=None, dark_checks=None):
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
        "Files written with this one: `design/fonts.css` (the font import; load it first), "
        "`design/tokens.css` (every token as a CSS variable) and `design/shadcn.css` "
        "(shadcn/ui's theme, taken from the tokens).",
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
    if dark:
        body += ["", "### Dark theme", "",
                 "The same roles under `.dark` or `[data-theme=\"dark\"]` on `<html>`. Status colors keep their meaning.", "",
                 "| Role | Token | Value | sRGB |", "| --- | --- | --- | --- |"]
        for name, value in dark.items():
            if name.startswith(("color-", "status-")):
                body.append(f"| {name.split('-', 1)[1]} | `--{name}` | `{value}` | `{studio_color.to_hex(value)}` |")
        body += ["", "Contrast in the dark theme (WCAG 2):", "", "| Pair | Use | Ratio | Minimum |", "| --- | --- | --- | --- |"]
        for check in dark_checks or []:
            if check["kind"] == "contrast":
                body.append(f"| {check['id']} | {check['label']} | {check['ratio']}:1 | {check['minimum']}:1 |")
    body += ["", "## Typography", "",
             f"- Display: {font_stack(fonts['display'])}",
             f"- Body: {font_stack(fonts['body'])}"]
    if fonts.get("google"):
        body.append(f"- Loaded from Google Fonts by `design/fonts.css`: `{fonts['google']}`")
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
    body += ["", *components_md(variant), "", "## Do's and Don'ts", "",
             "- Do use `var(--…)` tokens from `design/tokens.css` for every color, font, and radius, or shadcn's class names (`bg-primary`), which `design/shadcn.css` maps to the same tokens.",
             "- Do keep each status color for its one meaning only.",
             "- Don't add raw hex, rgb, hsl, or oklch values, or font names, in components. `check_tokens.py` fails on them.",
             "- Don't change the look while building a feature. Return to the studio for a new revision instead."]
    for rule in world.get("rules", []):
        body.append(f"- {rule}")
    return "\n".join(body) + "\n"


def components_md(variant):
    """The Components section: every part the approved model named, where it shows, and how to build it."""
    lines = ["## Components", "",
             f"The parts {variant['model'] or variant['id']} named for this design. Build each one to match the screens listed.",
             "",
             "- `shadcn` rows: add them with the `shadcn` skill (`npx shadcn@latest add <name>`). "
             "`design/shadcn.css` gives them this design's colors, fonts and radius. Change layout and variants, never colors.",
             "- `custom` rows: build them by hand from the named screens, with `var(--…)` tokens only.",
             "- \"Find it\" is a CSS selector in the approved screen files.",
             "", "| Component | What it is | Screens | Find it | Build from |", "| --- | --- | --- | --- | --- |"]
    for item in variant.get("components") or []:
        base = f"shadcn `{item['shadcn']}`" if item.get("shadcn") else "custom"
        where = f"`{item['selector']}`" if item.get("selector") else ""
        cells = [item["name"], item.get("what", ""), ", ".join(item.get("screens", [])), where, base]
        lines.append("| " + " | ".join(str(cell).replace("|", "\\|") for cell in cells) + " |")
    return lines


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


def write_exports(project_root, project, variant, world, tokens, checks, font_checks, revision, palette=None, dark=None, dark_checks=None):
    """Write DESIGN.md and the three design/ files. Refuse to replace one the studio did not write."""
    stamp = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    files = {
        project_root / "DESIGN.md": (MARKER, design_md(project, variant, world, tokens, checks, font_checks, revision, stamp, palette, dark, dark_checks)),
        project_root / "design" / "fonts.css": (CSS_MARKER, fonts_css(project, world, revision, stamp)),
        project_root / "design" / "tokens.css": (CSS_MARKER, tokens_css(project, world, tokens, revision, stamp, palette, dark)),
        project_root / "design" / "shadcn.css": (CSS_MARKER, shadcn_css(project, world, tokens, revision, stamp, dark)),
    }
    for path, (marker, _) in files.items():
        if path.exists() and marker not in path.read_text(encoding="utf-8"):
            raise PermissionError(f"{path.relative_to(project_root)} exists and was not written by the studio. Move it or merge it by hand first.")
    (project_root / "design").mkdir(exist_ok=True)
    for path, (_, text) in files.items():
        path.write_text(text, encoding="utf-8")
    return [str(path.relative_to(project_root)) for path in files]

