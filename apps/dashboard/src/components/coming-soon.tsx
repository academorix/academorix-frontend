/**
 * @file coming-soon.tsx
 * @module components/coming-soon
 *
 * @description
 * A shared placeholder for resources whose full CRUD screens are not built yet
 * (coaches, courses, teams, branches). It reads the *active* resource from
 * Refine's `useResourceParams()` and resolves the tenant-specific label, so a
 * single component serves every such route with the correct title.
 *
 * The data layer and mock fixtures for these resources already exist, so
 * fleshing them out later is purely a UI task.
 */

import { WrenchScrewdriverIcon } from "@stackra/ui/icons/heroicon/outline";
import { useResourceParams } from "@refinedev/core";

import type { AppResourceMeta } from "@/lib/module";
import type { ReactNode } from "react";

import { useResourceLabel } from "@/lib/refine";

/** Renders a centered "coming soon" message for the current resource. */
export default function ComingSoonPage(): ReactNode {
  const { resource } = useResourceParams();
  const meta = resource?.meta as AppResourceMeta | undefined;
  const fallback = meta?.label ?? resource?.name ?? "This section";
  const label = useResourceLabel(resource?.name ?? "", fallback);

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
