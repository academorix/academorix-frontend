# notifications-mail

The mail channel. Wraps Laravel Mail (MailManager) + adds the
notification-specific concerns Laravel doesn't ship.

> **Position in the wave.** Wave 1 channel module. Depends on `foundation`,
> `tenants`, `notifications` (core).

## 1. What this channel adds on top of Laravel Mail

- **Template resolution** — reads `NotificationTemplate.body_rendered_html`
  (pre-rendered React Email + Blade placeholders) + interpolates at send with
  `Blade::render()`. No Node in the runtime.
- **CAN-SPAM footer** — auto-injects the tenant's postal address into every mail
  (from `settings.json`'s `sender.postal_address`).
- **RFC 8058 `List-Unsubscribe-Post` header** — one-click unsubscribe honoured
  by every mainstream inbox (Gmail, Apple Mail, Outlook).
- **Provider webhook ingestion** — Mailgun HMAC-SHA256, SendGrid Ed25519, SES
  SNS, Postmark Basic, Resend Bearer. Normalises into `NotificationDelivery`
  state transitions.
- **Hard-bounce suppression** — `MailSuppression` entity records
  permanently-invalid addresses. `SendMailJob` refuses to send to a suppressed
  address.
- **Per-provider observability** — send latency, delivery rate, bounce rate,
  cost per send.

## 2. What this module owns

| Concern                                                         | Entity            |
| --------------------------------------------------------------- | ----------------- |
| Suppressed email addresses (hard bounces + complaints + manual) | `MailSuppression` |

That's it. One entity. Everything else is core.

## 3. Providers

Delegates to Laravel Mail's `MailManager`. Built-in Laravel drivers cover
Mailgun, SendGrid, SES, Postmark, Resend, SMTP, log, array, failover, and
roundrobin. Add a custom driver by extending `MailManager::extend()` in a
service provider.

Per-tenant provider selection via
`config('notifications-mail.categories.{category_slug}.mailer')` — e.g.
transactional via SES, marketing via SendGrid, all within the same tenant.

## 4. Delivery pipeline

```
NotificationDispatched (channel=mail)
        │
        ▼
   HandleMailDispatch listener
        │
        ▼
   SendMailJob (queue=notifications)
        │
        ├── check MailSuppression → refuse if suppressed
        ├── resolve NotificationTemplate → Blade::render(body_rendered_html, vars)
        ├── inject CAN-SPAM footer + List-Unsubscribe header
        ├── Mail::mailer(driver)->send()
        │
        ▼
   MailSent event (delivery.state=sent, provider_message_id captured)
        │
        │  (later, provider webhook arrives)
        ▼
   POST /webhooks/notifications/mail/{provider}
        │  (signature verified)
        ▼
   IngestMailProviderWebhookJob
        │
        ▼
   MailDelivered / MailOpened / MailClicked / MailBounced / MailComplaint
        │
        ▼
   NotificationDelivery.state advances + emits core NotificationDelivered/Failed
```

## 5. Retry semantics

- Transient provider errors (5xx, timeout, rate limit) — retryable via
  `RetryDeliveryJob` from core with backoff `[30s, 2m, 10m, 1h, 6h, 24h]`.
- Hard bounce — non-retryable. Address added to `MailSuppression`. Future sends
  to that address refused.
- Complaint (spam report) — non-retryable. Address added to `MailSuppression`
  with reason=`complaint`. Regulatory evidence retained P5Y.

## 6. CAN-SPAM + CASL compliance

- Footer contains tenant's postal address (mandatory under §7704(a)(4)).
- `List-Unsubscribe-Post: One-Click` header on every mail (RFC 8058).
- One-click unsubscribe link routes to core's
  `/api/notifications/unsubscribe/{token}` (signed URL).
- Marketing-priority sends refused to Canadian recipients without express
  consent (CASL s. 6).
- Every sent mail carries the category slug in `X-Academorix-Category` header
  for provider-side filtering.

## 7. Files

```
notifications-mail/
├── module.json         readme.md            changelog.md
├── traits.json         relations.json       routes.json           middleware.json
├── events.json         listeners.json       observers.json
├── jobs.json           schedule.json        commands.json
├── policies.json       permissions.json     features.json         entitlements.json
├── health.json         metrics.json         analytics.json        caches.json          retention.json
├── compliance.json     data-classes.json    errors.json
├── subprocessors.json  webhooks.json        feature-flags.json    config.json          settings.json
├── schemas/mail-suppression.schema.json
├── sdui/readme.md      sdui/resources/mail-suppression/{list,show}.screen.json
└── emails/             (React Email components + system templates \u2014 see task 12)
```
