"""Scaffold the standard blueprint stub set for a module.

Every module under `modules/<tier>/<name>/` ships a uniform set of JSON files
per `.kiro/specs/module-blueprints/PLAN.md` §3. Most of them can be minimal
stubs (with a meaningful description + empty content) — the storage /
subscription / compliance modules already follow this shape. This script
generates the stubs for a module that only has `module.json` + `readme.md` +
`schemas/` so far, preserving any files that already exist.

Usage:
    python3 modules/shared/blueprints/foundation/scripts/scaffold-module-stubs.py \
        modules/platform/application \
        modules/platform/domains \
        modules/platform/branding \
        modules/platform/integrations

Idempotent: files already present are never touched.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

# Repo root: modules/shared/blueprints/foundation/scripts/ -> up five levels.
REPO_ROOT = Path(__file__).resolve().parents[5]


# Every stub carries a URI id + a $version + a short description + one
# array-shaped body key. The generator interpolates the module name into each.
STUB_TEMPLATES: dict[str, dict] = {
    "changelog.md": None,  # markdown, generated separately.
    "traits.json": {
        "title": "{name} — model traits",
        "description": "Traits owned by this module and traits consumed from foundation + framework. Fill in when the module ships its first trait; blueprint-driven scaffold otherwise.",
        "owned": [],
        "consumed": [],
        "composition_example": {},
    },
    "attributes.json": {
        "title": "{name} — PHP attributes",
        "description": "PHP attributes owned by this module. Empty at scaffold time; fill in with each new `#[As...]` class the module ships.",
        "namespace": "Stackra\\\\{Studly}\\\\Attributes",
        "attributes": [],
    },
    "relations.json": {
        "title": "{name} — model relationships",
        "description": "Eloquent relations rooted at this module's models. `internal` = same-module edges; `outbound` = edges to other modules' models.",
        "internal": [],
        "outbound": [],
        "inbound_expected": [],
    },
    "routes.json": {
        "title": "{name} — HTTP routes",
        "description": "Routes grouped by host audience. Discovery is attribute-driven at boot; this file is the machine-readable inventory + admin-visible surface.",
        "hosts": {},
    },
    "middleware.json": {
        "title": "{name} — HTTP middleware",
        "description": "Middleware aliases this module contributes.",
        "middleware": [],
    },
    "events.json": {
        "title": "{name} — domain events",
        "description": "Events this module publishes. Payload contract lives on the corresponding wire-contract file in `contracts/<event>.v<n>.json` for cross-service events.",
        "events": [],
    },
    "listeners.json": {
        "title": "{name} — event listeners",
        "description": "Listeners this module registers, keyed by the event they consume.",
        "listeners": [],
    },
    "observers.json": {
        "title": "{name} — model observers",
        "description": "Eloquent observers this module registers, wired via `#[ObservedBy]` on models.",
        "observers": [],
    },
    "hooks.json": {
        "title": "{name} — tenant hooks",
        "description": "Per-tenant lifecycle callbacks (log context, cache prefix, cache invalidation).",
        "hooks": [],
    },
    "jobs.json": {
        "title": "{name} — queued jobs",
        "description": "Queued jobs this module dispatches.",
        "jobs": [],
    },
    "schedule.json": {
        "title": "{name} — scheduled tasks",
        "description": "Artisan / cron entries this module registers.",
        "schedule": [],
    },
    "commands.json": {
        "title": "{name} — Artisan commands",
        "description": "Console commands this module ships.",
        "commands": [],
    },
    "notifications.json": {
        "title": "{name} — user-facing notifications",
        "description": "Laravel notifications (mail / database / broadcast / vonage / slack).",
        "notifications": [],
    },
    "broadcasts.json": {
        "title": "{name} — broadcast channels",
        "description": "Channels this module publishes to for real-time UI updates.",
        "channels": [],
    },
    "policies.json": {
        "title": "{name} — authorization policies",
        "description": "Policies + abilities. Wired via `#[UsePolicy]` on the model.",
        "policies": [],
    },
    "permissions.json": {
        "title": "{name} — permissions",
        "description": "Permission strings the module seeds + the guard they target.",
        "permissions": [],
    },
    "features.json": {
        "title": "{name} — feature keys",
        "description": "Feature keys this module publishes for tenant entitlement gating.",
        "features": [],
    },
    "feature-flags.json": {
        "title": "{name} — feature flags",
        "description": "Kill switches + gradual-rollout flags this module publishes.",
        "flags": [],
    },
    "entitlements.json": {
        "title": "{name} — entitlements consumed",
        "description": "Entitlements this module reads (slot / pool / boolean / unlimited).",
        "consumed": [],
    },
    "health.json": {
        "title": "{name} — health probes",
        "description": "Health checks aggregated by foundation's /api/health.",
        "checks": [],
    },
    "metrics.json": {
        "title": "{name} — OpenTelemetry metrics",
        "description": "OTel / Prometheus metrics this module emits.",
        "metrics": [],
    },
    "analytics.json": {
        "title": "{name} — product-analytics events",
        "description": "PostHog / Mixpanel / Segment events this module emits.",
        "events": [],
    },
    "caches.json": {
        "title": "{name} — cache keys",
        "description": "Cache keys the module owns + TTLs + invalidation triggers + tags.",
        "keys": [],
    },
    "retention.json": {
        "title": "{name} — data retention windows",
        "description": "Per-entity retention windows the retention runner respects.",
        "policies": [],
    },
    "errors.json": {
        "title": "{name} — error catalogue",
        "description": "Domain exception classes + HTTP status + translation keys.",
        "errors": [],
    },
    "config.json": {
        "title": "{name} — config keys",
        "description": "config/<module>.php shape + defaults.",
        "keys": [],
    },
    "settings.json": {
        "title": "{name} — tenant-editable settings",
        "description": "Settings this module registers against the settings substrate.",
        "settings": [],
    },
    "rules.json": {
        "title": "{name} — validation rules",
        "description": "Named validation rules this module ships (registered via Validator::extend).",
        "rules": [],
    },
    "subprocessors.json": {
        "title": "{name} — subprocessors used",
        "description": "Third-party subprocessors this module uses for its own operation.",
        "subprocessors": [],
    },
    "data-classes.json": {
        "title": "{name} — column classification",
        "description": "Every column across this module's schemas classified by foundation's 5-tier taxonomy (public / internal / confidential / restricted / secret).",
        "classifications": [],
    },
    "compliance.json": {
        "title": "{name} — self-compliance posture",
        "description": "Regulatory regimes this module's data touches + how each is discharged.",
        "regimes": [],
    },
}


def studly(name: str) -> str:
    """kebab-or-snake -> StudlyCase."""
    return "".join(part.capitalize() for part in name.replace("_", "-").split("-"))


def author_stub(module_dir: Path, filename: str, template: dict, module_name: str) -> bool:
    """Author one stub. Return True if written, False if skipped (already exists)."""
    path = module_dir / filename
    if path.exists():
        return False
    # Substitute {name} / {Studly} placeholders in string leaves.
    body = {
        "id": f"stackra://modules/{module_name}/{filename.replace('.json', '')}",
        "$version": 1,
    }
    for key, value in template.items():
        if isinstance(value, str):
            body[key] = value.format(name=module_name, Studly=studly(module_name))
        else:
            body[key] = value
    path.write_text(json.dumps(body, indent=2, ensure_ascii=False) + "\n")
    return True


def author_changelog(module_dir: Path, module_name: str) -> bool:
    path = module_dir / "changelog.md"
    if path.exists():
        return False
    path.write_text(
        f"# {module_name} — changelog\n\n"
        "Every change to this module lands here in reverse-chronological order.\n"
        "Follow [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) "
        "semantics + tag every change with its wave / spec / ADR reference.\n\n"
        "## Unreleased\n\n"
        "Nothing yet.\n\n"
        f"## v0.1.0 — extracted from tenants (platform v0.3 split)\n\n"
        "### Added\n\n"
        f"- Inaugural blueprint scaffold. Module extracted from `tenants` at "
        "the platform v0.3 split per `.kiro/steering/module-partitioning.md`.\n"
        "- Schemas + sdui/resources moved from tenants; readme + module.json authored.\n"
        "- Traits + relations + operational stubs scaffolded at minimum-viable shape.\n"
    )
    return True


def main(argv: list[str]) -> int:
    if not argv:
        print(__doc__)
        return 2

    for module_arg in argv:
        module_dir = REPO_ROOT / module_arg
        if not module_dir.is_dir():
            print(f"skip: {module_arg} not a directory", file=sys.stderr)
            continue

        module_json = module_dir / "module.json"
        if not module_json.exists():
            print(f"skip: {module_arg} has no module.json", file=sys.stderr)
            continue

        module_name = json.loads(module_json.read_text())["name"]
        written = 0
        skipped = 0

        for filename, template in STUB_TEMPLATES.items():
            if filename == "changelog.md":
                ok = author_changelog(module_dir, module_name)
            else:
                ok = author_stub(module_dir, filename, template, module_name)
            if ok:
                written += 1
            else:
                skipped += 1

        print(f"  {module_name}: wrote {written} stubs, skipped {skipped} existing")

    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
