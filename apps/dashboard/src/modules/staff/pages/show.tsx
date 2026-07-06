/**
 * @file show.tsx
 * @module modules/staff/pages/show
 *
 * @description
 * Staff detail — contact, role/title, employment, pay, and status.
 */

import { Card, Spinner } from "@academorix/ui/react";
import { useShow } from "@refinedev/core";

import type { Staff } from "@/types";
import type { ReactNode } from "react";

import { ShowView } from "@/components/refine";
import { formatDate, formatMoney } from "@/lib/format";
import { StaffStatusChip } from "@/modules/staff/components/staff-status-chip";
import { STAFF_EMPLOYMENT_TYPE_LABELS } from "@/types";

/** A single labelled detail field. */
function Field({ label, children }: { label: string; children: ReactNode }): ReactNode {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-xs font-medium tracking-wide text-muted uppercase">{label}</dt>
      <dd className="text-sm text-foreground">{children}</dd>
    </div>
  );
}

/** The staff detail page. */
export default function StaffShow(): ReactNode {
  const { result: staff, query } = useShow<Staff>({ resource: "staff" });

  return (
    <ShowView resource="staff">
      {query.isLoading || !staff ? (
        <div className="flex h-40 items-center justify-center">
          <Spinner aria-label="Loading" />
        </div>
      ) : (
        <Card>
          <Card.Header>
            <Card.Title>
              {staff.first_name} {staff.last_name}
            </Card.Title>
            <Card.Description>{staff.title}</Card.Description>
          </Card.Header>
          <Card.Content>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Status">
                <StaffStatusChip status={staff.status} />
              </Field>
              <Field label="Employment">
                {STAFF_EMPLOYMENT_TYPE_LABELS[staff.employment_type]}
              </Field>
              <Field label="Base pay">{formatMoney(staff.base_pay, staff.currency)}</Field>
              <Field label="Email">{staff.email}</Field>
              <Field label="Phone">{staff.phone ?? "—"}</Field>
              <Field label="Hired">{formatDate(staff.hired_at)}</Field>
            </dl>
          </Card.Content>
        </Card>
      )}
    </ShowView>
  );
}
