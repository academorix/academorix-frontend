/**
 * @file show.tsx
 * @module modules/sports/medical/pages/show
 *
 * @description
 * Medical record detail — type, clearance status/expiry, recorder, and the
 * restricted clinical summary. Sensitive data, gated by the `medical` permission.
 */

import { Card, Chip, Spinner } from "@stackra/ui/react";
import { useShow } from "@refinedev/core";

import type { MedicalRecord } from "@/types";
import type { ReactNode } from "react";

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

/** The medical record detail page. */
export default function MedicalShow(): ReactNode {
  const { result: record, query } = useShow<MedicalRecord>({ resource: "medical" });

  return (
    <ShowView resource="medical">
      {query.isLoading || !record ? (
        <div className="flex h-40 items-center justify-center">
          <Spinner aria-label="Loading" />
        </div>
      ) : (
        <Card>
          <Card.Header>
            <Card.Title className="capitalize">{record.type}</Card.Title>
            <Card.Description>Medical record</Card.Description>
          </Card.Header>
          <Card.Content>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Clearance">
                {record.is_cleared ? (
                  <Chip color="success" size="sm" variant="soft">
                    Cleared
                  </Chip>
                ) : (
                  <Chip color="danger" size="sm" variant="soft">
                    Not cleared
                  </Chip>
                )}
              </Field>
              <Field label="Cleared until">{formatDate(record.cleared_until)}</Field>
              <Field label="Recorded by">{record.recorded_by ?? "—"}</Field>
              <Field label="Recorded">{formatDate(record.recorded_at)}</Field>
              <Field label="Summary">{record.summary ?? "—"}</Field>
            </dl>
          </Card.Content>
        </Card>
      )}
    </ShowView>
  );
}
