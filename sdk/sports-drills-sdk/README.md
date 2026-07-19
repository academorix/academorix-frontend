# academorix-sports/drills-sdk

Wire-visible SDK surface for the `drills` module of the Sports service.
Auto-discovered by `academorix/sports-sdk` (the service umbrella) via
`#[AsSdkResource(name: 'drills', service: 'sports')]`.

## Aggregates

- **curriculum-weeks** — CurriculumWeek entity.
- **curriculums** — Curriculum entity.
- **drill-categories** — DrillCategory entity.
- **drills** — Drill entity.
- **session-plan-items** — SessionPlanItem entity.
- **session-plans** — SessionPlan entity.

## Layout

```
src/
├── DrillsSdkResource.php     # #[AsSdkResource] — the entry point
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
    ->drills()
    ->curriculumWeeks()
    ->list();
```

## Generation

This SDK is regenerated from the blueprint at `modules/sports/drills/`. Do not
hand-edit auto-generated files (they carry an `AUTO-GENERATED` header comment).
Files WITHOUT that header are hand-tuned overrides that survive regeneration.

```
python3 modules/shared/blueprints/foundation/scripts/generate-sdk.py sports drills
```
