/**
 * @file customers/[slug]/page.tsx
 * @module app/[locale]/customers/[slug]/page
 *
 * @description
 * Customer story template. Renders one story from `customers.json`
 * with hero, vitals grid, metric callouts, long-form narrative,
 * pull-quote, and related links.
 */

import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";

import type { Metadata } from "next";
import type { ReactNode } from "react";

import { CtaBand } from "@/components/marketing/cta-band";
import { MarketingHero } from "@/components/marketing/marketing-hero";
import { QuoteBlock } from "@/components/marketing/quote-block";
import { RelatedLinks } from "@/components/marketing/related-links";
import { MarketingShell } from "@/components/shell/marketing-shell";
import { getCustomerStory, getCustomerStorySlugs } from "@/lib/api";

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateStaticParams(): Promise<Array<{ locale: string; slug: string }>> {
  const slugs = await getCustomerStorySlugs();

  return slugs.flatMap((slug) => [
    { locale: "en", slug },
    { locale: "ar", slug },
  ]);
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const story = await getCustomerStory(slug, locale);

  if (!story) return {};

  return {
    title: story.title,
    description: story.description,
    alternates: {
      canonical: locale === "en" ? `/customers/${slug}` : `/${locale}/customers/${slug}`,
    },
  };
}

export default async function CustomerStoryPage({ params }: PageProps): Promise<ReactNode> {
  const { locale, slug } = await params;

  setRequestLocale(locale);

  const story = await getCustomerStory(slug, locale);

  if (!story) notFound();

  const vitalsLabels: Array<[keyof typeof story.vitals, string]> =
    locale === "ar"
      ? [
          ["industry", "الصناعة"],
          ["branches", "الفروع"],
          ["athletes", "الرياضيون"],
          ["sports", "الرياضات"],
          ["based", "المقر"],
        ]
      : [
          ["industry", "Industry"],
          ["branches", "Branches"],
          ["athletes", "Athletes"],
          ["sports", "Sports"],
          ["based", "Based"],
        ];

  return (
    <MarketingShell>
      <MarketingHero eyebrow={story.eyebrow} subtitle={story.description} title={story.title} />

      <section className="mx-auto max-w-6xl px-6 py-8">
        <dl className="grid grid-cols-2 gap-4 rounded-2xl border border-default/40 bg-surface/60 p-6 backdrop-blur-md sm:grid-cols-5">
          {vitalsLabels.map(([key, label]) => (
            <div key={key} className="flex flex-col gap-1">
              <dt className="text-xs font-semibold tracking-wider text-muted uppercase">{label}</dt>
              <dd className="text-sm font-medium text-foreground">{story.vitals[key]}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-8">
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {story.metrics.map((m, i) => (
            <li
              key={i}
              className="flex flex-col gap-1 rounded-2xl border border-accent/30 bg-accent/5 p-6"
            >
              <p className="text-3xl font-semibold tracking-tight text-foreground tabular-nums">
                {m.value}
              </p>
              <p className="text-xs text-muted">{m.label}</p>
            </li>
          ))}
        </ul>
      </section>

      <article className="mx-auto max-w-3xl space-y-6 px-6 py-16 text-base leading-relaxed text-foreground">
        {story.narrative.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </article>

      <section className="mx-auto max-w-3xl px-6 py-16">
        <QuoteBlock quote={story.quote} />
      </section>

      <RelatedLinks heading={locale === "ar" ? "قصص أخرى" : "More stories"} items={story.related} />

      <CtaBand
        ctaPrimary={{
          label: locale === "ar" ? "ابدأ الآن" : "Get started",
          type: "signup",
        }}
        ctaSecondary={{
          label: locale === "ar" ? "تحدث مع المبيعات" : "Talk to sales",
          type: "contact_sales",
        }}
        description={
          locale === "ar"
            ? "أنشئ مساحة عملك في دقائق. لا حاجة إلى بطاقة ائتمان."
            : "Create your workspace in minutes. No credit card required."
        }
        title={locale === "ar" ? "قصتك التالية" : "Your story next"}
      />
    </MarketingShell>
  );
}
