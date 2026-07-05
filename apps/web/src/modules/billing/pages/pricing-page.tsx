/**
 * @file pricing-page.tsx
 * @module modules/billing/pages/pricing-page
 *
 * @description
 * Public marketing surface at `/pricing`. Vercel-style layout:
 *
 * 1. Hero — big title + tagline + billing-period toggle.
 * 2. Plan cards row — one card per tier with derived highlights + CTA.
 * 3. Feature-comparison matrix — full grant-by-plan table grouped by
 *    category (see `pricing-config.ts`).
 * 4. FAQ accordion.
 * 5. Bottom CTA — send readers to `/create-workspace`.
 *
 * Data sources:
 * - `useBillingCatalog()` — `GET /api/billing/catalog` (public, no auth).
 * - `useStartCheckout()` — `POST /api/billing/checkout` (authenticated
 *   callers only; anonymous visitors go to `/create-workspace` instead).
 *
 * For an already-authenticated tenant, clicking "Get started" invokes
 * `startCheckout` which returns a `{ url }` — the SPA then redirects the
 * browser to the payment provider. Anonymous visitors are pushed to the
 * workspace creation flow on the central host (they need a tenant before
 * they can subscribe).
 *
 * @see BACKEND_HANDOFF.md §5.3 (`GET /api/billing/catalog` — public)
 * @see .kiro/specs/backend-frontend-alignment/REMAINING_TASKS.md Wave 8 §61
 */

import {
  ArrowRightIcon,
  ExclamationCircleIcon,
  RocketLaunchIcon,
} from "@academorix/ui/icons/outline";
import { Button, Card, Spinner, ToggleButton, ToggleButtonGroup } from "@academorix/ui/react";
import { useGetIdentity } from "@refinedev/core";
import { useCallback, useState } from "react";
import { useNavigate } from "react-router";

import type { BillingPeriod, Identity, PlanTier } from "@/types";
import type { Key, ReactNode } from "react";

import { ComparisonMatrix } from "@/modules/billing/components/comparison-matrix";
import { PlanCard } from "@/modules/billing/components/plan-card";
import { PricingFaq } from "@/modules/billing/components/pricing-faq";
import { useBillingCatalog, useStartCheckout } from "@/modules/billing/hooks/use-billing";
import { ctaFor, sortPlansForDisplay } from "@/modules/billing/lib/pricing-config";
import { BILLING_PERIOD_LABELS } from "@/types";

/** Location we send anonymous visitors when they click a "Get started" CTA. */
const CREATE_WORKSPACE_PATH = "/create-workspace";

/**
 * Enterprise sales landing. We route Enterprise CTAs to the same
 * "Create workspace" onboarding today; when a real /contact-sales page ships,
 * flip this constant.
 */
const CONTACT_SALES_PATH = "/create-workspace";

