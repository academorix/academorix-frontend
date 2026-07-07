/**
 * @file brand-link.tsx
 * @module components/brand/brand-link
 *
 * @description
 * A locale-aware anchor wrapping the Academorix wordmark. The
 * component implements the standard marketing-shell behavior:
 *
 * - When the visitor is already on the home page (`/` for English,
 *   `/ar` for Arabic), clicking the wordmark **smooth-scrolls the
 *   window to the top** instead of triggering a navigation. That
 *   avoids a wasted round-trip and matches the pattern used by every
 *   comparable marketing site (Slack, Linear, Vercel, Intercom).
 *
 * - On any other route, clicking the wordmark **navigates to the
 *   home page** via `next-intl`'s locale-aware `<Link>`, preserving
 *   the `/ar/*` prefix for Arabic visitors.
 *
 * ## Locale awareness
 *
 * `usePathname()` from `@/i18n/navigation` returns the locale-stripped
 * path (`/pricing` on `/ar/pricing`), so we can compare against `"/"`
 * regardless of the active locale.
 *
 * ## Composition
 *
 * The component accepts an `onClick` prop that the mobile drawer uses
 * to close the sheet after tapping the wordmark. Our own scroll
 * handler runs first; the parent handler always fires afterwards so
 * both intentions (scroll AND close drawer) coexist cleanly.
 */

"use client";

import { useCallback } from "react";

import type { MouseEvent, ReactNode } from "react";

import { Link, usePathname } from "@/i18n/navigation";

/** Props for {@link BrandLink}. */
export interface BrandLinkProps {
  /** Rendered inside the anchor (usually `<BrandMark />` + wordmark text). */
  children: ReactNode;
  /** Additional class names forwarded to the underlying anchor. */
  className?: string;
  /** Accessible label describing the destination ("Academorix — home"). */
  "aria-label"?: string;
  /**
   * Optional caller-supplied click handler. Fires **after** the
   * scroll-to-top branch runs so composed behavior (like closing a
   * mobile drawer) still works when the user taps the wordmark on
   * the home page.
   */
  onClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
}

/**
 * Smart wordmark link. See the file-level docblock for the full
 * behavior contract.
 */
export function BrandLink({
  children,
  className,
  "aria-label": ariaLabel,
  onClick,
}: BrandLinkProps) {
  const pathname = usePathname();
  const isHome = pathname === "/";

  const handleClick = useCallback(
    (event: MouseEvent<HTMLAnchorElement>) => {
      if (isHome) {
        // On the home page: block the navigation and smoothly scroll
        // the window to the top. Users get the "back to hero" feeling
        // without a full page transition.
        event.preventDefault();
        if (typeof window !== "undefined") {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      }

      // Fire the caller-supplied handler regardless — the mobile
      // drawer needs it to close whether we scrolled or navigated.
      onClick?.(event);
    },
    [isHome, onClick],
  );

  return (
    <Link aria-label={ariaLabel} className={className} href="/" onClick={handleClick}>
      {children}
    </Link>
  );
}
