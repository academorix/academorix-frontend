# academorix/dunning

Server-side Laravel package for the `dunning` module. Auto-generated from the
blueprint at `modules/finance/blueprints/dunning/`.

## Entities

- **DunningEvent** (`dev_...`) — Timeline entry for a dunning_run:
  retry_attempted, retry_succeeded, retry_failed, notification_sent,
  escalated_step, can...
- **DunningPlan** (`dpl_...`) — Reusable retry-schedule + escalation-ladder
  template.
- **DunningRun** (`drn_...`) — One row per triggered dunning cycle.

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
    finance dunning --force
```

Files carrying the `AUTO-GENERATED` header are safe to regenerate; every other
file is a hand-tuned override that survives regeneration.

## Companion wire SDK

The wire-visible Saloon + Spatie Data package lives at
`academorix-finance/dunning-sdk` under `sdk/finance-dunning-sdk/`. Consumers
cross the service boundary through the SDK; this package is the SERVER-side
owner of the domain.
