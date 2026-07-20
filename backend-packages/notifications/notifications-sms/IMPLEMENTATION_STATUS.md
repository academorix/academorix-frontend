# notifications/notifications-sms — Phase 3 implementation status

## Status: SCAFFOLDED — module skeleton landed; provider transports pending

## What landed

- Module scaffold + service provider + config file
  (`config/notifications-sms.php`).
- `AsNotificationChannel` attribute stub.

## What's pending

### Services + jobs

- **Twilio transport** — `SmsChannelDriverTwilio` wrapping
  `twilio/sdk`. `Account SID` + `Auth Token` + optional
  `Messaging Service SID` from Doppler.
- **MessageBird transport** (secondary) — `SmsChannelDriverMessageBird`
  wrapping the MessageBird SDK. Preferred for EU tenants
  (GDPR + local number pool).
- **Signature verification** for provider callback webhooks:
  Twilio's `X-Twilio-Signature` (HMAC-SHA1 over the sorted-param
  string) + MessageBird's `MessageBird-Signature` (JWT + HMAC-SHA256).
- Fallback + cost governance — per-tenant monthly cap +
  `sms_message_log` row per attempt for billing reconciliation.

### Actions to complete

- Provider webhook receivers (`/api/webhooks/sms/{provider}`) —
  same pattern as `notifications-mail`. Handle delivery receipts +
  bounces. Route via `platform/webhook`'s inbound receiver.
- Opt-out receiver — inbound SMS reply parsing (STOP / UNSUBSCRIBE
  / HELP) — mandatory per US 10DLC + UK OFCOM regs.

### Domain events

- `SmsSent` — after provider API accepts the send.
- `SmsDelivered` — from the delivery-receipt webhook.
- `SmsBounced` / `SmsUndelivered` — from failure webhooks.
- `SmsOptedOut` — from the inbound STOP parser. Adds an entry to
  the `notifications-consent` suppression list.

### Cross-module dependencies

- **`notifications/notifications`** — receives
  `NotificationDispatched`.
- **`notifications/notifications-consent`** (planned) —
  suppression list is shared across channels; SMS opt-outs land
  there via `notifications.consent.suppress`.
- **`platform/webhook`** — routes provider callbacks.

## Backlog priorities

1. **P0 — Twilio wire-up** (blocks 2FA SMS + tenant-configured
   transactional SMS).
2. **P0 — Delivery-receipt webhook handling.**
3. **P0 — Opt-out compliance** (STOP / HELP handlers) — regulatory
   requirement.
4. **P1 — Per-tenant cost cap enforcement.**
