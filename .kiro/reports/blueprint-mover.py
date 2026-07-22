#!/usr/bin/env python3
"""
Move every backend package's blueprint from the top-level
``blueprints/`` tree into that package's own folder under
``blueprint/`` (singular).

Source shape:  blueprints/<domain>/<module>/
Target shape:  packages/backend/<domain>/<module>/blueprint/

After every move, if the top-level ``blueprints/`` tree is left
empty (except for the top-level ``README.md``), delete it wholesale.

Behaviour:
  * If the target package exists but ``blueprint/`` already has
    content, skip and log — do NOT overwrite.
  * If the target package does not exist, log the drift + skip.
  * If the source module has content, copy the whole subtree
    (via ``shutil.copytree`` with ``dirs_exist_ok=False``) then
    remove the source subtree.
  * Preserve every file (including ``.md`` + hidden files).

Dry-run mode: pass ``--check`` to log the mapping without moving.
"""

from __future__ import annotations

import shutil
import sys
from pathlib import Path

ROOT = Path("/Users/akouta/Projects/academorix-frontend")
SRC_ROOT = ROOT / "blueprints"
DST_ROOT = ROOT / "packages" / "backend"


def enumerate_sources() -> list[Path]:
    """Return every ``blueprints/<domain>/blueprints/<module>/`` folder.

    The tree is:
      blueprints/<domain>/README.md          (domain-level readme, kept)
      blueprints/<domain>/blueprints/<module>/  (the actual blueprint payload)
    """
    out: list[Path] = []
    if not SRC_ROOT.is_dir():
        return out
    for domain in sorted(SRC_ROOT.iterdir()):
        if not domain.is_dir():
            continue
        inner = domain / "blueprints"
        if not inner.is_dir():
            continue
        for module in sorted(inner.iterdir()):
            if not module.is_dir():
                continue
            out.append(module)
    return out


def target_for(source: Path) -> Path:
    """Compute ``packages/backend/<domain>/<module>/blueprint/``.

    Source is ``blueprints/<domain>/blueprints/<module>/``; strip
    the middle ``blueprints/`` segment.
    """
    parts = source.relative_to(SRC_ROOT).parts  # (<domain>, "blueprints", <module>)
    if len(parts) != 3 or parts[1] != "blueprints":
        raise RuntimeError(f"unexpected source shape: {source}")
    domain, _, module = parts
    return DST_ROOT / domain / module / "blueprint"


def main(argv: list[str]) -> int:
    check_only = "--check" in argv

    sources = enumerate_sources()
    print(f"Found {len(sources)} source blueprint folders.")

    moved: list[tuple[Path, Path]] = []
    skipped: list[tuple[Path, str]] = []
    missing: list[Path] = []

    for source in sources:
        target = target_for(source)
        target_pkg = target.parent

        if not target_pkg.is_dir():
            missing.append(source)
            print(f"  [SKIP] target package MISSING: {source.relative_to(ROOT)} -> {target_pkg.relative_to(ROOT)}")
            continue

        if target.exists():
            # Blueprint folder already exists; skip.
            if any(target.iterdir()):
                skipped.append((source, "target `blueprint/` already exists and has content"))
                print(f"  [SKIP] target already populated: {target.relative_to(ROOT)}")
                continue

        if check_only:
            print(f"  [CHECK] would move: {source.relative_to(ROOT)}  =>  {target.relative_to(ROOT)}")
            moved.append((source, target))
            continue

        # Copy over.
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copytree(source, target)
        shutil.rmtree(source)
        moved.append((source, target))
        print(f"  MOVED: {source.relative_to(ROOT)}  =>  {target.relative_to(ROOT)}")

    print()
    print(f"Summary: moved={len(moved)} skipped={len(skipped)} missing_target={len(missing)}")

    # Clean up leftover empty domain folders under blueprints/.
    if not check_only and SRC_ROOT.exists():
        for domain in sorted(SRC_ROOT.iterdir()):
            if domain.is_dir() and not any(domain.iterdir()):
                domain.rmdir()
                print(f"  PRUNED empty domain: {domain.relative_to(ROOT)}")
        # If blueprints/ itself is now empty (or contains only .DS_Store), remove it.
        remaining = [p for p in SRC_ROOT.iterdir() if p.name != ".DS_Store"]
        if not remaining:
            shutil.rmtree(SRC_ROOT)
            print(f"  PRUNED top-level: {SRC_ROOT.relative_to(ROOT)}")
        else:
            print(f"  KEEP top-level (still has: {[p.name for p in remaining]})")

    return 0 if not missing else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
