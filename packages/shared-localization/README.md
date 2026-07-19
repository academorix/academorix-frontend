# academorix-shared/localization

Server-side Laravel package for the `localization` module. Auto-generated from
the blueprint at `modules/shared/blueprints/localization/`.

## Entities

- **PlatformLanguage** (`lng_...`) — Platform-owned catalogue of BCP 47 locale
  tags this platform supports.
- **TenantLocale** (`wsl_...`) — Per-tenant association of a PlatformLanguage.
- **TranslationJob** (`tjb_...`) — Audit + progress row for one bulk-translation
  batch.
- **Translation** (`trn_...`) — Persistent cache of one translated key.

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
    shared localization --force
```

Files carrying the `AUTO-GENERATED` header are safe to regenerate; every other
file is a hand-tuned override that survives regeneration.

## Companion wire SDK

The wire-visible Saloon + Spatie Data package lives at
`academorix-shared/localization-sdk` under `sdk/shared-localization-sdk/`.
Consumers cross the service boundary through the SDK; this package is the
SERVER-side owner of the domain.
