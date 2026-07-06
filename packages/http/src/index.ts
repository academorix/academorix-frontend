/**
 * @file index.ts
 * @module @academorix/http
 *
 * @description
 * Public root barrel. Prefer subpath imports for tree-shaking.
 *
 * ## Public API
 *
 *  - {@link "@academorix/http/client"} — `createHttpClient(config)`,
 *    `HttpClient` class, `HttpClientConfig` / `HttpMethod` /
 *    `RequestOptions` types.
 *  - {@link "@academorix/http/tokens"} — `TokenStore` observable holder.
 *  - {@link "@academorix/http/refresh"} — single-flight refresh
 *    coordinator.
 *  - {@link "@academorix/http/errors"} — `toHttpError`, `toNetworkError`;
 *    re-exports `HttpError` from `@academorix/core/errors`.
 *  - {@link "@academorix/http/envelope"} — Foundation envelope helpers
 *    (`unwrapEnvelope`, `extractPaginationMeta`).
 *  - {@link "@academorix/http/device"} — `createDeviceHeadersReader`,
 *    `deviceLabel`, `getDeviceLocale`.
 *
 * @example
 * ```ts
 * // apps/dashboard/src/lib/http/index.ts
 * import {
 *   createHttpClient,
 *   TokenStore,
 *   createRefreshCoordinator,
 *   createDeviceHeadersReader,
 * } from "@academorix/http";
 *
 * export const tokenStore = new TokenStore();
 *
 * export const httpClient = createHttpClient({
 *   baseUrl: apiOrigin,
 *   tokens: tokenStore,
 *   deviceHeaders: createDeviceHeadersReader({
 *     clientName: "academorix-dashboard",
 *     clientVersion: __ACADEMORIX_VERSION__,
 *   }),
 * });
 *
 * httpClient.attachRefreshCoordinator(
 *   createRefreshCoordinator({ client: httpClient, tokens: tokenStore }),
 * );
 * ```
 */

export { createHttpClient, HttpClient } from "./client";
export type { HttpClientConfig, HttpMethod, RequestOptions } from "./client";

export { TokenStore } from "./tokens";
export type { TokenListener, TokenStoreOptions } from "./tokens";

export { createRefreshCoordinator } from "./refresh";
export type { RefreshCoordinator, RefreshCoordinatorOptions } from "./refresh";

export { toHttpError, toNetworkError, HttpError, isHttpError } from "./errors";

export { extractPaginationMeta, isFoundationEnvelope, unwrapEnvelope } from "./envelope";
export type { FoundationEnvelope, FoundationMeta } from "./envelope";

export { createDeviceHeadersReader, deviceLabel, getDeviceLocale } from "./device";
export type { DeviceHeadersOptions } from "./device";
