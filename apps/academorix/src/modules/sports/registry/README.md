# stackra/registry

Server-side Laravel package for the `registry` module. Auto-generated from the
blueprint at `modules/sports/blueprints/registry/`.

## Entities

- **Discipline** (`dis_...`) — Sport sub-variant / competition format.
- **Position** (`pos_...`) — Sport-specific role / position within a Discipline.
- **Sport** (`spo_...`) — Top-level sport in the platform catalog.

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
    sports registry --force
```

Files carrying the `AUTO-GENERATED` header are safe to regenerate; every other
file is a hand-tuned override that survives regeneration.

## Companion wire SDK

The wire-visible Saloon + Spatie Data package lives at
`stackra-sports/registry-sdk` under `sdk/sports-registry-sdk/`. Consumers
cross the service boundary through the SDK; this package is the SERVER-side
owner of the domain.
