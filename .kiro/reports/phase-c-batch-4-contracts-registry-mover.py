#!/usr/bin/env python3
"""
Phase C follow-up — mirror the Batch C3 concrete move for interface files.

For every file at ``packages/backend/*/*/src/Contracts/Services/*RegistryInterface.php``:

  1. Move to the sibling path ``Contracts/Registry/*RegistryInterface.php``.
  2. Rewrite the file's ``namespace ...\\Contracts\\Services;`` line to
     ``namespace ...\\Contracts\\Registry;``.
  3. Walk every ``.php`` file in the workspace (excluding vendor) and
     rewrite every ``use ...\\Contracts\\Services\\<X>RegistryInterface;`` +
     every fully-qualified reference to point at the new namespace.

Idempotent: files already at the new path are skipped.

Committed under ``.kiro/reports/`` so the diff is auditable — the batch-2
+ batch-3 movers set the precedent (see phase-c-housekeeper report).
"""

from __future__ import annotations

import re
import shutil
import sys
from pathlib import Path

ROOT = Path("/Users/akouta/Projects/academorix-frontend")
BACKEND = ROOT / "packages" / "backend"


def find_contract_interfaces() -> list[Path]:
    """Every ``Contracts/Services/*RegistryInterface.php`` file inside packages/backend."""
    hits: list[Path] = []
    for p in BACKEND.rglob("*RegistryInterface.php"):
        parts = p.parts
        # Must sit under a Contracts/Services/ pair and inside a src/ tree.
        # Direct parent must be "Services", grandparent must be "Contracts".
        if p.parent.name == "Services" and p.parent.parent.name == "Contracts":
            hits.append(p)
    return sorted(hits)


def compute_new_path(old: Path) -> Path:
    """Swap ``Contracts/Services`` → ``Contracts/Registry`` (the last occurrence)."""
    parts = list(old.parts)
    # Find the LAST "Services" segment whose predecessor is "Contracts".
    for i in range(len(parts) - 1, 0, -1):
        if parts[i] == "Services" and parts[i - 1] == "Contracts":
            parts[i] = "Registry"
            break
    return Path(*parts)


def rewrite_file_namespace(file_path: Path) -> tuple[str, str]:
    """Rewrite ``namespace ...\\Contracts\\Services;`` → ``...\\Contracts\\Registry;``."""
    text = file_path.read_text(encoding="utf-8")
    m = re.search(r"^namespace\s+([A-Za-z0-9_\\]+);", text, re.MULTILINE)
    if not m:
        raise RuntimeError(f"No namespace line in {file_path}")
    old_ns = m.group(1)
    if not old_ns.endswith("\\Contracts\\Services"):
        raise RuntimeError(
            f"Expected namespace ending in \\Contracts\\Services in {file_path}, got {old_ns}"
        )
    new_ns = old_ns[: -len("\\Contracts\\Services")] + "\\Contracts\\Registry"
    new_text = text.replace(
        f"namespace {old_ns};",
        f"namespace {new_ns};",
        1,
    )
    file_path.write_text(new_text, encoding="utf-8")
    return old_ns, new_ns


def do_moves() -> list[tuple[Path, Path, str, str]]:
    """Move every file + rewrite namespace. Returns (old_path, new_path, old_ns, new_ns)."""
    moves: list[tuple[Path, Path, str, str]] = []
    hits = find_contract_interfaces()
    print(f"[batch-c4] Discovered {len(hits)} contract interfaces to move.")

    for old_path in hits:
        new_path = compute_new_path(old_path)
        if new_path == old_path:
            print(f"[batch-c4] SKIP (already at new path): {old_path.relative_to(ROOT)}")
            continue

        new_path.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(old_path, new_path)
        try:
            old_ns, new_ns = rewrite_file_namespace(new_path)
        except Exception:
            new_path.unlink(missing_ok=True)
            raise
        old_path.unlink()
        moves.append((old_path, new_path, old_ns, new_ns))
        print(f"[batch-c4] moved {old_path.relative_to(ROOT)} -> {new_path.relative_to(ROOT)}")
    return moves


def prune_empty_services_dirs(moves: list[tuple[Path, Path, str, str]]) -> list[Path]:
    """Remove ``Contracts/Services/`` dirs that are now empty."""
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
            print(f"[batch-c4] pruned empty {services_dir.relative_to(ROOT)}")
    return pruned


def update_consumers(moves: list[tuple[Path, Path, str, str]]) -> int:
    """Rewrite every consumer reference across the workspace."""
    rename_map: dict[str, str] = {}
    for old_path, _, old_ns, new_ns in moves:
        class_name = old_path.stem
        rename_map[f"{old_ns}\\{class_name}"] = f"{new_ns}\\{class_name}"

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

    return len(changed_files)


def main() -> int:
    if not BACKEND.exists():
        print(f"error: packages/backend not found at {BACKEND}", file=sys.stderr)
        return 1

    moves = do_moves()
    prune_empty_services_dirs(moves)
    consumer_count = update_consumers(moves)

    print(f"[batch-c4] moved {len(moves)} files; updated {consumer_count} consumer files.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
