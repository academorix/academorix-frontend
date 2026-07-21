# foundation

Pure-infrastructure Wave 0 module. Ships the base primitives every other module
composes on: cross-cutting model traits, paired migration macros, base HTTP +
exception + job + repository classes, the health aggregator, API versioning
middleware, module discovery, cache tag namespaces, error envelope contract,
data-classification taxonomy, and the compliance regime taxonomy.

**Zero domain entities.** Foundation is entity-less on purpose — it holds the
shape every other module bends to, not any business data of its own. No
`schemas/`, no `data/`, no `sdui/` folders.

## Placement rationale

`foundation` is the root of the dependency graph. Every module depends on it. It
cannot depend on any other module. This constrains what lives here to truly
universal concerns — anything domain-flavoured, tenant-flavoured, or opinionated
about a specific business context belongs elsewhere.

Specifically NOT in foundation:

- `Application` and `Tenant` — owned by `tenants` (the multi-tenant substrate).
- `User` and `PlatformUser` — owned by `user` (the identity substrate).
- `Role` and `Permission` — owned by `access` (the RBAC substrate).
- `ScopeNode` and hierarchy resolution — owned by `scope` (the hierarchical
  scope substrate).
- Delivery / notification / bounce tracking — owned by `notifications`.

## What foundation owns

### 1. Cross-cutting model traits (see `traits.json`)

Every persistent model in every downstream module composes some subset:

| Trait                 | Purpose                                                                                                                                                                                                                                      | Paired macro              |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------- |
| `HasSystemFlag`       | Adds `is_system` boolean + `system() / custom()` scopes + `isSystem()` / `isCustom()` accessors. Refused on Policy@update / @delete when true.                                                                                               | `->systemFlag()`          |
| `HasUserstamps`       | Adds `created_by / updated_by / deleted_by` UUID trio + auto-fills from the resolved caller.                                                                                                                                                 | `->userstampable()`       |
| `HasAuditable`        | Wraps `owen-it/laravel-auditing`. Writes an audit row on every mutation with tenant + user + payload diff.                                                                                                                                   | `->auditable()` (marker)  |
| `HasMetadata`         | Adds a `metadata` JSONB column + `array` cast + fluent accessors (`getMetadata`, `setMetadata`, `mergeMetadata`, `forgetMetadata`). Free-form platform notes; never queried.                                                                 | `->metadata()`            |
| `Sortable`            | Adds `sort_order` unsigned-int + `sortable()` scope + `reorder([...])` bulk-move helper. Backing: `spatie/eloquent-sortable`.                                                                                                                | `->sortable()`            |
| `Filterable`          | Integration with `spatie/laravel-query-builder`. Reads `allowedFilters()` static method on the model + wires the base repository.                                                                                                            | `->filterable()` (marker) |
| `Sluggable`           | Adds a `slug` string column + unique index + auto-fill on `saving` from a `sluggableSource()` method. Backing: `cviebrock/eloquent-sluggable`.                                                                                               | `->sluggable()`           |
| `HasVectorEmbeddings` | **v2 stub.** Adds a pgvector `embeddings` column + `nearest()` scope for similarity queries. Semantic search primitive \u2014 the operational surface lives in `modules/search/` (pgvector engine adapter). Deferred until AI features land. | `->embeddings($dim)`      |

> **Search moved out.** `Searchable` trait \u2014 along with its
> `->searchable()` blueprint macro, `SearchEngineResolver` binding,
> `IndexSearchableJob`, the `search:reindex` / `search:flush` commands,
> `foundation.search` config section, `foundation:search:engine_health` cache
> key, `FOUNDATION_SEARCH_ENGINE_UNAVAILABLE` error, `search-engine-reachable`
> health probe, `foundation:search-index-refresh` schedule entry,
> `foundation.search-indexing` kill switch, `platform.search.manage` permission,
> and `POST /api/v1/platform/search/*` routes \u2014 moved to `modules/search/`
> on Wave 6 module inception. Consumer models now use
> `Stackra\Search\Concerns\HasSearchable` alongside the `#[Searchable]` PHP
> attribute. See `modules/search/readme.md` \u00a7 10 for the full rename map.

