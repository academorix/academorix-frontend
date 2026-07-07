/**
 * @file footer-section.tsx
 * @module components/shell/footer-section
 *
 * @description
 * Marketing footer with four link columns (Product, Enterprise,
 * Company, Resources), a compact social row, and a fine-print line
 * with copyright + SOC 2 posture + region indicator. Rendered as a
 * Server Component; picks the correct label locale via `getLocale`.
 */

import Link from "next/link";
import { getLocale } from "next-intl/server";

import type { Localized, SiteData } from "@/lib/types";

import { BrandLink } from "@/components/brand/brand-link";
import { BrandMark } from "@/components/brand/brand-mark";
import { resolveLocale } from "@/i18n/routing";

/** Props for {@link FooterSection}. */
export interface FooterSectionProps {
  site: Localized<SiteData>;
  className?: string;
}

/**
 * Static column definition, kept in-component because these are
 * structural nav links, not authored marketing copy. Each label is a
 * bilingual pair so the footer stays in sync with `<html dir>`
 * without an extra JSON round-trip.
 */
const COLUMNS = [
  {
    title: { en: "Product", ar: "المنتج" },
    links: [
      { label: { en: "Products", ar: "المنتجات" }, href: "/products" },
      { label: { en: "Sports", ar: "الرياضات" }, href: "/sports" },
      { label: { en: "Pricing", ar: "الأسعار" }, href: "/pricing" },
      { label: { en: "Solutions", ar: "الحلول" }, href: "/solutions/multi-branch" },
    ],
  },
  {
    title: { en: "Enterprise", ar: "المؤسسات" },
    links: [
      { label: { en: "Security", ar: "الأمن" }, href: "/enterprise/security" },
      { label: { en: "Compliance", ar: "الامتثال" }, href: "/enterprise/compliance" },
      { label: { en: "Onboarding", ar: "التهيئة" }, href: "/enterprise/onboarding" },
      { label: { en: "Contracts", ar: "العقود" }, href: "/enterprise/contracts" },
    ],
  },
  {
    title: { en: "Company", ar: "الشركة" },
    links: [
      { label: { en: "About", ar: "من نحن" }, href: "/about" },
      { label: { en: "Careers", ar: "الوظائف" }, href: "/careers" },
      { label: { en: "Press", ar: "الإعلام" }, href: "/press" },
      { label: { en: "Customers", ar: "العملاء" }, href: "/customers" },
    ],
  },
  {
    title: { en: "Resources", ar: "الموارد" },
    links: [
      { label: { en: "Blog", ar: "المدوّنة" }, href: "/blog" },
      { label: { en: "Docs", ar: "التوثيق" }, href: "https://docs.academorix.com" },
      { label: { en: "Contact sales", ar: "تواصل مع المبيعات" }, href: "/contact-sales" },
      { label: { en: "Legal", ar: "الشؤون القانونية" }, href: "/legal" },
    ],
  },
] as const;

/** Marketing footer. */
export async function FooterSection({ site }: FooterSectionProps) {
  const rawLocale = await getLocale();
  const locale = resolveLocale(rawLocale);
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-default/40 bg-surface/40 backdrop-blur-md">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-6 py-16 lg:grid-cols-6">
        <div className="col-span-2 flex flex-col gap-4">
          <BrandLink
            aria-label={site.name}
            className="inline-flex items-center gap-2 text-lg font-semibold text-foreground"
          >
            <BrandMark alt="" height={28} variant="mark" />
            <span>{site.name}</span>
          </BrandLink>
          <p className="max-w-xs text-sm text-muted">{site.tagline}</p>
          {site.social.linkedin ? (
            <a
              className="w-fit text-sm text-muted transition-colors hover:text-foreground"
              href={site.social.linkedin}
              rel="noreferrer"
              target="_blank"
            >
              LinkedIn
            </a>
          ) : null}
        </div>

        {COLUMNS.map((col, i) => (
          <div key={i} className="flex flex-col gap-3">
            <p className="text-xs font-semibold tracking-wider text-muted uppercase">
              {col.title[locale]}
            </p>
            <ul className="flex flex-col gap-1">
              {col.links.map((link, li) => (
                <li key={li}>
                  <Link
                    className="text-sm text-muted transition-colors hover:text-foreground"
                    href={link.href}
                  >
                    {link.label[locale]}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-default/40 bg-surface/50">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-2 px-6 py-4 text-xs text-muted sm:flex-row sm:items-center">
          <p>
            © {year} {site.name}. All rights reserved.
          </p>
          <p>SOC 2 Type II audit scheduled Q4 2026. Data residency in EU, MENA, and US.</p>
        </div>
      </div>
    </footer>
  );
}
