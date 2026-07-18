/**
 * @file athlete-enrollments.tsx
 * @module modules/sports/athletes/components/athlete-enrollments
 *
 * @description
 * Renders an athlete's per-sport enrollments on the detail screen. Each
 * enrollment's sport-variable fields are rendered **via SDUI**: the attribute
 * set is loaded by the enrollment's `sport_key` and its values displayed with
 * {@link AttributeView}. This is where football stats vs swimming PBs diverge
 * without any per-sport frontend code.
 */

import { Card, Chip, Spinner } from "@stackra/ui/react";
import { useList } from "@refinedev/core";

import type { AthleteEnrollment } from "@/types";
import type { ReactNode } from "react";

import { EntityStatusChip } from "@/components/entity-status-chip";
import { AttributeView, useAttributeSet } from "@/lib/attributes";
import { formatDate } from "@/lib/format";

/** One enrollment card: sport + status + its SDUI attribute values. */
function EnrollmentCard({ enrollment }: { enrollment: AthleteEnrollment }): ReactNode {
  const { set } = useAttributeSet({
    entityType: "athlete_enrollment",
    discriminatorValue: enrollment.sport_key,
  });

  return (
    <Card>
      <Card.Header>
        <div className="flex items-center justify-between">
          <Card.Title className="capitalize">{enrollment.sport_key}</Card.Title>
          <EntityStatusChip status={enrollment.status} />
        </div>
        <Card.Description>Enrolled {formatDate(enrollment.enrolled_at)}</Card.Description>
      </Card.Header>
      <Card.Content>
        {set ? (
          <AttributeView set={set} value={enrollment.attributes} />
        ) : (
          <div className="flex flex-wrap gap-1">
            {Object.entries(enrollment.attributes).map(([key, value]) => (
              <Chip key={key} size="sm" variant="soft">
                {key}: {String(value)}
              </Chip>
            ))}
          </div>
        )}
      </Card.Content>
    </Card>
  );
}

/**
 * Lists an athlete's enrollments (SDUI values per sport).
 *
 * @param props - The athlete id whose enrollments to load.
 */
export function AthleteEnrollments({ athleteId }: { athleteId: string }): ReactNode {
  const { result, query } = useList<AthleteEnrollment>({
    resource: "athlete-enrollments",
    pagination: { mode: "off" },
    filters: [{ field: "athlete_id", operator: "eq", value: athleteId }],
  });

  const enrollments = result?.data ?? [];

  if (query.isLoading) {
    return (
      <div className="flex h-24 items-center justify-center">
        <Spinner aria-label="Loading enrollments" />
      </div>
    );
  }

  if (enrollments.length === 0) {
    return <p className="text-sm text-muted">No enrollments yet.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      {enrollments.map((enrollment) => (
        <EnrollmentCard key={enrollment.id} enrollment={enrollment} />
      ))}
    </div>
  );
}
