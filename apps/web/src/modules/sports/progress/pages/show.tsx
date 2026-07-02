/**
 * @file show.tsx
 * @module modules/sports/progress/pages/show
 *
 * @description
 * Progress/skill-card detail — assessment metadata plus the sport-variable card
 * values rendered via SDUI (the attribute set is selected by `sport_key`). This
 * is where a football skill card and a swimming card diverge with no per-sport
 * frontend code.
 */

import { Card, Spinner } from "@academorix/ui/react";
import { useShow } from "@refinedev/core";

import type { Progress } from "@/types";
import type { ReactNode } from "react";

import { ShowView } from "@/components/refine";
import { AttributeView, useAttributeSet } from "@/lib/attributes";
import { formatDate } from "@/lib/format";
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

/** The progress assessment detail page. */
export default function ProgressShow(): ReactNode {
  const { result: progress, query } = useShow<Progress>({ resource: "progress" });
  const { set } = useAttributeSet({
    entityType: "progress",
    discriminatorValue: progress?.sport_key,
  });

  if (query.isLoading || !progress) {
    return (
      <ShowView resource="progress">
        <div className="flex h-40 items-center justify-center">
          <Spinner aria-label="Loading" />
        </div>
      </ShowView>
    );
  }

  return (
    <ShowView resource="progress">
      <div className="flex flex-col gap-6">
        <Card>
          <Card.Header>
            <Card.Title className="capitalize">{progress.sport_key} skill card</Card.Title>
            <Card.Description>Assessed {formatDate(progress.assessed_at)}</Card.Description>
          </Card.Header>
          <Card.Content>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Level">
                {progress.level ? SKILL_LEVEL_LABELS[progress.level] : "—"}
              </Field>
              <Field label="Assessor">{progress.assessor_id ?? "—"}</Field>
              <Field label="Note">{progress.note ?? "—"}</Field>
            </dl>
          </Card.Content>
        </Card>

        <Card>
          <Card.Header>
            <Card.Title>Skill ratings</Card.Title>
          </Card.Header>
          <Card.Content>
            {set ? (
              <AttributeView set={set} value={progress.attributes} />
            ) : (
              <p className="text-sm text-muted">No skill card defined for this sport.</p>
            )}
          </Card.Content>
        </Card>
      </div>
    </ShowView>
  );
}
