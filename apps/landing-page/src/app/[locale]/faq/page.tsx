/**
 * @file faq/page.tsx
 * @module app/[locale]/faq/page
 *
 * @description
 * Site-wide FAQ page. Renders the full ~40-question pool from
 * `faq-pool.json` grouped by topic (via slug prefix). Landing +
 * pricing pages render their own tight 10-item subset; this page
 * is the deep-dive companion.
 */

import { setRequestLocale } from "next-intl/server";

import type { Metadata } from "next";
import type { ReactNode } from "react";

import { FaqAccordion } from "@/components/marketing/faq-accordion";
import { MarketingHero } from "@/components/marketing/marketing-hero";
import { MarketingShell } from "@/components/shell/marketing-shell";
import { getFaqPool } from "@/lib/api";
import { faqSchema, JsonLd } from "@/lib/seo/json-ld";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;

  return {
    title: locale === "ar" ? "الأسئلة الشائعة" : "Frequently asked questions",
    alternates: { canonical: locale === "en" ? "/faq" : `/${locale}/faq` },
  };
}

export default async function FaqPage({ params }: PageProps): Promise<ReactNode> {
  const { locale } = await params;

  setRequestLocale(locale);

  const faq = await getFaqPool(locale);

  const jsonLdSchemas = [
    faqSchema({
      items: faq.map((item) => ({
        question: item.question,
        answer: item.answer,
      })),
    }),
  ];

  return (
    <MarketingShell>
      <JsonLd schemas={jsonLdSchemas} />
      <MarketingHero
        eyebrow={locale === "ar" ? "الأسئلة الشائعة" : "FAQ"}
        subtitle={
          locale === "ar"
            ? "الأسعار، الهجرة، الأمن، الرياضات، الفروع المتعددة، التكاملات، والذكاء الاصطناعي."
            : "Pricing, migration, security, sports, multi-branch, integrations, and AI."
        }
        title={locale === "ar" ? "إجابات على كل ما نسمعه" : "Answers to everything we hear"}
      />

      <section className="mx-auto max-w-4xl px-6 pb-24">
        <FaqAccordion items={faq} />
      </section>
    </MarketingShell>
  );
}
