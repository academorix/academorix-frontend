# Academorix — Module Blueprints Plan

Draft plan for the `modules/<name>/` blueprints that live at the root of the
frontend repo and drive the Laravel backend build. This document is the
authoritative description of what we are building, the folder layout, the
per-module blueprint contract, and the SDUI resource pattern that replaces
Filament.

> Status: **draft v2**. Supersedes v1 wherever it differs. Once the `tenancy`
> exemplar lands, this doc becomes the template checklist for every downstream
> module.

---

## 1. What we're building

`modules/<name>/` at the repo root is a set of **language-neutral module
blueprints**. They are the single source of truth for the Laravel modular
monolith that the frontend talks to. Each blueprint captures — as JSON — every
contract a Laravel module publishes and consumes:

- Database columns + indexes (JSON Schema Draft 2020-12 extended with
  `x-eloquent` / `x-database` / `x-wire` / `x-storage` vendor keys).
- Eloquent model composition (which base + trait mix each model uses).
- Cross-module relations (`BelongsTo` / `HasMany` / `HasOne` / `MorphOne` /
  `MorphMany`).
- HTTP surface: routes, middleware, policies.
- Async surface: queued jobs, cron schedule, artisan commands.
- Domain events + subscriber bindings, observers, notifications, broadcast
  channels.
- Tenancy hooks (per-tenant lifecycle callbacks).
- Ops signals: health probes, OpenTelemetry metrics, cache keys, retention
  windows.
- Product signals: analytics events (Segment / Mixpanel / PostHog).
- Data fixtures that mirror the schemas 1:1.
- **SDUI blueprints** for every admin CRUD surface (Filament-style resources
  over REST) plus bespoke screens, reusable forms, and reusable widgets.

**Naming rule.** All folders and files are **kebab-case lowercase**, including
`readme.md`. Class-name strings inside JSON (e.g.
`Academorix\Tenancy\Models\Tenant`) stay PSR-4 capitalized. There are no other
exceptions.

**Why this shape, in this repo?**

- The frontend team owns the API contract because the SPA has to consume it.
  Authoring the contract as JSON — next to the demo fixtures the SPA renders —
  keeps drift impossible.
- The Laravel side reads the same JSON to scaffold the module (migrations,
  models, DTOs, providers, seeders, jobs, notifications, observers).
- The admin UI is generated from `sdui/resources/<entity>/*.screen.json` at
  runtime. **We do not adopt Filament.** No per-resource React file, no
  dashboard boilerplate — every admin screen is data.
- CI cross-checks every JSON: schemas ↔ fixtures, relations ↔ target schemas,
  permissions ↔ policies, listeners ↔ events, SDUI action buttons ↔ routes.

**What this is NOT.** These blueprints do not describe the frontend module
system (`apps/web/src/modules/<domain>/`). That system is documented in the
`frontend-module-architecture` steering rule and stays a code-only concern. The
`modules/<name>/` blueprints describe the **backend** contract; the SPA consumes
the resulting API + renders the SDUI trees.

---

## 2. Repo layout

Modules are grouped under `modules/<tier>/<name>/`, where `<tier>` names the
deployable **backend service** the module lands in (see
`.kiro/specs/platform-architecture/DECISION.md` §2.1 + §4). Module identity is
the folder's own basename — every `dependencies` / `extendedBy` /
`planned_consumers` / `relations.json` reference is a bare module name, so tier
moves never cascade into blueprint edits.

