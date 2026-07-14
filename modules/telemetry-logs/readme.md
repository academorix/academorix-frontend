# telemetry-logs

Structured logging surface. Wave 6 infrastructure.

## 1. Every log line is JSON

The framework's `Log::info(...)` calls funnel through Monolog. We register a processor pipeline (see `module.json.processor_pipeline`) that decorates every record with the fields observability backends need. The formatter emits newline-delimited JSON.

Sample record:

```json
{
  "timestamp": "2026-07-14T18:52:03.421Z",
  "level": "info",
  "message": "Webhook delivered",
  "channel": "webhook",
  "context": {"delivery_id": "wdl_01HXYZ...", "status_code": 200, "duration_ms": 142},
  "extra": {
    "academorix.request_id": "req_01HXYZ...",
    "academorix.workspace_id": "wsp_01HXYZ...",
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

## 2. Trace-to-logs correlation

When `telemetry-otel` is present, every log record gets `trace_id` + `span_id` from the current OpenTelemetry context. Grafana + DataDog + Honeycomb use these to jump from a slow span directly to its logs — a debugging boost that costs us one Monolog processor.

## 3. Attribute-driven module context

Modules add cross-cutting context to every log record they emit via attributes:

```php
use Academorix\TelemetryLogs\Attributes\{AsLogContext, AsLogChannel};

#[AsLogChannel('webhook')]
final class DispatchService
{
    #[AsLogContext(key: 'webhook.subscription_id')]
    public function subscriptionId(): string { return $this->delivery->subscription_id; }

    #[AsLogContext(key: 'webhook.attempt_number')]
    public function attemptNumber(): int { return $this->delivery->attempts; }

    public function run(): void
    {
        // Every Log::* call inside this class runs on the 'webhook' channel
        // and the two AsLogContext methods are evaluated + merged into the record.
        Log::info('Dispatch started');
    }
}
```

`#[AsLogChannel]` reroutes the class's logs to a specific channel (nice for per-subsystem filters). `#[AsLogContext]` methods are evaluated by the `ModuleContextProcessor` and merged into `record.extra`. Discovery happens at build-time; runtime is a hash-map lookup.

## 4. Redaction

The pipeline includes a `RedactorProcessor` that applies:

- Global key patterns from `telemetry-logs.redact.keys` (same defaults as telemetry-otel: password, token, secret, cookie, etc)
- Class-level `#[RedactedForLogs(fields: ['ssn', 'dob'])]` — for domain models
- Regex value patterns from `telemetry-logs.redact.patterns[]`

Redaction happens BEFORE the record leaves the process. Nothing sensitive hits disk / network.

## 5. Sinks

`config('logging.channels.academorix')` uses our stack. The physical output goes to whichever Monolog handler is wired:

- `stdout` (default in K8s — collector picks it up)
- `daily` — rotating files (dev / small deploys)
- `loki` — direct Loki push (via `itspire/monolog-loki`)
- `datadog` — direct DataDog HTTP intake
- `syslog` — journald / rsyslog

Multiple sinks can be composed via Monolog's `StackHandler`.

## 6. Not a data store

Same story as telemetry-otel: fire-and-forget. Retention lives with the backend.

## 7. Volume-based sampling (optional)

For high-cardinality environments where log volume is a cost concern, `telemetry-logs.sampling.debug_ratio` + `info_ratio` can drop a fraction of records at those levels. Warnings + errors + criticals never sampled.

## 8. What this module does NOT do

- **Doesn't own spans / metrics.** That's `telemetry-otel`.
- **Doesn't own audit log entries.** That's the `audit` module (compliance-grade, persisted, cryptographic hash chain).
- **Doesn't own activity feed items.** That's the `activity` module.
- **Doesn't handle log queries or dashboards.** Read logs in Grafana / DataDog / Kibana.
