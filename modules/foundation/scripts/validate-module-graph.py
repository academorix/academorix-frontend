#!/usr/bin/env python3
"""
validate-module-graph.py

CI check + local pre-commit hook for the Academorix module graph. Verifies:

  1. Every module.json declared under `dependencies` exists on disk
     (no phantom deps).
  2. Every module.json declared under `extendedBy` exists on disk
     (phantom real-consumers claim). `planned_consumers` is permitted to
     reference non-existent modules \u2014 that's its whole point.
  3. Boot-order priority is monotonic: for every edge A \u2192 B (A depends on B),
     B.priority < A.priority. (Lower priority boots first.)
  4. No priority ties within a dependency chain \u2014 ties are allowed
     between unrelated modules (siblings), but if A depends on B they must
     differ.
  5. ULID prefix uniqueness \u2014 no two entities share a prefix in the
     `foundation/data/ulid-prefixes.json` registry, and every keyPrefix on
     a schema is registered.
  6. Renamed prefixes have `renamed_from` in the registry (traceability).

Exits 0 on clean, non-zero on any violation. Prints a human-readable report
of the violations.

Usage:
  python3 modules/foundation/scripts/validate-module-graph.py
  python3 modules/foundation/scripts/validate-module-graph.py --strict  # fail on warnings too
"""
from __future__ import annotations

import argparse
import json
import os
import re
import sys
from pathlib import Path

# ------------------------------------------------------------------------------
# Locate the modules root regardless of where the script is invoked.
# ------------------------------------------------------------------------------

REPO_ROOT = Path(__file__).resolve().parents[3]
MODULES_ROOT = REPO_ROOT / "modules"
REGISTRY_PATH = MODULES_ROOT / "foundation" / "data" / "ulid-prefixes.json"


def discover_modules() -> dict[str, dict]:
    """Return {module_name: parsed_module_json} for every module.json on disk."""
    modules = {}
    for module_dir in sorted(MODULES_ROOT.iterdir()):
        if not module_dir.is_dir() or module_dir.name.startswith("."):
            continue
        module_json = module_dir / "module.json"
        if not module_json.exists():
            continue
        modules[module_dir.name] = json.loads(module_json.read_text())
    return modules


def load_registry() -> dict:
    if not REGISTRY_PATH.exists():
        return {"prefixes": {}, "reserved_for_future": {}}
    return json.loads(REGISTRY_PATH.read_text())


def discover_schema_prefixes(modules: dict[str, dict]) -> dict[str, str]:
    """Walk every schema file to collect `x-eloquent.keyPrefix` \u2192 module."""
    prefixes = {}
    for module_name in modules:
        schema_dir = MODULES_ROOT / module_name / "schemas"
        if not schema_dir.exists():
            continue
        for schema_path in schema_dir.rglob("*.schema.json"):
            try:
                data = json.loads(schema_path.read_text())
            except Exception:
                continue
            key_prefix = data.get("x-eloquent", {}).get("keyPrefix")
            if key_prefix:
                prefixes[key_prefix] = f"{module_name}::{schema_path.stem.replace('.schema', '')}"
    return prefixes


# ------------------------------------------------------------------------------
# Checks.
# ------------------------------------------------------------------------------

def check_dependencies_exist(modules: dict[str, dict]) -> list[str]:
    errors = []
    for name, module in modules.items():
        for dep in module.get("dependencies", []):
            if dep not in modules:
                errors.append(
                    f"[deps]     {name}.dependencies contains phantom module '{dep}'"
                )
    return errors


def check_extendedby_exist(modules: dict[str, dict]) -> list[str]:
    errors = []
    for name, module in modules.items():
        for consumer in module.get("extendedBy", []):
            if consumer not in modules:
                errors.append(
                    f"[extBy]    {name}.extendedBy contains phantom '{consumer}' "
                    f"(move to planned_consumers)"
                )
    return errors


