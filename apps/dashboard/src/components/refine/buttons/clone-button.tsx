/**
 * @file clone-button.tsx
 * @module components/refine/buttons/clone-button
 *
 * @description
 * Navigates to the create screen pre-filled from an existing record (Refine's
 * `clone` action). Access-control aware via `useCloneButton`.
 */

import { DocumentDuplicateIcon } from "@stackra/ui/icons/heroicon/outline";
import { useCloneButton } from "@refinedev/core";

import type { RecordActionButtonProps } from "@/components/refine/buttons/nav-button";
import type { ReactNode } from "react";

import { NavButton } from "@/components/refine/buttons/nav-button";

/**
 * A button that routes to the record's `clone` action.
 *
 * @param props - Resource, record id, access-control, and button passthrough.
 */
export function CloneButton({
  resource,
  recordItemId,
  accessControl,
  meta,
  children,
  ...buttonProps
}: RecordActionButtonProps): ReactNode {
  const { to, label, hidden, disabled } = useCloneButton({
    resource,
    id: recordItemId,
    accessControl,
    meta,
  });

  return (
    <NavButton
      disabled={disabled}
      hidden={hidden}
      icon={<DocumentDuplicateIcon aria-hidden="true" className="size-4" />}
      label={label}
      to={to}
      {...buttonProps}
    >
      {children}
    </NavButton>
  );
}
