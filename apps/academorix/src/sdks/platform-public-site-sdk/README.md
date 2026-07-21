# stackra-platform/public-site-sdk

Wire-visible SDK surface for the `public-site` module of the Platform service.
Auto-discovered by `stackra/platform-sdk` (the service umbrella) via
`#[AsSdkResource(name: 'public-site', service: 'platform')]`.

## Aggregates

- **content-blocks** — ContentBlock entity.
- **public-pages** — PublicPage entity.

## Layout

```
src/
├── PublicSiteSdkResource.php     # #[AsSdkResource] — the entry point
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
    ->publicSite()
    ->contentBlocks()
    ->list();
```

## Generation

This SDK is regenerated from the blueprint at `modules/platform/public-site/`.
Do not hand-edit auto-generated files (they carry an `AUTO-GENERATED` header
comment). Files WITHOUT that header are hand-tuned overrides that survive
regeneration.

```
python3 modules/shared/blueprints/foundation/scripts/generate-sdk.py platform public-site
```
