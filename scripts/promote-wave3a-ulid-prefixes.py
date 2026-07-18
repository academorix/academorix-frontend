"""One-shot script — register Wave 3a sports-foundation ULID prefixes (season +
age-group) in the foundation registry. Both are new; neither was reserved.
Idempotent — entries already active are skipped."""
import json
from pathlib import Path
from datetime import date

REG = Path(__file__).resolve().parent.parent / "modules/shared/blueprints/foundation/data/ulid-prefixes.json"
today = date.today().isoformat()

NEW = {
    "sea_": {
        "module": "season",
        "entity": "Season",
        "description": "Time-bounded competition/training cycle. Lifecycle planned → registration_open → in_progress → playoffs → completed → archived. Belongs to Tenant + Organization (optional) + Branch (optional) with an optional sport_key for sport-scoped seasons. Exactly one is_current=true per scoping tuple.",
    },
    "age_": {
        "module": "age-group",
        "entity": "AgeGroup",
        "description": "Age-bucket classifier (U6/U8/…/U18/Adult/Senior/Masters) for athlete-team eligibility. Sport-agnostic at the base; sport-specific overrides via sport_key. Cutoff kinds: calendar_year / academic_year / rolling_from_birthday / custom_date. Every tenant gets a default 10-entry catalog on TenantProvisioned.",
    },
}

doc = json.loads(REG.read_text())
prefixes = doc["prefixes"]

added = 0
for prefix, meta in NEW.items():
    if prefix in prefixes:
        continue
    prefixes[prefix] = {
        "module": meta["module"],
        "entity": meta["entity"],
        "description": meta["description"],
    }
    added += 1

doc["prefixes"] = dict(sorted(prefixes.items()))

REG.write_text(json.dumps(doc, indent=2, ensure_ascii=False) + "\n")
print("added:", added)
print("total active prefixes now:", len(prefixes))
print("reserved_for_future remaining:", list(doc.get("reserved_for_future", {}).keys()))
