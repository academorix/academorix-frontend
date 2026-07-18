/**
 * @file lock-manager.service.ts
 * @module @stackra/coordinator/core/services
 * @description Cross-tab distributed locks using Web Locks API (primary)
 *   with localStorage-based CAS fallback for older browsers.
 *   Provides mutual exclusion for critical sections that should only
 *   run in one tab at a time (token refresh, IndexedDB migration, sync).
 */

import { Injectable, Inject, Optional } from '@stackra/container';
import { COORDINATOR_CONFIG } from '@stackra/contracts';
import { sleep, Str } from '@stackra/support';
import { CoordinatorError } from '@/core/errors';
import type { ICoordinatorModuleOptions, ILockOptions } from '@/core/interfaces';

// ════════════════════════════════════════════════════════════════════════════════
// Types
// ════════════════════════════════════════════════════════════════════════════════

// ════════════════════════════════════════════════════════════════════════════════
// Implementation
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Cross-tab lock manager — mutual exclusion across browser tabs.
 *
 * Uses Web Locks API when available (race-free, OS-level), falls back
 * to localStorage-based compare-and-swap for older browsers.
 *
 * @example
 * ```typescript
 * const lockManager = container.get(LockManager);
 *
 * // Only one tab refreshes the token at a time
 * const token = await lockManager.run('token-refresh', async () => {
 *   return await authService.refreshToken();
 * });
 *
 * // With timeout
 * await lockManager.run('db-migration', async () => {
 *   await runMigrations();
 * }, { timeoutMs: 10000 });
 * ```
 */
@Injectable()
export class LockManager {
  /** Whether to prefer Web Locks API. */
  private readonly preferWebLocks: boolean;

  /** Channel name prefix for lock keys. */
  private readonly channelName: string;

