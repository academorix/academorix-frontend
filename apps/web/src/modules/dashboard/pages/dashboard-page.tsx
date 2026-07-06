/**
 * @file dashboard-page.tsx
 * @module modules/dashboard/pages/dashboard-page
 *
 * @description
 * The authenticated landing surface. Renders three regions:
 *
 * 1. A page header with title, description, and a Segment view switcher
 *    (Overview vs Analytics) driven by the `?view=` query parameter. See plan
 *    §4.1 for the rationale of keeping analytics on the same route.
 * 2. The onboarding checklist widget while any step is incomplete or the
 *    workspace has not dismissed it. See plan §4.6.
 * 3. A responsive widget grid rendered from the tenant's active layout. The
 *    layout is stored per-user in `localStorage` in Phase 1c; Phase 1d
 *    upgrades this to drag-and-drop + saved-layout persistence.
 *
 * Every widget renders inside its own Suspense boundary so one slow probe
 * cannot block the whole page.
 */

import { AdjustmentsHorizontalIcon, Squares2X2Icon } from "@academorix/ui/icons/outline";
import { Button, Segment } from "@academorix/ui/react";
import { useSearchParams } from "react-router";

import type { Key } from "@academorix/ui/react";
import type { ReactNode } from "react";

import { WidgetGrid } from "@/modules/dashboard/components/widget-grid";
import OnboardingChecklistWidget from "@/modules/dashboard/widgets/renderers/onboarding-checklist";

/** Overview view keys. Persisted in `?view=` on the URL. */
type ViewKey = "overview" | "analytics";

/** Overview page — the authenticated landing surface. */
export default function DashboardPage(): ReactNode {
  const [searchParams, setSearchParams] = useSearchParams();
  const view: ViewKey = searchParams.get("view") === "analytics" ? "analytics" : "overview";

  const handleViewChange = (next: Key | null): void => {
    if (next === null) {
      return;
    }

    const nextParams = new URLSearchParams(searchParams);

    if (next === "overview") {
      nextParams.delete("view");
    } else {
      nextParams.set("view", String(next));
    }
    setSearchParams(nextParams);
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted">An overview of your academy.</p>
        </div>
        <div className="flex items-center gap-2">
          <Segment selectedKey={view} onSelectionChange={handleViewChange}>
            <Segment.Item id="overview">Overview</Segment.Item>
            <Segment.Item id="analytics">Analytics</Segment.Item>
          </Segment>
          <Button size="sm" variant="secondary">
            <AdjustmentsHorizontalIcon />
            Customise
          </Button>
          <Button size="sm" variant="secondary">
            <Squares2X2Icon />
            Layouts
          </Button>
        </div>
      </header>

      {view === "overview" ? <OnboardingChecklistWidget /> : null}

      <WidgetGrid view={view} />
    </div>
  );
}
