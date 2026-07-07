/**
 * @file about/page.tsx
 * @module app/[locale]/about/page
 *
 * @description
 * /about page. Renders the company narrative, stats, leadership
 * team, and milestones timeline from `company.json`.
 */

import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";

import type { Metadata } from "next";
import type { ReactNode } from "react";

import { CtaBand } from "@/components/marketing/cta-band";
import { MarketingHero } from "@/components/marketing/marketing-hero";
import { RelatedLinks } from "@/components/marketing/related-links";
import { SectionHeading } from "@/components/marketing/section-heading";
import { MarketingShell } from "@/components/shell/marketing-shell";
import { getCompanyPage } from "@/lib/api";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const page = await getCompanyPage("about", locale);

  if (!page) return {};

  return {
    title: page.title,
    description: page.description,
    alternates: { canonical: locale === "en" ? "/about" : `/${locale}/about` },
  };
}

export default async function AboutPage({ params }: PageProps): Promise<ReactNode> {
  const { locale } = await params;

  setRequestLocale(locale);

  const page = await getCompanyPage("about", locale);

  if (!page) notFound();

  return (
    <MarketingShell>
      <MarketingHero eyebrow={page.eyebrow} subtitle={page.description} title={page.title} />

      <section className="mx-auto max-w-3xl space-y-6 px-6 py-16 text-base leading-relaxed text-foreground">
        {page.narrative.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </section>

      {page.stats && page.stats.length > 0 ? (
        <section className="mx-auto max-w-7xl px-6 py-16">
          <dl className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {page.stats.map((stat, i) => (
              <div
                key={i}
                className="flex flex-col gap-2 rounded-2xl border border-default/40 bg-surface/60 p-6 backdrop-blur-sm"
              >
                <dt className="text-4xl font-semibold tracking-tight text-foreground tabular-nums">
                  {stat.value}
                </dt>
                <dd className="text-sm text-muted">{stat.label}</dd>
              </div>
            ))}
          </dl>
        </section>
      ) : null}

      {page.team && page.team.length > 0 ? (
        <section className="mx-auto max-w-7xl px-6 py-16">
          <SectionHeading
            className="mb-12"
            title={locale === "ar" ? "الفريق القيادي" : "Leadership team"}
          />
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {page.team.map((member, i) => (
              <li
                key={i}
                className="flex flex-col gap-4 rounded-2xl border border-default/40 bg-surface/60 p-6 backdrop-blur-md"
              >
                <div className="flex items-center gap-3">
                  <span className="grid size-10 place-content-center rounded-full bg-accent/20 text-xs font-semibold tracking-wider text-accent uppercase">
                    {member.initials}
                  </span>
                  <div className="flex flex-col">
                    <span className="text-base font-semibold text-foreground">{member.name}</span>
                    <span className="text-xs text-muted">{member.role}</span>
                  </div>
                </div>
                <p className="text-sm text-muted">{member.bio}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {page.milestones && page.milestones.length > 0 ? (
        <section className="mx-auto max-w-4xl px-6 py-16">
          <SectionHeading className="mb-12" title={locale === "ar" ? "محطات" : "Milestones"} />
          <ol className="relative space-y-8 border-s-2 border-default/40 ps-8">
            {page.milestones.map((ms, i) => (
              <li key={i} className="relative">
                <span className="absolute -start-10 top-1 grid size-4 place-content-center rounded-full border-2 border-accent bg-background">
                  <span aria-hidden className="block size-1.5 rounded-full bg-accent" />
                </span>
                <p className="font-mono text-xs font-semibold tracking-widest text-accent">
                  {ms.year}
                </p>
                <h3 className="mt-1 text-lg font-semibold text-foreground">{ms.title}</h3>
                <p className="mt-1 text-sm text-muted">{ms.description}</p>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      <RelatedLinks
        heading={locale === "ar" ? "استكشف أيضاً" : "Explore also"}
        items={page.related}
      />

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
            ? "نبني مع أكاديميات في MENA وأوروبا وأمريكا الشمالية."
            : "We build alongside academies in MENA, Europe, and North America."
        }
        title={locale === "ar" ? "انضم إلى الرحلة" : "Come along for the ride"}
      />
    </MarketingShell>
  );
}
