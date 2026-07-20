# academorix-sports/competition-sdk

Wire-visible SDK surface for the `competition` module of the Sports service.
Auto-discovered by `academorix/sports-sdk` (the service umbrella) via
`#[AsSdkResource(name: 'competition', service: 'sports')]`.

## Aggregates

- **bracket-nodes** — Knockout tournament bracket node — round + position +
  participant refs + winner_advances_to_node_id
- **competition-fixtures** — CompetitionFixture entity.
- **competition-teams** — CompetitionTeam entity.
- **competitions** — Competition entity.
- **standing-rows** — Denormalised league table row — recomputed on every
  fixture result via RecomputeStandingsJob

## Layout

```
src/
├── CompetitionSdkResource.php     # #[AsSdkResource] — the entry point
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
    ->competition()
    ->bracketNodes()
    ->list();
```

## Generation

This SDK is regenerated from the blueprint at `modules/sports/competition/`. Do
not hand-edit auto-generated files (they carry an `AUTO-GENERATED` header
comment). Files WITHOUT that header are hand-tuned overrides that survive
regeneration.

```
python3 modules/shared/blueprints/foundation/scripts/generate-sdk.py sports competition
```
