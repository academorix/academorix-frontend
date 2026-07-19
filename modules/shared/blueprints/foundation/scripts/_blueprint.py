#!/usr/bin/env python3
"""_blueprint.py — shared blueprint reader for the code generators.

Extracted from `generate-sdk.py` so both `generate-sdk.py` (wire SDK) and
`generate-module.py` (Laravel module scaffold) work off the same typed
data model. Every downstream emitter imports its inputs from here.

The reader walks a module blueprint at
`modules/<tier>/blueprints/<name>/` (or the legacy `modules/<tier>/<name>/`
layout) and returns a `Module` with fully-typed `Entity`, `Column`, and
`Route` children.

Public surface (in dependency order):

  - casing helpers: `studly`, `camel`, `snake`, `kebab`, `singular`,
    `_pluralize`
  - dataclasses: `Column`, `Entity`, `Route`, `Module`
  - entry point: `read_module(tier: str, name: str) -> Module`
  - docblock helpers: `_php_docblock`, `_first_sentence`
  - path constant: `REPO_ROOT`

The `_`-prefixed helpers are internal to the generators; they are exposed
because both `generate-sdk.py` and `generate-module.py` need them. Callers
outside this scripts folder should stick to the four dataclasses +
`read_module`.
"""

from __future__ import annotations

import json
import re
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

# Repo root is four levels up: scripts/ -> foundation/ -> shared/ -> modules/ -> root.
# When this file is imported from a sibling script the resolution is identical.
REPO_ROOT = Path(__file__).resolve().parents[5]


# ---------------------------------------------------------------------------
# Casing helpers.
# ---------------------------------------------------------------------------

def _split_words(s: str) -> list[str]:
    """Split kebab / snake / camel and any non-alphanumeric run into word chunks.

    Every character that isn't `[a-zA-Z0-9]` is a separator — so route
    segments like `jwks.json`, `well-known/foo`, or `checks[id]` produce
    valid PHP identifiers when passed to `studly()`.
    """
    return [
        w.lower()
        for w in re.split(r"[^A-Za-z0-9]+|(?<=[a-z0-9])(?=[A-Z])", s)
        if w
    ]


def studly(s: str) -> str:
    """kebab-case / snake_case -> StudlyCase (e.g. `tenants` -> `Tenants`)."""
    return "".join(w.capitalize() for w in _split_words(s))


def camel(s: str) -> str:
    """kebab-case / snake_case -> camelCase."""
    words = _split_words(s)
    if not words:
        return ""
    return words[0] + "".join(w.capitalize() for w in words[1:])


def snake(s: str) -> str:
    """StudlyCase / camelCase -> snake_case."""
    return "_".join(_split_words(s))


def kebab(s: str) -> str:
    """Everything -> kebab-case."""
    return "-".join(_split_words(s))


def singular(s: str) -> str:
    """Naive singular for common English plurals; sufficient for our nouns."""
    special = {
        "business-types": "business-type",
        "categories": "category",
        "policies": "policy",
        "identities": "identity",
        "hierarchies": "hierarchy",
    }
    key = kebab(s)
    if key in special:
        return special[key]
    if key.endswith("ses") or key.endswith("xes"):
        return key[:-2]
    if key.endswith("ies"):
        return key[:-3] + "y"
    if key.endswith("s") and not key.endswith("ss"):
        return key[:-1]
    return key


# ---------------------------------------------------------------------------
# Blueprint data model.
# ---------------------------------------------------------------------------

@dataclass
class Column:
    """One column on an entity — from schema's `x-database.columns`."""

    name: str
    php_type: str
    nullable: bool
    description: str
    is_enum: bool = False
    enum_values: list[str] = field(default_factory=list)
    max_length: int | None = None
    pattern: str | None = None
    min_length: int | None = None
    wire_hidden: bool = False
    wire_computed: bool = False


@dataclass
class Entity:
    """One entity — from `schemas/<entity>.schema.json`."""

    name: str  # e.g. "application"
    class_name: str  # e.g. "Application"
    key_prefix: str  # e.g. "app_"
    description: str
    server_model_class: str  # e.g. "Academorix\\Application\\Models\\Application"
    columns: list[Column]
    aggregate: str  # e.g. "applications" (kebab-case plural)

    @property
    def wire_columns(self) -> list[Column]:
        return [c for c in self.columns if not c.wire_hidden]


