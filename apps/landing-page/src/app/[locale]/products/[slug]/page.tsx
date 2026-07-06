/**
 * @file page.tsx
 * @module app/[locale]/products/[slug]/page
 *
 * @description
 * Product deep page. Dynamic route with `generateStaticParams()` pre-
 * rendering every product slug for every supported locale at build time.
 * Composition:
 *
 *   - `MarketingHero`      — eyebrow, title, description, primary CTA
 *   - `FeatureGrid`        — 5–8 "What's included" tiles
 *   - `QuoteBlock`         — optional customer testimonial
 *   - `RelatedLinks`       — cross-links to adjacent products
 *   - `CtaBand`            — end-of-page conversion band
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
import { getProduct, getProductOrNotFound, getProductSlugs } from "@/lib/api";

/** Route props (Next 16 async params). */
interface ProductPageProps {
  params: Promise<{ locale: string; slug: string }>;
}

/** Pre-renders every product slug for every locale at build time. */
export async function generateStaticParams(): Promise<Array<{ locale: string; slug: string }>> {
  const slugs = await getProductSlugs();

  return LOCALES.flatMap((locale) => slugs.map((slug) => ({ locale, slug })));
}

/** Generates the tab title + OG card + canonical URL from the fixture. */
export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const product = await getProduct(slug, locale);

  if (!product) {
    return { title: "Not found", robots: { index: false } };
  }

  const canonical =
    locale === "en" ? `/products/${product.slug}` : `/${locale}/products/${product.slug}`;

  return {
    title: product.title,
    description: product.description,
    alternates: { canonical },
    openGraph: {
      title: `Academorix — ${product.title}`,
      description: product.description,
      url: canonical,
    },
  };
}

/** The product deep page. */
export default async function ProductPage({ params }: ProductPageProps): Promise<ReactNode> {
  const { locale, slug } = await params;

  setRequestLocale(locale);

  const [product, t, tCommon] = await Promise.all([
    getProductOrNotFound(slug, locale),
    getTranslations({ locale, namespace: "products" }),
    getTranslations({ locale, namespace: "common" }),
  ]);

  return (
    <MarketingShell>
      <MarketingHero
        description={product.description}
        eyebrow={product.eyebrow}
        iconKey={product.hero_icon}
        primaryCta={{ label: product.cta_label, type: product.cta_type }}
        secondaryCta={{ label: tCommon("seePricing"), type: "link", href: "/pricing" }}
        title={product.title}
      />

      <FeatureGrid
        description={t("featuresDescription")}
        heading={t("featuresHeading")}
        items={product.features}
      />

      {product.use_case ? <QuoteBlock quote={product.use_case} /> : null}

      <RelatedLinks items={product.related} />

      <CtaBand />
    </MarketingShell>
  );
}
