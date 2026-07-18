/**
 * @file general.tsx
 * @module modules/settings/pages/general
 *
 * @description
 * The General settings section — the primary Settings landing page. Phase 4a
 * ships a functional but read-only view built from the identity's tenant
 * data (workspace name, slug, timezone) so operators can see the workspace
 * profile immediately. Phase 4b upgrades these rows to editable
 * `CellSelect` / `TextField` inputs backed by the future tenant-settings
 * resource.
 */

import { Card, Chip, InlineTip } from "@stackra/ui/react";
import { useGetIdentity } from "@refinedev/core";

import type { Identity } from "@/types";
import type { ReactNode } from "react";

import { SectionPage } from "@/modules/settings/pages/section-page";

/**
 * Renders a single read-only settings row. Extracted so the page reads as a
 * declarative list rather than a wall of divs.
 */
function ReadOnlyRow({ label, value }: { label: string; value: ReactNode }): ReactNode {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border py-3 last:border-b-0">
      <div className="flex min-w-0 flex-col">
        <span className="text-sm font-medium text-foreground">{label}</span>
      </div>
      <div className="min-w-0 shrink-0 text-sm text-muted">{value}</div>
    </div>
  );
}

/** General settings page. */
export default function GeneralSettingsPage(): ReactNode {
  const { data: identity } = useGetIdentity<Identity>();
  const tenant = identity?.tenant;

  return (
    <SectionPage sectionId="general">
      <InlineTip title="Read-only preview" variant="info">
        These values are read-only in the current release. Editable forms land in the next Settings
        wave alongside the tenant-settings resource.
      </InlineTip>

      <Card>
        <Card.Header>
          <Card.Title>Workspace</Card.Title>
          <Card.Description>Basic details for this workspace.</Card.Description>
        </Card.Header>
        <Card.Content className="flex flex-col gap-0">
          <ReadOnlyRow label="Workspace name" value={tenant?.name ?? "—"} />
          <ReadOnlyRow
            label="Workspace slug"
            value={
              tenant?.slug ? (
                <Chip size="sm" variant="secondary">
                  {tenant.slug}
                </Chip>
              ) : (
                "—"
              )
            }
          />
          <ReadOnlyRow label="Business type" value={tenant?.business_type ?? "—"} />
          <ReadOnlyRow
            label="Status"
            value={
              tenant?.status ? (
                <Chip color="success" size="sm" variant="soft">
                  <Chip.Label className="capitalize">{tenant.status}</Chip.Label>
                </Chip>
              ) : (
                "—"
              )
            }
          />
        </Card.Content>
      </Card>

      <Card>
        <Card.Header>
          <Card.Title>Signed-in user</Card.Title>
          <Card.Description>The identity currently viewing this workspace.</Card.Description>
        </Card.Header>
        <Card.Content className="flex flex-col gap-0">
          <ReadOnlyRow label="Name" value={identity?.name ?? "—"} />
          <ReadOnlyRow label="Email" value={identity?.email ?? "—"} />
          <ReadOnlyRow
            label="Roles"
            value={
              identity?.roles && identity.roles.length > 0 ? (
                <div className="flex flex-wrap justify-end gap-1">
                  {identity.roles.map((role) => (
                    <Chip key={role} size="sm" variant="secondary">
                      <Chip.Label className="capitalize">{role}</Chip.Label>
                    </Chip>
                  ))}
                </div>
              ) : (
                "—"
              )
            }
          />
        </Card.Content>
      </Card>
    </SectionPage>
  );
}
