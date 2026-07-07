/**
 * @file create-query-client.ts
 * @module @academorix/query/client/create-query-client
 *
 * @description
 * Factory for a pre-configured `@tanstack/react-query` `QueryClient`.
 *
 * The defaults are opinionated but sane for the Academorix
 * workspace:
 *
 *  - `staleTime: 30s` — read-through cache for chatty CRUD screens
 *    without over-fetching.
 *  - `gcTime: 5m` — keep cache entries warm across route changes.
 *  - `refetchOnWindowFocus: false` — we're a data-heavy admin app;
 *    the reflex refetch on tab focus is more distracting than useful.
 *    Realtime updates come through `@academorix/realtime` instead.
 *  - `retry: (failureCount, error)` — retry once on 5xx, never on
 *    4xx (auth failures don't get better with retry; validation
 *    errors are the caller's responsibility). Transport failures
 *    (`HttpError.statusCode === undefined`) retry twice.
 *
 * All defaults are overridable at the call site — pass `defaults` to
 * merge in per-app tweaks.
 *
 * @example
 * ```ts
 * // apps/landing-page/src/app/providers.tsx
 * import { createQueryClient } from "@academorix/query/client";
 *
 * const queryClient = createQueryClient();
 *
 * <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
 * ```
 */

import { isHttpError } from "@academorix/core/errors";
import { QueryClient } from "@tanstack/react-query";

import type { DefaultOptions } from "@tanstack/react-query";

/** Options accepted by {@link createQueryClient}. */
export interface CreateQueryClientOptions {
  /** Merge over the built-in defaults. */
  readonly defaults?: DefaultOptions;
}

/**
 * Retry policy tuned for HTTP-backed queries. Retries 5xx twice,
 * transport failures twice, and everything else zero times.
 */
function shouldRetry(failureCount: number, error: unknown): boolean {
  if (failureCount >= 2) {
    return false;
  }

  if (!isHttpError(error)) {
    // Non-HttpError — probably a code bug, don't retry.
    return false;
  }

  if (error.statusCode === undefined) {
    // Transport failure (network unreachable, CORS preflight, etc.) —
    // worth another try in case it was a transient blip.
    return true;
  }

  return error.statusCode >= 500;
}

/**
 * Constructs a `QueryClient` with Academorix-flavored defaults. Apps
 * may pass `defaults` to override individual fields; passed values
 * shallow-merge over the built-ins.
 *
 * The merge is structural: consumer-supplied `queries` / `mutations`
 * fields are merged over the built-ins (so passing
 * `{ queries: { staleTime: 60_000 } }` keeps `gcTime`, `retry`, and
 * the other built-ins intact). Any other top-level `DefaultOptions`
 * field (`hydrate`, `dehydrate`) passes through unchanged.
 */
export function createQueryClient(options: CreateQueryClientOptions = {}): QueryClient {
  // Peel `queries` + `mutations` off so they don't clobber the merged
  // versions below — everything else in `defaults` (hydrate/dehydrate,
  // future v6 fields) passes through as-is.
  const { queries: _queries, mutations: _mutations, ...restDefaults } = options.defaults ?? {};

  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: false,
        retry: shouldRetry,
        ...options.defaults?.queries,
      },
      mutations: {
        retry: false,
        ...options.defaults?.mutations,
      },
      ...restDefaults,
    },
  });
}
