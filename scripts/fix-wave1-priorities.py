"""Final Wave 1 module.json normalization:
1. Swap approvals/requests priorities. requests depends on approvals so approvals
   must boot FIRST. Original design had approvals=35 "biggest = boots last" but
   that inverts the dependency arrow — the engine must load before its wrapper.
   New priorities: approvals=34, requests=35.
2. Move `user.extendedBy` prose entries (bare tier/future-module names that don't
   correspond to real discovered modules) to `planned_consumers`.
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

# 1. Swap priorities on approvals + requests
priority_swaps = {
    "modules/workflow/blueprints/approvals/module.json": 34,  # was 35
    "modules/access/blueprints/requests/module.json": 35,     # was 34
}

for rel, new_prio in priority_swaps.items():
    p = ROOT / rel
    doc = json.loads(p.read_text())
    doc["priority"] = new_prio
    p.write_text(json.dumps(doc, indent=2, ensure_ascii=False) + "\n")
    print(f"  {rel}: priority -> {new_prio}")

# 2. Move user.extendedBy prose entries to planned_consumers
user_manifest = ROOT / "modules/identity/blueprints/user/module.json"
doc = json.loads(user_manifest.read_text())
ext = doc.get("extendedBy", [])
# Real (discovered) modules — everything else moves to planned_consumers.
# The Wave 1 modules discovered by the validator have short names like
# 'auth', 'rbac', 'requests', 'approvals', ...; anything else is a
# not-yet-scaffolded module or a tier reference.
DISCOVERED = {
    "auth", "mfa", "rbac", "grants", "delegation", "requests", "approvals",
    "identity", "user", "platform-user", "service-accounts",
    # existing modules that could plausibly extend user
    "invitations", "audit", "activity", "notifications", "compliance", "subscription", "entitlements",
}
real = [e for e in ext if e in DISCOVERED]
planned = [e for e in ext if e not in DISCOVERED]
if planned:
    doc["extendedBy"] = real
    existing_planned = doc.get("planned_consumers", [])
    doc["planned_consumers"] = existing_planned + planned
    user_manifest.write_text(json.dumps(doc, indent=2, ensure_ascii=False) + "\n")
    print(f"  user.extendedBy: kept {real}; moved to planned_consumers: {planned}")
