/**
 * @file workspace-switcher.tsx
 * @module components/workspace-switcher
 *
 * @description
 * Dropdown surfacing every workspace the caller belongs to (via
 * `GET /api/v1/me/workspaces`). Clicking a workspace navigates to
 * that tenant's subdomain — a full-page navigation, not a client-
 * side route, because each workspace is served from a different
 * origin.
 *
 * ## Placement
 *
 * Rendered as an inline chevron next to the workspace pill inside
 * the sidebar user dropdown. Kept as its own component so both the
 * sidebar and the navbar can reuse it in the future without
 * duplicating the fetch / cache logic.
 *
 * ## Staff-only membership behavior
 *
 * Backend flags "staff-only" memberships — memberships granted for
 * operational reasons that shouldn't appear on the family-facing
 * switcher. The switcher hides those by default; a "Show all"
 * toggle at the bottom reveals them when the caller explicitly
 * asks.
 */

import { Button, Chip, Dropdown, Label, Separator, Spinner } from "@heroui/react";
import { useMemo, useState } from "react";
import { useNavigate } from "@stackra/routing/react";

import type { ReactNode } from "react";
import type { MyWorkspaceEntry } from "@/lib/api/auth-api";

import { Iconify } from "@/icons/iconify";
import { useMyWorkspaces } from "@/hooks/use-my-workspaces";
import { resolveWorkspace } from "@/lib/auth/workspace-resolver";

/**
 * Compact chip trigger. Clicked when the operator wants to switch
 * workspaces without opening a whole dropdown surface.
 */
export function WorkspaceSwitcher({ className }: { className?: string }): ReactNode {
  const navigate = useNavigate();
  const { workspaces, isLoading, error, refresh } = useMyWorkspaces();
  const [showStaffOnly, setShowStaffOnly] = useState<boolean>(false);
  const currentContext = useMemo(() => resolveWorkspace(), []);
  const currentSlug = currentContext.mode === "tenant" ? currentContext.slug : null;

  // Sort: current workspace first, then most-recently active, then alphabetical.
  const sorted = useMemo<readonly MyWorkspaceEntry[]>(() => {
    const list = [...workspaces];

    list.sort((a, b) => {
      if (a.slug === currentSlug) return -1;
      if (b.slug === currentSlug) return 1;

      const aTime = a.last_active_at ? Date.parse(a.last_active_at) : 0;
      const bTime = b.last_active_at ? Date.parse(b.last_active_at) : 0;

      if (aTime !== bTime) return bTime - aTime;

      return a.name.localeCompare(b.name);
    });

    return list;
  }, [workspaces, currentSlug]);

  const visible = useMemo(
    () => (showStaffOnly ? sorted : sorted.filter((entry) => !entry.is_staff_only_workspace)),
    [sorted, showStaffOnly],
  );

  const staffOnlyCount = sorted.filter((entry) => entry.is_staff_only_workspace).length;

  const handlePick = (workspace: MyWorkspaceEntry): void => {
    // Same workspace — no-op. Prevents an unnecessary full-page
    // reload if the operator clicks the currently-active row.
    if (workspace.slug === currentSlug) return;

    // Cross-origin navigation — the target workspace lives on a
    // different subdomain. Client-side routing would never resolve
    // it; we need a real browser navigation.
    if (typeof window !== "undefined") {
      const { protocol, port } = window.location;
      const centralHost = (import.meta.env.VITE_CENTRAL_HOST as string | undefined) ?? "localhost";
      const portSuffix = port ? `:${port}` : "";
      const url = `${protocol}//${workspace.slug}.${centralHost}${portSuffix}/dashboard`;

      window.location.assign(url);

      return;
    }

    // SSR / test fallback — surface as an in-app navigation.
    navigate(`/dashboard?tenant=${workspace.slug}`);
  };

  return (
    <Dropdown>
      <Button
        aria-label="Switch workspace"
        className={
          "inline-flex items-center gap-1 rounded-md px-1.5 py-1 hover:bg-default/60 " +
          (className ?? "")
        }
        size="sm"
        variant="ghost"
      >
        <Iconify className="size-3.5" icon="chevrons-up-down" />
      </Button>
      <Dropdown.Popover className="min-w-64" placement="bottom start">
        <Dropdown.Menu
          onAction={(key) => {
            if (key === "__toggle-staff__") {
              setShowStaffOnly((prev) => !prev);

              return;
            }

            const workspace = visible.find((entry) => entry.id === key);

            if (workspace) handlePick(workspace);
          }}
        >
          {isLoading && workspaces.length === 0 ? (
            <Dropdown.Item id="__loading__" isDisabled textValue="Loading workspaces…">
              <Spinner color="current" size="sm" />
              <Label>Loading workspaces…</Label>
            </Dropdown.Item>
          ) : error && workspaces.length === 0 ? (
            <Dropdown.Item id="__error__" isDisabled textValue="Couldn't load workspaces">
              <Iconify className="size-4 shrink-0" icon="triangle-exclamation" />
              <div className="flex flex-1 flex-col">
                <Label>Couldn't load workspaces</Label>
                <span className="text-xs text-muted">{error.message}</span>
              </div>
              <Button onPress={refresh} size="sm" variant="secondary">
                Retry
              </Button>
            </Dropdown.Item>
          ) : (
            visible.map((workspace) => (
              <Dropdown.Item id={workspace.id} key={workspace.id} textValue={workspace.name}>
                {workspace.logo_url ? (
                  <img
                    alt=""
                    className="size-5 shrink-0 rounded-md bg-white object-contain p-0.5 ring-1 ring-border"
                    src={workspace.logo_url}
                  />
                ) : (
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-md bg-surface-secondary text-muted">
                    <Iconify className="size-3" icon="rocket" />
                  </span>
                )}
                <div className="flex flex-1 flex-col overflow-hidden">
                  <Label className="truncate">{workspace.name}</Label>
                  <span className="truncate text-[11px] text-muted">
                    {workspace.slug} · {workspace.role}
                  </span>
                </div>
                {workspace.slug === currentSlug ? (
                  <Chip color="accent" size="sm" variant="soft">
                    <Chip.Label>Current</Chip.Label>
                  </Chip>
                ) : null}
              </Dropdown.Item>
            ))
          )}

          {/* Staff-only toggle — only rendered when there are actually
              some hidden entries, so the row doesn't appear on
              family-only accounts. */}
          {staffOnlyCount > 0 ? (
            <>
              <Separator />
              <Dropdown.Item id="__toggle-staff__" textValue="Toggle staff workspaces">
                <Iconify className="size-4 shrink-0" icon={showStaffOnly ? "eye-slash" : "eye"} />
                <Label>
                  {showStaffOnly
                    ? "Hide staff-only workspaces"
                    : `Show staff-only workspaces (${staffOnlyCount})`}
                </Label>
              </Dropdown.Item>
            </>
          ) : null}
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}
