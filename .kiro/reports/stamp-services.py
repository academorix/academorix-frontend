#!/usr/bin/env python3
"""
Stamp out the 4 shared services under services/ from apps/laravel-template.

Each service is a Laravel Octane app that requires only the packages relevant
to its bounded context. The FULL path-repos list from laravel-template stays
put — extra path-repos cost nothing (Composer ignores unused ones) — but the
`require` list is curated per service so `composer install` pulls only the
packages that bounded context owns.

Per-service require lists follow docs/services.md (authored in the next step).

Same depth as apps/laravel-template (services/<name>/ and apps/<name>/ are
both 2 levels down from the workspace root), so the relative path-repo URLs
in the stamped composer.json are correct without adjustment.
"""

from __future__ import annotations

import json
import shutil
import sys
from pathlib import Path

WORKSPACE = Path("/Users/akouta/Projects/academorix-frontend")
TEMPLATE = WORKSPACE / "apps" / "laravel-template"
SERVICES_ROOT = WORKSPACE / "services"

# ---------------------------------------------------------------------------
# Framework tier — every service depends on these.
# ---------------------------------------------------------------------------
FRAMEWORK_REQUIRES: frozenset[str] = frozenset(
    {
        # foundation + shared substrate
        "stackra/foundation",
        "stackra-shared/foundation",
        "stackra/attributes",
        "stackra/geography",
        "stackra/localization",
        "stackra/offline-sync",
        "stackra/search",
        "stackra/transfer",
        "stackra/versioning",
        # framework packages
        "stackra/caching",
        "stackra/console",
        "stackra/container",
        "stackra/crud",
        "stackra/database",
        "stackra/enum",
        "stackra/events",
        "stackra/exceptions",
        "stackra/feature-flags",
        "stackra/routing",
        "stackra/scheduling",
        "stackra/scope",
        "stackra/serializer",
        "stackra/service-provider",
        "stackra/settings",
        "stackra/support",
        # cross-cutting infra
        "stackra/authorization",
        "stackra/architecture",  # arch rules
        # observability the service itself emits (Sentry, Horizon, health)
        "stackra/debugbar",
        "stackra/health",
        "stackra/horizon",
        "stackra/nightwatch",
        "stackra/sentry",
        "stackra/monitoring",  # observability/monitoring (composer name is stackra/monitoring)
    }
)

# ---------------------------------------------------------------------------
# Per-service domain tier.
# ---------------------------------------------------------------------------
SERVICE_DOMAIN_REQUIRES: dict[str, frozenset[str]] = {
    "identity": frozenset(
        {
            # central-plane infrastructure
            "stackra/application",
            "stackra/tenancy",
            "stackra/credentials",
            # identity plane
            "stackra/identity",
            "stackra/auth",
            "stackra/mfa",
            "stackra/user",
            "stackra/people",
            "stackra/platform-user",
            "stackra/service-accounts",
            # access plane
            "stackra/rbac",
            "stackra/invitations",
            "stackra/grants",
            "stackra/delegation",
            "stackra/requests",
        }
    ),
    "commerce": frozenset(
        {
            "stackra/subscription",
            "stackra/entitlements",
        }
    ),
    "notifications": frozenset(
        {
            "stackra/notifications",
            "stackra/notifications-in-app",
            "stackra/notifications-mail",
            "stackra/notifications-push",
            "stackra/notifications-sms",
            "stackra/messaging",
            "stackra/announcements",
            "stackra/newsletter",
        }
    ),
    "observability": frozenset(
        {
            "stackra-observability/audit",
            "stackra-observability/activity",
            # monitoring already in the framework tier
            "stackra/compliance",
            "stackra/retention",
        }
    ),
}

SERVICE_DESCRIPTIONS: dict[str, str] = {
    "identity": (
        "Stackra Identity service — cross-Application identity plane. Owns the "
        "Application registry, Tenancy, Identity, User, MFA, ServiceAccount, "
        "Access (RBAC + invitations + grants + delegation + requests), Auth "
        "(login + JWT issuance + JWKS). SHARED across every Stackra product; "
        "one deployment per workspace."
    ),
    "commerce": (
        "Stackra Commerce service — SaaS billing + entitlements. Owns "
        "TenantSubscription (Paddle mirror, coupons, chargebacks) and "
        "Entitlements (feature flags, slot quotas, token pools). Co-located "
        "so provisioning atomicity holds. SHARED across every Application."
    ),
    "notifications": (
        "Stackra Notifications service — multi-channel fan-out (in-app, mail, "
        "push, SMS, messaging, announcements, newsletter). SHARED across "
        "every Application."
    ),
    "observability": (
        "Stackra Observability service — audit + activity + monitoring + "
        "compliance evidence + retention. SHARED across every Application. "
        "Delivers the two-signal split (compliance audit vs. product "
        "activity) plus the retention runner."
    ),
}

