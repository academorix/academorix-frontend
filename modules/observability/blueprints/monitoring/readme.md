# monitoring

The monitoring lane. Wave 5 observability infrastructure. Per
`.kiro/steering/growth-and-observability.md` §1, monitoring is **Lane 1** —
answers "is my system healthy right now?" for the ops + on-call audience.
High-volume, sampling-acceptable, 30-day hot / 90-day cold retention.

Distinct from the frontend `@stackra/monitoring` package (browser-side error
reporting). This module owns SERVER-side monitoring: health checks against
tenant infrastructure + threshold-triggered alerts + per-tenant provider
fan-out for paging + observability platforms.

## 1. What this module owns

| Concern                                    | Owned artefact                                                                                    |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------- |
| Per-tenant health check configuration      | `HealthCheck` — one row per configured probe (DB / Redis / queue depth / HTTP endpoint / …).      |
| Per-execution health check result          | `HealthCheckRun` — one row per (health_check × execution). 7-day hot / 30-day cold retention.     |
| Per-tenant alert policy                    | `MonitoringAlertPolicy` — threshold + window + severity + provider routing.                       |
| Fired alert record                         | `MonitoringAlert` — one row per (policy × threshold breach). 30-day hot / 90-day cold retention.  |
| Grouped alert timeline                     | `MonitoringIncident` — multiple related alerts collapsed into one incident. 90-day / 1-year.      |
| Per-tenant provider connections            | `MonitoringProviderConfig` — encrypted credentials + severity filter + circuit-breaker state.     |
| Health-check execution strategies          | `HealthCheckExecutor` — dispatch by check_type (db_ping / redis_ping / http_endpoint / …).        |
| Alert threshold evaluation                 | `AlertPolicyEvaluator` — reads the trailing window of runs + evaluates thresholds.                |
| Alert → incident grouping                  | `IncidentGrouper` — within 5-min window, same severity, related signals → one incident.           |
| Provider fan-out orchestrator              | `MonitoringPagingCoordinator` — severity → provider routing (P1 → PagerDuty + Opsgenie + Slack).  |
| Provider driver family                     | `MonitoringProviderManager` (MultipleInstanceManager) — 6 drivers day-1.                          |
| Per-provider payload transformation        | `MonitoringPayloadTransformer` — one implementation per provider.                                 |
| Circuit-breaker                            | Per (tenant, provider). Opens after N consecutive delivery failures; TTL-based auto-close.        |
| Retry with backoff for notification retries | Exponential schedule: 1m / 5m / 30m / 2h / 12h / 24h. Max 6 attempts.                             |

### 1.1 The six owned tables

- `health_checks` — per-tenant health check config. Belongs to `Tenant`.
  Soft-deletable. Retained while active + 90-day grace.
- `health_check_runs` — per-execution result. Belongs to `Tenant` + `HealthCheck`
  (RESTRICT). Append-only. 7-day hot / 30-day cold retention (Enterprise
  extends to 30-day hot / 90-day cold).
- `monitoring_alert_policies` — per-tenant threshold configuration. Belongs to
  `Tenant`. Soft-deletable. Retained while active + 90-day grace.
- `monitoring_alerts` — fired alert records. Belongs to `Tenant` +
  `MonitoringAlertPolicy` (RESTRICT). 30-day hot / 90-day cold retention
  (Enterprise: 90-day hot / 1-year cold).
- `monitoring_incidents` — grouped alert timelines. Belongs to `Tenant`.
  Soft-deletable. 90-day hot / 1-year cold retention (Enterprise: indefinite).
- `monitoring_provider_configs` — per-tenant provider connections. Belongs to
  `Tenant`. Soft-deletable. Retained while active + 90-day grace.

None of these carry `application_id`, `region_id`, `organization_id`, or
`scope_node_id` — every row is tenant-scoped per `tenancy-columns.md` §3 with
the forbidden columns of §5 explicitly absent. Enforced by the
tenancy-compliance-auditor. Per §2, only 8 rows carry `application_id`
directly; **none of the six monitoring rows are among them**. Monitoring is
NOT audit — the two rows in §2 that DO carry `application_id`
(`audits`, `activity_log`) belong to the audit + activity lanes, not the
monitoring lane. This module is deliberately distinct.

