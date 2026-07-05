/**
 * @file page.tsx
 * @module app/[locale]/changelog/page
 *
 * @description
 * Placeholder route for the product changelog. Real entries land here once
 * the release-notes MDX pipeline is wired up. Meanwhile: a branded
 * "coming soon" state.
 */

import { ClockIcon } from "@academorix/ui/icons/outline";
import { getTranslations, setRequestLocale } from "next-intl/server";

import type { Metadata } from "next";
import type { ReactNode } from "react";

import { ComingSoon } from "@/components/marketing/coming-soon";
import { MarketingShell } from "@/components/marketing/marketing-shell";

/** Props for {@link ChangelogPage}. */
interface ChangelogPageProps {
  params: Promise<{ locale: string }>;
}

/** Per-page metadata. */
export async function generateMetadata({ params }: ChangelogPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "changelog.meta" });

  return {
    title: t("title"),
    description: t("description"),
    alternates: { canonical: locale === "en" ? "/changelog" : `/${locale}/changelog` },
  };
}

/** The changelog page. */
export default async function ChangelogPage({ params }: ChangelogPageProps): Promise<ReactNode> {
  const { locale } = await params;

  setRequestLocale(locale);

  const [t, tCommon] = await Promise.all([
    getTranslations({ locale, namespace: "changelog" }),
    getTranslations({ locale, namespace: "common" }),
  ]);

  return (
    <MarketingShell>
      <ComingSoon
        description={t("description")}
        eyebrow={t("eyebrow")}
        icon={ClockIcon}
        primaryHref="mailto:hello@academorix.com?subject=Subscribe%20to%20the%20changelog"
        primaryLabel={tCommon("subscribe")}
        secondaryHref="/docs"
        secondaryLabel={t("readDocs")}
        title={t("title")}
      />
    </MarketingShell>
  );
}
