#!/usr/bin/env python3
"""
add-catalog-schema.py

Inject `$schema` as the FIRST key in every `catalog.json` under `packages/**`.

Idempotent — safe to re-run. If a file already starts with the correct
`$schema` reference, it's counted as `skipped`. If a stale `$schema` is
present anywhere in the file (wrong position or wrong URL), it's replaced
with the canonical URL at the top and the rest of the keys preserved in
their original order.

Usage:
    python3 scripts/add-catalog-schema.py            # apply
    python3 scripts/add-catalog-schema.py --dry-run  # preview only
    python3 scripts/add-catalog-schema.py --quiet    # no per-file logs

Exit codes:
    0 — success (prints updated/skipped counts)
    1 — one or more files failed to parse or write

Design notes:
    * Uses Python 3.7+ dict insertion-order preservation to keep `$schema`
      first, then the original keys in their original order.
    * Preserves the file's original indent (2- or 4-space) sniffed from
      the raw text. Defaults to 2-space when indent can't be detected.
    * Preserves trailing newline / no-trailing-newline exactly as-is.
    * Atomic write via tempfile + os.replace — no partial writes on failure.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
import tempfile
from pathlib import Path
from typing import Any

# Canonical schema URL — published to a GitHub Gist so IDEs (VS Code,
# JetBrains) resolve autocomplete and validation without any local file.
SCHEMA_URL: str = (
    "https://gist.githubusercontent.com/academorix-user/"
    "073a1ab687cd93ede7ae927b96a025ea/raw/catalog.v1.json"
)

# Repo-relative roots to walk. Every `catalog.json` below these is a
# candidate; catalog files outside these roots are ignored.
CATALOG_ROOTS: tuple[str, ...] = (
    "packages/backend",
    "packages/frontend",
)


def detect_indent(raw: str) -> int:
    """Sniff the indent width from the first indented line. Default 2."""
    match = re.search(r"^(\s+)\S", raw, re.MULTILINE)
    if not match:
        return 2
    leading = match.group(1)
    # Only consider spaces (never tabs — repo convention).
    if "\t" in leading:
        return 2
    return max(2, len(leading))


def has_trailing_newline(raw: str) -> bool:
    """Preserve whatever the file ended with."""
    return raw.endswith("\n")


def rebuild_with_schema_first(payload: dict[str, Any]) -> dict[str, Any]:
    """
    Return a dict with `$schema` as the first key.

    If `$schema` is already present anywhere, it's removed from its old
    slot and re-inserted at the front with the canonical URL.
    """
    rest = {k: v for k, v in payload.items() if k != "$schema"}
    return {"$schema": SCHEMA_URL, **rest}


def process_file(
    path: Path,
    *,
    dry_run: bool,
    quiet: bool,
) -> str:
    """
    Ensure `path` starts with the canonical `$schema`. Returns one of
    'updated', 'skipped', 'failed'.
    """
    try:
        raw = path.read_text(encoding="utf-8")
    except OSError as err:
        print(f"FAIL {path}: read error: {err}", file=sys.stderr)
        return "failed"

    try:
        payload = json.loads(raw)
    except json.JSONDecodeError as err:
        print(f"FAIL {path}: JSON parse error: {err}", file=sys.stderr)
        return "failed"

    if not isinstance(payload, dict):
        print(f"FAIL {path}: root is not an object", file=sys.stderr)
        return "failed"

    # Idempotency: first key is already `$schema` with the canonical URL.
    keys = list(payload.keys())
    if keys and keys[0] == "$schema" and payload["$schema"] == SCHEMA_URL:
        if not quiet:
            print(f"SKIP {path.relative_to(Path.cwd())}")
        return "skipped"

    rebuilt = rebuild_with_schema_first(payload)
    indent = detect_indent(raw)
    trailing = "\n" if has_trailing_newline(raw) else ""
    output = json.dumps(rebuilt, indent=indent, ensure_ascii=False) + trailing

    if dry_run:
        if not quiet:
            print(f"WOULD-UPDATE {path.relative_to(Path.cwd())}")
        return "updated"

    # Atomic write: tempfile in same dir, then os.replace.
    try:
        with tempfile.NamedTemporaryFile(
            mode="w",
            encoding="utf-8",
            dir=path.parent,
            delete=False,
            suffix=".tmp",
        ) as tmp:
            tmp.write(output)
            tmp_path = Path(tmp.name)
        os.replace(tmp_path, path)
    except OSError as err:
        print(f"FAIL {path}: write error: {err}", file=sys.stderr)
        return "failed"

    if not quiet:
        print(f"UPDATE {path.relative_to(Path.cwd())}")
    return "updated"


def find_catalog_files() -> list[Path]:
    """Walk each catalog root and collect every catalog.json."""
    cwd = Path.cwd()
    catalog_files: list[Path] = []
    for root_str in CATALOG_ROOTS:
        root = cwd / root_str
        if not root.is_dir():
            continue
        catalog_files.extend(sorted(root.rglob("catalog.json")))
    return catalog_files


def main() -> int:
    """CLI entry."""
    parser = argparse.ArgumentParser(
        description=(
            "Inject $schema as the first key in every catalog.json "
            "under packages/**"
        ),
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Report actions without modifying files.",
    )
    parser.add_argument(
        "--quiet",
        action="store_true",
        help="Suppress per-file logs; only print the summary.",
    )
    args = parser.parse_args()

    catalog_files = find_catalog_files()

    if not catalog_files:
        print("No catalog.json files found under packages/**", file=sys.stderr)
        return 0

    counts = {"updated": 0, "skipped": 0, "failed": 0}
    for path in catalog_files:
        result = process_file(path, dry_run=args.dry_run, quiet=args.quiet)
        counts[result] += 1

    total = len(catalog_files)
    verb = "would update" if args.dry_run else "updated"
    print(
        f"\n{counts['updated']} {verb}, "
        f"{counts['skipped']} skipped, "
        f"{counts['failed']} failed "
        f"({total} total)"
    )
    return 1 if counts["failed"] > 0 else 0


if __name__ == "__main__":
    sys.exit(main())
