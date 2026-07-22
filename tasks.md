# Backend Compliance Sweep — Pending Tasks

**Date:** 2026-07-21 **Workspace:**
`/Users/akouta/Projects/academorix-frontend/` **Constraint:** Zero git
operations. File edits + inline audits only until user approves a commit
strategy.

**Source-of-truth reports (all at `.kiro/reports/`):**

- `00-triage-summary-2026-07-21.md` — the Round-3 aggregation of every finding
- `phase-c-housekeeper-2026-07-21.md` — Phase C batch report
- `phase-d1-adrs-2026-07-21.md` — 6 restored ADRs
- `phase-e-summary-2026-07-21.md` — Phase E compliance sweep

**What already landed** (do NOT redo):

- Phase A: 5/6 blockers (only A4 + A5 pending — need ADRs)
- Phase B: 3/3 runtime bugs fixed
- Phase C: 4/4 batches + 4 follow-ups
- Phase D1: 6 restored ADRs (0008, 0011, 0016, 0017, 0018, 0022)
- Phase E: 9/10 batches (only E9 pending — needs ADR)

---

## 🚫 Blocked-on-ADR items (unblock the moment the ADR lands)

| #      | Task                                                                                        | Blocking ADR | Estimated effort                |
| ------ | ------------------------------------------------------------------------------------------- | ------------ | ------------------------------- |
| **A4** | Consolidate `Audit` (delete one of `shared/audit` / `observability/audit`)                  | ADR-0029     | 30 min                          |
| **A5** | Reconcile `payment_methods` collision (delete one of `finance/gateway` / `finance/payment`) | ADR-0030     | 30 min                          |
| **E9** | Drop `application_id` from 11 non-central-plane rows                                        | ADR-0031     | 3 hours (migration per package) |

---

## 📝 Phase D — Documentation authoring (biggest gate — blocks nothing else)

### D2 — 15 new ADRs

Author each at `docs/adr/<four-digit>-<kebab-slug>.md` using the shape landed in
D1 (Status / Context / Options considered / Decision / Consequences / Related
work). Each anchors an existing steering file OR pins a decision the project
already needs.

| ADR  | Slug                                               | Anchor                                                                                                   |
| ---- | -------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| 0027 | `row-level-attribution-three-axes-column-contract` | `.kiro/steering/tenancy-columns.md`                                                                      |
| 0028 | `runtime-target-laravel-octane`                    | `.kiro/steering/octane-first-di.md`                                                                      |
| 0029 | `audit-consolidation`                              | Unblocks A4                                                                                              |
| 0030 | `payment-methods-ownership`                        | Unblocks A5                                                                                              |
| 0031 | `application-id-central-plane-extension`           | Unblocks E9                                                                                              |
| 0032 | `activities-vs-activity-log-naming`                | steering vs vendor naming reconciliation                                                                 |
| 0033 | `tenancy-hook-wiring-event-surface`                | `ResolveTenant` middleware direct-fire vs Stancl event                                                   |
| 0034 | `octane-driver-swoole`                             | D3 decision                                                                                              |
| 0035 | `composer-publish-path-repo-forever`               | D4 decision                                                                                              |
| 0036 | `docker-target-for-local-and-prod`                 | D2 decision                                                                                              |
| 0037 | `apps-api-fresh-scaffold`                          | D1 decision — **superseded by "convert laravel-template" per user directive; ADR needs to reflect that** |
| 0038 | `sub-vendor-collapse-stackra-platform`             | D8 decision                                                                                              |
| 0039 | `blade-error-pages-browser-fallback`               | D6 correction — Blade views kept, JSON+HTML formatter chain                                              |
| 0040 | `crudcontroller-deletion`                          | D7 decision                                                                                              |
| 0041 | `composite-tenant-created-at-indexes`              | 130+ tables need composite index policy                                                                  |
| 0042 | `relationship-methods-on-every-model`              | codegen enhancement                                                                                      |
| 0043 | `actions-folder-flatten-policy`                    | one-context-level rule (per Phase E4)                                                                    |

**Also author ADR-0013** — currently referenced as "superseded by 0016" but body
missing. Status = Superseded, single-page body naming the pattern 0016 replaced.

### D3 — Top-level docs (5 files)

- `docs/architecture.md` — real workspace tree + boot flow
- `docs/doppler.md` — secret catalogue + rotation schedule
- `docs/turbo-remote-cache.md` — cache setup + signature-key policy
- `docs/migration.md` — three-phase migration state
- `docs/package-authoring.md` — new-package template reference

