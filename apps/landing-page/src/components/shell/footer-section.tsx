/**
 * @file footer-section.tsx
 * @module components/shell/footer-section
 *
 * @description
 * Vercel-style marketing footer. Structured as a two-row shell:
 *
 * **Row 1** — the "map" of the site.
 *   - Wide brand block on the reading-order start: wordmark, tagline
 *     paragraph, region badge.
 *   - Five uppercase-labelled navigation columns to the reading-order
 *     end: Product / Enterprise / Resources / Company / Legal.
 *
 * **Row 2** — the "meta" bar.
 *   - Left: copyright with the current year.
 *   - Right: system-status indicator with a pulsing dot, plus a row
 *     of social icons rendered inline as SVG (LinkedIn / X / GitHub)
 *     so we don't pay a network round-trip for six pixels of
 *     branding.
 *
 * The whole footer sits behind a subtle top border and picks up the
 * Glass theme's blurred surface, but the underlying background is
 * fully opaque so nothing bleeds up from the page above.
 *
 * ## Locale awareness
 *
 * Server Component. Reads the request locale via `getLocale()` from
 * `next-intl/server`. Column labels + copy are inline bilingual
 * pairs (structural nav, not authored copy in `public/data/*`), and
 * the tagline / brand name flows from `site.json`.
 */

import Link from "next/link";
import { getLocale } from "next-intl/server";

import type { Localized, SiteData } from "@/lib/types";
import type { ReactNode } from "react";

import { BrandLink } from "@/components/brand/brand-link";
import { BrandMark } from "@/components/brand/brand-mark";
import { resolveLocale } from "@/i18n/routing";

/** Props for {@link FooterSection}. */
export interface FooterSectionProps {
  site: Localized<SiteData>;
  className?: string;
}

// ═══════════════════════════════════════════════════════════════════
// Bilingual column configuration
// ═══════════════════════════════════════════════════════════════════

/**
 * Structural nav-column definitions. Kept inline (rather than
 * sourced from `public/data/*`) because these are the site's
 * skeleton — they change with routing decisions, not with marketing
 * copy edits. Each label is a bilingual pair so the footer stays in
 * sync with the current `<html dir>` without an extra JSON round-trip.
 */
const COLUMNS = [
  {
    title: { en: "Product", ar: "المنتج" },
    links: [
      { label: { en: "Products", ar: "المنتجات" }, href: "/products" },
      { label: { en: "Sports", ar: "الرياضات" }, href: "/sports" },
      { label: { en: "Pricing", ar: "الأسعار" }, href: "/pricing" },
      { label: { en: "Solutions", ar: "الحلول" }, href: "/solutions/multi-branch" },
      { label: { en: "Product tour", ar: "جولة في المنتج" }, href: "/#tour" },
    ],
  },
  {
    title: { en: "Enterprise", ar: "المؤسسات" },
    links: [
      { label: { en: "Security", ar: "الأمن" }, href: "/enterprise/security" },
      { label: { en: "Compliance", ar: "الامتثال" }, href: "/enterprise/compliance" },
      { label: { en: "Onboarding", ar: "التهيئة" }, href: "/enterprise/onboarding" },
      { label: { en: "Contracts", ar: "العقود" }, href: "/enterprise/contracts" },
      { label: { en: "Migration", ar: "الهجرة" }, href: "/enterprise/migration" },
    ],
  },
  {
    title: { en: "Resources", ar: "الموارد" },
    links: [
      { label: { en: "Blog", ar: "المدوّنة" }, href: "/blog" },
      { label: { en: "Docs", ar: "التوثيق" }, href: "https://docs.academorix.com" },
      { label: { en: "Changelog", ar: "سجل التحديثات" }, href: "/changelog" },
      { label: { en: "Community", ar: "المجتمع" }, href: "/community" },
      { label: { en: "Status", ar: "حالة الخدمة" }, href: "https://status.academorix.com" },
    ],
  },
  {
    title: { en: "Company", ar: "الشركة" },
    links: [
      { label: { en: "About", ar: "من نحن" }, href: "/about" },
      { label: { en: "Customers", ar: "العملاء" }, href: "/customers" },
      { label: { en: "Press", ar: "الإعلام" }, href: "/press" },
      { label: { en: "Careers", ar: "الوظائف" }, href: "/careers" },
      { label: { en: "Contact sales", ar: "تواصل مع المبيعات" }, href: "/contact-sales" },
    ],
  },
  {
    title: { en: "Legal", ar: "الشؤون القانونية" },
    links: [
      { label: { en: "Terms", ar: "الشروط" }, href: "/legal/terms" },
      { label: { en: "Privacy", ar: "الخصوصية" }, href: "/legal/privacy" },
      { label: { en: "Cookies", ar: "ملفات تعريف الارتباط" }, href: "/legal/cookies" },
      { label: { en: "DPA", ar: "اتفاقية معالجة البيانات" }, href: "/legal/dpa" },
      { label: { en: "Acceptable use", ar: "الاستخدام المقبول" }, href: "/legal/acceptable-use" },
    ],
  },
] as const;

// ═══════════════════════════════════════════════════════════════════
// Social icons — inline SVG (no network round-trip for 6px)
// ═══════════════════════════════════════════════════════════════════

/** Compact 16px SVG glyphs used in the meta bar. */
function LinkedInIcon(): ReactNode {
  return (
    <svg
      aria-hidden
      className="size-4"
      fill="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.36V9h3.41v1.56h.05c.48-.9 1.63-1.85 3.36-1.85 3.6 0 4.27 2.37 4.27 5.45zM5.34 7.43c-1.14 0-2.06-.93-2.06-2.06 0-1.14.92-2.06 2.06-2.06 1.13 0 2.06.93 2.06 2.06 0 1.14-.92 2.06-2.06 2.06zM7.12 20.45H3.56V9h3.56zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0z" />
    </svg>
  );
}

