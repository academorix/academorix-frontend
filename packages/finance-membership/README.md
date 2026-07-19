# academorix-finance/membership

Server-side Laravel package for the `membership` module. Auto-generated from the
blueprint at `modules/finance/blueprints/membership/`.

## Entities

- **MembershipPlan** (`mbp_...`) — The SKU catalog.
- **MembershipRenewal** (`mbn_...`) — Per-period audit row.
- **Membership** (`mbr_...`) — The customer's paid subscription contract with
  the academy.
- **Pass** (`pss_...`) — A per-session admission credit issued by an active
  membership.

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
    finance membership --force
```

Files carrying the `AUTO-GENERATED` header are safe to regenerate; every other
file is a hand-tuned override that survives regeneration.

## Companion wire SDK

The wire-visible Saloon + Spatie Data package lives at
`academorix-finance/membership-sdk` under `sdk/finance-membership-sdk/`.
Consumers cross the service boundary through the SDK; this package is the
SERVER-side owner of the domain.
