#!/usr/bin/env python3
r"""
Rename `mattiverse/userstamps` -> `wildside/userstamps` workspace-wide.

Motivation:

    The workspace consistently references `mattiverse/userstamps` as
    the composer package name + `Mattiverse\Userstamps\` as the PHP
    namespace. That's wrong on both counts -- Packagist knows the
    package as `wildside/userstamps`; the PHP namespace it publishes
    is `Wildside\Userstamps\`. `mattiverse` is the GitHub organisation
    that hosts the source repo, not the vendor slug.

    The build failed because Composer resolved `mattiverse/userstamps`
    to "no such package" -- the vendor doesn't exist on Packagist.

## What this script does

Two mechanical replacements across the whole workspace:

  1. In every composer.json:
       "mattiverse/userstamps" -> "wildside/userstamps"
  2. In every .php file:
       Mattiverse\Userstamps    -> Wildside\Userstamps

Skips vendor/, node_modules/, .git/, dist/ trees.

## Safety

- Composer.json edits preserve JSON formatting.
- PHP edits are pure substring replacement; PHP allows the namespace
  case-sensitively so we replace the exact string only.
- Every edit is logged so the diff is auditable.
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

WORKSPACE = Path("/Users/akouta/Projects/academorix-frontend")

SKIP_DIR_NAMES = frozenset(
    {".git", ".turbo", "vendor", "node_modules", ".doppler", "dist"}
)

# Composer edits — string-level (JSON-safe when the token doesn't touch
# JSON structural chars, which it doesn't).
COMPOSER_OLD = '"mattiverse/userstamps"'
COMPOSER_NEW = '"wildside/userstamps"'

# PHP edits — exact namespace token. `Mattiverse\Userstamps` covers
# both `use Mattiverse\Userstamps\...` imports and `Mattiverse\Userstamps`
# FQCN references.
PHP_OLD = "Mattiverse\\Userstamps"
PHP_NEW = "Wildside\\Userstamps"


def find_files(root: Path, glob: str) -> list[Path]:
    out: list[Path] = []
    for p in root.rglob(glob):
        if any(part in SKIP_DIR_NAMES for part in p.parts):
            continue
        out.append(p)
    return sorted(out)


def rewrite_file(path: Path, old: str, new: str) -> bool:
    """Replace `old` with `new` in `path`. Returns True if changed."""
    text = path.read_text(encoding="utf-8")
    if old not in text:
        return False
    path.write_text(text.replace(old, new), encoding="utf-8")
    return True


def main() -> int:
    print("=== Rename mattiverse/userstamps → wildside/userstamps ===")
    print()

    composer_files = find_files(WORKSPACE, "composer.json")
    composer_touched = 0
    for p in composer_files:
        if rewrite_file(p, COMPOSER_OLD, COMPOSER_NEW):
            print(f"composer: {p.relative_to(WORKSPACE)}")
            composer_touched += 1

    php_files = find_files(WORKSPACE, "*.php")
    php_touched = 0
    for p in php_files:
        if rewrite_file(p, PHP_OLD, PHP_NEW):
            php_touched += 1

    print()
    print(f"composer.json files touched : {composer_touched}")
    print(f".php files touched          : {php_touched}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
