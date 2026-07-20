/**
 * @file index.ts
 * @module @stackra/query/react
 * @description Public API for `@stackra/query/react`.
 *
 *   TanStack Query does the heavy lifting under the hood. The hooks
 *   wrap `@tanstack/react-query`'s primitives with three Stackra
 *   add-ons: optional state-store write, `liveMode` realtime
 *   invalidation, and pessimistic/optimistic/undoable mutation
 *   modes.
 *
 *   Wrap your app tree in `<StackraQueryProvider>` once (typically
 *   next to `<ContainerProvider>`); the hooks read the DI-bound
 *   `QueryClient` from React context via TanStack Query's
 *   `<QueryClientProvider>`.
 */

export { StackraQueryProvider, type StackraQueryProviderProps } from './providers';

export { useQuery, type UseQueryReturn } from './hooks';
export {
  useMutation,
  type UseMutationOptions,
  type UseMutationResult,
  type UseMutationOptimistic,
} from './hooks';
export { useLiveSubscription, type UseLiveSubscriptionOptions } from './hooks';
export { usePublish, type UsePublishOptions, type PublishLiveEvent } from './hooks';

// ════════════════════════════════════════════════════════════════════════════════
// Devtools contribution
// ════════════════════════════════════════════════════════════════════════════════
export {
  QueryDevtoolsPanel,
  QueryDevtoolsPanelView,
  type QueryDevtoolsPanelViewProps,
} from './devtools';
