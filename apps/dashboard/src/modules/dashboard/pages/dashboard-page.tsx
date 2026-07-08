/**
 * @file dashboard-page.tsx
 * @module modules/dashboard/pages/dashboard-page
 *
 * @description
 * The authenticated landing surface. Renders three regions:
 *
 * 1. A page header with title, description, and a Segment view switcher
 *    (Overview vs Analytics) driven by the `?view=` query parameter. See
 *    plan §4.1 for the rationale of keeping analytics on the same route.
 *    In Phase 1d the header also carries the "Edit layout" toggle and a
 *    "Reset layout" button (visible while editing).
 * 2. The onboarding checklist widget while any step is incomplete or the
 *    workspace has not dismissed it. See plan §4.6.
 * 3. A responsive widget grid rendered from the tenant's active layout.
 *    Phase 1d makes this a drag-and-drop grid persisted per-user via
 *    localStorage. The feature flag `features.overviewDnd` controls whether
 *    the grid uses `react-grid-layout` or the plain CSS-grid fallback.
 *
 * Every widget renders inside its own Suspense boundary so one slow probe
 * cannot block the whole page.
 *
 * ## State
 *
 *  - **View** (`?view=`): persisted in the URL so a link to the analytics
 *    view is shareable.
 *  - **Layout** (per-user, in `localStorage`): owned by {@link useWidgetLayout}.
 *  - **Edit mode**: ephemeral — a `useState` cell scoped to the mounted
 *    page. Refreshing the page or navigating away drops edit mode; this
 *    is intentional so an owner who leaves edit mode via the browser
 *    back button doesn't come back to a locked "still-editing" state.
 */

import {
  AdjustmentsHorizontalIcon,
  ArrowPathIcon,
  Squares2X2Icon,
} from "@academorix/ui/icons/outline";
import { Button, Segment } from "@academorix/ui/react";
import { useGetIdentity } from "@refinedev/core";
import { useState } from "react";
import { useSearchParams } from "react-router";

import type { Identity } from "@/types/platform";
import type { Key } from "@academorix/ui/react";
import type { ReactNode } from "react";

import { WidgetGrid } from "@/modules/dashboard/components/widget-grid";
import { useWidgetLayout } from "@/modules/dashboard/hooks/use-widget-layout";
import OnboardingChecklistWidget from "@/modules/dashboard/widgets/renderers/onboarding-checklist";

/** Overview view keys. Persisted in `?view=` on the URL. */
type ViewKey = "overview" | "analytics";

/** Overview page — the authenticated landing surface. */
export default function DashboardPage(): ReactNode {
  const [searchParams, setSearchParams] = useSearchParams();
  const view: ViewKey = searchParams.get("view") === "analytics" ? "analytics" : "overview";

  // Identity resolves a tick after mount; the layout hook accepts `null`
  // and renders anonymous defaults until it lands, so no loading gate is
  // needed here.
  const { data: identity } = useGetIdentity<Identity>();
  const { items, setLayout, resetLayout } = useWidgetLayout(identity?.id ?? null);

  // Edit mode is ephemeral. A refresh drops it — desired because the
  // page is a landing surface, not an editor.
  const [isEditing, setIsEditing] = useState<boolean>(false);

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
          {/*
           * Edit-mode toggle. In DnD-off (`features.overviewDnd === false`)
           * builds the button still toggles but the grid stays static — a
           * harmless no-op so the header doesn't visually shift when
           * ops flip the flag.
           */}
          <Button
            aria-pressed={isEditing}
            size="sm"
            variant={isEditing ? "primary" : "secondary"}
            onPress={() => setIsEditing((prev) => !prev)}
          >
            <AdjustmentsHorizontalIcon />
            {isEditing ? "Done" : "Edit layout"}
          </Button>
          {/*
           * Reset layout — only visible while editing. Calling
           * `resetLayout` drops the persisted key and reverts to the
           * catalogue default (see `use-widget-layout.ts`).
           */}
          {isEditing ? (
            <Button
              aria-label="Reset layout to defaults"
              size="sm"
              variant="ghost"
              onPress={resetLayout}
            >
              <ArrowPathIcon />
              Reset layout
            </Button>
          ) : null}
          <Button size="sm" variant="secondary">
            <Squares2X2Icon />
            Layouts
          </Button>
        </div>
      </header>

      {view === "overview" ? <OnboardingChecklistWidget /> : null}

      <WidgetGrid
        isEditing={isEditing}
        layoutItems={items}
        view={view}
        onLayoutChange={setLayout}
      />
    </div>
  );
}