```
academorix-frontend/
├── apps/                          Vite + React SPAs (frontend code)
├── packages/                      shared TS packages (UI, types, http)
├── modules/                       ← the blueprints
│   ├── shared/                    consumed by every service
│   │   ├── foundation/            base traits, health, primitives, macros
│   │   ├── versioning/            REST + payload versioning + Sunset workflow
│   │   ├── telemetry/             traces + metrics + logs (OTel + Monolog)
│   │   ├── audit/                 audits table (target of HasAuditable)
│   │   ├── activity/              user-facing activity feed
│   │   ├── transfer/              import / export operations
│   │   ├── search/                full-text + vector search substrate
│   │   ├── geography/             reference geo + IP geolocation
│   │   └── localization/          spatie/laravel-translatable wrapper + drivers
│   ├── identity/                  → identity-service (empty; identity + auth land here)
│   ├── platform/                  → platform-service
│   │   ├── workspaces/            Application, Workspace, BusinessType, Domain, Branding
│   │   ├── settings/              attribute-discovered settings registry
│   │   ├── webhook/               outbound webhook substrate (versioning-aware)
│   │   └── storage/               file uploads, signed URLs, variants
│   ├── access/                    → access-service
│   │   └── invitations/           target-agnostic invitation substrate
│   ├── billing/                   → billing-service
│   │   ├── entitlements/          slot / pool / boolean / unlimited licenses
│   │   └── subscription/          plans + Cashier + lifecycle
│   ├── notifications/             → notifications-service
│   │   ├── notifications/         channel-agnostic notification core
│   │   ├── notifications-mail/    mail transport
│   │   ├── notifications-push/    web/mobile push transport
│   │   ├── notifications-sms/     SMS transport
│   │   ├── notifications-in-app/  in-app inbox transport
│   │   └── newsletter/            publications, issues, campaigns, subscriptions
│   ├── compliance/                → compliance-service
│   │   └── compliance/            DSAR, consent, retention, legal hold, subprocessors, safeguarding
│   └── products/                  product-scoped modules (per-product)
│       └── geofencing/            PostGIS geofences (HasGeofence trait)
├── .ref/                          reference Laravel packages (read-only, checked in)
└── .kiro/                         specs, steering, skills (this doc lives here)
```

One module = one bounded context. Every folder — regardless of tier — follows
the same shape (§3). Modules that will land in the identity-service (identity,
auth, mfa, oauth, service-accounts) will populate `modules/identity/` when
authored; the empty tier is intentional so its future home is anchored today.

---

## 3. Per-module blueprint contract

Every `modules/<name>/` folder contains the artefacts below. Empty artefacts are
allowed and expected — a module that publishes no jobs still has `jobs.json`
with a meaningful `description` and `"jobs": []`. Uniform shape lets CI answer
every "does module X do Y?" by reading a single file.

```
modules/<name>/
├── module.json                 descriptor + inline (rules, casts refs, bindings, views, lang, config, macros)
├── readme.md                   human-readable overview
├── schemas/                    JSON Schema Draft 2020-12 per entity
│   └── <entity>.schema.json    one per model, enum, or catalogue
├── relations.json              cross-module Eloquent relations rooted at this module's models
├── traits.json                 model traits owned + consumed + composition example
├── routes.json                 HTTP routes grouped by host audience
├── middleware.json             HTTP middleware + priority + side effects
├── events.json                 domain events + payload contract (publisher-owned; listeners are elsewhere)
├── listeners.json              event → listener bindings THIS module owns
├── observers.json              Eloquent observers this module registers per model
├── hooks.json                  tenancy hooks (per-tenant lifecycle callbacks)
├── jobs.json                   queued jobs the module dispatches
├── schedule.json               cron entries the module registers
├── commands.json               artisan commands the module ships
├── notifications.json          Laravel notifications (mail / database / broadcast / vonage / slack)
├── broadcasts.json             broadcast channels the module owns
├── policies.json               authorization policies + abilities
├── permissions.json            permission strings + guard + seed targets
├── features.json               feature keys (shape contract; empty on non-publishers)
├── entitlements.json           entitlement kinds (shape contract; empty on non-publishers)
├── health.json                 health probes aggregated by Foundation's /api/health
├── metrics.json                OpenTelemetry / Prometheus metrics
├── analytics.json              product analytics events (Segment / Mixpanel / PostHog)
├── caches.json                 cache keys the module owns + TTLs + tags
├── retention.json              data retention windows per model
├── data/                       fixtures matching the schemas 1:1
│   └── <plural>.json
└── sdui/                       server-driven UI blueprints
    ├── readme.md
    ├── resources/              admin CRUD per entity (Filament-style, REST-backed)
    │   └── <entity>/
    │       ├── list.screen.json
    │       ├── create.screen.json
    │       ├── edit.screen.json
    │       └── show.screen.json
    ├── screens/                bespoke non-CRUD screens (workspace picker, onboarding wizard, …)
    ├── forms/                  reusable form fragments composable into screens
    └── widgets/                reusable widgets (business-type-select, tenant-avatar, …)
```

