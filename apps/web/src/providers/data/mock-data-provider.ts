/**
 * @file mock-data-provider.ts
 * @module providers/data/mock-data-provider
 *
 * @description
 * Refine `DataProvider` backed by static JSON fixtures in `public/data/`.
 *
 * It lets the entire application — lists, detail views, forms, dashboards —
 * run with zero backend by serving `public/data/<resource>.json` and doing all
 * the list work (filtering, sorting, pagination) **client-side**, exactly the
 * way the real Laravel API will do it server-side. Because the fixtures share
 * the same field shapes as {@link "@/types/models"}, flipping `VITE_API_MOCK`
 * to `false` later is a no-op at the call sites.
 *
 * ## Behaviour
 * - **Reads** lazily fetch a dataset once, then cache it in memory.
 * - **Writes** (`create`/`update`/`deleteOne`) mutate that in-memory cache so
 *   the UI feels live within a session. Nothing is persisted to disk (these are
 *   fixtures) — a reload restores the pristine JSON.
 * - **Filtering** implements every Refine `CrudOperator`, mirroring the query
 *   contract the REST provider encodes for the server.
 */

import type { BaseKey, BaseRecord, DataProvider, Pagination } from "@refinedev/core";

import { ApiError } from "@/lib/http/errors";
import { matchesFilters, sortRecords } from "@/providers/data/mock-query";

/** Tuning knobs for {@link createMockDataProvider}. */
export interface MockDataProviderOptions {
  /** Public path the fixtures live under. Defaults to `/data`. */
  basePath?: string;
  /**
   * Artificial latency (ms) added to every operation to emulate a real network
   * round-trip during development. Defaults to `0` (instant) so tests stay fast.
   */
  latencyMs?: number;
}

const DEFAULT_BASE_PATH = "/data";

/** Generates a UUID id for created records, with a non-crypto fallback. */
function generateId(): string {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }

  // Fallback for environments without the Web Crypto API.
  return `mock_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

/** Resolves once after `ms` milliseconds (no-op when `ms <= 0`). */
function delay(ms: number): Promise<void> {
  if (ms <= 0) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 * Applies pagination to an already-filtered/sorted array. When pagination is
 * disabled (`mode: "off"`) the full list is returned.
 */
function paginate<T>(records: T[], pagination?: Pagination): T[] {
  if (!pagination || pagination.mode === "off") {
    return records;
  }

  const currentPage = pagination.currentPage ?? 1;
  const pageSize = pagination.pageSize ?? 10;
  const start = (currentPage - 1) * pageSize;

  return records.slice(start, start + pageSize);
}

/**
 * Creates a JSON-fixture data provider.
 *
 * @param options - Base path and simulated-latency configuration.
 */
export function createMockDataProvider(options: MockDataProviderOptions = {}): DataProvider {
  const basePath = (options.basePath ?? DEFAULT_BASE_PATH).replace(/\/+$/, "");
  const latencyMs = options.latencyMs ?? 0;

  /**
   * In-memory store of every loaded dataset, keyed by resource name. The arrays
   * are mutable so writes are reflected on subsequent reads within a session.
   */
  const cache = new Map<string, BaseRecord[]>();

  /** Fetches and caches a resource's fixture the first time it is requested. */
  async function load(resource: string): Promise<BaseRecord[]> {
    const cached = cache.get(resource);

    if (cached) {
      return cached;
    }

    const response = await fetch(`${basePath}/${resource}.json`);

    if (!response.ok) {
      throw new ApiError(
        `No mock fixture found for resource "${resource}" (expected ${basePath}/${resource}.json).`,
        response.status === 404 ? 404 : response.status,
      );
    }

    const payload: unknown = await response.json();

    // Accept either a bare array or a Laravel-style `{ data: [...] }` envelope.
    const records: BaseRecord[] = Array.isArray(payload)
      ? (payload as BaseRecord[])
      : ((payload as { data?: BaseRecord[] }).data ?? []);

    cache.set(resource, records);

    return records;
  }

  /** Finds a record's array index by id, or `-1`. */
  function indexOfId(records: BaseRecord[], id: BaseKey): number {
    return records.findIndex((record) => String(record.id) === String(id));
  }

  return {
    getApiUrl(): string {
      return basePath;
    },

    async getList<TData extends BaseRecord = BaseRecord>({
      resource,
      pagination,
      sorters,
      filters,
    }: Parameters<DataProvider["getList"]>[0]) {
      await delay(latencyMs);

      const all = await load(resource);
      const filtered = filters ? all.filter((record) => matchesFilters(record, filters)) : all;
      const sorted = sorters && sorters.length > 0 ? sortRecords(filtered, sorters) : filtered;
      const page = paginate(sorted, pagination);

      return {
        data: page as unknown as TData[],
        total: filtered.length,
      };
    },

    async getOne<TData extends BaseRecord = BaseRecord>({
      resource,
      id,
    }: Parameters<DataProvider["getOne"]>[0]) {
      await delay(latencyMs);

      const records = await load(resource);
      const found = records.find((record) => String(record.id) === String(id));

      if (!found) {
        throw new ApiError(`Record "${id}" not found in "${resource}".`, 404);
      }

      return { data: found as unknown as TData };
    },

    async getMany<TData extends BaseRecord = BaseRecord>({
      resource,
      ids,
    }: NonNullable<Parameters<NonNullable<DataProvider["getMany"]>>[0]>) {
      await delay(latencyMs);

      const records = await load(resource);
      const wanted = new Set(ids.map((id) => String(id)));
      const data = records.filter((record) => wanted.has(String(record.id)));

      return { data: data as unknown as TData[] };
    },

    async create<TData extends BaseRecord = BaseRecord, TVariables = object>({
      resource,
      variables,
    }: Parameters<DataProvider["create"]>[0] & { variables: TVariables }) {
      await delay(latencyMs);

      const records = await load(resource);
      const now = new Date().toISOString();

      const created: BaseRecord = {
        id: generateId(),
        ...(variables as Record<string, unknown>),
        created_at: now,
        updated_at: now,
      };

      // Newest first — matches how a `created_at desc` list would surface it.
      records.unshift(created);

      return { data: created as unknown as TData };
    },

    async update<TData extends BaseRecord = BaseRecord, TVariables = object>({
      resource,
      id,
      variables,
    }: Parameters<DataProvider["update"]>[0] & { variables: TVariables }) {
      await delay(latencyMs);

      const records = await load(resource);
      const index = indexOfId(records, id);

      if (index === -1) {
        throw new ApiError(`Record "${id}" not found in "${resource}".`, 404);
      }

      const updated: BaseRecord = {
        ...records[index],
        ...(variables as Record<string, unknown>),
        id: records[index]!.id,
        updated_at: new Date().toISOString(),
      };

      records[index] = updated;

      return { data: updated as unknown as TData };
    },

    async deleteOne<TData extends BaseRecord = BaseRecord, TVariables = object>({
      resource,
      id,
    }: Parameters<DataProvider["deleteOne"]>[0] & { variables?: TVariables }) {
      await delay(latencyMs);

      const records = await load(resource);
      const index = indexOfId(records, id);

      if (index === -1) {
        throw new ApiError(`Record "${id}" not found in "${resource}".`, 404);
      }

      const [removed] = records.splice(index, 1);

      return { data: removed as unknown as TData };
    },
  };
}
