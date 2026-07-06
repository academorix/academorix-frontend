/**
 * @file pricing-bottom-cta.tsx
 * @module components/pricing/pricing-bottom-cta
 *
 * @description
 * Vercel-parity "Can't decide?" band shown between the FAQ and the footer.
 * Two conversion actions: a secondary "Talk to sales" that opens a mailto,
 * and a primary "Get started for free" that opens the SPA `/register`.
 */

"use client";

import { Button } from "@academorix/ui/react";
import { useCallback } from "react";

import type { ReactNode } from "react";

import { getAppUrl } from "@/lib/env";

/** The bottom conversion band. */
export function PricingBottomCta(): ReactNode {
  const openSales = useCallback((): void => {
    window.location.href = "mailto:sales@academorix.com";
  }, []);

  const openSignup = useCallback((): void => {
    window.location.href = `${getAppUrl()}/register`;
  }, []);

  return (
    <section aria-labelledby="pricing-decide-heading" className="border-t border-default">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-start justify-between gap-6 px-6 py-16 md:flex-row md:items-center">
        <h2
          className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl"
          id="pricing-decide-heading"
        >
          Can&apos;t decide?
        </h2>
        <div className="flex flex-wrap items-center gap-3">
          <Button className="rounded-full" variant="secondary" onPress={openSales}>
            Talk to sales
          </Button>
          <Button className="rounded-full" variant="primary" onPress={openSignup}>
            Get started for free
          </Button>
        </div>
      </div>
    </section>
  );
}