## 2. Where this module sits in the observability lanes

Per `growth-and-observability.md` §1, monitoring is **Lane 1**. Sampled OK,
30-day hot retention, ops audience.

Distinct from:

- **Audit** (Lane 2) — compliance-grade authorization + mutation record;
  regulator-facing; 7-year retention; carries `application_id` per §2 of
  tenancy-columns.md.
- **Activity** (Lane 3) — human-readable "recent activity" feed line for
  tenant users; 90d–1yr retention; carries `application_id`.
- **Analytics** (Lane 4) — product-usage events for behavior analysis; 2-year
  retention; consent-gated.
- **Marketing** (Lane 5) — ad-network conversion forwarding; 7-year retention;
  zero loss tolerance.

Monitoring answers "is the system alive?"; audit answers "who did what?";
activity answers "what happened in my tenant?"; analytics answers "how are
users behaving?"; marketing answers "which ad campaigns converted?".

## 3. The MultipleInstanceManager pattern

Per `.kiro/steering/package-conventions.md`, monitoring uses Laravel's canonical
`Illuminate\Support\MultipleInstanceManager`:

```
MonitoringProviderManager (extends MultipleInstanceManager)
    → instance('sentry_backend_abc') → SentryProvider driver
    → createSentryDriver(config: MonitoringProviderConfig)
    → createDatadogDriver(config: MonitoringProviderConfig)
    → createPagerDutyDriver(config: MonitoringProviderConfig)
    → createOpsgenieDriver(config: MonitoringProviderConfig)
    → createPrometheusDriver(config: MonitoringProviderConfig)
    → createCustomWebhookDriver(config: MonitoringProviderConfig)
    → extend(name, factory) → runtime driver registration
```

The instance name is deterministic per config row —
`<provider>_<tenant_short_id>_<config_ulid>`. Consumers call
`$manager->instance($name)` (or `$manager->forConfig($config)`) to get a
provider driver bound to the tenant's encrypted credentials.

Fan-out is severity-based via `MonitoringPagingCoordinator`. P1 alerts route
to paging providers (PagerDuty + Opsgenie); P2 alerts route to observability
platforms (Sentry + Datadog); P3 + P4 alerts route to the dashboard channel
only. A throwing provider is isolated per notification — one PagerDuty outage
does not block Sentry.

## 4. The health-check / alert-policy / alert / incident pipeline

The full pipeline:

```
1. HealthCheck (config, per interval)
   ↓
2. RunHealthCheckJob (per interval_seconds)
   ↓
3. HealthCheckRun (result — healthy / degraded / unhealthy / timeout / error)
   ↓
4. EvaluateAlertPoliciesJob (every 30s, scans policies × recent runs)
   ↓
5. Threshold breached? → FireAlertJob → MonitoringAlert (status='firing')
   ↓
6. GroupAlertsIntoIncidentJob (within 5-min window, same severity)
   → MonitoringIncident (status='open')
   ↓
7. NotifyProvidersJob → per-provider dispatch (Sentry / Datadog / PagerDuty / …)
   ↓
8. Human acknowledges → MonitoringAlert.status='acknowledged' →
   MonitoringIncident.status='acknowledged'
   ↓
9. Signal clears → alert auto-resolves → last resolved alert in incident →
   MonitoringIncident.status='resolved'
   ↓
10. If severity=p1 + resolved: MonitoringPostmortemRequiredNotification
```

Distinct from the marketing pattern (event ledger + delivery ledger). Monitoring
has a longer chain because alerts group into incidents — a single provider
outage can spawn 20 correlated alerts that collapse into 1 incident for the
on-call to acknowledge.

## 5. Provider drivers (6 day-1)

Each provider ships:

1. A driver class implementing the `IMonitoringProvider` contract
   (`name()`, `supports(MonitoringSeverity)`, `notify(...)`, `transform(...)`).
