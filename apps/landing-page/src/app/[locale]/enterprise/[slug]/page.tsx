/**
 * @file enterprise/[slug]/page.tsx
 * @module app/[locale]/enterprise/[slug]/page
 *
 * @description
 * Enterprise deep-page template. Renders one enterprise page from
 * `enterprise.json` with hero, feature grid, and related links.
 */

import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";

import type { Metadata } from "next";
import type { ReactNode } from "react";

import { CtaBand } from "@/components/marketing/cta-band";
import { FeatureList } from "@/components/marketing/feature-list";
import { MarketingHero } from "@/components/marketing/marketing-hero";
import { RelatedLinks } from "@/components/marketing/related-links";
import { MarketingShell } from "@/components/shell/marketing-shell";
import { getEnterprisePage, getEnterpriseSlugs } from "@/lib/api";

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateStaticParams(): Promise<Array<{ locale: string; slug: string }>> {
  const slugs = await getEnterpriseSlugs();

  return slugs.flatMap((slug) => [
    { locale: "en", slug },
    { locale: "ar", slug },
  ]);
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const page = await getEnterprisePage(slug, locale);

  if (!page) return {};

  return {
    title: page.title,
    description: page.description,
    alternates: {
      canonical: locale === "en" ? `/enterprise/${slug}` : `/${locale}/enterprise/${slug}`,
    },
  };
}

export default async function EnterprisePage({ params }: PageProps): Promise<ReactNode> {
  const { locale, slug } = await params;

  setRequestLocale(locale);

  const page = await getEnterprisePage(slug, locale);

  if (!page) notFound();

  return (
    <MarketingShell>
      <MarketingHero
        ctaPrimary={{
          label: locale === "ar" ? "تحدث مع المبيعات" : "Talk to sales",
          type: "contact_sales",
        }}
        eyebrow={page.eyebrow}
        subtitle={page.description}
        title={page.title}
      />

      <section className="mx-auto max-w-7xl px-6 py-16">
        <FeatureList items={page.features} />
      </section>

      <RelatedLinks
        heading={locale === "ar" ? "استكشف أيضاً" : "Explore also"}
        items={page.related}
      />

      <CtaBand
        ctaPrimary={{
          label: locale === "ar" ? "تحدث مع المبيعات" : "Talk to sales",
          type: "contact_sales",
        }}
        description={
          locale === "ar"
            ? "فريقنا يجيب على أسئلة الأمن والامتثال والترحيل خلال يوم عمل."
            : "Our team answers security, compliance, and migration questions within a business day."
        }
        title={locale === "ar" ? "لديك أسئلة عن التفعيل؟" : "Have questions about rollout?"}
      />
    </MarketingShell>
  );
}
