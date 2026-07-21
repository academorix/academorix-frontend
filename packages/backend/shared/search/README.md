# stackra/search

Enterprise search engine for the Stackra platform. A thin, opinionated
wrapper around `laravel/scout` with attribute-driven registration, pluggable
engine adapters (Meilisearch, Postgres FTS, pgvector, Elasticsearch stub), a
unified query API, zero-downtime reindex via alias swap, per-tenant + per-
language synonym registry, saved queries + smart lists, user-facing
autocomplete, and full analytics (query volume, no-results, click-through).

## What ships

Five aggregates:

- **SearchIndex** — the registry entry for one `#[Searchable]` model class.
- **SearchSyncJob** — the operational record for one reindex / backfill / flush
  / alias-swap / single-document operation.
- **SearchSynonym** — tenant-scoped synonym rows (equivalent / one-way /
  expansion), platform-seeded rows carry `is_system = true`.
- **SearchSavedQuery** — per-user saved queries + smart lists, shareable across
  the tenant.
- **SearchAnalyticsEvent** — append-only query / no-results / click-through
  telemetry.

Five attributes:

- `#[Searchable]` — opts a model into search.
- `#[SearchField]` — per-column indexing spec.
- `#[SearchFacet]` — per-column facet spec.
- `#[SearchSynonym]` — per-index synonym seed.
- `#[SearchBoost]` — per-column boost spec.

Nine service bindings (contract-first, `#[Bind]` on the interface):

- `EngineRegistryInterface` — attribute-hydrated adapter catalogue.
- `SearchServiceInterface` — unified `Search::query()` entry point.
- `IndexOrchestratorInterface` — reindex + flush + alias-swap orchestration.
- `SynonymRegistryInterface` — per-tenant synonym resolver.
- `SavedQueryRepositoryInterface` — CRUD + execute for saved queries.
- `AnalyticsRecorderInterface` — async analytics recorder.
- `QueryParserInterface` — query grammar parser.
- `ResultRankerInterface` — result ranking hook.
- `SuggestServiceInterface` — autocomplete surface.

## Documentation

The authoritative blueprint lives at `modules/shared/blueprints/search/` — every
JSON file there is the source of truth for the code in this package. Read the
blueprint before making any schema or contract change.

## Configuration

Publish the config file:

```bash
php artisan vendor:publish --tag=search-config
```

Every knob is described in `config/search.php`. Read the file top to bottom
before overriding anything in production.

## Enterprise permissions

Every `SearchPermission` case is seeded automatically by
`SearchPermissionSeeder` (priority `45`). Cases split across two guards:

- `sanctum` — the tenant surface (`search.*`).
- `platform_admin` — the cross-tenant admin surface (`platform.search.*`).

## Attribution

Wraps [laravel/scout](https://laravel.com/docs/scout) `^10.0`. Engine adapters
delegate to Scout's built-in Meilisearch driver plus third-party drivers for
Postgres FTS and pgvector.
