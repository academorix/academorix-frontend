/**
 * @file show.tsx
 * @module modules/leads/pages/show
 *
 * @description
 * Lead detail — contact info, pipeline stage, source, sport of interest, owner,
 * and pipeline notes for a single prospective member.
 */

import { Card, Spinner } from "@academorix/ui/react";
import { useList, useShow } from "@refinedev/core";
import { useMemo } from "react";

import type { Lead } from "@/modules/leads/leads.types";
import type { Staff } from "@/types";
import type { ReactNode } from "react";

import { ShowView } from "@/components/refine";
import { LeadStageChip } from "@/modules/leads/components/lead-stage-chip";

/** A single labelled detail field. */
function Field({ label, children }: { label: string; children: ReactNode }): ReactNode {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-xs font-medium tracking-wide text-muted uppercase">{label}</dt>
      <dd className="text-sm text-foreground">{children}</dd>
    </div>
  );
}

/** The lead detail page. */
export default function LeadsShow(): ReactNode {
  const { result: lead, query } = useShow<Lead>({ resource: "leads" });

  const { result: staffResult } = useList<Staff>({
    resource: "staff",
    pagination: { mode: "off" },
  });

  const staffName = useMemo(() => {
    const map = new Map<string, string>();

    for (const member of staffResult?.data ?? []) {
      map.set(member.id, `${member.first_name} ${member.last_name}`);
    }

    return map;
  }, [staffResult?.data]);

  if (query.isLoading || !lead) {
    return (
      <ShowView resource="leads">
        <div className="flex h-40 items-center justify-center">
          <Spinner aria-label="Loading" />
        </div>
      </ShowView>
    );
  }

  const owner = lead.owner_id ? (staffName.get(lead.owner_id) ?? lead.owner_id) : "—";

  return (
    <ShowView resource="leads">
      <Card>
        <Card.Header>
          <Card.Title>{lead.name}</Card.Title>
          <Card.Description>
            <LeadStageChip stage={lead.stage} />
          </Card.Description>
        </Card.Header>
        <Card.Content>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Email">{lead.contact_email ?? "—"}</Field>
            <Field label="Phone">{lead.contact_phone ?? "—"}</Field>
            <Field label="Sport">{lead.sport_key ?? "—"}</Field>
            <Field label="Source">{lead.source}</Field>
            <Field label="Owner">{owner}</Field>
          </dl>

          <div className="mt-6 flex flex-col gap-1">
            <dt className="text-xs font-medium tracking-wide text-muted uppercase">Notes</dt>
            <dd className="text-sm whitespace-pre-line text-foreground">{lead.note ?? "—"}</dd>
          </div>
        </Card.Content>
      </Card>
    </ShowView>
  );
}
