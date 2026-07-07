/**
 * @file solutions/[slug]/page.tsx
 * @module app/[locale]/solutions/[slug]/page
 *
 * @description
 * Solution deep-page template. Renders one solution from
 * `solutions.json` with hero, long-form narrative, feature grid,
 * and related links.
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
import { getSolution, getSolutionSlugs } from "@/lib/api";

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateStaticParams(): Promise<Array<{ locale: string; slug: string }>> {
  const slugs = await getSolutionSlugs();

  return slugs.flatMap((slug) => [
    { locale: "en", slug },
    { locale: "ar", slug },
  ]);
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const solution = await getSolution(slug, locale);

  if (!solution) return {};

  return {
    title: solution.title,
    description: solution.description,
    alternates: {
      canonical: locale === "en" ? `/solutions/${slug}` : `/${locale}/solutions/${slug}`,
    },
  };
}

export default async function SolutionPage({ params }: PageProps): Promise<ReactNode> {
  const { locale, slug } = await params;

  setRequestLocale(locale);

  const solution = await getSolution(slug, locale);

  if (!solution) notFound();

  return (
    <MarketingShell>
      <MarketingHero
        ctaPrimary={{
          label: locale === "ar" ? "ابدأ الآن" : "Get started",
          type: "signup",
        }}
        ctaSecondary={{
          label: locale === "ar" ? "تحدث مع المبيعات" : "Talk to sales",
          type: "contact_sales",
        }}
        eyebrow={solution.eyebrow}
        subtitle={solution.description}
        title={solution.title}
      />

      <section className="mx-auto max-w-3xl space-y-6 px-6 py-16 text-base leading-relaxed text-foreground">
        {solution.what_is.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16">
        <FeatureList items={solution.features} />
      </section>

      <RelatedLinks
        heading={locale === "ar" ? "استكشف أيضاً" : "Explore also"}
        items={solution.related}
      />

      <CtaBand
        ctaPrimary={{
          label: locale === "ar" ? "ابدأ الآن" : "Get started",
          type: "signup",
        }}
        description={
          locale === "ar"
            ? "أنشئ مساحة عملك في دقائق. لا حاجة إلى بطاقة ائتمان."
            : "Create your workspace in minutes. No credit card required."
        }
        title={locale === "ar" ? `اختبر ${solution.title} اليوم` : `Try ${solution.title} today`}
      />
    </MarketingShell>
  );
}
