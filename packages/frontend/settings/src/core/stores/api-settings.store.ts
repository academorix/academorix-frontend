/**
 * @file api-settings.store.ts
 * @module @stackra/settings/core/stores
 * @description REST API-backed settings store composed over
 *   `@stackra/http`'s `HTTP_MANAGER`.
 *
 *   The store never touches `fetch` directly — every request runs
 *   through a named `IHttpClient` connection so the app's HTTP
 *   interceptors (auth, telemetry, tracing) apply automatically.
 *   Retries are handled by `retry(fn, options)` from `@stackra/support`;
 *   the store falls back to a locally-configured `fallbackStore`
 *   (typically `localStorage`) when the API is unreachable, so
 *   reads never surface as failures on offline networks.
 */

import { retry, Uri } from "@stackra/support";
import type {
  IApiStoreDriverConfig,
  IHttpClient,
  IHttpManager,
  ISettingsApiEndpoints,
  ISettingsStore,
} from "@stackra/contracts";

import { DEFAULT_API_ENDPOINTS } from "@/core/constants/api-endpoints.constant";

/**
 * Options accepted by `ApiSettingsStore`.
 */
export interface IApiSettingsStoreOptions {
  /** HTTP manager the store dispatches through. */
  readonly httpManager: IHttpManager;
  /**
   * Named connection to use. Defaults to `config.httpClient` or
   * `'default'`.
   */
  readonly connection?: string;
  /** Endpoint path templates. */
  readonly endpoints?: ISettingsApiEndpoints;
  /**
   * Explicit base URL override. When omitted the HTTP client's
   * configured baseUrl is used verbatim.
   */
  readonly baseUrl?: string;
  /**
   * Additional headers per request. Static or function-returning.
   */
  readonly headers?: Record<string, string> | (() => Record<string, string>);
  /**
   * Additional query parameters per request. Static or function-
   * returning. Useful for tenant / user scope hints.
   */
  readonly query?: Record<string, string> | (() => Record<string, string>);
  /** Retry policy. */
  readonly retry?: IApiStoreDriverConfig["retry"];
  /**
   * Fallback store to consult on API failure. Provided by the
   * manager, resolved lazily (avoids constructor-time cyclic
   * dependencies between stores).
   */
  readonly fallback?: ISettingsStore;
  /** Called when a request fails after retries. */
  readonly onError?: IApiStoreDriverConfig["onError"];
}

/** `ISettingsStore` composed over `@stackra/http`. */
export class ApiSettingsStore implements ISettingsStore {
  /** Driver identifier. */
  public readonly driver = "api";

  private readonly httpManager: IHttpManager;
  private readonly connection: string;
  private readonly endpoints: Required<ISettingsApiEndpoints>;
  private readonly baseUrl?: string;
  private readonly headers?: IApiSettingsStoreOptions["headers"];
  private readonly query?: IApiSettingsStoreOptions["query"];
  private readonly retryOptions: IApiStoreDriverConfig["retry"];
  private readonly fallback?: ISettingsStore;
  private readonly onError?: IApiStoreDriverConfig["onError"];

  /** Cached HTTP client resolved on first request. */
  private clientPromise: Promise<IHttpClient> | null = null;

  public constructor(options: IApiSettingsStoreOptions) {
    this.httpManager = options.httpManager;
    this.connection = options.connection ?? "default";
    this.endpoints = {
      ...DEFAULT_API_ENDPOINTS,
      ...options.endpoints,
    };
    this.baseUrl = options.baseUrl;
    this.headers = options.headers;
    this.query = options.query;
    this.retryOptions = options.retry;
    this.fallback = options.fallback;
    this.onError = options.onError;
  }

  // ══════════════════════════════════════════════════════════════════
  // ISettingsStore
  // ══════════════════════════════════════════════════════════════════

