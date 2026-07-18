/**
 * @file state-devtools-panel-view.component.tsx
 * @module @stackra/state/react/devtools
 * @description React body of the `@stackra/devtools` state panel.
 *
 *   Renders one {@link Card} per registered store, showing the store
 *   name, the DI token's symbol description, and a preformatted JSON
 *   snapshot of the current state. Each store subscribes to its own
 *   TanStack `Store` via `useSyncExternalStore` — `Store<T>` exposes
 *   `state` + `subscribe(listener)`, which map cleanly to
 *   `getSnapshot` / `subscribe`. This keeps snapshots tearing-free
 *   under concurrent React without pulling `@tanstack/react-store`
 *   into this package's runtime.
 *
 *   The JSON preview is bounded — the underlying store may be
 *   arbitrarily deep, so we serialise it with a `replacer` that
 *   collapses anything beyond three levels to a placeholder. Devtools
 *   users get a preview; the full snapshot is available through
 *   `registry.snapshot()` (imperative) or via the store's own token.
 */

import { type ReactElement, useCallback, useSyncExternalStore } from 'react';
import { Card, Chip } from '@stackra/ui/react';
import type { Store } from '@tanstack/store';

import type { StoreEntry } from '@/core/registries/state.registry';
import type { StateDevtoolsPanelViewProps } from './state-devtools-panel-view.interface';

/** How many levels deep to keep in the JSON preview. */
const PREVIEW_DEPTH = 3;

/**
 * Serialise a store's current state to a bounded-depth JSON string.
 *
 * Uses `JSON.stringify` with a `replacer` that counts nesting and
 * substitutes `'[…]'` past the depth threshold. Circular refs are
 * caught defensively — a `WeakSet` tracks seen objects and any
 * repeat is rendered as `'[Circular]'`. `undefined` values become
 * `null` so keys don't drop silently.
 */
function previewState(value: unknown): string {
  const seen = new WeakSet<object>();
  let depth = 0;
  const stack: unknown[] = [];
  const replacer = (_key: string, val: unknown): unknown => {
    // Track depth by watching the input list — every `[` pushes one.
    // JSON.stringify walks depth-first, so a hand-rolled counter is
    // less error-prone than trying to read the `this` context.
    if (val && typeof val === 'object') {
      if (seen.has(val as object)) return '[Circular]';
      seen.add(val as object);
      // Only push a real object; primitives don't count for depth.
      stack.push(val);
      depth = stack.length;
      if (depth > PREVIEW_DEPTH) {
        // Truncate — remove the marker from `seen` so subsequent
        // sibling objects still get serialised.
        seen.delete(val as object);
        stack.pop();
        depth = stack.length;
        return '[…]';
      }
    }
    return val === undefined ? null : val;
  };
  try {
    return JSON.stringify(value, replacer, 2);
  } catch {
    // Non-serialisable value (function, DOM node) — fall back to
    // a short marker so the panel still renders.
    return '[unserialisable]';
  }
}

/**
 * A single store card. One instance per store; subscribes to its own
 * `Store<T>.subscribe` for tearing-free reads under concurrent React.
 */
function StoreCard({ entry }: { entry: StoreEntry }): ReactElement {
  const store = entry.store as Store<unknown>;
  // Stable subscribe / getSnapshot callbacks — required by
  // `useSyncExternalStore` to keep the subscription attached
  // across renders. TanStack `Store.subscribe` returns a
  // `Subscription { unsubscribe }` object, so we wrap it in a
  // teardown thunk to match `useSyncExternalStore`'s expected
  // `() => () => void` shape.
  const subscribe = useCallback(
    (cb: () => void): (() => void) => {
      const sub = store.subscribe(cb);
      return () => sub.unsubscribe();
    },
    [store]
  );
  const getSnapshot = useCallback(() => store.state, [store]);
  const state = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const tokenLabel =
    typeof entry.token === 'symbol' ? (entry.token.description ?? 'Symbol()') : String(entry.token);

  return (
    <Card>
      <Card.Header>
        <div className="flex items-center gap-2">
          <Card.Title className="text-sm">{entry.name}</Card.Title>
          <Chip size="sm" variant="secondary">
            <Chip.Label>{tokenLabel}</Chip.Label>
          </Chip>
        </div>
        <Card.Description>
          Current snapshot (preview truncated to {PREVIEW_DEPTH} levels deep).
        </Card.Description>
      </Card.Header>
      <Card.Content>
        <pre className="overflow-x-auto text-xs text-foreground">
          <code>{previewState(state)}</code>
        </pre>
      </Card.Content>
    </Card>
  );
}

/**
 * The state devtools panel body.
 *
 * @param props - See {@link StateDevtoolsPanelViewProps}.
 * @returns The panel body — a stack of one card per registered store.
 */
export function StateDevtoolsPanelView({ registry }: StateDevtoolsPanelViewProps): ReactElement {
  if (!registry) {
    return (
      <div className="flex flex-col gap-3">
        <Card>
          <Card.Header>
            <Card.Title>State registry not available</Card.Title>
            <Card.Description>
              Wire <code>StateModule.forRoot()</code> to see registered stores here.
            </Card.Description>
          </Card.Header>
        </Card>
      </div>
    );
  }

  // The registry itself isn't subscribable, but each store is; the
  // `useSyncExternalStore` inside `StoreCard` handles live updates.
  // The registry's `getAll()` result is snapshot-safe — new stores
  // register during `onModuleInit`, which happens before this view
  // mounts, so re-mounting the panel picks up any late registrations.
  const entries = registry.getAll();

  if (entries.length === 0) {
    return (
      <div className="flex flex-col gap-3">
        <Card>
          <Card.Header>
            <Card.Title>No stores registered</Card.Title>
            <Card.Description>
              Register a store with{' '}
              <code>StateModule.forFeature(&#123; name, token, initialState &#125;)</code> to see it
              here.
            </Card.Description>
          </Card.Header>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <header>
        <h3 className="text-base font-semibold text-foreground">State stores</h3>
        <p className="text-xs text-muted">
          Reactive stores registered via <code>StateModule.forFeature()</code>. Every card is a live
          view — mutations reflect immediately via each store&apos;s <code>subscribe</code> API.
        </p>
      </header>
      {entries.map((entry) => (
        <StoreCard key={entry.name} entry={entry} />
      ))}
    </div>
  );
}
