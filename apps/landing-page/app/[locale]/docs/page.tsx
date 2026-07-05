/**
 * @file page.tsx
 * @module app/[locale]/docs/page
 *
 * @description
 * Placeholder route for the Academorix documentation portal. Links out to
 * the external `docs.academorix.com` origin (from `site.docs_url`) while
 * we occupy the `/docs` route within the app so footer + mega-menu links
 * resolve cleanly.
 */

import { BookOpenIcon } from "@academorix/ui/icons/outline";
import { getTranslations, setRequestLocale } from "next-intl/server";

import type { Metadata } from "next";
import type { ReactNode } from "react";

import { ComingSoon } from "@/components/marketing/coming-soon";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { getSite } from "@/lib/api";

/** Props for {@link DocsPage}. */
interface DocsPageProps {
  params: Promise<{ locale: string }>;
}

/** Per-page metadata. */
export async function generateMetadata({ params }: DocsPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "docs.meta" });

  return {
    title: t("title"),
    description: t("description"),
    alternates: { canonical: locale === "en" ? "/docs" : `/${locale}/docs` },
  };
}

/** The docs landing page. */
export default async function DocsPage({ params }: DocsPageProps): Promise<ReactNode> {
  const { locale } = await params;

  setRequestLocale(locale);

  const [site, t] = await Promise.all([
    getSite(locale),
    getTranslations({ locale, namespace: "docs" }),
  ]);

  return (
    <MarketingShell>
      <ComingSoon
        description={t("description")}
        eyebrow={t("eyebrow")}
        icon={BookOpenIcon}
        primaryHref={site.docs_url}
        primaryLabel={t("preview")}
        secondaryHref="mailto:hello@academorix.com?subject=Docs%20feedback"
        secondaryLabel={t("sendFeedback")}
        title={t("title")}
      />
    </MarketingShell>
  );
}
