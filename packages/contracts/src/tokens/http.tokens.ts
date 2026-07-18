/**
 * @file http.tokens.ts
 * @module @stackra/contracts/tokens
 * @description DI tokens for the HTTP subsystem.
 *
 *   Tokens live in contracts so cross-package consumers can inject the
 *   HTTP manager / client and per-connection clients without pulling in
 *   the `@stackra/http` runtime — same pattern as CACHE_MANAGER,
 *   EVENT_EMITTER, QUEUE_MANAGER.
 */

/** Token for the HttpManager singleton. */
export const HTTP_MANAGER = Symbol.for("HTTP_MANAGER");

/** Token for the default `IHttpClient` (resolved default connection). */
export const HTTP_CLIENT = Symbol.for("HTTP_CLIENT");

/** Token for the HTTP module configuration (`IHttpModuleOptions`). */
export const HTTP_CONFIG = Symbol.for("HTTP_CONFIG");

/**
 * Token for the default connection's `IHttpClient`.
 *
 * Distinct from `HTTP_CLIENT` so consumers can inject the default
 * connection under a stable, named token even when the default
 * connection name changes at runtime.
 */
export const DEFAULT_HTTP_CONNECTION_TOKEN = Symbol.for("DEFAULT_HTTP_CONNECTION");

/**
 * Token for an optional access-token provider used by `AuthMiddleware`.
 *
 * Consumers register a provider exposing `getAccessToken()` / `refresh()`
 * under this token to enable bearer-token injection + refresh-on-401.
 */
export const HTTP_TOKEN_PROVIDER = Symbol.for("HTTP_TOKEN_PROVIDER");

/**
 * Build the per-connection DI token for a named HTTP connection.
 *
 * `@InjectHttp('api')` and the module's per-connection providers resolve
 * the same symbol via `Symbol.for('HTTP_CONNECTION_api')`.
 *
 * @param name - Connection name (defaults to `'default'`).
 * @returns The stable per-connection injection token.
 */
export const getHttpConnectionToken = (name: string = "default"): symbol =>
  Symbol.for(`HTTP_CONNECTION_${name}`);
