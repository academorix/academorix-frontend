# telemetry-otel — changelog

## [Unreleased] — inception

- OpenTelemetry instrumentation surface authored. Wraps `keepsuit/laravel-opentelemetry` under the hood.
- Attributes: `AsSpan`, `AsCounter`, `AsHistogram`, `AsGauge`, `AsUpDownCounter`, `AsContext`, `AsBaggage`.
- Auto-instrumentation of HTTP server + HTTP client + Eloquent + queue producer/consumer + optionally cache + view.
- Cross-boundary trace-context propagation via bus middleware.
- OTLP/HTTP exporter (traces + metrics) with `BatchSpanProcessor` + drop-on-backpressure policy.
- Feature-flag kill switches per exporter + per auto-instrumentation surface.

### Compatibility

- Depends on `foundation`.
- Consumed by `telemetry-logs` for trace-id correlation.
- Inception release.
