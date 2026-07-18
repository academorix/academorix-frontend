"""One-shot script — register Wave 5 (growth tier) ULID prefixes in the
foundation registry. Wave 5 modules: attribution (att_, atp_), marketing (mev_,
mdv_, mpc_, mdl_), analytics (ane_, and_, apc_, aid_), referrals (rpg_, rcd_,
ref_, rrw_, rfr_). 15 new prefixes total. Idempotent — running twice adds
nothing on the second run."""
import json
from pathlib import Path
from datetime import date

REG = Path(__file__).resolve().parent.parent / "modules/shared/blueprints/foundation/data/ulid-prefixes.json"
today = date.today().isoformat()

# New prefixes owned by the growth::attribution module (Wave 5).
ATTRIBUTION = {
    "att_": {
        "module": "attribution",
        "entity": "Attribution",
        "description": "Per-subject rolling attribution profile. Polymorphic subject (user / athlete / lead / anonymous_session). First-touch fields IMMUTABLE post-create. Lifecycle: anonymous → identified → converted → churned. Consent-gated at capture (marketing category). Cascades through tenant_id only — NEVER carries application_id / region_id / organization_id / branch_id / scope_node_id.",
    },
    "atp_": {
        "module": "attribution",
        "entity": "AttributionTouchpoint",
        "description": "Append-only touchpoint ledger. One row per attribution-bearing HTTP request. NEVER mutated after commit (except metadata jsonb). NO SoftDeletes — hard-delete only via retention purge, reset audit hold, or TenantErased cascade. Denormalised subject_type + subject_id for direct index-driven queries.",
    },
}

# New prefixes owned by the growth::marketing module (Wave 5).
MARKETING = {
    "mev_": {
        "module": "marketing",
        "entity": "MarketingEvent",
        "description": "Canonical marketing event ledger. One row per captured business milestone (signup, trial_started, subscription_started, membership_purchased, athlete_enrolled, refund_issued, chargeback_filed, ...). Attribution + consent snapshotted at CREATE time (frozen). 7-year retention (financial audit). Immutable after terminal status. Composite unique (tenant_id, deduplication_key) prevents double-fire.",
    },
    "mdv_": {
        "module": "marketing",
        "entity": "MarketingDelivery",
        "description": "Per-provider-per-attempt delivery log. One row per (event × provider × attempt). Captures request payload (encrypted at rest), response, HTTP status, latency, error details, next_retry_at. 2-year retention (support debugging window). Suppression states: suppressed_by_consent / suppressed_by_circuit_breaker / suppressed_by_provider_off / rate_limited.",
    },
    "mpc_": {
        "module": "marketing",
        "entity": "MarketingProviderConfig",
        "description": "Per-tenant provider config. One active row per (tenant, provider). Encrypted config jsonb (pixel_id, access_token, customer_id, api_secret, webhook_url, hmac_secret). Holds circuit-breaker state (consecutive_failure_count, circuit_breaker_open_until, reset_count), retry config (backoff schedule + max_attempts), rate-limit ceilings, test-mode flag + test_event_code. Nine providers: meta_capi, google_ads, google_analytics_4, gtm_server, tiktok_events, linkedin_insight, snapchat_capi, pinterest_capi, custom_webhook.",
    },
    "mdl_": {
        "module": "marketing",
        "entity": "MarketingDeadLetter",
        "description": "Max-attempts-exceeded events for manual replay. Every fire is P1 — the event is a paid conversion signal that never reached the ad network. Reasons: max_attempts_exceeded / provider_permanent_failure / circuit_breaker_max_opens / invalid_payload / auth_failure. 7-year retention (financial audit). Replay + resolve workflow with ops audit trail.",
    },
}

