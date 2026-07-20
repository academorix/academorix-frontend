/**
 * @file create-mock-registry.ts
 * @module @stackra/actions/testing
 * @description In-memory mock action registry for unit tests.
 */

import type { IActionHandler } from '@stackra/contracts';

/**
 * Public surface of the mock action registry.
 */
export interface IMockRegistry {
  register(kind: string, handler: IActionHandler): void;
  resolve(kind: string): IActionHandler | undefined;
  has(kind: string): boolean;
  unregister(kind: string): boolean;
  clear(): void;
  /** Every kind currently registered. */
  kinds(): string[];
}

/**
 * Create a bare Map-backed mock action registry for tests.
 */
export function createMockRegistry(): IMockRegistry {
  const store = new Map<string, IActionHandler>();
  return {
    register(kind, handler) {
      store.set(kind, handler);
    },
    resolve(kind) {
      return store.get(kind);
    },
    has(kind) {
      return store.has(kind);
    },
    unregister(kind) {
      return store.delete(kind);
    },
    clear() {
      store.clear();
    },
    kinds() {
      return Array.from(store.keys());
    },
  };
}
