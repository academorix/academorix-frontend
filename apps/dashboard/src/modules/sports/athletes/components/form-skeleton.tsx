/**
 * @file form-skeleton.tsx
 * @module modules/athletes/components/form-skeleton
 *
 * @description
 * Placeholder shown while the edit page fetches the athlete record, mirroring
 * the two-column field layout of {@link AthleteForm} so the transition to the
 * loaded form is visually stable (no layout shift).
 */

import { Card, Skeleton } from "@stackra/ui/react";

import type { ReactNode } from "react";

/** A skeleton stand-in for the athlete form while its data loads. */
export function FormSkeleton(): ReactNode {
  const fields = Array.from({ length: 8 }, (_, index) => index);

  return (
    <Card>
      <Card.Content>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {fields.map((field) => (
            <div key={field} className="flex flex-col gap-2">
              <Skeleton className="h-4 w-24 rounded-md" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
          ))}
        </div>
      </Card.Content>
      <Card.Footer className="mt-4 justify-end">
        <Skeleton className="h-10 w-32 rounded-lg" />
      </Card.Footer>
    </Card>
  );
}
