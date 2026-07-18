/**
 * @file create-button.tsx
 * @module components/refine/buttons/create-button
 *
 * @description
 * Navigates to a resource's create screen. Access-control aware via
 * `useCreateButton` (hidden/disabled reflect the `accessControlProvider`).
 */

import { PlusIcon } from "@stackra/ui/icons/heroicon/outline";
import { useCreateButton } from "@refinedev/core";

import type { ResourceActionButtonProps } from "@/components/refine/buttons/nav-button";
import type { ReactNode } from "react";

import { NavButton } from "@/components/refine/buttons/nav-button";

/**
 * A button that routes to the resource's `create` action. Defaults to the
 * `primary` variant since creation is the primary call-to-action on a list.
 *
 * @param props - Resource, access-control, and HeroUI button passthrough props.
 */
export function CreateButton({
  resource,
  accessControl,
  meta,
  children,
  ...buttonProps
}: ResourceActionButtonProps): ReactNode {
  const { to, label, hidden, disabled } = useCreateButton({ resource, accessControl, meta });

  return (
    <NavButton
      disabled={disabled}
      hidden={hidden}
      icon={<PlusIcon aria-hidden="true" className="size-4" />}
      label={label}
      to={to}
      variant="primary"
      {...buttonProps}
    >
      {children}
    </NavButton>
  );
}