### D4 — `docs/contracts/` tree

- `docs/contracts/README.md` — 5-rule contract preamble
- `docs/contracts/service-identity.v1.schema.json` — Sanctum PAT +
  `service_accounts`
- `docs/contracts/service-jwt.v1.schema.json` — HS256 JWT payload
- `docs/contracts/service-jwt.v1.md` — 13-step verifier companion
- `docs/contracts/list-envelope.v1.schema.json` — `{data,meta,links}`
- `docs/contracts/single-envelope.v1.schema.json` — `{data,message?}`
- `docs/contracts/error-envelope.v1.schema.json` — `{message,errors?}`

### D5 — Root-level docs

- **Rewrite `README.md`** — currently stock Vite template
- **Author `SECURITY.md`** — vulnerability reporting + SLA + maintained versions
- **Refresh `docs/adr/README.md`** index — stale (says next=0026; missing every
  0008/0011/0016/0017/0018/0022 + 0026/0027 rows)

### D6 — Two architecture rules referenced by ADR-0017 but don't exist on disk

- `packages/backend/compliance/architecture/src/Rules/NoWorkspaceInBackendRule.php`
- `packages/backend/compliance/architecture/src/Rules/NoTenantMembershipTokenRule.php`

Scaffold both alongside existing sibling rules — regex-based scanner rejecting
`Workspace` / `TenantMembership` in namespace/class/table/column strings.

---

## 🏗️ Phase F — Infrastructure buildout (convert `apps/laravel-template` to headless API)

**Directive from user:** DO NOT create a fresh `apps/api`. Convert the existing
`apps/laravel-template` in-place into a headless API app.

### F1 — Audit `apps/laravel-template` (inventory below)

Every path under `apps/laravel-template/` classified as **KEEP** / **DELETE** /
**RETARGET**:

#### KEEP AS-IS

| Path               | Rationale                                                                                     |
| ------------------ | --------------------------------------------------------------------------------------------- |
| `.editorconfig`    | standard formatter config                                                                     |
| `.gitattributes`   | standard                                                                                      |
| `.gitignore`       | standard                                                                                      |
| `.npmrc`           | needed if we keep any npm tooling (composer artisan hooks may)                                |
| `artisan`          | Laravel CLI entry — required                                                                  |
| `bootstrap/cache/` | Laravel cache directory                                                                       |
| `storage/`         | Laravel storage — logs, framework cache, sessions folder (session driver switches to `array`) |
| `public/index.php` | Laravel HTTP entry — required                                                                 |
| `public/.htaccess` | Apache rewrite — keep for compat; nginx doesn't read it                                       |

#### KEEP + RETARGET

| Path                      | What to change                                                                                                                                                                                                                              |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `.doppler.yaml`           | Retarget project from `stackra-laravel-template` → `stackra-api`; config from `dev_laravel_template` → `dev_api`                                                                                                                            |
| `.env` + `.env.example`   | Rewrite for API-only shape — drop `SESSION_DRIVER`, `MAIL_MAILER` (unless a real mail lane exists), `VITE_*`; add `OCTANE_SERVER=swoole` + `HORIZON_*` block per ADR-0034                                                                   |
| `.mcp.json`               | Keep — MCP config; retarget if it references template-specific slugs                                                                                                                                                                        |
| `.claude/skills/`         | Keep — code-review skills apply to any app                                                                                                                                                                                                  |
| `.kiro/`                  | Keep — Kiro workspace files                                                                                                                                                                                                                 |
| `AGENTS.md`               | Rewrite for API app — references packages/backend consumers                                                                                                                                                                                 |
| `CLAUDE.md`               | Verify not custom then delete OR rewrite for API app (Boost artifact)                                                                                                                                                                       |
| `boost.json`              | Verify Boost config still applies; retarget any template mentions                                                                                                                                                                           |
| `composer.json`           | **Major rewrite** — drop `laravel/laravel` name; rename to `stackra/api`; require every backend package via path repos; drop frontend deps; add `stackra/service-provider`, `stackra/foundation`, `laravel/octane`, `laravel/horizon`, etc. |
| `composer.lock`           | Regenerated after composer.json rewrite                                                                                                                                                                                                     |
| `README.md`               | Rewrite for API app                                                                                                                                                                                                                         |
| `phpunit.xml`             | Retarget test path; add `<php>` env vars for the new app                                                                                                                                                                                    |
| `bootstrap/app.php`       | Drop `web:` routing; drop `withRouting()` for the stock `routes/web.php`; keep `commands` + `health`; wire package providers via `->withProviders()` OR use `bootstrap/providers.php`                                                       |
| `bootstrap/providers.php` | Replace stock `AppServiceProvider` with the ~90 backend package providers                                                                                                                                                                   |
| `config/app.php`          | Retarget `name`, `url`, `timezone`; drop stock providers array (providers come from packages now)                                                                                                                                           |
| `config/auth.php`         | Retarget to Sanctum-only; drop session auth; add `platform_admin` guard                                                                                                                                                                     |
| `config/cache.php`        | Keep — used by every package                                                                                                                                                                                                                |
| `config/database.php`     | Keep — used by every package                                                                                                                                                                                                                |
| `config/filesystems.php`  | Keep — used by storage package                                                                                                                                                                                                              |
| `config/logging.php`      | Keep — used by every package                                                                                                                                                                                                                |
| `config/queue.php`        | Keep — used by queue + horizon                                                                                                                                                                                                              |
| `config/services.php`     | Rewrite for third-party integrations the API uses (Stripe, SES, etc.)                                                                                                                                                                       |

