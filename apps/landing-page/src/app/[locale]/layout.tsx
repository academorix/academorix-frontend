/**
 * @file layout.tsx
 * @module app/[locale]/layout
 *
 * @description
 * The real root layout for every marketing route. Renders `<html>` + `<body>`,
 * fonts, the client-side theme + toast provider stack, and the `next-intl`
 * message provider so every downstream Server & Client Component can call
 * `getTranslations()` / `useTranslations()` respectively.
 *
 * ## What it does per request
 *
 *   1. Reads the routed `locale` param — validated against `routing.locales`
 *      (unrecognised locales trigger `notFound()`).
 *   2. Calls `setRequestLocale` so the resolved locale is available to every
 *      RSC in the subtree via `getLocale()`.
 *   3. Awaits `getMessages()` so we can hydrate the `NextIntlClientProvider`
 *      with the full catalogue for the client bundle.
 *   4. Sets `<html lang={locale} dir="rtl" | "ltr">` — SEO + RTL support.
 *
 * ## Generated metadata
 *
 * The default `<title>` template + description are rebuilt per locale from
 * `messages/{locale}.json`, and `alternates.languages` publishes `hreflang`
 * entries for every supported locale so search engines can serve the right
 * variant. Per-route pages may override any field.
 */

import clsx from "clsx";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";

import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import "@/styles/globals.css";

import { Providers } from "@/app/providers";
import { PwaInstallPrompt } from "@/components/pwa/install-prompt";
import { fontMono, fontSans } from "@/config/fonts.config";
import { isRtlLocale, LOCALES, routing } from "@/i18n/routing";
import { getMarketingUrl } from "@/lib/env";

/**
 * Pre-renders every supported locale at build time. Ensures each locale's
 * layout + downstream static pages are generated during `next build`.
 */
export function generateStaticParams(): Array<{ locale: string }> {
  return LOCALES.map((locale) => ({ locale }));
}

/**
 * Per-locale metadata — title template, description, canonical alternates,
 * OG copy. Each translation key resolves through the request's active
 * message catalogue so the tab reads correctly in the visitor's language.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    // Fall back to the default so `next build` doesn't crash if we hit here.
    return {};
  }

  const t = await getTranslations({ locale, namespace: "hero" });
  const site = await getTranslations({ locale, namespace: "common" });

  // Root site metadata comes from public/data/{locale}/site.json — read it
  // via the api layer so translations stay consistent with the fixture.
  const { getSite } = await import("@/lib/api");
  const siteData = await getSite(locale);

  const marketing = getMarketingUrl();

  return {
    metadataBase: new URL(marketing),
    title: {
      default: `${siteData.name} — ${siteData.tagline}`,
      template: `%s | ${siteData.name}`,
    },
    description: siteData.description,
    applicationName: siteData.name,
    authors: [{ name: siteData.name }],
    openGraph: {
      type: "website",
      siteName: siteData.name,
      title: `${siteData.name} — ${siteData.tagline}`,
      description: siteData.description,
      locale,
      alternateLocale: LOCALES.filter((l) => l !== locale),
    },
    twitter: {
      card: "summary_large_image",
      title: `${siteData.name} — ${siteData.tagline}`,
      description: siteData.description,
    },
    icons: {
      icon: [
        { url: "/favicon.ico", sizes: "any" },
        { url: "/pwa-64x64.png", type: "image/png", sizes: "64x64" },
        { url: "/pwa-192x192.png", type: "image/png", sizes: "192x192" },
      ],
      apple: "/apple-touch-icon.png",
    },
    /**
     * Locale-aware Web App Manifest. Every locale installs as its own
     * PWA flavour with translated `name`, `short_name`, `description`,
     * and shortcut labels + the correct `dir` / `lang` for RTL
     * support. See `src/app/manifest.webmanifest/route.ts`.
     */
    manifest: `/manifest.webmanifest?locale=${locale}`,
    alternates: {
      canonical: "/",
      languages: Object.fromEntries(
        LOCALES.map((l) => [l, l === routing.defaultLocale ? "/" : `/${l}`]),
      ),
    },
    // Silence unused-warning while keeping the imports meaningful in JSDoc.
    other: { "x-locale-hero": t("heading"), "x-locale-common": site("getStarted") },
  };
}

/** Theme-aware viewport (light + dark). */
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
};

/** Props for {@link LocaleLayout}. */
interface LocaleLayoutProps {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}

/** The locale-scoped root layout. */
export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps): Promise<ReactNode> {
  const { locale } = await params;

  // Validate the routed segment against the supported locales. Anything
  // outside the set is a 404 — matches next-intl's recommended guard.
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  // Register the active locale for every downstream RSC that calls
  // `getLocale()` or `getTranslations()`.
  setRequestLocale(locale);

  // Load the full catalogue once so `NextIntlClientProvider` can serialise
  // it into the client bundle for `useTranslations()`.
  const messages = await getMessages();

  return (
    <html suppressHydrationWarning dir={isRtlLocale(locale) ? "rtl" : "ltr"} lang={locale}>
      <head />
      <body
        className={clsx(
          "min-h-dvh bg-background font-sans text-foreground antialiased",
          fontSans.variable,
          fontMono.variable,
        )}
      >
        <NextIntlClientProvider locale={locale} messages={messages}>
          <Providers
            themeProps={{ attribute: "class", defaultTheme: "system", enableSystem: true }}
          >
            {children}
            <PwaInstallPrompt />
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
