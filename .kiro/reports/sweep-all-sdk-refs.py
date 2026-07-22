#!/usr/bin/env python3
"""
Broad sweep — strip every `*-sdk` require + path-repo across the workspace.

Motivation:

    The two previous sweep scripts (`sweep-deleted-package-refs.py` and
    `sweep-academorix-sdks.py`) targeted specific composer names. But
    the SDK deletion cut affects EVERY `-sdk` package — the framework
    packages under packages/backend/** each internally require an SDK
    sibling that no longer exists on disk.

    Docker compose smoke-build revealed 62 unique orphaned `-sdk`
    requires across the workspace. Rather than enumerate them one by
    one, this sweep matches ANY require whose key ends in `-sdk` OR
    any path-repo whose url path contains `-sdk`.

## Scope

Removes from every composer.json in the workspace:

  * `require[<name>]`         where `<name>` ends in `-sdk`.
  * `require-dev[<name>]`     where `<name>` ends in `-sdk`.
  * `repositories[].url`      where the resolved absolute path
                              contains `/sdk/` or a segment matching
                              `*-sdk`.

## Safety

- Skips vendor/, node_modules/, .git/, dist/ trees.
- Preserves file JSON formatting (2-space indent, trailing newline
  when the source had one).
- Logs every mutation so the diff is auditable.

## After running

Every service's `composer install` should resolve without missing-
package errors related to `*-sdk`. Downstream feature code that
imported from an SDK still needs its `use` statements rewritten — the
Composer sweep is the necessary FIRST step, not the whole story.
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path
from typing import Any

WORKSPACE = Path("/Users/akouta/Projects/academorix-frontend")

# Directories the sweep never enters.
SKIP_DIR_NAMES = frozenset(
    {".git", ".turbo", "vendor", "node_modules", ".doppler", "dist"}
)

# A require key is a candidate for removal when its name ends in `-sdk`
# after the vendor/name split. Match on the full name (`vendor/name`).
RE_SDK_NAME = re.compile(r"-sdk$")

# A path-repo url points at a deleted SDK tree when the URL, resolved
# absolute, matches ONE OF:
#   * ends in `-sdk`
#   * contains a segment matching `/sdk/` (e.g. packages/sdk/,
#     packages/backend/sdk/) — belt-and-braces since those trees are
#     already gone but a stale composer.json may still reference them.
RE_SDK_URL_TAIL = re.compile(r"-sdk$")


def find_composer_files(root: Path) -> list[Path]:
    """Every composer.json outside SKIP_DIR_NAMES."""
    out: list[Path] = []
    for path in root.rglob("composer.json"):
        if any(part in SKIP_DIR_NAMES for part in path.parts):
            continue
        out.append(path)
    return sorted(out)


def strip_requires(block: dict[str, str] | None) -> tuple[dict[str, str] | None, list[str]]:
    if not block:
        return block, []
    removed: list[str] = []
    kept: dict[str, str] = {}
    for name, constraint in block.items():
        if RE_SDK_NAME.search(name):
            removed.append(name)
            continue
        kept[name] = constraint
    return kept, removed


def strip_repositories(
    repos: list[Any] | None,
    composer_dir: Path,
) -> tuple[list[Any] | None, list[str]]:
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

        # Two conditions for removal:
        #   1. URL tail ends in `-sdk`.
        #   2. Resolved absolute path is under `packages/sdk/` OR
        #      `packages/backend/sdk/` OR `apps/academorix/src/sdks/`.
        tail_match = RE_SDK_URL_TAIL.search(url.rstrip("/"))
        resolved = str((composer_dir / url).resolve())
        inside_deleted_tree = any(
            root in resolved
            for root in (
                str((WORKSPACE / "packages" / "sdk").resolve()),
                str((WORKSPACE / "packages" / "backend" / "sdk").resolve()),
                str((WORKSPACE / "apps" / "academorix" / "src" / "sdks").resolve()),
            )
        )

        if tail_match or inside_deleted_tree:
            removed.append(url)
            continue
        kept.append(entry)
    return kept, removed


def sweep_file(path: Path) -> dict[str, Any]:
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

    print("=== Broad SDK sweep ===")
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
