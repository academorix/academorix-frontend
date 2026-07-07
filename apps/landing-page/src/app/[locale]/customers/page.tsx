/**
 * @file customers/page.tsx
 * @module app/[locale]/customers/page
 *
 * @description
 * Customers index. Renders every customer story as a card grid
 * with key metric callouts.
 */

import Link from "next/link";
import { setRequestLocale } from "next-intl/server";

import type { Metadata } from "next";
import type { ReactNode } from "react";

import { MarketingHero } from "@/components/marketing/marketing-hero";
import { MarketingShell } from "@/components/shell/marketing-shell";
import { getCustomerStories } from "@/lib/api";
import { resolveIcon } from "@/lib/icon-registry";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;

  return {
    title: locale === "ar" ? "قصص العملاء" : "Customer stories",
    alternates: { canonical: locale === "en" ? "/customers" : `/${locale}/customers` },
  };
}

export default async function CustomersIndexPage({ params }: PageProps): Promise<ReactNode> {
  const { locale } = await params;

  setRequestLocale(locale);

  const stories = await getCustomerStories(locale);

  return (
    <MarketingShell>
      <MarketingHero
        eyebrow={locale === "ar" ? "قصص العملاء" : "Customer stories"}
        subtitle={
          locale === "ar"
            ? "من فرع واحد إلى شبكات متعددة الفروع، إليك كيف تدير الأكاديميات عملياتها."
            : "From single-branch academies to multi-branch networks, here is how they run operations."
        }
        title={
          locale === "ar" ? "أكاديميات تعمل على Academorix" : "Academies running on Academorix"
        }
      />

      <section className="mx-auto max-w-7xl px-6 pb-24">
        <ul className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {stories.map((story) => {
            const Icon = resolveIcon(story.hero_icon);

            return (
              <li key={story.slug}>
                <Link
                  className="group flex h-full flex-col gap-4 rounded-2xl border border-default/40 bg-surface/60 p-6 backdrop-blur-md transition-colors hover:border-default hover:bg-surface/80"
                  href={`/customers/${story.slug}`}
                >
                  <span className="inline-flex size-10 items-center justify-center rounded-xl bg-default/60 text-foreground">
                    <Icon aria-hidden className="size-5" />
                  </span>
                  <p className="text-xs font-medium tracking-wider text-muted uppercase">
                    {story.eyebrow}
                  </p>
                  <h3 className="text-lg font-semibold text-foreground group-hover:text-accent">
                    {story.title}
                  </h3>
                  <p className="text-sm text-muted">{story.description}</p>
                  {story.metrics.length > 0 ? (
                    <ul className="mt-auto grid grid-cols-2 gap-3 pt-4">
                      {story.metrics.slice(0, 2).map((m, mi) => (
                        <li key={mi} className="rounded-lg bg-default/40 p-3">
                          <p className="text-lg font-semibold text-foreground tabular-nums">
                            {m.value}
                          </p>
                          <p className="text-xs text-muted">{m.label}</p>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
    </MarketingShell>
  );
}
