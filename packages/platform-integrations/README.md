# academorix-platform/integrations

Server-side Laravel package for the `integrations` module. Auto-generated from
the blueprint at `modules/platform/blueprints/integrations/`.

## Entities

- **AppInstallation** (`ain_...`) — Per-(tenant, app) install grant.
- **AppWebhookSubscription** (`awh_...`) — Per-install webhook subscription.
- **App** (`apk_...`) — Marketplace app definition (Lane 2 per ADR 0025).
- **IntegrationProvider** (`ipd_...`) — Allowlist catalog of every provider
  Academorix supports (stripe / paddle / pipedrive / hubspot / twilio / zoom /
  apple_w...
- **TenantIntegration** (`wit_...`) — External identity / directory / HRIS / LMS
  integration configured for a Tenant.

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
    platform integrations --force
```

Files carrying the `AUTO-GENERATED` header are safe to regenerate; every other
file is a hand-tuned override that survives regeneration.

## Companion wire SDK

The wire-visible Saloon + Spatie Data package lives at
`academorix-platform/integrations-sdk` under `sdk/platform-integrations-sdk/`.
Consumers cross the service boundary through the SDK; this package is the
SERVER-side owner of the domain.
