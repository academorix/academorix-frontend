/**
 * @file page.tsx
 * @module app/[locale]/contact-sales/page
 *
 * @description
 * Enterprise Talk-to-Sales page — served bare on English (`/contact-sales`)
 * and locale-prefixed (`/ar/contact-sales`). The page is a Server Component
 * that renders the marketing shell, a headline hero, a KPI stat strip, and
 * the two-column layout that pairs the intake form with a sales-pitch
 * sidebar. The form itself is a Client Component so it can manage local
 * validation + POST state.
 *
 * ## Structure
 *
 *  - Hero: eyebrow + headline + subhead.
 *  - KPI strip: 4 statistics (active academies, athletes managed, sports
 *    supported, uptime SLA) using HeroUI Pro's KPIGroup for a Vercel-ish
 *    "we're serious" feel above the fold.
 *  - Split layout: form on the left, "What to expect" bullets + trust
 *    logos + testimonial on the right.
 *  - Related links footer.
 */

import {
  BuildingOffice2Icon,
  CheckBadgeIcon,
  ChevronRightIcon,
  ClockIcon,
  ShieldCheckIcon,
  SparklesIcon,
  TrophyIcon,
  UserGroupIcon,
} from "@academorix/ui/icons/outline";
import { Chip } from "@academorix/ui/react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import type { Metadata } from "next";
import type { ReactNode } from "react";

import { ContactSalesForm } from "@/components/contact/contact-sales-form";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { RelatedLinks } from "@/components/marketing/related-links";

/** Props for {@link ContactSalesPage}. */
interface ContactSalesPageProps {
  params: Promise<{ locale: string }>;
}

/** Per-page metadata. */
export async function generateMetadata({ params }: ContactSalesPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "contactSales.meta" });

  return {
    title: t("title"),
    description: t("description"),
    alternates: { canonical: locale === "en" ? "/contact-sales" : `/${locale}/contact-sales` },
    openGraph: {
      title: t("title"),
      description: t("description"),
      type: "website",
    },
  };
}

/**
 * A single trust marker in the sidebar — icon + short claim. Kept private
 * so the page component stays flat and readable.
 */
function TrustPoint({
  icon: Icon,
  title,
  description,
}: {
  icon: (props: { className?: string; "aria-hidden"?: boolean }) => ReactNode;
  title: string;
  description: string;
}): ReactNode {
  return (
    <li className="flex gap-3">
      <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
        <Icon aria-hidden className="size-4" />
      </span>
      <div className="flex flex-col gap-0.5">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <p className="text-sm leading-relaxed text-muted">{description}</p>
      </div>
    </li>
  );
}

