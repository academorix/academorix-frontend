/**
 * @file use-devtools-search.hook.ts
 * @module @stackra/devtools/react/hooks
 * @description Read + write the panel-search query.
 *
 *   The search string lives on the persisted frame state so it
 *   survives a full reload — a happy accident, since a user
 *   filtering the rail for "cache" often reloads mid-session and
 *   would find the filter reset frustrating.
 */

import { useCallback } from 'react';

import { useDevtoolsFrameState } from './use-devtools-frame-state.hook';

/** Result returned by {@link useDevtoolsSearch}. */
export interface IUseDevtoolsSearchResult {
  /** Current query. */
  readonly query: string;
  /** Update the query. Persists via the frame-state service. */
  readonly setQuery: (next: string) => void;
  /** Reset to the empty string. */
  readonly clear: () => void;
}

/**
 * Read + write the panel-search query.
 */
export function useDevtoolsSearch(): IUseDevtoolsSearchResult {
  const { state, update } = useDevtoolsFrameState();

  const setQuery = useCallback((next: string) => update({ searchQuery: next }), [update]);
  const clear = useCallback(() => update({ searchQuery: '' }), [update]);

  return { query: state.searchQuery, setQuery, clear };
}
