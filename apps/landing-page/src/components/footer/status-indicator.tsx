/**
 * @file status-indicator.tsx
 * @module components/footer/status-indicator
 *
 * @description
 * Compact "All systems normal" pill rendered in the footer utility bar.
 * Links out to the public status page ({@link envConfig.statusUrl}) and
 * shows a subtly-pulsing green dot to signal the healthy default state.
 *
 * Server Component — no interactivity beyond following the anchor, and
 * the pulse is pure CSS (`animate-ping`) so no JS runs on the client for
 * this element. The label is pulled from the `footer.status.*` message
 * catalogue so both English and Arabic get first-class translations.
 *
 * When we later wire up a live status pull (e.g. Instatus / statuspage.io
 * webhook → static JSON on this origin) this component becomes the single
 * place to swap the hardcoded "normal" state for a fetched status.
 */

import { useTranslations } from "next-intl";

import type { ReactNode } from "react";

import { envConfig } from "@/config/env.config";

/**
 * Renders the footer's status pill. Anchor + green dot + label — always
 * opens the status page in a new tab so the visitor doesn't lose the
 * marketing surface they were reading.
 */
export function StatusIndicator(): ReactNode {
  const t = useTranslations("footer");

  return (
    <a
      aria-label={t("status.aria")}
      className="inline-flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm font-medium text-muted transition-colors hover:bg-default/40 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      href={envConfig.statusUrl}
      rel="noopener noreferrer"
      target="_blank"
    >
      {/*
        Pulsing dot — two stacked spans: an outer ping halo and an inner
        solid dot. `size-2` on the outer positions the halo and reserves
        layout space; `size-1.5` on the inner keeps the solid dot smaller
        than the halo so the ping stays visible around it.
      */}
      <span aria-hidden="true" className="relative flex size-2 items-center justify-center">
        <span className="absolute inline-flex size-2 animate-ping rounded-full bg-success opacity-60" />
        <span className="relative inline-flex size-1.5 rounded-full bg-success" />
      </span>
      <span>{t("status.allSystemsNormal")}</span>
    </a>
  );
}