> **Import / export moved out.** `Importable` and `Exportable` traits — along
> with their `->importable()` / `->exportable()` blueprint macros — moved to
> `modules/transfer/` on Wave 2 module inception. Consumer models now use
> `Stackra\Transfer\Concerns\HasImportable` / `HasExportable` alongside the
> `#[Importable]` / `#[Exportable]` PHP attributes. See
> `modules/transfer/readme.md` § 11 for the full rename map.

Composition example (from `traits.json`):

```php
final class Branch extends Model
{
    use HasFactory;
    use HasUlids;

    use BelongsToTenant;           // tenants
    use BelongsToOrganization;     // organization
    use BelongsToRegion;           // region

    use HasSystemFlag;             // foundation
    use HasMetadata;               // foundation
    use HasUserstamps;             // foundation
    use HasAuditable;              // foundation
    use Sluggable;                 // foundation
    use Filterable;                // foundation
    use Sortable;                  // foundation

    use HasImportable;             // transfer  (optional)
    use HasExportable;             // transfer  (optional)
    use HasSearchable;             // search    (optional)

    use SoftDeletes;               // framework
}
```

### 2. Paired migration macros

Every trait ships a `Blueprint` macro so the migration reads like the model. See
`traits.json` + `macros.json` for the mapping. Composition example (matches the
model above):

```php
Schema::create('branches', function (Blueprint $t) {
    $t->string('id', 64)->primary();
    $t->tenantable();              // tenants
    $t->organizable();             // organization
    $t->regionable();              // region
    $t->string('name');
    $t->systemFlag();              // foundation
    $t->metadata();                // foundation
    $t->userstampable();           // foundation
    $t->auditable();               // foundation (marker)
    $t->sluggable('name');         // foundation
    $t->filterable();              // foundation (marker)
    $t->sortable();                // foundation
    // Search markers moved to modules/search/ — search discovers via PHP
    // attributes (#[Searchable]), not migration macros.
    // import / export markers no longer live in the schema — the transfer
    // module discovers importable / exportable models via attribute-driven
    // registration (#[Importable] / #[Exportable]), not migration macros.
    $t->softDeletes();
    $t->timestamps();
});
```

Note: the content-translation macro `Blueprint::translations()` lives in
`modules/localization/` alongside its paired `HasTranslations` trait —
foundation owns cross-cutting infrastructure macros, and per-row content
translation is a localization concern. See `modules/localization/macros.json`
and `modules/localization/readme.md` for the macro definition + the
`?include=translations` API convention it enables.

### 3. Base HTTP + exception + job + repository primitives

| Primitive            | Class                                               | Role                                                                                                                                |
| -------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Base data DTO        | `Stackra\Foundation\Data\BaseData`               | Extends `spatie/laravel-data` with `SnakeCaseMapper` + wire envelope defaults.                                                      |
| Base request         | `Stackra\Foundation\Http\BaseFormRequest`        | Standardises validation error envelope + error code mapping.                                                                        |
| Base controller      | `Stackra\Foundation\Http\BaseController`         | Response envelope helpers + policy binding + `include=` param parsing.                                                              |
| Base CRUD controller | `Stackra\Foundation\Http\CrudController`         | RESTful defaults built on spatie/laravel-query-builder. Every entity-resource controller extends this.                              |
| Base exception       | `Stackra\Foundation\Exceptions\ApiException`     | Structured error code + HTTP status + i18n key + audit severity. Base of every custom exception.                                    |
| Base repository      | `Stackra\Foundation\Repositories\BaseRepository` | Query builder + eager-load defaults + spatie/query-builder integration + cache invalidation hooks.                                  |
| Base service         | `Stackra\Foundation\Services\BaseService`        | Repository binding + event dispatch + audit trail integration.                                                                      |
| Base job             | `Stackra\Foundation\Jobs\BaseJob`                | Automatic Sentry tags + tenants context capture + retry backoff defaults.                                                           |
| Response envelope    | `Stackra\Foundation\Http\ResponseEnvelope`       | Wraps every controller response into `{ data, meta, links }` per the API contract.                                                  |
| Health aggregator    | `Stackra\Foundation\Health\HealthAggregator`     | Discovers registered probes from every module + reports readiness + liveness on `/api/health`.                                      |
| Module registry      | `Stackra\Foundation\Modules\ModuleRegistry`      | Discovers every `modules/*/module.json` at boot + resolves dependency graph.                                                        |
| Module route loader  | `Stackra\Foundation\Modules\ModuleRouteLoader`   | Reads every module's `routes.json` and mounts route groups under the correct middleware stack. No per-module route provider needed. |

