/**
 * @file merge-descriptors.util.ts
 * @module @stackra/routing/seo/utils
 * @description Merge a chain of SEO descriptors into one.
 *
 *   Merge rules — SUPERSEDES anything ambiguous elsewhere:
 *   - Scalars (`title`, `description`, `canonical`, `robots`,
 *     `titleTemplate`) — inner (later) wins.
 *   - `openGraph` / `twitter` — shallow-merged one level deep.
 *   - `jsonLd` — accumulated (children APPEND; nothing is dropped).
 *   - `keywords` / `alternates` / `meta` — concatenated + de-duped
 *     where sensible.
 */

import type { IJsonLd } from "../interfaces/json-ld.interface";
import type { ISeoDescriptor } from "../interfaces/seo-descriptor.interface";

/**
 * Normalise a `jsonLd` field (single node or list) to an array.
 */
function toJsonLdArray(value: ISeoDescriptor["jsonLd"]): IJsonLd[] {
  if (!value) return [];
  return Array.isArray(value) ? [...value] : [value as IJsonLd];
}

/**
 * Merge an ordered chain of descriptors (outermost first) into one.
 *
 * @param chain - Descriptors in outer-to-inner order.
 * @returns Resolved descriptor.
 */
export function mergeDescriptors(chain: readonly ISeoDescriptor[]): ISeoDescriptor {
  // The running result. Scalars overwrite each pass; array fields
  // accumulate separately and are stitched back at the end.
  let result: ISeoDescriptor = {};
  const jsonLd: IJsonLd[] = [];
  let keywords: string[] = [];
  let alternates: ISeoDescriptor["alternates"] = [];
  let meta: NonNullable<ISeoDescriptor["meta"]>[number][] = [];

  for (const desc of chain) {
    // Scalars: last wins via `...desc` spread.
    // Nested `openGraph` / `twitter`: shallow-merge so a child that
    // only sets `image` doesn't blow away the inherited `siteName`.
    result = {
      ...result,
      ...desc,
      openGraph: { ...(result.openGraph ?? {}), ...(desc.openGraph ?? {}) },
      twitter: { ...(result.twitter ?? {}), ...(desc.twitter ?? {}) },
    };
    jsonLd.push(...toJsonLdArray(desc.jsonLd));
    if (desc.keywords) keywords.push(...desc.keywords);
    if (desc.alternates) alternates = [...(alternates ?? []), ...desc.alternates];
    if (desc.meta) meta = [...meta, ...desc.meta];
  }

  // De-duplicate keywords preserving insertion order via `Set`.
  keywords = [...new Set(keywords)];

  // Prune empty array fields — cleaner emitted head, easier merge diff.
  return {
    ...result,
    ...(jsonLd.length > 0 ? { jsonLd } : {}),
    ...(keywords.length > 0 ? { keywords } : {}),
    ...(alternates && alternates.length > 0 ? { alternates } : {}),
    ...(meta.length > 0 ? { meta } : {}),
  };
}
