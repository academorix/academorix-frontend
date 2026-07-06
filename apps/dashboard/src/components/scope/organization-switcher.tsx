/**
 * @file organization-switcher.tsx
 * @module components/scope/organization-switcher
 *
 * @description
 * Switches the active organization. Changing it cascades: the branch is
 * re-validated to stay within the new organization (handled by the scope
 * provider). Renders read-only when the caller has a single organization.
 */

import { BuildingOffice2Icon } from "@academorix/ui/icons/outline";

import type { ReactNode } from "react";

import { ScopeSelect } from "@/components/scope/scope-select";
import { useScope } from "@/lib/scope";

/** The active-organization switcher for the app shell. */
export function OrganizationSwitcher(): ReactNode {
  const { scope, allowed, setOrganization } = useScope();

  return (
    <ScopeSelect
      ariaLabel="Organization"
      icon={BuildingOffice2Icon}
      options={allowed.organizations.map((org) => ({ id: org.id, name: org.name }))}
      value={scope.organizationId}
      onChange={setOrganization}
    />
  );
}
