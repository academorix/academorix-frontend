/**
 * @file breadcrumbs.tsx
 * @module components/refine/breadcrumbs
 *
 * @description
 * Resource-aware breadcrumb trail built from Refine's `useBreadcrumb` (which
 * derives the trail from the active resource + action) and rendered with
 * HeroUI's `Breadcrumbs`. A leading Home crumb links to the app root; the final
 * crumb is the current page (no link). Intermediate crumbs use React Router
 * `Link`s so navigation stays client-side (no full reload).
 *
 * Rendered inside the CRUD view headers ({@link "@/components/refine/views"}).
 */

import { HomeIcon } from "@stackra/ui/icons/heroicon/outline";
import { Breadcrumbs as HeroBreadcrumbs } from "@stackra/ui/react";
import { useBreadcrumb } from "@refinedev/core";
import { Link } from "@stackra/routing/react";

import type { ReactNode } from "react";

import { appRoutes } from "@/lib/module";

/** A single resolved crumb: a stable key, its label, and optional link target. */
interface Crumb {
  key: string;
  label: ReactNode;
  href?: string;
}

/**
 * Renders the breadcrumb trail for the current resource/action.
 *
 * The Home crumb and any crumb with an `href` navigate client-side; the last
 * crumb renders as plain text to mark the current page.
 */
export function Breadcrumbs(): ReactNode {
  const { breadcrumbs } = useBreadcrumb();

  const crumbs: Crumb[] = [
    {
      key: "home",
      href: appRoutes.home,
      label: <HomeIcon aria-label="Home" className="size-4" />,
    },
    ...breadcrumbs.map((crumb) => ({
      key: `crumb-${crumb.label}`,
      href: crumb.href,
      label: crumb.label,
    })),
  ];

  return (
    <HeroBreadcrumbs>
      {crumbs.map((crumb, index) => {
        const isLast = index === crumbs.length - 1;

        return (
          <HeroBreadcrumbs.Item key={crumb.key}>
            {crumb.href && !isLast ? (
              <Link className="text-muted transition-colors hover:text-foreground" to={crumb.href}>
                {crumb.label}
              </Link>
            ) : (
              crumb.label
            )}
          </HeroBreadcrumbs.Item>
        );
      })}
    </HeroBreadcrumbs>
  );
}
