# dunning

Retry + escalation ladder for failed recurring charges (memberships, tenant
subscriptions, marketplace fees). Not a collections agency — a retry engine
that gracefully degrades a paying customer to a non-paying one while giving
them plenty of chances to fix the payment.

## Owned tables

- `dunning_plans` — reusable retry-schedule + escalation-ladder templates. Per
  tenant. Referenced by memberships / subscriptions at charge time.
- `dunning_runs` — one row per triggered dunning cycle (a failed charge kicks
  off exactly one run against the failing entity). Tracks progress through the
  plan's steps.
- `dunning_events` — the timeline of a run: retry_attempted, retry_succeeded,
  retry_failed, notification_sent, escalated_step, cancelled, exhausted.

## Retry ladder (default)

```
Day 0   — charge fails, run created, immediate email to buyer
Day 3   — retry #1 + reminder email
Day 7   — retry #2 + firmer email + toast in app
Day 14  — retry #3 (final) + last-chance email
Day 15  — exhausted, membership suspended / subscription paused
Day 30  — access revoked, refund credit applied to any remaining wallet
```

Tenants override any step's timing + copy per plan.

## Cross-references

- `finance/membership` — creates a run on failed monthly charge.
- `billing/subscription` — creates a run on failed SaaS invoice.
- `finance/gateway` — retry attempts route through the active PaymentGatewayInterface.
- `notifications/notifications` — DunningReminderNotification per step.
- `entitlements/entitlements` — access revocation on exhausted.
