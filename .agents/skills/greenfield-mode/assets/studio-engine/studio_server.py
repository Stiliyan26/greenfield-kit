"""Serve a project's design studio: the engine page plus that project's content.

The engine (this folder) is shared by every project. The project's studio/ folder
holds only content: project.json, selection.json, comments.json, taste.md,
candidates/, references/ and any data files the candidates load.
"""

from datetime import datetime, timezone
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, unquote, urlparse
import argparse
import json
import os
import tempfile
import threading
import uuid

import studio_color
import studio_export

WEB = Path(__file__).resolve().parent / "web"
MAX_BODY = 65536
WIDTHS = {1440, 1024, 390}
COMMENT_KINDS = {"note", "like", "reject"}
PALETTES = WEB / "palettes.json"
DEFAULT_SELECTION = {
    "screen": None, "layout": None, "world": None, "width": 1440, "tuning": {}, "palette": {}, "shortlist": [],
    "feedback": "", "status": "draft", "revision": 1, "approvedAt": None,
    "layoutChoice": None, "exported": None,
}
LOCK = threading.Lock()


def now():
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def write_json(path, value):
    encoded = (json.dumps(value, indent=2, ensure_ascii=False) + "\n").encode("utf-8")
    with tempfile.NamedTemporaryFile(dir=path.parent, delete=False) as output:
        temporary = Path(output.name)
        output.write(encoded)
    os.replace(temporary, path)


class Studio:
    """File access for one project's content folder."""

    def __init__(self, content):
        self.content = content
        self.root = content.parent

    def project(self):
        return json.loads((self.content / "project.json").read_text(encoding="utf-8"))

    def selection(self):
        path = self.content / "selection.json"
        stored = json.loads(path.read_text(encoding="utf-8")) if path.exists() else {}
        selection = {**DEFAULT_SELECTION, **{key: stored[key] for key in DEFAULT_SELECTION if key in stored}}
        selection["tuning"] = self.clean_tuning(selection["tuning"])
        worlds = self.world_ids()
        selection["palette"] = {world: value for world, value in (selection.get("palette") or {}).items() if world in worlds}
        return selection

    def world_ids(self):
        try:
            return {world["id"] for world in self.project().get("worlds", [])}
        except (OSError, ValueError, KeyError, TypeError):
            return set()

    def custom_palettes(self):
        path = self.content / "palettes.json"
        return json.loads(path.read_text(encoding="utf-8")) if path.exists() else []

    def clean_tuning(self, tuning):
        """Drop saved tuning for worlds or tokens that project.json no longer has."""
        try:
            worlds = {world["id"]: world.get("tokens", {}) for world in self.project().get("worlds", [])}
        except (OSError, ValueError, KeyError, TypeError):
            return tuning if isinstance(tuning, dict) else {}
        if not isinstance(tuning, dict):
            return {}
        return {world: {name: value for name, value in tokens.items() if tunable(name, worlds[world])}
                for world, tokens in tuning.items() if world in worlds and isinstance(tokens, dict)}


    def comments(self):
        path = self.content / "comments.json"
        return json.loads(path.read_text(encoding="utf-8")) if path.exists() else []

    def save_selection(self, value):
        write_json(self.content / "selection.json", value)

    def save_comments(self, value):
        write_json(self.content / "comments.json", value)

    def append_taste(self, comment):
        path = self.content / "taste.md"
        if not path.exists():
            path.write_text("# Taste log\n\nThe studio appends likes and rejects here. Agents read this before every design round.\n\n## Log\n", encoding="utf-8")
        snippet = " ".join(comment["snippet"].split())[:60]
        text = " ".join(comment["text"].split())
        line = (f"- {comment['createdAt'][:10]} {comment['kind']} · {comment['layout']} / {comment['world']}"
                f" · {comment['screen']} @ {comment['width']}px · “{snippet}” · {text}\n")
        with path.open("a", encoding="utf-8") as output:
            output.write(line)


def tunable(name, world_tokens):
    """Color tokens the user may change: the world's own, plus the palette tokens."""
    return name.startswith("color-") and (name in world_tokens or name in studio_export.EXTENDED_TOKENS or name in studio_export.REQUIRED_TOKENS)

