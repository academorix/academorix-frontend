# stackra-platform/admin-console-sdk

Wire-visible SDK surface for the `admin-console` module of the Platform service.
Auto-discovered by `stackra/platform-sdk` (the service umbrella) via
`#[AsSdkResource(name: 'admin-console', service: 'platform')]`.

## Aggregates

- **admin-dashboard-configs** — Per-user or per-tenant admin dashboard
  configuration

## Layout

```
src/
├── AdminConsoleSdkResource.php     # #[AsSdkResource] — the entry point
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
    ->adminConsole()
    ->adminDashboardConfigs()
    ->list();
```

## Generation

This SDK is regenerated from the blueprint at `modules/platform/admin-console/`.
Do not hand-edit auto-generated files (they carry an `AUTO-GENERATED` header
comment). Files WITHOUT that header are hand-tuned overrides that survive
regeneration.

```
python3 modules/shared/blueprints/foundation/scripts/generate-sdk.py platform admin-console
```
