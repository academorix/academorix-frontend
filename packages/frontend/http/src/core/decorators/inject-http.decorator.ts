/**
 * @file inject-http.decorator.ts
 * `@InjectHttp()` parameter decorator.
 *
 * Convenience wrapper over `@Inject(getHttpConnectionToken(name))`.
 * Resolves the `IHttpClient` for a named connection — the default
 * connection when no name is given.
 *
 * @module @stackra/http/decorators/inject-http
 */

import { Inject } from "@stackra/container";

import { getHttpConnectionToken } from "../utils/get-http-connection-token.util";

/**
 * Inject the `IHttpClient` for a named connection.
 *
 * @param name - Connection name. Uses the configured default when
 *   omitted.
 * @returns Parameter / property decorator.
 *
 * @example
 * ```typescript
 * @Injectable()
 * class UserService {
 *   public constructor(
 *     @InjectHttp() private readonly api: IHttpClient,
 *     @InjectHttp('billing') private readonly billing: IHttpClient,
 *   ) {}
 * }
 * ```
 */
export function InjectHttp(name?: string): ParameterDecorator & PropertyDecorator {
  return Inject(getHttpConnectionToken(name));
}
