/**
 * @file mock-consent-storage-adapter.ts
 * @module @stackra/consent/testing
 * @description In-memory `IConsentStorageAdapter` for tests.
 *
 *   Same behaviour as the production `MemoryConsentAdapter` but lives in
 *   the `./testing` subpath so consumers don't accidentally import a
 *   test double from the runtime barrel. Records every `load` / `save` /
 *   `clear` call on `.calls` for assertions.
 */

import type { IConsentStorageAdapter } from "@stackra/contracts";

/** A recorded storage-adapter call. */
export type RecordedStorageCall =
  { kind: "load" } | { kind: "save"; prefs: Record<string, boolean> } | { kind: "clear" };

/**
 * In-memory consent storage adapter for testing.
 *
 * @example
 * ```ts
 * const adapter = new MockConsentStorageAdapter({ analytics: true });
 * expect(await adapter.load()).toEqual({ analytics: true });
 * await adapter.save({ analytics: false });
 * expect(adapter.calls).toHaveLength(2);
 * ```
 */
export class MockConsentStorageAdapter implements IConsentStorageAdapter {
  /** Recorded calls in order. */
  public readonly calls: RecordedStorageCall[] = [];

  /** Internal store. Set to `null` for "nothing persisted". */
  private store: Record<string, boolean> | null;

  public constructor(seed?: Record<string, boolean> | null) {
    this.store = seed ? { ...seed } : null;
  }

  public async load(): Promise<Record<string, boolean> | null> {
    this.calls.push({ kind: "load" });
    return this.store ? { ...this.store } : null;
  }

  public async save(prefs: Record<string, boolean>): Promise<void> {
    this.calls.push({ kind: "save", prefs: { ...prefs } });
    this.store = { ...prefs };
  }

  public async clear(): Promise<void> {
    this.calls.push({ kind: "clear" });
    this.store = null;
  }

  // ── Test hooks ────────────────────────────────────────────────────────

  /** Peek at the currently-persisted preferences without recording a call. */
  public peek(): Record<string, boolean> | null {
    return this.store ? { ...this.store } : null;
  }

  /** Reset call history and clear stored preferences. */
  public reset(): void {
    this.calls.length = 0;
    this.store = null;
  }
}
