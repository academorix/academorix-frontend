# search

Enterprise search engine. Wave 6 infrastructure. Wraps `laravel/scout` with our
conventions: attribute-driven registration, pluggable engine adapters
(Meilisearch / Postgres FTS / pgvector / Elasticsearch), a unified cross-model
query API with an engine-native escape hatch, zero-downtime reindex via alias
swap, per-tenant + per-language synonyms, saved queries, autocomplete, and full
search analytics.

## 1. What this module owns

| Concern                                                                                                  | Owned artefact                                                                                                                                            |
| -------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `HasSearchable` trait (opt-in)                                                                           | Composition trait models pull in alongside their `#[Searchable]` attribute. Wraps Scout's own `Searchable` + adds our defaults.                           |
| `#[Searchable]` / `#[SearchField]` / `#[SearchFacet]` / `#[SearchSynonym]` / `#[SearchBoost]` attributes | Class-level policy + repeatable field / facet / synonym / boost declarations targeting Eloquent attributes by name.                                       |
| `SearchIndex` model + `search_indexes` table                                                             | The registry of `(model_class, engine, index_name)` \u2014 what is synced where, current alias, checksum, retention tier.                                 |
| `SearchSyncJob` model + `search_sync_jobs` table                                                         | Persisted operation record for reindex + backfill runs. Same `xfer_jobs` shape: queue-independent, retention-aware, counters, artifacts.                  |
| `SearchSynonym` model + `search_synonyms` table                                                          | Per-tenant + per-language synonym sets, mutable at runtime, live-reloaded into every engine.                                                              |
| `SearchSavedQuery` model + `search_saved_queries` table                                                  | User-saved queries + smart lists. Drives the \u2318K "recent searches" surface.                                                                           |
| `SearchAnalyticsEvent` model + `search_analytics_events` table                                           | Query-happened + no-results + click-through counter events. Retention-tiered per plan.                                                                    |
| Four engine adapters                                                                                     | `MeilisearchEngine` (default user-facing), `PostgresFtsEngine` (default internal), `PgvectorEngine` (semantic, v1 stub), `ElasticsearchEngine` (v2 stub). |
| Tenant HTTP surface                                                                                      | `GET /api/v1/search{,/suggest,/analytics,/indexes,/sync-jobs,/synonyms,/saved-queries}` and friends.                                                      |
| Platform-admin HTTP surface                                                                              | `/api/v1/platform/search/*` \u2014 cross-tenant reindex, flush, engine-health.                                                                            |
| Zero-downtime reindex                                                                                    | `SwapIndexAliasJob` swaps the live alias after the backfill lands. Existing queries keep working against the old index during rebuild.                    |
| Synonym cache warmer                                                                                     | `WarmSynonymCacheJob` \u2014 keeps every engine's synonym map fresh after mutations.                                                                      |
| Analytics recorder                                                                                       | Non-blocking async recording of query volume + no-results + click-through.                                                                                |

## 2. Search vs Activity vs Audit vs Transfer

Four adjacent modules with distinct concerns:

| Dimension    | `search`                                                                               | `activity`                       | `audit`                                 | `transfer`                             |
| ------------ | -------------------------------------------------------------------------------------- | -------------------------------- | --------------------------------------- | -------------------------------------- |
| Concern      | Discovery / recall of stored data                                                      | Product feed \u2014 who did what | Compliance evidence                     | Data movement \u2014 in / out          |
| Audience     | Every user querying data                                                               | Tenant admins + end users        | Compliance / DPO / regulators           | Users initiating imports/exports       |
| Persistence  | `search_indexes` + `_sync_jobs` + `_synonyms` + `_saved_queries` + `_analytics_events` | `activity_log`                   | `audits`                                | `xfer_jobs` + `_shards` + `_artifacts` |
| Wrapped pkg  | `laravel/scout`                                                                        | `spatie/laravel-activitylog`     | `owen-it/laravel-auditing`              | `maatwebsite/excel`                    |
| Retention    | Analytics tier-based; indexes forever                                                  | Tier-based 30/90/365d            | 365d hot + 7y cold                      | Files 7\u201330d; rows 90\u2013365d    |
| HTTP surface | Tenant + platform-admin                                                                | Tenant + platform-admin          | Platform-admin + tenant DPO             | Tenant + platform-admin                |
| Volume       | High \u2014 every query hits                                                           | High \u2014 every mutation       | Medium \u2014 compliance mutations only | Low frequency, high row count          |

