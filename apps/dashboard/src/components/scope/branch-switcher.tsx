/**
 * @file branch-switcher.tsx
 * @module components/scope/branch-switcher
 *
 * @description
 * Switches the active branch (venue). The options are already filtered to the
 * active organization by the scope provider. Renders read-only when the caller
 * has a single branch.
 */

import { MapPinIcon } from "@academorix/ui/icons/outline";

import type { ReactNode } from "react";

import { ScopeSelect } from "@/components/scope/scope-select";
import { useScope } from "@/lib/scope";

/** The active-branch switcher for the app shell. */
export function BranchSwitcher(): ReactNode {
  const { scope, allowed, setBranch } = useScope();

  return (
    <ScopeSelect
      ariaLabel="Branch"
      icon={MapPinIcon}
      options={allowed.branches.map((branch) => ({ id: branch.id, name: branch.name }))}
      value={scope.branchId}
      onChange={setBranch}
    />
  );
}
