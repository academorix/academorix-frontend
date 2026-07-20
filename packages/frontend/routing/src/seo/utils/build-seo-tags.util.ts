/**
 * @file build-seo-tags.util.ts
 * @module @stackra/routing/seo/utils
 * @description Turn a resolved `ISeoDescriptor` into a flat `ISeoTag[]`.
 *
 *   Framework-neutral output — the same tag list feeds the React
 *   `<SeoHead />` (F.2) and the server-side HTML serializer (F.3).
 */

import type { IJsonLd } from "../interfaces/json-ld.interface";
import type { IRobotsDirective } from "../interfaces/robots-directive.interface";
import type { ISeoDescriptor } from "../interfaces/seo-descriptor.interface";
import type { ISeoTag } from "../interfaces/seo-tag.interface";

/**
 * Resolve the `<title>` string, applying `titleTemplate` if present.
 */
function resolveTitle(desc: ISeoDescriptor): string | undefined {
  if (!desc.title) return undefined;
  // Template only fires when the placeholder is present.
  if (desc.titleTemplate && desc.titleTemplate.includes("%s")) {
    return desc.titleTemplate.replace("%s", desc.title);
  }
  return desc.title;
}

/**
 * Serialize a robots directive to its `content` string.
 */
function resolveRobots(robots: IRobotsDirective): string {
  if (typeof robots === "string") return robots;
  // Emit `index` / `noindex` and `follow` / `nofollow` explicitly so
  // consumers see the exact directive Google will honour.
  const parts: string[] = [];
  parts.push(robots.index === false ? "noindex" : "index");
  parts.push(robots.follow === false ? "nofollow" : "follow");
  if (robots.noarchive) parts.push("noarchive");
  if (robots.nosnippet) parts.push("nosnippet");
  if (typeof robots.maxSnippet === "number") {
    parts.push(`max-snippet:${robots.maxSnippet}`);
  }
  if (robots.maxImagePreview) {
    parts.push(`max-image-preview:${robots.maxImagePreview}`);
  }
  return parts.join(", ");
}

/**
 * Absolutise a possibly-relative URL against `baseUrl`. Uses the
 * platform's `URL` constructor for correctness (matches WHATWG rules).
 * When we later need to append `?utm_*` params or manipulate the URL
 * beyond a simple resolve, wire in `Uri` from `@stackra/support`.
 */
function absolutise(url: string | undefined, baseUrl?: string): string | undefined {
  if (!url) return undefined;
  if (!baseUrl) return url;
  try {
    // WHATWG URL constructor tolerates already-absolute URLs.
    return new URL(url, baseUrl).toString();
  } catch {
    // Malformed relative URL — return as-is rather than crash the
    // whole head render. Broken canonical is a soft failure.
    return url;
  }
}

/**
 * Build the flat tag list from a resolved descriptor.
 *
 * @param desc    - The merged descriptor.
 * @param baseUrl - Optional origin used to absolutise canonical / og:url.
 * @returns Ordered list of tags — order matters for React key stability.
 */
export function buildSeoTags(desc: ISeoDescriptor, baseUrl?: string): ISeoTag[] {
  const tags: ISeoTag[] = [];

  const title = resolveTitle(desc);
  if (title) {
    tags.push({ tag: "title", attrs: {}, text: title, key: "title" });
  }

  if (desc.description) {
    tags.push({
      tag: "meta",
      attrs: { name: "description", content: desc.description },
      key: "desc",
    });
  }

  if (desc.keywords && desc.keywords.length > 0) {
    tags.push({
      tag: "meta",
      attrs: { name: "keywords", content: desc.keywords.join(", ") },
      key: "keywords",
    });
  }

  if (desc.robots) {
    tags.push({
      tag: "meta",
      attrs: { name: "robots", content: resolveRobots(desc.robots) },
      key: "robots",
    });
  }

  const canonical = absolutise(desc.canonical, baseUrl);
  if (canonical) {
    tags.push({
      tag: "link",
      attrs: { rel: "canonical", href: canonical },
      key: "canonical",
    });
  }

  // OpenGraph ─────────────────────────────────────────────────────
  const og = desc.openGraph;
  if (og) {
    pushOg(tags, "title", og.title);
    pushOg(tags, "description", og.description);
    pushOg(tags, "type", og.type);
    pushOg(tags, "url", absolutise(og.url, baseUrl));
    pushOg(tags, "site_name", og.siteName);
    pushOg(tags, "locale", og.locale);
    for (const [i, image] of (og.images ?? []).entries()) {
      // Each image emits up to five tags — keep dedupe keys unique so
      // the React key set stays deterministic across renders.
      pushOg(tags, "image", absolutise(image.url, baseUrl), `og:image:${i}`);
      if (image.alt) pushOg(tags, "image:alt", image.alt, `og:image:alt:${i}`);
      if (image.width) {
        pushOg(tags, "image:width", String(image.width), `og:image:w:${i}`);
      }
      if (image.height) {
        pushOg(tags, "image:height", String(image.height), `og:image:h:${i}`);
      }
      if (image.type) {
        pushOg(tags, "image:type", image.type, `og:image:t:${i}`);
      }
    }
    for (const [key, value] of Object.entries(og.extra ?? {})) {
      pushOg(tags, key, value, `og:extra:${key}`);
    }
  }

  // Twitter ───────────────────────────────────────────────────────
  const tw = desc.twitter;
  if (tw) {
    pushTwitter(tags, "card", tw.card);
    pushTwitter(tags, "site", tw.site);
    pushTwitter(tags, "creator", tw.creator);
    pushTwitter(tags, "title", tw.title);
    pushTwitter(tags, "description", tw.description);
    pushTwitter(tags, "image", absolutise(tw.image, baseUrl));
    pushTwitter(tags, "image:alt", tw.imageAlt);
  }

  // Alternates ────────────────────────────────────────────────────
  for (const [i, alt] of (desc.alternates ?? []).entries()) {
    tags.push({
      tag: "link",
      attrs: {
        rel: "alternate",
        hreflang: alt.hreflang,
        href: absolutise(alt.href, baseUrl) ?? alt.href,
      },
      key: `alt:${i}`,
    });
  }

  // Extra <meta> ──────────────────────────────────────────────────
  for (const [i, m] of (desc.meta ?? []).entries()) {
    tags.push({ tag: "meta", attrs: m, key: `meta:${i}` });
  }

  // JSON-LD ───────────────────────────────────────────────────────
  const jsonLd = normaliseJsonLd(desc.jsonLd);
  for (const [i, doc] of jsonLd.entries()) {
    tags.push({
      tag: "script",
      attrs: { type: "application/ld+json" },
      text: JSON.stringify(withContext(doc)),
      key: `jsonld:${i}`,
    });
  }

  return tags;
}

function pushOg(tags: ISeoTag[], key: string, value: string | undefined, dedupeKey?: string): void {
  if (!value) return;
  tags.push({
    tag: "meta",
    attrs: { property: `og:${key}`, content: value },
    key: dedupeKey ?? `og:${key}`,
  });
}

function pushTwitter(tags: ISeoTag[], key: string, value: string | undefined): void {
  if (!value) return;
  tags.push({
    tag: "meta",
    attrs: { name: `twitter:${key}`, content: value },
    key: `twitter:${key}`,
  });
}

function normaliseJsonLd(value: ISeoDescriptor["jsonLd"]): IJsonLd[] {
  if (!value) return [];
  return Array.isArray(value) ? [...value] : [value as IJsonLd];
}

function withContext(doc: IJsonLd): IJsonLd {
  return doc["@context"] ? doc : { "@context": "https://schema.org", ...doc };
}
