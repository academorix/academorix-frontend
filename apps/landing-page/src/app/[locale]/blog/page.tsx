/**
 * @file page.tsx
 * @module app/[locale]/blog/page
 *
 * @description
 * Placeholder route for the Academorix blog. Real posts land here once the
 * MDX pipeline is wired up. Until then, this shows a branded "coming soon"
 * state with a `mailto:` capture for launch alerts.
 */

import { NewspaperIcon } from "@academorix/ui/icons/outline";
import { getTranslations, setRequestLocale } from "next-intl/server";

import type { Metadata } from "next";
import type { ReactNode } from "react";

import { ComingSoon } from "@/components/marketing/coming-soon";
import { MarketingShell } from "@/components/marketing/marketing-shell";

/** Props for {@link BlogPage}. */
interface BlogPageProps {
  params: Promise<{ locale: string }>;
}

/** Per-page metadata. */
export async function generateMetadata({ params }: BlogPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "blog.meta" });

  return {
    title: t("title"),
    description: t("description"),
    alternates: { canonical: locale === "en" ? "/blog" : `/${locale}/blog` },
  };
}

/** The blog index page. */
export default async function BlogPage({ params }: BlogPageProps): Promise<ReactNode> {
  const { locale } = await params;

  setRequestLocale(locale);

  const [t, tCommon] = await Promise.all([
    getTranslations({ locale, namespace: "blog" }),
    getTranslations({ locale, namespace: "common" }),
  ]);

  return (
    <MarketingShell>
      <ComingSoon
        description={t("description")}
        eyebrow={t("eyebrow")}
        icon={NewspaperIcon}
        primaryHref="mailto:hello@academorix.com?subject=Notify%20me%20about%20the%20blog"
        primaryLabel={tCommon("getNotified")}
        secondaryHref="/docs"
        secondaryLabel={t("readDocs")}
        title={t("title")}
      />
    </MarketingShell>
  );
}
