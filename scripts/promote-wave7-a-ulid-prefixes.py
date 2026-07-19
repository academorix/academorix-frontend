"""One-shot script — register Wave 7a ULID prefixes for theme + coaching +
attendance modules. 11 new prefixes total.

Idempotent — running twice adds nothing on the second run.
"""
import json
from pathlib import Path

REG = Path(__file__).resolve().parent.parent / "modules/shared/blueprints/foundation/data/ulid-prefixes.json"

THEME = {
    "thm_": {
        "module": "theme",
        "entity": "Theme",
        "description": "Per-tenant active theme record. Carries selected_preset_id + immutable tokens_snapshot (frozen at activation) + mode (light/dark) + accessibility_flags (high_contrast/reduced_motion/larger_text/focus_visible_always). Composite partial unique on (tenant_id, mode) WHERE is_active = true — exactly one active theme per (tenant, mode). Tokens_snapshot materialised from preset + overrides cascade at activation; IMMUTABLE thereafter (rollback creates a new Theme row). Composed via HasUlids + BelongsToTenant + HasThemeSnapshot + HasUserstamps + HasAuditable + HasActivityLog + SoftDeletes.",
    },
    "tps_": {
        "module": "theme",
        "entity": "ThemePreset",
        "description": "Pre-built theme configuration. tenant_id NULL for platform-provided presets (6 seeded day-1: light-default, dark-default, high-contrast-light, high-contrast-dark, brand-forward-blue, brand-forward-green); non-null for tenant-authored custom presets. Complete token map in tokens jsonb — every key from canonical vocabulary. Category IN (platform_default / tenant_custom / brand_forward / high_contrast / minimal). Composite unique on (COALESCE(tenant_id, 'platform'), slug) — platform and tenant namespaces never collide. Composed via HasUlids + HasSlug + BelongsToTenant (nullable) + Auditable + SoftDeletes.",
    },
    "tto_": {
        "module": "theme",
        "entity": "ThemeTokenOverride",
        "description": "Per-tenant sparse patch on top of a preset. One row per (theme_id, token_key). Enables per-token brand customisation without cloning the whole preset. token_type IN (color / dimension / typography / radius / shadow / motion / opacity / z_index) determines the value schema. Cascade-deletes with parent theme. Composite unique on (tenant_id, theme_id, token_key). Composed via HasUlids + BelongsToTenant + BelongsToTheme + Auditable + SoftDeletes.",
    },
}

COACHING = {
    "cop_": {
        "module": "coaching",
        "entity": "CoachingProfile",
        "description": "Per-Staff satellite marking them as an active Coach with sport-specific expertise. NOT every Staff is a Coach — profile is opt-in via CoachingProfile row. Belongs to Tenant (CASCADE) + Staff (RESTRICT — one profile per Staff) + Branch (RESTRICT — primary branch) + optional primary_sport_id (sports_registry). Carries coaching_since_year, bio, photo_url_signed (HTTPS S3), availability jsonb (per-day-of-week time ranges), hourly_rate_cents (internal reference), specializations jsonb array, is_accepting_new_athletes, max_athletes_per_session, languages_spoken (ISO 639-1), verified_by_admin_at. Composite unique (tenant_id, staff_id) partial. Composed via HasUlids + BelongsToTenant + BelongsToStaff + BelongsToBranch + Auditable + HasActivityLog + SoftDeletes.",
    },
    "cas_": {
        "module": "coaching",
        "entity": "CoachAssignment",
        "description": "Many-to-many pivot Coach ↔ Session/Team/Event with role. role IN (head_coach / assistant_coach / observer / substitute). start_date + optional end_date bounds. Enforces one head_coach per (assignable_type, assignable_id) via partial unique. Polymorphic assignable (Session / Team / Event) validated same-tenant by observer. NotifyAssignmentEndingSoonJob fires 7d before end_date. Composed via HasUlids + BelongsToTenant + BelongsToCoachingProfile + MorphTo(assignable) + Auditable + HasActivityLog + SoftDeletes.",
    },
    "ccf_": {
        "module": "coaching",
        "entity": "CoachCertification",
        "description": "Coach's held certifications — issuing_body, certification_name, level, issued_at, expires_at, verification_url, document_url_signed (HTTPS S3), verified_by_admin_user_id + verified_at. Level IN (entry / intermediate / advanced / expert / master, nullable). NotifyCertificationExpiringJob fires 90d/30d/7d before expires_at. Verification is async — some issuing bodies (USSF, NASM) have public APIs; others manual admin review. Composite unique (tenant_id, coaching_profile_id, issuing_body, certification_name, issued_at) partial. Composed via HasUlids + BelongsToTenant + BelongsToCoachingProfile + Auditable + HasActivityLog + SoftDeletes.",
    },
    "csr_": {
        "module": "coaching",
        "entity": "CoachSkillRating",
        "description": "Per-Coach per-Sport/Discipline/Position skill rating. rating_scale IN (stars_1_5 / level_5_stage — beginner/intermediate/advanced/expert/master). rating_value 1-5. Polymorphic ratable (Sport / Discipline / Position from sports_registry). Rated_by_user_id may not equal coach's user (self-rating forbidden). Default 2-year expiry (5y Enterprise). Admins use ratings to match-make athletes to appropriate coaches. Composite unique (tenant_id, coaching_profile_id, ratable_type, ratable_id) partial. Composed via HasUlids + BelongsToTenant + BelongsToCoachingProfile + MorphTo(ratable) + Auditable + SoftDeletes.",
    },
}

