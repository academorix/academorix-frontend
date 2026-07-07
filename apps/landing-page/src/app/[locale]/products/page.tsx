/**
 * @file products/page.tsx
 * @module app/[locale]/products/page
 *
 * @description
 * Products index. Grid of every product deep-page in the catalog.
 * Reads from `products.json` and renders a bento-style feature grid
 * pointing to each `/products/[slug]` route.
 */

import { setRequestLocale } from "next-intl/server";

import type { Metadata } from "next";
import type { ReactNode } from "react";

import { FeatureBento } from "@/components/marketing/feature-bento";
import { MarketingHero } from "@/components/marketing/marketing-hero";
import { MarketingShell } from "@/components/shell/marketing-shell";
import { getProducts } from "@/lib/api";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;

  return {
    title: locale === "ar" ? "المنتجات" : "Products",
    alternates: { canonical: locale === "en" ? "/products" : `/${locale}/products` },
  };
}

export default async function ProductsIndexPage({ params }: PageProps): Promise<ReactNode> {
  const { locale } = await params;

  setRequestLocale(locale);

  const products = await getProducts(locale);

  const tiles = products.map((p) => ({
    slug: p.slug,
    icon: p.hero_icon,
    title: p.title,
    description: p.description,
    href: `/products/${p.slug}`,
  }));

  return (
    <MarketingShell>
      <MarketingHero
        eyebrow={locale === "ar" ? "المنتجات" : "Products"}
        subtitle={
          locale === "ar"
            ? "كل قدرة تندمج في مساحة العمل نفسها."
            : "Every capability plugs into the same tenant workspace."
        }
        title={
          locale === "ar"
            ? "كل ما تحتاجه أكاديميتك، في منصة واحدة"
            : "Everything your academy needs, in one platform"
        }
      />
      <section className="mx-auto max-w-7xl px-6 pb-24">
        <FeatureBento items={tiles} />
      </section>
    </MarketingShell>
  );
}
