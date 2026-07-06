/**
 * @file navigation.ts
 * @module i18n/navigation
 *
 * @description
 * Locale-aware wrappers around Next.js's `<Link>`, `useRouter`,
 * `usePathname`, `redirect`, `permanentRedirect`, and `getPathname` — every
 * one preserves the current locale prefix when navigating.
 *
 * ## Why this matters
 *
 * Using plain `next/link` inside a `/ar/*` route would strip the locale
 * prefix and either 404 or bounce the user to `/en/...`. These wrappers
 * are the ONLY navigation primitives that should be imported inside
 * marketing pages/components. Import from here everywhere:
 *
 * ```ts
 * // ✅ Preserves locale
 * import { Link, useRouter } from "@/i18n/navigation";
 *
 * // ❌ Strips locale, breaks Arabic
 * import Link from "next/link";
 * import { useRouter } from "next/navigation";
 * ```
 *
 * `next/navigation` exports that don't touch URLs (`notFound()`,
 * `useSearchParams()`, `useSelectedLayoutSegment()`, etc.) are still
 * fine to import directly — this file only re-exports the router surface.
 */

import { createNavigation } from "next-intl/navigation";

import { routing } from "@/i18n/routing";

/**
 * Locale-aware navigation primitives generated once from `routing`. Every
 * import is a normal drop-in for the equivalent `next/*` export.
 */
export const { Link, redirect, usePathname, useRouter, getPathname, permanentRedirect } =
  createNavigation(routing);
