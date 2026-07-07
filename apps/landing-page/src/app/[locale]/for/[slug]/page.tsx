/**
 * @file for/[slug]/page.tsx
 * @module app/[locale]/for/[slug]/page
 *
 * @description
 * Persona deep-page template. Renders one persona from
 * `personas.json` with hero, "day in the life" narrative, five-feature
 * relevance grid, and related resources. Slugs map to owners, coaches,
 * guardians, front-desk, athletes, finance, platform-admins.
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
import { getPersona, getPersonaSlugs } from "@/lib/api";

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateStaticParams(): Promise<Array<{ locale: string; slug: string }>> {
  const slugs = await getPersonaSlugs();

  return slugs.flatMap((slug) => [
    { locale: "en", slug },
    { locale: "ar", slug },
  ]);
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const persona = await getPersona(slug, locale);

  if (!persona) return {};

  return {
    title: persona.title,
    description: persona.description,
    alternates: {
      canonical: locale === "en" ? `/for/${slug}` : `/${locale}/for/${slug}`,
    },
  };
}

export default async function PersonaPage({ params }: PageProps): Promise<ReactNode> {
  const { locale, slug } = await params;

  setRequestLocale(locale);

  const persona = await getPersona(slug, locale);

  if (!persona) notFound();

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
        eyebrow={persona.eyebrow}
        subtitle={persona.description}
        title={persona.title}
      />

      <section className="mx-auto max-w-3xl space-y-6 px-6 py-16 text-base leading-relaxed text-foreground">
        {persona.what_is.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16">
        <FeatureList items={persona.features} />
      </section>

      <RelatedLinks
        heading={locale === "ar" ? "استكشف أيضاً" : "Explore also"}
        items={persona.related}
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
        title={
          locale === "ar" ? `منصة تلتقي بك حيث تعمل` : `A platform that meets you where you work`
        }
      />
    </MarketingShell>
  );
}
