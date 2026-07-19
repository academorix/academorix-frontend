# academorix-shared/attributes

Server-side Laravel package for the `attributes` module. Auto-generated from the
blueprint at `modules/shared/blueprints/attributes/`.

## Entities

- **AttributeDefinition** (`ads_...`) — A single typed attribute definition —
  the atomic unit an AttributeSet groups.
- **AttributeGroup** (`atg_...`) — Visual grouping of AttributeDefinitions
  within an AttributeSet — e.
- **AttributeSet** (`asg_...`) — A versioned collection of AttributeDefinitions
  bound to an entity_type + discriminator.

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
    shared attributes --force
```

Files carrying the `AUTO-GENERATED` header are safe to regenerate; every other
file is a hand-tuned override that survives regeneration.

## Companion wire SDK

The wire-visible Saloon + Spatie Data package lives at
`academorix-shared/attributes-sdk` under `sdk/shared-attributes-sdk/`. Consumers
cross the service boundary through the SDK; this package is the SERVER-side
owner of the domain.
