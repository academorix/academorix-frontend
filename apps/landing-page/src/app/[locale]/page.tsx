/**
 * @file page.tsx
 * @module app/[locale]/page
 *
 * @description
 * The landing page (`/` for English, `/ar` for Arabic). Server Component
 * composition of section subcomponents from `components/landing/`. Reads
 * the locale from the route params and calls `setRequestLocale` so
 * downstream Server Components can call `getLocale()` / `getTranslations()`
 * without touching the URL again.
 *
 * The `<MarketingShell />` wrapper renders the `<LandingHeader />` +
 * `<FooterSection />` chrome, resolving nav + site data from
 * `public/data/{locale}/*.json` at build time.
 *
 * Interactive sections are marked `"use client"` at the section-file
 * boundary so the majority of the page still ships as static HTML.
 */

import { setRequestLocale } from "next-intl/server";

import type { Metadata } from "next";
import type { ReactNode } from "react";

import { CtaSection } from "@/components/landing/cta-section";
import { FeaturesSection } from "@/components/landing/features-section";
import { HeroSection } from "@/components/landing/hero-section";
import { HowItWorksSection } from "@/components/landing/how-it-works-section";
import { LogoStrip } from "@/components/landing/logo-strip";
import { PricingSection } from "@/components/landing/pricing-section";
import { SportsSection } from "@/components/landing/sports-section";
import { TestimonialsSection } from "@/components/landing/testimonials-section";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { getPlans, getSite } from "@/lib/api";

/** Props for {@link HomePage}. */
interface HomePageProps {
  params: Promise<{ locale: string }>;
}

/**
 * Generates metadata for the landing route. Overrides the layout's default
 * `title.template` with an `absolute` value so `/` doesn't get the
 * `%s | Academorix` suffix.
 */
export async function generateMetadata({ params }: HomePageProps): Promise<Metadata> {
  const { locale } = await params;
  const site = await getSite(locale);

  return {
    title: { absolute: `${site.name} — ${site.tagline}` },
    description: site.description,
    alternates: { canonical: locale === "en" ? "/" : `/${locale}` },
  };
}

/** The landing home page. */
export default async function HomePage({ params }: HomePageProps): Promise<ReactNode> {
  const { locale } = await params;

  setRequestLocale(locale);

  const [site, plans] = await Promise.all([getSite(locale), getPlans(locale)]);

  return (
    <MarketingShell>
      <div id="top">
        <HeroSection site={site} />
        <LogoStrip />
        <FeaturesSection />
        <SportsSection />
        <HowItWorksSection />
        <PricingSection plans={plans} />
        <TestimonialsSection />
        <CtaSection site={site} />
      </div>
    </MarketingShell>
  );
}
