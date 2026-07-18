/**
 * @file show.tsx
 * @module modules/sports/registry/pages/show
 *
 * @description
 * Sport detail — category, scoring strategy, roster rules, and the sport's
 * terminology map (which drives per-sport labels across the app).
 */

import { Card, Chip, Spinner } from "@stackra/ui/react";
import { useShow } from "@refinedev/core";

import type { Sport } from "@/types";
import type { ReactNode } from "react";

import { ShowView } from "@/components/refine";
import { SCORING_TYPE_LABELS } from "@/types";

/** A single labelled detail field. */
function Field({ label, children }: { label: string; children: ReactNode }): ReactNode {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-xs font-medium tracking-wide text-muted uppercase">{label}</dt>
      <dd className="text-sm text-foreground">{children}</dd>
    </div>
  );
}

/** The sport detail page. */
export default function SportShow(): ReactNode {
  const { result: sport, query } = useShow<Sport>({ resource: "sports" });

  return (
    <ShowView resource="sports">
      {query.isLoading || !sport ? (
        <div className="flex h-40 items-center justify-center">
          <Spinner aria-label="Loading" />
        </div>
      ) : (
        <Card>
          <Card.Header>
            <Card.Title>{sport.name}</Card.Title>
            <Card.Description>Sport registry entry ({sport.key})</Card.Description>
          </Card.Header>
          <Card.Content>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Category">{sport.category}</Field>
              <Field label="Scoring">{SCORING_TYPE_LABELS[sport.scoring_type]}</Field>
              <Field label="Team sport">{sport.is_team_sport ? "Yes" : "No"}</Field>
              <Field label="Squad size">
                {sport.is_team_sport ? sport.default_team_size : "—"}
              </Field>
              <Field label="Terminology">
                <div className="flex flex-wrap gap-1">
                  {Object.entries(sport.terminology).map(([term, label]) => (
                    <Chip key={term} size="sm" variant="soft">
                      {term}: {label}
                    </Chip>
                  ))}
                </div>
              </Field>
            </dl>
          </Card.Content>
        </Card>
      )}
    </ShowView>
  );
}
