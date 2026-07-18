/**
 * @file show.tsx
 * @module modules/sports/seasons/pages/show
 *
 * @description
 * Season detail — status, date range, current flag, and age cut-off.
 */

import { Card, Chip, Spinner } from "@stackra/ui/react";
import { useShow } from "@refinedev/core";

import type { Season } from "@/types";
import type { ReactNode } from "react";

import { ShowView } from "@/components/refine";
import { formatDate } from "@/lib/format";
import { SeasonStatusChip } from "@/modules/sports/seasons/components/season-status-chip";

/** A single labelled detail field. */
function Field({ label, children }: { label: string; children: ReactNode }): ReactNode {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-xs font-medium tracking-wide text-muted uppercase">{label}</dt>
      <dd className="text-sm text-foreground">{children}</dd>
    </div>
  );
}

/** The season detail page. */
export default function SeasonShow(): ReactNode {
  const { result: season, query } = useShow<Season>({ resource: "seasons" });

  return (
    <ShowView resource="seasons">
      {query.isLoading || !season ? (
        <div className="flex h-40 items-center justify-center">
          <Spinner aria-label="Loading" />
        </div>
      ) : (
        <Card>
          <Card.Header>
            <Card.Title>{season.name}</Card.Title>
            <Card.Description>Season</Card.Description>
          </Card.Header>
          <Card.Content>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Status">
                <SeasonStatusChip status={season.status} />
              </Field>
              <Field label="Current">
                {season.is_current ? (
                  <Chip color="success" size="sm" variant="soft">
                    Current
                  </Chip>
                ) : (
                  "No"
                )}
              </Field>
              <Field label="Start">{formatDate(season.start_date)}</Field>
              <Field label="End">{formatDate(season.end_date)}</Field>
              <Field label="Age cut-off">{formatDate(season.age_cutoff_date)}</Field>
            </dl>
          </Card.Content>
        </Card>
      )}
    </ShowView>
  );
}