SERVICE_TITLES: dict[str, str] = {
    "identity": "Stackra Identity",
    "commerce": "Stackra Commerce",
    "notifications": "Stackra Notifications",
    "observability": "Stackra Observability",
}


def curate_composer(
    src: dict,
    service: str,
    domain: frozenset[str],
) -> dict:
    """Return a curated composer.json for the given service."""
    data = json.loads(json.dumps(src))  # deep clone

    # Identity
    data["name"] = f"stackra/{service}-service"
    data["description"] = SERVICE_DESCRIPTIONS[service]
    data["keywords"] = ["stackra", "service", service, "laravel", "octane"]

    # Requires — keep every non-stackra entry (Laravel core, third-party) +
    # everything on the framework tier + the service's own domain tier.
    require = data.get("require", {})
    allowed = FRAMEWORK_REQUIRES | domain
    curated_require: dict[str, str] = {}
    for name, constraint in require.items():
        # Keep non-stackra requires verbatim (php, laravel/*, spatie/*, ...).
        if "/" in name and not name.startswith(("stackra/", "stackra-")):
            curated_require[name] = constraint
            continue
        # Keep php itself.
        if name == "php":
            curated_require[name] = constraint
            continue
        # Stackra requires — only keep the ones on the allow-list.
        if name in allowed:
            curated_require[name] = constraint
    data["require"] = dict(sorted(curated_require.items()))

    # PSR-4 — Academorix\Api\ → Stackra\<Service>\ (title-cased).
    #   (Provider FQCNs inside the framework packages already anchor at
    #   `Stackra\<Package>\...`, so the app-level PSR-4 root only holds
    #   this service's local Actions/health-check.)
    title = service.title()
    if "autoload" in data and "psr-4" in data["autoload"]:
        data["autoload"]["psr-4"] = {
            f"Stackra\\{title}\\": "src/",
            "Database\\Seeders\\": "database/seeders/",
        }
    if "autoload-dev" in data and "psr-4" in data["autoload-dev"]:
        data["autoload-dev"]["psr-4"] = {"Tests\\": "tests/"}

    # Repositories — keep the whole list. Extra path-repos are harmless
    # (Composer ignores unused ones) and every service can transitively
    # resolve any framework path-repo it needs.
    return data


