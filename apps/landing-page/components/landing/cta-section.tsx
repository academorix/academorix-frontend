/**
 * @file cta-section.tsx
 * @module components/landing/cta-section
 *
 * @description
 * Closing conversion banner on the landing page. Consumes `site` as a prop
 * so branded strings stay JSON-driven.
 */

"use client";

import { ArrowRightIcon } from "@academorix/ui/icons/outline";
import { Button } from "@academorix/ui/react";
import { useCallback } from "react";

import type { SiteData } from "@/lib/types";
import type { ReactNode } from "react";

import { Link } from "@/i18n/navigation";
import { getAppUrl } from "@/lib/env";

/** Props for {@link CtaSection}. */
interface CtaSectionProps {
  site: SiteData;
}

/** The final call-to-action section on the landing page. */
export function CtaSection({ site }: CtaSectionProps): ReactNode {
  const goToRegister = useCallback((): void => {
    window.location.href = `${getAppUrl()}/register`;
  }, []);

  return (
    <section aria-labelledby="cta-heading" className="px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl overflow-hidden rounded-3xl border border-default bg-gradient-to-br from-accent/15 via-background to-background px-6 py-14 text-center sm:px-12 sm:py-16">
        <h2
          className="text-3xl font-semibold tracking-tight text-balance text-foreground sm:text-4xl"
          id="cta-heading"
        >
          Ready to run your academy the modern way?
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-pretty text-muted">
          Join the academies already managing athletes, teams, and payments with {site.name}. Get
          set up in minutes.
        </p>

        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button
            className="w-full rounded-full sm:w-auto"
            size="lg"
            variant="primary"
            onPress={goToRegister}
          >
            Get started
            <ArrowRightIcon aria-hidden="true" className="size-4" />
          </Button>

          <Link
            className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-default px-6 py-3 text-sm font-medium text-foreground transition-colors hover:bg-default/40 sm:w-auto"
            href="/pricing"
          >
            See pricing
          </Link>
        </div>
      </div>
    </section>
  );
}
