/**
 * @file http.config.ts
 * @module @stackra/http/config
 * @description Application-level HTTP client configuration.
 *   Consumed by `HttpModule.forRoot()` at bootstrap.
 */

import { defineConfig } from "@stackra/http";

export const httpConfig = defineConfig({
  /*
  |--------------------------------------------------------------------------
  | Default Connection
  |--------------------------------------------------------------------------
  |
  | The default named connection used when calling httpClient.request() or
  | @InjectHttp() without specifying a connection name.
  |
  */
  default: "api",

  /*
  |--------------------------------------------------------------------------
  | HTTP Connections
  |--------------------------------------------------------------------------
  |
  | Named HTTP client connections. Each defines a base URL, default headers,
  | timeout, and opt-in middleware/interceptor blocks (circuit breaker, rate
  | limit, dedup, cache, transform, metrics). Multiple connections let you
  | target different APIs with different configurations.
  |
  */
  connections: {
    api: {
      baseURL: "/",
      timeout: 30_000,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    },
  },
});
