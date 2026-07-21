# stackra-sports/progress-sdk

Wire-visible SDK surface for the `progress` module of the Sports service.
Auto-discovered by `stackra/sports-sdk` (the service umbrella) via
`#[AsSdkResource(name: 'progress', service: 'sports')]`.

## Aggregates

- **belt-ranks** — Ordered martial-arts belt (or equivalent grading) per
  sport_key
- **coach-notes** — Coach observation on an athlete_enrollment
- **grading-events** — Formal belt-grading examination event distinct from a
  Session
- **grading-results** — Per-athlete outcome at a GradingEvent — from_belt_id +
  to_belt_id + result (pass/fail/deferred) + examiner_notes
- **progress-assessments** — Attribute-driven skill assessment per
  (athlete_enrollment, capture_date)
- **progress-cards** — Rendered snapshot of a ProgressAssessment as a shareable
  card

## Layout

```
src/
├── ProgressSdkResource.php     # #[AsSdkResource] — the entry point
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
    ->progress()
    ->beltRanks()
    ->list();
```

## Generation

This SDK is regenerated from the blueprint at `modules/sports/progress/`. Do not
hand-edit auto-generated files (they carry an `AUTO-GENERATED` header comment).
Files WITHOUT that header are hand-tuned overrides that survive regeneration.

```
python3 modules/shared/blueprints/foundation/scripts/generate-sdk.py sports progress
```
