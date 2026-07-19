# academorix-shared/attributes-sdk

Wire-visible SDK surface for the `attributes` module of the Shared service.
Auto-discovered by `academorix/shared-sdk` (the service umbrella) via
`#[AsSdkResource(name: 'attributes', service: 'shared')]`.

## Aggregates

- **attribute-definitions** — A single typed attribute definition — the atomic
  unit an AttributeSet groups
- **attribute-groups** — Visual grouping of AttributeDefinitions within an
  AttributeSet — e
- **attribute-sets** — A versioned collection of AttributeDefinitions bound to
  an entity_type + discriminator

## Layout

```
src/
├── AttributesSdkResource.php     # #[AsSdkResource] — the entry point
├── Data/                     # response DTOs (server -> client)
├── Payloads/<Aggregate>/     # request-body DTOs (client -> server)
├── Requests/<Aggregate>/     # Saloon HTTP-transport classes
├── Resources/                # fluent domain façades
├── Enums/                    # wire-visible backed enums
└── Exceptions/               # domain-typed exceptions (empty by default)
```

Consumed only over HTTP via the umbrella client:

```php
app(\Academorix\SharedSdk\Client\SharedSdk::class)
    ->attributes()
    ->attributeDefinitions()
    ->list();
```

## Generation

This SDK is regenerated from the blueprint at `modules/shared/attributes/`. Do
not hand-edit auto-generated files (they carry an `AUTO-GENERATED` header
comment). Files WITHOUT that header are hand-tuned overrides that survive
regeneration.

```
python3 modules/shared/blueprints/foundation/scripts/generate-sdk.py shared attributes
```
