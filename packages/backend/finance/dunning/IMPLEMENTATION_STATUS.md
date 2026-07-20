# finance/dunning — Phase 3 implementation status

## Status: SCAFFOLDED — Actions return `null`

## Implementation plan

Dunning is the retry ladder for failed recurring charges (memberships).
When a subscription renewal fails, this module runs the tenant's
configured retry cadence + escalation (email → SMS → in-app → suspension).

### The retry ladder (per tenant policy — `settings.dunning.*`)

```
Attempt 1 — at failure                 → Email
Attempt 2 — +3d                         → Email
Attempt 3 — +7d                         → Email + SMS
Attempt 4 — +14d                        → Push + In-app
Attempt 5 — +21d                        → Human intervention (admin queue)
Attempt 6 — +30d                        → DunningRunExhausted → membership suspend
```

Every step retries the payment via `finance/payment::RetryPaymentAction`.
Success at any step exits the run.

### Actions to fill (12 total)

Standard CRUD on `dunning_runs` + admin action endpoints:

- `ListDunningRunAction` — filters: status, membership_id, next_retry_at.
- `ShowDunningRunAction`
- `TriggerRetryAction` — POST /dunning-runs/{run}/retry — admin-forced retry.
- `SkipDunningRunAction` — POST /dunning-runs/{run}/skip — admin waives.
- `PauseDunningRunAction` / `ResumeDunningRunAction` — admin holds during
  investigation.
- `AbandonDunningRunAction` — POST /dunning-runs/{run}/abandon — admin
  gives up early, triggers `DunningRunExhausted`.

### Support services

- `DunningScheduler` (Services/, queued cron every 15min) — reads
  `dunning_runs` where `next_retry_at <= now` and dispatches
  `RetryDunningRunJob` for each. The job runs one retry step + updates
  `next_retry_at` per the tenant's cadence.
- `DunningPolicyResolver` (Services/) — reads the tenant's cadence config
  from `settings.dunning` and produces the next retry interval + channel
  for a given step number.
- `DunningNotifier` (Services/) — routes to `notifications` with the right
  template per step + channel.

### Events

- `DunningRunStarted` — first attempt after `PaymentFailed`.
- `DunningRunRetried` — every subsequent step.
- `DunningRunResolved` — a retry succeeded.
- `DunningRunExhausted` — ladder exhausted → `entitlements::RevokeMembership`.
- `DunningRunAbandoned` — admin gave up.

### Entitlement revocation cascade

`DunningRunExhausted` fires `MembershipSuspended` in `finance/membership`
+ `EntitlementRevoked` in `entitlements`. Access disappears immediately
(guest sessions kept alive with reduced permissions).