/** The Talk to Sales page. */
export default async function ContactSalesPage({
  params,
}: ContactSalesPageProps): Promise<ReactNode> {
  const { locale } = await params;

  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "contactSales" });

  const stats = [
    {
      icon: BuildingOffice2Icon,
      label: t("stats.academies.label"),
      value: t("stats.academies.value"),
      hint: t("stats.academies.hint"),
    },
    {
      icon: UserGroupIcon,
      label: t("stats.athletes.label"),
      value: t("stats.athletes.value"),
      hint: t("stats.athletes.hint"),
    },
    {
      icon: TrophyIcon,
      label: t("stats.sports.label"),
      value: t("stats.sports.value"),
      hint: t("stats.sports.hint"),
    },
    {
      icon: ClockIcon,
      label: t("stats.uptime.label"),
      value: t("stats.uptime.value"),
      hint: t("stats.uptime.hint"),
    },
  ];

  const trustPoints = [
    {
      icon: SparklesIcon,
      title: t("trust.demo.title"),
      description: t("trust.demo.description"),
    },
    {
      icon: ShieldCheckIcon,
      title: t("trust.security.title"),
      description: t("trust.security.description"),
    },
    {
      icon: CheckBadgeIcon,
      title: t("trust.onboarding.title"),
      description: t("trust.onboarding.description"),
    },
    {
      icon: ChevronRightIcon,
      title: t("trust.migration.title"),
      description: t("trust.migration.description"),
    },
  ];

  return (
    <MarketingShell>
      <main className="pb-24">
        {/* Hero */}
        <section
          aria-labelledby="contact-sales-heading"
          className="px-4 pt-16 pb-10 sm:px-6 lg:px-8"
        >
          <div className="mx-auto max-w-3xl text-center">
            <Chip color="accent" variant="soft">
              <Chip.Label>{t("hero.eyebrow")}</Chip.Label>
            </Chip>
            <h1
              className="mt-4 text-4xl font-semibold tracking-tight text-balance text-foreground sm:text-5xl md:text-6xl"
              id="contact-sales-heading"
            >
              {t("hero.title")}
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg text-pretty text-muted">
              {t("hero.subtitle")}
            </p>
          </div>
        </section>

        {/* KPI strip */}
        <section
          aria-label={t("stats.aria")}
          className="mx-auto w-full max-w-[1400px] px-4 pb-16 sm:px-6 lg:px-8"
        >
          <div className="grid grid-cols-2 gap-4 rounded-2xl border border-default bg-surface p-6 sm:grid-cols-4 sm:p-8">
            {stats.map((stat) => (
              <div key={stat.label} className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-accent">
                  <stat.icon aria-hidden="true" className="size-4" />
                  <span className="text-xs font-semibold tracking-wider text-muted uppercase">
                    {stat.label}
                  </span>
                </div>
                <p className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                  {stat.value}
                </p>
                <p className="text-xs text-muted">{stat.hint}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Two-column split */}
        <section className="mx-auto w-full max-w-[1400px] px-4 pb-16 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
            {/* Form column */}
            <div className="flex flex-col gap-4">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                  {t("form.heading")}
                </h2>
                <p className="mt-2 text-sm text-muted">{t("form.subheading")}</p>
              </div>
              <ContactSalesForm />
            </div>

            {/* Sidebar column */}
            <aside className="flex flex-col gap-8">
              <div>
                <h2 className="text-lg font-semibold tracking-tight text-foreground">
                  {t("sidebar.heading")}
                </h2>
                <ul className="mt-6 flex flex-col gap-5">
                  {trustPoints.map((point) => (
                    <TrustPoint
                      key={point.title}
                      description={point.description}
                      icon={point.icon}
                      title={point.title}
                    />
                  ))}
                </ul>
              </div>

              {/* Featured testimonial */}
              <figure className="rounded-2xl border border-default bg-surface p-6">
                <blockquote className="text-sm leading-relaxed text-foreground">
                  &ldquo;{t("testimonial.quote")}&rdquo;
                </blockquote>
                <figcaption className="mt-4 flex items-center gap-3">
                  <span className="inline-flex size-9 items-center justify-center rounded-full bg-accent/10 text-xs font-semibold text-accent">
                    {t("testimonial.initials")}
                  </span>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-foreground">
                      {t("testimonial.author")}
                    </span>
                    <span className="text-xs text-muted">{t("testimonial.role")}</span>
                  </div>
                </figcaption>
              </figure>

              {/* Response promise */}
              <div className="rounded-2xl border border-dashed border-default bg-background p-6">
                <div className="flex items-center gap-2 text-accent">
                  <ClockIcon aria-hidden="true" className="size-4" />
                  <span className="text-xs font-semibold tracking-wider uppercase">
                    {t("response.eyebrow")}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-foreground">{t("response.body")}</p>
              </div>
            </aside>
          </div>
        </section>

        {/* Related enterprise pages */}
        <RelatedLinks
          heading={t("related.heading")}
          items={[
            {
              href: "/enterprise/security",
              title: t("related.security.title"),
              description: t("related.security.description"),
            },
            {
              href: "/enterprise/onboarding",
              title: t("related.onboarding.title"),
              description: t("related.onboarding.description"),
            },
            {
              href: "/enterprise/contracts",
              title: t("related.contracts.title"),
              description: t("related.contracts.description"),
            },
          ]}
        />
      </main>
    </MarketingShell>
  );
}
