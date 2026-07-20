#!/usr/bin/env python3
"""
wire-composer-path-repos.py — Composer path-repository wiring.

Walks every `composer.json` in the workspace (excluding `vendor/`,
`node_modules/`, `tools/`), builds a canonical `name -> filesystem path`
map from every discovered package, and then for every package with
`"@dev"` (or `"dev-*@dev"`) constraints, wires a corresponding
`repositories` entry with:

    { "type": "path", "url": "<relative path>", "options": { "symlink": true } }

Composer resolves `@dev` constraints against local path repositories when
their URL points at a package that has the matching name in its
composer.json. This script keeps every `@dev` reference wired to the
right sibling package without hand-maintaining the URLs.

## What it fixes

Post-split (Stackra-core-vs-Academorix-domain), many `repositories`
entries under `packages/backend/**/composer.json` still point at pre-
split locations (e.g. `../../../framework/src/support` — which never
existed even in the old layout). This script re-derives every URL from
the real name -> path map.

## What it does NOT do

- Never invents `@dev` deps. If your composer.json doesn't declare one,
  this script leaves it alone.
- Never removes VCS / packagist / composer / artifact repositories.
  Only `type: path` entries pointing at workspace packages are managed;
  everything else is preserved.
- Never rewires deps whose target name is NOT present in the workspace.
  Reports them as `unresolved` warnings so a human can decide whether
  the target was renamed, deleted, or is external.

## Idempotency

Safe to re-run. Reports touched / skipped / unresolved counts. Exit
code 0 when clean; 1 when unresolved deps remain (surface but never
crash).

## Flags

    --dry-run       Show what would change; write nothing.
    --check         Exit 1 if any changes would be applied (CI mode).
    --verbose       Per-file logging.
    --root PATH     Workspace root (defaults to this script's parent).
"""
from __future__ import annotations

import argparse
import json
import pathlib
import re
import sys
from dataclasses import dataclass, field
from typing import Dict, List, Optional


SKIP_DIR_NAMES = {"node_modules", "vendor", "tools"}


def _closest_name(target: str, candidates: List[str], cutoff: float = 0.65) -> Optional[str]:
    """Return the closest candidate to `target` above `cutoff` similarity,
    or None. Uses SequenceMatcher on the part AFTER the vendor slash so
    `academorix/laravel-support` matches `academorix/support`.
    """
    from difflib import SequenceMatcher

    def tail(n: str) -> str:
        return n.split("/", 1)[1] if "/" in n else n

    ttail = tail(target)
    best_ratio = 0.0
    best_name: Optional[str] = None
    for c in candidates:
        r = SequenceMatcher(None, ttail, tail(c)).ratio()
        if r > best_ratio:
            best_ratio = r
            best_name = c
    return best_name if best_ratio >= cutoff else None


@dataclass(frozen=True)
class Pkg:
    """One composer.json in the workspace."""

    name: str
    path: pathlib.Path   # absolute path to the composer.json file
    dir: pathlib.Path    # absolute path to the containing directory


@dataclass
class Report:
    touched: int = 0
    skipped: int = 0
    unresolved: List[str] = field(default_factory=list)
    changes: List[str] = field(default_factory=list)


def discover_packages(root: pathlib.Path) -> Dict[str, Pkg]:
    """Return `{name: Pkg}` for every valid composer.json under `root`."""
    out: Dict[str, Pkg] = {}
    for cj in root.rglob("composer.json"):
        if any(part in SKIP_DIR_NAMES for part in cj.parts):
            continue
        try:
            data = json.loads(cj.read_text())
        except (json.JSONDecodeError, UnicodeDecodeError):
            continue
        name = data.get("name")
        if not isinstance(name, str) or "/" not in name:
            continue
        pkg = Pkg(name=name, path=cj, dir=cj.parent)
        if name in out and out[name].dir != pkg.dir:
            print(
                f"warning: duplicate package name {name!r} at "
                f"{out[name].dir.relative_to(root)} and {pkg.dir.relative_to(root)}",
                file=sys.stderr,
            )
            # Keep the first one — the alphabetical iteration order gives
            # a stable pick.
        else:
            out[name] = pkg
    return out


DEV_CONSTRAINT_RE = re.compile(r"^(@dev|dev-[^@]*(@dev)?)$")


def is_dev_constraint(value: object) -> bool:
    return isinstance(value, str) and bool(DEV_CONSTRAINT_RE.match(value))


def collect_dev_deps(data: dict) -> List[str]:
    """Return dep names in `require` / `require-dev` with @dev constraints."""
    out: List[str] = []
    for block in ("require", "require-dev"):
        deps = data.get(block, {})
        if not isinstance(deps, dict):
            continue
        for name, constraint in deps.items():
            if not isinstance(name, str):
                continue
            if "/" not in name:
                continue
            if is_dev_constraint(constraint):
                out.append(name)
    return out


def relative_from(source_dir: pathlib.Path, target_dir: pathlib.Path) -> str:
    """POSIX-style relative path from `source_dir` to `target_dir`.

    Composer requires forward slashes even on Windows.
    """
    rel = pathlib.PurePosixPath(
        *pathlib.Path(target_dir).resolve().relative_to(
            pathlib.Path(source_dir).resolve().anchor
        ).parts
    )
    # Fall through to `os.path.relpath` for the actual computation.
    import os
    rel_str = os.path.relpath(str(target_dir), start=str(source_dir))
    return rel_str.replace("\\", "/")


def is_workspace_path_repo(entry: object) -> bool:
    """True when `entry` is a `type: "path"` repositories entry."""
    return isinstance(entry, dict) and entry.get("type") == "path"


