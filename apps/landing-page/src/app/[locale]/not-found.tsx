/**
 * @file not-found.tsx
 * @module app/[locale]/not-found
 *
 * @description
 * Locale-scoped 404 shown when Next can't match a route inside the
 * `[locale]` subtree. Keeps the marketing chrome via
 * `<MarketingShell>` so users can bounce back into the site.
 */

import { getTranslations } from "next-intl/server";

import type { ReactNode } from "react";

import { MarketingShell } from "@/components/shell/marketing-shell";
import { Link } from "@/i18n/navigation";

/** Renders the branded 404 page for the current locale. */
export default async function LocaleNotFound(): Promise<ReactNode> {
  const t = await getTranslations("notFound");

  return (
    <MarketingShell>
      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-24 text-center">
        <p className="text-xs font-medium tracking-wider text-muted uppercase">{t("code")}</p>
        <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
          {t("title")}
        </h1>
        <p className="max-w-lg text-base text-muted">{t("description")}</p>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            className="inline-flex items-center gap-2 rounded-full border border-default px-6 py-3 text-sm font-medium text-foreground transition-colors hover:bg-default/40"
            href="/"
          >
            {t("goHome")}
          </Link>
          <Link
            className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-medium text-accent-foreground transition-colors hover:opacity-90"
            href="/pricing"
          >
            {t("seePricing")}
          </Link>
        </div>
      </div>
    </MarketingShell>
  );
}
