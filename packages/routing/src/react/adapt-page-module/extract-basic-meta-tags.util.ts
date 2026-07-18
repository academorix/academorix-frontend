/**
 * @file extract-basic-meta-tags.util.ts
 * @module @stackra/routing/react/adapt-page-module
 * @description Extract the fields RRv7's `meta` export handles from a
 *   Stackra `ISeoDescriptor` — title, description, robots, OG basics.
 *
 *   The framework renders the FULL descriptor via `<SeoHead />`, but
 *   RRv7's `meta` export doubles as an SSR-friendly channel and
 *   third-party tooling (crawlers, meta scrapers, some caches) reads
 *   from it. Bridging the basic fields keeps that path working.
 */

import type { ISeoDescriptor } from "@/seo/interfaces/seo-descriptor.interface";

/**
 * A tag descriptor RRv7's `meta` function is expected to return —
 * see `MetaDescriptor` in RRv7.
 *
 * Not typed against the RRv7 type directly to avoid coupling
 * `@stackra/routing` compilation to whether RRv7 renamed the shape
 * across minor releases.
 */
export interface IRrvMetaTag {
  readonly title?: string;
  readonly name?: string;
  readonly property?: string;
  readonly content?: string;
  readonly httpEquiv?: string;
  readonly charSet?: string;
}

/**
 * Pull the fields RRv7's `meta` export handles from a resolved SEO
 * descriptor.
 *
 * @param seo - Resolved SEO descriptor (or `undefined` when the route
 *   has no SEO).
 * @returns Array of RRv7-native meta tag descriptors.
 */
export function extractBasicMetaTags(seo: ISeoDescriptor | undefined): readonly IRrvMetaTag[] {
  if (!seo) return [];
  const out: IRrvMetaTag[] = [];

  // Title — RRv7 renders <title> when a meta tag has a `title` field.
  if (seo.title) {
    const composed = seo.titleTemplate ? seo.titleTemplate.replace("%s", seo.title) : seo.title;
    out.push({ title: composed });
  }

  // Description — plain `name` meta.
  if (seo.description) {
    out.push({ name: "description", content: seo.description });
  }

  // Robots — join the directive object into the standard string form.
  // Only emit when the descriptor actually provides one; the site-wide
  // default is picked up via merge and rendered by <SeoHead />.
  if (seo.robots) {
    const tokens: string[] = [];
    // `robots` is an interface with `index`, `follow`, `noarchive`, ...
    // Encode as string per Google's spec.
    const r = seo.robots as Record<string, unknown>;
    if (typeof r.index === "boolean") tokens.push(r.index ? "index" : "noindex");
    if (typeof r.follow === "boolean") tokens.push(r.follow ? "follow" : "nofollow");
    if (r.noarchive === true) tokens.push("noarchive");
    if (r.nosnippet === true) tokens.push("nosnippet");
    if (r.noimageindex === true) tokens.push("noimageindex");
    if (typeof r.maxSnippet === "number") tokens.push(`max-snippet:${r.maxSnippet}`);
    if (typeof r.maxImagePreview === "string")
      tokens.push(`max-image-preview:${r.maxImagePreview}`);
    if (typeof r.maxVideoPreview === "number")
      tokens.push(`max-video-preview:${r.maxVideoPreview}`);
    if (tokens.length > 0) out.push({ name: "robots", content: tokens.join(", ") });
  }

  // OpenGraph basics — the descriptor supports the full OG spec; the
  // heavy tags are rendered by <SeoHead />. Here we surface title,
  // description, url, and type for RRv7's meta channel.
  const og = seo.openGraph as Record<string, unknown> | undefined;
  if (og) {
    if (typeof og.title === "string") out.push({ property: "og:title", content: og.title });
    if (typeof og.description === "string") {
      out.push({ property: "og:description", content: og.description });
    }
    if (typeof og.url === "string") out.push({ property: "og:url", content: og.url });
    if (typeof og.type === "string") out.push({ property: "og:type", content: og.type });
  }

  return out;
}
