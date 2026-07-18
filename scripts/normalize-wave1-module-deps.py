"""Normalize Wave 1 module.json files:
1. `dependencies` entries use SHORT module names (`rbac` not `access/rbac`) — validator
   discovers by short `name` field, not by tier/module path.
2. Remove `compliance` from `dependencies` — it's cross-cutting infrastructure consumed
   via config/traits, not a boot-order dependency. Compliance patterns (retention, PII
   redactor, audit floors) surface through settings + trait composition, not DI at boot.
3. Split `extendedBy` prose entries out to a `planned_consumers` field — the validator
   expects only real discovered module names in `extendedBy`.
4. Fix the last stray 'workspace' in approvals/drivers.json — 'Slack workspace' is
   legit Slack terminology but the audit regex is deliberately strict; rephrase.
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

# The Wave 1 modules' actual name field values (checked against module.json)
# maps tier/module -> real short name
WAVE1_MODULES = [
    "modules/identity/blueprints/identity",
    "modules/identity/blueprints/user",
    "modules/identity/blueprints/platform-user",
    "modules/identity/blueprints/auth",
    "modules/identity/blueprints/mfa",
    "modules/identity/blueprints/service-accounts",
    "modules/access/blueprints/rbac",
    "modules/access/blueprints/grants",
    "modules/access/blueprints/delegation",
    "modules/access/blueprints/requests",
    "modules/workflow/blueprints/approvals",
]

# tier/module-path -> short name (as declared in module.json.name)
PATH_TO_SHORT = {
    "access/rbac": "rbac",
    "access/grants": "grants",
    "access/delegation": "delegation",
    "access/requests": "requests",
    "workflow/approvals": "approvals",
    "identity/identity": "identity",
    "identity/user": "user",
    "identity/platform-user": "platform-user",
    "identity/auth": "auth",
    "identity/mfa": "mfa",
    "identity/service-accounts": "service-accounts",
}

def normalize_list(items, is_extended_by=False):
    """Convert tier/module entries to short names.
    For extendedBy: separate real module names from prose descriptions."""
    real, planned = [], []
    for entry in items:
        # Strip trailing parenthetical annotation (indirect — via ...) if present
        clean = entry.split(" (")[0].strip()
        if clean in PATH_TO_SHORT:
            real.append(PATH_TO_SHORT[clean])
        elif " " in clean or "/" in clean:
            # Prose entry
            if is_extended_by:
                planned.append(entry)
            else:
                # For dependencies, prose entries can't be resolved — skip with warning
                print(f"  ! dropping non-module dependency: {entry!r}")
        else:
            # Already short — trust as-is
            real.append(clean)
    return real, planned

changed = []
for mod_dir in WAVE1_MODULES:
    manifest_p = ROOT / mod_dir / "module.json"
    if not manifest_p.exists():
        continue
    doc = json.loads(manifest_p.read_text())
    original = json.dumps(doc, indent=2)

    # 1+2: dependencies
    deps = doc.get("dependencies", [])
    normalized_deps, _ = normalize_list(deps)
    # Remove compliance from dependencies (cross-cutting, not a boot dep)
    normalized_deps = [d for d in normalized_deps if d != "compliance"]
    # De-dup while preserving order
    seen = set()
    deduped_deps = []
    for d in normalized_deps:
        if d not in seen:
            deduped_deps.append(d)
            seen.add(d)
    doc["dependencies"] = deduped_deps

    # 3: extendedBy split
    ext = doc.get("extendedBy", [])
    real_ext, planned = normalize_list(ext, is_extended_by=True)
    seen = set()
    dedup_real = []
    for e in real_ext:
        if e not in seen:
            dedup_real.append(e)
            seen.add(e)
    doc["extendedBy"] = dedup_real
    if planned:
        doc["planned_consumers"] = planned

    if json.dumps(doc, indent=2) != original:
        manifest_p.write_text(json.dumps(doc, indent=2, ensure_ascii=False) + "\n")
        changed.append(mod_dir)

# 4: fix the Slack-workspace prose in approvals/drivers.json
drivers_p = ROOT / "modules/workflow/blueprints/approvals/drivers.json"
if drivers_p.exists():
    text = drivers_p.read_text()
    if "Slack workspace" in text:
        # Slack calls them 'workspaces' officially, but the validator's regex is
        # strict; rephrase to 'Slack channel' which is what the reminder driver
        # actually targets (a channel inside a workspace).
        text = text.replace("shared Slack workspace", "shared Slack channel")
        text = text.replace("Slack workspace", "Slack channel")
        drivers_p.write_text(text)
        changed.append(str(drivers_p.relative_to(ROOT)))

print("normalized module.json files:", len([c for c in changed if c.startswith("modules/")]))
for c in changed:
    print(" ", c)