class Handler(SimpleHTTPRequestHandler):
    studio = None  # set by serve()

    extensions_map = {**SimpleHTTPRequestHandler.extensions_map, ".webp": "image/webp", ".js": "text/javascript", ".mjs": "text/javascript"}

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(self.studio.content), **kwargs)

    def log_message(self, format, *args):
        if os.environ.get("STUDIO_LOG"):
            super().log_message(format, *args)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def translate_path(self, path):
        clean = urlparse(path).path
        if clean in ("/", "/index.html"):
            return str(WEB / "index.html")
        if clean.startswith("/_studio/"):
            saved = self.directory
            self.directory = str(WEB)
            try:
                return super().translate_path(path[len("/_studio"):])
            finally:
                self.directory = saved
        return super().translate_path(path)

    # --- routing -------------------------------------------------------

    def do_GET(self):
        path = urlparse(self.path).path
        if path == "/api/project":
            try:
                project = self.studio.project()
            except (OSError, ValueError) as error:
                self.send_json({"name": "Studio", "screens": [], "layouts": [], "worlds": [], "status": {},
                                "_problems": [f"project.json can't be read: {error}"],
                                "_rules": {"contrastPairs": [], "hueGuard": {"degrees": 0, "chroma": 1}, "requiredTokens": []}})
                return
            self.send_json({
                **project,
                "_problems": studio_export.validate_project(project),
                "_rules": {
                    "contrastPairs": studio_export.CONTRAST_PAIRS,
                    "hueGuard": {"degrees": studio_export.HUE_GUARD_DEGREES, "chroma": studio_export.HUE_GUARD_CHROMA},
                    "requiredTokens": studio_export.REQUIRED_TOKENS,
                },
            })
        elif path == "/api/selection":
            self.send_json(self.studio.selection())
        elif path == "/api/tokens":
            self.send_tokens()
        elif path == "/api/palettes":
            library = json.loads(PALETTES.read_text(encoding="utf-8"))["palettes"]
            self.send_json({"library": library, "custom": self.studio.custom_palettes()})
        elif path == "/api/comments":
            self.send_json(self.studio.comments())
        else:
            super().do_GET()

    def do_POST(self):
        path = unquote(urlparse(self.path).path)
        try:
            body = self.read_body()
            with LOCK:
                if path == "/api/selection":
                    result = self.update_selection(body)
                elif path == "/api/approve":
                    result = self.approve(body)
                elif path == "/api/choose-layout":
                    result = self.choose_layout(body)
                elif path == "/api/comments":
                    result = self.add_comment(body)
                elif path == "/api/palettes":
                    result = self.save_palette(body)
                elif path.startswith("/api/comments/"):
                    result = self.change_comment(path.removeprefix("/api/comments/"), body)
                else:
                    self.send_error(404)
                    return
        except PermissionError as error:
            self.send_json({"error": str(error)}, 409)
            return
        except (ValueError, TypeError, KeyError) as error:
            self.send_json({"error": str(error)}, 400)
            return
        self.send_json(result)

    def read_body(self):
        origin = self.headers.get("Origin")
        if origin and origin != f"http://{self.headers.get('Host')}":
            raise PermissionError("Requests must come from the studio page")
        if not self.headers.get("Content-Type", "").startswith("application/json"):
            raise ValueError("Send JSON with Content-Type: application/json")
        length = int(self.headers.get("Content-Length", "0"))
        if length < 1 or length > MAX_BODY:
            raise ValueError(f"Body must be between 1 and {MAX_BODY} bytes")
        value = json.loads(self.rfile.read(length))
        if not isinstance(value, dict):
            raise ValueError("Body must be a JSON object")
        return value

    # --- selection -----------------------------------------------------

    def update_selection(self, body):
        project = self.studio.project()
        current = self.studio.selection()
        layouts = {item["id"] for item in project["layouts"]}
        worlds = {item["id"]: item for item in project["worlds"]}
        screens = {item["id"] for item in project["screens"]} | {"specimen"}
        allowed = {"screen", "layout", "world", "width", "tuning", "feedback", "palette", "shortlist"}
        unknown = set(body) - allowed
        if unknown:
            raise ValueError(f"The studio sets {', '.join(sorted(unknown))} itself")
        nxt = {**current, **body}
        if nxt["layout"] not in layouts | {None}:
            raise ValueError("Unknown layout")
        if nxt["world"] not in set(worlds) | {None}:
            raise ValueError("Unknown world")
        if nxt["screen"] not in screens | {None}:
            raise ValueError("Unknown screen")
        if nxt["width"] not in WIDTHS:
            raise ValueError(f"Width must be one of {sorted(WIDTHS)}")
        if not isinstance(nxt["feedback"], str) or len(nxt["feedback"]) > 4000:
            raise ValueError("Notes must be text under 4000 characters")
        self.validate_tuning(nxt["tuning"], worlds)
        self.validate_palette(nxt["palette"], worlds)
        shortlist = nxt["shortlist"]
        if not isinstance(shortlist, list) or len(shortlist) > 300 or not all(isinstance(item, str) and len(item) <= 80 for item in shortlist):
            raise ValueError("Shortlist must be a list of palette ids")
        design_changed = any(nxt[key] != current[key] for key in ("layout", "world", "tuning", "palette"))
        if design_changed:
            nxt.update(status="draft", approvedAt=None, revision=current["revision"] + 1)
        self.studio.save_selection(nxt)
        return nxt

    @staticmethod
    def validate_tuning(tuning, worlds):
        if not isinstance(tuning, dict):
            raise ValueError("Tuning must be an object")
        for world_id, tokens in tuning.items():
            if world_id not in worlds or not isinstance(tokens, dict):
                raise ValueError(f"Tuning names an unknown world: {world_id}")
            for name, value in tokens.items():
                if not tunable(name, worlds[world_id]["tokens"]):
                    raise ValueError(f"Only color tokens can be tuned, not {name}")
                studio_color.parse(value)

    @staticmethod
    def validate_palette(palette, worlds):
        if not isinstance(palette, dict):
            raise ValueError("Palette must be an object")
        for world_id, value in palette.items():
            if world_id not in worlds or not isinstance(value, dict):
                raise ValueError(f"Palette names an unknown world: {world_id}")
            seeds = value.get("seeds")
            if not isinstance(seeds, dict) or set(seeds) != set(studio_export.PALETTE_ROLES):
                raise ValueError("A palette needs primary, secondary, tertiary and neutral seeds")
            for seed in seeds.values():
                studio_color.parse(seed)
            if not isinstance(value.get("name", ""), str) or len(value.get("name", "")) > 80:
                raise ValueError("Palette name must be short text")

    def save_palette(self, body):
        name = body.get("name", "")
        if not isinstance(name, str) or not name.strip() or len(name) > 60:
            raise ValueError("A saved palette needs a name under 60 characters")
        entry = {"id": "custom-" + uuid.uuid4().hex[:6], "name": name.strip(), "tags": ["custom"]}
        for role in studio_export.PALETTE_ROLES:
            entry[role] = studio_color.to_hex(body.get(role, ""))
        custom = self.studio.custom_palettes()
        if len(custom) >= 200:
            raise ValueError("The project already has 200 saved palettes")
        custom.append(entry)
        write_json(self.studio.content / "palettes.json", custom)
        return entry

    def send_tokens(self):
        """Finished tokens for one world, so every frame shows the same thing the checks see."""
        query = parse_qs(urlparse(self.path).query)
        project = self.studio.project()
        selection = self.studio.selection()
        world_id = (query.get("world") or [selection["world"]])[0]
        world = next((item for item in project["worlds"] if item["id"] == world_id), None) or (project["worlds"] or [None])[0]
        if world is None:
            self.send_json({"error": "No worlds in project.json"}, 404)
            return
        tuning = {} if (query.get("tuned") or ["1"])[0] == "0" else selection["tuning"]
        try:
            tokens = studio_export.effective_tokens(project, world, tuning)
        except (KeyError, ValueError) as error:
            self.send_json({"error": f"World '{world['id']}' can't be built: {error}"}, 400)
            return
        self.send_json({"world": world["id"], "tokens": tokens, "fonts": world.get("fonts", {})})

    def choose_layout(self, body):
        selection = self.studio.selection()
        if body.get("revision") != selection["revision"] or not selection["layout"]:
            raise PermissionError("The page is out of date. Reload and choose again.")
        selection["layoutChoice"] = {"layout": selection["layout"], "revision": selection["revision"], "at": now()}
        self.studio.save_selection(selection)
        return selection

    def approve(self, body):
        project = self.studio.project()
        selection = self.studio.selection()
        if body.get("revision") != selection["revision"]:
            raise PermissionError("The page is out of date. Reload and approve again.")
        problems = studio_export.validate_project(project)
        if problems:
            raise PermissionError("Fix project.json first: " + "; ".join(problems))
        layout = next((item for item in project["layouts"] if item["id"] == selection["layout"]), None)
        world = next((item for item in project["worlds"] if item["id"] == selection["world"]), None)
        if not layout or not world:
            raise PermissionError("Pick a layout and a world first")
        if world.get("neutral"):
            raise PermissionError("The neutral world is for choosing a layout. Approve a world from the identity round.")
        tokens = studio_export.effective_tokens(project, world, selection["tuning"])
        checks = studio_export.run_checks(tokens)
        failed = [check["label"] for check in checks if not check["pass"]]
        if failed:
            raise PermissionError("Checks fail: " + "; ".join(failed))
        font_checks = self.font_checks(body.get("fontChecks"), world)
        palette = selection["palette"].get(world["id"])
        files = studio_export.write_exports(self.studio.root, project, layout, world, tokens, checks, font_checks, selection["revision"], palette)
        selection.update(status="approved", approvedAt=now(), exported={"revision": selection["revision"], "at": now(), "files": files})
        self.studio.save_selection(selection)
        return selection

    @staticmethod
    def font_checks(value, world):
        """Keep only results for the world's own families, as one short line each.

        The server can't read glyph tables, so it trusts the page's answer but
        refuses an approval the page itself reported as missing a script.
        """
        if not isinstance(value, dict):
            return {}
        families = {studio_export.family_name(world["fonts"][role]) for role in ("display", "body")}
        clean = {}
        for family, result in value.items():
            if family not in families or not isinstance(result, str):
                continue
            result = " ".join(result.split())[:80]
            if result.startswith("missing"):
                raise PermissionError(f"{family} is {result}")
            clean[family] = result
        return clean

    # --- comments ------------------------------------------------------

    def add_comment(self, body):
        text = body.get("text", "")
        if not isinstance(text, str) or not text.strip() or len(text) > 2000:
            raise ValueError("A comment needs text under 2000 characters")
        if body.get("kind") not in COMMENT_KINDS:
            raise ValueError(f"Kind must be one of {sorted(COMMENT_KINDS)}")
        selection = self.studio.selection()
        comment = {
            "id": uuid.uuid4().hex[:8],
            "kind": body["kind"],
            "text": text.strip(),
            "layout": str(body.get("layout", ""))[:60],
            "world": str(body.get("world", ""))[:60],
            "screen": str(body.get("screen", ""))[:60],
            "width": body.get("width") if body.get("width") in WIDTHS else None,
            "selector": str(body.get("selector", ""))[:400],
            "snippet": str(body.get("snippet", ""))[:120],
            "status": "open",
            "revision": selection["revision"],
            "createdAt": now(),
        }
        comments = self.studio.comments()
        comments.append(comment)
        self.studio.save_comments(comments)
        if comment["kind"] in {"like", "reject"}:
            self.studio.append_taste(comment)
        return comment

    def change_comment(self, rest, body):
        comment_id, _, action = rest.partition("/")
        comments = self.studio.comments()
        match = next((item for item in comments if item["id"] == comment_id), None)
        if not match:
            raise ValueError("Unknown comment")
        if action == "delete":
            comments.remove(match)
        elif body.get("status") in {"open", "done"}:
            match["status"] = body["status"]
        else:
            raise ValueError("Send status open or done, or POST to /delete")
        self.studio.save_comments(comments)
        return {"ok": True}

    def send_json(self, value, status=200):
        payload = json.dumps(value, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)


def main(content_dir):
    parser = argparse.ArgumentParser(description="Local design studio")
    parser.add_argument("--port", type=int, default=0, help="Local port (default: choose a free one)")
    args = parser.parse_args()
    Handler.studio = Studio(Path(content_dir).resolve())
    server = ThreadingHTTPServer(("127.0.0.1", args.port), Handler)
    print(f"Design studio: http://127.0.0.1:{server.server_port}/", flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
