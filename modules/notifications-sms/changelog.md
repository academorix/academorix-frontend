# notifications-sms — changelog

## [Unreleased] — inception

- SMS notification channel authored. Wraps Twilio / MessageBird / Vonage / Plivo / AWS SNS.
- Owns `SmsOptOut` entity for TCPA + CASL evidence.
- STOP-keyword processing via webhook module inbound.
- Cost tracking per message with destination-country awareness.
- Per-provider kill switches.

### Compatibility

- Depends on `foundation`, `workspaces`, `notifications` (core), `webhook`.
- No breaking change surface — inception release.
