#!/usr/bin/env python3
"""
Emit paired marker classes for every existing base migration per ADR-0035.

Parses every `create_<table>_table.php` migration under
`packages/backend/**` + `apps/**` + `services/**`, extracts:

  * The table name  (from `Schema::create('<table>', ...)`).
  * The FK edges   (from `->foreign(...)->references('id')->on('<parent>')`).
  * The migration's filename + timestamp.

Then, for every migration:

  1. Derives the marker class name (`<TableStudlyCase>Table`).
  2. Resolves the marker's PSR-4 namespace by reading the owning
     package's `composer.json` (the `autoload."psr-4"` map).
  3. Emits `src/Database/Markers/<Table>Table.php` if it doesn't yet
     exist. If a marker already exists, LEAVE IT ALONE — the operator
     may have hand-tuned it.
  4. Collects the FK edges as `#[DependsOn(<Parent>Table::class)]`
     entries via a marker-name index shared across every package.

For safety this pass is READ-ONLY on migration files themselves —
the migration keeps its anonymous-class shape; the docblock cross-
reference to the marker is a follow-up commit.

## Coverage caveats

- `Schema::create()` calls buried inside `if` blocks or `try` blocks
  still match the regex — false positives are unlikely for the shape
  our workspace uses (`Schema::create('<table>', function ...)`).
- Multi-table migrations (one `Schema::create` per table in the same
  file) emit ONE marker per table but only ONE migration filename
  reference per marker. That's usually correct — a multi-table
  migration is a single unit anyway.
- Raw SQL `CREATE TABLE` statements are NOT parsed. If a package
  ships one, add the marker by hand.
- The FK detection recognises the canonical Laravel shape:
  `$table->foreign('x')->references('y')->on('parent_table')`. Other
  shapes (`->foreignId('parent_id')->constrained()`) declare an
  implicit FK to `parents`; we detect that pattern too via the
  `constrained()` inference.

## Idempotency

Every marker is written with `write_if_missing` semantics. Re-running
the emitter after fixing typos in existing markers is safe — it
skips every existing file.

## Output

Prints a summary block:

    === Migration marker emission ===
    Scanned migrations: N
    Markers written    : X
    Markers skipped    : Y  (already exist)
    Missing dependencies: Z (parent table has no marker yet)
"""

from __future__ import annotations

import json
import re
import sys
from dataclasses import dataclass, field
from pathlib import Path

WORKSPACE = Path("/Users/akouta/Projects/academorix-frontend")

# Directories the emitter walks for `create_<table>_table.php` migrations.
SCAN_ROOTS = (
    "packages/backend",
    "services",
    "apps/academorix/src/modules",
    "apps/laravel-template",
)

SKIP_DIR_NAMES = frozenset(
    {".git", ".turbo", "vendor", "node_modules", ".doppler", "dist"}
)

# Regex — matches ONLY `create_<snake_table_name>_table.php`. Skips
# `drop_column_...`, `add_..._to_..._table.php`, etc. The parent-table
# match is `\w+?` non-greedy so multi-word tables like
# `create_role_delegations_table.php` still parse.
RE_MIGRATION_FILENAME = re.compile(
    r"^(?P<timestamp>\d{4}_\d{2}_\d{2}_\d{6})_create_(?P<table>[a-z0-9_]+)_table\.php$"
)

# Schema::create inside the migration body — captures the table.
RE_SCHEMA_CREATE = re.compile(
    r"Schema::create\(\s*(?:'(?P<literal>[a-zA-Z0-9_]+)'|(?P<interface>\w+::TABLE))",
)

# Foreign-key declarations.
#
# Shape 1: `$table->foreign('col')->references('id')->on('parent')`
RE_FOREIGN_SHAPE_1 = re.compile(
    r"->foreign\(\s*['\"](?P<col>\w+)['\"]\s*\)\s*"
    r"->references\(\s*['\"]\w+['\"]\s*\)\s*"
    r"->on\(\s*['\"](?P<parent>\w+)['\"]\s*\)"
)

# Shape 2: `$table->foreignId('parent_id')->constrained()` — infers
# the parent table via Laravel's convention (`<parent>_id` → parent
# table `<parents>` pluralised). We fake pluralisation as
# "just add 's'" — enough for 95% of our tables (users, tenants,
# roles, permissions). Edge cases (`identities`) are handled by the
# `constrained('<parent>')` explicit form (Shape 3).
RE_FOREIGN_SHAPE_2 = re.compile(
    r"->foreignId\(\s*['\"](?P<col>\w+_id)['\"]\s*\)\s*->constrained\(\)"
)

# Shape 3: explicit `->constrained('<parent>')`.
RE_FOREIGN_SHAPE_3 = re.compile(
    r"->foreignId\(\s*['\"]\w+_id['\"]\s*\)\s*->constrained\(\s*['\"](?P<parent>\w+)['\"]\s*\)"
)

