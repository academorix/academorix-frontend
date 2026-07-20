# attribution — changelog

## [Unreleased] — inception (Wave 5)

- Attribution module authored. Two owned entities:
  - `Attribution` — per-subject rolling attribution profile (first/last-touch
    snapshots + session state + lifecycle stage + aggregated counts).
  - `AttributionTouchpoint` — append-only ledger of every attribution-bearing
    request.
- Six entitlement gates:
  - `attribution_capture` (all tiers, on by default) — master feature gate.
  - `attribution_click_ids_advanced` (Medium+) — msclkid + sccid capture.
  - `attribution_rollup` (Medium+) — campaign performance rollup + dashboards.
  - `attribution_merge` (Enterprise) — cross-device profile merging.
  - `attribution_import` (Enterprise) — bulk CSV import from external CRM.
  - `attribution_touchpoint_retention_extended` (Enterprise) — extends retention
    730d → 2555d.
- Five click ID sources supported: Google (gclid), Meta (fbclid), TikTok
  (ttclid), Microsoft (msclkid), Snapchat (sccid). Small tier captures only
  gclid + fbclid.
- Four lifecycle states: anonymous → identified → converted → churned. Only
  forward transitions permitted (except reset, which erases the row).
- Consent-gated at middleware layer via `ConsentGate::allows('marketing')`.
  Consent-suppressed touchpoints fire `AttributionSuppressedByConsent` without
  persistence — ephemeral in-memory context only.
- Consent snapshot captured on every touchpoint
  (`{ marketing, advertising, personalized_advertising, functional }`) for
  regulator queryability without JOIN.
- IP hashing via SHA-256; raw IPs never stored.
- Device parsing extracts browser / OS / device_type / is_mobile from
  User-Agent; NO raw fingerprint.
- Attribution snapshot (`AttributionSnapshotBuilder.build()`) is the frozen
  contract with downstream marketing / analytics / referrals / finance events —
  once captured on an event's `attribution` jsonb, immutable.
- Cross-device merge via `MergeIdentifiedAttributionsJob` dispatches when
  `AttributionSubjectIdentified` fires; matches on session_id / ip_hash /
  device_hash within 30 days.
- Retention: touchpoints 730d default (2y), 2555d extended (7y Enterprise).
  Reset attributions: profile redacted immediately + touchpoints purged 90d
  later (audit hold).
- Realtime broadcasts: `tenant.{tenantId}.attribution`,
  `user.{userId}.attribution`.
- Four notification categories (reset-confirmation, merge-completed,
  suppressed-by-consent, churn-detected).
- SDUI: 4 attribution screens (list, view, merge, reset) + 2 widgets
  (source-chip, timeline).

### Compatibility

- Depends on `foundation`, `tenancy`, `application`, `user`, `entitlements`,
  `compliance`.
- Consumed by `marketing`, `analytics`, `referrals`, `finance`, `notifications`
  (all Wave 5 peers).
- Wave 5 growth-tier inception release.

### Design notes

- Attribution does NOT carry `application_id` / `region_id` / `organization_id`
  / `branch_id` / `scope_node_id`. All cascade through `tenant_id`. Enforced by
  the `tenancy-compliance-auditor` agent.
- Attribution does NOT participate in the scope substrate — it's operational
  data, not configuration.
- First-touch is IMMUTABLE post-create. The observer refuses any update to
  first_touch_* fields.
- AttributionTouchpoint is append-only. NO SoftDeletes (append-only ledger);
  updates permitted only on metadata jsonb.
- The `attribution` jsonb on downstream events is a FROZEN snapshot. Downstream
  consumers do NOT join back to `attributions` at read-time — the join is done
  at capture-time and cached in the event row.
- Merge is Enterprise-only. Non-Enterprise tenants leave anonymous + identified
  profiles side-by-side; conversion attribution reads the identified profile
  only (partial-attribution — a compliance-safe fallback).
- Reset is the only mutation that erases first-touch. Reset requests write to
  audits with 7-year retention.
- Platform-plane `force-reset` bypasses tenant guards for regulator-issued
  requests. Every force-reset writes an audit row + notifies the tenant admin.
- The 5-click-ID design is deliberately deprecatable — a future ad-network with
  its own click ID lands here in `data/click-id-catalog.json` + a new column in
  `first_touch_click_id.provider_hint` enum. No table migration required (all
  click IDs live in the jsonb).
- Retention window (730d default) aligns with GDPR Art. 5(1)(e)
  storage-limitation principle: the shortest legitimate retention consistent
  with legitimate interest. Enterprise's 2555d (7y) aligns with the tier's
  financial-record retention downstream.
- The `AttributionSuppressedByConsent` event is a compliance signal — every fire
  proves the consent gate refused a capture. Compliance dashboards report the
  rate as a data-processing-fairness metric.
