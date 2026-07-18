/**
 * @file can-access.component.tsx
 * @module @academorix/access-control/components/can-access
 *
 * @description
 * Compound component that renders children only when the current
 * user is allowed to perform the specified action / hold the
 * specified permission or role.
 *
 * Two usage styles:
 *
 * ```tsx
 * // Direct — children render only when the check passes.
 * <CanAccess permission="role.create">
 *   <Button>Create role</Button>
 * </CanAccess>
 *
 * // Compound — explicit allowed / denied slots.
 * <CanAccess permission="role.create">
 *   <CanAccess.Show><Button>Create role</Button></CanAccess.Show>
 *   <CanAccess.Fallback><InfoBanner>Requires owner permission</InfoBanner></CanAccess.Fallback>
 * </CanAccess>
 * ```
 *
 * Prefers the hot-path context readers (no HTTP) when `permission`
 * or `role` is set. Falls back to server-side `useCan` when
 * `action` + `params` is set.
 */

"use client";

import React, { isValidElement } from "react";

import { useCan } from "../../hooks/use-can";
import { useHasPermission } from "../../hooks/use-has-permission";
import { useHasRole } from "../../hooks/use-has-role";
import type {
  CanAccessFallbackProps,
  CanAccessProps,
  CanAccessShowProps,
} from "./can-access.interface";

const SHOW_TAG = Symbol.for("@academorix/access-control:CanAccess.Show");
const FALLBACK_TAG = Symbol.for("@academorix/access-control:CanAccess.Fallback");

/**
 * `<CanAccess.Show>` — renders children when the check passes.
 */
function Show(props: CanAccessShowProps): React.ReactElement {
  return <>{props.children}</>;
}
Show.displayName = "CanAccess.Show";
(Show as unknown as { $$canAccessTag: symbol }).$$canAccessTag = SHOW_TAG;

/**
 * `<CanAccess.Fallback>` — renders children when the check fails.
 */
function Fallback(props: CanAccessFallbackProps): React.ReactElement {
  return <>{props.children}</>;
}
Fallback.displayName = "CanAccess.Fallback";
(Fallback as unknown as { $$canAccessTag: symbol }).$$canAccessTag = FALLBACK_TAG;

/**
 * Check whether a React element is one of the tagged slots.
 */
function isSlotOf(node: React.ReactNode, tag: symbol): boolean {
  if (!isValidElement(node)) return false;
  const type = node.type as unknown as { $$canAccessTag?: symbol };
  return type?.$$canAccessTag === tag;
}

/**
 * `<CanAccess>` — the root of the compound.
 */
export function CanAccess(props: CanAccessProps): React.ReactElement | null {
  const { permission, role, action, resource, params, fallback, children } = props;

  // Hot-path checks first — they read from context, no HTTP.
  const hasPermission = useHasPermission(permission ?? "");
  const hasRole = useHasRole(role ?? "");

  // Server-side check when action supplied.
  const shouldServerCheck = action !== undefined && params !== undefined;
  const serverCheck = useCan({ action: action ?? "", resource, params }, shouldServerCheck);

  // Determine the effective allow decision. Server check wins
  // when it's active; otherwise fall back to context.
  let allowed = true;
  if (permission !== undefined) allowed = allowed && hasPermission;
  if (role !== undefined) allowed = allowed && hasRole;
  if (shouldServerCheck) allowed = allowed && (serverCheck.data?.can ?? false);

  // Detect compound slots.
  const childArray = React.Children.toArray(children);
  const hasCompound = childArray.some((c) => isSlotOf(c, SHOW_TAG) || isSlotOf(c, FALLBACK_TAG));

  if (hasCompound) {
    const target = allowed ? SHOW_TAG : FALLBACK_TAG;
    const matched = childArray.filter((c) => isSlotOf(c, target));
    return <>{matched}</>;
  }

  return allowed ? <>{children}</> : fallback ? <>{fallback}</> : null;
}

CanAccess.Show = Show;
CanAccess.Fallback = Fallback;
CanAccess.displayName = "CanAccess";
