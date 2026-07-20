/**
 * @file mock-snooze-store.ts
 * @module @stackra/notifications/testing
 * @description In-memory snooze store — mirrors the shape returned
 *   by the `useSnoozeStore` hook without touching `localStorage`.
 *
 *   Tests wire this into a jsdom hook wrapper by shimming the
 *   `useSnoozeStore` import with `vi.mock`.
 */

import { SNOOZE_PRESETS_MS } from '@/core/constants';
import type { SnoozePreset } from '@/core/interfaces';

/**
 * In-memory snooze registry.
 */
export class MockSnoozeStore {
  private readonly map = new Map<string, number>();

  /** Whether an id is currently snoozed. */
  public isSnoozed(id: string): boolean {
    const until = this.map.get(id);
    if (until === undefined) return false;
    return until > Date.now();
  }

  /** Snooze `id` by a preset duration. */
  public snooze(id: string, preset: SnoozePreset): void {
    const until = Date.now() + SNOOZE_PRESETS_MS[preset];
    this.map.set(id, until);
  }

  /** Snooze `id` until an arbitrary future timestamp. */
  public snoozeUntil(id: string, until: Date): void {
    this.map.set(id, until.getTime());
  }

  /** Clear the snooze for a single `id`. */
  public unsnooze(id: string): void {
    this.map.delete(id);
  }

  /** Wipe every snooze entry. */
  public clearAll(): void {
    this.map.clear();
  }

  // ── Test hooks ───────────────────────────────────────────────────

  /** Reset internal state. */
  public reset(): void {
    this.map.clear();
  }
}