@dataclass
class Route:
    """One HTTP endpoint — extracted from module.json.hosts[]."""

    verb: str  # GET / POST / PATCH / DELETE
    path: str  # /api/v1/applications/{id}
    audience: str  # central / tenant / platform-admin
    aggregate: str  # "applications" (the entity's plural)
    op: str  # list / show / create / update / delete / custom
    # For 'custom' ops:
    custom_name: str | None = None  # e.g. "verify" from POST /domains/{id}/verify

    @property
    def has_body(self) -> bool:
        return self.verb in ("POST", "PATCH", "PUT")

    @property
    def is_mutation(self) -> bool:
        return self.verb in ("POST", "PATCH", "PUT", "DELETE")


@dataclass
class Module:
    """The full module blueprint."""

    tier: str  # e.g. "platform"
    name: str  # e.g. "tenants"
    description: str
    entities: list[Entity]
    routes: list[Route]

    @property
    def studly_name(self) -> str:
        return studly(self.name)

    @property
    def ns_root(self) -> str:
        """Namespace prefix for the SDK package."""
        return f"Academorix\\{studly(self.tier)}{studly(self.name)}Sdk"

    @property
    def ns_module_root(self) -> str:
        """Namespace prefix for the server-side module package (no Sdk suffix).

        Consumed by `generate-module.py`. Tier prefix keeps namespaces globally
        unique across the monorepo (e.g. `Academorix\\Sports\\Registrations`
        vs `Academorix\\Growth\\CrmLeads`).
        """
        return f"Academorix\\{studly(self.tier)}\\{studly(self.name)}"

    @property
    def composer_name(self) -> str:
        return f"academorix-{self.tier}/{self.name}-sdk"

    @property
    def composer_module_name(self) -> str:
        """Composer name for the server-side module (no `-sdk` suffix)."""
        return f"academorix-{self.tier}/{self.name}"

    @property
    def sdk_dir_name(self) -> str:
        return f"{self.tier}-{self.name}-sdk"

    @property
    def module_dir_name(self) -> str:
        """Output dir name for the server-side module package."""
        return f"{self.tier}-{self.name}"


# ---------------------------------------------------------------------------
# Blueprint reader.
# ---------------------------------------------------------------------------

SCHEMA_TO_PHP: dict[str, str] = {
    "string": "string",
    "integer": "int",
    "number": "float",
    "boolean": "bool",
    "array": "array",
    "object": "array",
    "jsonb": "array",
    "json": "array",
    "uuid": "string",
    "ulid": "string",
    "date": "string",
    "date-time": "string",
    "datetime": "string",
    "timestamptz": "string",
    "timestamp": "string",
    "bigint": "int",
    "int": "int",
    "text": "string",
    "citext": "string",
    "bool": "bool",
}


def _php_type_of(col: dict[str, Any]) -> str:
    """Best-effort mapping of a schema column spec to a PHP type."""
    # Prefer JSON Schema `type` when present; fall back to x-database `type`.
    t = col.get("type")
    if isinstance(t, list):
        # e.g. ["string", "null"]
        for candidate in t:
            if candidate != "null":
                t = candidate
                break
    if not isinstance(t, str):
        return "string"
    db_type = str(t).lower().split("(")[0]
    return SCHEMA_TO_PHP.get(db_type, "string")


def _extract_columns(schema: dict[str, Any]) -> list[Column]:
    """Walk `x-database.columns` + `properties` to build the Column list."""
    x_db = schema.get("x-database", {})
    db_columns: dict[str, Any] = x_db.get("columns", {}) or {}
    props: dict[str, Any] = schema.get("properties", {}) or {}
    required = set(schema.get("required", []))
    hidden = set((schema.get("x-wire", {}) or {}).get("hidden", []))
    # `x-wire.computed` may be a list of column names OR a list of rich
    # column-definition dicts (`{"name": "...", "expression": "..."}`).
    # Normalise to a set of column names either way.
    raw_computed = (schema.get("x-wire", {}) or {}).get("computed", []) or []
    computed = {
        (c.get("name") if isinstance(c, dict) else c) for c in raw_computed
    } - {None}

    columns: list[Column] = []
    # Iterate db columns first; fall back to properties for pure JSON-Schema
    # blueprints without an x-database block.
    keys = list(db_columns.keys()) if db_columns else list(props.keys())
    for name in keys:
        col_spec = db_columns.get(name, {}) or {}
        prop_spec = props.get(name, {}) or {}

        # Nullability: db `nullable` wins; else property-level.
        nullable = bool(col_spec.get("nullable", name not in required))

        # PHP type derives from the property schema (richer) with a fall-back
        # to the db column type.
        php_type = _php_type_of(prop_spec) if prop_spec else _php_type_of(col_spec)

        # Description sourced from wherever it lives.
        description = str(
            prop_spec.get("description")
            or col_spec.get("description")
            or ""
        ).strip()

        # Enum detection — property-level `enum` list.
        is_enum = bool(prop_spec.get("enum"))
        enum_values = list(prop_spec.get("enum", []))

        # Length / regex constraints — property-level.
        max_length = prop_spec.get("maxLength")
        min_length = prop_spec.get("minLength")
        pattern = prop_spec.get("pattern")

        columns.append(Column(
            name=name,
            php_type=php_type,
            nullable=nullable,
            description=description,
            is_enum=is_enum,
            enum_values=enum_values if enum_values else [],
            max_length=int(max_length) if isinstance(max_length, int) else None,
            min_length=int(min_length) if isinstance(min_length, int) else None,
            pattern=str(pattern) if pattern else None,
            wire_hidden=name in hidden,
            wire_computed=name in computed,
        ))

    return columns


