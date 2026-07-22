/**
 * @file lock-manager.interface.ts
 * @module @stackra/contracts/interfaces/coordinator
 * @description Cross-tab distributed lock contract.
 *
 *   Consumers inject `TAB_LOCK_MANAGER` and type it as `ILockManager`
 *   to gain mutually-exclusive execution of a critical section
 *   across every open browser tab. The concrete implementation
 *   (`LockManager` in `@stackra/coordinator`) uses the Web Locks
 *   API when available with a localStorage-based CAS fallback.
 */

/**
 * Options for a single lock acquisition.
 */
export interface ILockOptions {
  /**
   * Maximum time in milliseconds to wait for the lock. Defaults
   * are implementation-defined (30s in the coordinator's
   * fallback path).
   */
  readonly timeoutMs?: number;
}

/**
 * Cross-tab lock manager contract.
 *
 * Callers pass a callback; the manager guarantees the callback runs
 * with a named exclusive lock held across every open tab. Only the
 * caller's return value is surfaced — lock housekeeping is invisible.
 *
 * @example
 * ```typescript
 * import { TAB_LOCK_MANAGER, type ILockManager } from '@stackra/contracts';
 * import { Optional, Inject } from '@stackra/container';
 *
 * class AuthService {
 *   public constructor(
 *     @Optional() @Inject(TAB_LOCK_MANAGER)
 *     private readonly locks?: ILockManager,
 *   ) {}
 *
 *   public async refresh(): Promise<string> {
 *     if (!this.locks) return this.doRefresh();
 *     return this.locks.run("auth-refresh", () => this.doRefresh(), {
 *       timeoutMs: 5000,
 *     });
 *   }
 * }
 * ```
 */
export interface ILockManager {
  /**
   * Acquire the named lock and execute the callback. Only one tab
   * holds a given lock at a time. Other tabs wait until the lock
   * releases, or the optional timeout fires.
   *
   * @typeParam T - Return type of the callback.
   * @param name - Lock name (descriptive: `"token-refresh"`,
   *   `"db-migration"`).
   * @param callback - Critical section to execute while holding
   *   the lock.
   * @param options - Optional per-call configuration.
   * @returns The callback's return value.
   * @throws When the lock cannot be acquired within `timeoutMs`.
   */
  run<T>(
    name: string,
    callback: () => Promise<T> | T,
    options?: ILockOptions,
  ): Promise<T>;

  /**
   * Best-effort probe — is a lock currently held by any tab?
   *
   * Depending on the underlying primitive (`Web Locks API` vs.
   * `localStorage` fallback), a negative result may be
   * inconclusive. Use for tracing / diagnostics, not synchronization.
   */
  isLocked(name: string): Promise<boolean>;
}
