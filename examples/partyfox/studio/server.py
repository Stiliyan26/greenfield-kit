"""Start this project's design studio.

This folder holds only the project's content. The engine is shared and lives in
the greenfield-mode skill. Run from the project root: python3 studio/server.py
"""

from pathlib import Path
import sys

HERE = Path(__file__).resolve().parent
ENGINE_PATH = Path(".agents/skills/greenfield-mode/assets/studio-engine")
SEARCH = [HERE.parent / ENGINE_PATH, Path.home() / ENGINE_PATH]

engine = next((path for path in SEARCH if (path / "studio_server.py").is_file()), None)
if engine is None:
    sys.exit("Studio engine not found. Looked in:\n  " + "\n  ".join(str(path) for path in SEARCH))
sys.dont_write_bytecode = True
sys.path.insert(0, str(engine))

import studio_server  # noqa: E402

studio_server.main(HERE)
