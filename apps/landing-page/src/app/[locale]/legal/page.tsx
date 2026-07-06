/**
 * @file page.tsx
 * @module app/[locale]/legal/page
 *
 * @description
 * Legal index — links to every legal document (privacy, terms, security,
 * cookies, DPA). Server Component; awaits `getLegalPages()` for the active
 * locale.
 */

import { ArrowRightIcon, DocumentTextIcon } from "@academorix/ui/icons/outline";
import { getTranslations, setRequestLocale } from "next-intl/server";

import type { Metadata } from "next";
import type { ReactNode } from "react";

import { MarketingShell } from "@/components/marketing/marketing-shell";
import { Link } from "@/i18n/navigation";
import { getLegalPages, getSite } from "@/lib/api";

/** Props for {@link LegalIndexPage}. */
interface LegalIndexPageProps {
  params: Promise<{ locale: string }>;
}

/** Per-page metadata. */
export async function generateMetadata({ params }: LegalIndexPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "legal.meta" });

  return {
    title: t("title"),
    description: t("description"),
    alternates: { canonical: locale === "en" ? "/legal" : `/${locale}/legal` },
  };
}

/** The legal index page. */
export default async function LegalIndexPage({ params }: LegalIndexPageProps): Promise<ReactNode> {
  const { locale } = await params;

  setRequestLocale(locale);

  const [pages, site, t] = await Promise.all([
    getLegalPages(locale),
    getSite(locale),
    getTranslations({ locale, namespace: "legal" }),
  ]);

  return (
    <MarketingShell>
      <section
        aria-labelledby="legal-index-heading"
        className="mx-auto w-full max-w-4xl px-6 pt-20 pb-16"
      >
        <div className="mb-14 flex flex-col items-start gap-4">
          <span className="text-xs font-semibold tracking-wider text-muted uppercase">
            {t("eyebrow")}
          </span>
          <h1
            className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl"
            id="legal-index-heading"
          >
            {t("indexTitle")}
          </h1>
          <p className="max-w-2xl text-lg text-muted">
            {t("indexDescriptionPrefix")}
            <a
              className="text-accent hover:underline"
              href={`mailto:${site.contact_email}`}
              rel="noreferrer"
            >
              {site.contact_email}
            </a>
            {t("indexDescriptionSuffix")}
          </p>
        </div>

        <ul className="flex flex-col gap-3">
          {pages.map((page) => (
            <li key={page.slug}>
              <Link
                className="group flex items-start justify-between gap-6 rounded-xl border border-default bg-surface px-5 py-5 transition-colors hover:border-foreground/20"
                href={`/legal/${page.slug}`}
              >
                <div className="flex items-start gap-4">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
                    <DocumentTextIcon aria-hidden="true" className="size-5" />
                  </span>
                  <div className="flex flex-col gap-1">
                    <h2 className="text-base font-semibold text-foreground">{page.title}</h2>
                    <p className="text-sm text-muted">{page.description}</p>
                    <p className="text-xs text-muted">
                      {t("effectiveDate", { date: page.effective_date })}
                    </p>
                  </div>
                </div>
                <ArrowRightIcon
                  aria-hidden="true"
                  className="mt-2 size-4 shrink-0 text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-foreground"
                />
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </MarketingShell>
  );
}
