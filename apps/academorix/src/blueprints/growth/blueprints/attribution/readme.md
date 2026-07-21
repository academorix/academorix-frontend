# attribution

Marketing attribution capture + lifetime source-tracing. Wave 5 growth-tier
feeder for marketing + analytics + referrals + finance + notifications.

## 1. What this module owns

| Concern                         | Owned artefact                                                                                      |
| ------------------------------- | --------------------------------------------------------------------------------------------------- |
| Per-subject attribution profile | `Attribution` — rolling profile with first/last-touch snapshots, session state, lifecycle stage.    |
| Append-only touchpoint ledger   | `AttributionTouchpoint` — one row per attribution-bearing request. Never mutated after commit.      |
| Request-boundary capture        | `AttributionMiddleware` — extracts UTM + click IDs + referrer + landing page at HTTP boundary.      |
| Request-scoped context          | `AttributionContext` — bound per-request so domain code reads current attribution without a DB hop. |
| Immutable snapshot builder      | `AttributionSnapshotBuilder` — freezes current attribution into a jsonb blob for downstream events. |
| Click-ID extraction             | `ClickIdExtractor` — parses gclid / fbclid / ttclid / msclkid / sccid from cookies + query params.  |
| UTM extraction                  | `UtmExtractor` — utm_source / medium / campaign / content / term from cookies + query params.       |
| Cross-device merge              | `MergeStrategy` — merges anonymous profiles into an identified profile at signup/login time.        |
| Campaign performance rollup     | `CampaignRollupAggregator` — hourly pre-aggregation into a rollup cache for dashboards.             |
| PII protection                  | `IpHasher` (SHA-256), `DeviceParser` (UA parsing without raw storage).                              |

### 1.1 The two owned tables

- `attributions` — the per-subject profile. Belongs to `Tenant`. Polymorphic
  subject via `subject_type` + `subject_id` (user / athlete / lead /
  anonymous_session). Composite unique on (tenant_id, subject_type, subject_id)
  partial WHERE deleted_at IS NULL.
- `attribution_touchpoints` — the append-only ledger. Belongs to `Tenant` +
  `Attribution`. Denormalises subject + campaign for direct index-driven
  queries. NO soft-delete (append-only).

Neither carries `application_id`, `region_id`, `organization_id`, `branch_id`,
or `scope_node_id` — all cascade through `tenant_id` per tenancy-columns.md §5.
Attribution does NOT participate in the scope substrate — it's operational data,
not configuration.

## 2. Tier gating

Attribution capture is the feature gate for the whole growth tier feeder. Every
tier gets baseline capture; Enterprise unlocks cross-device merge + CSV import +
extended retention.

- **Small** — `attribution_capture` on. Only gclid + fbclid captured
  (`attribution_click_ids_advanced` off). Campaign rollup off. 2-year touchpoint
  retention.
- **Medium** — Adds `attribution_click_ids_advanced` (msclkid + sccid) +
  `attribution_rollup` (campaign performance dashboards).
- **Enterprise** — Adds `attribution_merge` (cross-device profile merging) +
  `attribution_import` (bulk CSV import from external CRM) +
  `attribution_touchpoint_retention_extended` (7-year retention for financial
  audit alignment).

Entitlement keys are:

- `attribution_capture` (boolean, all tiers) — master feature gate. Off =
  middleware becomes a no-op.
- `attribution_click_ids_advanced` (boolean, Medium+)
- `attribution_rollup` (boolean, Medium+)
- `attribution_merge` (boolean, Enterprise)
- `attribution_import` (boolean, Enterprise)
- `attribution_touchpoint_retention_extended` (boolean, Enterprise)

## 3. The capture lifecycle

```
Request boundary
      │
      ▼
AttributionMiddleware
      │  reads:
      │    query params (?utm_source=…, ?gclid=…)
      │    cookies (_utm, _gclid, _fbclid, _ttclid, _msclkid, _sccid, _session_id)
      │    Referer header
      │    User-Agent
      │    IP address
      │
      ├──▶ ConsentGate::allows('marketing')?
      │
      │   NO  → AttributionContext holds session_id + hashed_ip only;
      │         emit AttributionSuppressedByConsent; NO PERSISTENCE.
      │
      │   YES → AttributionResolver.findOrCreate(subject) →
      │         (first request) attributions row created + AttributionCreated +
      │             AttributionFirstTouchRecorded
      │         (subsequent) attributions row updated (last_touch_* only) +
      │             AttributionLastTouchUpdated
      │         AttributionTouchpoint row appended + AttributionTouchpointCaptured
      │         AttributionContext holds resolved Attribution + snapshot
      │
      ▼
Downstream domain code reads Request::currentAttribution() /
Request::attributionSnapshot() to freeze into event.attribution columns.
```

Two invariants:

1. _\*first_touch_* is IMMUTABLE post-create._* Refuses observer refuses any
   update. Even a `reset` erases the row rather than mutating first-touch.
2. **AttributionTouchpoint is append-only.** No updates permitted (except
   metadata JSON); no soft-delete; no destructive migrations.