def build_desired_repos(
    package: Pkg,
    dev_deps: List[str],
    index: Dict[str, Pkg],
    unresolved: List[str],
) -> List[dict]:
    """One `{type: path, url: ..., options: {symlink: true}}` entry per
    resolvable @dev dep. Sorted by URL for stable output.
    """
    entries: List[dict] = []
    seen_urls: set[str] = set()
    for dep in sorted(dev_deps):
        target = index.get(dep)
        if target is None:
            unresolved.append(f"{package.name} -> {dep}")
            continue
        url = relative_from(package.dir, target.dir)
        if url == ".":
            continue  # self-reference — skip
        if url in seen_urls:
            continue
        seen_urls.add(url)
        entries.append(
            {
                "type": "path",
                "url": url,
                "options": {"symlink": True},
            }
        )
    return entries


def merge_repositories(
    existing: object,
    desired_path_repos: List[dict],
) -> tuple[list, bool]:
    """Return `(new_repos, changed)`.

    Strategy:
    - Keep every non-`type: path` entry from `existing` (VCS, packagist,
      composer, artifact, etc.) verbatim.
    - Replace every `type: path` entry with the newly computed set.
      Existing path entries pointing at directories that no longer have
      a matching @dev dep are dropped.
    """
    preserved: list = []
    if isinstance(existing, list):
        for entry in existing:
            if isinstance(entry, dict) and entry.get("type") != "path":
                preserved.append(entry)
    new_repos = preserved + desired_path_repos

    # Compare to detect a real change (list equality is deep for dicts).
    if isinstance(existing, list) and existing == new_repos:
        return new_repos, False
    if not isinstance(existing, list) and not new_repos:
        return new_repos, False
    return new_repos, True


def dump_json_preserving(path: pathlib.Path, data: dict, original: str) -> str:
    """Serialize `data` matching `original`'s indent + trailing newline."""
    indent = 2  # composer default is 4, but this workspace uses 2 everywhere
    # Sniff the original indent.
    for line in original.splitlines():
        stripped = line.lstrip(" ")
        leading = len(line) - len(stripped)
        if 0 < leading and stripped:
            indent = leading
            break
    body = json.dumps(data, indent=indent, ensure_ascii=False)
    if original.endswith("\n"):
        body += "\n"
    return body


def process(
    pkg: Pkg,
    index: Dict[str, Pkg],
    report: Report,
    dry_run: bool,
    verbose: bool,
) -> bool:
    """Return True when the file was (or would be) changed."""
    original = pkg.path.read_text()
    try:
        data = json.loads(original)
    except json.JSONDecodeError as exc:
        print(f"parse-error: {pkg.path}: {exc}", file=sys.stderr)
        return False
    if not isinstance(data, dict):
        return False

    dev_deps = collect_dev_deps(data)
    desired = build_desired_repos(pkg, dev_deps, index, report.unresolved)
    existing = data.get("repositories")

    new_repos, changed = merge_repositories(existing, desired)

    if not changed:
        report.skipped += 1
        if verbose:
            print(f"  ok   {pkg.name} ({len(dev_deps)} dev deps)")
        return False

    if new_repos:
        data["repositories"] = new_repos
    else:
        data.pop("repositories", None)

    diff_line = (
        f"  fix  {pkg.name}: "
        f"{len(existing) if isinstance(existing, list) else 0} -> "
        f"{len(new_repos)} repo entries "
        f"({len(desired)} path, "
        f"{len([e for e in new_repos if not is_workspace_path_repo(e)])} non-path)"
    )
    report.changes.append(diff_line)
    if verbose:
        print(diff_line)

    if not dry_run:
        pkg.path.write_text(dump_json_preserving(pkg.path, data, original))
    report.touched += 1
    return True


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0] if __doc__ else None)
    parser.add_argument("--dry-run", action="store_true", help="Report only; write nothing.")
    parser.add_argument("--check", action="store_true", help="Exit 1 if changes would be made.")
    parser.add_argument("--verbose", "-v", action="store_true", help="Per-file logging.")
    parser.add_argument(
        "--root",
        default=str(pathlib.Path(__file__).resolve().parent.parent),
        help="Workspace root (defaults to script parent).",
    )
    args = parser.parse_args()

    root = pathlib.Path(args.root).resolve()
    if not root.is_dir():
        print(f"error: root {root} is not a directory", file=sys.stderr)
        return 1

    dry_run = args.dry_run or args.check
    verbose = args.verbose

    print(f"scanning {root}")
    index = discover_packages(root)
    print(f"discovered {len(index)} packages")

    report = Report()
    for name in sorted(index):
        process(index[name], index, report, dry_run=dry_run, verbose=verbose)

    print("")
    print(f"touched:    {report.touched}")
    print(f"skipped:    {report.skipped}")
    print(f"unresolved: {len(report.unresolved)}")

    if report.unresolved:
        print("")
        print("unresolved @dev deps (target name not found in workspace):")
        # Best-effort similar-name hint so a human can spot rename typos.
        # We compare only after the '/' — most typos are in the package
        # name part, not the vendor namespace.
        candidate_names = sorted(index.keys())
        for entry in report.unresolved[:40]:
            source, arrow, target = entry.partition(" -> ")
            hint = _closest_name(target, candidate_names)
            hint_suffix = f"   (did you mean {hint!r}?)" if hint else ""
            print(f"  - {entry}{hint_suffix}")
        if len(report.unresolved) > 40:
            print(f"  ... and {len(report.unresolved) - 40} more")

    if args.check and report.touched:
        print("")
        print("--check: changes are needed. Re-run without --check to apply.")
        return 1

    return 0


if __name__ == "__main__":
    sys.exit(main())
