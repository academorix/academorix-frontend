/**
 * @file page.tsx
 * @module app/[locale]/sports/page
 *
 * @description
 * Sports index — grid of every supported sport deep page. Server Component;
 * awaits `getSports()` for the active locale and renders responsive tiles
 * linking to `/sports/[slug]` (or `/{locale}/sports/[slug]`).
 */

import { ArrowRightIcon } from "@academorix/ui/icons/outline";
import { getTranslations, setRequestLocale } from "next-intl/server";

import type { Metadata } from "next";
import type { ReactNode } from "react";

import { MarketingShell } from "@/components/marketing/marketing-shell";
import { Link } from "@/i18n/navigation";
import { getSports } from "@/lib/api";
import { resolveIcon } from "@/lib/icon-registry";

/** Props for {@link SportsIndexPage}. */
interface SportsIndexPageProps {
  params: Promise<{ locale: string }>;
}

/** Per-page metadata. */
export async function generateMetadata({ params }: SportsIndexPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "sports.meta" });

  return {
    title: t("title"),
    description: t("description"),
    alternates: { canonical: locale === "en" ? "/sports" : `/${locale}/sports` },
  };
}

/** The sports index page. */
export default async function SportsIndexPage({
  params,
}: SportsIndexPageProps): Promise<ReactNode> {
  const { locale } = await params;

  setRequestLocale(locale);

  const [sports, t] = await Promise.all([
    getSports(locale),
    getTranslations({ locale, namespace: "sports" }),
  ]);

  return (
    <MarketingShell>
      <section
        aria-labelledby="sports-index-heading"
        className="mx-auto w-full max-w-6xl px-6 pt-20 pb-16"
      >
        <div className="mb-14 flex flex-col items-start gap-4">
          <span className="text-xs font-semibold tracking-wider text-muted uppercase">
            {t("eyebrow")}
          </span>
          <h1
            className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl"
            id="sports-index-heading"
          >
            {t("indexTitle")}
          </h1>
          <p className="max-w-2xl text-lg text-muted">{t("indexDescription")}</p>
        </div>

        <ul className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {sports.map((sport) => {
            const Icon = resolveIcon(sport.hero_icon);

            return (
              <li key={sport.slug}>
                <Link
                  className="group flex h-full flex-col gap-4 rounded-xl border border-default bg-surface p-6 transition-colors hover:border-foreground/20"
                  href={`/sports/${sport.slug}`}
                >
                  <span className="flex size-11 items-center justify-center rounded-xl bg-accent/10 text-accent">
                    <Icon aria-hidden="true" className="size-6" />
                  </span>
                  <div className="flex flex-1 flex-col gap-2">
                    <h2 className="text-lg font-semibold text-foreground">{sport.title}</h2>
                    <p className="text-sm leading-relaxed text-muted">{sport.description}</p>
                  </div>
                  <span className="inline-flex items-center gap-1 text-sm font-medium text-accent transition-transform group-hover:translate-x-0.5">
                    {t("explore")}
                    <ArrowRightIcon aria-hidden="true" className="size-3.5" />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
    </MarketingShell>
  );
}
