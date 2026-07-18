/**
 * @file index.ts
 * @module @academorix/http/client
 *
 * @description
 * Public barrel for the fetch-based HTTP client class + factory.
 */

export { createHttpClient, HttpClient } from "./http-client";
export type { HttpClientConfig, HttpMethod, RequestOptions } from "./http-client";
