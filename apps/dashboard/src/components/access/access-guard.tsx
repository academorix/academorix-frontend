/**
 * @file access-guard.tsx
 * @module components/access/access-guard
 *
 * @description
 * Central RBAC page guard built on Refine's `useCan` hook (which delegates to
 * the {@link "@/providers/access-control" accessControlProvider}). Wrapping a
 * view's body in {@link ResourceAccessGuard} means a user who reaches a page
 * they lack permission for — e.g. by typing the URL — sees an
 * {@link AccessDenied} panel instead of the content. The sidebar already hides
 * such entries; this closes the direct-navigation gap so authorization is
 * enforced, not just visual.
 *
 * Refine also ships a `<CanAccess>` component (used for finer-grained inline
 * gating); this wrapper adds resource resolution + graceful loading so whole
 * pages don't flash blank while the (in-memory) check resolves.
 */

import { LockClosedIcon } from "@academorix/ui/icons/outline";
import { useCan, useResourceParams, useTranslate } from "@refinedev/core";

import type { ReactNode } from "react";

/** The CRUD actions a page can be guarded against. */
export type ResourceAction = "list" | "show" | "create" | "edit" | "delete" | "clone";

/** Full-height empty state shown when the current user lacks access. */
export function AccessDenied({ reason }: { reason?: string }): ReactNode {
  const translate = useTranslate();

  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 px-6 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-danger/10 text-danger">
        <LockClosedIcon aria-hidden="true" className="size-6" />
      </div>
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold text-foreground">
          {translate("app.accessDenied.title", "Access denied")}
        </h2>
        <p className="max-w-sm text-sm text-muted">
          {reason ??
            translate(
              "app.accessDenied.description",
              "You don't have permission to view this page.",
            )}
        </p>
      </div>
    </div>
  );
}

/** Props for {@link ResourceAccessGuard}. */
interface ResourceAccessGuardProps {
  /** The action being attempted on the resource. */
  action: ResourceAction;
  /** Resource name override; defaults to the current route's resource. */
  resource?: string;
  /** The content to render when access is granted. */
  children: ReactNode;
}

/**
 * Renders `children` when the current identity may perform `action` on the
 * resource, otherwise an {@link AccessDenied} panel. Optimistic while the check
 * resolves (the provider is in-memory) so the page never flashes blank; it only
 * denies once the provider answers `can === false`.
 *
 * @param props - The action, optional resource override, and guarded content.
 */
export function ResourceAccessGuard({
  action,
  resource,
  children,
}: ResourceAccessGuardProps): ReactNode {
  const { resource: routeResource, identifier } = useResourceParams({ resource });
  const resourceName = resource ?? identifier ?? routeResource?.name;

  const { data, isLoading } = useCan({
    resource: resourceName,
    action,
    params: { resource: routeResource },
  });

  if (!isLoading && data?.can === false) {
    return <AccessDenied reason={data.reason} />;
  }

  return <>{children}</>;
}