### 3.1 `module.json`

Module descriptor. Consumed by both the Laravel discovery layer and the CI that
cross-checks every JSON file in the folder.

Required keys:

- Identity — `name`, `alias`, `description`, `keywords`, `priority`.
- Runtime — `providers[]` (single service provider per module; no per-module
  route provider), `dependencies[]`, `extendedBy[]`.
- Contributions —
  `contributes.{traits,blueprints,middleware,events,policies, hooks,commands,jobs,notifications,broadcasts,observers,resources,rules,casts, views,lang,config,macros,bindings}[]`.
- Hosts — `hosts.central`, `hosts.platform-admin`, `hosts.tenant`; each lists
  the routes exposed on that host.

Every string in `contributes.*` must resolve to a named contribution in the
sibling JSON files. Routes are NOT mounted through a per-module route provider —
a single `ModuleRouteLoader` at the app level reads `routes.json` for every
module and mounts them centrally.

### 3.2 `schemas/<entity>.schema.json`

One JSON Schema per model. Draft 2020-12, extended with:

- `x-eloquent` — `baseClass`, `implements[]`, `model`, `interface`, primary
  key + prefix, applied `traits[]`, `casts`, `hidden[]`, `guarded[]`,
  `appends[]`, `observers[]`.
- `x-database` — `engine`, `columns` (type / nullable / default / description /
  foreign key), and `indexes` (columns / unique / name).
- `x-storage` — for config-backed catalogues (not tables). Points at a config
  path + seeder.
- `x-wire` — DTO envelope (`spatie-data`), wrap key, name mapper (snake case),
  hidden fields, computed fields.

### 3.3 `relations.json`

Cross-module relations rooted at THIS module's models. Two invariants CI
enforces:

1. Every `target.module` + `target.model` must resolve to a real schema in the
   target module.
2. Reverse relations must reconcile: if `Application.tenants` is a HasMany,
   `Tenant` must declare `application_id` in its schema.

### 3.4 `traits.json`

Two lists:

- `owned[]` — traits THIS module publishes. Each carries `class`, the columns /
  scopes / event hooks / relations it adds, `schemaRef` (the anchor schema),
  `appliedBy[]`, and `notAppliedBy[]`.
- `consumed[]` — traits from other modules THIS module composes on its own
  models. Each carries `class`, `source` (owning module), and a description.

Plus a `compositionExample` and a `blueprintExample` — real PHP snippets that
show the model + migration composed in the exact trait order the module uses.

### 3.5 `permissions.json`

Permission strings + guard + seed targets. Idempotent seeders (`firstOrCreate`
with `is_system=true`).

### 3.6 `policies.json`

Policy classes + abilities. Each ability enumerates the permissions it requires
and any refusal rules (`refusedOnSystemRow: true`, ...).

### 3.7 `features.json`

Feature keys the module publishes. Empty on modules that don't own the
FeatureFlag catalogue; still exists with a `reference` block pointing at the
publisher.

### 3.8 `entitlements.json`

Entitlement kinds + entries. Same "empty is valid" rule as `features.json`.

### 3.9 `routes.json`

HTTP routes grouped by host audience. Each group carries `host` (`central` /
`platform-admin` / `tenant`), `middleware[]`, and `routes[]`. Every route has
`method`, `path`, `name`, `action`, optional `policy`, `accepts` (DTO),
`returns` (DTO or HTTP status).

### 3.10 `middleware.json`

Aliases, class, priority, side effects, and the priority order the module
recommends when composing with framework middleware.

### 3.11 `events.json`

Domain events THIS module publishes. Payload contract only — **no listeners**.
Subscriber ownership lives in each subscribing module's `listeners.json` so a
listener change never mutates the publisher's file.

### 3.12 `listeners.json`

Event → listener bindings THIS module owns. Each entry references an event by
fully-qualified class (which must resolve to a real event in some module's
`events.json`). CI builds the reverse index at validation time.

### 3.13 `observers.json`

Eloquent observers this module registers per model. For each observer: target
model, hooked events (`creating`, `created`, `updated`, `deleting`, `deleted`,
`restoring`, `restored`, `forceDeleting`, `forceDeleted`), and a description of
the side effect.

### 3.14 `hooks.json`

