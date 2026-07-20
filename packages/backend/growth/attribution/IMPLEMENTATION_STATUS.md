# growth/attribution — Phase 3 implementation status

## Status: PARTIAL — UTM/referrer/IP-hash extractors DONE (commit `f0f237f26`); ingest + rollup Actions + snapshot builder pending

## What landed

### Services (real implementations from commit `f0f237f26`)

- **`UtmExtractor` + Interface** — parses `utm_source`,
  `utm_medium`, `utm_campaign`, `utm_content`, `utm_term` from a
  request-bag / query string. Normalises to lowercase, trims,
  reject long values with a soft-cap (per GDPR data-minimisation
  discipline).
- **`ReferrerNormalizer` + Interface** — canonicalises the HTTP
  `Referer` header — strips query strings from Google, classifies
  known ad networks (Google, Facebook, Twitter, TikTok, Bing,
  LinkedIn) via an internal domain-list.
- **`IpHasher`** — SHA-256 with per-tenant salt for GDPR-safe
  ingestion. Real body landed via fixup `5117541b4`.
- **`AttributionContext`** — request-scoped VO carrying the merged
  UTM + referrer + click-ids + hashed-IP + device-parse.
  Consumed by `LeadAttributionSnapshotter` in the leads module via
  duck-typed `toSnapshot()`.

### Models (scaffolded, migrations complete)

- **`Attribution`** — first-touch + last-touch rollup per session.
- **`AttributionTouchpoint`** — individual touchpoint rows.

## What's pending

### Actions to complete (currently return `null`)

- **`CreateImportAction`** (POST `/attributions/import`) —
  server-to-server ingestion for bulk offline conversions. Rate-
  limited via `throttle:attribution-import` (register in routing
  boot hook).
- **`IngestUtmAction`** — the client-side beacon endpoint. Records
  a touchpoint from a browser `<script>` tag. Public route, IP-
  hashed.
- **`AttributeConversionAction`** — POST
  `/attributions/{attribution}/conversion`. Link a conversion
  (paid order / new athlete) back to its attribution chain.
- **`MergeAction`** — POST `/attributions/merge`. Merge two
  attribution rows when a user opts to link accounts / de-dup
  identities.
- **`ResetAction`** — POST `/attributions/{attribution}/reset`.
  GDPR erasure — the tenant admin's right-to-be-forgotten
  handoff. Uses `AttributionResolver::forget`.
- **`ListAttributionAction`** — GET `/attributions` — paginated
  read, tenant-scoped.
- **`ShowAttributionAction`** — GET `/attributions/{attribution}`.
- **`TouchpointsTouchpointAction`** — GET
  `/attributions/{attribution}/touchpoints`.
- **`ListRollupAction`** + **`ShowRollupAction`** —
  campaign / source / medium rollups. Route through the
  `CampaignRollupAggregator` service.
- **`ListConsentSuppressionAction`** — GET
  `/attributions/consent-suppressions` — for the DPO surface.

### Services to complete

- **`AttributionSnapshotBuilder`** — the write-side that freezes
  the current `AttributionContext` into a `LeadCaptured` or
  `OrderCreated`-linked snapshot. Currently a scaffold.
- **`AttributionProvisioner`** — orchestrates
  `Attribution` + `AttributionTouchpoint` writes atomically.
- **`AttributionResolver::forget(...)`** — GDPR erasure.
- **`MergeStrategy`** — the "when we link two identities, whose
  attribution wins" policy. Currently a stub.
- **`ClickIdExtractor`** — recognises `gclid`, `fbclid`, `msclkid`,
  `ttclid`, etc. Scaffold only.
- **`DeviceParser`** — parses `User-Agent` to
  `device_type` + `os` + `browser`. Scaffold; wire up
  `whichbrowser/parser` or `matomo-org/device-detector`.
- **`CampaignRollupAggregator`** — per-campaign / per-source
  aggregation with time-bucketed sub-totals. Scaffold.

### Cross-module dependencies

- **`growth/leads::LeadAttributionSnapshotter`** — currently
  duck-types `AttributionContextInterface::toSnapshot()`. Once
  the shape is locked, tighten the contract.
- **`finance/order::OrderCreated`** — should carry the
  attribution snapshot for revenue-attribution reports.
- **`sports/registrations`** — same for signup-attribution.
- **`compliance/consent::ConsentSuppression`** — respects opt-out
  suppression per tenant.

## Backlog priorities

1. **P0 — `IngestUtmAction`** — blocks the frontend `<script>`
   beacon.
2. **P0 — `AttributionSnapshotBuilder`** — the write-side for
   the leads module's snapshotter.
3. **P0 — `AttributionResolver::forget`** — GDPR erasure gap.
4. **P1 — `ListRollupAction` + `CampaignRollupAggregator`** —
   the FE marketing-analytics dashboard depends on it.
5. **P1 — `MergeAction`** — blocks the account-link flow in
   identity.
6. **P2 — click-id + device parsing** — the FE surface can
   ship without them for launch.