# Column FQCN lookup — some migrations use
# `Schema::create(<Row>Interface::TABLE, ...)`. To resolve
# `<Row>Interface::TABLE` we scan the matching interface file for
# `TABLE = '<name>'`.
RE_TABLE_CONST = re.compile(
    r"public\s+const\s+(?:string\s+)?TABLE\s*=\s*['\"](?P<value>\w+)['\"]"
)


@dataclass
class MigrationHit:
    """One `create_<x>_table.php` migration found on disk."""

    filename: str
    timestamp: str
    table: str
    package_dir: Path
    parents: list[str] = field(default_factory=list)


def find_migration_files(root: Path) -> list[Path]:
    out: list[Path] = []
    for scan_root_rel in SCAN_ROOTS:
        scan_root = root / scan_root_rel
        if not scan_root.exists():
            continue
        for p in scan_root.rglob("database/migrations/*.php"):
            if any(part in SKIP_DIR_NAMES for part in p.parts):
                continue
            out.append(p)
    return sorted(out)


def resolve_interface_table(package_dir: Path, interface_ref: str) -> str | None:
    """
    Resolve `<Row>Interface::TABLE` to its literal value by reading
    the interface file. Best-effort — walks the package's src/ for
    a file whose name ends in `<Row>Interface.php`.
    """
    class_name = interface_ref.split("::", 1)[0]
    # Walk src/Contracts/Data/ and src/Contracts/ for a matching file.
    for candidate_root in ("src/Contracts/Data", "src/Contracts"):
        d = package_dir / candidate_root
        if not d.exists():
            continue
        candidate_file = d / f"{class_name}.php"
        if candidate_file.exists():
            text = candidate_file.read_text(encoding="utf-8")
            m = RE_TABLE_CONST.search(text)
            if m:
                return m.group("value")
    return None


def parse_migration(migration_path: Path) -> MigrationHit | None:
    filename = migration_path.name
    m = RE_MIGRATION_FILENAME.match(filename)
    if not m:
        return None  # not a create-table migration

    text = migration_path.read_text(encoding="utf-8")
    package_dir = find_package_root(migration_path)
    if package_dir is None:
        return None

    # Table name — prefer the interface-const reference for accuracy.
    table_name = None
    for schema_match in RE_SCHEMA_CREATE.finditer(text):
        if schema_match.group("literal"):
            table_name = schema_match.group("literal")
            break
        if schema_match.group("interface"):
            resolved = resolve_interface_table(package_dir, schema_match.group("interface"))
            if resolved:
                table_name = resolved
                break

    if table_name is None:
        # Fall back to the filename slug — matches our workspace's
        # naming convention (filename slug == table name in every
        # existing migration).
        table_name = m.group("table")

    # FK parents.
    parents: list[str] = []
    for shape in (RE_FOREIGN_SHAPE_1, RE_FOREIGN_SHAPE_3):
        for fk in shape.finditer(text):
            parents.append(fk.group("parent"))
    for fk in RE_FOREIGN_SHAPE_2.finditer(text):
        col = fk.group("col")  # e.g. "user_id"
        # Pluralise the base by naive "s" suffix.
        base = col[:-3]  # drop "_id"
        # Cheap plural heuristic — good enough for 95% of tables.
        if base.endswith("y") and not base.endswith(("ay", "ey", "iy", "oy", "uy")):
            plural = base[:-1] + "ies"
        elif base.endswith(("s", "x", "z", "ch", "sh")):
            plural = base + "es"
        else:
            plural = base + "s"
        parents.append(plural)

    # De-dupe + drop self-referencing FKs (parent == this table).
    parents = sorted({p for p in parents if p != table_name})

    return MigrationHit(
        filename=filename,
        timestamp=m.group("timestamp"),
        table=table_name,
        package_dir=package_dir,
        parents=parents,
    )


def find_package_root(migration_path: Path) -> Path | None:
    """
    Walk upward from a migration file until we hit a composer.json.
    That directory is the owning package root.
    """
    p = migration_path.parent
    while p != WORKSPACE and p != WORKSPACE.parent:
        if (p / "composer.json").is_file():
            return p
        p = p.parent
    return None


def studly(snake: str) -> str:
    """`role_delegations` → `RoleDelegations`."""
    return "".join(part.capitalize() for part in snake.split("_"))


def marker_short_name(table: str) -> str:
    """`role_delegations` → `RoleDelegationsTable`."""
    return studly(table) + "Table"


