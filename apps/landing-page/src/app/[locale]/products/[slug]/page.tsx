/**
 * @file products/[slug]/page.tsx
 * @module app/[locale]/products/[slug]/page
 *
 * @description
 * Product deep-page template. Renders one product from
 * `products.json` with hero, feature grid, optional customer
 * quote, and related links. Feeds `generateStaticParams` from the
 * catalog so every product is pre-rendered at build time.
 */

import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";

import type { Metadata } from "next";
import type { ReactNode } from "react";

import { CtaBand } from "@/components/marketing/cta-band";
import { FeatureList } from "@/components/marketing/feature-list";
import { MarketingHero } from "@/components/marketing/marketing-hero";
import { QuoteBlock } from "@/components/marketing/quote-block";
import { RelatedLinks } from "@/components/marketing/related-links";
import { MarketingShell } from "@/components/shell/marketing-shell";
import { getProduct, getProductSlugs } from "@/lib/api";

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateStaticParams(): Promise<Array<{ locale: string; slug: string }>> {
  const slugs = await getProductSlugs();

  return slugs.flatMap((slug) => [
    { locale: "en", slug },
    { locale: "ar", slug },
  ]);
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const product = await getProduct(slug, locale);

  if (!product) return {};

  return {
    title: product.title,
    description: product.description,
    alternates: {
      canonical: locale === "en" ? `/products/${slug}` : `/${locale}/products/${slug}`,
    },
  };
}

export default async function ProductPage({ params }: PageProps): Promise<ReactNode> {
  const { locale, slug } = await params;

  setRequestLocale(locale);

  const product = await getProduct(slug, locale);

  if (!product) notFound();

  return (
    <MarketingShell>
      <MarketingHero
        ctaPrimary={{ label: product.cta_label, type: product.cta_type }}
        ctaSecondary={{
          label: locale === "ar" ? "تحدث مع المبيعات" : "Talk to sales",
          type: "contact_sales",
        }}
        eyebrow={product.eyebrow}
        subtitle={product.description}
        title={product.title}
      />

      <section className="mx-auto max-w-7xl px-6 py-16">
        <FeatureList items={product.features} />
      </section>

      {product.use_case ? (
        <section className="mx-auto max-w-7xl px-6 py-16">
          <QuoteBlock quote={product.use_case} />
        </section>
      ) : null}

      <RelatedLinks
        heading={locale === "ar" ? "قد يهمك أيضاً" : "You might also like"}
        items={product.related}
      />

      <CtaBand
        ctaPrimary={{ label: product.cta_label, type: product.cta_type }}
        ctaSecondary={{
          label: locale === "ar" ? "تحدث مع المبيعات" : "Talk to sales",
          type: "contact_sales",
        }}
        description={
          locale === "ar"
            ? "أنشئ مساحة عملك في دقائق. لا حاجة إلى بطاقة ائتمان."
            : "Create your workspace in minutes. No credit card required."
        }
        title={
          locale === "ar"
            ? `ابدأ استخدام ${product.title} اليوم`
            : `Start using ${product.title} today`
        }
      />
    </MarketingShell>
  );
}
