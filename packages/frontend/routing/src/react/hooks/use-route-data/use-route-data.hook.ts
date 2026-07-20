/**
 * @file use-route-data.hook.ts
 * @module @stackra/routing/react/hooks/use-route-data
 * @description Typed wrapper over RRv7's `useLoaderData()`.
 *
 *   Per PLAN v3.12.9 — consumers pass the loader data generic once
 *   at the call site and the hook types the return. Cleaner than
 *   RRv7's `useLoaderData<typeof loader>()` because the type
 *   parameter is the SAME `TData` used in `definePage<TData>`.
 */

import { useLoaderData } from "react-router";

/**
 * Read the current match's loader data, typed against the caller's
 * generic.
 *
 * @typeParam TData - Type of the resolved loader data.
 * @returns Loader data cast to `TData`.
 *
 * @example
 * ```typescript
 * interface IBlogPost { title: string }
 * const post = useRouteData<IBlogPost>();
 * ```
 */
export function useRouteData<TData>(): TData {
  return useLoaderData() as TData;
}
