# notifications-mail — changelog

## [Unreleased] — inception

Channel-driver module for the mail (email) notification transport. Registers
the `mail` channel with the parent notifications module's channel registry.

### Owned artefacts

- 1 aggregate: `MailSuppression` (hard-bounced / complained / manually-blocked
  email addresses; `tenant_id NULL` = platform-wide row).
- 1 channel driver: `MailChannel` (registers via `#[AsNotificationChannel]`).
- 1 attribute: `#[AsNotificationChannel]` — attribute-driven registration of
  the channel driver into the parent's `NotificationChannelRegistry`. Mirrors
  the sibling notifications-in-app copy verbatim.
- 4 tenant-facing actions: list / show / add / remove suppression.
- 1 central-plane action: `ReceiveMailWebhook` (public provider webhook
  receiver — signature-verified, dispatches ingest job).
- 5 commands: `notifications:mail:test-send`,
  `notifications:mail:reconcile-suppressions`,
  `notifications:mail:suppression-add`,
  `notifications:mail:suppression-remove`,
  `notifications:mail:prune-expired`.
- 3 jobs: `SendMailJob`, `IngestMailProviderWebhookJob`,
  `ReconcileSuppressionsJob`.
- 2 listeners: `HandleMailDispatch` (filters `channel = mail`) and
  `IngestMailProviderWebhookListener` (filters
  `webhook::InboundWebhookReceived` by namespace).
- 8 events: `MailSent`, `MailDelivered`, `MailOpened`, `MailClicked`,
  `MailBounced`, `MailComplaint`, `MailSuppressed`, `MailSuppressionRevoked`.
- 1 middleware: `verify.mail-webhook` — provider signature verification.
- 1 observer: `MailSuppressionObserver` — normalises + fires suppression events.

### Compatibility

- Depends on `foundation`, `tenancy`, `notifications` (core).
- Extended by no other module (leaf).

### Migration notes

None — inception release.
