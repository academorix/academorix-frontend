# `stackra/notifications-sms`

SMS notification channel for Stackra — Twilio, MessageBird, Vonage, Plivo,
and AWS SNS. Enterprise-day-1 shape: attribute-first DI, `#[Bind]` on
interfaces, `#[UseModel]` on repositories, `#[Cacheable]` + `#[Filterable]`
config, `SeedsPermissionEnum` trait, no property arrays on the provider.

## What it owns

- **`SmsOptOut` aggregate** — TCPA + CASL evidence-grade unsubscribe records.
  Tenant-scoped `optional` (platform-wide opt-outs live with
  `tenant_id = NULL`). Phone stored E.164 + hashed on GDPR erasure.
- **`SmsTransportManager`** — MultipleInstanceManager wrapping the five
  supported providers.
- **`SmsChannel`** — registered with the core notifications channel registry
  under slug `sms`.
- **STOP-keyword processing** — inbound SMS routed through the webhook module
  triggers `SmsOptedOut` events; START-keyword replies revoke prior opt-outs per
  CTIA rules.
- **Cost tracking** — `cost_micro_units` recorded per delivery; monthly cost cap
  prevents runaway spend.
- **Priority 28** — after push (27).

## Non-goals

- SMS templating — the notifications core module owns the template surface.
- Provider webhook receiver — delegated to `stackra/webhook`. This module
  ships only the per-provider signature strategies + inbound-message handler.

## Compliance

- **TCPA** — every opt-out is immutable + audit-logged. Revoking a
  `stop_keyword` opt-out requires super_admin + explicit re-consent evidence.
- **CASL** — same shape; Canadian anti-spam evidence.
- **GDPR Art. 17** — on user erasure, phone becomes SHA-256 hash; opt-out row
  retained as regulatory evidence.
- **CTIA** — STOP / START keyword auto-replies configurable per tenant.
