/**
 * @file index.ts
 * @module lib/http
 *
 * @description
 * Public surface of the HTTP layer. Exposes the shared, pre-configured
 * {@link HttpClient} singleton (origin resolved from the host context, bearer
 * token from the shared store, refresh-on-401 coordinator wired in) plus the
 * underlying primitives for advanced/testing use.
 *
 * The `httpClient` is intentionally created eagerly so the very first
 * `useList`/`useOne` fires the correct request. It carries no navigation
 * concerns — `authProvider.onError` handles the redirect on unrecoverable
 * 401s.
 */

import { resolveHostContext } from "@/lib/http/host";
import { HttpClient } from "@/lib/http/http-client";
import { createRefreshCoordinator } from "@/lib/http/refresh";
import { tokenStore } from "@/lib/http/token-store";

// Resolve the API base URL once at boot. In production the SPA is served
// same-origin with Laravel so the origin already carries the tenant context;
// in dev this falls back to `VITE_API_URL + VITE_API_PATH`.
const host = resolveHostContext();

/**
 * Application-wide HTTP client pointed at the resolved API origin (same-origin
 * in production, `VITE_API_URL` in dev).
 */
export const httpClient = new HttpClient({
  baseUrl: host.apiOrigin,
  tokens: tokenStore,
});

// Attach the single-flight refresh coordinator so a 401 tries `/auth/refresh`
// once before propagating. The auth providers set their own `path` variant
// (tenant vs platform) via the coordinator they construct, so this global one
// covers the tenant surface — platform admin flows override at that layer.
httpClient.attachRefreshCoordinator(
  createRefreshCoordinator({ client: httpClient, tokens: tokenStore }),
);

export * from "@/lib/http/errors";
export * from "@/lib/http/http-client";
export * from "@/lib/http/token-store";
export * from "@/lib/http/host";
export * from "@/lib/http/device";
export * from "@/lib/http/envelope";
export * from "@/lib/http/refresh";
