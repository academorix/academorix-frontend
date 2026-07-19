# academorix-compliance/compliance

Server-side Laravel package for the `compliance` module. Auto-generated from the
blueprint at `modules/compliance/blueprints/compliance/`.

## Entities

- **ConsentCategory** (`ccg_...`) — Config-backed catalogue of consent
  categories.
- **ConsentRecord** (`cns_...`) — Immutable subject × category × decision
  snapshot.
- **DsarArtefact** (`dsa_...`) — Per-module contribution to a DSAR bundle.
- **Dsar** (`dsr_...`) — Data-Subject-Access-Request state machine.
- **LegalHold** (`lhd_...`) — Freezes retention on a subject / tenant / case /
  class scope.
- **RetentionRun** (`rtr_...`) — Audit trail of every retention sweep.
- **SafeguardingIncident** (`sfi_...`) — Minor-safeguarding report inbox.
- **Subprocessor** (`spr_...`) — Versioned VPC / DPA registry.

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
    compliance compliance --force
```

Files carrying the `AUTO-GENERATED` header are safe to regenerate; every other
file is a hand-tuned override that survives regeneration.

## Companion wire SDK

The wire-visible Saloon + Spatie Data package lives at
`academorix-compliance/compliance-sdk` under `sdk/compliance-compliance-sdk/`.
Consumers cross the service boundary through the SDK; this package is the
SERVER-side owner of the domain.
