# `modules/notifications/` — notifications-service blueprints

The **delivery fan-out hub** — one channel-agnostic notification core plus
per-channel transports that subscribe to it. Every user-addressed message across
every product goes through this service.

Deploys to `academorix-backend/apps/notifications-service/` (see
[`apps/notifications-service/README.md`](../../../academorix/academorix-backend/apps/notifications-service/README.md)).

## Modules — on disk

| Module                                                      | Wave | Priority | Schemas | Purpose                                                                                                                                                                                                                   |
| ----------------------------------------------------------- | ---- | -------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`notifications/`](./notifications/readme.md)               | 2    | 20       | 6       | Channel-agnostic core: `Notification`, `NotificationCategory`, `NotificationTemplate`, `NotificationDelivery`, `NotificationPreference`, `NotificationDigest`. Publishes `NotificationDispatched` — transports subscribe. |
| [`notifications-mail/`](./notifications-mail/readme.md)     | 3    | 26       | 1       | Mail transport — subscribes to `NotificationDispatched`, renders + delivers via Postmark / SES.                                                                                                                           |
| [`notifications-push/`](./notifications-push/readme.md)     | 3    | 26       | 1       | Web + mobile push transport (FCM, APNs, VAPID).                                                                                                                                                                           |
| [`notifications-sms/`](./notifications-sms/readme.md)       | 3    | 26       | 1       | SMS transport (Twilio / Vonage).                                                                                                                                                                                          |
| [`notifications-in-app/`](./notifications-in-app/readme.md) | 3    | 26       | 1       | In-app inbox transport — writes to a tenant-scoped inbox table with read/unread state.                                                                                                                                    |
| [`newsletter/`](./newsletter/readme.md)                     | 6    | 35       | 5       | Publications, issues, audiences, campaigns, subscriptions. Composes `notifications` for send fan-out.                                                                                                                     |

**Total on disk: 6 modules, 15 schemas.**

## Why the core boots BEFORE its transports

Counterintuitive but correct: `notifications` is priority 20; every transport is
priority 26. That's because transports **depend on** the core (they subscribe to
`NotificationDispatched`), not the other way around. The core does not know its
transports exist at boot — it dispatches an event; whichever transports have
been booted will listen.

This is what makes each transport a **microservice-ready boundary**: an on-prem
install can ship the core + just `notifications-mail` and omit the other three
transports without any code change.

## Fan-out flow

```
[caller (any service via SDK)]
        │
        ▼
[notifications core]
   • preference resolver (respects consent + quiet hours)
   • template registry
   • digest scheduler
        │
        ▼
[Notification row + NotificationDispatched event]
        │
        ├─── notifications-mail   (listens)
        ├─── notifications-sms    (listens)
        ├─── notifications-push   (listens)
        └─── notifications-in-app (listens)
```

Each transport writes its own `NotificationDelivery` row keyed to the parent
`Notification`, so a single "your invoice is ready" send produces one
`Notification` row and up to four `NotificationDelivery` rows (one per
subscribed channel).

## Newsletter

Newsletter is priority 35 (Wave 6) — it composes the core rather than being part
of it. Rationale: newsletter's data model (publications, issues, audiences,
campaigns) is fundamentally different from transactional notifications. Merging
them would put a marketing-y CRUD surface next to the transactional core;
splitting keeps the core lean and lets newsletter evolve independently.

Newsletter's send path goes through the notifications core — same fan-out, same
transports.

## Cross-cutting invariants

- **Consent-aware** — marketing / newsletter sends check the recipient's
  `ConsentRecord` for the matching category (owned by `compliance/`) before
  dispatch. `#[ConsentRequired(category: 'marketing')]` on the job enforces this
  at dispatch time.
- **Queue-first** — every transport is `ShouldQueue`; Horizon supervises. The
  core writes the `Notification` row synchronously but dispatches the event
  after commit.
- **Preference-aware** — the resolver reads per-user `NotificationPreference`
  rows to decide which channels to send on. A category can be disabled per user
  without touching consent (consent is legal; preferences are UX).
- **Every entity is tenant-scoped.** Central-plane notifications (platform admin
  → all tenants) use `tenant_id = null` and a `platform_admin` guard on the
  dispatch path.

## For agents

**Extraction discipline** — the four transports look near-identical in shape
today. Resist the temptation to merge them: keeping them separate is what makes
each one deploy-swappable and on-prem-omittable.

Newsletter should NOT grow into a full email marketing platform. If a campaign
feature needs A/B testing, drip sequences, or advanced segmentation, that's a
separate module (or a third-party integration), not more newsletter tables.

## Related

- `../README.md` — master index.
- `.kiro/specs/platform-architecture/DECISION.md` §4 — module→service map.
- `.kiro/steering/hierarchy.md` §6 — module responsibility map.
- `../compliance/README.md` — consent categories consumed by this tier.
