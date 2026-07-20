/**
 * @file device-locale.resolver.ts
 * @module @stackra/i18n/native/resolvers
 * @description Resolves locale from the device's system language using
 *   `expo-localization`. Native equivalent of the web's `NavigatorResolver`
 *   (which reads `navigator.language`).
 *
 *   ## Resolution Order
 *
 *   The device may have multiple preferred languages (e.g., Arabic first,
 *   English second). `resolve()` checks each against the app's
 *   `supportedLocales` and returns the first match — either exact
 *   (e.g., `ar-SA`) or base language (e.g., `ar`).
 *
 *   ## Async peer, sync API
 *
 *   `expo-localization` is an **optional peer** loaded lazily via
 *   `await import(...)`. `resolve()` is sync; call `preload()` during
 *   app init (before the first render) so the module is cached and
 *   `resolve()` can read from it synchronously.
 *
 *   ## Requires
 *
 *   - `expo-localization` (optional peer, installed in Expo projects)
 *
 *   ## Usage
 *
 *   ```typescript
 *   import { DeviceLocaleResolver } from '@stackra/i18n/native';
 *
 *   const resolver = new DeviceLocaleResolver(['en', 'ar', 'fr']);
 *   await resolver.preload();
 *   const locale = resolver.resolve(); // "ar" if device is set to Arabic
 *   ```
 */

/**
 * Minimal subset of `expo-localization`'s public API — decoupled from
 * the real types because the package is an optional peer.
 */
interface IExpoLocalization {
  getLocales(): Array<{ languageTag: string; languageCode: string }>;
}

/**
 * Resolves the locale from the device's system language settings.
 *
 * Uses `expo-localization` to read the device's language preferences.
 * Checks each device locale against the supported list — exact match
 * first, then base language fallback (e.g., `ar-SA` → `ar`).
 */
export class DeviceLocaleResolver {
  private readonly supportedLocales: string[];

  /** Cached module reference, populated by `preload()`. */
  private localization: IExpoLocalization | null = null;

  /**
   * @param supportedLocales - Array of locale codes the app supports
   */
  public constructor(supportedLocales: string[]) {
    this.supportedLocales = supportedLocales;
  }

  /**
   * Preload `expo-localization` so `resolve()` can read from the cached
   * module synchronously. Call this during app initialization (before
   * the first render).
   *
   * Fail-soft: when the peer isn't installed / can't be resolved,
   * `resolve()` returns `undefined` and the resolver chain moves on.
   */
  public async preload(): Promise<void> {
    try {
      // Variable specifier keeps TS from statically requiring the
      // optional peer — the module resolves at runtime on Expo targets
      // where it's installed, and rejects (caught below) elsewhere.
      const moduleName = 'expo-localization';
      const mod = (await import(/* @vite-ignore */ moduleName)) as
        { default?: IExpoLocalization } | IExpoLocalization;
      this.localization =
        'default' in mod && mod.default ? mod.default : (mod as IExpoLocalization);
    } catch {
      // Peer not available (running outside Expo/RN) — leave the cache
      // null; resolve() will return undefined.
      this.localization = null;
    }
  }

  /**
   * Resolve the device locale.
   *
   * Returns `undefined` when the module hasn't been preloaded yet, when
   * no device locale matches `supportedLocales`, or when the peer isn't
   * available.
   *
   * @returns The matched locale code, or undefined if no match
   */
  public resolve(): string | undefined {
    if (!this.localization) return undefined;

    try {
      const deviceLocales = this.localization.getLocales();

      for (const deviceLocale of deviceLocales) {
        const tag = deviceLocale.languageTag; // e.g., "ar-SA"
        const base = deviceLocale.languageCode; // e.g., "ar"

        // Exact match (e.g., "ar-SA" in supported)
        if (tag && this.supportedLocales.includes(tag)) {
          return tag;
        }

        // Base language match (e.g., "ar" in supported)
        if (base && this.supportedLocales.includes(base)) {
          return base;
        }
      }

      return undefined;
    } catch {
      // Localization API threw at read time — fall through to the next
      // resolver in the chain.
      return undefined;
    }
  }
}
