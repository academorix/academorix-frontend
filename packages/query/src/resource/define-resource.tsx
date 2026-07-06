/**
 * @file define-resource.tsx
 * @module @academorix/query/resource/define-resource
 *
 * @description
 * `defineResource<TRecord>(resource, { client })` — factory that
 * generates a full set of React Query hooks
 * (`useList` / `useOne` / `useCreate` / `useUpdate` / `useDelete`)
 * bound to a REST resource served by an `@academorix/http`
 * `HttpClient`.
 *
 * ## Why a factory (not a hook)
 *
 * A factory called at module init:
 *   - Ties the hook set to a resource path + client in one place, so
 *     call sites read `athletes.useList(...)` (self-documenting) not
 *     `useList("athletes", ...)`.
 *   - Uses zero React runtime — the hooks just call the closure over
 *     `client` at invocation time.
 *   - Doesn't require a React context, so hooks work in tests without
 *     spinning up a provider tree beyond `QueryClientProvider`.
 *
 * ## Cache-key convention
 *
 * Every hook builds keys via `@academorix/query/query-keys` so
 * downstream code can invalidate uniformly:
 *
 *   - `[prefix, path, "list", params]` — every list query.
 *   - `[prefix, path, "one", id]`      — every single-record query.
 *
 * ## Response envelope handling
 *
 * The list hook uses `extractPaginationMeta` + `unwrapEnvelope`
 * from `@academorix/http/envelope` — that means Foundation-shape
 * responses ` { data, meta: { total } }` and bare arrays both work
 * without ceremony at call sites.
 *
 * @example
 * ```ts
 * // apps/landing-page/src/api/waitlist.resource.ts
 * import { defineResource } from "@academorix/query/resource";
 * import { httpClient } from "@/lib/http";
 *
 * export interface WaitlistEntry {
 *   id: string;
 *   email: string;
 *   created_at: string;
 * }
 *
 * export const waitlistResource = defineResource<WaitlistEntry>(
 *   { path: "marketing/waitlist" },
 *   { client: httpClient },
 * );
 *
 * // Usage:
 * // const { data } = waitlistResource.useList({ page: 1, per_page: 25 });
 * // const { mutateAsync } = waitlistResource.useCreate();
 * // await mutateAsync({ email: "user@example.com" });
 * ```
 */

import { HttpError, isHttpError } from "@academorix/core/errors";
import { extractPaginationMeta, unwrapEnvelope } from "@academorix/http/envelope";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { DEFAULT_QUERY_KEY_PREFIX, listKey, oneKey } from "../query-keys/build-query-key.util";

import { serializeListParams } from "./serialize-params.util";

import type { ResourceDefinition, ResourceListParams, ResourceListResult } from "./resource.type";
import type { HttpClient } from "@academorix/http/client";
import type {
  UseMutationOptions,
  UseMutationResult,
  UseQueryOptions,
  UseQueryResult,
} from "@tanstack/react-query";

/** Options accepted by {@link defineResource}. */
export interface DefineResourceOptions {
  /**
   * The HTTP client the generated hooks call through. Usually the
   * app's shared singleton from `@academorix/http`.
   */
  readonly client: HttpClient;

  /**
   * React Query cache-key prefix. Defaults to
   * {@link DEFAULT_QUERY_KEY_PREFIX} (`"@academorix"`). Change if
   * running multiple isolated query domains inside one page (e.g.
   * dashboard-inside-marketing embed).
   */
  readonly queryKeyPrefix?: string;
}

/**
 * The generated hook set. Callers destructure the ones they need at
 * each call site.
 */
export interface ResourceHooks<TRecord, TId extends string | number = string> {
  /** Query hook — paginated / filtered list. */
  useList: (
    params?: ResourceListParams,
    options?: Omit<UseQueryOptions<ResourceListResult<TRecord>, HttpError>, "queryKey" | "queryFn">,
  ) => UseQueryResult<ResourceListResult<TRecord>, HttpError>;

  /** Query hook — single record by id. */
  useOne: (
    id: TId,
    options?: Omit<UseQueryOptions<TRecord, HttpError>, "queryKey" | "queryFn">,
  ) => UseQueryResult<TRecord, HttpError>;

  /** Mutation hook — POST a new record; invalidates the list on success. */
  useCreate: (
    options?: UseMutationOptions<TRecord, HttpError, Partial<TRecord>>,
  ) => UseMutationResult<TRecord, HttpError, Partial<TRecord>>;

  /**
   * Mutation hook — PATCH an existing record; invalidates the
   * one + list on success.
   */
  useUpdate: (
    options?: UseMutationOptions<TRecord, HttpError, { id: TId; changes: Partial<TRecord> }>,
  ) => UseMutationResult<TRecord, HttpError, { id: TId; changes: Partial<TRecord> }>;

  /** Mutation hook — DELETE by id; invalidates the list on success. */
  useDelete: (
    options?: UseMutationOptions<void, HttpError, TId>,
  ) => UseMutationResult<void, HttpError, TId>;

