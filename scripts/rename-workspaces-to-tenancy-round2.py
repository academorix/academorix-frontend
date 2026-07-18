#!/usr/bin/env python3
"""Second-pass rename — snake_case + camelCase compounds the first pass missed.

The initial script only mapped bare `\\bworkspace\\b` / `\\bworkspaces\\b` and a
handful of specific `_id` / `_count` / `_ids` compounds. It missed:

    workspace_url, workspace_slug, workspace_domains, workspace_branding,
    workspace_contacts, workspace_integrations, workspace_notifications,
    workspace_privacy, workspace_lifecycle_*, workspace_directory_*,
    workspace_danger_zone, workspace_admins, workspace_scope_match,
    workspace_admin_only, workspace_provisioned, workspace_suspended,
    workspace_resumed, workspace_archived, workspace_erased,
    workspace_business_type_selected, workspace_picker_viewed,
    workspace_selected, workspace_count, workspace_owner_signed_in_first_time,
    workspace_logo, workspace_per_day, workspace_override, workspace_defaults,
    workspace_send_stats, workspace_mismatch, workspace_not_found,
    workspace_locales, has_workspace_override,

    ... plus every `_workspace` at the end of a snake_case token
    (index / entitlement / metric / route / broadcast / event / error names),

    ... plus every camelCase `workspaceId` / `workspaceSlug` / etc.,

    ... plus every PascalCase `_Workspace` inside a namespace already renamed
    (rare, but check).

This script sweeps all of them. Special-case: `google_workspace` (Google's
product) is preserved. Idempotent.
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

REPO_ROOT = Path("/Users/akouta/Projects/academorix-frontend")
SCAN_EXTENSIONS = {
    ".json", ".md", ".mdx", ".txt",
    ".php", ".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs",
    ".yaml", ".yml", ".env", ".sh", ".py",
}
SKIP_DIRS = {".git", "node_modules", "vendor", "dist", "build", "coverage", "__pycache__", ".venv"}

# Placeholder used to preserve `google_workspace` (Google product name)
# across the substitution passes. Guaranteed not to collide with any
# real content in the tree.
GOOGLE_PLACEHOLDER = "\x00GOOGLE_WORKSPACE_KEEP\x00"

SUBSTITUTIONS: list[tuple[re.Pattern[str], str]] = [
    # ---- 0. Preserve google_workspace (Google's product name) ----
    (re.compile(r"\bgoogle_workspace\b"), GOOGLE_PLACEHOLDER),

    # ---- 1. camelCase compounds (lowercase-first, capital after) ----
    # `workspaceId`, `workspaceSlug`, `workspaceBrandingPreview`,
    # `workspaceSendStats`, `workspaceSettings`, etc.
    (re.compile(r"\bworkspaces(?=[A-Z])"), "tenants"),
    (re.compile(r"\bworkspace(?=[A-Z])"), "tenant"),

    # ---- 2. snake_case compounds — plural + singular ----
    # `workspace_id`, `workspaces_count`, `manage_workspaces`, `view_workspaces`,
    # `workspace_url`, `workspace_slug`, `_workspace_time_idx`, etc.
    #
    # Match `workspace(s)?` that is FOLLOWED by `_` OR preceded by `_`, so it
    # only fires inside a snake_case compound. `\b` alone doesn't work because
    # underscore is a word char in regex, so `\bworkspace\b` never fires
    # against `workspace_id` — we need the explicit `_` lookaround.
    (re.compile(r"\bworkspaces(?=_[a-z])"), "tenants"),
    (re.compile(r"\bworkspace(?=_[a-z])"), "tenant"),
    (re.compile(r"(?<=[a-z0-9])_workspaces(?![a-z_])"), "_tenants"),
    (re.compile(r"(?<=[a-z0-9])_workspace(?![a-z_])"), "_tenant"),
    (re.compile(r"(?<=[a-z0-9])_workspaces(?=_[a-z])"), "_tenants"),
    (re.compile(r"(?<=[a-z0-9])_workspace(?=_[a-z])"), "_tenant"),

    # ---- 3. kebab-case compounds ----
    # `workspace-picker` / `workspace-list` / `-workspace-` chunks.
    (re.compile(r"\bworkspaces(?=-[a-z])"), "tenants"),
    (re.compile(r"\bworkspace(?=-[a-z])"), "tenant"),
    (re.compile(r"(?<=[a-z0-9])-workspaces(?![a-z\-])"), "-tenants"),
    (re.compile(r"(?<=[a-z0-9])-workspace(?![a-z\-])"), "-tenant"),

    # ---- 4. PascalCase (redundant belt-and-suspenders — round 1 caught these) ----
    (re.compile(r"(?:\b|(?<=[a-z]))Workspaces(?=[A-Z_]|\b)"), "Tenancy"),
    (re.compile(r"(?:\b|(?<=[a-z]))Workspace(?=[A-Z_]|\b)"), "Tenant"),

    # ---- 5. Uppercase compounds ----
    # `WORKSPACES_ENABLED`, `LIMIT_WORKSPACE_DAY`, `TENANCY_CROSS_WORKSPACE_ACCESS`
    (re.compile(r"\bWORKSPACES(?=_)"), "TENANTS"),
    (re.compile(r"\bWORKSPACE(?=_)"), "TENANT"),
    (re.compile(r"(?<=[A-Z0-9])_WORKSPACES\b"), "_TENANTS"),
    (re.compile(r"(?<=[A-Z0-9])_WORKSPACE\b"), "_TENANT"),
    (re.compile(r"(?<=[A-Z0-9])_WORKSPACES(?=_)"), "_TENANTS"),
    (re.compile(r"(?<=[A-Z0-9])_WORKSPACE(?=_)"), "_TENANT"),
    (re.compile(r"\bWORKSPACES\b"), "TENANTS"),
    (re.compile(r"\bWORKSPACE\b"), "TENANT"),

    # ---- 6. Bare words (last-resort — mostly cleaned by round 1) ----
    (re.compile(r"\bworkspaces\b"), "tenants"),
    (re.compile(r"\bworkspace\b"), "tenant"),

    # ---- 7. Restore google_workspace ----
    (re.compile(re.escape(GOOGLE_PLACEHOLDER)), "google_workspace"),
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

    print(f"Files scanned:  {files_scanned}")
    print(f"Files touched:  {files_touched}")
    print("Substitutions per rule:")
    for rule, n in sorted(total_hits.items(), key=lambda kv: -kv[1]):
        r = rule if len(rule) <= 60 else rule[:57] + "..."
        print(f"  {n:5d}  {r}")

    return 0


if __name__ == "__main__":
    sys.exit(main())
