# stackra/newsletter

Editorial publication + audience management. Distinct from the transactional
notifications spine — newsletters are curated editorial content sent to a
consenting audience on a cadence. Ships five aggregates: `Newsletter` (the
publication), `NewsletterIssue` (an individual issue), `NewsletterSubscription`
(audience membership), `NewsletterCampaign` (a send event), and
`NewsletterAudience` (segment definition). Consumes
`stackra/notifications- mail` for outbound delivery, enforces CAN-SPAM +
CASL, ships one-click unsubscribe via signed URL, per-issue open + click
tracking, subscriber-growth analytics, and sender-reputation guardrails.
Priority `30` — loads after `notifications-mail` (26).

Blueprint: `modules/notifications/blueprints/newsletter/`.
