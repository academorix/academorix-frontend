/**
 * @file layout.tsx
 * @module app/[locale]/layout
 *
 * @description
 * Locale-scoped root layout for every marketing route. Renders
 * `<html>` + `<body>`, resolves fonts, wraps the tree in the shared
 * `Providers` stack (theme + glass sync + serwist), and the
 * `next-intl` message provider so every downstream Server & Client
 * Component can call `getTranslations()` / `useTranslations()`.
 */

import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import clsx from "clsx";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";

import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import "@/styles/globals.css";

import { Providers } from "@/app/providers";
import { envConfig } from "@/config/env.config";
import { fontMono, fontSans } from "@/config/fonts.config";
import { isRtlLocale, LOCALE_BCP47_TAGS, LOCALES, routing } from "@/i18n/routing";
import { getSite } from "@/lib/api";
import { JsonLd, organizationSchema, websiteSchema } from "@/lib/seo/json-ld";

/** Pre-render every supported locale at build time. */
export function generateStaticParams(): Array<{ locale: string }> {
  return LOCALES.map((locale) => ({ locale }));
}

/** Per-locale metadata resolved through the bilingual reader. */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    return {};
  }

  const site = await getSite(locale);
  const marketing = envConfig.marketingUrl;

  return {
    metadataBase: new URL(marketing),
    title: {
      default: `${site.name} — ${site.tagline}`,
      template: `%s | ${site.name}`,
    },
    description: site.description,
    applicationName: site.name,
    authors: [{ name: site.name }],
    openGraph: {
      type: "website",
      siteName: site.name,
      title: `${site.name} — ${site.tagline}`,
      description: site.description,
      locale: LOCALE_BCP47_TAGS[locale as keyof typeof LOCALE_BCP47_TAGS] ?? locale,
      alternateLocale: LOCALES.filter((l) => l !== locale).map((l) => LOCALE_BCP47_TAGS[l] ?? l),
    },
    twitter: {
      card: "summary_large_image",
      title: `${site.name} — ${site.tagline}`,
      description: site.description,
    },
    icons: {
      icon: [
        { url: "/favicon.ico", sizes: "any" },
        { url: "/pwa-64x64.png", type: "image/png", sizes: "64x64" },
        { url: "/pwa-192x192.png", type: "image/png", sizes: "192x192" },
      ],
      apple: "/apple-touch-icon.png",
    },
    manifest: `/manifest.webmanifest?locale=${locale}`,
    alternates: {
      canonical: "/",
      languages: Object.fromEntries(
        LOCALES.map((l) => [l, l === routing.defaultLocale ? "/" : `/${l}`]),
      ),
    },
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

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const messages = await getMessages();
  const site = await getSite(locale);
  const marketingUrl = envConfig.marketingUrl;

  // Brand-level JSON-LD blocks — every page inherits Organization +
  // WebSite. Deep-dive pages add their own schemas (Product, FAQ,
  // BreadcrumbList) on top.
  const brandSchemas = [
    organizationSchema({
      siteUrl: marketingUrl,
      name: site.name,
      description: site.description,
      logoUrl: `${marketingUrl}/brand/wordmark.png`,
      contactEmail: site.sales_email,
      sameAs: [site.social.linkedin, site.social.github, site.social.twitter].filter(
        (u): u is string => Boolean(u),
      ),
    }),
    websiteSchema({ siteUrl: marketingUrl, name: site.name }),
  ];

  return (
    <html suppressHydrationWarning dir={isRtlLocale(locale) ? "rtl" : "ltr"} lang={locale}>
      <head>
        <JsonLd schemas={brandSchemas} />
      </head>
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
          </Providers>
        </NextIntlClientProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
