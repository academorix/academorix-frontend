# stackra-platform/safeguarding-sdk

Wire-visible SDK surface for the `safeguarding` module of the Platform service.
Auto-discovered by `stackra/platform-sdk` (the service umbrella) via
`#[AsSdkResource(name: 'safeguarding', service: 'platform')]`.

## Aggregates

- **background-checks** — Per-Staff clearance record — DBS / SafeSport /
  state-BCI / custom
- **policy-acknowledgements** — Staff acknowledged safeguarding policy version X
  on date Y

## Layout

```
src/
├── SafeguardingSdkResource.php     # #[AsSdkResource] — the entry point
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
    ->safeguarding()
    ->backgroundChecks()
    ->list();
```

## Generation

This SDK is regenerated from the blueprint at `modules/platform/safeguarding/`.
Do not hand-edit auto-generated files (they carry an `AUTO-GENERATED` header
comment). Files WITHOUT that header are hand-tuned overrides that survive
regeneration.

```
python3 modules/shared/blueprints/foundation/scripts/generate-sdk.py platform safeguarding
```
