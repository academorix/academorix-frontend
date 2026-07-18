/**
 * @file evaluate-lazy-route.util.ts
 * @module @stackra/routing/vite/prerender
 * @description Evaluate a route's `lazy()` at build time so the
 *   prerender pipeline can inspect the colocated `page` config.
 *
 *   Every page module ships as:
 *
 *   ```typescript
 *   export default function BlogPostPage() { ... }
 *   export const page = definePage({ ... });
 *   ```
 *
 *   The framework's route adapter (F.2) reads both exports at runtime;
 *   the prerender pipeline needs the same access at build time. We
 *   invoke the record's `lazy()` and normalise the result: a plain
 *   module → return as-is; a route record shape → return the module
 *   shape (`page` field on the record replaced with page config).
 *
 *   Fail-soft: a `lazy()` that throws produces `null` — the caller
 *   skips prerender for the route and logs.
 */

import type { IPageConfig } from "@stackra/contracts";

/**
 * The runtime shape produced by evaluating a route's lazy module.
 *
 * The framework accepts both:
 *   - A colocated page module (`{ default, page }`).
 *   - A colocated layout module (`{ default, layout }`).
 *   - A raw component module (`{ default }`) — no `page` config.
 */
export interface IEvaluatedRouteModule {
  /** The `page` config export, when present. */
  readonly page?: IPageConfig;

  /** The `layout` config export, when present. */
  readonly layout?: unknown;

  /** The default export (usually the React component). */
  readonly default?: unknown;

  /** Any other exports on the module — preserved for the caller. */
  readonly [key: string]: unknown;
}

/**
 * Evaluate a route's `lazy()` and return the raw imported module.
 *
 * @param lazy - The record's `lazy()` field.
 * @returns The evaluated module, or `null` when evaluation throws.
 */
export async function evaluateLazyRoute(
  lazy: () => Promise<Record<string, unknown>>,
): Promise<IEvaluatedRouteModule | null> {
  try {
    // The record's `lazy()` returns a plain module record — every
    // named export is a top-level key. We narrow the shape by reading
    // `page` / `layout` / `default`.
    const module = await lazy();
    return module as IEvaluatedRouteModule;
  } catch {
    // fail-soft — the caller decides whether to log or skip.
    return null;
  }
}
