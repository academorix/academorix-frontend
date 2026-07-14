# telemetry

Unified observability surface. Wave 6 infrastructure. Owns three OpenTelemetry
signals — traces, metrics, structured logs — under a single boundary. Wraps
`keepsuit/laravel-opentelemetry` (for spans + metrics) and Monolog (for logs).

## 1. Why one module for three signals

OpenTelemetry treats traces, metrics, and logs as three signals emitted by one
observability substrate. Splitting them into two Laravel modules had three
costs:

- **Duplicate providers.** Two service providers, two boots, two health probe
  registrations for what is one substrate.
- **Duplicate config surface.** `telemetry-otel.redact.*` and
  `telemetry-logs.redact.*` were the same rules restated with different keys.
- **Cross-module cross-signal correlation.** Trace-to-logs jump required the
  logs pipeline to peek into the OTel context set up by a different module —
  awkward when the two modules could just as well share a boot boundary.

Traces + metrics + logs stay conceptually separate inside this module via two
internal sub-namespaces (`Academorix\Telemetry\Otel\*` and
`Academorix\Telemetry\Logs\*`) and two internal providers composed by the outer
`TelemetryServiceProvider`. From the outside it's one dependency, one boot order
slot, one health probe surface.

## 2. What ships out of the box

The `TelemetryServiceProvider` boots two internal providers in order:

1. **`OtelServiceProvider`** (traces + metrics)
   - `TracerProvider` + `MeterProvider` wired via keepsuit
   - Resource attributes: `service.name`, `service.version`,
     `service.namespace`, `deployment.environment`, `academorix.workspace_id`
     (per request), `academorix.request_id`, `k8s.pod.name` (when in K8s)
   - Trace exporter: OTLP/HTTP to `$OTEL_EXPORTER_OTLP_ENDPOINT`
   - Metric exporter: OTLP/HTTP metrics with 10s aggregation window
   - Auto-instrumentation of HTTP server + HTTP client + Eloquent + queue
   - W3C Trace Context propagator (default) + B3 propagator (backward compat)
   - W3C Baggage propagator (for `workspace_id` / `causer_id` cross-service)
   - Sampling: `ParentBased(TraceIdRatioBased(0.10))` by default
2. **`LogsServiceProvider`** (structured logs)
   - Monolog processor pipeline (see
     `module.json.signals.logs.processor_pipeline`)
   - Sink resolver (stdout / file / Loki / DataDog / syslog via
     `config('telemetry.logs.sinks.*')`)
   - `OtelTraceContextProcessor` reads directly from the OTel context set up
     above — no cross-module boundary crossing

## 3. Attribute-driven manual instrumentation

Modules add custom instrumentation via attributes. Discovery is a build-time
pass; runtime is vanilla method calls.

```php
use Academorix\Telemetry\Otel\Attributes\{AsSpan, AsCounter, AsHistogram, AsContext};
use Academorix\Telemetry\Logs\Attributes\{AsLogChannel, AsLogContext};

#[AsLogChannel('webhook')]
final class WebhookDispatcher
{
    #[AsSpan(name: 'webhook.dispatch', kind: 'internal', attributes: ['webhook.subscription_id'])]
    #[AsCounter(name: 'academorix.webhook.dispatches', unit: 'dispatches', labels: ['outcome'])]
    #[AsHistogram(name: 'academorix.webhook.dispatch.duration_ms', unit: 'ms', buckets: [10, 50, 200, 1000, 5000])]
    public function dispatch(
        WebhookDelivery $delivery,
        #[AsContext(key: 'webhook.subscription_id')] string $subscriptionId,
    ): void {
        Log::info('Dispatch started');   // routes to 'webhook' channel with enrichers merged
        // Method body — no manual span calls needed.
    }

    #[AsLogContext(key: 'webhook.attempt_number')]
    public function attemptNumber(): int
    {
        return $this->delivery->attempts;
    }
}
```

The compiled registries — `SpanRegistry` + `MetricRegistry` +
`LogContextRegistry` — are cached with the `telemetry` tag on Redis and
invalidated by `foundation::ApplicationBooted`. Runtime lookups are hash-map
reads with zero reflection cost.

## 4. Trace-to-logs correlation

Every log record picks up `trace_id` + `span_id` from the OTel context, which
this module owns. In Grafana / DataDog / Honeycomb, clicking a slow span jumps
to its logs and vice-versa — no manual field wiring on the observability
backend.

