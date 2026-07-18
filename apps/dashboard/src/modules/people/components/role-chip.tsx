/**
 * @file role-chip.tsx
 * @module modules/people/components/role-chip
 *
 * @description
 * Renders a {@link RoleInTenant} as a soft, color-coded HeroUI `Chip`. Used
 * by the tenant-projections table on the show page so athlete/coach/staff/
 * guardian roles read consistently.
 */

import { Chip } from "@stackra/ui/react";

import type { RoleInTenant } from "@/modules/people/people.types";
import type { ReactNode } from "react";

import { ROLE_IN_TENANT_CHIP_COLORS } from "@/modules/people/people.config";
import { ROLE_IN_TENANT_LABELS } from "@/modules/people/people.types";

/** Props for {@link RoleChip}. */
export interface RoleChipProps {
  /** The role-in-tenant to render. */
  role: RoleInTenant;
}

/** A soft, color-coded chip for a person's role in a single tenant. */
export function RoleChip({ role }: RoleChipProps): ReactNode {
  return (
    <Chip color={ROLE_IN_TENANT_CHIP_COLORS[role]} size="sm" variant="soft">
      {ROLE_IN_TENANT_LABELS[role]}
    </Chip>
  );
}
