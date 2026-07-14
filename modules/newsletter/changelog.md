# newsletter — changelog

## [Unreleased] — inception

- Newsletter platform authored. Five entities: Newsletter, NewsletterIssue, NewsletterSubscription, NewsletterCampaign, NewsletterAudience.
- Double-opt-in subscription flow with signed confirmation tokens.
- One-click unsubscribe (RFC 8058) via signed URLs.
- Audience segments via spatie query builder expressions.
- Reputation guardrails: open / click / bounce / complaint rate monitoring with auto-throttle on breach.
- Reuses notifications-mail for actual dispatch; notifications core for admin alerts.
- CAN-SPAM + CASL enforcement inherited from notifications-mail; adds publication-level opt-in evidence.

### Compatibility

- Depends on `foundation`, `workspaces`, `notifications`, `notifications-mail`, `activity`, `audit`, `settings`.
- No breaking change surface — inception release.