  /** The resource definition (path, primary key) exposed for consumers. */
  readonly resource: ResourceDefinition<TRecord, TId>;
}

/**
 * Coerces any thrown value from the HTTP client into `HttpError` so
 * downstream `onError` handlers get a consistent type.
 */
function toHttpErrorInstance(error: unknown): HttpError {
  if (isHttpError(error)) {
    return error;
  }

  if (error instanceof Error) {
    return new HttpError(error.message, undefined, undefined, error);
  }

  return new HttpError("Request failed", undefined, undefined, error);
}

/**
 * Generates the full hook set for one resource.
 *
 * @typeParam TRecord - The shape of a single record on the wire
 *   (snake_case, matching the backend `spatie/laravel-data` output).
 * @typeParam TId - The id type (`string` for UUIDs, `number` for
 *   auto-increment). Default `string`.
 */
export function defineResource<TRecord, TId extends string | number = string>(
  resource: ResourceDefinition<TRecord, TId>,
  options: DefineResourceOptions,
): ResourceHooks<TRecord, TId> {
  const { client, queryKeyPrefix = DEFAULT_QUERY_KEY_PREFIX } = options;
  const { path } = resource;

  function useList(
    params?: ResourceListParams,
    hookOptions?: Omit<
      UseQueryOptions<ResourceListResult<TRecord>, HttpError>,
      "queryKey" | "queryFn"
    >,
  ): UseQueryResult<ResourceListResult<TRecord>, HttpError> {
    return useQuery({
      queryKey: listKey(queryKeyPrefix, path, params),
      queryFn: async () => {
        try {
          const raw = await client.get<unknown>(path, {
            searchParams: serializeListParams(params),
          });

          const data = unwrapEnvelope<readonly TRecord[]>(raw);
          const { total } = extractPaginationMeta(raw);

          return { data, total };
        } catch (error) {
          throw toHttpErrorInstance(error);
        }
      },
      ...hookOptions,
    });
  }

  function useOne(
    id: TId,
    hookOptions?: Omit<UseQueryOptions<TRecord, HttpError>, "queryKey" | "queryFn">,
  ): UseQueryResult<TRecord, HttpError> {
    return useQuery({
      queryKey: oneKey(queryKeyPrefix, path, id),
      queryFn: async () => {
        try {
          const raw = await client.get<unknown>(`${path}/${String(id)}`);

          return unwrapEnvelope<TRecord>(raw);
        } catch (error) {
          throw toHttpErrorInstance(error);
        }
      },
      ...hookOptions,
    });
  }

  function useCreate(
    hookOptions?: UseMutationOptions<TRecord, HttpError, Partial<TRecord>>,
  ): UseMutationResult<TRecord, HttpError, Partial<TRecord>> {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: async (variables: Partial<TRecord>) => {
        try {
          const raw = await client.post<unknown>(path, variables);

          return unwrapEnvelope<TRecord>(raw);
        } catch (error) {
          throw toHttpErrorInstance(error);
        }
      },
      onSuccess: (...args) => {
        void queryClient.invalidateQueries({
          queryKey: [queryKeyPrefix, path, "list"],
        });
        hookOptions?.onSuccess?.(...args);
      },
      ...hookOptions,
      // Re-apply overrides that the earlier spread wiped:
      onError: hookOptions?.onError,
    });
  }

  function useUpdate(
    hookOptions?: UseMutationOptions<TRecord, HttpError, { id: TId; changes: Partial<TRecord> }>,
  ): UseMutationResult<TRecord, HttpError, { id: TId; changes: Partial<TRecord> }> {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: async ({ id, changes }) => {
        try {
          const raw = await client.patch<unknown>(`${path}/${String(id)}`, changes);

          return unwrapEnvelope<TRecord>(raw);
        } catch (error) {
          throw toHttpErrorInstance(error);
        }
      },
      onSuccess: (...args) => {
        const [, variables] = args;

        void queryClient.invalidateQueries({
          queryKey: oneKey(queryKeyPrefix, path, variables.id),
        });
        void queryClient.invalidateQueries({
          queryKey: [queryKeyPrefix, path, "list"],
        });
        hookOptions?.onSuccess?.(...args);
      },
      ...hookOptions,
      onError: hookOptions?.onError,
    });
  }

  function useDelete(
    hookOptions?: UseMutationOptions<void, HttpError, TId>,
  ): UseMutationResult<void, HttpError, TId> {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: async (id: TId) => {
        try {
          await client.delete<void>(`${path}/${String(id)}`);
        } catch (error) {
          throw toHttpErrorInstance(error);
        }
      },
      onSuccess: (...args) => {
        const [, variables] = args;

        void queryClient.invalidateQueries({
          queryKey: oneKey(queryKeyPrefix, path, variables),
        });
        void queryClient.invalidateQueries({
          queryKey: [queryKeyPrefix, path, "list"],
        });
        hookOptions?.onSuccess?.(...args);
      },
      ...hookOptions,
      onError: hookOptions?.onError,
    });
  }

  return {
    useList,
    useOne,
    useCreate,
    useUpdate,
    useDelete,
    resource,
  };
}