### 4. Middleware (see `middleware.json`)

| Alias               | Role                                                                                                         |
| ------------------- | ------------------------------------------------------------------------------------------------------------ |
| `api.version`       | Enforces `Accept: application/vnd.stackra.v1+json` on `/api/v1/*`. Emits `X-API-Version` on the response. |
| `request.id`        | Assigns / propagates `X-Request-ID` for cross-service tracing.                                               |
| `response.envelope` | Wraps controller responses into the standard `{data, meta, links}` shape.                                    |
| `throttle.base`     | Global rate limiter. Every route composes this on top of its per-feature limiter.                            |
| `cors.strict`       | CORS with per-Application origin allow-list.                                                                 |

### 5. Health substrate (see `health.json`)

Foundation ships the aggregator + probe interface. Every downstream module
registers probes via `HealthAggregator::probe(...)` in its service provider
boot. The aggregate `/api/health` walks every registered probe and returns
`{ status, checks: [...] }` — per Kubernetes readiness / liveness / startup
conventions.

Base probes shipped by foundation:

- `app-booted` (startup — the service provider chain completed).
- `db-connectivity` (readiness — trivial `SELECT 1`).
- `cache-connectivity` (readiness — trivial ping).
- `queue-connectivity` (liveness — Horizon/Sentinel introspection).

### 6. Module discovery + route loader

Foundation is where the module system lives:

- `ModuleRegistry` — reads every `modules/*/module.json` at boot, resolves
  dependency order, provides `Module::all()` / `Module::get(name)`.
- `ModuleRouteLoader` — reads every module's `routes.json` and mounts each group
  with the correct middleware stack. **Replaces per-module Route Service
  Providers** — this is why tenants dropped its `TenancyRouteServiceProvider`
  (PLAN.md §5.2 correction 2).
- `ModuleServiceProviderDispatcher` — boots the modules' service providers in
  dependency order.

### 7. Error envelope contract (see `errors.json`)

Every controller returns errors as:

```json
{
  "message": "Human-readable summary",
  "error": {
    "code": "MODULE_ERROR_KEY",
    "http": 422,
    "retryable": false,
    "i18n_key": "module.errors.error_key"
  },
  "errors": { "field_name": ["Field-level messages"] }
}
```

Every custom exception in every module extends `ApiException` which produces
this envelope. `errors.json` per module catalogues the codes; foundation's
`errors.json` catalogues the base + universal codes (429, 401, 403, 500, ...).

### 8. Data classification taxonomy (see `data-classes.json`)

Foundation ships the tier taxonomy every module's `data-classes.json`
references:

- `public` — non-identifying, safe in URLs and logs.
- `internal` — platform-internal state, not personally identifiable.
- `confidential` — PII, DSAR-exportable and erasable.
- `restricted` — credential-adjacent secrets, crypto-shredded on erasure.
- `regulated_minor` — subject-under-age-of-consent PII (COPPA / GDPR Art. 8).
- `regulated_health` — safeguarding / medical data (HIPAA-adjacent controls).
- `regulated_financial` — PCI / banking / tax data (PCI-DSS scope).

Every module's `data-classes.json` classifies its fields against these tiers.
Foundation's file is the _reference_ — no fields classified because foundation
has no entities.

### 9. Compliance regime taxonomy (see `compliance.json`)

Foundation declares which compliance regimes every downstream module inherits by
default:

- **GDPR** (EU 2016/679) — applicable whenever any EU/EEA/UK data subject is in
  scope.
