/**
 * @file devtools-inspector-overlay.component.tsx
 * @module @stackra/devtools/react/components
 * @description Full-viewport overlay that renders every
 *   `IDevtoolsInspectorRegion` as an outlined `<div>`. Clicking a
 *   region activates the owning panel and disables the overlay.
 */

import { useCallback, useEffect, useMemo, useRef, useState, type ReactElement } from "react";
import { Tooltip } from "@stackra/ui/react";
import type { IDevtoolsInspectorRegion } from "@stackra/contracts";

import { useDevtoolsContext } from "../../hooks/use-devtools-context.hook";
import { useDevtoolsFrameState } from "../../hooks/use-devtools-frame-state.hook";
import { useDevtoolsInspector } from "../../hooks/use-devtools-inspector.hook";
import type { DevtoolsInspectorOverlayProps } from "./devtools-inspector-overlay.interface";

/**
 * A single region + its resolved bounds. Materialised from the
 * lazy `bounds` accessor at render time.
 */
interface ResolvedRegion {
  readonly region: IDevtoolsInspectorRegion;
  readonly rect: DOMRect;
}

/**
 * Resolve every region's bounds — dropping regions whose lazy
 * accessor returns `null` (element hasn't mounted / has been
 * removed).
 */
function resolveRegions(regions: readonly IDevtoolsInspectorRegion[]): readonly ResolvedRegion[] {
  const resolved: ResolvedRegion[] = [];
  for (const region of regions) {
    // Snapshot vs. accessor — the accessor branch measures lazily
    // so a source with 100 regions never pays for measurement when
    // the overlay is closed.
    let rect: DOMRect | null;
    if (typeof region.bounds === "function") {
      try {
        rect = region.bounds();
      } catch {
        // fail-soft — a broken accessor drops the region.
        rect = null;
      }
    } else {
      rect = region.bounds;
    }
    if (rect) resolved.push({ region, rect });
  }
  return resolved;
}

/**
 * The inspector overlay.
 */
export function DevtoolsInspectorOverlay({
  className,
}: DevtoolsInspectorOverlayProps): ReactElement | null {
  const { enabled, setEnabled, regions } = useDevtoolsInspector();
  const { analytics, panels } = useDevtoolsContext();
  const { update } = useDevtoolsFrameState();

  // `pulse` bumps every frame we ask for a re-render on resize /
  // scroll. It's not read by anything — its identity change is
  // what triggers `useMemo` to re-measure the regions.
  const [pulse, setPulse] = useState(0);
  const rafRef = useRef<number | null>(null);

  const requestRemeasure = useCallback(() => {
    if (rafRef.current !== null) return;
    rafRef.current = window.requestAnimationFrame(() => {
      rafRef.current = null;
      setPulse((p) => p + 1);
    });
  }, []);

  // Attach viewport-resize + scroll listeners while the overlay is
  // active. Both trigger a rAF-batched re-measure so drag-resize +
  // scroll keep the outlines aligned.
  useEffect(() => {
    if (!enabled) return;
    if (typeof window === "undefined") return;
    window.addEventListener("resize", requestRemeasure);
    window.addEventListener("scroll", requestRemeasure, true);
    return () => {
      window.removeEventListener("resize", requestRemeasure);
      window.removeEventListener("scroll", requestRemeasure, true);
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [enabled, requestRemeasure]);

  // Bind Escape → close overlay.
  useEffect(() => {
    if (!enabled) return;
    if (typeof window === "undefined") return;
    const handleKey = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        event.preventDefault();
        setEnabled(false);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [enabled, setEnabled]);

  // Re-measure every region on each render (pulse is a dep).
  const resolved = useMemo(
    () => resolveRegions(regions),
    // `pulse` is intentionally a dep so a resize/scroll triggers
    // fresh measurements.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [regions, pulse],
  );

  const handleRegionClick = useCallback(
    (region: IDevtoolsInspectorRegion) => {
      // Activate the region's owning panel.
      const target = panels.find(region.panelId);
      if (target) {
        update({ activePanelId: target.id, isOpen: true });
        // Call the panel's optional scrollToRegion hook — panels
        // that visualise the same regions can highlight the row
        // that maps to the clicked outline.
        const scrollTo = (target as { scrollToRegion?: (id: string) => void }).scrollToRegion;
        if (typeof scrollTo === "function") {
          try {
            scrollTo(region.id);
          } catch {
            // fail-soft — the shell must not stall on a panel bug.
          }
        }
      }
      analytics.inspectorRegionClicked(region.id, region.panelId);
      // Close the overlay after a click — matches the
      // "click-then-inspect" contract of browser DevTools.
      setEnabled(false);
    },
    [analytics, panels, setEnabled, update],
  );

  if (!enabled) return null;
  if (typeof document === "undefined") return null;

  return (
    <div
      // `pointer-events-none` on the container so pass-through
      // clicks still work everywhere except on the outlined regions
      // themselves.
      className={className ?? "bg-overlay/10 pointer-events-none fixed inset-0 z-[2147483001]"}
      role="presentation"
      data-devtools-inspector-overlay=""
    >
      {resolved.map(({ region, rect }) => (
        <Tooltip key={`${region.panelId}:${region.id}`}>
          <Tooltip.Trigger>
            <button
              type="button"
              aria-label={region.label}
              onClick={() => handleRegionClick(region)}
              // Use inline styles for absolute positioning — the
              // rects are dynamic so a Tailwind class isn't
              // suitable.
              style={{
                position: "fixed",
                top: rect.top,
                left: rect.left,
                width: rect.width,
                height: rect.height,
              }}
              className="border-accent/70 bg-accent/10 focus:ring-accent pointer-events-auto absolute cursor-pointer rounded border-2 outline-none focus:ring-2"
              data-devtools-inspector-region={region.id}
            />
          </Tooltip.Trigger>
          <Tooltip.Content>{region.label}</Tooltip.Content>
        </Tooltip>
      ))}
    </div>
  );
}
