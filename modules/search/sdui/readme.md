# search — SDUI blueprints

## Surfaces

### `resources/search/`

Workspace-facing global search results screen. The `list.screen.json` powers the
`/workspace/search` route and consumes the same `GET /api/v1/search` endpoint the
⌘K palette uses.

### `resources/search-index/`

Read-only registry catalogue for workspace admins with `search.indexes.viewAny`.
Shows every registered `(model_class, engine, index_name)` triple with status
chip + document count + last swap time + `needs-reindex` warning when
`config_hash` drift is detected.

### `resources/search-sync-job/`

Reindex + backfill job history + control. Users see their own jobs; workspace
admins with `platform.search.sync-jobs.viewAny` see workspace-wide (via the
platform-admin surface at the API level; the SDUI screen scopes to own jobs).

### `resources/search-synonym/`

Per-workspace + per-language synonym CRUD. System-seeded (`is_system=true`) rows
render read-only with a "disable" toggle in place of edit / delete.

### `resources/search-analytics/`

Admin analytics dashboard \u2014 top queries, no-results, click-through rate, query
volume over time. Consumed by workspace admins with `search.analytics.view`.

### `widgets/`

- `command-palette.widget.json` \u2014 the ⌘K global command palette. Consumed
  every authenticated screen via a portal in the app shell.
- `search-result-row.widget.json` \u2014 reusable result row: icon + title +
  snippet + breadcrumbs. Consumed by the results screen and the ⌘K palette.
- `search-index-status-chip.widget.json` \u2014 colored status pill.
- `search-sync-job-progress.widget.json` \u2014 progress bar with live counter
  breakdown via broadcast subscription.