  /**
   * @param config - Module configuration (optional)
   */
  public constructor(@Optional() @Inject(COORDINATOR_CONFIG) config?: ICoordinatorModuleOptions) {
    this.preferWebLocks = config?.preferWebLocks ?? true;
    this.channelName = config?.channelName ?? 'stackra-coordinator';
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // Public API
  // ══════════════════════════════════════════════════════════════════════════════

  /**
   * Acquire a named lock and execute the callback.
   *
   * Only one tab can hold a given lock at a time. Other tabs wait
   * until the lock is released (or timeout fires).
   *
   * @typeParam T - Return type of the callback
   * @param name - Lock name (descriptive: 'token-refresh', 'db-migration')
   * @param callback - Critical section to execute while holding the lock
   * @param options - Lock options (timeout)
   * @returns The callback's return value
   * @throws {CoordinatorError} If lock cannot be acquired within timeout
   */
  public async run<T>(
    name: string,
    callback: () => Promise<T> | T,
    options: ILockOptions = {}
  ): Promise<T> {
    const lockName = `${this.channelName}:lock:${name}`;

    if (this.preferWebLocks && this.isWebLocksAvailable()) {
      return this.runWithWebLocks(lockName, callback, options);
    }

    return this.runWithLocalStorage(lockName, callback, options);
  }

  /**
   * Check if a lock is currently held (best-effort, Web Locks only).
   *
   * @param name - Lock name to check
   * @returns `true` if the lock is held by any tab
   */
  public async isLocked(name: string): Promise<boolean> {
    if (!this.isWebLocksAvailable()) return false;
    const lockName = `${this.channelName}:lock:${name}`;
    const state = await navigator.locks.query();
    return state.held?.some((lock) => lock.name === lockName) ?? false;
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // Private — Web Locks Implementation
  // ══════════════════════════════════════════════════════════════════════════════

  /** Acquire lock using the Web Locks API. */
  private async runWithWebLocks<T>(
    lockName: string,
    callback: () => Promise<T> | T,
    options: ILockOptions
  ): Promise<T> {
    const { timeoutMs } = options;
    const lockOpts: { mode: 'exclusive'; signal?: AbortSignal } = { mode: 'exclusive' };

    if (timeoutMs && timeoutMs > 0) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      lockOpts.signal = controller.signal;

      try {
        return await navigator.locks.request(lockName, lockOpts, async () => {
          clearTimeout(timer);
          return await callback();
        });
      } catch (error: unknown) {
        clearTimeout(timer);
        if (error instanceof Error && error.name === 'AbortError') {
          throw new CoordinatorError(
            `Lock "${lockName}" acquisition timed out after ${timeoutMs}ms`,
            'LOCK_TIMEOUT',
            { lockName, timeoutMs }
          );
        }
        throw error;
      }
    }

    return navigator.locks.request(lockName, lockOpts, async () => {
      return await callback();
    });
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // Private — localStorage Fallback (P1.h — DEFERRED)
  //
  // Direct localStorage access is INTENTIONAL here and deliberately
  // does NOT route through @stackra/storage. Reasoning:
  //
  // 1. This is a FALLBACK — it only runs when Web Locks are
  //    unavailable (older browsers). Web Locks is the primary path
  //    on every modern browser.
  // 2. The CAS algorithm relies on best-effort read-then-write
  //    ordering — neither localStorage nor IStorage provide true
  //    atomicity, but localStorage's synchronous, unwrapped shape
  //    keeps the algorithm as tight as possible.
  // 3. IStorage's TTL envelope + prefix machinery would add JSON
  //    encoding / decoding overhead per CAS iteration for no gain.
  // 4. Coordinator's fallback path should stay usable in headless
  //    contexts without requiring @stackra/storage to be wired.
  //
  // (See .kiro/audit/pattern-alignment-tasks-2026-07-14.md — P1.h.)
  // ══════════════════════════════════════════════════════════════════════════════

  /** Acquire lock using localStorage-based CAS (compare-and-swap). */
  private async runWithLocalStorage<T>(
    lockName: string,
    callback: () => Promise<T> | T,
    options: ILockOptions
  ): Promise<T> {
    const timeoutMs = options.timeoutMs ?? 30000;
    const lockKey = `__lock__${lockName}`;
    // Namespaced lock owner id — Str.uuid() gives us the same
    // uniqueness guarantee the old timestamp+Math.random string had.
    const lockValue = Str.uuid();
    const lockExpiry = 30000; // Safety: lock auto-expires after 30s
    const startTime = Date.now();

    while (true) {
      const existing = this.getStorageLock(lockKey);

      if (!existing || Date.now() - existing.at > lockExpiry) {
        // Lock is free or expired — claim it
        this.setStorageLock(lockKey, lockValue);
        await sleep(50); // Brief pause for CAS
        const check = this.getStorageLock(lockKey);

        if (check && check.value === lockValue) {
          // We acquired the lock
          try {
            return await callback();
          } finally {
            this.clearStorageLock(lockKey, lockValue);
          }
        }
      }

      // Check timeout
      if (Date.now() - startTime > timeoutMs) {
        throw new CoordinatorError(
          `Lock "${lockName}" acquisition timed out after ${timeoutMs}ms (fallback)`,
          'LOCK_TIMEOUT',
          { lockName, timeoutMs }
        );
      }

      // Wait with jitter and retry
      await sleep(100 + Math.random() * 100);
    }
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // Private — Helpers
  // ══════════════════════════════════════════════════════════════════════════════

  private isWebLocksAvailable(): boolean {
    return typeof navigator !== 'undefined' && 'locks' in navigator;
  }

  private getStorageLock(key: string): { value: string; at: number } | null {
    if (typeof localStorage === 'undefined') return null;
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  private setStorageLock(key: string, value: string): void {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(key, JSON.stringify({ value, at: Date.now() }));
    } catch {
      /* quota */
    }
  }

  private clearStorageLock(key: string, expectedValue: string): void {
    if (typeof localStorage === 'undefined') return;
    try {
      const existing = this.getStorageLock(key);
      if (existing && existing.value === expectedValue) localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  }
}
