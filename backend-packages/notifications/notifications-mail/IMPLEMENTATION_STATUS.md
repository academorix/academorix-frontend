# notifications/notifications-mail — Phase 3 implementation status

## Status: PARTIAL — channel driver + suppression list landed; provider transports pending

## What landed

- `AsNotificationChannel` attribute — marks the module's driver as
  discoverable by the notifications core's channel registry.
- `MailChannelDriver` — implements the channel-driver contract.
  Receives a `NotificationDispatched` event carrying the
  denormalised recipient (email + name + locale) + template variables
  + rendered HTML body.
- Suppression list — persistent `mail_suppressions` table honouring
  hard bounces, spam complaints, and unsubscribe events. Every
  outbound send consults the list first; suppressed addresses skip
  silently + emit `SendSuppressed`.

## What's pending

### Provider transports

- **Mailgun** — HTTP API + inbound-parse hook for bounce +
  complaint webhooks. Provider signature verification via
  `X-Mailgun-Signature` (HMAC-SHA256).
- **AWS SES** — SDK + SNS subscription for bounce + complaint +
  delivery notifications.
- **Postmark** — HTTP API + webhook for bounces + spam complaints.
- Symfony Mailer transport wiring — each provider selected via
  `MAIL_MAILER` env; sensible-default DSN in `config/mail.php` per
  provider.

### Actions to complete

- Provider webhook receivers (Mailgun / SES / Postmark) — mounted
  under `/api/webhooks/mail/{provider}` via
  `platform/webhook`'s inbound receiver. The per-namespace
  registration wires `mail:mailgun`, `mail:ses`, `mail:postmark`.
  Each provider handler:
  1. Verifies the provider signature.
  2. Parses the event into a canonical
     `MailProviderEvent` VO (`event_type`, `recipient`, `reason`,
     `bounced_at`).
  3. Updates the suppression list + emits
     `NotificationDelivered` / `NotificationFailed` / `MailBounced`
     / `MailSpamComplaint`.

### Domain events to dispatch

- `MailSent` — from `MailChannelDriver` after the provider API
  accepts the send.
- `MailBounced` — from the bounce webhook handler.
- `MailSpamComplaint` — from the complaint webhook handler.
- `MailSuppressionAdded` / `MailSuppressionRemoved` — administrative
  events.

### Cross-module dependencies

- **`notifications/notifications`** — the core dispatches
  `NotificationDispatched` and the mail driver listens.
- **`platform/webhook`** — the inbound receiver routes provider
  callbacks to this module.

## Backlog priorities

1. **P0 — Wire ONE provider transport end-to-end** (Mailgun
   recommended — best sandbox experience). Everything else can wait
   until a customer requests a specific provider.
2. **P0 — Bounce + complaint webhook handling** for the selected
   provider.
3. **P1 — Suppression list migration + wire-check on every send.**
4. **P2 — Multi-provider strategy for enterprise tenants.**
