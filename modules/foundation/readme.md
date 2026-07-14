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

- `Application` and `Tenant` — owned by `tenancy` (the multi-tenant substrate).
- `User` and `PlatformUser` — owned by `user` (the identity substrate).
- `Role` and `Permission` — owned by `access` (the RBAC substrate).
- `ScopeNode` and hierarchy resolution — owned by `scope` (the hierarchical
  scope substrate).
- Delivery / notification / bounce tracking — owned by `notifications`.

## What foundation owns

### 1. Cross-cutting model traits (see `traits.json`)

Every persistent model in every downstream module composes some subset:

| Trait                 | Purpose                                                                                                                                                                             | Paired macro              |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------- |
| `HasSystemFlag`       | Adds `is_system` boolean + `system() / custom()` scopes + `isSystem()` / `isCustom()` accessors. Refused on Policy@update / @delete when true.                                      | `->systemFlag()`          |
| `HasUserstamps`       | Adds `created_by / updated_by / deleted_by` UUID trio + auto-fills from the resolved caller.                                                                                        | `->userstampable()`       |
| `HasAuditable`        | Wraps `owen-it/laravel-auditing`. Writes an audit row on every mutation with tenant + user + payload diff.                                                                          | `->auditable()` (marker)  |
| `HasMetadata`         | Adds a `metadata` JSONB column + `array` cast + fluent accessors (`getMetadata`, `setMetadata`, `mergeMetadata`, `forgetMetadata`). Free-form platform notes; never queried.        | `->metadata()`            |
| `Sortable`            | Adds `sort_order` unsigned-int + `sortable()` scope + `reorder([...])` bulk-move helper. Backing: `spatie/eloquent-sortable`.                                                       | `->sortable()`            |
| `Filterable`          | Integration with `spatie/laravel-query-builder`. Reads `allowedFilters()` static method on the model + wires the base repository.                                                   | `->filterable()` (marker) |
| `Sluggable`           | Adds a `slug` string column + unique index + auto-fill on `saving` from a `sluggableSource()` method. Backing: `cviebrock/eloquent-sluggable`.                                      | `->sluggable()`           |
| `Searchable`          | Wraps `laravel/scout`. Adds `toSearchableArray()` + `searchable()` scope. Engine chosen per boot config (Meilisearch default; Elasticsearch + Postgres FTS + Typesense supported).  | `->searchable()` (marker) |
| `HasVectorEmbeddings` | **v2 stub.** Adds a pgvector `embeddings` column + `nearest()` scope for similarity queries. Semantic search — distinct from lexical `Searchable`. Deferred until AI features land. | `->embeddings($dim)`      |

> **Import / export moved out.** `Importable` and `Exportable` traits — along
> with their `->importable()` / `->exportable()` blueprint macros — moved to
> `modules/transfer/` on Wave 2 module inception. Consumer models now use
> `Academorix\Transfer\Concerns\HasImportable` / `HasExportable` alongside the
> `#[Importable]` / `#[Exportable]` PHP attributes. See
> `modules/transfer/readme.md` § 11 for the full rename map.

Composition example (from `traits.json`):

```php
final class Branch extends Model
{
    use HasFactory;
    use HasUlids;

    use BelongsToTenant;           // tenancy
    use BelongsToOrganization;     // organization
    use BelongsToRegion;           // region

    use HasSystemFlag;             // foundation
    use HasMetadata;               // foundation
    use HasUserstamps;             // foundation
    use HasAuditable;              // foundation
    use Sluggable;                 // foundation
    use Filterable;                // foundation
    use Searchable;                // foundation
    use Sortable;                  // foundation

    use HasImportable;             // transfer  (optional)
    use HasExportable;             // transfer  (optional)

    use SoftDeletes;               // framework
}
```

### 2. Paired migration macros

Every trait ships a `Blueprint` macro so the migration reads like the model. See
`traits.json` for the mapping. Composition example (matches the model above):

```php
Schema::create('branches', function (Blueprint $t) {
    $t->string('id', 64)->primary();
    $t->tenantable();              // tenancy
    $t->organizable();             // organization
    $t->regionable();              // region
    $t->string('name');
    $t->systemFlag();              // foundation
    $t->metadata();                // foundation
    $t->userstampable();           // foundation
    $t->auditable();               // foundation (marker)
    $t->sluggable('name');         // foundation
    $t->filterable();              // foundation (marker)
    $t->searchable();              // foundation (marker)
    $t->sortable();                // foundation
    // import / export markers no longer live in the schema — the transfer
    // module discovers importable / exportable models via attribute-driven
    // registration (#[Importable] / #[Exportable]), not migration macros.
    $t->softDeletes();
    $t->timestamps();
});
```

