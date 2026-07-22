#!/usr/bin/env python3
"""
Move packages/backend/platform/safeguarding/ → apps/academorix/src/modules/platform/safeguarding/.

Rewrites:
  1. Every PHP file — `Stackra\Safeguarding\...` → `Academorix\Safeguarding\...`.
  2. composer.json — name, description, PSR-4 map, provider FQCN, path-repo URLs,
     and drop the stackra-platform/safeguarding-sdk require (SDK deleted).
  3. Deletes the original source tree once the copy is verified.

Also removes stackra/safeguarding from apps/laravel-template/composer.json
(require + path-repo) — safeguarding is no longer a framework package.
"""

from __future__ import annotations

import json
import shutil
import sys
from pathlib import Path

WORKSPACE = Path("/Users/akouta/Projects/academorix-frontend")
SRC = WORKSPACE / "packages" / "backend" / "platform" / "safeguarding"
DEST = WORKSPACE / "apps" / "academorix" / "src" / "modules" / "platform" / "safeguarding"

OLD_NAMESPACE = "Stackra\\Safeguarding"
NEW_NAMESPACE = "Academorix\\Safeguarding"


def copy_tree() -> None:
    """Copy SRC → DEST verbatim. Fails loudly if DEST already exists."""
    if DEST.exists():
        raise SystemExit(f"Destination already exists: {DEST}")
    DEST.parent.mkdir(parents=True, exist_ok=True)
    shutil.copytree(SRC, DEST)


def rewrite_php_namespaces() -> int:
    """
    Walk DEST/src + DEST/tests and rewrite every PHP file's namespace.

    Returns the number of files touched.
    """
    touched = 0
    for php in DEST.rglob("*.php"):
        text = php.read_text(encoding="utf-8")
        if OLD_NAMESPACE not in text:
            continue
        new_text = text.replace(OLD_NAMESPACE, NEW_NAMESPACE)
        php.write_text(new_text, encoding="utf-8")
        touched += 1
    return touched


def rewrite_composer_json() -> None:
    """Retarget the copied composer.json for its new home under academorix."""
    path = DEST / "composer.json"
    data = json.loads(path.read_text(encoding="utf-8"))

    # Identity
    data["name"] = "academorix/safeguarding"
    data["description"] = (
        "Academorix Safeguarding module — cross-domain safeguarding + minor consent surface. "
        "Lives under apps/academorix/src/modules/platform/safeguarding/ so it deploys with "
        "the per-Application backend service (safeguarding is a per-Application concern, not "
        "a shared identity-plane one)."
    )
    data["keywords"] = ["academorix", "module", "laravel", "platform", "safeguarding"]

    # Drop the stackra-platform/safeguarding-sdk require — SDKs deleted in the 6-service-split cut.
    for block in ("require", "require-dev"):
        if block in data:
            data[block] = {
                k: v
                for k, v in data[block].items()
                if k != "stackra-platform/safeguarding-sdk"
            }

    # PSR-4 map — Stackra\Safeguarding\ → Academorix\Safeguarding\.
    for key in ("autoload", "autoload-dev"):
        if key in data and "psr-4" in data[key]:
            data[key]["psr-4"] = {
                k.replace("Stackra\\Safeguarding\\", "Academorix\\Safeguarding\\"): v
                for k, v in data[key]["psr-4"].items()
            }

    # Provider FQCN — fix the mismatch AND retarget to the new namespace root.
    if "extra" in data and "laravel" in data["extra"]:
        laravel = data["extra"]["laravel"]
        if "providers" in laravel:
            laravel["providers"] = [
                p.replace("Stackra\\Safeguarding\\", "Academorix\\Safeguarding\\")
                for p in laravel["providers"]
            ]

    # Path repos — retarget every relative URL to work from the new location.
    # Old location: packages/backend/platform/safeguarding/ (rel: ../../<pkg>)
    # New location: apps/academorix/src/modules/platform/safeguarding/ (rel: ../../../../../../packages/backend/<pkg>)
    prefix_new = "../../../../../../packages/backend/"
    if "repositories" in data:
        for entry in data["repositories"]:
            if not isinstance(entry, dict) or entry.get("type") != "path":
                continue
            url = entry.get("url", "")
            # The old URLs are of the form ../../framework/crud or ../../foundation.
            # Strip the leading "../../" and re-anchor at packages/backend/.
            stripped = url.lstrip("./")
            entry["url"] = prefix_new + stripped

    path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def strip_safeguarding_from_laravel_template() -> None:
    """
    Remove stackra/safeguarding + its path-repo entry from
    apps/laravel-template/composer.json. Safeguarding is no longer a
    framework package — it's an academorix module.
    """
    path = WORKSPACE / "apps" / "laravel-template" / "composer.json"
    data = json.loads(path.read_text(encoding="utf-8"))

    # Strip the require.
    for block in ("require", "require-dev"):
        if block in data and "stackra/safeguarding" in data[block]:
            del data[block]["stackra/safeguarding"]

    # Strip the path-repo pointing at packages/backend/platform/safeguarding.
    if "repositories" in data:
        kept = []
        for entry in data["repositories"]:
            if (
                isinstance(entry, dict)
                and entry.get("type") == "path"
                and "platform/safeguarding" in entry.get("url", "")
            ):
                continue
            kept.append(entry)
        data["repositories"] = kept

    path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def delete_source_tree() -> None:
    """Remove the original packages/backend/platform/safeguarding/."""
    shutil.rmtree(SRC)


def main() -> int:
    if not SRC.exists():
        print(f"Source missing: {SRC}", file=sys.stderr)
        return 1

    print(f"Copying   : {SRC.relative_to(WORKSPACE)}")
    print(f"        → : {DEST.relative_to(WORKSPACE)}")
    copy_tree()

    touched = rewrite_php_namespaces()
    print(f"Rewrote PHP namespaces in {touched} files.")

    rewrite_composer_json()
    print("Rewrote composer.json (name, PSR-4, provider FQCN, path-repos).")

    strip_safeguarding_from_laravel_template()
    print("Stripped stackra/safeguarding from apps/laravel-template/composer.json.")

    delete_source_tree()
    print(f"Deleted source: {SRC.relative_to(WORKSPACE)}")

    return 0


if __name__ == "__main__":
    sys.exit(main())
