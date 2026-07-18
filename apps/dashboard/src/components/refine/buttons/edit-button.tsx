/**
 * @file edit-button.tsx
 * @module components/refine/buttons/edit-button
 *
 * @description
 * Navigates to a record's edit screen. Access-control aware via `useEditButton`
 * (hidden/disabled reflect the `accessControlProvider`).
 */

import { PencilSquareIcon } from "@stackra/ui/icons/heroicon/outline";
import { useEditButton } from "@refinedev/core";

import type { RecordActionButtonProps } from "@/components/refine/buttons/nav-button";
import type { ReactNode } from "react";

import { NavButton } from "@/components/refine/buttons/nav-button";

/**
 * A button that routes to the record's `edit` action.
 *
 * @param props - Resource, record id, access-control, and button passthrough.
 */
export function EditButton({
  resource,
  recordItemId,
  accessControl,
  meta,
  children,
  ...buttonProps
}: RecordActionButtonProps): ReactNode {
  const { to, label, hidden, disabled } = useEditButton({
    resource,
    id: recordItemId,
    accessControl,
    meta,
  });

  return (
    <NavButton
      disabled={disabled}
      hidden={hidden}
      icon={<PencilSquareIcon aria-hidden="true" className="size-4" />}
      label={label}
      to={to}
      {...buttonProps}
    >
      {children}
    </NavButton>
  );
}
