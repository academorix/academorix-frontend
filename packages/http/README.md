# @academorix/http

Framework-agnostic HTTP client for the Academorix workspace. Native `fetch` with
an observable token store, single-flight token refresh, device-fingerprint
headers, Foundation envelope helpers, and `HttpError` normalization.

Depends on `@academorix/core` (for the `HttpError` class). Zero React in this
package — used by `@academorix/query`, `@academorix/notifications`, both apps,
and Refine's data provider on the dashboard.

## Public API

| Subpath                     | Exports                                                                                                      |
| --------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `@academorix/http/client`   | `createHttpClient(config)`, `HttpClient`, `HttpClientConfig`, `HttpMethod`, `RequestOptions`                 |
| `@academorix/http/tokens`   | `TokenStore`, `TokenListener`, `TokenStoreOptions`                                                           |
| `@academorix/http/refresh`  | `createRefreshCoordinator({ client, tokens, path? })`, `RefreshCoordinator`                                  |
| `@academorix/http/errors`   | `toHttpError`, `toNetworkError`, `HttpError` + `isHttpError` (re-exported from core)                         |
| `@academorix/http/envelope` | `unwrapEnvelope`, `extractPaginationMeta`, `isFoundationEnvelope`, `FoundationEnvelope<T>`, `FoundationMeta` |
| `@academorix/http/device`   | `createDeviceHeadersReader(options)`, `deviceLabel`, `getDeviceLocale`                                       |

Root barrel re-exports everything for one-line imports.

## Design principles

- **Fetch, not axios.** Native `fetch` covers every need; the interceptor chain
  is done via `HttpClient` methods. Zero runtime deps.
- **Observable token store.** Auth changes propagate to every consumer (HTTP
  client, React hooks via subscribe) without a shared React context.
- **Single-flight refresh.** Concurrent 401s coalesce onto one refresh attempt,
  then retry the original request once. If refresh fails, the token is cleared
  and `onUnauthorized` fires so the auth provider can redirect.
- **Device fingerprint headers as opt-in.** Apps pass their build's version to
  `createDeviceHeadersReader` — the package doesn't reach for build-time defines
  like `__ACADEMORIX_VERSION__` itself.
- **SSR-safe.** Every browser global (`window`, `navigator`, `document`,
  `localStorage`) is guarded. Server-side calls produce sensible defaults.

## Wiring the app singleton

```ts
// apps/dashboard/src/lib/http/index.ts
import {
  createDeviceHeadersReader,
  createHttpClient,
  createRefreshCoordinator,
  TokenStore,
} from "@academorix/http";

import { resolveHostContext } from "@/lib/http/host";

// Injected by Vite at build time.
declare const __ACADEMORIX_VERSION__: string;

export const tokenStore = new TokenStore();

const host = resolveHostContext();

export const httpClient = createHttpClient({
  baseUrl: host.apiOrigin,
  tokens: tokenStore,
  onUnauthorized: () => window.location.assign("/login"),
  deviceHeaders: createDeviceHeadersReader({
    clientName: "academorix-dashboard",
    clientVersion:
      typeof __ACADEMORIX_VERSION__ !== "undefined"
        ? __ACADEMORIX_VERSION__
        : "dev",
  }),
});

httpClient.attachRefreshCoordinator(
  createRefreshCoordinator({ client: httpClient, tokens: tokenStore }),
);
```

## Foundation envelope

Backend controllers extending `Academorix\Foundation\Controllers\Controller`
return `{ message, status, data, meta? }`. Auth DTOs (`AuthTokenData` etc.) are
returned as the bare DTO at the root.

```ts
import {
  unwrapEnvelope,
  extractPaginationMeta,
} from "@academorix/http/envelope";

const rawBody = await httpClient.get("/v1/athletes?per_page=50");
const athletes = unwrapEnvelope<Athlete[]>(rawBody);
const { total, meta } = extractPaginationMeta(rawBody);
```
