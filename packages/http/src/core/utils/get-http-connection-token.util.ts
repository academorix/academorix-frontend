/**
 * HTTP connection token utility.
 *
 * Returns the DI injection token for a named HTTP connection.
 * Used internally by `@InjectHttp()` and by `HttpModule.forRoot()`
 * to register per-connection providers.
 *
 * @module @stackra/http/utils/get-http-connection-token
 */

/**
 * Build the DI injection token for a named HTTP connection.
 *
 * Connection names map to stable `Symbol.for()` identities so the
 * same name from different module loads resolves to the same token.
 * Mirrors `getQueueConnectionToken()` and `getRealtimeConnectionToken()`.
 *
 * @param name - Connection name from `IHttpModuleOptions.connections`.
 *   Defaults to `"default"` when omitted.
 * @returns The connection's DI token.
 *
 * @example
 * ```typescript
 * getHttpConnectionToken();         // Symbol.for("HTTP_CONNECTION_default")
 * getHttpConnectionToken("auth");   // Symbol.for("HTTP_CONNECTION_auth")
 * getHttpConnectionToken("billing"); // Symbol.for("HTTP_CONNECTION_billing")
 * ```
 */
export const getHttpConnectionToken = (name: string = 'default'): symbol =>
  Symbol.for(`HTTP_CONNECTION_${name}`);
