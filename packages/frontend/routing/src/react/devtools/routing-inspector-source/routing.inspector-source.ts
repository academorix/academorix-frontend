/**
 * @file routing.inspector-source.ts
 * @module @stackra/routing/react/devtools/routing-inspector-source
 * @description Devtools inspector source for `@stackra/routing` —
 *   scans the DOM for hydration / routing boundary markers.
 *
 *   Ported from ssr's `SsrInspectorSource` (PLAN v3.10.4).
 *
 *   The markers we look for:
 *   - `[data-hydrated]` — set by the routing provider once hydration
 *     completes.
 *   - `[data-routing-boundary]` — any partial-hydration boundary a
 *     route opts into.
 *
 *   Registered via `DevtoolsModule.forFeature([...])` when the
 *   optional `@stackra/devtools` peer is installed.
 */

import { DevtoolsInspectorSource } from "@stackra/decorators/devtools";
import type { IDevtoolsInspectorRegion, IDevtoolsInspectorRegionSource } from "@stackra/contracts";
import { Str } from "@stackra/support";

/** CSS selector that catches every hydration marker. */
const HYDRATION_SELECTOR = "[data-hydrated],[data-routing-boundary]";

/**
 * The routing inspector source — one region per hydrated boundary.
 */
@DevtoolsInspectorSource({
  id: "routing-hydration",
  panelId: "routing",
  label: "Route boundaries",
})
export class RoutingInspectorSource implements IDevtoolsInspectorRegionSource {
  /** @inheritdoc */
  public readonly id = "routing-hydration";
  /** @inheritdoc */
  public readonly label = "Route boundaries";
  /** @inheritdoc */
  public readonly panelId = "routing";

  /**
   * Enumerate every hydration boundary in the DOM.
   *
   * @returns Read-only list of boundaries. Empty under SSR (no
   *   `document`).
   */
  public collect(): readonly IDevtoolsInspectorRegion[] {
    if (typeof document === "undefined") return [];
    const elements = document.querySelectorAll<HTMLElement>(HYDRATION_SELECTOR);
    const regions: IDevtoolsInspectorRegion[] = [];
    elements.forEach((element, index) => {
      // Prefer the data attribute value as the label; fall back to
      // the tag name so the tooltip is never empty. Route the case
      // conversion through `Str.lower` per
      // `.kiro/steering/support-utilities.md`.
      const rawLabel =
        element.dataset.hydrated || element.dataset.routingBoundary || Str.lower(element.tagName);
      regions.push({
        id: `routing-${index}`,
        label: `${rawLabel} boundary`,
        panelId: "routing",
        // Lazy accessor — measurement only pays cost when the
        // overlay actually renders the region.
        bounds: (): DOMRect | null => {
          try {
            return element.getBoundingClientRect();
          } catch {
            // fail-soft — a detached node returns null.
            return null;
          }
        },
      });
    });
    return regions;
  }
}
