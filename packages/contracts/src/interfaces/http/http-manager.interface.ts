/**
 * @file http-manager.interface.ts
 * @module @stackra/contracts/interfaces/http
 * @description The multi-connection HTTP manager contract.
 */

import type { IHttpClient, IHttpClientConfig } from "./http-client.interface";
import type { IHttpConnector } from "./http-connector.interface";
import type {
  IHttpInterceptorRegistry,
  IHttpMiddlewareRegistry,
} from "./http-middleware.interface";

/**
 * Resolves and caches named `IHttpClient` connections, and owns the
 * per-connection middleware/interceptor registries.
 */
export interface IHttpManager {
  /** Resolve (and cache) a named connection — defaults to the default. */
  connection(name?: string): Promise<IHttpClient>;
  /** Drop cached connection(s) and their registries. */
  forgetConnection(name?: string | string[]): void;
  /** Drop every cached connection and registry. */
  purge(): void;
  /** Add a connection config at runtime. Returns `false` if it already exists. */
  addConnection(name: string, config: IHttpClientConfig): boolean;
  /** Get (creating if needed) the middleware registry for a connection. */
  getMiddlewareRegistry(name?: string): Promise<IHttpMiddlewareRegistry>;
  /** Get (creating if needed) the interceptor registry for a connection. */
  getInterceptorRegistry(name?: string): Promise<IHttpInterceptorRegistry>;
  /** Every configured connection name. */
  getConnectionNames(): string[];
  /** The default connection name. */
  getDefaultConnectionName(): string;
  /** Change the default connection name. */
  setDefaultConnectionName(name: string): void;
  /** Whether a connection has been resolved/cached. */
  isConnectionActive(name?: string): boolean;
  /** Names of currently-resolved connections. */
  getActiveConnectionNames(): string[];
  /** Build a client from a connector + raw connection config. */
  createClientFromConnector(
    connector: IHttpConnector,
    config: Record<string, unknown>,
  ): IHttpClient;
  /** Register a driver factory (used by `forRoot`/`forFeature`). */
  extend(driver: string, factory: (config: Record<string, unknown>) => IHttpClient): void;
}
