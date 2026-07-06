/**
 * @file use-document-metadata.ts
 * @module lib/seo/use-document-metadata
 *
 * @description
 * Small, dependency-free hook that manages the document `<title>` + a handful
 * of SEO/social meta tags on the fly for a given route. Runs as a `useEffect`
 * that:
 *
 *  1. Sets `document.title` on mount.
 *  2. Upserts `<meta name="description">`, `<meta property="og:title">`,
 *     `<meta property="og:description">`, `<meta property="og:type">`,
 *     `<meta property="og:url">`, and `<meta name="twitter:card">`.
 *  3. Restores the *previous* values on unmount so a client-side navigation
 *     back to a page without a metadata hook does not leak the last page's
 *     title/description.
 *
 * We deliberately don't bring in `react-helmet` / `@vueuse/head` — the SPA
 * ships to a static Vercel target, meta tags are set client-side (crawlers
 * that render JS pick them up), and the surface we need per public page is
 * small enough that a 60-line hook beats a dependency.
 *
 * For crawler-friendly server-side rendered metadata (Google's bot renders JS
 * but many others don't), the long-term answer is prerendering or SSR. Until
 * that lands, this hook is the pragmatic middle-ground: correct title +
 * social preview tags for callers who share links.
 */

import { useEffect } from "react";

/** Descriptor for a page's metadata. */
export interface DocumentMetadata {
  /** Page-specific title. Rendered directly (no site-name suffix). */
  title: string;
  /** Search-result / social-preview description. */
  description: string;
  /** Optional site name appended to the title (`title — siteName`). */
  siteName?: string;
  /**
   * OpenGraph type — defaults to `"website"`. Set `"article"` for content
   * pages that would benefit from richer previews.
   */
  ogType?: "website" | "article" | "product";
  /**
   * Canonical URL for the page. Defaults to the current `window.location.href`
   * on mount. Explicit values are useful for tenants on custom domains.
   */
  canonicalUrl?: string;
  /**
   * Preview image URL for social cards. Optional — omit unless a real
   * hosted asset is available (broken images hurt more than no image).
   */
  imageUrl?: string;
}

/** Well-known meta tags this hook manages. */
const MANAGED_TAGS: ReadonlyArray<{
  selector: "name" | "property";
  key: string;
  from: keyof DocumentMetadata;
}> = [
  { selector: "name", key: "description", from: "description" },
  { selector: "property", key: "og:title", from: "title" },
  { selector: "property", key: "og:description", from: "description" },
  { selector: "property", key: "og:type", from: "ogType" },
  { selector: "property", key: "og:url", from: "canonicalUrl" },
  { selector: "property", key: "og:image", from: "imageUrl" },
  { selector: "property", key: "og:site_name", from: "siteName" },
  { selector: "name", key: "twitter:title", from: "title" },
  { selector: "name", key: "twitter:description", from: "description" },
  { selector: "name", key: "twitter:image", from: "imageUrl" },
];

/**
 * Ensures a meta tag with the given selector attribute exists and returns
 * it. Creating the element is idempotent — subsequent calls reuse the
 * existing tag.
 */
function ensureMeta(selector: "name" | "property", key: string): HTMLMetaElement {
  const existing = document.head.querySelector<HTMLMetaElement>(`meta[${selector}="${key}"]`);

  if (existing) {
    return existing;
  }

  const created = document.createElement("meta");

  created.setAttribute(selector, key);
  document.head.appendChild(created);

  return created;
}

/**
 * Manages the document `<title>` + associated meta tags for the current page.
 * Restores prior values on unmount so tag "leakage" between routes doesn't
 * occur when React Router swaps out the tree.
 *
 * @param metadata - Page metadata descriptor.
 */
export function useDocumentMetadata(metadata: DocumentMetadata): void {
  useEffect(() => {
    const composedTitle = metadata.siteName
      ? `${metadata.title} — ${metadata.siteName}`
      : metadata.title;
    const canonicalUrl = metadata.canonicalUrl ?? window.location.href;
    const ogType = metadata.ogType ?? "website";

    // Snapshot the previous state so we can restore on unmount.
    const previous: { title: string; tags: Array<[HTMLMetaElement, string | null]> } = {
      title: document.title,
      tags: [],
    };

    document.title = composedTitle;

    // Build a resolved values map so undefined values remove the tag entirely.
    const resolvedMetadata: DocumentMetadata & { ogType: string; canonicalUrl: string } = {
      ...metadata,
      ogType,
      canonicalUrl,
    };

    for (const { selector, key, from } of MANAGED_TAGS) {
      const value = resolvedMetadata[from];

      if (typeof value !== "string" || value.length === 0) {
        continue;
      }

      const element = ensureMeta(selector, key);

      previous.tags.push([element, element.getAttribute("content")]);
      element.setAttribute("content", value);
    }

    return () => {
      document.title = previous.title;

      for (const [element, prior] of previous.tags) {
        if (prior === null) {
          element.removeAttribute("content");
        } else {
          element.setAttribute("content", prior);
        }
      }
    };
  }, [
    metadata.title,
    metadata.description,
    metadata.siteName,
    metadata.ogType,
    metadata.canonicalUrl,
    metadata.imageUrl,
  ]);
}
