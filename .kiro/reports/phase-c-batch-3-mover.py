#!/usr/bin/env python3
"""
Batch 3 mover — one-shot helper for Phase C PR-C4.

Flattens ``packages/backend/foundation/src/Middlewares/{Request,Response,Security}/``
into the canonical singular ``packages/backend/foundation/src/Middleware/``
folder. For each moved file:

  * Move ``Middlewares/<Bucket>/<File>.php`` → ``Middleware/<File>.php``.
  * Rewrite ``namespace Stackra\\Foundation\\Middlewares\\<Bucket>``
    → ``namespace Stackra\\Foundation\\Middleware``.

Then walks every ``.php`` file in the workspace (excluding vendor, node_modules,
.git) and rewrites every ``use Stackra\\Foundation\\Middlewares\\<Bucket>\\<Class>;``
and every fully-qualified reference to point at the new ``Middleware\\<Class>``
namespace.

The three sub-buckets ("Request", "Response", "Security") disappear along
with the plural ``Middlewares`` parent — code-standards.md §Folder placement
requires singular category folders with no vertical nesting.

Runs from the workspace root. Idempotent: re-running after a partial run
finishes the remaining moves without corrupting already-moved files.

This script is a committed artefact so the diff is reviewable in the
Phase C report — kept alongside the report so a future reader can trace
exactly what got moved.
"""

from __future__ import annotations

import re
import shutil
import sys
from pathlib import Path

ROOT = Path("/Users/akouta/Projects/academorix-frontend")
OLD_ROOT = ROOT / "packages/backend/foundation/src/Middlewares"
NEW_ROOT = ROOT / "packages/backend/foundation/src/Middleware"

# Buckets we are flattening. Anything under Middlewares/ that isn't one of
# these buckets should be reported as a surprise.
BUCKETS = ("Request", "Response", "Security")

OLD_NS_PREFIX = "Stackra\\Foundation\\Middlewares"
NEW_NS = "Stackra\\Foundation\\Middleware"


def find_middlewares() -> list[tuple[Path, str]]:
    """Return ``[(path, bucket)]`` for every .php file under a bucket folder."""
    hits: list[tuple[Path, str]] = []
    for bucket in BUCKETS:
        bucket_dir = OLD_ROOT / bucket
        if not bucket_dir.exists():
            continue
        for p in sorted(bucket_dir.rglob("*.php")):
            hits.append((p, bucket))
    # Also surface anything else under Middlewares/ (unexpected structure).
    extras: list[Path] = []
    if OLD_ROOT.exists():
        for p in sorted(OLD_ROOT.rglob("*.php")):
            if p.parent.name not in BUCKETS:
                extras.append(p)
    if extras:
        print("[batch3] WARN — unexpected files under Middlewares/ (skipped):")
        for p in extras:
            print(f"        {p.relative_to(ROOT)}")
    return hits


def rewrite_file_namespace(file_path: Path, bucket: str) -> tuple[str, str]:
    """Rewrite ``namespace Stackra\\Foundation\\Middlewares\\<Bucket>`` → new."""
    text = file_path.read_text(encoding="utf-8")
    old_ns = f"{OLD_NS_PREFIX}\\{bucket}"
    if f"namespace {old_ns};" not in text:
        # Try the fallback in case the namespace line has whitespace / trailing
        # comment nonsense — but the codebase is consistent so this should not
        # fire.
        raise RuntimeError(
            f"expected namespace `{old_ns};` in {file_path}"
        )
    new_text = text.replace(
        f"namespace {old_ns};",
        f"namespace {NEW_NS};",
        1,
    )
    file_path.write_text(new_text, encoding="utf-8")
    return old_ns, NEW_NS


def do_moves() -> list[tuple[Path, Path, str, str, str]]:
    """Move each file to Middleware/ + rewrite its namespace.

    Returns ``[(old_path, new_path, class_name, old_ns, new_ns)]``.
    """
    NEW_ROOT.mkdir(parents=True, exist_ok=True)
    moves: list[tuple[Path, Path, str, str, str]] = []
    hits = find_middlewares()
    print(f"[batch3] Discovered {len(hits)} files under Middlewares/.")

    for old_path, bucket in hits:
        new_path = NEW_ROOT / old_path.name
        if new_path.exists():
            raise RuntimeError(
                f"target already exists — collision on {new_path.name}. "
                f"Aborting to avoid clobbering {new_path}."
            )
        shutil.copy2(old_path, new_path)
        try:
            old_ns, new_ns = rewrite_file_namespace(new_path, bucket)
        except Exception:
            new_path.unlink(missing_ok=True)
            raise
        class_name = old_path.stem
        old_path.unlink()
        moves.append((old_path, new_path, class_name, old_ns, new_ns))
        print(
            f"[batch3] moved {old_path.relative_to(ROOT)} -> "
            f"{new_path.relative_to(ROOT)}"
        )
    return moves


