#!/usr/bin/env python3
"""
Phase E — PR-E1: add `declare(strict_types=1);` to every PHP source file
under packages/backend that is currently missing it, excluding Blade views
and config files (per .kiro/steering/conventions.md, `declare` goes on
every non-config PHP file).

Mechanical insertion:
    - Locate the closing `*/` of the file-level docblock (or the first
      `<?php` line when no docblock is present).
    - Insert a `declare(strict_types=1);` line immediately after, with
      one blank line above and one blank line below, before `namespace`.

Idempotent — files that already carry the declaration are left alone.
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

# The 35 files identified by the audit + full grep in Phase E.
TARGETS = [
    # Routing attributes (27)
    "packages/backend/framework/routing/src/Attributes/Any.php",
    "packages/backend/framework/routing/src/Attributes/ApiResource.php",
    "packages/backend/framework/routing/src/Attributes/AsMiddleware.php",
    "packages/backend/framework/routing/src/Attributes/Defaults.php",
    "packages/backend/framework/routing/src/Attributes/Delete.php",
    "packages/backend/framework/routing/src/Attributes/Domain.php",
    "packages/backend/framework/routing/src/Attributes/DomainFromConfig.php",
    "packages/backend/framework/routing/src/Attributes/Fallback.php",
    "packages/backend/framework/routing/src/Attributes/Get.php",
    "packages/backend/framework/routing/src/Attributes/Group.php",
    "packages/backend/framework/routing/src/Attributes/Middleware.php",
    "packages/backend/framework/routing/src/Attributes/Options.php",
    "packages/backend/framework/routing/src/Attributes/Patch.php",
    "packages/backend/framework/routing/src/Attributes/Post.php",
    "packages/backend/framework/routing/src/Attributes/Prefix.php",
    "packages/backend/framework/routing/src/Attributes/Put.php",
    "packages/backend/framework/routing/src/Attributes/Resource.php",
    "packages/backend/framework/routing/src/Attributes/Route.php",
    "packages/backend/framework/routing/src/Attributes/ScopeBindings.php",
    "packages/backend/framework/routing/src/Attributes/Where.php",
    "packages/backend/framework/routing/src/Attributes/WhereAlpha.php",
    "packages/backend/framework/routing/src/Attributes/WhereAlphaNumeric.php",
    "packages/backend/framework/routing/src/Attributes/WhereIn.php",
    "packages/backend/framework/routing/src/Attributes/WhereNumber.php",
    "packages/backend/framework/routing/src/Attributes/WhereUlid.php",
    "packages/backend/framework/routing/src/Attributes/WhereUuid.php",
    "packages/backend/framework/routing/src/Attributes/WithTrashed.php",
    # Routing top-level (2)
    "packages/backend/framework/routing/src/ClassRouteAttributes.php",
    "packages/backend/framework/routing/src/RouteRegistrar.php",
    # Support (2)
    "packages/backend/framework/support/src/Path.php",
    "packages/backend/framework/support/src/Concerns/HasLaravelPaths.php",
    # Foundation Middleware post-C4 move (4)
    "packages/backend/foundation/src/Middleware/ForceJsonResponse.php",
    "packages/backend/foundation/src/Middleware/SanitizeInput.php",
    "packages/backend/foundation/src/Middleware/SecurityHeaders.php",
    "packages/backend/foundation/src/Middleware/ValidateApiVersion.php",
]

ROOT = Path("/Users/akouta/Projects/academorix-frontend")


def already_declared(text: str) -> bool:
    # First 30 lines is more than enough; matches whitespace variants.
    return re.search(r"^\s*declare\s*\(\s*strict_types\s*=\s*1\s*\)\s*;",
                     "\n".join(text.splitlines()[:30]),
                     re.MULTILINE) is not None


def insert_declare(text: str) -> str:
    """
    Insert `declare(strict_types=1);` between the file-level docblock
    (if present) and the `namespace` keyword. Blank lines above and
    below.
    """
    # Common pattern: <?php ... <docblock> ... */\nnamespace ...
    # We match the FIRST `*/` that is immediately followed by an
    # optional blank line and then `namespace`.
    pattern_with_docblock = re.compile(
        r"(\*/)\n(namespace\s)",
        re.MULTILINE,
    )
    if pattern_with_docblock.search(text):
        return pattern_with_docblock.sub(
            r"\1\n\ndeclare(strict_types=1);\n\n\2",
            text,
            count=1,
        )

    # Fallback: no docblock, `<?php` then eventually `namespace ...`
    pattern_no_docblock = re.compile(
        r"(<\?php\s*)\n+(namespace\s)",
        re.MULTILINE,
    )
    if pattern_no_docblock.search(text):
        return pattern_no_docblock.sub(
            r"\1\n\ndeclare(strict_types=1);\n\n\2",
            text,
            count=1,
        )

    return text  # cannot locate insertion point — hands off


def main() -> int:
    changed: list[str] = []
    skipped_already: list[str] = []
    unchanged_no_match: list[str] = []
    for rel in TARGETS:
        path = ROOT / rel
        if not path.exists():
            print(f"MISSING: {rel}")
            continue
        content = path.read_text(encoding="utf-8")
        if already_declared(content):
            skipped_already.append(rel)
            continue
        new_content = insert_declare(content)
        if new_content == content:
            unchanged_no_match.append(rel)
            continue
        path.write_text(new_content, encoding="utf-8")
        changed.append(rel)

    print(f"CHANGED     : {len(changed)}")
    for f in changed:
        print(f"  + {f}")
    if skipped_already:
        print(f"ALREADY OK  : {len(skipped_already)}")
        for f in skipped_already:
            print(f"  = {f}")
    if unchanged_no_match:
        print(f"NO INSERTION POINT: {len(unchanged_no_match)}")
        for f in unchanged_no_match:
            print(f"  ? {f}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
