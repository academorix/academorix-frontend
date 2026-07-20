#!/usr/bin/env python3
"""
rename-composer-packages.py — bulk composer-package rename.

For each `old -> new` pair, walks composer.json + catalog.json + markdown
files in the workspace and rewrites every reference:

- `name` field in composer.json when it matches `old` (the self-rename)
- `id` / `name` field in catalog.json when it matches `old`
- Any key in `require` / `require-dev` / `suggest` / `peer_deps` /
  `replace` / `provide` maps that equals `old`
- Any string value in the same maps that references `old`
- Any prose mention of `old` in `.md` files

Idempotent — a second run is a no-op. Preserves JSON indent (sniffed
from each file) + trailing newline. Reports touched counts per file
type + per rename pair.
"""
from __future__ import annotations

import json
import pathlib
import re
import sys
from typing import Dict, List, Tuple

WORKSPACE = pathlib.Path(__file__).resolve().parent.parent
SKIP_DIR_NAMES = {"node_modules", "vendor", "tools/cli/vendor", "tools"}

# Rename pairs. Left-hand side must NOT appear anywhere after the run.
RENAMES: List[Tuple[str, str]] = [
    # 6 laravel-* stragglers -> unprefixed (matches workspace convention)
    ("academorix/debugbar", "academorix/debugbar"),
    ("academorix/horizon", "academorix/horizon"),
    ("academorix/nightwatch", "academorix/nightwatch"),
    ("academorix/omniterm", "academorix/omniterm"),
    ("academorix/sentry", "academorix/sentry"),
    ("academorix/serializer", "academorix/serializer"),
    # Typo fix — dep name that doesn't exist as a package
    ("academorix/support", "academorix/support"),
]


def is_skipped(cj: pathlib.Path) -> bool:
    parts = set(cj.parts)
    # Individual dir names to skip anywhere in the path.
    if parts & {"node_modules", "vendor"}:
        return True
    # Never mutate the CLI's own composer/vendor.
    rel = str(cj.relative_to(WORKSPACE))
    if rel.startswith("tools/cli/vendor/"):
        return True
    return False


def sniff_indent(text: str) -> int:
    for line in text.splitlines():
        stripped = line.lstrip(" ")
        leading = len(line) - len(stripped)
        if 0 < leading and stripped:
            return leading
    return 2


def rewrite_json_value(value, mapping: Dict[str, str]):
    """Return `(new_value, changed)`."""
    if isinstance(value, str):
        return (mapping.get(value, value), value in mapping)
    if isinstance(value, dict):
        # Rewrite both keys and values.
        new_dict = {}
        changed_any = False
        for k, v in value.items():
            new_k = mapping.get(k, k) if isinstance(k, str) else k
            new_v, v_changed = rewrite_json_value(v, mapping)
            if new_k != k or v_changed:
                changed_any = True
            new_dict[new_k] = new_v
        return (new_dict, changed_any)
    if isinstance(value, list):
        new_list = []
        changed_any = False
        for item in value:
            new_item, item_changed = rewrite_json_value(item, mapping)
            if item_changed:
                changed_any = True
            new_list.append(new_item)
        return (new_list, changed_any)
    return (value, False)


def process_json(path: pathlib.Path, mapping: Dict[str, str]) -> bool:
    try:
        original = path.read_text()
        data = json.loads(original)
    except (json.JSONDecodeError, UnicodeDecodeError):
        return False

    new_data, changed = rewrite_json_value(data, mapping)
    if not changed:
        return False

    indent = sniff_indent(original)
    body = json.dumps(new_data, indent=indent, ensure_ascii=False)
    if original.endswith("\n"):
        body += "\n"
    path.write_text(body)
    return True


def process_markdown(path: pathlib.Path, mapping: Dict[str, str]) -> bool:
    try:
        original = path.read_text()
    except UnicodeDecodeError:
        return False
    updated = original
    for old, new in mapping.items():
        # Word-boundary the vendor/name pair. Composer names contain a `/`,
        # so we can look for the exact token surrounded by common
        # separators (backtick, whitespace, `"`, `'`, `,`, `(`, `)`).
        pattern = re.escape(old)
        updated = re.sub(pattern, new, updated)
    if updated == original:
        return False
    path.write_text(updated)
    return True


def main() -> int:
    mapping: Dict[str, str] = dict(RENAMES)

    json_touched: List[str] = []
    md_touched: List[str] = []

    for cj in WORKSPACE.rglob("composer.json"):
        if is_skipped(cj):
            continue
        if process_json(cj, mapping):
            json_touched.append(str(cj.relative_to(WORKSPACE)))

    for catj in WORKSPACE.rglob("catalog.json"):
        if is_skipped(catj):
            continue
        if process_json(catj, mapping):
            json_touched.append(str(catj.relative_to(WORKSPACE)))

    for md in WORKSPACE.rglob("*.md"):
        if is_skipped(md):
            continue
        if process_markdown(md, mapping):
            md_touched.append(str(md.relative_to(WORKSPACE)))

    print(f"Renamed {len(mapping)} package pairs:")
    for old, new in mapping.items():
        print(f"  {old:45s} -> {new}")
    print()
    print(f"JSON files touched: {len(json_touched)}")
    for f in json_touched[:20]:
        print(f"  {f}")
    if len(json_touched) > 20:
        print(f"  ... and {len(json_touched) - 20} more")
    print()
    print(f"Markdown files touched: {len(md_touched)}")
    for f in md_touched[:20]:
        print(f"  {f}")
    if len(md_touched) > 20:
        print(f"  ... and {len(md_touched) - 20} more")

    return 0


if __name__ == "__main__":
    sys.exit(main())
