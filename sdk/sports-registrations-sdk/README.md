# academorix-sports/registrations-sdk

Wire-visible SDK surface for the `registrations` module of the Sports service.
Auto-discovered by `academorix/sports-sdk` (the service umbrella) via
`#[AsSdkResource(name: 'registrations', service: 'sports')]`.

## Aggregates

- **offers** — Time-boxed enrollment offer
- **registrations** — The root funnel record
- **trial-bookings** — Trial (taster) session booked as part of a Registration
- **waitlist-entries** — Position-ordered waitlist entry when a Team+Season is
  at capacity

## Layout

```
src/
├── RegistrationsSdkResource.php     # #[AsSdkResource] — the entry point
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
    ->registrations()
    ->offers()
    ->list();
```

## Generation

This SDK is regenerated from the blueprint at `modules/sports/registrations/`.
Do not hand-edit auto-generated files (they carry an `AUTO-GENERATED` header
comment). Files WITHOUT that header are hand-tuned overrides that survive
regeneration.

```
python3 modules/shared/blueprints/foundation/scripts/generate-sdk.py sports registrations
```
