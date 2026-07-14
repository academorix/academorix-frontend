# notifications-sms

SMS notification channel. Wave 1. Owns `SmsOptOut` entity + own `MultipleInstanceManager` for Twilio / MessageBird / Vonage / Plivo / AWS SNS.

## 1. What this module owns

| Concern | Owned artefact |
| --- | --- |
| Opt-out records (STOP responses + admin blocks) | `SmsOptOut` |
| Provider abstraction | `SmsTransportManager` (extends `Illuminate\Support\MultipleInstanceManager`) |
| Cost tracking + budget enforcement | `SmsCostCalculator` binding |
| STOP-keyword inbound processing | Listens to `webhook::InboundWebhookReceived` (namespace=notifications-sms) |

## 2. TCPA + CASL compliance

SMS is heavily regulated. This module enforces:

- **TCPA (US)** — express written consent for marketing; STOP keyword processing within 24h (spec says "immediately"; we do it in seconds); Do-Not-Call Registry alignment when applicable.
- **CASL (Canada)** — same as mail. Marketing sends refused without express consent captured by compliance module.
- **CTIA short-code guidelines** — HELP + STOP keyword handling.
- **STIR/SHAKEN** — voice concern primarily; SMS not directly affected but sender-id auth aligns with carrier expectations.

STOP-keyword processing: when an inbound webhook arrives with body matching STOP / STOPALL / END / QUIT / CANCEL / UNSUBSCRIBE (case-insensitive, per CTIA), the module:

1. Creates SmsOptOut(phone, reason=stop_keyword, provider=twilio|...).
2. Fires `SmsOptedOut` event.
3. Cross-channel: propagates to NotificationPreference (channel=sms enabled=false) so ALL categories are opted out, not just marketing.
4. Sends automatic confirmation via provider (Twilio requires "You have been unsubscribed. No more messages will be sent.").

## 3. Cost tracking

Every send captures `cost_micro_units` from provider (Twilio: `price`, MessageBird: `mccmnc.price`, etc.). Aggregated per workspace per destination country + surfaced on the admin dashboard. Cost-cap entitlement (`notifications.sms.cost-cap.monthly_micro_units`) refuses sends when workspace would exceed.

Destination-country pricing varies drastically (US $0.0079, UK £0.04, India ₹0.20). Workspace admins configure per-country allow-list to prevent accidental international spend.

## 4. Files

Standard blueprint. Schemas: 1 entity (`sms-opt-out`).
