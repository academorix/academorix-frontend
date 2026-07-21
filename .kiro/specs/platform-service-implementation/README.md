# Platform Service Implementation Plan

**Status: draft — pending user review before Phase 0 kickoff.**

The **first** platform-service build. This document is the phase-by-phase plan
to take `modules/platform/` blueprints and materialise them as runtime code
under `stackra-backend/apps/platform-service/src/modules/<module>/`.

Platform is the **pilot** — the pattern established here is applied identically
to identity-service, access-service, billing-service, notifications-service, and
compliance-service. Getting Platform right sets the template for all six.

---

## 1. Scope

### 1.1 What we're building

**Eight** Laravel modules (post-v0.3 workspaces split), each shipping as a
Composer path-repo package under `apps/platform-service/src/modules/`, plus one
SDK sub-package per module:

| Blueprint                        | Runtime package                                   | SDK sub-package                        |
| -------------------------------- | ------------------------------------------------- | -------------------------------------- |
| `modules/platform/application/`  | `apps/platform-service/src/modules/application/`  | `stackra-platform/application-sdk`  |
| `modules/platform/workspaces/`   | `apps/platform-service/src/modules/workspaces/`   | `stackra-platform/workspaces-sdk`   |
| `modules/platform/domains/`      | `apps/platform-service/src/modules/domains/`      | `stackra-platform/domains-sdk`      |
| `modules/platform/branding/`     | `apps/platform-service/src/modules/branding/`     | `stackra-platform/branding-sdk`     |
| `modules/platform/integrations/` | `apps/platform-service/src/modules/integrations/` | `stackra-platform/integrations-sdk` |
| `modules/platform/settings/`     | `apps/platform-service/src/modules/settings/`     | `stackra-platform/settings-sdk`     |
| `modules/platform/webhook/`      | `apps/platform-service/src/modules/webhook/`      | `stackra-platform/webhook-sdk`      |
| `modules/platform/storage/`      | `apps/platform-service/src/modules/storage/`      | `stackra-platform/storage-sdk`      |

**Total: 8 modules, 17 entities, 8 SDK sub-packages.**

The 5 modules above `settings/` (application, workspaces, domains, branding,
integrations) are the **v0.3 workspaces split** — see
`.kiro/steering/module-partitioning.md` for the rule that governs the split.

### 1.2 What we're NOT building (yet)

Deferred to later spec revisions:

- `organization/`, `region/`, `branch/`, `feature-flag/` — declared as
  `planned_consumers` on `workspaces/` but not blueprinted yet. Author their
  blueprints first (Phase 4).
- Entity extractions from `workspaces/` (branding, domain, business-type into
  their own modules) — the current mega-module is fine to ship first; extraction
  is a follow-on refactor.
- The `Workspace → Tenant` rename per ADR-0017 — hierarchical decision noted in
  `platform-architecture/DECISION.md` §9, deliberately deferred.

### 1.3 Success criteria

Phase-by-phase, but the overall criteria for "Platform service is done":

- [ ] Every schema in `modules/platform/` has a corresponding Eloquent model
      with matching traits/casts/attributes.
- [ ] Every migration lands with an explicit `down()`.
- [ ] Every event contract in `modules/platform/*/contracts/` has a matching PHP
      event class + a Pest feature test proving the payload shape.
- [ ] Every SDK sub-package auto-registers via
      `#[AsSdkResource(service:     'platform')]` and passes `php -l`.
- [ ] `composer install` + `doppler run -- php artisan migrate` +
      `doppler run -- php artisan test` all green.
- [ ] Validator (`modules/shared/foundation/scripts/validate-module-graph.py`)
      remains green after every phase.

---

## 2. Prerequisites (Phase 0)

Before any code writes, three things must be true:

### 2.1 Shared-tier packages are ready

Platform depends on `shared/` packages. Confirm they publish as Composer
packages under `stackra-backend/packages/`:

