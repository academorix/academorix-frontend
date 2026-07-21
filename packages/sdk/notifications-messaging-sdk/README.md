# stackra-notifications/messaging-sdk

Wire-visible SDK surface for the `messaging` module of the Notifications
service. Auto-discovered by `stackra/notifications-sdk` (the service
umbrella) via `#[AsSdkResource(name: 'messaging', service: 'notifications')]`.

## Aggregates

- **conversation-participants** — ConversationParticipant entity.
- **conversations** — Conversation entity.
- **messages** — Message entity.

## Layout

```
src/
├── MessagingSdkResource.php     # #[AsSdkResource] — the entry point
├── Data/                     # response DTOs (server -> client)
├── Payloads/<Aggregate>/     # request-body DTOs (client -> server)
├── Requests/<Aggregate>/     # Saloon HTTP-transport classes
├── Resources/                # fluent domain façades
├── Enums/                    # wire-visible backed enums
└── Exceptions/               # domain-typed exceptions (empty by default)
```

Consumed only over HTTP via the umbrella client:

```php
app(\Stackra\NotificationsSdk\Client\NotificationsSdk::class)
    ->messaging()
    ->conversationParticipants()
    ->list();
```

## Generation

This SDK is regenerated from the blueprint at
`modules/notifications/messaging/`. Do not hand-edit auto-generated files (they
carry an `AUTO-GENERATED` header comment). Files WITHOUT that header are
hand-tuned overrides that survive regeneration.

```
python3 modules/shared/blueprints/foundation/scripts/generate-sdk.py notifications messaging
```
