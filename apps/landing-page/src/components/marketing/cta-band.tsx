/**
 * @file cta-band.tsx
 * @module components/marketing/cta-band
 *
 * @description
 * Full-bleed CTA band with a centered heading, description, and
 * dual CTA buttons. Painted with an accent-tinted gradient that
 * reads as a decisive close on any long marketing page.
 */

import clsx from "clsx";

import { CtaButton } from "./cta-button";

import type { CtaButtonCta } from "./cta-button";

/** Props for {@link CtaBand}. */
export interface CtaBandProps {
  title: string;
  description: string;
  ctaPrimary: CtaButtonCta;
  ctaSecondary?: CtaButtonCta;
  className?: string;
}

/** Full-bleed marketing CTA band. */
export function CtaBand({ title, description, ctaPrimary, ctaSecondary, className }: CtaBandProps) {
  return (
    <section className={clsx("mx-auto max-w-6xl px-6 py-24", className)}>
      <div className="relative overflow-hidden rounded-3xl border border-accent/30 bg-gradient-to-br from-accent/20 via-accent/5 to-transparent px-8 py-16 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-balance text-foreground sm:text-4xl">
            {title}
          </h2>
          <p className="text-base text-balance text-muted sm:text-lg">{description}</p>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
            <CtaButton cta={ctaPrimary} variant="primary" />
            {ctaSecondary ? <CtaButton cta={ctaSecondary} variant="ghost" /> : null}
          </div>
        </div>
      </div>
    </section>
  );
}
