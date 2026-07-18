/**
 * @file show.tsx
 * @module modules/sports/registrations/pages/show
 *
 * @description
 * Registration detail — applicant contact, sport of interest, funnel stage, and
 * the linked athlete once converted.
 */

import { Card, Spinner } from "@stackra/ui/react";
import { useShow } from "@refinedev/core";

import type { Registration } from "@/types";
import type { ReactNode } from "react";

import { ShowView } from "@/components/refine";
import { formatDate } from "@/lib/format";
import { RegistrationStatusChip } from "@/modules/sports/registrations/components/registration-status-chip";

/** A single labelled detail field. */
function Field({ label, children }: { label: string; children: ReactNode }): ReactNode {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-xs font-medium tracking-wide text-muted uppercase">{label}</dt>
      <dd className="text-sm text-foreground">{children}</dd>
    </div>
  );
}

/** The registration detail page. */
export default function RegistrationShow(): ReactNode {
  const { result: registration, query } = useShow<Registration>({ resource: "registrations" });

  return (
    <ShowView resource="registrations">
      {query.isLoading || !registration ? (
        <div className="flex h-40 items-center justify-center">
          <Spinner aria-label="Loading" />
        </div>
      ) : (
        <Card>
          <Card.Header>
            <Card.Title>{registration.applicant_name}</Card.Title>
            <Card.Description>Registration</Card.Description>
          </Card.Header>
          <Card.Content>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Stage">
                <RegistrationStatusChip status={registration.status} />
              </Field>
              <Field label="Sport">{registration.sport_key}</Field>
              <Field label="Email">{registration.contact_email}</Field>
              <Field label="Phone">{registration.contact_phone ?? "—"}</Field>
              <Field label="Submitted">{formatDate(registration.submitted_at)}</Field>
              <Field label="Linked athlete">{registration.athlete_id ?? "—"}</Field>
            </dl>
          </Card.Content>
        </Card>
      )}
    </ShowView>
  );
}
