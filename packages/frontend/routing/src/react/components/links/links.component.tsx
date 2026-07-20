/**
 * @file links.component.tsx
 * @module @stackra/routing/react/components/links
 * @description Framework `<Links />` — resolves each match's
 *   `head` field per PLAN §21 and renders every entry as a `<link>`.
 *
 *   The `head` field accepts a static array OR a factory
 *   `(ctx) => ILinkTag[]`. We resolve the factory form via
 *   `resolveValue` against the match's page context.
 *
 *   Logic-only component per `ui-components.md` — output is
 *   `<head>`-level `<link>` elements only.
 */

import { createElement, Fragment, type ReactElement } from "react";
import type { ILinkTag } from "@stackra/contracts";
import { useLocation, useMatches } from "react-router";

import { STACKRA_HANDLE } from "@/core/constants";
import { resolveValue } from "@/core/utils";

/**
 * Render the aggregated `head` link tags for the current match chain.
 *
 * @returns A React Fragment containing every resolved `<link>` tag.
 */
export function Links(): ReactElement {
  const matches = useMatches();
  const location = useLocation();

  const url = new URL(location.pathname + location.search, "http://placeholder/");
  const request = new Request(url.toString());

  const tags: ILinkTag[] = [];
  for (const match of matches) {
    const stackra = (match.handle as Record<string | symbol, unknown> | undefined)?.[
      STACKRA_HANDLE
    ] as { readonly head?: unknown } | undefined;
    if (!stackra?.head) continue;
    const resolved = resolveValue<readonly ILinkTag[], unknown>(
      stackra.head as never,
      {
        data: match.data,
        params: match.params,
        matches,
        request,
        url,
      } as never,
    );
    if (Array.isArray(resolved)) tags.push(...resolved);
  }

  return createElement(
    Fragment,
    null,
    ...tags.map((tag, index) =>
      createElement("link", {
        // Composite key — `rel + href` catches most dedupe cases
        // without an extra hash pass. Index tie-breaks identical
        // entries.
        key: `${tag.rel}:${tag.href}:${index}`,
        rel: tag.rel,
        href: tag.href,
        ...(tag.as ? { as: tag.as } : {}),
        ...(tag.type ? { type: tag.type } : {}),
        ...(tag.crossOrigin ? { crossOrigin: tag.crossOrigin } : {}),
        ...(tag.hreflang ? { hrefLang: tag.hreflang } : {}),
        ...(tag.media ? { media: tag.media } : {}),
        ...(tag.integrity ? { integrity: tag.integrity } : {}),
        ...(tag.sizes ? { sizes: tag.sizes } : {}),
      }),
    ),
  );
}
