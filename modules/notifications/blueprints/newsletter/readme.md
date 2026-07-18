# newsletter

Editorial publication + audience management. Wave 3 infrastructure.

## 1. What this module owns

| Concern                                            | Owned artefact                                                      |
| -------------------------------------------------- | ------------------------------------------------------------------- |
| Publication (a newsletter as an editorial concept) | `Newsletter`                                                        |
| Individual issue with content + schedule           | `NewsletterIssue`                                                   |
| Audience membership                                | `NewsletterSubscription` (double-opt-in)                            |
| Send event                                         | `NewsletterCampaign`                                                |
| Segment definition                                 | `NewsletterAudience`                                                |
| Signed subscribe / confirm / unsubscribe URLs      | `NewsletterTokenSigner` binding                                     |
| Reputation guardrails                              | `ReputationMonitor` binding (opens + clicks + complaints + bounces) |

## 2. Newsletter vs Notification

They share transport (mail) but serve different intents:

| Dimension   | Notification                                                 | Newsletter                                           |
| ----------- | ------------------------------------------------------------ | ---------------------------------------------------- |
| Trigger     | Event-driven (invitation.sent, invoice.paid, security_alert) | Editorial cadence (weekly digest, one-off broadcast) |
| Audience    | Recipient of the event                                       | Members of an audience segment                       |
| Consent     | NotificationPreference toggle                                | Explicit subscription with double-opt-in             |
| Content     | Template + variables from event                              | Free-form editorial content                          |
| Unsubscribe | Turns off a category-channel                                 | Removes from the publication's audience              |
| Retention   | Per-plan                                                     | Retained while publication active                    |

## 3. Subscription flow (double-opt-in)

```
POST /newsletters/{slug}/subscribe   { email, ... }
    ↓
    NewsletterSubscription(state=pending_confirmation, confirmation_token=<signed>)
    ↓
    Confirmation email sent via notifications-mail
    ↓
GET /newsletters/{slug}/confirm/{token}
    ↓
    NewsletterSubscription(state=active, confirmed_at=now())
    ↓
    NewsletterSubscriptionConfirmed event fires
```

Unconfirmed subscriptions pruned after 30 days via
`PruneUnengagedSubscribersJob`. Double-opt-in is TCPA + CAN-SPAM best practice +
heavily improves deliverability.

## 4. Send flow

```
NewsletterCampaign scheduled (targeting an audience)
    ↓
Cron picks it up at scheduled_at
    ↓
SendNewsletterCampaignJob
    ├── Evaluate audience → list of subscription_ids
    ├── Chunk into batches of send_batch_size
    ├── For each batch: dispatch SendNewsletterIssueBatchJob
    └── Track state on campaign (in_progress → completed)

SendNewsletterIssueBatchJob (per batch)
    ├── For each subscription:
    │     ├── Check MailSuppression (notifications-mail)
    │     ├── Check NotificationPreference (marketing.newsletter category)
    │     ├── Render issue body from React Email template + variables
    │     ├── Inject one-click unsubscribe headers (List-Unsubscribe + List-Unsubscribe-Post)
    │     └── Dispatch notifications-mail's SendMailJob
    └── Update campaign counters
```

## 5. Audience evaluation

`NewsletterAudience.expression` is a spatie/laravel-query-builder expression
evaluated against `NewsletterSubscription` (filtered to that newsletter).
Refreshed daily via `BuildAudienceSegmentJob` (cached; explicit refresh on
manual save).

Examples:

- `{ filter: { state: 'active', locale: 'en', tags: { in: ['premium'] } } }`
- `{ filter: { engagement_score: { gte: 50 }, subscribed_at: { gte: '2025-01-01' } } }`

## 6. Reputation guardrails

`ReputationMonitor` samples every campaign completion:

- Open rate < `reputation.min_open_rate` (default 10%) → alert
- Click rate < `reputation.min_click_rate` (default 1%) → alert
- Complaint rate > `reputation.max_complaint_rate` (default 0.3%) → block
  further sends until reviewed
- Bounce rate > `reputation.max_bounce_rate` (default 5%) → block further sends
  until list cleanup

Every alert fires `NewsletterReputationAlert` + notifies admin. Repeated
breaches auto-pause the newsletter with `state=throttled` until manual review.

## 7. Files

Standard blueprint. Schemas: 5 entities.

## 8. What this module does NOT do

- **Doesn't own the mail transport.** Sends flow through `notifications-mail`.
- **Doesn't own suppression.** `MailSuppression` (notifications-mail) is
  authoritative — checked before every send.
- **Doesn't own preference toggles.** `NotificationPreference` (notifications)
  is authoritative — checked before every send.
- **Doesn't ship a newsroom rich-text editor.** The `create` / `edit` SDUI
  screens delegate to a caller-provided editor (frontend chooses TipTap /
  Lexical / plain markdown).
