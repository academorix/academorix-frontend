/**
 * @file coming-soon.tsx
 * @module pages/coming-soon
 *
 * @description
 * A generic placeholder for resources whose full CRUD screens are not built
 * yet (coaches, courses, teams, branches). It reads the *active* resource from
 * Refine's `useResource()` so a single component serves every such route and
 * shows the correct title.
 *
 * The data layer and mock fixtures for these resources already exist, so
 * fleshing them out later is purely a UI task.
 */

import { WrenchScrewdriverIcon } from "@academorix/ui/icons/outline";
import { useResourceParams } from "@refinedev/core";

import type { ReactNode } from "react";

/** Renders a centered "coming soon" message for the current resource. */
export function ComingSoonPage(): ReactNode {
  const { resource } = useResourceParams();
  const label = resource?.meta?.label ?? resource?.name ?? "This section";

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 p-6 text-center">
      <WrenchScrewdriverIcon aria-hidden="true" className="size-10 text-muted" />
      <h1 className="text-xl font-semibold text-foreground">{label}</h1>
      <p className="max-w-md text-sm text-muted">
        This module is coming soon. Its data provider and mock fixtures are already wired, so
        building it out is just adding the page.
      </p>
    </div>
  );
}
