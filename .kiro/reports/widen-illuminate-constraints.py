#!/usr/bin/env python3
r"""
Widen every `illuminate/*` composer constraint across the workspace to
include Laravel 13.

## Why

The Stackra API service pins `laravel/framework: ^13.8`. Laravel 13's
`composer.json` declares `replace: { "illuminate/filesystem":
"self.version", ... }` for every `illuminate/*` sub-package it publishes.
That means ANY workspace package that also requires `illuminate/filesystem:
^11.0` (or any range that doesn't include ^13.0) fails composer's SAT
solver with:

    Only one of these can be installed: illuminate/filesystem[...],
    laravel/framework[v13.12+]. laravel/framework replaces
    illuminate/filesystem and thus cannot coexist with it.

The workspace has 40+ backend packages, each with its own composer.json,
and many pin `illuminate/*` to `^11.0`. This script widens each one to
add `^13.0` so the SAT solver can pick a version that satisfies both
the framework replace + the package's explicit require.

## What the script does

Walks every composer.json in the workspace (except vendor/, node_modules/,
.git/) and for every `illuminate/*` entry in `require` + `require-dev`:

  1. Skip if the constraint is `self.version` (used inside laravel/framework
     itself, and inside `packages/framework/*` composer entries that
     mimic it).
  2. Skip if the constraint already includes `^13` or `13.0` as a substring
     (idempotent — safe to re-run).
  3. Skip if the constraint looks like a description ("Required to use ...",
     "The X package (^Y.Z).") — those live in `suggest`, not `require`, but
     defense-in-depth.
  4. Rewrite according to a lookup:
       * `^11.0`                              -> `^11.0|^12.0|^13.0`
       * `^11.47.0`  / `^11.<n>`              -> `^11.<n>|^12.0|^13.0`
       * `^12.0`                              -> `^12.0|^13.0`
       * `^10.24|^11.0|^12.0`                 -> `^10.24|^11.0|^12.0|^13.0`
       * `>=10.17.0 <10.25.0`  (legacy pin)   -> `^10.0|^11.0|^12.0|^13.0`
       * `^11.0||^12.0||^13.0` (double-pipe)  -> normalise to single pipe
       * anything else with `|` — append `|^13.0` if `13` not present
       * anything else — leave alone + log as a warning

Preserves the file's JSON formatting (2-space indent + trailing newline)
so diffs stay narrow.

## Idempotency

Re-running produces zero changes on the second pass.

## Safety

Never touches `laravel/*` packages (only `illuminate/*`). Never touches
version constraints outside `require` / `require-dev`. Never rewrites
`suggest` (those are prose descriptions, not constraints).

## Output

Prints one line per touched file + a per-file diff summary.
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path
from typing import Any

WORKSPACE = Path("/Users/akouta/Projects/academorix-frontend")

SKIP_DIR_NAMES = frozenset(
    {".git", ".turbo", "vendor", "node_modules", ".doppler", "dist"}
)

# Only rewrite constraints on packages under the illuminate/* namespace.
RE_ILLUMINATE = re.compile(r"^illuminate/[a-z0-9-]+$")

# `self.version` is legitimate inside laravel/framework itself. If any
# workspace package uses it, that's a mimicry pattern — skip.
SELF_VERSION_TOKENS = frozenset({"self.version"})


def is_description(constraint: str) -> bool:
    """
    Heuristic — does the string look like a `suggest` value rather than
    a real version constraint?

    Composer's `suggest` block allows prose values ("Required to use
    the X feature"). If we accidentally pick one up (defense-in-depth
    against a badly-authored composer.json), skip it.
    """
    if len(constraint) > 60:
        return True
    if constraint.startswith(("Required", "The ", "Optional", "Recommended")):
        return True
    return False


def widen_constraint(constraint: str) -> tuple[str, bool]:
    """
    Return (new_constraint, changed) — the widened form + a flag.

    Rules — see module docstring §"What the script does".
    """
    original = constraint.strip()

    if original in SELF_VERSION_TOKENS:
        return original, False
    if is_description(original):
        return original, False

    # Already covers Laravel 13 — leave alone.
    # We check for `^13`, `13.0`, or `>=13` to catch every idiomatic form.
    if re.search(r"\^13|13\.0|>=13", original):
        return original, False

    # Normalise `||` (double-pipe) to `|` (single-pipe). Composer accepts
    # both but the workspace convention is single-pipe.
    if "||" in original:
        original = original.replace("||", "|")

    # Legacy exact ranges like `>=10.17.0 <10.25.0` — those pin an
    # ancient Laravel 10 snapshot. Replace with the modern permissive
    # constraint that includes 13.
    if re.match(r">=?\s*10\.\d+", original) and "<" in original:
        return "^10.0|^11.0|^12.0|^13.0", True

    # Split on `|` to handle already-composite constraints.
    if "|" in original:
        parts = [p.strip() for p in original.split("|") if p.strip()]
        # Deduplicate + append ^13.0 if missing.
        if not any(re.match(r"\^13|13\.0", p) for p in parts):
            parts.append("^13.0")
        widened = "|".join(parts)
        return (widened, widened != constraint)

    # Simple `^N.Y[.Z]` — widen by adding ^13.0 alongside.
    # Preserve the original constraint as the low end.
    m = re.match(r"^\^(\d+)(?:\.\d+)*", original)
    if m:
        major = int(m.group(1))
        if major == 13:
            # Shouldn't reach here (we'd have short-circuited at "^13" check)
            # but defensive.
            return original, False
        if major == 12:
            widened = f"{original}|^13.0"
        elif major == 11:
            widened = f"{original}|^12.0|^13.0"
        elif major == 10:
            widened = f"{original}|^11.0|^12.0|^13.0"
        elif major == 9:
            widened = f"{original}|^10.0|^11.0|^12.0|^13.0"
        elif major == 8:
            widened = f"{original}|^9.0|^10.0|^11.0|^12.0|^13.0"
        else:
            # Unknown major — leave with a warning.
            return original, False
        return widened, True

    # Anything else — bail with a warning.
    return original, False


def widen_block(block: dict[str, str] | None) -> tuple[dict[str, str] | None, list[tuple[str, str, str]]]:
    """
    Widen every illuminate/* require in a `require` / `require-dev`
    block. Returns the mutated block + a list of (package, old, new)
    tuples for every mutation.
    """
    if not block:
        return block, []
    changes: list[tuple[str, str, str]] = []
    for name in list(block.keys()):
        if not RE_ILLUMINATE.match(name):
            continue
        old = block[name]
        new, changed = widen_constraint(old)
        if changed and new != old:
            block[name] = new
            changes.append((name, old, new))
    return block, changes


def sweep_file(path: Path) -> dict[str, Any]:
    """Sanitise one composer.json in place. Returns a per-file report dict."""
    text = path.read_text(encoding="utf-8")
    try:
        data = json.loads(text)
    except json.JSONDecodeError as exc:
        return {"path": str(path), "error": f"json decode: {exc}"}

    require_after, require_changes = widen_block(data.get("require"))
    require_dev_after, require_dev_changes = widen_block(data.get("require-dev"))

    all_changes = require_changes + require_dev_changes
    if not all_changes:
        return {"path": str(path), "changed": False}

    # widen_block mutated in place — data is already updated.
    dumped = json.dumps(data, indent=2, ensure_ascii=False)
    if text.endswith("\n"):
        dumped += "\n"
    path.write_text(dumped, encoding="utf-8")

    return {
        "path": str(path),
        "changed": True,
        "changes": all_changes,
    }


def find_composer_files(root: Path) -> list[Path]:
    out: list[Path] = []
    for p in root.rglob("composer.json"):
        if any(part in SKIP_DIR_NAMES for part in p.parts):
            continue
        out.append(p)
    return sorted(out)


def main() -> int:
    files = find_composer_files(WORKSPACE)
    reports = [sweep_file(p) for p in files]
    touched = [r for r in reports if r.get("changed")]
    errored = [r for r in reports if "error" in r]

    print("=== Widen illuminate/* constraints ===")
    print(f"Scanned composer.json files : {len(files)}")
    print(f"Files mutated               : {len(touched)}")
    print(f"Files with parse errors     : {len(errored)}")
    print()

    for report in errored:
        print(f"[ERROR] {report['path']}: {report['error']}")

    total_changes = 0
    for report in touched:
        rel = str(Path(report["path"]).relative_to(WORKSPACE))
        print(f"--- {rel}")
        for name, old, new in report["changes"]:
            total_changes += 1
            print(f"    {name}")
            print(f"      {old!r} -> {new!r}")
    print()
    print(f"Total constraint rewrites   : {total_changes}")
    return 0 if not errored else 1


if __name__ == "__main__":
    sys.exit(main())
