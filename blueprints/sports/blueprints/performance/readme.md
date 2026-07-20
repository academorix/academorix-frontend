# performance

Physical benchmarks + fitness testing per blueprint §14.2. Wave 3.

## Owned entities

- `TestBattery` (`ptb_`) — named collection of tests (U12 Football Physical Q1).
- `PerformanceTest` (`ptt_`) — single test definition (40m sprint, VO2, vertical
  jump).
- `PerformanceTestResult` (`ptr_`) — per-athlete outcome + percentile.
- `Benchmark` (`bmk_`) — age-band × sport × test percentile reference.

## Distinct from Progress

- **Progress** = coach-observed skill assessment (subjective, attribute-driven).
- **Performance** = objective physical measurement (sprint time, VO2, etc).

Both feed into `Development` pathway promotion criteria.

## Percentile computation

On `PerformanceTestResult.save`, `ComputePercentileOnResult` hook looks up the
matching `Benchmark` (by test + sport + age_band + sex) and computes the
athlete's percentile. If the value exceeds their previous personal best,
`BenchmarkBroken` fires (feeds awards).

## ULID prefixes

- `ptb_`, `ptt_`, `ptr_`, `bmk_`