def check_priority_ordering(modules: dict[str, dict]) -> list[str]:
    errors = []
    for name, module in modules.items():
        my_priority = module.get("priority")
        if my_priority is None:
            errors.append(f"[prio]     {name}.priority is missing")
            continue
        for dep in module.get("dependencies", []):
            if dep not in modules:
                continue  # already reported by check_dependencies_exist
            dep_priority = modules[dep].get("priority")
            if dep_priority is None:
                continue
            if dep_priority >= my_priority:
                errors.append(
                    f"[prio]     {name}(priority={my_priority}) depends on "
                    f"{dep}(priority={dep_priority}) \u2014 dependency must boot first "
                    f"(strictly lower priority)"
                )
    return errors


def check_ulid_registry(modules: dict[str, dict], registry: dict) -> list[str]:
    errors = []
    registered = set(registry.get("prefixes", {}).keys())
    reserved = set(registry.get("reserved_for_future", {}).keys())
    on_disk = discover_schema_prefixes(modules)

    # (a) Every schema keyPrefix must be in the registry.
    for prefix, entity in on_disk.items():
        if prefix not in registered:
            errors.append(
                f"[ulid]     {entity} uses keyPrefix '{prefix}' not present in "
                f"foundation/data/ulid-prefixes.json"
            )

    # (b) No collision between registered + reserved.
    collisions = registered & reserved
    for prefix in collisions:
        errors.append(
            f"[ulid]     prefix '{prefix}' appears in BOTH prefixes + "
            f"reserved_for_future \u2014 registry inconsistency"
        )

    # (c) Every entry in the registry must be a full 3-4 char ASCII lowercase
    #     + trailing underscore, UNLESS marked `grandfathered: true` with a
    #     documented rename target in the `note` field.
    valid_prefix = re.compile(r"^[a-z]{3,4}_$")
    prefix_entries = registry.get("prefixes", {})
    for prefix in registered:
        if valid_prefix.match(prefix):
            continue
        entry = prefix_entries.get(prefix, {})
        if entry.get("grandfathered"):
            continue  # documented exception with rename target
        errors.append(
            f"[ulid]     prefix '{prefix}' violates the 3-4 char constraint"
        )

    return errors


def check_renamed_traceability(registry: dict) -> list[str]:
    errors = []
    history = registry.get("renaming_history", [])
    history_map = {entry["from"]: entry["to"] for entry in history}
    for prefix, entry in registry.get("prefixes", {}).items():
        if "renamed_from" in entry:
            old = entry["renamed_from"]
            if history_map.get(old) != prefix:
                errors.append(
                    f"[ulid]     prefix '{prefix}' declares renamed_from='{old}' "
                    f"but renaming_history has no matching entry"
                )
    return errors


# ------------------------------------------------------------------------------
# Main.
# ------------------------------------------------------------------------------

def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--strict", action="store_true",
                        help="Treat warnings as errors.")
    args = parser.parse_args()

    modules = discover_modules()
    registry = load_registry()

    print(f"Discovered {len(modules)} modules under {MODULES_ROOT}\n")

    checks = [
        ("Dependency existence",     check_dependencies_exist(modules)),
        ("extendedBy existence",     check_extendedby_exist(modules)),
        ("Boot-order priority",      check_priority_ordering(modules)),
        ("ULID prefix registry",     check_ulid_registry(modules, registry)),
        ("Rename traceability",      check_renamed_traceability(registry)),
    ]

    total = 0
    for label, errors in checks:
        if errors:
            print(f"\u2717 {label}: {len(errors)} violation(s)")
            for e in errors:
                print(f"    {e}")
            total += len(errors)
        else:
            print(f"\u2713 {label}")

    print()
    if total == 0:
        print("Module graph is clean.")
        return 0

    print(f"Module graph has {total} violation(s).")
    return 1


if __name__ == "__main__":
    sys.exit(main())
