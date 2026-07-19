# academorix-shared/transfer

Server-side Laravel package for the `transfer` module. Auto-generated from the
blueprint at `modules/shared/blueprints/transfer/`.

## Entities

- **XferArtifact** (`xart_...`) — Generated file record.
- **XferJob** (`xfer_...`) — The persisted domain record for a single import /
  export / sample operation.
- **XferMappingProfile** (`xmap_...`) — Saved header-remap profile.
- **XferShard** (`xshd_...`) — Per-shard progress record for a sharded import /
  export or multi-sheet workbook.

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
    shared transfer --force
```

Files carrying the `AUTO-GENERATED` header are safe to regenerate; every other
file is a hand-tuned override that survives regeneration.

## Companion wire SDK

The wire-visible Saloon + Spatie Data package lives at
`academorix-shared/transfer-sdk` under `sdk/shared-transfer-sdk/`. Consumers
cross the service boundary through the SDK; this package is the SERVER-side
owner of the domain.
