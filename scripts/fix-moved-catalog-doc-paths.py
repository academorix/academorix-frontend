#!/usr/bin/env python3
"""
Fix `docs:` paths in every catalog.json that got moved out of
`packages/backend/` / `packages/sdk/` / `blueprints/` into
`apps/stackra/src/{modules,sdks,blueprints}/`.

Each catalog.json's `docs:` field references the README.md that lives
alongside it. Post-move, the file physically moved with its parent
folder but the string in the JSON still says `packages/backend/...`
or `packages/sdk/...`. This script rewrites the string to the new
location so the reference resolves again.

Idempotent — safe to re-run. Reports touched + skipped counts.
"""
from __future__ import annotations

import json
import pathlib
import sys

WORKSPACE = pathlib.Path("/Users/akouta/Projects/stackra-frontend")


def new_prefix_for(catalog_path: pathlib.Path) -> str:
    """Compute the new prefix that should replace `packages/*/...`
    in a `docs:` reference, based on where the catalog.json now sits.
    """
    rel = catalog_path.relative_to(WORKSPACE)
    # `apps/stackra/src/modules/finance/chargeback/catalog.json`
    #  -> `apps/stackra/src/modules/finance/chargeback`
    return str(rel.parent)


def fix_docs_list(docs: list[str], new_prefix: str) -> list[str]:
    """For each `docs:` entry that starts with one of the old prefixes,
    swap the old prefix for the new one.
    """
    fixed = []
    for entry in docs:
        # Extract the trailing filename (README.md, changelog.md, etc.)
        # from the old path: keep only the basename.
        tail = pathlib.PurePosixPath(entry).name
        fixed.append(f"{new_prefix}/{tail}")
    return fixed


def process(catalog_path: pathlib.Path) -> tuple[bool, str]:
    """Return `(changed, msg)`."""
    try:
        raw = catalog_path.read_text()
        data = json.loads(raw)
    except Exception as exc:
        return False, f"parse-error: {exc}"

    docs = data.get("docs")
    if not isinstance(docs, list):
        return False, "no docs field"

    new_prefix = new_prefix_for(catalog_path)
    fixed = fix_docs_list(docs, new_prefix)
    if fixed == docs:
        return False, "unchanged"

    data["docs"] = fixed
    # Preserve the source formatting shape (2-space indent, trailing NL).
    ends_with_nl = raw.endswith("\n")
    new_body = json.dumps(data, indent=2, ensure_ascii=False)
    if ends_with_nl:
        new_body += "\n"
    catalog_path.write_text(new_body)
    return True, "fixed"


def main() -> int:
    touched = 0
    skipped = 0
    errored = 0
    for cat in sorted((WORKSPACE / "apps/stackra/src").rglob("catalog.json")):
        changed, msg = process(cat)
        if changed:
            touched += 1
        elif msg.startswith("parse-error"):
            errored += 1
            print(f"ERROR {cat.relative_to(WORKSPACE)}: {msg}")
        else:
            skipped += 1

    print(f"Touched: {touched}")
    print(f"Skipped: {skipped}")
    print(f"Errored: {errored}")
    return 0 if errored == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
