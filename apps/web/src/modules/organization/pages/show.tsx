/**
 * @file show.tsx
 * @module modules/organization/pages/show
 *
 * @description
 * Organization detail — identity, default flag, and lifecycle status.
 */

import { Card, Chip, Spinner } from "@academorix/ui/react";
import { useShow } from "@refinedev/core";

import type { Organization } from "@/types";
import type { ReactNode } from "react";

import { EntityStatusChip } from "@/components/entity-status-chip";
import { ShowView } from "@/components/refine";
import { formatDate } from "@/lib/format";

/** A single labelled detail field. */
function Field({ label, children }: { label: string; children: ReactNode }): ReactNode {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-xs font-medium tracking-wide text-muted uppercase">{label}</dt>
      <dd className="text-sm text-foreground">{children}</dd>
    </div>
  );
}

/** The organization detail page. */
export default function OrganizationShow(): ReactNode {
  const { result: organization, query } = useShow<Organization>({ resource: "organizations" });

  return (
    <ShowView resource="organizations">
      {query.isLoading || !organization ? (
        <div className="flex h-40 items-center justify-center">
          <Spinner aria-label="Loading" />
        </div>
      ) : (
        <Card>
          <Card.Header>
            <Card.Title>{organization.name}</Card.Title>
            <Card.Description>Organization</Card.Description>
          </Card.Header>
          <Card.Content>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Status">
                <EntityStatusChip status={organization.status} />
              </Field>
              <Field label="Default">
                {organization.is_default ? (
                  <Chip size="sm" variant="soft">
                    Default
                  </Chip>
                ) : (
                  "No"
                )}
              </Field>
              <Field label="Parent">{organization.parent_id ?? "—"}</Field>
              <Field label="Created">{formatDate(organization.created_at)}</Field>
              <Field label="Updated">{formatDate(organization.updated_at)}</Field>
            </dl>
          </Card.Content>
        </Card>
      )}
    </ShowView>
  );
}
