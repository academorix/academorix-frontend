/**
 * @file page.tsx
 * @module app/[locale]/newsletter/page
 *
 * @description
 * Placeholder route for the Academorix newsletter signup. Once we've wired
 * up a proper mailing-list backend, this page becomes a full opt-in form.
 * Until then: a branded "coming soon" state that redirects to a mailto.
 */

import { MegaphoneIcon } from "@academorix/ui/icons/outline";
import { getTranslations, setRequestLocale } from "next-intl/server";

import type { Metadata } from "next";
import type { ReactNode } from "react";

import { ComingSoon } from "@/components/marketing/coming-soon";
import { MarketingShell } from "@/components/marketing/marketing-shell";

/** Props for {@link NewsletterPage}. */
interface NewsletterPageProps {
  params: Promise<{ locale: string }>;
}

/** Per-page metadata. */
export async function generateMetadata({ params }: NewsletterPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "newsletter.meta" });

  return {
    title: t("title"),
    description: t("description"),
    alternates: { canonical: locale === "en" ? "/newsletter" : `/${locale}/newsletter` },
  };
}

/** The newsletter page. */
export default async function NewsletterPage({ params }: NewsletterPageProps): Promise<ReactNode> {
  const { locale } = await params;

  setRequestLocale(locale);

  const [t, tCommon] = await Promise.all([
    getTranslations({ locale, namespace: "newsletter" }),
    getTranslations({ locale, namespace: "common" }),
  ]);

  return (
    <MarketingShell>
      <ComingSoon
        description={t("description")}
        eyebrow={t("eyebrow")}
        icon={MegaphoneIcon}
        primaryHref="mailto:hello@academorix.com?subject=Subscribe%20me%20to%20the%20newsletter"
        primaryLabel={tCommon("subscribe")}
        secondaryHref="/customers"
        secondaryLabel={t("readStories")}
        title={t("title")}
      />
    </MarketingShell>
  );
}
