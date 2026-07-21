# notifications — core

Notification substrate. Owns the universal delivery record + template registry +
preference resolver + category registry + digest scheduler.
**Channel-agnostic.** Provider transports live in sibling modules
(`notifications-in-app`, `notifications-mail`, `notifications-push`,
`notifications-sms`).

> **Position in the wave.** Wave 1. Depends on `foundation` (traits, health
> substrate, error envelope, cache namespaces, retention tiers, data-class
> taxonomy) + `tenants` (BelongsToTenant, BelongsToApplication, host
> resolution). Extended BY the 4 channel modules + every domain module that
> dispatches a notification.

## 1. The one entry point

Every caller uses ONE of these two calls. Nothing else:

```php
// Laravel-idiomatic — recommended.
$user->notify(new InvoicePaidNotification($invoice));

// Explicit dispatch with a category override (rare).
Notifications::dispatch(
    category: 'billing.invoice_paid',
    recipient: $user,
    payload: ['invoice_id' => $invoice->id, 'amount' => $invoice->amount],
);
```

No module imports from `notifications-mail`, `notifications-sms`,
`notifications-push`, or `notifications-in-app` directly. Ever. The core
`DispatchGateway` fans out to registered channels based on preferences +
digests.

## 2. What this module owns

| Concern                                                 | Entity                   |
| ------------------------------------------------------- | ------------------------ |
| Logical notification record (for inbox + audit)         | `Notification`           |
| Per-channel send attempts + provider tracking           | `NotificationDelivery`   |
| Versioned reusable templates (per channel + per locale) | `NotificationTemplate`   |
| Per-user opt-in per category per channel                | `NotificationPreference` |
| Category registry (populated by other modules)          | `NotificationCategory`   |
| Batched delivery state (daily / weekly digests)         | `NotificationDigest`     |

Note the deliberate absence of `NotificationSubscription` — push device tokens
belong to `notifications-push`. Mail suppression belongs to
`notifications-mail`. SMS opt-outs belong to `notifications-sms`. Each channel
owns its channel-specific side state.

## 3. Channel modules — event-driven, not called

Channels register themselves with the `NotificationChannelRegistry` at boot.
They subscribe to `NotificationDispatched` and translate to their transport.
Core doesn't know or care how they send.

```
Caller                Core                    Channel module (e.g. notifications-mail)
  │                     │                                     │
  │ notify()            │                                     │
  │────────────────────▶│                                     │
  │                     │ NotificationDispatched              │
  │                     │────────────────────────────────────▶│
  │                     │                                     │ SendMailJob (Laravel Mail)
  │                     │                                     │────▶ Mailgun / SES / SendGrid
  │                     │                                     │                │
  │                     │      NotificationSent               │◀───────────────┘
  │                     │◀────────────────────────────────────│
  │                     │                                     │
  │                     │      (provider webhook later)       │
  │                     │      NotificationDelivered          │
  │                     │◀────────────────────────────────────│
```

`notifications-in-app` translates to a `Notification.channel=in_app` row +
broadcasts to `user.{id}.notifications`. `notifications-mail` renders the React
Email template + hands to Laravel Mail. `notifications-push` resolves device
tokens + calls FCM / APNs. `notifications-sms` renders the plain body + calls
Twilio / MessageBird.

## 4. Event-carried state

Every dispatch payload carries **everything the receiving channel needs**. No
callbacks, no denormalized reads.

```php
// The event payload (JSON schema in events.json)
{
    "notification_id": "01JEZ...",
    "category_slug": "invitations.invitation_sent",
    "template_key": "invitations.invitation_sent",
    "recipient": {
        "id": "01JD8...",
        "type": "user",
        "email": "coach@example.com",
        "phone": "+15551234",
        "name": "Sarah Coach",
        "locale": "en",
        "timezone": "America/Chicago",
        "consent_age_gate": "adult"
    },
    "tenant": {
        "id": "01JC0...",
        "name": "Elite Football Academy",
        "logo_url": "https://cdn.stackra.com/tenants/01JC0.../logo.png",
        "primary_color": "#f97316",
        "sender_identity": "Elite FC <no-reply@elite.example>",
        "postal_address": "123 Stadium Way, Chicago, IL 60601 USA"
    },
    "variables": {
        "invitation_url": "https://elite.example/invite/abc123",
        "inviter_name": "Mark Owner",
        "expires_at": "2026-08-14T10:00:00Z"
    },
    "actor": {"type": "user", "id": "01JD8...ownerId"},
    "priority": "transactional",
    "channels_requested": ["mail", "in_app"]
}
```