def _extract_entity(schema_path: Path, module_name: str) -> Entity:
    """Parse one `schemas/<entity>.schema.json` into an `Entity`."""
    data = json.loads(schema_path.read_text())
    entity_name = schema_path.stem.replace(".schema", "")

    x_el = data.get("x-eloquent", {}) or {}
    model_fqcn = x_el.get("model", f"App\\Models\\{studly(entity_name)}")
    key_prefix = x_el.get("keyPrefix", "")

    columns = _extract_columns(data)

    # Aggregate = plural kebab of the entity name (e.g. tenant -> tenants).
    aggregate = _pluralize(entity_name)

    return Entity(
        name=entity_name,
        class_name=studly(entity_name),
        key_prefix=key_prefix,
        description=str(data.get("description", "")).strip(),
        server_model_class=model_fqcn,
        columns=columns,
        aggregate=aggregate,
    )


def _pluralize(name: str) -> str:
    """Naive English plural for aggregate detection."""
    kebab_name = kebab(name)
    special = {
        "business-type": "business-types",
        "category": "categories",
        "policy": "policies",
        "identity": "identities",
        "settings-group": "settings-groups",
        "settings-schema": "settings-schemas",
        "setting-value": "setting-values",
        "webhook-subscription": "webhook-subscriptions",
        "webhook-delivery": "webhook-deliveries",
        "file-variant": "file-variants",
        "signed-url-audit": "signed-url-audits",
        "chunked-upload": "chunked-uploads",
        "tenant-contact": "tenant-contacts",
        "tenant-integration": "tenant-integrations",
        "domain-record": "domain-records",
    }
    if kebab_name in special:
        return special[kebab_name]
    if kebab_name.endswith("y"):
        return kebab_name[:-1] + "ies"
    if kebab_name.endswith("s"):
        return kebab_name + "es"
    return kebab_name + "s"


def _extract_routes(module_json: dict[str, Any], entities: list[Entity]) -> list[Route]:
    """
    Extract HTTP routes from `module.json.hosts[<audience>].routes[]`.

    Route strings come in two flavours:
      1. "GET /api/v1/tenants"                     (concrete verb + path)
      2. "* /api/v1/applications*"                 (wildcard — expand to CRUD)
    """
    routes: list[Route] = []
    hosts = module_json.get("hosts", {}) or {}
    aggregate_names = {e.aggregate for e in entities} | {e.name for e in entities}

    for audience, host_spec in hosts.items():
        raw_routes = (host_spec or {}).get("routes", []) or []
        for r in raw_routes:
            spec = r.strip()
            # Split verb + path.
            m = re.match(r"^([A-Z*]+)\s+(.+)$", spec)
            if not m:
                continue
            verb, path = m.group(1), m.group(2)

            # Aggregate detection: last non-{param} segment before /{id} etc.
            aggregate = _aggregate_from_path(path, aggregate_names)

            if verb == "*" and path.endswith("*"):
                # Wildcard CRUD expansion.
                base = path.rstrip("*").rstrip("/")
                routes.extend([
                    Route(verb="GET",    path=base,            audience=audience, aggregate=aggregate, op="list"),
                    Route(verb="POST",   path=base,            audience=audience, aggregate=aggregate, op="create"),
                    Route(verb="GET",    path=f"{base}/{{id}}", audience=audience, aggregate=aggregate, op="show"),
                    Route(verb="PATCH",  path=f"{base}/{{id}}", audience=audience, aggregate=aggregate, op="update"),
                    Route(verb="DELETE", path=f"{base}/{{id}}", audience=audience, aggregate=aggregate, op="delete"),
                ])
                continue

            # Concrete verb.
            op, custom = _classify_op(verb, path)
            routes.append(Route(
                verb=verb,
                path=path,
                audience=audience,
                aggregate=aggregate,
                op=op,
                custom_name=custom,
            ))
    return routes


