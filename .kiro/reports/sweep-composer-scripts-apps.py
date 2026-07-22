"""Second-pass sweep — apply the same canonical scripts block to every
composer.json under `apps/academorix/src/` (modules + sdks + blueprints).

Same shape as sweep-composer-scripts.py, different scan root.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path("/Users/akouta/Projects/academorix-frontend")
ACADEMORIX_SRC = ROOT / "apps" / "academorix" / "src"

# Canonical + DELETE + LEGACY — must match sweep-composer-scripts.py.
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

DELETE_KEYS = {"cache:clear", "cache:warm"}

LEGACY_KEYS = {
    "format",
    "test:unit",
    "phpstan",
    "pint",
    "pint:test",
    "pint:fix",
}


def find_composer_files() -> list[Path]:
    out: list[Path] = []
    for cj in ACADEMORIX_SRC.rglob("composer.json"):
        if "vendor" in cj.parts or "node_modules" in cj.parts:
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
        elif key in CANONICAL_SCRIPTS or key in LEGACY_KEYS or key in DELETE_KEYS:
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
    return True, f"updated"


def main() -> int:
    files = find_composer_files()
    print(f"Discovered {len(files)} composer.json files under apps/academorix/src/")

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