  /**
   * Load a group's values.
   *
   * On success, the payload is mirrored to the fallback store when
   * one is configured so subsequent offline reads succeed.
   */
  public async load(groupKey: string): Promise<Record<string, unknown>> {
    try {
      const values = await this.request<Record<string, unknown>>(
        "GET",
        this.endpoints.getGroup,
        groupKey,
      );

      // Mirror to fallback for offline warm-start.
      if (this.fallback) {
        try {
          await this.fallback.save(groupKey, values);
        } catch {
          // fail-soft — fallback mirror should never break the API path.
        }
      }

      return values;
    } catch (error) {
      this.emitError(error, groupKey, "load");
      if (this.fallback) {
        return this.fallback.load(groupKey);
      }
      return {};
    }
  }

  /**
   * Save (partial-merge on the server; the payload is the full
   * merged snapshot as computed by the local service).
   */
  public async save(groupKey: string, values: Record<string, unknown>): Promise<void> {
    // Mirror to fallback first so offline data is safe even if the
    // API request fails.
    if (this.fallback) {
      try {
        await this.fallback.save(groupKey, values);
      } catch {
        // fail-soft
      }
    }

    try {
      await this.request<Record<string, unknown>>(
        "PUT",
        this.endpoints.updateGroup,
        groupKey,
        values,
      );
    } catch (error) {
      this.emitError(error, groupKey, "save");
      // Local mirror already persisted — the caller sees success on
      // the fallback path and can retry the API push later.
    }
  }

  /**
   * @inheritDoc
   *
   * Hits `GET /api/v1/settings` — the "every group with resolved
   * values" endpoint. The response is expected to be either:
   *   - `Record<groupKey, Record<fieldKey, value>>` (flat map), or
   *   - `{ data: Record<groupKey, Record<fieldKey, value>> }` (Laravel
   *     API-resource wrapper).
   *
   * Both shapes are handled here so apps don't have to intercept
   * the response.
   */
  public async loadAll(): Promise<Record<string, Record<string, unknown>>> {
    try {
      const payload = await this.request<unknown>(
        "GET",
        this.endpoints.listGroups,
        // The listGroups endpoint has no `{group}` placeholder — the
        // empty string is fine, `buildUrl` just no-ops the replace.
        "",
      );

      const groups = normaliseListGroupsPayload(payload);

      // Mirror to fallback for offline warm-start.
      if (this.fallback) {
        for (const [groupKey, values] of Object.entries(groups)) {
          try {
            await this.fallback.save(groupKey, values);
          } catch {
            // fail-soft — a single mirror failure must not stop
            // hydration.
          }
        }
      }

      return groups;
    } catch (error) {
      this.emitError(error, "*", "load");
      // Delegate to the fallback's loadAll (if it has one) so
      // consumers get a warm cache from the last successful call.
      if (this.fallback?.loadAll) {
        return this.fallback.loadAll();
      }
      return {};
    }
  }

  /** Clear a group. */
  public async clear(groupKey: string): Promise<void> {
    if (this.fallback) {
      try {
        await this.fallback.clear(groupKey);
      } catch {
        // fail-soft
      }
    }

    try {
      await this.request<void>("DELETE", this.endpoints.updateGroup, groupKey);
    } catch (error) {
      this.emitError(error, groupKey, "clear");
    }
  }

  // ══════════════════════════════════════════════════════════════════
  // Private
  // ══════════════════════════════════════════════════════════════════

  /**
   * Resolve (and cache) the HTTP client for the configured
   * connection.
   */
  private client(): Promise<IHttpClient> {
    this.clientPromise ??= this.httpManager.connection(this.connection);
    return this.clientPromise;
  }

