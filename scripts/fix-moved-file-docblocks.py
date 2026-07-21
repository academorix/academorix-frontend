#!/usr/bin/env python3
"""
Fix stale `@file packages/{sdk,backend}/...` docblock references in
files that moved into apps/stackra/src/.

Rewrites the `packages/sdk/` prefix to `apps/stackra/src/sdks/` and
`packages/backend/` prefix to `apps/stackra/src/modules/` when the
file lives under `apps/stackra/src/`.

Idempotent — safe to re-run.
"""
from __future__ import annotations

import pathlib
import re
import sys

WORKSPACE = pathlib.Path("/Users/akouta/Projects/stackra-frontend")
ROOT = WORKSPACE / "apps/stackra/src"

PATTERNS = [
    (re.compile(r"(@file\s+)packages/sdk/"), r"\1apps/stackra/src/sdks/"),
    (re.compile(r"(@file\s+)packages/backend/"), r"\1apps/stackra/src/modules/"),
    (re.compile(r"(@file\s+)blueprints/"), r"\1apps/stackra/src/blueprints/"),
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
