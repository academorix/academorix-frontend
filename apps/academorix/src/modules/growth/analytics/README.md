# stackra/analytics

Server-side Laravel package for the `analytics` module. Auto-generated from the
blueprint at `modules/growth/blueprints/analytics/`.

## Entities

- **AnalyticsDelivery** (`and_...`) — Per-provider-per-attempt delivery log.
- **AnalyticsEvent** (`ane_...`) — Canonical behavioral event ledger.
- **AnalyticsIdentity** (`aid_...`) — Identity resolution table.
- **AnalyticsProviderConfig** (`apc_...`) — Per-tenant configuration of a single
  analytics provider.

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
    growth analytics --force
```

Files carrying the `AUTO-GENERATED` header are safe to regenerate; every other
file is a hand-tuned override that survives regeneration.

## Companion wire SDK

The wire-visible Saloon + Spatie Data package lives at
`stackra-growth/analytics-sdk` under `sdk/growth-analytics-sdk/`. Consumers
cross the service boundary through the SDK; this package is the SERVER-side
owner of the domain.
