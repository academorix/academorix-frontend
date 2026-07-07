/**
 * @file careers/page.tsx
 * @module app/[locale]/careers/page
 *
 * @description
 * /careers page. Renders the careers narrative, benefits stats,
 * and related links from `company.json`.
 */

import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";

import type { Metadata } from "next";
import type { ReactNode } from "react";

import { CtaBand } from "@/components/marketing/cta-band";
import { MarketingHero } from "@/components/marketing/marketing-hero";
import { RelatedLinks } from "@/components/marketing/related-links";
import { MarketingShell } from "@/components/shell/marketing-shell";
import { getCompanyPage } from "@/lib/api";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const page = await getCompanyPage("careers", locale);

  if (!page) return {};

  return {
    title: page.title,
    description: page.description,
    alternates: { canonical: locale === "en" ? "/careers" : `/${locale}/careers` },
  };
}

export default async function CareersPage({ params }: PageProps): Promise<ReactNode> {
  const { locale } = await params;

  setRequestLocale(locale);

  const page = await getCompanyPage("careers", locale);

  if (!page) notFound();

  return (
    <MarketingShell>
      <MarketingHero
        ctaPrimary={{
          label: locale === "ar" ? "شاهد الأدوار المفتوحة" : "See open roles",
          type: "link",
          href: "#roles",
        }}
        eyebrow={page.eyebrow}
        subtitle={page.description}
        title={page.title}
      />

      <section className="mx-auto max-w-3xl space-y-6 px-6 py-16 text-base leading-relaxed text-foreground">
        {page.narrative.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </section>

      {page.stats && page.stats.length > 0 ? (
        <section className="mx-auto max-w-6xl px-6 py-16">
          <dl className="grid grid-cols-1 gap-8 sm:grid-cols-3">
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

      <RelatedLinks
        heading={locale === "ar" ? "استكشف أيضاً" : "Explore also"}
        items={page.related}
      />

      <CtaBand
        ctaPrimary={{
          label: locale === "ar" ? "تواصل معنا" : "Get in touch",
          type: "contact_sales",
        }}
        description={
          locale === "ar"
            ? "أرسل بريداً إلى careers@academorix.com. نحن نوظف بشكل مستمر."
            : "Email careers@academorix.com. We hire on a rolling basis."
        }
        title={locale === "ar" ? "لا ترى دورك؟" : "Don't see your role?"}
      />
    </MarketingShell>
  );
}
