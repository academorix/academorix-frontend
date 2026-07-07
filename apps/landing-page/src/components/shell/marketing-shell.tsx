/**
 * @file marketing-shell.tsx
 * @module components/shell/marketing-shell
 *
 * @description
 * Top-level wrapper for every marketing route. Reads site metadata
 * and top nav from the bilingual JSON reader, then composes
 * `<LandingHeader>` + the routed page content + `<FooterSection>`.
 *
 * Renders as a Server Component so JSON is read once per request
 * (the reader itself caches in-process across streaming passes).
 * The children slot passes through unchanged, so a page can drop
 * `<MarketingShell>` around anything.
 */

import { getLocale } from "next-intl/server";

import type { ReactNode } from "react";

import { FooterSection } from "@/components/shell/footer-section";
import { LandingHeader } from "@/components/shell/landing-header";
import { resolveLocale } from "@/i18n/routing";
import { getNav, getSite } from "@/lib/api";

/** Props for {@link MarketingShell}. */
export interface MarketingShellProps {
  children: ReactNode;
}

/** Server-rendered marketing chrome. */
export async function MarketingShell({ children }: MarketingShellProps) {
  const rawLocale = await getLocale();
  const locale = resolveLocale(rawLocale);
  const [site, nav] = await Promise.all([getSite(locale), getNav(locale)]);

  return (
    <div className="flex min-h-dvh flex-col">
      <LandingHeader locale={locale} nav={nav} site={site} />
      <main className="flex-1">{children}</main>
      <FooterSection site={site} />
    </div>
  );
}