# New prefixes owned by the growth::analytics module (Wave 5).
ANALYTICS = {
    "ane_": {
        "module": "analytics",
        "entity": "AnalyticsEvent",
        "description": "Canonical behavioral event ledger. One row per business event captured. Immutable after terminal status (delivered / partially_delivered / suppressed_by_consent / suppressed_by_sampling / suppressed_by_provider_off). Snapshots attribution + consent + context at CREATE time (frozen). Server-side authoritative for events browsers drop to ad-blockers + iOS ITP. Consent-gated on `analytics` category (distinct from marketing). 2-year retention (5-year with analytics_extended_retention).",
    },
    "and_": {
        "module": "analytics",
        "entity": "AnalyticsDelivery",
        "description": "Per-provider-per-attempt delivery log. One row per (event × provider × attempt). Contains request payload, provider response, HTTP status, latency, and (on failure) error details + next_retry_at. 90-day retention — debugging window past which provider-side dashboards are authoritative. batch_id links deliveries flushed in a single batch job.",
    },
    "apc_": {
        "module": "analytics",
        "entity": "AnalyticsProviderConfig",
        "description": "Per-tenant provider configuration. Encrypted config jsonb (API keys, project IDs, host URLs). enabled_event_types + sampling_rate + batch_config filter which events fan out. Circuit-breaker state (5-strike / 60s window / half-open probe). Seven providers: posthog, amplitude, mixpanel, segment, june, google_analytics_4 (analytics catalog, distinct from marketing), custom_webhook.",
    },
    "aid_": {
        "module": "analytics",
        "entity": "AnalyticsIdentity",
        "description": "Identity resolution table. Maps anonymous_id (uuid, browser/device generated on first visit) → identified_user_id as soon as the user identifies. device_fingerprint_hash (SHA-256) — NEVER raw fingerprint. Used ONLY for anti-abuse (coordinated signup detection). merged_from array preserves alias merge trail. 1-year retention post-identify per GDPR minimisation.",
    },
}

# New prefixes owned by the growth::referrals module (Wave 5).
REFERRALS = {
    "rpg_": {
        "module": "referrals",
        "entity": "ReferralProgram",
        "description": "Per-tenant referral program config. Reward type (percent_discount / fixed_amount / free_months / free_sessions / credits / point_award) × amount × currency, single_sided or double_sided, trigger_event, vesting_rule (immediate / trigger_plus_hold_days / after_refund_window_closes / n_events_completed / manual_approval), fraud_config, eligibility_config, program budget caps. Program state: draft → active → paused → archived.",
    },
    "rcd_": {
        "module": "referrals",
        "entity": "ReferralCode",
        "description": "Referral code entry. code_type: user_scoped (per-user, generated on account activation) / campaign (admin-picked, e.g. SUMMER25) / opaque (random). Usage caps + expiry + is_active. Composite unique (tenant, code) among non-deleted rows.",
    },
    "ref_": {
        "module": "referrals",
        "entity": "Referral",
        "description": "Tracked referrer × referred × program × code instance. Captures attribution_snapshot from growth::attribution + device_snapshot (SHA-256 hashes only) at claim time. Fraud score 0..100 from FraudDetector. State machine: pending_claim → claimed → signed_up → trigger_pending → vesting → vested → rewarded, with cancelled / expired / fraudulent branch outs. Composite unique (tenant, program, referrer, referred) prevents double-referral.",
    },
    "rrw_": {
        "module": "referrals",
        "entity": "ReferralReward",
        "description": "Per-referral reward record. One row per recipient_role (referrer / referred) per referral. Vesting timeline (vesting_starts_at → vesting_completes_at → materialized_at → paid_at). Materializes as Finance credits (Wave 4 finance module). Clawback on refund / chargeback / fraud / program_archived reverses paid rewards. 7-year retention (tax audit — issued rewards over IRS threshold require 1099 reporting).",
    },
    "rfr_": {
        "module": "referrals",
        "entity": "ReferralFraudFlag",
        "description": "Rule-based fraud detection finding. flag_type: self_ip_match / device_fingerprint_match / disposable_email / self_email_variant / velocity_exceeded / click_storm_pattern / blacklist_domain / geographic_mismatch / behavioral_anomaly. Severity (warn / block / critical) + confidence (0..100) + supporting evidence jsonb. Review workflow: unreviewed → confirmed_fraud / false_positive / manual_override_approved. 7-year retention.",
    },
}

doc = json.loads(REG.read_text())
prefixes = doc["prefixes"]
reserved = doc.get("reserved_for_future", {})
history = doc.get("renaming_history", [])

added = 0

# Register every Wave 5 prefix — attribution first, then marketing, analytics,
# referrals. Idempotent — existing entries are skipped.
for wave, entries in (
    ("attribution", ATTRIBUTION),
    ("marketing", MARKETING),
    ("analytics", ANALYTICS),
    ("referrals", REFERRALS),
):
    for prefix, meta in entries.items():
        if prefix in prefixes:
            continue
        prefixes[prefix] = {
            "module": meta["module"],
            "entity": meta["entity"],
            "description": meta["description"],
        }
        added += 1

doc["prefixes"] = dict(sorted(prefixes.items()))
if reserved:
    doc["reserved_for_future"] = reserved
else:
    doc.pop("reserved_for_future", None)
doc["renaming_history"] = history

REG.write_text(json.dumps(doc, indent=2, ensure_ascii=False) + "\n")
print("added:", added)
print("total active prefixes now:", len(prefixes))
print("reserved_for_future remaining:", list(doc.get("reserved_for_future", {}).keys()))
