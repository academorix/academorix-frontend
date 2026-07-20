# academorix/performance

Server-side Laravel package for the `performance` module. Auto-generated from
the blueprint at `modules/sports/blueprints/performance/`.

## Entities

- **Benchmark** (`bmk_...`) — Age-band × sport_key × test percentile reference.
- **PerformanceTestResult** (`ptr_...`) — One athlete's outcome on a single test
  — captured_at + value + tester + percentile against Benchmark.
- **PerformanceTest** (`ptt_...`) — A single physical test definition — reusable
  across batteries.
- **TestBattery** (`ptb_...`) — Named collection of PerformanceTests bundled for
  a program (e.

## Layout

```
src/
├── Providers/                     # <Name>ServiceProvider (module boot)
├── Contracts/
│   ├── Data/*Interface.php        # TABLE + ATTR_* constants (#[Bind]-bound to Model)
│   └── Repositories/*Interface.php
├── Models/*.php                   # Eloquent, attribute-first
├── Repositories/*.php             # #[AsRepository] + #[UseModel]
├── Data/*.php                     # Spatie Data output DTOs
├── Policies/*.php                 # Wired via #[UsePolicy] on the Model
├── Events/*.php                   # Domain events (ShouldDispatchAfterCommit)
└── Actions/*.php                  # Single-invoke controllers (#[AsController])
database/
├── migrations/*.php
├── factories/*.php
└── seeders/*.php                  # (dual-source catalogues only)
tests/
├── Feature/
└── Unit/
```

## Regeneration

```bash
python3 modules/shared/blueprints/foundation/scripts/generate-module.py \
    sports performance --force
```

Files carrying the `AUTO-GENERATED` header are safe to regenerate; every other
file is a hand-tuned override that survives regeneration.

## Companion wire SDK

The wire-visible Saloon + Spatie Data package lives at
`academorix-sports/performance-sdk` under `sdk/sports-performance-sdk/`.
Consumers cross the service boundary through the SDK; this package is the
SERVER-side owner of the domain.
