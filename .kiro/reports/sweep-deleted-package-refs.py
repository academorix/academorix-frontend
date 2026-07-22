#!/usr/bin/env python3
"""
Sweep every composer.json in the workspace and strip requires + path-repos
that target deleted packages.

Motivated by the 6-service-split cut (2026-07-21):
  * Delete `packages/sdk/**`               — 10 SDK packages
  * Delete `packages/backend/sdk/**`       —  8 SDK packages (dupes/superset)
  * Delete `packages/backend/shared/audit`      — superseded by observability/audit
  * Delete `packages/backend/shared/activity`   — superseded by observability/activity
  * Delete `packages/backend/shared/telemetry`  — overlaps telemetry/*

Every downstream composer.json that referenced any of those must lose:
  1. The corresponding `require` / `require-dev` entry.
  2. The corresponding `repositories` path-repo entry whose `url` points
     inside one of the deleted trees.

Output: one summary block per touched composer.json.
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path
from typing import Any

WORKSPACE = Path("/Users/akouta/Projects/academorix-frontend")

# Composer names to strip from require / require-dev everywhere.
DELETED_NAMES = frozenset(
    {
        # SDKs
        "stackra/access-sdk",
        "stackra/api-sdk",
        "stackra/billing-sdk",
        "stackra/compliance-sdk",
        "stackra/identity-sdk",
        "stackra/notifications-sdk",
        "stackra/platform-sdk",
        "stackra-notifications/messaging-sdk",
        "stackra-platform/application-sdk",
        "stackra-shared/attributes-sdk",
        "stackra-shared/offline-sync-sdk",
        # Redundant shared/* packages
        "stackra/audit",       # was packages/backend/shared/audit
        "stackra/activity",    # was packages/backend/shared/activity
        "stackra/telemetry",   # was packages/backend/shared/telemetry
    }
)

# Path prefixes under which a deleted package used to live. A `repositories[].url`
# ending inside any of these directories is orphaned and must go.
#
# All the entries below are RELATIVE (composer.json's `repositories.url` field
# is relative to the composer.json's own directory) so we can't hard-match
# absolute paths — we compare the resolved absolute path instead.
DELETED_ABS_ROOTS = tuple(
    str((WORKSPACE / rel).resolve())
    for rel in (
        "packages/sdk",
        "packages/backend/sdk",
        "packages/backend/shared/audit",
        "packages/backend/shared/activity",
        "packages/backend/shared/telemetry",
    )
)

# Directories the sweep must NEVER descend into (irrelevant / huge / non-composer).
SKIP_DIR_NAMES = {".git", ".turbo", "vendor", "node_modules", ".doppler", "dist"}


def find_composer_files(root: Path) -> list[Path]:
    """Walk `root` and yield every composer.json outside SKIP_DIR_NAMES."""
    out: list[Path] = []
    for path in root.rglob("composer.json"):
        if any(part in SKIP_DIR_NAMES for part in path.parts):
            continue
        out.append(path)
    return sorted(out)


def strip_requires(
    block: dict[str, str] | None, composer_dir: Path
) -> tuple[dict[str, str] | None, list[str]]:
    """
    Remove keys from a `require` / `require-dev` block that match DELETED_NAMES.

    Returns the mutated block (or None if the input was None) + the list of
    package names removed.
    """
    if not block:
        return block, []
    removed: list[str] = []
    kept: dict[str, str] = {}
    for name, constraint in block.items():
        if name in DELETED_NAMES:
            removed.append(name)
            continue
        kept[name] = constraint
    return kept, removed


def strip_repositories(
    repos: list[Any] | None, composer_dir: Path
) -> tuple[list[Any] | None, list[str]]:
    """
    Remove path-repo entries whose `url` resolves inside a deleted tree.

    Composer path-repo URLs are relative to the composer.json's directory. We
    resolve every entry against `composer_dir` and drop anything under one of
    DELETED_ABS_ROOTS.
    """
    if not repos:
        return repos, []
    removed: list[str] = []
    kept: list[Any] = []
    for entry in repos:
        if not isinstance(entry, dict):
            kept.append(entry)
            continue
        if entry.get("type") != "path":
            kept.append(entry)
            continue
        url = entry.get("url", "")
        if not url:
            kept.append(entry)
            continue
        resolved = str((composer_dir / url).resolve())
        if any(
            resolved == root or resolved.startswith(root + "/")
            for root in DELETED_ABS_ROOTS
        ):
            removed.append(url)
            continue
        kept.append(entry)
    return kept, removed


def sweep_file(path: Path) -> dict[str, Any]:
    """Apply the sweep to one composer.json. Returns a report dict."""
    text = path.read_text(encoding="utf-8")
    try:
        data = json.loads(text)
    except json.JSONDecodeError as exc:
        return {"path": str(path), "error": f"json decode: {exc}"}

    composer_dir = path.parent

    require_before = data.get("require")
    require_after, removed_require = strip_requires(require_before, composer_dir)

    require_dev_before = data.get("require-dev")
    require_dev_after, removed_require_dev = strip_requires(
        require_dev_before, composer_dir
    )

    repos_before = data.get("repositories")
    repos_after, removed_repos = strip_repositories(repos_before, composer_dir)

    if not (removed_require or removed_require_dev or removed_repos):
        return {"path": str(path), "changed": False}

    if require_after is not None:
        data["require"] = require_after
    if require_dev_after is not None:
        data["require-dev"] = require_dev_after
    if repos_after is not None:
        data["repositories"] = repos_after

    # Preserve the file's existing indent style (2 spaces is the workspace default).
    #   Detect trailing newline; Composer style uses trailing newline.
    trailing_newline = text.endswith("\n")
    dumped = json.dumps(data, indent=2, ensure_ascii=False)
    if trailing_newline:
        dumped += "\n"
    path.write_text(dumped, encoding="utf-8")

    return {
        "path": str(path),
        "changed": True,
        "removed_require": removed_require,
        "removed_require_dev": removed_require_dev,
        "removed_repositories": removed_repos,
    }


def main() -> int:
    files = find_composer_files(WORKSPACE)
    reports: list[dict[str, Any]] = []
    for path in files:
        reports.append(sweep_file(path))

    touched = [r for r in reports if r.get("changed")]
    errored = [r for r in reports if "error" in r]

    print(f"=== Sweep summary ===")
    print(f"Scanned composer.json files : {len(files)}")
    print(f"Files mutated               : {len(touched)}")
    print(f"Files with parse errors     : {len(errored)}")
    print()

    for report in errored:
        print(f"[ERROR] {report['path']}: {report['error']}")

    for report in touched:
        rel = str(Path(report["path"]).relative_to(WORKSPACE))
        print(f"--- {rel}")
        for name in report["removed_require"]:
            print(f"    - require       -> {name}")
        for name in report["removed_require_dev"]:
            print(f"    - require-dev   -> {name}")
        for url in report["removed_repositories"]:
            print(f"    - repositories  -> {url}")
    return 0 if not errored else 1


if __name__ == "__main__":
    sys.exit(main())
