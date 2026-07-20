/**
 * @file http-connector.interface.ts
 * @module @stackra/contracts/interfaces/http
 * @description Transport driver contract — the low-level adapter that
 *   actually performs requests (axios, fetch, …).
 */

import type { IHttpContext, IHttpResponse } from "./http-request.interface";

/**
 * An HTTP transport driver.
 *
 * Implemented by `AxiosConnector`, `FetchConnector`, and any custom
 * driver registered via `HttpModule.forFeature(driver, ConnectorClass)`.
 */
export interface IHttpConnector {
  /** Perform a unary request and return the normalised response. */
  send(context: IHttpContext): Promise<IHttpResponse>;
  /** Open a byte stream for the given request. */
  stream(context: IHttpContext): Promise<AsyncIterable<Uint8Array>>;
}
