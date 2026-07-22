#!/usr/bin/env python3
"""
Phase E — PR-E4: flatten 2-level Actions nesting for geography +
localization. Steering: `.kiro/steering/code-standards.md` §Actions
folder shape + `.kiro/steering/actions-only-full.md` §One-level
nesting only.

Moves:
  Actions/<Ctx>/<Resource>/<Action>.php
    → Actions/<Ctx>/<Action>.php

Namespace rewrite in each moved file:
  Stackra\<Pkg>\Actions\<Ctx>\<Resource>
    → Stackra\<Pkg>\Actions\<Ctx>

The workspace grep already confirmed zero external consumers of
these FQCNs (Actions self-route via #[AsAction] discovery, they
aren't imported anywhere), so the moves are safe from an import
perspective. The generated moves keep every file's contents
verbatim, only rewrite the namespace line.

Empty sub-folders are removed after the moves.
"""

from __future__ import annotations

import re
import shutil
import sys
from pathlib import Path

ROOT = Path("/Users/akouta/Projects/academorix-frontend")

# List every 2-level folder to flatten. Each entry:
#   (relative folder path, PHP namespace fragment to strip)
TARGETS = [
    # geography Platform
    (
        "packages/backend/shared/geography/src/Actions/Platform/Cities",
        (r"Stackra\Geography\Actions\Platform\Cities",
         r"Stackra\Geography\Actions\Platform"),
    ),
    (
        "packages/backend/shared/geography/src/Actions/Platform/Countries",
        (r"Stackra\Geography\Actions\Platform\Countries",
         r"Stackra\Geography\Actions\Platform"),
    ),
    (
        "packages/backend/shared/geography/src/Actions/Platform/Currencies",
        (r"Stackra\Geography\Actions\Platform\Currencies",
         r"Stackra\Geography\Actions\Platform"),
    ),
    (
        "packages/backend/shared/geography/src/Actions/Platform/Languages",
        (r"Stackra\Geography\Actions\Platform\Languages",
         r"Stackra\Geography\Actions\Platform"),
    ),
    (
        "packages/backend/shared/geography/src/Actions/Platform/States",
        (r"Stackra\Geography\Actions\Platform\States",
         r"Stackra\Geography\Actions\Platform"),
    ),
    (
        "packages/backend/shared/geography/src/Actions/Platform/Timezones",
        (r"Stackra\Geography\Actions\Platform\Timezones",
         r"Stackra\Geography\Actions\Platform"),
    ),
    # localization Platform
    (
        "packages/backend/shared/localization/src/Actions/Platform/Drivers",
        (r"Stackra\Localization\Actions\Platform\Drivers",
         r"Stackra\Localization\Actions\Platform"),
    ),
    (
        "packages/backend/shared/localization/src/Actions/Platform/Languages",
        (r"Stackra\Localization\Actions\Platform\Languages",
         r"Stackra\Localization\Actions\Platform"),
    ),
    (
        "packages/backend/shared/localization/src/Actions/Platform/Translations",
        (r"Stackra\Localization\Actions\Platform\Translations",
         r"Stackra\Localization\Actions\Platform"),
    ),
    # localization Tenant
    (
        "packages/backend/shared/localization/src/Actions/Tenant/Languages",
        (r"Stackra\Localization\Actions\Tenant\Languages",
         r"Stackra\Localization\Actions\Tenant"),
    ),
    (
        "packages/backend/shared/localization/src/Actions/Tenant/TenantLocales",
        (r"Stackra\Localization\Actions\Tenant\TenantLocales",
         r"Stackra\Localization\Actions\Tenant"),
    ),
    (
        "packages/backend/shared/localization/src/Actions/Tenant/TranslationJobs",
        (r"Stackra\Localization\Actions\Tenant\TranslationJobs",
         r"Stackra\Localization\Actions\Tenant"),
    ),
    (
        "packages/backend/shared/localization/src/Actions/Tenant/Translations",
        (r"Stackra\Localization\Actions\Tenant\Translations",
         r"Stackra\Localization\Actions\Tenant"),
    ),
]


def main() -> int:
    moved: list[str] = []
    collisions: list[str] = []
    for rel_folder, (old_ns, new_ns) in TARGETS:
        src_folder = ROOT / rel_folder
        if not src_folder.exists():
            print(f"MISSING: {rel_folder}")
            continue
        dst_folder = src_folder.parent
        for php in sorted(src_folder.glob("*.php")):
            dst_file = dst_folder / php.name
            if dst_file.exists():
                collisions.append(f"{php.relative_to(ROOT)} -> {dst_file.relative_to(ROOT)}")
                continue
            # Read + rewrite namespace + write to new location
            content = php.read_text(encoding="utf-8")
            escaped_old = re.escape(old_ns)
            # Use a lambda to avoid re.sub's replacement-string
            # backreference syntax swallowing our backslashes.
            new_content = re.sub(
                rf"namespace\s+{escaped_old}\s*;",
                lambda _m, ns=new_ns: f"namespace {ns};",
                content,
                count=1,
            )
            dst_file.write_text(new_content, encoding="utf-8")
            php.unlink()
            moved.append(f"{php.relative_to(ROOT)} -> {dst_file.relative_to(ROOT)}")
        # Remove the empty subfolder (only if now empty)
        try:
            src_folder.rmdir()
        except OSError:
            print(f"NOT REMOVED (non-empty after moves): {rel_folder}")
    print(f"MOVED       : {len(moved)}")
    for line in moved:
        print(f"  * {line}")
    if collisions:
        print(f"COLLISIONS  : {len(collisions)}  (skipped — needs manual reconciliation)")
        for line in collisions:
            print(f"  ! {line}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
