/**
 * @file show.tsx
 * @module modules/safeguarding/pages/show
 *
 * @description
 * Safeguarding case detail — subject, category, severity, status, handler, and a
 * non-graphic summary. **Sensitive**: gated behind the `safeguarding` permission.
 */

import { Card, Spinner } from "@academorix/ui/react";
import { useList, useShow } from "@refinedev/core";
import { useMemo } from "react";

import type { SafeguardingCase } from "@/modules/safeguarding/safeguarding.types";
import type { Athlete } from "@/types";
import type { ReactNode } from "react";

import { ShowView } from "@/components/refine";
import { formatDate } from "@/lib/format";
import {
  SafeguardingSeverityChip,
  SafeguardingStatusChip,
} from "@/modules/safeguarding/components/safeguarding-chips";

/** A single labelled detail field. */
function Field({ label, children }: { label: string; children: ReactNode }): ReactNode {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-xs font-medium tracking-wide text-muted uppercase">{label}</dt>
      <dd className="text-sm text-foreground">{children}</dd>
    </div>
  );
}

/** The safeguarding case detail page. */
export default function SafeguardingShow(): ReactNode {
  const { result: record, query } = useShow<SafeguardingCase>({ resource: "safeguarding" });

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

  if (query.isLoading || !record) {
    return (
      <ShowView resource="safeguarding">
        <div className="flex h-40 items-center justify-center">
          <Spinner aria-label="Loading" />
        </div>
      </ShowView>
    );
  }

  const subject = record.athlete_id
    ? (athleteName.get(record.athlete_id) ?? record.athlete_id)
    : "General";

  return (
    <ShowView resource="safeguarding">
      <Card>
        <Card.Header>
          <Card.Title>{record.category}</Card.Title>
          <Card.Description>{subject}</Card.Description>
        </Card.Header>
        <Card.Content>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Subject">{subject}</Field>
            <Field label="Category">{record.category}</Field>
            <Field label="Severity">
              <SafeguardingSeverityChip severity={record.severity} />
            </Field>
            <Field label="Status">
              <SafeguardingStatusChip status={record.status} />
            </Field>
            <Field label="Handler">{record.handler_id ?? "—"}</Field>
            <Field label="Opened">{formatDate(record.opened_at)}</Field>
          </dl>

          <div className="mt-6 flex flex-col gap-1">
            <dt className="text-xs font-medium tracking-wide text-muted uppercase">Summary</dt>
            <dd className="text-sm whitespace-pre-line text-foreground">{record.summary}</dd>
          </div>
        </Card.Content>
      </Card>
    </ShowView>
  );
}
