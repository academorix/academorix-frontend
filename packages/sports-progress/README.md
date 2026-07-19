# academorix-sports/progress

Server-side Laravel package for the `progress` module. Auto-generated from the
blueprint at `modules/sports/blueprints/progress/`.

## Entities

- **BeltRank** (`blt_...`) — Ordered martial-arts belt (or equivalent grading)
  per sport_key.
- **CoachNote** (`cno_...`) — Coach observation on an athlete_enrollment.
- **GradingEvent** (`gre_...`) — Formal belt-grading examination event distinct
  from a Session.
- **GradingResult** (`grr_...`) — Per-athlete outcome at a GradingEvent —
  from_belt_id + to_belt_id + result (pass/fail/deferred) + examiner_notes.
- **ProgressAssessment** (`pra_...`) — Attribute-driven skill assessment per
  (athlete_enrollment, capture_date).
- **ProgressCard** (`pcd_...`) — Rendered snapshot of a ProgressAssessment as a
  shareable card.

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
    sports progress --force
```

Files carrying the `AUTO-GENERATED` header are safe to regenerate; every other
file is a hand-tuned override that survives regeneration.

## Companion wire SDK

The wire-visible Saloon + Spatie Data package lives at
`academorix-sports/progress-sdk` under `sdk/sports-progress-sdk/`. Consumers
cross the service boundary through the SDK; this package is the SERVER-side
owner of the domain.
