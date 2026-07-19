# academorix-finance/digital-passes-sdk

Wire-visible SDK surface for the `digital-passes` module of the Finance service.
Auto-discovered by `academorix/finance-sdk` (the service umbrella) via
`#[AsSdkResource(name: 'digital-passes', service: 'finance')]`.

## Aggregates

- **wallet-passes** — Apple/Google Wallet pass

## Layout

```
src/
├── DigitalPassesSdkResource.php     # #[AsSdkResource] — the entry point
├── Data/                     # response DTOs (server -> client)
├── Payloads/<Aggregate>/     # request-body DTOs (client -> server)
├── Requests/<Aggregate>/     # Saloon HTTP-transport classes
├── Resources/                # fluent domain façades
├── Enums/                    # wire-visible backed enums
└── Exceptions/               # domain-typed exceptions (empty by default)
```

Consumed only over HTTP via the umbrella client:

```php
app(\Academorix\FinanceSdk\Client\FinanceSdk::class)
    ->digitalPasses()
    ->walletPasses()
    ->list();
```

## Generation

This SDK is regenerated from the blueprint at `modules/finance/digital-passes/`.
Do not hand-edit auto-generated files (they carry an `AUTO-GENERATED` header
comment). Files WITHOUT that header are hand-tuned overrides that survive
regeneration.

```
python3 modules/shared/blueprints/foundation/scripts/generate-sdk.py finance digital-passes
```
