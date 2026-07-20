/**
 * @file local-storage.store.ts
 * @module @stackra/storage/react/stores
 * @description `IStorage` backed by `window.localStorage` — the web
 *   default for values that must survive tab close and reload.
 */

import { WebStorageBase } from "./web-storage-base.store";

/**
 * `IStorage` implementation persisting to `window.localStorage`.
 *
 * Values survive browser restarts and are shared across every tab of
 * the same origin. See {@link WebStorageBase} for the full method
 * documentation — this class only wires the backing `Storage`.
 *
 * @example
 * ```typescript
 * // Registered automatically by WebStorageModule.forRoot(); the
 * // manager creates one instance per configured store:
 * @Module({
 *   imports: [
 *     WebStorageModule.forRoot({
 *       default: 'preferences',
 *       stores: { preferences: { driver: 'localStorage', prefix: 'app:prefs' } },
 *     }),
 *   ],
 * })
 * export class AppModule {}
 * ```
 */
export class LocalStorageStore extends WebStorageBase {
  /** @inheritdoc */
  protected override getBackingStore(): Storage | null {
    // Feature-detect: SSR has no window, private mode / iOS may
    // throw on access, some environments proxy the API and return
    // null-like values. All handled by the base class's fail-soft
    // paths — we only need to gate the reference itself.
    if (typeof window === "undefined") return null;
    try {
      return window.localStorage;
    } catch {
      return null;
    }
  }
}