Why: when we later extract to a NestJS microservice, the same event payload just
routes to Redis Streams instead of Laravel's queue. Zero caller changes.

## 5. Category registry

Every module contributes categories via its `notifications.json`. Registry is
populated at boot + cached (`platform:notifications:categories`, 1h TTL,
invalidated on `ConfigReloaded`).

```json
{
  "categories": [
    {
      "slug": "invitations.invitation_sent",
      "display_name": "Invitations sent to you",
      "default_channels": ["mail", "in_app"],
      "priority": "transactional",
      "consent_tier": "transactional_required",
      "opt_out_allowed": false
    }
  ]
}
```

- **transactional** — cannot be opted out (CAN-SPAM §7702(17) exemption).
  Security alerts, invitations, receipts.
- **product** — opt-in for enterprise tenants, opt-out for consumer tenants.
- **marketing** — always opt-in. Never on by default.

## 6. Templates — per-module `.tsx` files

Templates live where they're owned.
`modules/invitations/emails/invitation-sent.tsx` is authored by whoever owns
invitations. `packages/notifications-emails-shared/` provides the shared React
Email primitives (Layout, Button, Footer, BrandHeader).

Render pipeline:

- **Author**: `.tsx` file + optional `locales/{en,ar}.json` sibling for i18n
  strings.
- **Preview**: `pnpm --filter notifications-emails-renderer dev` starts
  `react-email dev` locally.
- **Build**: `pnpm --filter notifications-emails-renderer render` walks every
  `modules/*/emails/*.tsx`, invokes `@react-email/render`, emits
  `dist/<module>/<template>.<locale>.html` with Blade placeholders
  (`{{ $firstName }}`, `@foreach ($items as $item)…`).
- **Deploy**: CI uploads `dist/manifest.json` to a versioned S3 path OR bundles
  into the Laravel artifact.
- **Runtime**: Laravel's `notifications:seed-templates` reads the manifest +
  upserts `NotificationTemplate` rows. At send time,
  `Blade::render($template->body_rendered_html, $variables)` interpolates. **No
  Node in the PHP runtime.**

## 7. Delivery state machine

```
   NotificationDispatched
        │
        ▼
   [queued] ─── PreferenceResolver / DigestScheduler ──▶ [suppressed]  (opt-out / quiet-hours / digest-batched)
        │
        ▼
   [sending] ── channel module ─▶ [sent]
        │                              │
        │ (provider webhook, later)    │
        ▼                              ▼
    [failed] ◀────── retry     [delivered]
                                       │
                              (open pixel / click tracking)
                                       │
                                       ▼
                              [opened] ─▶ [clicked]
```

State transitions audited via `HasAuditable`. Retries via `RetryDeliveryJob`
(per-channel module) with exponential backoff **30s → 2m → 10m → 1h → 6h →
24h**, 6 attempts total. Non-retryable failures (hard bounce, unsubscribed,
invalid device token) don't retry.

## 8. Queue split

| Queue                    | Contents                                                              | SLA          |
| ------------------------ | --------------------------------------------------------------------- | ------------ |
| `notifications-critical` | security alerts, MFA challenges, safeguarding, invitation-first-touch | P95 < 5s     |
| `notifications`          | default — invitations, product, transactional                         | P95 < 30s    |
| `notifications-digests`  | `ProcessDigestJob` (scheduled)                                        | window-based |
| `notifications-webhooks` | provider webhook ingestion (in channel modules)                       | P95 < 10s    |

## 9. Preference resolver

Resolution order: user preference → tenant default (`settings.json`) → platform
default (`NotificationCategory.default_channels`).

- **quiet hours** — per-user timezone-aware window; deliveries held until window
  ends.
- **digest mode** — `immediate` (default for transactional), `daily` (08:00
  local), `weekly` (Monday 09:00 local), `off` (channel suppressed).
- **VPC gate** — under-consent-age subjects have marketing channels
  hard-suppressed until parental consent is captured (see foundation's
  `regulated_minor` data class).
- **critical bypass** — `priority=critical` bypasses digests + preferences
  (security alerts, safeguarding).

## 10. Digest batching

