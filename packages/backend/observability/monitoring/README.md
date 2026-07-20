# academorix/monitoring

Server-side Laravel package for the `monitoring` module. Auto-generated from the
blueprint at `modules/observability/blueprints/monitoring/`.

## Entities

- **HealthCheckRun** (`hcr_...`) — Per-execution health check result.
- **HealthCheck** (`hck_...`) — Per-tenant health check configuration.
- **MonitoringAlertPolicy** (`map_...`) — Per-tenant threshold configuration.
- **MonitoringAlert** (`mal_...`) — Fired alert record.
- **MonitoringIncident** (`mci_...`) — Grouped alert timeline.
- **MonitoringProviderConfig** (`mpr_...`) — Per-tenant per-provider connection.

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
    observability monitoring --force
```

Files carrying the `AUTO-GENERATED` header are safe to regenerate; every other
file is a hand-tuned override that survives regeneration.

## Companion wire SDK

The wire-visible Saloon + Spatie Data package lives at
`academorix-observability/monitoring-sdk` under
`sdk/observability-monitoring-sdk/`. Consumers cross the service boundary
through the SDK; this package is the SERVER-side owner of the domain.
