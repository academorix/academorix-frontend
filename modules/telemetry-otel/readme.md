# telemetry-otel

OpenTelemetry instrumentation surface. Wave 6 infrastructure. Wraps `keepsuit/laravel-opentelemetry`.

## 1. Why keepsuit vs `open-telemetry/sdk` directly

We evaluated two paths:

| Approach | Pro | Con |
| --- | --- | --- |
| `open-telemetry/sdk` + `exporter-otlp` (raw) | Full control; smaller dep footprint | ~500 LOC of Laravel service-provider glue we maintain forever. Manual auto-instrumentation of HTTP/DB/queue/cache/view. Redundant with what a Laravel-native wrapper already does. |
| **keepsuit/laravel-opentelemetry** (chosen) | Turn-key auto-instrumentation of the five biggest surfaces. Thin composition over the official SDK — no lock-in. Battle-tested in production Laravel apps. Track record of matching upstream SDK versions. | One extra dep. |

keepsuit is **not** an OTel implementation — it's a Laravel binding layer over the official PHP SDK. So there's no "second-implementation risk"; we still get OpenTelemetry semantics + OTLP output.

## 2. What ships out of the box

The `TelemetryOtelServiceProvider` boots the SDK with:

- Resource attributes: `service.name`, `service.version`, `service.namespace`, `deployment.environment`, `academorix.workspace_id`, `academorix.workspace_id` (per request), `k8s.pod.name` (when in K8s)
- Trace exporter: OTLP/HTTP to `$OTEL_EXPORTER_OTLP_ENDPOINT`
- Metric exporter: OTLP/HTTP (metrics) with 10s aggregation window
- Auto-instrumentation of HTTP server + HTTP client + Eloquent + queue (see `module.json.auto_instrumentation`)
- W3C Trace Context propagator (default) + B3 propagator (backward compat)
- W3C Baggage propagator (for `workspace_id` / `workspace_id` cross-service)
- Sampling: `ParentBased(TraceIdRatioBased(0.10))` by default — 10% of new traces sampled, but 100% of downstream spans that share a sampled parent

## 3. Attribute-driven manual instrumentation

Modules add custom instrumentation via attributes:

```php
use Academorix\TelemetryOtel\Attributes\{AsSpan, AsCounter, AsHistogram, AsContext};

final class WebhookDispatcher
{
    #[AsSpan(name: 'webhook.dispatch', kind: 'internal', attributes: ['webhook.subscription_id'])]
    #[AsCounter(name: 'academorix.webhook.dispatches', unit: 'dispatches', labels: ['outcome'])]
    #[AsHistogram(name: 'academorix.webhook.dispatch.duration_ms', unit: 'ms', buckets: [10, 50, 200, 1000, 5000])]
    public function dispatch(WebhookDelivery $delivery, #[AsContext(key: 'webhook.subscription_id')] string $subscriptionId): void
    {
        // Method body — no manual span calls needed.
    }
}
```

The build-time discovery pass compiles a `SpanRegistry` map: `class::method` → `SpanDescriptor`. At runtime, keepsuit's tracer wraps decorated methods via a decorator/aspect pattern. Method calls remain vanilla in userspace.

## 4. Cross-boundary propagation

**HTTP server → downstream services:** W3C Trace Context propagated automatically (via keepsuit's server + client middleware).

**Queue job → worker:** The `TracePropagatingBusMiddleware` bus middleware attaches the current trace context to the job payload; on execution, a matching listener extracts + resumes the trace so the consumer span links to the producer.

**Baggage:** Keys like `workspace_id`, `workspace_id`, `causer_id` propagated via `#[AsBaggage]` so downstream services / async jobs see them without manual passing.

## 5. Kill switches (feature-flags)

Every exporter + auto-instrumentation surface has a Pennant flag (`telemetry-otel.exporter`, `telemetry-otel.auto_db`, etc). Emergency cutover to disable a noisy exporter without deploy.

## 6. Fire-and-forget

This module NEVER blocks on export. OTLP exports run through a `BatchSpanProcessor` with a background worker; on backpressure, spans are dropped (bounded queue) and a `academorix.otel.dropped_spans` counter increments.

## 7. What this module does NOT do

- **Doesn't own logs.** That's `telemetry-logs`.
- **Doesn't run collectors.** OTLP endpoint must be reachable via env config (self-hosted otel-collector, DataDog Agent, Grafana Alloy, etc).
- **Doesn't do APM UI.** Read the traces in Grafana / DataDog / Honeycomb / Signoz.
- **Doesn't retain data.** Downstream backend owns retention.
