/**
 * @file routing-devtools-panel-view.component.tsx
 * @module @stackra/routing/react/devtools/routing-devtools-panel
 * @description React body of the `@stackra/devtools` routing panel.
 *
 *   Ported from `ssr.devtools-panel-view.tsx`. Shows the current
 *   URL, hydration status, and a breakdown of the route registry
 *   by source (root / feature / discovery).
 *
 *   Anatomy — verified against HeroUI OSS via
 *   `mcp_heroui_pro_get_component_docs`:
 *
 *     <Card>
 *       <Card.Header>
 *         <Card.Title />
 *         <Card.Description />
 *       </Card.Header>
 *       <Card.Content />        // Optional — for lists/details
 *       <Card.Footer />         // Optional — for actions
 *     </Card>
 *
 *   Chip anatomy — verified same MCP call:
 *
 *     <Chip color="success" variant="soft" size="sm">
 *       <Chip.Label>Complete</Chip.Label>
 *     </Chip>
 *
 *   `color` carries semantic meaning (success / default / danger),
 *   `variant` selects the visual style (primary / secondary /
 *   tertiary / soft). The previous impl misused `variant="primary"`
 *   to convey "hydrated" — corrected here to `color="success"` with
 *   a subdued `variant="soft"` treatment.
 */

import { type ReactElement, useEffect, useMemo, useState } from "react";
import { Str } from "@stackra/support";
import { Card, Chip } from "@stackra/ui/react";

import type { IRoutingDevtoolsPanelViewProps } from "./routing-devtools-panel-view.interface";

/**
 * Tally route counts by source. Fresh per render — O(n) in the
 * number of registered routes.
 */
function tallyBySource(registry: IRoutingDevtoolsPanelViewProps["registry"]): {
  readonly total: number;
  readonly root: number;
  readonly feature: number;
  readonly discovery: number;
} {
  const list = registry.listRoutes();
  let root = 0;
  let feature = 0;
  let discovery = 0;
  // The registry stores source labels keyed by route id — the
  // registry keys iterate in insertion order.
  const keys = Array.from(registry.keys());
  for (const key of keys) {
    const source = registry.getSource(key) ?? "root";
    if (source === "root") root += 1;
    else if (Str.startsWith(source, "feature:")) feature += 1;
    else if (Str.startsWith(source, "discovery:") || source === "discovery") discovery += 1;
  }
  return { total: list.length, root, feature, discovery };
}

/**
 * Body of the routing devtools panel.
 *
 * @param props - See {@link IRoutingDevtoolsPanelViewProps}.
 * @returns The panel body.
 */
export function RoutingDevtoolsPanelView({
  registry,
}: IRoutingDevtoolsPanelViewProps): ReactElement {
  // Poll `window.location` once per second — the cheapest way to
  // reflect route changes without hooking the router directly.
  // Devtools context — noisy re-renders here are fine.
  const [href, setHref] = useState<string>(() =>
    typeof window !== "undefined" ? window.location.href : "",
  );
  useEffect(() => {
    if (typeof window === "undefined") return;
    const id = window.setInterval(() => setHref(window.location.href), 1000);
    return (): void => window.clearInterval(id);
  }, []);

  const tally = useMemo(() => tallyBySource(registry), [registry]);

  const hydrated = typeof window !== "undefined" && window.document?.readyState === "complete";

  return (
    <div className="flex flex-col gap-4">
      {/* Section header — Title Case, muted description. */}
      <header className="flex flex-col gap-1">
        <h3 className="text-foreground text-base font-semibold">Routing Runtime</h3>
        <p className="text-muted text-xs">
          Live hydration state and the composition of the route registry.
        </p>
      </header>

      {/* Hydration card — uses `Card.Title` + `Card.Description`
          per the compound anatomy. The status chip carries semantic
          colour (`success` = complete, `default` = pending). */}
      <Card>
        <Card.Header>
          <div className="flex items-center gap-2">
            <Card.Title className="text-sm">Hydration</Card.Title>
            <Chip size="sm" variant="soft" color={hydrated ? "success" : "default"}>
              <Chip.Label>{hydrated ? "Complete" : "Pending"}</Chip.Label>
            </Chip>
          </div>
          <Card.Description className="text-xs">
            Current URL:{" "}
            <code className="text-foreground font-mono tabular-nums">{href || "(none)"}</code>
          </Card.Description>
        </Card.Header>
      </Card>

      {/* Routes card — Card.Header + Card.Content. Numeric values
          use `tabular-nums` so the counts align in the list. */}
      <Card>
        <Card.Header>
          <Card.Title className="text-sm">Routes</Card.Title>
          <Card.Description className="text-xs">
            {tally.total} route{tally.total === 1 ? "" : "s"} registered across every source.
          </Card.Description>
        </Card.Header>
        <Card.Content>
          <ul className="flex flex-col gap-2 text-sm">
            <li className="flex items-center justify-between">
              <span className="text-muted">Root (forRoot)</span>
              <span className="text-foreground font-mono tabular-nums">{tally.root}</span>
            </li>
            <li className="flex items-center justify-between">
              <span className="text-muted">Feature (forFeature)</span>
              <span className="text-foreground font-mono tabular-nums">{tally.feature}</span>
            </li>
            <li className="flex items-center justify-between">
              <span className="text-muted">Discovery (@Route)</span>
              <span className="text-foreground font-mono tabular-nums">{tally.discovery}</span>
            </li>
          </ul>
        </Card.Content>
      </Card>
    </div>
  );
}