- `stackra/foundation` — base traits + discovery + service provider base.
- `stackra/versioning` — needed by `webhook`.
- `stackra/audit` — needed by `settings` + `storage`.
- `stackra/activity` — needed by `settings` + `storage`.

If any of these packages don't yet exist as backend code, they land BEFORE
Platform. This is not "Phase 0 of the platform plan" — it's a hard blocker.

### 2.2 Blueprint validator is green

Run `python3 modules/shared/foundation/scripts/validate-module-graph.py`. Must
show 5/5 green. Any failure here blocks the whole plan.

### 2.3 Service app is scaffolded

`apps/platform-service/` already exists (cloned from `apps/template`) with
`composer.json` naming `stackra/platform-service`, `.doppler.yaml` pointing
at `dev_platform_service`, and `.env.example` pre-filled. Verify:

```bash
cd apps/platform-service
composer install
doppler setup
doppler run -- php artisan --version
```

All three must succeed. If not, unblock scaffolding first.

---

## 3. Phase 1 — the tenancy substrate (5 sequenced slices)

After the v0.3 workspaces split, Phase 1 builds **five modules** in the order
the boot DAG requires. Each slice is small enough to ship in 2-4 days; the whole
phase lands in ~2-3 weeks. See
[`.kiro/steering/module-partitioning.md`](../../steering/module-partitioning.md)
for the rule that governed the split.

### 3.0 Slice sequencing

```
Phase 1a: application/   (priority 8)   ← boots first, cross-workspace registry
         │
Phase 1b: workspaces/    (priority 10)  ← depends on application
         │
         ├── Phase 1c: domains/         (priority 12)
         ├── Phase 1d: branding/        (priority 12)     ← parallelisable
         └── Phase 1e: integrations/    (priority 12)
```

### 3.1 Entities per slice

**Phase 1a — `application/` (2 entities)**

1. `Application` — product container (Sports, Marketplace, ...). Cross-
   workspace (`workspace_id=null` always).
2. `BusinessType` — config catalogue (academy, gym, school, ...).
   Cross-workspace. Config-backed (`x-storage`), not a ULID-primary table.

**Phase 1b — `workspaces/` (2 entities)**

1. `Workspace` — the tenant row. Depends on Application.
2. `WorkspaceContact` — per-workspace billing / DPO / security contacts. Depends
   on Workspace.

**Phase 1c — `domains/` (2 entities)**

1. `Domain` — canonical hostname owned by a Workspace. State machine:
   `pending → verifying → verified → expired`.
2. `DomainRecord` — DNS record inside a Domain. Diff-state, not
   lifecycle-tracked.

**Phase 1d — `branding/` (1 entity)**

1. `Branding` — theme + logo + typography + OG-image seeds per Workspace.
   Redis-cached, event-invalidated on `BrandingUpdated`.

**Phase 1e — `integrations/` (1 entity)**

1. `WorkspaceIntegration` — third-party credentials per Workspace, encrypted at
   rest via `IntegrationSecretsCipher` (KMS-derived key).

**Identity is NOT built here.** The previous Identity stub in workspaces has
been removed (belongs in identity-service, not platform-service). Author the
real Identity module under `modules/identity/identity/` when identity-service
kicks off — see
[`modules/identity/README.md`](../../../modules/identity/README.md).

### 3.2 Per-entity task template

For every entity in order:

1. **Migration** — Blueprint from `schemas/<entity>.schema.json`'s
   `x-database.columns`. Include the explicit `down()`.
2. **Model** — Attribute-first (`#[Table]`, `#[Fillable]`, `#[UseFactory]`,
   `#[UsePolicy]`, `#[ObservedBy]`, `#[ScopedBy]`); compose the traits from the
   schema's `x-eloquent.traits`; implement the interface from
   `Contracts/Data/<Entity>Interface`.
3. **Interface** — `Contracts/Data/<Entity>Interface.php` with column constants
   (`ATTR_*`), `TABLE`, `PRIMARY_KEY`, `KEY_TYPE`. Bound to the model via
   `#[Bind(Model::class)]` on the interface.
