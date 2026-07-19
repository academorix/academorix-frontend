# academorix-sports/registrations

Server-side Laravel package for the `registrations` module. Auto-generated from
the blueprint at `modules/sports/blueprints/registrations/`.

## Entities

- **Offer** (`off_...`) — Time-boxed enrollment offer.
- **RegistrationActivity** (`ract_...`) — Per-Registration activity log entry.
- **RegistrationTask** (`rtsk_...`) — Follow-up task on a Registration.
- **Registration** (`srg_...`) — The root funnel record.
- **TrialBooking** (`trb_...`) — Trial (taster) session booked as part of a
  Registration.
- **WaitlistEntry** (`wle_...`) — Position-ordered waitlist entry when a
  Team+Season is at capacity.

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
    sports registrations --force
```

Files carrying the `AUTO-GENERATED` header are safe to regenerate; every other
file is a hand-tuned override that survives regeneration.

## Companion wire SDK

The wire-visible Saloon + Spatie Data package lives at
`academorix-sports/registrations-sdk` under `sdk/sports-registrations-sdk/`.
Consumers cross the service boundary through the SDK; this package is the
SERVER-side owner of the domain.
