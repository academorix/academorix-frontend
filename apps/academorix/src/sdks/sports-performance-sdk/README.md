# academorix-sports/performance-sdk

Wire-visible SDK surface for the `performance` module of the Sports service.
Auto-discovered by `academorix/sports-sdk` (the service umbrella) via
`#[AsSdkResource(name: 'performance', service: 'sports')]`.

## Aggregates

- **benchmarks** — Age-band × sport_key × test percentile reference
- **performance-test-results** — One athlete's outcome on a single test —
  captured_at + value + tester + percentile against Benchmark
- **performance-tests** — A single physical test definition — reusable across
  batteries
- **test-batteries** — Named collection of PerformanceTests bundled for a
  program (e

## Layout

```
src/
├── PerformanceSdkResource.php     # #[AsSdkResource] — the entry point
├── Data/                     # response DTOs (server -> client)
├── Payloads/<Aggregate>/     # request-body DTOs (client -> server)
├── Requests/<Aggregate>/     # Saloon HTTP-transport classes
├── Resources/                # fluent domain façades
├── Enums/                    # wire-visible backed enums
└── Exceptions/               # domain-typed exceptions (empty by default)
```

Consumed only over HTTP via the umbrella client:

```php
app(\Academorix\SportsSdk\Client\SportsSdk::class)
    ->performance()
    ->benchmarks()
    ->list();
```

## Generation

This SDK is regenerated from the blueprint at `modules/sports/performance/`. Do
not hand-edit auto-generated files (they carry an `AUTO-GENERATED` header
comment). Files WITHOUT that header are hand-tuned overrides that survive
regeneration.

```
python3 modules/shared/blueprints/foundation/scripts/generate-sdk.py sports performance
```
