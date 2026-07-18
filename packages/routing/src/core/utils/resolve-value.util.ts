/**
 * @file resolve-value.util.ts
 * @module @stackra/routing/core/utils
 * @description Helper for the "value OR function" fields on
 *   `definePage(...)` / `defineLayout(...)` / `defineRoute(...)`.
 *
 *   Every function-friendly field (`seo`, `breadcrumb`, `analytics`,
 *   `head`, `announce`) may be a literal value OR a factory that
 *   receives the page context. `resolveValue(x, ctx)` unwraps the
 *   function form and returns literals unchanged.
 */

/**
 * Unwrap a "value OR function" argument against the given context.
 *
 * @typeParam TValue   - Static value type.
 * @typeParam TContext - Context type passed to the factory form.
 *
 * @param source - Static value, factory function, or `undefined`.
 * @param ctx    - Context handed to the factory when `source` is a fn.
 * @returns The resolved value, or `undefined` when `source` is unset.
 *
 * @example
 * ```typescript
 * const seo = resolveValue(page.seo, pageContext);
 * // — seo is the static descriptor OR the factory return value.
 * ```
 */
export function resolveValue<TValue, TContext>(
  source: TValue | ((ctx: TContext) => TValue) | undefined,
  ctx: TContext,
): TValue | undefined {
  // Distinguish the callable form from a plain value. Bare `typeof x ===
  // 'function'` is intentional — factory forms are always regular
  // functions (never `class`-shaped objects).
  if (typeof source === "function") {
    return (source as (ctx: TContext) => TValue)(ctx);
  }
  return source;
}
