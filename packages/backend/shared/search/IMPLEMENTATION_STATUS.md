# shared/search — Phase 3 implementation status

## Status: SCAFFOLDED — Laravel Scout wrapper models + config landed; index builders + Actions pending

## What landed

- **`SearchableModel`** attribute marker.
- **`SearchIndex`** — per-tenant + per-model index configuration
  (weights, boosts, tokenisers).
- Enum types (`SearchEngine`, `SearchIndexStatus`).
- Config file with driver defaults (Meilisearch first-class,
  Algolia + Elasticsearch supported).
- Attribute-first migrations.
- Factories.
- Blueprint-emitted Action stubs (every one returns `null`).

## What's pending

### Actions to complete

- **`SearchAction`** — GET `/search?q=<terms>&types=<t1,t2>`. The
  unified cross-model search endpoint. Fans out across every
  registered `SearchableModel` type the caller has permission to
  see; returns a normalised result set.
- **`SuggestAction`** — GET `/search/suggest?q=<p>`. Typeahead
  auto-completion. Bounded to 10 results per type.
- **`RebuildIndexAction`** — POST `/search/index/{model}/rebuild`.
  Admin-triggered full reindex.
- **`ReindexAction`** — POST `/search/reindex`. Bulk reindex of
  every searchable model for the caller's tenant.
- **`ListIndexAction`** — GET `/search/indexes`. Admin surface.
- **`UpdateIndexConfigAction`** — configure weights + boosts.

### Services to complete

- **`SearchableRegistry`** — attribute-driven registry of
  `#[SearchableModel]` markers. Consumed by the reindex path.
- **`SearchQueryBuilder`** — the fan-out that queries each
  registered model's index via Laravel Scout.
- **`SearchResultAggregator`** — merges per-model results into a
  single normalised feed (uniform ranking, per-type grouping).
- **`SearchPermissionFilter`** — filters results the caller
  doesn't have permission to see (post-scout filter — Scout
  itself doesn't know about our permissions).

### Drivers (Scout engines)

- **Meilisearch** — first-class. Config + driver stub.
- **Algolia** — hosted alternative.
- **Elasticsearch** — self-hosted for enterprise.
- **NullEngine** — for tests + envs without a search infra.

### Jobs

- **`RebuildIndexJob`** — queued reindex. Chunked by model.
- **`ScheduleIndexCleanupJob`** — cron: daily. Drops indices
  for deleted models.

### Cross-module dependencies

- **Every `#[SearchableModel]` opt-in** — athlete, team,
  session, invoice, ... Each one composes Scout's `Searchable`.
- **`identity/user`** — the `SearchPermissionFilter` reads
  user's capability set.
- **`compliance/retention`** — deleted rows must not surface in
  search results.

## Backlog priorities

1. **P0 — `SearchAction` + `SearchQueryBuilder`** — the unified
   search endpoint.
2. **P0 — `SearchableRegistry` + `#[SearchableModel]`** — model
   opt-in framework.
3. **P0 — Meilisearch driver** — first-class engine.
4. **P1 — `SearchPermissionFilter`** — security-critical.
5. **P1 — `RebuildIndexAction` + `RebuildIndexJob`** —
   maintenance surface.
6. **P2 — Algolia + Elasticsearch drivers** — nice-to-have.