#### DELETE (frontend + web-only surface)

| Path                        | Rationale                                                                                                                                                                                                    |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `app/` (entire directory)   | Restructure to `src/` per `.kiro/steering/architecture.md` §"src/ as source root"; the current stock skeleton (`Http/Controllers/`, `Models/`, `Providers/AppServiceProvider.php`) has no content to migrate |
| `config/mail.php`           | No mail lane in the API app (notifications package handles email via its own config)                                                                                                                         |
| `config/session.php`        | Sessions banned per headless mandate; session driver = `array` (set inline via env)                                                                                                                          |
| `resources/css/`            | Frontend Vite build — banned per headless mandate                                                                                                                                                            |
| `resources/js/`             | Same                                                                                                                                                                                                         |
| `resources/views/`          | Blade views — only exceptions/foundation packages ship Blade for error pages                                                                                                                                 |
| `routes/web.php`            | Delete — headless mandate                                                                                                                                                                                    |
| `public/build/`             | Vite build artifacts — no frontend build                                                                                                                                                                     |
| `public/favicon.ico`        | No browser assets                                                                                                                                                                                            |
| `public/robots.txt`         | Optional; keep if we host anything; delete if pure API                                                                                                                                                       |
| `node_modules/`             | No frontend                                                                                                                                                                                                  |
| `package.json`              | No frontend                                                                                                                                                                                                  |
| `package-lock.json`         | No frontend                                                                                                                                                                                                  |
| `vite.config.js`            | No frontend                                                                                                                                                                                                  |
| `database/database.sqlite`  | Local dev SQLite — regenerate per developer                                                                                                                                                                  |
| `tests/` (existing content) | Restructure per `.kiro/steering/testing.md` — Feature/ + Unit/ split, extending Foundation's TestCase                                                                                                        |
| `vendor/`                   | Regenerated by `composer install`                                                                                                                                                                            |

### F2 — Rename directory `apps/laravel-template/` → `apps/api/`

Do this in a single `smart_relocate` OR bash `mv` pass. Update every reference
across the workspace:

- `.kiro/steering/**/*.md`
- Any `path` under `repositories[]` in another composer.json that references
  `apps/laravel-template`
- `turbo.json` filter groups
- `package.json` workspaces

### F3 — Rewrite `apps/api/composer.json` from scratch

Shape:

