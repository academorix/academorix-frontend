# academorix-platform/credentials-sdk

Wire-visible SDK surface for the `credentials` module of the Platform service.
Auto-discovered by `academorix/platform-sdk` (the service umbrella) via
`#[AsSdkResource(name: 'credentials', service: 'platform')]`.

## Aggregates

- **checkin-logs** — Raw check-in event from a Gate — UID + gate + timestamp
- **credentials** — NFC / RFID / QR credential — UID + polymorphic holder +
  status
- **gates** — NFC/RFID reader/gate at a branch — label + last_heartbeat_at +
  location

## Layout

```
src/
├── CredentialsSdkResource.php     # #[AsSdkResource] — the entry point
├── Data/                     # response DTOs (server -> client)
├── Payloads/<Aggregate>/     # request-body DTOs (client -> server)
├── Requests/<Aggregate>/     # Saloon HTTP-transport classes
├── Resources/                # fluent domain façades
├── Enums/                    # wire-visible backed enums
└── Exceptions/               # domain-typed exceptions (empty by default)
```

Consumed only over HTTP via the umbrella client:

```php
app(\Academorix\PlatformSdk\Client\PlatformSdk::class)
    ->credentials()
    ->checkinLogs()
    ->list();
```

## Generation

This SDK is regenerated from the blueprint at `modules/platform/credentials/`.
Do not hand-edit auto-generated files (they carry an `AUTO-GENERATED` header
comment). Files WITHOUT that header are hand-tuned overrides that survive
regeneration.

```
python3 modules/shared/blueprints/foundation/scripts/generate-sdk.py platform credentials
```