4. **Factory** — `database/factories/<Entity>Factory.php` with typed
   `@extends Factory<Model>`, named states for common variants.
5. **Repository interface + implementation** — `Contracts/Repositories/` +
   `Repositories/`; wire via `#[Bind]` + `#[AsRepository]`.
6. **Data DTOs** — Spatie Data classes under `Data/` with property-level
   validation attributes (`#[Required, StringType, Max(...)]`), NO `rules()`
   method. One input DTO per HTTP endpoint that mutates; one output DTO per
   read.
7. **Observers** — `Observers/<Entity>Observer.php` wiring the events listed in
   `events.json`. Fired via `#[ObservedBy]` on the model.
8. **Policies** — `Policies/<Entity>Policy.php` for every ability in
   `policies.json`. Wired via `#[UsePolicy]` on the model.
9. **Actions/Controllers** — single-invokable actions in `Actions/`. Each
   carries `#[AsController]` + `#[Get|Post|...]` + `permissions: [...]` (from
   `permissions.json`). NO route file — the Routing package discovers.
10. **Feature tests** — one file per use case in `tests/Feature/`. Every
    controller endpoint gets at least one happy-path test + at least one
    failure-path test per policy branch.
11. **Unit tests** — services / actions / repositories / Data DTOs in
    `tests/Unit/`.

### 3.3 Cross-entity + cross-slice wiring

After each slice lands, wire its own cross-cutting concerns before moving on:

- **1a application:** `BelongsToApplication` trait + `applicable()` migration
  macro published. `ApplicationServiceProvider` extends the shared base with
  `#[AsModule(name: 'Application', priority: 8)]`.
- **1b workspaces:** `BelongsToWorkspace` + `BelongsToWorkspaceOptional`
  traits + `workspaceable()` macro. `ApplicationMismatch` (422) guard on
  cross-application writes (per `hierarchy.md` §13). `WorkspacesServiceProvider`
  extends the shared base with `#[AsModule(name: 'Workspaces', priority: 10)]`.
- **1c domains:** `DomainVerifier` + `CertificateProvisioner` bindings. Domain
  observer wires the state machine transitions. `DomainsServiceProvider` at
  `#[AsModule(name: 'Domains', priority: 12)]`.
- **1d branding:** `BrandingResolver` binding (Redis-cached). Branding observer
  invalidates the resolver cache on save. `BrandingServiceProvider` at
  `#[AsModule(name: 'Branding', priority: 12)]`.
- **1e integrations:** `IntegrationRegistry` + `IntegrationSecretsCipher`
  bindings. Integration observer refuses cross-workspace writes.
  `IntegrationsServiceProvider` at
  `#[AsModule(name: 'Integrations', priority: 12)]`.

**Global sanity check after each slice:** `ScopedBy(WorkspaceScope)` on every
workspace-scoped model in the slice.

### 3.4 Verification checkpoint

Before Phase 2 starts, prove:

- [ ] `doppler run -- php artisan migrate` runs green on a fresh DB.
- [ ] `doppler run -- php artisan test --testsuite=Feature --filter=Workspaces`
      green with ≥ one test per endpoint.
- [ ] `doppler run -- php artisan test --testsuite=Unit --filter=Workspaces`
      green.
- [ ] `larastan analyse` clean.
- [ ] Every entity can be seeded via its factory.
- [ ] SDK sub-package (Phase 3.1 below) exists at
      `packages/sdk/platform-workspaces-sdk/` and passes `php -l`.

### 3.5 Estimated size — per slice

Post-split sizes (much friendlier than the pre-split mega-module):