```json
{
  "name": "stackra/api",
  "type": "project",
  "description": "Stackra headless tenant API.",
  "require": {
    "php": "^8.3",
    "laravel/framework": "^13.8",
    "laravel/octane": "^2.10",
    "laravel/horizon": "^5.34",
    "laravel/sanctum": "^5.0",
    "stackra/foundation": "@dev",
    "stackra/service-provider": "@dev",
    "stackra/routing": "@dev",
    "stackra/exceptions": "@dev",
    "stackra/tenancy": "@dev",
    "stackra/access": "@dev",
    "stackra/authorization": "@dev",
    "stackra/application": "@dev",
    "stackra/identity": "@dev",
    "stackra/user": "@dev",
    "stackra/auth": "@dev",
    "// ... one line per ~90 backend packages"
  },
  "require-dev": {
    "pestphp/pest": "^4.7",
    "pestphp/pest-plugin-laravel": "^4.1",
    "laravel/pint": "^1.27",
    "phpstan/phpstan": "^2.0",
    "larastan/larastan": "^3.0",
    "mockery/mockery": "^1.6",
    "nunomaduro/collision": "^8.6"
  },
  "autoload": {
    "psr-4": {
      "Academorix\\Api\\": "src/"
    }
  },
  "autoload-dev": {
    "psr-4": {
      "Tests\\": "tests/"
    }
  },
  "extra": {
    "laravel": {
      "dont-discover": []
    }
  },
  "repositories": [
    { "type": "path", "url": "../../packages/backend/foundation", "options": { "symlink": true } },
    { "type": "path", "url": "../../packages/backend/framework/service-provider", "options": { "symlink": true } },
    { "// ... one entry per @dev requirement": true }
  ]
}
```

The `scripts/wire-composer-path-repos.py` script from the tools/cli should walk
every `@dev` and emit the matching `repositories` entry — run it after the
require block is finalised.

### F4 — Rewrite `bootstrap/app.php`

Drop `web:` routing. Keep `commands:` + `health:`. Register providers via
`->withProviders()` — the Routing package's `RouteRegistrar` handles route
discovery via `#[AsController]` scan; no `web:` / `api:` needed.

```php
return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withProviders([
        // From bootstrap/providers.php — see F5
    ])
    ->withMiddleware(fn (Middleware $m) => $m)
    ->withExceptions(fn (Exceptions $e) => $e)
    ->create();

// Enable src/ as the source root (per architecture.md).
$app->useAppPath($app->basePath('src'));
```

### F5 — Populate `bootstrap/providers.php`

List every backend package's `<Pkg>ServiceProvider::class`. The package's
`#[AsModule]` attribute + `Stackra\ServiceProvider\Providers\ServiceProvider`
base handles the rest — declarative config/lang/view loading.

### F6 — Author `apps/api/config/octane.php`

Standard Laravel Octane config + Swoole driver (per ADR-0034). Reference:
`https://laravel.com/docs/octane#configuration`.

### F7 — Author `apps/api/config/horizon.php`

Horizon supervisor + queue segmentation. Reference the pattern already used by
`packages/backend/telemetry/horizon/config/horizon-notifications.php`.

### F8 — Author `docker/` at the workspace root

- `docker/Dockerfile.api` — multi-stage: composer-install → app image
- `docker/nginx/` — nginx config for `/api` prefix
- `docker/entrypoint.sh` — runs migrate on boot when `APP_ENV=production`
- `docker-compose.yml` at workspace root — local dev: api + postgres + redis

### F9 — Author `.github/workflows/php.yml`

CI matrix: PHP 8.3, PHP 8.4. Steps: setup-php + composer install + pest +
phpstan + pint. Cache composer + phpstan. Fail on any red.

### F10 — Author `config/phpstan-base.neon` + `config/pint.json` at workspace root

Every backend package's `phpstan.neon` includes `../../config/phpstan-base.neon`
today; that file doesn't exist. Ship it with level max + Laravel ide-helper.
Same shape for pint.

### F11 — Author `.changeset/config.json` at workspace root

Changesets config for Composer (via a custom changeset workflow OR trellis-io/
composer-changesets). Coordinate with release-manager.

### F12 — Author `.github/workflows/release.yml`

Runs `changesets/action` on push to main. Version + tag + release notes.

### F13 — Doppler setup

- Run `./scripts/doppler-init.sh` from workspace root to create the
  `stackra-api` project + `dev_api` / `stg_api` / `prd_api` branch configs.
- Publish the `.env.example` shape to Doppler as the seed.
- Document rotation cadence in `docs/doppler.md` (see D3).

---

## 🧪 Phase G — Test coverage

### G1 — Regression tests for Phase B fixes

- **SentryService Octane leak test** — mock two consecutive requests under
  different tenants + different users; assert request-2's `captureException`
  doesn't see request-1's user context.
- **TenancyHook fire test** — verify `CachePrefixTenantHook` +
  `LogContextTenantHook` land on `ResolveTenant` middleware fire.

### G2 — Migration smoke test

`php artisan migrate --seed` on a fresh SQLite; assert every table lands and
every seeder runs. Should be green after Phase A landings.

### G3 — Per-package test coverage (test-mutation-engineer)

