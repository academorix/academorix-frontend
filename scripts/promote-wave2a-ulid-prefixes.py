"""One-shot script — promote Wave 2a structural ULID prefixes (reg_, org_,
brn_, fac_) from `reserved_for_future` to active in the foundation registry.
Also registers derived prefixes owned by the facility module (bkg_ for
ResourceBooking, dpa_ for DayPass, pas_ for Pass). Idempotent — entries
already active are skipped."""
import json
from pathlib import Path
from datetime import date

REG = Path(__file__).resolve().parent.parent / "modules/shared/blueprints/foundation/data/ulid-prefixes.json"
today = date.today().isoformat()

# Prefixes to promote out of `reserved_for_future`.
PROMOTED = {
    "reg_": {
        "module": "region",
        "entity": "Region",
        "description": "Commercial + regulatory zone belonging to a Tenant. Currency + timezone + locale + tax_config + weekend_days. Orthogonal to Organization; they meet at Branch. Every tenant provisions exactly one is_default=true Region on TenantProvisioned.",
    },
    "org_": {
        "module": "organization",
        "entity": "Organization",
        "description": "Structural sub-brand belonging to a Tenant. Nested via parent_id self-FK + materialised tree_path (sentinel-wrapped `.a.b.c.`). Every tenant provisions exactly one is_default=true Organization on TenantProvisioned. Enterprise tier gates nesting via `organization_hierarchy` entitlement.",
    },
    "brn_": {
        "module": "branch",
        "entity": "Branch",
        "description": "Physical venue where Organization + Region axes meet. Carries tenant_id + organization_id + region_id. FK-central: every downstream domain aggregate (facility, team, staff, coach, athlete, membership) references branches.id.",
    },
    "fac_": {
        "module": "facility",
        "entity": "Facility",
        "description": "Bookable resource inside a Branch. Court / field / pool / studio / room / gym floor / lane. Availability + pricing + blackouts + capacity live as JSONB on the row.",
    },
}

# New prefixes owned by the facility module (not previously reserved).
FACILITY_OWNED = {
    "bkg_": {
        "module": "facility",
        "entity": "ResourceBooking",
        "description": "Timed reservation against a Facility. State machine: pending → confirmed → completed/cancelled/no_show. Overlap detection under SERIALIZABLE isolation.",
    },
    "dpa_": {
        "module": "facility",
        "entity": "DayPass",
        "description": "Untimed same-day admission — branch-scoped POS record. Financial record: 7-year retention, NO soft-delete. Anonymous walk-in profile fields redacted 90 days post-consumption per GDPR Art. 5(1)(c).",
    },
    "pas_": {
        "module": "facility",
        "entity": "Pass",
        "description": "Credit + eligibility record binding Membership (Wave 4) to Facility access. Credits decrement atomically on booking-create via SELECT ... FOR UPDATE.",
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
            "reason": f"Wave 2a {meta['module']} module blueprint landed; prefix promoted from reserved_for_future to active.",
        }
    )
    prefixes[prefix] = entry
    added += 1

# Register facility-owned prefixes.
for prefix, meta in FACILITY_OWNED.items():
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
