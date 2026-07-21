#!/usr/bin/env python3
"""Fix `"tenants"` → `"tenancy"` in module.json module-reference positions.

The main rename script mapped every bare `\\bworkspaces\\b` to `tenants`
via its fall-through prose rule. In `module.json` files, `workspaces`
appeared in two DIFFERENT contexts:

  1. Module-reference arrays — `dependencies`, `extendedBy`,
     `planned_consumers`, `contributes.lang`, `contributes.config`, and
     the top-level `name` / `alias` fields. These reference the MODULE
     name (`tenancy` post-rename).
  2. Keyword arrays and description prose — legitimate English plural
     of the domain concept ("tenants"). Preserve.

This script rewrites only the module-reference positions. Idempotent.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

REPO_ROOT = Path("/Users/akouta/Projects/stackra-frontend")
MODULE_REF_ARRAYS = {"dependencies", "extendedBy", "planned_consumers"}
SELF_STRING_FIELDS = {"name", "alias"}
CONTRIBUTES_ARRAY_FIELDS = {"lang", "config"}


def main() -> int:
    root = REPO_ROOT / "modules"
    files = list(root.rglob("module.json"))
    print(f"scanning {len(files)} module.json file(s)")
    fixed = 0

    for path in files:
        try:
            raw = path.read_text(encoding="utf-8")
            obj = json.loads(raw)
        except (json.JSONDecodeError, UnicodeDecodeError, OSError) as err:
            print(f"  SKIP {path.relative_to(REPO_ROOT)}: {err}")
            continue

        dirty = False

        for key in SELF_STRING_FIELDS:
            if obj.get(key) == "tenants":
                obj[key] = "tenancy"
                dirty = True

        for key in MODULE_REF_ARRAYS:
            if isinstance(obj.get(key), list):
                new = ["tenancy" if x == "tenants" else x for x in obj[key]]
                if new != obj[key]:
                    obj[key] = new
                    dirty = True

        contributes = obj.get("contributes")
        if isinstance(contributes, dict):
            for key in CONTRIBUTES_ARRAY_FIELDS:
                if isinstance(contributes.get(key), list):
                    new = ["tenancy" if x == "tenants" else x for x in contributes[key]]
                    if new != contributes[key]:
                        contributes[key] = new
                        dirty = True

        if dirty:
            end = "\n" if raw.endswith("\n") else ""
            path.write_text(
                json.dumps(obj, indent=2, ensure_ascii=False) + end,
                encoding="utf-8",
            )
            print(f"  fixed: {path.relative_to(REPO_ROOT)}")
            fixed += 1

    print(f"\n{fixed} module.json file(s) corrected.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
