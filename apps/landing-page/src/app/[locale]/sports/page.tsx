/**
 * @file sports/page.tsx
 * @module app/[locale]/sports/page
 *
 * @description
 * Sports index. Bento grid of every sport — supported sports render
 * as first-class tiles, coming-soon sports carry a badge.
 */

import { setRequestLocale } from "next-intl/server";

import type { Metadata } from "next";
import type { ReactNode } from "react";

import { FeatureBento } from "@/components/marketing/feature-bento";
import { MarketingHero } from "@/components/marketing/marketing-hero";
import { MarketingShell } from "@/components/shell/marketing-shell";
import { getSports } from "@/lib/api";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;

  return {
    title: locale === "ar" ? "الرياضات" : "Sports",
    alternates: { canonical: locale === "en" ? "/sports" : `/${locale}/sports` },
  };
}

export default async function SportsIndexPage({ params }: PageProps): Promise<ReactNode> {
  const { locale } = await params;

  setRequestLocale(locale);

  const sports = await getSports(locale);

  const tiles = sports.map((s) => ({
    slug: s.slug,
    icon: s.hero_icon,
    title: s.title,
    description: s.description,
    href: `/sports/${s.slug}`,
    is_supported: s.is_supported,
    badge: s.is_supported ? undefined : locale === "ar" ? "قريباً" : "Coming soon",
  }));

  return (
    <MarketingShell>
      <MarketingHero
        eyebrow={locale === "ar" ? "الرياضات" : "Sports"}
        subtitle={
          locale === "ar"
            ? "منصة واحدة، تخصصات كثيرة. كل رياضة تأتي بمجموعات سماتها وسير عملها."
            : "One platform, many disciplines. Every sport ships with its own attribute sets and workflows."
        }
        title={
          locale === "ar"
            ? "مبنية لكل رياضة، رياضة بعد رياضة"
            : "Built for every sport, sport by sport"
        }
      />
      <section className="mx-auto max-w-7xl px-6 pb-24">
        <FeatureBento items={tiles} />
      </section>
    </MarketingShell>
  );
}
