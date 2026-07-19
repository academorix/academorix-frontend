#!/usr/bin/env python3
"""Fix double-backslash PSR-4 keys in backend-packages/*/*/composer.json.

Pre-existing bug in emit_composer_json produced autoload keys like
`Academorix\\\\Foo\\\\` in JSON (two literal backslashes per separator)
instead of the correct `Academorix\\Foo\\` (one). PSR-4 autoload silently
fails for every affected module. This one-off pass rewrites every
composer.json under backend-packages/ so the psr-4 keys use single
backslashes.

Also handles the `provider` field in `extra.laravel.providers`, which
carries the same artifact.
"""
import json
from pathlib import Path


def normalize(s: str) -> str:
    while "\\\\" in s:
        s = s.replace("\\\\", "\\")
    return s


def normalize_key(s: str) -> str:
    s = normalize(s)
    return s if s.endswith("\\") else s + "\\"


def normalize_class_ref(s: str) -> str:
    return normalize(s).rstrip("\\")


fixed = 0
scanned = 0
for composer_path in Path("backend-packages").glob("*/*/composer.json"):
    scanned += 1
    original = composer_path.read_text()
    try:
        data = json.loads(original)
    except json.JSONDecodeError:
        print(f"skip (invalid JSON): {composer_path}")
        continue

    changed = [False]

    def fix_psr4_block(block: dict) -> dict:
        out = {}
        for k, v in block.items():
            fixed_key = normalize_key(k)
            if fixed_key != k:
                changed[0] = True
            out[fixed_key] = v
        return out

    autoload = data.get("autoload") or {}
    if isinstance(autoload.get("psr-4"), dict):
        autoload["psr-4"] = fix_psr4_block(autoload["psr-4"])
        data["autoload"] = autoload

    autoload_dev = data.get("autoload-dev") or {}
    if isinstance(autoload_dev.get("psr-4"), dict):
        autoload_dev["psr-4"] = fix_psr4_block(autoload_dev["psr-4"])
        data["autoload-dev"] = autoload_dev

    laravel_extra = (data.get("extra") or {}).get("laravel") or {}
    providers = laravel_extra.get("providers")
    if isinstance(providers, list):
        new_providers = [
            normalize_class_ref(p) if isinstance(p, str) else p for p in providers
        ]
        if new_providers != providers:
            data["extra"]["laravel"]["providers"] = new_providers
            changed[0] = True

    if changed[0]:
        composer_path.write_text(json.dumps(data, indent=4) + "\n")
        fixed += 1

print(f"Scanned: {scanned}")
print(f"Fixed:   {fixed}")
