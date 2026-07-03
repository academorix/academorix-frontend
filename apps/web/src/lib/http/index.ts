/**
 * @file index.ts
 * @module lib/http
 *
 * @description
 * Public surface of the HTTP layer. Exposes the shared, pre-configured
 * {@link HttpClient} singleton (origin from validated env, bearer token from
 * the shared store) plus the underlying primitives for advanced/testing use.
 */

import { env } from "@/config/env";
import { HttpClient } from "@/lib/http/http-client";
import { tokenStore } from "@/lib/http/token-store";

/**
 * Application-wide HTTP client pointed at the configured API origin.
 *
 * `onUnauthorized` is intentionally left unset: on a 401 the client already
 * clears the token, and Refine's `authProvider.onError` owns the redirect to
 * `/login`, so wiring navigation here too would double-handle the event.
 */
export const httpClient = new HttpClient({
  baseUrl: env.VITE_API_URL,
  tokens: tokenStore,
});

export * from "@/lib/http/errors";
export * from "@/lib/http/http-client";
export * from "@/lib/http/token-store";
