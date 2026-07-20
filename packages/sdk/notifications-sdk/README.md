# academorix/notifications-sdk

Typed Saloon SDK for the Notifications service — email, SMS, push, in-app,
WhatsApp, templates, digests.

Per-service umbrella SDK built on the shared kernel (`academorix/api-sdk`). It
owns the Notifications service connector (config `sdk.notifications.*`), a typed
`NotificationsSdk` client, and a discovery pass scoped to
`#[AsSdkResource(service: 'notifications')]`.

## Usage

```php
use Academorix\NotificationsSdk\Client\NotificationsSdk;

$notifications = app(NotificationsSdk::class);
$notifications->someResource()->find($id);
```

## Resources

Per-module resource packages live under
`apps/notifications-service/src/modules/<module>/sdk/` and are auto-discovered.
Scaffold one with:

```bash
./scripts/new-module-sdk.sh notifications <module>
```

## Config

`config/notifications-sdk.php` (publish tag `notifications-sdk-config`). Every
value is env-driven under `SDK_NOTIFICATIONS_*` — set at minimum
`SDK_NOTIFICATIONS_BASE_URL` and `SDK_NOTIFICATIONS_TOKEN`.
