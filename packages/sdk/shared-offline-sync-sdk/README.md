# stackra-shared/offline-sync-sdk

Wire-visible SDK surface for the `offline-sync` module of the Shared service.
Auto-discovered by `stackra/shared-sdk` (the service umbrella) via
`#[AsSdkResource(name: 'offline-sync', service: 'shared')]`.

## Aggregates

- **sync-cursors** — Per-device per-entity high-water-mark cursor

## Layout

```
src/
├── OfflineSyncSdkResource.php     # #[AsSdkResource] — the entry point
├── Data/                     # response DTOs (server -> client)
├── Payloads/<Aggregate>/     # request-body DTOs (client -> server)
├── Requests/<Aggregate>/     # Saloon HTTP-transport classes
├── Resources/                # fluent domain façades
├── Enums/                    # wire-visible backed enums
└── Exceptions/               # domain-typed exceptions (empty by default)
```

Consumed only over HTTP via the umbrella client:

```php
app(\Stackra\SharedSdk\Client\SharedSdk::class)
    ->offlineSync()
    ->syncCursors()
    ->list();
```

## Generation

This SDK is regenerated from the blueprint at `modules/shared/offline-sync/`. Do
not hand-edit auto-generated files (they carry an `AUTO-GENERATED` header
comment). Files WITHOUT that header are hand-tuned overrides that survive
regeneration.

```
python3 modules/shared/blueprints/foundation/scripts/generate-sdk.py shared offline-sync
```
