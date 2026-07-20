#!/usr/bin/env python3
"""
Fix stale `@file packages/{sdk,backend}/...` docblock references in
files that moved into apps/academorix/src/.

Rewrites the `packages/sdk/` prefix to `apps/academorix/src/sdks/` and
`packages/backend/` prefix to `apps/academorix/src/modules/` when the
file lives under `apps/academorix/src/`.

Idempotent — safe to re-run.
"""
from __future__ import annotations

import pathlib
import re
import sys

WORKSPACE = pathlib.Path("/Users/akouta/Projects/academorix-frontend")
ROOT = WORKSPACE / "apps/academorix/src"

PATTERNS = [
    (re.compile(r"(@file\s+)packages/sdk/"), r"\1apps/academorix/src/sdks/"),
    (re.compile(r"(@file\s+)packages/backend/"), r"\1apps/academorix/src/modules/"),
    (re.compile(r"(@file\s+)blueprints/"), r"\1apps/academorix/src/blueprints/"),
]


def process(path: pathlib.Path) -> bool:
    try:
        body = path.read_text()
    except UnicodeDecodeError:
        return False

    original = body
    for pat, repl in PATTERNS:
        body = pat.sub(repl, body)

    if body != original:
        path.write_text(body)
        return True
    return False


def main() -> int:
    touched = 0
    for path in ROOT.rglob("*"):
        if not path.is_file():
            continue
        if path.suffix not in (".php", ".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".md"):
            continue
        if process(path):
            touched += 1

    print(f"Touched: {touched}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