2. A JSON Schema in `data/providers/<provider>-config.schema.json` for
   `MonitoringProviderConfig.config` validation.
3. A payload transformer that maps the canonical alert / incident shape to
   the provider's native contract.

### 5.1 The 6 providers

| Provider       | Endpoint                                              | Auth                    | Purpose                             |
| -------------- | ----------------------------------------------------- | ----------------------- | ----------------------------------- |
| Sentry         | `{sentry_dsn}` (per-project envelope endpoint)        | DSN embedded            | Error tracking + release health     |
| Datadog        | `https://api.datadoghq.com/api/v1/events`             | DD-API-KEY + DD-APP-KEY | APM + logs + metrics + events       |
| PagerDuty      | `https://events.pagerduty.com/v2/enqueue`             | routing_key in payload  | Paging + on-call rotation           |
| Opsgenie       | `https://api.opsgenie.com/v2/alerts`                  | GenieKey Authorization  | Paging + team routing               |
| Prometheus     | `{pushgateway_url}/metrics/job/monitoring`            | optional Bearer         | Metrics scrape + AlertManager       |
| Custom Webhook | Caller-configured                                     | HMAC-SHA256 signature   | Generic escape hatch                |

### 5.2 Severity-to-provider routing

Each provider config declares `enabled_severities` — a subset of P1/P2/P3/P4.
The `MonitoringPagingCoordinator` reads this and fans out per alert:

- **P1 (page)** — PagerDuty + Opsgenie + Sentry + Datadog. Dashboard fires
  regardless.
- **P2 (alert primary on-call)** — Sentry + Datadog + PagerDuty. Dashboard.
- **P3 (dashboard + Sentry)** — Sentry + dashboard.
- **P4 (dashboard-only)** — dashboard broadcast only.

Tenants can override the routing via `enabled_severities` on the provider
config — a Datadog-only tenant sets `enabled_severities: ["p2", "p3"]` on
their Datadog config so Datadog doesn't page for P1s (PagerDuty owns that).

## 6. Retry + backoff schedule (for provider notification failures)

Per `MonitoringProviderConfig.retry_config`:

```
attempt 1: dispatched immediately at alert fire
attempt 2: dispatched after 60s
attempt 3: dispatched after 300s (5 min)
attempt 4: dispatched after 1800s (30 min)
attempt 5: dispatched after 7200s (2h)
attempt 6: dispatched after 43200s (12h)
final: attempt 7 at 86400s (24h). Then dead-lettered.
```

Transient failures (5xx, timeout, network reset) increment attempt count +
schedule the next retry via `RetryFailedNotificationsJob` (every 5-min sweep).
Permanent failures (400 with `is_transient=false` from the provider mapper)
skip to circuit-breaker path immediately.

## 7. Circuit-breaker

Per (tenant, provider) — a PagerDuty outage for tenant A does not affect
tenant B or Sentry dispatch for tenant A.

```
CLOSED (normal)
   │ N consecutive failures → OPEN
   ▼
OPEN (blocks all dispatch)
   │ open_duration_seconds elapsed → HALF_OPEN
   ▼
HALF_OPEN (allows 1 probe notification)
   │ probe succeeds → CLOSED
   │ probe fails → OPEN
```

Defaults per `data/circuit-breaker-defaults.json` — 5 consecutive failures /
1h open duration. Ops can reset manually via `monitoring:reset-circuit-breaker`
command or POST `/api/v1/monitoring/providers/{provider}/reset-circuit-breaker`.

An open circuit-breaker fires `MonitoringProviderCircuitBreakerOpened` (P1) —
the ops team's monitoring tooling is telling them their monitoring tooling is
broken. That's the highest-priority alert in the system.

## 8. Alert lifecycle + incident grouping

Alerts have five states: `firing`, `acknowledged`, `resolved`, `suppressed`,
`expired`.

- **firing** — the threshold is currently breached.
- **acknowledged** — a human took ownership (`acknowledged_by_user_id` set).
- **resolved** — the signal cleared OR ops manually resolved.
- **suppressed** — the alert policy's `suppression_config` matched (after-hours,
  weekend, silenced_until timestamp).
