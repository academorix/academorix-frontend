# stackra-notifications/announcements-sdk

Wire-visible SDK surface for the `announcements` module of the Notifications
service. Auto-discovered by `stackra/notifications-sdk` (the service
umbrella) via
`#[AsSdkResource(name: 'announcements', service: 'notifications')]`.

## Aggregates

- **announcement-views** — Per-user view record — read_at + acknowledged_at
- **announcements** — Announcement entity.

## Layout

```
src/
├── AnnouncementsSdkResource.php     # #[AsSdkResource] — the entry point
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
    ->announcements()
    ->announcementViews()
    ->list();
```

## Generation

This SDK is regenerated from the blueprint at
`modules/notifications/announcements/`. Do not hand-edit auto-generated files
(they carry an `AUTO-GENERATED` header comment). Files WITHOUT that header are
hand-tuned overrides that survive regeneration.

```
python3 modules/shared/blueprints/foundation/scripts/generate-sdk.py notifications announcements
```
