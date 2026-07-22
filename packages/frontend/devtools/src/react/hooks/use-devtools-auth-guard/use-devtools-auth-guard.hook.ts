/**
 * @file use-devtools-auth-guard.hook.ts
 * @module @stackra/devtools/react/hooks
 * @description Resolve a panel's optional `IDevtoolsAuthGate`
 *   against the ambient `AUTH_SERVICE` — falls open when
 *   `@stackra/auth` isn't installed.
 *
 *   Devtools is a dev tool, not a hard security boundary — we
 *   intentionally never fail closed on a missing auth service.
 *   The gate exists primarily to hide sensitive panels behind an
 *   RBAC check on a staging build; a broken or absent auth service
 *   would otherwise render the shell useless.
 */

import { useMemo } from "react";
import type { IDevtoolsAuthGate } from "@stackra/contracts";
import { useOptionalInject } from "@stackra/container/react";
import { AUTH_SERVICE } from "@stackra/contracts";

/** Reason a gate blocked the panel — powers the locked-state branching. */
export type DevtoolsAuthDenyReason = "unauthenticated" | "forbidden";

/** Result returned by {@link useDevtoolsAuthGuard}. */
export interface IUseDevtoolsAuthGuardResult {
  /** Whether the caller is allowed to see the gated panel. */
  readonly allowed: boolean;
  /**
   * Why the caller was denied — only meaningful when `allowed`
   * is `false`.
   */
  readonly reason: DevtoolsAuthDenyReason | null;
}

/**
 * Minimal `IAuthService` shape we consume — kept private to avoid
 * coupling to the full `@stackra/auth` runtime surface (which we
 * only optionally peer-depend on).
 */
interface IAuthServiceLike {
  readonly isAuthenticated?: boolean | (() => boolean);
  readonly currentUser?: unknown;
  can?: (ability: string, resource?: unknown) => boolean;
}

/**
 * Resolve a gate to `{ allowed, reason }`.
 *
 * @param gate - Optional gate. When omitted, the hook always
 *   returns `{ allowed: true }`.
 */
export function useDevtoolsAuthGuard(gate?: IDevtoolsAuthGate): IUseDevtoolsAuthGuardResult {
  const authService = useOptionalInject<IAuthServiceLike>(AUTH_SERVICE);

  return useMemo<IUseDevtoolsAuthGuardResult>(() => {
    // No gate → allow. This is the common case for the vast
    // majority of panels.
    if (!gate) return { allowed: true, reason: null };

    // Auth service absent → fail-open. The devtools shell is not
    // a hard security boundary; missing `@stackra/auth` shouldn't
    // deny an otherwise valid dev session.
    if (!authService) return { allowed: true, reason: null };

    // Detect unauthenticated first — it drives a different UI
    // affordance ("Sign in") than a plain forbidden ("Contact
    // admin").
    const isAuthed =
      typeof authService.isAuthenticated === "function"
        ? authService.isAuthenticated()
        : Boolean(authService.isAuthenticated ?? authService.currentUser);
    if (!isAuthed) return { allowed: false, reason: "unauthenticated" };

    // Ability check — we default to `false` when the auth service
    // doesn't implement `.can(...)`, matching a conservative RBAC
    // stance (unknown implementation → deny).
    const can = authService.can?.(gate.ability, gate.resource) ?? false;
    return can ? { allowed: true, reason: null } : { allowed: false, reason: "forbidden" };
  }, [authService, gate]);
}
