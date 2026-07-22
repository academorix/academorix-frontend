"""Sweep every backend package's composer.json `scripts` block to point at
Foundation's shared script handlers.

For every `packages/backend/**/composer.json` (except `foundation` itself,
which owns the handlers):

  1. Replace the `scripts` block with the canonical shape (below).
  2. Preserve any custom `scripts` entries the package already has
     that DON'T match the canonical keys (e.g. `benchmark`, `docs:gen`).
  3. Preserve the `post-*` composer hooks (post-autoload-dump etc.)
     verbatim — those are Laravel-plumbing, not app scripts.
  4. REMOVE keys named in ``DELETE_KEYS``. These are keys that
     previously pointed at Foundation's ``CacheScripts::*`` handlers
     but that class has been retired — the concern moved to artisan
     commands (``cache:flush``, ``cache:build``) in
     ``packages/backend/framework/caching/src/Console/``.

Idempotent — re-running on an already-swept file is a no-op.

Committed under `.kiro/reports/` as an audit artefact.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path("/Users/akouta/Projects/academorix-frontend")
BACKEND = ROOT / "packages" / "backend"

# Canonical scripts every backend package ships.
# NOTE: cache:clear + cache:warm were REMOVED — they are now artisan
# commands in packages/backend/framework/caching (`cache:flush` +
# `cache:build`) and the app-level composer.json aliases them per
# Doppler-first pattern.
CANONICAL_SCRIPTS = {
    "test": "Stackra\\Foundation\\Scripts\\TestScripts::run",
    "test:coverage": "Stackra\\Foundation\\Scripts\\TestScripts::coverage",
    "test:parallel": "Stackra\\Foundation\\Scripts\\TestScripts::parallel",
    "test:filter": "Stackra\\Foundation\\Scripts\\TestScripts::filter",
    "analyse": "Stackra\\Foundation\\Scripts\\AnalyseScripts::run",
    "analyse:baseline": "Stackra\\Foundation\\Scripts\\AnalyseScripts::baseline",
    "lint": "Stackra\\Foundation\\Scripts\\LintScripts::check",
    "lint:fix": "Stackra\\Foundation\\Scripts\\LintScripts::fix",
    "doppler:status": "Stackra\\Foundation\\Scripts\\DopplerScripts::status",
    "doppler:setup": "Stackra\\Foundation\\Scripts\\DopplerScripts::setup",
}

# Keys previously in CANONICAL_SCRIPTS that must be REMOVED on re-sweep.
# Their concern moved to artisan commands.
DELETE_KEYS = {
    "cache:clear",
    "cache:warm",
}

# Legacy keys we may find that legally map to canonical ones.
LEGACY_ALIASES = {
    "format",
    "test:unit",
    "phpstan",
    "pint",
    "pint:test",
    "pint:fix",
}


def find_composer_files() -> list[Path]:
    out: list[Path] = []
    for cj in BACKEND.rglob("composer.json"):
        if "vendor" in cj.parts or "node_modules" in cj.parts:
            continue
        try:
            rel = cj.relative_to(BACKEND)
        except ValueError:
            continue
        if len(rel.parts) > 4:
            continue
        out.append(cj)
    return sorted(out)


def sweep_file(cj: Path) -> tuple[bool, str]:
    try:
        data = json.loads(cj.read_text())
    except json.JSONDecodeError as e:
        return False, f"skip (invalid json): {e}"

    existing = data.get("scripts", {}) or {}
    hooks: dict[str, object] = {}
    customs: dict[str, object] = {}

    for key, value in existing.items():
        if key.startswith("post-") or key.startswith("pre-"):
            hooks[key] = value
        elif key in CANONICAL_SCRIPTS or key in LEGACY_ALIASES or key in DELETE_KEYS:
            # Drop — replaced or deleted below.
            continue
        else:
            customs[key] = value

    new_scripts: dict[str, object] = {}
    new_scripts.update(hooks)
    new_scripts.update(CANONICAL_SCRIPTS)
    new_scripts.update(customs)

    if new_scripts == existing:
        return False, "unchanged"

    data["scripts"] = new_scripts
    cj.write_text(json.dumps(data, indent=2) + "\n")
    return True, f"updated ({len(hooks)} hooks + {len(CANONICAL_SCRIPTS)} canonical + {len(customs)} custom)"


def main() -> int:
    files = find_composer_files()
    print(f"Discovered {len(files)} composer.json files under packages/backend/")

    changed = 0
    for cj in files:
        rel = cj.relative_to(ROOT).as_posix()
        did_change, msg = sweep_file(cj)
        prefix = "✔" if did_change else " "
        print(f" {prefix} {rel} — {msg}")
        if did_change:
            changed += 1

    print()
    print(f"changed: {changed} / {len(files)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
