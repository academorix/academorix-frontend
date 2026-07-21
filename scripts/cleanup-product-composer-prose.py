#!/usr/bin/env python3
"""
cleanup-product-composer-prose.py

Second-pass cleanup for product composer.json files under
`apps/academorix/**`. The primary revert script normalises composer
`name` + PSR-4 mappings but only rewrites description prose when the
referenced package exists in the workspace (via composer_map).

This pass catches the leftovers:

  1. Aspirational SDK references like `stackra-finance/chargeback-sdk`
     that don't yet exist as packages — must still be product prose
     (`academorix-finance/chargeback-sdk`).
  2. Bare `Stackra` / `stackra` words in product description/keywords.
  3. Any composer.json that got dumped with `ensure_ascii=True`, which
     escaped em dashes to `\u2014` — re-dump with `ensure_ascii=False`.

Idempotent: safe to re-run.
"""

from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PRODUCT_APP = ROOT / "apps" / "academorix"


def iter_composer_jsons(base: Path):
    for path in base.rglob("composer.json"):
        parts = set(path.parts)
        if "vendor" in parts or "node_modules" in parts:
            continue
        yield path


def rewrite_prose(text: str) -> str:
    """Rewrite stackra-* refs + bare Stackra/stackra in prose."""
    # `stackra-<vendor>/<pkg>` and `stackra/<pkg>` -> academorix
    text = re.sub(
        r"\bstackra(-[a-z0-9-]+)?/([a-z0-9][a-z0-9-]*)",
        lambda m: "academorix" + (m.group(1) or "") + "/" + m.group(2),
        text,
    )
    # Bare Stackra word
    text = re.sub(r"\bStackra\b(?!-)", "Academorix", text)
    text = re.sub(r"\bstackra\b(?!-)", "academorix", text)
    return text


def rewrite_stackra_subvendor(text: str) -> str:
    """
    Rewrite product sub-vendor refs: `stackra-<vendor>/<pkg>` -> `academorix-*`.

    ALL sub-vendors used under apps/academorix/** are product-side
    (finance, growth, identity, notifications, platform, sports, user).
    Framework sub-vendors (observability, shared) don't appear here.
    """
    return re.sub(
        r"\bstackra(-[a-z0-9-]+)/([a-z0-9][a-z0-9-]*)",
        lambda m: "academorix" + m.group(1) + "/" + m.group(2),
        text,
    )


def main() -> int:
    # ── Pass 1: composer.json descriptions / keywords / authors ─────
    composer_touched = 0
    for cjson in iter_composer_jsons(PRODUCT_APP):
        try:
            with cjson.open("r", encoding="utf-8") as f:
                data = json.load(f)
        except json.JSONDecodeError:
            continue

        changed = False

        # Description
        desc = data.get("description")
        if isinstance(desc, str):
            new_desc = rewrite_stackra_subvendor(rewrite_prose(desc))
            if new_desc != desc:
                data["description"] = new_desc
                changed = True

        # Keywords
        keywords = data.get("keywords")
        if isinstance(keywords, list):
            new_keywords = [
                rewrite_stackra_subvendor(rewrite_prose(kw)) if isinstance(kw, str) else kw
                for kw in keywords
            ]
            if new_keywords != keywords:
                data["keywords"] = new_keywords
                changed = True

        # Authors
        authors = data.get("authors")
        if isinstance(authors, list):
            new_authors = []
            authors_changed = False
            for author in authors:
                if not isinstance(author, dict):
                    new_authors.append(author)
                    continue
                new_author = dict(author)
                if isinstance(author.get("name"), str):
                    new_name = rewrite_prose(author["name"])
                    if new_name != author["name"]:
                        new_author["name"] = new_name
                        authors_changed = True
                new_authors.append(new_author)
            if authors_changed:
                data["authors"] = new_authors
                changed = True

        # `require` / `require-dev` / `replace` / `provide` / `suggest`:
        # rewrite ONLY product-to-product refs (`stackra-<vendor>/<pkg>`
        # -> `academorix-<vendor>/<pkg>`). Leave `stackra/<pkg>` alone
        # (that's a framework dep, correctly Stackra).
        for section in ("require", "require-dev", "replace", "provide", "suggest"):
            deps = data.get(section)
            if not isinstance(deps, dict):
                continue
            new_deps = {}
            deps_changed = False
            for name, ver in deps.items():
                new_name = rewrite_stackra_subvendor(name)
                if new_name != name:
                    deps_changed = True
                new_deps[new_name] = ver
            if deps_changed:
                data[section] = new_deps
                changed = True

        # Re-encode when needed (fix \u2014 escapes)
        with cjson.open("r", encoding="utf-8") as f:
            raw = f.read()
        needs_reencode = "\\u2014" in raw or "\\u2013" in raw or "\\u00" in raw

        if changed or needs_reencode:
            composer_touched += 1
            with cjson.open("w", encoding="utf-8") as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
                f.write("\n")

    print(f"pass 1 (composer.json prose + product-to-product deps): "
          f"{composer_touched} files touched")

    # ── Pass 2: prose text files (README, .md, .mdx, catalog.json, module.json) ──
    text_exts = (".md", ".mdx", ".txt")
    other_json_touched = 0
    md_touched = 0

    for path in PRODUCT_APP.rglob("*"):
        if not path.is_file():
            continue
        parts = set(path.parts)
        if "vendor" in parts or "node_modules" in parts:
            continue
        if path.name == "composer.json":
            continue  # handled in pass 1

        # JSON files that aren't composer.json — treat as prose (catalog.json,
        # module.json, package.json, etc.). Rewrite string values, preserve
        # structure.
        if path.suffix == ".json":
            try:
                with path.open("r", encoding="utf-8") as f:
                    raw = f.read()
            except UnicodeDecodeError:
                continue
            new_raw = rewrite_stackra_subvendor(rewrite_prose(raw))
            if new_raw != raw:
                other_json_touched += 1
                with path.open("w", encoding="utf-8") as f:
                    f.write(new_raw)
        elif path.suffix in text_exts:
            try:
                with path.open("r", encoding="utf-8") as f:
                    raw = f.read()
            except UnicodeDecodeError:
                continue
            new_raw = rewrite_stackra_subvendor(rewrite_prose(raw))
            if new_raw != raw:
                md_touched += 1
                with path.open("w", encoding="utf-8") as f:
                    f.write(new_raw)

    print(f"pass 2 (README/.md/.mdx prose): {md_touched} files touched")
    print(f"pass 3 (other .json prose): {other_json_touched} files touched")

    # ── Pass 3: PHP docblock references ─────────────────────────
    php_touched = 0
    for php in PRODUCT_APP.rglob("*.php"):
        parts = set(php.parts)
        if "vendor" in parts or "node_modules" in parts:
            continue
        try:
            raw = php.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            continue
        new_raw = rewrite_stackra_subvendor(raw)
        if new_raw != raw:
            php_touched += 1
            php.write_text(new_raw, encoding="utf-8")

    print(f"pass 4 (PHP docblock prose): {php_touched} files touched")

    total = composer_touched + md_touched + other_json_touched + php_touched
    print(f"\ntotal: {total} files touched")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
