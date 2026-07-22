/**
 * @file fetch.ts
 * `@stackra/http/fetch` — fetch driver.
 *
 * Optional `IHttpConnector` backed by the global `fetch` API. Use
 * for runtimes where axios's streaming support is unreliable
 * (browsers, edge, RN).
 *
 * @example
 * ```typescript
 * import { Module } from '@stackra/container';
 * import { HttpModule } from '@stackra/http';
 * import { FetchConnector } from '@stackra/http/fetch';
 *
 * @Module({
 *   imports: [
 *     HttpModule.forRoot(httpConfig),
 *     HttpModule.forFeature({ driver: 'fetch', connector: FetchConnector }),
 *   ],
 * })
 * export class AppModule {}
 * ```
 *
 * @module @stackra/http/fetch
 */

export { FetchConnector } from "./connectors/fetch.connector";