They coexist cleanly. A `SearchSyncJob` transition writes an `activity_log` row
**and** an `audits` row. A search **query** writes to `search_analytics_events`
only (query volume is not audit material).

## 3. Opting a model in

The whole developer surface is PHP attributes. First argument to every
`#[Search*]` attribute is always the Eloquent attribute name.

```php
use Stackra\Search\Attributes\Searchable;
use Stackra\Search\Attributes\SearchField;
use Stackra\Search\Attributes\SearchFacet;
use Stackra\Search\Attributes\SearchSynonym;
use Stackra\Search\Attributes\SearchBoost;
use Stackra\Search\Concerns\HasSearchable;
use Stackra\Search\Enums\SearchEngine;

#[Searchable(
    engine:             SearchEngine::Meilisearch,
    indexName:          'athletes',
    audience:           'tenant',
    requiredPermission: 'athletes.viewAny',
    reindexTrigger:     'auto',
    softDeletes:        'exclude',
    language:           'auto',
)]
#[SearchField('name',       weight: 5.0, prefix: true,  typoTolerance: true)]
#[SearchField('email',      weight: 3.0, prefix: false, typoTolerance: false)]
#[SearchField('birth_date', weight: 1.0, format: 'date')]
#[SearchField('team.name',  weight: 2.0, from: 'relation', name: 'team_name')]

#[SearchFacet('branch_id',  kind: 'exact',  label: ['en' => 'Branch',  'ar' => '\u0627\u0644\u0641\u0631\u0639'])]
#[SearchFacet('season_id',  kind: 'exact',  label: ['en' => 'Season',  'ar' => '\u0627\u0644\u0645\u0648\u0633\u0645'])]
#[SearchFacet('birth_date', kind: 'range',  label: ['en' => 'Age',     'ar' => '\u0627\u0644\u0639\u0645\u0631'])]

#[SearchSynonym(['athlete', 'player', 'student'])]
#[SearchBoost('is_starred',       boost: 2.0, condition: 'when=true')]
#[SearchBoost('last_activity_at', boost: 1.5, condition: 'within=30d')]

final class Athlete extends Model
{
    use BelongsToTenant, HasUlids;
    use HasSearchable;
}
```

You now get, without any additional wiring:

- `GET /api/v1/search?q=jane&index=athletes` \u2014 typo-tolerant search with
  per-field boosts.
- `GET /api/v1/search/suggest?q=ja&index=athletes` \u2014 autocomplete on
  prefix-enabled fields.
- Automatic sync on `saved` / `deleted` via `HasSearchable` observer.
- `search:reindex Athlete` \u2014 zero-downtime rebuild through alias swap.
- Facets returned alongside results:
  `{ facets: { branch_id: [...counts], season_id: [...counts], age: [...ranges] } }`.
- Synonyms live-loaded from `search_synonyms` + the class-level
  `#[SearchSynonym]`.
- Boosts applied per configuration (starred athletes rank higher;
  recently-active rank higher still).

## 4. Engine adapters

Four engines. All share the same Scout driver contract; our `EngineRegistry`
matches each `#[Searchable(engine:)]` declaration to the concrete adapter.