def _aggregate_from_path(path: str, known: set[str]) -> str:
    """Extract the aggregate name from a REST path."""
    # Strip query + wildcards + params.
    clean = path.rstrip("*").rstrip("/")
    parts = [p for p in clean.split("/") if p and not p.startswith("{")]
    # Skip common prefixes.
    skip = {"api", "v1", "v2", "tenant", "platform", "central"}
    for p in reversed(parts):
        if p not in skip:
            # Match against known aggregates + entity singulars.
            if p in known:
                return p
            # Try singular -> aggregate map (best-effort).
            for a in known:
                if _pluralize(p) == a or p == a:
                    return a
            return p
    return "unknown"


def _classify_op(verb: str, path: str) -> tuple[str, str | None]:
    """Classify a route into a standard op or a custom one."""
    clean = path.rstrip("/")
    has_id = "{id}" in path or "{slug}" in path or "{"  in path
    last = clean.split("/")[-1]

    # Standard CRUD detection.
    if verb == "GET" and not has_id:
        return "list", None
    if verb == "GET" and last.startswith("{"):
        return "show", None
    if verb == "POST" and not has_id:
        return "create", None
    if verb == "PATCH" and last.startswith("{"):
        return "update", None
    if verb == "PUT" and last.startswith("{"):
        return "update", None
    if verb == "DELETE" and last.startswith("{"):
        return "delete", None

    # Anything else is a custom endpoint. Name = last non-param segment.
    parts = [p for p in clean.split("/") if p and not p.startswith("{")]
    custom_name = parts[-1] if parts else "custom"
    return "custom", custom_name


def read_module(tier: str, name: str) -> Module:
    """Load the module blueprint into typed dataclasses.

    Handles both layouts:

      - `modules/<tier>/blueprints/<name>/` (current — blueprints split from
        Laravel package siblings, adopted first in `modules/platform/`).
      - `modules/<tier>/<name>/` (legacy — the flat layout used by tiers that
        haven't been reorganised yet).

    First hit wins. When a tier migrates to the `blueprints/` layout, the
    generator finds the new location automatically without a code change.
    """
    tier_root = REPO_ROOT / "modules" / tier
    candidates = [
        tier_root / "blueprints" / name,
        tier_root / name,
    ]
    module_dir = next((c for c in candidates if c.is_dir()), None)
    if module_dir is None:
        raise SystemExit(
            f"module blueprint not found — checked "
            + " and ".join(str(c) for c in candidates)
        )

    module_json_path = module_dir / "module.json"
    module_json = json.loads(module_json_path.read_text())

    # Parse every schema in the schemas/ dir.
    schemas_dir = module_dir / "schemas"
    entities: list[Entity] = []
    if schemas_dir.is_dir():
        for schema_path in sorted(schemas_dir.glob("*.schema.json")):
            entities.append(_extract_entity(schema_path, name))

    routes = _extract_routes(module_json, entities)

    return Module(
        tier=tier,
        name=name,
        description=str(module_json.get("description", "")).strip(),
        entities=entities,
        routes=routes,
    )


def module_dir_path(tier: str, name: str) -> Path:
    """Return the on-disk path of the blueprint directory for (tier, name).

    Used by generators that need to read auxiliary blueprint files
    (`events.json`, `policies.json`, `permissions.json`, etc.) beyond what
    `read_module` returns.
    """
    tier_root = REPO_ROOT / "modules" / tier
    candidates = [tier_root / "blueprints" / name, tier_root / name]
    for c in candidates:
        if c.is_dir():
            return c
    raise SystemExit(
        f"module blueprint not found — checked "
        + " and ".join(str(c) for c in candidates)
    )


# ---------------------------------------------------------------------------
# Docblock helpers (shared across SDK + module emitters).
# ---------------------------------------------------------------------------

def _php_docblock(lines: list[str], indent: str = "") -> str:
    """Format a list of comment lines as a PHP docblock."""
    body = "\n".join(f"{indent} * {line}".rstrip() for line in lines)
    return f"{indent}/**\n{body}\n{indent} */"


def _first_sentence(text: str, max_chars: int = 200) -> str:
    """Extract the first sentence-ish chunk of text for a docblock summary."""
    if not text:
        return ""
    # Take up to the first period-space or first newline.
    m = re.match(r"^(.{1," + str(max_chars) + r"}?[\.\n])", text.strip(), re.DOTALL)
    if m:
        return m.group(1).replace("\n", " ").strip().rstrip(".") + "."
    trimmed = text[:max_chars].strip()
    return trimmed + ("..." if len(text) > max_chars else "")
