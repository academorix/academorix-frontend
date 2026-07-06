/**
 * @file marketing-hero.tsx
 * @module components/marketing/marketing-hero
 *
 * @description
 * Reusable deep-page hero used by product, sport, and enterprise pages.
 * Renders an eyebrow, a large heading, a supporting description, one or
 * two CTAs, and a decorative icon panel on the right. Interactive because
 * the primary CTA opens either the SPA or a `mailto:` link.
 */

"use client";

import { ArrowRightIcon } from "@academorix/ui/icons/outline";
import { Button } from "@academorix/ui/react";
import { useCallback } from "react";

import type { CtaDescriptor } from "@/lib/types";
import type { ReactNode } from "react";

import { Link } from "@/i18n/navigation";
import { resolveIcon } from "@/lib/icon-registry";
import { isExternalHref, resolveCta } from "@/lib/marketing/cta";

/** Props for {@link MarketingHero}. */
interface MarketingHeroProps {
  eyebrow: string;
  title: string;
  description: string;
  primaryCta: CtaDescriptor;
  /** Optional secondary CTA (e.g. "See pricing" from an enterprise page). */
  secondaryCta?: CtaDescriptor;
  /**
   * String key of the big decorative icon rendered inside the right-hand
   * panel. Resolved via `lib/icon-registry.ts` at render time so we don't
   * need to pass an actual icon component across the Server→Client
   * boundary (React Server Components rejects that).
   */
  iconKey: string;
}

/** The deep-page hero. */
export function MarketingHero({
  eyebrow,
  title,
  description,
  primaryCta,
  secondaryCta,
  iconKey,
}: MarketingHeroProps): ReactNode {
  const Icon = resolveIcon(iconKey);
  const primaryHref = resolveCta(primaryCta);
  const secondaryHref = secondaryCta ? resolveCta(secondaryCta) : null;

  const pressPrimary = useCallback((): void => {
    window.location.href = primaryHref;
  }, [primaryHref]);

  return (
    <section
      aria-labelledby="page-hero-heading"
      className="mx-auto w-full max-w-6xl px-6 pt-20 pb-16 md:pb-20"
    >
      <div className="grid grid-cols-1 items-center gap-10 md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="flex flex-col gap-6">
          <span className="text-xs font-semibold tracking-wider text-muted uppercase">
            {eyebrow}
          </span>
          <h1
            className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-6xl"
            id="page-hero-heading"
          >
            {title}
          </h1>
          <p className="max-w-2xl text-lg text-muted">{description}</p>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button className="rounded-full" size="lg" variant="primary" onPress={pressPrimary}>
              {primaryCta.label}
              <ArrowRightIcon aria-hidden="true" className="size-4" />
            </Button>
            {secondaryCta && secondaryHref ? (
              isExternalHref(secondaryHref) ? (
                <a
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-default px-6 py-3 text-sm font-medium text-foreground transition-colors hover:bg-default/40"
                  href={secondaryHref}
                  rel="noreferrer"
                >
                  {secondaryCta.label}
                </a>
              ) : (
                <Link
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-default px-6 py-3 text-sm font-medium text-foreground transition-colors hover:bg-default/40"
                  href={secondaryHref}
                >
                  {secondaryCta.label}
                </Link>
              )
            ) : null}
          </div>
        </div>

        {/* Decorative right panel — big icon on a gradient tile. */}
        <div className="hidden md:flex md:justify-end">
          <div className="flex size-64 items-center justify-center rounded-3xl bg-gradient-to-br from-accent/20 via-surface to-surface lg:size-80">
            <Icon aria-hidden="true" className="size-24 text-accent lg:size-32" />
          </div>
        </div>
      </div>
    </section>
  );
}
