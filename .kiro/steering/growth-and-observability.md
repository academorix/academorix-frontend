---
inclusion: fileMatch
fileMatchPattern: "modules/growth/**|modules/observability/**|**/analytics.json|**/marketing.json"
---

# Growth and observability lanes

The vocabulary lock-in for every "event fired somewhere" concern in the
Academorix backend. Five distinct lanes exist. They share primitives (events,
providers, MultipleInstanceManager, per-tenant configs, consent gates) but
answer different questions, serve different audiences, and have different
failure semantics. Confusing them is the #1 source of subtle bugs in
cross-cutting concerns — an event captured under the wrong lane gets the wrong
retention, wrong consent gate, wrong delivery guarantee, and wrong audit trail.

**When authoring any new module that fires or subscribes to events, first
identify which lane it lives in. The lane decides the module's shape.**

---

## 1. The five lanes

| Lane           | Owning module               | Question it answers                              | Audience                    | Volume                         | Loss tolerance                                 | Retention                 | Status                                                         |
| -------------- | --------------------------- | ------------------------------------------------ | --------------------------- | ------------------------------ | ---------------------------------------------- | ------------------------- | -------------------------------------------------------------- |
| **Monitoring** | `observability::monitoring` | Is my system healthy right now?                  | Ops / on-call               | Very high                      | High — sampled OK                              | 30d hot / 90d cold        | Backend deferred; frontend `@stackra/monitoring` shipped       |
| **Audit**      | `observability::audit`      | Who did what, when? (compliance-grade)           | Compliance, DPO, regulators | Medium                         | Zero                                           | 7 years min.              | Vendor `owen-it/laravel-auditing`; module blueprint deferred   |
| **Activity**   | `observability::activity`   | What happened recently in this tenant? (UX feed) | Tenant users                | Medium                         | Low                                            | 90d–1yr per tier          | Vendor `spatie/laravel-activitylog`; module blueprint deferred |
| **Analytics**  | `growth::analytics`         | How are users behaving in the product?           | Product, engineering        | High                           | Medium                                         | 2 years                   | Frontend `@stackra/analytics`; backend Wave 5                  |
| **Marketing**  | `growth::marketing`         | Which ad campaigns delivered which conversions?  | Marketing, finance, growth  | Low (business milestones only) | **Zero** — each event = paid conversion signal | 7 years (financial audit) | Wave 5                                                         |

Two supporting modules feed the growth tier:

| Supporting            | Feeds                             | Purpose                                                                                                               |
| --------------------- | --------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `growth::attribution` | marketing + analytics + referrals | Captures UTM + click IDs + first/last-touch metadata per subject at request boundary. Snapshotted at event-fire time. |
| `growth::referrals`   | marketing + finance               | Owns referral programs, referral codes, reward vesting. Emits marketing events as attributable conversions.           |

## 2. Decision tree — which lane is this?

Walk in order. Stop at the first "yes".

```
1. Is this a signal about SYSTEM HEALTH (error, latency, resource use)?
     yes → monitoring
     no  → continue.

2. Is this a compliance-grade record of an authorization decision or
   data mutation that a regulator/DPO might read?
     yes → audit
     no  → continue.

3. Is this a human-readable "recent activity" feed line for tenant users?
     yes → activity
     no  → continue.

4. Is this an ad-network conversion event that affects paid-ad
   optimization or ROAS reporting? (signup, trial, subscription,
   purchase, athlete_enrolled — business milestones)
     yes → marketing (captured from domain events by MarketingEventCapturer;
           NEVER fired directly from repositories or domain code)
     no  → continue.

5. Is this a fine-grained behavioral event about a user's product
   interaction (viewed screen, clicked button, completed step,
   funnel milestone)?
     yes → analytics
     no  → probably a plain domain event in the owning module's namespace.
```

Common mistakes:

- Firing analytics from a repository — repos never fire lane-4/lane-5 events.
  Domain services fire domain events; lane-specific listeners capture them.
- Using monitoring for user-behavior metrics — monitoring watches the SYSTEM,
  not the USER.
- Using audit for product-usage tracking — audit is legal evidence, not funnel
  analysis.
- Firing marketing events for every user click — marketing is business
  milestones only.

## 3. Why the lanes are separated

- **Different consent categories**: analytics consent ≠ marketing consent ≠
  advertising consent. GDPR + CCPA require granular opt-in per lane. Firing an
  analytics event under "marketing" consent is a compliance violation.
- **Different retention windows**: marketing 7 years (ad-spend audit); analytics
  2 years (rollup); monitoring 90 days; audit 7 years; activity 1 year. Storing
  all under one policy over-retains OR under-retains.
- **Different loss tolerance**: monitoring can sample. Analytics can drop on
  backpressure. Marketing must never drop — a lost event = wasted ad spend +
  broken attribution + support ticket.
- **Different audiences**: monitoring → ops. Audit → compliance. Activity → end
  users. Analytics → product. Marketing → marketing + finance.
- **Different failure treatment**: marketing needs per-provider retry with
  exponential backoff + circuit breaker + dead-letter queue. Analytics can drop
  on failure. Monitoring can retry-once. Same policy across all = wrong for all.

## 4. The shared shape — MultipleInstanceManager

Every lane that fans out to multiple providers uses Laravel's canonical
`Illuminate\Support\MultipleInstanceManager`. Frontend equivalents in
`@stackra/support`.

```
LaneManager (extends MultipleInstanceManager)
    → instance('provider_name') → LaneProviderInterface driver
    → createXxxDriver(config) → driver factory per provider
    → extend(name, factory) → runtime driver registration
```

Driver contract per lane:

