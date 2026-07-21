# stackra-sports/private-sessions-sdk

Wire-visible SDK surface for the `private-sessions` module of the Sports
service. Auto-discovered by `stackra/sports-sdk` (the service umbrella) via
`#[AsSdkResource(name: 'private-sessions', service: 'sports')]`.

## Aggregates

- **private-session-requests** — PrivateSessionRequest entity.
- **session-credits** — Session-pack credit ledger — parent bought 10-pack; each
  private-session consume atomically decrements via SELECT FOR UP

## Layout

```
src/
├── PrivateSessionsSdkResource.php     # #[AsSdkResource] — the entry point
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
    ->privateSessions()
    ->privateSessionRequests()
    ->list();
```

## Generation

This SDK is regenerated from the blueprint at
`modules/sports/private-sessions/`. Do not hand-edit auto-generated files (they
carry an `AUTO-GENERATED` header comment). Files WITHOUT that header are
hand-tuned overrides that survive regeneration.

```
python3 modules/shared/blueprints/foundation/scripts/generate-sdk.py sports private-sessions
```