One pass per package via `test-mutation-engineer`: raise mutation score to 80%.
Batch by module tier (framework → shared → domain).

---

## 📚 Phase H — Documentation completion

### H1 — 22 Priority-1 ERDs (data-modeler)

Author `docs/data/<slug>.md` for each of:

- `access-rbac`, `billing-subscription`, `billing-entitlements`
- `compliance`, `framework-feature-flags`, `framework-scope`
- `identity-auth`, `identity-user`, `notifications`
- `observability-monitoring`, `platform-ai`, `platform-facility`
- `platform-integrations`, `platform-teams`, `workflow-approvals`
- `finance-expenses`, `finance-membership`
- `sports-competition`, `sports-match`, `sports-medical`
- `sports-registrations`, `sports-progress`, `sports-drills`

### H2 — 43 Priority-2 ERDs (data-modeler)

Cover every remaining package with ≥3 tables.

### H3 — 5 cross-package aggregate ERDs

- `docs/data/platform-tree.md`
- `docs/data/tenancy-column-boundary.md`
- `docs/data/scope-substrate.md`
- `docs/data/access-tree.md`
- `docs/data/observability-signals.md`

### H4 — Contract schemas for 100+ endpoints (api-contract-designer)

Every Action's request/response as JSON Schema under `docs/contracts/`.

### H5 — 130+ composite `(tenant_id, created_at)` index migrations (laravel-feature-builder)

One migration per module. Batch by feature area.

### H6 — 320 model relationship methods (codegen enhancement)

Add `belongsTo`/`hasMany`/`morphMany` on every model; regenerate.

### H7 — Wire Scramble for OpenAPI

Generate `/api/docs` OpenAPI JSON from the routing attributes on every Action.

---

## 🧹 Small housekeeping (flagged, non-blocking)

- **`docs/adr/README.md`** refresh — stale; see D5
- **`markdownlint-cli2` + `lychee`** sweep on `docs/adr/**` — verification pass
- **Verify Blade error rendering round-trip** — after PR-C1 restore +
  `$resources` wiring, do a manual `curl` with `Accept: text/html` to hit a
  `errors/404.blade.php` template
- **Orphan `packages/backend/foundation/lang/*/errors.php`** — currently kept
  because Blade views are restored; verify strings resolve
- **`stackra-platform/application-sdk` sub-vendor** — collapse to
  `stackra/platform-application-sdk` per ADR-0038 when it lands
- **Delete `apps/laravel-template/` old references** across the workspace after
  F2 rename

---

## Execution order recommendation

**Cheapest unblockers first** (few hours each):

1. Author ADR-0029 + ADR-0030 + ADR-0031 (unblocks A4 + A5 + E9)
2. Execute A4 + A5 + E9 (Phase A + E tail closes)
3. Refresh `docs/adr/README.md` index
4. Author ADR-0013 body

**Medium** (~1 day each):

5. Author remaining 14 new ADRs (D2)
6. Author 5 top-level docs (D3)
7. Author docs/contracts/ tree (D4)
8. Rewrite README.md + author SECURITY.md (D5)
9. Scaffold NoWorkspaceInBackendRule + NoTenantMembershipTokenRule (D6)

**Heavy** (~1 week):

10. Phase F (F1–F13) — the laravel-template → api conversion + Docker + CI
11. Phase G — regression tests + test-mutation-engineer sweep
12. Phase H1-H3 — 70 ERDs

**Post-F** (once the API app boots):

13. Verify `php artisan migrate --seed` on fresh DB
14. Verify `php artisan octane:start` under Swoole with 1 worker, 100
    max-requests
15. Manual smoke test — `/up` health probe returns 200
16. Author Phase H4-H7 (contract schemas, index migrations, relationships,
    OpenAPI)

---

## Reports written this session

- `.kiro/reports/00-triage-summary-2026-07-21.md` (450 lines)
- `.kiro/reports/phase-c-housekeeper-2026-07-21.md` (700 lines)
- `.kiro/reports/phase-d1-adrs-2026-07-21.md` (240 lines)
- `.kiro/reports/phase-e-summary-2026-07-21.md` (110 lines)
- `.kiro/reports/phase-c-batch-{2,3}-mover.py` (2 mover scripts)
- `.kiro/reports/phase-c-batch-4-contracts-registry-mover.py` (1 mover script)
- `.kiro/reports/phase-e-pr-e{1,4}-*.py` (2 mover scripts from aborted
  housekeeper)
