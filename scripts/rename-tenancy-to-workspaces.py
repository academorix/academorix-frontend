#!/usr/bin/env python3
"""
Rename tenancy \u2192 workspaces across the Academorix modules blueprint.

WHAT IT DOES
    File contents (in every JSON / MD / PHP / TS file under modules/):
        Tenancy compound (e.g. `TenancyServiceProvider`)  \u2192 Workspaces
        Tenant compound  (e.g. `TenantContact`, `TenantErased`, `BelongsToTenant`) \u2192 Workspace
        tenancy (module ref / namespace / kebab)          \u2192 workspaces
        tenants (plural, tables / URLs / prose)           \u2192 workspaces
        tenant  (singular)                                \u2192 workspace
        tenant_id (FK column)                             \u2192 workspace_id
        TENANCY_*, TENANT_* env prefixes                  \u2192 WORKSPACES_*, WORKSPACE_*
        ULID prefix `ten_<26 chars>`                      \u2192 `wsp_<26 chars>`

    Folder:
        modules/tenancy/  \u2192  modules/workspaces/

USAGE
    # Preview \u2014 no writes.
    python3 scripts/rename-tenancy-to-workspaces.py --dry-run

    # Apply changes to disk.
    python3 scripts/rename-tenancy-to-workspaces.py --apply

SAFETY
    Before --apply, commit your working tree. Recovery is git-only.

    Idempotent: running twice is a no-op.

    Word-boundary + PascalCase-aware substitution avoids collateral damage.
    `retention`, `content`, `attendant`, and other English words that happen
    to contain the letters `tent` or `ent` are NOT touched.

SCOPE
    By default: modules/**. Override with --scope <path>.

    Skips: .git/ node_modules/ vendor/ dist/ build/ coverage/
"""

from __future__ import annotations

import argparse
import re
import shutil
import sys
from pathlib import Path

# --------------------------------------------------------------------------
# Config
# --------------------------------------------------------------------------

DEFAULT_SCOPE = Path("/Users/akouta/Projects/academorix-frontend/modules")

# File extensions to scan + rewrite.
SCAN_EXTENSIONS = {
    ".json", ".md", ".mdx", ".txt",
    ".php", ".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs",
    ".yaml", ".yml", ".env", ".sh", ".py",
}

SKIP_DIRS = {".git", "node_modules", "vendor", "dist", "build", "coverage", "__pycache__"}

# --------------------------------------------------------------------------
# Substitution rules \u2014 ORDER MATTERS.
# Rules are applied top-to-bottom; each rule sees the output of the previous.
# --------------------------------------------------------------------------
#
# PascalCase strategy: `(?:\b|(?<=[a-z]))Word(?=[A-Z_]|\b)` matches:
#   \u2022 Word at start of string / preceded by non-letter                (`\b`)
#   \u2022 Word inside PascalCase compound after a lowercase letter        (`(?<=[a-z])`)
#     e.g. matches `Tenant` inside `BelongsToTenant`.
#   \u2022 Word followed by an uppercase letter (compound continuation)    (`[A-Z]`)
#   \u2022 Word followed by underscore (env / snake mix)                   (`_`)
#   \u2022 Word followed by word boundary (end of PascalCase run)          (`\b`)
#
# ULID prefix strategy: `\bten_` \u2014 word boundary before `t` means we only
# match `ten_` when it's a distinct token, not inside `retention` etc.

SUBSTITUTIONS: list[tuple[re.Pattern[str], str]] = [
    # ---- ULID prefix (must run BEFORE `tenant` word substitutions) ----
    # Matches `ten_` when it's a bare token (start-of-word). Catches:
    #   "ten_"   (schema keyPrefix)
    #   ten_01ABC\u2026  (real ULID)
    #   ^ten_[A-Z]  (JSON schema pattern)
    #   `ten_<ulid>` (markdown code)
    (re.compile(r"\bten_"), "wsp_"),

    # ---- PascalCase compound: `Tenancy` \u2192 `Workspaces` ----
    # Preserves compound forms like `TenancyServiceProvider` \u2192 `WorkspacesServiceProvider`.
    (re.compile(r"(?:\b|(?<=[a-z]))Tenancy(?=[A-Z_]|\b)"), "Workspaces"),

    # ---- PascalCase compound: `Tenant` \u2192 `Workspace` ----
    # Matches `Tenant`, `TenantContact`, `BelongsToTenant`, `TenantErased`, etc.
    (re.compile(r"(?:\b|(?<=[a-z]))Tenant(?=[A-Z_]|\b)"), "Workspace"),

    # ---- snake_case compound: `tenant_id` \u2192 `workspace_id` ----
    # Handled BEFORE the plain `tenant` rule so the compound wins.
    (re.compile(r"\btenant_id\b"), "workspace_id"),
    (re.compile(r"\btenants_count\b"), "workspaces_count"),
    (re.compile(r"\btenant_ids\b"), "workspace_ids"),

    # ---- Plural first (order matters: `tenants` must run before `tenant`) ----
    (re.compile(r"\btenancy\b"), "workspaces"),
    (re.compile(r"\btenants\b"), "workspaces"),
    (re.compile(r"\btenant\b"), "workspace"),

    # ---- Env var / uppercase prefixes ----
    (re.compile(r"\bTENANCY_"), "WORKSPACES_"),
    (re.compile(r"\bTENANT_"), "WORKSPACE_"),

    # ---- Trailing standalone TENANCY / TENANT (e.g. in comments) ----
    (re.compile(r"\bTENANCY\b"), "WORKSPACES"),
    (re.compile(r"\bTENANT\b"), "WORKSPACE"),
]