## 4. The five click ID sources

The module supports every major ad-network click ID:

| Provider         | Cookie name | Query param | Notes                                                                         |
| ---------------- | ----------- | ----------- | ----------------------------------------------------------------------------- |
| Google Ads       | `_gclid`    | `gclid`     | 90-day cookie lifetime by default; module respects the ad-network TTL.        |
| Meta (Facebook)  | `_fbclid`   | `fbclid`    | 90-day cookie; also captures `fbc` (formatted click ID) + `fbp` (browser ID). |
| TikTok           | `_ttclid`   | `ttclid`    | 30-day cookie by default.                                                     |
| Microsoft (Bing) | `_msclkid`  | `msclkid`   | 90-day cookie.                                                                |
| Snapchat         | `_sccid`    | `ScCid`     | 30-day cookie.                                                                |

The `ClickIdExtractor` reads each source and packs them into a single jsonb
blob: `{ gclid, fbclid, ttclid, msclkid, sccid, provider_hint }`.
`provider_hint` is the first non-null click ID (Google > Meta > TikTok >
Microsoft > Snapchat) — used by the marketing module to route the conversion
event to the right ad-network.

Small tier captures only `gclid` + `fbclid`. Medium + Enterprise unlock the full
five via `attribution_click_ids_advanced`.

## 5. The four lifecycle states

An attribution profile transitions through four states. Only forward transitions
are allowed (except `reset`, which erases the profile). Refused transitions are
observer failures with `INVALID_LIFECYCLE_TRANSITION` (422).

| State        | Meaning                                                                       | Enters via                                                       |
| ------------ | ----------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| `anonymous`  | Pre-signup. subject_type='anonymous_session'. subject_id is the session UUID. | AttributionCreated (first touch).                                |
| `identified` | User/athlete linked. subject_id points at a real domain row.                  | AttributionSubjectIdentified — fires when subject_id populates.  |
| `converted`  | First purchase / subscription / paid conversion.                              | AttributionConverted — dispatched by marketing/finance listener. |
| `churned`    | 90-day inactive.                                                              | MarkAttributionChurnedJob (nightly).                             |

The lifecycle powers cohort analysis + re-engagement campaigns:

- Anonymous profiles that never identify → drop from analysis at retention
  window.
- Identified but never converted → target for onboarding email flows.
- Converted → attribute revenue back to first-touch + last-touch sources.
- Churned → target for re-engagement campaigns; auto-restored on next
  attribution-bearing request via `AttributionRestored`.

## 6. Cross-device merge

When an anonymous browser session on device A signs up, then that same user logs
in from device B, the module has TWO `attributions` rows:

- Anonymous (device A) — subject_type='anonymous_session', subject_id=session_A.
- Identified (device B) — subject_type='user', subject_id=user_123.

`MergeIdentifiedAttributionsJob` dispatches when `AttributionSubjectIdentified`
fires. The merge strategy:

1. Find anonymous profiles with matching session_id / ip_hash / device_hash
   within the last 30 days.
2. For each match, replay every touchpoint of the anonymous profile as a
   touchpoint on the identified profile.
3. If the anonymous profile's first_touch_at predates the identified profile's:
   overwrite the identified profile's first_touch_* with the anonymous profile's
   — the true first touch is the anonymous one.
4. Delete the anonymous profile (soft-delete + fire `AttributionMerged`).
5. Emit `AttributionMergeCompletedNotification` to admin (ops audit).

Merge requires the `attribution_merge` entitlement (Enterprise-only). Non-
Enterprise tenants leave anonymous + identified profiles side-by-side and
attribute conversions to the identified profile only (partial-attribution — a
compliance-safe fallback).

## 7. Consent gate

`ConsentGate::allows('marketing')` runs at the middleware layer BEFORE any
persistence. Three outcomes:

1. **Consent granted** — full flow (attribution row + touchpoint appended;
   consent_snapshot captured on the touchpoint for regulator queries).
2. **Consent NOT granted** — ephemeral capture: `AttributionContext` holds
   session_id + hashed_ip in-memory for the request only. NO DB WRITE. Fires
   `AttributionSuppressedByConsent` for compliance audit (batched daily via
   `AttributionSuppressedByConsentNotification`).
3. **Consent revoked mid-session** — pending touchpoints in-flight suppress at
   dispatch time (re-check at commit). Historical touchpoints are NOT deleted
   (retained per legal-basis until user requests reset).

The `consent_snapshot` jsonb captured on every touchpoint includes:
`{ marketing, advertising, personalized_advertising, functional }` — the subset
of categories relevant to attribution. Regulator queries can filter touchpoints
by consent state without a JOIN.

## 8. Attribution snapshot — the frozen contract with downstream

The critical output of this module: every marketing/analytics/referral event
downstream freezes the CURRENT attribution into its own `attribution` jsonb
column at create-time. Once frozen, the snapshot is IMMUTABLE — subsequent
attribution changes do not reshape historical events.

`AttributionSnapshotBuilder.build()` returns:

