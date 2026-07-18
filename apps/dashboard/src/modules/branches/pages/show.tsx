/**
 * @file show.tsx
 * @module modules/branches/pages/show
 *
 * @description
 * Branch detail — location, capacity, contacts, and status.
 */

import { Card, Chip, Spinner } from "@stackra/ui/react";
import { useShow } from "@refinedev/core";

import type { Branch } from "@/types";
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

/** The branch detail page. */
export default function BranchShow(): ReactNode {
  const { result: branch, query } = useShow<Branch>({ resource: "branches" });

  return (
    <ShowView resource="branches">
      {query.isLoading || !branch ? (
        <div className="flex h-40 items-center justify-center">
          <Spinner aria-label="Loading" />
        </div>
      ) : (
        <Card>
          <Card.Header>
            <Card.Title>{branch.name}</Card.Title>
            <Card.Description>
              {branch.city}, {branch.country}
            </Card.Description>
          </Card.Header>
          <Card.Content>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Status">
                <EntityStatusChip status={branch.status} />
              </Field>
              <Field label="Default">
                {branch.is_default ? (
                  <Chip size="sm" variant="soft">
                    Default
                  </Chip>
                ) : (
                  "No"
                )}
              </Field>
              <Field label="Capacity">{branch.capacity}</Field>
              <Field label="Timezone">{branch.timezone}</Field>
              <Field label="Contact email">{branch.contact_email ?? "—"}</Field>
              <Field label="Contact phone">{branch.contact_phone ?? "—"}</Field>
              <Field label="Slug">{branch.slug}</Field>
              <Field label="Created">{formatDate(branch.created_at)}</Field>
              <Field label="Updated">{formatDate(branch.updated_at)}</Field>
            </dl>
          </Card.Content>
        </Card>
      )}
    </ShowView>
  );
}
