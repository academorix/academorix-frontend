# academorix/development

Server-side Laravel package for the `development` module. Auto-generated from
the blueprint at `modules/sports/blueprints/development/`.

## Entities

- **DevelopmentPathway** (`dvp_...`) —
- **Goal** (`gol_...`) — Individual Development Plan goal — description +
  target_date + status.
- **PathwayStage** (`dvs_...`) —
- **ScoutingReport** (`sct_...`) —
- **TalentFlag** (`tfg_...`) —

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
    sports development --force
```

Files carrying the `AUTO-GENERATED` header are safe to regenerate; every other
file is a hand-tuned override that survives regeneration.

## Companion wire SDK

The wire-visible Saloon + Spatie Data package lives at
`academorix-sports/development-sdk` under `sdk/sports-development-sdk/`.
Consumers cross the service boundary through the SDK; this package is the
SERVER-side owner of the domain.
