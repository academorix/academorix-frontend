/**
 * @file page.tsx
 * @module app/[locale]/enterprise/[slug]/page
 *
 * @description
 * Enterprise deep page. Pre-rendered from every entry in
 * `public/data/{locale}/enterprise.json`. Same composition as the product
 * deep page but with a "Talk to sales" primary CTA (enterprise routes
 * never point anonymous visitors at the self-serve signup flow) and no
 * customer quote.
 */

import { getTranslations, setRequestLocale } from "next-intl/server";

import type { Metadata } from "next";
import type { ReactNode } from "react";

import { CtaBand } from "@/components/marketing/cta-band";
import { FeatureGrid } from "@/components/marketing/feature-grid";
import { MarketingHero } from "@/components/marketing/marketing-hero";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { RelatedLinks } from "@/components/marketing/related-links";
import { LOCALES } from "@/i18n/routing";
import { getEnterprise, getEnterpriseOrNotFound, getEnterpriseSlugs } from "@/lib/api";

/** Route props. */
interface EnterprisePageProps {
  params: Promise<{ locale: string; slug: string }>;
}

/** Pre-renders every enterprise slug for every locale. */
export async function generateStaticParams(): Promise<Array<{ locale: string; slug: string }>> {
  const slugs = await getEnterpriseSlugs();

  return LOCALES.flatMap((locale) => slugs.map((slug) => ({ locale, slug })));
}

/** Generates the tab title + OG card + canonical URL. */
export async function generateMetadata({ params }: EnterprisePageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const page = await getEnterprise(slug, locale);

  if (!page) {
    return { title: "Not found", robots: { index: false } };
  }

  const canonical =
    locale === "en" ? `/enterprise/${page.slug}` : `/${locale}/enterprise/${page.slug}`;

  return {
    title: page.title,
    description: page.description,
    alternates: { canonical },
    openGraph: {
      title: `Academorix — ${page.title}`,
      description: page.description,
      url: canonical,
    },
  };
}

/** The enterprise deep page. */
export default async function EnterprisePage({ params }: EnterprisePageProps): Promise<ReactNode> {
  const { locale, slug } = await params;

  setRequestLocale(locale);

  const [page, t, tCommon] = await Promise.all([
    getEnterpriseOrNotFound(slug, locale),
    getTranslations({ locale, namespace: "enterprise" }),
    getTranslations({ locale, namespace: "common" }),
  ]);

  return (
    <MarketingShell>
      <MarketingHero
        description={page.description}
        eyebrow={page.eyebrow}
        iconKey={page.hero_icon}
        primaryCta={{ label: tCommon("talkToSales"), type: "contact_sales" }}
        secondaryCta={{ label: tCommon("seePricing"), type: "link", href: "/pricing" }}
        title={page.title}
      />

      <FeatureGrid
        description={t("featuresDescription")}
        heading={t("featuresHeading")}
        items={page.features}
      />

      <RelatedLinks items={page.related} />

      <CtaBand description={t("ctaDescription")} heading={t("ctaHeading")} />
    </MarketingShell>
  );
}
