#!/usr/bin/env python3
"""
drop-stackra-prefix.py

Drop the redundant `Stackra` prefix from 9 framework class / interface /
trait names. The namespace already carries `Stackra\` so the identifier
prefix restates it — user's request: strip.

## Renames

  StackraException                      -> Exception
  StackraSolutionsProvider              -> SolutionsProvider
  StackraAiSolutionsProvider            -> AiSolutionsProvider
  StackraIdIssuer                       -> IdIssuer
  StackraIdIssuerInterface              -> IdIssuerInterface
  StackraAgent                          -> Agent
  EnumUsesStackraEnumTraitRule          -> EnumUsesEnumTraitRule
  ExceptionsExtendStackraBaseRule       -> ExceptionsExtendBaseRule
  StackraExceptionTest                  -> ExceptionTest

Word-boundary matching so we never touch `Stackra` where it's part of
a namespace (`Stackra\Something`) or a package name (`stackra/foo`).

## What's NOT touched

  - Namespace declarations `namespace Stackra\...` — those keep Stackra
    because Stackra IS the framework vendor.
  - Composer package names `stackra/foo` — vendor scope.
  - CLI binary `bin/stackra` — user-facing name.

Physical filename renames (mv) are handled by the shell wrapper —
this script only rewrites file CONTENTS.
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

# Rename map — longest keys first so `StackraExceptionTest` matches
# before `StackraException`, `StackraIdIssuerInterface` before
# `StackraIdIssuer`, etc.
RENAMES: dict[str, str] = {
    "StackraAiSolutionsProvider": "AiSolutionsProvider",
    "StackraSolutionsProvider": "SolutionsProvider",
    "EnumUsesStackraEnumTraitRule": "EnumUsesEnumTraitRule",
    "ExceptionsExtendStackraBaseRule": "ExceptionsExtendBaseRule",
    "StackraIdIssuerInterface": "IdIssuerInterface",
    "StackraExceptionTest": "ExceptionTest",
    "StackraIdIssuer": "IdIssuer",
    "StackraException": "Exception",
    "StackraAgent": "Agent",
}


def sorted_pairs() -> list[tuple[str, str]]:
    """Longest key first — avoids substring collisions during subn."""
    return sorted(RENAMES.items(), key=lambda kv: -len(kv[0]))


# Files whose content we rewrite.
TEXT_EXTS = {".php", ".md", ".mdx", ".txt", ".json", ".neon", ".yaml", ".yml"}


def iter_targets():
    """Every relevant file in the workspace, skipping vendor / node_modules / .git."""
    skip_dirs = {"vendor", "node_modules", ".git", "dist", "build", ".turbo"}
    for path in ROOT.rglob("*"):
        if not path.is_file():
            continue
        parts = set(path.parts)
        if parts & skip_dirs:
            continue
        if path.suffix in TEXT_EXTS:
            yield path


def rewrite_content(text: str, pairs: list[tuple[str, str]]) -> tuple[str, int]:
    """
    Replace every old identifier with the new one, word-boundary matched.

    Word boundary = start/end of string OR non-identifier character on each
    side. This prevents `StackraException` from matching inside
    `StackraExceptionTest` (handled anyway by longest-first ordering) and
    prevents accidentally hitting `SomeStackraExceptionFoo` if such thing
    existed.
    """
    hits = 0
    for old, new in pairs:
        pattern = re.compile(r"\b" + re.escape(old) + r"\b")
        # Callable replacement bypasses re.sub's group-reference parsing.
        text, n = pattern.subn(lambda m, r=new: r, text)
        hits += n
    return text, hits


def main() -> int:
    pairs = sorted_pairs()

    print("rename map (longest first):")
    for old, new in pairs:
        print(f"  {old:35s} -> {new}")
    print()

    total_files = 0
    total_hits = 0

    for path in iter_targets():
        try:
            text = path.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            continue
        new_text, n = rewrite_content(text, pairs)
        if n > 0:
            total_files += 1
            total_hits += n
            path.write_text(new_text, encoding="utf-8")

    print(f"touched {total_files} files, {total_hits} identifier hits")
    return 0


if __name__ == "__main__":
    sys.exit(main())
