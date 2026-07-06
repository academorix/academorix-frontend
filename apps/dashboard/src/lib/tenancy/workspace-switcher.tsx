/**
 * @file workspace-switcher.tsx
 * @module lib/tenancy/workspace-switcher
 *
 * @description
 * Slack-style workspace switcher shown at the top of the authenticated shell's
 * sidebar. Displays the current workspace (from {@link "@/lib/tenancy" useTenancy})
 * and, when the caller belongs to more than one, offers a dropdown of the
 * others plus "Add a workspace" and "Back to workspaces" actions.
 *
 * Selecting another workspace **full-navigates** the browser to that tenant's
 * subdomain (via {@link "@/lib/http" buildTenantUrl}) — bearer tokens are
 * same-origin-scoped by design, so the destination subdomain naturally starts
 * a fresh session on `/login`. The central-host workspace picker is the same
 * concept for anonymous visitors; this component is its authenticated twin.
 */

import {
  ArrowRightIcon,
  BuildingLibraryIcon,
  ChevronUpDownIcon,
  PlusIcon,
} from "@academorix/ui/icons/outline";
import { Avatar, Button, Dropdown, Label } from "@academorix/ui/react";

import type { WorkspaceListEntry } from "@/lib/tenancy/tenancy.types";
import type { Key, ReactNode } from "react";

import { buildCentralUrl, buildTenantUrl } from "@/lib/http";
import { appRoutes } from "@/lib/module";
import { useTenancy } from "@/lib/tenancy/tenant-context";
import { useMyWorkspaces } from "@/lib/tenancy/use-workspaces";

/** Sentinel dropdown ids for the "add a workspace" + "back to picker" actions. */
const CREATE_WORKSPACE_ITEM = "__create_workspace__";
const BACK_TO_PICKER_ITEM = "__back_to_picker__";

/**
 * Renders the current workspace's name (with a static icon when there's only
 * one to choose from), or a dropdown listing every workspace the caller can
 * access plus a "Add a workspace" affordance.
 *
 * Mounted in the sidebar header of the authenticated shell. Central-host
 * mounts of the shell (if any) are handled gracefully — the switcher just
 * shows nothing when the current session has no tenant to name.
 */
export function WorkspaceSwitcher(): ReactNode {
  const { tenant, host } = useTenancy();
  const { workspaces, isLoading } = useMyWorkspaces();

  // On a central host inside the shell there is no active tenant to name.
  if (!tenant) {
    return null;
  }

  // Compute "other" workspaces (i.e. anything not the current one) so we know
  // whether to render a static indicator or a dropdown.
  const otherWorkspaces = workspaces.filter((workspace) => workspace.slug !== tenant.slug);
  const canSwitch = otherWorkspaces.length > 0;

  // Single-workspace user (or workspaces still loading): show a static
  // indicator so the sidebar keeps a workspace-name affordance without a
  // useless dropdown.
  if (!canSwitch) {
    return (
      <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-foreground">
        <BuildingLibraryIcon aria-hidden="true" className="size-4 shrink-0 text-muted" />
        <span className="truncate font-medium">{tenant.name}</span>
      </div>
    );
  }

  const handleAction = (key: Key): void => {
    const id = String(key);

    if (id === CREATE_WORKSPACE_ITEM) {
      window.location.href = buildCentralUrl(appRoutes.createWorkspace);

      return;
    }

    if (id === BACK_TO_PICKER_ITEM) {
      window.location.href = buildCentralUrl(appRoutes.workspacePicker);

      return;
    }

    const target = workspaces.find((workspace) => workspace.id === id);

    if (target) {
      window.location.href = buildTenantUrl(target.slug, appRoutes.dashboard);
    }
  };

  return (
    <Dropdown>
      <Button
        aria-label="Switch workspace"
        className="w-full justify-between gap-2 px-2"
        isDisabled={isLoading}
        variant="ghost"
      >
        <span className="flex min-w-0 items-center gap-2">
          <BuildingLibraryIcon aria-hidden="true" className="size-4 shrink-0 text-muted" />
          <span className="truncate font-medium text-foreground">{tenant.name}</span>
        </span>
        <ChevronUpDownIcon aria-hidden="true" className="size-4 shrink-0 text-muted" />
      </Button>

      <Dropdown.Popover className="min-w-[260px]" placement="bottom start">
        <Dropdown.Menu
          disallowEmptySelection
          selectedKeys={new Set([tenant.id])}
          selectionMode="single"
          onAction={handleAction}
        >
          {/* Current workspace + other workspaces this user belongs to. */}
          <Dropdown.Item id={tenant.id} textValue={tenant.name}>
            <WorkspaceAvatar workspace={{ id: tenant.id, name: tenant.name, logo_url: null }} />
            <Label>
              <span className="flex flex-col">
                <span className="text-sm font-medium">{tenant.name}</span>
                <span className="text-xs text-muted">Current workspace</span>
              </span>
            </Label>
          </Dropdown.Item>

          {otherWorkspaces.map((workspace) => (
            <Dropdown.Item key={workspace.id} id={workspace.id} textValue={workspace.name}>
              <WorkspaceAvatar workspace={workspace} />
              <Label>
                <span className="flex flex-col">
                  <span className="text-sm font-medium">{workspace.name}</span>
                  <span className="text-xs text-muted">
                    {workspace.slug}
                    {workspace.role ? ` · ${workspace.role}` : ""}
                  </span>
                </span>
              </Label>
              <ArrowRightIcon aria-hidden="true" className="ms-auto size-4 text-muted" />
            </Dropdown.Item>
          ))}

          {/* Add + return-to-picker actions live below the workspace list. */}
          <Dropdown.Item id={CREATE_WORKSPACE_ITEM} textValue="Add a workspace">
            <PlusIcon aria-hidden="true" className="size-4 text-muted" />
            <Label>Add a workspace</Label>
          </Dropdown.Item>

          {host.kind === "tenant" ? (
            <Dropdown.Item id={BACK_TO_PICKER_ITEM} textValue="Back to workspace picker">
              <ArrowRightIcon aria-hidden="true" className="size-4 text-muted" />
              <Label>Back to workspace picker</Label>
            </Dropdown.Item>
          ) : null}
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}

/** Small avatar showing a workspace's logo or its first-letter fallback. */
function WorkspaceAvatar({
  workspace,
}: {
  workspace: Pick<WorkspaceListEntry, "id" | "name" | "logo_url">;
}): ReactNode {
  return (
    <Avatar className="size-5">
      {workspace.logo_url ? <Avatar.Image alt={workspace.name} src={workspace.logo_url} /> : null}
      <Avatar.Fallback>{workspace.name[0]?.toUpperCase() ?? "?"}</Avatar.Fallback>
    </Avatar>
  );
}
