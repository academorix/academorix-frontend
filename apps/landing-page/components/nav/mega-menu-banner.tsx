/**
 * @file mega-menu-banner.tsx
 * @module components/nav/mega-menu-banner
 *
 * @description
 * Right-column banner rendered inside a mega-menu panel. Icon key is
 * resolved from the shared registry.
 */

import { ArrowRightIcon } from "@academorix/ui/icons/outline";

import type { MegaMenuBanner } from "@/lib/types";
import type { ReactNode } from "react";

import { Link } from "@/i18n/navigation";
import { resolveIcon } from "@/lib/icon-registry";
import { isExternalHref } from "@/lib/marketing/cta";

/** Renders the right-column banner of a mega-menu panel. */
export function MegaMenuBannerItem({ banner }: { banner: MegaMenuBanner }): ReactNode {
  const Icon = resolveIcon(banner.icon);
  const external = isExternalHref(banner.cta_href);

  return (
    <aside className="flex h-full flex-col justify-between gap-4 rounded-xl bg-gradient-to-br from-accent/15 via-surface to-surface p-5">
      <div className="flex flex-col gap-3">
        <span className="flex size-10 items-center justify-center rounded-lg bg-background/60 text-accent">
          <Icon aria-hidden="true" className="size-5" />
        </span>
        <span className="text-xs font-semibold tracking-wide text-muted uppercase">
          {banner.eyebrow}
        </span>
        <h3 className="text-base font-semibold text-foreground">{banner.title}</h3>
        <p className="text-xs leading-relaxed text-muted">{banner.description}</p>
      </div>

      {external ? (
        <a
          className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline"
          href={banner.cta_href}
          rel="noopener noreferrer"
          target="_blank"
        >
          {banner.cta_label}
          <ArrowRightIcon aria-hidden="true" className="size-3.5" />
        </a>
      ) : (
        <Link
          className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline"
          href={banner.cta_href}
        >
          {banner.cta_label}
          <ArrowRightIcon aria-hidden="true" className="size-3.5" />
        </Link>
      )}
    </aside>
  );
}
