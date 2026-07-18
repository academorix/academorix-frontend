/**
 * @file breadcrumbs.component.tsx
 * @module @stackra/routing/react/components/breadcrumbs
 * @description Optional breadcrumbs renderer per PLAN §13.
 *
 *   Consumes `useBreadcrumbs()` and renders the trail through
 *   HeroUI `<Breadcrumbs>` + `<Breadcrumbs.Item>` (dot-notation
 *   compound; verified via
 *   `mcp_heroui_pro_get_component_docs`). The rendered anchors
 *   pick up `aria-current="page"` on the leaf entry — HeroUI's
 *   compound styles the current crumb differently.
 *
 *   `Breadcrumbs.Item` renders an `<a>` when `href` is set OR an
 *   inert current-page indicator when `href` is omitted (per the
 *   React Aria semantics). The leaf crumb intentionally omits
 *   `href` so it becomes the current-page marker.
 *
 *   The `no-underline` class on link items follows the HeroUI
 *   design-taste principle that breadcrumbs rely on structural
 *   context for affordance and don't need underline decoration.
 */

import type { ReactElement } from "react";
import { Breadcrumbs as HeroBreadcrumbs } from "@stackra/ui/react";

import { useBreadcrumbs } from "@/react/hooks/use-breadcrumbs";
import type { IBreadcrumbsProps } from "./breadcrumbs.interface";

/**
 * Render the current breadcrumb trail via HeroUI's `<Breadcrumbs />`.
 *
 * @param props - See {@link IBreadcrumbsProps}.
 * @returns A HeroUI `<Breadcrumbs />` element, or `null` when the
 *   trail is empty AND no home entry is configured.
 */
export function Breadcrumbs({
  separator,
  homeLabel,
  homeIcon,
  className,
}: IBreadcrumbsProps = {}): ReactElement | null {
  const crumbs = useBreadcrumbs();

  // When no matches contribute breadcrumbs AND no explicit home
  // entry is set, render nothing — a silent absence is better
  // than an empty widget.
  if (crumbs.length === 0 && !homeLabel) return null;

  return (
    <HeroBreadcrumbs
      className={className}
      // HeroUI's default separator is a chevron-right icon. We
      // pass through the caller override; `undefined` keeps the
      // default.
      separator={separator}
    >
      {homeLabel ? (
        // The home crumb points at `/` and stays a real link even
        // when the trail is empty — this is how consumers get
        // "Home /" affordance without contributing a match-level
        // breadcrumb.
        <HeroBreadcrumbs.Item key="home" href="/" className="no-underline">
          {homeIcon}
          {homeLabel}
        </HeroBreadcrumbs.Item>
      ) : null}
      {crumbs.map((crumb) =>
        crumb.isCurrent ? (
          // Leaf entry — omit `href` so React Aria stamps
          // `aria-current="page"` and HeroUI applies the
          // "current" styling automatically.
          <HeroBreadcrumbs.Item key={crumb.path} className="no-underline">
            {crumb.label}
          </HeroBreadcrumbs.Item>
        ) : (
          <HeroBreadcrumbs.Item key={crumb.path} href={crumb.path} className="no-underline">
            {crumb.label}
          </HeroBreadcrumbs.Item>
        ),
      )}
    </HeroBreadcrumbs>
  );
}