function XIcon(): ReactNode {
  return (
    <svg
      aria-hidden
      className="size-4"
      fill="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817-5.966 6.817H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function GitHubIcon(): ReactNode {
  return (
    <svg
      aria-hidden
      className="size-4"
      fill="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M12 .5C5.65.5.5 5.65.5 12a11.5 11.5 0 0 0 7.86 10.92c.57.11.78-.25.78-.55v-2.09c-3.2.69-3.87-1.36-3.87-1.36-.52-1.33-1.28-1.69-1.28-1.69-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.76 2.7 1.25 3.36.96.1-.75.4-1.25.73-1.53-2.55-.29-5.24-1.28-5.24-5.68 0-1.25.45-2.27 1.18-3.07-.12-.29-.51-1.46.11-3.04 0 0 .97-.31 3.18 1.17a11 11 0 0 1 5.79 0c2.2-1.48 3.17-1.17 3.17-1.17.63 1.58.23 2.75.12 3.04.74.8 1.18 1.82 1.18 3.07 0 4.41-2.69 5.38-5.25 5.67.42.36.78 1.06.78 2.14v3.17c0 .31.2.67.79.55A11.5 11.5 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5z" />
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════════════════

/** Vercel-style marketing footer. */
export async function FooterSection({ site, className }: FooterSectionProps) {
  const rawLocale = await getLocale();
  const locale = resolveLocale(rawLocale);
  const year = new Date().getFullYear();
  const isArabic = locale === "ar";

  return (
    <footer
      className={`border-t border-default/40 bg-surface-secondary/60 backdrop-blur-md ${className ?? ""}`}
    >
      {/* ── Row 1: brand + 5 columns ─────────────────────────────── */}
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-10 px-6 py-16 lg:grid-cols-12">
        <div className="col-span-2 flex flex-col gap-6 lg:col-span-4">
          <BrandLink
            aria-label={site.name}
            className="inline-flex items-center gap-2 text-lg font-semibold text-foreground"
          >
            <BrandMark alt="" height={28} variant="mark" />
            <span>{site.name}</span>
          </BrandLink>
          <p className="max-w-xs text-sm leading-relaxed text-muted">{site.tagline}</p>

          <div className="mt-2 inline-flex w-fit items-center gap-2 rounded-full border border-default/60 bg-surface/60 px-3 py-1.5 text-xs text-muted">
            <span aria-hidden className="text-base">
              🌍
            </span>
            <span>EU · MENA · US</span>
          </div>
        </div>

        {COLUMNS.map((col, i) => (
          <div key={i} className="flex flex-col gap-4 lg:col-span-2">
            <p className="text-[11px] font-semibold tracking-widest text-muted uppercase">
              {col.title[locale]}
            </p>
            <ul className="flex flex-col gap-2.5">
              {col.links.map((link, li) => (
                <li key={li}>
                  <Link
                    className="inline-block text-sm text-muted transition-colors duration-200 hover:text-foreground"
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

      {/* ── Row 2: meta bar ──────────────────────────────────────── */}
      <div className="border-t border-default/40 bg-surface/40">
        <div className="mx-auto flex max-w-7xl flex-col items-start gap-4 px-6 py-5 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <p>
              © {year} {site.name}. {isArabic ? "جميع الحقوق محفوظة." : "All rights reserved."}
            </p>
            <span aria-hidden className="hidden text-default sm:inline">
              ·
            </span>
            <p className="text-[11px]">
              {isArabic
                ? "تدقيق SOC 2 Type II مجدول في الربع الرابع 2026"
                : "SOC 2 Type II audit scheduled Q4 2026"}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <Link
              className="inline-flex items-center gap-2 rounded-full border border-default/60 bg-surface/50 px-3 py-1 transition-colors hover:bg-default/40 hover:text-foreground"
              href="https://status.academorix.com"
              rel="noreferrer"
              target="_blank"
            >
              <span aria-hidden className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400/60" />
                <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
              </span>
              <span>{isArabic ? "جميع الأنظمة تعمل" : "All systems operational"}</span>
            </Link>

            <ul className="flex items-center gap-3">
              {site.social.linkedin ? (
                <li>
                  <a
                    aria-label="LinkedIn"
                    className="inline-flex size-8 items-center justify-center rounded-full border border-default/60 bg-surface/50 text-muted transition-colors hover:border-default hover:text-foreground"
                    href={site.social.linkedin}
                    rel="noreferrer"
                    target="_blank"
                  >
                    <LinkedInIcon />
                  </a>
                </li>
              ) : null}
              {site.social.twitter ? (
                <li>
                  <a
                    aria-label="X"
                    className="inline-flex size-8 items-center justify-center rounded-full border border-default/60 bg-surface/50 text-muted transition-colors hover:border-default hover:text-foreground"
                    href={site.social.twitter}
                    rel="noreferrer"
                    target="_blank"
                  >
                    <XIcon />
                  </a>
                </li>
              ) : null}
              {site.social.github ? (
                <li>
                  <a
                    aria-label="GitHub"
                    className="inline-flex size-8 items-center justify-center rounded-full border border-default/60 bg-surface/50 text-muted transition-colors hover:border-default hover:text-foreground"
                    href={site.social.github}
                    rel="noreferrer"
                    target="_blank"
                  >
                    <GitHubIcon />
                  </a>
                </li>
              ) : null}
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
