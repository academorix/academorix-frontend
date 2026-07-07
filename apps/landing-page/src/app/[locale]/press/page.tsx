/**
 * @file press/page.tsx
 * @module app/[locale]/press/page
 *
 * @description
 * /press page. Renders press narrative and related resources.
 */

import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";

import type { Metadata } from "next";
import type { ReactNode } from "react";

import { CtaBand } from "@/components/marketing/cta-band";
import { MarketingHero } from "@/components/marketing/marketing-hero";
import { RelatedLinks } from "@/components/marketing/related-links";
import { MarketingShell } from "@/components/shell/marketing-shell";
import { getCompanyPage } from "@/lib/api";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const page = await getCompanyPage("press", locale);

  if (!page) return {};

  return {
    title: page.title,
    description: page.description,
    alternates: { canonical: locale === "en" ? "/press" : `/${locale}/press` },
  };
}

export default async function PressPage({ params }: PageProps): Promise<ReactNode> {
  const { locale } = await params;

  setRequestLocale(locale);

  const page = await getCompanyPage("press", locale);

  if (!page) notFound();

  return (
    <MarketingShell>
      <MarketingHero
        ctaPrimary={{
          label: locale === "ar" ? "تواصل مع الإعلام" : "Contact press",
          type: "link",
          href: "mailto:press@academorix.com",
        }}
        eyebrow={page.eyebrow}
        subtitle={page.description}
        title={page.title}
      />

      <section className="mx-auto max-w-3xl space-y-6 px-6 py-16 text-base leading-relaxed text-foreground">
        {page.narrative.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </section>

      <RelatedLinks
        heading={locale === "ar" ? "استكشف أيضاً" : "Explore also"}
        items={page.related}
      />

      <CtaBand
        ctaPrimary={{
          label: locale === "ar" ? "تواصل مع الإعلام" : "Contact press",
          type: "link",
          href: "mailto:press@academorix.com",
        }}
        description={
          locale === "ar" ? "نستجيب خلال يوم عمل واحد." : "We respond within one business day."
        }
        title={locale === "ar" ? "استفسارات إعلامية" : "Media inquiries"}
      />
    </MarketingShell>
  );
}
