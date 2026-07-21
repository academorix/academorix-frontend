# stackra/delegation

Server-side Laravel package for the `delegation` module. Auto-generated from the
blueprint at `modules/access/blueprints/delegation/`.

## Entities

- **ImpersonationSession** (`imp_...`) — One row per act-as session started by a
  PlatformUser (Stackra staff) against a tenant User for support / debug
  purpos...
- **RoleDelegation** (`dlg_...`) — Time-bounded delegation of a delegator User's
  role (or all roles) to a delegate User within the same tenant.

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
    access delegation --force
```

Files carrying the `AUTO-GENERATED` header are safe to regenerate; every other
file is a hand-tuned override that survives regeneration.

## Companion wire SDK

The wire-visible Saloon + Spatie Data package lives at
`stackra-access/delegation-sdk` under `sdk/access-delegation-sdk/`. Consumers
cross the service boundary through the SDK; this package is the SERVER-side
owner of the domain.
