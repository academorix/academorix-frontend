/**
 * @file scope-switcher.tsx
 * @module modules/settings/components/scope-switcher
 *
 * @description
 * The scope breadcrumb rendered at the top of every settings page. Lets the
 * user pick which level of the hierarchy they are *editing at*. Non-scoped
 * settings (`lowestOverride === "tenant"`) simply reflect the tenant view.
 */

import { Chip, Dropdown, Label } from "@heroui/react";

import type { Key } from "react";

import { Iconify } from "@/icons/iconify";
import { useSettingsScope } from "@/modules/settings/scope/settings-provider";
import { SCOPE_HIERARCHY, SCOPE_ICON, SCOPE_LABEL } from "@/modules/settings/scope/types";

type ScopeSwitcherProps = {
  className?: string;
};

/** Human labels for the mock scope ids seeded in `settings-provider.tsx`. */
const MOCK_SCOPE_LABELS: Record<string, string> = {
  "tenant-academorix": "Academorix",
  "region-mena": "MENA",
  "org-academorix-athletics": "Academorix Athletics",
  "branch-riyadh-central": "Riyadh Central",
  "user-current": "You",
};

export function ScopeSwitcher({ className }: ScopeSwitcherProps) {
  const { context, editingScope, setEditingScope } = useSettingsScope();

  const scopeIdFor = (scope: string): string | null => {
    switch (scope) {
      case "system":
        return null;
      case "tenant":
        return context.tenantId;
      case "region":
        return context.regionId;
      case "organization":
        return context.organizationId;
      case "branch":
        return context.branchId;
      case "user":
        return context.userId;
      default:
        return null;
    }
  };

  const availableScopes = SCOPE_HIERARCHY.filter((scope) => scope !== "system");

  const currentScopeId = scopeIdFor(editingScope);
  const currentScopeName = currentScopeId
    ? (MOCK_SCOPE_LABELS[currentScopeId] ?? currentScopeId)
    : "";

  return (
    <div
      className={
        "flex flex-wrap items-center gap-2 rounded-lg border border-border bg-surface-secondary/40 px-3 py-2 " +
        (className ?? "")
      }
    >
      <span className="text-xs font-medium tracking-wide text-muted uppercase">Editing at</span>

      <Dropdown>
        <button
          className="flex items-center gap-1.5 rounded-md px-2 py-1 text-sm font-medium text-foreground outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
          type="button"
        >
          <Iconify className="size-4" icon={SCOPE_ICON[editingScope]} />
          {SCOPE_LABEL[editingScope]}
          <Iconify className="size-3 text-muted" icon="chevron-down" />
        </button>
        <Dropdown.Popover className="min-w-52" placement="bottom start">
          <Dropdown.Menu
            onAction={(key: Key) => setEditingScope(key as typeof editingScope)}
            selectedKeys={new Set([editingScope])}
            selectionMode="single"
          >
            {availableScopes.map((scope) => (
              <Dropdown.Item key={scope} id={scope} textValue={SCOPE_LABEL[scope]}>
                <Iconify className="size-4" icon={SCOPE_ICON[scope]} />
                <Label>{SCOPE_LABEL[scope]}</Label>
                <Dropdown.ItemIndicator />
              </Dropdown.Item>
            ))}
          </Dropdown.Menu>
        </Dropdown.Popover>
      </Dropdown>

      {currentScopeName ? (
        <>
          <Iconify className="size-3 text-muted" icon="chevron-right" />
          <Chip size="sm" variant="soft">
            <Chip.Label>{currentScopeName}</Chip.Label>
          </Chip>
        </>
      ) : null}

      <div className="ms-auto flex items-center gap-1 text-xs text-muted">
        <Iconify className="size-3" icon="circle-info" />
        <span>
          Values inherit from parent scopes. Click the{" "}
          <Iconify className="inline size-3" icon="link" /> icon on a field to override here.
        </span>
      </div>
    </div>
  );
}
