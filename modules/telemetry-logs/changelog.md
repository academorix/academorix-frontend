# telemetry-logs — changelog

## [Unreleased] — inception

- Structured logging surface authored.
- Monolog processor pipeline: MessageInterpolator → PsrLogMessage → Introspection → AcademorixContext → OtelTraceContext → ModuleContext → Redactor → JsonFormatter.
- Attributes: `AsLogContext`, `AsLogChannel`, `RedactedForLogs`.
- Trace-to-logs correlation via telemetry-otel current-context extraction.
- Redaction pipeline (global + class-level + regex value patterns).
- Volume-based sampling for debug + info levels.
- Sink-agnostic. Supports stdout, daily files, Loki, DataDog HTTP intake, syslog.

### Compatibility

- Depends on `foundation`.
- Optionally consumes `telemetry-otel` for trace_id / span_id enrichment.
- Inception release.