`NotificationDigest` collects notifications for a
`(user, category, channel, scheduled_for)` window. `ProcessDigestJob` fires at
each digest boundary + renders the accumulated notifications through a single
digest template (owned by this core:
`modules/notifications/emails/system/digest-daily.tsx`, `digest-weekly.tsx`).

- Timezone-aware per user's `timezone`.
- An empty digest at delivery time is skipped (no empty emails).
- `priority=critical` bypasses digests + delivers immediately.

## 11. Consent + compliance

Contract-level — evidence gathered in the channel modules (CAN-SPAM footer in
`notifications-mail`, TCPA in `notifications-sms`, COPPA VPC in
`notifications-push`, etc). Core enforces:

- **GDPR Art. 6/7/21** — lawful basis per category declared in registry; consent
  for marketing captured + revocable; unsubscribe honoured immediately.
- **GDPR Art. 8** — VPC gate for minors on marketing categories.
- **CCPA/CPRA §1798.120** — "Do Not Sell or Share" honoured across all channels.
- **WCAG 2.2 AA** — every SDUI screen (inbox, preferences, templates admin).

## 12. Retention

| Entity                     | Hot (searchable)  | Cold (archived) | Purge                                      |
| -------------------------- | ----------------- | --------------- | ------------------------------------------ |
| Notification               | 30d               | 90d             | 90d + soft delete → 30d grace → hard purge |
| NotificationDelivery       | 90d               | 1y              | 1y hard purge                              |
| NotificationTemplate audit | —                 | 7y              | 7y (SOC 2 CC8.1)                           |
| NotificationPreference     | while user active | —               | hard delete on user erasure                |
| NotificationDigest         | 30d               | —               | 30d hard delete                            |

## 13. Extending: consuming this module

1. Add your categories to your module's `notifications.json`:

```json
{
  "categories": [
    {
      "slug": "billing.invoice_paid",
      "display_name": "Invoice paid",
      "default_channels": ["mail", "in_app"],
      "priority": "transactional"
    }
  ]
}
```

2. Author the email template at `modules/<yourmodule>/emails/<category>.tsx`:

```tsx
import {
  Layout,
  Button,
  Footer,
} from "@stackra/notifications-emails-shared";

export default function InvoicePaid({ variables, tenant, recipient, locale }) {
  return (
    <Layout locale={locale} tenant={tenant}>
      <h1>Payment received</h1>
      <p>Hi {'{{ $recipient["name"] }}'} — your invoice is paid.</p>
      <Button href="{{ $variables['portal_url'] }}">View receipt</Button>
      <Footer tenant={tenant} category="billing.invoice_paid" />
    </Layout>
  );
}
```

3. Create a `Notification` class extending
   `Stackra\Notifications\Contracts\BaseNotification`:

```php
class InvoicePaidNotification extends BaseNotification {
    public string $category = 'billing.invoice_paid';
    public function payload(): array {
        return ['invoice_id' => $this->invoice->id, 'portal_url' => $this->invoice->portalUrl()];
    }
}
```

4. Dispatch: `$user->notify(new InvoicePaidNotification($invoice));`

Core handles the rest — template resolution, preference lookup, digest batching,
channel dispatch, delivery tracking, retry orchestration.

## 14. Microservice-ready discipline

The code is Laravel today; the design translates to NestJS + BullMQ + Redis
Streams later. Five rules:

1. Single dispatch entry point — `Notifications::dispatch()`.
2. Event-carried state — every payload includes recipient + tenant branding.
3. No cross-module DB reads — consumers subscribe to events + write their own
   state.
4. Channel modules are event-driven — no direct calls.
5. OpenAPI spec for every HTTP surface.

Trigger the extraction when notification volume exceeds ~100k/day OR 3+ Laravel
apps consume OR enterprise deployment-isolation requirement OR team hires around
TypeScript.

## 15. What this module does NOT do

- **Doesn't own transports.** Providers live in channel modules.
- **Doesn't own credentials.** Provider API keys in Doppler + read via
  `config/services.php` by channel modules.
- **Doesn't own push subscriptions.** `notifications-push` owns them.
- **Doesn't own mail suppression.** `notifications-mail` owns it.
- **Doesn't own sms opt-outs.** `notifications-sms` owns them.
- **Doesn't own tenant branding.** `tenants` (Branding + TenantContact) owns it;
  core reads it into the event payload at dispatch time.
- **Doesn't own consent capture.** `compliance` module captures; core reads via
  `PreferenceResolver`.
