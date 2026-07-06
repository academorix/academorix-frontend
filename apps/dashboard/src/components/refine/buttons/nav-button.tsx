/**
 * @file nav-button.tsx
 * @module components/refine/buttons/nav-button
 *
 * @description
 * Shared plumbing for the **navigation** action buttons (list / create / edit /
 * show / clone). Each of those buttons calls its Refine hook
 * (`useListButton`, `useEditButton`, …) to resolve `{ to, label, hidden,
 * disabled }` — where `hidden`/`disabled` already fold in access-control from
 * the app's `accessControlProvider` — then delegates the actual rendering to
 * the {@link NavButton} presenter here.
 *
 * `NavButton` renders a HeroUI `Button` that routes client-side via React
 * Router's `navigate`, so we get real SPA navigation without duplicating the
 * hidden/disabled/label logic in five places.
 */

import { Button } from "@academorix/ui/react";
import { useNavigate } from "react-router";

import type { ButtonProps } from "@academorix/ui/react";
import type { BaseKey } from "@refinedev/core";
import type { ReactNode } from "react";

/**
 * HeroUI `Button` props a caller may pass through to any action button. We own
 * `onPress` (it performs the navigation/action) and `children` (defaulted to an
 * icon + label), so both are excluded from the passthrough surface.
 */
export type ButtonPassthroughProps = Omit<ButtonProps, "onPress" | "children">;

/**
 * Props common to buttons that act on a **single record** (edit, show, clone,
 * delete, refresh): they may target a specific resource/record and configure
 * access control.
 */
export interface RecordActionButtonProps extends ButtonPassthroughProps {
  /** Resource name; defaults to the resource inferred from the route. */
  resource?: string;
  /** Record id to act on; defaults to the `:id` route param. */
  recordItemId?: BaseKey;
  /** Access-control behaviour (enable the check, hide when unauthorized). */
  accessControl?: { enabled?: boolean; hideIfUnauthorized?: boolean };
  /** Extra params for URL generation. */
  meta?: Record<string, unknown>;
  /** Overrides the default icon + label content. */
  children?: ReactNode;
}

/**
 * Props common to buttons that act on a **resource** rather than a record
 * (list, create).
 */
export interface ResourceActionButtonProps extends ButtonPassthroughProps {
  /** Resource name; defaults to the resource inferred from the route. */
  resource?: string;
  /** Access-control behaviour (enable the check, hide when unauthorized). */
  accessControl?: { enabled?: boolean; hideIfUnauthorized?: boolean };
  /** Extra params for URL generation. */
  meta?: Record<string, unknown>;
  /** Overrides the default icon + label content. */
  children?: ReactNode;
}

/** Props for the internal {@link NavButton} presenter. */
interface NavButtonProps extends ButtonPassthroughProps {
  /** Destination path resolved by the Refine navigation hook. */
  to: string;
  /** Default human label (e.g. "Edit"). */
  label: string;
  /** Whether the button is hidden (unauthorized / no route). */
  hidden: boolean;
  /** Whether the button is disabled (unauthorized but shown). */
  disabled: boolean;
  /** Leading glyph rendered before the label. */
  icon: ReactNode;
  /** Optional content override; falls back to `icon` + `label`. */
  children?: ReactNode;
}

/**
 * Renders a HeroUI button that navigates to `to` on press. Returns `null` when
 * `hidden`, so callers can render it unconditionally.
 *
 * @param props - Resolved navigation values plus HeroUI button passthrough.
 */
export function NavButton({
  to,
  label,
  hidden,
  disabled,
  icon,
  children,
  ...buttonProps
}: NavButtonProps): ReactNode {
  const navigate = useNavigate();

  if (hidden) {
    return null;
  }

  // Icon-only buttons drop the text label (callers supply `aria-label`).
  const content = children ?? (
    <>
      {icon}
      {buttonProps.isIconOnly ? null : label}
    </>
  );

  return (
    <Button isDisabled={disabled} variant="secondary" {...buttonProps} onPress={() => navigate(to)}>
      {content}
    </Button>
  );
}
