/**
 * @file plan-tiers.tsx
 * @module components/marketing/plan-tiers
 *
 * @description
 * Four-column pricing tier grid. Growth is marked "Popular" via a
 * chip in the header. Each tier shows monthly + yearly prices,
 * highlights, and a plan-scoped CTA. Enterprise renders "Custom"
 * where the amount would normally sit.
 */

import clsx from "clsx";
import { getLocale } from "next-intl/server";

import { CtaButton } from "./cta-button";

import type { Localized, PlanTierData } from "@/lib/types";

import { LOCALE_BCP47_TAGS } from "@/config/i18n.config";

/** Props for {@link PlanTiers}. */
export interface PlanTiersProps {
  /** Ordered array of plans (starter → enterprise). */
  plans: readonly Localized<PlanTierData>[];
  /** Which billing period to render prices for. */
  billingPeriod?: "monthly" | "yearly";
  /** Extra classes. */
  className?: string;
}

/** Format the monthly-equivalent price for a plan. */
function formatPrice(plan: Localized<PlanTierData>, period: "monthly" | "yearly", locale: string) {
  const match = plan.prices.find((p) => p.billing_period === period);

  if (!match) return null;
  if (match.amount === "custom") return { display: "Custom", suffix: "" };
  const value = Number(match.amount);

  if (Number.isNaN(value)) return null;
  const monthlyEquivalent = period === "yearly" ? value / 12 : value;
  const tag = LOCALE_BCP47_TAGS[locale as keyof typeof LOCALE_BCP47_TAGS] ?? locale;
  const display = new Intl.NumberFormat(tag, {
    style: "currency",
    currency: match.currency,
    maximumFractionDigits: 0,
  }).format(monthlyEquivalent);

  return { display, suffix: period === "yearly" ? "/mo (billed yearly)" : "/mo" };
}

/** Four-column pricing tier grid. */
export async function PlanTiers({ plans, billingPeriod = "monthly", className }: PlanTiersProps) {
  const locale = await getLocale();

  return (
    <ul className={clsx("grid grid-cols-1 gap-4 lg:grid-cols-4", className)}>
      {plans.map((plan) => {
        const price = formatPrice(plan, billingPeriod, locale);
        const popular = plan.is_popular;

        return (
          <li
            key={plan.key}
            className={clsx(
              "flex flex-col gap-6 rounded-2xl border p-6 backdrop-blur-md",
              popular ? "border-accent/60 bg-accent/5" : "border-default/40 bg-surface/60",
            )}
          >
            <header className="flex items-start justify-between gap-3">
              <span className="text-xs font-semibold tracking-wider text-muted uppercase">
                {plan.eyebrow}
              </span>
              {popular ? (
                <span className="inline-flex items-center rounded-full bg-accent px-2.5 py-0.5 text-[10px] font-medium tracking-wider text-accent-foreground uppercase">
                  Popular
                </span>
              ) : null}
            </header>

            <div className="flex flex-col gap-2">
              <p className="text-4xl font-semibold tracking-tight text-foreground tabular-nums">
                {price?.display ?? "—"}
              </p>
              <p className="text-xs text-muted">{price?.suffix}</p>
            </div>

            <p className="text-sm leading-relaxed text-muted">{plan.description}</p>

            <ul className="flex flex-col gap-2 text-sm">
              {plan.highlights.map((h, i) => (
                <li key={i} className="flex items-start gap-2 text-foreground">
                  <span
                    aria-hidden
                    className="mt-1 inline-flex size-1.5 shrink-0 rounded-full bg-accent"
                  />
                  <span>{h}</span>
                </li>
              ))}
            </ul>

            <div className="mt-auto pt-2">
              <CtaButton
                className="w-full"
                cta={{ label: plan.cta.label, type: plan.cta.type }}
                variant={popular ? "primary" : "ghost"}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
