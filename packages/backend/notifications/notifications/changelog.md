# notifications — changelog

All notable changes to this module.

## [Unreleased] — inception

- Multi-channel notification substrate authored per the module architecture
  blueprint.
- Owns 7 entities: Notification, NotificationDelivery, NotificationTemplate,
  NotificationPreference, NotificationSubscription, NotificationDigest,
  NotificationCategory.
- Ships 5 channels: mail (Mailgun / SendGrid / AWS SES), sms (Twilio /
  MessageBird), push (FCM / APNs), in_app (database + broadcast), broadcast
  (Pusher / Ably).
- Consumes categories from every downstream module's `notifications.json` — no
  hardcoded category list here.
- Delivery state machine with exponential retry backoff + bounce classification
  (soft / hard).
- Preference resolver: user → tenant default → platform default; quiet hours;
  digest windows; VPC gate for minors.
- Digest batching per (user, category, channel, window).
- Templates: versioned + locale-scoped + per-channel; MJML for mail with WCAG
  2.2 AA layout.
- Provider webhook ingestion with signature verification per provider.
- Retention windows sized per foundation's data-class taxonomy + SOC 2 change
  management + GDPR Art. 5.
- Consent + compliance: CAN-SPAM, CASL, GDPR Art. 6/7/21, COPPA / GDPR Art. 8
  minor gating, WCAG 2.2 AA.

### Compatibility

- Depends on `foundation` (traits, health substrate, error envelope, cache
  namespaces, retention tiers, data-class taxonomy).
- Depends on `tenants` (BelongsToTenant, BelongsToApplication, host resolution,
  TenantContact for billing footer).
- No breaking-change surface — inception release. Every category slug + template
  key + preference row is greenfield.
