# academorix-sports/development-sdk

Wire-visible SDK surface for the `development` module of the Sports service.
Auto-discovered by `academorix/sports-sdk` (the service umbrella) via
`#[AsSdkResource(name: 'development', service: 'sports')]`.

## Aggregates

- **development-pathwaies** — DevelopmentPathway entity.
- **goals** — Individual Development Plan goal — description + target_date +
  status
- **pathway-stages** — PathwayStage entity.
- **scouting-reports** — ScoutingReport entity.
- **talent-flags** — TalentFlag entity.

## Layout

```
src/
├── DevelopmentSdkResource.php     # #[AsSdkResource] — the entry point
├── Data/                     # response DTOs (server -> client)
├── Payloads/<Aggregate>/     # request-body DTOs (client -> server)
├── Requests/<Aggregate>/     # Saloon HTTP-transport classes
├── Resources/                # fluent domain façades
├── Enums/                    # wire-visible backed enums
└── Exceptions/               # domain-typed exceptions (empty by default)
```

Consumed only over HTTP via the umbrella client:

```php
app(\Academorix\SportsSdk\Client\SportsSdk::class)
    ->development()
    ->developmentPathwaies()
    ->list();
```

## Generation

This SDK is regenerated from the blueprint at `modules/sports/development/`. Do
not hand-edit auto-generated files (they carry an `AUTO-GENERATED` header
comment). Files WITHOUT that header are hand-tuned overrides that survive
regeneration.

```
python3 modules/shared/blueprints/foundation/scripts/generate-sdk.py sports development
```
