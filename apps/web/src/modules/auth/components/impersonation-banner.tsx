/**
 * @file impersonation-banner.tsx
 * @module modules/auth/components/impersonation-banner
 *
 * @description
 * A sticky banner shown at the top of every protected page while a platform
 * admin is impersonating a tenant user. Reads the impersonation state from
 * `providers/auth/session` (persisted in sessionStorage so the banner survives
 * reloads) and offers a "Stop impersonation" button that revokes the token
 * and drops the caller back to `/login`.
 */

import { EyeIcon, XMarkIcon } from "@academorix/ui/icons/outline";
import { Button } from "@academorix/ui/react";
import { useLogout } from "@refinedev/core";

import type { ReactNode } from "react";

import { getImpersonation } from "@/providers/auth/session";

/**
 * Renders the impersonation banner when appropriate, or `null` when the caller
 * is acting as themselves. Rendered inside the authenticated shell.
 */
export function ImpersonationBanner(): ReactNode {
  const state = getImpersonation();

  const { mutate: logout } = useLogout();

  if (!state) {
    return null;
  }

  return (
    <div
      className="flex items-center gap-2 border-b border-warning/30 bg-warning/10 px-4 py-2 text-xs text-warning"
      role="status"
    >
      <EyeIcon aria-hidden="true" className="size-4 shrink-0" />
      <span className="flex-1 truncate">
        Impersonating this workspace as{" "}
        <strong className="font-semibold">{state.admin.name}</strong>
        {state.expiresAt ? ` (session ends ${new Date(state.expiresAt).toLocaleTimeString()})` : ""}
      </span>
      <Button aria-label="Stop impersonation" size="sm" variant="tertiary" onPress={() => logout()}>
        <XMarkIcon aria-hidden="true" className="size-4" />
        Stop
      </Button>
    </div>
  );
}