/** The pricing page. */
export default function PricingPage(): ReactNode {
  const navigate = useNavigate();
  const { data: identity } = useGetIdentity<Identity>();
  const isAuthenticated = identity !== undefined && identity !== null;

  const [period, setPeriod] = useState<BillingPeriod>("monthly");
  const { data: plans, isLoading, error } = useBillingCatalog();
  const checkout = useStartCheckout();

  const sortedPlans = plans ? sortPlansForDisplay(plans) : [];

  const handleStart = useCallback(
    async (plan: PlanTier): Promise<void> => {
      const cta = ctaFor(plan, isAuthenticated);

      // Enterprise (or any "contact sales" plan) short-circuits to a lead form.
      if (cta.kind === "contact_sales") {
        navigate(CONTACT_SALES_PATH);

        return;
      }

      // Anonymous visitors need a workspace first; can't check out without a tenant.
      if (cta.kind === "create_workspace") {
        navigate(CREATE_WORKSPACE_PATH);

        return;
      }

      try {
        const { url } = await checkout.mutate({
          plan_key: plan.key,
          billing_period: period,
          success_url: `${window.location.origin}/settings/billing`,
          cancel_url: `${window.location.origin}/pricing`,
        });

        window.location.href = url;
      } catch {
        // Error is surfaced via `checkout.error` below.
      }
    },
    [checkout, isAuthenticated, navigate, period],
  );

  const handlePeriod = useCallback((key: Key): void => {
    if (key === "monthly" || key === "yearly") {
      setPeriod(key);
    }
  }, []);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-20 px-4 py-16 sm:px-6 lg:px-8">
      <PricingHero handlePeriod={handlePeriod} period={period} />

      {error ? <ErrorBanner message={error.message} /> : null}
      {checkout.error ? <ErrorBanner message={checkout.error.message} /> : null}

      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <Spinner aria-label="Loading plans" />
        </div>
      ) : sortedPlans.length > 0 ? (
        <>
          <section aria-labelledby="plans-heading" className="scroll-mt-24">
            <h2 className="sr-only" id="plans-heading">
              Plans
            </h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
              {sortedPlans.map((plan) => (
                <PlanCard
                  key={plan.key}
                  isAuthenticated={isAuthenticated}
                  isStarting={checkout.isPending}
                  period={period}
                  plan={plan}
                  onStart={handleStart}
                />
              ))}
            </div>
          </section>

          <section aria-labelledby="compare-heading" className="scroll-mt-24">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-sm font-semibold tracking-wide text-accent uppercase">Compare</p>
              <h2
                className="mt-2 text-3xl font-semibold tracking-tight text-balance text-foreground sm:text-4xl"
                id="compare-heading"
              >
                Every feature, side by side
              </h2>
              <p className="mt-4 text-lg text-pretty text-muted">
                See exactly what&apos;s included with each plan, so you can pick the tier that fits
                the academy you run today.
              </p>
            </div>

            <div className="mt-10">
              <ComparisonMatrix plans={sortedPlans} />
            </div>
          </section>

          <PricingFaq />

          <BottomCta onGoToCreate={() => navigate(CREATE_WORKSPACE_PATH)} />
        </>
      ) : (
        <p className="text-center text-sm text-muted">No plans available right now.</p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Internal sections
// ─────────────────────────────────────────────────────────────────────

/** Hero: eyebrow, big title, tagline, monthly/yearly toggle. */
function PricingHero({
  period,
  handlePeriod,
}: {
  period: BillingPeriod;
  handlePeriod: (key: Key) => void;
}): ReactNode {
  return (
    <section
      aria-labelledby="pricing-hero-heading"
      className="flex flex-col items-center gap-6 text-center"
    >
      <p className="text-sm font-semibold tracking-wide text-accent uppercase">Pricing</p>
      <h1
        className="text-4xl font-semibold tracking-tight text-balance text-foreground sm:text-5xl lg:text-6xl"
        id="pricing-hero-heading"
      >
        Plans that scale with your academy
      </h1>
      <p className="max-w-2xl text-lg text-pretty text-muted sm:text-xl">
        Start free for 14 days, then pick a plan that matches how you run. Change, pause, or cancel
        anytime.
      </p>
      <ToggleButtonGroup
        aria-label="Billing period"
        selectedKeys={new Set([period])}
        selectionMode="single"
        onSelectionChange={(keys) => {
          const first = Array.from(keys)[0];

          if (typeof first === "string") {
            handlePeriod(first);
          }
        }}
      >
        <ToggleButton id="monthly">{BILLING_PERIOD_LABELS.monthly}</ToggleButton>
        <ToggleButton id="yearly">{BILLING_PERIOD_LABELS.yearly} — save 20%</ToggleButton>
      </ToggleButtonGroup>
    </section>
  );
}

/** Full-width error banner used by both the catalog + checkout errors. */
function ErrorBanner({ message }: { message: string }): ReactNode {
  return (
    <div className="mx-auto flex w-full max-w-3xl items-start gap-2 rounded-md border border-danger/30 bg-danger/5 p-3 text-sm text-danger">
      <ExclamationCircleIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

/** Bottom-of-page conversion card. */
function BottomCta({ onGoToCreate }: { onGoToCreate: () => void }): ReactNode {
  return (
    <Card className="text-center">
      <Card.Content>
        <div className="mx-auto flex max-w-2xl flex-col items-center gap-4 py-8">
          <div className="flex size-12 items-center justify-center rounded-full bg-accent/10 text-accent">
            <RocketLaunchIcon aria-hidden="true" className="size-6" />
          </div>
          <h3 className="text-2xl font-semibold text-foreground">Ready to try it?</h3>
          <p className="text-muted">
            Provision a workspace in under a minute. No credit card required for the trial.
          </p>
          <Button onPress={onGoToCreate}>
            Create a workspace
            <ArrowRightIcon aria-hidden="true" className="size-4" />
          </Button>
        </div>
      </Card.Content>
    </Card>
  );
}
