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
     `blueprints/foundation/data/ulid-prefixes.json` registry, and every keyPrefix on
     a schema is registered.
  6. Renamed prefixes have `renamed_from` in the registry (traceability).

Exits 0 on clean, non-zero on any violation. Prints a human-readable report
of the violations.

Usage:
  python3 modules/shared/blueprints/foundation/scripts/validate-module-graph.py
  python3 modules/shared/blueprints/foundation/scripts/validate-module-graph.py --strict  # fail on warnings too
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

# `foundation` now lives at `modules/shared/blueprints/foundation/scripts/` —
# five levels below the repo root (scripts → foundation → blueprints → shared →
# modules → root).
REPO_ROOT = Path(__file__).resolve().parents[5]
MODULES_ROOT = REPO_ROOT / "modules"
REGISTRY_PATH = MODULES_ROOT / "shared" / "blueprints" / "foundation" / "data" / "ulid-prefixes.json"


def discover_modules() -> dict[str, dict]:
    """
    Return {module_name: parsed_module_json} for every module.json on disk.

    Modules are grouped into service-tier folders under `modules/` — e.g.
    `modules/shared/foundation/`, `modules/platform/tenancy/`,
    `modules/notifications/notifications-mail/`. The key is the module's own
    basename (`foundation`, `tenants`, `notifications-mail`) so every
    cross-reference in `dependencies` / `extendedBy` / `planned_consumers`
    resolves by bare module name regardless of tier — no path rewrites needed
    when a module moves tiers.

    Duplicate basenames are refused hard: a name is a global identifier in the
    module graph, not a tier-scoped one.
    """
    modules = {}
    duplicates: list[str] = []
    # Walk every module.json anywhere under modules/ so nested tier folders
    # (shared, platform, billing, ...) are traversed uniformly.
    for module_json in sorted(MODULES_ROOT.rglob("module.json")):
        # Skip anything under a dot-prefixed path (e.g. .kiro, .git).
        rel = module_json.relative_to(MODULES_ROOT)
        if any(part.startswith(".") for part in rel.parts):
            continue
        # Module identity = the immediate parent folder's basename.
        name = module_json.parent.name
        try:
            data = json.loads(module_json.read_text())
        except json.JSONDecodeError as exc:
            raise SystemExit(f"invalid JSON in {module_json}: {exc}") from exc
        if name in modules:
            duplicates.append(f"'{name}' at both {modules[name]['__path']} and {rel}")
            continue
        # Stash the on-disk path so reports can point at it; underscore-prefixed
        # to sit clear of blueprint keys.
        data["__path"] = str(rel)
        modules[name] = data
    if duplicates:
        raise SystemExit(
            "duplicate module basename(s) — names are global identifiers:\n  "
            + "\n  ".join(duplicates)
        )
    return modules


def load_registry() -> dict:
    if not REGISTRY_PATH.exists():
        return {"prefixes": {}, "reserved_for_future": {}}
    return json.loads(REGISTRY_PATH.read_text())


def discover_schema_prefixes(modules: dict[str, dict]) -> dict[str, str]:
    """
    Walk every schema file under each discovered module to collect
    `x-eloquent.keyPrefix` \u2192 `<module>::<entity>`.

    Uses the `__path` recorded by `discover_modules()` so tier nesting is
    invisible here \u2014 whatever tier a module sits under, its `schemas/` dir is
    scanned identically.
    """
    prefixes = {}
    for module_name, module in modules.items():
        schema_dir = MODULES_ROOT / module["__path"] / ".." / "schemas"
        schema_dir = (MODULES_ROOT / module["__path"]).parent / "schemas"
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
                f"blueprints/foundation/data/ulid-prefixes.json"
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


