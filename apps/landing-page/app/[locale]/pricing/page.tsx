/**
 * @file page.tsx
 * @module app/[locale]/pricing/page
 *
 * @description
 * The `/pricing` route (localised — `/ar/pricing` in Arabic). A Vercel-
 * parity composition rendered as a Server Component so every plan /
 * highlight / matrix cell / FAQ answer resolves from
 * `public/data/{locale}/*.json` at build time.
 *
 * ## Section layout
 *
 *   1. `PricingHero` — big heading + billing-period toggle + 4 plan cards.
 *   2. `PricingHighlights` — spotlight cards ("No idle, no waste" +
 *      "Control your spending").
 *   3. `PricingMatrix` — sticky-header comparison matrix.
 *   4. `FaqSection` — numbered accordion FAQ.
 *   5. `PricingBottomCta` — "Can't decide?" conversion band.
 */

import { getTranslations, setRequestLocale } from "next-intl/server";

import type { Metadata } from "next";
import type { ReactNode } from "react";

import { MarketingShell } from "@/components/marketing/marketing-shell";
import { FaqSection } from "@/components/pricing/faq-section";
import { PricingBottomCta } from "@/components/pricing/pricing-bottom-cta";
import { PricingHero } from "@/components/pricing/pricing-hero";
import { PricingHighlights } from "@/components/pricing/pricing-highlights";
import { PricingMatrix } from "@/components/pricing/pricing-matrix";
import { getFaq, getPlans, getPricingCompare, getPricingHighlights } from "@/lib/api";

/** Props for {@link PricingPage}. */
interface PricingPageProps {
  params: Promise<{ locale: string }>;
}

/** Per-page metadata (localised). */
export async function generateMetadata({ params }: PricingPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "pricing.meta" });

  return {
    title: t("title"),
    description: t("description"),
    alternates: { canonical: locale === "en" ? "/pricing" : `/${locale}/pricing` },
    openGraph: {
      title: t("title"),
      description: t("description"),
      url: locale === "en" ? "/pricing" : `/${locale}/pricing`,
    },
  };
}

/** The pricing page. */
export default async function PricingPage({ params }: PricingPageProps): Promise<ReactNode> {
  const { locale } = await params;

  setRequestLocale(locale);

  const [plans, highlights, compare, faq] = await Promise.all([
    getPlans(locale),
    getPricingHighlights(locale),
    getPricingCompare(locale),
    getFaq(locale),
  ]);

  return (
    <MarketingShell>
      <PricingHero plans={plans} />
      <PricingHighlights highlights={highlights} />
      <PricingMatrix plans={plans} sections={compare} />
      <FaqSection items={faq} />
      <PricingBottomCta />
    </MarketingShell>
  );
}
