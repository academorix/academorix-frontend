/**
 * @file i18n-resolver.interface.ts
 * @module @stackra/i18n/core/interfaces
 * @description Contract for locale resolvers.
 *   Resolvers detect the user's preferred locale from various sources
 *   (localStorage, browser navigator, URL, cookies, device settings, HTTP headers).
 *   They are tried in order — the first non-undefined result wins.
 */

/**
 * Locale resolver contract.
 *
 * Resolvers are tried in priority order (array index). The first resolver
 * that returns a non-undefined value sets the locale. If all resolvers
 * return undefined, the system falls back to `defaultLocale`.
 *
 * All resolvers — web, native, and NestJS — implement this same interface.
 * Platform-specific context (request object, device APIs) is injected via
 * the constructor, not the resolve() method.
 */
export interface II18nResolver {
  /**
   * Attempt to detect the user's preferred locale.
   *
   * @returns The detected locale code (or array in preference order),
   *   or `undefined` if this resolver cannot determine the locale.
   */
  resolve(): string | string[] | undefined;
}

/**
 * Async resolver variant for resolvers that need I/O (AsyncStorage, HTTP headers).
 * Used during app initialization where async is acceptable.
 */
export interface II18nAsyncResolver {
  /**
   * Attempt to detect the user's preferred locale asynchronously.
   *
   * @returns The detected locale code, or undefined
   */
  resolve(): Promise<string | string[] | undefined>;
}

/**
 * Resolver configuration — either a direct class reference or an object
 * with `use` (class) and `options` (constructor arguments).
 *
 * @example
 * ```typescript
 * // Direct class reference
 * resolvers: [NavigatorResolver]
 *
 * // Class with options
 * resolvers: [{ use: LocalStorageResolver, options: { key: 'app_locale' } }]
 * ```
 */
export type I18nResolverConfig =
  | { new (...args: any[]): II18nResolver | II18nAsyncResolver }
  | { use: { new (...args: any[]): II18nResolver | II18nAsyncResolver }; options?: unknown };
