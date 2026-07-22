"""Emit the composer.json require + repositories blocks for the API app.

Walks every ``packages/backend/**/composer.json`` (max 4 levels deep),
skips SDKs (consumer-side) + the ``stackra-platform/*`` sub-vendor, and
emits a JSON block the API app's composer.json can splice in.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path("/Users/akouta/Projects/academorix-frontend")
BACKEND = ROOT / "packages" / "backend"
OUTPUT = ROOT / ".kiro" / "reports" / "composer-api-require.json"


def find_composer_files() -> list[Path]:
    """Every composer.json under packages/backend, max 3 levels below backend/."""
    out: list[Path] = []
    for cj in BACKEND.rglob("composer.json"):
        rel = cj.relative_to(BACKEND)
        # skip vendor
        if "vendor" in rel.parts:
            continue
        # depth: file itself doesn't count; parents.parts is what we want
        depth = len(rel.parts) - 1
        if depth > 3:
            continue
        out.append(cj)
    return sorted(out)


def main() -> int:
    entries: list[tuple[str, str]] = []
    files = find_composer_files()
    print(f"Found {len(files)} composer.json files under packages/backend/")

    for cj in files:
        try:
            data = json.loads(cj.read_text())
        except json.JSONDecodeError as e:
            print(f"WARN — could not parse {cj}: {e}", file=sys.stderr)
            continue
        name = data.get("name")
        if not name:
            continue
        if "-sdk" in name:
            continue
        if name.startswith("stackra-platform/"):
            continue
        rel = str(Path("../..") / cj.parent.relative_to(ROOT))
        entries.append((name, rel))

    entries.sort()

    require = {name: "@dev" for name, _ in entries}
    repositories = [
        {"type": "path", "url": rel, "options": {"symlink": True}}
        for _, rel in entries
    ]

    print(f"Total backend packages to require: {len(entries)}")
    print(f"First 3: {entries[:3]}")
    print(f"Last 3: {entries[-3:]}")

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(
        json.dumps({"require": require, "repositories": repositories}, indent=2)
    )
    print(f"Wrote {OUTPUT}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
