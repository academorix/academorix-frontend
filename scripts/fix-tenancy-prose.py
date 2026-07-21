#!/usr/bin/env python3
"""Post-rename prose fixups.

The primary rename script mapped bare `\\bworkspaces\\b` → `tenants` via
its fall-through rule. That's correct for domain-plural prose (e.g.
"list of workspaces" → "list of tenants") but wrong for module-reference
prose (e.g. "the workspaces module" → should be "the tenancy module",
not "the tenants module").

This script fixes the specific idioms that leaked through, plus renames
the Laravel Blueprint migration macro `workspaceable()` → `tenantable()`
to match the trait rename (`BelongsToWorkspace` → `BelongsToTenant`).

Idempotent. Safe to re-run.
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

REPO_ROOT = Path("/Users/akouta/Projects/stackra-frontend")
SCAN_EXTENSIONS = {
    ".json", ".md", ".mdx", ".txt",
    ".php", ".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs",
    ".yaml", ".yml", ".env", ".sh", ".py",
}
SKIP_DIRS = {".git", "node_modules", "vendor", "dist", "build", "coverage", "__pycache__", ".venv"}

# Module-reference idioms — `tenants` here means the module, not the noun.
# Order: longest phrase first so the general fall-throughs never fire on
# a compound that already matched.
SUBSTITUTIONS: list[tuple[re.Pattern[str], str]] = [
    # ---- Migration macros: workspaceable → tenantable ---------------
    # The trait renamed BelongsToWorkspace → BelongsToTenant; the paired
    # migration macro renames to match.
    (re.compile(r"\bworkspaceable_optional\b"), "tenantable_optional"),
    (re.compile(r"\bworkspaceable\b"), "tenantable"),

    # ---- Module-ref prose (specific compounds — module is `tenancy`) ----
    (re.compile(r"\btenants module\b"),      "tenancy module"),
    (re.compile(r"\btenants Module\b"),      "tenancy Module"),
    (re.compile(r"\btenants package\b"),     "tenancy package"),
    (re.compile(r"\btenants service\b"),     "tenancy service"),
    (re.compile(r"\btenants hooks\b"),       "tenancy hooks"),
    (re.compile(r"\btenants boundary\b"),    "tenancy boundary"),
    (re.compile(r"\btenants substrate\b"),   "tenancy substrate"),
    (re.compile(r"\btenants tier\b"),        "tenancy tier"),
    (re.compile(r"\btenants layer\b"),       "tenancy layer"),
    (re.compile(r"\btenants port\b"),        "tenancy port"),

    # ---- Middleware refs — the middleware is registered on the tenancy module ----
    # Bare middleware names are usually kebab like `resolve.tenant` (already
    # correct via rename). The `tenants` module-ref appears in prose like
    # "the resolve.tenant middleware in the tenants module".
    (re.compile(r"in the tenants module"), "in the tenancy module"),
    (re.compile(r"from tenants module"),   "from tenancy module"),
    (re.compile(r"the tenants substrate is universal"), "the tenancy substrate is universal"),

    # ---- Cross-* adjective compounds — the domain adjective is `cross-tenant` (singular) ----
    (re.compile(r"\bcross-tenants\b"), "cross-tenant"),
]


def main() -> int:
    scopes = [REPO_ROOT / "modules", REPO_ROOT / "sdk"]
    total_hits: dict[str, int] = {}
    files_touched = 0
    files_scanned = 0

    for scope in scopes:
        if not scope.exists():
            continue
        for path in scope.rglob("*"):
            if not path.is_file():
                continue
            if any(part in SKIP_DIRS for part in path.parts):
                continue
            if path.suffix not in SCAN_EXTENSIONS:
                continue
            files_scanned += 1

            try:
                original = path.read_text(encoding="utf-8")
            except (UnicodeDecodeError, OSError):
                continue

            text = original
            hits_here: dict[str, int] = {}
            for pattern, repl in SUBSTITUTIONS:
                text, n = pattern.subn(repl, text)
                if n:
                    hits_here[pattern.pattern] = n

            if text == original:
                continue

            files_touched += 1
            for k, v in hits_here.items():
                total_hits[k] = total_hits.get(k, 0) + v
            path.write_text(text, encoding="utf-8")
            rel = path.relative_to(REPO_ROOT)
            print(f"  fixed: {rel}  ({sum(hits_here.values())} substitutions)")

    print()
    print(f"Files scanned:  {files_scanned}")
    print(f"Files touched:  {files_touched}")
    print("Substitutions per rule:")
    for rule, n in sorted(total_hits.items(), key=lambda kv: -kv[1]):
        print(f"  {n:5d}  {rule}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
