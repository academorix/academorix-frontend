/**
 * @file default-pending-fallback.component.tsx
 * @module @stackra/routing/react/components/fallbacks/default-pending-fallback
 * @description Framework-default pending fallback — a fixed
 *   top-of-viewport indeterminate progress bar.
 *
 *   Rendered by layout components during a route transition when
 *   the previous route is still visible (PLAN §5). Consumers
 *   override via
 *   `RoutingModule.forRoot({fallbacks: {PendingComponent: ...}})`.
 *
 *   Layout:
 *
 *   - A `fixed inset-x-0 top-0` strip so the bar sits above the
 *     app chrome without displacing any layout.
 *   - `pointer-events-none` on the outer wrapper so the underlying
 *     page STAYS interactive during the transition — that's the
 *     whole point of the pending-vs-loading split (§5 of the
 *     PLAN).
 *   - HeroUI OSS `<ProgressBar>` in indeterminate mode as the
 *     progress affordance. The `Track` + `Fill` compound parts
 *     are the canonical anatomy from the docs.
 *   - `z-50` matches HeroUI's `Modal.Container` layer so the bar
 *     sits above every route content but below any overlay.
 */

import { type ReactElement } from "react";
import { ProgressBar } from "@stackra/ui/react";

import type { IDefaultPendingFallbackProps } from "./default-pending-fallback.interface";

/**
 * The default pending fallback — a top-of-viewport progress bar.
 *
 * @param props - See {@link IDefaultPendingFallbackProps}.
 * @returns A fixed-position indeterminate progress bar element.
 */
export function DefaultPendingFallback({
  className,
  "aria-label": ariaLabel = "Loading page",
}: IDefaultPendingFallbackProps = {}): ReactElement {
  const rootClass = ["pointer-events-none fixed inset-x-0 top-0 z-50", className]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={rootClass}>
      {/* Indeterminate progress bar — no label, just the animated
          fill. HeroUI's `size="sm"` gives us the thin strip
          typically seen at the top of the page. */}
      <ProgressBar
        isIndeterminate
        aria-label={ariaLabel}
        size="sm"
        color="accent"
        className="w-full"
      >
        <ProgressBar.Track className="rounded-none">
          <ProgressBar.Fill />
        </ProgressBar.Track>
      </ProgressBar>
    </div>
  );
}