Tenancy hooks (`#[AsTenancyHook]`). Each has `priority`, `range` (framework /
infra / auth / domain), `onInit`, `onEnd`, and `octaneSafe` flag.

### 3.15 `jobs.json`

Queued jobs the module dispatches. For each job: `class`, `queue`, `tries`,
`timeout`, `backoff`, uniqueness key (if `ShouldBeUnique`), and a description of
its input DTO + side effect.

### 3.16 `schedule.json`

Cron entries the module registers via `Schedule::command()` / `Schedule::job()`.
For each entry: signature, cron expression, timezone, `withoutOverlapping` flag,
`runOnOneServer` flag, description.

### 3.17 `commands.json`

Artisan commands the module ships. For each command: signature (name +
arguments + options), description, and audience (`ops:*` operator-facing,
`dev:*` developer-facing).

### 3.18 `notifications.json`

Laravel notifications the module owns. For each: `class`, channels (`mail`,
`database`, `broadcast`, `vonage`, `slack`), template refs (Blade view or
Markdown Mailable), and the notifiable models it targets.

### 3.19 `broadcasts.json`

Broadcast channels the module owns (e.g. `tenant.{id}.activity`). Each has an
authorization callback that resolves per-user access, and a description of the
events broadcast on it.

### 3.20 `health.json`

Health probes registered with Foundation's health aggregator (surfaced by
`GET /api/health`). For each probe: name, category (`liveness` / `readiness` /
`startup`), critical flag, description of what it checks.

### 3.21 `metrics.json`

OpenTelemetry / Prometheus metrics. For each: name
(`tenants.provisioned.total`), kind (`counter` / `gauge` / `histogram`), labels,
unit, description.

### 3.22 `analytics.json`

Product analytics events (Segment / Mixpanel / PostHog). Distinct from
`events.json` — those are internal domain events, these fire on user actions and
go to product analytics. For each: name (`tenant_provisioned`), properties,
where it fires (`Controllers\TenantController@store`), consent tier (`essential`
/ `functional` / `marketing`).

### 3.23 `caches.json`

Cache keys the module owns. For each: key pattern (`tenant:{id}:branding`), TTL,
tags, invalidation triggers. Prevents key collisions across 15+ modules.

### 3.24 `retention.json`

Data retention windows per model. For each: model, `soft_delete_after` (from
last touch, when applicable), `hard_delete_after` (from soft-delete), compliance
tier. Drives the retention jobs in `schedule.json`.

### 3.25 `data/`

Fixtures for the module's entities, matching `schemas/*.schema.json` field for
field. Consumed by:

- Frontend demo mode (mock data provider before the backend endpoint exists).
- Laravel seeder scaffold (`{Entity}Seeder` reads the same JSON).
- CI schema validation (`ajv-cli`).

### 3.26 `sdui/`

See §4 for the full SDUI pattern.

---

## 4. SDUI pattern — Filament replacement over REST

**We are not adopting Filament.** Every admin CRUD screen is authored as SDUI
JSON and rendered by the SPA at runtime. The Filament mental model (resources
with list / create / edit / view screens) maps 1:1, but instead of PHP classes
we ship JSON documents the frontend renders through `<SduiTree>`.

### 4.1 Per-entity resource folder

Every persistent entity that has an admin CRUD surface gets a resource folder at
`modules/<name>/sdui/resources/<entity>/` with up to four screens:

```
sdui/resources/<entity>/
├── list.screen.json      DataGrid + filters + row actions (uses ResourceDataGrid on the SPA side)
├── create.screen.json    form + validation (posts to the create endpoint)
├── edit.screen.json      form + validation (patches / puts the update endpoint)
└── show.screen.json      detail layout + relations + inline actions
```

Screens are pure data. They:

- Reference the entity's REST endpoints for the data source
  (`GET /api/v1/tenants` for list, `GET /api/v1/tenants/{id}` for show, ...).
- Derive list columns and form fields from the entity's schema.
- Use policy-gated action buttons (hidden or disabled per `permissions.json` +
  `policies.json`).
- Compose reusable widgets from `sdui/widgets/` and forms from `sdui/forms/`.

The SPA renders them through the single SDUI runtime — there is no per-resource
React file.

### 4.2 Bespoke screens

