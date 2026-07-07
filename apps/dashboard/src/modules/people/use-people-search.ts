/**
 * @file use-people-search.ts
 * @module modules/people/use-people-search
 *
 * @description
 * Debounced search wrapper around Refine's `useList<Person>`. Callers pass
 * the raw input value; this hook debounces it (default 300ms) and issues a
 * single list query with a `q` filter — matching the shape backend endpoints
 * conventionally accept (`GET /api/v1/people?filter[q]=...`).
 *
 * The query is disabled while the debounced value is shorter than
 * {@link DEFAULT_MIN_QUERY_LENGTH} characters so a trivial keystroke (`"j"`)
 * does not fan out into a wide, cross-tenant table scan.
 *
 * TODO(backend-endpoint): `GET /api/v1/people`. Until the backend ships,
 * the query resolves against the shared data provider and gracefully
 * surfaces 404/501 via `error` on the returned object — callers are
 * responsible for rendering the fallback message.
 */

import { useDebounce } from "@academorix/ui";
import { useList } from "@refinedev/core";

import type { Person } from "@/modules/people/people.types";
import type { CrudFilter } from "@refinedev/core";

/**
 * Minimum characters before a search fires. Matches typical cross-tenant
 * search UX — a single letter is rarely meaningful and would trigger huge
 * result pages on the backend.
 */
export const DEFAULT_MIN_QUERY_LENGTH = 2;

/** Options accepted by {@link usePeopleSearch}. */
export interface UsePeopleSearchOptions {
  /**
   * The live (undebounced) search input value. The hook debounces it
   * internally.
   */
  query: string;
  /** Debounce delay in milliseconds. Defaults to `300`. */
  delayMs?: number;
  /**
   * Minimum characters required before the query fires. Defaults to
   * {@link DEFAULT_MIN_QUERY_LENGTH}.
   */
  minLength?: number;
  /** Page size passed through to `useList.pagination`. Defaults to `20`. */
  pageSize?: number;
}

/** The result shape returned by {@link usePeopleSearch}. */
export interface UsePeopleSearchResult {
  /** The matching records for the current query, or an empty array. */
  data: Person[];
  /** Whether the underlying list query is fetching. */
  isLoading: boolean;
  /** The underlying query error (e.g. 404 while the backend is missing). */
  error: unknown;
  /**
   * The debounced query value the fetch is actually keyed on. Exposed so
   * callers can render "Searching for …" affordances without re-computing
   * the debounce themselves.
   */
  debouncedQuery: string;
  /**
   * `true` when the debounced query is shorter than `minLength`. Callers
   * can use this to render an "enter a search" empty state.
   */
  isBelowMinLength: boolean;
}

/**
 * Builds the Refine filter list for a non-empty search query. The `q`
 * operator name here mirrors the spatie-query convention the backend uses
 * for full-text/list searches — see BACKEND_HANDOFF.md.
 */
function buildFilters(query: string): CrudFilter[] {
  if (!query) {
    return [];
  }

  return [{ field: "q", operator: "contains", value: query }];
}

/**
 * A debounced, cross-tenant People search hook. Wraps `useList<Person>` so
 * callers only track the raw input; the hook takes care of the debounce
 * window, the minimum-query-length gate, and the graceful-degradation
 * shape.
 *
 * @param options - The live query value and optional debounce/page-size
 *   overrides.
 * @returns The matching people, plus loading/error/debounce metadata.
 */
export function usePeopleSearch({
  query,
  delayMs = 300,
  minLength = DEFAULT_MIN_QUERY_LENGTH,
  pageSize = 20,
}: UsePeopleSearchOptions): UsePeopleSearchResult {
  const debouncedQuery = useDebounce(query, delayMs).trim();
  const isBelowMinLength = debouncedQuery.length < minLength;

  const { result, query: listQuery } = useList<Person>({
    resource: "people",
    pagination: { pageSize },
    filters: buildFilters(debouncedQuery),
    queryOptions: {
      enabled: !isBelowMinLength,
    },
  });

  return {
    data: isBelowMinLength ? [] : (result?.data ?? []),
    isLoading: !isBelowMinLength && listQuery.isLoading,
    error: listQuery.error,
    debouncedQuery,
    isBelowMinLength,
  };
}
