# stackra-platform/realtime-sdk

Wire-visible SDK surface for the `realtime` module of the Platform service.
Auto-discovered by `stackra/platform-sdk` (the service umbrella) via
`#[AsSdkResource(name: 'realtime', service: 'platform')]`.

## Aggregates

- **broadcast-channels** — Registered WebSocket channel — namespace + type +
  authorization callback
- **broadcast-subscriptions** — Active WebSocket subscription of a User to a
  BroadcastChannel
- **presences** — Ephemeral row per (channel, user) tracking who is online on a
  presence channel

## Layout

```
src/
├── RealtimeSdkResource.php     # #[AsSdkResource] — the entry point
├── Data/                     # response DTOs (server -> client)
├── Payloads/<Aggregate>/     # request-body DTOs (client -> server)
├── Requests/<Aggregate>/     # Saloon HTTP-transport classes
├── Resources/                # fluent domain façades
├── Enums/                    # wire-visible backed enums
└── Exceptions/               # domain-typed exceptions (empty by default)
```

Consumed only over HTTP via the umbrella client:

```php
app(\Stackra\PlatformSdk\Client\PlatformSdk::class)
    ->realtime()
    ->broadcastChannels()
    ->list();
```

## Generation

This SDK is regenerated from the blueprint at `modules/platform/realtime/`. Do
not hand-edit auto-generated files (they carry an `AUTO-GENERATED` header
comment). Files WITHOUT that header are hand-tuned overrides that survive
regeneration.

```
python3 modules/shared/blueprints/foundation/scripts/generate-sdk.py platform realtime
```