def stamp_service(service: str, domain: frozenset[str]) -> None:
    dest = SERVICES_ROOT / service
    if dest.exists():
        raise SystemExit(f"Destination already exists: {dest}")

    print(f"--- Stamping services/{service} ---")

    # Copy template verbatim (ignore .doppler.yaml — we'll rewrite it).
    shutil.copytree(TEMPLATE, dest)

    # Curate composer.json.
    template_composer = json.loads(
        (TEMPLATE / "composer.json").read_text(encoding="utf-8")
    )
    curated = curate_composer(template_composer, service, domain)
    (dest / "composer.json").write_text(
        json.dumps(curated, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    print(f"  composer.json    → {len(curated['require'])} requires")

    # .doppler.yaml — retarget to dev_<service>.
    (dest / ".doppler.yaml").write_text(
        f"setup:\n  project: stackra-{service}\n  config: dev_{service}\n",
        encoding="utf-8",
    )
    print(f"  .doppler.yaml    → project: stackra-{service} / config: dev_{service}")

    # config/app.php — swap APP_NAME default.
    app_php_path = dest / "config" / "app.php"
    app_php_text = app_php_path.read_text(encoding="utf-8")
    app_php_text = app_php_text.replace(
        "env('APP_NAME', 'Stackra API')",
        f"env('APP_NAME', '{SERVICE_TITLES[service]}')",
    )
    app_php_text = app_php_text.replace(
        "@file apps/laravel-template/config/app.php",
        f"@file services/{service}/config/app.php",
    )
    app_php_text = app_php_text.replace(
        "Laravel-level application config for the Stackra API.",
        f"Laravel-level application config for {SERVICE_TITLES[service]}.",
    )
    app_php_path.write_text(app_php_text, encoding="utf-8")
    print(f"  config/app.php   → APP_NAME default = {SERVICE_TITLES[service]}")

    # README.md — retarget title + description.
    readme_path = dest / "README.md"
    readme_path.write_text(
        _render_readme(service),
        encoding="utf-8",
    )
    print(f"  README.md        → retargeted")

    # tests/{TestCase,Pest,CreatesApplication}.php — retarget @file paths.
    for name in ("TestCase.php", "Pest.php", "CreatesApplication.php"):
        p = dest / "tests" / name
        if not p.exists():
            continue
        text = p.read_text(encoding="utf-8")
        text = text.replace(
            f"@file apps/laravel-template/tests/{name}",
            f"@file services/{service}/tests/{name}",
        )
        text = text.replace(
            "Base test case for the Stackra API.",
            f"Base test case for {SERVICE_TITLES[service]}.",
        )
        text = text.replace(
            "Pest global test config for the Stackra API.",
            f"Pest global test config for {SERVICE_TITLES[service]}.",
        )
        p.write_text(text, encoding="utf-8")
    print(f"  tests/*.php      → @file headers retargeted")


def _render_readme(service: str) -> str:
    title = SERVICE_TITLES[service]
    desc = SERVICE_DESCRIPTIONS[service]
    return (
        f"# {title}\n\n"
        f"{desc}\n\n"
        "## What lives here\n\n"
        "- `bootstrap/app.php` — Laravel bootstrap. `withRouting()` wires only\n"
        "  `commands:` + `health:` — HTTP routes are discovered from\n"
        "  `#[AsController]` classes across every package (ADR-0016).\n"
        "- `bootstrap/providers.php` — empty; every package auto-discovers\n"
        "  its `ServiceProvider` via `extra.laravel.providers`.\n"
        "- `config/*.php` — Laravel-level runtime config: `app`, `auth`, `cache`,\n"
        "  `database`, `filesystems`, `logging`, `octane`, `queue`, `services`.\n"
        "  Package-level config lives inside each package.\n"
        "- `public/index.php` — Laravel HTTP entry.\n"
        "- `storage/` — framework storage.\n"
        "- `tests/` — Pest v4 (Feature + Unit split per `.kiro/steering/testing.md`).\n"
        "\n"
        "## Boot flow\n\n"
        "```\n"
        "public/index.php → bootstrap/app.php\n"
        "                → package provider registration\n"
        "                → attribute discovery (routes, middleware, listeners)\n"
        "                → HTTP dispatch OR queue worker\n"
        "```\n"
        "\n"
        "## Getting started\n\n"
        "```bash\n"
        "composer install\n"
        "doppler run -- php artisan key:generate\n"
        "doppler run -- php artisan migrate --seed\n"
        "doppler run -- php artisan octane:start --workers=2\n"
        "```\n"
        "\n"
        "## Runbook\n\n"
        "| Command                                   | Purpose                        |\n"
        "| ----------------------------------------- | ------------------------------ |\n"
        "| `composer test`                           | Run Pest (parallel)            |\n"
        "| `composer test:coverage`                  | Coverage (min 80%)             |\n"
        "| `doppler run -- php artisan migrate`      | Run migrations                 |\n"
        "| `doppler run -- php artisan horizon`      | Start Horizon supervisor       |\n"
        "| `doppler run -- php artisan octane:start` | Start Swoole worker pool       |\n"
        "\n"
        "## Related\n\n"
        f"- `docs/services.md` — the six-service split; this is `stackra-{service}`.\n"
        "- `docs/adr/0032-six-service-split.md` — the topology decision.\n"
        "- `docs/adr/0033-cross-service-authentication-contract.md` — JWT + `X-Service-Identity`.\n"
        "\n"
        "## License\n\n"
        "Proprietary. See `LICENSE` at the workspace root.\n"
    )


def main() -> int:
    if not TEMPLATE.exists():
        print(f"Template missing: {TEMPLATE}", file=sys.stderr)
        return 1
    SERVICES_ROOT.mkdir(exist_ok=True)

    for service, domain in SERVICE_DOMAIN_REQUIRES.items():
        stamp_service(service, domain)

    print()
    print(f"=== Done. Stamped {len(SERVICE_DOMAIN_REQUIRES)} services under services/. ===")
    return 0


if __name__ == "__main__":
    sys.exit(main())
