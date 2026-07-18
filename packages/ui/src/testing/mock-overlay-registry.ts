/**
 * @file mock-overlay-registry.ts
 * @module @stackra/ui/testing
 * @description In-memory `IOverlayRegistry` implementation for tests.
 *
 *   Same insertion-ordered `Map` backing as the real `OverlayRegistry`,
 *   plus a recorded call log so tests can assert on which overlays were
 *   opened / closed and in what order.
 */

import type { IOverlayRegistry } from "@stackra/contracts";

/** A recorded overlay-registry call. */
export type RecordedOverlayCall =
  | { kind: "open"; overlayId: string; payload?: unknown }
  | { kind: "close"; overlayId: string }
  | { kind: "closeTop"; closedId: string | null };

/**
 * In-memory overlay registry for testing.
 *
 * @example
 * ```ts
 * const overlays = new MockOverlayRegistry();
 * overlays.open('confirm', { reason: 'delete' });
 * expect(overlays.isOpen('confirm')).toBe(true);
 * overlays.closeTop();
 * expect(overlays.isOpen('confirm')).toBe(false);
 * ```
 */
export class MockOverlayRegistry implements IOverlayRegistry {
  /** Recorded call log. */
  public readonly calls: RecordedOverlayCall[] = [];

  private readonly openMap = new Map<string, unknown>();
  private readonly listeners = new Set<(open: ReadonlySet<string>) => void>();

  public open(overlayId: string, payload?: unknown): void {
    this.calls.push({ kind: "open", overlayId, payload });
    this.openMap.set(overlayId, payload);
    this.notify();
  }

  public close(overlayId: string): void {
    this.calls.push({ kind: "close", overlayId });
    if (this.openMap.delete(overlayId)) this.notify();
  }

  public closeTop(): void {
    const closedId = Array.from(this.openMap.keys()).pop() ?? null;
    this.calls.push({ kind: "closeTop", closedId });
    if (closedId !== null) {
      this.openMap.delete(closedId);
      this.notify();
    }
  }

  public isOpen(overlayId: string): boolean {
    return this.openMap.has(overlayId);
  }

  public getPayload(overlayId: string): unknown {
    return this.openMap.get(overlayId);
  }

  public subscribe(listener: (open: ReadonlySet<string>) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  // ── Test hooks ────────────────────────────────────────────────────────

  /** Currently-open overlay ids in insertion order. */
  public getOpenIds(): string[] {
    return Array.from(this.openMap.keys());
  }

  /** Reset call log + open state. */
  public reset(): void {
    this.calls.length = 0;
    this.openMap.clear();
  }

  private notify(): void {
    const snapshot = new Set(this.openMap.keys());
    for (const listener of this.listeners) {
      try {
        listener(snapshot);
      } catch {
        // A subscriber error must not break the mock.
      }
    }
  }
}
