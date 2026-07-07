/**
 * @file contact-sales/page.tsx
 * @module app/[locale]/contact-sales/page
 *
 * @description
 * Contact-sales page. Renders a compact hero with sales positioning
 * plus a mailto CTA. A form submission would live behind a Server
 * Action; for the marketing site launch we route to the sales email.
 */

import { setRequestLocale } from "next-intl/server";

import type { Metadata } from "next";
import type { ReactNode } from "react";

import { MarketingHero } from "@/components/marketing/marketing-hero";
import { MarketingShell } from "@/components/shell/marketing-shell";
import { getSite } from "@/lib/api";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;

  return {
    title: locale === "ar" ? "تحدث مع المبيعات" : "Contact sales",
    alternates: {
      canonical: locale === "en" ? "/contact-sales" : `/${locale}/contact-sales`,
    },
  };
}

export default async function ContactSalesPage({ params }: PageProps): Promise<ReactNode> {
  const { locale } = await params;

  setRequestLocale(locale);

  const site = await getSite(locale);

  return (
    <MarketingShell>
      <MarketingHero
        ctaPrimary={{
          label: locale === "ar" ? "أرسل بريداً إلى المبيعات" : "Email sales",
          type: "link",
          href: `mailto:${site.sales_email}`,
        }}
        ctaSecondary={{
          label: locale === "ar" ? "استعرض الأسعار" : "See pricing",
          type: "link",
          href: "/pricing",
        }}
        eyebrow={locale === "ar" ? "المبيعات" : "Sales"}
        subtitle={
          locale === "ar"
            ? "لتفعيلات متعددة الفروع، ومتطلبات الأمن، والامتثال، وطلبات الترحيل. نستجيب خلال يوم عمل."
            : "For multi-branch rollouts, security, compliance, and migration requests. We respond within one business day."
        }
        title={locale === "ar" ? "تحدث مع فريق المبيعات" : "Talk to sales"}
      />

      <section className="mx-auto grid max-w-5xl grid-cols-1 gap-6 px-6 py-16 sm:grid-cols-3">
        <div className="rounded-2xl border border-default/40 bg-surface/60 p-6 backdrop-blur-md">
          <h3 className="mb-2 text-lg font-semibold text-foreground">
            {locale === "ar" ? "الترحيل" : "Migration"}
          </h3>
          <p className="text-sm text-muted">
            {locale === "ar"
              ? "من TeamSnap أو Sportlyzer أو Playmetrics أو جداول البيانات، فريق التنفيذ يدير التفاصيل."
              : "From TeamSnap, Sportlyzer, Playmetrics, or spreadsheets. Our implementation team handles the details."}
          </p>
        </div>
        <div className="rounded-2xl border border-default/40 bg-surface/60 p-6 backdrop-blur-md">
          <h3 className="mb-2 text-lg font-semibold text-foreground">
            {locale === "ar" ? "الأمن والامتثال" : "Security and compliance"}
          </h3>
          <p className="text-sm text-muted">
            {locale === "ar"
              ? "SSO و SCIM وسجلات التدقيق وإقامة البيانات. SOC 2 Type II مقرَّر في الربع الرابع من 2026."
              : "SSO, SCIM, audit logs, and data residency. SOC 2 Type II scheduled Q4 2026."}
          </p>
        </div>
        <div className="rounded-2xl border border-default/40 bg-surface/60 p-6 backdrop-blur-md">
          <h3 className="mb-2 text-lg font-semibold text-foreground">
            {locale === "ar" ? "العقود المخصّصة" : "Custom contracts"}
          </h3>
          <p className="text-sm text-muted">
            {locale === "ar"
              ? "NET-30 و DPA و HIPAA BAA وفوترة موطَّنة عبر المناطق."
              : "NET-30, DPA, HIPAA BAA, and localised invoicing across regions."}
          </p>
        </div>
      </section>
    </MarketingShell>
  );
}
