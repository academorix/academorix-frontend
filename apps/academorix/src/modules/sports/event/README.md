# stackra/event

Server-side Laravel package for the `event` module. Auto-generated from the
blueprint at `modules/sports/blueprints/event/`.

## Entities

- **CalendarSubscription** (`csb_...`) — Per-user calendar feed subscription
  (iCal / ICS).
- **EventFacility** (`efc_...`) — Pivot row attaching a Facility to an Event.
- **EventInvitation** (`evi_...`) — Invitation for an athlete (or user, when
  applicable) to attend a scheduled activity.
- **EventReminder** (`ern_...`) — Throttled reminder log — records that a
  reminder was dispatched for an invitation, prevents double-fire within 24h.
- **Event** (`eve_...`) — Sport competitive / social / educational event.
- **Rsvp** (`rsv_...`) — RSVP response on an EventInvitation.

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
    sports event --force
```

Files carrying the `AUTO-GENERATED` header are safe to regenerate; every other
file is a hand-tuned override that survives regeneration.

## Companion wire SDK

The wire-visible Saloon + Spatie Data package lives at
`stackra-sports/event-sdk` under `sdk/sports-event-sdk/`. Consumers cross the
service boundary through the SDK; this package is the SERVER-side owner of the
domain.