### 3. Base HTTP + exception + job + repository primitives

| Primitive              | Class                                               | Role                                                                                                                                |
| ---------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Base data DTO          | `Academorix\Foundation\Data\BaseData`               | Extends `spatie/laravel-data` with `SnakeCaseMapper` + wire envelope defaults.                                                      |
| Base request           | `Academorix\Foundation\Http\BaseFormRequest`        | Standardises validation error envelope + error code mapping.                                                                        |
| Base controller        | `Academorix\Foundation\Http\BaseController`         | Response envelope helpers + policy binding + `include=` param parsing.                                                              |
| Base CRUD controller   | `Academorix\Foundation\Http\CrudController`         | RESTful defaults built on spatie/laravel-query-builder. Every entity-resource controller extends this.                              |
| Base exception         | `Academorix\Foundation\Exceptions\ApiException`     | Structured error code + HTTP status + i18n key + audit severity. Base of every custom exception.                                    |
| Base repository        | `Academorix\Foundation\Repositories\BaseRepository` | Query builder + eager-load defaults + spatie/query-builder integration + cache invalidation hooks.                                  |
| Base service           | `Academorix\Foundation\Services\BaseService`        | Repository binding + event dispatch + audit trail integration.                                                                      |
| Base job               | `Academorix\Foundation\Jobs\BaseJob`                | Automatic Sentry tags + tenancy context capture + retry backoff defaults.                                                           |
| Response envelope      | `Academorix\Foundation\Http\ResponseEnvelope`       | Wraps every controller response into `{ data, meta, links }` per the API contract.                                                  |
| Health aggregator      | `Academorix\Foundation\Health\HealthAggregator`     | Discovers registered probes from every module + reports readiness + liveness on `/api/health`.                                      |
| Module registry        | `Academorix\Foundation\Modules\ModuleRegistry`      | Discovers every `modules/*/module.json` at boot + resolves dependency graph.                                                        |
| Module route loader    | `Academorix\Foundation\Modules\ModuleRouteLoader`   | Reads every module's `routes.json` and mounts route groups under the correct middleware stack. No per-module route provider needed. |
| Search engine resolver | `Academorix\Foundation\Search\SearchEngineResolver` | Container binding that picks the Scout engine per environment (Meilisearch default).                                                |

### 4. Middleware (see `middleware.json`)

| Alias               | Role                                                                                                         |
| ------------------- | ------------------------------------------------------------------------------------------------------------ |
| `api.version`       | Enforces `Accept: application/vnd.academorix.v1+json` on `/api/v1/*`. Emits `X-API-Version` on the response. |
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
  Providers** — this is why tenancy dropped its `TenancyRouteServiceProvider`
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
- `foundation` — base caches (search indices ready, engine health).

Downstream modules use their own module-name tags (`tenancy`, `invitations`,
`notifications`, ...).

### 11. Analytics + metrics conventions

Foundation shapes the conventions (metric names, label taxonomy, sampling rate)
so every module's counters aggregate consistently. See `metrics.json`.

## Contributions

- **Traits** — 10 owned (see §1 above). `Importable` / `Exportable` moved to
  `modules/transfer/` on Wave 2 inception.
- **Blueprints** — 9 owned migration macros (paired with traits). `importable` /
  `exportable` markers retired \u2014 transfer discovers via PHP attributes.
- **Middleware** — 5 owned (api.version, request.id, response.envelope,
  throttle.base, cors.strict).
- **Events** — 5 owned (ApplicationBooted, ModuleDiscovered, ModuleBooted,
  HealthProbeFailed, ConfigReloaded).
- **Rules** — 3 owned validation rules (valid_ulid, valid_iso8601_duration,
  hex_color).
- **Casts** — 3 owned Eloquent casts (MetadataCast, SluggableCast,
  EmbeddingsCast).
- **Commands** — 7 owned (module:list, module:sync, module:diagnose,
  health:check, cache:tags, search:reindex, search:flush).
- **Container bindings** — 4 primary bindings (HealthAggregator, ModuleRegistry,
  ModuleRouteLoader, SearchEngineResolver). `ImportContractRegistry` /
  `ExportContractRegistry` moved to `modules/transfer/` as `EntityRegistry` /
  `WorkbookRegistry` on Wave 2 inception.
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
├── traits.json             THE headline artefact: 10 owned traits + all consumed framework traits
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
