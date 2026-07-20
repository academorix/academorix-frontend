/**
 * @file create-reactive-store.util.ts
 * @module @stackra/state/core/utils
 * @description Wraps a TanStack Store with automatic event emission.
 *
 *   Every `setState()` call on the wrapped store emits `{name}.changed`
 *   through the global event bus, so services that mutate stores never
 *   need manual `events.emit()` calls.
 */

import { Store } from '@tanstack/store';
import { STATE_EVENTS } from '@stackra/contracts';
import type { IEventEmitter } from '@stackra/contracts';

/**
 * Create a TanStack Store that auto-emits `{name}.changed` on every mutation.
 *
 * Wraps `store.setState()` to emit after each state update. The event
 * payload includes the next state, the previous state, and the changed keys.
 *
 * @typeParam S - The state shape.
 * @param name - The store name (used as the event prefix: `{name}.changed`).
 * @param initialState - The initial state.
 * @param emitter - Optional event emitter (no-op when not provided).
 * @returns A TanStack Store with auto-event emission.
 *
 * @example
 * ```typescript
 * const store = createReactiveStore("theme", { mode: "system" }, eventEmitter);
 * store.setState((s) => ({ ...s, mode: "dark" }));
 * // → emits "theme.changed" with { state: { mode: "dark" }, changed: ["mode"] }
 * ```
 */
export function createReactiveStore<S extends Record<string, unknown>>(
  name: string,
  initialState: S,
  emitter?: IEventEmitter | null
): Store<S> {
  const store = new Store<S>(initialState);

  if (!emitter) {
    return store;
  }

  const originalSetState = store.setState.bind(store);

  store.setState = (updater: (state: S) => S) => {
    const prevState = store.state;
    originalSetState(updater);
    const nextState = store.state;

    const changed: string[] = [];
    for (const key of Object.keys(nextState)) {
      if (
        (prevState as Record<string, unknown>)[key] !== (nextState as Record<string, unknown>)[key]
      ) {
        changed.push(key);
      }
    }

    if (changed.length > 0) {
      emitter.emit(`${name}.${STATE_EVENTS.CHANGED}`, {
        name,
        state: nextState,
        changed,
        previous: prevState,
      });
    }
  };

  return store;
}