| Engine          | Status             | Scout driver                                                                                                                | Best for                                                                 |
| --------------- | ------------------ | --------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `meilisearch`   | full               | built into `laravel/scout` \u2014 [docs](https://laravel.com/docs/scout#meilisearch)                                        | user-facing typeahead, admin search up to ~10M docs                      |
| `postgres-fts`  | full               | [devnoiseconsulting/laravel-scout-postgres-tsvector](https://github.com/devNoiseConsulting/laravel-scout-postgres-tsvector) | internal-only search (audit, activity, admin logs) \u2014 zero new infra |
| `pgvector`      | declared, disabled | [benbjurstrom/pgvector-scout](https://github.com/benbjurstrom/pgvector-scout)                                               | semantic similarity \u2014 activated when AI features land               |
| `elasticsearch` | v2 stub            | not-yet-selected                                                                                                            | 100M+ documents, complex aggregations, regulated markets                 |

Engine choice is **per-model** via `#[Searchable(engine:)]`. Different models
can live on different engines and the unified query API merges results. The
tenant admin can override the default engine via the `TenantSearchSettings`
without touching model code.

## 5. Unified query interface

The primary API is `Search::query()` \u2014 engine-agnostic, cross-model,
permission-scoped, tenant-scoped.

```php
use Stackra\Search\Facades\Search;

$results = Search::query('jane doe')
    ->across(Athlete::class, Coach::class, Team::class)
    ->boost(Athlete::class, 2.0)
    ->filter([
        'branch_id' => $branch->id,
        'season_id' => $season->id,
    ])
    ->facets(['branch_id', 'age'])
    ->highlight()
    ->take(20)
    ->get();

// Returns: SearchResultSet { hits, facets, took_ms, engine, alternates_did_you_mean }
```

Behind the scenes the service dispatches per-model queries to their configured
engines, merges by score, applies cross-model boosts, and attaches the tenant
scope + permission scope automatically.

### Engine-native escape hatch

When the abstraction gets in the way \u2014 typically for engine-specific
ranking rules or aggregations that don't map cleanly \u2014 use
`->engine()->raw()`:

```php
$results = Search::engine('meilisearch')
    ->index('athletes')
    ->raw([
        'q'      => 'jane',
        'filter' => "branch_id = '{$branch->id}'",
        'sort'   => ['last_activity_at:desc'],
        'attributesToHighlight' => ['name', 'email'],
        'matchingStrategy' => 'last',
    ]);
```

The tenant scope is **still enforced** on raw calls (the middleware injects the
tenant filter into `filter`). Documented as: "you own portability if you use
`->raw()`."

## 6. Zero-downtime reindex via alias swap

Every model's live index is addressed through an alias (`athletes_live` \u2192
`athletes_v42`). Reindex flow:

1. `search:reindex Athlete` (or platform HTTP endpoint) creates a
   `SearchSyncJob` with kind = `reindex`, dispatches `ReindexModelBatchJob`.
2. The job creates a fresh empty index (`athletes_v43`), backfills in chunks via
   Scout's `makeAllSearchable`, tracks progress via shards.
3. On successful completion, `SwapIndexAliasJob` atomically points
   `athletes_live` at `athletes_v43`.
4. Old index (`athletes_v42`) is retained for a config-defined grace window then
   dropped by `PurgeIndexModelJob`.

Queries against `athletes_live` never see downtime. Failed rebuilds leave the
old index untouched.

## 7. Synonyms, saved queries, suggest

**Synonyms.** Per-tenant + per-language rows in `search_synonyms`.
`SearchSynonym::create(tenant, language, terms)` triggers `WarmSynonymCacheJob`
which pushes to every engine's synonym map. Class-level `#[SearchSynonym]`
declarations seed platform defaults.

**Saved queries.** `SearchSavedQuery` records per-user queries plus
smart-list-style filter presets (e.g. "Athletes in Branch A, active in last 30
days"). Drives the \u2318K palette's "Recent searches" surface and enables
tenant admin dashboards.

**Suggest.** `GET /api/v1/search/suggest?q=ja&index=athletes` returns
prefix-matched terms from `#[SearchField(prefix: true)]` fields. Cached per
(tenant, index, query-prefix) for `config('search.suggest.ttl_seconds')`.

## 8. Analytics

Every query fires an async `RecordSearchAnalyticsEventJob` inserting a
`search_analytics_event` row with:

- query terms (redacted per `data-classes.json` rules on `confidential` fields),
- user id (or null for anonymous),
- tenant id,
- result count,
- click-through target (populated on `POST /api/v1/search/click`),
- took_ms,
- engine.

`GET /api/v1/search/analytics/top-queries` + `/no-results` drive the admin
dashboard. Analytics rows are retention-tiered per plan (short / medium / long)
same as `xfer_jobs` and `activity_log`.

## 9. What this module does NOT do

- **Not the ranking specialist.** Domain modules declare boosts + weights via
  `#[SearchField]` + `#[SearchBoost]`. This module executes them; it doesn't
  invent ranking rules per entity.
- **Not the ML layer.** Semantic similarity via `pgvector` is a stub until an
  AI-feature-owning module lands. This module ships the adapter
  - query surface + storage, not the embedding generation.
- **Not the notification transport.** Sync-job completion notifications compose
  through the `notifications` module.
- **Not the audit trail.** Long-running sync jobs write to `audit`; everyday
  queries do not (query volume lives in analytics, not audit).

## 10. Migration from foundation

Foundation previously listed a `Searchable` trait + `searchable` blueprint
macro + `SearchEngineResolver` binding + `IndexSearchableJob` + `search:reindex`
/ `search:flush` commands + a `search-engine-reachable` health probe + a
`foundation.search-indexing` kill switch + `POST /api/v1/platform/search/*`
routes + `platform.search.manage` permission + `foundation.search` config
section + `foundation:search:engine_health` cache key +
`FOUNDATION_SEARCH_ENGINE_UNAVAILABLE` error code. **All of it moved here on
this module's inception.**

Rationale: foundation is pure infrastructure with **zero domain entities**.
Search is a data-domain in its own right \u2014 owns entities (`search_indexes`,
`search_sync_jobs`, `search_synonyms`, `search_saved_queries`,
`search_analytics_events`), engine adapters, HTTP surface, notifications,
retention policies, and third-party wrap semantics (`laravel/scout`). Same
rationale as splitting `transfer` / `activity` / `audit` off from foundation
instead of embedding them there.

Rename map:

| Was                                                  | Now                                                                      |
| ---------------------------------------------------- | ------------------------------------------------------------------------ |
| `Stackra\Foundation\Concerns\Searchable`          | `Stackra\Search\Concerns\HasSearchable`                               |
| `Stackra\Foundation\Search\SearchEngineResolver`  | `Stackra\Search\Registry\EngineRegistry`                              |
| `Stackra\Foundation\Jobs\IndexSearchableJob`      | `Stackra\Search\Jobs\IndexModelJob`                                   |
| `Stackra\Foundation\Console\SearchReindexCommand` | `Stackra\Search\Console\ReindexCommand` (`search:reindex`)            |
| `Stackra\Foundation\Console\SearchFlushCommand`   | `Stackra\Search\Console\FlushCommand` (`search:flush`)                |
| `->searchable()` blueprint macro                     | Retired. Search discovers via PHP attributes, not schema markers.        |
| `config('foundation.search.*')`                      | `config('search.*')`                                                     |
| `foundation:search:engine_health` cache key          | `search:engines:{key}:health`                                            |
| `FOUNDATION_SEARCH_ENGINE_UNAVAILABLE`               | `SEARCH_ENGINE_UNAVAILABLE`                                              |
| `platform.search.manage` permission                  | Split: `platform.search.indexes.manage` + `platform.search.engines.view` |
| `POST /api/v1/platform/search/reindex` / `flush`     | `POST /api/v1/platform/search/indexes/{index}/reindex` / `flush`         |
| `foundation.search-indexing` feature flag            | `search.indexing`                                                        |
| `foundation:search-index-refresh` schedule entry     | Retired. Live sync on model save + reindex is on-demand only.            |

No production data touches the rename \u2014 both foundation and search are
pre-release. Consumer modules that opt models into search must add `search` to
their `dependencies` and switch the trait import.