Sample record:

```json
{
  "timestamp": "2026-07-14T18:52:03.421Z",
  "level": "info",
  "message": "Webhook delivered",
  "channel": "webhook",
  "context": {
    "delivery_id": "wdl_01HXYZ...",
    "status_code": 200,
    "duration_ms": 142
  },
  "extra": {
    "academorix.request_id": "req_01HXYZ...",
    "academorix.workspace_id": "wsp_01HXYZ...",
    "academorix.causer_id": "usr_01HXYZ...",
    "trace_id": "5b8aa5a2d2c872e8321cf37308d69df2",
    "span_id": "051581bf3cb55c13",
    "service.name": "academorix",
    "service.version": "v0.5.2-abc1234",
    "deployment.environment": "production",
    "source.module": "webhook",
    "source.class": "Academorix\\Webhook\\Services\\DispatchService",
    "source.line": 87
  }
}
```

## 5. Cross-boundary propagation

**HTTP server → downstream services:** W3C Trace Context propagated
automatically (via keepsuit's server + client middleware).

**Queue job → worker:** `TracePropagatingBusMiddleware` attaches the current
trace context to the job payload; on execution, a matching listener extracts

- resumes the trace so the consumer span links to the producer.
  `PropagateContextIntoJob` does the same for RequestContext so log records
  inside async jobs carry the originating workspace_id + causer_id.

**Baggage:** Keys like `workspace_id`, `causer_id` propagate via `#[AsBaggage]`
so downstream services / async jobs see them without manual passing.

## 6. Redaction

The pipeline strips PII + secrets before records leave the process. Rules:

- **Global key patterns** from `telemetry.redact.keys` (password, token, secret,
  cookie, authorization, api_key, credit_card, cvv, ssn, private_key)
- **Regex value patterns** from `telemetry.redact.patterns[]` (credit-card
  numbers, SSN, IBAN)
- **Class-level `#[RedactedForLogs]`** for domain models

Redaction is fail-safe: unknown keys pass through, but if a rule matches a
value, the field is replaced with `[REDACTED]`. **Never** turn off
`telemetry.logs_redaction_enforcement` in production — the health probe
`logs-redaction-enabled` will fail and page.

## 7. Kill switches

Every exporter + auto-instrumentation surface has a Pennant flag. Emergency
cutover to disable a noisy exporter without deploy. See `feature-flags.json`.

## 8. Fire-and-forget

This module NEVER blocks on export. OTLP exports run through a
`BatchSpanProcessor` with a background worker; on backpressure, spans are
dropped (bounded queue) and `academorix.otel.dropped_spans` increments. Log
sinks buffer with the same policy: bounded queue, oldest-dropped, drop counter
in metrics.

## 9. What this module does NOT do

- **Doesn't run collectors.** OTLP endpoint must be reachable via env config
  (self-hosted otel-collector, DataDog Agent, Grafana Alloy, etc).
- **Doesn't do APM UI.** Read the traces + logs in Grafana / DataDog / Honeycomb
  / Signoz.
- **Doesn't retain data.** Downstream backend owns retention.
- **Doesn't own audit log entries.** That's the `audit` module (compliance-
  grade, persisted, cryptographic hash chain).
- **Doesn't own activity feed items.** That's the `activity` module.
- **Doesn't handle log queries or dashboards.** Read logs in Grafana / DataDog /
  Kibana.

## 10. Migration from split telemetry-otel + telemetry-logs

This module supersedes `modules/telemetry-otel/` + `modules/telemetry-logs/`.
See `module.json.migration_notes` for namespace + config + flag mappings.
Consumers of the old modules must update:

- Composer / autoload paths: `Academorix\TelemetryOtel\*` →
  `Academorix\Telemetry\Otel\*`; `Academorix\TelemetryLogs\*` →
  `Academorix\Telemetry\Logs\*`
- `config('telemetry-otel.*')` → `config('telemetry.otel.*')` (traces / metrics
  under `otel.` sub-key); `config('telemetry-logs.*')` →
  `config('telemetry.logs.*')`
- Pennant flag keys: see the mapping table in `module.json`
- Route prefixes: `/api/v1/platform/telemetry-otel/*` +
  `/api/v1/platform/telemetry-logs/*` → `/api/v1/platform/telemetry/*`
