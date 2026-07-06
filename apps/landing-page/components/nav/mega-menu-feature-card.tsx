/**
 * @file mega-menu-feature-card.tsx
 * @module components/nav/mega-menu-feature-card
 *
 * @description
 * A single icon + title + description tile inside a mega-menu panel. Icon
 * key is resolved from the shared registry so JSON fixtures can carry
 * string keys.
 */

import { Chip } from "@academorix/ui/react";

import type { MegaMenuFeatureCard } from "@/lib/types";
import type { ReactNode } from "react";

import { Link } from "@/i18n/navigation";
import { resolveIcon } from "@/lib/icon-registry";

/** Renders a single mega-menu feature tile. */
export function MegaMenuFeatureCardItem({ card }: { card: MegaMenuFeatureCard }): ReactNode {
  const Icon = resolveIcon(card.icon);

  return (
    <Link
      className="group flex flex-col gap-2 rounded-lg p-3 transition-colors hover:bg-surface"
      href={card.href}
    >
      <div className="flex items-center gap-3">
        <span className="flex size-9 items-center justify-center rounded-lg bg-surface text-foreground transition-colors group-hover:bg-accent/10 group-hover:text-accent">
          <Icon aria-hidden="true" className="size-5" />
        </span>
        <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
          {card.title}
          {card.badge ? (
            <Chip color="accent" size="sm" variant="soft">
              <Chip.Label>{card.badge}</Chip.Label>
            </Chip>
          ) : null}
        </span>
      </div>
      <p className="text-xs leading-relaxed text-muted">{card.description}</p>
    </Link>
  );
}
