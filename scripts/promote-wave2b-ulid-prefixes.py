"""One-shot script — register Wave 2b structural ULID prefixes (teams + staff)
in the foundation registry. Promotes `tea_` from `reserved_for_future` to
active; registers 5 new prefixes (trm_ TeamMember, ttr_ TeamTrial, evt_
EventTeam, stf_ Staff, coa_ Coach). Idempotent — entries already active are
skipped."""
import json
from pathlib import Path
from datetime import date

REG = Path(__file__).resolve().parent.parent / "modules/shared/blueprints/foundation/data/ulid-prefixes.json"
today = date.today().isoformat()

# Prefixes to promote out of `reserved_for_future`.
PROMOTED = {
    "tea_": {
        "module": "teams",
        "entity": "Team",
        "description": "Group of humans practicing/playing/attending under a Branch. Sport-agnostic — squad / class / cohort / group / crew. Belongs to Tenant + Organization + Branch. Optional Season + AgeGroup (Wave 3 FKs, nullable pre-Wave-3).",
    },
}

# New prefixes owned by the teams module (not previously reserved).
TEAMS_OWNED = {
    "trm_": {
        "module": "teams",
        "entity": "TeamMember",
        "description": "Polymorphic roster row — points at Athlete / Coach / Staff / User via (member_type, member_id). Partial unique per (team, member_type, member_id) WHERE status=active.",
    },
    "ttr_": {
        "module": "teams",
        "entity": "TeamTrial",
        "description": "Probationary tryout for a prospective team member. Polymorphic trialist (athlete / user / anonymous). Atomically convertible to a TeamMember row.",
    },
    "evt_": {
        "module": "teams",
        "entity": "EventTeam",
        "description": "Team's participation in an Event (Wave 3+). Records participation_type, registered_at, checked_in_at, result JSONB, attendance_count.",
    },
}

# New prefixes owned by the staff module.
STAFF_OWNED = {
    "stf_": {
        "module": "staff",
        "entity": "Staff",
        "description": "Employment record wrapping a User row with employment metadata (position, department, employment_type, employment_status, compensation, emergency contact). Belongs to Tenant + Branch + User (RESTRICT). Compensation is regulated-financial tier with 7-year retention.",
    },
    "coa_": {
        "module": "staff",
        "entity": "Coach",
        "description": "Staff-satellite adding per-sport coaching profile (specialization, certifications, rating, availability_pattern). One Coach per Staff at a time. Cascades everything through staff_id → branch.",
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
            "reason": f"Wave 2b {meta['module']} module blueprint landed; prefix promoted from reserved_for_future to active.",
        }
    )
    prefixes[prefix] = entry
    added += 1

# Register teams-owned prefixes.
for prefix, meta in TEAMS_OWNED.items():
    if prefix in prefixes:
        continue
    prefixes[prefix] = {
        "module": meta["module"],
        "entity": meta["entity"],
        "description": meta["description"],
    }
    added += 1

# Register staff-owned prefixes.
for prefix, meta in STAFF_OWNED.items():
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
print("reserved_for_future remaining:", len(reserved), "-", list(reserved.keys()))
