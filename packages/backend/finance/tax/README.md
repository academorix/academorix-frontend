# academorix/tax

Server-side Laravel package for the `tax` module. Auto-generated from the
blueprint at `modules/finance/blueprints/tax/`.

## Entities

- **TaxCalculation** (`txc_...`) — Per-invoice-line tax computation record.
- **TaxExemption** (`txe_...`) — Per-tenant exemption certificate.
- **TaxJurisdiction** (`txj_...`) — Country/state/city rule catalog.
- **TaxRate** (`txr_...`) — Per-jurisdiction rate row with effective-range time
  bounds.

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
    finance tax --force
```

Files carrying the `AUTO-GENERATED` header are safe to regenerate; every other
file is a hand-tuned override that survives regeneration.

## Companion wire SDK

The wire-visible Saloon + Spatie Data package lives at
`academorix-finance/tax-sdk` under `sdk/finance-tax-sdk/`. Consumers cross the
service boundary through the SDK; this package is the SERVER-side owner of the
domain.