Non-CRUD surfaces (workspace picker, onboarding wizard, dashboard overview, ...)
go under `sdui/screens/<slug>.screen.json`. Same wire contract, no resource
convention.

### 4.3 Reusable fragments

- `sdui/forms/<name>.form.json` — reusable form fragments composed into screens.
  Example: `tenant-branding.form.json` is used inside both
  `sdui/resources/tenant/edit.screen.json` and
  `sdui/resources/branding/edit.screen.json`.
- `sdui/widgets/<name>.widget.json` — reusable widgets (business-type picker,
  tenant avatar, status chip, ...) composable from any screen.

### 4.4 Cross-checks

CI enforces:

- Every folder in `sdui/resources/` maps to an entity in `schemas/`.
- Every action button in a screen resolves to a route in `routes.json` and the
  ability its `policy` requires resolves to a permission in `permissions.json`.
- Every data source in a screen resolves to a REST endpoint declared in
  `routes.json` (list → GET collection, edit → PATCH/PUT, ...).
- Every widget / form reference resolves to a real file.

---

## 5. Reference exemplar — the tenancy module

`modules/tenancy/` owns the multi-tenant substrate. Six entities live under this
one module:

| Entity         | Storage                        | Purpose                                                                                                                                                                    |
| -------------- | ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Application`  | table                          | Top-level product / deployment container. Every tenant belongs to one. Owner of the 8-row locked list of `application_id` FKs.                                             |
| `Tenant`       | table                          | The workspace / customer record. Every domain row below the tenancy line carries `tenant_id` back to this table.                                                           |
| `BusinessType` | config catalogue (not a table) | Drives per-tenant defaults for features, terminology, roles, entitlements. Enum-backed on `tenants.business_type`.                                                         |
| `Domain`       | table                          | Custom domain per tenant (`stancl/tenancy` `Domain` model). Central-host discovery joins here.                                                                             |
| `DomainRecord` | table                          | DNS record per Domain (CNAME / TXT / MX). Used for auto-verify + delegation UI.                                                                                            |
| `Branding`     | table                          | Theme + logo profiles per tenant. Multiple profiles possible (e.g. per domain). The Tenant row keeps a denormalised `branding` JSONB as fallback for the workspace picker. |

### 5.1 Final folder shape

```
modules/tenancy/
├── module.json
├── readme.md
├── schemas/
│   ├── application.schema.json           top-level product; every tenant belongs to one
│   ├── tenant.schema.json                the workspace
│   ├── business-type.schema.json         config-backed catalogue (not a table)
│   ├── domain.schema.json                custom domain (stancl/tenancy Domain model)
│   ├── domain-record.schema.json         DNS record (CNAME/TXT/MX) per domain
│   └── branding.schema.json              theme + logo per tenant
├── relations.json                        Application ↔ tenants, Tenant ↔ domains ↔ records, Tenant ↔ branding
├── traits.json                           owns BelongsToTenant + BelongsToApplication
├── routes.json                           central + tenant + platform-admin route groups
├── middleware.json                       resolve.tenant, tenant.user, platform.domain
├── events.json                           Tenant lifecycle (provisioning/provisioned/suspended/resumed/archived/branding-updated) + Domain lifecycle (added/verified/removed)
├── listeners.json                        (empty here — Tenancy publishes, doesn't listen)
├── observers.json                        DomainObserver (auto-generate DomainRecord verification tokens)
├── hooks.json                            LogContext (10), CachePrefix (20)
├── jobs.json                             VerifyDomainDnsJob, ProvisionTenantJob, HardDeleteArchivedTenantJob
├── schedule.json                         daily hard-delete of archived tenants, hourly domain re-verify sweep
├── commands.json                         tenancy:sync-catalogue, tenancy:reverify-domains, tenancy:archive
├── notifications.json                    TenantSuspendedNotification, DomainVerifiedNotification, WelcomeNotification
├── broadcasts.json                       tenant.{id}.lifecycle
├── policies.json                         TenantPolicy, DomainPolicy, BrandingPolicy
├── permissions.json                      manage_tenants, view_tenants (platform_admin guard)
├── features.json                         (empty; catalogue lives on BusinessType)
├── entitlements.json                     (empty; Tenant is the entitlement target)
├── health.json                           tenant-scope-resolvable, domain-dns-reachable
├── metrics.json                          tenants.provisioned.total, tenants.suspended.total, domains.verify.duration
├── analytics.json                        tenant_provisioned, domain_added, domain_verified, branding_updated
├── caches.json                           tenant:{id}:branding (1h), tenant:{id}:features (5m), domain:{host}:tenant (1m)
├── retention.json                        archived tenants: 30d → hard-delete
├── data/
│   ├── applications.json
│   ├── tenants.json
│   ├── business-types.json
│   ├── domains.json
│   ├── domain-records.json
│   ├── brandings.json
│   └── current-tenant.json
└── sdui/
    ├── readme.md
    ├── resources/
    │   ├── application/                  platform-admin only
    │   │   ├── list.screen.json
    │   │   ├── create.screen.json
    │   │   ├── edit.screen.json
    │   │   └── show.screen.json
    │   ├── tenant/                       platform-admin CRUD + tenant self-edit
    │   │   ├── list.screen.json
    │   │   ├── create.screen.json
    │   │   ├── edit.screen.json
    │   │   ├── show.screen.json
    │   │   └── settings.screen.json      tenant-scoped self-edit
    │   ├── business-type/                platform-admin only
    │   │   ├── list.screen.json
    │   │   ├── create.screen.json
    │   │   ├── edit.screen.json
    │   │   └── show.screen.json
    │   ├── domain/                       platform-admin AND tenant-scoped
    │   │   ├── list.screen.json
    │   │   ├── create.screen.json
    │   │   ├── edit.screen.json
    │   │   └── show.screen.json
    │   ├── domain-record/                tenant-scoped, mostly read-only
    │   │   ├── list.screen.json
    │   │   └── show.screen.json
    │   └── branding/                     tenant-scoped edit
    │       └── edit.screen.json
    ├── screens/
    │   └── workspace-picker.screen.json  bespoke central-host picker
    ├── forms/
    │   └── tenant-branding.form.json     reusable, used by both tenant/edit and branding/edit
    └── widgets/
        └── business-type-select.widget.json
```

### 5.2 Corrections to apply to the current folder

1. **Rename** `modules/Tenancy/` → `modules/tenancy/`, `README.md` →
   `readme.md`, every sub-directory lowercase.
2. **Drop** `TenancyRouteServiceProvider` from `module.json.providers[]` and
   from the readme's key-files table. Routes mount centrally from `routes.json`.
3. **Split** `branding` out of the `tenants.branding` JSONB into its own entity
   (`branding.schema.json`) + FK. The JSONB blob stays as a fallback preview
   column on Tenant for the workspace picker.
4. **Add** `Application`, `Domain`, `DomainRecord` schemas + relations +
   fixtures + SDUI resource folders.
5. **Enrich** `schemas/tenant.schema.json` with `x-eloquent.baseClass`,
   `implements[]`, `appends[]`, `observers[]`.
6. **Cross-link** `traits.json` to schemas (`owned[].schemaRef` +
   `consumed[].source`).
7. **Add** the 11 new artefact files (jobs, schedule, commands, observers,
   listeners, notifications, broadcasts, health, metrics, analytics, caches,
   retention) — some empty, all with meaningful `description`.
8. **Expand** `sdui/` with the `resources/<entity>/` tree (6 entities × up to 4
   screens each) alongside the existing bespoke `screens/`, reusable `forms/`,
   and `widgets/`.

---

## 6. Where cross-module references land

**Application lives in `tenancy`, not `foundation`.** It is the top-level
container of tenants; putting it anywhere else fragments the multi-tenant
substrate. Foundation stays truly foundational: base traits, health aggregation,
base primitives, no domain concepts.

Cross-module references land in `relations.json`:

```json
{
  "name": "tenants",
  "type": "HasMany",
  "target": {
    "module": "tenancy",
    "model": "Tenant",
    "class": "Academorix\\Tenancy\\Models\\Tenant"
  },
  "foreignKey": "application_id"
}
```

`target.module` is a lowercase folder name. CI resolves it to the target's
`schemas/*.schema.json` and validates the FK columns match. Reverse relations
must reconcile: if `Application.tenants` is a HasMany, `Tenant` must declare
`application_id` in its schema.

**Rule.** A module only owns the schemas for models it defines. Cross-module
references are all through `relations.json`. There is no shared "types package"
— each schema is self-contained and the dependency graph is buildable by walking
`target.module` links.

---

## 7. Module authoring order

Bottom-up, one wave at a time. Everything in a wave can reference modules
authored in earlier waves — nothing else.

```
Wave 0  1. foundation           base traits (HasSystemFlag, HasUserstamps, HasAuditable),
                                health aggregator, api.version middleware, no domain models

Wave 1  2. tenancy              Application, Tenant, BusinessType, Domain,
                                DomainRecord, Branding — references foundation traits

Wave 2  3. access               Role, Permission — parallel with 4-6
        4. audit                audits table (target of HasAuditable)
        5. settings             key/value substrate
        6. feature-flag         feature toggles

Wave 3  7. user                 User, PlatformUser, Profile (references access)

Wave 4  8. auth                 sessions, tokens, MFA, password reset
        9. activity             activity_log with causer_id → user
       10. notifications        outbound mail/db/broadcast to users
```

Wave 5+ is the domain hierarchy (organization → region → branch → facilities →
teams → subscription → entitlements → sports). Every one is pure trait
composition on top of Waves 0-4.

Per-module authoring checklist (every module runs the same list):

- [ ] `module.json` — providers + dependencies + hosts + contributions.
- [ ] `readme.md` — mirrors tenancy's outline (placement rationale, entities,
      public surface per host, contributions, key files).
- [ ] `schemas/<entity>.schema.json` — one per model / enum / catalogue with
      `x-eloquent`, `x-database` (or `x-storage`), `x-wire`.
- [ ] `relations.json` — every cross-module edge, `target.class` fully
      qualified.
- [ ] `traits.json` — `owned[]` + `consumed[]` + `compositionExample` +
      `blueprintExample`, with `schemaRef` and `source` cross-links.
- [ ] `routes.json` — grouped by host.
- [ ] `middleware.json`.
- [ ] `events.json` (this module's published events) + `listeners.json` (this
      module's subscriber bindings) + `observers.json`.
- [ ] `hooks.json`.
- [ ] `jobs.json` + `schedule.json` + `commands.json`.
- [ ] `notifications.json` + `broadcasts.json`.
- [ ] `policies.json` + `permissions.json`.
- [ ] `features.json` + `entitlements.json` (with `reference` block when empty).
- [ ] `health.json` + `metrics.json` + `analytics.json`.
- [ ] `caches.json` + `retention.json`.
- [ ] `data/*.json` — fixtures matching schemas 1:1.
- [ ] `sdui/resources/<entity>/` — up to `list`, `create`, `edit`, `show` per
      resource.
- [ ] `sdui/screens/`, `sdui/forms/`, `sdui/widgets/` — as needed.
- [ ] CI green: `ajv` validates fixtures against schemas; cross-refs resolve;
      listeners map to real events; permissions cover every ability; every SDUI
      action resolves to a route + policy.

---

## 8. Open questions to close before templating

1. **`ModuleRouteLoader` location.** Where does the loader that reads every
   module's `routes.json` and mounts them live? `foundation` or a dedicated
   `module-kernel` package? Blocks §5.2(2).
2. **Schema versioning.** Tag every `schemas/*.schema.json` with `$version` and
   CI-enforce bumps on breaking changes? Recommend yes.
3. **Ref resolution scheme.** `academorix://modules/<name>/…` URIs need a
   resolver in CI (small Node script) that turns them into filesystem paths and
   validates cross-refs.
4. **Fixture validation.** Standardise on `ajv-cli`?
5. **SDUI runtime.** Confirm `@stackra/sdui` is the runtime rendering
   `sdui/resources/<entity>/*.screen.json`. Currently referenced in the existing
   `modules/Tenancy/sdui/readme.md`.
6. **Analytics consent tier.** Does `analytics.json` require `consent_tier` per
   event (`essential` / `functional` / `marketing`) for the cookie banner
   surface? Recommend yes.
7. **Listeners strategy — locked to Option B.** Publishers own `events.json`
   with payload contract only; every subscribing module publishes its own
   `listeners.json`. CI builds the reverse index.

Once these are settled, this doc becomes read-only and every module is templated
against it.
