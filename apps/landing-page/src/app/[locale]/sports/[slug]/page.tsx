/**
 * @file sports/[slug]/page.tsx
 * @module app/[locale]/sports/[slug]/page
 *
 * @description
 * Sport deep-page template. Renders one sport from `sports.json`
 * with hero, feature grid, optional testimonial, and related links.
 * Coming-soon sports render the same structure but with a
 * "join waitlist" primary CTA instead of "start free trial".
 */

import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";

import type { Metadata } from "next";
import type { ReactNode } from "react";

import { CtaBand } from "@/components/marketing/cta-band";
import { FeatureList } from "@/components/marketing/feature-list";
import { MarketingHero } from "@/components/marketing/marketing-hero";
import { QuoteBlock } from "@/components/marketing/quote-block";
import { RelatedLinks } from "@/components/marketing/related-links";
import { MarketingShell } from "@/components/shell/marketing-shell";
import { getSport, getSportSlugs } from "@/lib/api";

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateStaticParams(): Promise<Array<{ locale: string; slug: string }>> {
  const slugs = await getSportSlugs();

  return slugs.flatMap((slug) => [
    { locale: "en", slug },
    { locale: "ar", slug },
  ]);
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const sport = await getSport(slug, locale);

  if (!sport) return {};

  return {
    title: sport.title,
    description: sport.description,
    alternates: {
      canonical: locale === "en" ? `/sports/${slug}` : `/${locale}/sports/${slug}`,
    },
  };
}

export default async function SportPage({ params }: PageProps): Promise<ReactNode> {
  const { locale, slug } = await params;

  setRequestLocale(locale);

  const sport = await getSport(slug, locale);

  if (!sport) notFound();

  const primaryCta = sport.is_supported
    ? {
        label: locale === "ar" ? "ابدأ تجربة مجانية" : "Start free trial",
        type: "trial" as const,
      }
    : {
        label: locale === "ar" ? "انضم إلى قائمة الانتظار" : "Join the waitlist",
        type: "contact_sales" as const,
      };

  return (
    <MarketingShell>
      <MarketingHero
        ctaPrimary={primaryCta}
        ctaSecondary={{
          label: locale === "ar" ? "تحدث مع المبيعات" : "Talk to sales",
          type: "contact_sales",
        }}
        eyebrow={sport.eyebrow}
        subtitle={sport.description}
        title={sport.title}
      />

      <section className="mx-auto max-w-7xl px-6 py-16">
        <FeatureList items={sport.features} />
      </section>

      {sport.testimonial ? (
        <section className="mx-auto max-w-7xl px-6 py-16">
          <QuoteBlock quote={sport.testimonial} />
        </section>
      ) : null}

      <RelatedLinks
        heading={locale === "ar" ? "قد يهمك أيضاً" : "You might also like"}
        items={sport.related}
      />

      <CtaBand
        ctaPrimary={primaryCta}
        description={
          sport.is_supported
            ? locale === "ar"
              ? "أنشئ مساحة عملك في دقائق. لا حاجة إلى بطاقة ائتمان."
              : "Create your workspace in minutes. No credit card required."
            : locale === "ar"
              ? "سجل اهتمامك واحصل على وصول مبكر عند الإطلاق."
              : "Register your interest and get early access at launch."
        }
        title={
          sport.is_supported
            ? locale === "ar"
              ? `ابدأ استخدام ${sport.title} اليوم`
              : `Start with ${sport.title} today`
            : locale === "ar"
              ? `احصل على وصول مبكر إلى ${sport.title}`
              : `Get early access to ${sport.title}`
        }
      />
    </MarketingShell>
  );
}
