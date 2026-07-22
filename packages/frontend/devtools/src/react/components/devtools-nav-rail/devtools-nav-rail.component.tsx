/**
 * @file devtools-nav-rail.component.tsx
 * @module @stackra/devtools/react/components
 * @description The categorised list of panels rendered inside the
 *   drawer body.
 *
 *   Panels are grouped by category and rendered in
 *   `config.categoryOrder`. Empty categories are skipped. Each
 *   panel is rendered via {@link DevtoolsNavItem}.
 */

import { Str } from "@stackra/support";
import { ScrollShadow } from "@stackra/ui/react";
import { useMemo, type ReactElement } from "react";

import { useDevtoolsContext } from "../../hooks/use-devtools-context";
import { useDevtoolsPanels } from "../../hooks/use-devtools-panels";
import { DevtoolsNavItem } from "../devtools-nav-item";

import type { DevtoolsNavRailProps } from "./devtools-nav-rail.interface";
import type { DevtoolsCategory, IDevtoolsPanel } from "@stackra/contracts";

/** Rendered label for each category. */
const CATEGORY_LABELS: Record<DevtoolsCategory, string> = {
  pinned: "Pinned",
  app: "App",
  framework: "Framework",
  data: "Data",
  ui: "UI",
  network: "Network",
  observability: "Observability",
  modules: "Modules",
};

/**
 * Match a panel against the search query.
 *
 * Case-insensitive match across the panel's title, id, and
 * category.
 */
function matchesSearch(panel: IDevtoolsPanel, query: string): boolean {
  const q = Str.lower(query);
  if (Str.lower(panel.title).includes(q)) return true;
  if (Str.lower(panel.id).includes(q)) return true;
  const cat = panel.category ?? "modules";
  if (Str.lower(cat).includes(q)) return true;
  return false;
}

/**
 * The categorised nav rail.
 */
export function DevtoolsNavRail({
  activePanelId,
  onSelect,
  searchQuery,
}: DevtoolsNavRailProps): ReactElement {
  const { config } = useDevtoolsContext();
  const { byCategory } = useDevtoolsPanels();

  // Order the categories per the merged config, then apply the
  // search filter within each. Do this in a `useMemo` — the result
  // is stable until either the registry or the search query
  // changes.
  const rendered = useMemo(() => {
    const order = config.categoryOrder ?? [];
    const trimmedQuery = Str.trim(searchQuery ?? "");

    return order
      .map((category) => {
        const bucket = byCategory.get(category) ?? [];
        const filtered = trimmedQuery
          ? bucket.filter((panel) => matchesSearch(panel, trimmedQuery))
          : bucket;
        return { category, panels: filtered };
      })
      .filter((section) => section.panels.length > 0);
  }, [byCategory, config.categoryOrder, searchQuery]);

  return (
    <ScrollShadow className="border-border h-full w-56 shrink-0 border-r" hideScrollBar={false}>
      <nav
        aria-label="Devtools panels"
        className="flex flex-col gap-4 p-2"
        data-devtools-nav-rail=""
      >
        {rendered.map((section) => (
          <section key={section.category} className="flex flex-col gap-0.5">
            <h3 className="text-muted px-3 pb-1 text-xs font-semibold tracking-wide">
              {CATEGORY_LABELS[section.category]}
            </h3>
            {section.panels.map((panel) => (
              <DevtoolsNavItem
                key={panel.id}
                panel={panel}
                isActive={panel.id === activePanelId}
                onSelect={onSelect}
              />
            ))}
          </section>
        ))}
      </nav>
    </ScrollShadow>
  );
}
