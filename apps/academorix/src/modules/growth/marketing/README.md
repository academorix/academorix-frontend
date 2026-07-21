# academorix/marketing

Server-side Laravel package for the `marketing` module. Auto-generated from the
blueprint at `modules/growth/blueprints/marketing/`.

## Entities

- **MarketingDeadLetter** (`mdl_...`) — Max-attempts-exceeded events for manual
  replay.
- **MarketingDelivery** (`mdv_...`) — Per-provider-per-attempt delivery log.
- **MarketingEvent** (`mev_...`) — Canonical event ledger.
- **MarketingProviderConfig** (`mpc_...`) — Per-tenant provider connection.

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
    growth marketing --force
```

Files carrying the `AUTO-GENERATED` header are safe to regenerate; every other
file is a hand-tuned override that survives regeneration.

## Companion wire SDK

The wire-visible Saloon + Spatie Data package lives at
`academorix-growth/marketing-sdk` under `sdk/growth-marketing-sdk/`. Consumers
cross the service boundary through the SDK; this package is the SERVER-side
owner of the domain.