ATTENDANCE = {
    "atd_": {
        "module": "attendance",
        "entity": "AttendanceRecord",
        "description": "Per-athlete-per-session check-in event. status IN (present / late / left_early / present_with_note / not_yet_checked_in). checked_in_via IN (self_kiosk / coach_verified / admin_recorded / geofence / qr_scan). Atomically consumes finance::Pass via Pass.consume() in same DB txn when session.requires_pass. Composite unique (tenant_id, session_id, athlete_id) partial — one record per athlete per session. Late arrivals also create a LateArrival satellite. Deletion refunds the consumed pass. Fires load-bearing AttendanceRecorded event that cascades to growth::analytics + notifications. Composed via HasUlids + BelongsToTenant + BelongsToSession + BelongsToAthlete + BelongsToAthleteEnrollment + Auditable + HasActivityLog + SoftDeletes.",
    },
    "apo_": {
        "module": "attendance",
        "entity": "AttendancePolicy",
        "description": "Per-branch or per-membership-plan attendance rules. grace_period_minutes for late arrivals (15 default), late_after_minutes penalty threshold (30 default), late_arrival_penalty_type IN (none / consume_pass_anyway / fractional_pass_consume / notify_only), no_show_fee_cents (nullable), max_unexcused_absences_per_period + absence_freeze_period_days for enrollment freeze cascade, auto_excuse_reasons jsonb, notification_config jsonb. Composite unique (tenant_id, branch_id, membership_plan_id) partial WHERE is_active = true. Policy resolution: (branch, plan) → (branch, null) → (null, null) tenant default. Composed via HasUlids + BelongsToTenant + BelongsToBranch (nullable) + Auditable + SoftDeletes.",
    },
    "abs_": {
        "module": "attendance",
        "entity": "AbsenceRecord",
        "description": "Per-athlete-per-session absence record. status IN (unexcused / excused / no_show_advance_notice_given / vacation / medical / bereavement). Auto-created by ReconcileAttendanceJob for missed sessions (no matching AttendanceRecord). Guardian/athlete may self-report absence in advance (auto-excused per policy). Admin can excuse post-facto (flip counted_toward_freeze=false + re-run CheckAbsenceFreezeThresholdJob). N unexcused past threshold triggers membership freeze via cascade. Composite unique (tenant_id, session_id, athlete_id) partial — mutually exclusive with AttendanceRecord for same (session, athlete). Composed via HasUlids + BelongsToTenant + BelongsToSession + BelongsToAthlete + BelongsToAthleteEnrollment + Auditable + HasActivityLog + SoftDeletes.",
    },
    "lat_": {
        "module": "attendance",
        "entity": "LateArrival",
        "description": "Per-AttendanceRecord late-arrival satellite. Tracks WHEN in the grace-period an athlete arrived + which policy applied + what penalty was applied. minutes_late from session.starts_at. penalty_applied IN (none / consume_pass_anyway / fractional_consume / notify_only). Denormalises session_id + athlete_id from parent for query performance. Composed via HasUlids + BelongsToTenant + BelongsToAttendanceRecord + Auditable (no soft-delete — cascade with parent).",
    },
}

doc = json.loads(REG.read_text())
prefixes = doc["prefixes"]
reserved = doc.get("reserved_for_future", {})
history = doc.get("renaming_history", [])

added = 0

for wave_name, entries in (
    ("theme", THEME),
    ("coaching", COACHING),
    ("attendance", ATTENDANCE),
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