# --------------------------------------------------------------------------
# Driver
# --------------------------------------------------------------------------

def should_scan(path: Path) -> bool:
    """Return True if this file should be scanned + rewritten."""
    if not path.is_file():
        return False
    if any(part in SKIP_DIRS for part in path.parts):
        return False
    if path.suffix in SCAN_EXTENSIONS:
        return True
    # Also scan extensionless files that look like config (e.g. `.env`).
    if path.suffix == "" and path.name.startswith("."):
        return True
    return False


def rewrite_text(text: str) -> tuple[str, int]:
    """Apply every substitution to `text`. Returns (new_text, total_replacements)."""
    total = 0
    for pattern, replacement in SUBSTITUTIONS:
        text, count = pattern.subn(replacement, text)
        total += count
    return text, total


def process_file(path: Path, apply: bool) -> int:
    """Rewrite one file. Returns number of replacements."""
    try:
        original = path.read_text(encoding="utf-8")
    except (UnicodeDecodeError, PermissionError):
        return 0
    new_text, count = rewrite_text(original)
    if count > 0 and apply and new_text != original:
        path.write_text(new_text, encoding="utf-8")
    return count


def rename_tenancy_folder(root: Path, apply: bool) -> str:
    """Rename modules/tenancy/ to modules/workspaces/."""
    src = root / "tenancy"
    dst = root / "workspaces"
    if not src.exists():
        return f"[folder] skip \u2014 source not present: {src}"
    if dst.exists():
        return f"[folder] skip \u2014 destination already exists: {dst}"
    if apply:
        shutil.move(str(src), str(dst))
        return f"[folder] renamed {src.name} \u2192 {dst.name}"
    return f"[folder] would rename {src.name} \u2192 {dst.name}"


def main() -> int:
    parser = argparse.ArgumentParser(
        prog="rename-tenancy-to-workspaces",
        description="Rename tenancy \u2192 workspaces across modules/**.",
    )
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--dry-run", action="store_true", help="Preview changes without writing.")
    group.add_argument("--apply", action="store_true", help="Apply changes to disk.")
    parser.add_argument(
        "--scope",
        type=Path,
        default=DEFAULT_SCOPE,
        help=f"Root directory to scan (default: {DEFAULT_SCOPE})",
    )
    parser.add_argument("--verbose", "-v", action="store_true", help="List every file with edits.")
    args = parser.parse_args()

    scope: Path = args.scope
    if not scope.exists():
        print(f"Scope directory not found: {scope}", file=sys.stderr)
        return 1

    apply = args.apply
    mode = "APPLY" if apply else "DRY-RUN"
    print(f"[mode] {mode}")
    print(f"[scope] {scope}")
    print()

    total_files = 0
    total_edits = 0
    edited: list[tuple[Path, int]] = []

    for path in sorted(scope.rglob("*")):
        if not should_scan(path):
            continue
        total_files += 1
        count = process_file(path, apply=apply)
        if count > 0:
            edited.append((path, count))
            total_edits += count

    # Folder rename \u2014 only when scanning the parent of tenancy/
    folder_msg = ""
    if scope == DEFAULT_SCOPE:
        folder_msg = rename_tenancy_folder(scope, apply=apply)

    # Report
    print(f"[scanned]      {total_files} files")
    print(f"[files edited] {len(edited)}")
    print(f"[total edits]  {total_edits}")
    if folder_msg:
        print(folder_msg)
    print()
    if edited:
        print("Top-20 most-edited files:")
        for path, count in sorted(edited, key=lambda x: -x[1])[:20]:
            rel = path.relative_to(scope) if path.is_relative_to(scope) else path
            print(f"  {count:>4}  {rel}")
        if args.verbose:
            print()
            print("All edited files:")
            for path, count in sorted(edited):
                rel = path.relative_to(scope) if path.is_relative_to(scope) else path
                print(f"  {count:>4}  {rel}")

    if not apply and total_edits > 0:
        print()
        print("This was a DRY-RUN. To apply:")
        print("  git commit -am 'chore: pre-rename snapshot' && \\")
        print("    python3 scripts/rename-tenancy-to-workspaces.py --apply")

    return 0


if __name__ == "__main__":
    sys.exit(main())
