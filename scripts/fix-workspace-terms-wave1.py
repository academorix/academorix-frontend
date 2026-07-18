"""One-shot script - purge 'workspace' terminology from Wave 1 identity blueprints.
Per .kiro/steering/hierarchy.md §1a the domain word is Tenant; 'workspace' is
UI-copy only and never appears in blueprint files (which describe backend
schemas/events/routes/etc). Renames `workspace-switcher.widget.json` to
`tenant-switcher.widget.json`."""
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

# Ordered longest/most-specific first so phrase replacements don't get eaten by
# the bare-word fallbacks at the bottom.
DIRECT = [
    ("workspace-switcher", "tenant-switcher"),
    ("Workspace switcher", "Tenant switcher"),
    ("workspace switcher", "tenant switcher"),
    ("My workspaces", "My tenants"),
    ("My Workspaces", "My Tenants"),
    ("Workspaces you belong to", "Tenants you belong to"),
    ("workspace default", "tenant default"),
    ("Added to workspace", "Added to tenant"),
    ("Removed from workspace", "Removed from tenant"),
    ("Switch to this workspace", "Switch to this tenant"),
    ("Choose workspace", "Choose tenant"),
    ("Switch workspace", "Switch tenant"),
    ("added to a workspace", "added to a tenant"),
    ("Members of this workspace", "Members of this tenant"),
    ("across the workspace", "across the tenant"),
    ("the workspace-switcher", "the tenant-switcher"),
    ("workspace-switcher UX", "tenant-switcher UX"),
    ("workspace-switcher usage", "tenant-switcher usage"),
    ("in the workspace", "in the tenant"),
    ("model in the workspace", "model in the tenant"),
    ("analytics workspace", "analytics tenant"),
    # bare-word fallbacks LAST
    ("Workspaces", "Tenants"),
    ("workspaces", "tenants"),
    ("Workspace", "Tenant"),
    ("workspace", "tenant"),
]

RENAMES = [
    (
        ROOT / "modules/identity/blueprints/user/sdui/widgets/workspace-switcher.widget.json",
        ROOT / "modules/identity/blueprints/user/sdui/widgets/tenant-switcher.widget.json",
    ),
]

TARGETS = [
    ROOT / "modules/identity/blueprints/user",
    ROOT / "modules/identity/blueprints/mfa",
    ROOT / "modules/identity/blueprints/platform-user",
]

changed = []
for tgt in TARGETS:
    for path in tgt.rglob("*"):
        if not path.is_file():
            continue
        if path.suffix not in (".json", ".md"):
            continue
        text = path.read_text()
        original = text
        for old, new in DIRECT:
            text = text.replace(old, new)
        if text != original:
            path.write_text(text)
            changed.append(str(path.relative_to(ROOT)))

for old_path, new_path in RENAMES:
    if old_path.exists() and not new_path.exists():
        old_path.rename(new_path)
        changed.append(f"RENAMED: {old_path.relative_to(ROOT)} -> {new_path.relative_to(ROOT)}")

print("files changed:", len(changed))
for f in changed:
    print(" ", f)