- **UK-GDPR** — mirrors GDPR post-Brexit.
- **CCPA/CPRA** — California residents.
- **COPPA** — US minors under 13.
- **FERPA** — US school tenants.
- **PCI-DSS v4.0** — payment card data (out of scope for most modules; we stay
  SAQ-A by keeping card data in Stripe).
- **WCAG 2.2 AA** — accessibility (all SDUI + Refine UI kit).
- **SOC 2 Type II** — over $50k ACV tenants.
- **ISO/IEC 27001:2022** — international enterprise buyers.

Each downstream `compliance.json` cites the specific articles / criteria it
produces evidence for. Foundation's file is the reference — declares the regimes
without evidence attribution.

### 10. Cache tag namespaces (see `caches.json`)

Every module reads / writes cache with tags. Foundation reserves the tag
namespaces so no two modules collide:

- `platform` — cross-module platform state (module registry, health status).
- `foundation` — base caches (permissions checksum + trait-related metadata).

Downstream modules use their own module-name tags (`tenants`, `invitations`,
`notifications`, ...).

### 11. Analytics + metrics conventions

Foundation shapes the conventions (metric names, label taxonomy, sampling rate)
so every module's counters aggregate consistently. See `metrics.json`.

## Contributions

- **Traits** — 9 owned (see §1 above). `Importable` / `Exportable` moved to
  `modules/transfer/` on Wave 2 inception; `Searchable` moved to
  `modules/search/` on Wave 6 inception.
- **Blueprints** — 8 owned migration macros (paired with traits). `importable` /
  `exportable` / `searchable` markers retired \u2014 transfer + search discover
  via PHP attributes.
- **Middleware** — 5 owned (api.version, request.id, response.envelope,
  throttle.base, cors.strict).
- **Events** — 5 owned (ApplicationBooted, ModuleDiscovered, ModuleBooted,
  HealthProbeFailed, ConfigReloaded).
- **Rules** — 3 owned validation rules (valid_ulid, valid_iso8601_duration,
  hex_color).
- **Casts** — 3 owned Eloquent casts (MetadataCast, SluggableCast,
  EmbeddingsCast).
- **Commands** — 5 owned (module:list, module:sync, module:diagnose,
  health:check, cache:tags). `search:reindex` / `search:flush` moved to
  `modules/search/` on Wave 6 inception.
- **Container bindings** — 3 primary bindings (HealthAggregator, ModuleRegistry,
  ModuleRouteLoader). `ImportContractRegistry` / `ExportContractRegistry` moved
  to `modules/transfer/` as `EntityRegistry` / `WorkbookRegistry` on Wave 2
  inception; `SearchEngineResolver` moved to `modules/search/` as
  `EngineRegistry` on Wave 6 inception.
- **Broadcast channels** — 1 (`platform.health`, cross-tenant liveness feed for
  platform-admin ops).
- **No entities.** No policies. No permissions. No features. No entitlements. No
  SDUI resources.

## Depends on

Nothing. This is the root of the dependency graph.

## Depended on by

Every other module. See `module.json.extendedBy`.

## Blueprint layout (this folder)

Standard module blueprint shape. Note the intentionally missing folders
(`schemas/`, `relations.json`, `data/`, `sdui/`) — this module has no entities.

```
modules/foundation/
├── module.json / readme.md / changelog.md
├── traits.json             THE headline artefact: 9 owned traits + all consumed framework traits
├── routes.json             health + ping + version + module discovery
├── middleware.json         5 owned middleware
├── events.json             5 lifecycle events
├── listeners.json          empty (publisher-only)
├── observers.json          empty (no models to observe)
├── hooks.json              empty
├── jobs.json               base contracts (search indexing only — import batch + export streaming moved to modules/transfer/)
├── schedule.json           health snapshot + search-index refresh
├── commands.json           7 artisan commands
├── notifications.json      empty (foundation ships no notifications; it hosts the substrate other modules use)
├── broadcasts.json         platform.health channel
├── policies.json           empty
├── permissions.json        empty (no persistent surface)
├── features.json           empty
├── entitlements.json       empty
├── health.json             defines the aggregator contract + base probes
├── metrics.json            base RED metrics + module counts
├── analytics.json          empty (foundation is invisible to product analytics)
├── caches.json             base cache namespaces + tags
├── retention.json          empty (no data to retain)
├── compliance.json         base regime taxonomy every module inherits
├── data-classes.json       5-tier taxonomy reference (no fields classified — no entities)
├── errors.json             base error envelope contract + universal codes
├── subprocessors.json      empty
├── webhooks.json           empty (foundation ships no webhook contract of its own)
├── feature-flags.json      foundation-level kill switches (module-loader kill, health-probe-skip)
├── config.json             module discovery + health + api version + search engine
└── settings.json           empty (no tenant-facing settings)
```

