/**
 * @file default-loading-fallback.component.tsx
 * @module @stackra/routing/react/components/fallbacks/default-loading-fallback
 * @description Framework-default loading fallback — HeroUI OSS
 *   `<Skeleton>` primitives arranged as a typical page shell.
 *
 *   Used when a route omits its own `LoadingComponent`. Consumers
 *   override via
 *   `RoutingModule.forRoot({fallbacks: {LoadingComponent: ...}})`.
 *
 *   Layout:
 *
 *   - Header row — a wide title bar + a subtitle bar + two short
 *     status bars, matching a typical dashboard page shell.
 *   - Content — a 3-column grid of card-shaped skeletons that
 *     resembles a KPI / card overview.
 *   - The whole region is a single `role="status"` so assistive
 *     tech reads it as a single loading announcement rather than
 *     10 individual shimmer bars.
 *
 *   Uses `skeleton--shimmer` on the root so all inner skeletons
 *   share one synchronized shimmer sweep — the polished "single
 *   shimmer" pattern from HeroUI's docs. Layout utilities only
 *   (`grid`, `gap-*`, `p-*`, `flex`) per `ui-components.md`.
 */

import type { ReactElement } from "react";
import { Skeleton } from "@stackra/ui/react";

import type { IDefaultLoadingFallbackProps } from "./default-loading-fallback.interface";

/**
 * The default loading fallback — page-shell skeleton grid.
 *
 * @param props - See {@link IDefaultLoadingFallbackProps}.
 * @returns A page-scale skeleton grid.
 */
export function DefaultLoadingFallback({
  className,
  "aria-label": ariaLabel = "Loading",
}: IDefaultLoadingFallbackProps = {}): ReactElement {
  // `skeleton--shimmer` synchronises every child skeleton's
  // shimmer pass — the child skeletons set `animationType="none"`
  // so they inherit the parent sweep.
  const rootClass = ["skeleton--shimmer relative flex flex-col gap-6 p-6", className]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={rootClass} role="status" aria-label={ariaLabel} aria-live="polite">
      {/* Header row — page title + subtitle + two status pills. */}
      <div className="flex flex-col gap-3">
        <Skeleton animationType="none" className="h-8 w-1/3" />
        <Skeleton animationType="none" className="h-4 w-2/3 max-w-md" />
        <div className="flex gap-3">
          <Skeleton animationType="none" className="h-6 w-24 rounded-full" />
          <Skeleton animationType="none" className="h-6 w-32 rounded-full" />
        </div>
      </div>

      {/* Content grid — three card skeletons. The last column
          collapses under `md` to keep the shell readable on mobile. */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Skeleton animationType="none" className="h-40 rounded-2xl" />
        <Skeleton animationType="none" className="h-40 rounded-2xl" />
        <Skeleton animationType="none" className="h-40 rounded-2xl" />
      </div>

      {/* Text block — three rows of body copy skeletons. */}
      <div className="flex flex-col gap-3">
        <Skeleton animationType="none" className="h-4 w-full" />
        <Skeleton animationType="none" className="h-4 w-5/6" />
        <Skeleton animationType="none" className="h-4 w-3/4" />
      </div>
    </div>
  );
}