| Slice             | Entities | Est. code files | Est. tests | Wall-clock            |
| ----------------- | -------- | --------------- | ---------- | --------------------- |
| 1a `application`  | 2        | ~15             | ~10        | 2-3 days              |
| 1b `workspaces`   | 2        | ~20             | ~15        | 3-4 days              |
| 1c `domains`      | 2        | ~20             | ~15        | 4-5 days (DNS jobs)   |
| 1d `branding`     | 1        | ~12             | ~8         | 2-3 days              |
| 1e `integrations` | 1        | ~15             | ~10        | 3-4 days (KMS cipher) |
| **Total Phase 1** | 8        | ~82             | ~58        | **~2-3 weeks**        |

Sliced version ships in 5 reviewable increments instead of one 100-file slab.

---

## 4. Phase 2 — `settings/`, `webhook/`, `storage/` (parallelisable)

Once `workspaces/` is green, the remaining three modules can be built in
parallel. They share nothing between each other (no cross-deps) so three
engineers can take one each.

### 4.1 `settings/` (priority 22, 3 entities)

Depends on `workspaces`, `activity`, `audit`.

Entities: `SettingsGroup`, `SettingsSchema`, `SettingValue`. The
attribute-discovered registry pattern (`#[AsSetting]` on classes → discovered at
boot → registered in `SettingsRegistry`) — this is the biggest new primitive
here.

Per-entity task template from §3.2 applies. Extra tasks:

- **`SettingsRegistry`** discoverer + loader (`.kiro/steering/discovery.md`
  contract).
- **Scope integration** — `settings` is a legitimate `scope` consumer per
  `tenancy-columns.md` §4; register the `settings` namespace once
  `modules/access/scope/` lands (defer if scope isn't up yet — use `#[ScopedTo]`
  on values as a placeholder).

### 4.2 `webhook/` (priority 22, 2 entities)

Depends on `foundation`, `versioning`, `workspaces`.

Entities: `WebhookSubscription`, `WebhookDelivery`. Central concerns:

- **HMAC signing** — every outbound POST carries `X-Stackra-Signature`
  (`sha256=<hmac>`) with the tenant's per-subscription secret.
- **Retry policy** — exponential backoff (10s, 30s, 2m, 10m, 1h, 6h), max 6
  attempts. Configurable per subscription tier via entitlements.
- **Endpoint verification** — subscription creation triggers a `challenge`
  round-trip; subscription stays `pending` until the endpoint echoes the
  challenge back within a signed timeframe.
- **Versioning integration** — payload transformer chain from `versioning`.

### 4.3 `storage/` (priority 24, 4 entities)

Depends on `foundation`, `workspaces`, `entitlements`, `activity`, `audit`.

Entities: `File`, `FileVariant`, `SignedUrlAudit`, `ChunkedUpload`. Wraps
`spatie/laravel-medialibrary ^11`. Central concerns:

- **Attribute-driven attachments** — `#[Attachable]` on a model → automatic
  `MorphMany<File>` relationship; consumers use `HasFiles` trait.
- **Signed URL orchestrator** — TTL policy per plan tier, redemption on the
  central host.
- **Chunked / resumable uploads** — state machine
  (`initiating → uploading → finalizing → completed | aborted | expired`).
- **Content-addressable dedup** — SHA-256 refcount with opt-out per kind.
- **Antivirus pipeline** — state transitions on `virus_scan_state`.

### 4.4 Cross-module wiring after Phase 2

Once all three modules land:

- Storage's `Attachable` attribute is discovered → consumers can attach files.
- Webhook subscribes to Platform's own `WorkspaceCreated` / `Updated` / `Erased`
  events so tenants receive them if subscribed.
- Settings registers per-workspace defaults for storage limits, webhook
  retention, etc.

### 4.5 Verification checkpoint

Same as §3.4 but per-module. Every migration runs, every test green, Larastan
clean.

---

## 5. Phase 3 — SDK sub-packages (per module)

After each module lands, scaffold its SDK sub-package immediately (don't batch —
SDKs are how the compliance-service, product monoliths, and future consumers
actually reach into Platform).

