/**
 * @file show.tsx
 * @module modules/sports/performance/pages/show
 *
 * @description
 * Performance test detail — battery metadata plus the measured values rendered
 * via SDUI (attribute set selected by `sport_key`).
 */

import { Card, Spinner } from "@academorix/ui/react";
import { useShow } from "@refinedev/core";

import type { PerformanceTest } from "@/types";
import type { ReactNode } from "react";

import { ShowView } from "@/components/refine";
import { AttributeView, useAttributeSet } from "@/lib/attributes";
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

/** The performance test detail page. */
export default function PerformanceShow(): ReactNode {
  const { result: test, query } = useShow<PerformanceTest>({ resource: "performance" });
  const { set } = useAttributeSet({
    entityType: "performance",
    discriminatorValue: test?.sport_key,
  });

  if (query.isLoading || !test) {
    return (
      <ShowView resource="performance">
        <div className="flex h-40 items-center justify-center">
          <Spinner aria-label="Loading" />
        </div>
      </ShowView>
    );
  }

  return (
    <ShowView resource="performance">
      <div className="flex flex-col gap-6">
        <Card>
          <Card.Header>
            <Card.Title>{test.battery}</Card.Title>
            <Card.Description>Tested {formatDate(test.tested_at)}</Card.Description>
          </Card.Header>
          <Card.Content>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field label="Sport">{test.sport_key}</Field>
              <Field label="Assessor">{test.assessor_id ?? "—"}</Field>
              <Field label="Set version">v{test.attribute_set_version}</Field>
            </dl>
          </Card.Content>
        </Card>

        <Card>
          <Card.Header>
            <Card.Title>Results</Card.Title>
          </Card.Header>
          <Card.Content>
            {set ? (
              <AttributeView set={set} value={test.attributes} />
            ) : (
              <p className="text-sm text-muted">No test battery defined for this sport.</p>
            )}
          </Card.Content>
        </Card>
      </div>
    </ShowView>
  );
}
