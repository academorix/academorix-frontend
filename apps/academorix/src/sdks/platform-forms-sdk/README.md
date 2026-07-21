# stackra-platform/forms-sdk

Wire-visible SDK surface for the `forms` module of the Platform service.
Auto-discovered by `stackra/platform-sdk` (the service umbrella) via
`#[AsSdkResource(name: 'forms', service: 'platform')]`.

## Aggregates

- **form-submissions** — One completed (or in-progress) submission of a
  FormVersion
- **form-versions** — Immutable snapshot of a Form's schema at a point in time
- **forms** — Root form definition

## Layout

```
src/
├── FormsSdkResource.php     # #[AsSdkResource] — the entry point
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
    ->forms()
    ->formSubmissions()
    ->list();
```

## Generation

This SDK is regenerated from the blueprint at `modules/platform/forms/`. Do not
hand-edit auto-generated files (they carry an `AUTO-GENERATED` header comment).
Files WITHOUT that header are hand-tuned overrides that survive regeneration.

```
python3 modules/shared/blueprints/foundation/scripts/generate-sdk.py platform forms
```
