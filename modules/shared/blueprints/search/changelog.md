# search — changelog

## [Unreleased] — inception

- Search engine module authored. Wraps `laravel/scout`.
- Publishes 5 PHP attributes: `#[Searchable]`, `#[SearchField]`,
  `#[SearchFacet]`, `#[SearchSynonym]`, `#[SearchBoost]`.
- Publishes `HasSearchable` opt-in composition trait.
- Ships 4 engine adapters:
  - `MeilisearchEngine` (full) via `laravel/scout` native driver \u2014 default
    for user-facing indexes.
  - `PostgresFtsEngine` (full) via
    `devnoiseconsulting/laravel-scout-postgres-tsvector` \u2014 default for
    internal-only indexes (audit, activity, admin logs).
  - `PgvectorEngine` (declared, disabled) via `benbjurstrom/pgvector-scout`
    \u2014 semantic similarity, activated when first AI feature lands.
  - `ElasticsearchEngine` (v2 stub) \u2014 present so `EngineRegistry` documents
    the future path.
- Ships `search_indexes` + `search_sync_jobs` + `search_synonyms` +
  `search_saved_queries` + `search_analytics_events` entities.
- Zero-downtime reindex via alias swap (`SwapIndexAliasJob`).
- Unified query API
  `Search::query()->across(...)->boost(...)->filter(...)->get()` with
  engine-native escape hatch `Search::engine('meilisearch')->raw($body)`.
- Per-tenant + per-language synonym registry with live cache warm-up.
- Saved queries + smart-list presets \u2014 drives \u2318K "Recent searches"
  surface.
- Autocomplete at `GET /api/v1/search/suggest`.
- Full search analytics (query volume, no-results, click-through) with
  tier-based retention.
- Tenant HTTP surface at `/api/v1/search/*` (query, suggest, indexes, sync-jobs,
  synonyms, saved-queries, analytics).
- Platform-admin HTTP surface at `/api/v1/platform/search/*` for cross-tenant
  reindex + engine health.
- Every long-running sync job produces a persisted `search_sync_jobs` domain
  record with notifications on finish through the `notifications` module. Same
  lifecycle shape as `xfer_jobs`.
- Every reindex / flush / synonym mutation writes an activity row (`activity`
  module) and an audit row (`audit` module).

### Compatibility

- Depends on `foundation`, `tenants`, `audit`, `activity`, `notifications`,
  `settings`.
- **Breaking rename against foundation.** Foundation's earlier `Searchable`
  trait + `searchable` blueprint macro + `SearchEngineResolver` binding +
  `IndexSearchableJob` + `search:reindex` / `search:flush` commands +
  `foundation.search` config section + `foundation:search:engine_health` cache
  key + `FOUNDATION_SEARCH_ENGINE_UNAVAILABLE` error code +
  `search-engine-reachable` health probe + `foundation:search-index-refresh`
  schedule entry + `foundation.search-indexing` feature flag +
  `platform.search.manage` permission + `POST /api/v1/platform/search/*` routes
  moved to this module. See `readme.md` \u00a7 10 for the full rename map. No
  production data touches the rename \u2014 both modules are at pre-release.
- Consumer modules must add `search` to their `dependencies` before opting a
  model into the search pipeline.
