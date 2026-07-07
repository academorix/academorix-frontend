/**
 * @file marketing-hero.tsx
 * @module components/marketing/marketing-hero
 *
 * @description
 * The hero band used at the top of every marketing page. Composes
 * an eyebrow, a large balanced headline, a subheading, an optional
 * CTA row, and an optional trust line. Renders as a Server
 * Component; the CTAs delegate to the shared {@link CtaButton}
 * client wrapper for signup/trial/contact-sales intent resolution.
 */

import clsx from "clsx";

import { CtaButton } from "./cta-button";

import type { CtaButtonCta } from "./cta-button";
import type { ReactNode } from "react";

/** Props for {@link MarketingHero}. */
export interface MarketingHeroProps {
  eyebrow?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  ctaPrimary?: CtaButtonCta;
  ctaSecondary?: CtaButtonCta;
  trustLine?: ReactNode;
  className?: string;
}

/** Full-width marketing hero, server-safe. */
export function MarketingHero({
  eyebrow,
  title,
  subtitle,
  ctaPrimary,
  ctaSecondary,
  trustLine,
  className,
}: MarketingHeroProps) {
  return (
    <section
      className={clsx("relative overflow-hidden px-6 pt-24 pb-16 sm:pt-32 sm:pb-24", className)}
    >
      <div className="mx-auto flex max-w-4xl flex-col items-center gap-6 text-center">
        {eyebrow ? (
          <span className="inline-flex items-center rounded-full border border-default/60 bg-surface/60 px-3 py-1 text-xs font-medium tracking-wider text-muted uppercase backdrop-blur-sm">
            {eyebrow}
          </span>
        ) : null}

        <h1 className="text-4xl font-semibold tracking-tight text-balance text-foreground sm:text-5xl md:text-6xl">
          {title}
        </h1>

        {subtitle ? (
          <p className="max-w-2xl text-base text-balance text-muted sm:text-lg">{subtitle}</p>
        ) : null}

        {(ctaPrimary || ctaSecondary) && (
          <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
            {ctaPrimary ? <CtaButton cta={ctaPrimary} variant="primary" /> : null}
            {ctaSecondary ? <CtaButton cta={ctaSecondary} variant="ghost" /> : null}
          </div>
        )}

        {trustLine ? <p className="text-xs text-muted">{trustLine}</p> : null}
      </div>
    </section>
  );
}
