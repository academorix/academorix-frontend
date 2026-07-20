#!/usr/bin/env python3
"""
Migrate every packages/*/tsconfig.json and tsup.config.ts to use the
extracted @academorix/config-tsconfig + @academorix/config-tsup packages.

Rewrites:
- tsconfig.json:     "extends": "../../tsconfig.base.json"  ->  "@academorix/config-tsconfig/base"
- tsup.config.ts:    from "../../tsup.config.base"           ->  from "@academorix/config-tsup"
- package.json:      adds @academorix/config-tsconfig + @academorix/config-tsup to devDependencies

Idempotent — running twice is a no-op.
"""

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).parent.parent.resolve()


def _strip_jsonc(text: str) -> str:
    """Strip // + /* */ comments and trailing commas so tsconfig JSONC parses as JSON."""
    # Remove // line comments (but NOT // inside strings — good enough for tsconfig)
    text = re.sub(r"^\s*//.*$", "", text, flags=re.MULTILINE)
    # Remove /* */ block comments (non-greedy, multiline)
    text = re.sub(r"/\*.*?\*/", "", text, flags=re.DOTALL)
    # Remove trailing commas before } or ]
    text = re.sub(r",(\s*[}\]])", r"\1", text)
    return text


def rewrite_tsconfig(path: Path) -> bool:
    """Rewrite a package's tsconfig.json extends field. Returns True if changed."""
    raw = path.read_text()
    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        # Try again with JSONC comments/trailing-commas stripped.
        try:
            data = json.loads(_strip_jsonc(raw))
        except json.JSONDecodeError as e:
            print(f"  ! skip: {path.relative_to(ROOT)} — JSONC parse failed ({e})")
            return False
        # Fall through: regex-rewrite the extends field directly so we
        # preserve the original JSONC formatting.
        extends_match = re.search(r'"extends"\s*:\s*"([^"]+)"', raw)
        if not extends_match:
            return False
        current = extends_match.group(1)
        if "config-tsconfig" in current or not current.endswith("tsconfig.base.json"):
            return False
        new_raw = re.sub(
            r'"extends"\s*:\s*"[^"]+"',
            '"extends": "@academorix/config-tsconfig/base"',
            raw,
            count=1,
        )
        path.write_text(new_raw)
        return True

    extends = data.get("extends", "")
    if not extends.endswith("tsconfig.base.json"):
        return False
    if "config-tsconfig" in extends:
        return False  # already migrated
    data["extends"] = "@academorix/config-tsconfig/base"
    path.write_text(json.dumps(data, indent=2) + "\n")
    return True


def rewrite_tsup(path: Path) -> bool:
    """Rewrite a package's tsup.config.ts import. Returns True if changed."""
    text = path.read_text()
    new_text = re.sub(
        r'from ["\'](?:\.\./)+tsup\.config\.base["\']',
        'from "@academorix/config-tsup"',
        text,
    )
    if new_text == text:
        return False
    path.write_text(new_text)
    return True


def rewrite_package_json(path: Path) -> bool:
    """Add config packages to devDependencies. Returns True if changed."""
    data = json.loads(path.read_text())
    dev = data.setdefault("devDependencies", {})
    changed = False
    for pkg in ("@academorix/config-tsconfig", "@academorix/config-tsup"):
        if pkg not in dev:
            dev[pkg] = "workspace:*"
            changed = True
    if changed:
        # Sort devDependencies alphabetically (idiomatic).
        data["devDependencies"] = dict(sorted(dev.items()))
        path.write_text(json.dumps(data, indent=2) + "\n")
    return changed


def main():
    stats = {"tsconfig": 0, "tsup": 0, "package": 0}
    # Walk every package under packages/frontend/, packages/sdk/, packages/backend/, packages/config/, apps/
    # Skip config-tsup and config-tsconfig — they can't add themselves as devDeps.
    SKIP_PACKAGES = {"tsup", "tsconfig"}  # only under packages/config/
    for root_dir in ["packages/frontend", "packages/sdk", "packages/config", "apps"]:
        base = ROOT / root_dir
        if not base.exists():
            continue
        for pkg_dir in base.iterdir():
            if not pkg_dir.is_dir():
                continue
            if pkg_dir.name.startswith("."):
                continue
            if root_dir == "packages/config" and pkg_dir.name in SKIP_PACKAGES:
                continue  # config-tsup / config-tsconfig can't self-reference
            # tsconfig.json
            tsconfig = pkg_dir / "tsconfig.json"
            if tsconfig.exists():
                if rewrite_tsconfig(tsconfig):
                    stats["tsconfig"] += 1
                    print(f"  ✓ tsconfig: {tsconfig.relative_to(ROOT)}")
            # tsup.config.ts
            tsup = pkg_dir / "tsup.config.ts"
            if tsup.exists():
                if rewrite_tsup(tsup):
                    stats["tsup"] += 1
                    print(f"  ✓ tsup:     {tsup.relative_to(ROOT)}")
            # package.json — only add devDeps if the package uses tsup or tsconfig-extending
            pkg_json = pkg_dir / "package.json"
            if pkg_json.exists() and (tsconfig.exists() or tsup.exists()):
                if rewrite_package_json(pkg_json):
                    stats["package"] += 1
                    print(f"  ✓ package:  {pkg_json.relative_to(ROOT)}")

    print()
    print(f"Migrated: {stats['tsconfig']} tsconfig.json + {stats['tsup']} tsup.config.ts + {stats['package']} package.json devDeps")


if __name__ == "__main__":
    main()