**Standard**: `.kiro/steering/sdk-authoring.md` is the canonical shape every
per-module SDK follows. Read it before invoking any agent or generator against
this phase. Non-negotiable outcomes:

- **Location:** `packages/sdk/<service>-<module>-sdk/`. Never inside
  `apps/<service>-service/src/modules/`. Per-module SDKs are shared packages
  consumed by every service, every product monolith, and the frontend.
- **Composer name:** `stackra-<service>/<module>-sdk`. Example:
  `stackra-platform/application-sdk`.
- **Folder layout:** `Data/` (read DTOs) + `Payloads/` (write DTOs) +
  `Requests/` (Saloon HTTP transport) + `Resources/` (all Resource-shaped
  classes — top-level `<Module>SdkResource` AND every peer Resource).
- **No `SubResources/`, no `Saloon/`.** See the anti-patterns table in
  `sdk-authoring.md`.
- **Reference implementation:**
  `apps/stackra/src/sdks/platform-application-sdk/` is the pilot; every
  subsequent module SDK matches its shape byte-for-byte, and the Stage 3
  generator emits into the same shape.

### 5.1 Scaffold command

The `scripts/new-module-sdk.sh` generator emits the correct
`packages/sdk/<service>-<module>-sdk/` skeleton. Run once per module after its
runtime lands:

```bash
cd stackra-backend
./scripts/new-module-sdk.sh platform workspaces   # after Phase 1
./scripts/new-module-sdk.sh platform settings     # after Phase 2
./scripts/new-module-sdk.sh platform webhook      # after Phase 2
./scripts/new-module-sdk.sh platform storage      # after Phase 2
```

Each scaffold creates `packages/sdk/platform-<module>-sdk/` with the folder
layout from `sdk-authoring.md`:

- `composer.json` naming `stackra-platform/<module>-sdk`.
- `src/Resources/<Module>SdkResource.php` marked
  `#[AsSdkResource(name: '<module>', service: 'platform')]` — the discovery
  entry.
- `src/Data/`, `src/Payloads/<Aggregate>/`, `src/Requests/<Aggregate>/`,
  `src/Enums/` — empty scaffolds ready for endpoint authoring.

The umbrella `packages/sdk/platform-sdk/` auto-discovers each new resource at
boot by scanning `#[AsSdkResource(service: 'platform')]`. Consumers call
`app(PlatformSdk::class)->workspaces()->contacts()->find($id)` etc.

### 5.2 Per-endpoint SDK task

For every HTTP endpoint the module exposes:

1. Author the Saloon `Request` class under `src/Requests/<Aggregate>/`.
2. Author the input `Payload` under `src/Payloads/<Aggregate>/` (Spatie Data,
   property-level validation attributes, no `rules()` method).
3. Author the output `Data` DTO under `src/Data/` if the aggregate doesn't
   already have one.
4. Add the domain method to the peer Resource under `src/Resources/`.
5. Add a unit test under `tests/Unit/Requests/<Aggregate>/`.
6. Add a Feature test under `tests/Feature/Resources/` covering the end-to-end
   SDK flow via `MockClient`.

### 5.3 Stage 3 automation — the SDK generator

Once every platform SDK exists as a hand-authored reference (Phase 3), the Stage
3 generator (`php artisan sdk:generate <service>`, per `sdk-authoring.md` §
"Generator alignment") is authored. It emits SDK sub-packages from server-side
`#[SdkResource]` / `#[SdkPayload]` / `#[SdkEndpoint]` attributes on module code,
and CI runs `php artisan sdk:diff` on every PR to fail on drift. Every generator
emission targets the layout locked in `sdk-authoring.md`.

### 5.4 Frontend types (deferred to a later spec)

The frontend consumes each SDK's DTOs. Type generation lands in a follow-up spec
— see the earlier discussion on `traits.json → TS interfaces` and
`spatie/typescript-transformer`. Every future TS generator will emit against the
same shape defined in `sdk-authoring.md`.

---

## 6. Phase 4 — planned additions (post-Phase-3)

