/**
 * @file persona-cards.tsx
 * @module components/marketing/persona-cards
 *
 * @description
 * Four-card grid of role-based landing entries. Each card carries
 * an icon, a role title, a one-sentence outcome pitch, and a CTA
 * that deep-links to the persona page. Used on the landing page to
 * segment new visitors by role.
 */

import clsx from "clsx";
import Link from "next/link";

import type { Localized } from "@/lib/types";
import type { HomePersonaCard } from "@/lib/types";

import { resolveIcon } from "@/lib/icon-registry";

/** Props for {@link PersonaCards}. */
export interface PersonaCardsProps {
  items: readonly Localized<HomePersonaCard>[];
  className?: string;
}

/** Grid of persona cards. */
export function PersonaCards({ items, className }: PersonaCardsProps) {
  return (
    <ul className={clsx("grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4", className)}>
      {items.map((persona) => {
        const Icon = resolveIcon(persona.icon);

        return (
          <li key={persona.slug}>
            <Link
              className="group flex h-full flex-col gap-4 rounded-2xl border border-default/40 bg-surface/60 p-6 backdrop-blur-md transition-colors hover:border-default hover:bg-surface/80"
              href={persona.cta_href}
            >
              <span className="inline-flex size-10 items-center justify-center rounded-xl bg-default/60 text-foreground">
                <Icon aria-hidden className="size-5" />
              </span>
              <div className="flex flex-col gap-2">
                <h3 className="text-lg font-semibold text-foreground">{persona.title}</h3>
                <p className="text-sm text-muted">{persona.description}</p>
              </div>
              <span className="mt-auto pt-2 text-xs font-medium tracking-wide text-accent transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1">
                {persona.cta_label} →
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
