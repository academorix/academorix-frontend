# academorix-platform/settings

Server-side Laravel package for the `settings` module. Auto-generated from the
blueprint at `modules/platform/blueprints/settings/`.

## Entities

- **SettingValue** (`set_...`) — Persistence row.
- **SettingsGroup** (`...`) — Read-only registry row for a settings group (a set
  of related settings surfaced together in the UI).
- **SettingsSchema** (`...`) — Read-only registry entry for a single settings
  FIELD within a group (e.

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
    platform settings --force
```

Files carrying the `AUTO-GENERATED` header are safe to regenerate; every other
file is a hand-tuned override that survives regeneration.

## Companion wire SDK

The wire-visible Saloon + Spatie Data package lives at
`academorix-platform/settings-sdk` under `sdk/platform-settings-sdk/`. Consumers
cross the service boundary through the SDK; this package is the SERVER-side
owner of the domain.
