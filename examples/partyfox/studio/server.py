"""Start this project's design studio.

This folder holds only the project's content. The engine is shared and lives in
the design-interface skill (the greenfield-kit plugin). Run from the project
root: python3 studio/server.py [--port 4173]
"""

from pathlib import Path
import os
import sys

HERE = Path(__file__).resolve().parent
ENGINE = Path("skills/design-interface/assets/studio-engine")


def candidates():
    """Places the engine can live, most specific first."""
    if os.environ.get("STUDIO_ENGINE"):
        yield Path(os.environ["STUDIO_ENGINE"])
    hint = HERE / ".engine-path"
    if hint.is_file():
        yield Path(hint.read_text(encoding="utf-8").strip())
    for folder in [HERE, *HERE.parents]:
        yield folder / "plugin" / ENGINE
        yield folder / ".claude" / ENGINE
    yield Path.home() / ".claude" / ENGINE
    # Plugin caches of Claude Code, Codex and Cursor, newest install first.
    caches = [
        Path(os.environ.get("CLAUDE_CONFIG_DIR", Path.home() / ".claude")) / "plugins",
        Path(os.environ.get("CODEX_HOME", Path.home() / ".codex")) / "plugins",
        Path.home() / ".cursor" / "plugins",
    ]
    found = [path for cache in caches if cache.is_dir() for path in cache.glob(f"**/{ENGINE}/studio_server.py")]
    yield from (path.parent for path in sorted(found, key=lambda path: path.stat().st_mtime, reverse=True))


engine = next((path for path in candidates() if (path / "studio_server.py").is_file()), None)
if engine is None:
    sys.exit("Studio engine not found. Install the greenfield-kit plugin, or set STUDIO_ENGINE to the "
             "design-interface skill's assets/studio-engine folder.")
sys.dont_write_bytecode = True
sys.path.insert(0, str(engine))

import studio_server  # noqa: E402

studio_server.main(HERE)
