# stackra-sports/medical-sdk

Wire-visible SDK surface for the `medical` module of the Sports service.
Auto-discovered by `stackra/sports-sdk` (the service umbrella) via
`#[AsSdkResource(name: 'medical', service: 'sports')]`.

## Aggregates

- **allergies** — Allergen + severity + notes
- **injuries** — Injury event — body_part / mechanism / severity / onset_at /
  status
- **medical-clearances** — Clearance certificate that gates match squad
  selection
- **medical-records** — Root health record per athlete — container aggregating
  Injury, Treatment, Clearance, Allergy, Medication
- **medications** — Active medication — name / dosage / frequency /
  prescribing_provider / expires_at
- **treatments** — Treatment record linked to an Injury — provider / date /
  notes (encrypted) / follow_up_at

## Layout

```
src/
├── MedicalSdkResource.php     # #[AsSdkResource] — the entry point
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
    ->medical()
    ->allergies()
    ->list();
```

## Generation

This SDK is regenerated from the blueprint at `modules/sports/medical/`. Do not
hand-edit auto-generated files (they carry an `AUTO-GENERATED` header comment).
Files WITHOUT that header are hand-tuned overrides that survive regeneration.

```
python3 modules/shared/blueprints/foundation/scripts/generate-sdk.py sports medical
```
