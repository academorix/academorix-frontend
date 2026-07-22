#!/usr/bin/env python3
"""
Sweep script for the second SDK cut — apps/academorix/src/sdks/*.

Motivated by the 6-service-split follow-up (2026-07-21):

    Every academorix-<domain>/<name>-sdk composer package under
    apps/academorix/src/sdks/ is deleted. Under ADR-0032 (Option B, six
    services), academorix-api is the SOLE reader + writer of every one of
    these domains — no other service reaches them, so the cross-service
    HTTP typing layer these SDK packages provided is redundant.

The script mirrors the first sweep (sweep-deleted-package-refs.py) but
targets a different set of composer names + a different deleted root:

    * DELETED_NAMES   — every academorix-*/*-sdk composer name (26 entries)
    * DELETED_ROOT    — apps/academorix/src/sdks/

Each downstream composer.json under apps/academorix/src/modules/<domain>/<name>/
declares a require + a repositories path-repo entry pointing at its SDK
sibling. This sweep removes both.

Output: one summary block per touched composer.json.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Any

# ---------------------------------------------------------------------------
# Workspace layout
# ---------------------------------------------------------------------------

WORKSPACE = Path("/Users/akouta/Projects/academorix-frontend")

# The 26 SDK composer names being deleted. Collected verbatim from
# `find apps/academorix/src/sdks -name composer.json -exec head -3 {} \;`
# on 2026-07-21 before deletion.
DELETED_NAMES: frozenset[str] = frozenset(
    {
        "academorix-finance/digital-passes-sdk",
        "academorix-finance/expenses-sdk",
        "academorix-identity/people-sdk",
        "academorix-notifications/announcements-sdk",
        "academorix-platform/admin-console-sdk",
        "academorix-platform/ai-sdk",
        "academorix-platform/application-sdk",
        "academorix-platform/credentials-sdk",
        "academorix-platform/forms-sdk",
        "academorix-platform/integrations-sdk",
        "academorix-platform/public-site-sdk",
        "academorix-platform/realtime-sdk",
        "academorix-platform/reception-sdk",
        "academorix-platform/reporting-sdk",
        "academorix-platform/safeguarding-sdk",
        "academorix-sports/awards-sdk",
        "academorix-sports/competition-sdk",
        "academorix-sports/development-sdk",
        "academorix-sports/drills-sdk",
        "academorix-sports/formations-sdk",
        "academorix-sports/medical-sdk",
        "academorix-sports/performance-sdk",
        "academorix-sports/private-sessions-sdk",
        "academorix-sports/progress-sdk",
        "academorix-sports/registrations-sdk",
        "academorix-sports/season-sdk",
    }
)

# The absolute path of the deleted tree — resolved once so we can prune
# every `repositories[].url` that resolves inside it.
DELETED_ABS_ROOTS: tuple[str, ...] = (
    str((WORKSPACE / "apps" / "academorix" / "src" / "sdks").resolve()),
)

# Directories the sweep never descends into (irrelevant / huge / non-composer).
SKIP_DIR_NAMES = {".git", ".turbo", "vendor", "node_modules", ".doppler", "dist"}


# ---------------------------------------------------------------------------
# Sweep implementation
# ---------------------------------------------------------------------------


def find_composer_files(root: Path) -> list[Path]:
    """Walk `root` yielding every composer.json outside SKIP_DIR_NAMES."""
    out: list[Path] = []
    for path in root.rglob("composer.json"):
        if any(part in SKIP_DIR_NAMES for part in path.parts):
            continue
        out.append(path)
    return sorted(out)


def strip_requires(block: dict[str, str] | None) -> tuple[dict[str, str] | None, list[str]]:
    """Drop keys from a require / require-dev block that match DELETED_NAMES."""
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
    """Drop path-repo entries whose `url` resolves inside DELETED_ABS_ROOTS."""
    if not repos:
        return repos, []
    removed: list[str] = []
    kept: list[Any] = []
    for entry in repos:
        if not isinstance(entry, dict) or entry.get("type") != "path":
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
    """Sanitise one composer.json in place. Returns a per-file report dict."""
    text = path.read_text(encoding="utf-8")
    try:
        data = json.loads(text)
    except json.JSONDecodeError as exc:
        return {"path": str(path), "error": f"json decode: {exc}"}

    composer_dir = path.parent

    require_after, removed_require = strip_requires(data.get("require"))
    require_dev_after, removed_require_dev = strip_requires(data.get("require-dev"))
    repos_after, removed_repos = strip_repositories(data.get("repositories"), composer_dir)

    if not (removed_require or removed_require_dev or removed_repos):
        return {"path": str(path), "changed": False}

    if require_after is not None:
        data["require"] = require_after
    if require_dev_after is not None:
        data["require-dev"] = require_dev_after
    if repos_after is not None:
        data["repositories"] = repos_after

    dumped = json.dumps(data, indent=2, ensure_ascii=False)
    if text.endswith("\n"):
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
    reports = [sweep_file(p) for p in files]

    touched = [r for r in reports if r.get("changed")]
    errored = [r for r in reports if "error" in r]

    print("=== Sweep summary — apps/academorix/src/sdks/ ===")
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
