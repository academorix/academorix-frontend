/**
 * @file cta-section.tsx
 * @module modules/landing/components/cta-section
 *
 * @description
 * The closing conversion banner. A single, focused panel with the primary
 * "Get started" action (→ `/login`) and a secondary in-page anchor to pricing.
 * Uses an accent-tinted gradient (design tokens only) so it reads as a highlight
 * in both light and dark themes without hardcoded colors.
 */

import { ArrowRightIcon } from "@academorix/ui/icons/outline";
import { Button } from "@academorix/ui/react";
import { useNavigate } from "react-router";

import type { ReactNode } from "react";

import { siteConfig } from "@/config/site";
import { appRoutes } from "@/lib/module";

/**
 * The final call-to-action section.
 */
export function CtaSection(): ReactNode {
  const navigate = useNavigate();

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
          Join the academies already managing athletes, teams, and payments with {siteConfig.name}.
          Get set up in minutes.
        </p>

        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button
            className="w-full sm:w-auto"
            size="lg"
            variant="primary"
            onPress={() => navigate(appRoutes.login)}
          >
            Get started
            <ArrowRightIcon aria-hidden="true" className="size-4" />
          </Button>

          <a
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-default px-6 py-3 text-sm font-medium text-foreground transition-colors hover:bg-default/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:w-auto"
            href="#pricing"
          >
            See pricing
          </a>
        </div>
      </div>
    </section>
  );
}
