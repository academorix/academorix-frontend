/**
 * @file page.tsx
 * @module app/[locale]/customers/page
 *
 * @description
 * Placeholder route for the customer-stories index.
 */

import { TrophyIcon } from "@academorix/ui/icons/outline";
import { getTranslations, setRequestLocale } from "next-intl/server";

import type { Metadata } from "next";
import type { ReactNode } from "react";

import { ComingSoon } from "@/components/marketing/coming-soon";
import { MarketingShell } from "@/components/marketing/marketing-shell";

/** Props for {@link CustomersIndexPage}. */
interface CustomersIndexPageProps {
  params: Promise<{ locale: string }>;
}

/** Per-page metadata. */
export async function generateMetadata({ params }: CustomersIndexPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "customers.meta" });

  return {
    title: t("title"),
    description: t("description"),
    alternates: { canonical: locale === "en" ? "/customers" : `/${locale}/customers` },
  };
}

/** The customer stories index page. */
export default async function CustomersIndexPage({
  params,
}: CustomersIndexPageProps): Promise<ReactNode> {
  const { locale } = await params;

  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "customers" });

  return (
    <MarketingShell>
      <ComingSoon
        description={t("description")}
        eyebrow={t("eyebrow")}
        icon={TrophyIcon}
        primaryHref="mailto:hello@academorix.com?subject=Share%20our%20story"
        primaryLabel={t("shareStory")}
        secondaryHref="/pricing"
        secondaryLabel={t("seePricing")}
        title={t("title")}
      />
    </MarketingShell>
  );
}