## 12. Event contract versioning policy

Every domain event that leaves the process (webhook fan-out, EventBridge /
PubSub export, cross-service consumption) has a **frozen JSON Schema wire
contract** under `modules/<owner>/contracts/<event>.v<N>.json`. The owning
module's `events.json` references the contract via `wire_contract_file` +
`wire_contract_version`

- `wire_event_name`. See:

* `modules/tenancy/contracts/tenant-provisioned.v1.json`
* `modules/subscription/contracts/subscription-upgraded.v1.json`
* `modules/notifications/contracts/notification-dispatched.v1.json`
* `modules/entitlements/contracts/entitlement-consumed.v1.json`

### Additive changes (SAFE — no version bump)

New OPTIONAL property, expanded enum value, relaxed `format`, wider integer
`maximum`. These stay in the current `v<N>.json` file. No parallel dispatch
required.

### Breaking changes (REQUIRE v2)

Every one of the following is breaking:

- Removed property
- Renamed property
- Tightened type (e.g. `["string", "null"] → "string"`)
- Tightened pattern
- New `required` entry (adds a mandatory field consumers didn't handle before)
- Removed enum value
- Changed semantics (same shape, different meaning)

The migration path is not `v1 → v2`; it's `v1` and `v2` dispatch **in parallel**
for at least one deprecation cycle (six months by default). This gives every
webhook subscriber, downstream service, and integration partner time to migrate.
The exact checklist lives inside each `.v1.json` file under
`x-versioning.breaking_change_checklist`.

### v2 publishing checklist

1. Publish `contracts/<event>.v2.json` alongside the v1 file.
2. Add a second `wire_contract_file` entry in the owning `events.json`.
3. Update the event dispatcher to emit BOTH v1 + v2 payloads to every transport
   that reads a contract file.
4. Publish a `versioning::DeprecationNotice` targeting the v1 contract with a
   `sunset_at` at least six months out.
5. Wait the deprecation window. Cross-reference `WebhookDelivery.attempts`
   telemetry to confirm no active subscriber still receives v1.
6. In the next MAJOR release, delete v1 dispatch + move the v1 file to
   `contracts/deprecated/`.

### Contract fields (convention)

Every contract file carries these top-level meta fields regardless of the
event's payload:

| Field                                            | Purpose                                                                         |
| ------------------------------------------------ | ------------------------------------------------------------------------------- |
| `id`                                             | `stackra://modules/<owner>/contracts/<event>.v<N>`                           |
| `draft`                                          | Points at JSON Schema draft-2020-12                                             |
| `x-emitter`                                      | Fully-qualified PHP class of the dispatching event                              |
| `x-owning-module`                                | Module slug (matches folder name)                                               |
| `x-event-name`                                   | Wire-canonical dotted name: `<owner>.<entity>.<action>`                         |
| `x-version`                                      | `v1`, `v2`, etc.                                                                |
| `x-frozen`                                       | Boolean — always `true` for published contracts                                 |
| `x-frozen-since`                                 | ISO-8601 date the contract was frozen                                           |
| `x-transport`                                    | Array of transports that carry this event (in-process, webhook, EventBridge, …) |
| `x-consumers`                                    | Documented consumers                                                            |
| `x-versioning`                                   | Policy + breaking-change checklist specific to this event                       |
| `type: "object"` + `additionalProperties: false` | Enforces exact shape at the JSON Schema layer                                   |
| `required` + `properties`                        | The wire contract itself                                                        |

Consumers that unmarshal into typed data classes (Laravel Data DTOs, Node/TS
types, Rust structs) should generate code from the contract file — never
handwrite the schema.
