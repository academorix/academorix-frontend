# academorix-growth/referrals

Server-side Laravel package for the `referrals` module. Auto-generated from the
blueprint at `modules/growth/blueprints/referrals/`.

## Entities

- **ReferralCode** (`rcd_...`) — The distributable code that maps inbound clicks
  to a specific referral program.
- **ReferralFraudFlag** (`rfr_...`) — Detection finding per referral.
- **ReferralProgram** (`rpg_...`) — Per-tenant referral program configuration.
- **ReferralReward** (`rrw_...`) — Per-referral reward record.
- **Referral** (`ref_...`) — The tracked referrer × referred × program × code
  instance.

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
    growth referrals --force
```

Files carrying the `AUTO-GENERATED` header are safe to regenerate; every other
file is a hand-tuned override that survives regeneration.

## Companion wire SDK

The wire-visible Saloon + Spatie Data package lives at
`academorix-growth/referrals-sdk` under `sdk/growth-referrals-sdk/`. Consumers
cross the service boundary through the SDK; this package is the SERVER-side
owner of the domain.
