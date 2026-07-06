/**
 * @file cta.ts
 * @module lib/marketing/cta
 *
 * @description
 * Resolves the abstract CTA intents stored in `public/data/*.json` (`signup`,
 * `trial`, `contact_sales`, `link`) to concrete URLs at render time. Keeps
 * the JSON portable — rotating the SPA to a new domain only requires
 * updating env vars, not every fixture.
 */

import type { CtaDescriptor } from "@/lib/types";

import { getAppUrl } from "@/lib/env";

/**
 * Resolves a CTA descriptor to a concrete URL.
 *
 * Rules:
 *   - `"signup"`       → `${APP_URL}/register`
 *   - `"trial"`        → `${APP_URL}/register?trial=1`
 *   - `"contact_sales"`→ `/contact-sales` (in-app Talk to Sales page)
 *   - `"link"`         → whatever `href` the descriptor carries
 *
 * @param cta - Descriptor from a JSON fixture.
 */
export function resolveCta(cta: CtaDescriptor): string {
  const app = getAppUrl();

  switch (cta.type) {
    case "signup":
      return `${app}/register`;
    case "trial":
      return `${app}/register?trial=1`;
    case "contact_sales":
      return "/contact-sales";
    case "link":
      return cta.href ?? "/";
    default:
      return "/";
  }
}

/**
 * True when the URL is external / non-App-Router (mailto, http, tel).
 */
export function isExternalHref(href: string): boolean {
  return href.startsWith("http") || href.startsWith("mailto:") || href.startsWith("tel:");
}
