# growth/analytics — Phase 3 implementation status

## Status: SCAFFOLDED — models + interfaces landed; every Action returns `null`

## What landed

- Event-timeline models: `AnalyticsEvent` (raw event feed),
  `AnalyticsRollup` (daily/weekly/monthly pre-computed aggregates).
- Attribute-first migrations (with `tenant_id` + composite
  indexes for the time-bucketed query path).
- Blueprint-emitted repositories via `#[AsRepository]`.
- Enum types (`AnalyticsEventType`, `AnalyticsRollupPeriod`).
- Blueprint-emitted Action stubs (every one returns `null`).

## What's pending

### Actions to complete

- **`IngestEventAction`** — POST `/analytics/events`. Public /
  server-to-server ingest endpoint. Rate-limited. Buffers to a
  Redis stream, flushed to Postgres by
  `FlushAnalyticsBufferJob`.
- **`ListEventAction`** — GET `/analytics/events`. Cursor-paginated,
  tenant-scoped; filters on `event_type`, `subject_type`,
  `subject_id`, `since`, `until`.
- **`ListRollupAction`** — GET `/analytics/rollups`. Pre-computed
  aggregates by period.
- **`RefreshRollupAction`** — POST `/analytics/rollups/refresh`.
  Recompute a rollup window on demand.
- **`ExportEventAction`** — GET `/analytics/events/export`. CSV
  export (routes through `shared/transfer::StartExportAction`).
- **`FunnelReportAction`** — GET `/analytics/reports/funnel`.
  Per-event-sequence funnel analysis.
- **`RetentionReportAction`** — GET `/analytics/reports/retention`.
  Cohort-based retention chart.
- **`ChurnReportAction`** — GET `/analytics/reports/churn`.
  Tenant-level or per-cohort.

### Services to complete

- **`AnalyticsBuffer`** — Redis-backed write buffer with atomic
  flush. Prevents the event ingest hot path from blocking on
  Postgres.
- **`AnalyticsRollupComputer`** — daily / weekly / monthly
  aggregation. Runs as `ComputeAnalyticsRollupJob` (cron:
  hourly).
- **`FunnelAnalyzer`** — computes conversion funnels from the
  raw event feed.
- **`RetentionAnalyzer`** — cohort-based retention curves.
- **`ChurnAnalyzer`** — churn probability per user given the
  last 30 days of events.

### Jobs

- **`FlushAnalyticsBufferJob`** — cron: every minute. Drains
  Redis → Postgres.
- **`ComputeAnalyticsRollupJob`** — cron: hourly. Runs the
  aggregation.
- **`PruneStaleEventsJob`** — cron: daily. Retention-tier
  compliant (small tier: 30 days; enterprise: 365 days).

### Cross-module dependencies

- **`compliance/retention`** — retention windows per tier drive
  `PruneStaleEventsJob`.
- **`growth/attribution`** — attribution snapshot enrichment on
  every event.
- **`notifications/notifications`** — notification opens / clicks
  feed the analytics event stream.
- **`shared/transfer`** — CSV export routes through it.

## Backlog priorities

1. **P0 — `IngestEventAction` + `AnalyticsBuffer`** — the base
   hot path. Blocks every dashboard.
2. **P0 — `FlushAnalyticsBufferJob`** — no data lands without
   it.
3. **P1 — `AnalyticsRollupComputer` + cron** — the dashboard
   query path.
4. **P1 — `PruneStaleEventsJob`** — compliance-critical.
5. **P2 — funnel + retention + churn analyzers** — the analyst
   surface.
