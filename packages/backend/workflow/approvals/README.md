# academorix/approvals

Server-side Laravel package for the `approvals` module. Auto-generated from the
blueprint at `modules/workflow/blueprints/approvals/`.

## Entities

- **ApprovableAction** (`aac_...`) — Platform-level registry of actions gated by
  the approval engine.
- **ApprovalDecision** (`apd_...`) — Every approve/reject decision by an
  approver.
- **ApprovalInstance** (`api_...`) — One row per triggered approval flow.
- **ApprovalReminder** (`apn_...`) — Reminder-dispatch audit rows.
- **ApprovalRequirement** (`apr_...`) — One row per approver group per instance.
- **ApprovalTemplateApprover** (`apg_...`) — Approver group per template —
  design.
- **ApprovalTemplate** (`apt_...`) — Tenant-authored approval rules.

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
    workflow approvals --force
```

Files carrying the `AUTO-GENERATED` header are safe to regenerate; every other
file is a hand-tuned override that survives regeneration.

## Companion wire SDK

The wire-visible Saloon + Spatie Data package lives at
`academorix-workflow/approvals-sdk` under `sdk/workflow-approvals-sdk/`.
Consumers cross the service boundary through the SDK; this package is the
SERVER-side owner of the domain.
