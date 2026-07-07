/**
 * @file page.tsx
 * @module app/[locale]/page
 *
 * @description
 * The landing page (`/` for English, `/ar` for Arabic). Server
 * Component composition of the marketing sections declared in
 * `home.json`. Reads the locale from the route params and calls
 * `setRequestLocale` so downstream Server Components can call
 * `getTranslations()` without touching the URL again.
 *
 * The `<MarketingShell />` wrapper renders the `<LandingHeader />` +
 * `<FooterSection />` chrome. Interactive sections mark themselves
 * `"use client"` at their own file boundary so the majority of the
 * page still ships as static HTML.
 */

import { setRequestLocale } from "next-intl/server";

import type { Metadata } from "next";
import type { ReactNode } from "react";

import { CtaBand } from "@/components/marketing/cta-band";
import { FaqAccordion } from "@/components/marketing/faq-accordion";
import { FeatureBento } from "@/components/marketing/feature-bento";
import { KpiBand } from "@/components/marketing/kpi-band";
import { LogoStrip } from "@/components/marketing/logo-strip";
import { MarketingHero } from "@/components/marketing/marketing-hero";
import { PersonaCards } from "@/components/marketing/persona-cards";
import { PlanTiers } from "@/components/marketing/plan-tiers";
import { SectionHeading } from "@/components/marketing/section-heading";
import { TestimonialsGrid } from "@/components/marketing/testimonials-grid";
import { TimelineSteps } from "@/components/marketing/timeline-steps";
import { MarketingShell } from "@/components/shell/marketing-shell";
import { getHome, getPlans, getSite } from "@/lib/api";

/** Props for {@link HomePage}. */
interface HomePageProps {
  params: Promise<{ locale: string }>;
}

/** Generates metadata for the landing route. */
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

  const [home, plans] = await Promise.all([getHome(locale), getPlans(locale)]);

  return (
    <MarketingShell>
      <MarketingHero
        ctaPrimary={{
          label: home.hero.cta_primary.label,
          type: home.hero.cta_primary.type,
          href: home.hero.cta_primary.href,
        }}
        ctaSecondary={{
          label: home.hero.cta_secondary.label,
          type: home.hero.cta_secondary.type,
          href: home.hero.cta_secondary.href,
        }}
        eyebrow={home.hero.eyebrow}
        subtitle={home.hero.subtitle}
        title={home.hero.title}
        trustLine={home.hero.trust_line}
      />

      <KpiBand items={home.kpi} />

      <LogoStrip data={home.logos} />

      <section className="mx-auto max-w-7xl px-6 py-24" id="products">
        <SectionHeading
          className="mb-12"
          description={home.products_bento.description}
          eyebrow={home.products_bento.eyebrow}
          title={home.products_bento.title}
        />
        <FeatureBento items={home.products_bento.items} />
      </section>

      <section className="mx-auto max-w-7xl px-6 py-24" id="sports">
        <SectionHeading
          className="mb-12"
          description={home.sports_bento.description}
          eyebrow={home.sports_bento.eyebrow}
          title={home.sports_bento.title}
        />
        <FeatureBento items={home.sports_bento.items} />
        <p className="mt-8 text-center text-sm text-muted">{home.sports_bento.footnote}</p>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-24">
        <SectionHeading
          className="mb-12"
          description={home.how_it_works.description}
          eyebrow={home.how_it_works.eyebrow}
          title={home.how_it_works.title}
        />
        <TimelineSteps items={home.how_it_works.steps} />
      </section>

      <section className="mx-auto max-w-7xl px-6 py-24">
        <SectionHeading
          className="mb-12"
          description={home.personas.description}
          eyebrow={home.personas.eyebrow}
          title={home.personas.title}
        />
        <PersonaCards items={home.personas.items} />
      </section>

      <section className="mx-auto max-w-7xl px-6 py-24">
        <SectionHeading
          className="mb-12"
          eyebrow={home.testimonials.eyebrow}
          title={home.testimonials.title}
        />
        <TestimonialsGrid items={home.testimonials.items} />
      </section>

      <section className="mx-auto max-w-7xl px-6 py-24" id="pricing">
        <SectionHeading
          className="mb-12"
          description={home.pricing_preview.description}
          eyebrow={home.pricing_preview.eyebrow}
          title={home.pricing_preview.title}
        />
        <PlanTiers plans={plans} />
      </section>

      <CtaBand
        ctaPrimary={{
          label: home.cta_band.cta_primary.label,
          type: home.cta_band.cta_primary.type,
          href: home.cta_band.cta_primary.href,
        }}
        ctaSecondary={{
          label: home.cta_band.cta_secondary.label,
          type: home.cta_band.cta_secondary.type,
          href: home.cta_band.cta_secondary.href,
        }}
        description={home.cta_band.description}
        title={home.cta_band.title}
      />

      <section className="mx-auto max-w-4xl px-6 py-24" id="faq">
        <SectionHeading
          className="mb-12"
          description={home.faq.description}
          eyebrow={home.faq.eyebrow}
          title={home.faq.title}
        />
        <FaqAccordion items={home.faq.items} />
      </section>
    </MarketingShell>
  );
}
