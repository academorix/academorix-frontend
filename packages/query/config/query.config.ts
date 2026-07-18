/**
 * @file query.config.ts
 * @module @stackra/query/config
 * @description Application-level TanStack Query configuration.
 *   Consumed by `QueryModule.forRoot()` at bootstrap.
 */

import type { QueryModuleOptions } from '@stackra/query';

export const queryConfig: QueryModuleOptions = {
  /*
  |--------------------------------------------------------------------------
  | Default Stale Time (ms)
  |--------------------------------------------------------------------------
  |
  | How long a query result is considered fresh before it's refetched
  | in the background on next access. Individual `useQuery` calls can
  | override.
  |
  */
  defaultStaleTime: 30_000,

  /*
  |--------------------------------------------------------------------------
  | Default Refetch Interval (ms)
  |--------------------------------------------------------------------------
  |
  | Polling cadence for every query without its own `refetchInterval`.
  | `0` disables global polling; per-query polling still works.
  |
  */
  defaultRefetchInterval: 0,

  /*
  |--------------------------------------------------------------------------
  | Refetch on Window Focus
  |--------------------------------------------------------------------------
  |
  | When true, active queries refire when the tab regains focus.
  |
  */
  refetchOnWindowFocus: false,

  /*
  |--------------------------------------------------------------------------
  | Default Mutation Mode
  |--------------------------------------------------------------------------
  |
  | Fallback mode `useMutation` uses when the call site omits
  | `mutationMode`. `'pessimistic'` is safe; consumers opt into
  | `'optimistic'` / `'undoable'` per mutation.
  |
  */
  defaultMutationMode: 'pessimistic',

  /*
  |--------------------------------------------------------------------------
  | Undoable Timeout (ms)
  |--------------------------------------------------------------------------
  |
  | Countdown for `useMutation({ mutationMode: 'undoable' })`. Users
  | have this long to cancel via the toast before the persist fires.
  |
  */
  undoableTimeout: 5000,

  /*
  |--------------------------------------------------------------------------
  | Default Live Mode
  |--------------------------------------------------------------------------
  |
  | Reaction mode when a live event lands on a query's subscribed
  | channel. `'off'` disables live-invalidation by default.
  |
  */
  defaultLiveMode: 'off',
};
