# monitoring — changelog

## [Unreleased] — inception (Wave 5)

- Monitoring module authored. Six owned entities:
  - `HealthCheck` — per-tenant health check config (10 check types day-1).
    Retained while active + 90-day grace.
  - `HealthCheckRun` — per-execution result. Append-only. 7-day hot / 30-day
    cold retention (Enterprise: 30-day hot / 90-day cold).
  - `MonitoringAlertPolicy` — per-tenant threshold config (7 signal types
    day-1). Retained while active + 90-day grace.
  - `MonitoringAlert` — fired alert records. 30-day hot / 90-day cold retention
    (Enterprise: 90-day hot / 1-year cold).
  - `MonitoringIncident` — grouped alert timelines. 90-day hot / 1-year cold
    (Enterprise: indefinite).
  - `MonitoringProviderConfig` — per-tenant encrypted provider connections.
    90-day grace after soft-delete.
- Nine entitlement gates:
  - `monitoring_capture` (all tiers) — master feature gate.
  - `monitoring_health_check_slot` (Small=5, Medium=25, Enterprise=∞).
  - `monitoring_provider_slot` (Small=1, Medium=3, Enterprise=∞).
  - `monitoring_alert_policy_slot` (Small=10, Medium=50, Enterprise=∞).
  - `monitoring_paging` (Medium+) — enables PagerDuty + Opsgenie.
  - `monitoring_apm` (Medium+) — enables Datadog.
  - `monitoring_extended_retention` (Enterprise) — extends hot/cold windows.
  - `monitoring_custom_metrics` (Enterprise) — custom_script + custom_metric
    signals.
  - `monitoring_prometheus` (Enterprise) — Prometheus pushgateway + AlertManager
    webhook.
- MultipleInstanceManager pattern via `MonitoringProviderManager` with 6 driver
  families day-1: sentry, datadog, pagerduty, opsgenie, prometheus,
  custom_webhook.
- Ten health check types day-1: db_ping, redis_ping, queue_depth, memory_usage,
  cpu_usage, disk_usage, http_endpoint, dns_lookup, tls_expiry, custom_script.
- Seven signal types day-1: health_check_status, error_rate, latency_p95,
  latency_p99, queue_depth, worker_health, custom_metric.
- Four severity levels: p1 / p2 / p3 / p4 — with distinct provider routing +
  SLA definitions.
- Retry with exponential backoff (1m/5m/30m/2h/12h/24h; max 6 attempts) +
  per-tenant-per-provider circuit-breaker (opens after 5 consecutive failures;
  1h open duration; half-open probe).
- Alert grouping into incidents (within 5-min window, same severity, related
  signal source). Auto-resolves incident when last alert clears.
- Suppression policies: after_hours_suppress + weekend_suppress + silenced_until.
- 22 events published; 7 notification categories; 10 background jobs; 14
  Artisan commands.
- 4 broadcast channels: `tenant.{id}.monitoring`,
  `tenant.{id}.monitoring.alerts`, `tenant.{id}.monitoring.incidents`,
  `tenant.{id}.monitoring.providers`.
- SDUI: 17 screens (health-check list/create/edit/detail/runs, alert-policy
  list/create/edit, alert list/acknowledge, incident list/detail/resolve,
  provider list/create/edit/test, dashboard) + 4 widgets (severity-chip,
  status-badge, provider-status-chip, circuit-breaker-badge).

### Compatibility

- Depends on `foundation`, `tenancy`, `application`, `entitlements`,
  `compliance`.
- Extended by NONE. Wave 5 audit + activity are peers (they emit signals that
  the analytics + monitoring lanes may sample; they don't extend monitoring).
- Wave 5 inception release.

### Design notes

- Monitoring does NOT carry `application_id` / `region_id` / `organization_id`
  / `scope_node_id`. Every row is tenant-scoped per tenancy-columns.md §3, with
  the forbidden columns of §5 explicitly absent. Per §2 of that steering, the
  only 8 rows that carry `application_id` directly are `tenants`, `users`,
  `roles`, `permissions`, `tenant_subscriptions`, `entitlement_licenses`,
  `audits`, and `activity_log`. **None of the six monitoring rows are among
  them.** This module is NOT audit — the sibling audit + activity modules own
  those two rows.
- Every write to health_checks / health_check_runs / monitoring_alert_policies
  / monitoring_alerts / monitoring_incidents / monitoring_provider_configs
  emits an audit row (Auditable trait) with 7-year retention.
- The two-phase circuit-breaker pattern is by-design — an open circuit-breaker
  on a paging provider (PagerDuty) is itself a P1 alert. The system pages
  ops via the fallback provider (Opsgenie).
- The alert → incident grouping is by-design — 20 correlated alerts collapse
  into 1 incident so the on-call gets one page, not 20.
- The MultipleInstanceManager pattern enables provider fan-out without a
  bespoke registry — each config is a first-class instance name.
- The circuit-breaker is PER (tenant, provider). A PagerDuty outage for tenant
  A does NOT affect tenant B or Sentry dispatch for tenant A.
- HealthCheckRun rows are append-only + short-retention (7d hot / 30d cold) —
  the value drops fast; the trend + policy evaluation are what matter beyond
  the debug window.
- Health check intervals are rate-limited to >=15 seconds. Sub-15-second
  intervals would DDoS the tenant's own infrastructure.
- Every health check response body is scanned + truncated to 8KB. PII regex
  redaction runs before persist.
- Provider config `config` jsonb is AES-256 encrypted at rest (contains DSNs,
  API keys, HMAC secrets). The compliance/encryption service manages keys +
  rotation.

### Compliance

- **ISO 27001 A.12.4** — event logging + monitoring documented; alert
  fire/ack/resolve trail is retained 30d/90d hot/cold.
- **SOC 2 CC7.2** — anomaly detection + incident response formalised.
  MonitoringIncidentOpened + MonitoringProviderCircuitBreakerOpened + P1
  MonitoringAlertFired are the P1 signals that page on-call.
- **NIST 800-53 IR-4** — incident handling. MonitoringIncident lifecycle
  matches the NIST incident response phases (open → acknowledged → investigating
  → mitigating → resolved → postmortem).
- **PCI-DSS 10.7** — audit trail retention. Alerts + incidents retain 30d/90d
  hot/cold; Enterprise extends to 1-year.
- **GDPR Art. 32** — technical measures to ensure security. This module IS the
  security-monitoring evidence.
- **PII policy** — health check response bodies scanned + truncated to 8KB;
  PII regex triggers redaction. Provider config credentials encrypted at rest.

### Non-goals

- No log aggregation (Sentry + Datadog integrations forward; we don't store
  logs).
- No metric time-series storage (Prometheus + Datadog own that; we store
  fired alerts only).
- No full APM (Datadog integration only — we forward events, not distributed
  traces).
- No cross-tenant monitoring.
- No `application_id` on any monitoring row (monitoring is NOT audit + NOT
  activity; the sibling modules own those two application-scoped rows).
- No `region_id` / `organization_id` / `scope_node_id` on any monitoring row.
- No frontend browser errors — that's `@stackra/monitoring`; this module
  receives them via SentryProvider forward.
- No custom alert-rule expressions (no PromQL / eval-language) — declarative
  thresholds only.
