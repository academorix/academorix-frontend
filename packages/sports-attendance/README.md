# academorix-sports/attendance

Server-side Laravel package for the `attendance` module. Auto-generated from the
blueprint at `modules/sports/blueprints/attendance/`.

## Entities

- **AbsenceRecord** (`abs_...`) — Per-athlete-per-session absence event.
- **AttendancePolicy** (`apo_...`) — Per-branch OR per-membership-plan
  attendance enforcement rules.
- **AttendanceRecord** (`atd_...`) — Per-athlete-per-session check-in event.
- **LateArrival** (`lat_...`) — Per-attendance-record satellite tracking WHEN in
  the grace-period an athlete arrived.

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
    sports attendance --force
```

Files carrying the `AUTO-GENERATED` header are safe to regenerate; every other
file is a hand-tuned override that survives regeneration.

## Companion wire SDK

The wire-visible Saloon + Spatie Data package lives at
`academorix-sports/attendance-sdk` under `sdk/sports-attendance-sdk/`. Consumers
cross the service boundary through the SDK; this package is the SERVER-side
owner of the domain.
