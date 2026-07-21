# stackra-sports/formations-sdk

Wire-visible SDK surface for the `formations` module of the Sports service.
Auto-discovered by `stackra/sports-sdk` (the service umbrella) via
`#[AsSdkResource(name: 'formations', service: 'sports')]`.

## Aggregates

- **formation-slots** — FormationSlot entity.
- **formations** — Formation entity.

## Layout

```
src/
├── FormationsSdkResource.php     # #[AsSdkResource] — the entry point
├── Data/                     # response DTOs (server -> client)
├── Payloads/<Aggregate>/     # request-body DTOs (client -> server)
├── Requests/<Aggregate>/     # Saloon HTTP-transport classes
├── Resources/                # fluent domain façades
├── Enums/                    # wire-visible backed enums
└── Exceptions/               # domain-typed exceptions (empty by default)
```

Consumed only over HTTP via the umbrella client:

```php
app(\Stackra\SportsSdk\Client\SportsSdk::class)
    ->formations()
    ->formationSlots()
    ->list();
```

## Generation

This SDK is regenerated from the blueprint at `modules/sports/formations/`. Do
not hand-edit auto-generated files (they carry an `AUTO-GENERATED` header
comment). Files WITHOUT that header are hand-tuned overrides that survive
regeneration.

```
python3 modules/shared/blueprints/foundation/scripts/generate-sdk.py sports formations
```
