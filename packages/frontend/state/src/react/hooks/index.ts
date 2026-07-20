/**
 * @file index.ts
 * @module @stackra/state/react/hooks
 * @description Hooks barrel export for the store layer.
 *
 *   Reactive reads (`useStore`, `useStoreValue`) and the low-level direct
 *   dispatch escape hatch (`useStoreDispatch`). Mutations — optimistic store
 *   writes and server writes — live in `@stackra/query` (`useMutation`).
 */

export { useStore } from './use-store';
export { useStoreValue } from './use-store-value';
export { useStoreDispatch } from './use-store-dispatch';
