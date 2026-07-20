# growth/marketing — Phase 3 implementation status

## Status: SCAFFOLDED — models + migrations landed; every Action returns `null`

## What landed

- `MarketingCampaign`, `MarketingEvent`, `AudienceSegment`, and
  `SegmentMembership` models. `MarketingEvent` is the
  denormalised event feed the ad-network integrations write to
  (`event_type=signup / paid_conversion / trial_start / churn`).
- Attribute-first migrations for each table with `tenant_id` +
  full audit-user columns.
- `#[AsRepository]` repositories.
- Permission enum + factories + seeder.
- Blueprint-emitted Action stubs (every one returns `null`).

## What's pending

### Actions to complete

- **`CreateCampaignAction`** — POST `/campaigns`. Configures
  audience segment + email template id + send-time schedule.
- **`UpdateCampaignAction`** — pre-send edits only. Sent
  campaigns are immutable — enforced by the model observer.
- **`ScheduleCampaignAction`** — POST `/campaigns/{id}/schedule`.
  Fans out to the segment via
  `notifications::DispatchNotificationAction` (per audience
  member). Rate-limited to prevent inbound-provider throttling.
- **`PauseCampaignAction`** / **`ResumeCampaignAction`** —
  operator kill-switch.
- **`ReportAction`** — GET `/campaigns/{id}/report`. Open /
  click / conversion metrics (routes through
  `MarketingEventCapturer`).
- **`ListCampaignAction`** + **`ShowCampaignAction`** — CRUD read.
- **`DeleteCampaignAction`** — soft-delete only if never sent.

### Segments Actions

- **`CreateSegmentAction`** — audience configuration. Filter
  criteria on the `AudienceSegment.filter_criteria` JSONB
  column (referrer / user attribute / activity / attribution).
- **`RefreshSegmentAction`** — POST `/segments/{id}/refresh`.
  Recompute `SegmentMembership` rows from the filter criteria.
  Runs as a queued job.
- **`EstimateSizeAction`** — POST `/segments/{id}/estimate`.
  Dry-run count without persisting membership rows.
- **`ListSegmentAction`** + **`ShowSegmentAction`** — CRUD read.

### Services to complete

- **`SegmentBuilder`** — compiles the filter criteria JSON into a
  builder against `identity/user` + related tables. Scaffold.
- **`SegmentRefresher`** — recomputes memberships; runs as
  `RefreshSegmentJob`.
- **`CampaignScheduler`** — batches sends into rate-limit-safe
  windows.
- **`MarketingEventCapturer`** — writes to `marketing_events` from
  the tracked notification opens / clicks.
- **`AdNetworkFanoutInterface`** — the abstraction over
  Google Ads / Facebook Pixel / TikTok / LinkedIn conversion APIs.
  Every driver ships a `pushConversion($event)` method.

### Events

- `CampaignScheduled`, `CampaignSent`, `CampaignPaused`,
  `SegmentRefreshed`, `MarketingEventCaptured`,
  `AdNetworkConversionPushed`.

### Cross-module dependencies

- **`notifications/notifications`** — every send fans out through
  the notifications module.
- **`growth/attribution`** — a `MarketingEvent` carries the
  attribution snapshot at capture time.
- **`identity/user`** — segment filter criteria read user shape.
- **`compliance/consent`** — respect marketing-consent opt-outs.

## Backlog priorities

1. **P0 — `CreateSegmentAction` + `RefreshSegmentAction`** —
   segments are the prereq for every campaign.
2. **P0 — `CreateCampaignAction` + `ScheduleCampaignAction`** —
   the base outbound path.
3. **P1 — `MarketingEventCapturer`** — closes the analytics
   loop.
4. **P2 — ad-network fan-out drivers** — start with Google Ads
   + Meta; add TikTok / LinkedIn after.
