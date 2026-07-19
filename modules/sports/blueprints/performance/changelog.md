# performance — changelog

## [Unreleased] — inception (Wave 3)

- Four owned entities: TestBattery / PerformanceTest / PerformanceTestResult /
  Benchmark.
- Attribute integration: metrics JSONB on PerformanceTestResult is
  attribute-driven (via `HasAttributeSet`) when sport-config declares an active
  battery.
- Benchmark platform defaults seeded (NBA Combine 2022, FIFA U12 Norms, generic
  percentiles); tenants override with tenant-scoped rows.
- `ComputePercentileOnResult` hook + `BenchmarkBroken` event feed the awards
  module for auto-grant.
- Retention: 7y post-athlete-archival; 10y Enterprise.

### Dependencies

- `foundation`, `tenancy`, `application`, `attributes`, `athlete`,
  `athlete-enrollment`, `coaching`.

### ULID prefixes

- `ptb_`, `ptt_`, `ptr_`, `bmk_` — registered.
