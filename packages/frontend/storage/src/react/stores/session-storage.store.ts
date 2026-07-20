/**
 * @file session-storage.store.ts
 * @module @stackra/storage/react/stores
 * @description `IStorage` backed by `window.sessionStorage` — values
 *   scoped to a single browser tab, cleared when the tab closes.
 */

import { WebStorageBase } from './web-storage-base.store';

/**
 * `IStorage` implementation persisting to `window.sessionStorage`.
 *
 * Values live only for the current tab session and are cleared when
 * the user closes the tab. Same API as {@link LocalStorageStore} —
 * see {@link WebStorageBase} for the full documentation.
 *
 * @example
 * ```typescript
 * @Module({
 *   imports: [
 *     WebStorageModule.forRoot({
 *       default: 'session',
 *       stores: { session: { driver: 'sessionStorage', prefix: 'app:session' } },
 *     }),
 *   ],
 * })
 * export class AppModule {}
 * ```
 */
export class SessionStorageStore extends WebStorageBase {
  /** @inheritdoc */
  protected override getBackingStore(): Storage | null {
    if (typeof window === 'undefined') return null;
    try {
      return window.sessionStorage;
    } catch {
      return null;
    }
  }
}
