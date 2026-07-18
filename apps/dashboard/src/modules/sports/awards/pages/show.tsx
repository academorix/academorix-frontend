/**
 * @file show.tsx
 * @module modules/sports/awards/pages/show
 *
 * @description
 * Award detail — recipient, type, grant date, description, and whether a
 * certificate document is attached.
 */

import { Card, Spinner } from "@stackra/ui/react";
import { useList, useShow } from "@refinedev/core";
import { useMemo } from "react";

import type { Athlete, Award } from "@/types";
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

/** The award detail page. */
export default function AwardsShow(): ReactNode {
  const { result: award, query } = useShow<Award>({ resource: "awards" });

  const { result: athletesResult } = useList<Athlete>({
    resource: "athletes",
    pagination: { mode: "off" },
  });

  const athleteName = useMemo(() => {
    const map = new Map<string, string>();

    for (const athlete of athletesResult?.data ?? []) {
      map.set(athlete.id, `${athlete.first_name} ${athlete.last_name}`);
    }

    return map;
  }, [athletesResult?.data]);

  if (query.isLoading || !award) {
    return (
      <ShowView resource="awards">
        <div className="flex h-40 items-center justify-center">
          <Spinner aria-label="Loading" />
        </div>
      </ShowView>
    );
  }

  const recipient = athleteName.get(award.athlete_id) ?? award.athlete_id;

  return (
    <ShowView resource="awards">
      <Card>
        <Card.Header>
          <Card.Title>{award.title}</Card.Title>
          <Card.Description>{recipient}</Card.Description>
        </Card.Header>
        <Card.Content>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Athlete">{recipient}</Field>
            <Field label="Type">{award.type}</Field>
            <Field label="Granted">{formatDate(award.granted_at)}</Field>
            <Field label="Certificate">{award.certificate_document_id ? "Attached" : "—"}</Field>
          </dl>

          <div className="mt-6 flex flex-col gap-1">
            <dt className="text-xs font-medium tracking-wide text-muted uppercase">Description</dt>
            <dd className="text-sm whitespace-pre-line text-foreground">
              {award.description ?? "—"}
            </dd>
          </div>
        </Card.Content>
      </Card>
    </ShowView>
  );
}
