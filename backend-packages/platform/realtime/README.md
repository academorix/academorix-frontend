# academorix/realtime

Server-side Laravel package for the `realtime` module. Auto-generated from the
blueprint at `modules/platform/blueprints/realtime/`.

## Entities

- **BroadcastChannel** (`bch_...`) — Registered WebSocket channel — namespace +
  type + authorization callback.
- **BroadcastSubscription** (`bsn_...`) — Active WebSocket subscription of a
  User to a BroadcastChannel.
- **Presence** (`prs_...`) — Ephemeral row per (channel, user) tracking who is
  online on a presence channel.

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
    platform realtime --force
```

Files carrying the `AUTO-GENERATED` header are safe to regenerate; every other
file is a hand-tuned override that survives regeneration.

## Companion wire SDK

The wire-visible Saloon + Spatie Data package lives at
`academorix-platform/realtime-sdk` under `sdk/platform-realtime-sdk/`. Consumers
cross the service boundary through the SDK; this package is the SERVER-side
owner of the domain.
