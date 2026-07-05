/**
 * @file marketing-shell.tsx
 * @module components/marketing/marketing-shell
 *
 * @description
 * Server Component that wraps a marketing route with the shared page chrome
 * (`LandingHeader` + `<main>` + `FooterSection`). Reads the active locale
 * via `getLocale()` and hydrates the shell with the corresponding site +
 * nav data from `public/data/{locale}/*.json`, so switching to Arabic
 * reveals Arabic strings + RTL layout with no additional plumbing.
 *
 * Every marketing route (`/`, `/pricing`, `/products/*`, `/sports/*`,
 * `/legal/*`, `/enterprise/*`, `/customers/*`, `/blog`, `/docs`,
 * `/changelog`) uses this shell so header + footer stay consistent.
 */

import { getLocale } from "next-intl/server";

import type { ReactNode } from "react";

import { FooterSection } from "@/components/landing/footer-section";
import { LandingHeader } from "@/components/landing/landing-header";
import { getNav, getSite } from "@/lib/api";

/** Props for {@link MarketingShell}. */
interface MarketingShellProps {
  /** The routed content to render between header and footer. */
  children: ReactNode;
}

/** Server-side wrapper that hydrates the header + footer with site data. */
export async function MarketingShell({ children }: MarketingShellProps): Promise<ReactNode> {
  const locale = await getLocale();
  const [site, nav] = await Promise.all([getSite(locale), getNav(locale)]);

  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <LandingHeader nav={nav} site={site} />
      <main className="flex-1">{children}</main>
      <FooterSection site={site} />
    </div>
  );
}
