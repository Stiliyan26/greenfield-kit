"""Serve this project's local design studio and save its review choices."""

from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import argparse
import json
import os
import tempfile
from urllib.parse import urlparse


ROOT = Path(__file__).resolve().parent
PROJECT = ROOT / "project.json"
SELECTION = ROOT / "selection.json"


class StudioHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def do_GET(self):
        path = urlparse(self.path).path
        if path == "/api/selection":
            self.send_json(json.loads(SELECTION.read_text(encoding="utf-8")))
            return
        if path == "/api/project":
            self.send_json(json.loads(PROJECT.read_text(encoding="utf-8")))
            return
        super().do_GET()

    def do_POST(self):
        if urlparse(self.path).path != "/api/selection":
            self.send_error(404)
            return
        try:
            length = int(self.headers.get("Content-Length", "0"))
            if length < 1 or length > 16384:
                raise ValueError("Selection must be between 1 and 16384 bytes")
            value = json.loads(self.rfile.read(length))
            self.validate(value)
        except (ValueError, TypeError) as error:
            self.send_json({"error": str(error)}, 400)
            return

        encoded = (json.dumps(value, indent=2, ensure_ascii=False) + "\n").encode("utf-8")
        temporary = None
        try:
            with tempfile.NamedTemporaryFile(dir=ROOT, delete=False) as output:
                temporary = Path(output.name)
                output.write(encoded)
            os.replace(temporary, SELECTION)
        finally:
            if temporary and temporary.exists():
                temporary.unlink()
        self.send_json(value)

    @staticmethod
    def validate(value):
        if not isinstance(value, dict):
            raise ValueError("Selection must be an object")
        project = json.loads(PROJECT.read_text(encoding="utf-8"))
        concepts = {item["id"] for item in project["concepts"]}
        screens = {item["id"] for item in project["screens"]}
        fonts = {item["id"] for item in project["fonts"]}
        if value.get("concept") not in (concepts | {None}):
            raise ValueError("Unknown concept")
        if value.get("screen") not in (screens | {None}):
            raise ValueError("Unknown screen")
        if value.get("font") not in fonts:
            raise ValueError("Unknown font")
        if type(value.get("hue")) is not int or not 0 <= value["hue"] <= 360:
            raise ValueError("Hue must be an integer from 0 to 360")
        if value.get("harmony") not in {"analogous", "complementary", "triadic"}:
            raise ValueError("Unknown harmony")
        if value.get("status") not in {"draft", "approved"}:
            raise ValueError("Unknown status")
        if type(value.get("revision")) is not int or value["revision"] < 1:
            raise ValueError("Revision must be a positive integer")
        if not isinstance(value.get("feedback"), str) or len(value["feedback"]) > 2000:
            raise ValueError("Feedback must be under 2000 characters")
        if value["status"] == "approved":
            if value["concept"] is None or value["screen"] is None or not value.get("approvedAt"):
                raise ValueError("Only a populated design can be approved")

    def send_json(self, value, status=200):
        payload = json.dumps(value, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--port", type=int, default=0, help="Local port (default: choose a free one)")
    args = parser.parse_args()
    server = ThreadingHTTPServer(("127.0.0.1", args.port), StudioHandler)
    print(f"Design studio: http://127.0.0.1:{server.server_port}/", flush=True)
    server.serve_forever()
