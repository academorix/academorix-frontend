# stackra-platform/integrations-sdk

Wire-visible SDK surface for the `integrations` module of the Platform service.
Auto-discovered by `stackra/platform-sdk` (the service umbrella) via
`#[AsSdkResource(name: 'integrations', service: 'platform')]`.

## Aggregates

- **app-installations** — Per-(tenant, app) install grant
- **app-webhook-subscriptions** — Per-install webhook subscription
- **apps** — Marketplace app definition (Lane 2 per ADR 0025)
- **integration-providers** — Allowlist catalog of every provider Stackra
  supports (stripe / paddle / pipedrive / hubspot / twilio / zoom / apple_w
- **tenant-integrations** — External identity / directory / HRIS / LMS
  integration configured for a Tenant

## Layout

```
src/
├── IntegrationsSdkResource.php     # #[AsSdkResource] — the entry point
├── Data/                     # response DTOs (server -> client)
├── Payloads/<Aggregate>/     # request-body DTOs (client -> server)
├── Requests/<Aggregate>/     # Saloon HTTP-transport classes
├── Resources/                # fluent domain façades
├── Enums/                    # wire-visible backed enums
└── Exceptions/               # domain-typed exceptions (empty by default)
```

Consumed only over HTTP via the umbrella client:

```php
app(\Stackra\PlatformSdk\Client\PlatformSdk::class)
    ->integrations()
    ->appInstallations()
    ->list();
```

## Generation

This SDK is regenerated from the blueprint at `modules/platform/integrations/`.
Do not hand-edit auto-generated files (they carry an `AUTO-GENERATED` header
comment). Files WITHOUT that header are hand-tuned overrides that survive
regeneration.

```
python3 modules/shared/blueprints/foundation/scripts/generate-sdk.py platform integrations
```
