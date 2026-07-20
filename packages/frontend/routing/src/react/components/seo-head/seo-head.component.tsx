/**
 * @file seo-head.component.tsx
 * @module @stackra/routing/react/components/seo-head
 * @description Route-driven SEO renderer.
 *
 *   Walks the current match chain, resolves each match's
 *   `handle[STACKRA_HANDLE].seo` (value or function), merges via the
 *   container's `SeoService`, and renders the resulting tag list
 *   (`<title>`, `<meta>`, `<link>`, JSON-LD `<script>`).
 *
 *   Tag ordering — `buildSeoTags` emits in the canonical order
 *   used by every server-side head serializer:
 *
 *     1. `<title>` (single)
 *     2. `<meta>` — description, keywords, robots
 *     3. `<link rel="canonical">`
 *     4. `<meta>` — OpenGraph, Twitter
 *     5. `<link rel="alternate">` (per-locale)
 *     6. Extra `<meta>` entries
 *     7. `<script type="application/ld+json">` — JSON-LD payloads
 *
 *   Deduplication happens inside `SeoService.collect(...)` — every
 *   tag carries a stable content-hash key so re-renders don't
 *   double-inject.
 *
 *   JSON-LD payloads are emitted through `dangerouslySetInnerHTML`
 *   because the JSON is already stringified and must not be
 *   React-escaped. We DO escape `</script>` embedded in strings
 *   (the standard XSS mitigation for inline JSON payloads) so
 *   user-controlled content can't break out of the `<script>` tag.
 *   The script's `type="application/ld+json"` means CSP treats it
 *   as data, not code — no `unsafe-inline` needed.
 *
 *   Logic-only component per `ui-components.md` — the output is
 *   `<head>` elements, no HeroUI markup applies.
 */

import { createElement, Fragment, type ReactElement } from "react";
import { SEO_SERVICE } from "@stackra/contracts";
import { useContainer } from "@stackra/container/react";

import { STACKRA_HANDLE } from "@/core/constants";
import { resolveValue } from "@/core/utils";
import type { ISeoDescriptor } from "@/seo/interfaces/seo-descriptor.interface";
import type { ISeoTag } from "@/seo/interfaces/seo-tag.interface";
import type { SeoService } from "@/seo/services/seo.service";
import { useLocation, useMatches } from "@/react/react-router-re-exports";

/**
 * Props accepted by `<SeoHead />`.
 */
export interface ISeoHeadProps {
  /**
   * Fallback descriptor applied when no matched route contributes
   * SEO. Layered BELOW the route chain so route values win.
   */
  readonly defaults?: ISeoDescriptor;
}

/**
 * Render the merged SEO payload as `<head>` elements.
 *
 * @param props - Optional fallback descriptor.
 * @returns A React Fragment containing every resolved tag.
 */
export function SeoHead({ defaults }: ISeoHeadProps = {}): ReactElement {
  const container = useContainer();
  const matches = useMatches();
  const location = useLocation();

  // Build a stable URL for the resolver context — the descriptor
  // functions expect a `request` + `url` pair mirroring the RRv7
  // `LoaderFunctionArgs` shape.
  const url = new URL(location.pathname + location.search, "http://placeholder/");
  const request = new Request(url.toString());

  // Build the descriptor chain outermost → innermost so the
  // service's `mergeDescriptors` walks the correct order.
  const chain: ISeoDescriptor[] = [];
  if (defaults) chain.push(defaults);
  for (const match of matches) {
    const stackra = (match.handle as Record<string | symbol, unknown> | undefined)?.[
      STACKRA_HANDLE
    ] as { readonly seo?: unknown } | undefined;
    if (!stackra?.seo) continue;
    const resolved = resolveValue<ISeoDescriptor, unknown>(
      stackra.seo as never,
      {
        data: match.data,
        params: match.params,
        matches,
        request,
        url,
      } as never,
    );
    if (resolved) chain.push(resolved);
  }

  // Reach through the container for the SEO service. Fail-soft:
  // when the service isn't wired (misconfigured module), render the
  // empty fragment so we don't crash the tree.
  let seo: SeoService | undefined;
  try {
    seo = container.get(SEO_SERVICE) as SeoService;
  } catch {
    seo = undefined;
  }
  if (!seo) return createElement(Fragment, null);

  const tags = seo.collect(chain);
  return createElement(Fragment, null, ...tags.map(renderTag));
}

/**
 * Escape `</` in a JSON-LD payload so it cannot break out of the
 * `<script>` tag it will be inlined into.
 *
 * `JSON.stringify` handles `"`, `\`, and control chars but leaves
 * `<` untouched. The classic XSS vector for JSON-in-HTML is a
 * literal `</script>` appearing inside a string field; escaping
 * the slash to `\u003c` neutralises it while remaining valid JSON.
 */
function escapeJsonLd(payload: string): string {
  return payload
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

/**
 * Render a single SEO tag as a React element.
 */
function renderTag(tag: ISeoTag): ReactElement {
  switch (tag.tag) {
    case "title":
      // `<title>` accepts text children only.
      return createElement("title", { key: tag.key }, tag.text ?? "");
    case "script":
      // JSON-LD ships as `application/ld+json` payload. We use
      // `dangerouslySetInnerHTML` because the JSON is already
      // stringified and must not be React-escaped. We DO escape
      // `<`, `>`, `&`, and the JSON-invalid U+2028/U+2029 so the
      // payload cannot break out of the tag OR break `<script>`
      // parsers.
      return createElement("script", {
        key: tag.key,
        ...tag.attrs,
        dangerouslySetInnerHTML: { __html: escapeJsonLd(tag.text ?? "") },
      });
    default:
      // `meta` / `link` — attributes only. React handles void
      // elements natively.
      return createElement(tag.tag, { key: tag.key, ...tag.attrs });
  }
}
