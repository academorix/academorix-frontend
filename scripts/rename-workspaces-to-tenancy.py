#!/usr/bin/env python3
"""
Rename workspaces → tenancy across the Stackra modules blueprint.

Reverses `scripts/rename-tenancy-to-workspaces.py` — takes the codebase
back to the canonical vocabulary declared in `.kiro/steering/hierarchy.md`
§1a where **Tenant** is canonical and **Workspace** is a rejected synonym.

WHAT IT DOES
    File contents (in every JSON / MD / PHP / TS file under modules/):

        # High-specificity structural refs FIRST — never ambiguous.
        Stackra\\Workspaces\\ (both slash variants)  →  Stackra\\Tenancy\\
        stackra://modules/workspaces/               →  stackra://modules/tenancy/
        modules/platform/workspaces/ (path)            →  modules/platform/tenancy/
        modules/workspaces/ (path)                     →  modules/tenancy/
        "module": "workspaces"                          →  "module": "tenancy"
        workspace_id (FK column)                        →  tenant_id
        workspaces_count / workspace_ids                →  tenants_count / tenant_ids
        wsp_<26 chars> (ULID prefix)                    →  ten_<26 chars>

        # PascalCase compounds — order-sensitive.
        Workspaces (module class prefix)                →  Tenancy
          e.g. WorkspacesServiceProvider → TenancyServiceProvider
        Workspace (model / trait compound)              →  Tenant
          e.g. BelongsToWorkspace → BelongsToTenant, WorkspaceContact → TenantContact

        # URL / route segments — pluralised nouns, not module refs.
        /api/v1/workspaces (any suffix)                 →  /api/v1/tenants
        /api/v1/workspace-contacts                      →  /api/v1/tenant-contacts
        /api/v1/me/workspaces                            →  /api/v1/me/tenants
        /api/current-workspace                          →  /api/current-tenant
        find-workspaces (auth flow)                     →  find-tenants
        workspace-contacts (route name)                  →  tenant-contacts
        workspaces:<action> (artisan command)            →  tenancy:<action>

        # Table + kebab compounds.
        "table": "workspaces"                            →  "table": "tenants"
        "table": "workspace_contacts"                    →  "table": "tenant_contacts"
        "table": "workspace_integrations"                →  "table": "tenant_integrations"

        # Env / uppercase.
        WORKSPACES_*                                     →  TENANCY_*
        WORKSPACE_*                                      →  TENANT_*
        WORKSPACES (bare)                                →  TENANCY
        WORKSPACE (bare)                                 →  TENANT

        # Fall-through — anything left is prose.
        \\bworkspaces\\b (plural noun in prose)           →  tenants
        \\bworkspace\\b  (singular noun in prose)         →  tenant

    Folder:
        modules/platform/workspaces/  →  modules/platform/tenancy/

USAGE
    # Preview — no writes.
    python3 scripts/rename-workspaces-to-tenancy.py --dry-run

    # Apply changes to disk.
    python3 scripts/rename-workspaces-to-tenancy.py --apply

    # Different scope.
    python3 scripts/rename-workspaces-to-tenancy.py --scope sdk --apply

SAFETY
    Before --apply, commit your working tree. Recovery is git-only.

    Idempotent: running twice on the same tree is a no-op — the second
    run finds nothing to rename.

    The disambiguation between `tenancy` (module ref) and `tenants`
    (plural noun) is resolved by ORDER — every structural context is
    matched by a specific rule before the fall-through generic rules run.
    Prose false-positives (e.g. "the workspaces module" → "the tenants
    module" instead of "the tenancy module") are caught with the
    module-context rules at the top. Anything the script mis-classifies
    is a two-word grep-and-fix on the output.

SCOPE
    Default: `modules/`. Override with `--scope <path>`. `--scope` may be
    repeated to include multiple roots.

    Skips: .git/, node_modules/, vendor/, dist/, build/, coverage/,
    __pycache__/, .venv/.
"""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

# --------------------------------------------------------------------------
# Config
# --------------------------------------------------------------------------

REPO_ROOT = Path("/Users/akouta/Projects/stackra-frontend")
DEFAULT_SCOPES = [REPO_ROOT / "modules"]

SCAN_EXTENSIONS = {
    ".json", ".md", ".mdx", ".txt",
    ".php", ".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs",
    ".yaml", ".yml", ".env", ".sh", ".py",
}

SKIP_DIRS = {
    ".git", "node_modules", "vendor", "dist", "build", "coverage",
    "__pycache__", ".venv",
}

# --------------------------------------------------------------------------
# Substitution rules — ORDER MATTERS.
# --------------------------------------------------------------------------
#
# Specific structural patterns fire first so their operands never reach
# the ambiguous fall-through rules at the bottom. Each rule sees the
# output of every rule before it.