```php
interface LaneProviderInterface
{
    public function name(): string;
    public function supports(LaneEventType $type): bool;
    public function dispatch(LaneEvent $event, LaneProviderConfig $config): DeliveryResult;
    public function transform(LaneEvent $event): array; // provider-native payload
}
```

Per-tenant provider configs live in `<lane>_provider_configs` tables with
encrypted credentials + `enabled_event_types` filter arrays + circuit-breaker
state + test-mode flags.

## 5. The event ledger + delivery ledger pattern

Every high-integrity lane (marketing, analytics with high-value events, audit)
uses a two-table ledger pattern:

- **`<lane>_events`** — canonical event record. One row per business event
  captured. Immutable after status='delivered'/'failed'/'suppressed'. Snapshots
  consent state + attribution at capture time.
- **`<lane>_deliveries`** — per-provider-per-attempt delivery log. One row per
  (event × provider × attempt). Contains request payload, response, HTTP status,
  error details.

Retention diverges: events retain longer (7 years for marketing); deliveries
retain shorter (2 years — support debugging window).

## 6. The manifest side — per-module `<lane>.json` files

Every module blueprint ships two manifest files declaring what LANE- tagged
events it publishes:

- `analytics.json` — analytics events this module emits (product usage)
- `marketing.json` — marketing events this module emits (conversions)

These are DECLARATIONS. The runtime substrate lives elsewhere:

- `analytics.json` declarations → consumed by `growth::analytics` substrate
- `marketing.json` declarations → consumed by `growth::marketing` substrate

Same pattern as `events.json` (declarations) → Laravel event dispatcher
(substrate), `notifications.json` (declarations) → notifications module
(substrate), `metrics.json` (declarations) → monitoring module (substrate).

The manifest shape:

```jsonc
{
  "id": "academorix://modules/<module>/<lane>",
  "$version": 1,
  "lane": "analytics", // or "marketing"
  "consentTiers": ["essential", "functional", "analytics"],
  "events": [
    {
      "name": "Athlete Created",
      "kind": "track",
      "consent_required": "functional",
      "properties": ["tenant_id", "branch_id", "age_bucket"],
      "provider_filter": null, // null = all active providers; or ["posthog","amplitude"]
      "description": "...",
    },
  ],
}
```

## 7. Consent gate — the pre-dispatch check

Every dispatch (across every lane) runs through `ConsentGate::allows()` BEFORE
the HTTP call. Suppressed events mark `delivery.status='suppressed_by_consent'`
and never touch the wire.

Consent categories used across lanes:

- `essential` — required for platform operation; cannot be revoked
- `functional` — feature-specific consent
- `analytics` — product-analytics event capture
- `marketing` — marketing tracking + email marketing
- `advertising` — ad-network conversion events (subset of marketing)
- `personalized_advertising` — targeted ad audience-building
- `ai_training` — data used for AI model training
- `minor_parental` — parental consent for under-13/under-16 subjects

Consent state is captured at event-CREATE time (snapshotted into
`<lane>_events.consent_snapshot` jsonb). Consent state is re-checked at
event-DISPATCH time — a user who revokes consent between capture and dispatch
has their pending events suppressed.

## 8. Attribution snapshot — captured, then frozen

The attribution module captures `AttributionContext` at request boundary via
`AttributionMiddleware` (reads cookies + query params). Every
marketing/analytics event snapshots the current attribution into its
`attribution` jsonb column at CREATE time.

Once snapshotted, the attribution on an event is IMMUTABLE. A subsequent
attribution reset (new UTM, new session, click on new campaign) does not change
historical events. That's what makes "how much revenue came from Campaign X
three months ago" a stable query.

## 9. Enforcement points

- **Migration review**: new tables that ship any of `event_type`, `provider`,
  `consent_snapshot`, `attribution` columns must declare their lane in a
  comment + wire through the appropriate module's `MultipleInstanceManager`.
- **Code review**: repositories never call `event(...)->dispatch()` with a
  marketing or analytics event class. Domain services fire domain events;
  lane-specific listeners route them.
- **Consent audit**: every `<lane>_events` row must carry a non-null
  `consent_snapshot` — an unsnapshotted event is an authoring bug (the capturer
  forgot the gate).
- **Retention audit**: `PurgeExpiredEventsJob` per lane runs nightly. Every lane
  has its own retention config (`config('<lane>.retention')`).

## 10. Cross-references

- `hierarchy.md` — canonical platform tree; growth + observability are sibling
  tiers below tenant.
- `tenancy-columns.md` §3 — every `<lane>_events`, `<lane>_deliveries`, and
  provider-config row carries `tenant_id`.
- `modules/observability/blueprints/audit/` — audit lane.
- `modules/observability/blueprints/activity/` — activity lane.
- `modules/observability/blueprints/monitoring/` — monitoring lane.
- `modules/growth/blueprints/attribution/` — attribution feeder.
- `modules/growth/blueprints/marketing/` — ad-network forwarder.
- `modules/growth/blueprints/analytics/` — behavioral event fan-out.
- `modules/growth/blueprints/referrals/` — viral-loop tracker.

## 11. Non-goals

- No universal "event bus" abstraction unifying all five lanes. The lanes
  deliberately have different shapes.
- No cross-lane fan-out in a single pipe. If a marketing event should also fire
  an audit row, TWO listeners handle it (one per lane).
- No shared retention config. Each lane owns its window.
- No shared consent category. Each lane maps to a distinct category.
- No shared circuit-breaker state. Meta being down for marketing does not pause
  PostHog for analytics.
- No client-side "just fire everything from JS" pattern. Every lane has
  server-side capture; the frontend is a secondary source.
- No PII in analytics without explicit hashing. Meta CAPI requires SHA256; every
  provider driver enforces its own hashing rules.
