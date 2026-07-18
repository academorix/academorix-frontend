# newsletter — changelog

## [Unreleased] — inception

Editorial publication + audience management module. Ships five aggregates and
the full CAN-SPAM + CASL enforcement surface. Consumes `academorix/notifications-
mail` for outbound delivery; itself is NOT a channel driver.

### Owned artefacts

- 5 entities: `Newsletter` (the publication), `NewsletterIssue` (an issue with
  content + schedule), `NewsletterSubscription` (audience membership),
  `NewsletterCampaign` (a send event), `NewsletterAudience` (segment
  definition).
- 5 policies + 5 observers — one per aggregate.
- 19 domain events covering the entire editorial + send lifecycle.
- 9 background jobs — orchestrator, per-batch sender, audience builder,
  importers, exporters, engagement tracker, reputation reporter, pruner,
  confirmation processor.
- 7 Artisan commands — send-scheduled, refresh-audiences, import, export,
  reputation-report, prune-unengaged, test-send.
- 4 domain services — orchestrator + audience evaluator + subscriber growth
  tracker + reputation monitor.
- Tenant-facing REST surface for full CRUD on every aggregate + lifecycle
  actions (schedule, send-now, cancel, pause, resume, archive).
- Central-facing REST surface for public subscribe / confirm / unsubscribe with
  signed HMAC tokens + RFC 8058 List-Unsubscribe-Post support.
- 3 admin notification classes — campaign completed, reputation alert,
  subscribe confirmation.

### Compatibility

- Depends on `foundation`, `tenancy`, `notifications` (core), `notifications-
  mail`, `activity`, `audit`, `settings`.
- Extended by no other module (leaf).

### Migration notes

None — inception release.
