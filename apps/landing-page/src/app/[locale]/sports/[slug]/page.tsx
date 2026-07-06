/**
 * @file page.tsx
 * @module app/[locale]/sports/[slug]/page
 *
 * @description
 * Sport deep page. Pre-rendered from every entry in
 * `public/data/{locale}/sports.json`. Composition mirrors the product deep
 * page but uses `testimonial` (sport-specific) instead of `use_case`, and
 * has no top-level CTA in the fixture so the hero defaults to a
 * "Get started" signup intent.
 */

import { getTranslations, setRequestLocale } from "next-intl/server";

import type { Metadata } from "next";
import type { ReactNode } from "react";

import { CtaBand } from "@/components/marketing/cta-band";
import { FeatureGrid } from "@/components/marketing/feature-grid";
import { MarketingHero } from "@/components/marketing/marketing-hero";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { QuoteBlock } from "@/components/marketing/quote-block";
import { RelatedLinks } from "@/components/marketing/related-links";
import { LOCALES } from "@/i18n/routing";
import { getSport, getSportOrNotFound, getSportSlugs } from "@/lib/api";

/** Route props. */
interface SportPageProps {
  params: Promise<{ locale: string; slug: string }>;
}

/** Pre-renders every sport slug for every locale at build time. */
export async function generateStaticParams(): Promise<Array<{ locale: string; slug: string }>> {
  const slugs = await getSportSlugs();

  return LOCALES.flatMap((locale) => slugs.map((slug) => ({ locale, slug })));
}

/** Generates the tab title + OG card + canonical URL. */
export async function generateMetadata({ params }: SportPageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const sport = await getSport(slug, locale);

  if (!sport) {
    return { title: "Not found", robots: { index: false } };
  }

  const canonical = locale === "en" ? `/sports/${sport.slug}` : `/${locale}/sports/${sport.slug}`;

  return {
    title: sport.title,
    description: sport.description,
    alternates: { canonical },
    openGraph: {
      title: `Academorix — ${sport.title}`,
      description: sport.description,
      url: canonical,
    },
  };
}

/** The sport deep page. */
export default async function SportPage({ params }: SportPageProps): Promise<ReactNode> {
  const { locale, slug } = await params;

  setRequestLocale(locale);

  const [sport, t, tCommon] = await Promise.all([
    getSportOrNotFound(slug, locale),
    getTranslations({ locale, namespace: "sports" }),
    getTranslations({ locale, namespace: "common" }),
  ]);

  return (
    <MarketingShell>
      <MarketingHero
        description={sport.description}
        eyebrow={sport.eyebrow}
        iconKey={sport.hero_icon}
        primaryCta={{ label: tCommon("getStarted"), type: "signup" }}
        secondaryCta={{ label: tCommon("seePricing"), type: "link", href: "/pricing" }}
        title={sport.title}
      />

      <FeatureGrid
        description={t("featuresDescription")}
        heading={t("featuresHeading")}
        items={sport.features}
      />

      {sport.testimonial ? <QuoteBlock quote={sport.testimonial} /> : null}

      <RelatedLinks items={sport.related} />

      <CtaBand />
    </MarketingShell>
  );
}
