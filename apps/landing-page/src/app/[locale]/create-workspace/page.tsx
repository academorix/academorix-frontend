/**
 * @file create-workspace/page.tsx
 * @module app/[locale]/create-workspace/page
 *
 * @description
 * Marketing entry point for the workspace-creation flow. The actual
 * form lives in the dashboard SPA; here we surface the value prop
 * and bounce to `${appUrl}/signup`. Business types and password
 * rules come from JSON so future in-page form work can consume them
 * without duplication.
 */

import { setRequestLocale } from "next-intl/server";

import type { Metadata } from "next";
import type { ReactNode } from "react";

import { MarketingHero } from "@/components/marketing/marketing-hero";
import { MarketingShell } from "@/components/shell/marketing-shell";
import { getBusinessTypes, getPasswordRules } from "@/lib/api";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;

  return {
    title: locale === "ar" ? "أنشئ مساحة عملك" : "Create your workspace",
    alternates: {
      canonical: locale === "en" ? "/create-workspace" : `/${locale}/create-workspace`,
    },
  };
}

export default async function CreateWorkspacePage({ params }: PageProps): Promise<ReactNode> {
  const { locale } = await params;

  setRequestLocale(locale);

  const [businessTypes, passwordRules] = await Promise.all([
    getBusinessTypes(locale),
    getPasswordRules(locale),
  ]);

  return (
    <MarketingShell>
      <MarketingHero
        ctaPrimary={{
          label: locale === "ar" ? "ابدأ الآن" : "Get started",
          type: "signup",
        }}
        eyebrow={locale === "ar" ? "التسجيل" : "Sign up"}
        subtitle={
          locale === "ar"
            ? "خمس دقائق للإعداد. أي رياضة، أي لغة، أي حجم."
            : "Five minutes to set up. Any sport, any language, any scale."
        }
        title={locale === "ar" ? "أنشئ مساحة عمل أكاديميتك" : "Create your academy workspace"}
      />

      <section className="mx-auto grid max-w-5xl grid-cols-1 gap-6 px-6 py-16 md:grid-cols-2">
        <div className="rounded-2xl border border-default/40 bg-surface/60 p-6 backdrop-blur-md">
          <h3 className="mb-4 text-lg font-semibold text-foreground">
            {locale === "ar" ? "ما نوع نشاطك؟" : "What kind of business do you run?"}
          </h3>
          <ul className="flex flex-col gap-2 text-sm">
            {businessTypes.map((type) => (
              <li key={type.id} className="flex items-center gap-2 text-foreground">
                <span
                  aria-hidden
                  className="inline-flex size-1.5 shrink-0 rounded-full bg-accent"
                />
                <span>{type.label}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-default/40 bg-surface/60 p-6 backdrop-blur-md">
          <h3 className="mb-4 text-lg font-semibold text-foreground">
            {locale === "ar" ? "سياسة كلمة المرور" : "Password policy"}
          </h3>
          <ul className="flex flex-col gap-2 text-sm">
            {passwordRules.map((rule) => (
              <li key={rule.id} className="flex items-center gap-2 text-foreground">
                <span
                  aria-hidden
                  className="inline-flex size-1.5 shrink-0 rounded-full bg-accent"
                />
                <span>{rule.label}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </MarketingShell>
  );
}