```json
{
  "attribution_id": "att_01JZK…",
  "first_touch": {
    "source": "google",
    "medium": "cpc",
    "campaign": "spring-signup-2026",
    "content": "ad-variant-b",
    "term": "sports academy",
    "landing_page": "https://tenant.academorix.app/signup",
    "referrer": "https://google.com/search?q=…",
    "click_id": { "gclid": "Cj0KCQjw…", "provider_hint": "google" },
    "at": "2026-01-15T09:32:14Z"
  },
  "last_touch": { … same shape … },
  "session_id": "sess_…",
  "device": { "device_type": "mobile", "browser": "Chrome", "os": "iOS", "is_mobile": true },
  "consent_snapshot": { "marketing": true, "advertising": true, "personalized_advertising": false, "functional": true }
}
```

Every downstream event that mutates business state should capture this snapshot
in its create flow. That's what makes "which campaign drove this revenue three
months ago" a stable query.

## 9. Reset — the GDPR path

`POST /api/v1/attributions/{attribution}/reset` (or `attribution:reset` CLI)
implements GDPR Art. 17 right-to-erasure for the subject's attribution data:

1. Delete the `attributions` row (soft-delete + `AttributionResetRequested`).
2. Queue touchpoint purge (hard-delete of touchpoints after 90-day audit hold).
3. Fire `AttributionResetConfirmationNotification` (opt-in — user requested it).
4. Write audit trail entry with 7-year retention (financial audit alignment —
   reset requests are audit events).

Reset is the only mutation that "un-does" first-touch. Any subsequent
attribution-bearing request from the same subject creates a fresh row.

Platform-plane `force-reset` bypasses tenant guards for regulator-issued
requests. Every force-reset writes an audit row + notifies the tenant admin.

## 10. Retention

- Active attributions: retained forever while subject is active.
- Churned attributions with no touchpoints for 730d: archive candidate.
- Attribution touchpoints: **730 days default (2 years)**. Enterprise extends to
  7 years via `attribution_touchpoint_retention_extended` (aligns with
  financial-record retention downstream).
- Reset attributions: profile redacted immediately; touchpoints purged 90 days
  later (audit hold).
- TenantErased: cascade delete all attributions + touchpoints (FK CASCADE).
  Audit trail rows survive per audit module's outlives-source design.

## 11. Cascades

- `TenantErased` → `PurgeAttributionDataForErasedTenant` → FK CASCADE
  hard-deletes every row. Audit rows survive.
- `UserErased` → `RedactAttributionOnUserErasure` → touchpoint device_snapshot +
  ip_hash redacted to `[REDACTED]`; attribution row transitions to lifecycle
  `churned` with subject_id nulled (row survives for aggregate metrics).
- `AttributionSubjectIdentified` →
  `MergeAnonymousAttributionsOnSubjectIdentified` → dispatches
  `MergeIdentifiedAttributionsJob` on Enterprise tenants; no-op on
  non-Enterprise.

## 12. What this module does NOT do

- **No third-party tracking pixel.** Attribution is server-side capture only.
  The frontend `@academorix/analytics` package captures client-side events; those
  route through this module's attribution snapshot at capture time.
- **No cross-tenant attribution stitching.** Attribution is tenant-scoped; a
  user active on two tenants has two attribution profiles.
- **No cross-application attribution.** Per tenancy-columns.md §2, application
  cascades through tenant. A Sports-app profile and Marketplace-app profile
  never merge.
- **No IP geolocation.** `region_id` is NOT stored on touchpoints. Region
  attribution (for ad-network geo-targeting) reads the tenant's region via the
  tenant hierarchy.
- **No cross-device fingerprinting via device_hash.** The device_snapshot
  captures parsed UA fields (browser / OS / device_type) but NOT a raw
  fingerprint. Privacy-hostile fingerprinting is a non-goal.
- **No email open pixel tracking.** Email attribution (open/click) is deferred
  to the notifications module; this module handles web + app attribution only.
- **No fraud detection.** Attribution captures what happened; fraud analysis is
  referrals module's job.
- **No `application_id` / `region_id` / `organization_id` / `branch_id` /
  `scope_node_id` on any owned row.** All cascade through tenant per
  tenancy-columns.md §5.

## 13. Cross-references

- `growth-and-observability.md` — the growth-tier vocabulary. Attribution is the
  feeder for marketing + analytics + referrals.
- `hierarchy.md` §2 — where growth sits in the platform tree.
- `hierarchy.md` §7 — tier matrix (attribution capture on all tiers, advanced
  features Medium+/Enterprise).
- `tenancy-columns.md` §3 — every owned row carries `tenant_id`.
- `tenancy-columns.md` §5 — forbidden columns (attribution never carries
  application_id / region_id / organization_id / branch_id / scope_node_id).
- `modules/growth/blueprints/marketing/` — the primary downstream consumer (Wave
  5).
- `modules/growth/blueprints/analytics/` — the secondary downstream consumer
  (Wave 5).
- `modules/growth/blueprints/referrals/` — the third downstream consumer (Wave
  5).
- `modules/compliance/blueprints/consent/` — the consent registry this module
  gates through.
