/**
 * @file list-button.tsx
 * @module components/refine/buttons/list-button
 *
 * @description
 * Navigates to a resource's list screen. Access-control aware via
 * `useListButton` (hidden/disabled reflect the `accessControlProvider`).
 */

import { ListBulletIcon } from "@stackra/ui/icons/heroicon/outline";
import { useListButton } from "@refinedev/core";

import type { ResourceActionButtonProps } from "@/components/refine/buttons/nav-button";
import type { ReactNode } from "react";

import { NavButton } from "@/components/refine/buttons/nav-button";

/**
 * A button that routes to the resource's `list` action.
 *
 * @param props - Resource, access-control, and HeroUI button passthrough props.
 */
export function ListButton({
  resource,
  accessControl,
  meta,
  children,
  ...buttonProps
}: ResourceActionButtonProps): ReactNode {
  const { to, label, hidden, disabled } = useListButton({ resource, accessControl, meta });

  return (
    <NavButton
      disabled={disabled}
      hidden={hidden}
      icon={<ListBulletIcon aria-hidden="true" className="size-4" />}
      label={label}
      to={to}
      {...buttonProps}
    >
      {children}
    </NavButton>
  );
}