Once the four core modules ship, four more Platform modules need blueprints

- implementation before Platform is "complete":

1. **`modules/platform/organization/`** — Organization model + hierarchy support
   (tier-gated per `hierarchy.md` §7).
2. **`modules/platform/region/`** — Region model (currency, tax, timezone,
   locale). Cannot carry `organization_id` per `tenancy-columns.md` §5.
3. **`modules/platform/branch/`** — Branch model (carries `organization_id` AND
   `region_id`). This is where the three axes meet.
4. **`modules/platform/feature-flag/`** — Kill switches, overrides, rollouts,
   plan gates. Consumes `entitlements` for plan gates.

Each is a full Phase-1-style build. Estimated 3-4 weeks per module in parallel.
Author the blueprints first (spec: land as
`.kiro/specs/platform-service-implementation/phase-4/*.md`), then implement.

### 6.1 Entity extractions

At Phase 4 or later, extract from `workspaces/` into their own modules:

- `modules/platform/branding/` — split from workspaces (Branding entity has a
  distinct lifecycle worth its own module).
- `modules/platform/domain/` — Domain + DomainRecord move out (they're a full
  sub-substrate with DNS verification, cert rotation, etc.).

These are refactors, not features — they don't add capability, they reduce blast
radius. Do them ONLY when workspaces starts becoming unwieldy.

---

## 7. Cross-cutting engineering discipline

Everything below applies to every module in every phase. If a phase deviates,
the deviation is a bug.

### 7.1 Discovery contract

Every attribute-driven registry consumes `IDiscoveryService` from
`@stackra/container`'s PHP equivalent
(`Stackra\Foundation\Contracts\DiscoversAttributes`). Never scan reflection
at request time; never write a bootstrap class that does side-effect work in the
constructor.

### 7.2 Data-first

Zero `FormRequest`. Zero `JsonResource`. Every payload in and every response out
flows through a Spatie Data DTO with property-level validation attributes. See
`.kiro/steering/data-first.md`.

### 7.3 Actions-only

Zero grouped resource controllers. Every endpoint is a single invokable Action
with `#[AsAction]` + `#[Get|Post|...]` + `permissions: []` in `Actions/`. See
`.kiro/steering/actions-only-full.md`.

### 7.4 Octane-first DI

Zero static state on services. `#[Scoped]` for anything request-touching;
`#[Singleton]` only when provably stateless. No facades inside services; inject
via container attributes. See `.kiro/steering/octane-first-di.md`.

### 7.5 Docblocks

Every file, every symbol, every non-trivial line gets a docblock per
`.kiro/steering/docblocks.md`. This is not optional — the docblocks ARE the
`.d.ts` and API-docs surface.

### 7.6 Tenancy compliance

Every migration that adds a column must pass the
[`tenancy-compliance-auditor`](../../agents/tenancy-compliance-auditor.md)
sub-agent's check before merge. Zero cross-tenant queries; zero shortcut FKs;
zero forbidden columns.

### 7.7 Test coverage floor

- Feature tests: every controller endpoint has a happy path + a policy-fail
  path.
- Unit tests: every service method + every DTO validation rule + every observer
  branch.
- `composer test:coverage` floor: 80%.

### 7.8 Doppler discipline

Never write a real secret into any file. `.env.example` is placeholders only;
real values live in `dev_platform_service` on Doppler. Every artisan command
runs via `doppler run --`.

### 7.9 Conventional commits + branch hygiene

Feature branches: `feat/platform-<module>-<slice>`. Never push to `main`. One
logical slice per commit; split refactors from feature work.

---

## 8. Sequence summary

Phased sequence (assuming no parallelisation):

- **Phase 0** — prerequisites (shared packages green, validator green, service
  scaffolded). Blocker check.
- **Phase 1** — `workspaces/` runtime + SDK. **Ship first, unblocks
  everything.**
- **Phase 2** — `settings/`, `webhook/`, `storage/` runtimes + SDKs
  (parallelisable across three engineers).
