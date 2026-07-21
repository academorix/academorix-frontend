# Changelog

All notable changes to `stackra/notifications-sms`.

## [Unreleased]

### Added

- Initial scaffolding — enterprise-day-1 shape (attribute-first DI, `#[Bind]` on
  interfaces, `#[UseModel]` + `#[Cacheable]` + `#[Filterable]` on the
  repository, `SeedsPermissionEnum` seeder, `HydratesFrom`-driven provider
  registry).
- `SmsOptOut` model + migration + factory + policy + observer.
- Twilio / MessageBird / Vonage / Plivo / AWS SNS transport scaffolding.
- STOP-keyword + START-keyword + HELP keyword catalogues in config.
- Signature strategies for provider webhooks: TwilioSignatureStrategy,
  MessageBirdSignatureStrategy, VonageSignatureStrategy, PlivoSignatureStrategy,
  AwsSnsSignatureStrategy.
