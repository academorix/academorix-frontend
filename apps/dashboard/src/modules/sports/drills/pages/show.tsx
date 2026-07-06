/**
 * @file show.tsx
 * @module modules/sports/drills/pages/show
 *
 * @description
 * Drill detail — sport, skill level, suggested duration, the skills it develops
 * (tags), and a full coaching description.
 */

import { Card, Chip, Spinner } from "@academorix/ui/react";
import { useShow } from "@refinedev/core";

import type { Drill } from "@/types";
import type { ReactNode } from "react";

import { ShowView } from "@/components/refine";
import { SKILL_LEVEL_LABELS } from "@/types";

/** A single labelled detail field. */
function Field({ label, children }: { label: string; children: ReactNode }): ReactNode {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-xs font-medium tracking-wide text-muted uppercase">{label}</dt>
      <dd className="text-sm text-foreground">{children}</dd>
    </div>
  );
}

/** The drill detail page. */
export default function DrillsShow(): ReactNode {
  const { result: drill, query } = useShow<Drill>({ resource: "drills" });

  if (query.isLoading || !drill) {
    return (
      <ShowView resource="drills">
        <div className="flex h-40 items-center justify-center">
          <Spinner aria-label="Loading" />
        </div>
      </ShowView>
    );
  }

  return (
    <ShowView resource="drills">
      <Card>
        <Card.Header>
          <Card.Title>{drill.name}</Card.Title>
          <Card.Description>
            {SKILL_LEVEL_LABELS[drill.level]} · {drill.sport_key}
          </Card.Description>
        </Card.Header>
        <Card.Content>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Sport">{drill.sport_key}</Field>
            <Field label="Level">{SKILL_LEVEL_LABELS[drill.level]}</Field>
            <Field label="Duration">{drill.duration_minutes} min</Field>
            <Field label="Develops">
              {drill.tags.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {drill.tags.map((tag) => (
                    <Chip key={tag} color="default" size="sm" variant="soft">
                      {tag}
                    </Chip>
                  ))}
                </div>
              ) : (
                "—"
              )}
            </Field>
          </dl>

          <div className="mt-6 flex flex-col gap-1">
            <dt className="text-xs font-medium tracking-wide text-muted uppercase">Description</dt>
            <dd className="text-sm whitespace-pre-line text-foreground">{drill.description}</dd>
          </div>
        </Card.Content>
      </Card>
    </ShowView>
  );
}