def check_no_workspace_in_blueprint() -> list[str]:
    """
    Enforce the canonical vocabulary from `.kiro/steering/hierarchy.md` §1a —
    **Tenant** is the domain word, **Workspace** was renamed to Tenant across
    the platform (§17 FAQ; the FE is free to keep `workspace` as UI copy, but
    every blueprint / schema / migration / class name uses `Tenant`).

    This is the frontend twin of the backend's `NoWorkspaceInBackendRule`
    (architecture rule referenced in `hierarchy.md` §17). Fails when any file
    under `modules/` still contains `workspace` / `Workspace` / `WORKSPACE` /
    `wsp_` / `workspaceable`, except:

    - `google_workspace` — Google's product name; preserved.
    - `renaming_history` entries in the ULID registry — historical record of
      the `wsp_` → `ten_` rename lives here permanently.
    """
    errors: list[str] = []
    # Word-boundary variants of the banned tokens. `google_workspace` is
    # allow-listed by removing it from candidate text before the scan.
    forbidden = re.compile(
        r"\b(workspaces?|WORKSPACES?|Workspaces?|wsp_|workspaceable(?:_optional)?)\b"
    )
    scan_ext = {
        ".json", ".md", ".mdx", ".txt",
        ".php", ".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs",
        ".yaml", ".yml", ".env", ".sh", ".py",
    }
    skip_dirs = {".git", "node_modules", "vendor", "dist", "build", "coverage",
                 "__pycache__", ".venv"}
    # The registry legitimately records the historical `wsp_` prefix in
    # renaming_history; skip that file's known-safe context.
    registry_relpath = Path("shared/blueprints/foundation/data/ulid-prefixes.json")
    # This validator file itself has to spell the forbidden tokens to document
    # what it forbids. Skip self-scanning.
    self_relpath = Path("shared/blueprints/foundation/scripts/validate-module-graph.py")

    for path in MODULES_ROOT.rglob("*"):
        if not path.is_file():
            continue
        if any(part in skip_dirs for part in path.parts):
            continue
        if path.suffix not in scan_ext:
            continue
        rel = path.relative_to(MODULES_ROOT)
        # Skip the validator's own source — it must reference the forbidden
        # tokens to document its rule.
        if rel == self_relpath:
            continue
        try:
            text = path.read_text(encoding="utf-8")
        except (UnicodeDecodeError, OSError):
            continue
        # Allow-list: Google Workspace product name.
        stripped = text.replace("google_workspace", "")
        # Allow-list: the ULID registry's rename-history block is documentary.
        if rel == registry_relpath:
            # Only flag hits outside the renaming_history array — a rough
            # positional check is enough (the block is authored last in file).
            hist_start = stripped.find('"renaming_history"')
            if hist_start > 0:
                stripped = stripped[:hist_start]
        for m in forbidden.finditer(stripped):
            snippet = stripped[max(0, m.start() - 30):m.end() + 30].replace("\n", " ")
            errors.append(
                f"[terms]    {rel}: forbidden token '{m.group(0)}' (steering: "
                f"hierarchy.md §1a rejects Workspace — use Tenant) — ...{snippet}..."
            )
            if len(errors) >= 25:
                errors.append("[terms]    (truncated — 25 hits shown, more remain)")
                return errors
    return errors


def check_relations_target_module(modules: dict[str, dict]) -> list[str]:
    """
    Every `relations.json` anchors relations at models owned by the file's
    module, and points cross-module edges at `target.module = "<basename>"`.
    Assert every `target.module` value resolves to an actual module.json.name
    on disk — not just a folder that happens to exist. Catches stale refs
    where a module renamed or moved but the target reference lagged.

    A dedicated check because `discover_modules()` keys by *file* basename
    (folder name), but `target.module` is meant to reference the module by
    its declared `name` field. Post-rename, folder + name are usually
    identical, but the two can drift (e.g. a folder renamed on disk without
    the corresponding module.json.name change).
    """
    errors: list[str] = []
    # Build the set of declared module.json.name values — that's the wire
    # contract that CI must resolve every reference against.
    declared_names = {m.get("name") for m in modules.values() if m.get("name")}
    # Any folder without a declared name matches its folder basename, which
    # is what `discover_modules` already keys on.
    valid = declared_names | set(modules.keys())
    # Forward-referenced modules that DON'T exist yet but are legit design
    # anchors — collected from every module's `planned_consumers` list, plus
    # the ULID registry's `reserved_for_future` map. Relations may reference
    # these as target.module because the FK column contract is stable even
    # before the target module lands.
    for m in modules.values():
        for planned in m.get("planned_consumers", []) or []:
            if isinstance(planned, str):
                valid.add(planned)
    try:
        registry = json.loads(REGISTRY_PATH.read_text()) if REGISTRY_PATH.exists() else {}
    except json.JSONDecodeError:
        registry = {}
    for _, entry in (registry.get("reserved_for_future") or {}).items():
        raw = entry.get("module") if isinstance(entry, dict) else None
        if isinstance(raw, str):
            # `module` values in the registry look like `"user (planned)"` —
            # take the leading token before the paren.
            token = raw.split()[0].strip()
            if token:
                valid.add(token)

    for module_name, module in modules.items():
        module_dir = MODULES_ROOT / module["__path"]
        module_dir = module_dir.parent if module_dir.is_file() else module_dir
        relations_path = (MODULES_ROOT / module["__path"]).parent / "relations.json"
        if not relations_path.exists():
            continue
        try:
            data = json.loads(relations_path.read_text())
        except json.JSONDecodeError as exc:
            errors.append(f"[rels]     {relations_path.relative_to(MODULES_ROOT)}: invalid JSON — {exc}")
            continue

        # Walk every nested value looking for `target.module` keys — cheaper
        # than parsing the anchor shape by hand.
        def walk(node: object, path: str) -> None:
            if isinstance(node, dict):
                target = node.get("target")
                if isinstance(target, dict) and "module" in target:
                    ref = target["module"]
                    if isinstance(ref, str) and ref not in valid:
                        errors.append(
                            f"[rels]     {module_name}.relations{path}.target.module="
                            f"'{ref}' — no matching module (renamed? typo?)"
                        )
                for k, v in node.items():
                    walk(v, f"{path}.{k}")
            elif isinstance(node, list):
                for i, item in enumerate(node):
                    walk(item, f"{path}[{i}]")

        walk(data, "")
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
        ("Canonical vocabulary",     check_no_workspace_in_blueprint()),
        ("Relations target modules", check_relations_target_module(modules)),
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
