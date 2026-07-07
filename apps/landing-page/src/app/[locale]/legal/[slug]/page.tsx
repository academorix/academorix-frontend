/**
 * @file legal/[slug]/page.tsx
 * @module app/[locale]/legal/[slug]/page
 *
 * @description
 * Legal page template. Renders a single legal document from
 * `legal.json` (privacy, terms, security, cookies, dpa, aup) with
 * title, effective date, and sections + paragraphs.
 */

import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";

import type { Metadata } from "next";
import type { ReactNode } from "react";

import { MarketingShell } from "@/components/shell/marketing-shell";
import { getLegalPage, getLegalSlugs } from "@/lib/api";

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateStaticParams(): Promise<Array<{ locale: string; slug: string }>> {
  const slugs = await getLegalSlugs();

  return slugs.flatMap((slug) => [
    { locale: "en", slug },
    { locale: "ar", slug },
  ]);
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const page = await getLegalPage(slug, locale);

  if (!page) return {};

  return {
    title: page.title,
    description: page.description,
    alternates: {
      canonical: locale === "en" ? `/legal/${slug}` : `/${locale}/legal/${slug}`,
    },
  };
}

export default async function LegalPage({ params }: PageProps): Promise<ReactNode> {
  const { locale, slug } = await params;

  setRequestLocale(locale);

  const page = await getLegalPage(slug, locale);

  if (!page) notFound();

  return (
    <MarketingShell>
      <article className="mx-auto max-w-3xl px-6 py-24">
        <header className="mb-12 flex flex-col gap-4">
          <p className="text-xs font-medium tracking-wider text-muted uppercase">
            {locale === "ar" ? "الشؤون القانونية" : "Legal"}
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-foreground">{page.title}</h1>
          <p className="text-base text-muted">{page.description}</p>
          <p className="text-xs text-muted">
            {locale === "ar" ? "ساري ابتداء من" : "Effective"} {page.effective_date}
          </p>
        </header>

        <div className="space-y-12">
          {page.sections.map((section, i) => (
            <section key={i} className="space-y-4">
              <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                {section.title}
              </h2>
              {section.paragraphs.map((p, pi) => (
                <p key={pi} className="text-base leading-relaxed text-foreground">
                  {p}
                </p>
              ))}
            </section>
          ))}
        </div>
      </article>
    </MarketingShell>
  );
}
