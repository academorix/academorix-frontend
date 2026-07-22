#!/usr/bin/env python3
"""
Batch 2 mover — one-shot helper for Phase C PR-C3.

Moves every ``*Registry.php`` under ``packages/backend/**/src/**/Services/*``
into a sibling ``Registry/`` folder and rewrites the ``namespace`` line
inside each file from ``...\\Services;`` to ``...\\Registry;``. Then walks
every ``.php`` file in the workspace (excluding vendor and this script's
own report file) and rewrites every ``use ...\\Services\\<X>Registry;`` and
every fully-qualified reference to point at the new namespace.

Runs from the workspace root. Idempotent-ish: re-running after a partial
run finishes the remaining moves without corrupting already-moved files
because the discovery step only picks up files currently in ``Services/``.

This script is a deliberate committed artefact so the diff is reviewable
in the Phase C report — do NOT delete after execution; the report lives
in the same directory and links to it as the transcript.
"""

from __future__ import annotations

import os
import re
import shutil
import sys
from pathlib import Path

ROOT = Path("/Users/akouta/Projects/academorix-frontend")
BACKEND = ROOT / "packages" / "backend"

# Collect every Services/*Registry.php inside packages/backend.
def find_registries() -> list[Path]:
    hits: list[Path] = []
    for p in BACKEND.rglob("*Registry.php"):
        parts = p.parts
        # Must sit directly under a "Services" folder and inside a "src/" tree.
        if "Services" in parts and "src" in parts:
            # Confirm the parent folder is Services (not a nested path).
            if p.parent.name == "Services":
                hits.append(p)
    return sorted(hits)


def compute_new_path(old: Path) -> Path:
    """Replace the last ``Services`` segment with ``Registry``."""
    parts = list(old.parts)
    # Find the LAST Services in the path — closest to the filename.
    for i in range(len(parts) - 1, -1, -1):
        if parts[i] == "Services":
            parts[i] = "Registry"
            break
    return Path(*parts)


def namespace_of(file_path: Path) -> str | None:
    """Read the ``namespace X\\Services;`` line from the file."""
    text = file_path.read_text(encoding="utf-8")
    m = re.search(r"^namespace\s+([A-Za-z0-9_\\]+);", text, re.MULTILINE)
    return m.group(1) if m else None


def rewrite_file_namespace(file_path: Path) -> tuple[str, str]:
    """Rewrite the file's namespace from ``...\\Services`` to ``...\\Registry``.

    Returns (old_ns, new_ns).
    """
    text = file_path.read_text(encoding="utf-8")
    m = re.search(r"^namespace\s+([A-Za-z0-9_\\]+);", text, re.MULTILINE)
    if not m:
        raise RuntimeError(f"No namespace line in {file_path}")
    old_ns = m.group(1)
    if not old_ns.endswith("\\Services"):
        raise RuntimeError(
            f"Expected namespace ending in \\Services in {file_path}, got {old_ns}"
        )
    new_ns = old_ns[: -len("\\Services")] + "\\Registry"
    new_text = text.replace(
        f"namespace {old_ns};",
        f"namespace {new_ns};",
        1,
    )
    file_path.write_text(new_text, encoding="utf-8")
    return old_ns, new_ns


def do_moves() -> list[tuple[Path, Path, str, str]]:
    """Perform every file move + namespace rewrite. Returns list of (old_path, new_path, old_ns, new_ns)."""
    moves: list[tuple[Path, Path, str, str]] = []
    registries = find_registries()
    print(f"[batch2] Discovered {len(registries)} Registry classes in Services/.")
    for old_path in registries:
        new_path = compute_new_path(old_path)
        new_path.parent.mkdir(parents=True, exist_ok=True)
        # Copy over — do not delete source until namespace rewrite succeeds.
        shutil.copy2(old_path, new_path)
        try:
            old_ns, new_ns = rewrite_file_namespace(new_path)
        except Exception:
            # Roll back the copy so state stays consistent.
            new_path.unlink(missing_ok=True)
            raise
        old_path.unlink()
        moves.append((old_path, new_path, old_ns, new_ns))
        print(f"[batch2] moved {old_path.relative_to(ROOT)} -> {new_path.relative_to(ROOT)}")
    return moves


def prune_empty_services_dirs(moves: list[tuple[Path, Path, str, str]]) -> list[Path]:
    """Remove Services/ folders that are now empty after all moves complete."""
    pruned: list[Path] = []
    seen: set[Path] = set()
    for old_path, _, _, _ in moves:
        services_dir = old_path.parent
        if services_dir in seen:
            continue
        seen.add(services_dir)
        if services_dir.exists() and not any(services_dir.iterdir()):
            services_dir.rmdir()
            pruned.append(services_dir)
            print(f"[batch2] pruned empty {services_dir.relative_to(ROOT)}")
    return pruned


def update_consumers(moves: list[tuple[Path, Path, str, str]]) -> int:
    """Rewrite every consumer's ``use`` statement + FQN reference.

    Walks every ``.php`` file in the workspace, excluding vendor + node_modules
    directories and this script's own report file. For each move (old_ns,
    class_name, new_ns), rewrites:

        use OLD_NS\\ClassName;      →  use NEW_NS\\ClassName;
        OLD_NS\\ClassName            →  NEW_NS\\ClassName        (FQN references)

    The class name is derived from each move's file basename (``<Name>Registry``).
    Returns the count of consumer files updated.
    """
    # Build a lookup of every renaming — (fqcn_old, fqcn_new).
    rename_map: dict[str, str] = {}
    for old_path, new_path, old_ns, new_ns in moves:
        class_name = old_path.stem  # e.g. "GrantableRegistry"
        rename_map[f"{old_ns}\\{class_name}"] = f"{new_ns}\\{class_name}"

    # Walk .php files. Skip common noise.
    skip_dirs = {"vendor", "node_modules", ".git", ".kiro/reports"}
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
            # Match either `use X;` or a bare FQN reference anywhere in the
            # file. The FQN substitution is a plain string replace, which is
            # safe because the FQCN is namespaced enough to not collide.
            if old_fqcn in text:
                text = text.replace(old_fqcn, new_fqcn)

        if text != original:
            path.write_text(text, encoding="utf-8")
            changed_files.add(path)
            print(f"[batch2] updated references in {rel}")

    return len(changed_files)


def main() -> int:
    if not BACKEND.exists():
        print(f"error: packages/backend not found at {BACKEND}", file=sys.stderr)
        return 1

    moves = do_moves()
    prune_empty_services_dirs(moves)
    consumer_count = update_consumers(moves)

    print(f"[batch2] moved {len(moves)} files; updated {consumer_count} consumer files.")
    # Emit a compact summary the report can quote.
    print("[batch2] summary:")
    for old_path, new_path, old_ns, new_ns in moves:
        print(f"  {old_ns}\\{old_path.stem}  =>  {new_ns}\\{new_path.stem}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
