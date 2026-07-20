# notifications/notifications — Phase 3 implementation status

## Status: PARTIAL — substrate + inbox + preferences + templates landed; digest scheduler + delivery reconciler pending

## What landed

### Models + column contracts
- `Notification`, `NotificationDelivery`, `NotificationTemplate`,
  `NotificationPreference`, `NotificationCategory`, `NotificationDigest`
  — all six aggregates modeled with `<Model>Interface` column
  constants + `#[Fillable]` + `#[Table]` + `#[ObservedBy]` +
  `#[UseFactory]` + `#[UsePolicy]`.
- `Notification` carries the denormalised recipient snapshot fields
  (`ATTR_ADDRESSEE_EMAIL`, `ATTR_ADDRESSEE_PHONE`, `ATTR_ADDRESSEE_NAME`,
  `ATTR_ADDRESSEE_LOCALE`, `ATTR_ADDRESSEE_TIMEZONE`) so downstream
  channel modules never need to re-lookup the recipient — event-carried
  state per the microservice-readiness discipline.
- Trait composition: `BelongsToTenant` + `HasMetadata` +
  `HasPrefixedUlid` + `SoftDeletes` + `Userstamps` + `Auditable`.

### Dispatch surface — the "primary send path"
- `DispatchGatewayInterface` (`#[Bind]` → `DefaultDispatchGateway`) —
  the single entry point every consumer goes through. No module
  imports the channel-specific senders directly.
- `DefaultDispatchGateway::dispatch(NotificationDispatchRequest)` —
  persists the `Notification` row with `state = queued` and snapshots
  every recipient field. Downstream channel modules react to the
  observer-emitted `NotificationDispatched` event.
- `NotificationDispatchRequest` (readonly VO) — the wire-safe payload
  callers hand to the gateway. Carries recipient snapshot + template
  variables + channel preferences + actor metadata.
- Master kill-switch — `config('notifications.enabled')` short-circuits
  the whole path when off (returns `null`, no row persisted, no
  channel module fires).

### Inbox actions (tenant surface)
- `ListNotifications` (GET `/api/v1/tenant/notifications`) — paginated
  inbox scoped to `addressee_id = auth user + tenant`.
- `ShowNotification` (GET `/{notification}`) — single-notification
  view, `WhereUlid` on the route param.
- `MarkSeenNotification` (POST `/{notification}/seen`) — idempotent,
  rate-limited via `throttle.mark-seen`.
- `MarkAllSeen` (POST `/mark-all-seen`) — bulk mark-seen.
- `ArchiveNotification` (POST `/{notification}/archive`) — sets
  `archived_at`.

### Preferences (tenant surface)
- `ListPreferences` (GET) — grid of `(category, channel)` toggles.
- `UpdatePreferences` (PATCH) — bulk upsert with quiet-hours and
  digest-mode fields.

### Templates (tenant admin surface)
- `ListTemplates`, `ShowTemplate`, `CreateTemplate`, `UpdateTemplate`,
  `PublishTemplate` (draft → published gate for SOC 2 CC8.1),
  `TestTemplate` (rate-limited test send).

### Central unsubscribe surface
- `ProcessUnsubscribe` (POST `/api/notifications/unsubscribe/{token}`)
  — RFC 8058 List-Unsubscribe-Post compliant.
- `ShowUnsubscribeForm` (GET) — confirmation page.

### Preference resolver
- `DefaultNotificationPreferenceResolver` — walks
  `(user, tenant, category, channel)` to produce a
  `NotificationPreferenceDecision` VO. Honours quiet-hours + digest
  mode + category `is_required` opt-out lock.

## What's pending

### Actions to complete

- `SnoozeAction` (POST `/{notification}/snooze`) — **needs schema
  change**. Add `ATTR_SNOOZED_UNTIL` to `NotificationInterface` + the
  matching migration `add_snoozed_until_to_notifications`, then wire
  the action + a `MarkAsUnreadAction` counterpart. Blueprint update
  under `modules/notifications/blueprints/notifications/schemas/notification.schema.json`
  MUST land first so the regenerator doesn't overwrite the interface.
- `MarkAsUnreadAction` — inverse of `MarkSeenNotification`, sets
  `seen_at = null`. Same route shape, opposite semantic. Rate-limited
  via `throttle.mark-seen` (shared bucket, or a sibling
  `throttle.mark-unread`).
- Platform-tier retry — `PostDeliveryRetry` at
  `POST /api/v1/platform/notifications/{notification}/deliveries/{delivery}/retry`.
  Republishes to the channel module via
  `NotificationChannelRegistry` — rate-limited to prevent replay
  abuse.

### Duplicate stub cleanup

Auto-generated `*Action.php` stubs coexist with hand-implemented
`*<Noun>.php` files (e.g. `ArchiveAction.php` vs `ArchiveNotification.php`,
`ListNotificationAction.php` vs `ListNotifications.php`, ...). Both
target the SAME route path with DIFFERENT `#[AsAction(name:)]` — the
route registrar will last-wins overwrite. Two paths forward:

1. Retire the auto-generator stubs — update `generate-module.py` to
   skip an Action when a hand-named sibling exists in the same folder.
2. Delete every `*Action.php` file in `src/Actions/Tenant/` that has a
   matching `*<Noun>.php` sibling — one commit per action, verified
   green after regeneration.

Priority: P1. This is a latent correctness bug — first-registration
wins depends on filesystem iteration order.

### Services + registries to complete

- `NotificationChannelRegistry` — the channel driver registry the
  `SendNotificationJob` fans out through. Discovered via
  `#[AsNotificationChannel]` (already declared in
  `notifications-in-app` + `notifications-mail`). Loader service
  scans `IDiscoveryService::getProvidersByMetadata(CHANNEL_METADATA_KEY)`
  and populates the registry at `OnApplicationBootstrap`.
- `NotificationCategoryRegistry` — module-fed registry of `(slug,
  consent_tier, priority, is_required)`. Seeded by each module's
  `seed-categories` command.
- `NotificationTemplateRegistry` — resolves `(tenant, category,
  channel, locale) → NotificationTemplate` (published rows only).
  Consumer of the tenant-override + platform-default hierarchy.
- `SendNotificationJob` — currently a stub. Should:
  1. Load the `Notification` by id (with locking).
  2. For each channel in `priority_channels_requested` (or default
     ladder from the category):
     a. Consult `DefaultNotificationPreferenceResolver`.
     b. If enabled, resolve the template via
        `NotificationTemplateRegistry`.
     c. Dispatch to the channel driver via
        `NotificationChannelRegistry::send(...)`.
     d. Write a `NotificationDelivery` row per attempt.
  3. Emit `NotificationSent` on success,
     `NotificationFailed` on final failure.
- `DefaultDigestScheduler` — runs the scheduled task
  `notifications:process-digests`. Currently a stub. Should aggregate
  pending `NotificationPreferenceDigestMode::Daily` /
  `::Weekly` deliveries per user and emit a single digest send.
- `ProcessDigestJob`, `ExpungeArchivedNotificationsJob`,
  `ReconcileDeliveriesJob`, `RefreshUserCacheJob` — all currently
  `TODO(gen)`. See the blueprint's `jobs.json` for the intended
  behaviour.

### Domain events to dispatch

Per `modules/notifications/blueprints/notifications/events.json`:

- `NotificationDispatched` — emitted by the observer AFTER commit on
  create. Currently WIRED via `NotificationObserver`.
- `NotificationQueued`, `NotificationSent`, `NotificationDelivered`,
  `NotificationFailed`, `NotificationOpened`, `NotificationClicked`,
  `NotificationSeen`, `NotificationArchived` — most fire from
  observer transitions. VERIFY the observer covers every state
  change; add missing paths.
- `DigestQueued`, `DigestDelivered` — emitted by `ProcessDigestJob`
  (deferred).
- `TemplatePublished` — fires on `PublishTemplate` action success.
- `PreferenceUpdated` — fires from `UpdatePreferences` +
  `ProcessUnsubscribe`.
- `CategoryRegistered` — fires from the `seed-categories` command.

### Cross-module dependencies

- **`compliance/compliance`** — every dispatch consults the
  `ConsentGate` before landing in the notification row. Pending: wire
  the gate check into `DefaultDispatchGateway::dispatch()`. Blocked
  on `notifications-consent` module maturing.
- **`platform/tenancy`** — `TenantSuspended` / `TenantArchived`
  should PAUSE all notification dispatch for that tenant. Add a
  listener that toggles `notifications.enabled` per-tenant at the
  gateway.
- **`observability/audit`** — every `NotificationDispatched` /
  `TemplatePublished` / `PreferenceUpdated` should land in the audit
  log. The observer's `Auditable` trait covers Notification +
  Template mutations; VERIFY `NotificationPreference` is on the same
  hook.

### Rate-limit + middleware wiring

Named rate limiters referenced in the actions' `#[Middleware]` arrays:

- `throttle.mark-seen` — 60/min per user.
- `throttle.preferences` — 30/min per user.
- Test send — 10/day per template (inline check in `TestTemplate`
  action; will move to a named limiter).

These need registration in the routing package's rate-limiter boot
hook.

## Backlog priorities

1. **P0 — `NotificationChannelRegistry` + `SendNotificationJob`
   completion.** Without this, no channel module fires — every
   `Notification` row lands with `state = queued` and sits there.
2. **P0 — Consent gate integration** (blocked on
   `notifications-consent`). Without this, dispatch violates GDPR by
   default.
3. **P1 — Duplicate `*Action.php` stub cleanup** (see above).
4. **P1 — Snooze schema + action.**
5. **P2 — Digest scheduler + `ProcessDigestJob`.**
6. **P2 — Reconciler for stuck-queued deliveries.**
