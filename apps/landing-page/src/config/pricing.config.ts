/**
 * @file pricing.config.ts
 * @module config/pricing.config
 *
 * @description
 * Structural pricing metadata — plan keys, canonical ordering, default
 * billing cadence + currency, and a Product-schema JSON-LD builder.
 * The per-plan COPY (label, description, highlights, prices) lives in
 * `public/data/{locale}/plans.json` so translations can ship
 * independently of code changes.
 *
 * ## What NOT to put here
 *
 * Anything that changes per-locale (visible plan names, feature
 * highlights, CTA labels) belongs in `plans.json`. Anything that
 * needs a network round-trip (live catalog fetch, currency
 * conversion) belongs in a runtime hook, not this build-time config.
 */

import type { BillingPeriod, PlanKey, PlanTierData } from "@/lib/types";

/** Canonical plan-key ordering across every pricing surface. */
export const PLAN_KEYS = ["starter", "growth", "pro", "enterprise"] as const;

/** Billing periods the pricing page renders a toggle for. */
export const BILLING_PERIODS = ["monthly", "yearly"] as const;

/** Default currency displayed when a fixture entry doesn't override it. */
export const DEFAULT_CURRENCY = "USD";

/**
 * How many months of savings the "annual" toggle advertises. Kept as
 * a constant so the badge next to the toggle stays in sync with the
 * actual per-plan prices in `plans.json` (starter/growth/pro all
 * price annual at 12× monthly minus this discount).
 */
export const ANNUAL_MONTHS_FREE = 2;

/** Structural pricing config exposed to page + section code. */
export const pricing = {
  planKeys: PLAN_KEYS,
  billingPeriods: BILLING_PERIODS,
  defaultCurrency: DEFAULT_CURRENCY,
  defaultBillingPeriod: "monthly" as BillingPeriod,
  annualMonthsFree: ANNUAL_MONTHS_FREE,

  /**
   * Which plan key gets the "Most popular" chip. Kept here so
   * marketing can flip the highlight without editing the fixtures.
   */
  popularPlan: "growth" as PlanKey,

  /**
   * Plan keys that render the "Contact sales" variant of the CTA and
   * hide numeric amounts. Enterprise is the only such tier today.
   */
  contactSalesPlans: ["enterprise"] as readonly PlanKey[],
} as const;

/**
 * Title-cases a plan key ("growth" → "Growth") for use in JSON-LD
 * product names.
 */
function titleCasePlanKey(key: PlanKey): string {
  return key.charAt(0).toUpperCase() + key.slice(1);
}

/**
 * Builds a `schema.org` Product / Offer node for a single plan tier.
 * Emitted by `/pricing` inside a `<script type="application/ld+json">`
 * so search engines can surface pricing in rich results.
 *
 * @param plan - Fully-resolved plan tier from `plans.json`.
 * @param baseUrl - Canonical marketing origin (no trailing slash).
 */
export function buildPlanJsonLd(plan: PlanTierData, baseUrl: string): Record<string, unknown> {
  const offers = plan.prices
    .filter((price) => price.amount !== "custom")
    .map((price) => ({
      "@type": "Offer",
      price: price.amount,
      priceCurrency: price.currency,
      availability: "https://schema.org/InStock",
      url: `${baseUrl}/pricing`,
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        price: price.amount,
        priceCurrency: price.currency,
        billingIncrement: price.billing_period === "yearly" ? 12 : 1,
        unitCode: "MON",
      },
    }));

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `Academorix ${titleCasePlanKey(plan.key)}`,
    description: plan.description,
    brand: { "@type": "Brand", name: "Academorix" },
    // JSON-LD accepts either a single Offer or an array; keep it
    // consistent so consumers don't branch on shape.
    offers: offers.length === 1 ? offers[0] : offers,
  };
}