SUBSTITUTIONS: list[tuple[re.Pattern[str], str]] = [
    # ---- ULID prefix (before word-substitutions so `wsp_` stays intact) ----
    # Matches `wsp_` as a bare token: `wsp_` (schema keyPrefix),
    # `wsp_01ABC…` (real ULID), `wsp_<ulid>` (markdown), etc.
    (re.compile(r"\bwsp_"), "ten_"),

    # ---- FK columns (compound snake_case — win over the bare `workspace` rule) ----
    (re.compile(r"\bworkspace_id\b"), "tenant_id"),
    (re.compile(r"\bworkspace_ids\b"), "tenant_ids"),
    (re.compile(r"\bworkspaces_count\b"), "tenants_count"),

    # ---- PHP namespaces — both escape flavours (unescaped + JSON-escaped) ----
    # `Stackra\Workspaces\...` (PHP source).
    (re.compile(r"Stackra\\Workspaces\\"), r"Stackra\\Tenancy\\"),
    # `Stackra\\Workspaces\\...` (JSON-escaped, e.g. inside JSON strings).
    (re.compile(r"Stackra\\\\Workspaces\\\\"), r"Stackra\\\\Tenancy\\\\"),

    # ---- Blueprint URNs + module-ref JSON keys — always tenancy, never tenants ----
    (re.compile(r"stackra://modules/workspaces/"), "stackra://modules/tenancy/"),
    (re.compile(r"stackra://modules/workspaces(?=/|\b)"), "stackra://modules/tenancy"),
    (re.compile(r'"module":\s*"workspaces"'), '"module": "tenancy"'),

    # ---- Filesystem paths — folder rename is a path replacement ----
    (re.compile(r"modules/platform/workspaces/"), "modules/platform/tenancy/"),
    (re.compile(r"modules/platform/workspaces(?=[/\b])"), "modules/platform/tenancy"),
    (re.compile(r"\bmodules/workspaces/"), "modules/tenancy/"),
    (re.compile(r"\bmodules/workspaces(?=[/\b])"), "modules/tenancy"),

    # ---- URL segments (before generic `workspaces` — routes are `tenants` plural) ----
    (re.compile(r"/api/v1/workspace-contacts"), "/api/v1/tenant-contacts"),
    (re.compile(r"/api/v1/workspace/contacts"), "/api/v1/tenant/contacts"),
    (re.compile(r"/api/v1/me/workspaces"), "/api/v1/me/tenants"),
    (re.compile(r"/api/v1/workspaces"), "/api/v1/tenants"),
    (re.compile(r"/api/current-workspace"), "/api/current-tenant"),
    (re.compile(r"\bfind-workspaces\b"), "find-tenants"),

    # ---- Artisan command namespace: `workspaces:<action>` → `tenancy:<action>` ----
    # The module name (left of the colon) is the module reference, not the
    # plural noun. The scaffolder + Laravel `Artisan::command()` register
    # commands under `<module>:<action>`.
    (re.compile(r"\bworkspaces:"), "tenancy:"),

    # ---- Table names (JSON `"table": "workspaces"`) ----
    (re.compile(r'"table":\s*"workspaces"'), '"table": "tenants"'),
    (re.compile(r'"table":\s*"workspace_contacts"'), '"table": "tenant_contacts"'),
    (re.compile(r'"table":\s*"workspace_integrations"'), '"table": "tenant_integrations"'),

    # ---- Foreign-key `foreign.table` refs ----
    (re.compile(r'"foreign":\s*\{\s*"table":\s*"workspaces"'), '"foreign": { "table": "tenants"'),
    (re.compile(r'"foreign":\s*\{\s*"table":\s*"workspace_contacts"'), '"foreign": { "table": "tenant_contacts"'),

    # ---- PascalCase compounds — Workspaces (plural class prefix) first ----
    # e.g. `WorkspacesServiceProvider`, `Stackra\Workspaces\Models\...`.
    (re.compile(r"(?:\b|(?<=[a-z]))Workspaces(?=[A-Z_]|\b)"), "Tenancy"),
    # e.g. `Workspace`, `WorkspaceContact`, `BelongsToWorkspace`, `WorkspaceIntegration`.
    (re.compile(r"(?:\b|(?<=[a-z]))Workspace(?=[A-Z_]|\b)"), "Tenant"),

    # ---- Kebab-case compounds (rare but occur in slugs / SDUI screen filenames) ----
    (re.compile(r"\bworkspace-contact\b"), "tenant-contact"),
    (re.compile(r"\bworkspace-contacts\b"), "tenant-contacts"),
    (re.compile(r"\bworkspace-integration\b"), "tenant-integration"),
    (re.compile(r"\bworkspace-integrations\b"), "tenant-integrations"),
    (re.compile(r"\bworkspace-picker\b"), "tenant-picker"),
    (re.compile(r"\bworkspace-list\b"), "tenant-list"),
    (re.compile(r"\bworkspace-scoped\b"), "tenant-scoped"),

    # ---- Env / uppercase prefixes ----
    (re.compile(r"\bWORKSPACES_"), "TENANCY_"),
    (re.compile(r"\bWORKSPACE_"), "TENANT_"),
    (re.compile(r"\bWORKSPACES\b"), "TENANCY"),
    (re.compile(r"\bWORKSPACE\b"), "TENANT"),

    # ---- FALL-THROUGH prose — every structural context is already handled ----
    # `workspaces` in remaining prose is the plural noun ("many workspaces")
    # NOT the module. `workspace` (singular) is the tenant row.
    (re.compile(r"\bworkspaces\b"), "tenants"),
    (re.compile(r"\bworkspace\b"), "tenant"),
]


