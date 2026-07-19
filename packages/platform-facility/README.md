# academorix-platform/facility

Server-side Laravel package for the `facility` module. Auto-generated from the
blueprint at `modules/platform/blueprints/facility/`.

## Entities

- **Availability** (`...`) — Per-day windows within the parent Branch.
- **DayPass** (`dpa_...`) — Untimed same-day admission.
- **Facility** (`fac_...`) — Bookable resource inside a Branch.
- **Pass** (`pas_...`) — Credit + eligibility record binding Membership (Wave 4)
  to Facility access.
- **Pricing** (`...`) — Facility pricing configuration.
- **ResourceBooking** (`bkg_...`) — Timed reservation against a facility.

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
    platform facility --force
```

Files carrying the `AUTO-GENERATED` header are safe to regenerate; every other
file is a hand-tuned override that survives regeneration.

## Companion wire SDK

The wire-visible Saloon + Spatie Data package lives at
`academorix-platform/facility-sdk` under `sdk/platform-facility-sdk/`. Consumers
cross the service boundary through the SDK; this package is the SERVER-side
owner of the domain.
