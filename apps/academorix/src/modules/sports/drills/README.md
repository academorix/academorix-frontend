# academorix/drills

Server-side Laravel package for the `drills` module. Auto-generated from the
blueprint at `modules/sports/blueprints/drills/`.

## Entities

- **CurriculumWeek** (`cwk_...`) —
- **Curriculum** (`cur_...`) —
- **DrillCategory** (`dcg_...`) —
- **Drill** (`dri_...`) —
- **SessionPlanItem** (`spi_...`) —
- **SessionPlan** (`spl_...`) —

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
    sports drills --force
```

Files carrying the `AUTO-GENERATED` header are safe to regenerate; every other
file is a hand-tuned override that survives regeneration.

## Companion wire SDK

The wire-visible Saloon + Spatie Data package lives at
`academorix-sports/drills-sdk` under `sdk/sports-drills-sdk/`. Consumers cross
the service boundary through the SDK; this package is the SERVER-side owner of
the domain.
