/**
 * @file show-button.tsx
 * @module components/refine/buttons/show-button
 *
 * @description
 * Navigates to a record's detail (show) screen. Access-control aware via
 * `useShowButton` (hidden/disabled reflect the `accessControlProvider`).
 */

import { EyeIcon } from "@academorix/ui/icons/outline";
import { useShowButton } from "@refinedev/core";

import type { RecordActionButtonProps } from "@/components/refine/buttons/nav-button";
import type { ReactNode } from "react";

import { NavButton } from "@/components/refine/buttons/nav-button";

/**
 * A button that routes to the record's `show` action.
 *
 * @param props - Resource, record id, access-control, and button passthrough.
 */
export function ShowButton({
  resource,
  recordItemId,
  accessControl,
  meta,
  children,
  ...buttonProps
}: RecordActionButtonProps): ReactNode {
  const { to, label, hidden, disabled } = useShowButton({
    resource,
    id: recordItemId,
    accessControl,
    meta,
  });

  return (
    <NavButton
      disabled={disabled}
      hidden={hidden}
      icon={<EyeIcon aria-hidden="true" className="size-4" />}
      label={label}
      to={to}
      {...buttonProps}
    >
      {children}
    </NavButton>
  );
}
