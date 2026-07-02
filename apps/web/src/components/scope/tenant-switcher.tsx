/**
 * @file tenant-switcher.tsx
 * @module components/scope/tenant-switcher
 *
 * @description
 * Shows the active tenant (academy) and, for cross-tenant users, lets them
 * switch. A single-tenant user sees a static tenant indicator. Switching a
 * tenant re-bootstraps the session (see {@link "@/lib/scope/use-tenant".useTenant}).
 */

import { BuildingLibraryIcon, ChevronUpDownIcon } from "@academorix/ui/icons/outline";
import { Button, Dropdown, Label } from "@academorix/ui/react";

import type { TenantSummary } from "@/types";
import type { Key, ReactNode } from "react";

import { useTenant } from "@/lib/scope";

/** The active-tenant indicator + optional cross-tenant switcher. */
export function TenantSwitcher(): ReactNode {
  const { tenant, tenants, canSwitchTenant, switchTenant } = useTenant();

  if (!tenant) {
    return null;
  }

  // Single tenant: static indicator (context only, no dropdown).
  if (!canSwitchTenant) {
    return (
      <div className="flex items-center gap-1.5 px-2 text-sm font-medium text-foreground">
        <BuildingLibraryIcon aria-hidden="true" className="size-4 text-muted" />
        <span className="max-w-[12rem] truncate">{tenant.name}</span>
      </div>
    );
  }

  const handleAction = (key: Key): void => {
    const target = tenants.find((item) => item.id === String(key));

    if (target) {
      switchTenant(target);
    }
  };

  return (
    <Dropdown>
      <Button className="gap-1.5" variant="ghost">
        <BuildingLibraryIcon aria-hidden="true" className="size-4 text-muted" />
        <span className="max-w-[12rem] truncate">{tenant.name}</span>
        <ChevronUpDownIcon aria-hidden="true" className="size-4 text-muted" />
      </Button>

      <Dropdown.Popover className="min-w-[220px]" placement="bottom start">
        <Dropdown.Menu
          disallowEmptySelection
          selectedKeys={new Set([tenant.id])}
          selectionMode="single"
          onAction={handleAction}
        >
          {tenants.map((item: TenantSummary) => (
            <Dropdown.Item key={item.id} id={item.id} textValue={item.name}>
              <BuildingLibraryIcon aria-hidden="true" className="size-4 text-muted" />
              <Label>{item.name}</Label>
            </Dropdown.Item>
          ))}
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}
