/**
 * @file layout.tsx
 * @module app/layout
 *
 * @description
 * The App Router's mandatory root layout. Deliberately thin: every real
 * concern (HTML shell, `<html lang>` + `dir`, next-intl provider, theme
 * stack, fonts, per-route metadata) lives in `app/[locale]/layout.tsx`.
 *
 * ## Why a passthrough
 *
 * `next-intl`'s recommended structure for App Router + locale segment is
 * to render the sole `<html>` + `<body>` inside the locale layout — that
 * way the `lang` + `dir` attributes always reflect the active locale.
 * A thicker root layout would either render a second `<html>` (invalid)
 * or force us to hoist locale detection out of the routing tree.
 *
 * The middleware guarantees every rendered URL starts with a locale, so
 * this file's `children` will always be the `[locale]` subtree.
 */

import type { ReactNode } from "react";

/** Root layout — hands children off to the locale-specific layout. */
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
