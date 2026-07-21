# telemetry — changelog

## Unreleased

### Added

- Initial `telemetry` module, published by merging the previously separate
  `telemetry-otel` (Wave 6, OTel spans + metrics) and `telemetry-logs` (Wave 6,
  structured logs) modules.
- Two internal sub-namespaces preserve separation of concerns without splitting
  the module: `Stackra\Telemetry\Otel\*` (traces + metrics via
  `keepsuit/laravel-opentelemetry`) and `Stackra\Telemetry\Logs\*` (Monolog
  processor pipeline).
- Consolidated 10 PHP attributes: `AsSpan`, `AsCounter`, `AsHistogram`,
  `AsGauge`, `AsUpDownCounter`, `AsContext`, `AsBaggage` (OTel) plus
  `AsLogContext`, `AsLogChannel`, `RedactedForLogs` (logs).
- Single `TelemetryServiceProvider` composing internal `OtelServiceProvider`
  - `LogsServiceProvider` — one boot boundary, one health probe surface, one
    config file.
- Trace-to-logs correlation is now in-module (no cross-module context peek):
  `OtelTraceContextProcessor` reads directly from the OTel context established
  by the sibling sub-provider.

### Migration guide

Every consumer must update:

- **Composer namespaces.** `Stackra\TelemetryOtel\*` →
  `Stackra\Telemetry\Otel\*`. `Stackra\TelemetryLogs\*` →
  `Stackra\Telemetry\Logs\*`.
- **Config paths.** `config('telemetry-otel.exporter.endpoint')` →
  `config('telemetry.otel.exporter.endpoint')`.
  `config('telemetry-logs.sinks.loki.endpoint')` →
  `config('telemetry.logs.sinks.loki.endpoint')`. See
  `module.json.migration_notes.config_mapping` for the full table.
- **Pennant flags.** `telemetry-otel.exporter_traces` →
  `telemetry.exporter_traces`. `telemetry-logs.redaction_enforcement` →
  `telemetry.logs_redaction_enforcement`. See
  `module.json.migration_notes.flag_mapping` for the full table.
- **Route prefixes.** `/api/v1/platform/telemetry-otel/*` +
  `/api/v1/platform/telemetry-logs/*` → `/api/v1/platform/telemetry/*`.
- **Artisan commands.** `otel:describe` + `logs:describe` are folded into
  `telemetry:describe --signal={traces|metrics|logs|all}`. Analogously for
  `otel:test-export` + `logs:test-emit` → `telemetry:test-export --signal=…`.

### Removed

- `modules/telemetry-otel/` folder (superseded by `modules/telemetry/`).
- `modules/telemetry-logs/` folder (superseded by `modules/telemetry/`).