def package_namespace(package_dir: Path) -> str | None:
    """
    Read the package's composer.json + return the PSR-4 root that
    maps to `src/` (the first PSR-4 key ending with a namespace
    separator that maps `src/`).
    """
    composer_path = package_dir / "composer.json"
    if not composer_path.exists():
        return None
    try:
        data = json.loads(composer_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return None
    psr4 = data.get("autoload", {}).get("psr-4", {})
    for ns, path in psr4.items():
        if path.rstrip("/") == "src":
            return ns.rstrip("\\")
    return None


def render_marker(
    fqcn_short: str,
    namespace: str,
    table: str,
    migration_filename: str,
    parent_fqcns: list[str],
) -> str:
    """Emit a marker class PHP source file."""
    uses: list[str] = ["Stackra\\Database\\Attributes\\DependsOn"]
    depends_on_lines: list[str] = []
    for parent_fqcn in parent_fqcns:
        if parent_fqcn not in uses:
            uses.append(parent_fqcn)
        short = parent_fqcn.rsplit("\\", 1)[-1]
        depends_on_lines.append(f"#[DependsOn({short}::class)]")

    uses_block = "\n".join(f"use {u};" for u in sorted(uses))
    depends_on_block = "\n".join(depends_on_lines) if depends_on_lines else ""
    depends_on_body = depends_on_block + "\n" if depends_on_block else ""

    return f"""<?php

/**
 * @file Database/Markers/{fqcn_short}.php
 *
 * @description
 * Migration marker for the `{table}` table. Discovered at boot by
 * {{@see \\Stackra\\Database\\Migrations\\MigrationDagResolver}} —
 * every downstream marker that references THIS one via
 * `#[DependsOn({fqcn_short}::class)]` must run AFTER the migration
 * named in the MIGRATION constant.
 *
 * ## What this marker declares
 *
 *   * `MIGRATION` — the timestamped migration file that CREATES
 *     `{table}`. The resolver uses this as a tiebreaker among
 *     markers at the same DAG depth.
 *   * `TABLE`     — the physical table name, matches the migration
 *     file's slug.
 *   * `#[DependsOn(...)]` — one attribute per parent table this
 *     marker's migration FKs into. See ADR-0035 §D1 for the
 *     rationale.
 *
 * ## Related
 *
 *   * ADR-0035 — Migration dependency ordering.
 *   * `.kiro/steering/models.md §Migration ordering`.
 *
 * @category Database
 *
 * @since    0.2.0
 */

declare(strict_types=1);

namespace {namespace}\\Database\\Markers;

{uses_block}

{depends_on_body}final class {fqcn_short}
{{
    /** Migration file that produces this table. */
    public const string MIGRATION = '{migration_filename}';

    /** Physical table name. */
    public const string TABLE = '{table}';
}}
"""


def main() -> int:
    print("=== Migration marker emission — ADR-0035 §D1 ===")
    print()

    migrations = find_migration_files(WORKSPACE)

    # First pass: parse every migration hit + build a global table →
    # marker-FQCN index.
    hits: list[MigrationHit] = []
    for p in migrations:
        hit = parse_migration(p)
        if hit is not None:
            hits.append(hit)

    # table → (namespace, short marker name) index for FK resolution
    table_index: dict[str, tuple[str, str]] = {}
    for hit in hits:
        ns = package_namespace(hit.package_dir)
        if ns is None:
            continue
        table_index[hit.table] = (ns, marker_short_name(hit.table))

    # Second pass: emit markers, resolving parent FQCNs from the index.
    written = 0
    skipped = 0
    missing_deps: list[tuple[str, str]] = []  # (child, parent)

    for hit in hits:
        ns = package_namespace(hit.package_dir)
        if ns is None:
            continue

        marker_short = marker_short_name(hit.table)
        markers_dir = hit.package_dir / "src" / "Database" / "Markers"
        markers_dir.mkdir(parents=True, exist_ok=True)
        marker_path = markers_dir / f"{marker_short}.php"

        if marker_path.exists():
            skipped += 1
            continue

        # Resolve parent FQCNs via the global index.
        parent_fqcns: list[str] = []
        for parent_table in hit.parents:
            if parent_table not in table_index:
                missing_deps.append((hit.table, parent_table))
                continue
            parent_ns, parent_short = table_index[parent_table]
            parent_fqcns.append(f"{parent_ns}\\Database\\Markers\\{parent_short}")

        content = render_marker(
            fqcn_short=marker_short,
            namespace=ns,
            table=hit.table,
            migration_filename=hit.filename,
            parent_fqcns=parent_fqcns,
        )
        marker_path.write_text(content, encoding="utf-8")
        rel = marker_path.relative_to(WORKSPACE)
        print(f"write   : {rel}  (deps: {len(parent_fqcns)})")
        written += 1

    print()
    print(f"Scanned migrations              : {len(migrations)}")
    print(f"Create-table migrations parsed  : {len(hits)}")
    print(f"Markers written                 : {written}")
    print(f"Markers skipped (already exist) : {skipped}")
    print(f"Missing-parent references       : {len(missing_deps)}")

    if missing_deps:
        print()
        print("── Unresolved parents (marker emitted with empty deps list) ──")
        for child, parent in missing_deps[:30]:
            print(f"  {child} depends on '{parent}' — no marker created for this parent")
        if len(missing_deps) > 30:
            print(f"  … and {len(missing_deps) - 30} more.")

    return 0


if __name__ == "__main__":
    sys.exit(main())