  /**
   * Perform one HTTP request with the shared retry / header / query
   * shape.
   */
  private async request<T>(
    method: "GET" | "PUT" | "DELETE",
    endpointTemplate: string,
    groupKey: string,
    body?: unknown,
  ): Promise<T> {
    return retry(
      async () => {
        const client = await this.client();
        const url = this.buildUrl(endpointTemplate, groupKey);
        const headers = this.resolveHeaders();

        // Every branch returns the response body as `T`.
        if (method === "GET") {
          const res = await client.get<T>(url, { headers });
          return res.data as T;
        }
        if (method === "PUT") {
          const res = await client.put<T>(url, body, { headers });
          return res.data as T;
        }
        // DELETE
        const res = await client.delete<T>(url, { headers });
        return res.data as T;
      },
      {
        times: this.retryOptions?.attempts ?? 3,
        delay: this.retryOptions?.backoffMs ?? 200,
        backoff: "exponential",
      },
    );
  }

  /**
   * Build the full request URL. The endpoint template may contain
   * `{group}`; `Uri` handles query serialization + trailing-slash
   * normalisation.
   */
  private buildUrl(template: string, groupKey: string): string {
    const path = template.replace("{group}", encodeURIComponent(groupKey));

    // When no explicit baseUrl is set, return the path — the HTTP
    // client's own baseUrl folds it in. When one IS set, build the
    // absolute URL via Uri.
    if (!this.baseUrl) {
      const query = this.resolveQuery();
      if (Object.keys(query).length === 0) return path;
      // Uri needs a base to work with; use a placeholder then strip.
      const placeholder = "https://__stackra_settings_placeholder__";
      const abs = Uri.of(placeholder).path(path).query(query).toString();
      return abs.slice(placeholder.length);
    }

    const query = this.resolveQuery();
    return Uri.of(this.baseUrl).path(path).query(query).toString();
  }

  /** Merge static + dynamic headers into one record. */
  private resolveHeaders(): Record<string, string> | undefined {
    if (!this.headers) return undefined;
    return typeof this.headers === "function" ? this.headers() : this.headers;
  }

  /** Merge static + dynamic query params into one record. */
  private resolveQuery(): Record<string, string> {
    if (!this.query) return {};
    return typeof this.query === "function" ? this.query() : this.query;
  }

  /** Emit the onError callback while shielding from callback throws. */
  private emitError(error: unknown, groupKey: string, op: "load" | "save" | "clear"): void {
    if (!this.onError) return;
    try {
      this.onError(error instanceof Error ? error : new Error(String(error)), groupKey, op);
    } catch {
      // fail-soft
    }
  }
}

// ══════════════════════════════════════════════════════════════════
// Payload normalisers
// ══════════════════════════════════════════════════════════════════

/**
 * Extract a `Record<groupKey, values>` map out of whatever the
 * `listGroups` endpoint returned. Accepts:
 *
 * - Flat map: `{ theme: {...}, notifications: {...} }`
 * - Laravel API-resource wrapper: `{ data: { theme: {...}, ... } }`
 * - Array of group envelopes: `[{ group: 'theme', values: {...} }, ...]`
 *
 * Entries that don't produce a `Record` value are dropped rather
 * than throwing — a malformed group cannot sink the whole cold-start.
 */
function normaliseListGroupsPayload(payload: unknown): Record<string, Record<string, unknown>> {
  if (!payload || typeof payload !== "object") return {};

  // Laravel API-resource wrapper: unwrap `.data`.
  const source =
    "data" in payload && typeof (payload as { data?: unknown }).data === "object"
      ? (payload as { data: unknown }).data
      : payload;

  const out: Record<string, Record<string, unknown>> = {};

  // Array of envelopes shape.
  if (Array.isArray(source)) {
    for (const entry of source) {
      if (!isRecord(entry)) continue;
      const groupKey = typeof entry.group === "string" ? entry.group : undefined;
      if (!groupKey) continue;
      const values = isRecord(entry.values) ? entry.values : {};
      out[groupKey] = values;
    }
    return out;
  }

  // Flat map shape — each value must itself be a record.
  if (isRecord(source)) {
    for (const [groupKey, values] of Object.entries(source)) {
      if (isRecord(values)) out[groupKey] = values;
    }
  }

  return out;
}

/** Runtime record guard. */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
