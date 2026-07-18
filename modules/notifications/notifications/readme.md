# academorix/notifications

Notification substrate for Academorix. Owns six aggregates and the single
dispatch entry point (`DispatchGatewayInterface`) every consumer goes through.
Channel-agnostic — provider transports live in sibling modules
(`notifications-in-app`, `notifications-mail`, `notifications-push`,
`notifications-sms`) that subscribe to the module's events.

## Aggregates

| Aggregate               | ULID prefix | Purpose                                                                                                       |
| ----------------------- | ----------- | ------------------------------------------------------------------------------------------------------------- |
| `Notification`          | `not_`      | Universal delivery record — one row per (recipient, category, template, dispatch).                            |
| `NotificationDelivery`  | `delv_`     | Per-channel delivery attempt row for a `Notification`.                                                        |
| `NotificationTemplate`  | `tpl_`      | Versioned reusable template — one row per (key, channel, locale, version).                                    |
| `NotificationPreference`| `pref_`     | Per-user opt-in per (category, channel) with quiet hours + digest mode.                                       |
| `NotificationCategory`  | `cat_`      | Module-fed registry — platform default row (tenant_id NULL) + optional tenant override row (same slug).       |
| `NotificationDigest`    | `dgst_`     | Batched digest of pending notifications (daily/weekly).                                                       |

## Install

```bash
composer require academorix/notifications
```

## Contributes

- **Contracts (framework-swappable)**: `NotificationChannelRegistry`,
  `NotificationCategoryRegistry`, `NotificationTemplateRegistry`,
  `NotificationPreferenceResolver`, `DigestScheduler`, `DispatchGateway`.
  Default impls ship — consumer apps override any `#[Bind]`.
- **Attributes**: `#[Notifiable]` (mark a category-owner module),
  `#[HasPreferences]` (mark a model that carries per-user preferences),
  plus `#[NotificationCategory]` and `#[NotificationTemplate]` for
  attribute-driven registry hydration.
- **Permissions**: `NotificationsPermission` — dual-guard (Sanctum + platform admin).
- **Commands**: `notifications:seed-categories`, `notifications:seed-templates`,
  `notifications:test-dispatch`, `notifications:expunge-archived`,
  `notifications:reconcile-deliveries`.
- **Events (14)**: `NotificationDispatched`, `NotificationQueued`,
  `NotificationSent`, `NotificationDelivered`, `NotificationFailed`,
  `NotificationOpened`, `NotificationClicked`, `NotificationSeen`,
  `NotificationArchived`, `DigestQueued`, `DigestDelivered`,
  `TemplatePublished`, `PreferenceUpdated`, `CategoryRegistered`.
- **Jobs (5)**: `SendNotificationJob`, `ProcessDigestJob`,
  `ExpungeArchivedNotificationsJob`, `ReconcileDeliveriesJob`,
  `RefreshUserCacheJob`.
- **Middleware**: `throttle.mark-seen`, `throttle.preferences`.
- **Casts (3)**: `NotificationPayloadCast` (encrypted-at-rest JSON),
  `QuietHoursCast` (time-range JSON), `DigestModeCast` (enum).
- **Rules (4)**: `template_key_format`, `supported_channel`,
  `valid_locale`, `recipient_shape`.

## The single dispatch entry point

Every caller — every module that fires a notification — goes through
`DispatchGatewayInterface`. It is the ONLY sanctioned way to fire a
notification. Channel modules never expose their own send methods; they
subscribe to `NotificationDispatched` and translate to their transport.

```php
$this->dispatchGateway->dispatch(new NotificationDispatchRequest(
    categorySlug: 'invitations.invitation_sent',
    recipient: NotificationRecipientData::forUser($user),
    variables: ['invitation_url' => $url],
));
```

The gateway resolves preferences, resolves templates, resolves channels,
persists the `Notification` + `NotificationDelivery` rows, then fires
`NotificationDispatched` after commit. Every consumer downstream is
event-driven — no cross-module DB reads.

## Microservice readiness

Every design choice above keeps the door open for a future extraction to a
Node microservice: event-carried state (every payload includes the recipient
+ tenant branding), a single dispatch entry point (no direct channel-module
imports), event-driven channel modules, and an OpenAPI spec for every HTTP
surface. When the extraction happens, the same event schema points at Redis
Streams instead of the local queue — no rewrite.

## Tests

```bash
composer install
vendor/bin/pest
```