- **expired** — the alert stayed firing longer than the policy's expiration
  window without human interaction.

Incidents group alerts. When an alert fires:

1. If another firing alert exists within 5 minutes with the same severity + a
   related `signal_source` → attach to that incident.
2. Otherwise → open a new incident.

When the last firing alert in an incident resolves → incident auto-resolves.
If severity=p1 + incident resolved → `MonitoringPostmortemRequiredNotification`
fires to schedule the postmortem doc.

## 9. Suppression policies

`MonitoringAlertPolicy.suppression_config` supports:

- `after_hours_suppress: bool` — outside 09:00-18:00 tenant-local → suppress.
- `weekend_suppress: bool` — Sat/Sun tenant-local → suppress.
- `silenced_until: ISO 8601` — manual silence with an expiration timestamp.

A suppressed alert still persists (`monitoring_alerts.status='suppressed'`)
for the audit trail — the record shows "we saw this signal but chose not to
page". The provider fan-out is skipped.

`monitoring:audit-suppressions` reports how many alerts were suppressed over
a date range for compliance evidence.

## 10. Compliance regimes covered

- **ISO 27001 A.12.4** — event logging + monitoring is a required control.
- **SOC 2 CC7.2** — anomaly detection + incident response documented.
- **NIST 800-53 IR-4** — incident handling.
- **PCI-DSS 10.7** — audit trail retention (monitoring rows retain 30/90/1yr
  matching the observability retention model).

PII handling:

- Health check response bodies are scanned + truncated to 8KB before persist.
- A PII regex scanner in `HealthCheckRunObserver` redacts detected email /
  phone / SSN patterns before storing `response_body` jsonb.
- Config columns (`monitoring_provider_configs.config`) are AES-256 encrypted
  at rest — contains DSNs, API keys, HMAC secrets.

## 11. What this module does NOT do

- **Log aggregation.** Sentry + Datadog forwarding is a notification path, not
  a storage path. We don't store logs; the provider does.
- **Metric time-series storage.** Prometheus + Datadog own that; we store
  fired alerts only.
- **Full APM.** Datadog integration only — we forward events, not distributed
  traces.
- **Cross-tenant monitoring.** Every row is tenant-scoped per §5 of
  tenancy-columns.md.
- **`application_id` on any row.** Monitoring rows are NOT among the 8
  application-scoped rows in tenancy-columns.md §2. Application flows through
  `tenant_id → tenants.application_id`.
- **`region_id` / `organization_id` / `scope_node_id`** on any row.
- **Frontend browser errors.** That's `@stackra/monitoring`; this module
  receives them via the SentryProvider forward (Sentry itself deduplicates).
- **Custom alert-rule expressions** (no PromQL, no eval-language) — declarative
  thresholds only. `signal_type` + `threshold_operator` + `threshold_value` +
  `threshold_unit` + `window_seconds`. If a tenant needs richer expressions,
  they configure a Prometheus provider config and use AlertManager's own
  expression language.
- **Health checks with intervals under 15 seconds.** Rate-limited to prevent
  DDoS-like probing.

## 12. Cross-references

- `hierarchy.md` §11 — the two-signal split (audit vs activity, distinct from
  monitoring).
- `tenancy-columns.md` §3 — every monitoring table carries `tenant_id`.
- `tenancy-columns.md` §5 — forbidden columns absent from every monitoring row.
- `.kiro/steering/growth-and-observability.md` — the monitoring lane's
  semantics, MultipleInstanceManager pattern, retention windows.
- `.kiro/steering/package-conventions.md` — MultipleInstanceManager shape.
- `modules/observability/blueprints/audit/` — sibling lane; different retention +
  audience.
- `modules/observability/blueprints/activity/` — sibling lane.
- `modules/growth/blueprints/marketing/` — canonical MultipleInstanceManager
  fan-out reference (marketing's 9-provider pattern is architectural sibling
  to monitoring's 6-provider pattern).
