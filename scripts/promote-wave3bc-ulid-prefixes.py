"""One-shot script — register Wave 3b + Wave 3c ULID prefixes in the foundation
registry. Wave 3b: athlete (ath_), athlete-guardian (agu_), athlete-enrollment
(aen_), event (eve_), event-facilities pivot (efc_), session (ses_), session-
attendance pivot (sat_). Wave 3c: sports-registry — promotes spo_ from reserved
to active and adds dis_ (Discipline), pos_ (Position). Idempotent."""
import json
from pathlib import Path
from datetime import date

REG = Path(__file__).resolve().parent.parent / "modules/shared/blueprints/foundation/data/ulid-prefixes.json"
today = date.today().isoformat()

# Prefixes promoted from reserved_for_future.
PROMOTED = {
    "spo_": {
        "module": "sports-registry",
        "entity": "Sport",
        "description": "Top-level sport catalog entry (football, basketball, swimming, yoga, tennis, general_fitness, ...). tenant_id NULL = platform-scoped; non-null = tenant custom. Slug IMMUTABLE post-create — downstream Wave 3 modules reference by string.",
    },
}

# New prefixes owned by Wave 3b + Wave 3c modules.
WAVE_3B = {
    "ath_": {
        "module": "athlete",
        "entity": "Athlete",
        "description": "The person being coached. Belongs to Tenant + Branch + optional User. Snapshot demographic + medical (REGULATED_HEALTH) + emergency contact (CONFIDENTIAL) profile with 7-year retention + 90-day post-archive redaction. Consent snapshot per GDPR Art. 8 for minors.",
    },
    "agu_": {
        "module": "athlete-guardian",
        "entity": "AthleteGuardian",
        "description": "Parent / legal-guardian pivot binding an Athlete to a User. Exactly one is_primary=true per Athlete when any exists. Four role flags (has_legal_custody, can_pickup, can_receive_communications, can_authorise_medical_care). Verification workflow with auto/hr/silent paths.",
    },
    "aen_": {
        "module": "athlete-enrollment",
        "entity": "AthleteEnrollment",
        "description": "Roster attachment binding an Athlete to a Team + Season. Atomic conversion creates a teams::TeamMember in the same DB transaction on status → active. age_group_snapshot_id frozen at enrollment for birthday-drift isolation.",
    },
    "eve_": {
        "module": "event",
        "entity": "Event",
        "description": "Sport competitive / social / educational event — tournament, match, showcase, workshop, camp, awards ceremony. Belongs to Tenant + Organization + optional Branch + optional Season. Multi-facility via event_facilities pivot.",
    },
    "efc_": {
        "module": "event",
        "entity": "EventFacility",
        "description": "Event ↔ Facility pivot attaching N facilities to one event. Enterprise-only for N>1 via event_multi_facility entitlement. Exactly one is_primary=true per event.",
    },
    "ses_": {
        "module": "session",
        "entity": "Session",
        "description": "A single practice / lesson / class instance. Composes facility::ResourceBooking for the physical slot. Adds coach, session_type, curriculum, attendance tracking, safeguarding-incident chain.",
    },
    "sat_": {
        "module": "session",
        "entity": "SessionAttendance",
        "description": "Session ↔ Athlete pivot with attendance state (registered / checked_in / absent / late / excused). One athlete attends a session once.",
    },
}

# New prefixes owned by the sports-registry module (Wave 3c).
WAVE_3C = {
    "dis_": {
        "module": "sports-registry",
        "entity": "Discipline",
        "description": "Sport sub-variant / competition format (football_11v11, football_futsal, basketball_5v5, basketball_3x3, swimming_freestyle, swimming_relay). One Sport hasMany Disciplines. Slug IMMUTABLE post-create.",
    },
    "pos_": {
        "module": "sports-registry",
        "entity": "Position",
        "description": "Sport-specific role / position (football_goalkeeper, football_defender, basketball_point_guard, basketball_center, swimming_freestyler). One Discipline hasMany Positions. Slug IMMUTABLE post-create.",
    },
}

doc = json.loads(REG.read_text())
prefixes = doc["prefixes"]
reserved = doc.get("reserved_for_future", {})
history = doc.get("renaming_history", [])

added = 0

# Promote reserved prefixes to active.
for prefix, meta in PROMOTED.items():
    if prefix in prefixes:
        continue
    entry = {
        "module": meta["module"],
        "entity": meta["entity"],
        "description": meta["description"],
        "promoted_from_reserved": True,
    }
    if prefix in reserved:
        del reserved[prefix]
    history.append(
        {
            "from": prefix + " (reserved)",
            "to": prefix + " (active)",
            "date": today,
            "reason": f"Wave 3c {meta['module']} module blueprint landed; prefix promoted from reserved_for_future to active.",
        }
    )
    prefixes[prefix] = entry
    added += 1

# Register Wave 3b prefixes.
for prefix, meta in WAVE_3B.items():
    if prefix in prefixes:
        continue
    prefixes[prefix] = {
        "module": meta["module"],
        "entity": meta["entity"],
        "description": meta["description"],
    }
    added += 1

# Register Wave 3c prefixes.
for prefix, meta in WAVE_3C.items():
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
