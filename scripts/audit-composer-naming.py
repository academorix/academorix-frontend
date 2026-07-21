#!/usr/bin/env python3
"""
audit-composer-naming.py — survey every composer.json name.

Buckets every package into one of:
  - laravel-prefixed  : name after '/' starts with 'laravel-'
  - unprefixed        : everything else in the `stackra*` vendor
  - non-stackra    : third-party / unknown

For each package also reports whether its `require` block hints at
Laravel-coupling (mentions `laravel/*`, `illuminate/*`, `orchestra/*`)
so we can tell "this package is Laravel-specific" from "this is a
framework-agnostic library".

Prints a summary table + full per-package breakdown for follow-up
decisions.
"""
from __future__ import annotations

import json
import pathlib
import sys

WORKSPACE = pathlib.Path(__file__).resolve().parent.parent
SKIP_DIR_NAMES = {"node_modules", "vendor", "tools"}

LARAVEL_HINTS = ("laravel/", "illuminate/", "orchestra/")


def is_laravel_coupled(require: dict) -> bool:
    for dep_name in require:
        if isinstance(dep_name, str) and any(dep_name.startswith(h) for h in LARAVEL_HINTS):
            return True
    return False


def main() -> int:
    laravel_prefixed: list[dict] = []
    unprefixed_stackra: list[dict] = []
    non_stackra: list[dict] = []

    for cj in WORKSPACE.rglob("composer.json"):
        if any(part in SKIP_DIR_NAMES for part in cj.parts):
            continue
        try:
            data = json.loads(cj.read_text())
        except (json.JSONDecodeError, UnicodeDecodeError):
            continue
        name = data.get("name")
        if not isinstance(name, str) or "/" not in name:
            continue

        vendor, tail = name.split("/", 1)
        require = data.get("require", {})
        laravel_coupled = is_laravel_coupled(require) if isinstance(require, dict) else False

        row = {
            "name": name,
            "path": str(cj.relative_to(WORKSPACE)),
            "laravel_coupled": laravel_coupled,
        }

        if not vendor.startswith("stackra"):
            non_stackra.append(row)
        elif tail.startswith("laravel-"):
            laravel_prefixed.append(row)
        else:
            unprefixed_stackra.append(row)

    total = len(laravel_prefixed) + len(unprefixed_stackra) + len(non_stackra)

    print(f"Total composer.json packages: {total}")
    print()
    print("Buckets:")
    print(f"  laravel-prefixed stackra : {len(laravel_prefixed)}")
    print(f"  unprefixed stackra       : {len(unprefixed_stackra)}")
    print(f"  non-stackra              : {len(non_stackra)}")
    print()

    print("=" * 72)
    print(f"Laravel-prefixed stackra packages ({len(laravel_prefixed)}):")
    print("=" * 72)
    for row in sorted(laravel_prefixed, key=lambda r: r["name"]):
        marker = "  [laravel-coupled]" if row["laravel_coupled"] else "  [framework-neutral]"
        print(f"  {row['name']:50s}{marker}")
        print(f"    {row['path']}")
    print()

    if unprefixed_stackra:
        print("=" * 72)
        print(f"Unprefixed stackra packages ({len(unprefixed_stackra)}):")
        print("=" * 72)
        print("(showing only Laravel-coupled ones — candidates for a rename)")
        laravel_coupled_unprefixed = [r for r in unprefixed_stackra if r["laravel_coupled"]]
        print(f"  Laravel-coupled but UNPREFIXED: {len(laravel_coupled_unprefixed)}")
        print(f"  Framework-neutral (correctly unprefixed): {len(unprefixed_stackra) - len(laravel_coupled_unprefixed)}")
        print()
        print("Laravel-coupled unprefixed packages (first 40):")
        for row in sorted(laravel_coupled_unprefixed, key=lambda r: r["name"])[:40]:
            print(f"  {row['name']:50s}  {row['path']}")
        if len(laravel_coupled_unprefixed) > 40:
            print(f"  ... and {len(laravel_coupled_unprefixed) - 40} more")

    return 0


if __name__ == "__main__":
    sys.exit(main())
