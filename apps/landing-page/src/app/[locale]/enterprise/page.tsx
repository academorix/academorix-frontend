/**
 * @file enterprise/page.tsx
 * @module app/[locale]/enterprise/page
 *
 * @description
 * Enterprise index. Grid of enterprise deep pages
 * (security, onboarding, contracts, compliance, migration, multi-branch).
 */

import { setRequestLocale } from "next-intl/server";

import type { Metadata } from "next";
import type { ReactNode } from "react";

import { FeatureBento } from "@/components/marketing/feature-bento";
import { MarketingHero } from "@/components/marketing/marketing-hero";
import { MarketingShell } from "@/components/shell/marketing-shell";
import { getEnterprisePages } from "@/lib/api";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;

  return {
    title: locale === "ar" ? "المؤسسات" : "Enterprise",
    alternates: { canonical: locale === "en" ? "/enterprise" : `/${locale}/enterprise` },
  };
}

export default async function EnterpriseIndexPage({ params }: PageProps): Promise<ReactNode> {
  const { locale } = await params;

  setRequestLocale(locale);

  const pages = await getEnterprisePages(locale);

  const tiles = pages.map((p) => ({
    slug: p.slug,
    icon: p.hero_icon,
    title: p.title,
    description: p.description,
    href: `/enterprise/${p.slug}`,
  }));

  return (
    <MarketingShell>
      <MarketingHero
        ctaPrimary={{
          label: locale === "ar" ? "تحدث مع المبيعات" : "Talk to sales",
          type: "contact_sales",
        }}
        eyebrow={locale === "ar" ? "المؤسسات" : "Enterprise"}
        subtitle={
          locale === "ar"
            ? "أمان وامتثال وترحيل وتشغيل موازٍ. كل ما يحتاجه فريقك ليقول نعم."
            : "Security, compliance, migration, and parallel runs. Everything your team needs to say yes."
        }
        title={
          locale === "ar" ? "منصة جاهزة للمؤسسات، من اليوم الأول" : "Enterprise-ready from day one"
        }
      />
      <section className="mx-auto max-w-7xl px-6 pb-24">
        <FeatureBento items={tiles} />
      </section>
    </MarketingShell>
  );
}
