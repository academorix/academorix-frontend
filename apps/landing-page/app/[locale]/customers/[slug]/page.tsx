/**
 * @file page.tsx
 * @module app/[locale]/customers/[slug]/page
 *
 * @description
 * Placeholder route for an individual customer story. Every slug renders
 * a branded "coming soon" state with a link back to the index.
 *
 * We intentionally don't `notFound()` here — a marketing team may share a
 * teaser URL ahead of the story going live, and a friendly holding page
 * is better than a 404.
 */

import { TrophyIcon } from "@academorix/ui/icons/outline";
import { getTranslations, setRequestLocale } from "next-intl/server";

import type { Metadata } from "next";
import type { ReactNode } from "react";

import { ComingSoon } from "@/components/marketing/coming-soon";
import { MarketingShell } from "@/components/marketing/marketing-shell";

/** Route props. */
interface CustomerPageProps {
  params: Promise<{ locale: string; slug: string }>;
}

/** Per-page metadata — hidden from crawlers while the story isn't live. */
export async function generateMetadata({ params }: CustomerPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "customers" });

  return {
    title: t("individualEyebrow"),
    description: "Coming soon.",
    robots: { index: false },
  };
}

/** The customer-story placeholder page. */
export default async function CustomerPage({ params }: CustomerPageProps): Promise<ReactNode> {
  const { locale, slug } = await params;

  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "customers" });

  // Turn "some-academy" into "Some Academy" for the friendly headline.
  const readable = slug
    .split("-")
    .filter((word) => word.length > 0)
    .map((word) => word[0]!.toUpperCase() + word.slice(1))
    .join(" ");

  return (
    <MarketingShell>
      <ComingSoon
        description={t("individualDescription", { name: readable })}
        eyebrow={t("individualEyebrow")}
        icon={TrophyIcon}
        primaryHref="/customers"
        primaryLabel={t("backToStories")}
        secondaryHref="/pricing"
        secondaryLabel={t("seePricing")}
        title={`${readable} ${t("individualTitleSuffix")}`}
      />
    </MarketingShell>
  );
}
