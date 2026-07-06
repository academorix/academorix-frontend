/**
 * @file cta-band.tsx
 * @module components/marketing/cta-band
 *
 * @description
 * Reusable end-of-page CTA band (gradient background, headline, two CTAs).
 * Used by every deep marketing page — product, sport, enterprise — as the
 * final conversion push before the footer.
 */

"use client";

import { Button } from "@academorix/ui/react";
import { useCallback } from "react";

import type { ReactNode } from "react";

import { envConfig } from "@/config/env.config";

/** Props for {@link CtaBand}. */
interface CtaBandProps {
  heading?: string;
  description?: string;
}

/** The final CTA band. */
export function CtaBand({
  heading = "Ready to run your academy the modern way?",
  description = "Start free — no credit card required. Upgrade when you outgrow the Starter tier.",
}: CtaBandProps): ReactNode {
  const goToRegister = useCallback((): void => {
    window.location.href = `${envConfig.appUrl}/register`;
  }, []);

  const goToSales = useCallback((): void => {
    window.location.href = "mailto:sales@academorix.com";
  }, []);

  return (
    <section aria-labelledby="cta-band-heading" className="mx-auto w-full max-w-6xl px-6 pb-24">
      <div className="overflow-hidden rounded-3xl border border-default bg-gradient-to-br from-accent/15 via-surface to-surface px-6 py-14 text-center sm:px-12 sm:py-16">
        <h2
          className="text-3xl font-semibold tracking-tight text-balance text-foreground sm:text-4xl"
          id="cta-band-heading"
        >
          {heading}
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-pretty text-muted">{description}</p>
        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <Button className="rounded-full" size="lg" variant="primary" onPress={goToRegister}>
            Get started
          </Button>
          <Button className="rounded-full" size="lg" variant="secondary" onPress={goToSales}>
            Talk to sales
          </Button>
        </div>
      </div>
    </section>
  );
}
