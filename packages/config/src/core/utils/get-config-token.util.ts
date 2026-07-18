/**
 * @file get-config-token.util.ts
 * @module @stackra/config/core/utils
 * @description Derives the string DI token for a namespaced config
 *   factory. Consumers rarely call this directly — `registerAs`
 *   stamps the derived token onto the returned factory as `.KEY`.
 *
 * @derived @nestjs/config@4.0.4 — lib/utils/get-config-token.util.ts (MIT, © Kamil Myśliwiec)
 */

/**
 * Derive the string DI token for a namespace.
 *
 * Matches nestjs's convention: `CONFIGURATION(<namespace>)`. Symbols
 * are converted through their `.description` (or `String(token)` as
 * a last resort) so the token is stringly-typed but stable across
 * bundle boundaries.
 *
 * @param token - Namespace passed to `registerAs`.
 * @returns The string DI token consumers `@Inject(...)` when they
 *   don't hold a reference to the factory.
 *
 * @example
 * ```typescript
 * getConfigToken('cache'); // 'CONFIGURATION(cache)'
 * getConfigToken(Symbol('cache')); // 'CONFIGURATION(Symbol(cache))'
 * ```
 */
export function getConfigToken(token: string | symbol): string {
  // Use `.toString()` — for a string this returns the string itself,
  // for a symbol it returns `Symbol(description)`. Matches nestjs
  // verbatim.
  return `CONFIGURATION(${token.toString()})`;
}
