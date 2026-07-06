/**
 * @file widget-grid.tsx
 * @module modules/dashboard/components/widget-grid
 *
 * @description
 * Responsive widget grid rendered on the overview page. Phase 1c ships a
 * static CSS-grid layout backed by the default widget keys in
 * {@link widgetCatalogue}; Phase 1d upgrades this to drag-and-drop with
 * per-user persistence via `dashboard_layouts`.
 *
 * The grid renders each widget inside its own `Suspense` boundary so one slow
 * probe (or a widget whose fixture is missing) cannot block sibling widgets.
 * When a widget key is unknown to the registry we render a small placeholder
 * card rather than crashing the grid.
 */

import { Card, Skeleton } from "@academorix/ui/react";
import { Suspense } from "react";

import type { ReactNode } from "react";

import {
  defaultLayoutWidgetKeys,
  widgetCatalogueByKey,
} from "@/modules/dashboard/widgets/widget.catalogue";
import { widgetRenderers } from "@/modules/dashboard/widgets/widget.registry";

/** Props for {@link WidgetGrid}. */
export interface WidgetGridProps {
  /**
   * Which view is active. `overview` uses the default layout; `analytics`
   * biases toward chart widgets. Both share the same widget catalogue.
   */
  view: "overview" | "analytics";
}

/**
 * Analytics-view widget selection. Phase 5 will drive this from saved
 * `analytics` presets; for Phase 1 it is a hand-picked subset of the catalogue
 * that biases toward money and chart widgets.
 */
const ANALYTICS_WIDGET_KEYS: readonly string[] = [
  "kpi-revenue-mtd",
  "kpi-outstanding-invoices",
  "kpi-active-memberships",
  "kpi-open-leads",
  "list-recent-registrations",
  "list-upcoming-events",
];

/** Grid cell size classes keyed by the widget's default width. */
const WIDTH_CLASSES: Record<1 | 2 | 3, string> = {
  1: "sm:col-span-1",
  2: "sm:col-span-2",
  3: "sm:col-span-3",
};

/** Grid cell size classes keyed by the widget's default height. */
const HEIGHT_CLASSES: Record<1 | 2, string> = {
  1: "sm:row-span-1",
  2: "sm:row-span-2",
};

/** Skeleton placeholder rendered while a lazy renderer loads. */
function WidgetFallback(): ReactNode {
  return (
    <Card className="h-full">
      <Card.Header>
        <Skeleton className="h-4 w-24" />
      </Card.Header>
      <Card.Content>
        <Skeleton className="h-8 w-32" />
      </Card.Content>
    </Card>
  );
}

/** Placeholder rendered for a widget key we do not have a renderer for. */
function UnknownWidget({ widgetKey }: { widgetKey: string }): ReactNode {
  return (
    <Card className="h-full border border-dashed border-border">
      <Card.Header>
        <Card.Description>Coming soon</Card.Description>
        <Card.Title>{widgetKey}</Card.Title>
      </Card.Header>
    </Card>
  );
}

/**
 * The overview widget grid. Renders every widget in the active layout inside
 * a responsive CSS-grid that spans three columns on desktop, two on tablet,
 * and one on mobile.
 */
export function WidgetGrid({ view }: WidgetGridProps): ReactNode {
  const widgetKeys = view === "analytics" ? ANALYTICS_WIDGET_KEYS : defaultLayoutWidgetKeys;

  const items = widgetKeys.filter((key) => {
    const definition = widgetCatalogueByKey.get(key);

    // Onboarding checklist is rendered above the grid in overview view only.
    return definition && definition.key !== "onboarding-checklist";
  });

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((key) => {
        const definition = widgetCatalogueByKey.get(key);
        const Renderer = widgetRenderers.get(key);
        const widthClass = definition ? WIDTH_CLASSES[definition.defaultWidth] : "sm:col-span-1";
        const heightClass = definition ? HEIGHT_CLASSES[definition.defaultHeight] : "sm:row-span-1";

        return (
          <div key={key} className={[widthClass, heightClass].join(" ")}>
            <Suspense fallback={<WidgetFallback />}>
              {Renderer ? (
                <Renderer config={{}} onConfigChange={() => undefined} />
              ) : (
                <UnknownWidget widgetKey={key} />
              )}
            </Suspense>
          </div>
        );
      })}
    </div>
  );
}
