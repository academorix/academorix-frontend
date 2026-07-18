/**
 * @file index.ts
 * @module @stackra/state/react
 * @description React bindings for the reactive store layer.
 *
 *   Reactive reads (`useStore`, `useStoreValue`) and a direct-dispatch escape
 *   hatch (`useStoreDispatch`). Mutations live in `@stackra/query`
 *   (`useMutation`, with optional optimistic store updates). Import store
 *   read hooks from `@stackra/state/react`.
 *
 *   Also ships the `@stackra/devtools` panel contribution for
 *   `@stackra/state`.
 */

export { useStore, useStoreValue, useStoreDispatch } from './hooks';

// Convenience re-export of the raw TanStack Store hook for advanced use.
export { useStore as useTanStackStore } from '@tanstack/react-store';

// ════════════════════════════════════════════════════════════════════════════════
// Devtools contribution
// ════════════════════════════════════════════════════════════════════════════════
export {
  StateDevtoolsPanel,
  StateDevtoolsPanelView,
  type StateDevtoolsPanelViewProps,
} from './devtools';
