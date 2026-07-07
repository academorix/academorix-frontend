/**
 * @file legal/page.tsx
 * @module app/[locale]/legal/page
 *
 * @description
 * Legal index. Lists every legal document (privacy, terms, security,
 * cookies, DPA, AUP) with effective date and description.
 */

import Link from "next/link";
import { setRequestLocale } from "next-intl/server";

import type { Metadata } from "next";
import type { ReactNode } from "react";

import { MarketingHero } from "@/components/marketing/marketing-hero";
import { MarketingShell } from "@/components/shell/marketing-shell";
import { getLegalPages } from "@/lib/api";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;

  return {
    title: locale === "ar" ? "الشؤون القانونية" : "Legal",
    alternates: { canonical: locale === "en" ? "/legal" : `/${locale}/legal` },
  };
}

export default async function LegalIndexPage({ params }: PageProps): Promise<ReactNode> {
  const { locale } = await params;

  setRequestLocale(locale);

  const pages = await getLegalPages(locale);

  return (
    <MarketingShell>
      <MarketingHero
        eyebrow={locale === "ar" ? "الشؤون القانونية" : "Legal"}
        subtitle={
          locale === "ar"
            ? "كل ما يحكم استخدامك لـ Academorix. مُحدَّث بانتظام مع سجل تغييرات."
            : "Everything that governs your use of Academorix. Updated regularly with a change log."
        }
        title={locale === "ar" ? "السياسات والاتفاقيات" : "Policies and agreements"}
      />
      <section className="mx-auto max-w-4xl px-6 pb-24">
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {pages.map((page) => (
            <li key={page.slug}>
              <Link
                className="group flex h-full flex-col gap-2 rounded-2xl border border-default/40 bg-surface/60 p-6 backdrop-blur-md transition-colors hover:border-default hover:bg-surface/80"
                href={`/legal/${page.slug}`}
              >
                <h3 className="text-lg font-semibold text-foreground group-hover:text-accent">
                  {page.title}
                </h3>
                <p className="text-sm text-muted">{page.description}</p>
                <p className="mt-auto pt-2 text-xs text-muted">
                  {locale === "ar" ? "ساري ابتداء من" : "Effective"} {page.effective_date}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </MarketingShell>
  );
}
