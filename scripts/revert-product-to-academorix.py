#!/usr/bin/env python3
"""
revert-product-to-academorix.py

Product code under apps/academorix/** was over-renamed to Stackra by
the workspace-wide branding commit. Per the naming steering, product
code stays Academorix; only the framework migrates to Stackra.

This script reverts the PRODUCT SIDE ONLY (apps/academorix/**),
leaving:

  - Composer require / require-dev / replace / suggest blocks alone
    (their references to framework packages ARE stackra/*, correctly)
  - Framework imports inside product PHP files alone (use Stackra\Support,
    use Stackra\Console, use Stackra\Foundation, etc.)
  - Everything under packages/, tools/cli/, blueprints/, .kiro/, docs/
    alone

What it changes inside apps/academorix/**:

  - composer.json `name`                  stackra/foo -> academorix/foo
  - composer.json `autoload.psr-4`        Stackra\Foo\ -> Academorix\Foo\
  - composer.json `autoload-dev.psr-4`    same
  - composer.json `description` prose     rewrite "Stackra"/"stackra"
                                          when they refer to the product
  - composer.json `keywords`              same
  - Every .php file: namespace declaration + self-import statements +
    self-FQCN references (only namespaces that map to a PRODUCT package
    get reverted; framework imports stay Stackra)
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PRODUCT_APP = ROOT / "apps" / "academorix"


def load_json(path: Path) -> dict:
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def dump_json(path: Path, data: dict) -> None:
    with path.open("w", encoding="utf-8") as f:
        # ensure_ascii=False keeps em dashes and other UTF-8 chars intact.
        json.dump(data, f, indent=2, ensure_ascii=False)
        f.write("\n")


def iter_composer_jsons(base: Path):
    """Every composer.json under base, skipping vendor/node_modules."""
    for path in base.rglob("composer.json"):
        parts = set(path.parts)
        if "vendor" in parts or "node_modules" in parts:
            continue
        yield path


def iter_php(base: Path):
    """Every .php file under base, skipping vendor/node_modules."""
    for path in base.rglob("*.php"):
        parts = set(path.parts)
        if "vendor" in parts or "node_modules" in parts:
            continue
        yield path


def build_maps() -> tuple[dict[str, str], dict[str, str]]:
    """
    Walk every composer.json under apps/academorix/ and build:

      composer_map:  { "stackra/chargeback": "academorix/chargeback", ... }
      namespace_map: { "Stackra\\Chargeback": "Academorix\\Chargeback", ... }

    Only vendor prefixes that CURRENTLY start with `stackra` get an entry —
    those are the product packages the branding commit over-renamed.
    """
    composer_map: dict[str, str] = {}
    namespace_map: dict[str, str] = {}

    for cjson in iter_composer_jsons(PRODUCT_APP):
        try:
            data = load_json(cjson)
        except json.JSONDecodeError as e:
            print(f"WARN cannot parse {cjson}: {e}", file=sys.stderr)
            continue

        # composer name
        name = data.get("name", "")
        if "/" in name:
            vendor, pkg = name.split("/", 1)
            # `stackra/foo` -> `academorix/foo`
            # `stackra-sports/foo` -> `academorix-sports/foo`
            if vendor == "stackra" or vendor.startswith("stackra-"):
                new_vendor = "academorix" + vendor[len("stackra"):]
                new_name = f"{new_vendor}/{pkg}"
                composer_map[name] = new_name

        # PSR-4 roots
        for section in ("autoload", "autoload-dev"):
            psr4 = data.get(section, {}).get("psr-4", {})
            for ns in psr4:
                # ns comes out of json.load with real backslashes, not `\\`.
                # e.g. "Stackra\\Chargeback\\" in source JSON becomes
                # "Stackra\\Chargeback\\" here — one real backslash per pair.
                # Wait — json.load unescapes: source JSON `"Stackra\\Foo\\"` 
                # becomes Python string `"Stackra\Foo\"` (single backslashes).
                if ns.startswith("Stackra\\") or ns == "Stackra":
                    root = ns.rstrip("\\")
                    new_root = "Academorix" + root[len("Stackra"):]
                    namespace_map[root] = new_root

    return composer_map, namespace_map


def rewrite_php(text: str, namespace_map: dict[str, str]) -> tuple[str, int]:
    """
    Rewrite product namespaces in PHP source. Framework imports stay
    (use Stackra\Support\Str, etc.) because those namespaces aren't in
    the product map.

    Longest key first — `Stackra\Sports\Athlete` must match before
    `Stackra\Sports`.
    """
    hits = 0
    for old in sorted(namespace_map.keys(), key=lambda k: -len(k)):
        new = namespace_map[old]
        # Match `old` followed by `\`, whitespace, `;`, `(`, `)`, `,`,
        # `'`, `"`, `:`, `>`, `=` — anything that terminates a PHP
        # namespace-qualifier context. Simpler: match followed by NOT
        # an identifier character.
        pattern = re.compile(re.escape(old) + r"(?=[^A-Za-z0-9_]|$)")
        # Callable replacement bypasses re.sub's group-ref parsing —
        # backslashes in `new` won't be interpreted as \1 \g<name> etc.
        text, n = pattern.subn(lambda m, r=new: r, text)
        hits += n
    return text, hits


def rewrite_composer_json(
    data: dict,
    composer_map: dict[str, str],
    namespace_map: dict[str, str],
) -> int:
    """Rewrite the composer.json in place. Returns hit count."""
    hits = 0

    # Own name
    name = data.get("name")
    if name in composer_map:
        data["name"] = composer_map[name]
        hits += 1

    # PSR-4 mappings
    for section in ("autoload", "autoload-dev"):
        psr4 = data.get(section, {}).get("psr-4")
        if not isinstance(psr4, dict):
            continue
        new_psr4 = {}
        for ns, src in psr4.items():
            root = ns.rstrip("\\")
            new_ns = ns
            if root in namespace_map:
                new_ns = namespace_map[root] + "\\"
                hits += 1
            else:
                # Nested match — Stackra\Foo\Sub matches root Stackra\Foo
                for old in sorted(namespace_map.keys(), key=lambda k: -len(k)):
                    if root.startswith(old + "\\"):
                        new_ns = namespace_map[old] + root[len(old):] + "\\"
                        hits += 1
                        break
            new_psr4[new_ns] = src
        data[section]["psr-4"] = new_psr4

    # Description prose — rewrite composer names + bare Stackra/stackra
    desc = data.get("description")
    if isinstance(desc, str):
        new_desc = desc
        for old in sorted(composer_map.keys(), key=lambda k: -len(k)):
            new_desc = new_desc.replace(old, composer_map[old])
        # Catch any stackra-<vendor>/<pkg> or stackra/<pkg> reference that
        # isn't in composer_map (aspirational SDKs, not-yet-created
        # packages). Product-side prose should never carry stackra-*
        # composer names.
        new_desc = re.sub(
            r"\bstackra(-[a-z0-9-]+)?/([a-z0-9][a-z0-9-]*)",
            lambda m: "academorix" + (m.group(1) or "") + "/" + m.group(2),
            new_desc,
        )
        # Bare "Stackra" / "stackra" in product-side prose IS a mistake —
        # revert word-boundary matches.
        new_desc = re.sub(r"\bStackra\b(?!-)", "Academorix", new_desc)
        new_desc = re.sub(r"\bstackra\b(?!-)", "academorix", new_desc)
        if new_desc != desc:
            data["description"] = new_desc
            hits += 1

    # Keywords — same treatment
    keywords = data.get("keywords")
    if isinstance(keywords, list):
        new_keywords = []
        changed = False
        for kw in keywords:
            new_kw = kw.replace("stackra", "academorix").replace("Stackra", "Academorix")
            if new_kw != kw:
                changed = True
            new_keywords.append(new_kw)
        if changed:
            data["keywords"] = new_keywords
            hits += 1

    return hits


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dry-run", action="store_true", help="report only")
    args = parser.parse_args()
    write = not args.dry_run

    if not PRODUCT_APP.is_dir():
        print(f"error: {PRODUCT_APP} does not exist", file=sys.stderr)
        return 1

    composer_map, namespace_map = build_maps()
    print(f"discovered {len(composer_map)} product composer names + "
          f"{len(namespace_map)} namespaces to revert\n")

    if not composer_map and not namespace_map:
        print("nothing to do")
        return 0

    print("sample composer names:")
    for i, (k, v) in enumerate(composer_map.items()):
        if i >= 8:
            break
        print(f"  {k} -> {v}")
    print()
    print("sample namespaces:")
    for i, (k, v) in enumerate(sorted(namespace_map.items())[:8]):
        print(f"  {k} -> {v}")
    print()

    # Pass 1: composer.json own name + PSR-4 + prose
    composer_hits = 0
    for cjson in iter_composer_jsons(PRODUCT_APP):
        try:
            data = load_json(cjson)
        except json.JSONDecodeError:
            continue
        n = rewrite_composer_json(data, composer_map, namespace_map)
        if n > 0:
            composer_hits += 1
            if write:
                dump_json(cjson, data)
    print(f"pass 1 (composer.json own+PSR-4+prose): {composer_hits} files touched")

    # Pass 2: PHP files under product
    php_hits = 0
    for php in iter_php(PRODUCT_APP):
        try:
            text = php.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            continue
        new_text, n = rewrite_php(text, namespace_map)
        if n > 0:
            php_hits += 1
            if write:
                php.write_text(new_text, encoding="utf-8")
    print(f"pass 2 (product PHP files): {php_hits} files touched")

    print(f"\ntotal: {composer_hits + php_hits} files touched")
    return 0


if __name__ == "__main__":
    sys.exit(main())
