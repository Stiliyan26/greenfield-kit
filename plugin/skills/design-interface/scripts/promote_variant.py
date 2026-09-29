#!/usr/bin/env python3
"""Turn the approved studio variant into the project's front end.

    python3 promote_variant.py <project-root> [--variant <id>] [--out web] [--check --studio-url http://127.0.0.1:4173]

Copies the studio app to <out>/ with only the approved variant: its screens and
parts land in src/design/, every screen becomes a route, and the live studio theme
is replaced by the approved design/fonts.css, tokens.css and shadcn.css. Then
installs and builds. With --check, compare_screens.mjs captures every route next
to the studio's own page at three sizes, light and dark, and reports the pixel
difference; the studio must be running for that.
"""

import argparse
import json
from pathlib import Path
import re
import shutil
import subprocess
import sys

SKILL = Path(__file__).resolve().parent.parent
SKIP = {"node_modules", "entries", "studio-build.ts", "vite.config.ts", "package-lock.json", ".tsbuildinfo"}

VITE_CONFIG = """import path from "node:path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { "@": path.resolve(import.meta.dirname, "./src") } },
  server: {
    // design/ (fonts, tokens, shadcn theme) sits next to this app.
    fs: { allow: [path.resolve(import.meta.dirname), path.resolve(import.meta.dirname, "../design")] },
  },
})
"""

INDEX_HTML = """<!doctype html>
<html lang="{lang}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{name}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
"""

MAIN_TSX = """// Promoted from the design studio: every approved screen is a route. The plan
// decides the real router and data loading; until then screens show src/data.ts.
import {{ StrictMode, type ComponentType }} from "react"
import {{ createRoot }} from "react-dom/client"

import "./index.css"
{imports}

const screens: Record<string, ComponentType> = {{
{entries}
}}
const first = "{first}"

// ?theme=dark|light pins the theme; otherwise the system setting decides.
const requested = new URLSearchParams(location.search).get("theme")
const dark = requested ? requested === "dark" : matchMedia("(prefers-color-scheme: dark)").matches
document.documentElement.classList.toggle("dark", dark)

const id = location.pathname.replace(/^\\/+|\\/+$/g, "") || first
const Screen = screens[id]
createRoot(document.getElementById("root")!).render(
  <StrictMode>{{Screen ? <Screen /> : <p>No screen at /{{id}}. Screens: {{Object.keys(screens).join(", ")}}</p>}}</StrictMode>,
)
"""


def run(command, cwd):
    print("$ " + " ".join(map(str, command)))
    return subprocess.run(command, cwd=cwd)


def ident(screen_id):
    return "".join(part[:1].upper() + part[1:] for part in screen_id.replace("_", "-").split("-"))


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("project_root", type=Path)
    parser.add_argument("--variant", help="Defaults to the approved one in studio/selection.json")
    parser.add_argument("--out", default="web", help="App folder to create (default web)")
    parser.add_argument("--check", action="store_true", help="Build, then compare every route with the studio")
    parser.add_argument("--studio-url", default="http://127.0.0.1:4173")
    parser.add_argument("--threshold", type=float, default=1.0, help="Max %% of pixels that may differ (default 1)")
    args = parser.parse_args()

    root = args.project_root.expanduser().resolve()
    studio = root / "studio"
    app = studio / "app"
    selection = json.loads((studio / "selection.json").read_text(encoding="utf-8"))
    variant = args.variant or selection.get("variant")
    if not variant:
        parser.error("No variant: approve one in the studio or pass --variant")
    if not args.variant and selection.get("status") != "approved":
        parser.error(f"'{variant}' is not approved in the studio yet")
    source = app / "src" / "variants" / variant
    if not source.is_dir():
        parser.error(f"No {source}")
    for name in ("DESIGN.md", "design/tokens.css", "design/shadcn.css", "design/fonts.css"):
        if not (root / name).is_file():
            parser.error(f"Missing {name}: approve the design in the studio first")
    out = root / args.out
    if out.exists():
        parser.error(f"{out} exists; move it first")

    project = json.loads((studio / "project.json").read_text(encoding="utf-8"))
    screens = [screen["id"] for screen in project["screens"]]

    shutil.copytree(app, out, ignore=lambda folder, names: [name for name in names if name in SKIP or name == "variants"])
    shutil.copytree(source, out / "src" / "design", ignore=shutil.ignore_patterns("variant.json"))
    for name in ("src/studio-theme.css", "src/mount.tsx"):
        (out / name).unlink(missing_ok=True)
    (out / "vite.config.ts").write_text(VITE_CONFIG, encoding="utf-8")
    (out / "index.html").write_text(INDEX_HTML.format(lang=project.get("language", "en"), name=project["name"]), encoding="utf-8")
    imports = "\n".join(f'import {ident(screen)} from "./design/screens/{screen}"' for screen in screens)
    entries = "\n".join(f'  "{screen}": {ident(screen)},' for screen in screens)
    (out / "src" / "main.tsx").write_text(MAIN_TSX.format(imports=imports, entries=entries, first=screens[0]), encoding="utf-8")

    css = (out / "src" / "index.css")
    text = css.read_text(encoding="utf-8")
    text = re.sub(r"\A/\*.*?\*/\n", "/* Promoted from the design studio. The look lives in ../design/: fonts, tokens and the\n   shadcn theme the studio wrote on approval. Edit the studio, not those files. */\n", text, count=1, flags=re.S)
    text = text.replace('/* Vite\'s root is entries/, so tell Tailwind where the classes are. */\n@source "../src";\n', "")
    text = text.replace('@import "tailwindcss";', '@import "../../design/fonts.css";\n@import "tailwindcss";', 1)
    text = text.replace('@import "./studio-theme.css";', '@import "../../design/tokens.css";\n@import "../../design/shadcn.css";')
    css.write_text(text, encoding="utf-8")
    node_config = out / "tsconfig.node.json"
    node_config.write_text(node_config.read_text(encoding="utf-8").replace('"vite.config.ts", "studio-build.ts"', '"vite.config.ts"'), encoding="utf-8")
    package = out / "package.json"
    data = json.loads(package.read_text(encoding="utf-8"))
    data["name"] = project["name"].lower().replace(" ", "-") + "-web"
    data["scripts"]["build"] = "tsc -p tsconfig.app.json --noEmit && vite build"
    data["scripts"]["preview"] = "vite preview"
    package.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")
    if (app / "package-lock.json").is_file():
        shutil.copy(app / "package-lock.json", out / "package-lock.json")
    print(f"Promoted '{variant}' to {out}: {len(screens)} screens in src/design/screens, parts in src/design/parts")

    if run(["npm", "install", "--no-audit", "--no-fund"], out).returncode or run(["npm", "run", "build"], out).returncode:
        sys.exit("Install or build failed; fix the app before checking it")
    if not args.check:
        print(f"Next: python3 {Path(__file__).name} --check, with the studio running, to prove the routes match the approved screens")
        return
    result = run(["node", str(SKILL / "scripts" / "compare_screens.mjs"), "--app", str(out), "--studio-url", args.studio_url,
                  "--variant", variant, "--threshold", str(args.threshold), "--out", str(root / "temp" / "verification" / "promote")], root)
    sys.exit(result.returncode)


if __name__ == "__main__":
    main()