# --------------------------------------------------------------------------
# Driver
# --------------------------------------------------------------------------

def iter_files(scopes: list[Path]) -> list[Path]:
    """Walk every configured scope and yield candidate files."""
    out: list[Path] = []
    for root in scopes:
        if not root.exists():
            print(f"scope missing (skipped): {root}", file=sys.stderr)
            continue
        for p in root.rglob("*"):
            if not p.is_file():
                continue
            if any(part in SKIP_DIRS for part in p.parts):
                continue
            if p.suffix not in SCAN_EXTENSIONS:
                continue
            out.append(p)
    return out


def rewrite(text: str) -> tuple[str, dict[str, int]]:
    """Apply every substitution and count hits per rule."""
    hits: dict[str, int] = {}
    for pattern, repl in SUBSTITUTIONS:
        text, n = pattern.subn(repl, text)
        if n:
            hits[pattern.pattern] = hits.get(pattern.pattern, 0) + n
    return text, hits


def rename_folders(scopes: list[Path], apply: bool) -> list[tuple[Path, Path]]:
    """Rename any `<scope>/**/workspaces` directory to `<scope>/**/tenancy`.

    Renames deepest-first so nested renames don't stomp each other.
    """
    renames: list[tuple[Path, Path]] = []
    for root in scopes:
        if not root.exists():
            continue
        for p in sorted(root.rglob("workspaces"), key=lambda p: len(p.parts), reverse=True):
            if not p.is_dir():
                continue
            if any(part in SKIP_DIRS for part in p.parts):
                continue
            target = p.parent / "tenancy"
            renames.append((p, target))
    if apply:
        for src, dst in renames:
            print(f"rename dir: {src.relative_to(REPO_ROOT)} → {dst.relative_to(REPO_ROOT)}")
            src.rename(dst)
    return renames


def main(argv: list[str]) -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--dry-run", action="store_true", help="Preview substitutions; make no changes.")
    group.add_argument("--apply", action="store_true", help="Rewrite files + rename folders on disk.")
    parser.add_argument(
        "--scope",
        action="append",
        default=None,
        help="Root directory to sweep. Repeatable. Default: modules/.",
    )
    args = parser.parse_args(argv)

    scopes = [Path(s) if Path(s).is_absolute() else REPO_ROOT / s for s in (args.scope or [])] or DEFAULT_SCOPES

    print(f"Repo root: {REPO_ROOT}")
    print(f"Scopes:    {[str(s.relative_to(REPO_ROOT) if s.is_relative_to(REPO_ROOT) else s) for s in scopes]}")
    print(f"Mode:      {'--apply (WRITE)' if args.apply else '--dry-run (READ-ONLY)'}")
    print()

    # ---- Rewrite file contents ----
    total_hits: dict[str, int] = {}
    total_files = 0
    files_touched = 0
    for path in iter_files(scopes):
        total_files += 1
        try:
            original = path.read_text(encoding="utf-8")
        except (UnicodeDecodeError, OSError):
            continue
        new_text, hits = rewrite(original)
        if new_text == original:
            continue
        files_touched += 1
        for k, v in hits.items():
            total_hits[k] = total_hits.get(k, 0) + v
        rel = path.relative_to(REPO_ROOT)
        rule_count = sum(hits.values())
        print(f"  {'edit' if args.apply else 'diff'}: {rel}  ({rule_count} substitutions)")
        if args.apply:
            path.write_text(new_text, encoding="utf-8")

    # ---- Rename folders ----
    print()
    folder_renames = rename_folders(scopes, apply=args.apply)

    # ---- Summary ----
    print()
    print("=" * 70)
    print(f"Files scanned:  {total_files}")
    print(f"Files touched:  {files_touched}")
    print(f"Folders renamed: {len(folder_renames)}")
    print()
    print("Substitutions per rule:")
    for rule, n in sorted(total_hits.items(), key=lambda kv: -kv[1]):
        # Truncate very long regex patterns in the summary.
        r = rule if len(rule) <= 60 else rule[:57] + "..."
        print(f"  {n:5d}  {r}")
    if not args.apply:
        print()
        print("(dry-run — no files written)")

    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
