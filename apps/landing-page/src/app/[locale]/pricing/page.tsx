/**
 * @file pricing/page.tsx
 * @module app/[locale]/pricing/page
 *
 * @description
 * The /pricing route. Renders the hero, plan tier grid, spotlight
 * cards, comparison matrix, and FAQ from `plans.json`,
 * `pricing-highlights.json`, `pricing-compare.json`, and
 * `faq.json`.
 */

import { setRequestLocale } from "next-intl/server";

import type { Metadata } from "next";
import type { ReactNode } from "react";

import { CtaBand } from "@/components/marketing/cta-band";
import { FaqAccordion } from "@/components/marketing/faq-accordion";
import { MarketingHero } from "@/components/marketing/marketing-hero";
import { PlanTiers } from "@/components/marketing/plan-tiers";
import { PricingHighlights } from "@/components/marketing/pricing-highlights";
import { PricingMatrix } from "@/components/marketing/pricing-matrix";
import { SectionHeading } from "@/components/marketing/section-heading";
import { MarketingShell } from "@/components/shell/marketing-shell";
import { getFaq, getPlans, getPricingCompare, getPricingHighlights, getSite } from "@/lib/api";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const site = await getSite(locale);

  return {
    title: locale === "ar" ? "الأسعار" : "Pricing",
    description: site.description,
    alternates: { canonical: locale === "en" ? "/pricing" : `/${locale}/pricing` },
  };
}

export default async function PricingPage({ params }: PageProps): Promise<ReactNode> {
  const { locale } = await params;

  setRequestLocale(locale);

  const [plans, highlights, sections, faq] = await Promise.all([
    getPlans(locale),
    getPricingHighlights(locale),
    getPricingCompare(locale),
    getFaq(locale),
  ]);

  const heroTitle = locale === "ar" ? "أسعار بسيطة وقابلة للتوسع" : "Simple, scalable pricing";
  const heroSubtitle =
    locale === "ar"
      ? "خطط واضحة تتوسع مع أكاديميتك. لا رسوم خفية ولا مفاجآت عند التجديد."
      : "Straightforward plans that scale with your academy. No hidden fees, no surprise increases at renewal.";
  const heroEyebrow = locale === "ar" ? "الأسعار" : "Pricing";
  const compareEyebrow = locale === "ar" ? "المقارنة" : "Compare plans";
  const compareTitle =
    locale === "ar" ? "قارن كل شيء عبر الخطط" : "Compare every capability across plans";
  const compareDescription =
    locale === "ar"
      ? "كل ميزة، كل حد، كل سعر تجاوز في مكان واحد."
      : "Every feature, every limit, every overage price in one place.";
  const faqEyebrow = locale === "ar" ? "الأسئلة الشائعة" : "FAQ";
  const faqTitle = locale === "ar" ? "أسئلة نسمعها كثيراً" : "Questions we hear the most";

  return (
    <MarketingShell>
      <MarketingHero eyebrow={heroEyebrow} subtitle={heroSubtitle} title={heroTitle} />

      <section className="mx-auto max-w-7xl px-6 py-8" id="plans">
        <PlanTiers plans={plans} />
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16" id="highlights">
        <PricingHighlights items={highlights} />
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16" id="compare">
        <SectionHeading
          className="mb-12"
          description={compareDescription}
          eyebrow={compareEyebrow}
          title={compareTitle}
        />
        <PricingMatrix plans={plans} sections={sections} />
      </section>

      <section className="mx-auto max-w-4xl px-6 py-24" id="faq">
        <SectionHeading className="mb-12" eyebrow={faqEyebrow} title={faqTitle} />
        <FaqAccordion items={faq} />
      </section>

      <CtaBand
        ctaPrimary={{
          label: locale === "ar" ? "ابدأ الآن" : "Get started",
          type: "signup",
        }}
        ctaSecondary={{
          label: locale === "ar" ? "تحدث مع المبيعات" : "Talk to sales",
          type: "contact_sales",
        }}
        description={
          locale === "ar"
            ? "أنشئ مساحة عملك في دقائق. لا حاجة إلى بطاقة ائتمان."
            : "Create your workspace in minutes. No credit card required."
        }
        title={locale === "ar" ? "جاهز للانطلاق؟" : "Ready to run your academy the modern way?"}
      />
    </MarketingShell>
  );
}