- **Phase 3** — SDK per module (interleaved with each phase, not a distinct
  phase in wall-clock time — this row is a reminder).
- **Phase 4** — `organization/`, `region/`, `branch/`, `feature-flag/`
  blueprints + implementations. Only after Phase 2 lands.
- **Phase 5 (deferred)** — entity extractions from workspaces.
- **Phase 6 (deferred)** — `Workspace → Tenant` rename per ADR-0017.

**Wall-clock estimate** (single senior engineer): Phase 0 (unblock) + Phase 1 (2
weeks) + Phase 2 (2 weeks parallel or 6 weeks serial) + Phase 4 (3-4 weeks).
Platform-service goes production-ready in roughly **8-14 weeks** depending on
parallelisation.

---

## 9. Deliverables checklist

Track these as separate spec files as they land:

- [ ] `phase-1/workspaces.md` — entity-by-entity build log for workspaces.
- [ ] `phase-2/settings.md`, `phase-2/webhook.md`, `phase-2/storage.md` —
      per-module build logs.
- [ ] `phase-3/sdk-conventions.md` — SDK patterns codified once the first three
      SDKs land (before generating for identity/billing/etc.).
- [ ] `phase-4/organization.md`, `phase-4/region.md`, `phase-4/branch.md`,
      `phase-4/feature-flag.md` — blueprints + implementation plans.

Each phase log gets its own commit and its own review. This spec (`README.md`)
is the top-level index; phase logs are the working documents.

---

## 10. Open questions (require answers before Phase 1)

Confirm or answer these before writing any code:

1. **`Workspace → Tenant` rename timing.** The current on-disk name is
   `Workspace`; the target per ADR-0017 is `Tenant`. Do we ship the runtime with
   the current name and rename later (Phase 6), or rename first? My
   recommendation: **ship as `Workspace` now**, rename later.
2. **Storage extraction trigger.** DECISION.md says storage folds into
   platform-service until file bandwidth exceeds ~30% of the budget. Are we OK
   shipping storage inside platform-service for at least the first six months?
   My recommendation: **yes.**
3. **Identity stub in workspaces.** The `workspaces/` schemas include an
   `Identity` stub. When identity-service ships, this Identity moves. Do we keep
   the stub in workspaces initially or start identity-service first because "no
   auth = no service works"? My recommendation: **stub in workspaces now**,
   migrate at the identity-service kickoff.
4. **Naming: `stackra/*` vs `figentra/*`.** DECISION.md §9 defers this.
   Confirm we keep `stackra/*` for Phase 1-4. My recommendation: **keep
   `stackra/*`.**

---

## 11. For agents

**Do NOT start coding until you've read**, in order:

1. `../platform-architecture/DECISION.md` — the shape of the six services.
2. `../../../modules/README.md` — the blueprint index.
3. `../../../modules/platform/README.md` — the platform tier.
4. This file.
5. `../../../modules/platform/workspaces/readme.md` — the module you're about to
   build.

**Use these steering rules as guardrails at every step**:

- `.kiro/steering/architecture.md`
- `.kiro/steering/package-architecture.md`
- `.kiro/steering/domain-patterns.md`
- `.kiro/steering/data-first.md`
- `.kiro/steering/php-attributes.md`
- `.kiro/steering/actions-only-full.md`
- `.kiro/steering/octane-first-di.md`
- `.kiro/steering/docblocks.md`
- `.kiro/steering/tenancy-columns.md`
- `.kiro/steering/testing.md`
- `.kiro/steering/doppler.md`

Any deviation from these rules requires an explicit ADR — not an implicit "the
code was cleaner this way."

---

## 12. Related

- `../platform-architecture/DECISION.md` — the platform-shape decision.
- `../module-blueprints/PLAN.md` — the blueprint contract every module follows.
- `../../../modules/README.md` — the master blueprint index.
- `../../../modules/platform/README.md` — the platform tier index.
