/**
 * @file protected.component.tsx
 * @module @academorix/access-control/components/protected
 *
 * @description
 * Route guard component. Wraps a page component so unauthorized
 * users see the fallback (or are redirected via the injected
 * `useNavigate` hook). Framework-agnostic — accepts the navigation
 * callback so React Router / TanStack Router / Next all plug in.
 */

"use client";

import React, { useEffect } from "react";

import { useHasAllPermissions } from "../../hooks/use-has-all-permissions";
import { useHasAnyPermission } from "../../hooks/use-has-any-permission";
import { useHasAnyRole } from "../../hooks/use-has-any-role";

/**
 * Props for `<Protected>`.
 */
export interface ProtectedProps {
  /** Permission names — user must hold ALL of them. */
  readonly requireAllPermissions?: readonly string[];
  /** Permission names — user must hold AT LEAST ONE. */
  readonly requireAnyPermission?: readonly string[];
  /** Role names — user must hold AT LEAST ONE. */
  readonly requireAnyRole?: readonly string[];
  /** Fallback rendered when the check fails. */
  readonly fallback?: React.ReactNode;
  /** Redirect callback fired when the check fails and no fallback is present. */
  readonly onDeny?: () => void;
  /** Children rendered when the check passes. */
  readonly children: React.ReactNode;
}

/**
 * `<Protected>` — route guard.
 */
export function Protected(props: ProtectedProps): React.ReactElement | null {
  const {
    requireAllPermissions = [],
    requireAnyPermission = [],
    requireAnyRole = [],
    fallback,
    onDeny,
    children,
  } = props;

  const passesAll = useHasAllPermissions(requireAllPermissions);
  const passesAny =
    requireAnyPermission.length === 0 ? true : useHasAnyPermission(requireAnyPermission);
  const passesAnyRole = requireAnyRole.length === 0 ? true : useHasAnyRole(requireAnyRole);

  const allowed = passesAll && passesAny && passesAnyRole;

  useEffect(() => {
    if (!allowed && !fallback && onDeny) {
      onDeny();
    }
  }, [allowed, fallback, onDeny]);

  if (!allowed) {
    return fallback ? <>{fallback}</> : null;
  }
  return <>{children}</>;
}

Protected.displayName = "Protected";
