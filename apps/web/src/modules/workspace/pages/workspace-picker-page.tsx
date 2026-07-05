/**
 * @file workspace-picker-page.tsx
 * @module modules/workspace/pages/workspace-picker-page
 *
 * @description
 * The Slack-style workspace picker (central host `/`). Signed-in users see a
 * grid of workspaces they can enter (`GET /api/v1/auth/workspaces` — backend
 * gap G3, fixture at `/data/workspaces.json`); anonymous users land on a
 * "sign in to your workspace" prompt that either lists their remembered slugs
 * from local storage or offers "Find my workspaces" / "Create a workspace".
 *
 * Selecting a workspace triggers a full-page navigation to
 * `https://{slug}.academorix.app` — the token store is subdomain-isolated by
 * design (bearer auth, `localStorage` is same-origin), so the destination
 * subdomain always starts a fresh session.
 */

import {
  ArrowRightIcon,
  BuildingOfficeIcon,
  MagnifyingGlassIcon,
  PlusIcon,
} from "@academorix/ui/icons/outline";
import { Avatar, Button, Card, Description, Spinner } from "@academorix/ui/react";
import { useNavigate } from "react-router";

import type { ReactNode } from "react";

import { siteConfig } from "@/config/site";
import { buildTenantUrl } from "@/lib/http";
import { appRoutes } from "@/lib/module";
import { useMyWorkspaces } from "@/lib/tenancy";

/** Formats a workspace's last-active timestamp for display. */
function formatLastActive(iso: string | null): string {
  if (!iso) {
    return "";
  }

  try {
    const date = new Date(iso);

    return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return "";
  }
}

/** The workspace-picker page. */
export default function WorkspacePickerPage(): ReactNode {
  const navigate = useNavigate();
  const { workspaces, isLoading, error } = useMyWorkspaces();

  return (
    <main className="flex min-h-dvh flex-col bg-background">
      {/* Simple central-host header. */}
      <header className="border-b border-default">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-6">
          <span className="text-lg font-semibold text-foreground">{siteConfig.name}</span>
          <Button size="sm" variant="tertiary" onPress={() => navigate(appRoutes.findWorkspaces)}>
            <MagnifyingGlassIcon aria-hidden="true" className="size-4" />
            Find my workspaces
          </Button>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col justify-center gap-8 px-6 py-16">
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-3xl font-semibold text-foreground">Pick a workspace</h1>
          <p className="max-w-lg text-muted">
            Choose the academy workspace you want to sign in to. Each workspace is fully isolated —
            you sign in per workspace.
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner aria-label="Loading workspaces" size="lg" />
          </div>
        ) : error ? (
          <Description className="text-center text-danger">
            Could not load workspaces: {error.message}
          </Description>
        ) : workspaces.length === 0 ? (
          <Card className="mx-auto max-w-md text-center">
            <Card.Content className="flex flex-col items-center gap-4 py-10">
              <BuildingOfficeIcon aria-hidden="true" className="size-10 text-muted" />
              <p className="text-sm text-muted">
                No workspaces yet. Create one to get started, or ask an admin to invite you.
              </p>
              <Button onPress={() => navigate(appRoutes.createWorkspace)}>
                <PlusIcon aria-hidden="true" className="size-4" />
                Create a workspace
              </Button>
            </Card.Content>
          </Card>
        ) : (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {workspaces.map((workspace) => (
              <li key={workspace.id}>
                <button
                  className="flex w-full items-center gap-4 rounded-lg border border-default bg-background p-4 text-start transition-colors hover:border-accent/50 hover:bg-default/20 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
                  type="button"
                  onClick={() => {
                    window.location.href = buildTenantUrl(workspace.slug, appRoutes.login);
                  }}
                >
                  <Avatar>
                    {workspace.logo_url ? (
                      <Avatar.Image alt={workspace.name} src={workspace.logo_url} />
                    ) : null}
                    <Avatar.Fallback>{workspace.name[0]?.toUpperCase() ?? "?"}</Avatar.Fallback>
                  </Avatar>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate font-medium text-foreground">{workspace.name}</span>
                    <span className="truncate text-xs text-muted">
                      {workspace.slug}.{siteConfig.name.toLowerCase()}.app
                      {workspace.role ? ` · ${workspace.role}` : ""}
                      {workspace.last_active_at
                        ? ` · Last active ${formatLastActive(workspace.last_active_at)}`
                        : ""}
                    </span>
                  </div>
                  <ArrowRightIcon aria-hidden="true" className="size-4 shrink-0 text-muted" />
                </button>
              </li>
            ))}
          </ul>
        )}

        {workspaces.length > 0 ? (
          <div className="flex flex-col items-center gap-3 pt-6">
            <Button variant="secondary" onPress={() => navigate(appRoutes.createWorkspace)}>
              <PlusIcon aria-hidden="true" className="size-4" />
              Create another workspace
            </Button>
          </div>
        ) : null}
      </div>
    </main>
  );
}