def prune_middlewares_tree() -> list[Path]:
    """Remove the emptied bucket folders + the plural parent."""
    removed: list[Path] = []
    # Buckets first.
    for bucket in BUCKETS:
        bucket_dir = OLD_ROOT / bucket
        if bucket_dir.exists():
            if any(bucket_dir.iterdir()):
                print(
                    f"[batch3] WARN — {bucket_dir.relative_to(ROOT)} is not empty; skipping"
                )
                continue
            bucket_dir.rmdir()
            removed.append(bucket_dir)
            print(f"[batch3] pruned empty {bucket_dir.relative_to(ROOT)}")
    # Now the parent.
    if OLD_ROOT.exists():
        if any(OLD_ROOT.iterdir()):
            print(
                f"[batch3] WARN — {OLD_ROOT.relative_to(ROOT)} still has children; skipping parent prune"
            )
        else:
            OLD_ROOT.rmdir()
            removed.append(OLD_ROOT)
            print(f"[batch3] pruned empty {OLD_ROOT.relative_to(ROOT)}")
    return removed


def update_consumers(moves: list[tuple[Path, Path, str, str, str]]) -> int:
    """Rewrite every consumer reference across the workspace.

    Two substitution passes per move:

      * ``use Stackra\\Foundation\\Middlewares\\<Bucket>\\<Class>;`` →
        ``use Stackra\\Foundation\\Middleware\\<Class>;``
      * Any FQN reference ``Stackra\\Foundation\\Middlewares\\<Bucket>\\<Class>`` →
        ``Stackra\\Foundation\\Middleware\\<Class>``

    Because the FQCN is uniquely namespaced, plain string replace is safe.
    """
    rename_map: dict[str, str] = {}
    for _, _, class_name, old_ns, new_ns in moves:
        rename_map[f"{old_ns}\\{class_name}"] = f"{new_ns}\\{class_name}"

    # Also handle raw string literals like the middleware alias registry
    # (`'Middlewares\\Request\\FooMiddleware'`) if any exist. Search for the
    # bucket-prefixed FQCN pattern in the workspace so we don't miss route
    # configs, phpstan baselines, etc.

    changed_files: set[Path] = set()
    for path in ROOT.rglob("*.php"):
        rel = path.relative_to(ROOT).as_posix()
        if any(seg in rel for seg in ("/vendor/", "/node_modules/", "/.git/")):
            continue
        if rel.startswith(("vendor/", "node_modules/", ".git/")):
            continue

        try:
            text = path.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            continue

        original = text
        for old_fqcn, new_fqcn in rename_map.items():
            if old_fqcn in text:
                text = text.replace(old_fqcn, new_fqcn)

        if text != original:
            path.write_text(text, encoding="utf-8")
            changed_files.add(path)
            print(f"[batch3] updated references in {rel}")

    # Also sweep .neon (phpstan) + .json (composer / catalog) files for any
    # `Stackra\\Foundation\\Middlewares\\` string references.
    aux_exts = ("*.neon", "*.json", "*.md", "*.php.stub", "*.dist")
    for pattern in aux_exts:
        for path in ROOT.rglob(pattern):
            rel = path.relative_to(ROOT).as_posix()
            if any(seg in rel for seg in ("/vendor/", "/node_modules/", "/.git/")):
                continue
            try:
                text = path.read_text(encoding="utf-8")
            except UnicodeDecodeError:
                continue
            original = text
            for old_fqcn, new_fqcn in rename_map.items():
                # Aux formats may use double-backslash escaping (JSON).
                for from_str, to_str in (
                    (old_fqcn, new_fqcn),
                    (
                        old_fqcn.replace("\\", "\\\\"),
                        new_fqcn.replace("\\", "\\\\"),
                    ),
                ):
                    if from_str in text:
                        text = text.replace(from_str, to_str)
            if text != original:
                path.write_text(text, encoding="utf-8")
                changed_files.add(path)
                print(f"[batch3] updated references in {rel}")

    return len(changed_files)


def main() -> int:
    if not OLD_ROOT.exists():
        print(f"[batch3] nothing to do — {OLD_ROOT.relative_to(ROOT)} does not exist")
        return 0

    moves = do_moves()
    prune_middlewares_tree()
    consumer_count = update_consumers(moves)

    print(
        f"[batch3] moved {len(moves)} files; updated {consumer_count} consumer files."
    )
    print("[batch3] summary:")
    for old_path, new_path, class_name, old_ns, new_ns in moves:
        print(
            f"  {old_ns}\\{class_name}  =>  {new_ns}\\{class_name}"
        )
    return 0


if __name__ == "__main__":
    sys.exit(main())
