/**
 * @file theme-service.token.ts
 * @module @academorix/dashboard/tokens
 * @description Injection token for the {@link ThemeService} — resolved via
 *   `useInject(THEME_SERVICE)` (React) or `@Inject(THEME_SERVICE)` (class).
 *
 *   Kept as an opaque `Symbol()` (never a string) so cross-package callers
 *   cannot accidentally shadow the binding, and so devtools can print the
 *   token's description in a resolution graph.
 */

/**
 * DI token bound to `ThemeService`. Consumers inject through this token to
 * decouple from the concrete class — an alternate implementation can be
 * wired at test time via a `useValue` override.
 */
export const THEME_SERVICE: unique symbol = Symbol("THEME_SERVICE");
