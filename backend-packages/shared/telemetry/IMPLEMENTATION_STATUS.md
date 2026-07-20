# shared/telemetry — Phase 3 implementation status

## Status: SCAFFOLDED — metric + trace + log primitives landed; Actions + shippers pending

## What landed

- **`Metric`** — cheap append-only metric row (name +
  labels-json + value + timestamp).
- **`TraceSpan`** — per-request span records (opt-in;
  correlated by `trace_id`).
- **`LogEntry`** — structured log rows (level + message + context
  + timestamp).
- Enum types (`MetricType`, `LogLevel`).
- Attribute-first migrations, factories, permission seeder.
- Blueprint-emitted Action stubs (every one returns `null`).

## What's pending

### Actions to complete

- **`IngestMetricAction`** — POST `/telemetry/metrics`. Public
  ingest endpoint (with auth). Rate-limited; buffered.
- **`IngestTraceAction`** — POST `/telemetry/traces`. OTLP-
  compatible span ingest.
- **`IngestLogAction`** — POST `/telemetry/logs`. Structured log
  ingest.
- **`QueryMetricAction`** — GET `/telemetry/metrics/query`.
  Range query (like PromQL, simplified).
- **`ShowTraceAction`** — GET `/telemetry/traces/{trace_id}`.
  Full span tree.
- **`ListLogAction`** — GET `/telemetry/logs`. Filter by level +
  time + subject.

### Services

- **`MetricBuffer`** — Redis-backed write buffer.
- **`TraceCorrelator`** — links spans by `trace_id`.
- **`OtelExporter`** — exports to an OpenTelemetry collector for
  downstream shipping (Prometheus / Grafana / Datadog / Sentry).
- **`SentryShipper`** — routes error-level logs to Sentry.
- **`PrometheusShipper`** — pushes metrics to a Prometheus
  gateway.

### Jobs

- **`FlushTelemetryBufferJob`** — cron: 30s. Drains Redis → 
  Postgres OR OTel collector.
- **`PruneStaleTelemetryJob`** — cron: daily. Retention windows
  per tier.

### Cross-module dependencies

- **`observability/monitoring`** — the observability tier's
  metric aggregator consumes from this module.
- **`telemetry/sentry`** (framework tier) — Sentry SDK
  integration.
- **`telemetry/nightwatch`** — Nightwatch observability
  integration.

## Backlog priorities

Telemetry is framework-tier + observability substrate. Most
downstream apps consume via the standard Laravel logging /
metrics facades — this module's Actions are for a self-hosted
telemetry surface, which is a P2 concern for launch.

1. **P2 — `IngestMetricAction` + `MetricBuffer`** — self-hosted
   ingest.
2. **P2 — `OtelExporter`** — the standard OTel-collector shipping
   route.
3. **P3 — everything else** — deferred until a customer
   explicitly needs an in-tenant telemetry surface (vs the
   default Sentry / Prometheus / Datadog wiring).

**Note:** the primary telemetry path for production is
`telemetry/sentry` + `telemetry/nightwatch` — those two packages
handle 90% of telemetry needs via their vendor SDKs. This module
is for the case where a customer wants their own metric surface.
