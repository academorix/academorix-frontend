/**
 * @file slugify.util.ts
 * @module @stackra/dashboard/core/utils
 * @description Normalise an arbitrary string into a URL-safe slug.
 *
 *   Rules:
 *   - Strip diacritics.
 *   - Lowercase.
 *   - Replace runs of any non-alphanumeric character with a single
 *     hyphen.
 *   - Collapse consecutive hyphens.
 *   - Strip leading/trailing hyphens.
 *   - Cap at 60 characters (mirrors the backend column limit).
 *   - Route reserved slugs (`new`, `create`, `edit`, `embed`,
 *     `settings`) through a `-dashboard` suffix so they never collide
 *     with a router-owned path.
 *
 *   Idempotent — feeding a slug back through `slugify` returns the
 *   same slug. Uses `Str.lower` + `Str.trim` from `@stackra/support`
 *   per the support-utilities steering.
 */

import { Str } from "@stackra/support";

/**
 * Slugs the router owns. Never allocate these as raw dashboard slugs
 * — the slugifier appends `-dashboard` so they roundtrip through the
 * URL layer without colliding with routes.
 */
const RESERVED_SLUGS: readonly string[] = ["new", "create", "edit", "embed", "settings"];

/**
 * Convert a display name into a URL-safe slug.
 *
 * @param input - Raw name or existing slug candidate.
 * @returns Kebab-case slug capped at 60 chars.
 */
export function slugify(input: string): string {
  // NFKD normalisation splits accented characters into base + combining
  // marks; stripping the combining-mark range leaves plain ASCII.
  const normalised = Str.lower(
    Str.trim(input.normalize("NFKD").replace(/[\u0300-\u036f]/g, "")),
  );

  const hyphenated = normalised.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

  const truncated = hyphenated.slice(0, 60);

  // Reserved slugs and empty input get the `-dashboard` suffix so
  // they roundtrip through the URL layer without hitting a
  // framework-owned route.
  if (truncated === "" || RESERVED_SLUGS.includes(truncated)) {
    return `${truncated}${truncated === "" ? "" : "-"}dashboard`;
  }

  return truncated;
}
